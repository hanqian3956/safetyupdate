// Dataset catalogue. A dataset is what an application module (表单 / 流程 / 任务 / 预警)
// accumulates as users submit data; BI widgets only ever read these.
//
// Each worksheet of an application is one dataset (one row per submission). 流程实例、任务执行
// 记录、预警记录 are recorded by the platform itself and span every application; their rows
// point back at the form record they belong to (row.sourceDataset + row.sourceNo), which is
// what lets a click on one chart narrow the others down to the related records.

export const TONE = {
  good: "#3fbf8f",
  info: "#3b8eea",
  wait: "#f2b84b",
  warn: "#f08c3a",
  bad: "#e5484d",
  mute: "#8a97a6",
};

// 风险四色：红 / 橙 / 黄 / 蓝，对应一级到四级。
export const RISK_COLORS = {
  一级: "#e5484d",
  二级: "#f08c3a",
  三级: "#f2c94c",
  四级: "#3b8eea",
};

export const MODULES = [
  { id: "form", label: "表单", hint: "工作表提交记录", grain: "用户每提交一次表单，产生一条记录" },
  { id: "flow", label: "流程", hint: "审批流程实例", grain: "每发起一次流程，产生一条记录，状态随审批推进更新" },
  { id: "task", label: "任务", hint: "任务执行记录", grain: "任务每生成一次执行，产生一条记录，状态随执行情况更新" },
  { id: "alert", label: "预警", hint: "预警触发与处置", grain: "预警规则每触发一次，产生一条记录，状态随处置情况更新" },
];

/** 流程、任务、预警由平台统一记录，不属于某一个应用。 */
export const PLATFORM_GROUP = "平台数据";

export const DEPARTMENTS = [
  "安全管理部",
  "生产管理部",
  "设备管理部",
  "机电管理部",
  "综合管理部",
  "采矿车间",
  "掘进工区",
  "选矿车间",
];

export const APPS = [
  "双重预防机制",
  "安全管理",
  "设备管理",
  "火工品管理",
  "生产管理",
  "机电管理",
  "消防管理",
  "应急管理",
];

export const SHIFTS = ["早班", "中班", "晚班"];

const category = (key, label, control, options, extra = {}) => ({
  key,
  label,
  type: "category",
  control,
  options,
  ...extra,
});
const number = (key, label, unit = "", decimals = 0, extra = {}) => ({
  key,
  label,
  type: "number",
  control: "数字",
  unit,
  decimals,
  ...extra,
});
const datetime = (key, label, extra = {}) => ({ key, label, type: "datetime", control: "日期时间", ...extra });
const text = (key, label, control = "单行文本") => ({ key, label, type: "text", control });

const person = (key, label) => ({ key, label, type: "category", control: "成员" });
const department = (label = "所属部门") => category("department", label, "部门", DEPARTMENTS);
const app = () => category("app", "所属应用", "系统字段", APPS, { system: true });
// The form record a flow / task / alert belongs to.
const sourceForm = (label) => category("sourceForm", label, "系统字段", undefined, { system: true });
const sourceNo = (label) => ({ ...text("sourceNo", label, "系统字段"), system: true });
const YES_NO_ALERT = { 是: TONE.bad, 否: TONE.good };
const APPROVAL_COLORS = { 审批中: TONE.info, 已通过: TONE.good, 已拒绝: TONE.bad, 已驳回: TONE.warn, 已撤销: TONE.mute };

export const DATASETS = [
  {
    id: "form_hazard",
    name: "岗位隐患排查表",
    module: "form",
    app: "双重预防机制",
    description: "一线岗位每班提交的隐患排查结果与整改进度",
    timeField: "submittedAt",
    titleField: "location",
    fields: [
      datetime("submittedAt", "提交时间", { system: true }),
      person("submitter", "提交人"),
      department(),
      app(),
      category("shift", "班次", "单选按钮组", SHIFTS, { ordered: true }),
      category("location", "作业地点", "下拉单选"),
      category("post", "岗位", "下拉单选"),
      category("result", "排查结果", "单选按钮组", ["正常", "发现隐患"], {
        colors: { 正常: TONE.good, 发现隐患: TONE.warn },
      }),
      number("hazardCount", "隐患数量", "项"),
      category("hazardType", "隐患类别", "下拉单选", ["设备设施", "作业环境", "个体防护", "安全管理", "无"]),
      category("hazardLevel", "隐患等级", "单选按钮组", ["重大隐患", "较大隐患", "一般隐患", "无"], {
        ordered: true,
        colors: { 重大隐患: TONE.bad, 较大隐患: TONE.warn, 一般隐患: "#f2c94c", 无: TONE.mute },
      }),
      category("rectifyStatus", "整改状态", "单选按钮组", ["待整改", "整改中", "已整改", "已逾期", "无需整改"], {
        ordered: true,
        colors: { 待整改: TONE.wait, 整改中: TONE.info, 已整改: TONE.good, 已逾期: TONE.bad, 无需整改: TONE.mute },
      }),
      number("rectifyHours", "整改耗时", "小时", 1),
    ],
  },
  {
    id: "form_equipment",
    name: "设备点检记录表",
    module: "form",
    app: "设备管理",
    description: "关键设备每日点检的运行参数与异常情况",
    timeField: "submittedAt",
    titleField: "equipment",
    fields: [
      datetime("submittedAt", "点检时间", { system: true }),
      person("submitter", "点检人"),
      department(),
      app(),
      category("equipment", "设备名称", "下拉单选"),
      category("equipmentType", "设备类别", "下拉单选", ["破碎磨矿", "提升运输", "排水", "通风", "采掘", "动力"]),
      category("result", "点检结果", "单选按钮组", ["正常", "异常"], {
        colors: { 正常: TONE.good, 异常: TONE.bad },
      }),
      category("faultType", "异常类型", "下拉单选", ["振动超标", "温度偏高", "漏油", "异响", "紧固松动", "仪表失灵", "无"]),
      number("temperature", "运行温度", "℃", 1),
      number("vibration", "振动值", "mm/s", 1),
      number("runHours", "运行时长", "小时", 1),
      number("downtimeMinutes", "停机时长", "分钟"),
    ],
  },
  {
    id: "form_production",
    name: "生产日报",
    module: "form",
    app: "生产管理",
    description: "各班组每日填报的计划与实际产量",
    timeField: "submittedAt",
    titleField: "team",
    fields: [
      datetime("submittedAt", "填报时间", { system: true }),
      person("submitter", "填报人"),
      department(),
      app(),
      category("team", "班组", "下拉单选"),
      category("process", "工序", "下拉单选", ["采矿", "掘进", "选矿", "运输", "充填"], { ordered: true }),
      category("shift", "班次", "单选按钮组", SHIFTS, { ordered: true }),
      number("planOutput", "计划产量", "吨"),
      number("actualOutput", "实际产量", "吨"),
      number("footage", "掘进进尺", "米", 1),
      number("attendance", "出勤人数", "人"),
      number("machineHours", "设备台时", "小时", 1),
      number("grade", "矿石品位", "%", 2),
    ],
  },
  {
    id: "form_explosive",
    name: "火工品领用登记表",
    module: "form",
    app: "火工品管理",
    description: "炸药、雷管的领用、使用与退库登记",
    timeField: "submittedAt",
    titleField: "material",
    fields: [
      datetime("submittedAt", "领用时间", { system: true }),
      person("submitter", "领用人"),
      department(),
      app(),
      category("material", "品类", "下拉单选", ["乳化炸药", "导爆管雷管", "电子雷管", "导爆索"]),
      category("unit", "计量单位", "系统字段", ["kg", "发", "米"]),
      category("location", "爆破地点", "下拉单选"),
      category("shift", "班次", "单选按钮组", SHIFTS, { ordered: true }),
      number("issuedQty", "领用数量"),
      number("usedQty", "使用数量"),
      number("returnedQty", "退库数量"),
      category("matched", "账物相符", "单选按钮组", ["是", "否"], { colors: { 是: TONE.good, 否: TONE.bad } }),
    ],
  },
  {
    id: "form_fire",
    name: "消防设施巡检表",
    module: "form",
    app: "消防管理",
    description: "各区域消防设施的巡检结果",
    timeField: "submittedAt",
    titleField: "area",
    fields: [
      datetime("submittedAt", "巡检时间", { system: true }),
      person("submitter", "巡检人"),
      department(),
      app(),
      category("area", "巡检区域", "下拉单选"),
      category("facility", "设施类型", "下拉单选", ["灭火器", "消火栓", "应急照明", "烟感报警", "疏散标志", "消防水泵"]),
      category("result", "巡检结果", "单选按钮组", ["合格", "不合格"], {
        colors: { 合格: TONE.good, 不合格: TONE.bad },
      }),
      category("issue", "问题类型", "下拉单选", ["压力不足", "过期", "缺失", "损坏", "遮挡", "无"]),
      number("checkedCount", "检查数量", "个"),
      number("failedCount", "不合格数量", "个"),
    ],
  },
  {
    id: "form_inspection",
    name: "日常巡检表",
    module: "form",
    app: "安全管理",
    description: "井下作业面每日巡检：环境检测、设备运行与防护设施检查",
    timeField: "submittedAt",
    titleField: "location",
    fields: [
      datetime("submittedAt", "巡检时间", { system: true }),
      person("submitter", "巡检人"),
      department(),
      app(),
      category("location", "巡检区域", "下拉单选"),
      category("shift", "班次", "单选按钮组", SHIFTS, { ordered: true }),
      number("co", "CO 浓度", "ppm"),
      number("roof", "顶板离层量", "mm"),
      number("temp", "设备温度", "℃"),
      category("fan", "风机运行状态", "单选按钮组", ["正常", "故障"], { colors: { 正常: TONE.good, 故障: TONE.bad } }),
      category("guard", "防护栏状态", "单选按钮组", ["完好", "缺失"], { colors: { 完好: TONE.good, 缺失: TONE.bad } }),
      category("alerted", "是否触发预警", "系统字段", ["是", "否"], { colors: YES_NO_ALERT, system: true }),
      category("approvalStatus", "审批状态", "系统字段", ["审批中", "已通过", "已拒绝", "已驳回", "已撤销"], {
        ordered: true,
        colors: APPROVAL_COLORS,
        system: true,
      }),
      text("note", "异常情况说明", "多行文本"),
    ],
  },
  {
    id: "form_hotwork",
    name: "动火作业申请表",
    module: "form",
    app: "安全管理",
    description: "动火作业的申请与审批结果",
    timeField: "submittedAt",
    titleField: "location",
    fields: [
      datetime("submittedAt", "申请时间", { system: true }),
      person("submitter", "申请人"),
      department(),
      app(),
      category("level", "作业级别", "单选按钮组", ["特级", "一级", "二级"], {
        ordered: true,
        colors: { 特级: TONE.bad, 一级: TONE.warn, 二级: TONE.info },
      }),
      category("workType", "作业类型", "下拉单选", ["电焊", "气割", "打磨", "喷灯"]),
      category("location", "作业地点", "下拉单选"),
      person("guardian", "监护人"),
      number("durationHours", "作业时长", "小时", 1),
      category("approvalStatus", "审批状态", "系统字段", ["审批中", "已通过", "已拒绝", "已撤销"], {
        ordered: true,
        colors: { 审批中: TONE.info, 已通过: TONE.good, 已拒绝: TONE.bad, 已撤销: TONE.mute },
      }),
      category("overtime", "超时作业", "单选按钮组", ["是", "否"], { colors: { 是: TONE.bad, 否: TONE.good } }),
    ],
  },
  {
    id: "flow_instance",
    name: "流程实例",
    module: "flow",
    app: PLATFORM_GROUP,
    description: "各应用发起的审批流程及其流转结果",
    timeField: "startedAt",
    titleField: "flowName",
    fields: [
      text("flowNo", "流程编号", "自动编号"),
      category("flowName", "流程名称", "系统字段"),
      app(),
      sourceForm("关联表单"),
      sourceNo("关联记录编号"),
      category("category", "流程分类", "系统字段", ["人事管理", "财务管理", "安全管理", "生产管理", "设备管理", "综合管理"]),
      person("initiator", "发起人"),
      department("发起部门"),
      datetime("startedAt", "发起时间", { system: true }),
      category("currentNode", "当前节点", "系统字段"),
      category("status", "流程状态", "系统字段", ["审批中", "已通过", "已拒绝", "已驳回", "已撤销"], {
        ordered: true,
        colors: { 审批中: TONE.info, 已通过: TONE.good, 已拒绝: TONE.bad, 已驳回: TONE.warn, 已撤销: TONE.mute },
      }),
      category("urgency", "紧急程度", "系统字段", ["常规", "紧急"], { colors: { 常规: TONE.info, 紧急: TONE.bad } }),
      number("nodeCount", "审批节点数", "个"),
      number("durationHours", "审批耗时", "小时", 1),
      category("overtime", "是否超时", "系统字段", ["是", "否"], { colors: { 是: TONE.bad, 否: TONE.good } }),
    ],
  },
  {
    id: "task_record",
    name: "任务执行记录",
    module: "task",
    app: PLATFORM_GROUP,
    description: "任务从发布到完成的执行情况",
    timeField: "publishedAt",
    titleField: "taskName",
    fields: [
      text("taskNo", "任务编号", "自动编号"),
      category("taskName", "任务名称", "系统字段"),
      category("taskType", "任务类型", "系统字段", ["隐患排查", "隐患整改", "设备点检", "设备检修", "巡检", "培训演练", "资料报送"]),
      category("source", "任务来源", "系统字段", ["周期任务", "临时任务", "隐患整改", "预警派发"]),
      app(),
      sourceForm("关联表单"),
      sourceNo("关联记录编号"),
      person("publisher", "发布人"),
      person("executor", "执行人"),
      department("执行部门"),
      datetime("publishedAt", "发布时间", { system: true }),
      datetime("deadline", "截止时间"),
      datetime("finishedAt", "完成时间"),
      category("status", "任务状态", "系统字段", ["待执行", "执行中", "已完成", "已超期", "已撤回"], {
        ordered: true,
        colors: { 待执行: TONE.wait, 执行中: TONE.info, 已完成: TONE.good, 已超期: TONE.bad, 已撤回: TONE.mute },
      }),
      category("overdue", "是否超期", "系统字段", ["是", "否"], { colors: { 是: TONE.bad, 否: TONE.good } }),
      number("spentHours", "完成耗时", "小时", 1),
    ],
  },
  {
    id: "alert_record",
    name: "预警记录",
    module: "alert",
    app: PLATFORM_GROUP,
    description: "预警规则触发的预警及处置结果",
    timeField: "triggeredAt",
    titleField: "content",
    fields: [
      text("alertNo", "预警编号", "自动编号"),
      category("content", "预警内容", "系统字段"),
      category("rule", "预警规则", "系统字段"),
      sourceForm("来源表单"),
      sourceNo("来源记录编号"),
      app(),
      category("riskLevel", "风险等级", "系统字段", ["一级", "二级", "三级", "四级"], {
        ordered: true,
        colors: RISK_COLORS,
      }),
      category("accidentType", "事故类型", "系统字段", [
        "物体打击",
        "高处坠落",
        "冒顶片帮",
        "中毒窒息",
        "放炮",
        "触电",
        "火灾",
        "灼烫",
        "机械伤害",
        "坍塌",
        "其他",
      ]),
      category("location", "发生位置", "系统字段"),
      datetime("triggeredAt", "触发时间", { system: true }),
      department("责任部门"),
      person("handler", "处置人"),
      category("status", "处置状态", "系统字段", ["待处置", "处置中", "已处置", "已关闭", "超期未处置"], {
        ordered: true,
        colors: { 待处置: TONE.wait, 处置中: TONE.info, 已处置: TONE.good, 已关闭: TONE.mute, 超期未处置: TONE.bad },
      }),
      category("overdue", "是否超期", "系统字段", ["是", "否"], { colors: { 是: TONE.bad, 否: TONE.good } }),
      number("handleHours", "处置耗时", "小时", 1),
    ],
  },
];

const datasetIndex = new Map(DATASETS.map((dataset) => [dataset.id, dataset]));

export function getDataset(id) {
  return datasetIndex.get(id) ?? null;
}

export function getField(dataset, key) {
  return dataset?.fields.find((field) => field.key === key) ?? null;
}

export function getModule(id) {
  return MODULES.find((module) => module.id === id) ?? MODULES[0];
}

/** 数据按「应用 › 工作表」分组，流程 / 任务 / 预警单列一组。用于数据列表和数据集下拉。 */
export const DATASET_GROUPS = [
  ...APPS.map((name) => ({
    id: name,
    label: name,
    kind: "app",
    datasets: DATASETS.filter((dataset) => dataset.module === "form" && dataset.app === name),
  })).filter((group) => group.datasets.length),
  {
    id: PLATFORM_GROUP,
    label: PLATFORM_GROUP,
    kind: "platform",
    hint: "覆盖全部应用",
    datasets: DATASETS.filter((dataset) => dataset.module !== "form"),
  },
];

export const FIELD_TYPE_LABEL = {
  category: "维度",
  number: "数值",
  datetime: "时间",
  text: "文本",
};
