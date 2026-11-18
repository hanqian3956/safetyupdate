// Editing state for one screen: the working copy, undo/redo history and the selection.
// Drags use begin → transient… → end so a whole gesture is a single undo step.

import { useMemo, useReducer } from "react";
import { duplicateWidget } from "../screen/model.js";

const HISTORY_LIMIT = 80;
const COALESCE_MS = 1200;

function pushPast(past, screen) {
  return [...past.slice(-(HISTORY_LIMIT - 1)), screen];
}

function reducer(state, action) {
  switch (action.type) {
    case "apply": {
      const screen = action.updater(state.screen);
      if (screen === state.screen) return state;
      // Consecutive edits of the same thing (typing a title, nudging with arrows) share one step.
      const merge = action.key && action.key === state.lastKey && action.at - state.lastAt < COALESCE_MS;
      return {
        ...state,
        screen,
        past: merge ? state.past : pushPast(state.past, state.screen),
        future: [],
        lastKey: action.key ?? null,
        lastAt: action.at,
      };
    }
    case "begin":
      return state.checkpoint ? state : { ...state, checkpoint: state.screen };
    case "transient": {
      const screen = action.updater(state.screen);
      return screen === state.screen ? state : { ...state, screen };
    }
    case "end": {
      if (!state.checkpoint) return state;
      if (state.checkpoint === state.screen) return { ...state, checkpoint: null };
      return { ...state, checkpoint: null, past: pushPast(state.past, state.checkpoint), future: [], lastKey: null };
    }
    case "undo": {
      if (!state.past.length) return state;
      const screen = state.past[state.past.length - 1];
      return {
        ...state,
        screen,
        past: state.past.slice(0, -1),
        future: [state.screen, ...state.future],
        lastKey: null,
        selection: state.selection.filter((id) => screen.widgets.some((widget) => widget.id === id)),
      };
    }
    case "redo": {
      if (!state.future.length) return state;
      const [screen, ...future] = state.future;
      return {
        ...state,
        screen,
        future,
        past: pushPast(state.past, state.screen),
        lastKey: null,
        selection: state.selection.filter((id) => screen.widgets.some((widget) => widget.id === id)),
      };
    }
    case "select":
      return { ...state, selection: action.ids };
    case "saved":
      return { ...state, screen: action.screen, saved: action.screen, lastKey: null };
    default:
      return state;
  }
}

const mapWidgets = (screen, ids, update) => {
  const set = ids instanceof Set ? ids : new Set(ids);
  let changed = false;
  const widgets = screen.widgets.map((widget) => {
    if (!set.has(widget.id)) return widget;
    const next = update(widget);
    if (next !== widget) changed = true;
    return next;
  });
  return changed ? { ...screen, widgets } : screen;
};

export function useEditor(initialScreen) {
  const [state, dispatch] = useReducer(reducer, initialScreen, (screen) => ({
    screen,
    saved: screen,
    past: [],
    future: [],
    selection: [],
    checkpoint: null,
    lastKey: null,
    lastAt: 0,
  }));

  const actions = useMemo(() => {
    const apply = (updater, key) => dispatch({ type: "apply", updater, key, at: Date.now() });
    return {
      apply,
      begin: () => dispatch({ type: "begin" }),
      transient: (updater) => dispatch({ type: "transient", updater }),
      end: () => dispatch({ type: "end" }),
      undo: () => dispatch({ type: "undo" }),
      redo: () => dispatch({ type: "redo" }),
      select: (ids) => dispatch({ type: "select", ids }),
      markSaved: (screen) => dispatch({ type: "saved", screen }),

      updateScreen: (patch, key) => apply((screen) => ({ ...screen, ...patch }), key),
      updateWidget: (id, patch, key) =>
        apply((screen) => mapWidgets(screen, [id], (widget) => ({ ...widget, ...(typeof patch === "function" ? patch(widget) : patch) })), key),
      updateWidgets: (ids, update, key) => apply((screen) => mapWidgets(screen, ids, update), key),
      updateStyle: (id, patch, key) =>
        apply((screen) => mapWidgets(screen, [id], (widget) => ({ ...widget, style: { ...widget.style, ...patch } })), key),
      addWidgets: (widgets) => {
        apply((screen) => ({ ...screen, widgets: [...screen.widgets, ...widgets] }));
        dispatch({ type: "select", ids: widgets.map((widget) => widget.id) });
      },
      removeWidgets: (ids) => {
        const set = new Set(ids);
        apply((screen) => ({ ...screen, widgets: screen.widgets.filter((widget) => !set.has(widget.id)) }));
        dispatch({ type: "select", ids: [] });
      },
      duplicateWidgets: (widgets) => {
        const copies = widgets.map((widget) => duplicateWidget(widget));
        apply((screen) => ({ ...screen, widgets: [...screen.widgets, ...copies] }));
        dispatch({ type: "select", ids: copies.map((widget) => widget.id) });
      },
      // mode: "front" | "back" | "forward" | "backward"
      reorder: (ids, mode) =>
        apply((screen) => {
          const set = new Set(ids);
          const picked = screen.widgets.filter((widget) => set.has(widget.id));
          if (!picked.length) return screen;
          const rest = screen.widgets.filter((widget) => !set.has(widget.id));
          if (mode === "front") return { ...screen, widgets: [...rest, ...picked] };
          if (mode === "back") return { ...screen, widgets: [...picked, ...rest] };
          const widgets = [...screen.widgets];
          const order = mode === "forward" ? [...widgets.keys()].reverse() : [...widgets.keys()];
          const step = mode === "forward" ? 1 : -1;
          order.forEach((index) => {
            const target = index + step;
            if (!set.has(widgets[index].id) || target < 0 || target >= widgets.length || set.has(widgets[target].id)) return;
            [widgets[index], widgets[target]] = [widgets[target], widgets[index]];
          });
          return { ...screen, widgets };
        }),
    };
  }, []);

  return {
    screen: state.screen,
    selection: state.selection,
    dirty: state.screen !== state.saved,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    ...actions,
  };
}
