export const certificateTypes = ["电工作业", "焊接与热切割作业", "高处作业", "煤矿特种作业", "其他"];
export const certificateStatuses = { valid: "有效", expiring: "即将到期", expired: "已过期", pending: "未生效" };
export const expiryWarningDays = 30;

export const todayInMine = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" });
const dateStamp = (date) => Date.parse(`${date}T00:00:00Z`);
const dayMs = 86400000;

export function getCertificateStatus(record, today = todayInMine()) {
  if (today < record.effectiveFrom) return "pending";
  const daysLeft = (dateStamp(record.expiresOn) - dateStamp(today)) / dayMs;
  if (daysLeft < 0) return "expired";
  return daysLeft <= expiryWarningDays ? "expiring" : "valid";
}

function createSamples() {
  const base = dateStamp(todayInMine());
  const date = (offset) => new Date(base + offset * dayMs).toISOString().slice(0, 10);
  return [
    ["李明", "机电管理部", "电工作业", "低压电工作业", 330],
    ["赵磊", "检修班", "焊接与热切割作业", "熔化焊接与热切割作业", 16],
    ["周杰", "设备管理部", "高处作业", "高处安装、维护、拆除作业", -8],
    ["王建国", "采掘队", "煤矿特种作业", "煤矿井下电气作业", 180],
    ["孙海", "采掘队", "煤矿特种作业", "煤矿井下爆破作业", 260],
  ].map(([holder, unit, type, scope, expires], index) => ({
    id: `sample-${index + 1}`,
    holder, unit, type, scope,
    number: `DEMO-${String(index + 1).padStart(3, "0")}`,
    issuer: "",
    effectiveFrom: date(-365),
    expiresOn: date(expires),
    attachment: null,
    updatedAt: 0,
  }));
}

function certificateRequest(mode, run) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("work-permit-certificates", 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore("certificates", { keyPath: "id" });
      createSamples().forEach((row) => store.add(row));
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("certificates", mode);
      let result;
      transaction.onabort = () => { db.close(); reject(transaction.error); };
      transaction.oncomplete = () => { db.close(); resolve(result); };
      try {
        const operation = run(transaction.objectStore("certificates"));
        operation.onsuccess = () => { result = operation.result; };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}

export const listCertificates = () => certificateRequest("readonly", (store) => store.getAll());
export const saveCertificate = (row) => certificateRequest("readwrite", (store) => store.put(row));
export const deleteCertificate = (id) => certificateRequest("readwrite", (store) => store.delete(id));
