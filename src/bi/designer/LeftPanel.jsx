import { useState, useSyncExternalStore } from "react";
import {
  BorderOutside24Regular,
  Clock24Regular,
  Cube24Regular,
  DataBarVertical24Regular,
  DataFunnel24Regular,
  DataLine24Regular,
  DataPie24Regular,
  DataUsage24Regular,
  Eye24Regular,
  EyeOff24Regular,
  Filter24Regular,
  Gauge24Regular,
  Image24Regular,
  LockClosed24Regular,
  LockOpen24Regular,
  Megaphone24Regular,
  NumberSymbol24Regular,
  Table24Regular,
  Target24Regular,
  TextHeader124Regular,
  TextT24Regular,
  Trophy24Regular,
} from "@fluentui/react-icons";
import { DATASET_GROUPS, getModule } from "../data/datasets.js";
import { getDataVersion, getRows, subscribeData } from "../data/dataStore.js";
import { WIDGET_GROUPS, WIDGET_ORDER, WIDGET_TYPES } from "../widgets/registry.js";
import { WIDGET_MIME } from "./CanvasEditor.jsx";

export const WIDGET_ICONS = {
  bar: DataBarVertical24Regular,
  line: DataLine24Regular,
  pie: DataPie24Regular,
  radar: Target24Regular,
  funnel: DataFunnel24Regular,
  gauge: Gauge24Regular,
  metric: NumberSymbol24Regular,
  progress: DataUsage24Regular,
  rank: Trophy24Regular,
  table: Table24Regular,
  ticker: Megaphone24Regular,
  space: Cube24Regular,
  title: TextHeader124Regular,
  text: TextT24Regular,
  clock: Clock24Regular,
  border: BorderOutside24Regular,
  image: Image24Regular,
  filter: Filter24Regular,
};

function Library({ onAdd }) {
  return (
    <div className="bi-library">
      {WIDGET_GROUPS.map((group) => (
        <section key={group.id}>
          <h3>{group.label}</h3>
          <div className="bi-library__grid">
            {WIDGET_ORDER.filter((type) => WIDGET_TYPES[type].group === group.id).map((type) => {
              const Icon = WIDGET_ICONS[type];
              return (
                <button
                  key={type}
                  type="button"
                  className="bi-library__item"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(WIDGET_MIME, type);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => onAdd(type)}
                  title={`拖到画布，或点击添加${WIDGET_TYPES[type].label}`}
                >
                  <Icon />
                  <span>{WIDGET_TYPES[type].label}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Layers({ editor }) {
  const { screen, selection } = editor;
  const [renaming, setRenaming] = useState(null);
  // Topmost widget first, the way layer lists usually read.
  const layers = [...screen.widgets].reverse();
  if (!layers.length) return <p className="bi-panel-empty">画布上还没有组件。</p>;
  return (
    <ul className="bi-layers">
      {layers.map((widget) => {
        const Icon = WIDGET_ICONS[widget.type];
        const selected = selection.includes(widget.id);
        return (
          <li key={widget.id} className={`${selected ? "is-selected" : ""} ${widget.hidden ? "is-hidden" : ""}`}>
            {renaming === widget.id ? (
              <div className="bi-layers__main">
                <Icon />
                <input
                  className="bi-input"
                  autoFocus
                  defaultValue={widget.name}
                  maxLength={30}
                  aria-label="组件名称"
                  onBlur={(event) => {
                    const name = event.target.value.trim();
                    if (name && name !== widget.name) editor.updateWidget(widget.id, { name });
                    setRenaming(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.target.blur();
                    if (event.key === "Escape") setRenaming(null);
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                className="bi-layers__main"
                onClick={(event) =>
                  editor.select(event.shiftKey ? (selected ? selection.filter((id) => id !== widget.id) : [...selection, widget.id]) : [widget.id])}
                onDoubleClick={() => setRenaming(widget.id)}
              >
                <Icon />
                <span title="双击重命名">{widget.name}</span>
              </button>
            )}
            <button
              type="button"
              className="bi-layers__toggle"
              aria-label={widget.locked ? "解锁" : "锁定"}
              title={widget.locked ? "解锁" : "锁定后不能在画布上选中和移动"}
              aria-pressed={widget.locked}
              onClick={() => editor.updateWidget(widget.id, { locked: !widget.locked })}
            >
              {widget.locked ? <LockClosed24Regular /> : <LockOpen24Regular />}
            </button>
            <button
              type="button"
              className="bi-layers__toggle"
              aria-label={widget.hidden ? "显示" : "隐藏"}
              title={widget.hidden ? "显示" : "隐藏"}
              aria-pressed={widget.hidden}
              onClick={() => editor.updateWidget(widget.id, { hidden: !widget.hidden })}
            >
              {widget.hidden ? <EyeOff24Regular /> : <Eye24Regular />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// 数据：这个大屏能用的全部数据，按「应用 › 工作表」列出；流程、任务、预警单列一组。
function Sources({ editor, onPreview }) {
  useSyncExternalStore(subscribeData, getDataVersion);
  const used = new Set(editor.screen.widgets.map((widget) => widget.data?.datasetId).filter(Boolean));
  return (
    <div className="bi-sources">
      {DATASET_GROUPS.map((group) => (
        <section key={group.id}>
          <h3>
            {group.kind === "app" ? <i>应用</i> : null}
            {group.label}
            {group.hint ? <small>{group.hint}</small> : null}
          </h3>
          {group.datasets.map((dataset) => (
            <button key={dataset.id} type="button" className="bi-sources__item" title="查看数据和字段" onClick={() => onPreview(dataset.id)}>
              <span className={`bi-sources__kind is-${dataset.module}`}>{getModule(dataset.module).label}</span>
              <span className="bi-sources__name">
                <b>{dataset.name}</b>
                <small>
                  {getRows(dataset.id).length.toLocaleString("zh-CN")} 条记录
                  {used.has(dataset.id) ? <u>本大屏已使用</u> : null}
                </small>
              </span>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}

const TABS = [
  ["library", "组件"],
  ["layers", "图层"],
  ["sources", "数据"],
];

export function LeftPanel({ editor, onAdd, onPreviewDataset }) {
  const [tab, setTab] = useState("library");
  return (
    <aside className="bi-side bi-side--left" aria-label="组件、图层与数据">
      <div className="bi-tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="bi-side__scroll">
        {tab === "library" ? <Library onAdd={onAdd} /> : null}
        {tab === "layers" ? <Layers editor={editor} /> : null}
        {tab === "sources" ? <Sources editor={editor} onPreview={onPreviewDataset} /> : null}
      </div>
    </aside>
  );
}
