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

const messageEntries = [
  { id: 'msg-1', source: '任务', type: '执行提醒', sender: '陈伟', time: '今天 10:12', title: '完成设备点检复核', content: '3 号球磨机点检任务已完成，请确认复核结果。', attachment: '任务表单', formKind: 'task', read: false, icon: ClipboardTask24Regular, tone: 'blue' },
  { id: 'msg-2', source: '流程', type: '待你审批', sender: '系统通知', time: '今天 09:38', title: '矿山应急照明设备采购申请', content: '该流程已流转至你，请在今天内完成审批。', attachment: '审批流表单', formKind: 'approval', read: false, icon: ApprovalsApp24Regular, tone: 'orange' },
  { id: 'msg-3', source: '预警', type: '超期提醒', sender: '安环部', time: '昨天 16:45', title: '南区排水泵隐患整改复查', content: '整改期限临近，请及时查看现场复查情况。', attachment: '预警处置表单', formKind: 'warning', read: false, icon: ErrorCircle24Regular, tone: 'red' },
  { id: 'msg-4', source: '任务', type: '任务分派', sender: '李明', time: '昨天 14:20', title: '平巷凿岩作业隐患排查任务', content: '你已被添加为执行人，请按要求完成岗位检查。', attachment: '任务表单', formKind: 'task', read: false, icon: ShieldCheckmark24Regular, tone: 'green' },
  { id: 'msg-5', source: '系统', type: '系统通知', sender: '系统通知', time: '7 月 28 日 09:16', title: '生产日报已同步完成', content: '南区生产日报数据已归档，可进入生产管理查看。', attachment: '系统通知', formKind: 'system', read: true, icon: CheckmarkCircle24Regular, tone: 'blue' },
];

const taskEntries = [
  { id: 'task-1', name: '完成设备点检复核', publishedAt: '今天 08:30', plannedAt: '今天 10:00', deadline: '今天 17:30', initiator: '陈伟', executor: '张宇', status: '待执行', attachment: '设备点检任务表' },
  { id: 'task-2', name: '平巷凿岩作业隐患排查', publishedAt: '昨天 16:20', plannedAt: '今天 09:00', deadline: '今天 16:00', initiator: '李明', executor: '张宇', status: '执行中', attachment: '岗位隐患排查表' },
  { id: 'task-3', name: '南区排水泵巡检', publishedAt: '昨天 14:10', plannedAt: '今天 13:30', deadline: '明天 10:00', initiator: '设备管理部', executor: '张宇', status: '待执行', attachment: '设备巡检记录表' },
  { id: 'task-4', name: '提交第二季度风险排查记录', publishedAt: '7 月 28 日 11:05', plannedAt: '7 月 30 日 09:00', deadline: '7 月 30 日 18:00', initiator: '安环部', executor: '张宇', status: '待执行', attachment: '风险排查记录表' },
];

const processEntries = [
  { id: 'flow-1', name: '矿山应急照明设备采购申请', initiator: '王建国', initiatedAt: '今天 09:12', currentNode: '部门负责人审批', approver: '张宇', status: '待审批', amount: '86,500 元', department: '机电管理部', urgency: '常规' },
  { id: 'flow-2', name: '南区 2# 采场动火作业申请', initiator: '李明', initiatedAt: '今天 08:46', currentNode: '安全管理部审批', approver: '张宇', status: '待审批', amount: '不涉及', department: '生产管理部', urgency: '紧急' },
  { id: 'flow-3', name: '碎矿车间停机检修计划', initiator: '赵磊', initiatedAt: '昨天 15:28', currentNode: '设备平台主管审批', approver: '刘海', status: '审批中', amount: '128,000 元', department: '设备管理部', urgency: '常规' },
  { id: 'flow-4', name: '外协队入场资格审核', initiator: '周敏', initiatedAt: '昨天 10:20', currentNode: '安环部备案', approver: '孙宁', status: '审批中', amount: '不涉及', department: '安全管理部', urgency: '常规' },
];

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

function ApplicationTabs({ tabs, activeTab, onSelect, onClose, onOpenMessages }) {
  return <header className="application-tabs" aria-label="应用页签">
    <div className="tabs-scroll" role="tablist" aria-label="已打开应用">{tabs.map(({ id, label, icon: Icon, pinned }) => <div className={activeTab === id ? 'application-tab active' : 'application-tab'} key={id}>
      <button role="tab" aria-selected={activeTab === id} onClick={() => onSelect(id)}><Icon/><span>{label}</span></button>
      {!pinned ? <button className="close-tab" aria-label={`关闭 ${label}`} onClick={() => onClose(id)}><DismissRegular/></button> : null}
    </div>)}</div><button className="message-entry" aria-label="消息中心" onClick={onOpenMessages}><Chat24Regular/><span>消息</span><b>4</b></button>
  </header>;
}

function MessageAttachmentDialog({ message, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  if (!message) return null;
  const kind = message.formKind;
  const labels = { task: '任务表单', approval: '审批流表单', warning: '预警处置表单', system: '消息详情' };
  return <div className="message-dialog-layer" onMouseDown={onClose} role="presentation"><section className="message-form-dialog" role="dialog" aria-modal="true" aria-labelledby="message-form-title" onMouseDown={(event) => event.stopPropagation()}><button className="message-dialog-close" aria-label="关闭消息表单" onClick={onClose}><DismissRegular/></button><header><span>{labels[kind]}</span><h2 id="message-form-title">{message.title}</h2><p>{message.content}</p></header>{submitted ? <div className="message-submit-success"><CheckmarkCircle24Regular/><h3>已完成处理</h3><p>当前为演示状态，提交内容已记录在本次会话中。</p><button onClick={onClose}>关闭</button></div> : kind === 'task' ? <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><div className="message-form-grid"><label>任务名称<input defaultValue={message.title} required /></label><label>执行人<input defaultValue="张宇" required /></label><label>截止时间<input type="date" defaultValue="2026-07-30" required /></label><label>任务状态<select defaultValue="已完成"><option>待处理</option><option>处理中</option><option>已完成</option></select></label></div><label className="message-form-wide">执行说明<textarea rows="3" defaultValue="现场点检已完成，等待复核确认。" /></label><footer><button type="button" onClick={onClose}>取消</button><button className="message-form-primary" type="submit">确认任务</button></footer></form> : kind === 'approval' ? <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><div className="approval-summary"><span>申请人<b>机电管理部</b></span><span>申请金额<b>￥28,600.00</b></span><span>当前节点<b>张宇审批</b></span></div><label className="message-form-wide">审批意见<textarea rows="4" placeholder="请输入审批意见" required /></label><footer><button type="button" onClick={onClose}>退回</button><button className="message-form-primary" type="submit">同意并提交</button></footer></form> : kind === 'warning' ? <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><div className="warning-summary"><span><b>预警等级</b><strong>重要</strong></span><span><b>预警位置</b>南区排水泵房</span><span><b>触发时间</b>昨天 16:45</span></div><label className="message-form-wide">处置措施<textarea rows="4" placeholder="填写现场核查情况与处置措施" required /></label><footer><button type="button" onClick={onClose}>暂不处理</button><button className="message-form-primary" type="submit">确认处置</button></footer></form> : <div className="message-submit-success"><CheckmarkCircle24Regular/><h3>消息已阅读</h3><p>该消息不包含需要处理的业务表单。</p><button onClick={onClose}>关闭</button></div>}</section></div>;
}

function MessageCenter({ messages, onMarkRead, onMarkAllRead, onReturn }) {
  const [source, setSource] = useState('全部');
  const [type, setType] = useState('全部');
  const [status, setStatus] = useState('未读');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const filteredMessages = messages.filter((message) => (source === '全部' || message.source === source) && (type === '全部' || message.type === type) && (status === '全部' || (status === '未读' ? !message.read : message.read)));
  const unreadCount = messages.filter((message) => !message.read).length;
  return <section className="message-center" aria-labelledby="message-center-title"><div className="message-path"><button onClick={onReturn}>工作台</button><ChevronRight24Regular/><strong id="message-center-title">互动消息</strong></div><header className="message-header"><div><p>消息中心</p><h1>互动消息列表 <span>({unreadCount} 条未读)</span></h1></div><button className="mark-all-read" onClick={onMarkAllRead} disabled={unreadCount === 0}><CheckmarkCircle24Regular/>全部标为已读</button></header><div className="message-filters" aria-label="消息筛选"><label>消息来源<select value={source} onChange={(event) => setSource(event.target.value)}><option>全部</option><option>任务</option><option>流程</option><option>预警</option><option>系统</option></select></label><label>消息类型<select value={type} onChange={(event) => setType(event.target.value)}><option>全部</option><option>执行提醒</option><option>待你审批</option><option>超期提醒</option><option>任务分派</option><option>系统通知</option></select></label><label>消息状态<select value={status} onChange={(event) => setStatus(event.target.value)}><option>未读</option><option>已读</option><option>全部</option></select></label></div><div className="message-list">{filteredMessages.length ? filteredMessages.map((message) => { const { id, source: messageSource, type: messageType, sender, time, title, content, attachment, read, icon: Icon, tone } = message; return <button className={read ? 'message-row read' : 'message-row'} key={id} onClick={() => { onMarkRead(id); setSelectedMessage(message); }}><span className={`message-row-icon ${tone}`}><Icon/></span><span className="message-row-content"><span><b>{sender}</b><time>{time}</time>{!read ? <i>未读</i> : null}</span><strong><em>{messageSource} · {messageType}</em>{title}</strong><p>{content}</p><small className="message-attachment"><ClipboardTask24Regular/>{attachment}</small></span><ArrowRight24Regular/></button>; }) : <div className="message-empty"><Chat24Regular/><p>没有符合条件的消息。</p></div>}</div><MessageAttachmentDialog key={selectedMessage?.id} message={selectedMessage} onClose={() => setSelectedMessage(null)}/></section>;
}

function TaskListPage({ onAction, onReturn, onOpenDetail }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const openTaskForm = (task) => setSelectedTask({ ...task, title: task.name, content: `任务由 ${task.initiator} 发起，计划执行时间为 ${task.plannedAt}。`, formKind: 'task' });
  return <section className="task-list-page" aria-labelledby="task-list-title"><div className="task-page-path"><button onClick={onReturn}>工作台</button><ChevronRight24Regular/><strong>任务</strong></div><header className="task-list-header"><div><p>任务中心</p><h1 id="task-list-title">任务列表</h1></div><button onClick={() => onAction('新建任务')}><Add24Regular/>新建任务</button></header><div className="task-list-table" role="table" aria-label="任务列表"><div className="task-table-head" role="row"><span>任务名称</span><span>发布时间</span><span>计划执行时间</span><span>计划结束时间</span><span>发起人</span><span>执行人</span><span>任务表附件</span><span>操作</span></div>{taskEntries.map((task) => <div className="task-table-row" role="row" key={task.id}><strong><button className="task-name-link" onClick={() => onOpenDetail(task)}>{task.name}</button><i className={task.status === '执行中' ? 'in-progress' : ''}>{task.status}</i></strong><span>{task.publishedAt}</span><span>{task.plannedAt}</span><span>{task.deadline}</span><span>{task.initiator}</span><span>{task.executor}</span><button className="task-attachment" onClick={() => openTaskForm(task)}><DocumentText24Regular/>{task.attachment}</button><span className="task-row-actions"><button className="task-execute" onClick={() => openTaskForm(task)}>执行</button><button className="task-more" onClick={() => onAction(`${task.name}操作`)}>操作</button></span></div>)}</div><MessageAttachmentDialog key={selectedTask?.id} message={selectedTask} onClose={() => setSelectedTask(null)}/></section>;
}

function TaskDetailPage({ task, onBack }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([{ id: 'comment-initial', author: '陈伟', time: '今天 09:06', content: '请在完成现场点检后同步复核结果。' }]);
  const logs = [{ time: task.publishedAt, title: '任务已发布', content: `${task.initiator} 发起了此项任务。` }, { time: task.plannedAt, title: '任务已进入执行阶段', content: `${task.executor} 已收到执行提醒。` }, { time: '今天 10:12', title: '任务进度已更新', content: '现场点检完成，等待复核确认。' }];
  const openTaskForm = () => setSelectedTask({ ...task, title: task.name, content: `任务由 ${task.initiator} 发起，计划执行时间为 ${task.plannedAt}。`, formKind: 'task' });
  const submitComment = (event) => { event.preventDefault(); const text = comment.trim(); if (!text) return; setComments((current) => [...current, { id: `comment-${Date.now()}`, author: '张宇', time: '刚刚', content: text }]); setComment(''); };
  return <section className="task-detail-page" aria-labelledby="task-detail-title"><div className="task-page-path"><button onClick={onBack}>任务列表</button><ChevronRight24Regular/><strong>{task.name}</strong></div><header className="task-detail-header"><div><p>任务详情</p><h1 id="task-detail-title">{task.name}</h1><span className={task.status === '执行中' ? 'detail-status in-progress' : 'detail-status'}>{task.status}</span></div><button onClick={openTaskForm}><ClipboardTask24Regular/>执行任务</button></header><div className="task-detail-layout"><div><section className="task-detail-section"><h2>任务主要信息</h2><div className="task-info-grid"><span><b>发布时间</b>{task.publishedAt}</span><span><b>计划执行时间</b>{task.plannedAt}</span><span><b>计划结束时间</b>{task.deadline}</span><span><b>发起人</b>{task.initiator}</span><span><b>执行人</b>{task.executor}</span><span><b>任务状态</b>{task.status}</span></div></section><section className="task-detail-section"><h2>任务附件表单</h2><button className="task-detail-attachment" onClick={openTaskForm}><span><DocumentText24Regular/></span><span><b>{task.attachment}</b><small>点击查看并填写任务表单</small></span><ArrowRight24Regular/></button></section><section className="task-detail-section task-comment-section"><h2>评论任务</h2><form onSubmit={submitComment}><textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="3" placeholder="输入评论内容，通知任务相关人员" /><footer><span>评论将同步显示在任务日志中。</span><button type="submit">发送评论</button></footer></form><div className="task-comment-list">{comments.map((item) => <article key={item.id}><span>{item.author.slice(0, 1)}</span><div><b>{item.author}<time>{item.time}</time></b><p>{item.content}</p></div></article>)}</div></section></div><aside className="task-log-panel"><h2>任务日志</h2><ol>{logs.map((log) => <li key={log.time}><time>{log.time}</time><span /><div><b>{log.title}</b><p>{log.content}</p></div></li>)}</ol></aside></div><MessageAttachmentDialog key={selectedTask?.id} message={selectedTask} onClose={() => setSelectedTask(null)}/></section>;
}

function ProcessApprovalDialog({ process, onClose, onApprove }) {
  if (!process) return null;
  const logs = [
    { time: process.initiatedAt, title: '流程已发起', detail: `${process.initiator} 提交了${process.name}。`, state: 'done' },
    { time: '今天 09:25', title: '资料完整性校验通过', detail: '系统已完成表单与附件校验。', state: 'done' },
    { time: '当前', title: process.currentNode, detail: `等待 ${process.approver} 审批。`, state: 'current' },
  ];
  const nodes = ['发起申请', '部门负责人', '安全审核', '归档完成'];
  return <div className="process-dialog-layer" onMouseDown={onClose} role="presentation"><section className="process-dialog" role="dialog" aria-modal="true" aria-labelledby="process-dialog-title" onMouseDown={(event) => event.stopPropagation()}><header><div><p>流程审批</p><h2 id="process-dialog-title">{process.name}</h2><span className={process.status === '待审批' ? 'process-status pending' : 'process-status'}>{process.status}</span></div><button className="process-dialog-close" aria-label="关闭流程审批" onClick={onClose}><DismissRegular/></button></header><div className="process-dialog-body"><section className="process-dialog-section"><h3>流程关键信息</h3><div className="process-info-grid"><span><b>发起人</b>{process.initiator}</span><span><b>发起时间</b>{process.initiatedAt}</span><span><b>所属部门</b>{process.department}</span><span><b>当前节点</b>{process.currentNode}</span><span><b>审批人</b>{process.approver}</span><span><b>申请金额</b>{process.amount}</span></div></section><section className="process-dialog-section"><h3>审批流程图</h3><div className="process-flowchart" aria-label="审批流程图">{nodes.map((node, index) => <div key={node} className={index < 2 ? 'flow-node done' : index === 2 ? 'flow-node active' : 'flow-node'}><span>{index + 1}</span><b>{node}</b>{index < nodes.length - 1 ? <i /> : null}</div>)}</div></section><section className="process-dialog-section process-log-section"><h3>审批日志</h3><ol>{logs.map((log) => <li key={log.title}><time>{log.time}</time><span className={log.state} /><div><b>{log.title}</b><p>{log.detail}</p></div></li>)}</ol></section></div><footer><span>审批意见将同步写入流程日志。</span><div><button className="process-reject" onClick={() => onApprove('已退回')}>退回</button><button className="process-approve" onClick={() => onApprove('已同意')}><CheckmarkCircle24Regular/>同意并提交</button></div></footer></section></div>;
}

function ProcessListPage({ onReturn, onAction }) {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const approve = (result) => { onAction(`${selectedProcess.name}${result}`); setSelectedProcess(null); };
  return <section className="process-list-page" aria-labelledby="process-list-title"><div className="task-page-path"><button onClick={onReturn}>工作台</button><ChevronRight24Regular/><strong>流程</strong></div><header className="task-list-header"><div><p>流程中心</p><h1 id="process-list-title">流程列表</h1></div><button onClick={() => onAction('发起流程')}><Add24Regular/>发起流程</button></header><div className="process-list-table" role="table" aria-label="流程列表"><div className="process-table-head" role="row"><span>流程名称</span><span>发起人</span><span>发起时间</span><span>当前节点</span><span>当前审批人</span><span>状态</span><span>操作</span></div>{processEntries.map((process) => <div className="process-table-row" role="row" key={process.id}><button className="process-name-link" onClick={() => setSelectedProcess(process)}>{process.name}<small>{process.urgency === '紧急' ? '紧急处理' : '业务审批'}</small></button><span>{process.initiator}</span><span>{process.initiatedAt}</span><strong>{process.currentNode}</strong><span>{process.approver}</span><i className={process.status === '待审批' ? 'pending' : ''}>{process.status}</i><button className="process-approval-action" onClick={() => setSelectedProcess(process)}><ApprovalsApp24Regular/>审批</button></div>)}</div><ProcessApprovalDialog process={selectedProcess} onClose={() => setSelectedProcess(null)} onApprove={approve}/></section>;
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
  const [messages, setMessages] = useState(messageEntries);
  const [taskDetail, setTaskDetail] = useState(null);
  const showNotice = (label) => { setNotice(`已选择 ${label}`); window.setTimeout(() => setNotice(''), 2200); };
  const selectTab = (id) => { window.scrollTo({ top: 0, behavior: 'smooth' }); startTransition(() => { setActiveTab(id); setActiveNav(id === 'workbench' || id === 'messages' ? '工作台' : id === 'tasks' ? '任务' : id === 'processes' ? '流程' : '应用中心'); }); };
  const openApplication = (name) => {
    const targetName = name === '应用中心' ? '双重预防机制' : name;
    const app = apps.find((item) => item.name === targetName);
    if (!app) { showNotice(name); return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    startTransition(() => { setOpenTabs((current) => current.some((tab) => tab.id === targetName) ? current : [...current, { id: targetName, label: targetName, icon: app.icon }]); setActiveTab(targetName); setActiveNav('应用中心'); });
  };
  const openMessages = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); startTransition(() => { setOpenTabs((current) => current.some((tab) => tab.id === 'messages') ? current : [...current, { id: 'messages', label: '消息', icon: Chat24Regular }]); setActiveTab('messages'); setActiveNav('工作台'); }); };
  const openTasks = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); startTransition(() => { setTaskDetail(null); setOpenTabs((current) => current.some((tab) => tab.id === 'tasks') ? current : [...current, { id: 'tasks', label: '任务', icon: ClipboardTask24Regular }]); setActiveTab('tasks'); setActiveNav('任务'); }); };
  const openProcesses = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); startTransition(() => { setOpenTabs((current) => current.some((tab) => tab.id === 'processes') ? current : [...current, { id: 'processes', label: '流程', icon: Flowchart24Regular }]); setActiveTab('processes'); setActiveNav('流程'); }); };
  const markMessageRead = (id) => setMessages((current) => current.map((message) => message.id === id ? { ...message, read: true } : message));
  const markAllMessagesRead = () => setMessages((current) => current.map((message) => ({ ...message, read: true })));
  const closeTab = (id) => {
    const closingIndex = openTabs.findIndex((tab) => tab.id === id);
    const remainingTabs = openTabs.filter((tab) => tab.id !== id);
    startTransition(() => { setOpenTabs(remainingTabs); if (activeTab === id) { const fallback = remainingTabs[Math.max(0, closingIndex - 1)] ?? initialTabs[0]; setActiveTab(fallback.id); setActiveNav(fallback.id === 'workbench' ? '工作台' : '应用中心'); } });
  };
  const activeApplication = apps.find((app) => app.name === activeTab);
  return <FluentProvider theme={webLightTheme}><div className="workbench theme-light">
    <AppNav active={activeNav} onChange={(label) => { if (label === '工作台') { selectTab('workbench'); return; } if (label === '应用中心') { openApplication('应用中心'); return; } if (label === '任务') { openTasks(); return; } if (label === '流程') { openProcesses(); return; } setActiveNav(label); showNotice(label); }}/>
    <div className="page-shell"><ApplicationTabs tabs={openTabs} activeTab={activeTab} onSelect={selectTab} onClose={closeTab} onOpenMessages={openMessages}/>
      <main>{activeTab === 'messages' ? <MessageCenter messages={messages} onMarkRead={markMessageRead} onMarkAllRead={markAllMessagesRead} onReturn={() => selectTab('workbench')}/> : activeTab === 'tasks' ? taskDetail ? <TaskDetailPage task={taskDetail} onBack={() => setTaskDetail(null)}/> : <TaskListPage onAction={showNotice} onReturn={() => selectTab('workbench')} onOpenDetail={setTaskDetail}/> : activeTab === 'processes' ? <ProcessListPage onAction={showNotice} onReturn={() => selectTab('workbench')}/> : activeApplication?.name === '双重预防机制' ? <DualPreventionPage onReturn={() => selectTab('workbench')} onAction={showNotice} onSwitchApplication={openApplication}/> : activeApplication ? <MockApplicationPage app={activeApplication} onReturn={() => selectTab('workbench')} onAction={showNotice} onSwitchApplication={openApplication}/> : <div className="main-layout"><div className="primary-column"><section className="priority-zone" aria-labelledby="priority-title"><div className="section-title priority-title"><div><h2 id="priority-title">今日待办</h2></div><button className="quiet-action" onClick={() => showNotice('任务总览')}>任务总览 <ArrowRight24Regular/></button></div><div className="queue-grid">{workQueues.map((item) => <WorkQueue item={item} key={item.id} active={activeQueue === item.id} onSelect={() => setActiveQueue(item.id)}/>)}</div></section><RecentApps onOpen={openApplication}/><ApplicationRail onOpen={openApplication}/></div>
          <div className="secondary-column"><CommandPanel onAction={setDialog}/><ActivityFeed selectedTab={activityTab} onSelectTab={setActivityTab} onOpen={showNotice}/></div></div>}</main></div>
    {notice ? <div className="toast" role="status" aria-label={notice}><CheckmarkCircle24Regular/>{notice}</div> : null}<ActionDialog title={dialog} onClose={() => setDialog(null)}/>
  </div></FluentProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
