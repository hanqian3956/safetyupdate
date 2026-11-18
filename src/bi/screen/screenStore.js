// Screens are kept in the browser's localStorage. The built-in templates are written on
// first use and can be edited or deleted like any other.

import { useSyncExternalStore } from "react";
import { clone, duplicateScreen, normalizeScreen } from "./model.js";
import { buildTemplates } from "./templates.js";

const STORAGE_KEY = "bi:screens:v1";
const SEED_KEY = "bi:screens:seed";
// Bump when the built-in templates change. Built-in screens nobody has edited are then
// replaced by the new version; edited ones are left as they are.
const SEED_VERSION = "3";

let screens = null;
const listeners = new Set();

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeScreen).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(screens));
    return true;
  } catch {
    return false;
  }
}

function load() {
  if (screens) return screens;
  screens = readStorage();
  let seeded = null;
  try {
    seeded = window.localStorage.getItem(SEED_KEY);
  } catch {
    seeded = SEED_VERSION;
  }
  if (seeded !== SEED_VERSION) {
    const templates = buildTemplates();
    const fresh = new Map(templates.map((template) => [template.id, template]));
    screens = screens.map((screen) => {
      const template = fresh.get(screen.id);
      const untouched = template && screen.builtin && screen.updatedAt === screen.createdAt;
      return untouched ? { ...template, status: screen.status, shared: screen.shared, publishedAt: screen.publishedAt } : screen;
    });
    const existing = new Set(screens.map((screen) => screen.id));
    screens = [...screens, ...templates.filter((template) => !existing.has(template.id))];
    writeStorage();
    try {
      window.localStorage.setItem(SEED_KEY, SEED_VERSION);
    } catch {
      // Without storage the templates are simply rebuilt on the next visit.
    }
  }
  return screens;
}

function commit(next) {
  screens = next;
  const stored = writeStorage();
  listeners.forEach((listener) => listener());
  return stored;
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
  // Keeps a shared screen open in another tab in step with edits made here.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    screens = readStorage();
    listeners.forEach((listener) => listener());
  });
}

export function useScreens() {
  return useSyncExternalStore(subscribe, load);
}

export function getScreen(id) {
  return load().find((screen) => screen.id === id) ?? null;
}

/** Inserts or replaces a screen. Returns false when the browser refused to store it. */
export function saveScreen(screen) {
  const stamped = { ...screen, updatedAt: Date.now() };
  const list = load();
  const exists = list.some((entry) => entry.id === stamped.id);
  const stored = commit(exists ? list.map((entry) => (entry.id === stamped.id ? stamped : entry)) : [stamped, ...list]);
  return stored ? stamped : false;
}

export function patchScreen(id, patch) {
  const current = getScreen(id);
  if (!current) return false;
  return commit(load().map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
}

export function removeScreen(id) {
  return commit(load().filter((entry) => entry.id !== id));
}

export function copyScreen(id) {
  const source = getScreen(id);
  if (!source) return null;
  const copy = duplicateScreen(source);
  commit([copy, ...load()]);
  return copy;
}

export function setPublished(id, published) {
  return patchScreen(id, published ? { status: "published", publishedAt: Date.now() } : { status: "draft", shared: false });
}

export function restoreTemplates() {
  const templates = buildTemplates();
  const ids = new Set(templates.map((template) => template.id));
  return commit([...templates, ...load().filter((entry) => !ids.has(entry.id))]);
}

export function exportScreenFile(screen) {
  const payload = { kind: "bi-screen", version: 1, exportedAt: new Date().toISOString(), screen: clone(screen) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${screen.name || "大屏"}.bi.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parses an exported file and adds it as a new draft. Throws with a readable message. */
export function importScreenText(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("文件不是有效的 JSON，请选择从大屏导出的 .bi.json 文件");
  }
  const normalized = normalizeScreen(payload?.kind === "bi-screen" ? payload.screen : payload);
  if (!normalized) throw new Error("文件里没有大屏配置，请选择从大屏导出的 .bi.json 文件");
  const imported = duplicateScreen(normalized, normalized.name);
  if (!commit([imported, ...load()])) throw new Error("导入失败：大屏配置超出大小上限");
  return imported;
}

const SHARE_PREFIX = "#/bi/screen/";

export function getShareId(hash = typeof window !== "undefined" ? window.location.hash : "") {
  return hash.startsWith(SHARE_PREFIX) ? decodeURIComponent(hash.slice(SHARE_PREFIX.length)) : null;
}

export function shareUrl(id) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${SHARE_PREFIX}${encodeURIComponent(id)}`;
}
