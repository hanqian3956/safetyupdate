// How a click on one widget narrows the others down. Kept free of React so the rules can be
// read (and tested) on their own.
//
// A click selects one or more "levels" (field = value) on the clicked widget's dataset. What
// that means for another widget depends on how the two datasets relate:
//
//   same   same dataset                       → filter by the same field values
//   down   clicked a form, target is flows /  → keep the target rows that belong to the
//          tasks / alerts born from that form   selected form records
//   up     clicked flows / tasks / alerts that → keep the form records the selected rows
//          all come from the target form         came from
//   sibling both derived from the same form    → keep the target rows that share a form
//                                                record with the selected rows
//   field  anything else                       → filter by a field both datasets have
//                                                (部门 / 班次 / 地点 / 所属应用, or the time field)
//
// The three record-based modes are what make numbers reconcile: five hazard records selected
// means exactly the alerts, tasks and flows those five records produced.

import { DATASETS, getDataset, getField } from "../data/datasets.js";
import { getDataVersion, getRows } from "../data/dataStore.js";
import { applyFilters, OPERATORS, TIME_PRESETS } from "../query/engine.js";
import { formatDateTime } from "../query/format.js";

const SHARED_FIELDS = new Set(["department", "app", "shift", "location"]);
const EMPTY = [];
export const NO_LINK = { mode: "none", rows: null, filters: EMPTY, token: "" };

export function levelFilter(level, field = level.field) {
  if (level.type === "datetime") {
    return { field, op: "bucket", value: { granularity: level.granularity, key: level.key }, label: level.label };
  }
  return { field, op: "in", value: [level.key] };
}

const rowKey = (datasetId, row) => `${datasetId}:${row.id}`;
const sourceKey = (row) => (row.sourceDataset && row.sourceNo ? `${row.sourceDataset}:${row.sourceNo}` : null);

export function linkageToken(linkage) {
  return `${linkage.sourceId}|${linkage.datasetId}|${linkage.levels.map((level) => `${level.field}/${level.granularity ?? ""}=${level.key}`).join("&")}`;
}

// Everything derived from the rows is rebuilt when the data changes.
let cacheVersion = -1;
let cache = null;
function versionCache() {
  const current = getDataVersion();
  if (current !== cacheVersion || !cache) {
    cacheVersion = current;
    cache = { origins: new Map(), single: new Map(), linked: new Map(), children: null, byId: new Map() };
  }
  return cache;
}

/** The form datasets that a dataset's rows point back at. */
function originsOf(datasetId) {
  const store = versionCache().origins;
  let origins = store.get(datasetId);
  if (!origins) {
    origins = new Set();
    for (const row of getRows(datasetId)) if (row.sourceDataset) origins.add(row.sourceDataset);
    store.set(datasetId, origins);
  }
  return origins;
}

/** When every row a widget can show comes from one form, that form's dataset id; otherwise null. */
function singleOrigin(dataset, scopeFilters, now) {
  const key = `${dataset.id}|${JSON.stringify(scopeFilters ?? EMPTY)}`;
  const store = versionCache().single;
  if (store.has(key)) return store.get(key);
  let origin = null;
  for (const row of applyFilters(getRows(dataset.id), scopeFilters, dataset, now)) {
    if (!row.sourceDataset || (origin && origin !== row.sourceDataset)) {
      origin = null;
      break;
    }
    origin = row.sourceDataset;
  }
  store.set(key, origin);
  return origin;
}

export function linkMode(linkage, target, now = Date.now()) {
  const source = getDataset(linkage.datasetId);
  if (!source) return "none";
  if (source.id === target.id) return "same";
  if (source.module === "form") return originsOf(target.id).has(source.id) ? "down" : "field";
  const origin = singleOrigin(source, linkage.scopeFilters, now);
  if (origin && target.id === origin) return "up";
  if (origin && originsOf(target.id).has(origin)) return "sibling";
  return "field";
}

function linkedRows(linkage, mode, target) {
  const token = `${mode}|${linkageToken(linkage)}|${target.id}`;
  const store = versionCache().linked;
  if (store.has(token)) return store.get(token);
  const source = getDataset(linkage.datasetId);
  const picked = applyFilters(getRows(source.id), linkage.levels.map((level) => levelFilter(level)), source);
  const keys = new Set();
  picked.forEach((row) => {
    const key = mode === "down" ? rowKey(source.id, row) : sourceKey(row);
    if (key) keys.add(key);
  });
  const rows = getRows(target.id).filter(mode === "up" ? (row) => keys.has(rowKey(target.id, row)) : (row) => keys.has(sourceKey(row)));
  store.set(token, rows);
  return rows;
}

function sharedField(dataset, level) {
  if (level.type === "datetime") return level.isTimeField ? dataset.timeField : null;
  return SHARED_FIELDS.has(level.field) && getField(dataset, level.field) ? level.field : null;
}

/**
 * What the current selection means for one widget: either extra filters, or (for the
 * record-based modes) the subset of rows the widget should be computed from.
 */
export function resolveLink(widget, dataset, linkage, now = Date.now()) {
  if (!linkage || !linkage.levels.length || linkage.sourceId === widget.id || widget.interaction?.linkage === false) return NO_LINK;
  const mode = linkMode(linkage, dataset, now);
  const token = `${mode}|${linkageToken(linkage)}`;
  if (mode === "same") return { mode, rows: null, filters: linkage.levels.map((level) => levelFilter(level)), token };
  if (mode === "field") {
    const filters = linkage.levels
      .map((level) => {
        const field = sharedField(dataset, level);
        return field ? levelFilter(level, field) : null;
      })
      .filter(Boolean);
    return filters.length ? { mode, rows: null, filters, token } : NO_LINK;
  }
  if (mode === "none") return NO_LINK;
  return { mode, rows: linkedRows(linkage, mode, dataset), filters: EMPTY, token };
}

// ---------------------------------------------------------------- related records

function childIndex() {
  const store = versionCache();
  if (!store.children) {
    store.children = new Map();
    DATASETS.filter((dataset) => dataset.module !== "form").forEach((dataset) => {
      for (const row of getRows(dataset.id)) {
        const key = sourceKey(row);
        if (!key) continue;
        const list = store.children.get(key);
        if (list) list.push({ dataset, row });
        else store.children.set(key, [{ dataset, row }]);
      }
    });
  }
  return store.children;
}

function findRow(datasetId, id) {
  const store = versionCache().byId;
  let index = store.get(datasetId);
  if (!index) {
    index = new Map(getRows(datasetId).map((row) => [row.id, row]));
    store.set(datasetId, index);
  }
  return index.get(id) ?? null;
}

/** The form record a row came from (if any) and the flows / tasks / alerts that share it. */
export function relatedRecords(dataset, row) {
  const related = [];
  const key = sourceKey(row);
  if (key) {
    const origin = getDataset(row.sourceDataset);
    const source = origin ? findRow(origin.id, row.sourceNo) : null;
    if (source) related.push({ dataset: origin, row: source, relation: "来源记录" });
    (childIndex().get(key) ?? EMPTY).forEach((entry) => {
      if (entry.row !== row) related.push({ ...entry, relation: "同一记录产生" });
    });
  } else {
    (childIndex().get(rowKey(dataset.id, row)) ?? EMPTY).forEach((entry) => related.push({ ...entry, relation: "由本记录产生" }));
  }
  return related;
}

// ---------------------------------------------------------------- wording

const OPERATOR_TEXT = { gt: "＞", gte: "≥", lt: "＜", lte: "≤", eq: "＝", ne: "≠" };

/** One filter in words, for the "条件" line of the detail panel: "作业地点：南区 2# 采场". */
export function describeFilter(dataset, filter, now = Date.now()) {
  const field = getField(dataset, filter?.field);
  if (!field) return null;
  const { op, value } = filter;
  if (op === "empty") return `${field.label}为空`;
  if (op === "notEmpty") return `${field.label}不为空`;
  if (field.type === "datetime") {
    if (op === "bucket") return `${field.label}：${filter.label ?? value?.key ?? ""}`;
    if (typeof value === "string") {
      const preset = TIME_PRESETS.find((entry) => entry.id === value);
      return preset ? `${field.label}：${preset.label}` : null;
    }
    if (Array.isArray(value)) return `${field.label}：${formatDateTime(value[0], "date", now)} 至 ${formatDateTime(value[1] - 1, "date", now)}`;
    if (value && (value.start || value.end)) return `${field.label}：${value.start || "不限"} 至 ${value.end || "不限"}`;
    return null;
  }
  if (field.type === "number") {
    const unit = field.unit ?? "";
    if (op === "between") {
      const [min, max] = Array.isArray(value) ? value : [];
      if ((min ?? "") === "" && (max ?? "") === "") return null;
      return `${field.label}：${min === "" || min === undefined ? "不限" : min} 至 ${max === "" || max === undefined ? "不限" : max}${unit}`;
    }
    if (value === "" || value === null || value === undefined) return null;
    return `${field.label} ${OPERATOR_TEXT[op] ?? ""} ${value}${unit}`;
  }
  if (op === "contains") return value ? `${field.label}包含「${value}」` : null;
  const list = (Array.isArray(value) ? value : [value]).filter((item) => item !== "" && item !== null && item !== undefined);
  if (!list.length) return null;
  const operator = OPERATORS.category.find((entry) => entry.id === op);
  return op === "notIn" ? `${field.label}${operator?.label ?? "不等于"}：${list.join("、")}` : `${field.label}：${list.join("、")}`;
}

/** What a record-based link means in words, for the detail panel. */
export function describeLink(link, linkage) {
  if (!linkage || link.rows === null) return null;
  const source = getDataset(linkage.datasetId);
  const picked = linkage.levels.map((level) => `${level.fieldLabel}：${level.label}`).join("，");
  if (link.mode === "up") return `是所选《${source.name}》（${picked}）的来源记录`;
  if (link.mode === "sibling") return `与所选《${source.name}》（${picked}）出自同一条表单记录`;
  return `由所选《${source.name}》记录（${picked}）产生`;
}
