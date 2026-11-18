import { useEffect, useState } from "react";
import {
  certificateStatuses, certificateTypes, deleteCertificate, expiryWarningDays,
  getCertificateStatus, listCertificates, saveCertificate, todayInMine,
} from "./permit-qualification-data";
import "./permit-qualifications.css";

const blankFilters = { keyword: "", type: "", status: "" };
const attachmentTypes = ["application/pdf", "image/jpeg", "image/png"];
const statusTone = { valid: "working", expiring: "ready", expired: "rejected", pending: "draft" };
const fields = [
  ["holder", "持证人", 20], ["unit", "所属单位 / 班组", 50],
  ["scope", "准操项目", 80], ["number", "证书编号", 50], ["issuer", "发证机关", 80],
];

function CertificateStatus({ status }) {
  return <span className={`wp-status wp-status-${statusTone[status]}`}><i />{certificateStatuses[status]}</span>;
}

function CertificateEditor({ record, records, onSave, onClose, busy }) {
  const [draft, setDraft] = useState(() => record ?? {
    holder: "", unit: "", type: "", scope: "", number: "", issuer: "",
    effectiveFrom: "", expiresOn: "", attachment: null,
  });
  const [error, setError] = useState("");
  const set = (key, value) => { setDraft((old) => ({ ...old, [key]: value })); setError(""); };
  const textInput = ([key, label, maxLength]) => (
    <label key={key}><span>{label}{key !== "issuer" && <i> *</i>}</span>
      <input required={key !== "issuer"} maxLength={maxLength} value={draft[key]} onChange={(event) => set(key, event.target.value)} />
    </label>
  );
  function submit(event) {
    event.preventDefault();
    const next = { ...draft };
    for (const [key] of fields) next[key] = draft[key].trim();
    if (fields.some(([key]) => key !== "issuer" && !next[key])) return setError("请填写所有必填项，不可只输入空格。");
    if (next.expiresOn < next.effectiveFrom) return setError("到期日期不能早于生效日期。");
    if (records.some((row) => row.id !== next.id && row.type === next.type && row.number.toUpperCase() === next.number.toUpperCase())) {
      return setError("该作业类别下已存在相同的证书编号。");
    }
    const id = next.id ?? Array.from(crypto.getRandomValues(new Uint32Array(4)), (word) => word.toString(16).padStart(8, "0")).join("");
    onSave({ ...next, id, updatedAt: Date.now() });
  }

  return <form className="wp-simple-dialog wp-qualification-editor" onSubmit={submit}>
    <div className="wp-form-grid">
      {fields.slice(0, 2).map(textInput)}
      <label><span>作业类别<i> *</i></span><select required value={draft.type} onChange={(event) => set("type", event.target.value)}>
        <option value="">请选择</option>{certificateTypes.map((type) => <option key={type}>{type}</option>)}
      </select></label>
      {fields.slice(2).map(textInput)}
      <label><span>生效日期<i> *</i></span><input required type="date" value={draft.effectiveFrom} onChange={(event) => set("effectiveFrom", event.target.value)} /></label>
      <label><span>到期日期<i> *</i></span><input required type="date" value={draft.expiresOn} onChange={(event) => set("expiresOn", event.target.value)} /></label>
      <div className="wp-span-2 wp-qualification-upload">
        <label htmlFor="wp-cert-file">证照原件</label>
        <input id="wp-cert-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          if (!attachmentTypes.includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) {
            setError("请选择不超过 10 MB 的有效 PDF、JPG 或 PNG 文件。");
            return;
          }
          set("attachment", file);
        }} />
        <span>PDF、JPG、PNG，最大 10 MB</span>
        {draft.attachment && <div className="wp-cert-filename">{draft.attachment.name}
          <button type="button" className="wp-text-button danger" onClick={() => set("attachment", null)}>移除</button>
        </div>}
      </div>
    </div>
    {error && <p className="wp-cert-error" role="alert">{error}</p>}
    <footer><button type="button" className="wp-button wp-button-ghost" disabled={busy} onClick={onClose}>取消</button><button className="wp-button" disabled={busy}>保存</button></footer>
  </form>;
}

function CertificateDetails({ record, today, onClose }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!record.attachment) return;
    const next = URL.createObjectURL(record.attachment);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [record.attachment]);

  return <div className="wp-simple-dialog wp-cert-detail">
    <dl>
      {[
        ["持证人", record.holder], ["所属单位 / 班组", record.unit],
        ["作业类别", record.type], ["准操项目", record.scope],
        ["证书编号", record.number], ["发证机关", record.issuer || "—"],
        ["有效期", `${record.effectiveFrom} 至 ${record.expiresOn}`],
        ["状态", <CertificateStatus status={getCertificateStatus(record, today)} />],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    <h4>证照原件</h4>
    {!record.attachment ? <p>未上传原件</p> : url && <>
      <a href={url} download={record.attachment.name}>{record.attachment.name}（下载）</a>
      {record.attachment.type === "application/pdf"
        ? <iframe src={url} title="证照 PDF 原件" />
        : <img src={url} alt="证照原件" />}
    </>}
    <footer><button type="button" className="wp-button wp-button-ghost" onClick={onClose}>关闭</button></footer>
  </div>;
}

export default function PermitQualifications({ Dialog, Pagination, onAction }) {
  const [records, setRecords] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState(blankFilters);
  const [filters, setFilters] = useState(blankFilters);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const today = todayInMine();
  useEffect(() => {
    let live = true;
    listCertificates().then((rows) => { if (live) setRecords(rows); }).catch(() => { if (live) setLoadError(true); });
    return () => { live = false; };
  }, []);

  const keyword = filters.keyword.trim().toLowerCase();
  const filtered = (records ?? []).filter((row) => (
    (!keyword || [row.holder, row.number, row.unit, row.scope].some((value) => value.toLowerCase().includes(keyword)))
    && (!filters.type || row.type === filters.type)
    && (!filters.status || getCertificateStatus(row, today) === filters.status)
  )).sort((a, b) => b.updatedAt - a.updatedAt);
  const activePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / size)));
  const visible = filtered.slice((activePage - 1) * size, activePage * size);

  const close = () => { if (!busy) setModal(null); };
  async function mutate(operation, row) {
    setBusy(true);
    try {
      if (operation === "save") await saveCertificate(row);
      else await deleteCertificate(row.id);
      setRecords((items) => operation === "save"
        ? [row, ...items.filter((item) => item.id !== row.id)]
        : items.filter((item) => item.id !== row.id));
      setModal(null);
      onAction?.(operation === "save" ? "证照已保存" : "证照已删除");
    } catch {
      onAction?.(operation === "save" ? "保存失败，请检查浏览器存储空间后重试" : "删除失败，请重试");
    } finally {
      setBusy(false);
    }
  }

  return <section className="wp-panel wp-qualification-panel">
    <header className="wp-section-title"><h2>特种作业证照台账</h2><button className="wp-button" disabled={!records} onClick={() => setModal({ kind: "edit" })}>新增证照</button></header>
    <form className="wp-filter wp-cert-filters" onSubmit={(event) => { event.preventDefault(); setFilters(query); setPage(1); }}>
      <label>关键词<input value={query.keyword} maxLength={50} placeholder="持证人、单位、准操项目或编号" onChange={(event) => setQuery({ ...query, keyword: event.target.value })} /></label>
      <label>作业类别<select value={query.type} onChange={(event) => setQuery({ ...query, type: event.target.value })}>
        <option value="">全部类别</option>{certificateTypes.map((type) => <option key={type}>{type}</option>)}
      </select></label>
      <label>有效期状态<select value={query.status} onChange={(event) => setQuery({ ...query, status: event.target.value })}>
        <option value="">全部状态</option>{Object.entries(certificateStatuses).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <button className="wp-button" type="submit">搜索</button>
      <button className="wp-button wp-button-ghost" type="button" onClick={() => { setQuery(blankFilters); setFilters(blankFilters); setPage(1); }}>重置</button>
    </form>
    <div className="wp-cert-caption">到期前 {expiryWarningDays} 天标记为即将到期</div>
    <div className="wp-table-wrap"><table className="wp-table wp-cert-table">
      <thead><tr>{["持证人", "所属单位 / 班组", "作业类别 / 准操项目", "证书编号", "到期日期", "状态", "操作"].map((label) => <th key={label}>{label}</th>)}</tr></thead>
      <tbody>
        {visible.map((record) => <tr key={record.id}>
          <td><strong>{record.holder}</strong></td><td>{record.unit}</td>
          <td>{record.type}<small>{record.scope}</small></td><td className="wp-cert-number">{record.number}</td>
          <td className="wp-cert-date">{record.expiresOn}</td><td><CertificateStatus status={getCertificateStatus(record, today)} /></td>
          <td>{[["view", "查看"], ["edit", "编辑"], ["delete", "删除"]].map(([kind, text]) => (
            <button type="button" key={kind} className={`wp-text-button ${kind === "delete" ? "danger" : ""}`} onClick={() => setModal({ kind, record })}>{text}</button>
          ))}</td>
        </tr>)}
        {!visible.length && <tr><td colSpan={7} className="wp-cert-empty">{loadError ? "无法读取浏览器中的证照记录" : records ? "暂无符合条件的证照" : "正在加载证照…"}</td></tr>}
      </tbody>
    </table></div>
    {records && <Pagination total={filtered.length} page={activePage} pageSize={size} onPageChange={setPage} onPageSizeChange={(value) => { setSize(value); setPage(1); }} />}
    {modal?.kind === "edit" && <Dialog title={modal.record ? "编辑证照" : "新增证照"} onClose={close} wide>
      <CertificateEditor record={modal.record} records={records} onSave={(row) => mutate("save", row)} onClose={close} busy={busy} />
    </Dialog>}
    {modal?.kind === "view" && <Dialog title="证照详情" onClose={close} wide><CertificateDetails record={modal.record} today={today} onClose={close} /></Dialog>}
    {modal?.kind === "delete" && <Dialog title="删除证照" onClose={close}><div className="wp-simple-dialog">
      <p>确定删除{modal.record.holder}的证照（{modal.record.number}）吗？原件也会一并删除，且无法恢复。</p>
      <footer><button type="button" className="wp-button wp-button-ghost" disabled={busy} onClick={close}>取消</button><button type="button" className="wp-button wp-button-danger" disabled={busy} onClick={() => mutate("delete", modal.record)}>确认删除</button></footer>
    </div></Dialog>}
  </section>;
}
