import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PermitQualifications from "./PermitQualifications";
import {
  WORK_PERMIT_APP_NAME,
  createWorkPermitData,
  permitTypes,
  statusMeta,
  workAreas,
  workPermitMenu,
} from "./work-permit-data";
import "./work-permit.css";

const STORAGE_KEY = "work-permit-management-v1";
const CURRENT_USER = "张宇";

const getType = (id) => permitTypes.find((item) => item.id === id) || permitTypes[0];
const formatStatus = (status) => statusMeta[status] || { tone: "draft", label: status };
const nowText = () => "2026-11-12 16:20";

function Dialog({ title, children, onClose, wide = false, full = false }) {
  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="wp-dialog-mask" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`wp-dialog ${wide ? "wp-dialog-wide" : ""} ${full ? "wp-dialog-full" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="wp-dialog-head"><h3>{title}</h3><button className="wp-icon-button" onClick={onClose} aria-label="关闭">x</button></header>
        <div className="wp-dialog-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

function Status({ value }) {
  const meta = formatStatus(value);
  return <span className={`wp-status wp-status-${meta.tone}`}><i />{meta.label}</span>;
}

function SectionTitle({ kicker, title, action }) {
  return <div className="wp-section-title"><div>{kicker && <span>{kicker}</span>}<h2>{title}</h2></div>{action}</div>;
}

function PermitTable({ permits, actions = [], empty = "暂无符合条件的作业票" }) {
  if (!permits.length) return <div className="wp-empty">{empty}</div>;
  return <div className="wp-table-wrap"><table className="wp-table"><thead><tr><th>作业票编号</th><th>作业名称</th><th>作业类型</th><th>作业区域</th><th>计划作业时间</th><th>负责人</th><th>状态</th><th className="wp-table-action">操作</th></tr></thead><tbody>{permits.map((permit) => {
    const type = getType(permit.type);
    return <tr key={permit.id}><td className="wp-code">{permit.id}</td><td><strong>{permit.title}</strong><small>{permit.location}</small></td><td><span className="wp-type-mini" style={{ "--ticket-color": type.color }}>{type.mark}</span>{type.name}</td><td>{permit.area}</td><td><span>{permit.start}</span><small>至 {permit.end}</small></td><td>{permit.lead}</td><td><Status value={permit.status} /></td><td className="wp-table-action">{actions.map((action) => <button key={action.label} className={`wp-text-button ${action.tone || ""}`} onClick={() => action.onClick(permit)} disabled={action.disabled?.(permit)}>{action.label}</button>)}</td></tr>;
  })}</tbody></table></div>;
}

function WorkPermit({ onAction, onSwitchApplication, AppSwitcher, Pagination, onSubmitApproval }) {
  const [permits, setPermits] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || createWorkPermitData(); } catch { return createWorkPermitData(); }
  });
  const [active, setActive] = useState("wp-safety-overview");
  const [expanded, setExpanded] = useState(["wp-overview"]);
  const [dialog, setDialog] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("全部");
  const [page, setPage] = useState(1);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(permits)), [permits]);
  const updatePermit = (id, patch, event) => setPermits((items) => items.map((item) => item.id === id ? { ...item, ...patch, updated: nowText(), logs: event ? [...(item.logs || []), event] : item.logs } : item));
  const isApplicationTab = ["wp-create", "wp-mine", "wp-drafts"].includes(active);
  const pageName = useMemo(() => isApplicationTab ? "作业申请" : workPermitMenu.flatMap((group) => group.children).find((item) => item.id === active)?.name || "作业安全总览", [active, isApplicationTab]);
  const currentPermits = permits.filter((permit) => (keyword ? `${permit.id}${permit.title}${permit.area}${permit.lead}`.includes(keyword) : true) && (filterStatus === "全部" || permit.status === filterStatus));

  const selectPage = (id) => { setActive(id); setKeyword(""); setFilterStatus("全部"); setPage(1); };
  const toggleGroup = (id) => setExpanded((items) => items.includes(id) ? items.filter((item) => item !== id) : [id]);
  const openPermit = (permit, mode = "view") => setDialog({ kind: "detail", permit, mode });
  const startPermit = (permit) => setDialog({ kind: "start", permit, checks: { people: false, disclosure: false, measure: false, test: permit.type !== "space" } });
  const acceptPermit = (permit) => setDialog({ kind: "accept", permit, result: "验收合格", note: "" });
  const pausePermit = (permit) => setDialog({ kind: "pause", permit, reason: "" });

  const addPermit = (draft, submit) => {
    const required = [draft.title, draft.area, draft.location, draft.start, draft.end, draft.lead, draft.guardian];
    if (required.some((item) => !item)) { onAction?.("请补全带星号的作业票信息"); return; }
    const type = getType(draft.type);
    const id = `ZY-20261112-${String(permits.length + 8).padStart(4, "0")}`;
    const next = {
      id, title: draft.title, type: draft.type, area: draft.area, location: draft.location, requester: CURRENT_USER, lead: draft.lead, guardian: draft.guardian, approver: "陈伟", cc: [], workers: [draft.lead], start: draft.start, end: draft.end,
      status: submit ? "审批中" : "草稿", applyAt: nowText(), updated: nowText(), hazards: draft.hazards || type.description.split("、"), measures: draft.measures || ["完成作业前安全交底", "设置现场监护人"], gasTest: "待开工检测", attachments: [], logs: [ { at: nowText(), actor: CURRENT_USER, action: submit ? "提交审批" : "保存草稿", note: draft.title } ],
    };
    setPermits((items) => [next, ...items]);
    if (submit) onSubmitApproval?.(next);
    setDialog(null); setActive(submit ? "wp-mine" : "wp-drafts"); onAction?.(submit ? "作业票已提交审批，并已推送审批提醒" : "已存入草稿箱");
  };

  const filteredBy = (predicate) => currentPermits.filter(predicate);
  const renderContent = () => {
    if (active === "wp-safety-overview") return <Overview permits={permits} onNavigate={selectPage} onOpen={openPermit} />;
    if (active === "wp-distribution") return <Distribution permits={permits} onOpen={openPermit} />;
    if (isApplicationTab) return <ApplicationWorkspace activeTab={active} permits={permits} onTabChange={selectPage} onSave={addPermit} onOpen={openPermit} onEdit={(permit) => setDialog({ kind: "edit", permit })} onWithdraw={(permit) => { updatePermit(permit.id, { status: "已撤回" }, { at: nowText(), actor: CURRENT_USER, action: "撤回申请" }); onAction?.("作业票已撤回"); }} />;
    if (active === "wp-pending") return <TicketList title="待我审批" kicker="审批中心" permits={filteredBy((item) => item.approver === CURRENT_USER && item.status === "审批中")} onOpen={openPermit} actionLabel="审批" onAction={(permit) => setDialog({ kind: "review", permit, opinion: "" })} />;
    if (active === "wp-approved") return <TicketList title="已审批" kicker="审批中心" permits={filteredBy((item) => item.approver === CURRENT_USER && ["待开工", "作业中", "待验收", "已关闭", "已暂停"].includes(item.status))} onOpen={openPermit} />;
    if (active === "wp-cc") return <TicketList title="抄送我的" kicker="审批中心" permits={filteredBy((item) => item.cc?.includes(CURRENT_USER))} onOpen={openPermit} />;
    if (active === "wp-start") return <TicketList title="待开工确认" permits={filteredBy((item) => item.status === "待开工")} onOpen={openPermit} actionLabel="核查开工" onAction={startPermit} />;
    if (active === "wp-work") return <TicketList title="作业执行" permits={filteredBy((item) => item.status === "作业中" && (item.lead === CURRENT_USER || item.workers?.includes(CURRENT_USER)))} onOpen={openPermit} actionLabel="申请完工" onAction={(permit) => { updatePermit(permit.id, { status: "待验收" }, { at: nowText(), actor: CURRENT_USER, action: "申请完工", note: "作业完成，等待验收" }); onAction?.("已提交完工验收"); }} />;
    if (active === "wp-guardian") return <Guardian permits={filteredBy((item) => item.guardian === CURRENT_USER && ["待开工", "作业中", "已暂停"].includes(item.status))} onRecord={(permit) => { updatePermit(permit.id, {}, { at: nowText(), actor: CURRENT_USER, action: "监护巡检", note: "现场核查无异常" }); onAction?.("已记录本次监护巡检"); }} onOpen={openPermit} />;
    if (active === "wp-change") return <ChangeControl permits={filteredBy((item) => ["待开工", "作业中", "已暂停"].includes(item.status))} onOpen={openPermit} onChange={(permit) => setDialog({ kind: "change", permit, note: "" })} onPause={pausePermit} onResume={(permit) => { updatePermit(permit.id, { status: "作业中", suspendedReason: "" }, { at: nowText(), actor: CURRENT_USER, action: "恢复作业", note: "复查确认现场具备恢复条件" }); onAction?.("作业已恢复"); }} />;
    if (active === "wp-acceptance") return <TicketList title="待验收作业" permits={filteredBy((item) => item.status === "待验收")} onOpen={openPermit} actionLabel="验收" onAction={acceptPermit} />;
    if (active === "wp-acceptance-log") return <TicketList title="验收记录" permits={filteredBy((item) => item.status === "已关闭")} onOpen={openPermit} />;
    if (active === "wp-ledger-all") return <TicketList title="全部作业票" kicker="作业台账" permits={currentPermits} onOpen={openPermit} />;
    if (active === "wp-ledger-closed") return <TicketList title="已关闭作业票" kicker="作业台账" permits={filteredBy((item) => item.status === "已关闭")} onOpen={openPermit} />;
    if (active === "wp-alerts") return <Alerts permits={permits} onOpen={openPermit} onNavigate={selectPage} />;
    if (active === "wp-exceptions") return <Exceptions permits={permits.filter((item) => item.status === "已暂停" || item.status === "已终止")} onOpen={openPermit} onNavigate={selectPage} />;
    if (["wp-statistics", "wp-duty", "wp-abnormal"].includes(active)) return <Analysis permits={permits} mode={active} />;
    if (active === "wp-qualification") return <PermitQualifications Dialog={Dialog} Pagination={Pagination} onAction={onAction} />;
    return <Configuration active={active} />;
  };

  return <div className="wp-app">
    <aside className="wp-sidebar">
      <AppSwitcher currentName={WORK_PERMIT_APP_NAME} onSelect={onSwitchApplication} />
      <nav className="wp-nav">{workPermitMenu.map((group) => {
        const direct = group.children.length === 1;
        const groupActive = group.children.some((item) => item.id === active) || (group.id === "wp-apply" && isApplicationTab);
        return <div className="wp-nav-group" key={group.id}><button className={`wp-nav-parent ${expanded.includes(group.id) ? "is-open" : ""} ${groupActive ? "is-active" : ""}`} onClick={() => direct ? selectPage(group.children[0].id) : toggleGroup(group.id)}><span>{group.name}</span>{!direct && <i>⌄</i>}</button>{!direct && expanded.includes(group.id) && <div className="wp-nav-children">{group.children.map((item) => <button className={active === item.id ? "is-active" : ""} key={item.id} onClick={() => selectPage(item.id)}>{item.name}</button>)}</div>}</div>;
      })}</nav>
    </aside>
    <main className="wp-main">
      <header className="wp-topbar"><div><span>{WORK_PERMIT_APP_NAME}</span><i>/</i><strong>{pageName}</strong></div></header>
      {!["wp-safety-overview", "wp-distribution", "wp-create", "wp-mine", "wp-drafts", "wp-statistics", "wp-duty", "wp-abnormal", "wp-qualification"].includes(active) && <FilterBar keyword={keyword} setKeyword={setKeyword} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />}
      <div className="wp-content">{renderContent()}</div>
    </main>
    {dialog?.kind === "detail" && <PermitDetail permit={dialog.permit} onClose={() => setDialog(null)} />}
    {dialog?.kind === "edit" && <CreatePermit initial={dialog.permit} onSave={(draft, submit) => { const updatedPermit = { ...dialog.permit, ...draft, hazards: Array.isArray(draft.hazards) ? draft.hazards : String(draft.hazards).split("、").filter(Boolean), measures: Array.isArray(draft.measures) ? draft.measures : String(draft.measures).split("、").filter(Boolean), status: submit ? "审批中" : "草稿", applyAt: submit ? nowText() : dialog.permit.applyAt }; updatePermit(dialog.permit.id, updatedPermit, { at: nowText(), actor: CURRENT_USER, action: submit ? "提交审批" : "保存草稿" }); if (submit) onSubmitApproval?.(updatedPermit); setDialog(null); if (submit) setActive("wp-mine"); onAction?.(submit ? "作业票已提交审批，并已推送审批提醒" : "草稿已保存"); }} dialog onClose={() => setDialog(null)} />}
    {dialog?.kind === "review" && <ReviewDialog permit={dialog.permit} onClose={() => setDialog(null)} onConfirm={(approved, opinion) => { updatePermit(dialog.permit.id, { status: approved ? "待开工" : "已驳回", rejectionReason: approved ? "" : opinion }, { at: nowText(), actor: CURRENT_USER, action: approved ? "审批通过" : "驳回申请", note: opinion }); setDialog(null); onAction?.(approved ? "已同意该作业申请" : "已驳回该作业申请"); }} />}
    {dialog?.kind === "start" && <StartDialog state={dialog} setState={setDialog} onClose={() => setDialog(null)} onConfirm={() => { updatePermit(dialog.permit.id, { status: "作业中", actualStart: nowText() }, { at: nowText(), actor: CURRENT_USER, action: "确认开工", note: "现场条件核查合格" }); setDialog(null); onAction?.("开工确认完成，作业已进入执行中"); }} />}
    {dialog?.kind === "accept" && <AcceptDialog state={dialog} setState={setDialog} onClose={() => setDialog(null)} onConfirm={(passed, note) => { updatePermit(dialog.permit.id, { status: passed ? "已关闭" : "作业中", actualEnd: passed ? nowText() : undefined }, { at: nowText(), actor: CURRENT_USER, action: passed ? "验收关闭" : "验收退回", note }); setDialog(null); onAction?.(passed ? "作业票已验收关闭" : "已退回现场处理"); }} />}
    {dialog?.kind === "pause" && <PauseDialog state={dialog} setState={setDialog} onClose={() => setDialog(null)} onConfirm={() => { if (!dialog.reason.trim()) return onAction?.("请填写暂停原因"); updatePermit(dialog.permit.id, { status: "已暂停", suspendedReason: dialog.reason }, { at: nowText(), actor: CURRENT_USER, action: "暂停作业", note: dialog.reason }); setDialog(null); onAction?.("作业已暂停，已生成异常记录"); }} />}
    {dialog?.kind === "change" && <ChangeDialog state={dialog} setState={setDialog} onClose={() => setDialog(null)} onConfirm={() => { if (!dialog.note.trim()) return onAction?.("请填写变更内容"); updatePermit(dialog.permit.id, { changeStatus: "待审批" }, { at: nowText(), actor: CURRENT_USER, action: "提交作业变更", note: dialog.note }); setDialog(null); onAction?.("变更申请已提交复核"); }} />}
  </div>;
}

function FilterBar({ keyword, setKeyword, filterStatus, setFilterStatus }) {
  return <div className="wp-filter"><input value={keyword} maxLength={50} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索编号、作业名称、区域或负责人" /><select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}><option>全部</option>{Object.keys(statusMeta).map((item) => <option key={item}>{item}</option>)}</select><button className="wp-button wp-button-ghost" onClick={() => { setKeyword(""); setFilterStatus("全部"); }}>重置</button></div>;
}

function Overview({ permits, onNavigate, onOpen }) {
  const stats = [
    ["待开工", permits.filter((item) => item.status === "待开工").length, "ready", "开工前须完成现场条件核查", "wp-start"],
    ["作业中", permits.filter((item) => item.status === "作业中").length, "working", "监护、巡检与异常处置正在进行", "wp-work"],
    ["待验收", permits.filter((item) => item.status === "待验收").length, "accept", "已完工，等待验收并关闭许可", "wp-acceptance"],
    ["异常预警", permits.filter((item) => item.status === "已暂停" || item.status === "已终止").length, "danger", "存在需要立即处置的作业异常", "wp-alerts"],
  ];
  const today = permits.filter((item) => ["待开工", "作业中", "待验收", "已暂停"].includes(item.status));
  return <>
    <section className="wp-hero"><div><span>当日作业许可</span><h2>现场作业许可情况</h2><p>覆盖申请、审批、开工确认、作业监护和完工验收，当前共有 {today.length} 项作业需要跟进。</p></div><div className="wp-hero-stamp"><b>{permits.filter((item) => item.status === "作业中").length}</b><span>项正在作业</span></div></section>
    <div className="wp-kpis">{stats.map(([label, value, tone, hint, target]) => <button key={label} className={`wp-kpi wp-kpi-${tone}`} onClick={() => onNavigate(target)}><span>{label}</span><strong>{value}</strong><small>{hint}</small><i>查看</i></button>)}</div>
    <div className="wp-two-col"><section className="wp-panel"><SectionTitle title="今日重点作业" action={<button className="wp-text-button" onClick={() => onNavigate("wp-create")}>发起作业票</button>} /><div className="wp-activity-list">{today.map((permit) => { const type = getType(permit.type); return <button key={permit.id} className="wp-activity" onClick={() => onOpen(permit)}><span className="wp-type-badge" style={{ backgroundColor: type.color }}>{type.mark}</span><span><strong>{permit.title}</strong><small>{permit.area} · {permit.start} - {permit.end.slice(11)}</small></span><Status value={permit.status} /></button>; })}</div></section>
      <section className="wp-panel wp-risk-panel"><SectionTitle title="作业许可关注事项" /><div className="wp-control-grid"><div><b>开工前</b><span>核查条件</span><small>人员、措施和作业环境确认</small></div><div><b>作业中</b><span>现场监护</span><small>记录巡检，及时处置异常</small></div><div><b>完工后</b><span>验收关闭</span><small>确认现场恢复并归档</small></div></div><div className="wp-alert-line"><i />爆破作业已暂停，等待现场复测后恢复</div></section></div>
  </>;
}

function Distribution({ permits, onOpen }) {
  const active = permits.filter((item) => ["待开工", "作业中", "待验收", "已暂停"].includes(item.status));
  return <div className="wp-distribution"><section className="wp-panel"><SectionTitle kicker="SITE VIEW" title="作业区域分布" /><div className="wp-site-grid">{workAreas.map((area) => { const inArea = active.filter((item) => item.area === area); return <div className={`wp-site ${inArea.length ? "has-ticket" : ""}`} key={area}><span>{area}</span><b>{inArea.length ? `${inArea.length} 项作业` : "无作业"}</b>{inArea.map((permit) => <button onClick={() => onOpen(permit)} key={permit.id}><Status value={permit.status} />{getType(permit.type).name}</button>)}</div>; })}</div></section>
    <section className="wp-panel"><SectionTitle kicker="TIME LINE" title="今日许可时间轴" /><div className="wp-time-rail">{active.map((permit, index) => <button key={permit.id} onClick={() => onOpen(permit)} style={{ "--rail-left": `${7 + index * 16}%`, "--rail-width": `${16 + (index % 2) * 6}%` }}><span>{permit.start.slice(11)} - {permit.end.slice(11)}</span><b>{permit.title}</b><Status value={permit.status} /></button>)}</div><div className="wp-hours"><span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span></div></section></div>;
}

function CreatePermit({ onSave, initial, dialog, onClose, embedded = false }) {
  const [draft, setDraft] = useState(() => ({ type: initial?.type || "hot", title: initial?.title || "", area: initial?.area || "", location: initial?.location || "", start: initial?.start || "2026-11-13 08:00", end: initial?.end || "2026-11-13 16:00", lead: initial?.lead || "", guardian: initial?.guardian || "", hazards: initial?.hazards || [], measures: initial?.measures || [] }));
  const content = <div className="wp-create"><div className="wp-form-grid"><label><span>作业票类型 <i>*</i></span><select value={draft.type} onChange={(event) => setDraft((item) => ({ ...item, type: event.target.value }))}>{permitTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label><span>作业名称 <i>*</i></span><input maxLength={40} value={draft.title} onChange={(event) => setDraft((item) => ({ ...item, title: event.target.value }))} placeholder="例如：主井绞车房检修动火作业" /></label><label><span>作业区域 <i>*</i></span><select value={draft.area} onChange={(event) => setDraft((item) => ({ ...item, area: event.target.value }))}><option value="">请选择作业区域</option>{workAreas.map((area) => <option key={area}>{area}</option>)}</select></label><label><span>具体位置 <i>*</i></span><input maxLength={30} value={draft.location} onChange={(event) => setDraft((item) => ({ ...item, location: event.target.value }))} placeholder="请输入作业位置" /></label><label><span>计划开始时间 <i>*</i></span><input value={draft.start} onChange={(event) => setDraft((item) => ({ ...item, start: event.target.value }))} /></label><label><span>计划结束时间 <i>*</i></span><input value={draft.end} onChange={(event) => setDraft((item) => ({ ...item, end: event.target.value }))} /></label><label><span>作业负责人 <i>*</i></span><input maxLength={10} value={draft.lead} onChange={(event) => setDraft((item) => ({ ...item, lead: event.target.value }))} placeholder="请输入负责人" /></label><label><span>现场监护人 <i>*</i></span><input maxLength={10} value={draft.guardian} onChange={(event) => setDraft((item) => ({ ...item, guardian: event.target.value }))} placeholder="请输入监护人" /></label><label className="wp-span-2"><span>风险辨识</span><textarea maxLength={150} value={Array.isArray(draft.hazards) ? draft.hazards.join("、") : draft.hazards} onChange={(event) => setDraft((item) => ({ ...item, hazards: event.target.value }))} placeholder="填写主要危险有害因素，多个内容用顿号分隔" /></label><label className="wp-span-2"><span>安全措施</span><textarea maxLength={150} value={Array.isArray(draft.measures) ? draft.measures.join("、") : draft.measures} onChange={(event) => setDraft((item) => ({ ...item, measures: event.target.value }))} placeholder="填写作业前应落实的安全措施" /></label></div><div className="wp-create-footer"><span>提交后将进入审批环节，开工前仍需现场核查。</span><div><button className="wp-button wp-button-ghost" onClick={() => onSave({ ...draft, hazards: String(draft.hazards).split("、").filter(Boolean), measures: String(draft.measures).split("、").filter(Boolean) }, false)}>存草稿</button><button className="wp-button" onClick={() => onSave({ ...draft, hazards: String(draft.hazards).split("、").filter(Boolean), measures: String(draft.measures).split("、").filter(Boolean) }, true)}>提交审批</button></div></div></div>;
  if (dialog) return <Dialog title="编辑作业票" wide onClose={onClose}>{content}</Dialog>;
  if (embedded) return content;
  return <section className="wp-panel wp-create-panel"><SectionTitle title="发起作业票" />{content}</section>;
}

function ApplicationWorkspace({ activeTab, permits, onTabChange, onSave, onOpen, onEdit, onWithdraw }) {
  const tabs = [{ id: "wp-create", label: "页面" }, { id: "wp-mine", label: "数据" }, { id: "wp-drafts", label: "草稿箱" }];
  const submitted = permits.filter((item) => item.requester === CURRENT_USER && item.status !== "草稿");
  const drafts = permits.filter((item) => item.requester === CURRENT_USER && item.status === "草稿");
  return <section className="wp-panel wp-application-workspace">
    <div className="wp-page-tabs">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "is-active" : ""} onClick={() => onTabChange(tab.id)}>{tab.label}{tab.id === "wp-drafts" && drafts.length ? <em>{drafts.length}</em> : null}</button>)}</div>
    <div className="wp-application-body">
      {activeTab === "wp-create" && <CreatePermit onSave={onSave} embedded />}
      {activeTab === "wp-mine" && <div className="wp-application-list"><SectionTitle title="我发起的作业票" action={<span className="wp-count">共 {submitted.length} 项</span>} /><PermitTable permits={submitted} actions={[{ label: "查看", onClick: onOpen }, { label: "撤回", tone: "danger", onClick: onWithdraw, disabled: (permit) => permit.status !== "审批中" }]} /></div>}
      {activeTab === "wp-drafts" && <div className="wp-application-list"><SectionTitle title="草稿箱" action={<span className="wp-count">共 {drafts.length} 项</span>} /><PermitTable permits={drafts} actions={[{ label: "继续填报", tone: "primary", onClick: onEdit }, { label: "查看", onClick: onOpen }]} empty="暂无未提交的作业票草稿" /></div>}
    </div>
  </section>;
}

function TicketList({ title, kicker, permits, onOpen, onAction, actionLabel, onWithdraw }) {
  const actions = [{ label: "查看", onClick: onOpen }];
  if (actionLabel) actions.unshift({ label: actionLabel, onClick: onAction || onOpen, tone: "primary" });
  if (onWithdraw) actions.unshift({ label: "撤回", onClick: onWithdraw, tone: "danger", disabled: (permit) => permit.status !== "审批中" });
  return <section className="wp-panel"><SectionTitle kicker={kicker} title={title} action={<span className="wp-count">共 {permits.length} 项</span>} /><PermitTable permits={permits} actions={actions} /></section>;
}

function Guardian({ permits, onRecord, onOpen }) { return <section className="wp-panel"><SectionTitle kicker="SITE GUARDIAN" title="我的监护任务" /><div className="wp-guardian-list">{permits.map((permit) => <article key={permit.id}><div><Status value={permit.status} /><h3>{permit.title}</h3><p>{permit.location} · 作业负责人：{permit.lead} · 计划结束 {permit.end}</p></div><div><button className="wp-button wp-button-ghost" onClick={() => onOpen(permit)}>查看许可</button><button className="wp-button" onClick={() => onRecord(permit)}>记录巡检</button></div></article>)}{!permits.length && <div className="wp-empty">暂无需要监护的现场作业</div>}</div></section>; }
function ChangeControl({ permits, onOpen, onChange, onPause, onResume }) { return <section className="wp-panel"><SectionTitle title="作业变更与暂停" action={<span className="wp-count">变更、暂停和恢复作业均需记录</span>} /><PermitTable permits={permits} actions={[{ label: "查看", onClick: onOpen }, { label: "申请变更", tone: "primary", onClick: onChange }, { label: "暂停", tone: "danger", onClick: onPause, disabled: (item) => item.status !== "作业中" }, { label: "恢复", tone: "primary", onClick: onResume, disabled: (item) => item.status !== "已暂停" }]} /></section>; }

function Alerts({ permits, onOpen }) { const warnings = permits.filter((item) => item.status === "已暂停" || (item.status === "作业中" && item.end <= "2026-11-12 16:20")); return <section className="wp-panel"><SectionTitle title="作业预警" /><div className="wp-alert-list">{warnings.map((item) => <button key={item.id} onClick={() => onOpen(item)}><div className="wp-alert-icon">!</div><div><strong>{item.status === "已暂停" ? "作业暂停待处置" : "作业计划超期"}</strong><p>{item.title} · {item.suspendedReason || `计划于 ${item.end} 结束，请及时确认现场状态。`}</p></div><Status value={item.status} /></button>)}{!warnings.length && <div className="wp-empty">当前没有需要处置的作业预警</div>}</div></section>; }
function Exceptions({ permits, onOpen, onNavigate }) { return <section className="wp-panel"><SectionTitle kicker="EXCEPTION DISPOSAL" title="异常处置" action={<button className="wp-text-button" onClick={() => onNavigate("wp-alerts")}>返回预警</button>} /><PermitTable permits={permits} actions={[{ label: "查看", onClick: onOpen }, { label: "进入暂停管理", tone: "primary", onClick: () => onNavigate("wp-pause") }]} /></section>; }

function Analysis({ permits, mode }) {
  const total = permits.length || 1; const byType = permitTypes.map((type) => ({ ...type, count: permits.filter((item) => item.type === type.id).length }));
  const closed = permits.filter((item) => item.status === "已关闭").length;
  const title = mode === "wp-duty" ? "履职分析" : mode === "wp-abnormal" ? "异常分析" : "作业统计";
  return <div className="wp-analysis"><section className="wp-panel"><SectionTitle kicker="PERMIT ANALYTICS" title={title} /><div className="wp-analysis-kpis"><div><span>作业票总数</span><b>{permits.length}</b><small>本期全部许可记录</small></div><div><span>闭环完成率</span><b>{Math.round(closed / total * 100)}%</b><small>验收关闭的作业票占比</small></div><div><span>异常处置数</span><b>{permits.filter((item) => item.status === "已暂停").length}</b><small>暂停与终止类异常</small></div></div></section><section className="wp-panel"><SectionTitle kicker="TYPE DISTRIBUTION" title="作业类型分布" /><div className="wp-bars">{byType.map((item) => <div key={item.id}><span>{item.name}</span><div><i style={{ width: `${Math.max(item.count / total * 100, 4)}%`, background: item.color }} /></div><b>{item.count}</b></div>)}</div></section></div>;
}
function Configuration({ active }) { const details = { "wp-template": ["作业票模板", "维护动火、有限空间、高处、吊装等作业票的表单字段与填写要求。"], "wp-rule": ["审批与许可规则", "设置作业票审批节点、开工核查项、验收人及审批时限。"], "wp-measure": ["安全措施库", "维护各类作业的安全措施、检查项和技术交底内容。"] }[active] || ["基础配置", "维护作业票管理基础数据"];
  return <section className="wp-config"><div className="wp-config-intro"><span>基础配置</span><h2>{details[0]}</h2><p>{details[1]}</p></div><div className="wp-config-block"><h3>配置说明</h3><p>配置变更后将应用于后续新建的作业票，不影响已完成和正在执行的作业许可记录。</p><button className="wp-button">进入维护</button></div></section>; }

function PermitDetail({ permit, onClose }) { const type = getType(permit.type); return <Dialog title="作业票详情" wide onClose={onClose}><div className="wp-detail"><div className="wp-detail-banner"><span className="wp-type-badge" style={{ backgroundColor: type.color }}>{type.mark}</span><div><small>{permit.id}</small><h2>{permit.title}</h2><p>{type.name} · {permit.area} / {permit.location}</p></div><Status value={permit.status} /></div><div className="wp-detail-grid"><Info label="申请人" value={permit.requester} /><Info label="作业负责人" value={permit.lead} /><Info label="现场监护人" value={permit.guardian} /><Info label="审批人" value={permit.approver} /><Info label="计划作业时间" value={`${permit.start} 至 ${permit.end}`} /><Info label="气体检测" value={permit.gasTest} /></div><div className="wp-detail-section"><h4>风险辨识</h4><div className="wp-chip-list">{permit.hazards?.map((item) => <span key={item}>{item}</span>)}</div></div><div className="wp-detail-section"><h4>安全措施</h4><ol>{permit.measures?.map((item) => <li key={item}>{item}</li>)}</ol></div><div className="wp-detail-section"><h4>流转记录</h4><div className="wp-log">{permit.logs?.map((item, index) => <div key={`${item.at}-${index}`}><i /><span>{item.at}</span><strong>{item.action}</strong><p>{item.actor}{item.note ? `：${item.note}` : ""}</p></div>)}</div></div><footer><button className="wp-button" onClick={onClose}>关闭</button></footer></div></Dialog>; }
function Info({ label, value }) { return <div><span>{label}</span><b>{value || "-"}</b></div>; }

function ReviewDialog({ permit, onClose, onConfirm }) { const [opinion, setOpinion] = useState(""); return <Dialog title="审批作业票" onClose={onClose}><div className="wp-simple-dialog"><p>确认审批 <b>{permit.title}</b> 吗？审批通过后将进入待开工状态。</p><label>审批意见<textarea maxLength={120} value={opinion} onChange={(event) => setOpinion(event.target.value)} placeholder="可填写审批意见" /></label><footer><button className="wp-button wp-button-ghost" onClick={() => onConfirm(false, opinion || "风险措施不完整，请补充后重新提交")}>驳回</button><button className="wp-button" onClick={() => onConfirm(true, opinion || "同意作业")}>同意并提交</button></footer></div></Dialog>; }
function StartDialog({ state, setState, onClose, onConfirm }) { const ready = Object.values(state.checks).every(Boolean); const toggle = (key) => setState((value) => ({ ...value, checks: { ...value.checks, [key]: !value.checks[key] } })); return <Dialog title="开工条件核查" onClose={onClose}><div className="wp-simple-dialog"><p>作业票：<b>{state.permit.title}</b></p><div className="wp-check-list">{[["people", "作业人员、负责人、监护人已到场"], ["disclosure", "已完成作业安全技术交底"], ["measure", "安全措施及应急器材已落实"], ["test", "作业环境检测结果符合要求"]].map(([key, label]) => <label key={key}><input type="checkbox" checked={state.checks[key]} onChange={() => toggle(key)} />{label}</label>)}</div><footer><button className="wp-button wp-button-ghost" onClick={onClose}>取消</button><button className="wp-button" disabled={!ready} onClick={onConfirm}>确认开工</button></footer></div></Dialog>; }
function AcceptDialog({ state, setState, onClose, onConfirm }) { return <Dialog title="完工验收" onClose={onClose}><div className="wp-simple-dialog"><p>确认 <b>{state.permit.title}</b> 的验收结果。</p><label>验收结论<select value={state.result} onChange={(event) => setState((value) => ({ ...value, result: event.target.value }))}><option>验收合格</option><option>退回处理</option></select></label><label>验收说明<textarea maxLength={120} value={state.note} onChange={(event) => setState((value) => ({ ...value, note: event.target.value }))} placeholder="填写验收意见" /></label><footer><button className="wp-button wp-button-ghost" onClick={onClose}>取消</button><button className="wp-button" onClick={() => onConfirm(state.result === "验收合格", state.note || state.result)}>确认提交</button></footer></div></Dialog>; }
function PauseDialog({ state, setState, onClose, onConfirm }) { return <Dialog title="暂停作业" onClose={onClose}><div className="wp-simple-dialog"><p>暂停后，现场作业应立即停止；恢复作业前须重新确认现场条件。</p><label>暂停原因 <i>*</i><textarea maxLength={120} value={state.reason} onChange={(event) => setState((value) => ({ ...value, reason: event.target.value }))} placeholder="请说明现场异常或暂停原因" /></label><footer><button className="wp-button wp-button-ghost" onClick={onClose}>取消</button><button className="wp-button wp-button-danger" onClick={onConfirm}>确认暂停</button></footer></div></Dialog>; }
function ChangeDialog({ state, setState, onClose, onConfirm }) { return <Dialog title="申请作业变更" onClose={onClose}><div className="wp-simple-dialog"><p>变更作业地点、时间、人员或安全措施时，必须重新复核。</p><label>变更内容 <i>*</i><textarea maxLength={160} value={state.note} onChange={(event) => setState((value) => ({ ...value, note: event.target.value }))} placeholder="请填写本次变更内容与原因" /></label><footer><button className="wp-button wp-button-ghost" onClick={onClose}>取消</button><button className="wp-button" onClick={onConfirm}>提交复核</button></footer></div></Dialog>; }

export default WorkPermit;
