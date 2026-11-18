import "./inspectionStore.js";
import taskBridge from "./bridges/task.js?raw";

const BODY_END = "</body>";

// srcDoc iframe and its parent are same-origin. Locate the host scenario API
// so the embedded task prototype can read and update its task data.
const FIND_HOST = `
window.__inspectionHost = (function () {
  var current = window;
  for (var depth = 0; depth < 6; depth++) {
    try { if (current.__inspectionScenario) return current.__inspectionScenario; } catch (error) { return null; }
    if (current === current.parent) return null;
    current = current.parent;
  }
  return null;
})();`;

// This bridge is independent from the inspection scenario. It keeps the
// workbench count synchronized with every visible row in "待我执行".
const PENDING_TASK_COUNT_BRIDGE = `
(function () {
  function notify() {
    var body = document.querySelector("#t-exec tbody");
    var count = body ? body.querySelectorAll("tr").length : 0;
    if (window.parent && typeof window.parent.postMessage === "function") {
      window.parent.postMessage({ type: "workbench:pending-task-count", count: count }, "*");
    }
  }

  function observe() {
    var body = document.querySelector("#t-exec tbody");
    if (!body) {
      window.setTimeout(observe, 50);
      return;
    }
    notify();
    if (typeof MutationObserver !== "undefined") {
      new MutationObserver(notify).observe(body, { childList: true });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe);
  else observe();
})();`;

export function withTaskBridge(html) {
  const position = html.indexOf(BODY_END);
  if (position < 0) return html;

  const script = `<script>${FIND_HOST}\ntry {\n${taskBridge}\n} catch (error) { console.warn("[日常巡检场景] 任务桥接未生效：", error); }\n${PENDING_TASK_COUNT_BRIDGE}</script>`;
  return `${html.slice(0, position)}${script}${html.slice(position)}`;
}
