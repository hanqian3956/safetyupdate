import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const source = "/Users/horace/Desktop/乱七八杂/自己玩/随手玩/ething/workbench-redesign/智慧应急安全管理平台-产品架构图.pptx";
const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,layout",
  maxChars: 12000,
});
process.stdout.write(inspection.ndjson);
