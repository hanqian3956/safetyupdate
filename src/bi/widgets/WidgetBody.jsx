import { memo, useCallback, useMemo, useRef } from "react";
import { getDataset, getField } from "../data/datasets.js";
import { useAggregate, useCategoryClick, useRuntime, widgetDetail } from "../runtime/runtime.jsx";
import { CHART_BUILDERS } from "./chartOptions.js";
import { EChart } from "./EChart.jsx";
import { FilterWidget } from "./FilterWidget.jsx";
import {
  BorderWidget,
  ClockWidget,
  ImageWidget,
  MetricWidget,
  ProgressWidget,
  RankWidget,
  SpaceWidget,
  TableWidget,
  TextWidget,
  TickerWidget,
  TitleWidget,
  Unbound,
} from "./basic.jsx";
import { getWidgetType } from "./registry.js";

const AXIS_CHARTS = new Set(["bar", "line"]);
const ITEM_CHARTS = new Set(["pie", "funnel"]);

function ChartWidget({ widget }) {
  const runtime = useRuntime();
  const query = useAggregate(widget);
  const onPick = useCategoryClick(widget, query);
  const selectedKey = runtime.linkage?.sourceId === widget.id ? runtime.linkage.leaf?.key : undefined;

  const option = useMemo(() => {
    if (!query) return null;
    return CHART_BUILDERS[widget.type](query.result, widget.style, runtime.theme, { selectedKey });
  }, [query, widget.type, widget.style, runtime.theme, selectedKey]);

  // A new style object or a different set of series means the chart must be rebuilt;
  // otherwise only values changed and ECharts can animate between them.
  const styleVersion = useRef({ style: widget.style, theme: runtime.theme, version: 0 });
  if (styleVersion.current.style !== widget.style || styleVersion.current.theme !== runtime.theme) {
    styleVersion.current = { style: widget.style, theme: runtime.theme, version: styleVersion.current.version + 1 };
  }
  const shapeKey = query
    ? `${styleVersion.current.version}|${query.result.series.map((series) => series.key).join(",")}|${query.result.categories.length ? 1 : 0}`
    : "";

  const onAxisClick = useCallback(
    (index) => onPick(query?.result.categories[index]),
    [onPick, query],
  );
  const onItemClick = useCallback(
    (params) => {
      const key = params?.data?.key;
      onPick(query?.result.categories.find((entry) => entry.key === key));
    },
    [onPick, query],
  );

  if (!query) return <Unbound />;
  const clickable = runtime.interactive && getWidgetType(widget.type).clickable;
  return (
    <EChart
      option={option}
      shapeKey={shapeKey}
      axisClick={AXIS_CHARTS.has(widget.type) ? (widget.style.horizontal ? "y" : "x") : undefined}
      onAxisClick={clickable && AXIS_CHARTS.has(widget.type) ? onAxisClick : undefined}
      onItemClick={clickable && ITEM_CHARTS.has(widget.type) ? onItemClick : undefined}
    />
  );
}

const BODIES = {
  bar: ChartWidget,
  line: ChartWidget,
  pie: ChartWidget,
  radar: ChartWidget,
  funnel: ChartWidget,
  gauge: ChartWidget,
  metric: MetricWidget,
  progress: ProgressWidget,
  rank: RankWidget,
  table: TableWidget,
  ticker: TickerWidget,
  space: SpaceWidget,
  title: TitleWidget,
  text: TextWidget,
  clock: ClockWidget,
  border: BorderWidget,
  image: ImageWidget,
  filter: FilterWidget,
};

// Shows where a drilled chart currently is and lets the user climb back up. Before the
// first click it says what a click will open, so the drill-down is not a hidden feature.
function DrillTrail({ widget }) {
  const runtime = useRuntime();
  const path = widget.interaction?.drill ?? [];
  const stack = runtime.drill[widget.id] ?? [];
  if (!runtime.interactive || !path.length) return null;
  const next = path[stack.length];
  const nextLabel = next ? getField(getDataset(widget.data?.datasetId), next.field)?.label : null;
  return (
    <nav className="bi-drill" aria-label="下钻路径">
      {stack.length ? (
        <>
          <button type="button" onClick={() => runtime.drillTo(widget, 0)}>全部</button>
          {stack.map((level, index) => (
            <button
              type="button"
              key={`${level.field}:${level.key}`}
              disabled={index === stack.length - 1}
              onClick={() => runtime.drillTo(widget, index + 1)}
            >
              {level.label}
            </button>
          ))}
        </>
      ) : null}
      {nextLabel ? <span>{stack.length ? `可继续下钻到${nextLabel}` : `点击下钻到${nextLabel}`}</span> : null}
    </nav>
  );
}

// 明细：the raw records behind what the widget is showing right now.
function DetailButton({ widget }) {
  const runtime = useRuntime();
  return (
    <button
      type="button"
      className="bi-w__detail"
      title="查看这个组件背后的原始记录"
      onClick={(event) => {
        event.stopPropagation();
        const detail = widgetDetail(widget, runtime);
        if (detail) runtime.openDetail(detail);
      }}
    >
      明细
    </button>
  );
}

function WidgetBodyInner({ widget }) {
  const runtime = useRuntime();
  const definition = getWidgetType(widget.type);
  const Body = BODIES[widget.type];
  if (!definition || !Body) return null;
  if (definition.binding === "none") return <Body widget={widget} />;

  const { style } = widget;
  const hasTitle = style.showTitle !== false && style.title;
  const drillable = Boolean(widget.interaction?.drill?.length);
  const detail = runtime.interactive && widget.data?.datasetId ? <DetailButton widget={widget} /> : null;
  return (
    <section className={`bi-w bi-w--${style.frame ?? "card"}`}>
      {hasTitle || drillable ? (
        <header className="bi-w__head">
          {hasTitle ? <h3>{style.title}</h3> : <span />}
          <div className="bi-w__tools">
            <DrillTrail widget={widget} />
            {detail}
          </div>
        </header>
      ) : detail ? (
        <div className="bi-w__tools is-floating">{detail}</div>
      ) : null}
      <div className="bi-w__body">
        <Body widget={widget} />
      </div>
    </section>
  );
}

// Position changes (x / y) must not re-render the body: moving a chart should not redraw it.
export const WidgetBody = memo(
  WidgetBodyInner,
  (previous, next) =>
    previous.widget.id === next.widget.id &&
    previous.widget.type === next.widget.type &&
    previous.widget.style === next.widget.style &&
    previous.widget.data === next.widget.data &&
    previous.widget.interaction === next.widget.interaction &&
    previous.widget.name === next.widget.name,
);
