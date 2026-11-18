// Screen themes. The dark themes borrow from the mine itself: petrol-black rock, the amber
// of a cap lamp, and series colours named after minerals.

const NUMBER_FONT = '"Bahnschrift", "DIN Alternate", "DIN Condensed", "Roboto Condensed", "Segoe UI", sans-serif';
const TEXT_FONT = '"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';

export const PALETTES = {
  mineral: { label: "矿物", colors: ["#3fc5d8", "#f5b547", "#4fd39b", "#5b8def", "#ef6a5b", "#a78bfa", "#e8d174", "#38a3a5"] },
  risk: { label: "风险四色", colors: ["#e5484d", "#f08c3a", "#f2c94c", "#3b8eea"] },
  cool: { label: "冷调", colors: ["#56cfe1", "#4895ef", "#5e60ce", "#80ffdb", "#48bfe3", "#7b8cde", "#64dfdf", "#9bb1ff"] },
  warm: { label: "暖调", colors: ["#f5b547", "#f08c3a", "#e5674d", "#f2d388", "#c9785b", "#e0a96d", "#d9534f", "#b98a4a"] },
  daylight: { label: "澄明", colors: ["#0f6cbd", "#2aa37f", "#e08a2e", "#7259a4", "#d2554a", "#3f9cc4", "#b8922f", "#5c7c99"] },
};

export const THEMES = {
  shaft: {
    id: "shaft",
    name: "深井",
    hint: "深色 · 青蓝色调",
    dark: true,
    stageColor: "#07141b",
    stage:
      "radial-gradient(1200px 620px at 50% -8%, rgba(46, 132, 150, .22), transparent 70%), radial-gradient(900px 500px at 100% 100%, rgba(245, 181, 71, .06), transparent 70%), linear-gradient(180deg, #081820 0%, #061016 100%)",
    panel: "rgba(14, 36, 46, .78)",
    panelSolid: "#0e242e",
    panelBorder: "rgba(104, 190, 208, .24)",
    text: "#e4f0f3",
    muted: "#8aa7b1",
    faint: "#4f6a75",
    line: "rgba(126, 178, 192, .17)",
    accent: "#f5b547",
    accent2: "#3fc5d8",
    good: "#4fd39b",
    bad: "#ef6a5b",
    palette: "mineral",
    tooltip: "rgba(8, 24, 31, .95)",
  },
  lamp: {
    id: "lamp",
    name: "矿灯",
    hint: "深色 · 暖色调",
    dark: true,
    stageColor: "#15120e",
    stage:
      "radial-gradient(1100px 600px at 50% -10%, rgba(245, 181, 71, .16), transparent 70%), linear-gradient(180deg, #19150f 0%, #100d09 100%)",
    panel: "rgba(38, 31, 22, .8)",
    panelSolid: "#261f16",
    panelBorder: "rgba(245, 190, 104, .22)",
    text: "#f3ebdd",
    muted: "#b3a48c",
    faint: "#6f6350",
    line: "rgba(214, 180, 126, .17)",
    accent: "#f5b547",
    accent2: "#e5674d",
    good: "#8fce7a",
    bad: "#ef6a5b",
    palette: "warm",
    tooltip: "rgba(24, 19, 13, .95)",
  },
  daylight: {
    id: "daylight",
    name: "晨光",
    hint: "浅色 · 与工作台一致",
    dark: false,
    stageColor: "#eef2f6",
    stage: "linear-gradient(180deg, #f3f6f9 0%, #e9eef3 100%)",
    panel: "#ffffff",
    panelSolid: "#ffffff",
    panelBorder: "#dbe3eb",
    text: "#182334",
    muted: "#657386",
    faint: "#a3afbc",
    line: "#e4eaf0",
    accent: "#0f6cbd",
    accent2: "#2aa37f",
    good: "#2a9d74",
    bad: "#d2554a",
    palette: "daylight",
    tooltip: "rgba(255, 255, 255, .97)",
  },
};

export const DEFAULT_THEME = "shaft";

export function getTheme(id) {
  return THEMES[id] ?? THEMES[DEFAULT_THEME];
}

export function getPalette(theme, paletteId) {
  const id = paletteId && paletteId !== "theme" ? paletteId : theme.palette;
  return (PALETTES[id] ?? PALETTES.mineral).colors;
}

/** The colours a chart draws with: the ones picked for it, or else the theme's. */
export function chartColors(theme, style) {
  return style?.colors?.length ? style.colors : getPalette(theme, style?.palette);
}

export function themeCssVariables(theme) {
  return {
    "--bi-stage": theme.stage,
    "--bi-stage-color": theme.stageColor,
    "--bi-panel": theme.panel,
    "--bi-panel-solid": theme.panelSolid,
    "--bi-panel-border": theme.panelBorder,
    "--bi-text": theme.text,
    "--bi-muted": theme.muted,
    "--bi-faint": theme.faint,
    "--bi-line": theme.line,
    "--bi-accent": theme.accent,
    "--bi-accent-2": theme.accent2,
    "--bi-good": theme.good,
    "--bi-bad": theme.bad,
    "--bi-number-font": NUMBER_FONT,
    "--bi-text-font": TEXT_FONT,
  };
}

export function withAlpha(hex, alpha) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

export const FONTS = { number: NUMBER_FONT, text: TEXT_FONT };

export const SCREEN_SIZES = [
  { id: "1920x1080", label: "1920 × 1080（16:9 常规大屏）", width: 1920, height: 1080 },
  { id: "2560x1080", label: "2560 × 1080（21:9 带鱼屏）", width: 2560, height: 1080 },
  { id: "3840x1080", label: "3840 × 1080（双屏拼接）", width: 3840, height: 1080 },
  { id: "1366x768", label: "1366 × 768（会议室电视）", width: 1366, height: 768 },
  { id: "1080x1920", label: "1080 × 1920（竖屏）", width: 1080, height: 1920 },
];
