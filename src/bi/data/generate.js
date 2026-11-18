// Builds the records the platform's applications hold for the last 90 days. Records are linked
// the way the platform links them: a submitted form record triggers alerts through its alert
// rules, starts the approval flow bound to the form and spawns follow-up tasks. Every such
// flow / task / alert keeps a pointer to the form record it came from (sourceDataset + sourceNo),
// and happens at the moment the form was submitted, so counts on a screen reconcile.

import { INSPECTION_FLOW, INSPECTION_FORM, INSPECTION_RULES, INSPECTION_TASK } from "../../scenario/inspectionStore.js";
import { createRng, hashString } from "./random.js";

export const HISTORY_DAYS = 90;
const HOUR = 3600000;
const DAY = 86400000;

const PEOPLE = {
  安全管理部: ["张宇", "周敏", "孙宁", "陈安平"],
  生产管理部: ["李明", "王强", "何勇"],
  设备管理部: ["陈伟", "赵磊", "刘明辉"],
  机电管理部: ["王建国", "刘海", "李国强"],
  综合管理部: ["王芳", "赵志远"],
  采矿车间: ["李强", "孙立", "周伟", "吴昊"],
  掘进工区: ["张建国", "陈海波", "郑凯"],
  选矿车间: ["刘洋", "孙磊", "钱程"],
};
const LEADERS = {
  安全管理部: "张宇",
  生产管理部: "李明",
  设备管理部: "陈伟",
  机电管理部: "王建国",
  综合管理部: "王芳",
  采矿车间: "李强",
  掘进工区: "张建国",
  选矿车间: "刘洋",
};

const SITES = [
  { location: "东翼 1# 采场", dept: "采矿车间", posts: ["凿岩工", "撬毛工", "铲运机司机", "支护工"], risk: 1, accidents: ["冒顶片帮", "物体打击", "机械伤害"] },
  { location: "南区 2# 采场", dept: "采矿车间", posts: ["凿岩工", "撬毛工", "铲运机司机", "支护工"], risk: 1.55, accidents: ["冒顶片帮", "物体打击", "坍塌"] },
  { location: "西翼 3# 平巷", dept: "掘进工区", posts: ["凿岩工", "支护工", "爆破工", "撬毛工"], risk: 1.3, accidents: ["冒顶片帮", "放炮", "物体打击"] },
  { location: "西翼 2# 平巷", dept: "掘进工区", posts: ["凿岩工", "支护工", "爆破工"], risk: 0.9, accidents: ["冒顶片帮", "放炮", "中毒窒息"] },
  { location: "主斜坡道", dept: "生产管理部", posts: ["电机车司机", "铲运机司机", "通风工"], risk: 0.8, accidents: ["机械伤害", "物体打击", "其他"] },
  { location: "充填站", dept: "生产管理部", posts: ["充填工", "管道工"], risk: 0.65, accidents: ["坍塌", "高处坠落", "其他"] },
  { location: "南区排水泵房", dept: "机电管理部", posts: ["水泵工", "电工"], risk: 0.7, accidents: ["触电", "机械伤害", "其他"] },
  { location: "北区提升机房", dept: "机电管理部", posts: ["提升机司机", "电工"], risk: 0.6, accidents: ["机械伤害", "触电", "高处坠落"] },
  { location: "碎矿车间", dept: "选矿车间", posts: ["破碎工", "皮带工"], risk: 1.1, accidents: ["机械伤害", "物体打击", "高处坠落"] },
  { location: "磨浮车间", dept: "选矿车间", posts: ["磨矿工", "浮选工"], risk: 0.75, accidents: ["机械伤害", "灼烫", "高处坠落"] },
];

const DEVICES = [
  { name: "1# 球磨机", type: "破碎磨矿", dept: "选矿车间", temp: 62, fault: 0.05, location: "磨浮车间" },
  { name: "2# 球磨机", type: "破碎磨矿", dept: "选矿车间", temp: 63, fault: 0.06, location: "磨浮车间" },
  { name: "3# 球磨机", type: "破碎磨矿", dept: "选矿车间", temp: 66, fault: 0.13, location: "磨浮车间" },
  { name: "颚式破碎机", type: "破碎磨矿", dept: "选矿车间", temp: 58, fault: 0.07, location: "碎矿车间" },
  { name: "圆锥破碎机", type: "破碎磨矿", dept: "选矿车间", temp: 60, fault: 0.05, location: "碎矿车间" },
  { name: "主提升机", type: "提升运输", dept: "机电管理部", temp: 48, fault: 0.03, location: "北区提升机房" },
  { name: "2# 皮带输送机", type: "提升运输", dept: "机电管理部", temp: 44, fault: 0.08, location: "主斜坡道" },
  { name: "南区排水泵", type: "排水", dept: "机电管理部", temp: 55, fault: 0.09, location: "南区排水泵房" },
  { name: "2# 渣浆泵", type: "排水", dept: "设备管理部", temp: 57, fault: 0.15, location: "磨浮车间" },
  { name: "1# 主扇风机", type: "通风", dept: "机电管理部", temp: 46, fault: 0.04, location: "主斜坡道" },
  { name: "凿岩台车", type: "采掘", dept: "掘进工区", temp: 70, fault: 0.08, location: "西翼 3# 平巷" },
  { name: "铲运机", type: "采掘", dept: "采矿车间", temp: 76, fault: 0.1, location: "南区 2# 采场" },
  { name: "空压机组", type: "动力", dept: "机电管理部", temp: 72, fault: 0.06, location: "北区提升机房" },
];

const TEAMS = [
  { team: "采矿一班", process: "采矿", dept: "采矿车间", plan: 1450 },
  { team: "采矿二班", process: "采矿", dept: "采矿车间", plan: 1380 },
  { team: "掘进一班", process: "掘进", dept: "掘进工区", plan: 320, footage: 11 },
  { team: "掘进二班", process: "掘进", dept: "掘进工区", plan: 300, footage: 10 },
  { team: "选矿甲班", process: "选矿", dept: "选矿车间", plan: 1500 },
  { team: "选矿乙班", process: "选矿", dept: "选矿车间", plan: 1460 },
  { team: "运输班", process: "运输", dept: "生产管理部", plan: 2900 },
  { team: "充填班", process: "充填", dept: "生产管理部", plan: 900 },
];

const EXPLOSIVES = [
  { material: "乳化炸药", unit: "kg", min: 120, max: 480, weight: 40 },
  { material: "导爆管雷管", unit: "发", min: 40, max: 160, weight: 30 },
  { material: "电子雷管", unit: "发", min: 30, max: 120, weight: 20 },
  { material: "导爆索", unit: "米", min: 50, max: 300, weight: 10 },
];

const FIRE_AREAS = [
  { area: "办公楼", dept: "综合管理部" },
  { area: "选矿厂", dept: "选矿车间" },
  { area: "井口区", dept: "生产管理部" },
  { area: "炸药库", dept: "安全管理部" },
  { area: "机修车间", dept: "设备管理部" },
  { area: "变电所", dept: "机电管理部" },
  { area: "宿舍区", dept: "综合管理部" },
  { area: "油库", dept: "设备管理部" },
];

const HOTWORK_SITES = [
  { location: "机修车间", dept: "设备管理部" },
  { location: "碎矿车间", dept: "选矿车间" },
  { location: "磨浮车间", dept: "选矿车间" },
  { location: "主斜坡道", dept: "机电管理部" },
  { location: "北区提升机房", dept: "机电管理部" },
  { location: "南区 2# 采场", dept: "采矿车间" },
  { location: "井口区", dept: "生产管理部" },
];

const GENERAL_FLOWS = [
  { name: "设备采购申请", app: "设备管理", category: "设备管理", depts: ["设备管理部", "机电管理部"], nodes: ["部门负责人审批", "设备管理部审批", "分管领导审批"], weight: 14 },
  { name: "停机检修计划审批", app: "设备管理", category: "设备管理", depts: ["设备管理部", "选矿车间"], nodes: ["部门负责人审批", "生产管理部会签"], weight: 10 },
  { name: "外协队入场资格审核", app: "双重预防机制", category: "安全管理", depts: ["安全管理部", "生产管理部"], nodes: ["安环部备案", "安全管理部审批"], weight: 9 },
  { name: "高处作业审批", app: "双重预防机制", category: "安全管理", depts: ["设备管理部", "选矿车间", "机电管理部"], nodes: ["部门负责人审批", "安全管理部审批", "分管领导审批"], weight: 9 },
  { name: "临时用电申请", app: "安全管理", category: "安全管理", depts: ["采矿车间", "掘进工区", "机电管理部"], nodes: ["机电管理部审批", "安全管理部审批"], weight: 12 },
  { name: "材料采购流程", app: "生产管理", category: "财务管理", depts: ["生产管理部", "选矿车间"], nodes: ["部门负责人审批", "财务审核", "分管领导审批"], weight: 12 },
  { name: "选厂药剂领用申请", app: "生产管理", category: "生产管理", depts: ["选矿车间"], nodes: ["车间主任审批", "生产管理部审批"], weight: 10 },
  { name: "爆破作业人员调整申请", app: "火工品管理", category: "生产管理", depts: ["采矿车间", "掘进工区"], nodes: ["车间主任审批", "安全管理部审批", "分管领导审批"], weight: 5 },
  { name: "消防器材增补采购申请", app: "消防管理", category: "财务管理", depts: ["综合管理部", "安全管理部"], nodes: ["部门负责人审批", "财务审核"], weight: 5 },
  { name: "应急预案修订审批", app: "应急管理", category: "安全管理", depts: ["安全管理部"], nodes: ["安全管理部审批", "分管领导审批", "矿长审批"], weight: 4 },
  { name: "职员调岗审批", app: "机电管理", category: "人事管理", depts: ["机电管理部", "综合管理部", "采矿车间"], nodes: ["部门负责人审批", "人资审核"], weight: 6 },
  { name: "员工离职申请", app: "机电管理", category: "人事管理", depts: ["综合管理部", "采矿车间", "选矿车间"], nodes: ["部门负责人审批", "人资审核", "分管领导审批"], weight: 4 },
];

const ROUTINE_TASKS = [
  { name: "平巷凿岩作业隐患排查任务", type: "隐患排查", source: "周期任务", app: "双重预防机制", depts: ["掘进工区"], limit: 10, weight: 14 },
  { name: "掘进工作面隐患排查任务", type: "隐患排查", source: "周期任务", app: "双重预防机制", depts: ["掘进工区", "采矿车间"], limit: 10, weight: 12 },
  { name: "撬毛作业岗位隐患排查任务", type: "隐患排查", source: "周期任务", app: "双重预防机制", depts: ["采矿车间"], limit: 10, weight: 10 },
  { name: "球磨机日常点检", type: "设备点检", source: "周期任务", app: "设备管理", depts: ["选矿车间", "设备管理部"], limit: 8, weight: 12 },
  { name: "南区排水泵巡检", type: "设备点检", source: "周期任务", app: "设备管理", depts: ["机电管理部"], limit: 8, weight: 9 },
  { name: "提升机周检", type: "设备点检", source: "周期任务", app: "机电管理", depts: ["机电管理部"], limit: 24, weight: 4 },
  { name: "消防设施月度巡检", type: "巡检", source: "周期任务", app: "消防管理", depts: ["安全管理部", "综合管理部"], limit: 48, weight: 5 },
  { name: "尾矿库巡查", type: "巡检", source: "周期任务", app: "安全管理", depts: ["安全管理部", "生产管理部"], limit: 12, weight: 7 },
  { name: "透水事故应急演练", type: "培训演练", source: "临时任务", app: "应急管理", depts: ["安全管理部", "采矿车间", "掘进工区"], limit: 72, weight: 3 },
  { name: "火灾疏散演练", type: "培训演练", source: "临时任务", app: "应急管理", depts: ["安全管理部", "选矿车间", "综合管理部"], limit: 72, weight: 3 },
  { name: "新员工三级安全教育", type: "培训演练", source: "临时任务", app: "应急管理", depts: ["安全管理部", "综合管理部"], limit: 96, weight: 3 },
  { name: "提交季度风险排查记录", type: "资料报送", source: "临时任务", app: "双重预防机制", depts: ["安全管理部", "生产管理部"], limit: 48, weight: 4 },
  { name: "补充生产日报说明", type: "资料报送", source: "临时任务", app: "生产管理", depts: ["生产管理部", "选矿车间"], limit: 24, weight: 4 },
];

// 日常巡检表：巡检区域取自表单的下拉选项，预警按「设置 › 预警」里给这张表配置的规则判定。
const INSPECTION_AREAS = INSPECTION_FORM.fields.find((field) => field.key === "area").options;
const INSPECTION_COMPARE = {
  大于: (actual, target) => actual > target,
  大于等于: (actual, target) => actual >= target,
  等于: (actual, target) => actual === target,
};
const SHIFT_START_HOUR = { 早班: 8, 中班: 16, 晚班: 0 };

// 隐患分级预警规则：隐患等级 → 预警风险等级。每条发现隐患的记录触发一条预警。
const HAZARD_RISK = { 重大隐患: "一级", 较大隐患: "二级", 一般隐患: "三级" };

const ALERT_LIMIT_HOURS = { 一级: 4, 二级: 8, 三级: 24, 四级: 48 };

const FORM_NAMES = {
  form_hazard: "岗位隐患排查表",
  form_equipment: "设备点检记录表",
  form_explosive: "火工品领用登记表",
  form_fire: "消防设施巡检表",
  form_hotwork: "动火作业申请表",
  form_inspection: INSPECTION_FORM.name,
};

// Points a flow / task / alert at the form record it belongs to. Record numbers are handed
// out after generation, so the record object itself is kept until numberRecords() runs.
function linkSource(row, source) {
  row.sourceDataset = source?.datasetId ?? null;
  row.sourceForm = source ? FORM_NAMES[source.datasetId] : null;
  row.sourceNo = null;
  if (source) row._source = source.record;
  return row;
}
const sourceOf = (datasetId, record) => ({ datasetId, record });

const pad = (value, length = 2) => String(value).padStart(length, "0");
const round1 = (value) => Math.round(value * 10) / 10;

export function startOfDay(ms) {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function dateKey(ms) {
  const date = new Date(ms);
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function weekIndex(ms) {
  const dayNumber = Math.floor((ms - new Date(ms).getTimezoneOffset() * 60000) / DAY);
  return Math.floor((dayNumber + 3) / 7);
}

// Each calendar week has its own temperament so trends are not flat. One week in five
// is a 专项检查周 during which far more hazards get reported.
function weekMood(ms) {
  const week = weekIndex(ms);
  return {
    factor: 0.85 + createRng(`week:${week}`).next() * 0.35,
    campaign: hashString(`campaign:${week}`) % 5 === 0,
  };
}

function shiftOf(ms) {
  const hour = new Date(ms).getHours();
  if (hour >= 8 && hour < 16) return "早班";
  if (hour >= 16) return "中班";
  return "晚班";
}

function timeInShift(rng, day0, shift) {
  const startHour = shift === "早班" ? 8 : shift === "中班" ? 16 : 0;
  return day0 + startHour * HOUR + Math.floor(rng.next() * 8 * HOUR);
}

const siteByLocation = (location) => SITES.find((site) => site.location === location) ?? SITES[0];
const personOf = (rng, dept) => rng.pick(PEOPLE[dept] ?? PEOPLE.安全管理部);

function createContext(tables, now, live = false) {
  return { tables, now, live };
}

// History keeps follow-up events at their scheduled time (and drops them later if they have
// not happened yet). A live submission can only cause things that happen right now.
function eventTime(ctx, time) {
  if (!ctx.live) return time;
  return time - ctx.now > 45 * 60000 ? null : ctx.now;
}

function pushTask(ctx, rng, input) {
  const { limitHours, spendHours } = input;
  const time = eventTime(ctx, input.time);
  if (time === null) return;
  const deadline = time + limitHours * HOUR;
  const finishAt = time + spendHours * HOUR;
  const withdrawn = rng.chance(input.source === "周期任务" ? 0.02 : 0.05);
  const abandoned = rng.chance(0.04);
  let status = "待执行";
  let finishedAt = null;
  let spentHours = null;
  let overdue = "否";
  if (withdrawn && ctx.now - time > HOUR) {
    status = "已撤回";
  } else if (!abandoned && ctx.now >= finishAt) {
    status = "已完成";
    finishedAt = finishAt;
    spentHours = round1(spendHours);
    overdue = finishAt > deadline ? "是" : "否";
  } else if (ctx.now > deadline) {
    status = "已超期";
    overdue = "是";
  } else if (ctx.now - time > Math.min(spendHours, limitHours) * HOUR * 0.25) {
    status = "执行中";
  }
  ctx.tables.task_record.push(linkSource({
    taskName: input.name,
    taskType: input.type,
    source: input.source,
    app: input.app,
    publisher: input.publisher,
    executor: input.executor,
    department: input.department,
    publishedAt: time,
    deadline,
    finishedAt,
    status,
    overdue,
    spentHours,
  }, input.record));
}

function pushAlert(ctx, rng, input) {
  const time = eventTime(ctx, input.time);
  if (time === null) return;
  const limit = ALERT_LIMIT_HOURS[input.riskLevel];
  const handleSpan = rng.float(limit * 0.15, limit * 1.3, 2);
  const ignored = rng.chance(0.05);
  const closed = rng.chance(0.12);
  const elapsed = (ctx.now - time) / HOUR;
  let status = "待处置";
  let handleHours = null;
  let overdue = "否";
  if (!ignored && elapsed >= handleSpan) {
    status = closed ? "已关闭" : "已处置";
    handleHours = round1(handleSpan);
    overdue = handleSpan > limit ? "是" : "否";
  } else if (elapsed > limit) {
    status = "超期未处置";
    overdue = "是";
  } else if (elapsed > Math.min(handleSpan, limit) * 0.25) {
    status = "处置中";
  }
  ctx.tables.alert_record.push(linkSource({
    content: input.content,
    rule: input.rule,
    app: input.app,
    riskLevel: input.riskLevel,
    accidentType: input.accidentType,
    location: input.location,
    triggeredAt: time,
    department: input.department,
    handler: input.handler,
    status,
    overdue,
    handleHours,
  }, input.record));
}

function pushFlow(ctx, rng, input) {
  const { nodes, outcome, spanHours } = input;
  const time = eventTime(ctx, input.time) ?? ctx.now;
  const elapsed = (ctx.now - time) / HOUR;
  const finished = elapsed >= spanHours;
  const status = finished ? outcome : "审批中";
  let currentNode = nodes[Math.min(nodes.length - 1, Math.floor((elapsed / spanHours) * nodes.length))];
  if (finished) {
    currentNode = outcome === "已撤销" ? "流程已撤销" : outcome === "已驳回" ? "已驳回至发起人" : "流程已结束";
  }
  const overtime = (finished ? spanHours : elapsed) > 24 ? "是" : "否";
  ctx.tables.flow_instance.push(linkSource({
    flowName: input.name,
    app: input.app,
    category: input.category,
    initiator: input.initiator,
    department: input.department,
    startedAt: time,
    currentNode,
    status,
    urgency: input.urgency,
    nodeCount: nodes.length,
    durationHours: finished ? round1(spanHours) : null,
    overtime,
  }, input.record));
  return status;
}

const flowOutcome = (rng) => rng.weighted([["已通过", 76], ["已拒绝", 7], ["已驳回", 8], ["已撤销", 9]]);
const flowSpan = (rng, urgent) =>
  urgent ? rng.float(1, 14, 2) : rng.weighted([[rng.float(2, 12, 2), 46], [rng.float(12, 26, 2), 34], [rng.float(26, 70, 2), 20]]);

function emitHazard(ctx, rng, time, mood) {
  const site = rng.pick(SITES);
  const shift = shiftOf(time);
  const submitter = personOf(rng, site.dept);
  const shiftFactor = shift === "晚班" ? 1.35 : shift === "中班" ? 1.1 : 1;
  const probability = Math.min(0.75, 0.19 * site.risk * shiftFactor * mood.factor * (mood.campaign ? 1.6 : 1));
  const found = rng.chance(probability);
  const record = {
    submittedAt: time,
    submitter,
    department: site.dept,
    app: "双重预防机制",
    shift,
    location: site.location,
    post: rng.pick(site.posts),
    result: found ? "发现隐患" : "正常",
    hazardCount: 0,
    hazardType: "无",
    hazardLevel: "无",
    rectifyStatus: "无需整改",
    rectifyHours: null,
  };
  if (found) {
    const level = rng.weighted([["一般隐患", 79], ["较大隐患", 17], ["重大隐患", 4]]);
    const limitHours = level === "重大隐患" ? 24 : level === "较大隐患" ? 48 : 72;
    const spendHours = rng.float(limitHours * 0.12, limitHours * 1.18, 2);
    const stuck = rng.chance(0.06);
    const elapsed = (ctx.now - time) / HOUR;
    record.hazardCount = rng.weighted([[1, 66], [2, 25], [3, 9]]);
    record.hazardType = rng.weighted([["设备设施", 34], ["作业环境", 30], ["个体防护", 20], ["安全管理", 16]]);
    record.hazardLevel = level;
    if (!stuck && elapsed >= spendHours) {
      record.rectifyStatus = "已整改";
      record.rectifyHours = round1(spendHours);
    } else if (elapsed > limitHours) {
      record.rectifyStatus = "已逾期";
    } else if (elapsed > spendHours * 0.3) {
      record.rectifyStatus = "整改中";
    } else {
      record.rectifyStatus = "待整改";
    }

    // 一条发现隐患的记录：按隐患分级预警规则触发一条预警，并派发一条整改任务；重大隐患另走审批流程。
    const source = sourceOf("form_hazard", record);
    const executor = personOf(rng, site.dept);
    pushAlert(ctx, rng, {
      time,
      content: `${level}预警（${record.hazardType}）`,
      rule: "隐患分级预警规则",
      app: "双重预防机制",
      riskLevel: HAZARD_RISK[level],
      accidentType: rng.pick(site.accidents),
      location: site.location,
      department: site.dept,
      handler: executor,
      record: source,
    });
    pushTask(ctx, rng, {
      time,
      name: `${site.location}隐患整改`,
      type: "隐患整改",
      source: "隐患整改",
      app: "双重预防机制",
      publisher: LEADERS[site.dept],
      executor,
      department: site.dept,
      limitHours,
      spendHours,
      record: source,
    });
    if (level === "重大隐患") {
      pushFlow(ctx, rng, {
        time,
        name: "重大隐患整改审批流程",
        app: "双重预防机制",
        category: "安全管理",
        initiator: submitter,
        department: site.dept,
        nodes: ["车间主任审批", "安全管理部审批", "分管领导审批", "矿长审批"],
        urgency: "紧急",
        outcome: rng.weighted([["已通过", 90], ["已驳回", 10]]),
        spanHours: flowSpan(rng, true),
        record: source,
      });
    }
  }
  ctx.tables.form_hazard.push(record);
}

function emitEquipment(ctx, rng, time, device, mood) {
  const abnormal = rng.chance(device.fault * (0.7 + mood.factor * 0.3));
  const faultType = abnormal
    ? rng.weighted([["振动超标", 26], ["温度偏高", 24], ["漏油", 16], ["异响", 14], ["紧固松动", 12], ["仪表失灵", 8]])
    : "无";
  const downtimeMinutes = abnormal ? rng.int(20, 240) : rng.chance(0.08) ? rng.int(5, 20) : 0;
  const submitter = personOf(rng, rng.chance(0.6) ? "设备管理部" : device.dept);
  const record = {
    submittedAt: time,
    submitter,
    department: device.dept,
    app: "设备管理",
    equipment: device.name,
    equipmentType: device.type,
    result: abnormal ? "异常" : "正常",
    faultType,
    temperature: rng.around(device.temp + (faultType === "温度偏高" ? 19 : 0), 7, 1),
    vibration: faultType === "振动超标" ? rng.float(7.1, 11.4, 1) : Math.max(0.4, rng.around(2.4, 1.6, 1)),
    runHours: round1(Math.max(0, rng.float(17, 23.5, 1) - downtimeMinutes / 60)),
    downtimeMinutes,
  };
  ctx.tables.form_equipment.push(record);
  if (!abnormal) return;
  // 一条点检异常的记录派发一条检修任务；温度、振动超限的另按设备运行异常预警规则触发预警。
  const source = sourceOf("form_equipment", record);
  const executor = personOf(rng, "设备管理部");
  pushTask(ctx, rng, {
    time,
    name: `${device.name}检修`,
    type: "设备检修",
    source: faultType === "温度偏高" || faultType === "振动超标" ? "预警派发" : "临时任务",
    app: "设备管理",
    publisher: LEADERS.设备管理部,
    executor,
    department: "设备管理部",
    limitHours: 24,
    spendHours: rng.float(2, 30, 2),
    record: source,
  });
  if (faultType === "温度偏高" || faultType === "振动超标") {
    pushAlert(ctx, rng, {
      time,
      content: faultType === "温度偏高" ? "设备运行温度超限预警" : "设备振动超限预警",
      rule: "设备运行异常预警规则",
      app: "设备管理",
      riskLevel: downtimeMinutes > 150 ? "二级" : "三级",
      accidentType: faultType === "温度偏高" ? "灼烫" : "机械伤害",
      location: device.location,
      department: device.dept,
      handler: executor,
      record: source,
    });
  }
}

function emitProduction(ctx, rng, time, team, mood, weekend, teamIndex) {
  const performance = rng.around(0.965, 0.1, 3) * (weekend ? 0.93 : 1) * (0.96 + (mood.factor - 1.02) * 0.2);
  ctx.tables.form_production.push({
    submittedAt: time,
    submitter: personOf(rng, team.dept),
    department: team.dept,
    app: "生产管理",
    team: team.team,
    process: team.process,
    shift: ["早班", "中班", "晚班"][(weekIndex(time) + teamIndex) % 3],
    planOutput: team.plan,
    actualOutput: Math.round(team.plan * performance),
    footage: team.footage ? round1(team.footage * rng.around(1, 0.18, 3)) : null,
    attendance: rng.int(18, 32),
    machineHours: rng.float(30, 62, 1),
    grade: team.process === "采矿" || team.process === "选矿" ? rng.around(2.2, 0.4, 2) : null,
  });
}

function emitExplosive(ctx, rng, time) {
  const item = rng.weighted(EXPLOSIVES.map((entry) => [entry, entry.weight]));
  const site = siteByLocation(rng.pick(["东翼 1# 采场", "南区 2# 采场", "西翼 3# 平巷", "西翼 2# 平巷"]));
  const issuedQty = rng.int(item.min, item.max);
  const returnedQty = rng.chance(0.55) ? Math.round(issuedQty * rng.float(0.01, 0.09, 3)) : 0;
  const matched = rng.chance(0.972) ? "是" : "否";
  const submitter = personOf(rng, site.dept);
  const record = {
    submittedAt: time,
    submitter,
    department: site.dept,
    app: "火工品管理",
    material: item.material,
    unit: item.unit,
    location: site.location,
    shift: shiftOf(time),
    issuedQty,
    usedQty: issuedQty - returnedQty - (matched === "否" ? rng.int(1, 4) : 0),
    returnedQty,
    matched,
  };
  ctx.tables.form_explosive.push(record);
  if (matched === "否") {
    pushAlert(ctx, rng, {
      time,
      content: "火工品账物不符预警",
      rule: "火工品账物核对预警规则",
      app: "火工品管理",
      riskLevel: "一级",
      accidentType: "放炮",
      location: site.location,
      department: site.dept,
      handler: LEADERS[site.dept],
      record: sourceOf("form_explosive", record),
    });
  }
}

function emitFire(ctx, rng, time) {
  const area = rng.pick(FIRE_AREAS);
  const facility = rng.weighted([["灭火器", 34], ["消火栓", 20], ["应急照明", 16], ["烟感报警", 12], ["疏散标志", 12], ["消防水泵", 6]]);
  const checkedCount = rng.int(4, 20);
  const failed = rng.chance(0.13);
  const submitter = personOf(rng, rng.chance(0.7) ? "安全管理部" : "综合管理部");
  const record = {
    submittedAt: time,
    submitter,
    department: area.dept,
    app: "消防管理",
    area: area.area,
    facility,
    result: failed ? "不合格" : "合格",
    issue: failed ? rng.weighted([["压力不足", 30], ["过期", 24], ["缺失", 14], ["损坏", 18], ["遮挡", 14]]) : "无",
    checkedCount,
    failedCount: failed ? rng.int(1, Math.min(3, checkedCount)) : 0,
  };
  ctx.tables.form_fire.push(record);
  if (failed) {
    pushTask(ctx, rng, {
      time,
      name: `${area.area}消防设施整改`,
      type: "隐患整改",
      source: "隐患整改",
      app: "消防管理",
      publisher: submitter,
      executor: personOf(rng, area.dept),
      department: area.dept,
      limitHours: 72,
      spendHours: rng.float(6, 84, 2),
      record: sourceOf("form_fire", record),
    });
  }
}

function emitHotwork(ctx, rng, time) {
  const site = rng.pick(HOTWORK_SITES);
  const level = rng.weighted([["二级", 70], ["一级", 24], ["特级", 6]]);
  const submitter = personOf(rng, site.dept);
  const overtime = rng.chance(0.07) ? "是" : "否";
  const record = { submittedAt: time, submitter, department: site.dept, app: "安全管理", level };
  const source = sourceOf("form_hotwork", record);
  // 每份申请发起一条动火作业审批流程，表上的审批状态跟着流程走。
  const approvalStatus = pushFlow(ctx, rng, {
    time,
    name: "动火作业审批流程",
    app: "安全管理",
    category: "安全管理",
    initiator: submitter,
    department: site.dept,
    nodes: level === "特级"
      ? ["部门负责人审批", "安全管理部审批", "分管领导审批", "矿长审批"]
      : ["部门负责人审批", "安全管理部审批"],
    urgency: level === "二级" ? "常规" : "紧急",
    outcome: rng.weighted([["已通过", 86], ["已拒绝", 8], ["已撤销", 6]]),
    spanHours: flowSpan(rng, level !== "二级"),
    record: source,
  });
  Object.assign(record, {
    workType: rng.weighted([["电焊", 46], ["气割", 30], ["打磨", 18], ["喷灯", 6]]),
    location: site.location,
    guardian: personOf(rng, "安全管理部"),
    durationHours: rng.float(1, 6.5, 1),
    approvalStatus,
    overtime: approvalStatus === "已通过" ? overtime : "否",
  });
  ctx.tables.form_hotwork.push(record);
  if (approvalStatus === "已通过" && overtime === "是") {
    pushAlert(ctx, rng, {
      time: time + rng.int(26, 40) * HOUR,
      content: "动火作业超时预警",
      rule: "动火作业超时预警规则",
      app: "安全管理",
      riskLevel: "二级",
      accidentType: "火灾",
      location: site.location,
      department: site.dept,
      handler: LEADERS[site.dept],
      record: source,
    });
  }
}

// 日常巡检表：一次巡检提交一条记录，随即发起日常巡检审批流程；检测值超出规则阈值的触发预警。
// 每条记录都对应「每日巡检任务」的一次执行。
function emitInspection(ctx, rng, time) {
  const site = siteByLocation(rng.pick(INSPECTION_AREAS));
  const shift = shiftOf(time);
  const submitter = personOf(rng, rng.chance(0.5) ? "安全管理部" : site.dept);
  const values = {
    co: rng.chance(0.04) ? rng.int(24, 46) : rng.int(3, 19),
    roof: rng.chance(0.025) ? rng.int(31, 52) : rng.int(4, 24),
    temp: rng.chance(0.035) ? rng.int(81, 97) : rng.int(48, 76),
    fan: rng.chance(0.02) ? "故障" : "正常",
    guard: rng.chance(0.025) ? "缺失" : "完好",
  };
  const hits = [];
  INSPECTION_RULES.forEach((rule) => {
    rule.conds.forEach((cond) => {
      if (INSPECTION_COMPARE[cond.logic](values[cond.field], cond.value)) hits.push({ rule, cond });
    });
  });
  const record = {
    submittedAt: time,
    submitter,
    department: site.dept,
    app: INSPECTION_FLOW.application,
    location: site.location,
    shift,
    ...values,
    alerted: hits.length ? "是" : "否",
    note: hits.length ? `${hits.map((hit) => hit.cond.content.replace("预警", "")).join("、")}，已现场处置并上报。` : "",
  };
  const source = sourceOf("form_inspection", record);
  record.approvalStatus = pushFlow(ctx, rng, {
    time,
    name: INSPECTION_FLOW.name,
    app: INSPECTION_FLOW.application,
    category: INSPECTION_FLOW.category,
    initiator: submitter,
    department: site.dept,
    nodes: [INSPECTION_FLOW.approvalNode],
    urgency: hits.length ? "紧急" : "常规",
    outcome: rng.weighted([["已通过", 93], ["已驳回", 5], ["已撤销", 2]]),
    spanHours: rng.float(0.4, 9, 2),
    record: source,
  });
  ctx.tables.form_inspection.push(record);

  const publishedAt = startOfDay(time) + SHIFT_START_HOUR[shift] * HOUR;
  ctx.tables.task_record.push(linkSource({
    taskName: INSPECTION_TASK.name,
    taskType: "巡检",
    source: "周期任务",
    app: INSPECTION_FLOW.application,
    publisher: LEADERS.安全管理部,
    executor: submitter,
    department: site.dept,
    publishedAt,
    deadline: publishedAt + 8 * HOUR,
    finishedAt: time,
    status: "已完成",
    overdue: "否",
    spentHours: round1((time - publishedAt) / HOUR),
  }, source));

  hits.forEach(({ rule, cond }) => {
    pushAlert(ctx, rng, {
      time,
      content: cond.content,
      rule: rule.name,
      app: INSPECTION_FLOW.application,
      riskLevel: cond.level,
      accidentType: cond.type,
      location: site.location,
      department: site.dept,
      handler: submitter,
      record: source,
    });
  });
}

function emitGeneralFlow(ctx, rng, time) {
  const template = rng.weighted(GENERAL_FLOWS.map((entry) => [entry, entry.weight]));
  const department = rng.pick(template.depts);
  const urgent = rng.chance(0.18);
  pushFlow(ctx, rng, {
    time,
    name: template.name,
    app: template.app,
    category: template.category,
    initiator: personOf(rng, department),
    department,
    nodes: template.nodes,
    urgency: urgent ? "紧急" : "常规",
    outcome: flowOutcome(rng),
    spanHours: flowSpan(rng, urgent),
  });
}

function emitRoutineTask(ctx, rng, time) {
  const template = rng.weighted(ROUTINE_TASKS.map((entry) => [entry, entry.weight]));
  const department = rng.pick(template.depts);
  pushTask(ctx, rng, {
    time,
    name: template.name,
    type: template.type,
    source: template.source,
    app: template.app,
    publisher: rng.chance(0.5) ? LEADERS[department] : personOf(rng, "安全管理部"),
    executor: personOf(rng, department),
    department,
    limitHours: template.limit,
    spendHours: rng.float(template.limit * 0.2, template.limit * 1.16, 2),
  });
}

function generateDay(ctx, day0) {
  const key = dateKey(day0);
  const weekday = new Date(day0).getDay();
  const weekend = weekday === 0 || weekday === 6;
  const mood = weekMood(day0);
  // The day generator only decides how many records exist and when. Each record draws its
  // contents from its own generator, so skipping not-yet-happened records keeps the rest stable.
  const each = (name, count, timeOf, emit) => {
    const dayRng = createRng(`${name}:${key}`);
    const total = typeof count === "function" ? count(dayRng) : count;
    for (let index = 0; index < total; index += 1) {
      const time = timeOf(dayRng, index);
      if (time > ctx.now) continue;
      emit(createRng(`${name}:${key}:${index}`), time, index);
    }
  };
  const anyShift = (rng) => timeInShift(rng, day0, rng.weighted([["早班", 45], ["中班", 35], ["晚班", 20]]));
  const officeHours = (rng) => day0 + 8 * HOUR + Math.floor(rng.next() * 9.5 * HOUR);

  each("hazard", (rng) => (weekend ? rng.int(5, 7) : rng.int(7, 10)) + (mood.campaign ? 2 : 0), anyShift, (rng, time) =>
    emitHazard(ctx, rng, time, mood));
  each("equipment", DEVICES.length, (rng) => day0 + 8 * HOUR + Math.floor(rng.next() * 3.5 * HOUR), (rng, time, index) =>
    emitEquipment(ctx, rng, time, DEVICES[index], mood));
  each("production", TEAMS.length, (rng) => day0 + 16 * HOUR + Math.floor(rng.next() * 100 * 60000), (rng, time, index) =>
    emitProduction(ctx, rng, time, TEAMS[index], mood, weekend, index));
  each("explosive", (rng) => (weekend ? rng.int(1, 3) : rng.int(2, 4)), anyShift, (rng, time) => emitExplosive(ctx, rng, time));
  each("fire", (rng) => rng.int(3, 5), officeHours, (rng, time) => emitFire(ctx, rng, time));
  each("hotwork", (rng) => (weekend ? rng.int(0, 1) : rng.int(1, 3)), officeHours, (rng, time) => emitHotwork(ctx, rng, time));
  each("flow", (rng) => (weekend ? rng.int(0, 1) : rng.int(2, 4)), officeHours, (rng, time) => emitGeneralFlow(ctx, rng, time));
  each("task", (rng) => (weekend ? rng.int(2, 3) : rng.int(3, 6)), officeHours, (rng, time) => emitRoutineTask(ctx, rng, time));
  each("inspection", (rng) => (weekend ? rng.int(5, 7) : rng.int(7, 10)), anyShift, (rng, time) => emitInspection(ctx, rng, time));
}

// `first` is the first number handed out each day. 日常巡检表 and the three platform datasets
// start at 11: the numbers below that belong to the records people submit through the
// 每日巡检任务 itself (see scenarioRows.js), and the two must never collide.
const NUMBERING = {
  form_hazard: { time: "submittedAt", key: "id", make: (day, seq) => `YH-${day}-${pad(seq, 3)}` },
  form_equipment: { time: "submittedAt", key: "id", make: (day, seq) => `DJ-${day}-${pad(seq, 3)}` },
  form_production: { time: "submittedAt", key: "id", make: (day, seq) => `RB-${day}-${pad(seq, 3)}` },
  form_explosive: { time: "submittedAt", key: "id", make: (day, seq) => `HG-${day}-${pad(seq, 3)}` },
  form_fire: { time: "submittedAt", key: "id", make: (day, seq) => `XF-${day}-${pad(seq, 3)}` },
  form_hotwork: { time: "submittedAt", key: "id", make: (day, seq) => `DH-${day}-${pad(seq, 3)}` },
  form_inspection: { time: "submittedAt", key: "id", first: 11, make: (day, seq) => `XJ-${day}-${pad(seq, 3)}` },
  // 流程编号：年月日 + 4 位自增数，共 12 位纯数字。
  flow_instance: { time: "startedAt", key: "flowNo", first: 11, make: (day, seq) => `${day}${pad(seq, 4)}` },
  task_record: { time: "publishedAt", key: "taskNo", first: 11, make: (day, seq) => `T${day}${pad(seq, 3)}` },
  alert_record: { time: "triggeredAt", key: "alertNo", first: 11, make: (day, seq) => `WRN-${day}-${pad(seq, 3)}` },
};

// Numbers are handed out in chronological order per day, so they stay the same however
// late in the day the page is opened.
function numberRecords(tables, counters) {
  Object.entries(NUMBERING).forEach(([datasetId, rule]) => {
    const rows = tables[datasetId];
    rows.sort((left, right) => left[rule.time] - right[rule.time]);
    rows.forEach((row) => {
      if (row.id) return;
      const day = dateKey(row[rule.time]);
      const counterKey = `${datasetId}:${day}`;
      const seq = (counters.get(counterKey) ?? (rule.first ?? 1) - 1) + 1;
      counters.set(counterKey, seq);
      row[rule.key] = rule.make(day, seq);
      row.id = row[rule.key];
    });
  });
  // Every record has its number now, so the pointers to source records can be resolved.
  Object.keys(NUMBERING).forEach((datasetId) => {
    tables[datasetId].forEach((row) => {
      if (!row._source) return;
      row.sourceNo = row._source.id;
      delete row._source;
    });
  });
}

export function createEmptyTables() {
  return Object.fromEntries(Object.keys(NUMBERING).map((datasetId) => [datasetId, []]));
}

export function generateHistory(now = Date.now()) {
  const tables = createEmptyTables();
  const counters = new Map();
  const ctx = createContext(tables, now);
  const today = startOfDay(now);
  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset -= 1) {
    // Using a calendar date keeps the walk correct across daylight-saving changes.
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    generateDay(ctx, date.getTime());
  }
  // Follow-up alerts are scheduled after their source record and may not have fired yet.
  Object.entries(NUMBERING).forEach(([datasetId, rule]) => {
    tables[datasetId] = tables[datasetId].filter((row) => row[rule.time] <= now);
  });
  numberRecords(tables, counters);
  return { tables, counters };
}

const LIVE_KINDS = [
  ["hazard", 28],
  ["inspection", 16],
  ["equipment", 14],
  ["explosive", 8],
  ["fire", 9],
  ["hotwork", 7],
  ["flow", 8],
  ["task", 10],
];

// Appends one freshly submitted record (plus whatever it triggers) stamped with `now`.
// Returns the ids of the datasets that received new rows.
export function appendLiveSubmission(tables, counters, now = Date.now()) {
  const before = Object.fromEntries(Object.entries(tables).map(([datasetId, rows]) => [datasetId, rows.length]));
  const ctx = createContext(tables, now, true);
  const rng = createRng(Math.floor(Math.random() * 4294967296));
  const mood = weekMood(now);
  const kind = rng.weighted(LIVE_KINDS);
  if (kind === "hazard") emitHazard(ctx, rng, now, { ...mood, factor: mood.factor * 1.5 });
  if (kind === "equipment") emitEquipment(ctx, rng, now, rng.pick(DEVICES), { ...mood, factor: mood.factor * 2.4 });
  if (kind === "explosive") emitExplosive(ctx, rng, now);
  if (kind === "fire") emitFire(ctx, rng, now);
  if (kind === "hotwork") emitHotwork(ctx, rng, now);
  if (kind === "flow") emitGeneralFlow(ctx, rng, now);
  if (kind === "task") emitRoutineTask(ctx, rng, now);
  if (kind === "inspection") emitInspection(ctx, rng, now);
  numberRecords(tables, counters);
  return Object.keys(tables).filter((datasetId) => tables[datasetId].length > before[datasetId]);
}
