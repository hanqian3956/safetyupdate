import { getWidgetType } from "../widgets/registry.js";
import { DEFAULT_THEME } from "./themes.js";

let uidCounter = 0;
export function uid(prefix = "w") {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

export function createWidget(type, overrides = {}) {
  const definition = getWidgetType(type);
  if (!definition) throw new Error(`Unknown widget type: ${type}`);
  const [w, h] = definition.size;
  return {
    id: uid("w"),
    type,
    name: overrides.name ?? definition.label,
    x: 0,
    y: 0,
    w,
    h,
    locked: false,
    hidden: false,
    ...overrides,
    style: { ...clone(definition.style), ...(overrides.style ?? {}) },
    // A data binding is taken whole: mixing it with the type's sample binding would leak
    // the sample's filters or limit into it.
    data: definition.binding === "none" ? null : clone(overrides.data ?? definition.data),
    interaction: { linkage: true, drill: [], ...(overrides.interaction ?? {}) },
  };
}

export function duplicateWidget(widget, offset = 24) {
  return { ...clone(widget), id: uid("w"), x: widget.x + offset, y: widget.y + offset, locked: false };
}

export function createScreen(overrides = {}) {
  const now = Date.now();
  return {
    id: uid("screen"),
    name: "未命名大屏",
    description: "",
    width: 1920,
    height: 1080,
    theme: DEFAULT_THEME,
    backgroundColor: "",
    backgroundImage: "",
    refreshInterval: 10,
    linkage: true,
    widgets: [],
    status: "draft",
    shared: false,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    ...overrides,
  };
}

export function duplicateScreen(screen, name) {
  const now = Date.now();
  return {
    ...clone(screen),
    id: uid("screen"),
    name: name ?? `${screen.name} 副本`,
    status: "draft",
    shared: false,
    builtin: undefined,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    widgets: screen.widgets.map((widget) => ({ ...clone(widget), id: uid("w") })),
  };
}

// Brings a stored or imported screen up to the current shape and drops anything unusable.
export function normalizeScreen(input) {
  if (!input || typeof input !== "object" || !Array.isArray(input.widgets)) return null;
  const base = createScreen({ id: typeof input.id === "string" ? input.id : uid("screen") });
  const widgets = input.widgets
    .filter((widget) => widget && getWidgetType(widget.type))
    .map((widget) => {
      const definition = getWidgetType(widget.type);
      const [w, h] = definition.size;
      return {
        id: typeof widget.id === "string" ? widget.id : uid("w"),
        type: widget.type,
        name: typeof widget.name === "string" ? widget.name : definition.label,
        x: Number(widget.x) || 0,
        y: Number(widget.y) || 0,
        w: Math.max(20, Number(widget.w) || w),
        h: Math.max(20, Number(widget.h) || h),
        locked: Boolean(widget.locked),
        hidden: Boolean(widget.hidden),
        style: { ...clone(definition.style), ...(widget.style ?? {}) },
        data: definition.binding === "none" ? null : clone(widget.data ?? definition.data),
        interaction: { linkage: true, drill: [], ...(widget.interaction ?? {}) },
      };
    });
  return {
    ...base,
    ...input,
    id: base.id,
    width: Math.max(320, Number(input.width) || base.width),
    height: Math.max(240, Number(input.height) || base.height),
    // A screen always refreshes on its own; older configurations could have it switched off.
    refreshInterval: Number(input.refreshInterval) > 0 ? Number(input.refreshInterval) : base.refreshInterval,
    widgets,
  };
}

export { clone };
