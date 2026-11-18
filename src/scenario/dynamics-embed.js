import "./inspectionStore.js";
import dynamicsBridge from "./bridges/dynamics.js?raw";

const BODY_END = "</body>";

// Keep the source prototype untouched while giving its iframe access to the
// shared daily-inspection scenario maintained by the surrounding workbench.
export function withInspectionDynamicsBridge(html) {
  const normalizedHtml = html.replaceAll("动态圈", "动态号");
  const position = normalizedHtml.indexOf(BODY_END);
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
  const script = `<script>${hostLookup}\ntry {\n${dynamicsBridge}\n} catch (error) { console.warn("[日常巡检] 动态注入失败", error); }</script>`;
  return `${normalizedHtml.slice(0, position)}${script}${normalizedHtml.slice(position)}`;
}
