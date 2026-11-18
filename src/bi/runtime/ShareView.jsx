// Stand-alone page behind a share link: just the screen, fitted to the window.

import { useEffect, useRef } from "react";
import { FullScreenMaximize24Regular, FullScreenMinimize24Regular } from "@fluentui/react-icons";
import { useScreens } from "../screen/screenStore.js";
import { ToastHost } from "../ui.jsx";
import { ScreenRuntime } from "./runtime.jsx";
import { ScreenStage, useFitScale } from "./ScreenStage.jsx";
import { useFullscreen } from "./ScreenViewer.jsx";

function SharedStage({ screen }) {
  const hostRef = useRef(null);
  const [fullscreen, toggleFullscreen] = useFullscreen(hostRef);
  const scale = useFitScale(hostRef, screen.width, screen.height, 0, "contain");
  return (
    <div className="bi-share" ref={hostRef}>
      {scale > 0 ? <ScreenStage screen={screen} scale={scale} /> : null}
      <button type="button" className="bi-share__fullscreen" onClick={toggleFullscreen}>
        {fullscreen ? <FullScreenMinimize24Regular /> : <FullScreenMaximize24Regular />}
        {fullscreen ? "退出全屏" : "全屏"}
      </button>
    </div>
  );
}

export function ShareView({ screenId }) {
  const screen = useScreens().find((entry) => entry.id === screenId);
  useEffect(() => {
    if (screen) document.title = screen.name;
  }, [screen]);

  if (!screen || screen.status !== "published" || !screen.shared) {
    const reason = !screen ? "这个大屏不存在，或已被删除。" : "这个大屏已下架或关闭了分享。";
    return (
      <div className="bi-ui bi-share bi-share--missing">
        <div>
          <h1>无法打开这个大屏</h1>
          <p>{reason}</p>
          <a href={`${window.location.pathname}`}>回到工作台</a>
        </div>
      </div>
    );
  }
  return (
    <div className="bi-ui">
      <ScreenRuntime screen={screen} mode="view">
        <SharedStage screen={screen} />
      </ScreenRuntime>
      <ToastHost />
    </div>
  );
}
