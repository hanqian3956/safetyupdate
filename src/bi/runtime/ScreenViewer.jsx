// 主导航「看板」：左边选大屏，右边看大屏。

import { useEffect, useRef, useState } from "react";
import {
  ChevronRight24Regular,
  DataBarVertical24Regular,
  FullScreenMaximize24Regular,
  FullScreenMinimize24Regular,
} from "@fluentui/react-icons";
import { DocPanel } from "../docs/DocPanel.jsx";
import { useScreens } from "../screen/screenStore.js";
import { notify, Switch } from "../ui.jsx";
import { ScreenRuntime } from "./runtime.jsx";
import { ScreenStage, useFitScale } from "./ScreenStage.jsx";
import { getInspectionState, subscribeInspection } from "../../scenario/inspectionStore.js";

function getOpenRiskAlerts() {
  return [...getInspectionState().alerts]
    .filter((alert) => alert.status === "pending")
    .sort((left, right) => right.triggeredAt - left.triggeredAt)
    .map((alert) => ({
      id: alert.id,
      level: alert.level,
      content: alert.content,
      actual: alert.item.act,
      threshold: `${alert.item.judge} ${alert.item.thr}`,
      time: new Date(alert.triggeredAt).toLocaleString("zh-CN", {
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
}

export function useFullscreen(ref) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const onChange = () => setActive(document.fullscreenElement === ref.current && ref.current !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [ref]);
  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    const request = ref.current?.requestFullscreen?.();
    if (!request) {
      notify("这个浏览器不支持全屏展示", "error");
      return;
    }
    request.catch(() => notify("浏览器没有允许进入全屏，可以按 F11 让浏览器窗口全屏", "error"));
  };
  return [active, toggle];
}

function ViewerCanvas({ screen, riskAlerts }) {
  const canvasRef = useRef(null);
  const [fullscreen, toggleFullscreen] = useFullscreen(canvasRef);
  const scale = useFitScale(canvasRef, screen.width, screen.height, 0, fullscreen ? "contain" : "width");
  return (
    <div className={fullscreen ? "bi-viewer__canvas is-fullscreen" : "bi-viewer__canvas"} ref={canvasRef}>
      {scale > 0 ? <ScreenStage screen={screen} scale={scale} riskAlerts={riskAlerts} /> : null}
      <button type="button" className="bi-viewer__exit" onClick={toggleFullscreen}>
        {fullscreen ? <FullScreenMinimize24Regular /> : <FullScreenMaximize24Regular />}
        {fullscreen ? "退出全屏" : "全屏"}
      </button>
    </div>
  );
}

export function ScreenViewer() {
  const screens = useScreens();
  const published = screens.filter((screen) => screen.status === "published");
  const [selectedId, setSelectedId] = useState(null);
  const [showDoc, setShowDoc] = useState(false);
  const [riskAlerts, setRiskAlerts] = useState(getOpenRiskAlerts);
  const active = published.find((screen) => screen.id === selectedId) ?? published[0] ?? null;

  useEffect(() => subscribeInspection(() => setRiskAlerts(getOpenRiskAlerts())), []);

  return (
    <section className={showDoc ? "bi-ui bi-viewer has-doc" : "bi-ui bi-viewer"} aria-label="数据看板">
      <aside className="bi-viewer__list" aria-label="看板列表">
        <header>
          <DataBarVertical24Regular />
          <span>数据看板</span>
          <Switch checked={showDoc} onChange={setShowDoc} label="显示说明" />
        </header>
        <nav>
          {published.map((screen) => (
            <button
              key={screen.id}
              type="button"
              className={screen.id === active?.id ? "is-active" : ""}
              onClick={() => setSelectedId(screen.id)}
            >
              <b title={screen.name}>{screen.name}</b>
              <ChevronRight24Regular />
            </button>
          ))}
        </nav>
      </aside>

      <div className="bi-viewer__main">
        {active ? (
          <ScreenRuntime screen={active} mode="view" key={active.id}>
            <ViewerCanvas screen={active} riskAlerts={riskAlerts} />
          </ScreenRuntime>
        ) : (
          <div className="bi-blank">
            <h1>还没有已发布的大屏</h1>
            <p>在「设置 › 数据看板」里设计大屏并发布后，会显示在这里。</p>
          </div>
        )}
      </div>
      {showDoc ? <DocPanel page="viewer" onClose={() => setShowDoc(false)} /> : null}
    </section>
  );
}
