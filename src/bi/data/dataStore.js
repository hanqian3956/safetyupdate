// In-memory store behind every dataset. Widgets read through getRows(). New submissions keep
// arriving while a BI page is open, the way they do on a platform people are working in.

import { DATASETS } from "./datasets.js";
import { appendLiveSubmission, generateHistory } from "./generate.js";
import { scenarioRows, subscribeScenario } from "./scenarioRows.js";

let state = null;
let version = 0;
let liveTimer = null;
let liveUsers = 0;
let scenarioWatched = false;
const listeners = new Set();
const merged = new Map();

function ensureState() {
  if (!state) state = generateHistory(Date.now());
  return state;
}

function changed() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/** All rows of a dataset, oldest first. */
export function getRows(datasetId) {
  const base = ensureState().tables[datasetId] ?? [];
  const extra = scenarioRows(datasetId);
  if (!extra?.length) return base;
  const hit = merged.get(datasetId);
  if (hit && hit.version === version && hit.extra === extra && hit.length === base.length) return hit.rows;
  const timeField = DATASETS.find((dataset) => dataset.id === datasetId).timeField;
  const rows = [...base, ...extra].sort((left, right) => left[timeField] - right[timeField]);
  merged.set(datasetId, { version, extra, length: base.length, rows });
  return rows;
}

export function getDataVersion() {
  return version;
}

export function subscribeData(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// A new submission arrives every 7–16 seconds: often enough that a screen visibly moves at
// each refresh, slow enough that an hour of looking at it does not distort today's totals.
function scheduleLiveTick() {
  liveTimer = window.setTimeout(() => {
    const current = ensureState();
    appendLiveSubmission(current.tables, current.counters, Date.now());
    changed();
    scheduleLiveTick();
  }, 7000 + Math.random() * 9000);
}

/**
 * Keeps submissions arriving while a BI page is open. Every BI page calls this when it mounts
 * and calls the returned function when it unmounts; the stream runs while at least one is open.
 */
export function startLiveData() {
  if (typeof window === "undefined") return () => {};
  if (!scenarioWatched) {
    scenarioWatched = true;
    subscribeScenario(changed);
  }
  liveUsers += 1;
  if (liveTimer === null) scheduleLiveTick();
  return () => {
    liveUsers -= 1;
    if (liveUsers > 0) return;
    window.clearTimeout(liveTimer);
    liveTimer = null;
  };
}
