// Widgets that are plain DOM rather than ECharts: numbers, lists, text and decoration.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getField } from "../data/datasets.js";
import { resolveTimeRange, runQuery } from "../query/engine.js";
import { formatCell, formatDateTime, formatNumber, formatPercent } from "../query/format.js";
import { useAggregate, useCategoryClick, useDetail, useRuntime } from "../runtime/runtime.jsx";

const NO_DIMENSIONS = { dimensions: [] };
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const pad = (value) => String(value).padStart(2, "0");
const SPACE_THEME_BACKGROUNDS = { sketch: "#eef3f8", dark: "#060c18", blueprint: "#0d3a6e" };

function savedSpaceTheme() {
  try {
    return JSON.parse(window.localStorage.getItem("mine-space-layout-v2") || "null")?.canvas?.theme || "sketch";
  } catch {
    return "sketch";
  }
}

export function toneVar(tone) {
  if (typeof tone === "string" && tone.startsWith("#")) return tone;
  return {
    accent: "var(--bi-accent)",
    accent2: "var(--bi-accent-2)",
    text: "var(--bi-text)",
    muted: "var(--bi-muted)",
    good: "var(--bi-good)",
    bad: "var(--bi-bad)",
  }[tone] ?? "var(--bi-accent)";
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function AnimatedNumber({ value, decimals, compact, animate }) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    if (typeof value !== "number" || !animate || prefersReducedMotion()) {
      fromRef.current = value;
      setShown(value);
      return undefined;
    }
    const from = typeof fromRef.current === "number" ? fromRef.current : 0;
    if (from === value) {
      setShown(value);
      return undefined;
    }
    const startedAt = performance.now();
    let frame = 0;
    const step = (time) => {
      const progress = Math.min(1, (time - startedAt) / 700);
      const eased = 1 - (1 - progress) ** 3;
      setShown(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      fromRef.current = value;
    };
  }, [value, animate]);
  return formatNumber(shown, { decimals, compact });
}

export function Unbound({ text = "请在右侧「数据」里选择数据集" }) {
  return <div className="bi-empty">{text}</div>;
}

function Sparkline({ values }) {
  const points = values.map((value) => value ?? 0);
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const span = max - min || 1;
  const coords = points.map((value, index) => [
    (index / (points.length - 1)) * 100,
    28 - ((value - min) / span) * 24,
  ]);
  const line = coords.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  return (
    <svg className="bi-metric__spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${line} L100,30 L0,30 Z`} className="bi-metric__spark-area" />
      <path d={line} className="bi-metric__spark-line" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function MetricWidget({ widget }) {
  const runtime = useRuntime();
  const { style } = widget;
  const total = useAggregate(widget, NO_DIMENSIONS);
  const wantTrend = Boolean(style.sparkline && widget.data?.dimensions?.length);
  const trend = useAggregate(widget, undefined, wantTrend);

  // Compares against the same stretch of the previous period, e.g. Monday–Wednesday of this
  // week against Monday–Wednesday of last week, so a half-finished day does not look like a drop.
  const change = useMemo(() => {
    if (!style.compare || !total) return null;
    const { dataset, spec, rows, extraFilters, result } = total;
    const filters = [...(spec.filters ?? []), ...extraFilters];
    const isTimeRange = (filter) => filter.field === dataset.timeField && filter.op === "range";
    const ranges = filters.filter(isTimeRange).map((filter) => resolveTimeRange(filter.value, runtime.now)).filter(Boolean);
    if (!ranges.length) return null;
    const start = Math.max(...ranges.map((entry) => entry[0]));
    const end = Math.min(...ranges.map((entry) => entry[1]));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    const span = end - start;
    const elapsed = Math.min(end, runtime.now) - start;
    if (elapsed <= 0) return null;
    const previous = runQuery(
      dataset,
      rows,
      {
        ...spec,
        filters: [
          ...filters.filter((filter) => !isTimeRange(filter)),
          { field: dataset.timeField, op: "range", value: [start - span, start - span + elapsed] },
        ],
      },
      { now: runtime.now },
    );
    const before = previous.rows[0]?.values[0];
    const current = result.rows[0]?.values[0];
    if (!before || current === null || current === undefined) return null;
    return (current - before) / before;
  }, [style.compare, total, runtime.now]);

  if (!total) return <Unbound />;
  const meta = total.result.measures[0];
  const value = total.result.rows[0]?.values[0];
  const unit = style.unit || meta.unit;
  return (
    <div className={`bi-metric bi-metric--${style.align ?? "left"}`}>
      <div className="bi-metric__value" style={{ fontSize: `${style.valueSize ?? 52}px`, color: toneVar(style.valueColor) }}>
        {value === null || value === undefined ? (
          "—"
        ) : (
          <AnimatedNumber value={value} decimals={meta.decimals} compact={style.compact} animate={runtime.interactive} />
        )}
        {unit ? <small>{unit}</small> : null}
      </div>
      {change !== null ? (
        <div className="bi-metric__change">
          较上期
          <b>{Math.abs(change) < 0.0005 ? "持平" : `${change > 0 ? "▲" : "▼"} ${formatPercent(Math.abs(change))}`}</b>
        </div>
      ) : null}
      {trend ? <Sparkline values={trend.result.series[0]?.data ?? []} /> : null}
    </div>
  );
}

export function ProgressWidget({ widget }) {
  const { style } = widget;
  const query = useAggregate(widget, NO_DIMENSIONS);
  if (!query) return <Unbound />;
  const [part, whole] = query.result.rows[0]?.values ?? [];
  const [partMeta, wholeMeta] = query.result.measures;
  const ratio = whole ? Math.max(0, (part ?? 0) / whole) : null;
  const shown = Math.min(1, ratio ?? 0);
  const color = toneVar(style.color);
  const detail =
    style.showDetail && wholeMeta ? (
      <p className="bi-progress__detail">
        {partMeta.label} <b>{formatNumber(part, { decimals: partMeta.decimals, compact: true })}</b>
        <i>/</i>
        {wholeMeta.label} <b>{formatNumber(whole, { decimals: wholeMeta.decimals, compact: true })}</b>
      </p>
    ) : null;

  if (style.shape === "bar") {
    return (
      <div className="bi-progress bi-progress--bar">
        <strong style={{ color }}>{formatPercent(ratio, style.decimals ?? 1)}</strong>
        <div className="bi-progress__track">
          <span style={{ width: `${shown * 100}%`, background: color }} />
        </div>
        {detail}
      </div>
    );
  }
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="bi-progress bi-progress--ring">
      <div className="bi-progress__ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} className="bi-progress__rail" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="bi-progress__arc"
            style={{ stroke: color, strokeDasharray: `${circumference * shown} ${circumference}` }}
          />
        </svg>
        <strong>{formatPercent(ratio, style.decimals ?? 1)}</strong>
      </div>
      {detail}
    </div>
  );
}

export function RankWidget({ widget }) {
  const runtime = useRuntime();
  const { style } = widget;
  const query = useAggregate(widget);
  const onPick = useCategoryClick(widget, query);
  if (!query) return <Unbound />;
  const { result } = query;
  if (!result.dims.length) return <Unbound text="排行榜需要一个维度" />;
  if (!result.rows.length) return <Unbound text="当前条件下没有数据" />;
  const meta = result.measures[0];
  const peak = Math.max(...result.rows.map((row) => row.values[0] ?? 0), 1);
  const selected = runtime.linkage?.sourceId === widget.id ? runtime.linkage.leaf?.key ?? null : null;
  const clickable = runtime.interactive;
  return (
    <ol className="bi-rank" style={{ "--bi-rank-color": toneVar(style.color) }}>
      {result.rows.map((row, index) => {
        const value = row.values[0];
        const classes = [
          index < (style.highlightTop ?? 3) ? "is-top" : "",
          selected !== null && selected !== row.keys[0] ? "is-faded" : "",
          clickable ? "is-clickable" : "",
        ].join(" ");
        return (
          <li
            key={row.keys[0]}
            className={classes}
            onClick={clickable ? () => onPick({ key: row.keys[0], label: row.labels[0] }) : undefined}
          >
            <i>{index + 1}</i>
            <span title={row.labels[0]}>{row.labels[0]}</span>
            {style.showBar ? (
              <em>
                <u style={{ width: `${Math.max(2, ((value ?? 0) / peak) * 100)}%` }} />
              </em>
            ) : null}
            <b>
              {formatNumber(value, { decimals: meta.decimals, compact: true })}
              {meta.unit ? <small>{meta.unit}</small> : null}
            </b>
          </li>
        );
      })}
    </ol>
  );
}

// Scrolls its children upward in a loop when they do not fit; stays still when they do.
function Marquee({ active, count, secondsPerItem = 2.2, children }) {
  const viewportRef = useRef(null);
  const firstSetRef = useRef(null);
  const [overflowing, setOverflowing] = useState(false);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const firstSet = firstSetRef.current;
    if (!viewport || !firstSet) return undefined;
    const measure = () => setOverflowing(firstSet.offsetHeight > viewport.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(firstSet);
    return () => observer.disconnect();
  }, [count]);
  const scrolling = active && overflowing;
  return (
    <div className="bi-marquee" ref={viewportRef}>
      <div
        className={scrolling ? "bi-marquee__track is-scrolling" : "bi-marquee__track"}
        style={scrolling ? { animationDuration: `${Math.max(10, count * secondsPerItem)}s` } : undefined}
      >
        <div className="bi-marquee__set" ref={firstSetRef}>{children}</div>
        {scrolling ? <div className="bi-marquee__set" aria-hidden="true">{children}</div> : null}
      </div>
    </div>
  );
}

function Tag({ field, value }) {
  const color = field?.colors?.[value];
  if (!color) return <>{value}</>;
  return <i className="bi-tag" style={{ "--bi-tag": color }}>{value}</i>;
}

const COLUMN_WEIGHT = { datetime: 1.25, number: 0.7, text: 1.1, category: 1 };

export function TableWidget({ widget }) {
  const runtime = useRuntime();
  const { style } = widget;
  const detail = useDetail(widget);
  if (!detail) return <Unbound />;
  const { dataset, rows } = detail;
  const columns = (widget.data.columns?.length ? widget.data.columns : dataset.fields.slice(0, 6).map((field) => field.key))
    .map((key) => getField(dataset, key))
    .filter(Boolean);
  if (!columns.length) return <Unbound text="请在右侧选择要显示的列" />;
  const template = [
    style.showIndex ? "44px" : null,
    ...columns.map((field) => `minmax(0, ${field.key === dataset.titleField ? 1.7 : COLUMN_WEIGHT[field.type] ?? 1}fr)`),
  ].filter(Boolean).join(" ");
  const rowStyle = { gridTemplateColumns: template, minHeight: `${style.rowHeight ?? 38}px` };
  return (
    <div className={style.stripe ? "bi-table is-striped" : "bi-table"}>
      {style.showHeader !== false ? (
        <div className="bi-table__head" style={{ gridTemplateColumns: template }}>
          {style.showIndex ? <span>#</span> : null}
          {columns.map((field) => (
            <span key={field.key} className={field.type === "number" ? "is-number" : ""}>{field.label}</span>
          ))}
        </div>
      ) : null}
      {rows.length ? (
        <Marquee active={runtime.interactive && style.autoScroll} count={rows.length}>
          {rows.map((row, index) => (
            <div className="bi-table__row" key={row.id} style={rowStyle}>
              {style.showIndex ? <span className="bi-table__index">{index + 1}</span> : null}
              {columns.map((field) => (
                <span key={field.key} className={field.type === "number" ? "is-number" : ""} title={field.type === "category" || field.type === "text" ? String(row[field.key] ?? "") : undefined}>
                  {field.colors ? <Tag field={field} value={row[field.key]} /> : formatCell(row[field.key], field, runtime.now)}
                </span>
              ))}
            </div>
          ))}
        </Marquee>
      ) : (
        <Unbound text="当前条件下没有数据" />
      )}
    </div>
  );
}

export function TickerWidget({ widget }) {
  const runtime = useRuntime();
  const { style } = widget;
  const detail = useDetail(widget);
  if (!detail) return <Unbound />;
  const { dataset, rows } = detail;
  if (!rows.length) return <Unbound text="当前条件下没有数据" />;
  const tagField = getField(dataset, style.tagField);
  const titleField = getField(dataset, style.titleField) ?? getField(dataset, dataset.titleField);
  const statusField = getField(dataset, style.statusField);
  const metaFields = (style.metaFields ?? []).map((key) => getField(dataset, key)).filter(Boolean);
  return (
    <Marquee active={runtime.interactive && style.autoScroll} count={rows.length} secondsPerItem={3}>
      {rows.map((row) => {
        const tagColor = tagField?.colors?.[row[tagField.key]] ?? "var(--bi-accent-2)";
        return (
          <article className="bi-ticker__item" key={row.id} style={{ "--bi-tag": tagColor }}>
            {tagField ? <i className="bi-ticker__tag">{row[tagField.key] ?? "—"}</i> : null}
            <div>
              <b title={String(row[titleField.key] ?? "")}>{formatCell(row[titleField.key], titleField, runtime.now)}</b>
              <p>
                {metaFields.map((field) => formatCell(row[field.key], field, runtime.now)).join(" · ")}
              </p>
            </div>
            <aside>
              <time>{formatDateTime(row[dataset.timeField], "smart-short", runtime.now)}</time>
              {statusField ? (
                <span style={{ color: statusField.colors?.[row[statusField.key]] ?? "var(--bi-muted)" }}>
                  {row[statusField.key] ?? ""}
                </span>
              ) : null}
            </aside>
          </article>
        );
      })}
    </Marquee>
  );
}

export function TitleWidget({ widget }) {
  const { style } = widget;
  return (
    <div className={`bi-title bi-title--${style.decoration ?? "strata"} bi-title--${style.align ?? "center"}`}>
      <span className="bi-title__deco" aria-hidden="true" />
      <div>
        <h1 style={{ fontSize: `${style.fontSize ?? 38}px`, letterSpacing: `${style.letterSpacing ?? 0}px`, color: toneVar(style.color ?? "text") }}>
          {style.text || "大屏标题"}
        </h1>
        {style.subtitle ? <p>{style.subtitle}</p> : null}
      </div>
      <span className="bi-title__deco bi-title__deco--end" aria-hidden="true" />
    </div>
  );
}

export function TextWidget({ widget }) {
  const { style } = widget;
  return (
    <p
      className="bi-text"
      style={{
        fontSize: `${style.fontSize ?? 16}px`,
        fontWeight: style.weight ?? 400,
        textAlign: style.align ?? "left",
        lineHeight: style.lineHeight ?? 1.6,
        color: toneVar(style.color ?? "muted"),
      }}
    >
      {style.text}
    </p>
  );
}

export function ClockWidget({ widget }) {
  const { style } = widget;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return (
    <div className="bi-clock" style={{ fontSize: `${style.fontSize ?? 22}px`, justifyContent: { left: "flex-start", center: "center", right: "flex-end" }[style.align ?? "right"], color: toneVar(style.color ?? "muted") }}>
      {style.format !== "time" ? <span>{date}</span> : null}
      {style.format === "full" ? <span>{WEEKDAYS[now.getDay()]}</span> : null}
      {style.format !== "date" ? <b>{time}</b> : null}
    </div>
  );
}

export function BorderWidget({ widget }) {
  const { style } = widget;
  return (
    <div className={`bi-border bi-border--${style.variant ?? "shaft"}`}>
      {style.title ? <span className="bi-border__title">{style.title}</span> : null}
    </div>
  );
}

export function ImageWidget({ widget }) {
  const runtime = useRuntime();
  const { style } = widget;
  if (!style.src) {
    return runtime.interactive ? null : <div className="bi-image bi-image--empty">在右侧上传图片或填写图片地址</div>;
  }
  return (
    <img
      className="bi-image"
      src={style.src}
      alt=""
      draggable={false}
      style={{ objectFit: style.fit ?? "cover", borderRadius: `${style.radius ?? 0}px`, opacity: style.opacity ?? 1 }}
    />
  );
}

export function SpaceWidget({ widget }) {
  const { style } = widget;
  const frameRef = useRef(null);
  const [theme, setTheme] = useState(savedSpaceTheme);
  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.data?.source !== "mine-space" || event.data?.type !== "theme") return;
      setTheme(event.data.theme || "sketch");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return (
    <div className="bi-space-widget" style={{ "--bi-space-preview-bg": SPACE_THEME_BACKGROUNDS[theme] ?? SPACE_THEME_BACKGROUNDS.sketch }}>
      <iframe
        key={theme}
        ref={frameRef}
        className="bi-space-widget__preview"
        title={`${style.title || "矿山安全空间"}预览`}
        src={`${import.meta.env.BASE_URL}mine-space/index.html#canvas`}
        tabIndex={-1}
      />
      <em>点击编辑</em>
    </div>
  );
}
