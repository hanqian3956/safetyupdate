import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const outputDir = new URL("./output/", import.meta.url);
const pptxPath = fileURLToPath(
  new URL("../智慧应急安全管理平台-产品架构图.pptx", import.meta.url),
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
    fontSize: 18,
    color: "#21344D",
    ...style,
  };
  return shape;
}

function addLayer(slide, config) {
  const { y, height, accent, pale, number, title, items, twoRows } = config;
  slide.shapes.add({
    geometry: "roundRect",
    name: `layer-${number}`,
    position: { left: 64, top: y, width: 1152, height },
    fill: pale,
    line: { style: "solid", fill: "#D9E2EC", width: 1 },
    borderRadius: "rounded-xl",
  });
  slide.shapes.add({
    geometry: "roundRect",
    name: `layer-accent-${number}`,
    position: { left: 64, top: y, width: 10, height },
    fill: accent,
    line: { style: "solid", fill: accent, width: 0 },
    borderRadius: "rounded-xl",
  });
  addText(slide, number, { left: 96, top: y + 11, width: 40, height: 18 }, {
    fontSize: 13,
    color: accent,
    bold: true,
  });
  addText(slide, title, { left: 96, top: y + 33, width: 214, height: 28 }, {
    fontSize: 22,
    color: "#17304F",
    bold: true,
  });
  slide.shapes.add({
    geometry: "rect",
    position: { left: 320, top: y + 14, width: 1, height: height - 28 },
    fill: "#D5E0EC",
    line: { style: "solid", fill: "#D5E0EC", width: 0 },
  });

  const rows = twoRows ? [items.slice(0, 4), items.slice(4)] : [items];
  const rowY = twoRows ? [y + 20, y + 55] : [y + 25];
  rows.forEach((row, rowIndex) => {
    const itemWidth = 840 / row.length;
    row.forEach((item, index) => {
      const left = 350 + index * itemWidth;
      addText(slide, item, { left, top: rowY[rowIndex], width: itemWidth - 12, height: 27 }, {
        fontSize: twoRows ? 17 : 17,
        color: "#243B53",
        bold: true,
        alignment: "center",
      });
    });
  });
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  const slide = presentation.slides.add();
  slide.background.fill = "#F7FAFC";

  slide.shapes.add({
    geometry: "rect",
    position: { left: 0, top: 0, width: 1280, height: 10 },
    fill: "#1475C4",
    line: { style: "solid", fill: "#1475C4", width: 0 },
  });
  addText(slide, "智慧应急安全管理平台", { left: 64, top: 31, width: 720, height: 54 }, {
    fontSize: 48,
    color: "#102A43",
    bold: true,
  });
  addText(slide, "产品架构图", { left: 66, top: 93, width: 180, height: 27 }, {
    fontSize: 22,
    color: "#1475C4",
    bold: true,
  });
  addText(
    slide,
    "以统一工作入口承接协同闭环，以安全业务应用与治理能力支撑日常运营",
    { left: 250, top: 96, width: 810, height: 25 },
    { fontSize: 19, color: "#627D98" },
  );
  addText(slide, "分层产品能力全景", { left: 1053, top: 42, width: 163, height: 22 }, {
    fontSize: 15,
    color: "#829AB1",
    alignment: "right",
  });

  addLayer(slide, {
    y: 143,
    height: 64,
    accent: "#1475C4",
    pale: "#FFFFFF",
    number: "01",
    title: "统一入口层",
    items: ["工作台", "待办总览", "消息中心", "快捷入口", "常用应用"],
  });
  addLayer(slide, {
    y: 217,
    height: 64,
    accent: "#138D8A",
    pale: "#F4FBFA",
    number: "02",
    title: "协同服务层",
    items: ["任务中心", "流程中心", "动态中心", "预警中心", "看板与数据台"],
  });
  addLayer(slide, {
    y: 291,
    height: 94,
    accent: "#E05A47",
    pale: "#FFF9F7",
    number: "03",
    title: "安全业务应用层",
    items: ["双重预防机制", "安全管理", "设备管理", "火工品管理", "生产管理", "机电管理", "消防管理", "应急管理"],
    twoRows: true,
  });
  addLayer(slide, {
    y: 395,
    height: 64,
    accent: "#D19925",
    pale: "#FFFCF5",
    number: "04",
    title: "业务配置层",
    items: ["安全动态", "工作表", "任务配置", "流程配置", "预警规则", "应用配置"],
  });
  addLayer(slide, {
    y: 469,
    height: 64,
    accent: "#5D6D7E",
    pale: "#F7F9FB",
    number: "05",
    title: "系统治理层",
    items: ["组织架构", "用户中心", "岗位管理", "角色权限", "菜单权限", "数据权限"],
  });

  slide.shapes.add({
    geometry: "roundRect",
    name: "platform-foundation",
    position: { left: 64, top: 552, width: 1152, height: 60 },
    fill: "#173B61",
    line: { style: "solid", fill: "#173B61", width: 0 },
    borderRadius: "rounded-xl",
  });
  addText(slide, "平台基础能力", { left: 94, top: 569, width: 170, height: 26 }, {
    fontSize: 23,
    color: "#FFFFFF",
    bold: true,
  });
  addText(slide, "数据字典   ·   个人中心   ·   统一消息通知   ·   数据权限范围   ·   业务表单与历史数据", { left: 312, top: 571, width: 840, height: 23 }, {
    fontSize: 18,
    color: "#D9EAF7",
    alignment: "center",
  });
  addText(slide, "工作台统一入口  |  业务协同闭环  |  安全生产数字化", { left: 64, top: 653, width: 1152, height: 20 }, {
    fontSize: 14,
    color: "#829AB1",
    alignment: "center",
  });

  await writeBlob(new URL("slide-01.png", outputDir), await presentation.export({ slide, format: "png", scale: 2 }));
  await fs.writeFile(new URL("slide-01.layout.json", outputDir), await (await slide.export({ format: "layout" })).text());
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(pptxPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
