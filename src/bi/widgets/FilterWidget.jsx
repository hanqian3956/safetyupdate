import { useEffect, useMemo, useRef, useState } from "react";
import { APPS, DEPARTMENTS, getDataset, getField } from "../data/datasets.js";
import { getRows } from "../data/dataStore.js";
import { distinctValues, TIME_PRESETS } from "../query/engine.js";
import { defaultFilterValue, useRuntime } from "../runtime/runtime.jsx";

function optionsFor(style) {
  if (style.kind === "department") return DEPARTMENTS;
  if (style.kind === "app") return APPS;
  if (style.kind === "field") {
    const dataset = getDataset(style.datasetId);
    if (!dataset || !getField(dataset, style.field)) return [];
    return distinctValues(dataset, getRows(dataset.id), style.field);
  }
  return [];
}

export function filterLabel(style) {
  if (style.label) return style.label;
  if (style.kind === "department") return "部门";
  if (style.kind === "app") return "所属应用";
  if (style.kind === "field") {
    return getField(getDataset(style.datasetId), style.field)?.label ?? "字段";
  }
  return "时间范围";
}

export function FilterWidget({ widget }) {
  const runtime = useRuntime();
  const { style } = widget;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const active = runtime.globalFilters.find((entry) => entry.id === widget.id);
  const value = active ? active.value : defaultFilterValue(widget);
  const options = useMemo(() => optionsFor(style), [style, runtime.dataKey]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  if (style.kind === "time") {
    const presets = (style.options?.length ? style.options : ["last7", "last30", "last90"])
      .map((id) => TIME_PRESETS.find((preset) => preset.id === id))
      .filter(Boolean);
    return (
      <div className="bi-filter bi-filter--segment">
        <span className="bi-filter__label">{filterLabel(style)}</span>
        <div className="bi-filter__segments" role="group" aria-label={filterLabel(style)}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={value === preset.id ? "is-active" : ""}
              aria-pressed={value === preset.id}
              onClick={() => runtime.setFilterValue(widget.id, preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selected = Array.isArray(value) ? value : [];
  const summary = !selected.length ? "全部" : selected.length <= 2 ? selected.join("、") : `已选 ${selected.length} 项`;
  const toggle = (option) => {
    const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
    runtime.setFilterValue(widget.id, next);
  };
  const unconfigured = style.kind === "field" && !options.length;
  return (
    <div className="bi-filter bi-filter--select" ref={rootRef}>
      <span className="bi-filter__label">{filterLabel(style)}</span>
      <button type="button" className="bi-filter__trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span>{unconfigured ? "请先选择数据集和字段" : summary}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      {open && !unconfigured ? (
        <div className="bi-filter__menu" role="listbox" aria-multiselectable="true">
          <button type="button" className="bi-filter__clear" onClick={() => runtime.setFilterValue(widget.id, [])} disabled={!selected.length}>
            清除选择
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={selected.includes(option)}
              className={selected.includes(option) ? "is-selected" : ""}
              onClick={() => toggle(option)}
            >
              <i aria-hidden="true" />
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
