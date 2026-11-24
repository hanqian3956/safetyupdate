// Full-window designer for one screen.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Add24Regular,
  ArrowDownload24Regular,
  ArrowLeft24Regular,
  ArrowRedo24Regular,
  ArrowUndo24Regular,
  Dismiss24Regular,
  MoreHorizontal24Regular,
  Play24Regular,
  Save24Regular,
  Share24Regular,
  Subtract24Regular,
} from "@fluentui/react-icons";
import { DocPanel } from "../docs/DocPanel.jsx";
import { ConfirmDialog, ShareDialog } from "../manager/dialogs.jsx";
import { ScreenRuntime } from "../runtime/runtime.jsx";
import { ScreenStage, useFitScale } from "../runtime/ScreenStage.jsx";
import { createWidget, duplicateWidget } from "../screen/model.js";
import { exportScreenFile, saveScreen } from "../screen/screenStore.js";
import { Button, IconButton, Menu, notify, Switch } from "../ui.jsx";
import { getWidgetType } from "../widgets/registry.js";
import { CanvasEditor, MAX_ZOOM, MIN_ZOOM } from "./CanvasEditor.jsx";
import { DatasetPreview } from "./DatasetPreview.jsx";
import { LeftPanel } from "./LeftPanel.jsx";
import { RightPanel } from "./panels.jsx";
import { SpaceDialog } from "./SpaceDialog.jsx";
import { useEditor } from "./useEditor.js";

const isTyping = () => {
  const element = document.activeElement;
  return Boolean(element && (/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) || element.isContentEditable));
};

function PreviewOverlay({ screen, onClose }) {
  const hostRef = useRef(null);
  const scale = useFitScale(hostRef, screen.width, screen.height, 0, "contain");
  return (
    <div className="bi-preview" ref={hostRef}>
      <ScreenRuntime screen={screen} mode="view">
        {scale > 0 ? <ScreenStage screen={screen} scale={scale} /> : null}
      </ScreenRuntime>
      <button type="button" className="bi-preview__close" onClick={onClose}>
        <Dismiss24Regular />
        退出预览（Esc）
      </button>
    </div>
  );
}

function ContextMenu({ menu, items, onClose }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ left: menu.x, top: menu.y });
  useLayoutEffect(() => {
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      left: Math.min(menu.x, window.innerWidth - rect.width - 8),
      top: Math.min(menu.y, window.innerHeight - rect.height - 8),
    });
  }, [menu]);
  useEffect(() => {
    const close = (event) => {
      if (!ref.current?.contains(event.target)) onClose();
    };
    document.addEventListener("pointerdown", close, true);
    window.addEventListener("blur", onClose);
    return () => {
      document.removeEventListener("pointerdown", close, true);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);
  return (
    <div className="bi-menu__list bi-contextmenu" role="menu" ref={ref} style={position}>
      {items.map((item, index) =>
        item === "divider" ? (
          <hr key={`divider-${index}`} />
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={item.danger ? "is-danger" : ""}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
          >
            {item.label}
            {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
          </button>
        ))}
    </div>
  );
}

export function Designer({ screen: initialScreen, onClose }) {
  const editor = useEditor(initialScreen);
  const { screen, selection } = editor;
  const workspaceRef = useRef(null);
  const clipboard = useRef([]);
  const [view, setView] = useState({ zoom: 0.5, x: 40, y: 40 });
  const [previewing, setPreviewing] = useState(false);
  const [datasetPreview, setDatasetPreview] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const [spaceWidget, setSpaceWidget] = useState(null);

  const fitView = useCallback(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const { width, height } = workspace.getBoundingClientRect();
    const zoom = Math.max(MIN_ZOOM, Math.min((width - 96) / screen.width, (height - 96) / screen.height, 1.5));
    setView({ zoom, x: (width - screen.width * zoom) / 2, y: (height - screen.height * zoom) / 2 });
  }, [screen.width, screen.height]);

  // Fit once on open, and again whenever the canvas size or the room around it changes.
  useLayoutEffect(() => {
    fitView();
  }, [fitView, showDoc]);

  const zoomBy = (factor) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const { width, height } = workspace.getBoundingClientRect();
    setView((current) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor));
      const ratio = zoom / current.zoom;
      return { zoom, x: width / 2 - (width / 2 - current.x) * ratio, y: height / 2 - (height / 2 - current.y) * ratio };
    });
  };

  const selected = screen.widgets.filter((widget) => selection.includes(widget.id));
  const editable = selected.filter((widget) => !widget.locked);

  const placeWidget = (type, center) => {
    const definition = getWidgetType(type);
    if (!definition) return;
    const [w, h] = definition.size;
    const clamp = (value, max) => Math.round(Math.max(0, Math.min(value, Math.max(0, max))));
    let x = clamp(center.x - w / 2, screen.width - w);
    let y = clamp(center.y - h / 2, screen.height - h);
    // Step aside if another widget already sits at exactly this spot.
    while (screen.widgets.some((widget) => widget.x === x && widget.y === y)) {
      x += 24;
      y += 24;
    }
    editor.addWidgets([createWidget(type, { x, y })]);
  };
  const addAtCenter = (type) => {
    const workspace = workspaceRef.current;
    const { width, height } = workspace.getBoundingClientRect();
    placeWidget(type, { x: (width / 2 - view.x) / view.zoom, y: (height / 2 - view.y) / view.zoom });
  };

  const save = (patch) => {
    const stored = saveScreen({ ...screen, ...patch });
    if (!stored) {
      notify("保存失败：大屏配置超出大小上限，请移除上传的大图片后再试", "error");
      return false;
    }
    editor.markSaved(stored);
    return true;
  };
  const handleSave = () => {
    // A published screen has no separate draft: what is saved is what 「看板」 shows.
    if (save()) notify(screen.status === "published" ? "已保存，「看板」中的大屏已同步更新" : "已保存");
  };
  const handlePublish = () => {
    if (save({ status: "published", publishedAt: Date.now() })) notify("已发布，可在主导航「看板」中查看");
  };
  const handleUnpublish = () => {
    if (save({ status: "draft", shared: false })) notify("已下架，「看板」中不再显示");
  };
  const requestClose = () => {
    if (editor.dirty) setConfirmClose(true);
    else onClose();
  };

  const copySelection = () => {
    if (selected.length) clipboard.current = selected;
  };
  const paste = () => {
    if (!clipboard.current.length) return;
    const copies = clipboard.current.map((widget) => duplicateWidget(widget, 24));
    clipboard.current = copies;
    editor.addWidgets(copies);
  };
  const removeSelection = () => {
    if (editable.length) editor.removeWidgets(editable.map((widget) => widget.id));
  };
  const nudge = (dx, dy) => {
    if (!editable.length) return;
    editor.updateWidgets(editable.map((widget) => widget.id), (widget) => ({ ...widget, x: widget.x + dx, y: widget.y + dy }), "nudge");
  };

  const shortcuts = useRef(null);
  useEffect(() => {
    shortcuts.current = { copySelection, paste, removeSelection, nudge, handleSave, fitView, zoomBy, screen, selected, previewing, menuOpen: Boolean(contextMenu), blocked: Boolean(datasetPreview || confirmClose || sharing) };
  });
  useEffect(() => {
    const onKeyDown = (event) => {
      const actions = shortcuts.current;
      const command = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (command && key === "s") {
        event.preventDefault();
        if (!actions.blocked) actions.handleSave();
        return;
      }
      if (actions.blocked) return;
      if (actions.previewing) {
        if (key === "escape") setPreviewing(false);
        return;
      }
      if (isTyping()) return;
      if (key === "escape") {
        // Escape backs out one step at a time: first the menu, then the selection.
        if (actions.menuOpen) setContextMenu(null);
        else editor.select([]);
      } else if (key === "delete" || key === "backspace") {
        event.preventDefault();
        actions.removeSelection();
      } else if (command && key === "z") {
        event.preventDefault();
        if (event.shiftKey) editor.redo();
        else editor.undo();
      } else if (command && key === "y") {
        event.preventDefault();
        editor.redo();
      } else if (command && key === "c") {
        actions.copySelection();
      } else if (command && key === "v") {
        event.preventDefault();
        actions.paste();
      } else if (command && key === "d") {
        event.preventDefault();
        if (actions.selected.length) editor.duplicateWidgets(actions.selected);
      } else if (command && key === "a") {
        event.preventDefault();
        editor.select(actions.screen.widgets.filter((widget) => !widget.hidden && !widget.locked).map((widget) => widget.id));
      } else if (command && key === "0") {
        event.preventDefault();
        actions.fitView();
      } else if (command && (key === "=" || key === "+")) {
        event.preventDefault();
        actions.zoomBy(1.2);
      } else if (command && key === "-") {
        event.preventDefault();
        actions.zoomBy(1 / 1.2);
      } else if (key.startsWith("arrow")) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        if (key === "arrowleft") actions.nudge(-step, 0);
        if (key === "arrowright") actions.nudge(step, 0);
        if (key === "arrowup") actions.nudge(0, -step);
        if (key === "arrowdown") actions.nudge(0, step);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // `editor` actions are stable; live values are read through the shortcuts ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Leaving the page with unsaved work should prompt, the same as closing the designer does.
  useEffect(() => {
    if (!editor.dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editor.dirty]);

  const ids = selected.map((widget) => widget.id);
  const allLocked = selected.length > 0 && selected.every((widget) => widget.locked);
  const widgetMenu = [
    { label: "复制一份", shortcut: "Ctrl D", onSelect: () => editor.duplicateWidgets(selected) },
    { label: "复制", shortcut: "Ctrl C", onSelect: copySelection },
    { label: "粘贴", shortcut: "Ctrl V", disabled: !clipboard.current.length, onSelect: paste },
    "divider",
    { label: "置于顶层", onSelect: () => editor.reorder(ids, "front") },
    { label: "上移一层", onSelect: () => editor.reorder(ids, "forward") },
    { label: "下移一层", onSelect: () => editor.reorder(ids, "backward") },
    { label: "置于底层", onSelect: () => editor.reorder(ids, "back") },
    "divider",
    { label: allLocked ? "解锁" : "锁定", onSelect: () => editor.updateWidgets(ids, (widget) => ({ ...widget, locked: !allLocked })) },
    { label: "隐藏", onSelect: () => editor.updateWidgets(ids, (widget) => ({ ...widget, hidden: true })) },
    "divider",
    { label: "删除", shortcut: "Del", danger: true, disabled: !editable.length, onSelect: removeSelection },
  ];
  const canvasMenu = [
    { label: "粘贴", shortcut: "Ctrl V", disabled: !clipboard.current.length, onSelect: paste },
    { label: "全选", shortcut: "Ctrl A", onSelect: () => editor.select(screen.widgets.filter((widget) => !widget.hidden && !widget.locked).map((widget) => widget.id)) },
    { label: "适应窗口", shortcut: "Ctrl 0", onSelect: fitView },
  ];

  const published = screen.status === "published";
  return createPortal(
    <div className="bi-ui bi-designer">
      <header className="bi-designer__top">
        <Button icon={<ArrowLeft24Regular />} onClick={requestClose}>返回</Button>
        <input
          className="bi-designer__name"
          value={screen.name}
          maxLength={30}
          aria-label="大屏名称"
          onChange={(event) => editor.updateScreen({ name: event.target.value }, "screen:name")}
        />
        <span className={published ? "bi-status is-published" : "bi-status"}>{published ? "已发布" : "草稿"}</span>
        {editor.dirty ? <span className="bi-status is-dirty">有未保存的修改</span> : null}

        <div className="bi-designer__group">
          <IconButton label="撤销（Ctrl Z）" disabled={!editor.canUndo} onClick={editor.undo}><ArrowUndo24Regular /></IconButton>
          <IconButton label="重做（Ctrl Shift Z）" disabled={!editor.canRedo} onClick={editor.redo}><ArrowRedo24Regular /></IconButton>
        </div>

        <div className="bi-designer__spacer" />

        <Switch checked={showDoc} onChange={setShowDoc} label="显示说明" />
        <div className="bi-designer__group bi-zoom">
          <IconButton label="缩小（Ctrl -）" onClick={() => zoomBy(1 / 1.2)}><Subtract24Regular /></IconButton>
          <button type="button" className="bi-zoom__value" title="适应窗口（Ctrl 0）" onClick={fitView}>{Math.round(view.zoom * 100)}%</button>
          <IconButton label="放大（Ctrl +）" onClick={() => zoomBy(1.2)}><Add24Regular /></IconButton>
        </div>
        <Button icon={<Play24Regular />} onClick={() => setPreviewing(true)}>预览</Button>
        <Button icon={<Save24Regular />} variant={published ? "primary" : "default"} onClick={handleSave} disabled={!editor.dirty}>保存</Button>
        {published ? null : <Button variant="primary" onClick={handlePublish}>发布</Button>}
        <Menu
          trigger={({ toggle, open }) => (
            <IconButton label="更多操作" active={open} onClick={toggle}><MoreHorizontal24Regular /></IconButton>
          )}
          items={[
            { label: "导出配置文件", icon: <ArrowDownload24Regular />, onSelect: () => exportScreenFile(screen) },
            { label: "分享", icon: <Share24Regular />, disabled: !published || editor.dirty, onSelect: () => setSharing(true) },
            published ? "divider" : null,
            published ? { label: "下架", danger: true, onSelect: handleUnpublish } : null,
          ]}
        />
      </header>

      <div className={showDoc ? "bi-designer__main has-doc" : "bi-designer__main"}>
        <LeftPanel editor={editor} onAdd={addAtCenter} onPreviewDataset={setDatasetPreview} />
        <ScreenRuntime screen={screen} mode="design">
          <CanvasEditor
            editor={editor}
            view={view}
            setView={setView}
            workspaceRef={workspaceRef}
            onDropWidget={placeWidget}
            onContextMenu={setContextMenu}
            onOpenSpace={setSpaceWidget}
          />
        </ScreenRuntime>
        <RightPanel editor={editor} onPreviewDataset={setDatasetPreview} />
        {showDoc ? <DocPanel page="designer" onClose={() => setShowDoc(false)} /> : null}
      </div>

      {contextMenu ? (
        <ContextMenu menu={contextMenu} items={contextMenu.onWidget && selected.length ? widgetMenu : canvasMenu} onClose={() => setContextMenu(null)} />
      ) : null}
      {previewing ? <PreviewOverlay screen={screen} onClose={() => setPreviewing(false)} /> : null}
      {spaceWidget ? <SpaceDialog widget={spaceWidget} onClose={() => setSpaceWidget(null)} /> : null}
      {datasetPreview ? <DatasetPreview datasetId={datasetPreview} onClose={() => setDatasetPreview(null)} /> : null}
      {sharing ? <ShareDialog screenId={screen.id} onClose={() => setSharing(false)} /> : null}
      {confirmClose ? (
        <ConfirmDialog
          title="有未保存的修改"
          message="离开后，上次保存之后的修改会丢失。"
          confirmLabel="保存并离开"
          onClose={() => setConfirmClose(false)}
          onConfirm={() => {
            if (save()) onClose();
          }}
          extra={{ label: "不保存，直接离开", onSelect: onClose }}
        />
      ) : null}
    </div>,
    document.body,
  );
}
