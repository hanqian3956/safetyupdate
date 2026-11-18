// 日常巡检表、它的审批流程、每日巡检任务和预警在平台里是真实可操作的（见 src/scenario）。
// 这里把那边产生的记录换成数据集的行，这样用户刚提交的巡检表、刚处置的预警会出现在大屏里。

import {
  getInspectionState,
  INSPECTION_FLOW,
  INSPECTION_FORM,
  INSPECTION_RULES,
  INSPECTION_TASK,
  INSPECTION_USER,
  subscribeInspection,
} from "../../scenario/inspectionStore.js";

const HOUR = 3600000;
const SOURCE = { sourceDataset: "form_inspection", sourceForm: INSPECTION_FORM.name };
const round1 = (value) => Math.round(value * 10) / 10;

function buildRows(state, now) {
  const recordOf = new Map(state.records.map((record) => [record.id, record]));
  const flowOfRecord = new Map(state.flows.map((flow) => [flow.recordId, flow]));

  const forms = state.records.map((record) => ({
    id: record.id,
    submittedAt: record.submittedAt,
    submitter: record.values.inspector,
    department: INSPECTION_USER.dept,
    app: INSPECTION_FLOW.application,
    location: record.values.area,
    shift: record.values.shift,
    co: record.values.co,
    roof: record.values.roof,
    temp: record.values.temp,
    fan: record.values.fan,
    guard: record.values.guard,
    alerted: record.alertIds.length ? "是" : "否",
    approvalStatus: flowOfRecord.get(record.id)?.status ?? "审批中",
    note: record.values.note ?? "",
  }));

  const flows = state.flows.map((flow) => {
    const finished = flow.status !== "审批中";
    const hours = ((finished ? flow.handledAt ?? now : now) - flow.startedAt) / HOUR;
    return {
      id: flow.number,
      flowNo: flow.number,
      flowName: INSPECTION_FLOW.name,
      app: INSPECTION_FLOW.application,
      category: INSPECTION_FLOW.category,
      ...SOURCE,
      sourceNo: flow.recordId,
      initiator: recordOf.get(flow.recordId)?.values.inspector ?? INSPECTION_USER.name,
      department: INSPECTION_USER.dept,
      startedAt: flow.startedAt,
      currentNode: flow.currentNode,
      status: flow.status,
      urgency: recordOf.get(flow.recordId)?.alertIds.length ? "紧急" : "常规",
      nodeCount: 1,
      durationHours: finished ? round1(hours) : null,
      overtime: hours > 24 ? "是" : "否",
    };
  });

  const tasks = state.instances.map((instance) => {
    const done = instance.status === "done";
    const late = (done ? instance.submittedAt : now) > instance.deadlineAt;
    return {
      // 执行编号 I20261112001 对应任务编号 T20261112001。
      id: `T${instance.id.slice(1)}`,
      taskNo: `T${instance.id.slice(1)}`,
      taskName: INSPECTION_TASK.name,
      taskType: "巡检",
      source: "周期任务",
      app: INSPECTION_FLOW.application,
      sourceDataset: done ? SOURCE.sourceDataset : null,
      sourceForm: done ? SOURCE.sourceForm : null,
      sourceNo: done ? instance.recordId : null,
      publisher: INSPECTION_TASK.initiator,
      executor: instance.status === "forwarded" ? instance.forwardedTo : INSPECTION_TASK.executor,
      department: INSPECTION_USER.dept,
      publishedAt: instance.publishedAt,
      deadline: instance.deadlineAt,
      finishedAt: done ? instance.submittedAt : null,
      status: done ? "已完成" : late ? "已超期" : "待执行",
      overdue: late ? "是" : "否",
      spentHours: done ? round1((instance.submittedAt - instance.publishedAt) / HOUR) : null,
    };
  });

  const alerts = state.alerts.map((alert) => {
    const done = alert.status === "done";
    const late = (done ? alert.handledAt : now) > alert.dueAt;
    return {
      id: alert.id,
      alertNo: alert.id,
      content: alert.content,
      rule: INSPECTION_RULES.find((rule) => rule.id === alert.ruleId)?.name ?? "",
      ...SOURCE,
      sourceNo: alert.recordId,
      app: INSPECTION_FLOW.application,
      riskLevel: alert.level,
      accidentType: alert.type,
      location: recordOf.get(alert.recordId)?.values.area ?? "",
      triggeredAt: alert.triggeredAt,
      department: INSPECTION_USER.dept,
      handler: INSPECTION_USER.name,
      status: done ? "已处置" : late ? "超期未处置" : "待处置",
      overdue: late ? "是" : "否",
      handleHours: done ? round1((alert.handledAt - alert.triggeredAt) / HOUR) : null,
    };
  });

  return { form_inspection: forms, flow_instance: flows, task_record: tasks, alert_record: alerts };
}

let cached = { state: null, minute: -1, rows: {} };

/** Rows the 日常巡检 scenario contributes to a dataset; empty for datasets it does not touch. */
export function scenarioRows(datasetId, now = Date.now()) {
  const state = getInspectionState();
  // 待执行 / 待处置 turn into 已超期 as time passes, so rebuild at least once a minute.
  const minute = Math.floor(now / 60000);
  if (cached.state !== state || cached.minute !== minute) cached = { state, minute, rows: buildRows(state, now) };
  return cached.rows[datasetId] ?? null;
}

export const subscribeScenario = subscribeInspection;
