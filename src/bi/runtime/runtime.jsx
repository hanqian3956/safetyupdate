// Runtime state shared by every widget on a screen: when data was last refreshed, the
// values of the on-screen filters, what the user has clicked (which narrows every other
// widget down, see linkage.js), how far each chart has been drilled, and the record list
// that is currently open.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getDataset, getField } from "../data/datasets.js";
import { getDataVersion, getRows } from "../data/dataStore.js";
import { runDetail, runQuery } from "../query/engine.js";
import { getTheme } from "../screen/themes.js";
import { describeFilter, describeLink, levelFilter, linkageToken, resolveLink } from "./linkage.js";

const RuntimeContext = createContext(null);
const EMPTY = [];
const DETAIL_LIMIT = 300;

// Fields that mean the same thing in every dataset, so an on-screen filter on one applies to all.
const SHARED_FIELDS = new Set(["department", "app", "shift", "location"]);

export function useRuntime() {
  return useContext(RuntimeContext);
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Boolean(value.start || value.end);
  return value !== null && value !== undefined && value !== "";
}

export function defaultFilterValue(widget) {
  return widget.style.kind === "time" ? widget.style.defaultValue ?? "" : [];
}

/** The on-screen filter widgets, as filters on one dataset. */
function globalFiltersFor(widget, dataset, runtime) {
  const filters = [];
  if (widget.data?.ignoreGlobal) return filters;
  runtime.globalFilters.forEach((entry) => {
    if (!hasValue(entry.value)) return;
    if (entry.kind === "time") {
      filters.push({ field: dataset.timeField, op: "range", value: entry.value });
    } else if (entry.kind === "department" || entry.kind === "app") {
      if (getField(dataset, entry.kind)) filters.push({ field: entry.kind, op: "in", value: entry.value });
    } else if (entry.kind === "field" && entry.field && getField(dataset, entry.field)) {
      if (dataset.id === entry.datasetId || SHARED_FIELDS.has(entry.field)) {
        filters.push({ field: entry.field, op: "in", value: entry.value });
      }
    }
  });
  return filters;
}

/**
 * Everything that narrows a widget beyond its own configuration: the on-screen filters, the
 * current selection (as filters, or as a subset of rows) and the widget's own drill path.
 */
function scopeOf(widget, dataset, runtime) {
  const link = resolveLink(widget, dataset, runtime.linkage, runtime.now);
  const drill = (runtime.drill[widget.id] ?? EMPTY).map((level) => levelFilter(level));
  return { link, filters: [...globalFiltersFor(widget, dataset, runtime), ...link.filters, ...drill] };
}

function drilledSpec(widget, stack) {
  const spec = widget.data;
  if (!stack.length) return spec;
  const next = widget.interaction?.drill?.[stack.length - 1];
  if (!next) return spec;
  return { ...spec, dimensions: [next, ...(spec.dimensions ?? []).slice(1)] };
}

/** Aggregated result for a widget. `override` tweaks the spec (e.g. drop the dimensions). */
export function useAggregate(widget, override, enabled = true) {
  const runtime = useRuntime();
  const dataset = getDataset(widget.data?.datasetId);
  const stack = runtime.drill[widget.id] ?? EMPTY;
  const scope = dataset && enabled ? scopeOf(widget, dataset, runtime) : null;
  const scopeKey = scope ? `${JSON.stringify(scope.filters)}|${scope.link.token}` : "";
  const overrideKey = override ? JSON.stringify(override) : "";
  return useMemo(() => {
    if (!scope) return null;
    const spec = { ...drilledSpec(widget, stack), ...(override ?? {}) };
    const rows = scope.link.rows ?? getRows(dataset.id);
    const result = runQuery(dataset, rows, spec, { extraFilters: scope.filters, now: runtime.now });
    return { dataset, spec, rows, extraFilters: scope.filters, result };
    // scope / override are compared by value through their keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, enabled, widget.data, widget.interaction, stack, scopeKey, overrideKey, runtime.dataKey]);
}

/** Raw records for tables and tickers. */
export function useDetail(widget) {
  const runtime = useRuntime();
  const dataset = getDataset(widget.data?.datasetId);
  const scope = dataset ? scopeOf(widget, dataset, runtime) : null;
  const scopeKey = scope ? `${JSON.stringify(scope.filters)}|${scope.link.token}` : "";
  return useMemo(() => {
    if (!scope) return null;
    const detail = runDetail(dataset, scope.link.rows ?? getRows(dataset.id), widget.data, { extraFilters: scope.filters, now: runtime.now });
    return { dataset, ...detail };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, widget.data, scopeKey, runtime.dataKey]);
}

/** A click on a category: go one level deeper if the chart has more levels, otherwise select it. */
export function useCategoryClick(widget, query) {
  const runtime = useRuntime();
  return useCallback(
    (entry) => {
      if (!runtime.interactive || !query || !entry) return;
      const dim = query.result.dims[0];
      if (!dim || entry.key === "") return;
      runtime.pick(widget, query.dataset, {
        field: dim.field,
        fieldLabel: dim.label,
        type: dim.type,
        granularity: dim.granularity,
        isTimeField: dim.field === query.dataset.timeField,
        key: entry.key,
        label: entry.label,
      });
    },
    [runtime, widget, query],
  );
}

function conditionsOf(dataset, filters, now) {
  return filters.map((filter) => describeFilter(dataset, filter, now)).filter(Boolean);
}

function buildDetail({ title, dataset, rows, filters, note, now }) {
  const result = runDetail(dataset, rows, { filters, sortField: dataset.timeField, order: "desc", limit: DETAIL_LIMIT }, { now });
  const conditions = conditionsOf(dataset, filters, now);
  if (note) conditions.push(note);
  return { title, dataset, rows: result.rows, total: result.total, conditions, at: now };
}

/** The records behind what a widget currently shows. */
export function widgetDetail(widget, runtime) {
  const dataset = getDataset(widget.data?.datasetId);
  if (!dataset) return null;
  const scope = scopeOf(widget, dataset, runtime);
  return buildDetail({
    title: widget.style?.title || widget.name,
    dataset,
    rows: scope.link.rows ?? getRows(dataset.id),
    filters: [...(widget.data.filters ?? EMPTY), ...scope.filters],
    note: describeLink(scope.link, runtime.linkage),
    now: runtime.now,
  });
}

/** The records behind the current selection, i.e. behind the bar / slice / row that was clicked. */
export function selectionDetail(runtime, screen) {
  const { linkage } = runtime;
  const widget = linkage ? screen.widgets.find((entry) => entry.id === linkage.sourceId) : null;
  const dataset = getDataset(linkage?.datasetId);
  if (!widget || !dataset) return null;
  return buildDetail({
    title: linkage.sourceName,
    dataset,
    rows: getRows(dataset.id),
    filters: [...(widget.data?.filters ?? EMPTY), ...globalFiltersFor(widget, dataset, runtime), ...linkage.levels.map((level) => levelFilter(level))],
    now: runtime.now,
  });
}

function makeLinkage(widget, dataset, stack, leaf) {
  const levels = leaf ? [...stack, leaf] : stack;
  if (!levels.length) return null;
  const linkage = {
    sourceId: widget.id,
    sourceName: widget.style?.title || widget.name,
    datasetId: dataset.id,
    scopeFilters: widget.data?.filters ?? EMPTY,
    levels,
    leaf: leaf ?? null,
  };
  linkage.token = linkageToken(linkage);
  return linkage;
}

export function ScreenRuntime({ screen, mode = "view", children }) {
  const interactive = mode !== "design";
  const theme = getTheme(screen.theme);
  const [filterValues, setFilterValues] = useState({});
  const [linkage, setLinkage] = useState(null);
  const [drill, setDrill] = useState({});
  const [detail, setDetail] = useState(null);
  const [refresh, setRefresh] = useState(() => ({ at: Date.now(), version: getDataVersion(), count: 0 }));

  const refreshNow = useCallback(() => {
    setRefresh((previous) => ({ at: Date.now(), version: getDataVersion(), count: previous.count + 1 }));
  }, []);

  // The designer polls every 5 seconds so new submissions show up while editing; a published
  // screen follows its own refresh interval.
  const seconds = mode === "design" ? 5 : Number(screen.refreshInterval) || 10;
  useEffect(() => {
    const timer = window.setInterval(refreshNow, seconds * 1000);
    return () => window.clearInterval(timer);
  }, [seconds, refreshNow]);

  // Filter widgets are described by value so dragging things around does not re-run queries.
  const filterSignature = JSON.stringify(
    screen.widgets
      .filter((widget) => widget.type === "filter" && !widget.hidden)
      .map((widget) => ({
        id: widget.id,
        kind: widget.style.kind,
        datasetId: widget.style.datasetId,
        field: widget.style.field,
        value: interactive && filterValues[widget.id] !== undefined ? filterValues[widget.id] : defaultFilterValue(widget),
      })),
  );
  const globalFilters = useMemo(() => JSON.parse(filterSignature), [filterSignature]);

  const linkageEnabled = screen.linkage !== false;
  const setFilterValue = useCallback((id, value) => {
    setFilterValues((previous) => ({ ...previous, [id]: value }));
  }, []);

  // One click does up to two things: it takes the clicked chart one level deeper (when it has
  // more drill levels), and it becomes the selection every other widget follows.
  const pick = useCallback(
    (widget, dataset, level) => {
      const path = widget.interaction?.drill ?? EMPTY;
      const stack = drill[widget.id] ?? EMPTY;
      const linkable = linkageEnabled && widget.interaction?.linkage !== false;
      if (stack.length < path.length) {
        const deeper = [...stack, level];
        setDrill((previous) => ({ ...previous, [widget.id]: deeper }));
        if (linkable) setLinkage(makeLinkage(widget, dataset, deeper, null));
        return;
      }
      if (!linkable) return;
      setLinkage((previous) => {
        const same = previous?.sourceId === widget.id && previous.leaf?.field === level.field && previous.leaf.key === level.key;
        return makeLinkage(widget, dataset, stack, same ? null : level);
      });
    },
    [drill, linkageEnabled],
  );
  const drillTo = useCallback(
    (widget, depth) => {
      const stack = (drill[widget.id] ?? EMPTY).slice(0, depth);
      setDrill((previous) => ({ ...previous, [widget.id]: stack }));
      setLinkage((previous) => (previous?.sourceId === widget.id ? makeLinkage(widget, getDataset(previous.datasetId), stack, null) : previous));
    },
    [drill],
  );
  // Clearing the selection also takes the chart that made it back to its top level.
  const clearLinkage = useCallback(() => {
    if (linkage) setDrill((stacks) => ({ ...stacks, [linkage.sourceId]: [] }));
    setLinkage(null);
  }, [linkage]);
  const resetInteractions = useCallback(() => {
    setFilterValues({});
    setLinkage(null);
    setDrill({});
    setDetail(null);
  }, []);

  const dataKey = `${refresh.version}:${Math.floor(refresh.at / 60000)}`;
  const value = useMemo(
    () => ({
      mode,
      interactive,
      theme,
      now: refresh.at,
      refreshedAt: refresh.at,
      refreshCount: refresh.count,
      dataKey,
      globalFilters,
      linkage: interactive ? linkage : null,
      linkageEnabled,
      drill: interactive ? drill : {},
      detail: interactive ? detail : null,
      refreshNow,
      setFilterValue,
      pick,
      drillTo,
      clearLinkage,
      openDetail: setDetail,
      closeDetail: () => setDetail(null),
      resetInteractions,
    }),
    // refresh.at is represented by dataKey / refresh.count; listing it would re-render every second.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, interactive, theme, dataKey, refresh.count, globalFilters, linkage, drill, detail, linkageEnabled, refreshNow, setFilterValue, pick, drillTo, clearLinkage, resetInteractions],
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}
