import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const outputDir = new URL("./output/", import.meta.url);
const finalPptxPath = fileURLToPath(
  new URL("../智慧应急安全管理平台-开发分层产品架构图.pptx", import.meta.url),
);

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

function addText(slide, text, position, style = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position,
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    fontFace: "PingFang SC",
    fontSize: 16,
    color: "#20374F",
    ...style,
  };
  return shape;
}

function addBox(slide, position, fill, line = "#D9E4EE", radius = "rounded-lg") {
  return slide.shapes.add({
    geometry: "roundRect",
    position,
    fill,
    line: { style: "solid", fill: line, width: 1 },
    borderRadius: radius,
  });
}

function addItem(slide, item, position, accent) {
  addBox(slide, position, "#FFFFFF", "#D7E3ED", "rounded-md");
  slide.shapes.add({
    geometry: "rect",
    position: { left: position.left, top: position.top, width: 4, height: position.height },
    fill: accent,
    line: { style: "solid", fill: accent, width: 0 },
  });
  addText(slide, item, {
    left: position.left + 14,
    top: position.top + 15,
    width: position.width - 24,
    height: 24,
  }, {
    fontSize: 16,
    color: "#20374F",
    bold: true,
    alignment: "center",
  });
}

function addLayer(slide, config) {
  const { y, height, number, title, scope, accent, pale, items, columns = 5 } = config;
  const left = 64;
  const width = 1152;
  const titleWidth = 230;
  const bodyLeft = left + titleWidth + 24;
  const bodyWidth = width - titleWidth - 48;
  const rowCount = Math.ceil(items.length / columns);
  const gap = 10;
  const itemWidth = (bodyWidth - gap * (columns - 1)) / columns;
  const itemHeight = rowCount === 1 ? Math.min(42, height - 20) : 31;
  const rowGap = rowCount === 1 ? 0 : 8;
  const contentHeight = rowCount * itemHeight + (rowCount - 1) * rowGap;
  const itemTop = y + (height - contentHeight) / 2;

  addBox(slide, { left, top: y, width, height }, pale, "#D4E0EB", "rounded-xl");
  slide.shapes.add({
    geometry: "roundRect",
    position: { left, top: y, width: 10, height },
    fill: accent,
    line: { style: "solid", fill: accent, width: 0 },
    borderRadius: "rounded-xl",
  });
  addText(slide, number, { left: 94, top: y + 9, width: 34, height: 16 }, {
    fontSize: 13,
    color: accent,
    bold: true,
  });
  addText(slide, title, { left: 94, top: y + 27, width: 190, height: 24 }, {
    fontSize: 21,
    color: "#17324D",
    bold: true,
  });
  addText(slide, scope, { left: 94, top: y + height - 16, width: 190, height: 12 }, {
    fontSize: 10,
    color: "#718399",
  });
  slide.shapes.add({
    geometry: "rect",
    position: { left: left + titleWidth, top: y + 12, width: 1, height: height - 24 },
    fill: "#D8E3EC",
    line: { style: "solid", fill: "#D8E3EC", width: 0 },
  });

  items.forEach((item, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    addItem(slide, item, {
      left: bodyLeft + column * (itemWidth + gap),
      top: itemTop + row * (itemHeight + rowGap),
      width: itemWidth,
      height: itemHeight,
    }, accent);
  });
}

function addDependency(slide, title, detail, left, accent) {
  addBox(slide, { left, top: 619, width: 363, height: 54 }, "#FFFFFF", "#D7E3ED", "rounded-lg");
  slide.shapes.add({
    geometry: "rect",
    position: { left, top: 619, width: 5, height: 54 },
    fill: accent,
    line: { style: "solid", fill: accent, width: 0 },
  });
  addText(slide, title, { left: left + 16, top: 628, width: 120, height: 18 }, {
    fontSize: 13,
    bold: true,
    color: "#1E3650",
  });
  addText(slide, detail, { left: left + 16, top: 647, width: 334, height: 17 }, {
    fontSize: 11,
    color: "#65798C",
  });
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const slide = presentation.slides.add();
  slide.background.fill = "#F6F9FC";

  slide.shapes.add({
    geometry: "rect",
    position: { left: 0, top: 0, width: 1280, height: 9 },
    fill: "#1677C8",
    line: { style: "solid", fill: "#1677C8", width: 0 },
  });
  addText(slide, "智慧应急安全管理平台", { left: 64, top: 29, width: 640, height: 58 }, {
    fontSize: 50,
    color: "#102C49",
    bold: true,
  });
  addText(slide, "开发分层产品架构图", { left: 66, top: 94, width: 240, height: 30 }, {
    fontSize: 24,
    color: "#1677C8",
    bold: true,
  });
  addText(slide, "围绕统一入口、业务闭环、领域应用、配置治理和共用能力进行模块拆分", {
    left: 325,
    top: 99,
    width: 760,
    height: 26,
  }, {
    fontSize: 18,
    color: "#627C98",
  });
  addText(slide, "面向研发讲解", { left: 1050, top: 47, width: 166, height: 20 }, {
    fontSize: 14,
    color: "#829AB1",
    alignment: "right",
  });

  addLayer(slide, {
    y: 142,
    height: 68,
    number: "01",
    title: "用户入口层",
    scope: "统一访问与个人工作入口",
    accent: "#1677C8",
    pale: "#FFFFFF",
    items: ["登录与企业品牌", "工作台", "待办总览", "消息中心", "个人中心"],
  });
  addLayer(slide, {
    y: 220,
    height: 68,
    number: "02",
    title: "协同闭环层",
    scope: "任务、审批、预警与信息触达",
    accent: "#168F8B",
    pale: "#F3FBFA",
    items: ["任务中心", "流程中心", "预警中心", "动态中心", "看板与数据台"],
  });
  addLayer(slide, {
    y: 298,
    height: 92,
    number: "03",
    title: "安全业务应用层",
    scope: "面向安全生产业务场景",
    accent: "#E25D4B",
    pale: "#FFF9F7",
    columns: 4,
    items: ["双重预防机制", "安全管理", "设备管理", "火工品管理", "生产管理", "机电管理", "消防管理", "应急管理"],
  });
  addLayer(slide, {
    y: 400,
    height: 68,
    number: "04",
    title: "配置治理层",
    scope: "业务规则、表单与平台配置",
    accent: "#D39B28",
    pale: "#FFFCF5",
    items: ["工作表", "任务与流程配置", "预警规则", "应用中心", "系统设置"],
  });
  addLayer(slide, {
    y: 478,
    height: 68,
    number: "05",
    title: "共用能力层",
    scope: "跨业务域复用与权限控制",
    accent: "#5C7187",
    pale: "#F6F9FC",
    items: ["组织用户", "角色权限", "数据字典", "企业设置", "文件与消息"],
  });

  addText(slide, "关键依赖关系", { left: 64, top: 577, width: 170, height: 23 }, {
    fontSize: 18,
    bold: true,
    color: "#29435D",
  });
  addText(slide, "用于明确模块间的数据来源与权限边界", { left: 230, top: 580, width: 450, height: 18 }, {
    fontSize: 13,
    color: "#7890A5",
  });
  addDependency(slide, "权限主线", "组织用户 + 角色权限 → 菜单、按钮与数据范围", 64, "#1677C8");
  addDependency(slide, "配置主线", "工作表 + 字典 → 表单、任务、流程、预警字段", 458, "#D39B28");
  addDependency(slide, "业务事件主线", "业务处理 → 待办、消息、动态、看板数据", 852, "#168F8B");
  addText(slide, "统一入口  ·  协同闭环  ·  领域应用  ·  可配置治理", {
    left: 64,
    top: 690,
    width: 1152,
    height: 16,
  }, {
    fontSize: 13,
    color: "#829AB1",
    alignment: "center",
  });

  await writeBlob(new URL("slide-01.png", outputDir), await presentation.export({ slide, format: "png", scale: 2 }));
  await fs.writeFile(new URL("slide-01.layout.json", outputDir), await (await slide.export({ format: "layout" })).text());
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(finalPptxPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
