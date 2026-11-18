// The "数据" tab: pick a dataset, drag its fields into 维度 / 指标, add filters, sort and limit.

import { useState } from "react";
import { Add24Regular, ArrowDown24Regular, ArrowUp24Regular, Dismiss24Regular, MoreHorizontal24Regular } from "@fluentui/react-icons";
import { DATASET_GROUPS, getDataset, getField, getModule } from "../data/datasets.js";
import { getRows } from "../data/dataStore.js";
import { AGGREGATIONS, distinctValues, GRANULARITIES, measureLabel, OPERATORS, TIME_PRESETS } from "../query/engine.js";
import { notify } from "../ui.jsx";
import { getWidgetType } from "../widgets/registry.js";

export const FIELD_MIME = "application/x-bi-field";
const TYPE_BADGE = { category: "Abc", datetime: "时间", number: "123", text: "文本" };

export function Section({ title, aside, children }) {
  return (
    <section className="bi-section">
      <header>
        <h4>{title}</h4>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function DatasetSelect({ value, onChange, placeholder = "请选择数据集" }) {
  return (
    <select className="bi-input" value={value ?? ""} onChange={(event) => onChange(event.target.value)} aria-label="数据集">
      <option value="" disabled>{placeholder}</option>
      {DATASET_GROUPS.map((group) => (
        <optgroup key={group.id} label={group.kind === "app" ? `应用 · ${group.label}` : group.label}>
          {group.datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}{group.kind === "app" ? "" : `（${getModule(dataset.module).label}）`}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------- filters

function defaultFilter(dataset, fieldKey) {
  const field = getField(dataset, fieldKey) ?? dataset.fields.find((entry) => entry.type === "category") ?? dataset.fields[0];
  if (field.type === "datetime") return { field: field.key, op: "range", value: "last30" };
  if (field.type === "number") return { field: field.key, op: "gte", value: "" };
  if (field.type === "text") return { field: field.key, op: "contains", value: "" };
  return { field: field.key, op: "in", value: [] };
}

function ValueChecklist({ dataset, field, value, onChange }) {
  const options = distinctValues(dataset, getRows(dataset.id), field.key);
  const selected = Array.isArray(value) ? value : [];
  if (!options.length) return <p className="bi-hint">这个字段还没有数据</p>;
  return (
    <div className="bi-checklist" role="group" aria-label={`${field.label}的取值`}>
      {options.map((option) => {
        const active = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            className={active ? "is-active" : ""}
            aria-pressed={active}
            onClick={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function FilterValue({ dataset, field, filter, onChange }) {
  if (filter.op === "empty" || filter.op === "notEmpty") return null;
  if (field.type === "datetime") {
    const custom = filter.value && typeof filter.value === "object";
    return (
      <>
        <select
          className="bi-input"
          value={custom ? "custom" : filter.value ?? ""}
          aria-label="时间范围"
          onChange={(event) => onChange(event.target.value === "custom" ? { start: "", end: "" } : event.target.value)}
        >
          {TIME_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>{preset.label}</option>
          ))}
          <option value="custom">自定义起止日期</option>
        </select>
        {custom ? (
          <div className="bi-inline">
            <input type="date" className="bi-input" aria-label="开始日期" value={filter.value.start ?? ""} onChange={(event) => onChange({ ...filter.value, start: event.target.value })} />
            <span>至</span>
            <input type="date" className="bi-input" aria-label="结束日期" value={filter.value.end ?? ""} onChange={(event) => onChange({ ...filter.value, end: event.target.value })} />
          </div>
        ) : null}
      </>
    );
  }
  if (field.type === "number") {
    if (filter.op === "between") {
      const [min, max] = Array.isArray(filter.value) ? filter.value : ["", ""];
      return (
        <div className="bi-inline">
          <input type="number" className="bi-input" aria-label="最小值" value={min ?? ""} onChange={(event) => onChange([event.target.value, max ?? ""])} />
          <span>至</span>
          <input type="number" className="bi-input" aria-label="最大值" value={max ?? ""} onChange={(event) => onChange([min ?? "", event.target.value])} />
        </div>
      );
    }
    return (
      <input
        type="number"
        className="bi-input"
        aria-label="比较值"
        placeholder={field.unit ? `数值（${field.unit}）` : "数值"}
        value={Array.isArray(filter.value) ? "" : filter.value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  if (field.type === "text") {
    return <input className="bi-input" aria-label="包含的文字" placeholder="包含的文字" value={filter.value ?? ""} onChange={(event) => onChange(event.target.value)} />;
  }
  return <ValueChecklist dataset={dataset} field={field} value={filter.value} onChange={onChange} />;
}

export function FilterList({ dataset, filters = [], onChange, addLabel = "添加筛选条件", emptyText }) {
  const update = (index, patch) => onChange(filters.map((filter, position) => (position === index ? { ...filter, ...patch } : filter)));
  return (
    <div className="bi-filters">
      {!filters.length && emptyText ? <p className="bi-hint">{emptyText}</p> : null}
      {filters.map((filter, index) => {
        const field = getField(dataset, filter.field);
        if (!field) {
          return (
            <div className="bi-filter-row is-broken" key={index}>
              <p className="bi-hint">字段「{filter.field}」不在当前数据集中</p>
              <button type="button" className="bi-chip__remove" aria-label="删除这个条件" onClick={() => onChange(filters.filter((_, position) => position !== index))}>
                <Dismiss24Regular />
              </button>
            </div>
          );
        }
        const operators = OPERATORS[field.type];
        return (
          <div className="bi-filter-row" key={index}>
            <div className="bi-inline">
              <select
                className="bi-input"
                value={field.key}
                aria-label="筛选字段"
                onChange={(event) => update(index, defaultFilter(dataset, event.target.value))}
              >
                {dataset.fields.map((entry) => (
                  <option key={entry.key} value={entry.key}>{entry.label}</option>
                ))}
              </select>
              {operators.length > 1 ? (
                <select className="bi-input bi-input--narrow" value={filter.op} aria-label="比较方式" onChange={(event) => update(index, { op: event.target.value, value: event.target.value === "between" ? ["", ""] : field.type === "category" ? [] : "" })}>
                  {operators.map((operator) => (
                    <option key={operator.id} value={operator.id}>{operator.label}</option>
                  ))}
                </select>
              ) : null}
              <button type="button" className="bi-chip__remove" aria-label="删除这个条件" title="删除这个条件" onClick={() => onChange(filters.filter((_, position) => position !== index))}>
                <Dismiss24Regular />
              </button>
            </div>
            <FilterValue dataset={dataset} field={field} filter={filter} onChange={(value) => update(index, { value })} />
          </div>
        );
      })}
      <button type="button" className="bi-add" onClick={() => onChange([...filters, defaultFilter(dataset)])}>
        <Add24Regular />
        {addLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- aggregate binding

function DropZone({ label, hint, count, max, onDropField, children }) {
  const [over, setOver] = useState(false);
  return (
    <div
      className={`bi-slot ${over ? "is-over" : ""}`}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(FIELD_MIME)) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        const key = event.dataTransfer.getData(FIELD_MIME);
        setOver(false);
        if (!key) return;
        event.preventDefault();
        onDropField(key);
      }}
    >
      <div className="bi-slot__label">
        <b>{label}</b>
        <small>{count} / {max}</small>
      </div>
      {children}
      {count < max ? <p className="bi-slot__hint">{hint ? `${hint}：` : ""}把字段拖到这里</p> : null}
    </div>
  );
}

function MeasureChip({ dataset, measure, onChange, onRemove }) {
  const [open, setOpen] = useState(Boolean(measure.where?.length));
  const field = getField(dataset, measure.field);
  const aggregations = !field ? [] : field.type === "number" ? AGGREGATIONS : AGGREGATIONS.filter((entry) => entry.id === "count" || entry.id === "distinct");
  return (
    <div className="bi-chip bi-chip--measure">
      <div className="bi-chip__row">
        <span className="bi-chip__name" title={measureLabel(measure, dataset)}>{measureLabel(measure, dataset)}</span>
        {field ? (
          <select className="bi-input bi-input--narrow" value={measure.agg} aria-label="汇总方式" onChange={(event) => onChange({ ...measure, agg: event.target.value })}>
            {aggregations.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.label}</option>
            ))}
          </select>
        ) : null}
        <button type="button" className={`bi-chip__more ${open ? "is-active" : ""}`} aria-label="名称与条件" title="名称与条件" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
          <MoreHorizontal24Regular />
        </button>
        <button type="button" className="bi-chip__remove" aria-label="移除指标" title="移除指标" onClick={onRemove}>
          <Dismiss24Regular />
        </button>
      </div>
      {open ? (
        <div className="bi-chip__detail">
          <label className="bi-field">
            <span className="bi-field__label">显示名称</span>
            <input className="bi-input" value={measure.label ?? ""} maxLength={20} placeholder={measureLabel({ ...measure, label: "" }, dataset)} onChange={(event) => onChange({ ...measure, label: event.target.value })} />
          </label>
          <div className="bi-field">
            <span className="bi-field__label">只统计满足条件的记录</span>
            <FilterList dataset={dataset} filters={measure.where ?? []} addLabel="添加条件" onChange={(where) => onChange({ ...measure, where })} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AggregateBinding({ widget, dataset, data, setData }) {
  const { slots } = getWidgetType(widget.type);
  const dims = data.dimensions ?? [];
  const measures = data.measures ?? [];
  const dimMax = slots.dimensions.max;
  const measureMax = slots.measures.max;

  const addDimension = (field) => {
    if (field.type !== "category" && field.type !== "datetime") {
      notify(`「${field.label}」是${field.type === "number" ? "数值" : "文本"}字段，不能作为维度，请放到指标里`, "error");
      return;
    }
    const entry = field.type === "datetime" ? { field: field.key, granularity: "day" } : { field: field.key };
    if (dims.length < dimMax) setData({ dimensions: [...dims, entry] });
    else if (dimMax === 1) setData({ dimensions: [entry] });
    else notify(`这个组件最多放 ${dimMax} 个维度，请先移除一个`, "error");
  };
  const addMeasure = (entry) => {
    if (measures.length < measureMax) setData({ measures: [...measures, entry] });
    else if (measureMax === 1) setData({ measures: [entry] });
    else notify(`这个组件最多放 ${measureMax} 个指标，请先移除一个`, "error");
  };
  const addField = (key, target) => {
    if (key === "*") {
      addMeasure({ field: "*", agg: "count" });
      return;
    }
    const field = getField(dataset, key);
    if (!field) return;
    const asDimension = target ? target === "dimension" : field.type === "category" || field.type === "datetime";
    if (asDimension && dimMax > 0) addDimension(field);
    else addMeasure({ field: field.key, agg: field.type === "number" ? "sum" : "count" });
  };

  const fieldButton = (key, label, type) => (
    <button
      key={key}
      type="button"
      className={`bi-fieldchip bi-fieldchip--${type}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(FIELD_MIME, key);
        event.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => addField(key)}
      title="拖到下方的维度或指标，或直接点击添加"
    >
      <i>{TYPE_BADGE[type]}</i>
      {label}
    </button>
  );

  const sort = data.sort ?? {};
  const sortValue = !sort.by || sort.by === "auto" ? "auto" : sort.by === "dimension" ? "dimension" : `measure:${sort.measureIndex ?? 0}`;
  return (
    <>
      <Section title="字段">
        <div className="bi-fieldlist">
          {fieldButton("*", "记录数", "number")}
          {dataset.fields.map((field) => fieldButton(field.key, field.label, field.type))}
        </div>
      </Section>
      <Section title="绑定">
        {dimMax > 0 ? (
          <DropZone label="维度" hint={slots.dimensions.hints?.[dims.length]} count={dims.length} max={dimMax} onDropField={(key) => addField(key, "dimension")}>
            {dims.map((dimension, index) => {
              const field = getField(dataset, dimension.field);
              return (
                <div className="bi-chip" key={`${dimension.field}:${index}`}>
                  <div className="bi-chip__row">
                    <span className="bi-chip__name">{field?.label ?? dimension.field}</span>
                    {field?.type === "datetime" ? (
                      <select
                        className="bi-input bi-input--narrow"
                        value={dimension.granularity ?? "day"}
                        aria-label="时间粒度"
                        onChange={(event) => setData({ dimensions: dims.map((entry, position) => (position === index ? { ...entry, granularity: event.target.value } : entry)) })}
                      >
                        {GRANULARITIES.map((entry) => (
                          <option key={entry.id} value={entry.id}>{entry.label}</option>
                        ))}
                      </select>
                    ) : null}
                    {dims.length > 1 && index === 0 ? (
                      <button type="button" className="bi-chip__more" aria-label="与第二个维度交换" title="与第二个维度交换" onClick={() => setData({ dimensions: [dims[1], dims[0]] })}>
                        <ArrowDown24Regular />
                      </button>
                    ) : null}
                    <button type="button" className="bi-chip__remove" aria-label="移除维度" title="移除维度" onClick={() => setData({ dimensions: dims.filter((_, position) => position !== index) })}>
                      <Dismiss24Regular />
                    </button>
                  </div>
                </div>
              );
            })}
          </DropZone>
        ) : null}
        <DropZone label="指标" hint={slots.measures.hints?.[measures.length]} count={measures.length} max={measureMax} onDropField={(key) => addField(key, "measure")}>
          {measures.map((measure, index) => (
            <MeasureChip
              key={`${measure.field}:${index}`}
              dataset={dataset}
              measure={measure}
              onChange={(next) => setData({ measures: measures.map((entry, position) => (position === index ? next : entry)) }, `measure:${widget.id}:${index}`)}
              onRemove={() => setData({ measures: measures.filter((_, position) => position !== index) })}
            />
          ))}
        </DropZone>
        {dims.length > 1 && measures.length > 1 ? (
          <p className="bi-hint">有两个维度时只使用第一个指标，第二个维度会拆分成多个系列。</p>
        ) : null}
      </Section>
      {dims.length ? (
        <Section title="排序与数量">
          <div className="bi-form-grid">
            <label className="bi-field">
              <span className="bi-field__label">排序依据</span>
              <select
                className="bi-input"
                value={sortValue}
                onChange={(event) => {
                  const next = event.target.value;
                  if (next === "auto") setData({ sort: undefined });
                  else if (next === "dimension") setData({ sort: { by: "dimension", order: sort.order ?? "asc" } });
                  else setData({ sort: { by: "measure", measureIndex: Number(next.split(":")[1]), order: sort.order ?? "desc" } });
                }}
              >
                <option value="auto">自动（时间按先后，其余按数值）</option>
                <option value="dimension">按「{getField(dataset, dims[0].field)?.label}」</option>
                {measures.map((measure, index) => (
                  <option key={index} value={`measure:${index}`}>按「{measureLabel(measure, dataset)}」</option>
                ))}
              </select>
            </label>
            <label className="bi-field">
              <span className="bi-field__label">顺序</span>
              <select className="bi-input" value={sort.order ?? ""} disabled={sortValue === "auto"} onChange={(event) => setData({ sort: { ...sort, order: event.target.value } })}>
                {sortValue === "auto" ? <option value="">自动</option> : null}
                <option value="asc">从小到大</option>
                <option value="desc">从大到小</option>
              </select>
            </label>
            <label className="bi-field">
              <span className="bi-field__label">最多显示几项</span>
              <input
                type="number"
                className="bi-input"
                min={0}
                max={200}
                placeholder="不限制"
                value={data.limit || ""}
                onChange={(event) => setData({ limit: Math.max(0, Number(event.target.value) || 0) }, `limit:${widget.id}`)}
              />
            </label>
          </div>
        </Section>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------- detail binding

function DetailBinding({ widget, dataset, data, setData }) {
  const columns = (data.columns ?? []).filter((key) => getField(dataset, key));
  const remaining = dataset.fields.filter((field) => !columns.includes(field.key));
  const move = (index, step) => {
    const next = [...columns];
    [next[index], next[index + step]] = [next[index + step], next[index]];
    setData({ columns: next });
  };
  return (
    <>
      {widget.type === "table" ? (
        <Section title="显示的列">
          <ol className="bi-columns">
            {columns.map((key, index) => (
              <li key={key}>
                <span>{getField(dataset, key).label}</span>
                <button type="button" className="bi-chip__more" aria-label="上移" title="上移" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp24Regular />
                </button>
                <button type="button" className="bi-chip__more" aria-label="下移" title="下移" disabled={index === columns.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown24Regular />
                </button>
                <button type="button" className="bi-chip__remove" aria-label="移除这一列" title="移除这一列" onClick={() => setData({ columns: columns.filter((entry) => entry !== key) })}>
                  <Dismiss24Regular />
                </button>
              </li>
            ))}
          </ol>
          {remaining.length ? (
            <select className="bi-input" value="" aria-label="添加一列" onChange={(event) => setData({ columns: [...columns, event.target.value] })}>
              <option value="" disabled>添加一列…</option>
              {remaining.map((field) => (
                <option key={field.key} value={field.key}>{field.label}</option>
              ))}
            </select>
          ) : null}
        </Section>
      ) : null}
      <Section title="排序与数量">
        <div className="bi-form-grid">
          <label className="bi-field">
            <span className="bi-field__label">排序字段</span>
            <select className="bi-input" value={data.sortField ?? dataset.timeField} onChange={(event) => setData({ sortField: event.target.value })}>
              {dataset.fields.map((field) => (
                <option key={field.key} value={field.key}>{field.label}</option>
              ))}
            </select>
          </label>
          <label className="bi-field">
            <span className="bi-field__label">顺序</span>
            <select className="bi-input" value={data.order ?? "desc"} onChange={(event) => setData({ order: event.target.value })}>
              <option value="desc">从新到旧 / 从大到小</option>
              <option value="asc">从旧到新 / 从小到大</option>
            </select>
          </label>
          <label className="bi-field">
            <span className="bi-field__label">最多显示几条</span>
            <input type="number" className="bi-input" min={1} max={200} value={data.limit ?? 30} onChange={(event) => setData({ limit: Math.min(200, Math.max(1, Number(event.target.value) || 1)) }, `limit:${widget.id}`)} />
          </label>
        </div>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------- panel

function tickerStyleFor(dataset) {
  const colored = dataset.fields.filter((field) => field.colors);
  const status = dataset.fields.find((field) => field.key.toLowerCase().includes("status")) ?? colored[1] ?? null;
  const tag = colored.find((field) => field !== status) ?? colored[0] ?? null;
  return {
    tagField: tag?.key ?? "",
    titleField: dataset.titleField,
    metaFields: ["department"].filter((key) => getField(dataset, key)),
    statusField: status?.key ?? "",
  };
}

export function DataPanel({ widget, editor, onPreviewDataset }) {
  const definition = getWidgetType(widget.type);
  const data = widget.data ?? {};
  const dataset = getDataset(data.datasetId);
  const setData = (patch, key) => editor.updateWidget(widget.id, (current) => ({ data: { ...current.data, ...patch } }), key);

  const changeDataset = (datasetId) => {
    const next = getDataset(datasetId);
    if (!next || next.id === data.datasetId) return;
    // Fields differ between datasets, so the old binding cannot be carried over.
    if (definition.binding === "detail") {
      editor.updateWidget(widget.id, (current) => ({
        data: { datasetId, columns: next.fields.slice(0, 5).map((field) => field.key), filters: [], sortField: next.timeField, order: "desc", limit: 30 },
        style: widget.type === "ticker" ? { ...current.style, ...tickerStyleFor(next) } : current.style,
      }));
      return;
    }
    editor.updateWidget(widget.id, (current) => ({
      data: { datasetId, dimensions: [], measures: [{ field: "*", agg: "count" }], filters: [] },
      interaction: { ...current.interaction, drill: [] },
    }));
  };

  return (
    <div className="bi-form">
      <Section title="数据集">
        <DatasetSelect value={data.datasetId} onChange={changeDataset} />
        {dataset ? (
          <p className="bi-hint">
            {dataset.app} · {getModule(dataset.module).label} · {getRows(dataset.id).length.toLocaleString("zh-CN")} 条记录
            <button type="button" className="bi-link" onClick={() => onPreviewDataset(dataset.id)}>查看数据</button>
          </p>
        ) : null}
      </Section>
      {dataset && definition.binding === "aggregate" ? <AggregateBinding widget={widget} dataset={dataset} data={data} setData={setData} /> : null}
      {dataset && definition.binding === "detail" ? <DetailBinding widget={widget} dataset={dataset} data={data} setData={setData} /> : null}
      {dataset ? (
        <Section title="筛选条件">
          <FilterList dataset={dataset} filters={data.filters ?? []} emptyText="没有筛选条件，统计全部记录。" onChange={(filters) => setData({ filters }, `filters:${widget.id}`)} />
          <label className="bi-check">
            <input type="checkbox" checked={Boolean(data.ignoreGlobal)} onChange={(event) => setData({ ignoreGlobal: event.target.checked })} />
            不受大屏上的筛选器影响
          </label>
        </Section>
      ) : null}
    </div>
  );
}
