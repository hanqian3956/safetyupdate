export const MINE_APP_NAME = "双重预防管理（矿山版）";

// The navigation is also consumed by the platform's role and menu editors.
const structure = [
  ["overview", "安全总览", [["态势", "综合态势", ["双重预防总览", "重大风险与隐患"]], ["地图", "风险地图", ["安全风险四色图", "风险点位分布"]]]],
  ["base", "基础资料", [["矿山", "矿山基础信息", ["矿山档案", "生产区域", "设备设施"]], ["责任", "责任体系", ["安全责任清单", "区域责任分工", "岗位责任清单"]], ["制度", "制度与标准", ["法律法规", "管理制度", "排查依据与判定标准"]]]],
  ["risk", "风险辨识评估", [["点位", "风险点管理", ["风险点台账", "作业活动清单", "设备设施风险清单"]], ["评估", "辨识评估管理", ["年度辨识评估", "专项辨识评估", "动态辨识评估"]], ["成果", "评估成果", ["风险分级清单", "重大风险清单", "辨识评估报告"]]]],
  ["control", "风险分级管控", [["措施", "管控措施", ["风险管控措施库", "风险管控责任清单", "重大风险管控方案"]], ["执行", "管控执行", ["管控检查计划", "管控检查任务", "管控执行记录"]], ["告知", "风险告知", ["岗位风险告知卡", "区域风险告知牌", "风险告知记录"]], ["效果", "管控评估", ["管控效果评估", "措施调整记录"]]]],
  ["hazard", "隐患排查治理", [["清单", "排查清单", ["岗位隐患排查清单", "专业隐患排查清单", "综合隐患排查清单"]], ["排查", "排查任务", ["排查计划", "排查任务发布", "排查任务台账"]], ["登记", "隐患登记", ["隐患上报", "隐患认定", "隐患总台账"]], ["整改", "整改治理", ["整改任务", "整改反馈", "延期申请"]], ["验收", "验收闭环", ["待复查验收", "退回整改", "销号归档"]]]],
  ["major", "重大事故隐患", [["管理", "隐患管理", ["重大事故隐患台账", "重大隐患判定依据"]], ["治理", "治理管理", ["专项治理方案", "治理措施落实", "治理进度"]], ["督办", "督办与验收", ["督办任务", "督办记录", "验收销号"]], ["归档", "报告归档", ["重大隐患报告", "治理档案"]]]],
  ["warning", "预警与督办", [["风险", "风险预警", ["风险升级预警", "管控措施未落实预警"]], ["隐患", "隐患预警", ["排查逾期预警", "整改逾期预警", "验收逾期预警"]], ["督办", "督办管理", ["督办任务", "督办反馈", "升级督办记录"]]]],
  ["analysis", "统计分析", [["风险", "风险分析", ["风险等级分布", "风险专业分布", "风险变化趋势"]], ["隐患", "隐患分析", ["隐患分类统计", "整改闭环统计", "重复隐患分析"]], ["履职", "履职分析", ["排查任务完成情况", "管控措施落实情况", "责任单位履职情况"]], ["报表", "报表中心", ["双重预防月报", "重大隐患治理报表", "风险隐患综合报表"]]]],
  ["config", "业务配置", [["风险", "风险配置", ["风险分类", "评估方法与分级规则", "管控层级与频次"]], ["排查", "排查配置", ["排查表单", "排查周期", "隐患分类与等级"]], ["流程", "流程配置", ["隐患认定流程", "整改延期流程", "验收销号流程"]], ["提醒", "提醒配置", ["到期提醒", "超期升级", "通知对象"]]]],
];
export const mineMenu = structure.map(([id, name, groups]) => ({
  id: `mine-${id}`, name,
  children: groups.map(([key, title, pages]) => ({ id: `mine-${id}-${key}`, name: title,
    children: pages.map((label, index) => ({ id: `mine-${id}-${key}-${index}`, name: label, section: id, group: title })),
  })),
}));
export const minePages = mineMenu.flatMap(section => section.children.flatMap(group => group.children));
export const LEVELS = ["重大风险", "较大风险", "一般风险", "低风险"];
export const AREAS = ["东翼采区", "主井提升区", "井下泵房", "露天采场", "尾矿库", "选矿车间"];
export const PEOPLE = ["张宇", "李明", "王建国", "陈伟", "赵海", "刘芳"];
export const PROFESSIONS = ["顶板与围岩", "提升运输", "防治水", "边坡", "尾矿库", "机电设备", "通风", "爆破作业"];
export const levelFor = (l, s) => Number(l) * Number(s) >= 20 ? LEVELS[0] : Number(l) * Number(s) >= 12 ? LEVELS[1] : Number(l) * Number(s) >= 6 ? LEVELS[2] : LEVELS[3];
export const timestamp = () => new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
export const dateOffset = days => {
  const date = new Date(); date.setDate(date.getDate() + days);
  return date.toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
};
const field = (key, label, type = "text", options, required = true) => ({ key, label, type, options, required });
const common = [field("name", "名称"), field("area", "所属区域", "select", AREAS), field("owner", "责任人", "select", PEOPLE)];
const riskFields = [field("name", "风险点名称"), ...common.slice(1), field("profession", "专业分类", "select", PROFESSIONS), field("kind", "辨识对象", "select", ["作业活动", "设备设施"]), field("assessment", "辨识类型", "select", ["年度辨识", "专项辨识", "动态辨识"]), field("l", "发生可能性 L", "select", [1, 2, 3, 4, 5]), field("s", "后果严重性 S", "select", [1, 2, 3, 4, 5]), field("measure", "管控措施", "textarea"), field("due", "下次检查日期", "date")];
const hazardFields = [field("name", "隐患描述"), ...common.slice(1), field("riskId", "关联风险点", "risk"), field("grade", "隐患等级", "select", ["一般隐患", "重大事故隐患"]), field("basis", "判定依据", "textarea"), field("measure", "整改措施", "textarea"), field("due", "整改期限", "date")];
const inspectionFields = [field("name", "排查任务名称"), ...common.slice(1), field("riskId", "关联风险点", "risk"), field("due", "计划执行日期", "date"), field("measure", "检查内容与标准", "textarea")];

export function pageSpec(page) {
  const name = page.name;
  if (page.section === "overview") return { kind: /图|点位/.test(name) ? "map" : "overview" };
  if (page.section === "analysis") return { kind: "analysis" };
  if (["风险点台账", "作业活动清单", "设备设施风险清单", "年度辨识评估", "专项辨识评估", "动态辨识评估", "风险分级清单", "重大风险清单", "风险管控措施库", "风险管控责任清单", "重大风险管控方案", "岗位风险告知卡", "区域风险告知牌"].includes(name)) return {
    kind: "risk", collection: "risks", fields: riskFields, columns: ["name", "area", "profession", "owner", "level", "measure", "due"],
    filter: row => (!name.includes("重大风险") || row.level === LEVELS[0]) && (name !== "作业活动清单" || row.kind === "作业活动") && (name !== "设备设施风险清单" || row.kind === "设备设施") && (!name.includes("辨识评估") || row.assessment === name.replace("评估", "")),
  };
  if (["隐患上报", "隐患认定", "隐患总台账", "整改任务", "整改反馈", "待复查验收", "退回整改", "销号归档", "重大事故隐患台账", "治理进度", "验收销号", "治理档案"].includes(name)) return {
    kind: "hazard", collection: "hazards", fields: hazardFields, columns: ["name", "area", "grade", "owner", "riskId", "due", "status"],
    filter: row => (page.section !== "major" || row.grade === "重大事故隐患") && (!({ "隐患认定": ["待认定"], "整改任务": ["待整改", "退回整改"], "整改反馈": ["待验收", "已销号"], "待复查验收": ["待验收"], "退回整改": ["退回整改"], "销号归档": ["已销号"], "验收销号": ["待验收", "已销号"], "治理档案": ["已销号"] }[name]) || ({ "隐患认定": ["待认定"], "整改任务": ["待整改", "退回整改"], "整改反馈": ["待验收", "已销号"], "待复查验收": ["待验收"], "退回整改": ["退回整改"], "销号归档": ["已销号"], "验收销号": ["待验收", "已销号"], "治理档案": ["已销号"] }[name]).includes(row.status)),
  };
  if (["排查计划", "排查任务发布", "排查任务台账", "管控检查计划", "管控检查任务", "管控执行记录"].includes(name)) return {
    kind: "inspection", collection: "inspections", fields: inspectionFields, columns: ["name", "area", "owner", "riskId", "due", "status"],
    filter: row => name !== "管控执行记录" || row.status === "已完成",
  };
  if (page.section === "warning" && page.group !== "督办管理") return { kind: "warning" };
  let fields = [...common, field("due", "更新日期", "date"), field("description", "内容说明", "textarea")];
  if (page.section === "base" && page.group === "矿山基础信息") fields = [field("name", name === "设备设施" ? "设备名称" : name === "生产区域" ? "区域名称" : "矿山名称"), field("mineType", "矿山类型", "select", ["地下矿山", "露天矿山", "尾矿库"]), field("area", "所属区域", "select", AREAS), field("owner", "责任人", "select", PEOPLE), field("description", name === "设备设施" ? "规格型号与运行说明" : "基本情况", "textarea")];
  if (/清单|排查表单/.test(name)) fields = [...common, field("profession", "专业分类", "select", PROFESSIONS), field("frequency", "检查频次", "select", ["每班", "每日", "每周", "每月"]), field("description", "检查项目与判定标准", "textarea")];
  if (/督办|治理方案|治理措施/.test(name)) fields = [...common, field("hazardId", "关联隐患", "hazard"), field("due", "完成期限", "date"), field("description", "措施、资金、责任、时限及应急安排", "textarea")];
  if (name === "延期申请") fields = [field("name", "申请名称"), field("hazardId", "关联隐患", "hazard"), field("owner", "申请人", "select", PEOPLE), field("due", "申请延期至", "date"), field("description", "延期原因及临时防护措施", "textarea")];
  if (page.section === "config") fields = [field("name", "配置名称"), field("scope", "适用范围", "select", ["全部矿山", "地下矿山", "露天矿山", "尾矿库"]), field("owner", "维护人", "select", PEOPLE), field("description", name.includes("流程") ? "审批节点与流转规则" : "规则内容", "textarea")];
  return { kind: "record", collection: page.id, fields, columns: fields.filter(f => f.type !== "textarea").map(f => f.key).concat("status") };
}

export function createMineData() {
  const names = ["东翼采场顶板冒落风险", "主井提升系统断绳风险", "泵房排水能力不足风险", "露天采场边坡滑移风险", "尾矿库排洪系统失效风险", "选矿车间输送带卷入风险"];
  const measures = ["每班开展敲帮问顶，检查锚杆与支护，发现异常立即撤人。", "检查钢丝绳、制动系统及安全保护装置，执行双人复核。", "定期试运备用水泵，核查水仓容量与双回路供电。", "巡查边坡裂缝、位移及排水沟，暴雨后专项检查。", "巡查排洪设施与坝体，核查水位及监测数据。", "停机断电挂牌，检查防护罩和急停装置。"];
  const risks = names.map((name, i) => ({ id: `FX-202611-${String(i + 1).padStart(3, "0")}`, name, area: AREAS[i], owner: PEOPLE[i], profession: PROFESSIONS[i], kind: i % 2 ? "设备设施" : "作业活动", assessment: ["年度辨识", "专项辨识", "动态辨识"][i % 3], l: [5, 4, 3, 2, 5, 1][i], s: [4, 3, 3, 2, 4, 3][i], level: levelFor([5, 4, 3, 2, 5, 1][i], [4, 3, 3, 2, 4, 3][i]), measure: measures[i], due: dateOffset(i - 1), status: "管控中", updated: timestamp(), logs: [{ text: "完成风险辨识并落实管控责任", time: timestamp(), person: PEOPLE[i] }] }));
  const hazards = ["东翼运输巷局部支护松动", "主井提升机制动试验记录缺失", "井下备用排水泵无法正常启动", "露天采场截水沟淤堵", "尾矿库排洪入口杂物堆积"].map((name, i) => ({ id: `YH-202611-${String(i + 1).padStart(3, "0")}`, name, area: AREAS[i], owner: PEOPLE[i], riskId: risks[i].id, grade: i === 2 ? "重大事故隐患" : "一般隐患", basis: "演示判定记录；正式使用时需引用本矿适用的判定标准并完成认定。", measure: ["复紧锚杆并补充支护，检查围岩稳定情况。", "补做制动试验并完善记录。", "检修备用排水泵，落实临时防护措施。", "清淤疏通并检查排水能力。", "清理入口杂物并加强巡查。 "][i], due: dateOffset(i - 2), status: ["待认定", "待整改", "待整改", "待验收", "已销号"][i], feedback: i >= 3 ? "已完成现场整改，复查记录齐全。" : "", updated: timestamp(), logs: [{ text: "排查发现隐患，建立治理台账", time: timestamp(), person: PEOPLE[i] }] }));
  const inspections = risks.map((risk, i) => ({ id: `PC-202611-${String(i + 1).padStart(3, "0")}`, name: `${risk.area}日常安全排查`, area: risk.area, owner: risk.owner, riskId: risk.id, due: dateOffset(i - 2), measure: risk.measure, status: i > 3 ? "已完成" : "待执行", updated: timestamp(), logs: [{ text: "发布排查任务", time: timestamp(), person: "张宇" }] }));
  const data = { risks, hazards, inspections };
  minePages.forEach(page => {
    const spec = pageSpec(page);
    if (spec.kind !== "record") return;
    data[page.id] = [0, 1, 2].map(i => ({ id: `${page.id}-${i + 1}`, name: page.name === "矿山档案" ? ["东区矿业公司一号矿", "南区露天矿", "东区尾矿库"][i] : `${["东翼采区", "主井提升区", "尾矿库"][i]}${page.name}`, area: AREAS[i], owner: PEOPLE[i], mineType: ["地下矿山", "露天矿山", "尾矿库"][i], scope: ["地下矿山", "露天矿山", "尾矿库"][i], profession: PROFESSIONS[i], frequency: ["每班", "每日", "每周"][i], hazardId: hazards[i].id, due: dateOffset(i + 1), description: page.section === "config" ? `适用于${AREAS[i]}；由${PEOPLE[i]}维护，按本矿批准的业务规则执行。` : `${AREAS[i]}：${measures[i]}`, status: "有效", updated: timestamp(), logs: [{ text: "建立记录", time: timestamp(), person: PEOPLE[i] }] }));
  });
  return data;
}
