const pad = (value) => String(value).padStart(2, "0");
const DAY = 86400000;

export function formatNumber(value, { decimals = 0, compact = false, thousands = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  let number = Number(value);
  let suffix = "";
  let digits = decimals;
  if (compact && Math.abs(number) >= 100000000) {
    number /= 100000000;
    suffix = "亿";
    digits = 2;
  } else if (compact && Math.abs(number) >= 10000) {
    number /= 10000;
    suffix = "万";
    digits = 2;
  }
  const fixed = number.toFixed(digits);
  if (!thousands) return fixed + suffix;
  const [integer, fraction] = fixed.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (fraction ? `${grouped}.${fraction}` : grouped) + suffix;
}

// 平台时间规则：今天 / 昨天换算为「今天 10:26」「昨天 10:26」，其余显示年月日时分秒。
export function formatDateTime(ms, mode = "smart", now = Date.now()) {
  if (ms === null || ms === undefined || ms === "") return "—";
  const date = new Date(ms);
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const day = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  if (mode === "time") return clock;
  if (mode === "clock") return `${clock}:${pad(date.getSeconds())}`;
  if (mode === "short") return `${day} ${clock}`;
  if (mode === "date") return `${date.getFullYear()}-${day}`;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (diff === 0) return `今天 ${clock}`;
  if (diff === DAY) return `昨天 ${clock}`;
  if (mode === "smart-short") return `${day} ${clock}`;
  return `${date.getFullYear()}-${day} ${clock}:${pad(date.getSeconds())}`;
}

export function formatCell(value, field, now) {
  if (value === null || value === undefined || value === "") return "—";
  if (!field) return String(value);
  if (field.type === "datetime") return formatDateTime(value, "smart-short", now);
  if (field.type === "number") return formatNumber(value, { decimals: field.decimals ?? 0 });
  return String(value);
}

export function formatPercent(ratio, decimals = 1) {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return "—";
  return `${(ratio * 100).toFixed(decimals)}%`;
}
