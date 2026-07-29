import { startTransition, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import {
  Add24Regular,
  Apps24Regular,
  ApprovalsApp24Regular,
  ArrowRight24Regular,
  Briefcase24Regular,
  CalendarLtr24Regular,
  Chat24Regular,
  ChevronDown24Regular,
  ChevronRight24Regular,
  CheckmarkCircle24Regular,
  ClipboardTask24Regular,
  DataBarVertical24Regular,
  DocumentText24Regular,
  DismissRegular,
  ErrorCircle24Regular,
  Fire24Regular,
  Flash24Regular,
  Flowchart24Regular,
  Home24Regular,
  Lightbulb24Regular,
  LineHorizontal320Regular,
  People24Regular,
  PersonClock24Regular,
  Settings24Regular,
  ShieldCheckmark24Regular,
  Toolbox24Regular,
  Wrench24Regular,
} from '@fluentui/react-icons';
import './styles.css';

const navigation = [
  { label: '工作台', icon: Home24Regular },
  { label: '应用中心', icon: Apps24Regular },
  { label: '任务', icon: ClipboardTask24Regular },
  { label: '流程', icon: Flowchart24Regular },
  { label: '数据洞察', icon: DataBarVertical24Regular },
  { label: '通讯录', icon: People24Regular },
];

const workQueues = [
  { id: 'message', title: '未读消息', count: 12, note: '3 条需要你确认', icon: Chat24Regular, accent: 'blue', items: ['请确认 7 月安全例会纪要', '在设备点检单中提及了你', '新增一条隐患整改提醒'] },
  { id: 'task', title: '待办任务', count: 4, note: '2 项今天到期', icon: ClipboardTask24Regular, accent: 'orange', items: ['完成 3 号球磨机点检复核', '提交第二季度风险排查记录', '补充 7 月生产日报说明'] },
  { id: 'approval', title: '待批流程', count: 3, note: '1 项等待超 24 小时', icon: ApprovalsApp24Regular, accent: 'teal', items: ['矿山应急照明设备采购申请', '南区 2# 采场动火作业申请', '碎矿车间停机检修计划'] },
];

const apps = [
  { name: '双重预防机制', description: '风险与隐患', icon: ShieldCheckmark24Regular },
  { name: '安全管理', description: '检查与整改', icon: ErrorCircle24Regular },
  { name: '设备管理', description: '点检与维修', icon: Wrench24Regular },
  { name: '火工品管理', description: '领用与追溯', icon: Flash24Regular },
  { name: '生产管理', description: '计划与日报', icon: Toolbox24Regular },
  { name: '机电管理', description: '运行与保全', icon: Briefcase24Regular },
  { name: '消防管理', description: '巡检与演练', icon: Fire24Regular },
  { name: '应急管理', description: '预案与响应', icon: Lightbulb24Regular },
];

const initialTabs = [{ id: 'workbench', label: '工作台', icon: Home24Regular, pinned: true }];

const recentApps = [
  { name: '设备管理', time: '今天 10:26', icon: Wrench24Regular, tone: 'orange' },
  { name: '安全管理', time: '昨天 16:40', icon: ErrorCircle24Regular, tone: 'green' },
  { name: '生产管理', time: '7 月 25 日', icon: Toolbox24Regular, tone: 'blue' },
  { name: '双重预防机制', time: '7 月 24 日', icon: ShieldCheckmark24Regular, tone: 'violet' },
];

const feedItems = [
  { tab: '待我处理', person: '陈伟', tone: 'blue', avatar: '陈', headline: '在设备保养计划中提及了你', detail: '请协助确认 2# 渣浆泵更换备件的到货日期。', time: '12 分钟前', icon: PersonClock24Regular },
  { tab: '流程提醒', person: '系统通知', tone: 'green', avatar: '系', headline: '外协队入场审批已通过', detail: '流程已归档，可查看审批意见与附件。', time: '45 分钟前', icon: CheckmarkCircle24Regular },
  { tab: '待我处理', person: '安环部', tone: 'orange', avatar: '安', headline: '向你分派了隐患整改复查', detail: '整改期限为 7 月 30 日，请及时跟进。', time: '今天 09:16', icon: ClipboardTask24Regular },
  { tab: '业务动态', person: '李明', tone: 'violet', avatar: '李', headline: '更新了南区排水泵巡检记录', detail: '本次数据已同步到设备管理台账。', time: '昨天 16:50', icon: Wrench24Regular },
];

function IconButton({ label, children, active, onClick, badge }) {
  return <button className={`icon-button ${active ? 'active' : ''}`} aria-label={label} title={label} onClick={onClick}>{children}{badge ? <span className="semantic-badge" /> : null}</button>;
}

function AppNav({ active, onChange }) {
  return <aside className="app-nav" aria-label="主导航">
    <div className="product-mark" aria-label="澄明工作台">C</div>
    <nav>{navigation.map(({ label, icon: Icon }) => <button key={label} onClick={() => onChange(label)} className={active === label ? 'nav-link active' : 'nav-link'}><Icon/><span>{label}</span></button>)}</nav>
    <div className="nav-bottom"><IconButton label="设置"><Settings24Regular/></IconButton><div className="profile-mini" aria-label="当前用户 张宇">张</div></div>
  </aside>;
}

function ApplicationTabs({ tabs, activeTab, onSelect, onClose }) {
  return <header className="application-tabs" aria-label="应用页签">
    <div className="tabs-scroll" role="tablist" aria-label="已打开应用">{tabs.map(({ id, label, icon: Icon, pinned }) => <div className={activeTab === id ? 'application-tab active' : 'application-tab'} key={id}>
      <button role="tab" aria-selected={activeTab === id} onClick={() => onSelect(id)}><Icon/><span>{label}</span></button>
      {!pinned ? <button className="close-tab" aria-label={`关闭 ${label}`} onClick={() => onClose(id)}><DismissRegular/></button> : null}
    </div>)}</div>
  </header>;
}

function WorkQueue({ item, active, onSelect }) {
  const Icon = item.icon;
  return <section className={`work-queue ${item.accent} ${active ? 'active' : ''}`}>
    <button className="queue-title" onClick={onSelect}>
      <span className="queue-icon"><Icon/></span>
      <span><b>{item.title}</b><small>{item.note}</small></span>
      <strong>{item.count}</strong>
      <ArrowRight24Regular/>
    </button>
  </section>;
}

function ApplicationRail({ onOpen }) {
  return <section className="application-rail" aria-labelledby="applications-title">
    <div className="section-title"><div><p>业务直达</p><h2 id="applications-title">常用应用</h2></div><button className="quiet-action" onClick={() => onOpen('应用中心')}>浏览全部 <ArrowRight24Regular/></button></div>
    <div className="application-grid">{apps.map(({ name, description, icon: Icon }, index) => <button className="application" key={name} onClick={() => onOpen(name)}><span className={`application-icon icon-${index % 4}`}><Icon/></span><span><b>{name}</b><small>{description}</small></span><ArrowRight24Regular/></button>)}</div>
  </section>;
}

function RecentApps({ onOpen }) {
  return <section className="recent-section" aria-labelledby="recent-apps-title">
    <div className="section-title recent-title"><div><p>继续处理</p><h2 id="recent-apps-title">最近使用</h2></div></div>
    <div className="recent-list">{recentApps.map(({ name, time, icon: Icon, tone }) => <button className="recent-app" key={name} onClick={() => onOpen(name)}><span className={`recent-icon ${tone}`}><Icon/></span><span><b>{name}</b><small>{time} 使用</small></span><ArrowRight24Regular/></button>)}</div>
  </section>;
}

function ApplicationWorkspace({ app, onReturn, onAction }) {
  const Icon = app.icon;
  return <section className="application-workspace" aria-labelledby="application-workspace-title">
    <div className="application-workspace-heading"><span className="workspace-icon"><Icon/></span><div><p>当前应用</p><h1 id="application-workspace-title">{app.name}</h1><span>{app.description}</span></div><button className="quiet-action" onClick={onReturn}>返回工作台 <ArrowRight24Regular/></button></div>
    <div className="application-workspace-actions"><button onClick={() => onAction(`${app.name}待办`)}><ClipboardTask24Regular/><span><b>待处理事项</b><small>查看分派给你的工作</small></span><ArrowRight24Regular/></button><button onClick={() => onAction(`新建${app.name}记录`)}><Add24Regular/><span><b>新建记录</b><small>快速发起一条业务记录</small></span><ArrowRight24Regular/></button><button onClick={() => onAction(`${app.name}设置`)}><Settings24Regular/><span><b>应用设置</b><small>配置常用模板与提醒</small></span><ArrowRight24Regular/></button></div>
  </section>;
}

function AppSwitcher({ currentName, onSelect }) {
  const [open, setOpen] = useState(false);
  const currentApp = apps.find((app) => app.name === currentName) ?? apps[0];
  const CurrentIcon = currentApp.icon;
  return <div className="app-switcher-wrap"><button className="prevention-switcher" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}><span><CurrentIcon/></span><b>{currentName.replace('机制', '管理')}</b><ChevronDown24Regular/></button>{open ? <div className="app-switcher-menu" role="menu" aria-label="切换应用">{apps.map(({ name, description, icon: Icon }) => <button key={name} role="menuitem" className={name === currentName ? 'selected' : ''} onClick={() => { setOpen(false); onSelect(name); }}><Icon/><span><b>{name}</b><small>{description}</small></span>{name === currentName ? <CheckmarkCircle24Regular/> : null}</button>)}</div> : null}</div>;
}

const preventionNavigation = [
  { label: '法律法规', icon: DocumentText24Regular },
  { label: '制度文件', icon: DocumentText24Regular, nested: true },
  { label: '风险分级管控', icon: ShieldCheckmark24Regular, nested: true },
  { label: '隐患排查治理', icon: ErrorCircle24Regular, expanded: true },
];

const preventionSubmenu = ['隐患排查任务发布', '岗位隐患排查清单', '隐患排查治理记录', '隐患排查工作表', '隐患整改通知单', '隐患整改台账', '隐患信息统计', '隐患汇报'];

const preventionForms = [
  { title: '平巷凿岩作业岗位隐患排查表', detail: '岗位隐患排查', icon: ShieldCheckmark24Regular, tone: 'lime' },
  { title: '掘进凿岩工隐患排查清单', detail: '岗位隐患排查', icon: ClipboardTask24Regular, tone: 'blue' },
  { title: '撬毛作业岗位隐患排查表', detail: '岗位隐患排查', icon: ShieldCheckmark24Regular, tone: 'lime' },
];

function DualPreventionPage({ onReturn, onAction, onSwitchApplication }) {
  const [selectedItem, setSelectedItem] = useState('岗位隐患排查清单');
  const [activeForm, setActiveForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const selectedLabel = selectedItem;
  const openForm = () => { setActiveForm(true); setSubmitted(false); };
  const submitForm = (event) => { event.preventDefault(); setSubmitted(true); onAction('岗位隐患排查表已提交'); };
  return <section className="prevention-page" aria-labelledby="prevention-page-title">
    <aside className="prevention-sidebar" aria-label="双重预防机制功能导航">
      <AppSwitcher currentName="双重预防机制" onSelect={onSwitchApplication}/>
      <nav className="prevention-nav">{preventionNavigation.map(({ label, icon: Icon, nested, expanded }) => <button key={label} className={expanded ? 'prevention-nav-item expanded' : 'prevention-nav-item'} onClick={() => onAction(label)}><Icon/><span>{label}</span>{nested ? <ChevronRight24Regular/> : expanded ? <ChevronDown24Regular/> : null}</button>)}</nav>
      <div className="prevention-submenu">{preventionSubmenu.map((item) => <button key={item} className={selectedItem === item ? 'selected' : ''} onClick={() => setSelectedItem(item)}><span>{item}</span>{['隐患排查任务发布', '隐患排查工作表', '隐患整改通知单', '隐患汇报'].includes(item) ? <ChevronRight24Regular/> : null}</button>)}</div>
      <nav className="prevention-nav prevention-nav-bottom"><button className="prevention-nav-item" onClick={() => onAction('风险告知卡')}><DocumentText24Regular/><span>风险告知卡</span><ChevronRight24Regular/></button><button className="prevention-nav-item" onClick={() => onAction('风险四色图')}><DataBarVertical24Regular/><span>风险四色图</span><ChevronRight24Regular/></button></nav>
    </aside>
    <div className="prevention-content">
      {activeForm ? <section className="inspection-form-view" aria-labelledby="inspection-form-title">
        <div className="prevention-breadcrumb"><span>双重预防管理</span><ChevronRight24Regular/><span>隐患排查治理</span><ChevronRight24Regular/><button onClick={() => { setActiveForm(false); setSubmitted(false); }}>岗位隐患排查清单</button><ChevronRight24Regular/><strong id="prevention-page-title">在线填报</strong></div>
        <form className="inspection-form" onSubmit={submitForm}>
          <header className="inspection-form-header"><div><p>岗位隐患排查</p><h1 id="inspection-form-title">平巷凿岩作业岗位隐患排查表</h1><span>请如实填写现场检查情况，带 * 的项目为必填项。</span></div><button type="button" className="form-back" onClick={() => { setActiveForm(false); setSubmitted(false); }}>返回清单</button></header>
          <section className="form-section"><h2>填报信息</h2><div className="form-fields"><label>填报人 *<input name="reporter" defaultValue="张宇" required /></label><label>检查日期 *<input name="inspectionDate" type="date" defaultValue="2026-07-29" required /></label><label>作业班次 *<select name="shift" defaultValue="早班" required><option>早班</option><option>中班</option><option>夜班</option></select></label><label>作业地点 *<input name="location" placeholder="例如：西翼 3# 平巷" required /></label></div></section>
          <section className="form-section"><h2>现场检查</h2><div className="inspection-items"><div className="inspection-item"><b>凿岩设备防护装置完好</b><span><label><input type="radio" name="equipment" value="normal" required /> 正常</label><label><input type="radio" name="equipment" value="issue" /> 发现问题</label></span></div><div className="inspection-item"><b>作业面通风与照明符合要求</b><span><label><input type="radio" name="environment" value="normal" required /> 正常</label><label><input type="radio" name="environment" value="issue" /> 发现问题</label></span></div><div className="inspection-item"><b>人员防护用品佩戴规范</b><span><label><input type="radio" name="protection" value="normal" required /> 正常</label><label><input type="radio" name="protection" value="issue" /> 发现问题</label></span></div></div></section>
          <section className="form-section"><h2>问题说明</h2><label className="wide-field">隐患描述与整改建议<textarea name="description" rows="3" placeholder="如发现隐患，请填写具体位置、问题描述及建议措施。" /></label></section>
          <footer className="form-actions">{submitted ? <span className="submit-status"><CheckmarkCircle24Regular/> 已提交，等待负责人复核</span> : <span>填写完成后可直接提交至隐患排查记录。</span>}<div><button type="button" className="form-secondary" onClick={() => { setActiveForm(false); setSubmitted(false); }}>取消</button><button type="submit" className="form-primary">提交排查表</button></div></footer>
        </form>
      </section> : <><div className="prevention-breadcrumb"><span>双重预防管理</span><ChevronRight24Regular/><button onClick={() => setSelectedItem('隐患排查治理')}>隐患排查治理</button><ChevronRight24Regular/><strong id="prevention-page-title">{selectedLabel}</strong></div>
        <div className="prevention-strip" />
        <section className="prevention-list" aria-labelledby="prevention-list-title">
          <div className="prevention-list-heading"><h2 id="prevention-list-title">全部</h2><span>共 {preventionForms.length} 个表单</span></div>
          <div className="prevention-form-grid">{preventionForms.map(({ title, detail, icon: Icon, tone }, index) => <button key={title} className="prevention-form-card" onClick={index === 0 ? openForm : () => onAction(title)}><span className={`prevention-form-icon ${tone}`}><Icon/></span><span><b>{title}</b><small>{detail}</small></span><ChevronRight24Regular/></button>)}</div>
        </section>
        <button className="prevention-back" onClick={onReturn}>返回工作台 <ArrowRight24Regular/></button></>}
    </div>
  </section>;
}

function MockApplicationPage({ app, onReturn, onAction, onSwitchApplication }) {
  const Icon = app.icon;
  const sampleRows = [`核对今日${app.name}记录`, `完成本周${app.description}复核`, `查看待处理异常提醒`];
  return <section className="mock-app-page" aria-labelledby="mock-app-title">
    <aside className="mock-app-sidebar" aria-label={`${app.name}功能导航`}><AppSwitcher currentName={app.name} onSelect={onSwitchApplication}/><nav><button className="mock-nav-item active"><Home24Regular/>应用概览</button><button className="mock-nav-item" onClick={() => onAction(`${app.name}待办`)}><ClipboardTask24Regular/>待办处理</button><button className="mock-nav-item" onClick={() => onAction(`${app.name}记录`)}><DocumentText24Regular/>业务记录</button><button className="mock-nav-item" onClick={() => onAction(`${app.name}统计`)}><DataBarVertical24Regular/>数据统计</button></nav></aside>
    <div className="mock-app-content"><div className="mock-app-breadcrumb"><span>应用中心</span><ChevronRight24Regular/><strong>{app.name}</strong></div><header className="mock-app-header"><span className="mock-app-icon"><Icon/></span><div><h1 id="mock-app-title">{app.name}工作台</h1><p>示例业务页面，数据仅用于界面演示。</p></div><button className="mock-primary-action" onClick={() => onAction(`新建${app.name}记录`)}><Add24Regular/>新建记录</button></header><section className="mock-metrics" aria-label={`${app.name}概览`}><div><span>待处理</span><b>6</b><small>需你跟进</small></div><div><span>今日记录</span><b>14</b><small>已同步更新</small></div><div><span>异常提醒</span><b>2</b><small>等待复核</small></div></section><section className="mock-work-list" aria-labelledby="mock-work-title"><div><h2 id="mock-work-title">待处理事项</h2><button onClick={() => onAction(`${app.name}全部事项`)}>查看全部 <ArrowRight24Regular/></button></div>{sampleRows.map((row, index) => <button key={row} onClick={() => onAction(row)}><span className={`mock-row-icon tone-${index}`}><ClipboardTask24Regular/></span><span><b>{row}</b><small>{index === 0 ? '今天需完成' : '已分配给你'}</small></span><ArrowRight24Regular/></button>)}</section><button className="prevention-back" onClick={onReturn}>返回工作台 <ArrowRight24Regular/></button></div>
  </section>;
}

function ActivityFeed({ selectedTab, onSelectTab, onOpen }) {
  const tabs = ['全部', '待我处理', '流程提醒', '业务动态'];
  const visibleItems = selectedTab === '全部' ? feedItems : feedItems.filter((item) => item.tab === selectedTab);
  return <section className="activity-feed" aria-labelledby="activity-title">
    <div className="section-title"><div><p>个人关联</p><h2 id="activity-title">事事动态</h2></div><button className="quiet-action" onClick={() => onOpen('动态中心')}>查看全部 <ArrowRight24Regular/></button></div>
    <div className="feed-tabs" role="tablist" aria-label="动态类型">{tabs.map((tab) => <button key={tab} role="tab" aria-selected={selectedTab === tab} className={selectedTab === tab ? 'selected' : ''} onClick={() => onSelectTab(tab)}>{tab}</button>)}</div>
    <div className="feed-list">{visibleItems.length ? visibleItems.map(({ person, tone, avatar, headline, detail, time, icon: Icon }) => <button className="feed-item" key={headline} onClick={() => onOpen(headline)}><span className={`feed-avatar ${tone}`}>{avatar}</span><span className="feed-content"><span><b>{person}</b><strong>{headline}</strong></span><p>{detail}</p><time>{time}</time></span><Icon className="feed-icon"/></button>) : <div className="empty-feed"><LineHorizontal320Regular/><p>这一类动态已全部处理。</p></div>}</div>
  </section>;
}

function CommandPanel({ onAction }) {
  return <aside className="command-panel" aria-label="快捷操作">
    <p>快捷入口</p>
    <button className="command-primary" onClick={() => onAction('发起任务')}><span><Add24Regular/></span><div><b>发起任务</b><small>交办或跟进一项工作</small></div><ArrowRight24Regular/></button>
    <button className="command-secondary" onClick={() => onAction('发起流程')}><span><Flowchart24Regular/></span><div><b>发起流程</b><small>提交一次审批或申请</small></div><ArrowRight24Regular/></button>
    <section className="deadline-note"><CalendarLtr24Regular/><div><p>下一项截止</p><b>设备点检复核</b><small>今天 15:00 前完成</small></div><button aria-label="打开设备点检复核" onClick={() => onAction('设备点检复核')}><ArrowRight24Regular/></button></section>
  </aside>;
}

function ActionDialog({ title, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  if (!title) return null;
  const isTask = title === '发起任务';
  return <div className="dialog-layer" onMouseDown={onClose} role="presentation"><section className="action-dialog" role="dialog" aria-modal="true" aria-labelledby="action-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
    <button className="dialog-close" aria-label="关闭" onClick={onClose}>×</button>
    {submitted ? <div className="dialog-success"><CheckmarkCircle24Regular/><h2>已准备好继续</h2><p>这是工作台演示状态，实际接入后将在此进入对应业务表单。</p><button onClick={onClose}>完成</button></div> : <><p className="dialog-kicker">快速创建</p><h2 id="action-dialog-title">{title}</h2><p className="dialog-description">{isTask ? '填写最小必要信息，将工作直接交给相应负责人。' : '从授权模板中选择流程，减少重复填写。'}</p><label>{isTask ? '任务名称' : '流程模板'}<input autoFocus placeholder={isTask ? '例如：完成现场安全检查' : '例如：选择设备检修申请'} /></label><div className="dialog-actions"><button className="secondary-button" onClick={onClose}>取消</button><button className="primary-button" onClick={() => setSubmitted(true)}>继续</button></div></>}
  </section></div>;
}

function App() {
  const [activeNav, setActiveNav] = useState('工作台');
  const [activeQueue, setActiveQueue] = useState('task');
  const [activityTab, setActivityTab] = useState('全部');
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const [openTabs, setOpenTabs] = useState(initialTabs);
  const [activeTab, setActiveTab] = useState('workbench');
  const showNotice = (label) => { setNotice(`已选择 ${label}`); window.setTimeout(() => setNotice(''), 2200); };
  const selectTab = (id) => { window.scrollTo({ top: 0, behavior: 'smooth' }); startTransition(() => { setActiveTab(id); setActiveNav(id === 'workbench' ? '工作台' : '应用中心'); }); };
  const openApplication = (name) => {
    const targetName = name === '应用中心' ? '双重预防机制' : name;
    const app = apps.find((item) => item.name === targetName);
    if (!app) { showNotice(name); return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startTransition(() => { setOpenTabs((current) => current.some((tab) => tab.id === targetName) ? current : [...current, { id: targetName, label: targetName, icon: app.icon }]); setActiveTab(targetName); setActiveNav('应用中心'); });
  };
  const closeTab = (id) => {
    const closingIndex = openTabs.findIndex((tab) => tab.id === id);
    const remainingTabs = openTabs.filter((tab) => tab.id !== id);
    startTransition(() => { setOpenTabs(remainingTabs); if (activeTab === id) { const fallback = remainingTabs[Math.max(0, closingIndex - 1)] ?? initialTabs[0]; setActiveTab(fallback.id); setActiveNav(fallback.id === 'workbench' ? '工作台' : '应用中心'); } });
  };
  const activeApplication = apps.find((app) => app.name === activeTab);
  return <FluentProvider theme={webLightTheme}><div className="workbench theme-light">
    <AppNav active={activeNav} onChange={(label) => { if (label === '工作台') { selectTab('workbench'); return; } if (label === '应用中心') { openApplication('应用中心'); return; } setActiveNav(label); showNotice(label); }}/>
    <div className="page-shell"><ApplicationTabs tabs={openTabs} activeTab={activeTab} onSelect={selectTab} onClose={closeTab}/>
      <main>{activeApplication?.name === '双重预防机制' ? <DualPreventionPage onReturn={() => selectTab('workbench')} onAction={showNotice} onSwitchApplication={openApplication}/> : activeApplication ? <MockApplicationPage app={activeApplication} onReturn={() => selectTab('workbench')} onAction={showNotice} onSwitchApplication={openApplication}/> : <div className="main-layout"><div className="primary-column"><section className="priority-zone" aria-labelledby="priority-title"><div className="section-title priority-title"><div><h2 id="priority-title">今日待办</h2></div><button className="quiet-action" onClick={() => showNotice('任务总览')}>任务总览 <ArrowRight24Regular/></button></div><div className="queue-grid">{workQueues.map((item) => <WorkQueue item={item} key={item.id} active={activeQueue === item.id} onSelect={() => setActiveQueue(item.id)}/>)}</div></section><RecentApps onOpen={openApplication}/><ApplicationRail onOpen={openApplication}/></div>
          <div className="secondary-column"><CommandPanel onAction={setDialog}/><ActivityFeed selectedTab={activityTab} onSelectTab={setActivityTab} onOpen={showNotice}/></div></div>}</main></div>
    {notice ? <div className="toast" role="status" aria-label={notice}><CheckmarkCircle24Regular/>{notice}</div> : null}<ActionDialog title={dialog} onClose={() => setDialog(null)}/>
  </div></FluentProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
