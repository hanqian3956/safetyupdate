// Right-hand panel of the designer: screen settings when nothing is selected, otherwise
// the selected widget's data / style / interaction settings.

import { useRef, useState } from "react";
import {
  Add24Regular,
  AlignBottom24Regular,
  AlignCenterHorizontal24Regular,
  AlignCenterVertical24Regular,
  AlignLeft24Regular,
  AlignRight24Regular,
  AlignSpaceEvenlyHorizontal24Regular,
  AlignSpaceEvenlyVertical24Regular,
  AlignTop24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { getDataset, getField } from "../data/datasets.js";
import { GRANULARITIES, TIME_PRESETS } from "../query/engine.js";
import { chartColors, SCREEN_SIZES, THEMES, getTheme } from "../screen/themes.js";
import { Button, IconButton, notify, NumberInput, Switch } from "../ui.jsx";
import { getWidgetType, resolveTone } from "../widgets/registry.js";
import { DataPanel, DatasetSelect, Section } from "./DataPanel.jsx";
import { alignedPositions, distributedPositions } from "./geometry.js";

const MAX_IMAGE_BYTES = 400 * 1024;

function ImageControl({ value, onChange }) {
  const inputRef = useRef(null);
  const pick = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      notify(`图片有 ${Math.round(file.size / 1024)} KB，超过 400 KB 上限，请压缩后再上传，或改填图片地址`, "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.onerror = () => notify("图片读取失败，请换一张再试", "error");
    reader.readAsDataURL(file);
  };
  const isUpload = typeof value === "string" && value.startsWith("data:");
  return (
    <div className="bi-imagecontrol">
      <input
        className="bi-input"
        placeholder="图片地址（https://…）"
        maxLength={2000}
        value={isUpload ? "" : value ?? ""}
        disabled={isUpload}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="bi-inline">
        <Button onClick={() => inputRef.current?.click()}>{isUpload ? "更换图片" : "上传图片"}</Button>
        {value ? <Button onClick={() => onChange("")}>移除</Button> : null}
        {isUpload ? <small className="bi-hint">已上传本地图片</small> : null}
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

const COLOR_SWATCHES = ["#3fc5d8", "#3b8eea", "#4fd39b", "#f5b547", "#f08c3a", "#ef6a5b", "#a78bfa", "#ffffff", "#8a97a6"];

// One colour: 默认 (the screen theme's own colour for this part), a few ready-made colours,
// or any colour through the browser's picker.
function ColorControl({ value, fallback, theme, onChange }) {
  const picked = typeof value === "string" && value.startsWith("#");
  const isDefault = !picked && (value ?? fallback) === fallback;
  const current = resolveTone(theme, value ?? fallback);
  return (
    <div className="bi-colorpick">
      <button type="button" className={isDefault ? "bi-colorpick__default is-active" : "bi-colorpick__default"} aria-pressed={isDefault} title="使用大屏主题里这个位置的默认颜色" onClick={() => onChange(fallback)}>
        默认
      </button>
      {COLOR_SWATCHES.map((color) => {
        const active = picked && value.toLowerCase() === color;
        return (
          <button key={color} type="button" className={active ? "bi-colorpick__swatch is-active" : "bi-colorpick__swatch"} style={{ background: color }} aria-label={`颜色 ${color}`} aria-pressed={active} title={color} onClick={() => onChange(color)} />
        );
      })}
      <label className="bi-colorpick__custom" title="自定义颜色">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(current) ? current : "#3fc5d8"} aria-label="自定义颜色" onChange={(event) => onChange(event.target.value)} />
        自定义
      </label>
    </div>
  );
}

// The colours a chart uses, in order. Each one opens the browser's colour picker.
function SeriesColorsControl({ value, widget, theme, onChange }) {
  const custom = Array.isArray(value) && value.length > 0;
  const colors = chartColors(theme, widget.style).slice(0, 8);
  return (
    <div className="bi-seriescolors">
      <div>
        {colors.map((color, index) => (
          <input
            key={index}
            type="color"
            className="bi-color"
            value={color}
            aria-label={`第 ${index + 1} 个颜色`}
            onChange={(event) => onChange(colors.map((entry, position) => (position === index ? event.target.value : entry)))}
          />
        ))}
      </div>
      <small className="bi-hint">
        {custom ? "已自定义" : "默认颜色，随大屏主题变化"}
        {custom ? <button type="button" className="bi-link" onClick={() => onChange([])}>恢复默认</button> : null}
      </small>
    </div>
  );
}

function ChipChoice({ options, value, onChange, label }) {
  const selected = Array.isArray(value) ? value : [];
  return (
    <div className="bi-checklist" role="group" aria-label={label}>
      {options.map(([id, text]) => {
        const active = selected.includes(id);
        return (
          <button key={id} type="button" className={active ? "is-active" : ""} aria-pressed={active} onClick={() => onChange(active ? selected.filter((item) => item !== id) : [...selected, id])}>
            {text}
          </button>
        );
      })}
    </div>
  );
}

function StyleControl({ item, widget, theme, onChange }) {
  const value = widget.style[item.key];
  const dataset = getDataset(item.datasetKey ? widget.style[item.datasetKey] : widget.data?.datasetId);
  const fields = (dataset?.fields ?? []).filter((field) => !item.fieldTypes || item.fieldTypes.includes(field.type));
  switch (item.control) {
    case "text":
      return <input className="bi-input" value={value ?? ""} maxLength={60} placeholder={item.placeholder} onChange={(event) => onChange(event.target.value)} />;
    case "textarea":
      return <textarea className="bi-input bi-input--area" rows={4} maxLength={2000} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />;
    case "number":
      return <NumberInput value={value ?? 0} min={item.min} max={item.max} step={item.step ?? 1} onChange={onChange} />;
    case "switch":
      return <Switch checked={Boolean(value)} onChange={onChange} />;
    case "select":
      return (
        <select
          className="bi-input"
          value={String(value ?? "")}
          onChange={(event) => onChange(item.options.find(([id]) => String(id) === event.target.value)?.[0] ?? event.target.value)}
        >
          {item.options.map(([id, label]) => (
            <option key={id} value={String(id)}>{label}</option>
          ))}
        </select>
      );
    case "frame":
      return <Switch checked={(value ?? "card") !== "none"} onChange={(on) => onChange(on ? "card" : "none")} />;
    case "colors":
      return <SeriesColorsControl value={value} widget={widget} theme={theme} onChange={onChange} />;
    case "color":
      return <ColorControl value={value} fallback={getWidgetType(widget.type).style[item.key]} theme={theme} onChange={onChange} />;
    case "image":
      return <ImageControl value={value} onChange={onChange} />;
    case "dataset":
      return <DatasetSelect value={value} onChange={onChange} />;
    case "field":
      return (
        <select className="bi-input" value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
          {item.allowEmpty || !value ? <option value="">{item.allowEmpty ? "不显示" : dataset ? "请选择字段" : "请先选择数据集"}</option> : null}
          {fields.map((field) => (
            <option key={field.key} value={field.key}>{field.label}</option>
          ))}
        </select>
      );
    case "fields":
      return <ChipChoice label={item.label} options={fields.map((field) => [field.key, field.label])} value={value} onChange={onChange} />;
    case "timePresets":
      return <ChipChoice label={item.label} options={TIME_PRESETS.map((preset) => [preset.id, preset.label])} value={value} onChange={(next) => onChange(TIME_PRESETS.map((preset) => preset.id).filter((id) => next.includes(id)))} />;
    case "timePreset": {
      const available = TIME_PRESETS.filter((preset) => (widget.style.options ?? []).includes(preset.id));
      return (
        <select className="bi-input" value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
          <option value="">不限时间</option>
          {available.map((preset) => (
            <option key={preset.id} value={preset.id}>{preset.label}</option>
          ))}
        </select>
      );
    }
    default:
      return null;
  }
}

function PositionBlock({ widget, editor }) {
  const set = (key) => (value) => editor.updateWidget(widget.id, { [key]: Math.round(value) }, `box:${widget.id}:${key}`);
  const align = (mode) => {
    const position = alignedPositions([widget], mode, editor.screen).get(widget.id);
    editor.updateWidget(widget.id, position);
  };
  return (
    <Section title="位置与尺寸">
      <div className="bi-box-grid">
        <label><span>X</span><NumberInput value={widget.x} onChange={set("x")} /></label>
        <label><span>Y</span><NumberInput value={widget.y} onChange={set("y")} /></label>
        <label><span>宽</span><NumberInput value={widget.w} min={20} onChange={set("w")} /></label>
        <label><span>高</span><NumberInput value={widget.h} min={20} onChange={set("h")} /></label>
      </div>
      <AlignButtons label="对齐到画布" onAlign={align} />
    </Section>
  );
}

function AlignButtons({ label, onAlign, onDistribute, canDistribute }) {
  return (
    <div className="bi-align" role="group" aria-label={label}>
      <span>{label}</span>
      <div>
        <IconButton label="左对齐" onClick={() => onAlign("left")}><AlignLeft24Regular /></IconButton>
        <IconButton label="水平居中" onClick={() => onAlign("hcenter")}><AlignCenterHorizontal24Regular /></IconButton>
        <IconButton label="右对齐" onClick={() => onAlign("right")}><AlignRight24Regular /></IconButton>
        <IconButton label="顶部对齐" onClick={() => onAlign("top")}><AlignTop24Regular /></IconButton>
        <IconButton label="垂直居中" onClick={() => onAlign("vcenter")}><AlignCenterVertical24Regular /></IconButton>
        <IconButton label="底部对齐" onClick={() => onAlign("bottom")}><AlignBottom24Regular /></IconButton>
        {onDistribute ? (
          <>
            <IconButton label="水平等间距（至少 3 个）" disabled={!canDistribute} onClick={() => onDistribute("x")}><AlignSpaceEvenlyHorizontal24Regular /></IconButton>
            <IconButton label="垂直等间距（至少 3 个）" disabled={!canDistribute} onClick={() => onDistribute("y")}><AlignSpaceEvenlyVertical24Regular /></IconButton>
          </>
        ) : null}
      </div>
    </div>
  );
}

function StylePanel({ widget, editor }) {
  const definition = getWidgetType(widget.type);
  const theme = getTheme(editor.screen.theme);
  const sections = [];
  definition.schema.forEach((item) => {
    if (item.when && !item.when(widget.style)) return;
    const section = sections.find((entry) => entry.title === item.section) ?? sections[sections.push({ title: item.section, items: [] }) - 1];
    section.items.push(item);
  });
  return (
    <div className="bi-form">
      <PositionBlock widget={widget} editor={editor} />
      {sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.items.map((item) => (
            <div key={item.key} className={item.control === "switch" || item.control === "frame" ? "bi-field bi-field--inline" : "bi-field"}>
              <span className="bi-field__label">{item.label}</span>
              <StyleControl
                item={item}
                widget={widget}
                theme={theme}
                onChange={(value) => {
                  const patch = { [item.key]: value };
                  // A filter's field belongs to its dataset, and its name follows what it filters.
                  if (widget.type === "filter" && item.key === "datasetId") patch.field = "";
                  if (widget.type === "filter" && item.key === "kind") patch.label = "";
                  editor.updateStyle(widget.id, patch, `style:${widget.id}:${item.key}`);
                }}
              />
              {item.hint ? <small className="bi-field__hint">{item.hint}</small> : null}
            </div>
          ))}
        </Section>
      ))}
    </div>
  );
}

function InteractionPanel({ widget, editor }) {
  const dataset = getDataset(widget.data?.datasetId);
  const interaction = widget.interaction ?? {};
  const drill = interaction.drill ?? [];
  const setInteraction = (patch) => editor.updateWidget(widget.id, (current) => ({ interaction: { ...current.interaction, ...patch } }));
  if (!dataset) return <p className="bi-panel-empty">先在「数据」里选择数据集。</p>;
  const base = getField(dataset, widget.data?.dimensions?.[0]?.field);
  const candidates = dataset.fields.filter((field) => field.type === "category" || field.type === "datetime");
  const used = new Set([base?.key, ...drill.map((level) => level.field)]);
  // Suggest a category the chart is not already using; time and 所属应用 are rarely what people drill into.
  const unused = candidates.filter((field) => !used.has(field.key));
  const nextField = unused.find((field) => field.type === "category" && !field.system) ?? unused[0] ?? candidates[0];
  return (
    <div className="bi-form">
      <Section title="联动">
        <div className="bi-field bi-field--inline">
          <span className="bi-field__label">参与联动</span>
          <Switch checked={interaction.linkage !== false} onChange={(linkage) => setInteraction({ linkage })} />
        </div>
        <p className="bi-hint">
          预览或发布后，点击这个组件里的某一项，整个大屏会只显示与这一项相关的数据，大屏顶部同时给出对应的记录数和「查看明细」。再点一次取消。
        </p>
        <p className="bi-hint">
          其它组件怎么跟着变：用同一份数据的，按相同字段筛选；流程、任务、预警类的，只留下由所选表单记录产生的那些；没有关联的，按部门、班次、地点等共有字段筛选。关闭后，这个组件既不触发联动，也不受其它组件影响。
        </p>
      </Section>
      <Section title="下钻">
        {base ? (
          <ol className="bi-drill-levels">
            <li>
              <span>第 1 层</span>
              <b>{base.label}</b>
            </li>
            {drill.map((level, index) => {
              const field = getField(dataset, level.field);
              const update = (patch) => setInteraction({ drill: drill.map((entry, position) => (position === index ? { ...entry, ...patch } : entry)) });
              return (
                <li key={index}>
                  <span>第 {index + 2} 层</span>
                  <select
                    className="bi-input"
                    value={level.field}
                    aria-label={`第 ${index + 2} 层字段`}
                    onChange={(event) => {
                      const next = getField(dataset, event.target.value);
                      update(next.type === "datetime" ? { field: next.key, granularity: "day" } : { field: next.key, granularity: undefined });
                    }}
                  >
                    {candidates.map((entry) => (
                      <option key={entry.key} value={entry.key}>{entry.label}</option>
                    ))}
                  </select>
                  {field?.type === "datetime" ? (
                    <select className="bi-input bi-input--narrow" value={level.granularity ?? "day"} aria-label="时间粒度" onChange={(event) => update({ granularity: event.target.value })}>
                      {GRANULARITIES.map((entry) => (
                        <option key={entry.id} value={entry.id}>{entry.label}</option>
                      ))}
                    </select>
                  ) : null}
                  <button type="button" className="bi-chip__remove" aria-label="移除这一层" title="移除这一层" onClick={() => setInteraction({ drill: drill.filter((_, position) => position !== index) })}>
                    <Dismiss24Regular />
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="bi-hint">先在「数据」里放一个维度，才能设置下钻。</p>
        )}
        {base && nextField ? (
          <button
            type="button"
            className="bi-add"
            onClick={() => setInteraction({ drill: [...drill, nextField.type === "datetime" ? { field: nextField.key, granularity: "day" } : { field: nextField.key }] })}
          >
            <Add24Regular />
            添加下钻层级
          </button>
        ) : null}
        <p className="bi-hint">
          设置后，点击某一项会进入下一层（如 部门 → 提交人），其它组件同时按所点的这一项联动。标题右侧显示下钻路径，点路径可以返回上一层。任何一层都能通过「查看明细」看到对应的原始记录。
        </p>
      </Section>
    </div>
  );
}

function ScreenSettings({ editor }) {
  const { screen } = editor;
  const preset = SCREEN_SIZES.find((size) => size.width === screen.width && size.height === screen.height);
  return (
    <div className="bi-form">
      <Section title="大屏信息">
        <label className="bi-field">
          <span className="bi-field__label">名称</span>
          <input className="bi-input" value={screen.name} maxLength={30} onChange={(event) => editor.updateScreen({ name: event.target.value }, "screen:name")} />
        </label>
        <label className="bi-field">
          <span className="bi-field__label">说明</span>
          <input className="bi-input" value={screen.description ?? ""} maxLength={60} placeholder="显示在大屏卡片上" onChange={(event) => editor.updateScreen({ description: event.target.value }, "screen:description")} />
        </label>
      </Section>
      <Section title="画布尺寸">
        <select
          className="bi-input"
          value={preset?.id ?? "custom"}
          aria-label="画布尺寸"
          onChange={(event) => {
            const size = SCREEN_SIZES.find((entry) => entry.id === event.target.value);
            if (size) editor.updateScreen({ width: size.width, height: size.height });
          }}
        >
          {SCREEN_SIZES.map((size) => (
            <option key={size.id} value={size.id}>{size.label}</option>
          ))}
          <option value="custom">自定义</option>
        </select>
        <div className="bi-box-grid">
          <label><span>宽</span><NumberInput value={screen.width} min={320} max={7680} onChange={(width) => editor.updateScreen({ width }, "screen:width")} /></label>
          <label><span>高</span><NumberInput value={screen.height} min={240} max={4320} onChange={(height) => editor.updateScreen({ height }, "screen:height")} /></label>
        </div>
      </Section>
      <Section title="主题">
        <div className="bi-themes" role="radiogroup" aria-label="主题">
          {Object.values(THEMES).map((theme) => (
            <button key={theme.id} type="button" role="radio" aria-checked={screen.theme === theme.id} className={screen.theme === theme.id ? "is-active" : ""} onClick={() => editor.updateScreen({ theme: theme.id })}>
              <span style={{ background: theme.stageColor }}>
                <i style={{ background: theme.accent }} />
                <i style={{ background: theme.accent2 }} />
                <i style={{ background: theme.text }} />
              </span>
              <b>{theme.name}</b>
              <small>{theme.hint}</small>
            </button>
          ))}
        </div>
      </Section>
      <Section title="背景">
        <div className="bi-field bi-field--inline">
          <span className="bi-field__label">自定义背景色</span>
          <div className="bi-inline">
            {screen.backgroundColor ? (
              <input type="color" className="bi-color" value={screen.backgroundColor} aria-label="背景色" onChange={(event) => editor.updateScreen({ backgroundColor: event.target.value }, "screen:bg")} />
            ) : null}
            <Switch checked={Boolean(screen.backgroundColor)} onChange={(on) => editor.updateScreen({ backgroundColor: on ? getTheme(screen.theme).stageColor : "" })} />
          </div>
        </div>
        <div className="bi-field">
          <span className="bi-field__label">背景图</span>
          <ImageControl value={screen.backgroundImage} onChange={(backgroundImage) => editor.updateScreen({ backgroundImage }, "screen:bgimage")} />
        </div>
      </Section>
      <Section title="数据与交互">
        <label className="bi-field">
          <span className="bi-field__label">数据刷新频率</span>
          <select className="bi-input" value={String(screen.refreshInterval || 10)} onChange={(event) => editor.updateScreen({ refreshInterval: Number(event.target.value) })}>
            <option value="5">每 5 秒</option>
            <option value="10">每 10 秒</option>
            <option value="30">每 30 秒</option>
            <option value="60">每 60 秒</option>
          </select>
          <small className="bi-field__hint">大屏按这个间隔重新取数，新提交的数据会自动出现在大屏上。</small>
        </label>
        <div className="bi-field bi-field--inline">
          <span className="bi-field__label">允许图表联动</span>
          <Switch checked={screen.linkage !== false} onChange={(linkage) => editor.updateScreen({ linkage })} />
        </div>
        <p className="bi-hint">关闭后，点击图表不会影响其它组件；下钻和每个组件上的「明细」不受影响。</p>
      </Section>
    </div>
  );
}

function MultiPanel({ widgets, editor }) {
  const movable = widgets.filter((widget) => !widget.locked);
  const place = (positions) => editor.updateWidgets(movable.map((widget) => widget.id), (widget) => ({ ...widget, ...(positions.get(widget.id) ?? {}) }));
  return (
    <div className="bi-form">
      <Section title={`已选中 ${widgets.length} 个组件`}>
        <AlignButtons
          label="相互对齐"
          onAlign={(mode) => place(alignedPositions(movable, mode, editor.screen))}
          onDistribute={(axis) => place(distributedPositions(movable, axis))}
          canDistribute={movable.length >= 3}
        />
        <div className="bi-inline bi-inline--wrap">
          <Button onClick={() => editor.duplicateWidgets(widgets)}>复制</Button>
          <Button onClick={() => editor.updateWidgets(widgets.map((widget) => widget.id), (widget) => ({ ...widget, locked: true }))}>锁定</Button>
          <Button variant="danger" onClick={() => editor.removeWidgets(widgets.map((widget) => widget.id))}>删除</Button>
        </div>
      </Section>
    </div>
  );
}

export function RightPanel({ editor, onPreviewDataset }) {
  const { screen, selection } = editor;
  const selected = screen.widgets.filter((widget) => selection.includes(widget.id));
  const [tab, setTab] = useState("data");

  if (!selected.length) {
    return (
      <aside className="bi-side bi-side--right" aria-label="大屏设置">
        <div className="bi-side__title">大屏设置</div>
        <div className="bi-side__scroll"><ScreenSettings editor={editor} /></div>
      </aside>
    );
  }
  if (selected.length > 1) {
    return (
      <aside className="bi-side bi-side--right" aria-label="多选设置">
        <div className="bi-side__title">多个组件</div>
        <div className="bi-side__scroll"><MultiPanel widgets={selected} editor={editor} /></div>
      </aside>
    );
  }

  const widget = selected[0];
  const definition = getWidgetType(widget.type);
  const tabs = [
    definition.binding !== "none" ? ["data", "数据"] : null,
    ["style", "样式"],
    definition.clickable ? ["interaction", "交互"] : null,
  ].filter(Boolean);
  const activeTab = tabs.some(([id]) => id === tab) ? tab : tabs[0][0];
  return (
    <aside className="bi-side bi-side--right" aria-label={`${definition.label}设置`}>
      <div className="bi-side__title">
        {definition.label}
        <small>{widget.name !== definition.label ? widget.name : ""}</small>
      </div>
      <div className="bi-tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} className={activeTab === id ? "is-active" : ""} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="bi-side__scroll">
        {activeTab === "data" ? <DataPanel key={widget.id} widget={widget} editor={editor} onPreviewDataset={onPreviewDataset} /> : null}
        {activeTab === "style" ? <StylePanel key={widget.id} widget={widget} editor={editor} /> : null}
        {activeTab === "interaction" ? <InteractionPanel key={widget.id} widget={widget} editor={editor} /> : null}
      </div>
    </aside>
  );
}
