import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MINE_APP_NAME, mineMenu, minePages, pageSpec, createMineData, LEVELS, AREAS, PEOPLE, timestamp, dateOffset, levelFor } from "./mine-prevention-data";
import "./mine-prevention.css";

const STORAGE = "mine-dual-prevention-v1";
const colors = ["#c84242", "#db8128", "#bd9718", "#2874b5"];
const labels = { name: "名称", area: "所属区域", profession: "专业分类", owner: "责任人", level: "风险等级", measure: "管控措施", due: "期限", riskId: "关联风险点", hazardId: "关联隐患", grade: "隐患等级", status: "状态", mineType: "矿山类型", scope: "适用范围", frequency: "检查频次" };
const initialId = minePages[0].id;
const iconNames = ["览", "档", "辨", "控", "查", "重", "警", "析", "设"];
const isLate = row => row.due < dateOffset(0) && !["已销号", "已完成"].includes(row.status);

function loadData() {
  const defaults = createMineData();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    if (saved && typeof saved === "object") {
      Object.keys(defaults).forEach(key => { if (Array.isArray(saved[key])) defaults[key] = saved[key]; });
    }
  } catch { /* Missing or invalid prototype storage falls back to sample records. */ }
  return defaults;
}

function downloadRows(rows, columns, title) {
  const cell = value => '"' + String(value ?? "").replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  const content = [columns.map(column => cell(column.label)).join(","), ...rows.map(row => columns.map(column => cell(row[column.key])).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `${title}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Badge({ value }) {
  const index = LEVELS.indexOf(value);
  const tone = index >= 0 ? colors[index] : /重大|退回|逾期/.test(value) ? colors[0] : /待/.test(value) ? "#aa6b20" : "#267769";
  return <span className="mp-badge" style={{ "--badge-color": tone }}>{value}</span>;
}

function Dialog({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    return () => previous?.focus?.();
  }, []);
  return createPortal(<div className="mp-overlay" onKeyDown={event => {
    if (event.key === "Escape") { event.stopPropagation(); onClose(); }
    if (event.key === "Tab") {
      const items = [...ref.current.querySelectorAll('button:not(:disabled), input, select, textarea, [tabindex="0"]')];
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}><section ref={ref} tabIndex={-1} className={`mp-dialog ${wide ? "mp-dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
    <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="关闭弹窗">×</button></header>{children}
  </section></div>, document.body);
}

function RiskMap({ risks, onSelect, large = false }) {
  const ref = useRef(null);
  const [level, setLevel] = useState("");
  const [full, setFull] = useState(false);
  useEffect(() => { const handle = () => setFull(document.fullscreenElement === ref.current); document.addEventListener("fullscreenchange", handle); return () => document.removeEventListener("fullscreenchange", handle); }, []);
  const polygons = ["34,48 268,32 296,160 230,230 40,207", "316,32 489,42 493,213 301,198", "509,42 711,66 735,211 515,208", "40,243 237,258 277,390 47,399", "298,236 497,250 473,401 303,394", "520,248 735,246 720,400 501,402"];
  const centers = [[151,128], [398,117], [614,131], [150,326], [390,325], [616,328]];
  return <section ref={ref} className={`mp-map ${large ? "mp-map-large" : ""}`}>
    <header className="mp-panel-head"><div><h3>矿区安全风险分布</h3><small>示意底图 · 按区域最高风险着色</small></div><button onClick={async () => { try { if (full) await document.exitFullscreen(); else await ref.current.requestFullscreen(); } catch { /* Browsers without full-screen retain the regular map view. */ } }}>{full ? "退出全屏" : "全屏展示"}</button></header>
    <div className="mp-map-key"><button className={!level ? "selected" : ""} onClick={() => setLevel("")}>全部点位</button>{LEVELS.map((name, i) => <button key={name} className={level === name ? "selected" : ""} onClick={() => setLevel(level === name ? "" : name)}><i style={{ background: colors[i] }} />{name}</button>)}</div>
    <svg viewBox="0 0 780 450" role="img" aria-label="矿区六个生产区域的风险分布示意图">
      <defs><pattern id="mp-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#dfe7ed" strokeWidth="0.7" /></pattern></defs>
      <rect width="780" height="450" fill="url(#mp-grid)" />
      <path d="M20 225 Q260 240 380 220 T760 230 M280 10 Q290 250 285 430 M500 10 L495 430" stroke="#cbd5de" strokeWidth="10" fill="none" />
      {AREAS.map((area, i) => {
        const rows = risks.filter(risk => risk.area === area);
        const highest = [...rows].sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level))[0];
        const matching = rows.filter(risk => !level || risk.level === level);
        const color = highest ? colors[LEVELS.indexOf(highest.level)] : "#8897a8";
        const [x, y] = centers[i];
        return <g key={area} opacity={level && !matching.length ? 0.25 : 1}>
          <polygon points={polygons[i]} fill={color} fillOpacity="0.13" stroke={color} strokeWidth="1.6" />
          <text x={x} y={y - 15} textAnchor="middle" fill="#26394a" fontSize="15" fontWeight="600">{area}</text>
          <text x={x} y={y + 9} textAnchor="middle" fill="#536576" fontSize="12">{rows.length} 个风险点</text>
          {matching.slice(0, 5).map((risk, j) => <g key={risk.id} role="button" tabIndex="0" aria-label={`查看${risk.name}`} className="mp-map-point" onClick={() => onSelect(risk)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(risk); } }}><title>{risk.name} · {risk.level}</title><circle cx={x - (matching.slice(0, 5).length - 1) * 13 + j * 26} cy={y + 36} r="9" fill={colors[LEVELS.indexOf(risk.level)]} stroke="white" strokeWidth="3" /></g>)}
        </g>;
      })}
      <text x="742" y="30" fontSize="12" fill="#607184">北 ↑</text><text x="30" y="435" fontSize="11" fill="#607184">示意图不代表实际矿山测绘位置</text>
    </svg>
  </section>;
}

function Distribution({ title, rows, field, options, onFilter }) {
  const values = options || [...new Set(rows.map(row => row[field]).filter(Boolean))];
  const max = Math.max(1, ...values.map(value => rows.filter(row => row[field] === value).length));
  return <section className="mp-panel"><h3>{title}</h3><div className="mp-bars">{values.map(value => {
    const count = rows.filter(row => row[field] === value).length;
    return <button key={value} onClick={() => onFilter?.(value)} disabled={!onFilter} aria-label={`${value} ${count}条`}><span>{value}</span><i><b style={{ width: `${count / max * 100}%`, background: colors[LEVELS.indexOf(value)] || "#377ba6" }} /></i><strong>{count}</strong></button>;
  })}{!values.length && <p className="mp-empty">暂无统计数据</p>}</div></section>;
}

export default function MinePrevention({ onAction, onSwitchApplication, AppSwitcher, Pagination }) {
  const [data, setData] = useState(loadData);
  const [selected, setSelected] = useState(initialId);
  const [expanded, setExpanded] = useState(["mine-overview"]);
  const [menuSearch, setMenuSearch] = useState("");
  const [query, setQuery] = useState({ keyword: "", area: "", status: "" });
  const [applied, setApplied] = useState(query);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [note, setNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const current = minePages.find(item => item.id === selected) || minePages[0];
  const spec = pageSpec(current);
  const rawRows = data[spec.collection] || [];
  const scoped = rawRows.filter(spec.filter || (() => true));
  const rows = scoped.filter(row => (!applied.keyword || `${row.id} ${row.name}`.toLowerCase().includes(applied.keyword.toLowerCase())) && (!applied.area || row.area === applied.area) && (!applied.status || (row.status === applied.status || row.level === applied.status)));
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));

  function commit(next, message) {
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); }
    catch { onAction("保存失败，浏览器存储空间不足，请导出台账后重试"); return false; }
    setData(next); if (message) onAction(message); return true;
  }
  function navigate(name, status = "") {
    const target = minePages.find(item => item.id === name || item.name === name);
    if (!target) return;
    setSelected(target.id); setExpanded(previous => [...new Set([...previous, `mine-${target.section}`])]);
    const filters = { keyword: "", area: "", status }; setQuery(filters); setApplied(filters); setPage(1);
  }
  function closeModal() {
    if (dirty && !window.confirm("当前内容尚未保存，确定放弃修改吗？")) return;
    setModal(null); setDirty(false);
  }
  function edit(kind, row, inspection) {
    const pageForKind = minePages.find(p => p.name === ({ risk: "风险点台账", hazard: "隐患上报", inspection: "排查任务台账" }[kind]));
    const editSpec = kind === "record" ? spec : pageSpec(pageForKind);
    const defaults = Object.fromEntries(editSpec.fields.map(f => [f.key, f.type === "select" ? f.options[0] : f.type === "date" ? dateOffset(3) : ""]));
    if (kind === "risk") { defaults.l = 3; defaults.s = 3; }
    if (kind === "hazard") defaults.riskId = data.risks[0]?.id || "";
    if (kind === "inspection") defaults.riskId = data.risks[0]?.id || "";
    if (inspection) Object.assign(defaults, { name: `${inspection.area}排查发现隐患`, riskId: inspection.riskId, owner: inspection.owner, area: inspection.area, measure: "" });
    setForm(row ? { ...row } : defaults); setDirty(false);
    setModal({ mode: "edit", kind, spec: editSpec, row, inspection });
  }
  function detail(kind, row) { setModal({ mode: "detail", kind, row }); setDirty(false); }
  function save(event) {
    event.preventDefault();
    const missing = modal.spec.fields.find(f => f.required && !String(form[f.key] ?? "").trim());
    if (missing) { onAction(`请填写${missing.label}`); return; }
    const kind = modal.kind, collection = modal.spec.collection;
    const id = modal.row?.id || `${{ risk: "FX", hazard: "YH", inspection: "PC", record: "JL" }[kind]}-${timestamp().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const record = { ...form, id, updated: timestamp(), status: modal.row?.status || ({ risk: "管控中", hazard: "待认定", inspection: "待执行", record: "有效" }[kind]), logs: [...(modal.row?.logs || []), { text: modal.row ? "修改记录" : "创建记录", time: timestamp(), person: "张宇" }] };
    if (kind === "risk") record.level = levelFor(record.l, record.s);
    const next = { ...data, [collection]: modal.row ? data[collection].map(item => item.id === id ? record : item) : [record, ...data[collection]] };
    if (modal.inspection) next.inspections = data.inspections.map(item => item.id === modal.inspection.id ? { ...item, status: "已完成", logs: [...item.logs, { text: `排查完成，发现隐患 ${id}`, time: timestamp(), person: "张宇" }] } : item);
    if (commit(next, "已保存")) { setModal(null); setDirty(false); }
  }
  function action(row, target, text, collection = "hazards") {
    setNote(""); setDirty(false); setModal({ mode: "action", row, target, text, collection });
  }
  function completeAction(event) {
    event.preventDefault();
    if (!note.trim()) { onAction("请填写处理意见或执行结果"); return; }
    const { row, target, text, collection } = modal;
    const next = { ...data, [collection]: data[collection].map(item => item.id === row.id ? { ...item, status: target, feedback: note.trim(), updated: timestamp(), logs: [...(item.logs || []), { text: `${text}：${note.trim()}`, time: timestamp(), person: "张宇" }] } : item) };
    if (commit(next, `${text}成功`)) { setModal(null); setDirty(false); }
  }
  function removeRow(row) { setModal({ mode: "delete", row, collection: spec.collection }); setDirty(false); }
  function confirmDelete() {
    const { row, collection } = modal;
    const linked = Object.values(data).some(items => items.some(item => item.riskId === row.id || item.hazardId === row.id));
    if (linked) { onAction("该记录已被其他业务引用，不能删除"); return; }
    if (commit({ ...data, [collection]: data[collection].filter(item => item.id !== row.id) }, "已删除")) setModal(null);
  }
  function display(row, key) {
    if (key === "riskId") return data.risks.find(risk => risk.id === row[key])?.name || "—";
    if (key === "hazardId") return data.hazards.find(hazard => hazard.id === row[key])?.name || "—";
    return row[key] || "—";
  }
  function exportList() {
    const columns = ["id", ...(spec.columns || [])].map(key => ({ key, label: key === "id" ? "编号" : labels[key] || key }));
    downloadRows(rows.map(row => Object.fromEntries(columns.map(c => [c.key, display(row, c.key)]))), columns, current.name);
  }
  const majorRisks = data.risks.filter(r => r.level === LEVELS[0]);
  const openHazards = data.hazards.filter(r => r.status !== "已销号");
  const warnings = current.name === "排查逾期预警" ? data.inspections.filter(isLate).map(row => ({ ...row, origin: "inspection" })) : current.name === "风险升级预警" ? majorRisks.map(row => ({ ...row, origin: "risk" })) : current.name === "管控措施未落实预警" ? data.risks.filter(row => row.due < dateOffset(0)).map(row => ({ ...row, origin: "risk" })) : openHazards.filter(row => isLate(row) && (current.name !== "验收逾期预警" || row.status === "待验收")).map(row => ({ ...row, origin: "hazard" }));
  const fieldsForModal = modal?.mode === "detail" ? modal.kind === "record" ? spec.fields : pageSpec(minePages.find(p => p.name === ({ risk: "风险点台账", hazard: "隐患总台账", inspection: "排查任务台账" }[modal.kind]))).fields : [];

  function rowActions(row) {
    if (spec.kind === "hazard") return <>{row.status === "待认定" && <button onClick={() => action(row, "待整改", "认定并派发")}>认定派发</button>}{["待整改", "退回整改"].includes(row.status) && <button onClick={() => action(row, "待验收", "提交整改反馈")}>整改反馈</button>}{row.status === "待验收" && <><button onClick={() => action(row, "已销号", "验收销号")}>验收</button><button className="mp-danger-text" onClick={() => action(row, "退回整改", "退回整改")}>退回</button></>}</>;
    if (spec.kind === "inspection" && row.status !== "已完成") return <><button onClick={() => action(row, "已完成", "排查完成", "inspections")}>正常完成</button><button onClick={() => edit("hazard", null, row)}>发现隐患</button></>;
    return null;
  }

  const summary = <div className="mp-summary">
    {[["风险点", data.risks.length, "风险点台账"], ["重大风险", majorRisks.length, "重大风险清单"], ["待整改隐患", openHazards.filter(row => ["待整改", "退回整改"].includes(row.status)).length, "整改任务"], ["待验收", data.hazards.filter(row => row.status === "待验收").length, "待复查验收"], ["逾期未闭环", openHazards.filter(isLate).length, "整改逾期预警"]].map(([title, count, target], i) => <button key={title} onClick={() => navigate(target)}><span>{title}</span><strong style={{ color: i === 1 || i === 4 ? "#bc4040" : undefined }}>{count}<small>项</small></strong></button>)}
  </div>;

  return <section className="mp-workspace">
    <aside className="mp-sidebar"><AppSwitcher currentName={MINE_APP_NAME} onSelect={onSwitchApplication} /><input className="mp-menu-search" aria-label="搜索子系统菜单" placeholder="搜索功能菜单" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} maxLength={50} />
      <nav aria-label="矿山双重预防导航">{mineMenu.map((section, index) => {
        const groups = section.children.map(group => ({ ...group, children: group.children.filter(leaf => !menuSearch || `${section.name}${group.name}${leaf.name}`.includes(menuSearch)) })).filter(group => group.children.length);
        if (!groups.length) return null;
        const open = expanded.includes(section.id) || !!menuSearch;
        return <div key={section.id} className="mp-nav-section"><button className={`mp-nav-heading ${current.section === structureKey(section.id) ? "current" : ""}`} aria-expanded={open} onClick={() => setExpanded(previous => open ? previous.filter(id => id !== section.id) : [...previous, section.id])}><i>{iconNames[index]}</i><b>{section.name}</b><span>{open ? "⌄" : "›"}</span></button>{open && <div className="mp-nav-group">{groups.flatMap(group => group.children).map(leaf => <button key={leaf.id} className={selected === leaf.id ? "active" : ""} aria-current={selected === leaf.id ? "page" : undefined} onClick={() => navigate(leaf.id)}>{leaf.name}</button>)}</div>}</div>;
      })}{!minePages.some(item => !menuSearch || `${mineMenu.find(s => s.id === `mine-${item.section}`).name}${item.group}${item.name}`.includes(menuSearch)) && <p className="mp-empty">未找到相关功能</p>}</nav>
    </aside>
    <main className="mp-main"><header className="mp-page-heading"><div><h1>{current.name}</h1><span>东区矿业公司 · {current.group}</span></div><span className="mp-prototype">演示数据 · 本地保存</span></header>
      {spec.kind === "overview" && <>{summary}<div className="mp-overview-grid"><RiskMap risks={data.risks} onSelect={row => detail("risk", row)} /><section className="mp-panel mp-priority"><div className="mp-panel-head"><h3>重点处置</h3><button onClick={() => navigate("隐患总台账")}>查看台账</button></div>{openHazards.map(row => <button key={row.id} className="mp-priority-row" onClick={() => detail("hazard", row)}><span><Badge value={row.grade} />{isLate(row) && <em>已逾期</em>}</span><b>{row.name}</b><small>{row.area} · {row.owner} · {row.due}</small></button>)}{!openHazards.length && <p className="mp-empty">所有隐患已闭环</p>}</section></div><div className="mp-two-columns"><Distribution title="风险等级分布" rows={data.risks} field="level" options={LEVELS} onFilter={value => navigate("风险分级清单", value)} /><Distribution title="隐患治理进度" rows={data.hazards} field="status" options={["待认定", "待整改", "待验收", "退回整改", "已销号"]} onFilter={value => navigate("隐患总台账", value)} /></div></>}
      {spec.kind === "map" && <><RiskMap risks={data.risks} onSelect={row => detail("risk", row)} large /><section className="mp-panel"><h3>风险点位清单</h3><div className="mp-point-list">{data.risks.map(row => <button key={row.id} onClick={() => detail("risk", row)}><Badge value={row.level} /><span>{row.name}</span><small>{row.area} · {row.owner}</small></button>)}</div></section></>}
      {spec.kind === "analysis" && <>{summary}<div className="mp-two-columns"><Distribution title={current.group === "风险分析" ? current.name : "风险专业分布"} rows={data.risks} field={current.name === "风险等级分布" ? "level" : "profession"} /><Distribution title="隐患闭环情况" rows={data.hazards} field="status" options={["待认定", "待整改", "待验收", "退回整改", "已销号"]} /></div><section className="mp-panel"><div className="mp-panel-head"><div><h3>{current.name}明细</h3><small>根据当前台账实时汇总；趋势需积累历史快照</small></div><button onClick={() => downloadRows(AREAS.map(area => ({ area, risk: data.risks.filter(r => r.area === area).length, hazard: data.hazards.filter(r => r.area === area).length, closed: data.hazards.filter(r => r.area === area && r.status === "已销号").length, done: data.inspections.filter(r => r.area === area && r.status === "已完成").length })), [{ key: "area", label: "区域" }, { key: "risk", label: "风险点" }, { key: "hazard", label: "隐患数" }, { key: "closed", label: "已销号" }, { key: "done", label: "已完成排查" }], current.name)}>导出报表</button></div><table className="mp-table"><thead><tr><th>区域</th><th>风险点</th><th>隐患数</th><th>已销号</th><th>已完成排查</th></tr></thead><tbody>{AREAS.map(area => <tr key={area}><td>{area}</td><td>{data.risks.filter(r => r.area === area).length}</td><td>{data.hazards.filter(r => r.area === area).length}</td><td>{data.hazards.filter(r => r.area === area && r.status === "已销号").length}</td><td>{data.inspections.filter(r => r.area === area && r.status === "已完成").length}</td></tr>)}</tbody></table></section></>}
      {spec.kind === "warning" && <section className="mp-panel"><div className="mp-panel-head"><h3>当前待处理 {warnings.length} 项</h3><small>按台账风险等级及任务期限生成</small></div><table className="mp-table"><thead><tr><th>编号</th><th>事项</th><th>区域</th><th>责任人</th><th>期限</th><th>操作</th></tr></thead><tbody>{warnings.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.name}</td><td>{row.area}</td><td>{row.owner}</td><td>{row.due}</td><td><button className="mp-link" onClick={() => { navigate(row.origin === "risk" ? "风险点台账" : row.origin === "inspection" ? "排查任务台账" : "隐患总台账"); detail(row.origin, row); }}>去处理</button></td></tr>)}{!warnings.length && <tr><td colSpan="6" className="mp-empty">暂无待处理预警</td></tr>}</tbody></table></section>}
      {spec.collection && <section className="mp-ledger"><form className="mp-filters" onSubmit={event => { event.preventDefault(); setApplied({ ...query }); setPage(1); }}><label>编号 / 名称<input value={query.keyword} onChange={e => setQuery({ ...query, keyword: e.target.value })} maxLength={100} placeholder="输入关键词" /></label><label>所属区域<select value={query.area} onChange={e => setQuery({ ...query, area: e.target.value })}><option value="">全部区域</option>{AREAS.map(area => <option key={area}>{area}</option>)}</select></label><label>{spec.kind === "risk" ? "风险等级" : "状态"}<select value={query.status} onChange={e => setQuery({ ...query, status: e.target.value })}><option value="">全部</option>{(spec.kind === "risk" ? LEVELS : [...new Set(scoped.map(r => r.status))]).map(status => <option key={status}>{status}</option>)}</select></label><button className="mp-primary" type="submit">搜索</button><button type="button" onClick={() => { const empty = { keyword: "", area: "", status: "" }; setQuery(empty); setApplied(empty); setPage(1); }}>重置</button></form>
        <div className="mp-table-toolbar"><span>共 {rows.length} 条记录</span><div><button className="mp-primary" onClick={() => edit(spec.kind)}>新增</button><button onClick={exportList}>导出</button></div></div>
        <div className="mp-table-scroll"><table className="mp-table"><thead><tr><th>编号</th>{spec.columns.map(key => <th key={key}>{spec.fields.find(f => f.key === key)?.label || labels[key]}</th>)}<th className="mp-sticky">操作</th></tr></thead><tbody>{rows.slice((currentPage - 1) * size, currentPage * size).map(row => <tr key={row.id}><td><button className="mp-link" onClick={() => detail(spec.kind, row)}>{row.id}</button></td>{spec.columns.map(key => <td key={key}>{["status", "level", "grade"].includes(key) ? <Badge value={row[key]} /> : <span className={key === "measure" ? "mp-truncate" : ""} title={display(row, key)}>{display(row, key)}</span>}{key === "due" && isLate(row) && <small className="mp-late">逾期</small>}</td>)}<td className="mp-sticky"><div className="mp-actions"><button onClick={() => detail(spec.kind, row)}>查看</button>{rowActions(row)}{!["已销号", "已完成"].includes(row.status) && <button onClick={() => edit(spec.kind, row)}>编辑</button>}{spec.kind !== "hazard" && spec.kind !== "inspection" && <button className="mp-danger-text" onClick={() => removeRow(row)}>删除</button>}</div></td></tr>)}{!rows.length && <tr><td colSpan={spec.columns.length + 2} className="mp-empty">暂无符合条件的记录</td></tr>}</tbody></table></div>
        <Pagination total={rows.length} page={currentPage} pageSize={size} onPageChange={setPage} onPageSizeChange={value => { setSize(value); setPage(1); }} />
      </section>}
    </main>
    {modal?.mode === "edit" && <Dialog title={`${modal.row ? "编辑" : "新增"}${{ risk: "风险点", hazard: "隐患", inspection: "排查任务", record: current.name }[modal.kind]}`} onClose={closeModal} wide><form onSubmit={save}><div className="mp-dialog-body mp-form">{modal.spec.fields.map(f => <label key={f.key} className={f.type === "textarea" ? "mp-span" : ""}><span>{f.required && <em>*</em>}{f.label}</span>{["select", "risk", "hazard"].includes(f.type) ? <select required={f.required} value={form[f.key] || ""} onChange={event => { setForm({ ...form, [f.key]: event.target.value }); setDirty(true); }}><option value="">请选择</option>{f.type === "select" ? f.options.map(option => <option key={option}>{option}</option>) : data[f.type === "risk" ? "risks" : "hazards"].map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select> : f.type === "textarea" ? <textarea required={f.required} maxLength={1000} rows="3" value={form[f.key] || ""} onChange={event => { setForm({ ...form, [f.key]: event.target.value }); setDirty(true); }} /> : <input required={f.required} type={f.type} maxLength={100} value={form[f.key] || ""} onChange={event => { setForm({ ...form, [f.key]: event.target.value }); setDirty(true); }} />}</label>)}{modal.kind === "risk" && <div className="mp-span mp-assessment">风险值 R = L × S：<b>{Number(form.l) * Number(form.s)}</b><Badge value={levelFor(form.l, form.s)} /><small>演示矩阵：20–25 重大，12–19 较大，6–11 一般，1–5 低风险。正式使用需校准本矿规则。</small></div>}</div><footer><button type="button" onClick={closeModal}>取消</button><button className="mp-primary" type="submit">保存</button></footer></form></Dialog>}
    {modal?.mode === "detail" && <Dialog title={modal.row.name} onClose={closeModal} wide><div className="mp-dialog-body"><div className="mp-detail-meta"><span>{modal.row.id}</span><Badge value={modal.row.level || modal.row.status} /></div><dl className="mp-details">{fieldsForModal.map(f => <div key={f.key} className={f.type === "textarea" ? "mp-span" : ""}><dt>{f.label}</dt><dd>{display(modal.row, f.key)}</dd></div>)}</dl>{modal.row.feedback && <section className="mp-detail-note"><h3>最近处理反馈</h3><p>{modal.row.feedback}</p></section>}{modal.kind === "risk" && <section className="mp-detail-note"><h3>关联隐患</h3>{data.hazards.filter(h => h.riskId === modal.row.id).map(h => <button className="mp-related" key={h.id} onClick={() => detail("hazard", h)}>{h.name}<Badge value={h.status} /></button>)}{!data.hazards.some(h => h.riskId === modal.row.id) && <p>暂无关联隐患</p>}</section>}<h3>流转记录</h3><ol className="mp-timeline">{(modal.row.logs || []).map((log, i) => <li key={i}><b>{log.text}</b><small>{log.time} · {log.person}</small></li>)}</ol></div><footer><button onClick={closeModal}>关闭</button>{modal.kind === "hazard" && modal.row.status === "待认定" && <button className="mp-primary" onClick={() => action(modal.row, "待整改", "认定并派发")}>认定并派发</button>}{modal.kind === "hazard" && ["待整改", "退回整改"].includes(modal.row.status) && <button className="mp-primary" onClick={() => action(modal.row, "待验收", "提交整改反馈")}>整改反馈</button>}{modal.kind === "hazard" && modal.row.status === "待验收" && <><button onClick={() => action(modal.row, "退回整改", "退回整改")}>退回整改</button><button className="mp-primary" onClick={() => action(modal.row, "已销号", "验收销号")}>验收销号</button></>}</footer></Dialog>}
    {modal?.mode === "action" && <Dialog title={modal.text} onClose={closeModal}><form onSubmit={completeAction}><div className="mp-dialog-body"><p>{modal.row.name}</p><label className="mp-note-label">处理意见 / 执行结果 <em>*</em><textarea required maxLength={1000} rows="5" value={note} onChange={event => { setNote(event.target.value); setDirty(true); }} placeholder="请填写现场情况、处理结果及相关依据" /></label><p className="mp-muted">提交后状态变为“{modal.target}”，并记录本次操作。</p></div><footer><button type="button" onClick={closeModal}>取消</button><button className="mp-primary" type="submit">确认提交</button></footer></form></Dialog>}
    {modal?.mode === "delete" && <Dialog title="删除确认" onClose={closeModal}><div className="mp-dialog-body">确定删除“{modal.row.name}”吗？删除后无法恢复。</div><footer><button onClick={closeModal}>取消</button><button className="mp-danger" onClick={confirmDelete}>确认删除</button></footer></Dialog>}
  </section>;
}

function structureKey(id) { return id.replace("mine-", ""); }
