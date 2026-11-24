// The editable canvas: select, move, resize, marquee-select, snap, pan and zoom.
// All geometry is in stage pixels; `view` ({ zoom, x, y }) maps the stage into the workspace.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { stageStyle } from "../runtime/ScreenStage.jsx";
import { getTheme } from "../screen/themes.js";
import { WidgetBody } from "../widgets/WidgetBody.jsx";
import { boundsOf, intersects, resizeBox, snapLines, snapMove } from "./geometry.js";

export const WIDGET_MIME = "application/x-bi-widget";
export const MIN_ZOOM = 0.08;
export const MAX_ZOOM = 4;
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const SNAP_PIXELS = 6;

const isTyping = () => {
  const element = document.activeElement;
  return Boolean(element && (/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) || element.isContentEditable));
};

export function CanvasEditor({ editor, view, setView, workspaceRef, onDropWidget, onContextMenu, onOpenSpace }) {
  const { screen, selection } = editor;
  const [guides, setGuides] = useState(null);
  const [marquee, setMarquee] = useState(null);
  const [gesture, setGesture] = useState(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const drag = useRef(null);
  const latest = useRef({ screen, selection, view, spaceHeld });
  useLayoutEffect(() => {
    latest.current = { screen, selection, view, spaceHeld };
  });

  const toStage = (event) => {
    const rect = workspaceRef.current.getBoundingClientRect();
    const current = latest.current.view;
    return { x: (event.clientX - rect.left - current.x) / current.zoom, y: (event.clientY - rect.top - current.y) / current.zoom };
  };

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return undefined;
    // Registered by hand because React's wheel listener is passive and cannot stop the page zooming.
    const onWheel = (event) => {
      event.preventDefault();
      const rect = workspace.getBoundingClientRect();
      setView((current) => {
        if (event.ctrlKey || event.metaKey) {
          const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * Math.exp(-event.deltaY * 0.0022)));
          const ratio = zoom / current.zoom;
          const cx = event.clientX - rect.left;
          const cy = event.clientY - rect.top;
          return { zoom, x: cx - (cx - current.x) * ratio, y: cy - (cy - current.y) * ratio };
        }
        return { ...current, x: current.x - event.deltaX, y: current.y - event.deltaY };
      });
    };
    workspace.addEventListener("wheel", onWheel, { passive: false });
    return () => workspace.removeEventListener("wheel", onWheel);
  }, [workspaceRef, setView]);

  useEffect(() => {
    const onKeyDown = (event) => {
      // Space pans only while nothing is focused; on a focused button it must still press the button.
      if (event.code === "Space" && document.activeElement === document.body) {
        event.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (event) => {
      if (event.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const onPointerDown = (event) => {
    const workspace = workspaceRef.current;
    const current = latest.current;
    if (event.button === 1 || (event.button === 0 && current.spaceHeld)) {
      event.preventDefault();
      drag.current = { kind: "pan", startX: event.clientX, startY: event.clientY, view: current.view };
      workspace.setPointerCapture(event.pointerId);
      setGesture("pan");
      return;
    }
    if (event.button !== 0) return;
    if (isTyping()) document.activeElement.blur();

    const point = toStage(event);
    const handle = event.target.closest?.("[data-handle]")?.dataset.handle;
    const itemId = event.target.closest?.("[data-widget-id]")?.dataset.widgetId;
    const item = itemId ? current.screen.widgets.find((widget) => widget.id === itemId) : null;

    if (handle && current.selection.length === 1) {
      const widget = current.screen.widgets.find((entry) => entry.id === current.selection[0]);
      if (!widget) return;
      drag.current = {
        kind: "resize",
        handle,
        id: widget.id,
        point,
        start: { x: widget.x, y: widget.y, w: widget.w, h: widget.h },
        lines: snapLines(current.screen, [widget.id]),
        moved: false,
      };
    } else if (item && !item.locked) {
      let ids = current.selection;
      if (event.shiftKey) {
        ids = ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id];
        editor.select(ids);
        if (!ids.includes(item.id)) return;
      } else if (!ids.includes(item.id)) {
        ids = [item.id];
        editor.select(ids);
      }
      const moving = current.screen.widgets.filter((widget) => ids.includes(widget.id) && !widget.locked);
      drag.current = {
        kind: "move",
        openSpace: item.type === "space" && !event.shiftKey,
        widgetId: item.id,
        point,
        starts: new Map(moving.map((widget) => [widget.id, { x: widget.x, y: widget.y }])),
        box: boundsOf(moving),
        lines: snapLines(current.screen, moving.map((widget) => widget.id)),
        moved: false,
      };
    } else {
      if (!event.shiftKey) editor.select([]);
      drag.current = { kind: "marquee", point, base: event.shiftKey ? current.selection : [] };
    }
    workspace.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    const state = drag.current;
    if (!state) return;
    const current = latest.current;
    if (state.kind === "pan") {
      setView({ ...state.view, x: state.view.x + event.clientX - state.startX, y: state.view.y + event.clientY - state.startY });
      return;
    }
    const point = toStage(event);
    let dx = point.x - state.point.x;
    let dy = point.y - state.point.y;
    const threshold = SNAP_PIXELS / current.view.zoom;

    if (state.kind === "marquee") {
      const box = { x: Math.min(state.point.x, point.x), y: Math.min(state.point.y, point.y), w: Math.abs(dx), h: Math.abs(dy) };
      setMarquee(box);
      const hit = current.screen.widgets.filter((widget) => !widget.hidden && !widget.locked && intersects(box, widget)).map((widget) => widget.id);
      editor.select([...new Set([...state.base, ...hit])]);
      return;
    }

    if (!state.moved) {
      if (Math.hypot(dx, dy) * current.view.zoom < 3) return;
      state.moved = true;
      editor.begin();
      setGesture(state.kind);
    }
    // Hold Alt to place something a few pixels off a snap line.
    const snapping = !event.altKey;

    if (state.kind === "move") {
      let guideX = null;
      let guideY = null;
      if (snapping) {
        const snap = snapMove({ ...state.box, x: state.box.x + dx, y: state.box.y + dy }, state.lines, threshold);
        dx += snap.dx;
        dy += snap.dy;
        ({ guideX, guideY } = snap);
      }
      dx = Math.round(dx);
      dy = Math.round(dy);
      editor.transient((draft) => ({
        ...draft,
        widgets: draft.widgets.map((widget) => {
          const start = state.starts.get(widget.id);
          return start ? { ...widget, x: start.x + dx, y: start.y + dy } : widget;
        }),
      }));
      setGuides(guideX === null && guideY === null ? null : { x: guideX, y: guideY });
      return;
    }

    const { box, guideX, guideY } = resizeBox(state.start, state.handle, dx, dy, snapping ? state.lines : null, threshold);
    editor.transient((draft) => ({
      ...draft,
      widgets: draft.widgets.map((widget) => (widget.id === state.id ? { ...widget, ...box } : widget)),
    }));
    setGuides(guideX === null && guideY === null ? null : { x: guideX, y: guideY });
  };

  const finishDrag = (event) => {
    const state = drag.current;
    if (!state) return;
    if (state.moved) editor.end();
    if (!state.moved && state.openSpace) {
      const widget = latest.current.screen.widgets.find((entry) => entry.id === state.widgetId);
      if (widget) onOpenSpace?.(widget);
    }
    drag.current = null;
    setGuides(null);
    setMarquee(null);
    setGesture(null);
    if (workspaceRef.current?.hasPointerCapture(event.pointerId)) workspaceRef.current.releasePointerCapture(event.pointerId);
  };

  const zoom = view.zoom;
  const theme = getTheme(screen.theme);
  const selected = screen.widgets.filter((widget) => selection.includes(widget.id) && !widget.hidden);
  const group = selected.length > 1 ? boundsOf(selected) : null;
  const scaled = (box) => ({ left: box.x * zoom, top: box.y * zoom, width: box.w * zoom, height: box.h * zoom });
  const cursorClass = gesture === "pan" ? "is-panning" : spaceHeld ? "is-pannable" : "";

  return (
    <div
      className={`bi-workspace ${cursorClass}`}
      ref={workspaceRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes(WIDGET_MIME)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        const type = event.dataTransfer.getData(WIDGET_MIME);
        if (!type) return;
        event.preventDefault();
        onDropWidget(type, toStage(event));
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        const itemId = event.target.closest?.("[data-widget-id]")?.dataset.widgetId;
        if (itemId && !selection.includes(itemId)) editor.select([itemId]);
        onContextMenu({ x: event.clientX, y: event.clientY, onWidget: Boolean(itemId) || selection.length > 0 });
      }}
    >
      <div className="bi-workspace__origin" style={{ transform: `translate(${view.x}px, ${view.y}px)` }}>
        <div
          className={`bi-stage bi-stage--design ${theme.dark ? "is-dark" : "is-light"}`}
          style={{ ...stageStyle(screen), transform: `scale(${zoom})`, "--bi-zoom": zoom }}
        >
          {screen.widgets.map((widget) =>
            widget.hidden ? null : (
              <div
                key={widget.id}
                data-widget-id={widget.locked ? undefined : widget.id}
                className={`bi-item bi-item--${widget.type} ${widget.locked ? "is-locked" : ""}`}
                style={{ left: widget.x, top: widget.y, width: widget.w, height: widget.h }}
              >
                <WidgetBody widget={widget} />
              </div>
            ))}
          {screen.widgets.length ? null : (
            <div className="bi-stage__hint">
              <b>从左侧拖入组件开始搭建</b>
              <span>也可以直接点击组件，它会出现在画布中央</span>
            </div>
          )}
        </div>
        <div className="bi-overlay" aria-hidden="true">
          {selected.map((widget) => (
            <div key={widget.id} className={`bi-sel ${widget.locked ? "is-locked" : ""}`} style={scaled(widget)}>
              {selected.length === 1 && !widget.locked
                ? HANDLES.map((handle) => <i key={handle} data-handle={handle} className={`bi-sel__handle bi-sel__handle--${handle}`} />)
                : null}
              {selected.length === 1 && (gesture === "move" || gesture === "resize") ? (
                <span className="bi-sel__badge">
                  {gesture === "move" ? `X ${widget.x}  Y ${widget.y}` : `${widget.w} × ${widget.h}`}
                </span>
              ) : null}
            </div>
          ))}
          {group ? <div className="bi-sel bi-sel--group" style={scaled(group)} /> : null}
          {guides?.x !== null && guides?.x !== undefined ? (
            <div className="bi-guide bi-guide--v" style={{ left: guides.x * zoom, height: screen.height * zoom }} />
          ) : null}
          {guides?.y !== null && guides?.y !== undefined ? (
            <div className="bi-guide bi-guide--h" style={{ top: guides.y * zoom, width: screen.width * zoom }} />
          ) : null}
          {marquee ? <div className="bi-marquee-box" style={scaled(marquee)} /> : null}
        </div>
      </div>
      <p className="bi-workspace__tips">空格 + 拖动平移 · Ctrl + 滚轮缩放 · 按住 Alt 暂停吸附 · Shift 多选</p>
    </div>
  );
}
