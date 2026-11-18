import "./inspectionStore.js";
import alertBridge from "./bridges/alert.js?raw";

const BODY_END = "</body>";

export function withInspectionWarningBridge(html) {
  const position = html.indexOf(BODY_END);
  if (position < 0) return html;
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
  const script = `<script>${hostLookup}\ntry {\n${alertBridge}\n} catch (error) { console.warn("[日常巡检] 预警注入失败", error); }</script>`;
  return `${html.slice(0, position)}${script}${html.slice(position)}`;
}
