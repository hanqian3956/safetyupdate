// Deterministic random helpers. Every dataset/day pair gets its own generator so the
// records of a given calendar day never change between page loads.

export function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed) {
  let state = (typeof seed === "string" ? hashString(seed) : seed) >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  const rng = {
    next,
    chance: (probability) => next() < probability,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max, decimals = 1) => {
      const factor = 10 ** decimals;
      return Math.round((min + next() * (max - min)) * factor) / factor;
    },
    pick: (list) => list[Math.floor(next() * list.length)],
    // entries: [[value, weight], ...]
    weighted: (entries) => {
      const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
      let cursor = next() * total;
      for (const [value, weight] of entries) {
        cursor -= weight;
        if (cursor <= 0) return value;
      }
      return entries[entries.length - 1][0];
    },
    // Rough bell curve from three uniform samples; good enough for sensor-like values.
    around: (mean, spread, decimals = 1) => {
      const factor = 10 ** decimals;
      const sample = (next() + next() + next()) / 3 - 0.5;
      return Math.round((mean + sample * 2 * spread) * factor) / factor;
    },
  };
  return rng;
}
