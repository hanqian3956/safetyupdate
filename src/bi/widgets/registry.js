// Catalogue of widget types: how each one binds data, what it looks like when first
// dropped on the canvas, and which style options the designer exposes for it.

const count = (label, where) => ({ field: "*", agg: "count", ...(label ? { label } : {}), ...(where ? { where } : {}) });
const isIn = (field, ...value) => ({ field, op: "in", value });
const range = (field, value) => ({ field, op: "range", value });

const LEGEND_OPTIONS = [
  ["none", "隐藏"],
  ["top", "顶部"],
  ["bottom", "底部"],
  ["right", "右侧"],
];

// style.frame: "card" draws the bordered background behind a widget, "none" leaves it bare.
const chrome = [
  { key: "title", label: "标题", control: "text", section: "标题与背景" },
  { key: "showTitle", label: "显示标题", control: "switch", section: "标题与背景" },
  { key: "frame", label: "显示背景框", control: "frame", section: "标题与背景", hint: "组件后面那层带边框的底色。关闭后，组件直接叠在大屏背景上" },
];
const chromeStyle = (title) => ({ title, showTitle: true, frame: "card" });

// style.colors: the colours a chart uses, in order. Empty means the screen theme's own set.
const seriesColors = { key: "colors", label: "图表颜色", control: "colors", section: "图表", hint: "依次用于各个系列或分类，点击色块修改" };
const paletteControls = [
  seriesColors,
  { key: "semantic", label: "等级、状态用固定颜色", control: "switch", section: "图表", hint: "如风险等级固定为红、橙、黄、蓝，不随上面的图表颜色变化" },
];

export const WIDGET_GROUPS = [
  { id: "chart", label: "图表" },
  { id: "metric", label: "指标" },
  { id: "list", label: "列表" },
  { id: "decor", label: "文本与装饰" },
  { id: "control", label: "筛选控件" },
];

export const WIDGET_TYPES = {
  bar: {
    label: "柱状图",
    group: "chart",
    size: [600, 340],
    binding: "aggregate",
    slots: { dimensions: { min: 1, max: 2, hints: ["分类轴", "拆分成多个系列"] }, measures: { min: 1, max: 6 } },
    clickable: true,
    style: { ...chromeStyle("各作业地点隐患数"), horizontal: false, stacked: false, showLabel: false, legend: "auto", semantic: true },
    data: { datasetId: "form_hazard", dimensions: [{ field: "location" }], measures: [count("隐患记录")], filters: [isIn("result", "发现隐患")], limit: 8 },
    schema: [
      ...chrome,
      { key: "horizontal", label: "横向条形", control: "switch", section: "图表" },
      { key: "stacked", label: "堆叠", control: "switch", section: "图表" },
      { key: "showLabel", label: "数值标签", control: "switch", section: "图表" },
      { key: "legend", label: "图例", control: "select", options: [["auto", "自动"], ...LEGEND_OPTIONS], section: "图表" },
      ...paletteControls,
    ],
  },
  line: {
    label: "折线图",
    group: "chart",
    size: [680, 340],
    binding: "aggregate",
    slots: { dimensions: { min: 1, max: 2, hints: ["横轴，通常是时间", "拆分成多个系列"] }, measures: { min: 1, max: 6 } },
    clickable: true,
    style: { ...chromeStyle("近 30 天隐患排查趋势"), smooth: true, area: true, showSymbol: false, showLabel: false, legend: "auto", semantic: true },
    data: {
      datasetId: "form_hazard",
      dimensions: [{ field: "submittedAt", granularity: "day" }],
      measures: [count("排查记录"), count("发现隐患", [isIn("result", "发现隐患")])],
      filters: [range("submittedAt", "last30")],
    },
    schema: [
      ...chrome,
      { key: "smooth", label: "平滑曲线", control: "switch", section: "图表" },
      { key: "area", label: "面积填充", control: "switch", section: "图表" },
      { key: "showSymbol", label: "显示数据点", control: "switch", section: "图表" },
      { key: "showLabel", label: "数值标签", control: "switch", section: "图表" },
      { key: "legend", label: "图例", control: "select", options: [["auto", "自动"], ...LEGEND_OPTIONS], section: "图表" },
      ...paletteControls,
    ],
  },
  pie: {
    label: "饼图",
    group: "chart",
    size: [460, 340],
    binding: "aggregate",
    slots: { dimensions: { min: 1, max: 1, hints: ["扇区分类"] }, measures: { min: 1, max: 1 } },
    clickable: true,
    style: { ...chromeStyle("预警风险等级分布"), ring: true, rose: false, labelMode: "percent", legend: "right", showTotal: true, semantic: true },
    data: { datasetId: "alert_record", dimensions: [{ field: "riskLevel" }], measures: [count("预警数")], filters: [] },
    schema: [
      ...chrome,
      { key: "ring", label: "环形", control: "switch", section: "图表" },
      { key: "rose", label: "玫瑰图", control: "switch", section: "图表" },
      { key: "showTotal", label: "环心显示合计", control: "switch", section: "图表", when: (style) => style.ring },
      { key: "labelMode", label: "扇区标签", control: "select", options: [["none", "隐藏"], ["name", "名称"], ["percent", "占比"], ["value", "数值"]], section: "图表", hint: "隐藏图例时，占比和数值前会带上名称" },
      { key: "legend", label: "图例", control: "select", options: LEGEND_OPTIONS, section: "图表" },
      ...paletteControls,
    ],
  },
  radar: {
    label: "雷达图",
    group: "chart",
    size: [460, 340],
    binding: "aggregate",
    slots: { dimensions: { min: 1, max: 2, hints: ["雷达各轴", "拆分成多个系列"] }, measures: { min: 1, max: 4 } },
    style: { ...chromeStyle("隐患类别分布"), fill: true, legend: "auto" },
    data: {
      datasetId: "form_hazard",
      dimensions: [{ field: "hazardType" }],
      measures: [count("隐患记录")],
      filters: [isIn("result", "发现隐患")],
    },
    schema: [
      ...chrome,
      { key: "fill", label: "区域填充", control: "switch", section: "图表" },
      { key: "legend", label: "图例", control: "select", options: [["auto", "自动"], ...LEGEND_OPTIONS], section: "图表" },
      seriesColors,
    ],
  },
  funnel: {
    label: "漏斗图",
    group: "chart",
    size: [460, 340],
    binding: "aggregate",
    slots: { dimensions: { min: 1, max: 1, hints: ["漏斗各层"] }, measures: { min: 1, max: 1 } },
    clickable: true,
    style: { ...chromeStyle("任务状态漏斗"), labelInside: false, legend: "none", semantic: true },
    data: { datasetId: "task_record", dimensions: [{ field: "status" }], measures: [count("任务数")], filters: [], sort: { by: "measure", order: "desc" } },
    schema: [
      ...chrome,
      { key: "labelInside", label: "标签放在内部", control: "switch", section: "图表" },
      { key: "legend", label: "图例", control: "select", options: LEGEND_OPTIONS, section: "图表" },
      ...paletteControls,
    ],
  },
  gauge: {
    label: "仪表盘",
    group: "chart",
    size: [360, 300],
    binding: "aggregate",
    slots: { dimensions: { min: 0, max: 0 }, measures: { min: 1, max: 2, hints: ["数值，或比率的分子", "比率的分母"] } },
    style: { ...chromeStyle("本月产量达成率"), valueMode: "ratio", min: 0, max: 100, unit: "%", decimals: 1, color: "accent" },
    data: {
      datasetId: "form_production",
      dimensions: [],
      measures: [{ field: "actualOutput", agg: "sum" }, { field: "planOutput", agg: "sum" }],
      filters: [range("submittedAt", "thisMonth")],
    },
    schema: [
      ...chrome,
      { key: "valueMode", label: "取值方式", control: "select", options: [["ratio", "两个指标的比率"], ["value", "直接显示第一个指标"]], section: "图表" },
      { key: "min", label: "最小值", control: "number", section: "图表" },
      { key: "max", label: "最大值", control: "number", section: "图表" },
      { key: "unit", label: "单位", control: "text", section: "图表" },
      { key: "decimals", label: "小数位", control: "number", min: 0, max: 4, section: "图表" },
      { key: "color", label: "颜色", control: "color", section: "图表" },
    ],
  },
  metric: {
    label: "指标卡",
    group: "metric",
    size: [320, 150],
    binding: "aggregate",
    slots: { dimensions: { min: 0, max: 1, hints: ["可选：时间字段，用于迷你趋势线"] }, measures: { min: 1, max: 1 } },
    style: { ...chromeStyle("近 7 天隐患排查"), valueSize: 52, valueColor: "accent", align: "left", compare: true, sparkline: true, compact: false, unit: "" },
    data: {
      datasetId: "form_hazard",
      dimensions: [{ field: "submittedAt", granularity: "day" }],
      measures: [count("排查记录")],
      filters: [range("submittedAt", "last7")],
    },
    schema: [
      ...chrome,
      { key: "valueSize", label: "数字大小", control: "number", min: 20, max: 160, section: "数字" },
      { key: "valueColor", label: "数字颜色", control: "color", section: "数字" },
      { key: "align", label: "对齐", control: "select", options: [["left", "居左"], ["center", "居中"]], section: "数字" },
      { key: "unit", label: "单位", control: "text", placeholder: "留空则用字段单位", section: "数字" },
      { key: "compact", label: "大数用万 / 亿", control: "switch", section: "数字" },
      { key: "compare", label: "显示较上期变化", control: "switch", section: "数字", hint: "需要筛选条件里有一个相对时间范围，如近 7 天" },
      { key: "sparkline", label: "迷你趋势线", control: "switch", section: "数字", hint: "需要在维度里放一个时间字段" },
    ],
  },
  progress: {
    label: "进度环",
    group: "metric",
    size: [300, 260],
    binding: "aggregate",
    slots: { dimensions: { min: 0, max: 0 }, measures: { min: 2, max: 2, hints: ["分子：达成的部分", "分母：总体"] } },
    style: { ...chromeStyle("隐患整改率"), shape: "ring", color: "good", decimals: 1, showDetail: true },
    data: {
      datasetId: "form_hazard",
      dimensions: [],
      measures: [count("已整改", [isIn("rectifyStatus", "已整改")]), count("发现隐患", [isIn("result", "发现隐患")])],
      filters: [],
    },
    schema: [
      ...chrome,
      { key: "shape", label: "形状", control: "select", options: [["ring", "圆环"], ["bar", "进度条"]], section: "进度" },
      { key: "color", label: "颜色", control: "color", section: "进度" },
      { key: "decimals", label: "小数位", control: "number", min: 0, max: 2, section: "进度" },
      { key: "showDetail", label: "显示分子 / 分母", control: "switch", section: "进度" },
    ],
  },
  rank: {
    label: "排行榜",
    group: "list",
    size: [420, 340],
    binding: "aggregate",
    slots: { dimensions: { min: 1, max: 1, hints: ["排名对象"] }, measures: { min: 1, max: 1 } },
    clickable: true,
    style: { ...chromeStyle("设备异常次数排行"), showBar: true, highlightTop: 3, color: "accent2" },
    data: {
      datasetId: "form_equipment",
      dimensions: [{ field: "equipment" }],
      measures: [count("异常次数")],
      filters: [isIn("result", "异常")],
      sort: { by: "measure", order: "desc" },
      limit: 6,
    },
    schema: [
      ...chrome,
      { key: "showBar", label: "显示比例条", control: "switch", section: "列表" },
      { key: "highlightTop", label: "高亮前几名", control: "number", min: 0, max: 10, section: "列表" },
      { key: "color", label: "比例条颜色", control: "color", section: "列表" },
    ],
  },
  table: {
    label: "明细表",
    group: "list",
    size: [760, 340],
    binding: "detail",
    style: { ...chromeStyle("最新预警记录"), showHeader: true, stripe: true, autoScroll: true, rowHeight: 38, showIndex: false },
    data: {
      datasetId: "alert_record",
      columns: ["triggeredAt", "content", "riskLevel", "location", "department", "status"],
      filters: [],
      sortField: "triggeredAt",
      order: "desc",
      limit: 30,
    },
    schema: [
      ...chrome,
      { key: "showHeader", label: "显示表头", control: "switch", section: "列表" },
      { key: "showIndex", label: "显示序号", control: "switch", section: "列表" },
      { key: "stripe", label: "斑马纹", control: "switch", section: "列表" },
      { key: "autoScroll", label: "自动滚动", control: "switch", section: "列表" },
      { key: "rowHeight", label: "行高", control: "number", min: 24, max: 80, section: "列表" },
    ],
  },
  ticker: {
    label: "预警播报",
    group: "list",
    size: [460, 340],
    binding: "detail",
    style: {
      ...chromeStyle("预警播报"),
      autoScroll: true,
      tagField: "riskLevel",
      titleField: "content",
      metaFields: ["location", "department"],
      statusField: "status",
    },
    data: { datasetId: "alert_record", columns: [], filters: [], sortField: "triggeredAt", order: "desc", limit: 20 },
    schema: [
      ...chrome,
      { key: "tagField", label: "标签字段", control: "field", fieldTypes: ["category"], section: "列表", hint: "显示为带颜色的标签" },
      { key: "titleField", label: "标题字段", control: "field", section: "列表" },
      { key: "metaFields", label: "补充信息字段", control: "fields", section: "列表" },
      { key: "statusField", label: "状态字段", control: "field", fieldTypes: ["category"], allowEmpty: true, section: "列表" },
      { key: "autoScroll", label: "自动滚动", control: "switch", section: "列表" },
    ],
  },
  title: {
    label: "大屏标题",
    group: "decor",
    size: [900, 84],
    binding: "none",
    style: { text: "矿山安全生产指挥大屏", subtitle: "", fontSize: 38, letterSpacing: 8, align: "center", decoration: "strata", color: "text" },
    schema: [
      { key: "text", label: "标题文字", control: "text", section: "文字" },
      { key: "subtitle", label: "副标题", control: "text", section: "文字" },
      { key: "fontSize", label: "字号", control: "number", min: 14, max: 120, section: "文字" },
      { key: "letterSpacing", label: "字间距", control: "number", min: 0, max: 40, section: "文字" },
      { key: "align", label: "对齐", control: "select", options: [["left", "居左"], ["center", "居中"]], section: "文字" },
      { key: "color", label: "颜色", control: "color", section: "文字" },
      { key: "decoration", label: "装饰", control: "select", options: [["strata", "两侧渐隐线"], ["underline", "下划线"], ["none", "无"]], section: "文字" },
    ],
  },
  text: {
    label: "文本",
    group: "decor",
    size: [320, 80],
    binding: "none",
    style: { text: "在右侧输入说明文字", fontSize: 16, weight: 400, align: "left", lineHeight: 1.6, color: "muted" },
    schema: [
      { key: "text", label: "内容", control: "textarea", section: "文字" },
      { key: "fontSize", label: "字号", control: "number", min: 10, max: 120, section: "文字" },
      { key: "weight", label: "粗细", control: "select", options: [[400, "常规"], [600, "加粗"]], section: "文字" },
      { key: "align", label: "对齐", control: "select", options: [["left", "居左"], ["center", "居中"], ["right", "居右"]], section: "文字" },
      { key: "lineHeight", label: "行高", control: "number", min: 1, max: 3, step: 0.1, section: "文字" },
      { key: "color", label: "颜色", control: "color", section: "文字" },
    ],
  },
  clock: {
    label: "当前时间",
    group: "decor",
    size: [360, 48],
    binding: "none",
    style: { format: "full", fontSize: 22, align: "right", color: "muted" },
    schema: [
      { key: "format", label: "显示内容", control: "select", options: [["full", "日期 + 星期 + 时间"], ["date", "仅日期"], ["time", "仅时间"]], section: "文字" },
      { key: "fontSize", label: "字号", control: "number", min: 10, max: 120, section: "文字" },
      { key: "align", label: "对齐", control: "select", options: [["left", "居左"], ["center", "居中"], ["right", "居右"]], section: "文字" },
      { key: "color", label: "颜色", control: "color", section: "文字" },
    ],
  },
  border: {
    label: "装饰边框",
    group: "decor",
    size: [480, 320],
    binding: "none",
    style: { variant: "shaft", title: "" },
    schema: [
      { key: "variant", label: "样式", control: "select", options: [["shaft", "左侧刻度线"], ["corner", "四角标记"], ["glow", "柔光背景"], ["line", "细线"]], section: "边框" },
      { key: "title", label: "边框标题", control: "text", placeholder: "可不填", section: "边框" },
    ],
  },
  image: {
    label: "图片",
    group: "decor",
    size: [320, 200],
    binding: "none",
    style: { src: "", fit: "cover", radius: 0, opacity: 1 },
    schema: [
      { key: "src", label: "图片", control: "image", section: "图片" },
      { key: "fit", label: "填充方式", control: "select", options: [["cover", "裁剪铺满"], ["contain", "完整显示"], ["fill", "拉伸"]], section: "图片" },
      { key: "radius", label: "圆角", control: "number", min: 0, max: 200, section: "图片" },
      { key: "opacity", label: "不透明度", control: "number", min: 0, max: 1, step: 0.1, section: "图片" },
    ],
  },
  filter: {
    label: "筛选器",
    group: "control",
    size: [420, 44],
    binding: "none",
    style: {
      kind: "time",
      label: "时间范围",
      options: ["today", "last7", "last30", "last90"],
      defaultValue: "last30",
      datasetId: "",
      field: "",
    },
    schema: [
      { key: "kind", label: "筛选对象", control: "select", options: [["time", "时间范围"], ["department", "部门"], ["app", "所属应用"], ["field", "指定字段"]], section: "筛选" },
      { key: "label", label: "显示名称", control: "text", section: "筛选" },
      { key: "options", label: "可选时间范围", control: "timePresets", section: "筛选", when: (style) => style.kind === "time" },
      { key: "defaultValue", label: "默认范围", control: "timePreset", section: "筛选", when: (style) => style.kind === "time" },
      { key: "datasetId", label: "数据集", control: "dataset", section: "筛选", when: (style) => style.kind === "field" },
      { key: "field", label: "字段", control: "field", fieldTypes: ["category"], datasetKey: "datasetId", section: "筛选", when: (style) => style.kind === "field" },
    ],
  },
};

export const WIDGET_ORDER = [
  "bar", "line", "pie", "radar", "funnel", "gauge",
  "metric", "progress",
  "rank", "table", "ticker",
  "title", "text", "clock", "border", "image",
  "filter",
];

export function getWidgetType(type) {
  return WIDGET_TYPES[type] ?? null;
}

// A colour setting is either a colour value ("#3fc5d8") the user picked, or the name of one
// of the screen theme's own colours, which is what "默认" means in the designer.
export function resolveTone(theme, tone) {
  if (typeof tone === "string" && tone.startsWith("#")) return tone;
  return theme[tone] ?? theme.accent;
}
