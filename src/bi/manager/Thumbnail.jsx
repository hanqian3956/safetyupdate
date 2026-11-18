// A blueprint-style preview of a screen: one schematic glyph per widget instead of a live
// render, so a page full of screen cards stays cheap.

import { memo } from "react";
import { getPalette, getTheme } from "../screen/themes.js";

function glyph(widget, theme, palette) {
  const { type, x, y, w, h, style = {} } = widget;
  const hasHead = style.showTitle !== false && style.title;
  const top = y + (hasHead ? Math.min(46, h * 0.3) : h * 0.12);
  const left = x + w * 0.1;
  const width = w * 0.8;
  const height = y + h * 0.9 - top;
  const a = palette[0];
  const b = palette[1] ?? theme.accent;
  const line = { fill: "none", stroke: a, strokeWidth: 5, strokeLinejoin: "round", strokeLinecap: "round" };
  const cx = x + w / 2;
  const cy = top + height / 2;
  const radius = Math.max(8, Math.min(width, height) / 2);

  switch (type) {
    case "bar": {
      const heights = [0.55, 0.9, 0.4, 0.72, 0.6, 0.3];
      if (style.horizontal) {
        const rowHeight = height / heights.length;
        return heights.map((ratio, index) => (
          <rect key={index} x={left} y={top + index * rowHeight + rowHeight * 0.2} width={width * ratio} height={rowHeight * 0.6} fill={index % 2 ? b : a} opacity=".85" />
        ));
      }
      const columnWidth = width / heights.length;
      return heights.map((ratio, index) => (
        <rect key={index} x={left + index * columnWidth + columnWidth * 0.2} y={top + height * (1 - ratio)} width={columnWidth * 0.6} height={height * ratio} fill={style.stacked && index % 2 ? b : a} opacity=".85" />
      ));
    }
    case "line": {
      const points = [0.7, 0.45, 0.6, 0.25, 0.4, 0.15, 0.3].map((ratio, index, list) => `${left + (width * index) / (list.length - 1)},${top + height * ratio}`);
      return (
        <>
          <polygon points={`${left},${top + height} ${points.join(" ")} ${left + width},${top + height}`} fill={a} opacity=".16" />
          <polyline points={points.join(" ")} {...line} />
        </>
      );
    }
    case "pie":
    case "progress":
    case "gauge":
      return (
        <>
          <circle cx={cx} cy={cy} r={radius * 0.82} fill="none" stroke={theme.line} strokeWidth={radius * 0.3} />
          <circle
            cx={cx}
            cy={cy}
            r={radius * 0.82}
            fill="none"
            stroke={type === "pie" ? a : b}
            strokeWidth={radius * 0.3}
            strokeDasharray={`${radius * 3.4} ${radius * 6}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </>
      );
    case "radar": {
      const corners = Array.from({ length: 5 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
        return [Math.cos(angle), Math.sin(angle)];
      });
      const ring = (scale) => corners.map(([dx, dy]) => `${cx + dx * radius * scale},${cy + dy * radius * scale}`).join(" ");
      const shape = corners.map(([dx, dy], index) => `${cx + dx * radius * [0.9, 0.6, 0.8, 0.5, 0.7][index]},${cy + dy * radius * [0.9, 0.6, 0.8, 0.5, 0.7][index]}`).join(" ");
      return (
        <>
          <polygon points={ring(1)} fill="none" stroke={theme.line} strokeWidth="3" />
          <polygon points={shape} fill={a} fillOpacity=".25" stroke={a} strokeWidth="4" />
        </>
      );
    }
    case "funnel":
      return [1, 0.74, 0.5, 0.3].map((ratio, index) => (
        <rect key={index} x={cx - (width * ratio) / 2} y={top + (height / 4) * index + 3} width={width * ratio} height={height / 4 - 6} fill={palette[index % palette.length]} opacity=".85" />
      ));
    case "metric":
      return <rect x={x + w * 0.1} y={top + height * 0.15} width={w * 0.45} height={Math.min(height * 0.5, 44)} fill={theme.accent} opacity=".9" />;
    case "rank":
    case "table":
    case "ticker": {
      const rows = Math.max(2, Math.min(7, Math.floor(height / 40)));
      return Array.from({ length: rows }, (_, index) => (
        <rect key={index} x={left} y={top + (height / rows) * index + 6} width={width * (type === "rank" ? 1 - index * 0.11 : 1)} height={Math.max(4, height / rows - 16)} fill={type === "rank" ? a : theme.muted} opacity={type === "rank" ? 0.8 : 0.22} />
      ));
    }
    case "title":
      return <rect x={x + w * 0.3} y={y + h * 0.3} width={w * 0.4} height={h * 0.4} fill={theme.text} opacity=".85" />;
    case "text":
    case "clock":
      return <rect x={x + w * 0.1} y={y + h * 0.35} width={w * 0.8} height={Math.min(h * 0.3, 14)} fill={theme.muted} opacity=".5" />;
    case "filter":
      return <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="none" stroke={theme.accent} strokeWidth="3" />;
    case "image":
      return (
        <>
          <line x1={x} y1={y} x2={x + w} y2={y + h} stroke={theme.faint} strokeWidth="3" />
          <line x1={x + w} y1={y} x2={x} y2={y + h} stroke={theme.faint} strokeWidth="3" />
        </>
      );
    default:
      return null;
  }
}

const FRAMELESS = new Set(["title", "text", "clock", "filter", "image"]);

export const Thumbnail = memo(function Thumbnail({ screen }) {
  const theme = getTheme(screen.theme);
  const palette = getPalette(theme);
  return (
    <svg className="bi-thumb" viewBox={`0 0 ${screen.width} ${screen.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${screen.name}的布局预览`}>
      <rect width={screen.width} height={screen.height} fill={screen.backgroundColor || theme.stageColor} />
      {screen.widgets.map((widget) => {
        if (widget.hidden) return null;
        const framed = !FRAMELESS.has(widget.type) && widget.style?.frame !== "none";
        return (
          <g key={widget.id}>
            {framed ? (
              <rect x={widget.x} y={widget.y} width={widget.w} height={widget.h} fill={theme.panelSolid} stroke={theme.panelBorder} strokeWidth="3" />
            ) : null}
            {framed && widget.style?.showTitle !== false && widget.style?.title ? (
              <rect x={widget.x + 18} y={widget.y + 16} width={Math.min(widget.w * 0.4, 150)} height="10" fill={theme.muted} opacity=".55" />
            ) : null}
            {glyph(widget, theme, palette)}
          </g>
        );
      })}
    </svg>
  );
});
