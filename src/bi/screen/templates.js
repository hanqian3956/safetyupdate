// Built-in screens. They replace the four hard-coded dashboards the workbench used to ship
// and double as starting points for new screens.

import { createScreen, createWidget } from "./model.js";

const count = (label, where) => ({ field: "*", agg: "count", ...(label ? { label } : {}), ...(where ? { where } : {}) });
const sum = (field, label) => ({ field, agg: "sum", ...(label ? { label } : {}) });
const avg = (field, label) => ({ field, agg: "avg", ...(label ? { label } : {}) });
const isIn = (field, ...value) => ({ field, op: "in", value });
const byDay = (field) => ({ field, granularity: "day" });

// 1920 × 1080 layout: three columns under a header strip.
const L = 24;
const C = 492;
const R = 1444;
const SIDE = 452;
const MID = 936;
const HALF = 460;
const TOP = 104;
const CARD = 222;
const cardX = (index) => C + index * (CARD + 16);

function header(title, subtitle, defaultRange = "last30") {
  return [
    ["filter", [L, 32, SIDE, 40], { kind: "time", label: "统计范围", options: ["today", "last7", "last30", "last90"], defaultValue: defaultRange }],
    ["title", [C, 12, MID, 78], { text: title, subtitle, fontSize: 38, letterSpacing: 8 }],
    ["clock", [R, 34, SIDE, 36], { format: "full", fontSize: 20, align: "right" }],
  ];
}

function build({ id, name, description, theme, items }) {
  return createScreen({
    id,
    name,
    description,
    theme,
    status: "published",
    publishedAt: Date.now(),
    builtin: true,
    widgets: items.map(([type, [x, y, w, h], style, data, interaction], index) =>
      createWidget(type, { id: `${id}-w${index + 1}`, name: style?.title || style?.text || undefined, x, y, w, h, style, data, interaction })),
  });
}

const HAZARD_FOUND = isIn("result", "发现隐患");
const OPEN_ALERTS = isIn("status", "待处置", "处置中", "超期未处置");
const CLOSED_ALERTS = isIn("status", "已处置", "已关闭");

// 安全风险总览汇总双重预防的岗位隐患排查与任务执行产生的日常巡检预警，确保顶部指标、
// 风险分布、预警播报与右上实时提示使用同一份预警范围。
function safetyScreen() {
  const FROM_SAFETY_FORMS = isIn("sourceForm", "岗位隐患排查表", "日常巡检表");
  return build({
    id: "tpl-safety",
    name: "安全风险总览",
    description: "隐患排查、隐患触发的预警与整改闭环",
    theme: "shaft",
    items: [
      ...header("安全风险总览", "双重预防机制 · 隐患排查、预警与整改"),

      ["pie", [L, TOP, SIDE, 300], { title: "预警风险等级分布", legend: "right" },
        { datasetId: "alert_record", dimensions: [{ field: "riskLevel" }], measures: [count("预警数")], filters: [FROM_SAFETY_FORMS] }],
      ["bar", [L, 420, SIDE, 300], { title: "隐患类别分布", horizontal: true, showLabel: true },
        { datasetId: "form_hazard", dimensions: [{ field: "hazardType" }], measures: [count("隐患记录")], filters: [HAZARD_FOUND] }],
      ["progress", [L, 736, 218, 320], { title: "隐患整改率", color: "good" },
        { datasetId: "form_hazard", dimensions: [], measures: [count("已整改", [isIn("rectifyStatus", "已整改")]), count("发现隐患", [HAZARD_FOUND])], filters: [] }],
      ["progress", [L + 234, 736, 218, 320], { title: "预警按时处置率", color: "accent2" },
        { datasetId: "alert_record", dimensions: [], measures: [count("按时处置", [CLOSED_ALERTS, isIn("overdue", "否")]), count("应处置", [isIn("status", "已处置", "已关闭", "超期未处置")])], filters: [FROM_SAFETY_FORMS] }],

      ["metric", [cardX(0), TOP, CARD, 140], { title: "排查记录" },
        { datasetId: "form_hazard", dimensions: [byDay("submittedAt")], measures: [count("排查记录")], filters: [] }],
      ["metric", [cardX(1), TOP, CARD, 140], { title: "发现隐患" },
        { datasetId: "form_hazard", dimensions: [byDay("submittedAt")], measures: [count("发现隐患")], filters: [HAZARD_FOUND] }],
      ["metric", [cardX(2), TOP, CARD, 140], { title: "触发预警" },
        { datasetId: "alert_record", dimensions: [byDay("triggeredAt")], measures: [count("预警数")], filters: [FROM_SAFETY_FORMS] }],
      ["metric", [cardX(3), TOP, CARD, 140], { title: "未闭环预警", valueColor: "bad", sparkline: false, compare: false },
        { datasetId: "alert_record", dimensions: [], measures: [count("未闭环")], filters: [FROM_SAFETY_FORMS, OPEN_ALERTS] }],

      ["line", [C, 260, MID, 380], { title: "隐患排查趋势" },
        { datasetId: "form_hazard", dimensions: [byDay("submittedAt")], measures: [count("排查记录"), count("发现隐患", [HAZARD_FOUND])], filters: [] }],
      ["bar", [C, 656, HALF, 400], { title: "各作业地点隐患等级", stacked: true, legend: "top" },
        { datasetId: "form_hazard", dimensions: [{ field: "location" }, { field: "hazardLevel" }], measures: [count("隐患记录")], filters: [HAZARD_FOUND], sort: { by: "measure", order: "desc" }, limit: 8 },
        { drill: [{ field: "post" }] }],
      ["rank", [C + HALF + 16, 656, HALF, 400], { title: "部门隐患排行" },
        { datasetId: "form_hazard", dimensions: [{ field: "department" }], measures: [count("隐患记录")], filters: [HAZARD_FOUND], sort: { by: "measure", order: "desc" }, limit: 8 },
        { drill: [{ field: "submitter" }] }],

      ["ticker", [R, TOP, SIDE, 500], { title: "预警播报" },
        { datasetId: "alert_record", columns: [], filters: [FROM_SAFETY_FORMS], sortField: "triggeredAt", order: "desc", limit: 20 }],
      ["bar", [R, 620, SIDE, 436], { title: "预警事故类型", horizontal: true, showLabel: true },
        { datasetId: "alert_record", dimensions: [{ field: "accidentType" }], measures: [count("预警数")], filters: [FROM_SAFETY_FORMS], sort: { by: "measure", order: "desc" }, limit: 7 }],
    ],
  });
}

function deviceScreen() {
  const ABNORMAL = isIn("result", "异常");
  return build({
    id: "tpl-device",
    name: "设备运行态势",
    description: "关键设备运行状态、点检执行与故障分布",
    theme: "daylight",
    items: [
      ...header("设备运行态势", "设备点检 · 异常与检修"),

      ["gauge", [L, TOP, SIDE, 300], { title: "设备完好率", valueMode: "ratio", color: "good" },
        { datasetId: "form_equipment", dimensions: [], measures: [count("点检正常", [isIn("result", "正常")]), count("点检次数")], filters: [] }],
      ["pie", [L, 420, SIDE, 300], { title: "异常类型分布", legend: "right" },
        { datasetId: "form_equipment", dimensions: [{ field: "faultType" }], measures: [count("异常次数")], filters: [ABNORMAL] }],
      ["bar", [L, 736, SIDE, 320], { title: "各类设备异常次数", showLabel: true },
        { datasetId: "form_equipment", dimensions: [{ field: "equipmentType" }], measures: [count("异常次数")], filters: [ABNORMAL], sort: { by: "measure", order: "desc" } }],

      ["metric", [cardX(0), TOP, CARD, 140], { title: "点检次数" },
        { datasetId: "form_equipment", dimensions: [byDay("submittedAt")], measures: [count("点检次数")], filters: [] }],
      ["metric", [cardX(1), TOP, CARD, 140], { title: "异常次数", valueColor: "bad" },
        { datasetId: "form_equipment", dimensions: [byDay("submittedAt")], measures: [count("异常次数")], filters: [ABNORMAL] }],
      ["metric", [cardX(2), TOP, CARD, 140], { title: "累计停机", compact: true },
        { datasetId: "form_equipment", dimensions: [byDay("submittedAt")], measures: [sum("downtimeMinutes", "停机时长")], filters: [] }],
      ["metric", [cardX(3), TOP, CARD, 140], { title: "平均运行温度", sparkline: false },
        { datasetId: "form_equipment", dimensions: [], measures: [avg("temperature", "平均温度")], filters: [] }],

      ["line", [C, 260, MID, 380], { title: "各类设备平均运行温度", area: false, legend: "top" },
        { datasetId: "form_equipment", dimensions: [byDay("submittedAt"), { field: "equipmentType" }], measures: [avg("temperature", "平均温度")], filters: [] }],
      ["bar", [C, 656, HALF, 400], { title: "每日异常次数" },
        { datasetId: "form_equipment", dimensions: [byDay("submittedAt")], measures: [count("异常次数")], filters: [ABNORMAL] }],
      ["bar", [C + HALF + 16, 656, HALF, 400], { title: "设备停机时长排行", horizontal: true, showLabel: true },
        { datasetId: "form_equipment", dimensions: [{ field: "equipment" }], measures: [sum("downtimeMinutes", "停机时长")], filters: [], sort: { by: "measure", order: "desc" }, limit: 8 }],

      ["rank", [R, TOP, SIDE, 400], { title: "设备异常排行" },
        { datasetId: "form_equipment", dimensions: [{ field: "equipment" }], measures: [count("异常次数")], filters: [ABNORMAL], sort: { by: "measure", order: "desc" }, limit: 8 },
        { drill: [{ field: "faultType" }] }],
      ["table", [R, 520, SIDE, 536], { title: "设备检修任务" },
        { datasetId: "task_record", columns: ["publishedAt", "taskName", "executor", "status"], filters: [isIn("taskType", "设备检修")], sortField: "publishedAt", order: "desc", limit: 30 }],
    ],
  });
}

function productionScreen() {
  return build({
    id: "tpl-production",
    name: "生产进度跟踪",
    description: "产量计划、班组进度与生产指标完成情况",
    theme: "lamp",
    items: [
      ...header("生产进度跟踪", "生产日报 · 计划与实际"),

      ["gauge", [L, TOP, SIDE, 300], { title: "产量达成率", valueMode: "ratio", max: 120 },
        { datasetId: "form_production", dimensions: [], measures: [sum("actualOutput", "实际产量"), sum("planOutput", "计划产量")], filters: [] }],
      ["bar", [L, 420, SIDE, 320], { title: "各工序计划与实际", legend: "top" },
        { datasetId: "form_production", dimensions: [{ field: "process" }], measures: [sum("planOutput", "计划"), sum("actualOutput", "实际")], filters: [] }],
      ["pie", [L, 756, SIDE, 300], { title: "火工品领用构成", legend: "right" },
        { datasetId: "form_explosive", dimensions: [{ field: "material" }], measures: [count("领用次数")], filters: [] }],

      ["metric", [cardX(0), TOP, CARD, 140], { title: "实际产量", compact: true },
        { datasetId: "form_production", dimensions: [byDay("submittedAt")], measures: [sum("actualOutput", "实际产量")], filters: [] }],
      ["metric", [cardX(1), TOP, CARD, 140], { title: "计划产量", compact: true, valueColor: "text" },
        { datasetId: "form_production", dimensions: [byDay("submittedAt")], measures: [sum("planOutput", "计划产量")], filters: [] }],
      ["metric", [cardX(2), TOP, CARD, 140], { title: "掘进进尺" },
        { datasetId: "form_production", dimensions: [byDay("submittedAt")], measures: [{ field: "footage", agg: "sum", label: "掘进进尺", decimals: 0 }], filters: [] }],
      ["metric", [cardX(3), TOP, CARD, 140], { title: "班均出勤", sparkline: false, valueColor: "text" },
        { datasetId: "form_production", dimensions: [], measures: [{ field: "attendance", agg: "avg", label: "班均出勤", decimals: 1 }], filters: [] }],

      ["line", [C, 260, MID, 380], { title: "计划与实际产量趋势", legend: "top" },
        { datasetId: "form_production", dimensions: [byDay("submittedAt")], measures: [sum("planOutput", "计划产量"), sum("actualOutput", "实际产量")], filters: [] }],
      ["bar", [C, 656, HALF, 400], { title: "各班次产量构成", stacked: true, legend: "top" },
        { datasetId: "form_production", dimensions: [{ field: "shift" }, { field: "process" }], measures: [sum("actualOutput", "实际产量")], filters: [] }],
      ["line", [C + HALF + 16, 656, HALF, 400], { title: "矿石品位趋势（周）", area: false, showSymbol: true, legend: "top" },
        { datasetId: "form_production", dimensions: [{ field: "submittedAt", granularity: "week" }, { field: "process" }], measures: [avg("grade", "平均品位")], filters: [isIn("process", "采矿", "选矿")], ignoreGlobal: true }],

      ["rank", [R, TOP, SIDE, 400], { title: "班组产量排行" },
        { datasetId: "form_production", dimensions: [{ field: "team" }], measures: [sum("actualOutput", "实际产量")], filters: [], sort: { by: "measure", order: "desc" }, limit: 8 }],
      ["table", [R, 520, SIDE, 536], { title: "最新生产日报" },
        { datasetId: "form_production", columns: ["submittedAt", "team", "planOutput", "actualOutput"], filters: [], sortField: "submittedAt", order: "desc", limit: 30 }],
    ],
  });
}

function emergencyScreen() {
  const DRILL_TASKS = isIn("taskType", "培训演练");
  return build({
    id: "tpl-emergency",
    name: "应急管理看板",
    description: "预警响应、应急演练和消防巡检情况",
    theme: "shaft",
    items: [
      ...header("应急管理看板", "预警响应 · 演练与消防"),

      ["funnel", [L, TOP, SIDE, 300], { title: "预警处置状态" },
        { datasetId: "alert_record", dimensions: [{ field: "status" }], measures: [count("预警数")], filters: [], sort: { by: "measure", order: "desc" } }],
      ["progress", [L, 420, 218, 300], { title: "预警按时处置率", color: "accent2" },
        { datasetId: "alert_record", dimensions: [], measures: [count("按时处置", [CLOSED_ALERTS, isIn("overdue", "否")]), count("应处置", [isIn("status", "已处置", "已关闭", "超期未处置")])], filters: [] }],
      ["progress", [L + 234, 420, 218, 300], { title: "演练任务完成率", color: "good" },
        { datasetId: "task_record", dimensions: [], measures: [count("已完成", [isIn("status", "已完成")]), count("演练任务")], filters: [DRILL_TASKS] }],
      ["pie", [L, 736, SIDE, 320], { title: "消防巡检问题类型", legend: "right" },
        { datasetId: "form_fire", dimensions: [{ field: "issue" }], measures: [count("不合格项")], filters: [isIn("result", "不合格")] }],

      ["metric", [cardX(0), TOP, CARD, 140], { title: "预警总数" },
        { datasetId: "alert_record", dimensions: [byDay("triggeredAt")], measures: [count("预警数")], filters: [] }],
      ["metric", [cardX(1), TOP, CARD, 140], { title: "一级预警", valueColor: "bad" },
        { datasetId: "alert_record", dimensions: [byDay("triggeredAt")], measures: [count("一级预警")], filters: [isIn("riskLevel", "一级")] }],
      ["metric", [cardX(2), TOP, CARD, 140], { title: "平均处置耗时", sparkline: false, valueColor: "text" },
        { datasetId: "alert_record", dimensions: [], measures: [avg("handleHours", "平均处置耗时")], filters: [] }],
      ["metric", [cardX(3), TOP, CARD, 140], { title: "超期预警", valueColor: "bad", sparkline: false },
        { datasetId: "alert_record", dimensions: [], measures: [count("超期预警")], filters: [isIn("overdue", "是")] }],

      ["bar", [C, 260, MID, 380], { title: "每日预警数（按风险等级）", stacked: true, legend: "top" },
        { datasetId: "alert_record", dimensions: [byDay("triggeredAt"), { field: "riskLevel" }], measures: [count("预警数")], filters: [] }],
      ["bar", [C, 656, HALF, 400], { title: "各部门预警数", horizontal: true, stacked: true, legend: "top" },
        { datasetId: "alert_record", dimensions: [{ field: "department" }, { field: "riskLevel" }], measures: [count("预警数")], filters: [], sort: { by: "measure", order: "desc" } }],
      ["bar", [C + HALF + 16, 656, HALF, 400], { title: "动火作业审批情况", stacked: true, legend: "top" },
        { datasetId: "form_hotwork", dimensions: [{ field: "level" }, { field: "approvalStatus" }], measures: [count("申请数")], filters: [] }],

      ["ticker", [R, TOP, SIDE, 400], { title: "未闭环预警" },
        { datasetId: "alert_record", columns: [], filters: [OPEN_ALERTS], sortField: "triggeredAt", order: "desc", limit: 20, ignoreGlobal: true }],
      ["table", [R, 520, SIDE, 536], { title: "应急演练与培训" },
        { datasetId: "task_record", columns: ["publishedAt", "taskName", "executor", "status"], filters: [DRILL_TASKS], sortField: "publishedAt", order: "desc", limit: 30, ignoreGlobal: true }],
    ],
  });
}

export function buildTemplates() {
  return [safetyScreen(), deviceScreen(), productionScreen(), emergencyScreen()];
}
