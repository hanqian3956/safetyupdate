// Builds ECharts options from a query result. Kept free of React so the mapping from
// "categories + series" to each chart type is easy to follow and test.

import { graphic } from "echarts/core";
import { formatNumber } from "../query/format.js";
import { chartColors, FONTS, withAlpha } from "../screen/themes.js";
import { resolveTone } from "./registry.js";

const numberText = (meta, value, compact = false) => {
  if (value === null || value === undefined) return "—";
  const text = formatNumber(value, { decimals: meta?.decimals ?? 0, compact });
  return meta?.unit ? `${text} ${meta.unit}` : text;
};

const axisNumber = (value) => {
  const abs = Math.abs(value);
  if (abs >= 100000000) return `${+(value / 100000000).toFixed(1)}亿`;
  if (abs >= 10000) return `${+(value / 10000).toFixed(1)}万`;
  return String(value);
};

function baseOption(theme, palette) {
  return {
    backgroundColor: "transparent",
    color: palette,
    textStyle: { color: theme.text, fontFamily: FONTS.text },
    animationDuration: 520,
    animationDurationUpdate: 420,
  };
}

function tooltipOf(theme, extra) {
  return {
    confine: true,
    backgroundColor: theme.tooltip,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: theme.text, fontSize: 13 },
    extraCssText: "box-shadow: 0 8px 24px rgba(0, 0, 0, .28); border-radius: 6px;",
    ...extra,
  };
}

function legendOf(theme, position) {
  if (!position || position === "none") return { show: false };
  const base = {
    show: true,
    type: "scroll",
    icon: "roundRect",
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 14,
    textStyle: { color: theme.muted, fontSize: 12 },
    pageIconColor: theme.muted,
    pageIconInactiveColor: theme.faint,
    pageTextStyle: { color: theme.muted },
  };
  if (position === "bottom") return { ...base, bottom: 0, left: "center" };
  if (position === "right") return { ...base, orient: "vertical", right: 4, top: "middle" };
  return { ...base, top: 0, right: 4 };
}

function gridOf(legendPosition) {
  return {
    left: 6,
    right: legendPosition === "right" ? 110 : 14,
    top: legendPosition === "top" ? 34 : 14,
    bottom: legendPosition === "bottom" ? 32 : 4,
    outerBoundsMode: "same",
    outerBoundsContain: "axisLabel",
  };
}

function categoryAxis(result, theme, { inverse = false, boundaryGap = true, horizontal = false } = {}) {
  const labels = result.categories.map((entry) => entry.label);
  const isTime = result.dims[0]?.type === "datetime";
  const longest = labels.reduce((max, label) => Math.max(max, label.length), 0);
  const crowded = !horizontal && !isTime && labels.length > 6 && longest > 4;
  return {
    type: "category",
    data: labels,
    inverse,
    boundaryGap,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: theme.line } },
    axisLabel: {
      color: theme.muted,
      fontSize: 12,
      hideOverlap: true,
      ...(isTime || horizontal ? {} : { interval: 0, rotate: crowded ? 28 : 0 }),
      ...(horizontal ? { width: 110, overflow: "truncate" } : {}),
    },
  };
}

function valueAxis(theme, result) {
  // Counts have no half steps: keep the ticks on whole numbers when every measure is one.
  const wholeNumbers = result.series.every((series) => (result.measures[series.measureIndex]?.decimals ?? 0) === 0);
  return {
    type: "value",
    minInterval: wholeNumbers ? 1 : undefined,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: theme.line, type: "dashed" } },
    axisLabel: { color: theme.muted, fontSize: 12, formatter: axisNumber },
  };
}

const legendPosition = (style, multi) => (style.legend === "auto" || style.legend === undefined ? (multi ? "top" : "none") : style.legend);

function emptyOption(theme) {
  return {
    ...baseOption(theme, []),
    title: {
      text: "当前条件下没有数据",
      left: "center",
      top: "middle",
      textStyle: { color: theme.faint, fontSize: 13, fontWeight: 400 },
    },
  };
}

export function barOption(result, style, theme, ctx = {}) {
  if (!result.categories.length) return emptyOption(theme);
  const palette = chartColors(theme, style);
  const horizontal = Boolean(style.horizontal);
  const multi = result.series.length > 1;
  const semantic = style.semantic !== false;
  const legend = legendPosition(style, multi);
  const fill = (color) => {
    if (!theme.dark || style.stacked) return color;
    return new graphic.LinearGradient(horizontal ? 1 : 0, horizontal ? 0 : 0, 0, horizontal ? 0 : 1, [
      { offset: 0, color },
      { offset: 1, color: withAlpha(color, 0.32) },
    ]);
  };
  const category = categoryAxis(result, theme, { inverse: horizontal, horizontal });
  const value = valueAxis(theme, result);
  return {
    ...baseOption(theme, palette),
    tooltip: tooltipOf(theme, { trigger: "axis", axisPointer: { type: "shadow", shadowStyle: { color: withAlpha(theme.text, 0.05) } } }),
    legend: legendOf(theme, legend),
    grid: gridOf(legend),
    xAxis: horizontal ? value : category,
    yAxis: horizontal ? category : value,
    series: result.series.map((series, seriesIndex) => {
      const meta = result.measures[series.measureIndex];
      const seriesColor = (semantic && series.color) || palette[seriesIndex % palette.length];
      return {
        id: series.key,
        type: "bar",
        name: series.name,
        stack: style.stacked ? "total" : undefined,
        barMaxWidth: 26,
        barGap: "18%",
        // The series colour is what the legend shows; individual bars may override it below.
        itemStyle: { color: seriesColor, borderRadius: style.stacked ? 0 : horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0] },
        emphasis: { focus: multi ? "series" : "none" },
        label: {
          show: Boolean(style.showLabel),
          position: style.stacked ? "inside" : horizontal ? "right" : "top",
          color: theme.text,
          fontSize: 12,
          fontFamily: FONTS.number,
          formatter: (params) => (params.value ? formatNumber(params.value, { decimals: meta.decimals, compact: true }) : ""),
        },
        tooltip: { valueFormatter: (current) => numberText(meta, current) },
        data: series.data.map((current, index) => {
          const entry = result.categories[index];
          const color = !multi && semantic && entry.color ? entry.color : seriesColor;
          const faded = ctx.selectedKey !== undefined && ctx.selectedKey !== null && ctx.selectedKey !== entry.key;
          return { value: current, itemStyle: { color: fill(color), opacity: faded ? 0.28 : 1 } };
        }),
      };
    }),
  };
}

export function lineOption(result, style, theme) {
  if (!result.categories.length) return emptyOption(theme);
  const palette = chartColors(theme, style);
  const multi = result.series.length > 1;
  const semantic = style.semantic !== false;
  const legend = legendPosition(style, multi);
  const fewPoints = result.categories.length <= 2;
  return {
    ...baseOption(theme, palette),
    tooltip: tooltipOf(theme, { trigger: "axis", axisPointer: { type: "line", lineStyle: { color: theme.faint, type: "dashed" } } }),
    legend: legendOf(theme, legend),
    grid: { ...gridOf(legend), right: legend === "right" ? 110 : 18 },
    xAxis: categoryAxis(result, theme, { boundaryGap: fewPoints }),
    // A filled area has to stand on zero; a bare line may zoom in on its own range so that
    // small movements (temperature, ore grade) stay visible.
    yAxis: { ...valueAxis(theme, result), scale: !style.area },
    series: result.series.map((series, seriesIndex) => {
      const meta = result.measures[series.measureIndex];
      const color = (semantic && series.color) || palette[seriesIndex % palette.length];
      return {
        id: series.key,
        type: "line",
        name: series.name,
        smooth: style.smooth ? 0.35 : false,
        connectNulls: true,
        showSymbol: Boolean(style.showSymbol) || fewPoints,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        emphasis: { focus: multi ? "series" : "none" },
        areaStyle: style.area
          ? {
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: withAlpha(color, theme.dark ? 0.34 : 0.22) },
                { offset: 1, color: withAlpha(color, 0.02) },
              ]),
            }
          : undefined,
        label: {
          show: Boolean(style.showLabel),
          color: theme.text,
          fontSize: 12,
          fontFamily: FONTS.number,
          formatter: (params) => formatNumber(params.value, { decimals: meta.decimals, compact: true }),
        },
        tooltip: { valueFormatter: (current) => numberText(meta, current) },
        data: series.data,
      };
    }),
  };
}

function sliceItems(result, style, theme, ctx) {
  const palette = chartColors(theme, style);
  const semantic = style.semantic !== false;
  return result.rows.map((row, index) => {
    const entry = result.categories[index];
    const faded = ctx.selectedKey !== undefined && ctx.selectedKey !== null && ctx.selectedKey !== row.keys[0];
    return {
      name: row.labels[0],
      value: row.values[0] ?? 0,
      key: row.keys[0],
      itemStyle: { color: (semantic && entry?.color) || palette[index % palette.length], opacity: faded ? 0.28 : 1 },
    };
  });
}

export function pieOption(result, style, theme, ctx = {}) {
  const data = sliceItems(result, style, theme, ctx).filter((item) => item.value > 0);
  if (!data.length) return emptyOption(theme);
  const meta = result.measures[0];
  const legend = style.legend ?? "right";
  const centerX = legend === "right" ? "36%" : "50%";
  const centerY = legend === "top" ? "56%" : legend === "bottom" ? "45%" : "50%";
  const outer = style.labelMode && style.labelMode !== "none" ? "62%" : "76%";
  const total = data.reduce((sum, item) => sum + item.value, 0);
  // The legend already names each slice, so labels only repeat the name when it is hidden.
  const named = legend === "none";
  const labelFormat = {
    name: "{b}",
    percent: named ? "{b} {d}%" : "{d}%",
    value: named ? "{b} {c}" : "{c}",
  }[style.labelMode];
  return {
    ...baseOption(theme, chartColors(theme, style)),
    tooltip: tooltipOf(theme, {
      trigger: "item",
      formatter: (params) => `${params.marker}${params.name}<br/><b>${numberText(meta, params.value)}</b>　${params.percent}%`,
    }),
    legend: {
      ...legendOf(theme, legend),
      formatter: (name) => (name.length > 9 ? `${name.slice(0, 9)}…` : name),
    },
    title:
      style.ring && style.showTotal && !style.rose
        ? {
            text: formatNumber(total, { decimals: meta.decimals, compact: true }),
            subtext: meta.label,
            left: centerX,
            top: centerY === "50%" ? "middle" : centerY,
            textAlign: "center",
            textVerticalAlign: centerY === "50%" ? undefined : "middle",
            itemGap: 4,
            textStyle: { color: theme.text, fontSize: 28, fontWeight: 600, fontFamily: FONTS.number },
            subtextStyle: { color: theme.muted, fontSize: 12 },
          }
        : { show: false },
    series: [
      {
        id: "pie",
        type: "pie",
        center: [centerX, centerY],
        radius: style.rose ? [style.ring ? "24%" : "10%", outer] : [style.ring ? "50%" : "0%", outer],
        roseType: style.rose ? "radius" : undefined,
        minAngle: 3,
        avoidLabelOverlap: true,
        itemStyle: { borderColor: theme.panelSolid, borderWidth: 2 },
        label: labelFormat
          ? { show: true, color: theme.muted, fontSize: 12, formatter: labelFormat }
          : { show: false },
        labelLine: { show: Boolean(labelFormat), length: 8, length2: 10, lineStyle: { color: theme.faint } },
        emphasis: { scaleSize: 6 },
        data,
      },
    ],
  };
}

export function funnelOption(result, style, theme, ctx = {}) {
  const data = sliceItems(result, style, theme, ctx).filter((item) => item.value > 0);
  if (!data.length) return emptyOption(theme);
  const meta = result.measures[0];
  const legend = style.legend ?? "none";
  const inside = Boolean(style.labelInside);
  return {
    ...baseOption(theme, chartColors(theme, style)),
    tooltip: tooltipOf(theme, {
      trigger: "item",
      formatter: (params) => `${params.marker}${params.name}<br/><b>${numberText(meta, params.value)}</b>`,
    }),
    legend: legendOf(theme, legend),
    series: [
      {
        id: "funnel",
        type: "funnel",
        left: 8,
        right: inside ? (legend === "right" ? 110 : 8) : legend === "right" ? 200 : 130,
        top: legend === "top" ? 34 : 8,
        bottom: legend === "bottom" ? 34 : 8,
        minSize: "14%",
        gap: 3,
        sort: "descending",
        itemStyle: { borderWidth: 0 },
        label: {
          show: true,
          position: inside ? "inside" : "right",
          color: inside ? "#fff" : theme.muted,
          fontSize: 12,
          formatter: (params) => `${params.name}  ${formatNumber(params.value, { decimals: meta.decimals })}`,
        },
        labelLine: { show: !inside, length: 12, lineStyle: { color: theme.faint } },
        data,
      },
    ],
  };
}

export function radarOption(result, style, theme) {
  if (result.categories.length < 3) {
    return {
      ...emptyOption(theme),
      title: { ...emptyOption(theme).title, text: result.categories.length ? "雷达图至少需要 3 个分类" : "当前条件下没有数据" },
    };
  }
  const palette = chartColors(theme, style);
  const multi = result.series.length > 1;
  const legend = legendPosition(style, multi);
  const peak = Math.max(1, ...result.series.flatMap((series) => series.data.map((current) => current ?? 0)));
  return {
    ...baseOption(theme, palette),
    tooltip: tooltipOf(theme, { trigger: "item" }),
    legend: legendOf(theme, legend),
    radar: {
      center: [legend === "right" ? "42%" : "50%", legend === "top" ? "56%" : "52%"],
      radius: "66%",
      indicator: result.categories.map((entry) => ({ name: entry.label, max: Math.ceil(peak * 1.15) })),
      axisName: { color: theme.muted, fontSize: 12 },
      axisLine: { lineStyle: { color: theme.line } },
      splitLine: { lineStyle: { color: theme.line } },
      splitArea: { areaStyle: { color: ["transparent", withAlpha(theme.text, 0.03)] } },
    },
    series: [
      {
        id: "radar",
        type: "radar",
        symbolSize: 5,
        data: result.series.map((series, index) => {
          const color = palette[index % palette.length];
          return {
            name: series.name,
            value: series.data.map((current) => current ?? 0),
            lineStyle: { color, width: 2 },
            itemStyle: { color },
            areaStyle: style.fill ? { color: withAlpha(color, 0.24) } : undefined,
          };
        }),
      },
    ],
  };
}

export function gaugeValue(result, style) {
  const [first, second] = result.rows[0]?.values ?? [];
  if (style.valueMode === "ratio") {
    if (first === null || first === undefined || !second) return null;
    return (first / second) * 100;
  }
  return first ?? null;
}

export function gaugeOption(result, style, theme) {
  const value = gaugeValue(result, style);
  const decimals = Number(style.decimals) || 0;
  const min = Number(style.min) || 0;
  const max = Number(style.max) > min ? Number(style.max) : min + 100;
  const color = resolveTone(theme, style.color);
  const unit = style.unit ?? "";
  return {
    ...baseOption(theme, [color]),
    series: [
      {
        id: "gauge",
        type: "gauge",
        min,
        max,
        startAngle: 210,
        endAngle: -30,
        center: ["50%", "58%"],
        radius: "94%",
        progress: { show: true, width: 14, roundCap: true, itemStyle: { color } },
        axisLine: { roundCap: true, lineStyle: { width: 14, color: [[1, withAlpha(theme.text, theme.dark ? 0.1 : 0.08)]] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { distance: 6, length: 6, lineStyle: { color: theme.faint, width: 1 } },
        axisLabel: { distance: 18, color: theme.faint, fontSize: 11 },
        anchor: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, "2%"],
          color: theme.text,
          fontSize: 36,
          fontWeight: 600,
          fontFamily: FONTS.number,
          // Values beyond the dial (e.g. 103% of plan) still show their real figure.
          formatter: (current) => {
            if (value === null) return "—";
            const shown = value > max || value < min ? value : Number(current);
            return `${shown.toFixed(decimals)}${unit}`;
          },
        },
        data: [{ value: value === null ? min : Math.max(min, Math.min(max, value)) }],
      },
    ],
  };
}

export const CHART_BUILDERS = {
  bar: barOption,
  line: lineOption,
  pie: pieOption,
  funnel: funnelOption,
  radar: radarOption,
  gauge: gaugeOption,
};
