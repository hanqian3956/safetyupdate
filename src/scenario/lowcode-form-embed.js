import "./inspectionStore.js";
import lowcodeFormBridge from "./bridges/lowcodeForm.js?raw";
import lowcodeFlowBridge from "./bridges/lowcodeFlow.js?raw";

const INNER_BODY_END = "</body>";
const INNER_SCRIPT_END = "___SCEND___";

// The low-code prototype stores its worktable page as text inside an outer iframe.
// Inject the scenario form into that first inner page without changing the source HTML.
export function withInspectionFormBridge(html) {
  const formBodyEndIndex = html.indexOf(INNER_BODY_END);
  if (formBodyEndIndex < 0) return html;
  const flowBodyEndIndex = html.indexOf(
    INNER_BODY_END,
    formBodyEndIndex + INNER_BODY_END.length,
  );

  const hostLookup = `
window.__inspectionHost = (function () {
  var current = window;
  for (var depth = 0; depth < 6; depth += 1) {
    try { if (current.__inspectionScenario) return current.__inspectionScenario; } catch (error) { return null; }
    if (current === current.parent) return null;
    current = current.parent;
  }
  return null;
})();`;
  const inject = (bridge, label) => `<script>${hostLookup}\ntry {\n${bridge}\n} catch (error) { console.warn("[日常巡检表] ${label}注入失败", error); }${INNER_SCRIPT_END}`;
  const formInjection = inject(lowcodeFormBridge, "工作表单");
  const flowInjection = inject(lowcodeFlowBridge, "流程中心");

  if (flowBodyEndIndex < 0) {
    return `${html.slice(0, formBodyEndIndex)}${formInjection}${html.slice(formBodyEndIndex)}`;
  }
  return `${html.slice(0, formBodyEndIndex)}${formInjection}${html.slice(formBodyEndIndex, flowBodyEndIndex)}${flowInjection}${html.slice(flowBodyEndIndex)}`;
}
