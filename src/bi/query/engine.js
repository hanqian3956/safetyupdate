// Query engine: filter → group → aggregate → sort → limit over a dataset's rows.
// Everything a widget shows goes through runQuery() or runDetail().

import { getField } from "../data/datasets.js";

const pad = (value) => String(value).padStart(2, "0");
const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const EMPTY_LABEL = "未填写";

export const AGGREGATIONS = [
  { id: "count", label: "计数" },
  { id: "sum", label: "求和" },
  { id: "avg", label: "平均值" },
  { id: "max", label: "最大值" },
  { id: "min", label: "最小值" },
  { id: "distinct", label: "去重计数" },
];

export const GRANULARITIES = [
  { id: "day", label: "按日" },
  { id: "week", label: "按周" },
  { id: "month", label: "按月" },
  { id: "hour", label: "按时段" },
  { id: "weekday", label: "按星期" },
];

export const TIME_PRESETS = [
  { id: "today", label: "今天" },
  { id: "yesterday", label: "昨天" },
  { id: "last7", label: "近 7 天" },
  { id: "last30", label: "近 30 天" },
  { id: "last90", label: "近 90 天" },
  { id: "thisWeek", label: "本周" },
  { id: "thisMonth", label: "本月" },
  { id: "lastMonth", label: "上月" },
];

export const OPERATORS = {
  category: [
    { id: "in", label: "等于任一" },
    { id: "notIn", label: "不等于任一" },
    { id: "empty", label: "为空" },
    { id: "notEmpty", label: "不为空" },
  ],
  text: [
    { id: "contains", label: "包含" },
    { id: "empty", label: "为空" },
    { id: "notEmpty", label: "不为空" },
  ],
  number: [
    { id: "eq", label: "等于" },
    { id: "ne", label: "不等于" },
    { id: "gt", label: "大于" },
    { id: "gte", label: "大于等于" },
    { id: "lt", label: "小于" },
    { id: "lte", label: "小于等于" },
    { id: "between", label: "介于" },
    { id: "empty", label: "为空" },
    { id: "notEmpty", label: "不为空" },
  ],
  datetime: [{ id: "range", label: "时间范围" }],
};

export function startOfDay(ms) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addDays(ms, days) {
  const date = new Date(ms);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

function startOfWeek(ms) {
  const day0 = startOfDay(ms);
  const weekday = (new Date(day0).getDay() + 6) % 7;
  return addDays(day0, -weekday);
}

function startOfMonth(ms, monthOffset = 0) {
  const date = new Date(ms);
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1).getTime();
}

function parseDay(text) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(text ?? ""));
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime();
}

// Returns [start, end) in ms, or null when the value does not describe a range.
export function resolveTimeRange(value, now = Date.now()) {
  if (Array.isArray(value)) return value.length === 2 ? value : null;
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  if (typeof value === "string") {
    switch (value) {
      case "today":
        return [today, tomorrow];
      case "yesterday":
        return [addDays(today, -1), today];
      case "last7":
        return [addDays(today, -6), tomorrow];
      case "last30":
        return [addDays(today, -29), tomorrow];
      case "last90":
        return [addDays(today, -89), tomorrow];
      case "thisWeek":
        return [startOfWeek(now), tomorrow];
      case "thisMonth":
        return [startOfMonth(now), tomorrow];
      case "lastMonth":
        return [startOfMonth(now, -1), startOfMonth(now)];
      default:
        return null;
    }
  }
  if (value && typeof value === "object") {
    const start = parseDay(value.start);
    const end = parseDay(value.end);
    if (start === null && end === null) return null;
    return [start ?? -Infinity, end === null ? Infinity : addDays(end, 1)];
  }
  return null;
}

export function bucketOf(ms, granularity = "day") {
  const date = new Date(ms);
  switch (granularity) {
    case "month":
      return { key: `${date.getFullYear()}-${pad(date.getMonth() + 1)}`, label: `${date.getMonth() + 1}月` };
    case "week": {
      const monday = new Date(startOfWeek(ms));
      const key = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      return { key, label: `${pad(monday.getMonth() + 1)}-${pad(monday.getDate())} 周` };
    }
    case "hour":
      return { key: pad(date.getHours()), label: `${date.getHours()}时` };
    case "weekday": {
      const index = (date.getDay() + 6) % 7;
      return { key: String(index + 1), label: WEEKDAY_LABELS[index] };
    }
    default: {
      const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
      return { key, label: `${pad(date.getMonth() + 1)}-${pad(date.getDate())}` };
    }
  }
}

const isBlank = (value) => value === null || value === undefined || value === "";

function compileFilter(filter, dataset, now) {
  const field = getField(dataset, filter?.field);
  if (!field) return null;
  const { op, value } = filter;
  const key = field.key;
  if (op === "empty") return (row) => isBlank(row[key]);
  if (op === "notEmpty") return (row) => !isBlank(row[key]);

  if (field.type === "datetime") {
    if (op === "bucket") {
      if (!value?.key) return null;
      return (row) => !isBlank(row[key]) && bucketOf(row[key], value.granularity).key === value.key;
    }
    const range = resolveTimeRange(value, now);
    if (!range) return null;
    return (row) => !isBlank(row[key]) && row[key] >= range[0] && row[key] < range[1];
  }

  if (field.type === "number") {
    if (op === "between") {
      const [min, max] = Array.isArray(value) ? value : [];
      const low = isBlank(min) ? -Infinity : Number(min);
      const high = isBlank(max) ? Infinity : Number(max);
      if (low === -Infinity && high === Infinity) return null;
      return (row) => !isBlank(row[key]) && row[key] >= low && row[key] <= high;
    }
    if (op === "in" || op === "notIn") {
      const list = (Array.isArray(value) ? value : [value]).filter((item) => !isBlank(item)).map(Number);
      if (!list.length) return null;
      return op === "in" ? (row) => list.includes(row[key]) : (row) => !list.includes(row[key]);
    }
    if (isBlank(value) || Number.isNaN(Number(value))) return null;
    const target = Number(value);
    const compare = {
      eq: (current) => current === target,
      ne: (current) => current !== target,
      gt: (current) => current > target,
      gte: (current) => current >= target,
      lt: (current) => current < target,
      lte: (current) => current <= target,
    }[op];
    if (!compare) return null;
    return (row) => !isBlank(row[key]) && compare(row[key]);
  }

  if (op === "contains") {
    if (isBlank(value)) return null;
    return (row) => String(row[key] ?? "").includes(String(value));
  }
  const list = (Array.isArray(value) ? value : [value]).filter((item) => !isBlank(item)).map(String);
  if (!list.length) return null;
  const set = new Set(list);
  if (op === "notIn" || op === "ne") return (row) => !set.has(String(row[key] ?? ""));
  return (row) => set.has(String(row[key] ?? ""));
}

export function applyFilters(rows, filters, dataset, now = Date.now()) {
  const predicates = (filters ?? []).map((filter) => compileFilter(filter, dataset, now)).filter(Boolean);
  if (!predicates.length) return rows;
  return rows.filter((row) => predicates.every((predicate) => predicate(row)));
}

export function measureLabel(measure, dataset) {
  if (measure.label) return measure.label;
  const field = getField(dataset, measure.field);
  if (!field) return "记录数";
  switch (measure.agg) {
    case "count":
      return `${field.label}计数`;
    case "avg":
      return `平均${field.label}`;
    case "max":
      return `最大${field.label}`;
    case "min":
      return `最小${field.label}`;
    case "distinct":
      return `${field.label}去重数`;
    default:
      return field.label;
  }
}

function measureMeta(measure, dataset) {
  const field = getField(dataset, measure.field);
  const counting = !field || measure.agg === "count" || measure.agg === "distinct";
  const fieldDecimals = field?.decimals ?? 0;
  return {
    field: field?.key ?? "*",
    agg: field ? measure.agg ?? "sum" : "count",
    label: measureLabel(measure, dataset),
    unit: measure.unit ?? (counting ? "" : field.unit ?? ""),
    decimals: measure.decimals ?? (counting ? 0 : measure.agg === "avg" ? Math.max(1, fieldDecimals) : fieldDecimals),
    where: measure.where ?? [],
  };
}

function aggregate(rows, meta) {
  if (meta.field === "*") return rows.length;
  const key = meta.field;
  if (meta.agg === "count") {
    let count = 0;
    for (const row of rows) if (!isBlank(row[key])) count += 1;
    return count;
  }
  if (meta.agg === "distinct") {
    const seen = new Set();
    for (const row of rows) if (!isBlank(row[key])) seen.add(row[key]);
    return seen.size;
  }
  let sum = 0;
  let count = 0;
  let max = -Infinity;
  let min = Infinity;
  for (const row of rows) {
    const value = row[key];
    if (typeof value !== "number" || Number.isNaN(value)) continue;
    sum += value;
    count += 1;
    if (value > max) max = value;
    if (value < min) min = value;
  }
  if (meta.agg === "sum") return sum;
  if (!count) return null;
  if (meta.agg === "avg") return sum / count;
  if (meta.agg === "max") return max;
  if (meta.agg === "min") return min;
  return sum;
}

function dimensionValue(row, dim) {
  const value = row[dim.field];
  if (isBlank(value)) return { key: "", label: EMPTY_LABEL };
  if (dim.type === "datetime") return bucketOf(value, dim.granularity);
  return { key: String(value), label: String(value) };
}

function compareDimensionKeys(dim) {
  if (dim.type === "datetime") return (left, right) => (left < right ? -1 : left > right ? 1 : 0);
  if (dim.type === "number") return (left, right) => Number(left) - Number(right);
  const options = dim.options;
  if (options?.length) {
    const rank = new Map(options.map((option, index) => [option, index]));
    return (left, right) => (rank.get(left) ?? 999) - (rank.get(right) ?? 999) || left.localeCompare(right, "zh-Hans-CN");
  }
  return (left, right) => left.localeCompare(right, "zh-Hans-CN");
}

// Fills the holes in a time axis so a quiet day shows as zero instead of disappearing.
// The axis reaches back to the start of the filtered range but never runs past the last
// bucket that has data: a day nobody has reported on yet is "not known", not zero.
function completeTimeAxis(keys, dim, range) {
  if (dim.granularity === "hour") {
    return Array.from({ length: 24 }, (_, hour) => ({ key: pad(hour), label: `${hour}时` }));
  }
  if (dim.granularity === "weekday") {
    return WEEKDAY_LABELS.map((label, index) => ({ key: String(index + 1), label }));
  }
  if (!keys.length) return [];
  const sorted = [...keys].sort();
  const parseKey = (key) => (dim.granularity === "month" ? parseDay(`${key}-01`) : parseDay(key));
  let cursor = parseKey(sorted[0]);
  const last = parseKey(sorted[sorted.length - 1]);
  if (range && Number.isFinite(range[0])) cursor = Math.min(cursor, range[0]);
  const axis = [];
  const seen = new Set();
  let guard = 0;
  while (cursor <= last && guard < 800) {
    const bucket = bucketOf(cursor, dim.granularity);
    if (!seen.has(bucket.key)) {
      seen.add(bucket.key);
      axis.push(bucket);
    }
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return axis;
}

/**
 * spec: { dimensions: [{ field, granularity }], measures: [{ field, agg, label, where }],
 *         filters: [{ field, op, value }], sort: { by, measureIndex, order }, limit }
 * Returns categories (first dimension), series (second dimension or one per measure) and flat rows.
 */
export function runQuery(dataset, sourceRows, spec = {}, options = {}) {
  const now = options.now ?? Date.now();
  const allFilters = [...(spec.filters ?? []), ...(options.extraFilters ?? [])];
  const rows = applyFilters(sourceRows, allFilters, dataset, now);

  const dims = (spec.dimensions ?? [])
    .map((dimension) => {
      const field = getField(dataset, dimension.field);
      if (!field) return null;
      return {
        field: field.key,
        label: field.label,
        type: field.type,
        options: field.options,
        ordered: field.ordered,
        colors: field.colors,
        granularity: field.type === "datetime" ? dimension.granularity ?? "day" : undefined,
      };
    })
    .filter(Boolean)
    .slice(0, 2);
  const rawMeasures = spec.measures?.length ? spec.measures : [{ field: "*", agg: "count" }];
  const measures = rawMeasures.map((measure) => measureMeta(measure, dataset));
  const measureRows = measures.map((meta) => (meta.where.length ? applyFilters(rows, meta.where, dataset, now) : null));
  const valuesOf = (groupRows, subset) =>
    measures.map((meta, index) => {
      if (!measureRows[index]) return aggregate(groupRows, meta);
      return aggregate(subset ? groupRows.filter((row) => subset[index].has(row)) : groupRows, meta);
    });

  const result = { dims, measures, categories: [], series: [], rows: [], total: rows.length };

  if (!dims.length) {
    const values = measures.map((meta, index) => aggregate(measureRows[index] ?? rows, meta));
    result.rows = [{ keys: [], labels: [], values }];
    result.series = measures.map((meta, index) => ({ key: `m${index}`, name: meta.label, data: [values[index]], measureIndex: index }));
    return result;
  }

  const subset = measureRows.some(Boolean) ? measureRows.map((list) => (list ? new Set(list) : null)) : null;
  const groups = new Map();
  for (const row of rows) {
    const parts = dims.map((dim) => dimensionValue(row, dim));
    const id = parts.map((part) => part.key).join("\u0001");
    let group = groups.get(id);
    if (!group) {
      group = { keys: parts.map((part) => part.key), labels: parts.map((part) => part.label), rows: [] };
      groups.set(id, group);
    }
    group.rows.push(row);
  }
  let flat = [...groups.values()].map((group) => ({
    keys: group.keys,
    labels: group.labels,
    values: valuesOf(group.rows, subset),
  }));

  // First-dimension totals decide measure sorting and top-N when a second dimension splits the rows.
  const primary = new Map();
  for (const group of groups.values()) {
    const key = group.keys[0];
    let entry = primary.get(key);
    if (!entry) {
      entry = { key, label: group.labels[0], rows: [] };
      primary.set(key, entry);
    }
    for (const row of group.rows) entry.rows.push(row);
  }
  let categories = [...primary.values()].map((entry) => ({
    key: entry.key,
    label: entry.label,
    values: dims.length > 1 ? valuesOf(entry.rows, subset) : null,
  }));
  if (dims.length === 1) {
    const byKey = new Map(flat.map((row) => [row.keys[0], row.values]));
    categories.forEach((categoryEntry) => {
      categoryEntry.values = byKey.get(categoryEntry.key);
    });
  }

  const dim0 = dims[0];
  const sort = spec.sort ?? {};
  let sortBy = sort.by ?? "auto";
  if (sortBy === "auto") sortBy = dim0.type === "datetime" || dim0.ordered ? "dimension" : "measure";
  const direction = (sort.order ?? (sortBy === "measure" ? "desc" : "asc")) === "desc" ? -1 : 1;
  if (sortBy === "measure") {
    const index = Math.min(sort.measureIndex ?? 0, measures.length - 1);
    categories.sort((left, right) => ((left.values[index] ?? -Infinity) - (right.values[index] ?? -Infinity)) * direction);
  } else {
    const compare = compareDimensionKeys(dim0);
    categories.sort((left, right) => compare(left.key, right.key) * direction);
  }

  if (dim0.type === "datetime" && sortBy === "dimension") {
    // The axis starts where the tightest time-range filter starts. When the rows are pinned to
    // one bucket (a drill-down or a cross-filter), only that bucket's own span is shown.
    const onAxis = allFilters.filter((filter) => filter.field === dim0.field);
    const starts = onAxis
      .filter((filter) => filter.op === "range")
      .map((filter) => resolveTimeRange(filter.value, now)?.[0])
      .filter((start) => Number.isFinite(start));
    const pinned = onAxis.some((filter) => filter.op === "bucket");
    const range = !pinned && starts.length ? [Math.max(...starts), Infinity] : null;
    const axis = completeTimeAxis(categories.map((entry) => entry.key).filter(Boolean), dim0, range);
    if (axis.length) {
      const existing = new Map(categories.map((entry) => [entry.key, entry]));
      const empty = measures.map((meta) => (meta.agg === "count" || meta.agg === "sum" || meta.agg === "distinct" ? 0 : null));
      categories = axis.map((bucket) => existing.get(bucket.key) ?? { ...bucket, values: empty });
      if (direction === -1) categories.reverse();
    }
  }

  const limit = Number(spec.limit) > 0 ? Number(spec.limit) : 0;
  if (limit && categories.length > limit) {
    // A time axis keeps its most recent buckets; everything else keeps the head of the sort.
    categories = dim0.type === "datetime" && sortBy === "dimension" && direction === 1 ? categories.slice(-limit) : categories.slice(0, limit);
  }
  const position = new Map(categories.map((entry, index) => [entry.key, index]));
  flat = flat.filter((row) => position.has(row.keys[0]));

  if (dims.length === 1) {
    result.rows = categories.map((entry) => ({ keys: [entry.key], labels: [entry.label], values: entry.values }));
    result.series = measures.map((meta, index) => ({
      key: `m${index}`,
      name: meta.label,
      measureIndex: index,
      data: categories.map((entry) => entry.values[index]),
    }));
  } else {
    const dim1 = dims[1];
    const secondary = new Map();
    flat.forEach((row) => {
      const entry = secondary.get(row.keys[1]) ?? { key: row.keys[1], label: row.labels[1], total: 0 };
      entry.total += row.values[0] ?? 0;
      secondary.set(row.keys[1], entry);
    });
    const compare = compareDimensionKeys(dim1);
    const seriesKeys = [...secondary.values()].sort((left, right) =>
      dim1.type === "datetime" || dim1.options?.length ? compare(left.key, right.key) : right.total - left.total);
    const fill = measures[0].agg === "count" || measures[0].agg === "sum" || measures[0].agg === "distinct" ? 0 : null;
    result.series = seriesKeys.slice(0, 12).map((entry) => {
      const data = categories.map(() => fill);
      flat.forEach((row) => {
        if (row.keys[1] === entry.key) data[position.get(row.keys[0])] = row.values[0];
      });
      return { key: entry.key, name: entry.label, measureIndex: 0, data, color: dim1.colors?.[entry.key] };
    });
    flat.sort((left, right) => position.get(left.keys[0]) - position.get(right.keys[0]) || compare(left.keys[1], right.keys[1]));
    result.rows = flat;
  }
  result.categories = categories.map((entry) => ({ key: entry.key, label: entry.label, color: dim0.colors?.[entry.key] }));
  return result;
}

/** Raw records for tables and tickers: filtered, sorted and capped. */
export function runDetail(dataset, sourceRows, spec = {}, options = {}) {
  const now = options.now ?? Date.now();
  const rows = applyFilters(sourceRows, [...(spec.filters ?? []), ...(options.extraFilters ?? [])], dataset, now);
  const sortField = getField(dataset, spec.sortField) ?? getField(dataset, dataset.timeField);
  const direction = (spec.order ?? "desc") === "desc" ? -1 : 1;
  const key = sortField.key;
  const sorted = [...rows].sort((left, right) => {
    const a = left[key];
    const b = right[key];
    if (isBlank(a) && isBlank(b)) return 0;
    if (isBlank(a)) return 1;
    if (isBlank(b)) return -1;
    if (typeof a === "number" && typeof b === "number") return (a - b) * direction;
    return String(a).localeCompare(String(b), "zh-Hans-CN") * direction;
  });
  const limit = Number(spec.limit) > 0 ? Number(spec.limit) : 50;
  return { rows: sorted.slice(0, limit), total: rows.length };
}

export function distinctValues(dataset, sourceRows, fieldKey) {
  const field = getField(dataset, fieldKey);
  if (!field) return [];
  const present = new Set();
  for (const row of sourceRows) if (!isBlank(row[field.key])) present.add(String(row[field.key]));
  if (field.options?.length) {
    const listed = field.options.filter((option) => present.has(option));
    const extra = [...present].filter((value) => !field.options.includes(value));
    return [...listed, ...extra];
  }
  const values = [...present];
  return field.type === "number"
    ? values.sort((left, right) => Number(left) - Number(right))
    : values.sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
}
