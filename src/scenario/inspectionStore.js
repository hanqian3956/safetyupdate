// 日常巡检演示场景的数据层。
//
// 任务、预警、动态、工作表/流程是四个互不相通的 iframe 原型，各自的数据写死在页面里，
// 切换标签就会重置。这里是它们共用的一份数据：谁提交了巡检表、触发了哪些预警、流程走到哪、
// 动态号里记了什么。各原型加载时从这里取数，操作时写回这里（见 bridges/）。
//
// 数据只在内存里，刷新页面即回到初始状态，与原型其它部分一致。

const HOUR = 3600000;
const DAY = 86400000;
const pad = (value, length = 2) => String(value).padStart(length, "0");

export const INSPECTION_USER = { name: "张宇", dept: "安全管理部", avatar: "张" };

export const INSPECTION_FORM = {
  id: "form_daily_inspection",
  name: "日常巡检表",
  category: "安全管理",
  description: "井下作业面每日巡检：环境检测、设备运行与防护设施检查",
  createdDaysAgo: 5,
  fields: [
    { key: "area", label: "巡检区域", type: "select", required: true, options: ["南区 2# 采场", "西翼 3# 平巷", "东翼 1# 采场", "南区排水泵房", "北区提升机房"] },
    { key: "shift", label: "班次", type: "select", required: true, options: ["早班", "中班", "晚班"] },
    { key: "inspector", label: "巡检人", type: "member", auto: true },
    { key: "inspected_at", label: "巡检时间", type: "datetime", auto: true },
    { key: "co", label: "CO 浓度", type: "number", unit: "ppm", required: true, hint: "正常 ＜ 24 ppm" },
    { key: "roof", label: "顶板离层量", type: "number", unit: "mm", required: true, hint: "正常 ≤ 30 mm" },
    { key: "temp", label: "设备温度", type: "number", unit: "℃", required: true, hint: "正常 ≤ 80 ℃" },
    { key: "fan", label: "风机运行状态", type: "select", required: true, options: ["正常", "故障"] },
    { key: "guard", label: "防护栏状态", type: "select", required: true, options: ["完好", "缺失"] },
    { key: "note", label: "异常情况说明", type: "textarea", placeholder: "无异常可不填" },
    { key: "photos", label: "现场照片", type: "image" },
  ],
};

export const INSPECTION_FLOW = {
  id: "flow_daily_inspection",
  name: "日常巡检审批流程",
  category: "安全管理",
  application: "安全管理",
  description: "日常巡检表提交后由安全管理部审核，并抄送设备管理部",
  approvalNode: "安全管理部审批",
  approver: INSPECTION_USER.name,
  ccNode: "抄送设备管理部",
  ccMember: "陈伟",
};

export const INSPECTION_TASK = {
  name: "每日巡检任务",
  template: "日常巡检任务模板",
  initiator: INSPECTION_USER.name,
  executor: INSPECTION_USER.name,
  participant: "李明",
  workType: "巡检工",
  location: "南区 2# 采场、西翼 3# 平巷",
  description: "按《日常巡检表》逐项检查并如实填报，检测值超出正常范围会自动触发预警。",
  publishHour: 8,
};

// 规则里的「工作项」名称与表单字段名称一致，预警原型的条件下拉里也有这些选项。
export const INSPECTION_RULES = [
  {
    id: "RL-INSP-001",
    name: "日常巡检环境超限预警规则",
    deadlineHours: 4,
    conds: [
      { content: "CO 浓度超限预警", level: "二级", type: "中毒窒息", field: "co", logic: "大于等于", value: 24 },
      { content: "顶板离层超限预警", level: "一级", type: "冒顶片帮", field: "roof", logic: "大于", value: 30 },
    ],
  },
  {
    id: "RL-INSP-002",
    name: "日常巡检设备设施预警规则",
    deadlineHours: 8,
    conds: [
      { content: "设备温度超限预警", level: "一级", type: "灼烫", field: "temp", logic: "大于", value: 80 },
      { content: "通风设备故障预警", level: "二级", type: "中毒窒息", field: "fan", logic: "等于", value: "故障" },
      { content: "防护设施缺失预警", level: "三级", type: "高处坠落", field: "guard", logic: "等于", value: "缺失" },
    ],
  },
];

export const INSPECTION_FEED_NO = {
  id: "DTH-1004",
  name: "日常巡检动态号",
  category: "安全管理",
  desc: "关联每日巡检任务、日常巡检表及其审批流程，从任务发布、表单提交、预警触发到处置闭环全过程留痕。",
  formBizId: "FM-05",
  flowBizId: "PR-05",
  taskBizId: "TK-04",
};

const fieldOf = (key) => INSPECTION_FORM.fields.find((field) => field.key === key);

// ---------------------------------------------------------------- 时间

function startOfDay(ms) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addDays(ms, days) {
  const date = new Date(ms);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

export function formatStamp(ms, seconds = false) {
  if (!ms) return "—";
  const date = new Date(ms);
  const text = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return seconds ? `${text}:${pad(date.getSeconds())}` : text;
}

const dayCode = (ms) => formatStamp(ms).slice(0, 10).replaceAll("-", "");
const clock = (ms) => formatStamp(ms).slice(11);

// 平台时间规则：今天 / 昨天换算为「今天 10:26」「昨天 10:26」，其余显示完整时间。
export function platformTime(ms, now = Date.now()) {
  if (!ms) return "—";
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY);
  if (days === 0) return `今天 ${clock(ms)}`;
  if (days === 1) return `昨天 ${clock(ms)}`;
  return formatStamp(ms, true);
}

// 动态里的相对时间。
function feedTime(ms, now) {
  const minutes = Math.floor((now - ms) / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY);
  if (days === 0) return `今天 ${clock(ms)}`;
  if (days === 1) return `昨天 ${clock(ms)}`;
  const date = new Date(ms);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${clock(ms)}`;
}

function shiftOf(ms) {
  const hour = new Date(ms).getHours();
  if (hour >= 8 && hour < 16) return "早班";
  if (hour >= 16) return "中班";
  return "晚班";
}

// ---------------------------------------------------------------- 取值与规则

function displayValue(key, value) {
  const field = fieldOf(key);
  if (value === null || value === undefined || value === "") return "";
  if (field?.type === "datetime") return formatStamp(value);
  if (field?.unit) return `${value} ${field.unit}`;
  return String(value);
}

const withUnit = (key, value) => {
  const unit = fieldOf(key)?.unit;
  return unit ? `${value}${unit}` : String(value);
};

const COMPARE = {
  大于: (actual, target) => actual > target,
  大于等于: (actual, target) => actual >= target,
  小于: (actual, target) => actual < target,
  小于等于: (actual, target) => actual <= target,
  等于: (actual, target) => actual === target,
  不等于: (actual, target) => actual !== target,
};

function evaluateRules(values) {
  const hits = [];
  INSPECTION_RULES.forEach((rule) => {
    rule.conds.forEach((cond) => {
      const actual = values[cond.field];
      if (actual === undefined || actual === null || actual === "") return;
      if (!COMPARE[cond.logic](actual, cond.value)) return;
      hits.push({ rule, cond, actual });
    });
  });
  return hits;
}

/** 校验并规整执行页提交的原始取值。返回 { values } 或 { error, field }。 */
export function normalizeInspectionValues(raw, now = Date.now()) {
  const values = {};
  for (const field of INSPECTION_FORM.fields) {
    let value = raw?.[field.key];
    if (typeof value === "string") value = value.trim();
    if (field.type === "member") value = INSPECTION_USER.name;
    else if (field.type === "datetime") value = now;
    else if (field.type === "number") {
      if (value === "" || value === undefined || value === null) {
        if (field.required) return { error: `请填写${field.label}`, field: field.key };
        value = "";
      } else {
        value = Number(value);
        if (!Number.isFinite(value) || value < 0) return { error: `${field.label}需要填写不小于 0 的数字`, field: field.key };
      }
    } else if (field.type === "select") {
      if (!field.options.includes(value)) return { error: `请选择${field.label}`, field: field.key };
    } else value = value ?? ""; // 图片字段存的是所选文件的文件名（多张用顿号分隔）
    values[field.key] = value;
  }
  return { values };
}

// ---------------------------------------------------------------- 状态变更

const planId = (state) => `REC${dayCode(state.createdAt)}`;

function nextNumber(state, kind, day) {
  const key = `${kind}:${day}`;
  state.counters[key] = (state.counters[key] ?? 0) + 1;
  return state.counters[key];
}

function addFeed(state, feed) {
  state.feedSeq += 1;
  // 一次提交会同时产生几条动态；排序用的时间戳逐条加 1 毫秒，保证「后发生的排在前面」。
  state.lastFeedOrder = Math.max(feed.at, (state.lastFeedOrder ?? 0) + 1);
  const system = feed.operator !== INSPECTION_USER.name;
  state.feeds.push({
    id: `insp-f${state.feedSeq}`,
    order: state.lastFeedOrder,
    dept: system ? "系统自动生成" : INSPECTION_USER.dept,
    avatar: feed.operator === "系统预警" ? "预" : feed.operator.slice(0, 1),
    summary: "",
    ...feed,
  });
}

function publishInstance(state, publishedAt) {
  const day0 = startOfDay(publishedAt);
  const instance = {
    id: `I${dayCode(publishedAt)}${pad(nextNumber(state, "instance", dayCode(publishedAt)), 3)}`,
    publishedAt,
    deadlineAt: addDays(day0, 1) - 60000,
    status: "pending",
    submittedAt: null,
    recordId: null,
    forwardedTo: "",
    forwardedAt: null,
  };
  state.instances.push(instance);
  addFeed(state, {
    type: "task",
    kind: "task_start",
    operator: "系统",
    tone: "orange",
    at: publishedAt,
    title: `按计划发布了《${INSPECTION_TASK.name}》`,
    summary: `执行人：${INSPECTION_TASK.executor}；执行表单：《${INSPECTION_FORM.name}》；完成期限：${formatStamp(instance.deadlineAt)}。`,
    related: { label: `《${INSPECTION_TASK.name}》`, id: instance.id },
  });
  return instance;
}

function submit(state, instanceId, values, at) {
  const instance = state.instances.find((item) => item.id === instanceId);
  if (!instance || instance.status !== "pending") return null;
  const day = dayCode(at);
  const record = {
    id: `XJ-${day}-${pad(nextNumber(state, "record", day), 3)}`,
    instanceId,
    values,
    submittedAt: at,
    flowId: null,
    alertIds: [],
  };
  // 流程编号规则：年月日 + 4 位自增数。
  const flowNumber = `${day}${pad(nextNumber(state, "flow", day), 4)}`;
  const flow = {
    id: `insp-flow-${flowNumber}`,
    number: flowNumber,
    recordId: record.id,
    startedAt: at,
    status: "审批中",
    currentNode: INSPECTION_FLOW.approvalNode,
    approver: INSPECTION_FLOW.approver,
    handledByMe: false,
    handledResult: "",
    handledAt: null,
    opinion: "",
    extraLogs: [],
  };
  record.flowId = flow.id;
  instance.status = "done";
  instance.submittedAt = at;
  instance.recordId = record.id;
  state.records.push(record);
  state.flows.push(flow);

  const hits = evaluateRules(values);
  const alerts = hits.map(({ rule, cond, actual }) => {
    const alert = {
      id: `WRN-${day}-${pad(nextNumber(state, "alert", day), 3)}`,
      ruleId: rule.id,
      recordId: record.id,
      content: cond.content,
      level: cond.level,
      type: cond.type,
      item: { name: fieldOf(cond.field).label, judge: cond.logic, thr: withUnit(cond.field, cond.value), act: withUnit(cond.field, actual) },
      triggeredAt: at,
      dueAt: at + rule.deadlineHours * HOUR,
      status: "pending",
      handledAt: null,
      disposal: "",
    };
    record.alertIds.push(alert.id);
    state.alerts.push(alert);
    return alert;
  });

  const measured = ["co", "roof", "temp"].map((key) => `${fieldOf(key).label} ${displayValue(key, values[key])}`).join("、");
  addFeed(state, {
    type: "task",
    kind: "task_done",
    operator: INSPECTION_USER.name,
    tone: "orange",
    at,
    title: `执行并完成了《${INSPECTION_TASK.name}》`,
    summary: `巡检区域：${values.area}；${values.shift}；已按《${INSPECTION_FORM.name}》完成填报。`,
    related: { label: `《${INSPECTION_TASK.name}》`, id: instance.id },
  });
  addFeed(state, {
    type: "form",
    kind: "sheet_submit",
    operator: INSPECTION_USER.name,
    tone: "blue",
    at,
    title: `提交了《${INSPECTION_FORM.name}》：${values.area}，${alerts.length ? `发现 ${alerts.length} 项异常` : "各项指标正常"}`,
    summary: `巡检区域：${values.area}；${measured}；风机运行状态：${values.fan}；防护栏状态：${values.guard}。`,
    photos: values.photos,
    related: { label: `《${INSPECTION_FORM.name}》记录`, id: record.id },
  });
  addFeed(state, {
    type: "process",
    kind: "proc_start",
    operator: INSPECTION_USER.name,
    tone: "violet",
    at,
    title: `发起了《${INSPECTION_FLOW.name}》，待${flow.approver}审批`,
    summary: `流程编号：${flow.number}；当前节点：${flow.currentNode}；审批人：${flow.approver}。`,
    related: { label: `《${INSPECTION_FLOW.name}》`, id: flow.number },
  });
  alerts.forEach((alert) => {
    addFeed(state, {
      type: "warning",
      kind: "warn_trigger",
      operator: "系统预警",
      tone: "red",
      at,
      title: `《${INSPECTION_FORM.name}》触发${alert.level}预警：${alert.content}（实测 ${alert.item.act}）`,
      summary: `${alert.item.name}实测 ${alert.item.act}（阈值：${alert.item.judge} ${alert.item.thr}）；处理人：${INSPECTION_USER.name}；处理期限：${formatStamp(alert.dueAt)}。`,
      related: { label: `预警 ${alert.id}`, id: alert.id },
    });
  });
  return { instance, record, flow, alerts };
}

function handleAlert(state, alertId, disposal, at) {
  const alert = state.alerts.find((item) => item.id === alertId);
  if (!alert || alert.status !== "pending") return null;
  alert.status = "done";
  alert.handledAt = at;
  alert.disposal = disposal;
  addFeed(state, {
    type: "warning",
    kind: "warn_done",
    operator: INSPECTION_USER.name,
    tone: "green",
    at,
    title: `处置了${alert.level}预警《${alert.content}》，预警已闭环`,
    summary: `处理情况：${disposal}${at > alert.dueAt ? "（超期完成）" : ""}`,
    related: { label: `预警 ${alert.id}`, id: alert.id },
  });
  return alert;
}

const FLOW_ACTIONS = {
  已同意: { status: "已通过", node: "流程已结束", result: "同意", kind: "proc_approve", tone: "green", verb: "审批通过了", tail: "，流程结束" },
  已拒绝: { status: "已拒绝", node: "流程已结束", result: "拒绝", kind: "proc_reject", tone: "violet", verb: "拒绝了", tail: "，流程终止" },
  已驳回: { status: "已驳回", node: "已驳回至发起人", result: "驳回", kind: "proc_reject", tone: "violet", verb: "驳回了", tail: "" },
  已转办: { status: "审批中", node: "转办审批", result: "转办", kind: "proc_transfer", tone: "violet", verb: "转办了", tail: "" },
  已撤销: { status: "已撤销", node: "流程已撤销", result: "", kind: "proc_abort", tone: "violet", verb: "撤销了", tail: "" },
};

function actOnFlow(state, flowId, action, payload, at) {
  const flow = state.flows.find((item) => item.id === flowId);
  // 审批中的流程可以被处理；被驳回的流程还可以由发起人撤销。
  const open = flow?.status === "审批中" || (flow?.status === "已驳回" && action === "已撤销");
  if (!open) return null;
  const note = (payload?.opinion || payload?.reason || "").trim();
  if (action === "已加签") {
    const names = (payload?.targets ?? []).map((user) => user.name).join("、") || "处理人";
    flow.extraLogs.push({ at, title: "加签", action: "加签", details: [`${INSPECTION_USER.name}已加签给${names}`, `加签原因：${note || "未填写"}`] });
    return flow;
  }
  const spec = FLOW_ACTIONS[action];
  if (!spec) return null;
  flow.status = spec.status;
  flow.currentNode = spec.node;
  flow.handledAt = at;
  flow.opinion = note;
  if (action !== "已撤销") {
    flow.handledByMe = true;
    flow.handledResult = spec.result;
  }
  if (action === "已转办") flow.approver = payload?.target?.name ?? flow.approver;
  const target = action === "已转办" ? `给${flow.approver}` : "";
  addFeed(state, {
    type: "process",
    kind: spec.kind,
    operator: INSPECTION_USER.name,
    tone: spec.tone,
    at,
    title: `${spec.verb}《${INSPECTION_FLOW.name}》${target}${spec.tail}`,
    summary: `流程编号：${flow.number}；${action === "已同意" ? "审批意见" : "说明"}：${note || (action === "已同意" ? "同意" : "未填写")}。`,
    related: { label: `《${INSPECTION_FLOW.name}》`, id: flow.number },
  });
  return flow;
}

function forwardTask(state, instanceId, to, at) {
  const instance = state.instances.find((item) => item.id === instanceId);
  if (!instance || instance.status !== "pending") return null;
  instance.status = "forwarded";
  instance.forwardedTo = to;
  instance.forwardedAt = at;
  addFeed(state, {
    type: "task",
    kind: "task_forward",
    operator: INSPECTION_USER.name,
    tone: "orange",
    at,
    title: `将《${INSPECTION_TASK.name}》转办给${to}`,
    summary: `原执行人：${INSPECTION_USER.name}；接收人：${to}。`,
    related: { label: `《${INSPECTION_TASK.name}》`, id: instance.id },
  });
  return instance;
}

// 当天的任务发布时间：通常是 08:00；如果此刻还不到 08:00，就算作零点发布，保证随时演示都有待执行任务。
function publishTimeOf(day0, now) {
  const scheduled = day0 + INSPECTION_TASK.publishHour * HOUR;
  return scheduled <= now ? scheduled : day0;
}

function createInitialState(now) {
  const today = startOfDay(now);
  const state = {
    createdAt: addDays(today, -3) + 9.5 * HOUR,
    counters: {},
    feedSeq: 0,
    instances: [],
    records: [],
    flows: [],
    alerts: [],
    feeds: [],
  };
  addFeed(state, {
    type: "task",
    kind: "task_start",
    operator: INSPECTION_USER.name,
    tone: "orange",
    at: state.createdAt,
    title: `发布了周期任务《${INSPECTION_TASK.name}》`,
    summary: `每天 ${pad(INSPECTION_TASK.publishHour)}:00 自动发布；执行人：${INSPECTION_TASK.executor}；执行表单：《${INSPECTION_FORM.name}》。`,
    related: { label: `《${INSPECTION_TASK.name}》`, id: planId(state) },
  });

  // 前天：设备温度超限，触发预警并处置闭环。
  const first = addDays(today, -2);
  const firstInstance = publishInstance(state, first + 8 * HOUR);
  const firstRun = submit(state, firstInstance.id, {
    area: "南区 2# 采场", shift: "早班", inspector: INSPECTION_USER.name, inspected_at: first + 9.2 * HOUR,
    co: 11, roof: 9, temp: 86, fan: "正常", guard: "完好", note: "2# 铲运机液压油温偏高，已通知机电班检查。", photos: "铲运机液压站.jpg",
  }, first + 9.2 * HOUR);
  handleAlert(state, firstRun.alerts[0].id, "已停机冷却并更换液压油散热器滤芯，复测油温 68℃，恢复正常运行。", first + 10.7 * HOUR);
  actOnFlow(state, firstRun.flow.id, "已同意", { opinion: "已核实，整改到位。" }, first + 11.1 * HOUR);

  // 昨天：一切正常。
  const second = addDays(today, -1);
  const secondInstance = publishInstance(state, second + 8 * HOUR);
  const secondRun = submit(state, secondInstance.id, {
    area: "西翼 3# 平巷", shift: "早班", inspector: INSPECTION_USER.name, inspected_at: second + 8.9 * HOUR,
    co: 8, roof: 12, temp: 63, fan: "正常", guard: "完好", note: "", photos: "",
  }, second + 8.9 * HOUR);
  actOnFlow(state, secondRun.flow.id, "已同意", { opinion: "各项指标正常。" }, second + 9.7 * HOUR);

  // 今天：待执行。
  publishInstance(state, publishTimeOf(today, now));
  return state;
}

// ---------------------------------------------------------------- store

let state = null;
const listeners = new Set();
let navigator = null;

function ensure() {
  if (!state) state = createInitialState(Date.now());
  return state;
}

function commit() {
  state = { ...state };
  listeners.forEach((listener) => listener());
}

export function getInspectionState() {
  return ensure();
}

export function subscribeInspection(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 提交今天的巡检表。values 需先经过 normalizeInspectionValues。 */
export function submitInspection(instanceId, values) {
  const result = submit(ensure(), instanceId, values, Date.now());
  if (result) commit();
  return result ? describeSubmission(result) : null;
}

export function handleInspectionAlert(alertId, disposal) {
  const alert = handleAlert(ensure(), alertId, disposal, Date.now());
  if (alert) commit();
  return Boolean(alert);
}

export function actOnInspectionFlow(flowId, action, payload) {
  const flow = actOnFlow(ensure(), flowId, action, payload, Date.now());
  if (flow) commit();
  return Boolean(flow);
}

export function forwardInspectionTask(instanceId, to) {
  const instance = forwardTask(ensure(), instanceId, to, Date.now());
  if (instance) commit();
  return Boolean(instance);
}

export function setInspectionNavigator(handler) {
  navigator = handler;
}

function describeSubmission({ record, flow, alerts }) {
  return {
    recordId: record.id,
    flowNumber: flow.number,
    flowNode: flow.currentNode,
    alerts: alerts.map((alert) => ({ id: alert.id, level: alert.level, content: alert.content, item: alert.item })),
  };
}

// ---------------------------------------------------------------- 给工作台（React）用的数据

const alertOverdue = (alert, now) => (alert.status === "pending" ? now > alert.dueAt : alert.handledAt > alert.dueAt);

function formPairs(record) {
  return INSPECTION_FORM.fields
    .filter((field) => field.key !== "note" && (field.type !== "image" || record.values[field.key]))
    .map((field) => [field.label, displayValue(field.key, record.values[field.key])]);
}

/** 流程列表里的记录，结构与 main.jsx 的 processEntries 一致。 */
export function getInspectionProcessRecords(now = Date.now()) {
  const current = ensure();
  return [...current.flows].reverse().map((flow) => {
    const record = current.records.find((item) => item.id === flow.recordId);
    const started = formatStamp(flow.startedAt, true);
    const logs = [
      { time: started, title: "系统发起", action: "发起", state: "done", details: [`${INSPECTION_USER.name}发起了${INSPECTION_FLOW.name}`, `来源：《${INSPECTION_TASK.name}》执行提交的《${INSPECTION_FORM.name}》${record.id}`] },
      ...flow.extraLogs.map((log) => ({ time: formatStamp(log.at, true), title: log.title, action: log.action, state: "done", details: log.details })),
    ];
    if (flow.status === "审批中") {
      logs.push({ time: "当前", title: flow.currentNode, state: "current", details: [`当前待 ${flow.approver} 审批`, `流程到达时间：${started}`] });
    } else if (flow.status === "已撤销") {
      logs.push({ time: formatStamp(flow.handledAt, true), title: "撤销", action: "撤销", state: "current", details: [`${INSPECTION_USER.name}已撤销该流程`] });
    } else {
      logs.push({
        time: formatStamp(flow.handledAt, true),
        title: INSPECTION_FLOW.approvalNode,
        action: flow.handledResult,
        state: flow.status === "已通过" ? "done" : "current",
        details: [`${INSPECTION_USER.name}已${flow.handledResult}`, `审批意见：${flow.opinion || (flow.status === "已通过" ? "同意" : "未填写")}`, `流程到达时间：${started}`],
      });
      if (flow.status === "已通过") {
        logs.push({ time: formatStamp(flow.handledAt, true), title: "抄送", action: "抄送", state: "done", details: [`系统已抄送 ${INSPECTION_FLOW.ccMember}（设备管理部）`] });
        logs.push({ time: formatStamp(flow.handledAt, true), title: "结束", state: "current", details: ["流程已结束"] });
      }
    }
    return {
      id: flow.id,
      scenario: "inspection",
      number: flow.number,
      name: INSPECTION_FLOW.name,
      type: "巡检审批",
      initiator: INSPECTION_USER.name,
      initiatedAt: platformTime(flow.startedAt, now),
      completedAt: flow.handledAt ? platformTime(flow.handledAt, now) : "-",
      currentNode: flow.currentNode,
      approver: flow.approver,
      status: flow.status,
      application: INSPECTION_FLOW.application,
      department: INSPECTION_USER.dept,
      startedByMe: true,
      handledByMe: flow.handledByMe,
      handledResult: flow.handledResult,
      formTitle: `${INSPECTION_FORM.name} · ${record.id}`,
      formFields: formPairs(record),
      descriptionLabel: "异常情况说明",
      description: record.values.note || "本次巡检未填写异常情况。",
      logs,
      flowNodes: [
        { name: "巡检人提交", done: true },
        { name: INSPECTION_FLOW.approvalNode, done: flow.status !== "审批中", active: flow.status === "审批中" },
        { name: INSPECTION_FLOW.ccNode, done: flow.status === "已通过" },
        { name: "流程结束", done: flow.status === "已通过" },
      ],
    };
  });
}

/** 首页待办、待办总览、首页动态用的摘要。 */
export function getInspectionTodos(now = Date.now()) {
  const current = ensure();
  const tasks = current.instances.filter((item) => item.status === "pending");
  const approvals = current.flows.filter((flow) => flow.status === "审批中" && flow.approver === INSPECTION_USER.name);
  const alerts = current.alerts.filter((alert) => alert.status === "pending");
  return {
    tasks: tasks.map((item) => ({
      title: INSPECTION_TASK.name,
      source: INSPECTION_FLOW.application,
      deadline: `${platformTime(item.deadlineAt, now)} 前`,
      owner: INSPECTION_TASK.initiator,
      note: `按《${INSPECTION_FORM.name}》完成现场巡检并填报`,
      action: "执行任务",
      scenario: true,
    })),
    approvals: approvals.map((flow) => ({
      title: INSPECTION_FLOW.name,
      source: INSPECTION_FLOW.application,
      deadline: "",
      owner: INSPECTION_USER.name,
      note: `流程到达时间：${formatStamp(flow.startedAt, true)}`,
      action: "去审批",
      processNumber: flow.number,
      scenario: true,
    })),
    alerts: alerts.map((alert) => ({
      title: `${alert.content}（${alert.level}）`,
      source: INSPECTION_FORM.name,
      deadline: `${platformTime(alert.dueAt, now)} 前`,
      owner: "系统预警",
      note: `${alert.item.name}实测 ${alert.item.act}，阈值 ${alert.item.judge} ${alert.item.thr}`,
      action: "查看处置",
      scenario: true,
    })),
    feeds: [...current.feeds]
      .sort((left, right) => right.order - left.order)
      .slice(0, 4)
      .map((feed) => ({ id: feed.id, type: feed.type, person: feed.operator, avatar: feed.avatar, tone: feed.tone, headline: feed.title, time: feedTime(feed.at, now), minutesAgo: (now - feed.at) / 60000 })),
  };
}

// ---------------------------------------------------------------- 给各原型（iframe）用的数据

function taskView(now) {
  const current = ensure();
  const instances = [...current.instances].reverse().map((item) => {
    const record = current.records.find((entry) => entry.id === item.recordId);
    return {
      id: item.id,
      status: item.status,
      publishedAt: formatStamp(item.publishedAt),
      deadline: formatStamp(item.deadlineAt),
      span: `${formatStamp(item.publishedAt)} ~ ${clock(item.deadlineAt)}`,
      overdue: item.status === "done" ? item.submittedAt > item.deadlineAt : now > item.deadlineAt,
      submittedAt: item.submittedAt ? formatStamp(item.submittedAt) : "",
      forwardedTo: item.forwardedTo,
      forwardedAt: item.forwardedAt ? formatStamp(item.forwardedAt) : "",
      recordId: item.recordId ?? "",
      values: record ? Object.fromEntries(INSPECTION_FORM.fields.map((field) => [field.key, displayValue(field.key, record.values[field.key])])) : null,
    };
  });
  return {
    formName: INSPECTION_FORM.name,
    feedNoName: INSPECTION_FEED_NO.name,
    flowName: INSPECTION_FLOW.name,
    user: INSPECTION_USER.name,
    fields: INSPECTION_FORM.fields,
    defaults: { area: INSPECTION_FORM.fields[0].options[0], shift: shiftOf(now), fan: "正常", guard: "完好", inspector: INSPECTION_USER.name, inspected_at: formatStamp(now) },
    task: INSPECTION_TASK,
    plan: {
      id: planId(current),
      createdAt: formatStamp(current.createdAt),
      start: `${formatStamp(current.createdAt).slice(0, 10)}T${pad(INSPECTION_TASK.publishHour)}:00`,
      end: `${new Date(now).getFullYear()}-12-31T23:59`,
    },
    instances,
  };
}

const LEVEL_CLASS = { 一级: "risk-1", 二级: "risk-2", 三级: "risk-3", 四级: "risk-4" };
const HANDLER_ROLE = "表单提交人";

function alertView(now) {
  const current = ensure();
  return {
    sheet: INSPECTION_FORM.name,
    user: INSPECTION_USER.name,
    handlerRole: HANDLER_ROLE,
    feedNoName: INSPECTION_FEED_NO.name,
    rules: INSPECTION_RULES.map((rule) => ({
      id: rule.id,
      name: rule.name,
      sheet: INSPECTION_FORM.name,
      enabled: true,
      creator: INSPECTION_USER.name,
      createdAt: formatStamp(current.createdAt + 20 * 60000),
      triggered: current.alerts.filter((alert) => alert.ruleId === rule.id).length,
      conds: rule.conds.map((cond) => ({
        content: cond.content,
        relation: "any",
        riskLevel: cond.level,
        type: cond.type,
        subs: [{ field: fieldOf(cond.field).label, logic: cond.logic, value: withUnit(cond.field, cond.value) }],
      })),
      plans: [{
        condIdxs: rule.conds.map((_, index) => index),
        handlers: [HANDLER_ROLE],
        notifiers: ["表单提交人的部门负责人", "预警所在事事号的成员"],
        mode: "any",
        deadlineType: "fixed",
        deadlineUnit: "小时",
        deadlineValue: rule.deadlineHours,
        deadlineField: "",
        reminders: [{ value: 1, unit: "小时", targets: ["表单提交人的部门负责人"] }],
        channels: ["系统站内消息"],
      }],
    })),
    alerts: [...current.alerts].reverse().map((alert) => {
      const done = alert.status === "done";
      const logs = [{ at: formatStamp(alert.triggeredAt), actor: "系统", role: "系统", type: "system", action: "触发预警", detail: `${alert.content} · 命中 1 个工作项（来源记录 ${alert.recordId}）` }];
      if (done) logs.push({ at: formatStamp(alert.handledAt), actor: INSPECTION_USER.name, role: HANDLER_ROLE, type: "submit", action: "处理预警", detail: `已提交处置（${alert.disposal}）` });
      return {
        id: alert.id,
        done,
        overdue: alertOverdue(alert, now),
        content: alert.content,
        level: alert.level,
        levelClass: LEVEL_CLASS[alert.level],
        type: alert.type,
        items: [alert.item],
        time: formatStamp(alert.triggeredAt),
        timeFull: formatStamp(alert.triggeredAt, true),
        due: formatStamp(alert.dueAt),
        dueFull: formatStamp(alert.dueAt, true),
        handledAt: done ? formatStamp(alert.handledAt) : "",
        handledAtFull: done ? formatStamp(alert.handledAt, true) : "",
        disposal: alert.disposal,
        logs,
      };
    }),
  };
}

/** 图片字段的取值（文件名，多张用顿号分隔）拆成文件名数组。 */
const photoNames = (photos) => (photos ? String(photos).split("、").filter(Boolean) : []);

function dynamicsView(now) {
  const current = ensure();
  const records = {};
  current.records.forEach((record) => {
    const flow = current.flows.find((item) => item.id === record.flowId);
    const alerts = current.alerts.filter((alert) => alert.recordId === record.id);
    records[record.id] = {
      kicker: "表单记录 · 日常巡检",
      title: `《${INSPECTION_FORM.name}》${record.id}`,
      icon: "doc",
      tone: "blue",
      sub: `${INSPECTION_FLOW.application} · 填报人：${INSPECTION_USER.name} · ${INSPECTION_USER.dept}`,
      status: alerts.length ? `已提交 · 触发 ${alerts.length} 条预警` : "已提交",
      statusTone: alerts.length ? "warn" : "ok",
      fields: [["单据编号", record.id], ...formPairs(record), ["异常情况说明", record.values.note || "无", "wide"]],
      flow: [{ t: formatStamp(record.submittedAt), w: INSPECTION_USER.name, a: "创建并提交", note: `执行《${INSPECTION_TASK.name}》时填报。` }],
      actions: [],
    };
    records[flow.number] = {
      kicker: `流程 · ${INSPECTION_FLOW.application}`,
      title: `《${INSPECTION_FLOW.name}》${flow.number}`,
      icon: "flow",
      tone: "violet",
      sub: `发起人：${INSPECTION_USER.name} · ${INSPECTION_USER.dept}`,
      status: flow.status,
      statusTone: flow.status === "已通过" ? "ok" : flow.status === "审批中" ? "warn" : "danger",
      fields: [
        ["流程编号", flow.number], ["关联表单", `${INSPECTION_FORM.name} ${record.id}`], ["发起时间", formatStamp(flow.startedAt)], ["当前节点", flow.currentNode],
        ["审批人", flow.approver], ["处理时间", flow.handledAt ? formatStamp(flow.handledAt) : "—"], ["审批意见", flow.opinion || "—", "wide"],
      ],
      flow: [{ t: formatStamp(flow.startedAt), w: INSPECTION_USER.name, a: "发起流程", note: `提交《${INSPECTION_FORM.name}》后自动发起。` }],
      actions: [],
    };
  });
  current.alerts.forEach((alert) => {
    const done = alert.status === "done";
    records[alert.id] = {
      kicker: `预警 · ${INSPECTION_FORM.name}`,
      title: `${alert.content} ${alert.id}`,
      icon: "alert",
      tone: "red",
      sub: `${alert.level}风险 · ${alert.type} · 处理人：${INSPECTION_USER.name}`,
      status: done ? "已完成" : "未处理",
      statusTone: done ? "ok" : "danger",
      fields: [
        ["预警编号", alert.id], ["风险等级", `${alert.level}风险`], ["预警工作项", alert.item.name], ["触发值（实测）", alert.item.act, "warn"],
        ["预警值（阈值）", `${alert.item.judge} ${alert.item.thr}`], ["来源记录", alert.recordId], ["触发时间", formatStamp(alert.triggeredAt)], ["处理期限", formatStamp(alert.dueAt)],
        ["处理情况", alert.disposal || "尚未处置", "wide"],
      ],
      flow: [{ t: formatStamp(alert.triggeredAt), w: "系统", a: "触发预警", note: alert.content }],
      actions: [],
    };
  });
  current.instances.forEach((item) => {
    const status = { pending: "未执行", done: "已完成", forwarded: "已转办" }[item.status];
    records[item.id] = {
      kicker: `任务 · ${INSPECTION_FLOW.application}`,
      title: `《${INSPECTION_TASK.name}》${item.id}`,
      icon: "task",
      tone: "orange",
      sub: `周期任务 · 发起人：${INSPECTION_TASK.initiator}`,
      status,
      statusTone: item.status === "done" ? "ok" : "warn",
      fields: [
        ["任务编号", item.id], ["执行人", item.forwardedTo || INSPECTION_TASK.executor], ["发布时间", formatStamp(item.publishedAt)], ["完成期限", formatStamp(item.deadlineAt)],
        ["执行表单", INSPECTION_FORM.name], ["提交时间", item.submittedAt ? formatStamp(item.submittedAt) : "—"], ["执行说明", INSPECTION_TASK.description, "wide"],
      ],
      flow: [{ t: formatStamp(item.publishedAt), w: "系统", a: "发布任务", note: "周期任务按计划自动发布。" }],
      actions: [],
    };
  });
  records[planId(current)] = {
    kicker: `任务 · ${INSPECTION_FLOW.application}`,
    title: `《${INSPECTION_TASK.name}》周期计划`,
    icon: "task",
    tone: "orange",
    sub: `周期任务 · 发起人：${INSPECTION_TASK.initiator}`,
    status: "进行中",
    statusTone: "ok",
    fields: [
      ["任务模板", INSPECTION_TASK.template], ["重复频率", `每天 ${pad(INSPECTION_TASK.publishHour)}:00 发布`], ["执行人", INSPECTION_TASK.executor], ["参与人员", INSPECTION_TASK.participant],
      ["执行表单", INSPECTION_FORM.name], ["已发布次数", `${current.instances.length} 次`], ["执行说明", INSPECTION_TASK.description, "wide"],
    ],
    flow: [{ t: formatStamp(current.createdAt), w: INSPECTION_TASK.initiator, a: "发布周期任务", note: "按天重复发布。" }],
    actions: [],
  };

  return {
    formName: INSPECTION_FORM.name,
    legacyFormName: "设备点检记录表",
    feedNo: {
      id: INSPECTION_FEED_NO.id,
      name: INSPECTION_FEED_NO.name,
      icon: "task",
      tone: "green",
      desc: INSPECTION_FEED_NO.desc,
      owner: INSPECTION_USER.name,
      creator: INSPECTION_USER.name,
      dept: INSPECTION_FEED_NO.category,
      created: formatStamp(current.createdAt + 40 * 60000).slice(0, 10),
      status: "on",
      followed: true,
      subs: 18,
      binds: [
        { kind: "form", id: INSPECTION_FEED_NO.formBizId },
        { kind: "process", id: INSPECTION_FEED_NO.flowBizId },
        { kind: "task", id: INSPECTION_FEED_NO.taskBizId },
      ],
      rules: {
        events: ["sheet_submit", "proc_start", "proc_transfer", "proc_approve", "proc_reject", "proc_abort", "task_start", "task_forward", "task_done", "warn_trigger", "warn_exec", "warn_done"],
        toEnd: true,
        autoFollow: true,
        archive: "auto",
      },
      scope: { type: "dept", list: ["安全管理部", "设备管理部", "生产管理部"] },
    },
    biz: {
      form: { id: INSPECTION_FEED_NO.formBizId, name: INSPECTION_FORM.name, ver: "V1.0", dept: INSPECTION_USER.dept, desc: INSPECTION_FORM.description },
      process: { id: INSPECTION_FEED_NO.flowBizId, name: INSPECTION_FLOW.name, ver: "4 节点", dept: INSPECTION_USER.dept, desc: INSPECTION_FLOW.description },
      task: { id: INSPECTION_FEED_NO.taskBizId, name: INSPECTION_TASK.name, ver: "周期", dept: INSPECTION_USER.dept, desc: "每天自动发布的井下巡检任务" },
    },
    feeds: current.feeds.map((feed) => ({
      id: feed.id,
      type: feed.type,
      operator: feed.operator,
      dept: feed.dept,
      avatar: feed.avatar,
      tone: feed.tone,
      title: feed.title,
      summary: feed.summary,
      time: feedTime(feed.at, now),
      ts: feed.order,
      attachments: photoNames(feed.photos).map((name) => ({ name, kind: "img" })),
      related: feed.related,
      likes: [],
      liked: false,
      comments: [],
      followed: false,
      noId: INSPECTION_FEED_NO.id,
    })),
    records,
  };
}

const LOWCODE_TYPE = { select: "select", member: "member", datetime: "datetime", number: "number", textarea: "textarea", image: "image" };

function lowcodeView() {
  const current = ensure();
  const created = formatStamp(addDays(current.createdAt, -(INSPECTION_FORM.createdDaysAgo - 3)));
  const flowCreated = formatStamp(current.createdAt - 30 * 60000);
  const fields = INSPECTION_FORM.fields.map((field) => ({
    fieldName: field.key,
    label: field.label,
    type: field.key === "shift" || field.key === "fan" || field.key === "guard" ? "radio" : LOWCODE_TYPE[field.type],
    span: field.type === "textarea" || field.type === "image" ? 12 : 6,
    required: Boolean(field.required),
    helpText: field.hint ?? "",
    options: field.options ?? null,
    unit: field.unit ?? "",
    placeholder: field.placeholder ?? "",
    auto: Boolean(field.auto),
  }));
  const submissionValues = (record) => Object.fromEntries(INSPECTION_FORM.fields.map((field) => [field.key, displayValue(field.key, record.values[field.key])]));
  return {
    user: INSPECTION_USER.name,
    application: INSPECTION_FLOW.application,
    form: {
      id: INSPECTION_FORM.id,
      name: INSPECTION_FORM.name,
      category: INSPECTION_FORM.category,
      description: INSPECTION_FORM.description,
      createdAt: created,
      updatedAt: created.slice(0, 10),
      refs: [
        { type: "流程任务", name: `${INSPECTION_FLOW.name} · 发起节点` },
        { type: "流程任务", name: `${INSPECTION_TASK.name} · 执行表单` },
        { type: "应用菜单", name: `${INSPECTION_FLOW.application} / 日常巡检` },
      ],
      fields,
    },
    submissions: [...current.records].reverse().map((record) => ({ id: record.id, submitter: INSPECTION_USER.name, time: formatStamp(record.submittedAt), vals: submissionValues(record) })),
    flow: {
      id: INSPECTION_FLOW.id,
      name: INSPECTION_FLOW.name,
      description: INSPECTION_FLOW.description,
      createdAt: flowCreated,
      publishedAt: flowCreated.slice(0, 10),
      approvalNode: INSPECTION_FLOW.approvalNode,
      approver: INSPECTION_FLOW.approver,
      ccNode: INSPECTION_FLOW.ccNode,
      ccMember: INSPECTION_FLOW.ccMember,
      refs: [
        { type: "流程任务", name: `${INSPECTION_TASK.name} · 提交后发起` },
        { type: "应用菜单", name: `${INSPECTION_FLOW.application} / 日常巡检` },
      ],
    },
    taskName: INSPECTION_TASK.name,
    instances: [...current.flows].reverse().map((flow) => {
      const record = current.records.find((item) => item.id === flow.recordId);
      const started = formatStamp(flow.startedAt);
      const handled = flow.handledAt ? formatStamp(flow.handledAt) : "—";
      const nodes = ["开始", INSPECTION_FLOW.approvalNode, INSPECTION_FLOW.ccNode, "结束"];
      const steps = [{ node: "开始", actor: INSPECTION_USER.name, action: "提交", time: started, comment: "" }];
      if (flow.status === "审批中") steps.push({ node: flow.currentNode, actor: flow.approver, action: "审批中", time: "—", comment: "" });
      else if (flow.status === "已撤销") steps.push({ node: "已撤回", actor: INSPECTION_USER.name, action: "撤回", time: handled, comment: flow.opinion });
      else steps.push({ node: INSPECTION_FLOW.approvalNode, actor: INSPECTION_USER.name, action: { 已通过: "通过", 已拒绝: "拒绝", 已驳回: "驳回" }[flow.status], time: handled, comment: flow.opinion });
      if (flow.status === "已通过") {
        steps.push({ node: INSPECTION_FLOW.ccNode, actor: INSPECTION_FLOW.ccMember, action: "抄送", time: handled });
        steps.push({ node: "结束", actor: "系统", action: "完成", time: handled });
      }
      return {
        id: flow.number,
        flowId: INSPECTION_FLOW.id,
        flowName: INSPECTION_FLOW.name,
        appName: INSPECTION_FLOW.application,
        initiator: INSPECTION_USER.name,
        startTime: started,
        status: flow.status === "已撤销" ? "已撤回" : flow.status,
        currentNode: flow.status === "已通过" ? "结束" : flow.status === "审批中" ? flow.currentNode : INSPECTION_FLOW.approvalNode,
        nodes,
        currentIdx: flow.status === "已通过" ? 3 : 1,
        steps,
        formData: submissionValues(record),
      };
    }),
  };
}

/** 各原型里的桥接脚本通过 window.__inspectionScenario 访问的接口。 */
export const inspectionHost = {
  views: {
    task: () => taskView(Date.now()),
    alerts: () => alertView(Date.now()),
    dynamics: () => dynamicsView(Date.now()),
    lowcode: () => lowcodeView(),
  },
  normalizeValues: (raw) => normalizeInspectionValues(raw, Date.now()),
  // 某个数值字段当前填的值是否会命中预警规则。
  exceeds: (key, raw) => raw !== "" && Number.isFinite(Number(raw)) && evaluateRules({ [key]: Number(raw) }).length > 0,
  submitInspection,
  handleAlert: handleInspectionAlert,
  forwardTask: forwardInspectionTask,
  navigate: (target) => navigator?.(target),
};

if (typeof window !== "undefined") window.__inspectionScenario = inspectionHost;
