import { useEffect, useRef } from "react";
import { init, use } from "echarts/core";
import { BarChart, FunnelChart, GaugeChart, LineChart, PieChart, RadarChart } from "echarts/charts";
import { GridComponent, LegendComponent, RadarComponent, TitleComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  FunnelChart,
  GaugeChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

/**
 * option    — full ECharts option.
 * shapeKey  — changes whenever the option's structure changes (series set, style). Same key
 *             means "only the numbers moved", so the chart animates instead of redrawing.
 * axisClick — "x" | "y": report clicks anywhere in a category band of a cartesian chart.
 * onItemClick / onAxisClick — click callbacks; omit to make the chart non-clickable.
 */
export function EChart({ option, shapeKey, axisClick, onItemClick, onAxisClick }) {
  const hostRef = useRef(null);
  const chartRef = useRef(null);
  const shapeRef = useRef(null);
  const handlersRef = useRef({});

  useEffect(() => {
    handlersRef.current = { onItemClick, onAxisClick, axisClick };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const chart = init(host, null, { renderer: "canvas" });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(host);

    chart.on("click", (params) => {
      const { onItemClick: handler, axisClick: axis } = handlersRef.current;
      if (handler && !axis) handler(params);
    });
    chart.getZr().on("click", (event) => {
      const { onAxisClick: handler, axisClick: axis } = handlersRef.current;
      if (!handler || !axis) return;
      const point = [event.offsetX, event.offsetY];
      if (!chart.containPixel("grid", point)) return;
      const position = chart.convertFromPixel({ seriesIndex: 0 }, point);
      const index = Array.isArray(position) ? position[axis === "y" ? 1 : 0] : null;
      if (Number.isInteger(index)) handler(index);
    });

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
      shapeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !option) return;
    const sameShape = shapeRef.current === shapeKey;
    shapeRef.current = shapeKey;
    chart.setOption(option, { notMerge: !sameShape, lazyUpdate: true });
  }, [option, shapeKey]);

  const clickable = Boolean(onItemClick || onAxisClick);
  return <div ref={hostRef} className={clickable ? "bi-echart is-clickable" : "bi-echart"} />;
}
