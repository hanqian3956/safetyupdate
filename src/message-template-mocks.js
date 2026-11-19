// Templates from 消息模版.xlsx / 消息触发表; row numbers preserve traceability.
export const messageTemplates = [
  { row: 2, source: "任务", type: "任务派发", text: "{发布人}发布的「{任务名称}」，任务编号为「{任务编号}」，须在{任务结束时间}前完成" },
  { row: 3, source: "任务", type: "任务调整", recipient: "新执行人", text: "{操作人}已将「{任务名称}」，任务编号为「{任务编号}」，由{原执行人}调整给你，须在{任务结束时间}前完成" },
  { row: 4, source: "任务", type: "任务调整", recipient: "原执行人", text: "{操作人}已将「{任务名称}」，任务编号为「{任务编号}」，的执行人由你调整为{新执行人}，你的待办已关闭，无需继续处理" },
  { row: 5, source: "任务", type: "任务转办", text: "{转办人}将「{任务名称}」，任务编号为「{任务编号}」，转给你，须在{任务结束时间}前完成" },
  { row: 6, source: "任务", type: "任务开始提醒", text: "{发布人}发布的「{任务名称}」，任务编号为「{任务编号}」，将于{任务开始时间}开始，请准时执行" },
  { row: 7, source: "任务", type: "任务结束提醒", text: "{发布人}发布的「{任务名称}」，任务编号为「{任务编号}」，将于{任务结束时间}结束，请尽快执行" },
  { row: 8, source: "任务", type: "任务超期提醒", text: "{发布人}发布的「{任务名称}」，任务编号为「{任务编号}」，已超期{超期时长}，请尽快处理" },
  { row: 9, source: "任务", type: "任务撤回", text: "{操作人}撤回了「{任务名称}」的本次执行，任务编号为「{任务编号}」：撤回原因为{撤回原因}，无需继续处理" },
  { row: 10, source: "任务", type: "任务作废", text: "{操作人}作废了「{任务名称}」的本次执行。任务编号为「{任务编号}」：作废原因为{作废原因}，无需继续处理" },
  { row: 11, source: "任务", type: "任务完成", recipient: "任务发起人", text: "{执行人}等{执行人数}人已全部提交「{任务名称}」（任务编号 {任务编号}），本次执行已{完成情况}完成；" },
  { row: 12, source: "预警", type: "预警派发", text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，须在{处理期限}前进行处理" },
  { row: 13, source: "预警", type: "预警知会", recipient: "通知人", text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，处理人为{处理人}，须在{处理期限}前完成，请知悉" },
  { row: 14, source: "预警", type: "预警派发异常", recipient: "企业管理员", text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，「{角色类别}」未找到处理人，请尽快指派相应的预警处理人" },
  { row: 15, source: "预警", type: "预警指派", text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，{操作人}指派给你，须在{处理期限}前进行处理" },
  { row: 16, source: "预警", type: "预警转发", text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，{转发人}转给你{转办说明片段}，须在{处理期限}前进行处理" },
  { row: 17, source: "预警", type: "预警调整", recipient: "新处理人", text: "{操作人}已将「{预警内容}」（预警编号 {预警编号}）的处理人由{原处理人}调整为你，须在{处理期限}前进行处理" },
  { row: 18, source: "预警", type: "预警调整", recipient: "原处理人", text: "{操作人}已将「{预警内容}」（预警编号 {预警编号}）的处理人由你调整为{新处理人}{调整原因片段}，你的待办已关闭，无需继续处理" },
  { row: 19, source: "预警", type: "预警超期提醒", recipient: "未提交处理人（催办）", text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，已超期{超期时长}，请尽快提交处置" },
  { row: 20, source: "预警", type: "预警完成", recipient: "处理人及通知人", text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，{提交人}已提交处置，任务闭环" },
  { row: 21, source: "预警", type: "预警作废", recipient: "处理人及通知人", text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，{操作人}作废该预警：{作废原因}" },
];

const values = {
  发布人: "李明", 任务名称: "东区3号矿井日常巡检", 任务编号: "DQ3H202611190001",
  任务开始时间: "2026-11-19 11:00:00", 任务结束时间: "2026-11-19 17:00:00",
  操作人: "陈伟", 原执行人: "王建国", 新执行人: "李强", 转办人: "李明",
  超期时长: "30分钟", 撤回原因: "现场停产，取消本次巡检", 作废原因: "重复生成记录",
  执行人: "王建国", 执行人数: 2, 完成情况: "准时",
  表单提交人: "李强", 工作表名: "安全巡检记录表", 预警内容: "设备温度超限预警",
  预警编号: "WRN-20261119-001", 处理期限: "2026-11-19 18:00:00",
  处理人: "张宇、王建国", 角色类别: "动态号负责人", 转发人: "李明",
  转办说明片段: "：请协助核查设备温度", 原处理人: "王建国", 新处理人: "李强",
  调整原因片段: "，原处理人调休", 提交人: "张宇",
};

export function renderMessageTemplate(template, params) {
  return template.replace(/\{([^{}]+)\}/g, (_, key) => {
    if (params[key] === undefined) throw new Error(`Missing message template value: ${key}`);
    return String(params[key]);
  });
}

export function createTemplateMessageMocks() {
  const examples = messageTemplates.map((template) => ({ ...template }));
  examples.splice(10, 0, {
    row: 11, variant: "single", source: "任务", type: "任务完成", recipient: "任务发起人（单人任务）",
    text: "{执行人}已提交「{任务名称}」（任务编号 {任务编号}），本次执行已{完成情况}完成",
    params: { 完成情况: "超期30分钟" },
  });
  examples.push({
    row: 19, variant: "report", source: "预警", type: "预警超期提醒", recipient: "其他提醒人（上报）",
    text: "{表单提交人}提交的「{工作表名}」触发了「{预警内容}」，预警编号为「{预警编号}」，已超期{超期时长}，未提交：{未提交人}",
    params: { 未提交人: "王建国" },
  }, {
    ...messageTemplates.find((template) => template.row === 16),
    variant: "without-note", params: { 转办说明片段: "" },
  }, {
    ...messageTemplates.find((template) => template.row === 18),
    variant: "without-reason", params: { 调整原因片段: "" },
  });
  return examples.map((template, index) => {
    const params = { ...values, ...template.params };
    const time = `2026-11-19 10:${String(35 - index).padStart(2, "0")}:00`;
    if (template.type.includes("超期") || template.variant === "single") {
      const deadline = new Date(Date.parse(time.replace(" ", "T") + "+08:00") - 30 * 60 * 1000)
        .toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
      if (template.source === "任务") params.任务结束时间 = deadline;
      else params.处理期限 = deadline;
    }
    return {
      id: `template-message-${template.row}-${template.variant || "default"}`,
      source: template.source,
      type: template.type,
      sender: template.source === "任务" ? params.任务名称 : params.预警内容,
      title: template.source === "任务" ? params.任务名称 : params.预警内容,
      time,
      content: renderMessageTemplate(template.text, params),
      // 消息中心直接显示业务类型，避免为类型标签再叠加装饰性中括号。
      keyword: template.type,
      navigationTab: getMessageNavigationTab(template),
      recipient: template.recipient || (template.source === "任务" ? "执行人" : "处理人"),
      templateRow: template.row,
      templateMock: true,
      read: false,
    };
  });
}

function getMessageNavigationTab(template) {
  if (template.source === "任务") {
    // 面向新执行人的消息进入待我执行；任务已关闭或已完成的消息进入已执行。
    return [4, 9, 10, 11].includes(template.row) ? "t-done" : "t-exec";
  }

  // 知会消息属于通知我；已闭环、作废或原处理人收到的调整消息归入已处理。
  if (template.row === 13) return "task-notify";
  if ([18, 20, 21].includes(template.row)) return "task-done";
  return "task-pending";
}
