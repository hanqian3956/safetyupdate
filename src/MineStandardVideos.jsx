import { useEffect, useState } from "react";
import { addStandardVideo, listStandardVideos, removeStandardVideo } from "./mine-standard-video-store";
import { timestamp } from "./mine-prevention-data";
import "./mine-standard-videos.css";

const limit = 100 * 1024 * 1024;
const fileTypes = { mp4: "video/mp4", webm: "video/webm" };

function VideoEntry({ onSave, onClose, busy, error }) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("file");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return setValidation("请输入视频名称。");
    if (source === "file") {
      const ext = file?.name.split(".").pop()?.toLowerCase();
      const mime = fileTypes[ext];
      if (!file || !mime || (file.type && file.type !== mime) || !file.size || file.size > limit) {
        return setValidation("请选择不超过 100 MB 的非空 MP4 或 WebM 文件。");
      }
      onSave({ name: name.trim(), format: ext.toUpperCase(), blob: file.slice(0, file.size, mime) });
      return;
    }
    let parsed;
    try { parsed = new URL(url.trim()); } catch { /* Report invalid URLs below. */ }
    if (parsed?.protocol !== "https:" || parsed.username || parsed.password) {
      return setValidation("请输入有效的 HTTPS 视频直链。");
    }
    onSave({ name: name.trim(), format: "视频链接", url: parsed.href });
  }

  return <form onSubmit={submit}>
    <div className="mp-dialog-body mp-form mp-video-form" onChange={() => setValidation("")}>
      <label className="mp-span"><span><em>*</em>视频名称</span><input required value={name} maxLength={80} onChange={(event) => setName(event.target.value)} /></label>
      <label className="mp-span"><span>视频来源</span><select value={source} onChange={(event) => setSource(event.target.value)}>
        <option value="file">本地文件</option><option value="url">视频直链</option>
      </select></label>
      {source === "file" ? <label className="mp-span"><span><em>*</em>视频文件</span>
        <input required type="file" accept=".mp4,.webm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        <small>支持 MP4 和 WebM，单个文件不超过 100 MB。</small>
      </label> : <label className="mp-span"><span><em>*</em>视频地址</span>
        <input required type="url" value={url} maxLength={2048} placeholder="https://…" onChange={(event) => setUrl(event.target.value)} />
        <small>请填写浏览器可以直接播放的视频地址，而不是视频网页地址。</small>
      </label>}
      {(validation || error) && <p className="mp-span mp-video-error" role="alert">{validation || error}</p>}
    </div>
    <footer><button type="button" disabled={busy} onClick={onClose}>取消</button><button type="submit" disabled={busy} className="mp-primary">{busy ? "正在保存…" : "保存"}</button></footer>
  </form>;
}

function VideoPreview({ record, onClose }) {
  const [blobUrl, setBlobUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!record.blob) return;
    const url = URL.createObjectURL(record.blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [record.blob]);
  const src = record.url || blobUrl;

  return <>
    <div className="mp-video-preview">
      {src && <video src={src} controls playsInline preload="metadata" aria-label={record.name} onError={() => setFailed(true)} />}
    </div>
    {failed && <p className="mp-video-preview-error" role="alert">无法播放，请检查视频链接是否可访问，或换用浏览器支持的视频编码。</p>}
    <footer><button type="button" onClick={onClose}>关闭</button></footer>
  </>;
}

export default function MineStandardVideos({ pageId, Dialog, onAction }) {
  const [rows, setRows] = useState(null);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    listStandardVideos(pageId).then((records) => {
      if (live) setRows(records.sort((a, b) => b.id - a.id));
    }).catch(() => { if (live) setError("无法读取本地视频资料，请检查浏览器存储设置。"); });
    return () => { live = false; };
  }, [pageId]);

  function open(next) { setError(""); setModal(next); }
  function close() { if (!busy) setModal(null); }
  async function save(record) {
    setBusy(true);
    setError("");
    try {
      const next = { ...record, pageId, uploaded: timestamp() };
      const id = await addStandardVideo(next);
      setRows((current) => [{ ...next, id }, ...current]);
      setModal(null);
      onAction("视频资料已添加");
    } catch {
      setError("保存失败，请检查浏览器存储空间后重试。");
    } finally { setBusy(false); }
  }
  async function remove(record) {
    setBusy(true);
    setError("");
    try {
      await removeStandardVideo(record.id);
      setRows((current) => current.filter((row) => row.id !== record.id));
      setModal(null);
      onAction("视频资料已删除");
    } catch {
      setError("删除失败，请重试。");
    } finally { setBusy(false); }
  }

  return <section className="mp-ledger mp-video-ledger" aria-label="视频资料">
    <header className="mp-table-toolbar"><div><h3>视频资料</h3>{rows && <span>共 {rows.length} 条</span>}</div>
      <button type="button" className="mp-primary" disabled={!rows} onClick={() => open({ kind: "add" })}>添加视频</button>
    </header>
    <div className="mp-table-scroll"><table className="mp-table">
      <thead><tr><th>视频名称</th><th>文件类型</th><th>添加时间</th><th>操作</th></tr></thead>
      <tbody>
        {rows?.map((row) => <tr key={row.id}><td className="mp-video-title">{row.name}</td>
          <td><span className="mp-file-type">{row.format}</span></td><td>{row.uploaded}</td><td>
            <div className="mp-actions"><button type="button" onClick={() => open({ kind: "view", row })}>查看</button>
              <button type="button" className="mp-danger-text" onClick={() => open({ kind: "remove", row })}>删除</button></div>
          </td></tr>)}
        {!rows?.length && <tr><td colSpan={4} className="mp-empty">{error && !rows ? error : rows ? "暂无视频资料" : "正在加载视频资料…"}</td></tr>}
      </tbody>
    </table></div>
    {modal?.kind === "add" && <Dialog title="添加视频" onClose={close}><VideoEntry onSave={save} onClose={close} busy={busy} error={error} /></Dialog>}
    {modal?.kind === "view" && <Dialog title={modal.row.name} onClose={close} wide><VideoPreview record={modal.row} onClose={close} /></Dialog>}
    {modal?.kind === "remove" && <Dialog title="删除视频资料" onClose={close}>
      <div className="mp-dialog-body">确定删除“{modal.row.name}”吗？这不会影响原始视频文件。{error && <p role="alert" className="mp-video-error">{error}</p>}</div>
      <footer><button type="button" disabled={busy} onClick={close}>取消</button><button type="button" className="mp-danger" disabled={busy} onClick={() => remove(modal.row)}>确认删除</button></footer>
    </Dialog>}
  </section>;
}
