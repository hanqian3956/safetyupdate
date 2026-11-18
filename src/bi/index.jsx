// BI 模块对外入口。工作台只需要这几个组件：
//   <BiScreenManager />  设置中心「数据看板」：大屏列表与设计器
//   <BiScreenViewer />   主导航「看板」：查看已发布的大屏
//   <BiShareView />      分享链接打开的独立页面

import { useEffect, useState } from "react";
import { startLiveData } from "./data/dataStore.js";
import { Designer } from "./designer/Designer.jsx";
import { ScreenManager } from "./manager/ScreenManager.jsx";
import { ScreenViewer } from "./runtime/ScreenViewer.jsx";
import { ShareView } from "./runtime/ShareView.jsx";
import { getScreen, getShareId } from "./screen/screenStore.js";
import { notify, ToastHost } from "./ui.jsx";
import "./screen.css";
import "./bi.css";

function useDesigner() {
  const [screen, setScreen] = useState(null);
  const open = (id) => {
    const target = getScreen(id);
    if (target) setScreen(target);
    else notify("这个大屏已被删除", "error");
  };
  const element = screen ? <Designer key={screen.id} screen={screen} onClose={() => setScreen(null)} /> : null;
  return [open, element];
}

export function BiScreenManager({ onOpenViewer }) {
  const [openDesigner, designer] = useDesigner();
  useEffect(startLiveData, []);
  return (
    <>
      <ScreenManager onEdit={openDesigner} onOpenViewer={onOpenViewer} />
      {designer}
      <ToastHost />
    </>
  );
}

export function BiScreenViewer() {
  useEffect(startLiveData, []);
  return (
    <>
      <ScreenViewer />
      <ToastHost />
    </>
  );
}

export function BiShareView({ screenId }) {
  useEffect(startLiveData, []);
  return <ShareView screenId={screenId} />;
}

export const getBiShareId = getShareId;

// The workbench decides between "shell" and "shared screen" once, at load. Pasting a share
// link into a tab that is already open only changes the hash, so reload to honour it.
if (typeof window !== "undefined") {
  const openedWith = getShareId();
  window.addEventListener("hashchange", () => {
    if (getShareId() !== openedWith) window.location.reload();
  });
}
