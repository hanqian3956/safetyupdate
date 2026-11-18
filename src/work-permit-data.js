export const WORK_PERMIT_APP_NAME = "作业票管理";

export const workPermitMenu = [
  { id: "wp-overview", name: "作业总览", children: [{ id: "wp-safety-overview", name: "作业总览" }] },
  { id: "wp-apply", name: "作业申请", children: [{ id: "wp-create", name: "作业申请" }] },
  { id: "wp-field", name: "现场执行", children: [{ id: "wp-start", name: "开工确认" }, { id: "wp-work", name: "作业执行" }, { id: "wp-guardian", name: "现场监护" }, { id: "wp-change", name: "变更与暂停" }] },
  { id: "wp-close", name: "验收归档", children: [{ id: "wp-acceptance", name: "待验收" }, { id: "wp-acceptance-log", name: "验收记录" }] },
  { id: "wp-alert", name: "预警统计", children: [{ id: "wp-alerts", name: "作业预警" }, { id: "wp-statistics", name: "作业统计" }] },
  { id: "wp-config", name: "基础配置", children: [{ id: "wp-template", name: "作业票模板" }, { id: "wp-rule", name: "审批与许可规则" }, { id: "wp-measure", name: "安全措施库" }, { id: "wp-qualification", name: "人员与资质" }] },
];

export const permitTypes = [
  { id: "hot", name: "动火作业票", mark: "焊", color: "#d65742", description: "焊接、切割、打磨等明火作业" },
  { id: "space", name: "有限空间作业票", mark: "限", color: "#7557c5", description: "罐、仓、巷道盲区等受限空间" },
  { id: "height", name: "高处作业票", mark: "高", color: "#2c88c7", description: "距坠落基准面 2 米及以上作业" },
  { id: "lift", name: "吊装作业票", mark: "吊", color: "#bd8a2c", description: "起重吊装、设备就位等作业" },
  { id: "electric", name: "临时用电作业票", mark: "电", color: "#2d9a83", description: "临时线路、配电箱及用电设备" },
  { id: "maintenance", name: "停送电及检维修工作票", mark: "修", color: "#4f718a", description: "停送电、检修和设备维护" },
  { id: "blasting", name: "爆破作业许可", mark: "爆", color: "#ad5961", description: "爆破器材使用及爆破现场作业" },
];

export const statusMeta = {
  "草稿": { tone: "draft", label: "草稿" },
  "审批中": { tone: "review", label: "审批中" },
  "待开工": { tone: "ready", label: "待开工" },
  "作业中": { tone: "working", label: "作业中" },
  "待验收": { tone: "accept", label: "待验收" },
  "已关闭": { tone: "closed", label: "已关闭" },
  "已驳回": { tone: "rejected", label: "已驳回" },
  "已撤回": { tone: "withdrawn", label: "已撤回" },
  "已暂停": { tone: "paused", label: "已暂停" },
  "已终止": { tone: "terminated", label: "已终止" },
  "已作废": { tone: "void", label: "已作废" },
};

const log = (at, actor, action, note = "") => ({ at, actor, action, note });

export const createWorkPermitData = () => [
  {
    id: "ZY-20261112-0001", title: "主井绞车房检修动火作业", type: "hot", area: "主井提升区", location: "主井绞车房", requester: "李明", lead: "张宇", guardian: "王建国", approver: "陈伟", cc: ["张宇"], workers: ["张宇", "赵磊"],
    start: "2026-11-12 08:30", end: "2026-11-12 16:30", actualStart: "2026-11-12 08:42", status: "作业中", applyAt: "2026-11-11 15:26", updated: "2026-11-12 09:18",
    hazards: ["动火引燃", "有限空间通风不足", "交叉作业"], measures: ["清除 10 米范围可燃物", "配备两具灭火器", "全程专人监护"], gasTest: "氧气 20.8%，可燃气体 0%", attachments: ["安全技术交底.pdf"],
    logs: [log("2026-11-11 15:26", "李明", "发起申请", "提交主井绞车房检修动火作业"), log("2026-11-11 16:10", "陈伟", "审批通过", "安全措施齐全，同意作业"), log("2026-11-12 08:42", "张宇", "确认开工", "现场条件核查合格")],
  },
  {
    id: "ZY-20261112-0002", title: "西翼回风巷密闭墙维修", type: "space", area: "西翼采区", location: "西翼回风巷 3# 密闭", requester: "张宇", lead: "周杰", guardian: "孙海", approver: "张宇", cc: [], workers: ["周杰", "孙海"],
    start: "2026-11-12 13:30", end: "2026-11-12 18:00", status: "待开工", applyAt: "2026-11-12 09:04", updated: "2026-11-12 10:18",
    hazards: ["缺氧窒息", "有害气体", "撤离困难"], measures: ["连续气体检测", "保持强制通风", "设置监护人"], gasTest: "待开工检测", attachments: [],
    logs: [log("2026-11-12 09:04", "张宇", "发起申请"), log("2026-11-12 10:18", "张宇", "审批通过", "作业前完成气体检测")],
  },
  {
    id: "ZY-20261112-0003", title: "选矿车间皮带廊高处检修", type: "height", area: "选矿车间", location: "2# 皮带廊", requester: "赵磊", lead: "张宇", guardian: "李明", approver: "张宇", cc: ["张宇"], workers: ["张宇", "赵磊"],
    start: "2026-11-13 08:00", end: "2026-11-13 12:00", status: "审批中", applyAt: "2026-11-12 10:36", updated: "2026-11-12 10:36",
    hazards: ["高处坠落", "物体打击"], measures: ["全程系挂安全带", "设置警戒区域", "工具系挂防坠绳"], gasTest: "不涉及", attachments: ["作业方案.docx"],
    logs: [log("2026-11-12 10:36", "赵磊", "发起申请", "等待安全管理部审批")],
  },
  {
    id: "ZY-20261111-0004", title: "主通风机电机吊装更换", type: "lift", area: "通风机房", location: "主通风机房", requester: "王建国", lead: "张宇", guardian: "周杰", approver: "陈伟", cc: [], workers: ["张宇", "周杰", "孙海"],
    start: "2026-11-11 09:00", end: "2026-11-11 17:00", actualStart: "2026-11-11 09:10", status: "待验收", applyAt: "2026-11-10 14:05", updated: "2026-11-11 17:18",
    hazards: ["吊物坠落", "设备倾覆", "交叉作业"], measures: ["检查吊具与限位", "设置专职指挥", "清空吊装半径内人员"], gasTest: "不涉及", attachments: ["吊装方案.pdf"],
    logs: [log("2026-11-10 14:05", "王建国", "发起申请"), log("2026-11-10 16:20", "陈伟", "审批通过"), log("2026-11-11 17:18", "张宇", "申请完工", "设备更换完成，申请验收")],
  },
  {
    id: "ZY-20261110-0005", title: "井下临时排水泵供电接入", type: "electric", area: "南区排水系统", location: "南区泵房", requester: "张宇", lead: "李明", guardian: "赵磊", approver: "陈伟", cc: ["张宇"], workers: ["李明", "赵磊"],
    start: "2026-11-10 08:30", end: "2026-11-10 15:30", actualStart: "2026-11-10 08:45", actualEnd: "2026-11-10 14:58", status: "已关闭", applyAt: "2026-11-09 16:48", updated: "2026-11-10 15:36",
    hazards: ["触电", "短路起火"], measures: ["执行停送电制度", "使用漏电保护器", "验电确认"], gasTest: "不涉及", attachments: ["验收记录.pdf"],
    logs: [log("2026-11-09 16:48", "张宇", "发起申请"), log("2026-11-09 17:22", "陈伟", "审批通过"), log("2026-11-10 08:45", "李明", "确认开工"), log("2026-11-10 15:36", "陈伟", "验收关闭", "验收合格")],
  },
  {
    id: "ZY-20261112-0006", title: "东翼回采工作面爆破作业", type: "blasting", area: "东翼回采区", location: "E1203 工作面", requester: "孙海", lead: "王建国", guardian: "张宇", approver: "陈伟", cc: [], workers: ["王建国", "孙海"],
    start: "2026-11-12 14:00", end: "2026-11-12 18:30", actualStart: "2026-11-12 14:08", status: "已暂停", applyAt: "2026-11-12 08:12", updated: "2026-11-12 15:20",
    hazards: ["爆破飞石", "瓦斯异常", "警戒失效"], measures: ["执行三人连锁放炮", "清点撤离人员", "设立警戒线"], gasTest: "瓦斯 0.25%", attachments: [], suspendedReason: "现场检测到局部瓦斯浓度波动，暂停并复测",
    logs: [log("2026-11-12 08:12", "孙海", "发起申请"), log("2026-11-12 09:30", "陈伟", "审批通过"), log("2026-11-12 14:08", "王建国", "确认开工"), log("2026-11-12 15:20", "张宇", "暂停作业", "现场检测到局部瓦斯浓度波动")],
  },
  {
    id: "ZY-20261113-0001", title: "原煤仓给煤机检维修", type: "maintenance", area: "原煤仓", location: "原煤仓给煤机", requester: "张宇", lead: "张宇", guardian: "赵磊", approver: "陈伟", cc: [], workers: ["张宇", "赵磊"],
    start: "2026-11-13 13:00", end: "2026-11-13 17:00", status: "草稿", applyAt: "2026-11-12 11:20", updated: "2026-11-12 11:20",
    hazards: ["机械伤害", "误送电"], measures: ["挂牌上锁", "清理现场积煤"], gasTest: "不涉及", attachments: [], logs: [log("2026-11-12 11:20", "张宇", "保存草稿")],
  },
  {
    id: "ZY-20261112-0007", title: "副井口栏杆焊补作业", type: "hot", area: "副井提升区", location: "副井口平台", requester: "张宇", lead: "李明", guardian: "周杰", approver: "陈伟", cc: [], workers: ["李明"],
    start: "2026-11-12 18:00", end: "2026-11-12 20:00", status: "已驳回", applyAt: "2026-11-12 09:40", updated: "2026-11-12 10:05",
    hazards: ["动火引燃", "高处坠落"], measures: ["设置接火斗"], gasTest: "不涉及", attachments: [], rejectionReason: "安全隔离措施不完整，请补充现场警戒方案。", logs: [log("2026-11-12 09:40", "张宇", "发起申请"), log("2026-11-12 10:05", "陈伟", "驳回", "安全隔离措施不完整")],
  },
];

export const workAreas = ["主井提升区", "西翼采区", "东翼回采区", "选矿车间", "通风机房", "南区排水系统", "原煤仓", "副井提升区"];
