import { startTransition, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { init, use } from "echarts/core";
import { BarChart, LineChart, PieChart, RadarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
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
  Delete24Regular,
  DocumentText24Regular,
  DismissRegular,
  Eye24Regular,
  EyeOff24Regular,
  ErrorCircle24Regular,
  Edit24Regular,
  Fire24Regular,
  Flash24Regular,
  Flowchart24Regular,
  Home24Regular,
  Lightbulb24Regular,
  LineHorizontal320Regular,
  People24Regular,
  PersonClock24Regular,
  ReOrderDotsVertical24Regular,
  Settings24Regular,
  ShieldCheckmark24Regular,
  Toolbox24Regular,
  Wrench24Regular,
} from "@fluentui/react-icons";
import "./styles.css";
import "./settings.css";
import "./dashboard.css";
import "./nav.css";
import "./safety-dynamics.css";
import "./todo-overview.css";
import "./workbench-redesign.css";
import "./organization-center.css";
import "./user-management.css";
import "./login.css";
import "./enterprise-settings.css";
import lowCodePrototypeHtml from "../xiaodong/新低代码.html?raw";
import newTaskPrototypeHtml from "../xiaodong/新任务.html?raw";

const FLOW_CATEGORY_DICTIONARY_OPTIONS = [
  "人事管理",
  "财务管理",
  "安全管理",
  "生产管理",
  "设备管理",
  "综合管理",
];

const PROTOTYPE_ANNOTATIONS_URL = `${import.meta.env.BASE_URL}prototype-annotations.json`;

function getAnnotationsFromPayload(payload) {
  const annotations = Array.isArray(payload) ? payload : payload?.annotations;
  return Array.isArray(annotations) ? annotations : [];
}

use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const navigation = [
  { label: "工作台", icon: Home24Regular },
  { label: "应用", icon: Apps24Regular },
  { label: "任务", icon: ClipboardTask24Regular },
  { label: "流程", icon: Flowchart24Regular },
  { label: "动态", icon: ShieldCheckmark24Regular },
  { label: "预警", icon: ErrorCircle24Regular },
  { label: "看板", icon: DataBarVertical24Regular },
];

// Shared registry for system-level icon selection and future feature reuse.
const systemIconLibrary = [
  { id: "home", label: "首页", icon: Home24Regular },
  { id: "apps", label: "应用", icon: Apps24Regular },
  { id: "shield", label: "安全防护", icon: ShieldCheckmark24Regular },
  { id: "task", label: "任务", icon: ClipboardTask24Regular },
  { id: "flow", label: "流程", icon: Flowchart24Regular },
  { id: "warning", label: "预警", icon: ErrorCircle24Regular },
  { id: "message", label: "消息", icon: Chat24Regular },
  { id: "equipment", label: "设备", icon: Wrench24Regular },
  { id: "production", label: "生产", icon: Toolbox24Regular },
  { id: "fire", label: "消防", icon: Fire24Regular },
  { id: "explosive", label: "火工品", icon: Flash24Regular },
  { id: "document", label: "表单", icon: DocumentText24Regular },
  { id: "dashboard", label: "看板", icon: DataBarVertical24Regular },
  { id: "approval", label: "审批", icon: ApprovalsApp24Regular },
  { id: "briefcase", label: "工作", icon: Briefcase24Regular },
  { id: "calendar", label: "日程", icon: CalendarLtr24Regular },
  { id: "check", label: "完成", icon: CheckmarkCircle24Regular },
  { id: "people", label: "人员", icon: People24Regular },
  { id: "person-clock", label: "值班", icon: PersonClock24Regular },
  { id: "settings", label: "设置", icon: Settings24Regular },
  { id: "sort", label: "排序", icon: ReOrderDotsVertical24Regular },
  { id: "idea", label: "提示", icon: Lightbulb24Regular },
  { id: "edit", label: "编辑", icon: Edit24Regular },
  { id: "delete", label: "删除", icon: Delete24Regular },
  { id: "arrow", label: "前往", icon: ArrowRight24Regular },
];

function SystemIcon({ name = "apps", className }) {
  const Icon = systemIconLibrary.find((item) => item.id === name)?.icon ?? Apps24Regular;
  return <Icon className={className} aria-hidden="true" />;
}

const prototypeBase = `${import.meta.env.BASE_URL}xiaodong/`;

const workQueues = [
  {
    id: "message",
    title: "未读消息",
    count: 12,
    note: "3 条需要你确认",
    icon: Chat24Regular,
    accent: "blue",
    items: [
      "请确认 7 月安全例会纪要",
      "在设备点检单中提及了你",
      "新增一条隐患整改提醒",
    ],
  },
  {
    id: "task",
    title: "待办任务",
    count: 4,
    note: "2 项今天到期",
    icon: ClipboardTask24Regular,
    accent: "orange",
    items: [
      "完成 3 号球磨机点检复核",
      "提交第二季度风险排查记录",
      "补充 7 月生产日报说明",
    ],
  },
  {
    id: "approval",
    title: "待批流程",
    count: 3,
    note: "1 项等待超 24 小时",
    icon: ApprovalsApp24Regular,
    accent: "teal",
    items: [
      "矿山应急照明设备采购申请",
      "南区 2# 采场动火作业申请",
      "碎矿车间停机检修计划",
    ],
  },
  {
    id: "warning",
    title: "待处理预警",
    count: 5,
    note: "2 项高风险待处置",
    icon: ErrorCircle24Regular,
    accent: "red",
    items: [
      "南区排水泵房温度异常预警",
      "3 号提升机运行参数超限",
      "尾矿库在线监测数据待核查",
    ],
  },
];

const apps = [
  {
    name: "双重预防机制",
    description: "风险与隐患",
    icon: ShieldCheckmark24Regular,
  },
  { name: "安全管理", description: "检查与整改", icon: ErrorCircle24Regular },
  { name: "设备管理", description: "点检与维修", icon: Wrench24Regular },
  { name: "火工品管理", description: "领用与追溯", icon: Flash24Regular },
  { name: "生产管理", description: "计划与日报", icon: Toolbox24Regular },
  { name: "机电管理", description: "运行与保全", icon: Briefcase24Regular },
  { name: "消防管理", description: "巡检与演练", icon: Fire24Regular },
  { name: "应急管理", description: "预案与响应", icon: Lightbulb24Regular },
];

const managedRoleOptions = ["系统管理员", "安全管理员", "任务执行人", "数据查看员"];
const managedPositionOptions = ["安全管理员", "设备工程师", "生产主管"];

const initialTabs = [
  { id: "workbench", label: "工作台", icon: Home24Regular, pinned: true },
];

const messageEntries = [
  {
    id: "msg-1",
    source: "任务",
    type: "执行提醒",
    sender: "陈伟",
    time: "今天 10:12",
    title: "完成设备点检复核",
    content: "3 号球磨机点检任务已完成，请确认复核结果。",
    attachment: "任务表单",
    formKind: "task",
    read: false,
    icon: ClipboardTask24Regular,
    tone: "blue",
  },
  {
    id: "msg-2",
    source: "流程",
    type: "待你审批",
    sender: "系统通知",
    time: "今天 09:38",
    title: "矿山应急照明设备采购申请",
    content: "该流程已流转至你，请在今天内完成审批。",
    attachment: "审批流表单",
    formKind: "approval",
    read: false,
    icon: ApprovalsApp24Regular,
    tone: "orange",
  },
  {
    id: "msg-3",
    source: "预警",
    type: "超期提醒",
    sender: "安环部",
    time: "昨天 16:45",
    title: "南区排水泵隐患整改复查",
    content: "整改期限临近，请及时查看现场复查情况。",
    attachment: "预警处置表单",
    formKind: "warning",
    read: false,
    icon: ErrorCircle24Regular,
    tone: "red",
  },
  {
    id: "msg-4",
    source: "任务",
    type: "任务分派",
    sender: "李明",
    time: "昨天 14:20",
    title: "平巷凿岩作业隐患排查任务",
    content: "你已被添加为执行人，请按要求完成岗位检查。",
    attachment: "任务表单",
    formKind: "task",
    read: false,
    icon: ShieldCheckmark24Regular,
    tone: "green",
  },
  {
    id: "msg-5",
    source: "系统",
    type: "系统通知",
    sender: "系统通知",
    time: "7 月 28 日 09:16",
    title: "生产日报已同步完成",
    content: "南区生产日报数据已归档，可进入生产管理查看。",
    attachment: "系统通知",
    formKind: "system",
    read: true,
    icon: CheckmarkCircle24Regular,
    tone: "blue",
  },
];

const taskEntries = [
  {
    id: "task-1",
    name: "完成设备点检复核",
    publishedAt: "今天 08:30",
    plannedAt: "今天 10:00",
    deadline: "今天 17:30",
    initiator: "陈伟",
    executor: "张宇",
    status: "待执行",
    attachment: "设备点检任务表",
  },
  {
    id: "task-2",
    name: "平巷凿岩作业隐患排查",
    publishedAt: "昨天 16:20",
    plannedAt: "今天 09:00",
    deadline: "今天 16:00",
    initiator: "李明",
    executor: "张宇",
    status: "执行中",
    attachment: "岗位隐患排查表",
  },
  {
    id: "task-3",
    name: "南区排水泵巡检",
    publishedAt: "昨天 14:10",
    plannedAt: "今天 13:30",
    deadline: "明天 10:00",
    initiator: "设备管理部",
    executor: "张宇",
    status: "待执行",
    attachment: "设备巡检记录表",
  },
  {
    id: "task-4",
    name: "提交第二季度风险排查记录",
    publishedAt: "7 月 28 日 11:05",
    plannedAt: "7 月 30 日 09:00",
    deadline: "7 月 30 日 18:00",
    initiator: "安环部",
    executor: "张宇",
    status: "待执行",
    attachment: "风险排查记录表",
  },
];

const FLOW_NUMBER_REFERENCE_DATE = "20260831";

function getFlowDatePart(initiatedAt = "") {
  const dateTimeMatch = String(initiatedAt).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dateTimeMatch) {
    return `${dateTimeMatch[1]}${dateTimeMatch[2].padStart(2, "0")}${dateTimeMatch[3].padStart(2, "0")}`;
  }
  const monthDayMatch = String(initiatedAt).match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (monthDayMatch) {
    return `2026${monthDayMatch[1].padStart(2, "0")}${monthDayMatch[2].padStart(2, "0")}`;
  }
  if (String(initiatedAt).includes("昨天")) return "20260830";
  return FLOW_NUMBER_REFERENCE_DATE;
}

function getFlowNumber(process) {
  const source = String(process.id ?? "");
  const sequenceFromId = Number(source.match(/(\d+)(?!.*\d)/)?.[1]);
  const sequence = Number(process.sequence) || (sequenceFromId % 9999) || 1;
  return `${getFlowDatePart(process.initiatedAt)}${String(sequence).padStart(4, "0")}`;
}

const processEntries = [
  {
    id: "flow-1",
    name: "矿山应急照明设备采购申请",
    initiator: "王建国",
    initiatedAt: "今天 09:12",
    currentNode: "部门负责人审批",
    approver: "张宇",
    status: "审批中",
    application: "设备管理",
    amount: "86,500 元",
    department: "机电管理部",
    urgency: "常规",
  },
  {
    id: "flow-2",
    name: "南区 2# 采场动火作业申请",
    initiator: "张宇",
    initiatedAt: "今天 08:46",
    currentNode: "安全管理部审批",
    approver: "李四",
    status: "已驳回",
    application: "安全管理",
    amount: "不涉及",
    department: "生产管理部",
    urgency: "紧急",
    startedByMe: true,
  },
  {
    id: "flow-3",
    name: "碎矿车间停机检修计划",
    initiator: "赵磊",
    initiatedAt: "昨天 15:28",
    currentNode: "流程已结束",
    approver: "刘海",
    status: "已通过",
    amount: "128,000 元",
    department: "设备管理部",
    urgency: "常规",
    handledByMe: true,
    handledResult: "同意",
  },
  {
    id: "flow-4",
    name: "外协队入场资格审核",
    initiator: "周敏",
    initiatedAt: "昨天 10:20",
    currentNode: "安环部备案",
    approver: "孙宁",
    status: "审批中",
    amount: "不涉及",
    department: "安全管理部",
    urgency: "常规",
    ccToMe: true,
    startedByMe: true,
  },
  {
    id: "flow-5",
    name: "东区临时用电申请",
    initiator: "陈伟",
    initiatedAt: "昨天 11:16",
    currentNode: "流程已结束",
    approver: "张宇",
    status: "已拒绝",
    application: "安全管理",
    amount: "不涉及",
    department: "生产管理部",
    urgency: "常规",
    handledByMe: true,
    handledResult: "驳回",
  },
  {
    id: "flow-6",
    name: "井下设备检修采购申请",
    initiator: "刘海",
    initiatedAt: "8 月 26 日 16:42",
    currentNode: "流程已撤销",
    approver: "张宇",
    status: "已撤销",
    application: "设备管理",
    amount: "42,800 元",
    department: "机电管理部",
    urgency: "常规",
    handledByMe: true,
    handledResult: "同意",
    revokedBy: "刘海",
    revokedAt: "2026-08-26 17:08:00",
  },
  {
    id: "flow-7",
    name: "高处作业审批申请",
    initiator: "孙宁",
    initiatedAt: "8 月 25 日 09:34",
    currentNode: "分管领导审批",
    approver: "张宇",
    status: "已驳回",
    application: "双重预防机制",
    amount: "不涉及",
    department: "安全管理部",
    urgency: "紧急",
    handledByMe: true,
    handledResult: "驳回",
  },
  {
    id: "flow-8",
    name: "井下通风设施改造申请",
    initiator: "李明",
    initiatedAt: "8 月 27 日 14:18",
    currentNode: "流程已结束",
    approver: "陈伟",
    status: "已通过",
    application: "应急管理",
    amount: "26,000 元",
    department: "安全管理部",
    urgency: "常规",
    ccToMe: true,
    finalOperator: "陈伟",
  },
  {
    id: "flow-9",
    name: "采场临时封闭申请",
    initiator: "王强",
    initiatedAt: "8 月 27 日 10:05",
    currentNode: "流程已结束",
    approver: "赵磊",
    status: "已拒绝",
    application: "安全管理",
    amount: "不涉及",
    department: "生产管理部",
    urgency: "紧急",
    ccToMe: true,
    finalOperator: "赵磊",
  },
  {
    id: "flow-10",
    name: "消防器材增补采购申请",
    initiator: "周敏",
    initiatedAt: "8 月 26 日 13:26",
    currentNode: "流程已撤销",
    approver: "孙宁",
    status: "已撤销",
    application: "消防管理",
    amount: "18,600 元",
    department: "综合管理部",
    urgency: "常规",
    ccToMe: true,
    revokedBy: "周敏",
    revokedAt: "2026-08-26 15:20:00",
  },
  {
    id: "flow-11",
    name: "爆破作业人员调整申请",
    initiator: "何勇",
    initiatedAt: "8 月 25 日 16:50",
    currentNode: "分管领导审批",
    approver: "周杰伦",
    status: "已驳回",
    application: "火工品管理",
    amount: "不涉及",
    department: "生产管理部",
    urgency: "常规",
    ccToMe: true,
    rejectedBy: "周杰伦",
  },
  {
    id: "flow-draft-1",
    name: "员工离职申请",
    initiator: "张宇",
    initiatedAt: "2026-08-28 10:36:00",
    currentNode: "待提交",
    status: "草稿",
    department: "安全管理部",
    description: "已完成离职原因与交接安排说明，待补充附件后提交。",
    draft: true,
  },
  {
    id: "flow-draft-2",
    name: "员工离职申请",
    initiator: "张宇",
    initiatedAt: "2026-08-27 16:18:00",
    currentNode: "待提交",
    status: "草稿",
    department: "安全管理部",
    description: "已填写基本离职信息，待确认最后工作日期。",
    draft: true,
  },
];

const processTransferOrganizations = [
  {
    id: "group",
    name: "华北矿业集团",
    children: [
      {
        id: "mine",
        name: "矿山事业部",
        children: [
          { id: "safety", name: "安全管理部", children: [] },
          { id: "equipment", name: "设备管理部", children: [] },
          { id: "production", name: "生产技术部", children: [] },
        ],
      },
    ],
  },
];

const processTransferUsers = [
  { id: "transfer-zhao", name: "赵六", account: "zhaoliu", department: "安全管理部", organizationId: "safety" },
  { id: "transfer-wang", name: "王五", account: "wangwu", department: "生产技术部", organizationId: "production" },
  { id: "transfer-li", name: "李四", account: "lisi", department: "设备管理部", organizationId: "equipment" },
];

const recentApps = [
  {
    name: "平巷凿岩作业岗位隐患排查表",
    time: "今天 10:26",
    icon: ShieldCheckmark24Regular,
    tone: "green",
  },
  {
    name: "平巷凿岩作业隐患排查审批流程",
    time: "昨天 16:40",
    icon: ApprovalsApp24Regular,
    tone: "blue",
  },
  {
    name: "生产管理",
    time: "7 月 25 日",
    icon: Toolbox24Regular,
    tone: "blue",
  },
  {
    name: "双重预防机制",
    time: "7 月 24 日",
    icon: ShieldCheckmark24Regular,
    tone: "violet",
  },
];

const feedItems = [
  {
    tab: "待我处理",
    person: "陈伟",
    tone: "blue",
    avatar: "陈",
    headline: "在设备保养计划中提及了你",
    detail: "请协助确认 2# 渣浆泵更换备件的到货日期。",
    time: "12 分钟前",
    icon: PersonClock24Regular,
  },
  {
    tab: "流程提醒",
    person: "系统通知",
    tone: "green",
    avatar: "系",
    headline: "外协队入场审批已通过",
    detail: "流程已归档，可查看审批意见与附件。",
    time: "45 分钟前",
    icon: CheckmarkCircle24Regular,
  },
  {
    tab: "待我处理",
    person: "安环部",
    tone: "orange",
    avatar: "安",
    headline: "向你分派了隐患整改复查",
    detail: "整改期限为 7 月 30 日，请及时跟进。",
    time: "今天 09:16",
    icon: ClipboardTask24Regular,
  },
  {
    tab: "业务动态",
    person: "李明",
    tone: "violet",
    avatar: "李",
    headline: "更新了南区排水泵巡检记录",
    detail: "本次数据已同步到设备管理台账。",
    time: "昨天 16:50",
    icon: Wrench24Regular,
  },
];

function IconButton({ label, children, active, onClick, badge }) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
      {badge ? <span className="semantic-badge" /> : null}
    </button>
  );
}

function AppNav({ active, onChange, onOpenSettings, brandLogo }) {
  return (
    <aside className="app-nav" aria-label="主导航">
      <div className="product-mark" aria-label="澄明工作台">
        {brandLogo ? <img src={brandLogo} alt="企业 Logo" /> : "C"}
      </div>
      <nav>
        {navigation.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => onChange(label)}
            className={active === label ? "nav-link active" : "nav-link"}
          >
            <span className="nav-icon">
              <Icon />
            </span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="nav-bottom">
        <IconButton
          label="设置"
          active={active === "设置"}
          onClick={() => onOpenSettings()}
        >
          <Settings24Regular />
        </IconButton>
      </div>
    </aside>
  );
}

function ApplicationTabs({
  tabs,
  activeTab,
  onSelect,
  onClose,
  onOpenMessages,
  onOpenPersonal,
  onLogout,
  annotationVisible,
  onToggleAnnotations,
  annotationManaging,
  onToggleAnnotationManager,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const closeProfileMenu = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", closeProfileMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeProfileMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  return (
    <header className="application-tabs" aria-label="应用页签">
      <div className="tabs-scroll" role="tablist" aria-label="已打开应用">
        {tabs.map(({ id, label, icon: Icon, pinned }) => (
          <div
            className={
              activeTab === id ? "application-tab active" : "application-tab"
            }
            key={id}
          >
            <button
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => onSelect(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
            {!pinned ? (
              <button
                className="close-tab"
                aria-label={`关闭 ${label}`}
                onClick={() => onClose(id)}
              >
                <DismissRegular />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="topbar-actions">
        <button
          type="button"
          className={annotationVisible ? "prototype-annotation-toggle active" : "prototype-annotation-toggle"}
          aria-pressed={annotationVisible}
          onClick={onToggleAnnotations}
        >
          <Edit24Regular />
          <span>标注</span>
        </button>
        <button
          type="button"
          className={annotationManaging ? "prototype-annotation-manager active" : "prototype-annotation-manager"}
          aria-pressed={annotationManaging}
          onClick={onToggleAnnotationManager}
        >
          <Edit24Regular />
          <span>管理</span>
        </button>
        <button
          className="message-entry"
          aria-label="消息中心，有 4 条未读消息"
          onClick={onOpenMessages}
        >
          <Chat24Regular />
          <span>消息</span>
          <i className="message-dot" aria-hidden="true" />
        </button>
        <div className="top-profile-control" ref={profileMenuRef}>
          <button
            className="top-profile-avatar"
            aria-label="用户菜单"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((current) => !current)}
          >
            张
          </button>
          {profileOpen ? (
            <div className="top-profile-menu" role="menu" aria-label="用户菜单">
              <button
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  onOpenPersonal();
                }}
              >
                个人中心
              </button>
              <button
                className="top-profile-logout"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
              >
                退出登录
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function PrototypeAnnotations({
  visible,
  managing,
  pageId,
  pageLabel,
  annotations,
  onCloseManager,
  onAdd,
  onUpdate,
  onRemove,
  onReposition,
}) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [placing, setPlacing] = useState(false);
  const [relocatingId, setRelocatingId] = useState("");
  const [dragging, setDragging] = useState(null);
  const suppressTagClickRef = useRef(false);
  const pageAnnotations = annotations.filter((annotation) => annotation.pageId === pageId);
  const selectedAnnotation = pageAnnotations.find((annotation) => annotation.id === selectedId);

  useEffect(() => {
    if (!dragging) return undefined;

    const moveTag = (event) => {
      const left = Math.min(
        Math.max(12, Math.round(event.clientX - dragging.offsetX)),
        window.innerWidth - 37,
      );
      const top = Math.min(
        Math.max(64, Math.round(event.clientY - dragging.offsetY)),
        window.innerHeight - 37,
      );
      if (Math.abs(left - dragging.startLeft) > 3 || Math.abs(top - dragging.startTop) > 3) {
        suppressTagClickRef.current = true;
      }
      setDragging((current) => (current ? { ...current, left, top } : current));
    };
    const finishDrag = () => {
      onReposition(dragging.id, { left: dragging.left, top: dragging.top });
      setDragging(null);
    };

    window.addEventListener("mousemove", moveTag);
    window.addEventListener("mouseup", finishDrag, { once: true });
    return () => {
      window.removeEventListener("mousemove", moveTag);
      window.removeEventListener("mouseup", finishDrag);
    };
  }, [dragging, onReposition]);

  const saveAnnotation = () => {
    const content = draft.trim();
    if (!content) return;
    if (editingId) {
      onUpdate(editingId, content);
      setDraft("");
      setEditingId("");
      return;
    }
    setPlacing(true);
  };
  const cancelPlacement = () => {
    setDraft("");
    setEditingId("");
    setRelocatingId("");
    setPlacing(false);
  };
  const placeAnnotation = (event) => {
    const position = { left: Math.round(event.clientX), top: Math.round(event.clientY) };
    if (relocatingId) onReposition(relocatingId, position);
    else onAdd({ pageId, pageLabel, content: draft.trim(), ...position });
    cancelPlacement();
  };

  return (
    <>
      {visible
        ? pageAnnotations.map((annotation, index) => (
            <button
              key={annotation.id}
              type="button"
              className="prototype-annotation-tag"
              style={{
                left: `${dragging?.id === annotation.id ? dragging.left : annotation.left ?? 980}px`,
                top: `${dragging?.id === annotation.id ? dragging.top : annotation.top ?? 156 + index * 42}px`,
              }}
              aria-label={`查看备注 ${index + 1}`}
              onMouseDown={(event) => {
                event.preventDefault();
                const left = annotation.left ?? 980;
                const top = annotation.top ?? 156 + index * 42;
                suppressTagClickRef.current = false;
                setDragging({
                  id: annotation.id,
                  left,
                  top,
                  startLeft: left,
                  startTop: top,
                  offsetX: event.clientX - left,
                  offsetY: event.clientY - top,
                });
              }}
              onClick={() => {
                if (suppressTagClickRef.current) {
                  suppressTagClickRef.current = false;
                  return;
                }
                setSelectedId(annotation.id);
              }}
            >
              {index + 1}
            </button>
          ))
        : null}
      {visible && selectedAnnotation ? (
        <section
          className="prototype-annotation-popover"
          style={{
            left: `${Math.min((selectedAnnotation.left ?? 980) + 32, window.innerWidth - 286)}px`,
            top: `${Math.min((selectedAnnotation.top ?? 156) + 30, window.innerHeight - 160)}px`,
          }}
          aria-label="备注内容"
        >
          <header>
            <span>备注内容</span>
            <button type="button" aria-label="关闭备注内容" onClick={() => setSelectedId("")}>
              <DismissRegular />
            </button>
          </header>
          <p>{selectedAnnotation.content}</p>
        </section>
      ) : null}
      {placing ? (
        <div className="prototype-annotation-placement-layer" onClick={placeAnnotation} role="presentation">
          <span>{relocatingId ? "请点击页面任意位置重新放置标签" : "请点击页面任意位置放置备注标签"}</span>
        </div>
      ) : null}
      {managing ? (
        <aside className="prototype-annotation-panel" aria-label="原型标注管理">
          <header>
            <div>
              <span>原型标注管理</span>
              <b>{pageLabel}</b>
            </div>
            <button type="button" aria-label="关闭标注管理" onClick={onCloseManager}>
              <DismissRegular />
            </button>
          </header>
          <div className="prototype-annotation-editor">
            <p className="prototype-annotation-source-note">
              标注从部署文件读取；在线调整仅用于当前预览。
            </p>
            <label htmlFor="prototype-annotation-content">{editingId ? "编辑备注" : "新增备注"}</label>
            <textarea
              id="prototype-annotation-content"
              value={draft}
              maxLength={240}
              placeholder="例如：此处提交后需校验审批人是否存在，并记录操作日志。"
              onChange={(event) => setDraft(event.target.value)}
            />
            <footer>
              {editingId || placing ? (
                <button type="button" className="prototype-annotation-cancel" onClick={cancelPlacement}>
                  {placing ? "取消放置" : "取消编辑"}
                </button>
              ) : null}
              <button type="button" className="prototype-annotation-save" onClick={saveAnnotation} disabled={!draft.trim()}>
                {editingId ? "保存备注" : "点击页面放置标签"}
              </button>
            </footer>
          </div>
          <div className="prototype-annotation-list">
            {pageAnnotations.length ? (
              pageAnnotations.map((annotation, index) => (
                <article key={annotation.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div className="prototype-annotation-entry">
                    <p>{annotation.content}</p>
                    <div>
                      <button
                        type="button"
                        aria-label="编辑备注"
                        onClick={() => {
                          setDraft(annotation.content);
                          setEditingId(annotation.id);
                          setPlacing(false);
                        }}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        aria-label="重新放置备注"
                        onClick={() => {
                          setRelocatingId(annotation.id);
                          setPlacing(true);
                        }}
                      >
                        重新放置
                      </button>
                      <button
                        type="button"
                        aria-label="删除备注"
                        onClick={() => {
                          if (selectedId === annotation.id) setSelectedId("");
                          onRemove(annotation.id);
                        }}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="prototype-annotation-empty">
                当前页面还没有备注，输入内容后即可在页面任意位置放置。
              </div>
            )}
          </div>
        </aside>
      ) : null}
    </>
  );
}

function MessageAttachmentDialog({ message, onClose }) {
  if (!message) return null;
  const kind = message.formKind;
  const labels = {
    task: "任务表单",
    approval: "审批流表单",
    warning: "预警处置表单",
    system: "消息详情",
  };
  return (
    <div
      className="message-dialog-layer"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        className="message-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="message-dialog-close"
          aria-label="关闭消息表单"
          onClick={onClose}
        >
          <DismissRegular />
        </button>
        <header>
          <span>{labels[kind]}</span>
          <h2 id="message-form-title">{message.title}</h2>
          <p>{message.content}</p>
        </header>
        {kind === "task" ? (
          <form>
            <div className="message-form-grid">
              <label>
                任务名称
                <input defaultValue={message.title} readOnly />
              </label>
              <label>
                执行人
                <input defaultValue="张宇" readOnly />
              </label>
              <label>
                截止时间
                <input type="date" defaultValue="2026-07-30" readOnly />
              </label>
              <label>
                任务状态
                <select defaultValue="已完成" disabled>
                  <option>待处理</option>
                  <option>处理中</option>
                  <option>已完成</option>
                </select>
              </label>
            </div>
            <label className="message-form-wide">
              执行说明
              <textarea
                rows="3"
                defaultValue="现场点检已完成，等待复核确认。"
                readOnly
              />
            </label>
            <footer>
              <button className="message-form-primary" type="button" onClick={onClose}>
                关闭
              </button>
            </footer>
          </form>
        ) : kind === "approval" ? (
          <form>
            <div className="approval-summary">
              <span>
                申请人<b>机电管理部</b>
              </span>
              <span>
                申请金额<b>￥28,600.00</b>
              </span>
              <span>
                当前节点<b>张宇审批</b>
              </span>
            </div>
            <label className="message-form-wide">
              审批意见
              <textarea
                rows="4"
                defaultValue="该审批流待处理，详情请查看流程中心。"
                readOnly
              />
            </label>
            <footer>
              <button className="message-form-primary" type="button" onClick={onClose}>
                关闭
              </button>
            </footer>
          </form>
        ) : kind === "warning" ? (
          <form>
            <div className="warning-summary">
              <span>
                <b>预警等级</b>
                <strong>重要</strong>
              </span>
              <span>
                <b>预警位置</b>南区排水泵房
              </span>
              <span>
                <b>触发时间</b>昨天 16:45
              </span>
            </div>
            <label className="message-form-wide">
              处置措施
              <textarea
                rows="4"
                defaultValue="现场预警信息待处置，详情请查看预警中心。"
                readOnly
              />
            </label>
            <footer>
              <button className="message-form-primary" type="button" onClick={onClose}>
                关闭
              </button>
            </footer>
          </form>
        ) : (
          <div className="message-submit-success">
            <CheckmarkCircle24Regular />
            <h3>消息已阅读</h3>
            <p>该消息不包含需要处理的业务表单。</p>
            <button onClick={onClose}>关闭</button>
          </div>
        )}
      </section>
    </div>
  );
}

function MessageCenter({ messages, onMarkRead, onMarkAllRead, onReturn }) {
  const [source, setSource] = useState("全部");
  const [status, setStatus] = useState("未读");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const filteredMessages = messages.filter(
    (message) =>
      (source === "全部" || message.source === source) &&
      (status === "全部" || (status === "未读" ? !message.read : message.read)),
  );
  const pageCount = Math.max(1, Math.ceil(filteredMessages.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageMessages = filteredMessages.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const unreadCount = messages.filter((message) => !message.read).length;
  return (
    <section className="message-center" aria-labelledby="message-center-title">
      <div className="message-path">
        <button onClick={onReturn}>工作台</button>
        <ChevronRight24Regular />
        <strong id="message-center-title">互动消息</strong>
      </div>
      <header className="message-header">
        <div>
          <p>消息中心</p>
          <h1>
            互动消息列表 <span>({unreadCount} 条未读)</span>
          </h1>
        </div>
        <button
          className="mark-all-read"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
        >
          <CheckmarkCircle24Regular />
          全部标为已读
        </button>
      </header>
      <div className="message-filters" aria-label="消息筛选">
        <label>
          消息来源
          <select
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setPage(1);
            }}
          >
            <option>全部</option>
            <option>任务</option>
            <option>流程</option>
            <option>预警</option>
            <option>系统</option>
          </select>
        </label>
        <label>
          消息状态
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option>未读</option>
            <option>已读</option>
            <option>全部</option>
          </select>
        </label>
      </div>
      <div className="message-list">
        {pageMessages.length ? (
          pageMessages.map((message) => {
            const {
              id,
              source: messageSource,
              type: messageType,
              sender,
              time,
              title,
              content,
              attachment,
              read,
              icon: Icon,
              tone,
            } = message;
            return (
              <button
                className={read ? "message-row read" : "message-row"}
                key={id}
                onClick={() => {
                  onMarkRead(id);
                  setSelectedMessage(message);
                }}
              >
                <span className={`message-row-icon ${tone}`}>
                  <Icon />
                </span>
                <span className="message-row-content">
                  <span>
                    <b>{sender}</b>
                    <time>{time}</time>
                    {!read ? <i>未读</i> : null}
                  </span>
                  <strong>
                    <em>
                      {messageSource} · {messageType}
                    </em>
                    {title}
                  </strong>
                  <p>{content}</p>
                  <small className="message-attachment">
                    <ClipboardTask24Regular />
                    {attachment}
                  </small>
                </span>
                <ArrowRight24Regular />
              </button>
            );
          })
        ) : (
          <div className="message-empty">
            <Chat24Regular />
            <p>没有符合条件的消息。</p>
          </div>
        )}
      </div>
      <footer className="message-pagination">
        <span>共 {filteredMessages.length} 条</span>
        <label>
          每页
          <select
            aria-label="每页消息条数"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 条</option>
            <option value={20}>20 条</option>
            <option value={50}>50 条</option>
          </select>
        </label>
        <button
          type="button"
          aria-label="上一页"
          disabled={currentPage === 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          上一页
        </button>
        <b>{currentPage} / {pageCount}</b>
        <button
          type="button"
          aria-label="下一页"
          disabled={currentPage === pageCount}
          onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
        >
          下一页
        </button>
      </footer>
      <MessageAttachmentDialog
        key={selectedMessage?.id}
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </section>
  );
}

function TaskListPage({ onAction, onReturn, onOpenDetail }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const openTaskForm = (task) =>
    setSelectedTask({
      ...task,
      title: task.name,
      content: `任务由 ${task.initiator} 发起，计划执行时间为 ${task.plannedAt}。`,
      formKind: "task",
    });
  return (
    <section className="task-list-page" aria-labelledby="task-list-title">
      <div className="task-page-path">
        <button onClick={onReturn}>工作台</button>
        <ChevronRight24Regular />
        <strong>任务</strong>
      </div>
      <header className="task-list-header">
        <div>
          <p>任务中心</p>
          <h1 id="task-list-title">任务列表</h1>
        </div>
        <button onClick={() => onAction("新建任务")}>
          <Add24Regular />
          新建任务
        </button>
      </header>
      <div className="task-list-table" role="table" aria-label="任务列表">
        <div className="task-table-head" role="row">
          <span>任务名称</span>
          <span>发布时间</span>
          <span>计划执行时间</span>
          <span>计划结束时间</span>
          <span>发起人</span>
          <span>执行人</span>
          <span>任务表附件</span>
          <span>操作</span>
        </div>
        {taskEntries.map((task) => (
          <div className="task-table-row" role="row" key={task.id}>
            <strong>
              <button
                className="task-name-link"
                onClick={() => onOpenDetail(task)}
              >
                {task.name}
              </button>
              <i className={task.status === "执行中" ? "in-progress" : ""}>
                {task.status}
              </i>
            </strong>
            <span>{task.publishedAt}</span>
            <span>{task.plannedAt}</span>
            <span>{task.deadline}</span>
            <span>{task.initiator}</span>
            <span>{task.executor}</span>
            <button
              className="task-attachment"
              onClick={() => openTaskForm(task)}
            >
              <DocumentText24Regular />
              {task.attachment}
            </button>
            <span className="task-row-actions">
              <button
                className="task-execute"
                onClick={() => openTaskForm(task)}
              >
                执行
              </button>
              <button
                className="task-more"
                onClick={() => onAction(`${task.name}操作`)}
              >
                操作
              </button>
            </span>
          </div>
        ))}
      </div>
      <MessageAttachmentDialog
        key={selectedTask?.id}
        message={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </section>
  );
}

function TaskDetailPage({ task, onBack }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    {
      id: "comment-initial",
      author: "陈伟",
      time: "今天 09:06",
      content: "请在完成现场点检后同步复核结果。",
    },
  ]);
  const logs = [
    {
      time: task.publishedAt,
      title: "任务已发布",
      content: `${task.initiator} 发起了此项任务。`,
    },
    {
      time: task.plannedAt,
      title: "任务已进入执行阶段",
      content: `${task.executor} 已收到执行提醒。`,
    },
    {
      time: "今天 10:12",
      title: "任务进度已更新",
      content: "现场点检完成，等待复核确认。",
    },
  ];
  const openTaskForm = () =>
    setSelectedTask({
      ...task,
      title: task.name,
      content: `任务由 ${task.initiator} 发起，计划执行时间为 ${task.plannedAt}。`,
      formKind: "task",
    });
  const submitComment = (event) => {
    event.preventDefault();
    const text = comment.trim();
    if (!text) return;
    setComments((current) => [
      ...current,
      {
        id: `comment-${Date.now()}`,
        author: "张宇",
        time: "刚刚",
        content: text,
      },
    ]);
    setComment("");
  };
  return (
    <section className="task-detail-page" aria-labelledby="task-detail-title">
      <div className="task-page-path">
        <button onClick={onBack}>任务列表</button>
        <ChevronRight24Regular />
        <strong>{task.name}</strong>
      </div>
      <header className="task-detail-header">
        <div>
          <p>任务详情</p>
          <h1 id="task-detail-title">{task.name}</h1>
          <span
            className={
              task.status === "执行中"
                ? "detail-status in-progress"
                : "detail-status"
            }
          >
            {task.status}
          </span>
        </div>
        <button onClick={openTaskForm}>
          <ClipboardTask24Regular />
          执行任务
        </button>
      </header>
      <div className="task-detail-layout">
        <div>
          <section className="task-detail-section">
            <h2>任务主要信息</h2>
            <div className="task-info-grid">
              <span>
                <b>发布时间</b>
                {task.publishedAt}
              </span>
              <span>
                <b>计划执行时间</b>
                {task.plannedAt}
              </span>
              <span>
                <b>计划结束时间</b>
                {task.deadline}
              </span>
              <span>
                <b>发起人</b>
                {task.initiator}
              </span>
              <span>
                <b>执行人</b>
                {task.executor}
              </span>
              <span>
                <b>任务状态</b>
                {task.status}
              </span>
            </div>
          </section>
          <section className="task-detail-section">
            <h2>任务附件表单</h2>
            <button className="task-detail-attachment" onClick={openTaskForm}>
              <span>
                <DocumentText24Regular />
              </span>
              <span>
                <b>{task.attachment}</b>
                <small>点击查看并填写任务表单</small>
              </span>
              <ArrowRight24Regular />
            </button>
          </section>
          <section className="task-detail-section task-comment-section">
            <h2>评论任务</h2>
            <form onSubmit={submitComment}>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows="3"
                placeholder="输入评论内容，通知任务相关人员"
              />
              <footer>
                <span>评论将同步显示在任务日志中。</span>
                <button type="submit">发送评论</button>
              </footer>
            </form>
            <div className="task-comment-list">
              {comments.map((item) => (
                <article key={item.id}>
                  <span>{item.author.slice(0, 1)}</span>
                  <div>
                    <b>
                      {item.author}
                      <time>{item.time}</time>
                    </b>
                    <p>{item.content}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="task-log-panel">
          <h2>任务日志</h2>
          <ol>
            {logs.map((log) => (
              <li key={log.time}>
                <time>{log.time}</time>
                <span />
                <div>
                  <b>{log.title}</b>
                  <p>{log.content}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
      <MessageAttachmentDialog
        key={selectedTask?.id}
        message={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </section>
  );
}

function ProcessApprovalDialog({ process, onClose, onApprove, viewOnly = false, canRevoke = false, canResumeDraft = false, hideFinalLog = false, onResumeDraft, onResubmit }) {
  const [flowchartOpen, setFlowchartOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferPickerOpen, setTransferPickerOpen] = useState(false);
  const [transferPerson, setTransferPerson] = useState(null);
  const [transferReason, setTransferReason] = useState("");
  const [addSignerOpen, setAddSignerOpen] = useState(false);
  const [addSignerPickerOpen, setAddSignerPickerOpen] = useState(false);
  const [addSigners, setAddSigners] = useState([]);
  const [addSignerReason, setAddSignerReason] = useState("");
  const [returnConfirmTarget, setReturnConfirmTarget] = useState(null);
  const [nextReturnTarget, setNextReturnTarget] = useState("initiator");
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [refuseConfirmOpen, setRefuseConfirmOpen] = useState(false);
  const [refuseOpinion, setRefuseOpinion] = useState("");
  const closeProcessDialog = () => {
    setFlowchartOpen(false);
    setTransferOpen(false);
    setTransferPickerOpen(false);
    setAddSignerOpen(false);
    setAddSignerPickerOpen(false);
    setAddSigners([]);
    setAddSignerReason("");
    setReturnConfirmTarget(null);
    setRevokeConfirmOpen(false);
    setRefuseConfirmOpen(false);
    setRefuseOpinion("");
    onClose();
  };
  if (!process) return null;
  const isRejected = process.status === "已驳回";
  const isRevoked = process.status === "已撤销";
  const isApproved = process.status === "已通过";
  const isRefused = process.status === "已拒绝";
  const isResubmitted = process.resubmitted;
  const returnTarget = returnConfirmTarget === "initiator"
    ? { label: "发起人", name: process.initiator }
    : { label: "上一节点", name: process.previousApprover ?? "张七" };
  const logs = [
    {
      time: "2026-08-23 12:00:00",
      title: "系统发起",
      details: [`${process.initiator}发起了${process.name}`],
      action: "发起",
      state: "done",
    },
    {
      time: "2026-08-23 12:00:00",
      title: "主管领导审批",
      details: ["李四已同意", "审批意见：请按流程办理", "流程到达时间：2026-08-23 12:00:00"],
      action: "同意",
      state: "done",
    },
    {
      time: "2026-08-23 12:00:00",
      title: "分管领导审批",
      details: ["王五已转办", "转办原因：赵总定夺", "流程到达时间：2026-08-23 12:00:00"],
      action: "转办",
      state: "done",
    },
    {
      time: "2026-08-23 12:00:00",
      title: "转办审批",
      details: ["赵六已加签", "流程到达时间：2026-08-23 12:00:00"],
      action: "加签",
      state: "done",
    },
    {
      time: "2026-08-23 12:00:00",
      title: "加签审批",
      details: ["张七已同意", "流程到达时间：2026-08-23 12:00:00"],
      action: "同意",
      state: "done",
    },
    {
      time: "2026-08-23 12:00:00",
      title: "抄送",
      details: ["系统已抄送", "流程到达时间：2026-08-23 12:00:00"],
      action: "抄送",
      state: "done",
    },
    {
      time: isRejected || isResubmitted || isApproved || isRefused ? "2026-08-23 12:00:00" : isRevoked ? (process.revokedAt ?? "2026-08-28 10:36:00") : "当前",
      title: isRejected || isResubmitted || isApproved || isRefused ? "分管领导审批" : isRevoked ? "撤销" : "结束",
      details: isRejected || isResubmitted
        ? [`${process.rejectedBy ?? "周杰伦"}已驳回`, `审批意见：${process.rejectionOpinion ?? "请核对清楚再提交"}`, "流程到达时间：2026-08-23 12:00:00"]
        : isApproved
          ? [`${process.finalOperator ?? "张宇"}已同意`, "审批意见：同意办理", "流程完成时间：2026-08-23 12:00:00"]
          : isRefused
            ? [`${process.finalOperator ?? "张宇"}已拒绝`, `审批意见：${process.refusalOpinion || "未填写"}`, "流程完成时间：2026-08-23 12:00:00"]
        : isRevoked
          ? [`${process.revokedBy ?? "张宇"}已撤销该流程`]
        : [
            ["待审批", "审批中"].includes(process.status)
              ? `当前待 ${process.approver} 审批`
              : "流程已结束",
          ],
      action: isRejected || isResubmitted ? "驳回" : isApproved ? "同意" : isRefused ? "拒绝" : isRevoked ? "撤销" : undefined,
      state: isResubmitted ? "done" : "current",
    },
    ...(isResubmitted
      ? [{
          time: "2026-08-23 12:30:00",
          title: "重新提交",
          details: [`${process.initiator}已重新提交`],
          action: "重新提交",
          state: "done",
        }, {
          time: "",
          hideTime: true,
          title: "分管领导审批",
          details: ["周杰伦", "流程到达时间：2026-08-23 12:30:00"],
          state: isRevoked ? "done" : "current",
        }, ...(isRevoked
          ? [{
              time: process.revokedAt ?? "2026-08-28 10:36:00",
              title: "撤销",
              details: [`${process.revokedBy ?? "张宇"}已撤销该流程`],
              action: "撤销",
              state: "current",
            }]
          : [])]
      : []),
    ...(process.actionLogs ?? []),
  ];
  const formFields = [
    ["流程编号", getFlowNumber(process)],
    ["流程类型", process.name.includes("动火") ? "作业审批" : process.name.includes("采购") ? "采购申请" : "业务审批"],
    ["所属部门", process.department],
    ["发起人", process.initiator],
    ["发起时间", process.initiatedAt],
    ["当前节点", process.currentNode],
  ];
  const handleApprovalAction = (action) => {
    if (action === "撤销") {
      setRevokeConfirmOpen(true);
      return;
    }
    if (action === "转办") {
      setTransferOpen(true);
      return;
    }
    if (action === "加签") {
      setAddSigners([]);
      setAddSignerReason("");
      setAddSignerOpen(true);
      return;
    }
    if (action === "退回") {
      setReturnConfirmTarget(nextReturnTarget);
      setNextReturnTarget((current) => current === "initiator" ? "previous" : "initiator");
      return;
    }
    if (action === "拒绝") {
      setRefuseOpinion("");
      setRefuseConfirmOpen(true);
      return;
    }
    onApprove(`已${action}`);
  };
  const visibleLogs = hideFinalLog && !isRejected && !isRevoked && !isResubmitted && !isApproved && !isRefused && !(process.actionLogs?.length) ? logs.slice(0, -1) : logs;
  const submitTransfer = (event) => {
    event.preventDefault();
    if (!transferPerson) return;
    onApprove("已转办", { target: transferPerson, reason: transferReason });
    setTransferOpen(false);
    setTransferPickerOpen(false);
    setTransferReason("");
  };
  const submitAddSigner = (event) => {
    event.preventDefault();
    if (!addSigners.length) return;
    onApprove("已加签", { targets: addSigners, reason: addSignerReason });
    setAddSignerOpen(false);
    setAddSignerPickerOpen(false);
    setAddSigners([]);
    setAddSignerReason("");
  };
  const confirmReturn = () => {
    onApprove("已驳回", { target: returnTarget });
    setReturnConfirmTarget(null);
  };
  return (
    <>
      <div
      className="process-dialog-layer"
      onMouseDown={closeProcessDialog}
      role="presentation"
    >
      <section
        className="process-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="process-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="process-dialog-title">{process.name}</h2>
          <button
            className="process-dialog-close"
            aria-label="关闭流程审批"
            onClick={closeProcessDialog}
          >
            <DismissRegular />
          </button>
        </header>
        <div className={`process-dialog-body${canResumeDraft ? " draft-detail" : ""}`}>
          <div className="process-approval-main">
            <section className="process-approval-form">
              <h3>申请单</h3>
              <div className="process-approval-fields">
                {formFields.map(([label, value]) => (
                  <span key={label}>
                    <b>{label}</b>
                    {value || "-"}
                  </span>
                ))}
              </div>
              <label className="process-approval-description">
                申请说明
                <textarea
                  rows="5"
                  readOnly
                  defaultValue={`${process.name}相关事项，请按流程审核处理。`}
                />
              </label>
              {canRevoke && !isRejected && !isRevoked ? (
                <div className="process-initiated-actions">
                  <button type="button" onClick={() => handleApprovalAction("撤销")}>撤销</button>
                </div>
              ) : null}
              {canResumeDraft ? (
                <div className="process-draft-detail-actions">
                  <button type="button" onClick={() => onResumeDraft?.(process)}>继续填报</button>
                </div>
              ) : null}
            </section>
            {isRejected && canRevoke ? (
              <div className="process-rejected-actions">
                <button type="button" onClick={() => handleApprovalAction("撤销")}>撤销</button>
                <button type="button" className="primary" onClick={() => onResubmit?.(process)}>重新提交</button>
              </div>
            ) : !viewOnly ? (
              <section className="process-approval-opinion">
                <h3>审批意见</h3>
                <textarea rows="5" placeholder="请输入审批意见" />
                <div className="process-approval-actions">
                  <button type="button" onClick={() => handleApprovalAction("转办")}>转办</button>
                  <button type="button" onClick={() => handleApprovalAction("加签")}>加签</button>
                  <button type="button" className="danger" onClick={() => handleApprovalAction("退回")}>驳回</button>
                  <button type="button" className="danger" onClick={() => handleApprovalAction("拒绝")}>拒绝</button>
                  <button type="button" className="primary" onClick={() => handleApprovalAction("同意")}>同意</button>
                </div>
              </section>
            ) : null}
          </div>
          {!canResumeDraft ? (
            <section className="process-approval-log">
              <header>
                <h3>流程日志</h3>
                <button type="button" onClick={() => setFlowchartOpen(true)}>流程图</button>
              </header>
              <ol>
                {visibleLogs.map((log) => (
                  <li key={log.title}>
                    <span className={log.state} />
                    <div>
                      <div className="process-log-entry-heading">
                        <b>{log.title}</b>
                        <span className="process-log-entry-meta">
                          {!log.hideTime ? <time>{log.time}</time> : null}
                          {log.action ? (
                            <span className="process-log-action">{log.action}</span>
                          ) : null}
                        </span>
                      </div>
                      {log.details.map((detail) => <p key={detail}>{detail}</p>)}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </section>
      </div>
      {flowchartOpen ? (
        <div
          className="process-flowchart-map-layer"
          role="presentation"
          onMouseDown={() => setFlowchartOpen(false)}
        >
          <section
            className="process-flowchart-map-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="process-flowchart-map-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="process-flowchart-map-title">流程图</h2>
              <button
                type="button"
                className="process-dialog-close"
                aria-label="关闭流程图"
                onClick={() => setFlowchartOpen(false)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="process-flowchart-map" aria-label={`${process.name}流程图`}>
              <i className="flowchart-map-link start-down" />
              <i className="flowchart-map-link main-down" />
              <i className="flowchart-map-link main-right" />
              <i className="flowchart-map-link secondary-right" />
              <div className="flowchart-map-node start">
                <CheckmarkCircle24Regular />
                <b>{process.name}</b>
              </div>
              <div className="flowchart-map-node approval active">
                <People24Regular />
                <b>设备主管审批</b>
              </div>
              <div className="flowchart-map-node copy first-copy">
                <ArrowRight24Regular />
                <b>抄送节点</b>
              </div>
              <div className="flowchart-map-node approval manager">
                <People24Regular />
                <b>总经理审批</b>
              </div>
              <div className="flowchart-map-node copy second-copy">
                <ArrowRight24Regular />
                <b>抄送节点</b>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {revokeConfirmOpen ? (
        <div
          className="process-revoke-layer"
          role="presentation"
          onMouseDown={() => setRevokeConfirmOpen(false)}
        >
          <section
            className="process-revoke-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="process-revoke-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="process-revoke-title">确认撤销</h2>
              <button
                type="button"
                className="process-dialog-close"
                aria-label="关闭撤销确认"
                onClick={() => setRevokeConfirmOpen(false)}
              >
                <DismissRegular />
              </button>
            </header>
            <p>撤销后，流程将终止，无法再次发起，确定要撤销吗？</p>
            <footer>
              <button type="button" onClick={() => setRevokeConfirmOpen(false)}>取消</button>
              <button
                type="button"
                onClick={() => {
                  setRevokeConfirmOpen(false);
                  onApprove("已撤销");
                }}
              >
                确定撤销
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {refuseConfirmOpen ? (
        <div
          className="process-refuse-layer"
          role="presentation"
          onMouseDown={() => setRefuseConfirmOpen(false)}
        >
          <section
            className="process-refuse-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="process-refuse-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2 id="process-refuse-title">确认拒绝</h2>
              <button
                type="button"
                className="process-dialog-close"
                aria-label="关闭拒绝确认"
                onClick={() => setRefuseConfirmOpen(false)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="process-refuse-body">
              <label>
                拒绝意见
                <textarea
                  rows="4"
                  value={refuseOpinion}
                  onChange={(event) => setRefuseOpinion(event.target.value)}
                  placeholder="请输入拒绝意见"
                />
              </label>
              <p>拒绝后该流程终止，无法修改，确认要拒绝吗？</p>
            </div>
            <footer>
              <button type="button" onClick={() => setRefuseConfirmOpen(false)}>取消</button>
              <button
                type="button"
                onClick={() => {
                  onApprove("已拒绝", refuseOpinion.trim());
                  setRefuseConfirmOpen(false);
                  setRefuseOpinion("");
                }}
              >
                确定拒绝
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {transferOpen ? (
        <div
          className="process-transfer-layer"
          role="presentation"
          onMouseDown={() => setTransferOpen(false)}
        >
          <form
            className="process-transfer-dialog"
            onSubmit={submitTransfer}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="process-transfer-title"
          >
            <header>
              <h2 id="process-transfer-title">转办流程</h2>
              <button
                type="button"
                className="process-dialog-close"
                aria-label="关闭转办弹窗"
                onClick={() => setTransferOpen(false)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="process-transfer-body">
              <label>
                <span className="process-transfer-label"><em>*</em> 转办人</span>
                <button
                  type="button"
                  className="process-transfer-person"
                  onClick={() => setTransferPickerOpen(true)}
                >
                  {transferPerson
                    ? `${transferPerson.name} · ${transferPerson.department}`
                    : "请选择转办人"}
                  <ChevronRight24Regular />
                </button>
              </label>
              <label>
                转办原因
                <textarea
                  rows="4"
                  value={transferReason}
                  onChange={(event) => setTransferReason(event.target.value)}
                  placeholder="请输入转办原因"
                />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setTransferOpen(false)}>取消</button>
              <button type="submit" disabled={!transferPerson}>确认转办</button>
            </footer>
          </form>
        </div>
      ) : null}
      {addSignerOpen ? (
        <div
          className="process-transfer-layer"
          role="presentation"
          onMouseDown={() => setAddSignerOpen(false)}
        >
          <form
            className="process-transfer-dialog"
            onSubmit={submitAddSigner}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="process-add-signer-title"
          >
            <header>
              <h2 id="process-add-signer-title">加签流程</h2>
              <button
                type="button"
                className="process-dialog-close"
                aria-label="关闭加签弹窗"
                onClick={() => setAddSignerOpen(false)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="process-transfer-body">
              <label>
                <span className="process-transfer-label"><em>*</em> 加签人</span>
                <button
                  type="button"
                  className="process-transfer-person"
                  onClick={() => setAddSignerPickerOpen(true)}
                >
                  {addSigners.length
                    ? addSigners.map((user) => user.name).join("、")
                    : "请选择加签人"}
                  <ChevronRight24Regular />
                </button>
              </label>
              <label>
                加签原因
                <textarea
                  rows="4"
                  value={addSignerReason}
                  onChange={(event) => setAddSignerReason(event.target.value)}
                  placeholder="请输入加签原因"
                />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setAddSignerOpen(false)}>取消</button>
              <button type="submit" disabled={!addSigners.length}>确认加签</button>
            </footer>
          </form>
        </div>
      ) : null}
      {returnConfirmTarget ? (
        <div
          className="process-revoke-layer"
          role="presentation"
          onMouseDown={() => setReturnConfirmTarget(null)}
        >
          <section
            className="process-revoke-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="process-return-confirm-title"
          >
            <header>
              <h2 id="process-return-confirm-title">确认驳回</h2>
              <button type="button" className="process-dialog-close" aria-label="关闭驳回确认" onClick={() => setReturnConfirmTarget(null)}><DismissRegular /></button>
            </header>
            <p>驳回后，流程将退回至{returnTarget.label}，确认要驳回吗？</p>
            <footer>
              <button type="button" onClick={() => setReturnConfirmTarget(null)}>取消</button>
              <button type="button" onClick={confirmReturn}>确认驳回</button>
            </footer>
          </section>
        </div>
      ) : null}
      {transferPickerOpen ? (
        <SinglePersonPickerDialog
          organizations={processTransferOrganizations}
          users={processTransferUsers}
          selectedUser={transferPerson}
          onSelect={setTransferPerson}
          onClose={() => setTransferPickerOpen(false)}
          title="选择转办人"
          selectedLabel="已选转办人"
        />
      ) : null}
      {addSignerPickerOpen ? (
        <MultiPersonPickerDialog
          organizations={processTransferOrganizations}
          users={processTransferUsers}
          selectedUsers={addSigners}
          onSelect={setAddSigners}
          onClose={() => setAddSignerPickerOpen(false)}
          title="选择加签人"
          selectedLabel="已选加签人"
        />
      ) : null}
    </>
  );
}

function ProcessListPage({ onAction, initialFilter = "待审批" }) {
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [processRecords, setProcessRecords] = useState(processEntries);
  const [processFilter, setProcessFilter] = useState(initialFilter);
  const [processFilters, setProcessFilters] = useState({
    number: "",
    title: "",
    type: "",
    status: "",
  });
  const [processLibraryTab, setProcessLibraryTab] = useState("全部");
  const [processLibraryKeyword, setProcessLibraryKeyword] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [formMode, setFormMode] = useState("new");
  const [draftRestore, setDraftRestore] = useState(null);
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [formFullscreen, setFormFullscreen] = useState(false);
  const [flowchartDialog, setFlowchartDialog] = useState(false);
  const processFormRef = useRef(null);
  const processTemplates = [
    { category: "人资管理", tone: "blue", name: "员工离职申请", favorite: true },
    { category: "人资管理", tone: "blue", name: "职员晋升审批" },
    { category: "人资管理", tone: "blue", name: "职员调岗审批", recent: true },
    { category: "基建管理", tone: "gold", name: "地表基建项目报建申请", favorite: true },
    { category: "基建管理", tone: "gold", name: "年度工程计划编制审批" },
    { category: "基建管理", tone: "gold", name: "项目合同申报审批", recent: true },
    { category: "选矿管理", tone: "red", name: "换矿申请" },
    { category: "选矿管理", tone: "red", name: "选厂药剂领用申请", recent: true },
    { category: "选矿管理", tone: "red", name: "材料采购流程" },
  ];
  const processTabs = {
    待审批: {
      filters: ["number", "title", "type"],
      columns: ["number", "title", "application", "initiator", "initiatedAt", "arrivalAt", "status"],
    },
    已审批: {
      filters: ["number", "type"],
      columns: ["number", "title", "application", "initiator", "initiatedAt", "completedAt", "result", "status"],
    },
    抄送我的: {
      filters: ["number", "title"],
      columns: ["number", "title", "application", "initiator", "initiatedAt", "sentAt", "status"],
    },
    我发起的: {
      filters: ["number", "status"],
      columns: ["number", "title", "application", "initiatedAt", "currentNode", "status"],
    },
    草稿箱: {
      filters: ["title"],
      columns: ["title", "application", "initiatedAt", "status"],
    },
  };
  const columnLabels = {
    number: "流程编号",
    title: "标题",
    application: "所属应用",
    type: "流程类型",
    initiator: "发起人",
    arrivalAt: "流程到达时间",
    completedAt: "处理完成时间",
    duration: "处理耗时",
    result: "处理结果",
    sentAt: "发送时间",
    endedAt: "流程结束时间",
    status: "流程状态",
    currentNode: "当前节点",
    initiatedAt: "发起时间",
  };
  const columnLabel = (column) => {
    if (processFilter === "待审批" && column === "title") return "流程名称";
    if (processFilter === "待审批" && column === "status") return "当前状态";
    if (processFilter === "已审批" && column === "title") return "流程名称";
    if (processFilter === "已审批" && column === "completedAt") return "处理时间";
    if (processFilter === "已审批" && column === "result") return "我的处理";
    if (processFilter === "已审批" && column === "status") return "当前状态";
    if (processFilter === "抄送我的" && column === "title") return "流程名称";
    if (processFilter === "抄送我的" && column === "sentAt") return "抄送时间";
    if (processFilter === "抄送我的" && column === "status") return "当前状态";
    if (processFilter === "我发起的" && column === "title") return "流程名称";
    if (processFilter === "我发起的" && column === "status") return "当前状态";
    if (processFilter === "草稿箱" && column === "title") return "流程名称";
    if (processFilter === "草稿箱" && column === "initiatedAt") return "保存时间";
    if (processFilter === "草稿箱" && column === "status") return "状态";
    return columnLabels[column];
  };
  const activeTab = processTabs[processFilter];
  const visibleTemplates = processTemplates.filter(
    (template) =>
      (processLibraryTab === "全部" ||
        (processLibraryTab === "最近使用" && template.recent)) &&
      (!processLibraryKeyword.trim() ||
        template.name.includes(processLibraryKeyword.trim())),
  );
  const processDetails = (process) => ({
    number: getFlowNumber(process),
    title: process.name,
    application: process.application ?? "综合管理",
    type: process.name.includes("动火") ? "作业审批" : process.name.includes("采购") ? "采购申请" : "业务审批",
    initiator: process.initiator,
    arrivalAt: process.initiatedAt,
    completedAt: process.handledByMe ? "今天 10:18" : "-",
    duration: process.handledByMe ? "42 分钟" : "进行中",
    result: process.handledByMe ? (process.handledResult ?? "同意") : "-",
    sentAt: process.initiatedAt,
    endedAt: ["审批中", "已撤销"].includes(process.status) ? "-" : process.draft ? "-" : "进行中",
    status: process.status,
    currentNode: process.currentNode,
    initiatedAt: process.initiatedAt,
  });
  const visibleProcesses = processRecords.filter((process) => {
    const matchesFilter =
      (processFilter === "待审批" &&
        ["待审批", "审批中"].includes(process.status) &&
        process.approver === "张宇") ||
      (processFilter === "已审批" && process.handledByMe) ||
      (processFilter === "抄送我的" && process.ccToMe) ||
      (processFilter === "我发起的" && process.startedByMe) ||
      (processFilter === "草稿箱" && process.draft);
    const details = processDetails(process);
    return (
      matchesFilter &&
      (!processFilters.number || details.number.includes(processFilters.number)) &&
      (!processFilters.title || details.title.includes(processFilters.title)) &&
      (!processFilters.type || details.type === processFilters.type) &&
      (!processFilters.status || details.status === processFilters.status)
    );
  });
  const approve = (result, payload = {}) => {
    const actionPayload = typeof payload === "string" ? { opinion: payload } : payload;
    if (result === "已撤销") {
      setProcessRecords((current) =>
        current.map((process) =>
          process.id === selectedProcess.id
            ? {
                ...process,
                status: "已撤销",
                startedByMe: true,
                currentNode: "流程已撤销",
                revokedBy: "张宇",
                revokedAt: "2026-08-28 10:36:00",
              }
            : process,
        ),
      );
    }
    if (result === "已拒绝") {
      setProcessRecords((current) =>
        current.map((process) =>
          process.id === selectedProcess.id
            ? {
                ...process,
                status: "已拒绝",
                handledByMe: true,
                handledResult: "拒绝",
                finalOperator: "张宇",
                refusalOpinion: actionPayload.opinion ?? "",
                currentNode: "流程已结束",
              }
            : process,
        ),
      );
    }
    if (result === "已转办") {
      setProcessRecords((current) =>
        current.map((process) =>
          process.id === selectedProcess.id
            ? {
                ...process,
                status: "审批中",
                approver: actionPayload.target?.name ?? process.approver,
                currentNode: "转办审批",
                handledByMe: true,
                handledResult: "转办",
                actionLogs: [...(process.actionLogs ?? []), {
                  time: "2026-08-28 11:00:00",
                  title: "转办",
                  details: [`张宇已转办给${actionPayload.target?.name ?? "处理人"}`, `转办原因：${actionPayload.reason || "未填写"}`],
                  action: "转办",
                  state: "done",
                }],
              }
            : process,
        ),
      );
    }
    if (result === "已加签") {
      setProcessRecords((current) =>
        current.map((process) =>
          process.id === selectedProcess.id
            ? {
                ...process,
                actionLogs: [...(process.actionLogs ?? []), {
                  time: "2026-08-28 11:02:00",
                  title: "加签",
                  details: [`张宇已加签给${actionPayload.targets?.map((user) => user.name).join("、") || "处理人"}`, `加签原因：${actionPayload.reason || "未填写"}`],
                  action: "加签",
                  state: "done",
                }],
              }
            : process,
        ),
      );
    }
    if (result === "已驳回") {
      setProcessRecords((current) =>
        current.map((process) =>
          process.id === selectedProcess.id
            ? {
                ...process,
                status: "已驳回",
                currentNode: `已驳回至${actionPayload.target?.label ?? "上一节点"}`,
                handledByMe: true,
                handledResult: "驳回",
                rejectedBy: "张宇",
                rejectionOpinion: actionPayload.reason || "未填写",
                actionLogs: [...(process.actionLogs ?? []), {
                  time: "2026-08-28 11:05:00",
                  title: "驳回",
                  details: [`张宇已驳回至${actionPayload.target?.label ?? "上一节点"}`, `驳回原因：${actionPayload.reason || "未填写"}`],
                  action: "驳回",
                  state: "current",
                }],
              }
            : process,
        ),
      );
    }
    onAction(`${selectedProcess.name}${result}`);
    setSelectedProcess(null);
  };
  const resumeDraft = (draft) => {
    const template = processTemplates.find((item) => item.name === draft.name) ?? {
      category: "其他流程",
      tone: "blue",
      name: draft.name,
    };
    setSelectedProcess(null);
    setProcessFilter("发起流程");
    openProcessForm(template, draft);
  };
  const resubmitProcess = (process) => {
    const template = processTemplates.find((item) => item.name === process.name) ?? {
      category: "其他流程",
      tone: "blue",
      name: process.name,
    };
    setSelectedProcess(null);
    openProcessForm(
      {
        ...template,
        name: process.name,
      },
      {
        ...process,
        description: "请根据驳回意见核对并完善申请信息后重新提交。",
      },
      "resubmit",
    );
  };
  const openProcessForm = (template, draft = null, mode = "restore") => {
    setSelectedTemplate(template);
    setSelectedDraft(draft);
    setFormMode(draft ? mode : "new");
    setDraftRestore(null);
    setFormFullscreen(false);
    setFlowchartDialog(false);
  };
  const selectProcessTemplate = (template) => {
    const matchingDrafts = processEntries.filter(
      (process) => process.draft && process.name === template.name,
    );
    if (matchingDrafts.length) {
      setDraftRestore({ template, drafts: matchingDrafts });
      setSelectedDraftId(matchingDrafts[0].id);
      return;
    }
    openProcessForm(template);
  };
  const closeProcessForm = () => {
    setSelectedTemplate(null);
    setSelectedDraft(null);
    setFlowchartDialog(false);
  };
  const saveProcessDraft = () => {
    if (!selectedTemplate) return;
    const values = new FormData(processFormRef.current);
    const draft = {
      id: selectedDraft?.draft ? selectedDraft.id : `flow-draft-${Date.now()}`,
      name: selectedTemplate.name,
      initiator: "张宇",
      initiatedAt: "2026-08-31 10:00:00",
      currentNode: "待提交",
      status: "草稿",
      department: values.get("department") || "安全管理部",
      description: values.get("description") || "",
      draft: true,
      startedByMe: true,
      sequence: selectedDraft?.sequence ?? (processRecords.filter((item) => getFlowDatePart(item.initiatedAt) === FLOW_NUMBER_REFERENCE_DATE).length + 1),
    };
    setProcessRecords((current) =>
      selectedDraft?.draft
        ? current.map((item) => (item.id === draft.id ? draft : item))
        : [draft, ...current],
    );
    setSelectedDraft(draft);
    onAction(`${selectedTemplate.name}已暂存到草稿箱`);
  };
  return (
    <section className="process-list-page" aria-labelledby="process-list-title">
      <header className="task-list-header">
        <div>
          <p>流程中心</p>
          <h1 id="process-list-title">流程列表</h1>
        </div>
      </header>
      <div className="process-toolbar">
        <div className="process-filter-tabs" role="tablist" aria-label="流程状态">
          {["发起流程", ...Object.keys(processTabs)].map((filter) => (
            <button
              key={filter}
              role="tab"
              aria-selected={processFilter === filter}
              className={processFilter === filter ? "active" : ""}
              onClick={() => setProcessFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      {processFilter === "发起流程" ? (
        <section className="process-library" aria-label="流程库">
          <header>
            <div className="process-library-tabs" role="tablist" aria-label="流程库分类">
              {["全部", "最近使用"].map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={processLibraryTab === tab}
                  className={processLibraryTab === tab ? "active" : ""}
                  onClick={() => setProcessLibraryTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <input
              value={processLibraryKeyword}
              onChange={(event) => setProcessLibraryKeyword(event.target.value)}
              placeholder="请输入流程任务名称关键字"
              aria-label="搜索流程模板"
            />
          </header>
          <div className="process-library-groups">
            {["人资管理", "基建管理", "选矿管理"].map((category) => {
              const templates = visibleTemplates.filter((item) => item.category === category);
              const tone = processTemplates.find((item) => item.category === category)?.tone;
              return (
                <section key={category} className={`process-library-group ${tone}`}>
                  <h2><i />{category}<small>（{templates.length}）</small></h2>
                  {templates.length ? templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => selectProcessTemplate(template)}
                    >
                      {template.name}
                    </button>
                  )) : <p>暂无流程</p>}
                </section>
              );
            })}
          </div>
        </section>
      ) : (
        <>
      <div className="process-query" aria-label="流程筛选">
        {activeTab.filters.includes("number") ? (
          <label>
            <span>流程编号</span>
            <input
              value={processFilters.number}
              onChange={(event) => setProcessFilters((current) => ({ ...current, number: event.target.value }))}
              placeholder="请输入流程编号"
            />
          </label>
        ) : null}
        {activeTab.filters.includes("title") ? (
          <label>
            <span>{processFilter === "草稿箱" ? "流程名称" : "标题"}</span>
            <input
              value={processFilters.title}
              onChange={(event) => setProcessFilters((current) => ({ ...current, title: event.target.value }))}
              placeholder={processFilter === "草稿箱" ? "请输入流程名称" : "请输入标题"}
            />
          </label>
        ) : null}
        {activeTab.filters.includes("type") ? (
          <label>
            <span>流程类型</span>
            <select value={processFilters.type} onChange={(event) => setProcessFilters((current) => ({ ...current, type: event.target.value }))}>
              <option value="">请选择流程类型</option>
              <option>作业审批</option>
              <option>采购申请</option>
              <option>业务审批</option>
            </select>
          </label>
        ) : null}
        {activeTab.filters.includes("status") ? (
          <label>
            <span>状态</span>
            <select value={processFilters.status} onChange={(event) => setProcessFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">请选择状态</option>
              <option>待审批</option>
              <option>审批中</option>
            </select>
          </label>
        ) : null}
        <button type="button" className="process-query-submit" onClick={() => onAction("已按当前条件筛选流程")}>搜索</button>
        <button type="button" className="process-query-reset" onClick={() => setProcessFilters({ number: "", title: "", type: "", status: "" })}>重置</button>
      </div>
      <div className="process-list-table" role="table" aria-label="流程列表">
        <div className="process-table-head" role="row" style={{ gridTemplateColumns: `repeat(${activeTab.columns.length + 1}, minmax(105px, 1fr))` }}>
          {activeTab.columns.map((column) => <span key={column}>{columnLabel(column)}</span>)}
          <span>操作</span>
        </div>
        {visibleProcesses.map((process) => (
          <div className="process-table-row" role="row" key={process.id} style={{ gridTemplateColumns: `repeat(${activeTab.columns.length + 1}, minmax(105px, 1fr))` }}>
            {activeTab.columns.map((column) => {
              const value = processDetails(process)[column];
              return column === "title" ? (
                <button key={column} className="process-name-link" onClick={() => setSelectedProcess(process)}>{value}</button>
              ) : column === "status" || column === "result" ? (
                <i key={column} className={["已驳回", "已拒绝"].includes(value) ? "rejected" : ["待审批", "审批中"].includes(value) ? "pending" : ""}>{value}</i>
              ) : <span key={column}>{value}</span>;
            })}
            <button
              className="process-approval-action"
              onClick={() => setSelectedProcess(process)}
            >
              <ApprovalsApp24Regular />
              {processFilter === "待审批" ? "审批" : "查看"}
            </button>
          </div>
        ))}
        {!visibleProcesses.length ? (
          <div className="process-empty">暂无符合条件的流程</div>
        ) : null}
      </div>
        </>
      )}
      <ProcessApprovalDialog
        process={selectedProcess}
        onClose={() => setSelectedProcess(null)}
        onApprove={approve}
        viewOnly={processFilter !== "待审批"}
        canRevoke={processFilter === "我发起的"}
        canResumeDraft={processFilter === "草稿箱"}
        hideFinalLog={["已审批", "我发起的"].includes(processFilter)}
        onResumeDraft={resumeDraft}
        onResubmit={resubmitProcess}
      />
      {draftRestore ? (
        <div
          className="process-draft-restore-layer"
          role="presentation"
          onMouseDown={() => setDraftRestore(null)}
        >
          <section
            className="process-draft-restore-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-restore-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p>草稿箱提醒</p>
                <h2 id="draft-restore-title">发现同名流程草稿</h2>
              </div>
              <button
                type="button"
                className="process-dialog-close"
                aria-label="关闭草稿提醒"
                onClick={() => setDraftRestore(null)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="process-draft-restore-body">
              <p>
                当前草稿箱内有 {draftRestore.drafts.length} 条“{draftRestore.template.name}”草稿，请选择恢复继续填报，或重新发起新的流程。
              </p>
              <div className="process-draft-options" role="radiogroup" aria-label="选择要恢复的流程草稿">
                {draftRestore.drafts.map((draft) => (
                  <label key={draft.id} className={selectedDraftId === draft.id ? "selected" : ""}>
                    <input
                      type="radio"
                      name="process-draft"
                      value={draft.id}
                      checked={selectedDraftId === draft.id}
                      onChange={() => setSelectedDraftId(draft.id)}
                    />
                    <span>
                      <b>{draft.name}</b>
                      <small>最后保存：{draft.initiatedAt}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <footer>
              <button type="button" className="process-reject" onClick={() => openProcessForm(draftRestore.template)}>
                重新发起
              </button>
              <button
                type="button"
                className="process-approve"
                onClick={() => {
                  const draft = draftRestore.drafts.find((item) => item.id === selectedDraftId);
                  openProcessForm(draftRestore.template, draft);
                }}
              >
                恢复并继续填报
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {selectedTemplate ? (
        <div className="process-form-layer" onMouseDown={closeProcessForm} role="presentation">
          <form ref={processFormRef} className={`process-form-dialog${formFullscreen ? " fullscreen" : ""}`} onMouseDown={(event) => event.stopPropagation()} onSubmit={(event) => { event.preventDefault(); if (formMode === "resubmit" && selectedDraft?.id) { setProcessRecords((current) => current.map((process) => process.id === selectedDraft.id ? { ...process, status: "审批中", currentNode: "分管领导审批", resubmitted: true } : process)); } onAction(`${formMode === "resubmit" ? "已重新提交流程" : "已发起流程"}：${selectedTemplate.name}`); closeProcessForm(); }}>
            <header>
              <div><p>{selectedDraft ? formMode === "resubmit" ? "重新提交" : "恢复草稿" : "发起流程"}</p><h2>{selectedTemplate.name}</h2></div>
              <div>
                <button type="button" className="process-form-text-action" onClick={() => setFlowchartDialog(true)}>查看流程图</button>
                <button type="button" className="process-form-text-action" onClick={() => setFormFullscreen((current) => !current)}>{formFullscreen ? "退出全屏" : "全屏"}</button>
                <button type="button" className="process-dialog-close" aria-label="关闭流程表单" onClick={closeProcessForm}><DismissRegular /></button>
              </div>
            </header>
            <div className="process-form-body">
              <section>
                <h3>申请信息</h3>
                <div className="process-form-grid">
                  <label>申请标题<input name="title" defaultValue={selectedTemplate.name} /></label>
                  <label>申请部门<select name="department" defaultValue={selectedDraft?.department ?? "安全管理部"}><option>安全管理部</option><option>生产管理部</option><option>设备管理部</option></select></label>
                  <label>申请人<input defaultValue="张宇" disabled /></label>
                  <label className="wide">申请说明<textarea name="description" rows="5" defaultValue={selectedDraft?.description ?? ""} placeholder="请填写申请事由、工作安排及需要说明的事项" /></label>
                  <label className="wide">相关附件<input type="file" /></label>
                </div>
              </section>
            </div>
            <footer><span>{selectedDraft ? formMode === "resubmit" ? "请根据驳回意见核对信息后重新提交。" : `正在恢复 ${selectedDraft.initiatedAt} 保存的草稿。` : "请确认信息无误后再发起流程。"}</span><div><button type="button" className="process-reject" onClick={closeProcessForm}>取消</button><button type="button" className="process-draft-action" onClick={saveProcessDraft}>暂存</button><button type="submit" className="process-approve">{formMode === "resubmit" ? "重新提交" : "发起流程"}</button></div></footer>
          </form>
        </div>
      ) : null}
      {selectedTemplate && flowchartDialog ? (
        <div className="process-flowchart-layer" onMouseDown={() => setFlowchartDialog(false)} role="presentation">
          <section className="process-flowchart-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="审批流程图">
            <header><div><p>审批流程图</p><h2>{selectedTemplate.name}</h2></div><button className="process-dialog-close" aria-label="关闭审批流程图" onClick={() => setFlowchartDialog(false)}><DismissRegular /></button></header>
            <div className="process-flowchart"><div className="flow-node done"><span>1</span><b>发起申请</b><i /></div><div className="flow-node active"><span>2</span><b>部门负责人</b><i /></div><div className="flow-node"><span>3</span><b>安全审核</b><i /></div><div className="flow-node"><span>4</span><b>归档完成</b></div></div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function WorkQueue({ item, active, onSelect, onOpen }) {
  const Icon = item.icon;
  return (
    <section className={`work-queue ${item.accent} ${active ? "active" : ""}`}>
      <button
        className="queue-title"
        onClick={() => {
          onSelect();
          onOpen(item.id);
        }}
      >
        <span className="queue-icon">
          <Icon />
        </span>
        <span>
          <b>{item.title}</b>
          <small>{item.note}</small>
        </span>
        <strong>{item.count}</strong>
        <ArrowRight24Regular />
      </button>
    </section>
  );
}

function ApplicationRail({ onOpen, favoriteApps, onCustomize }) {
  const [customizing, setCustomizing] = useState(false);
  const [draftApps, setDraftApps] = useState(favoriteApps);
  const [draggingApp, setDraggingApp] = useState(null);
  const selectedApps = favoriteApps
    .map((name) => apps.find((app) => app.name === name))
    .filter(Boolean);
  const customizerApps = [
    ...draftApps
      .map((name) => apps.find((app) => app.name === name))
      .filter(Boolean),
    ...apps.filter((app) => !draftApps.includes(app.name)),
  ];
  const openCustomizer = () => {
    setDraftApps(favoriteApps);
    setDraggingApp(null);
    setCustomizing(true);
  };
  const toggleApp = (name) =>
    setDraftApps((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  const reorderApps = (source, target) =>
    setDraftApps((current) => {
      const sourceIndex = current.indexOf(source);
      const targetIndex = current.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex)
        return current;
      const next = [...current];
      next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, source);
      return next;
    });
  return (
    <>
      <section
        className="application-rail"
        aria-labelledby="applications-title"
      >
        <div className="section-title">
          <div>
            <h2 id="applications-title">常用应用</h2>
          </div>
          <div className="application-rail-actions">
            <button
              className="quiet-action application-customize"
              onClick={openCustomizer}
            >
              自定义
            </button>
            <button className="quiet-action" onClick={() => onOpen("应用中心")}>
              浏览全部 <ArrowRight24Regular />
            </button>
          </div>
        </div>
        <div className="application-grid">
          {selectedApps.map(({ name, description, icon: Icon }, index) => (
            <button
              className="application"
              key={name}
              onClick={() => onOpen(name)}
            >
              <span className={`application-icon icon-${index % 4}`}>
                <Icon />
              </span>
              <span>
                <b>{name}</b>
                <small>{description}</small>
              </span>
              <ArrowRight24Regular />
            </button>
          ))}
        </div>
        {customizing ? (
          <div
            className="management-dialog-layer application-customizer-layer"
            onMouseDown={() => setCustomizing(false)}
            role="presentation"
          >
            <section
              className="management-dialog application-customizer"
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-customizer-title"
            >
              <header>
                <div>
                  <h2 id="application-customizer-title">自定义常用应用</h2>
                  <span>勾选应用，拖动已添加的应用可调整展示顺序</span>
                </div>
                <button
                  type="button"
                  className="management-dialog-close"
                  aria-label="关闭自定义应用"
                  onClick={() => setCustomizing(false)}
                >
                  <DismissRegular />
                </button>
              </header>
              <div className="application-customizer-body">
                {customizerApps.map((app) => {
                  const selected = draftApps.includes(app.name);
                  const Icon = app.icon;
                  return (
                    <div
                      className={`${selected ? "application-customizer-row selected" : "application-customizer-row"} ${draggingApp === app.name ? "dragging" : ""}`}
                      key={app.name}
                      draggable={selected}
                      onDragStart={(event) => {
                        setDraggingApp(app.name);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", app.name);
                      }}
                      onDragEnd={() => setDraggingApp(null)}
                      onDragOver={(event) => {
                        if (selected && draggingApp && draggingApp !== app.name)
                          event.preventDefault();
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const source =
                          event.dataTransfer.getData("text/plain") ||
                          draggingApp;
                        if (selected && source) reorderApps(source, app.name);
                        setDraggingApp(null);
                      }}
                    >
                      <label>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleApp(app.name)}
                        />
                        <span className="application-customizer-icon">
                          <Icon />
                        </span>
                        <span>
                          <b>{app.name}</b>
                          <small>{app.description}</small>
                        </span>
                      </label>
                      {selected ? (
                        <span
                          className="application-drag-handle"
                          aria-label="拖拽排序"
                        >
                          <ReOrderDotsVertical24Regular />
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <footer>
                <span>已选择 {draftApps.length} 个应用</span>
                <div>
                  <button
                    type="button"
                    className="management-dialog-cancel"
                    onClick={() => setCustomizing(false)}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="management-dialog-primary"
                    onClick={() => {
                      onCustomize(draftApps);
                      setCustomizing(false);
                    }}
                  >
                    保存设置
                  </button>
                </div>
              </footer>
            </section>
          </div>
        ) : null}
      </section>
    </>
  );
}

function RecentApps({ onOpen }) {
  return (
    <section className="recent-section" aria-labelledby="recent-apps-title">
      <div className="section-title recent-title">
        <div>
          <h2 id="recent-apps-title">最近使用</h2>
        </div>
      </div>
      <div className="recent-list">
        {recentApps.map(({ name, time, icon: Icon, tone }) => (
          <button
            className="recent-app"
            key={name}
            onClick={() => onOpen(name)}
          >
            <span className={`recent-icon ${tone}`}>
              <Icon />
            </span>
            <span>
              <b>{name}</b>
              <small>{time} 使用</small>
            </span>
            <ArrowRight24Regular />
          </button>
        ))}
      </div>
    </section>
  );
}

function ApplicationWorkspace({ app, onReturn, onAction }) {
  const Icon = app.icon;
  return (
    <section
      className="application-workspace"
      aria-labelledby="application-workspace-title"
    >
      <div className="application-workspace-heading">
        <span className="workspace-icon">
          <Icon />
        </span>
        <div>
          <p>当前应用</p>
          <h1 id="application-workspace-title">{app.name}</h1>
          <span>{app.description}</span>
        </div>
        <button className="quiet-action" onClick={onReturn}>
          返回工作台 <ArrowRight24Regular />
        </button>
      </div>
      <div className="application-workspace-actions">
        <button onClick={() => onAction(`${app.name}待办`)}>
          <ClipboardTask24Regular />
          <span>
            <b>待处理事项</b>
            <small>查看分派给你的工作</small>
          </span>
          <ArrowRight24Regular />
        </button>
        <button onClick={() => onAction(`新建${app.name}记录`)}>
          <Add24Regular />
          <span>
            <b>新建记录</b>
            <small>快速发起一条业务记录</small>
          </span>
          <ArrowRight24Regular />
        </button>
        <button onClick={() => onAction(`${app.name}设置`)}>
          <Settings24Regular />
          <span>
            <b>应用设置</b>
            <small>配置常用模板与提醒</small>
          </span>
          <ArrowRight24Regular />
        </button>
      </div>
    </section>
  );
}

function AppSwitcher({ currentName, onSelect }) {
  const [open, setOpen] = useState(false);
  const currentApp = apps.find((app) => app.name === currentName) ?? apps[0];
  const CurrentIcon = currentApp.icon;
  return (
    <div className="app-switcher-wrap">
      <button
        className="prevention-switcher"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span>
          <CurrentIcon />
        </span>
        <b>{currentName.replace("机制", "管理")}</b>
        <ChevronDown24Regular />
      </button>
      {open ? (
        <div className="app-switcher-menu" role="menu" aria-label="切换应用">
          {apps.map(({ name, description, icon: Icon }) => (
            <button
              key={name}
              role="menuitem"
              className={name === currentName ? "selected" : ""}
              onClick={() => {
                setOpen(false);
                onSelect(name);
              }}
            >
              <Icon />
              <span>
                <b>{name}</b>
                <small>{description}</small>
              </span>
              {name === currentName ? <CheckmarkCircle24Regular /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const preventionNavigation = [
  { label: "法律法规", icon: DocumentText24Regular },
  { label: "制度文件", icon: DocumentText24Regular, nested: true },
  { label: "风险分级管控", icon: ShieldCheckmark24Regular, nested: true },
  { label: "隐患排查治理", icon: ErrorCircle24Regular, expanded: true },
];

const preventionSubmenu = [
  "隐患排查任务发布",
  "岗位隐患排查清单",
  "隐患排查审批流程",
  "隐患排查治理记录",
  "隐患排查工作表",
  "隐患整改通知单",
  "隐患整改台账",
  "隐患信息统计",
  "隐患汇报",
];

const preventionForms = [
  {
    title: "平巷凿岩作业岗位隐患排查表",
    detail: "岗位隐患排查",
    icon: ShieldCheckmark24Regular,
    tone: "lime",
  },
  {
    title: "掘进凿岩工隐患排查清单",
    detail: "岗位隐患排查",
    icon: ClipboardTask24Regular,
    tone: "blue",
  },
  {
    title: "撬毛作业岗位隐患排查表",
    detail: "岗位隐患排查",
    icon: ShieldCheckmark24Regular,
    tone: "lime",
  },
];

const preventionApprovalFlows = [
  {
    title: "员工离职申请",
    detail: "隐患排查审批",
    icon: ApprovalsApp24Regular,
    tone: "blue",
    kind: "approval",
  },
  {
    title: "平巷凿岩作业隐患排查审批流程",
    detail: "隐患排查审批",
    icon: ApprovalsApp24Regular,
    tone: "blue",
    kind: "approval",
  },
  {
    title: "掘进工作面隐患整改审批流程",
    detail: "隐患排查审批",
    icon: ApprovalsApp24Regular,
    tone: "lime",
    kind: "approval",
  },
];

const initialInspectionRecords = [
  {
    id: "inspection-001",
    reporter: "张宇",
    date: "2026-07-29",
    shift: "早班",
    location: "西翼 3# 平巷",
    equipment: "正常",
    environment: "正常",
    protection: "正常",
    description: "现场检查正常，无需整改。",
    status: "已提交",
  },
  {
    id: "inspection-002",
    reporter: "李明",
    date: "2026-07-28",
    shift: "中班",
    location: "西翼 2# 平巷",
    equipment: "正常",
    environment: "发现问题",
    protection: "正常",
    description: "照明灯具亮度不足，已通知机电班处理。",
    status: "已复核",
  },
];

function DualPreventionPage({
  onAction,
  onSwitchApplication,
  initialFormTitle = preventionForms[0].title,
  initialOpenForm = false,
  initialFormSource = preventionApprovalFlows.some(
    (form) => form.title === initialFormTitle,
  )
    ? "隐患排查审批流程"
    : "岗位隐患排查清单",
}) {
  const [selectedItem, setSelectedItem] = useState(initialFormSource);
  const [activeForm, setActiveForm] = useState(initialOpenForm);
  const [selectedForm, setSelectedForm] = useState(initialFormTitle);
  const [submitted, setSubmitted] = useState(false);
  const [inspectionTab, setInspectionTab] = useState("页面");
  const [formSource, setFormSource] = useState(initialFormSource);
  const [approvalDraftRestore, setApprovalDraftRestore] = useState(null);
  const [selectedApprovalDraft, setSelectedApprovalDraft] = useState(null);
  const [selectedApprovalDraftId, setSelectedApprovalDraftId] = useState("");
  const [approvalDrafts, setApprovalDrafts] = useState([]);
  const [inspectionRecords, setInspectionRecords] = useState(initialInspectionRecords);
  const [inspectionFilterDraft, setInspectionFilterDraft] = useState({ reporter: "", date: "", shift: "" });
  const [inspectionFilters, setInspectionFilters] = useState({ reporter: "", date: "", shift: "" });
  const importInputRef = useRef(null);
  const approvalFormRef = useRef(null);
  const selectedLabel = selectedItem;
  const allPreventionForms = [...preventionForms, ...preventionApprovalFlows];
  const activeFormRecord =
    allPreventionForms.find((form) => form.title === selectedForm) ??
    preventionForms[0];
  const isApprovalFlow = activeFormRecord.kind === "approval";
  const openFormDirect = (
    form = preventionForms[0],
    source = "岗位隐患排查清单",
    draft = null,
  ) => {
    setSelectedForm(form.title);
    setFormSource(source);
    setSelectedApprovalDraft(draft);
    setApprovalDraftRestore(null);
    setActiveForm(true);
    setSubmitted(false);
    setInspectionTab("页面");
  };
  const openForm = (
    form = preventionForms[0],
    source = "岗位隐患排查清单",
  ) => {
    const matchingDrafts = form.kind === "approval"
      ? [...processEntries, ...approvalDrafts].filter(
        (process) => process.draft && process.name === form.title,
      )
      : [];
    if (matchingDrafts.length) {
      setApprovalDraftRestore({ form, source, drafts: matchingDrafts });
      setSelectedApprovalDraftId(matchingDrafts[0].id);
      return;
    }
    openFormDirect(form, source);
  };
  const submitForm = (event) => {
    event.preventDefault();
    setSubmitted(true);
    onAction(
      `${activeFormRecord.title}已提交${
        isApprovalFlow ? "，已进入审批流程" : ""
      }`,
    );
  };
  const saveApprovalDraft = () => {
    if (!isApprovalFlow) return;
    const values = new FormData(approvalFormRef.current);
    const draft = {
      id: selectedApprovalDraft?.id?.startsWith("approval-draft-")
        ? selectedApprovalDraft.id
        : `approval-draft-${Date.now()}`,
      name: activeFormRecord.title,
      initiator: values.get("reporter") || "张宇",
      initiatedAt: "2026-08-31 10:00:00",
      currentNode: "待提交",
      status: "草稿",
      department: "安全管理部",
      description: values.get("description") || "",
      draft: true,
    };
    setApprovalDrafts((current) =>
      selectedApprovalDraft?.id?.startsWith("approval-draft-")
        ? current.map((item) => (item.id === draft.id ? draft : item))
        : [draft, ...current],
    );
    setSelectedApprovalDraft(draft);
    onAction(`${activeFormRecord.title}已暂存到草稿箱`);
  };
  const filteredInspectionRecords = inspectionRecords.filter((record) =>
    (!inspectionFilters.reporter || record.reporter.includes(inspectionFilters.reporter))
    && (!inspectionFilters.date || record.date === inspectionFilters.date)
    && (!inspectionFilters.shift || record.shift === inspectionFilters.shift),
  );
  const exportRecords = (records = inspectionRecords) => {
    const headers = ["填报人", "检查日期", "作业班次", "作业地点", "凿岩设备防护装置完好", "作业面通风与照明符合要求", "人员防护用品佩戴规范", "隐患描述与整改建议", "填报状态"];
    const rows = records.map((record) => [record.reporter, record.date, record.shift, record.location, record.equipment, record.environment, record.protection, record.description, record.status]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    link.download = `${activeFormRecord.title}-历史数据.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    onAction("历史填报数据已导出");
  };
  const importRecords = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const importedRecord = {
      id: `inspection-${Date.now()}`,
      reporter: "导入用户",
      date: "2026-07-30",
      shift: "早班",
      location: "西翼 1# 平巷",
      equipment: "正常",
      environment: "正常",
      protection: "正常",
      description: `已从 ${file.name} 导入填报记录。`,
      status: "已导入",
    };
    setInspectionRecords((current) => [importedRecord, ...current]);
    event.target.value = "";
    onAction(`已导入 ${file.name}`);
  };
  return (
    <section
      className="prevention-page"
      aria-labelledby="prevention-page-title"
    >
      <aside className="prevention-sidebar" aria-label="双重预防机制功能导航">
        <AppSwitcher
          currentName="双重预防机制"
          onSelect={onSwitchApplication}
        />
        <nav className="prevention-nav">
          {preventionNavigation.map(
            ({ label, icon: Icon, nested, expanded }) => (
              <button
                key={label}
                className={
                  expanded
                    ? "prevention-nav-item expanded"
                    : "prevention-nav-item"
                }
                onClick={() => onAction(label)}
              >
                <Icon />
                <span>{label}</span>
                {nested ? (
                  <ChevronRight24Regular />
                ) : expanded ? (
                  <ChevronDown24Regular />
                ) : null}
              </button>
            ),
          )}
        </nav>
        <div className="prevention-submenu">
          {preventionSubmenu.map((item) => (
            <button
              key={item}
              className={selectedItem === item ? "selected" : ""}
              onClick={() => {
                setSelectedItem(item);
                setActiveForm(false);
              }}
            >
              <span>{item}</span>
              {[
                "隐患排查任务发布",
                "隐患排查工作表",
                "隐患整改通知单",
                "隐患汇报",
              ].includes(item) ? (
                <ChevronRight24Regular />
              ) : null}
            </button>
          ))}
        </div>
        <nav className="prevention-nav prevention-nav-bottom">
          <button
            className="prevention-nav-item"
            onClick={() => onAction("风险告知卡")}
          >
            <DocumentText24Regular />
            <span>风险告知卡</span>
            <ChevronRight24Regular />
          </button>
          <button
            className="prevention-nav-item"
            onClick={() => onAction("风险四色图")}
          >
            <DataBarVertical24Regular />
            <span>风险四色图</span>
            <ChevronRight24Regular />
          </button>
        </nav>
      </aside>
      <div className="prevention-content">
        {activeForm ? (
          <section
            className="inspection-form-view"
            aria-labelledby="inspection-form-title"
          >
            <div className="prevention-breadcrumb">
              <span>双重预防管理</span>
              <ChevronRight24Regular />
              <span>隐患排查治理</span>
              <ChevronRight24Regular />
              <button
                onClick={() => {
                  setActiveForm(false);
                  setSubmitted(false);
                }}
              >
                {formSource}
              </button>
              <ChevronRight24Regular />
              <strong id="prevention-page-title">在线填报</strong>
            </div>
            <nav className="inspection-view-tabs" aria-label="表单视图">
              {["页面", "数据"].map((tab) => (
                <button
                  key={tab}
                  className={inspectionTab === tab ? "active" : ""}
                  onClick={() => setInspectionTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </nav>
            {inspectionTab === "页面" ? (
            <form ref={approvalFormRef} className="inspection-form" onSubmit={submitForm}>
              <header className="inspection-form-header">
                <div>
                  <p>{activeFormRecord.detail}</p>
                  <h1 id="inspection-form-title">{activeFormRecord.title}</h1>
                  <span>
                    {isApprovalFlow
                      ? "请如实填写隐患情况，提交后将进入审批流程。"
                      : "请如实填写现场检查情况，带 * 的项目为必填项。"}
                  </span>
                </div>
                <button
                  type="button"
                  className="form-back"
                  onClick={() => {
                    setActiveForm(false);
                    setSubmitted(false);
                  }}
                >
                  返回清单
                </button>
              </header>
              <section className="form-section">
                <h2>填报信息</h2>
                <div className="form-fields">
                  <label>
                    填报人 *
                    <input name="reporter" defaultValue="张宇" required />
                  </label>
                  <label>
                    检查日期 *
                    <input
                      name="inspectionDate"
                      type="date"
                      defaultValue="2026-07-29"
                      required
                    />
                  </label>
                  <label>
                    作业班次 *
                    <select name="shift" defaultValue="早班" required>
                      <option>早班</option>
                      <option>中班</option>
                      <option>夜班</option>
                    </select>
                  </label>
                  <label>
                    作业地点 *
                    <input
                      name="location"
                      placeholder="例如：西翼 3# 平巷"
                      required
                    />
                  </label>
                </div>
              </section>
              <section className="form-section">
                <h2>现场检查</h2>
                <div className="inspection-items">
                  <div className="inspection-item">
                    <b>凿岩设备防护装置完好</b>
                    <span>
                      <label>
                        <input
                          type="radio"
                          name="equipment"
                          value="normal"
                          required
                        />{" "}
                        正常
                      </label>
                      <label>
                        <input type="radio" name="equipment" value="issue" />{" "}
                        发现问题
                      </label>
                    </span>
                  </div>
                  <div className="inspection-item">
                    <b>作业面通风与照明符合要求</b>
                    <span>
                      <label>
                        <input
                          type="radio"
                          name="environment"
                          value="normal"
                          required
                        />{" "}
                        正常
                      </label>
                      <label>
                        <input type="radio" name="environment" value="issue" />{" "}
                        发现问题
                      </label>
                    </span>
                  </div>
                  <div className="inspection-item">
                    <b>人员防护用品佩戴规范</b>
                    <span>
                      <label>
                        <input
                          type="radio"
                          name="protection"
                          value="normal"
                          required
                        />{" "}
                        正常
                      </label>
                      <label>
                        <input type="radio" name="protection" value="issue" />{" "}
                        发现问题
                      </label>
                    </span>
                  </div>
                </div>
              </section>
              <section className="form-section">
                <h2>问题说明</h2>
                <label className="wide-field">
                  隐患描述与整改建议
                  <textarea
                    name="description"
                    rows="3"
                    defaultValue={selectedApprovalDraft?.description ?? ""}
                    placeholder="如发现隐患，请填写具体位置、问题描述及建议措施。"
                  />
                </label>
              </section>
              <footer className="form-actions">
                {submitted ? (
                  <span className="submit-status">
                    <CheckmarkCircle24Regular /> {isApprovalFlow
                      ? "已提交，等待审批流程处理"
                      : "已提交，等待负责人复核"}
                  </span>
                ) : (
                  <span>
                    {isApprovalFlow
                      ? "填写完成后将提交至隐患排查审批流程。"
                      : "填写完成后可直接提交至隐患排查记录。"}
                  </span>
                )}
                <div>
                  <button
                    type="button"
                    className="form-secondary"
                    onClick={() => {
                      setActiveForm(false);
                      setSubmitted(false);
                    }}
                  >
                    取消
                  </button>
                  {isApprovalFlow ? (
                    <button
                      type="button"
                      className="form-draft"
                      onClick={saveApprovalDraft}
                    >
                      暂存
                    </button>
                  ) : null}
                  <button type="submit" className="form-primary">
                    {isApprovalFlow ? "提交审批流程" : "提交排查表"}
                  </button>
                </div>
              </footer>
            </form>
            ) : (
              <section className="inspection-data-view" aria-label={`${activeFormRecord.title}历史数据`}>
                <header>
                  <div>
                    <p>历史填报数据</p>
                    <h2>{activeFormRecord.title}</h2>
                  </div>
                  <span>共 {filteredInspectionRecords.length} 条记录</span>
                </header>
                <form
                  className="inspection-data-filter"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setInspectionFilters(inspectionFilterDraft);
                  }}
                >
                  <label>
                    填报人
                    <input
                      value={inspectionFilterDraft.reporter}
                      maxLength={10}
                      placeholder="请输入填报人"
                      onChange={(event) => setInspectionFilterDraft((current) => ({ ...current, reporter: event.target.value }))}
                    />
                  </label>
                  <label>
                    检查日期
                    <input
                      type="date"
                      value={inspectionFilterDraft.date}
                      onChange={(event) => setInspectionFilterDraft((current) => ({ ...current, date: event.target.value }))}
                    />
                  </label>
                  <label>
                    作业班次
                    <select
                      value={inspectionFilterDraft.shift}
                      onChange={(event) => setInspectionFilterDraft((current) => ({ ...current, shift: event.target.value }))}
                    >
                      <option value="">全部班次</option>
                      <option value="早班">早班</option>
                      <option value="中班">中班</option>
                      <option value="夜班">夜班</option>
                    </select>
                  </label>
                  <div className="inspection-filter-actions">
                    <button type="submit" className="inspection-filter-search">搜索</button>
                    <button
                      type="button"
                      onClick={() => {
                        const emptyFilters = { reporter: "", date: "", shift: "" };
                        setInspectionFilterDraft(emptyFilters);
                        setInspectionFilters(emptyFilters);
                      }}
                    >
                      重置
                    </button>
                  </div>
                </form>
                <div className="inspection-data-actions">
                  <div>
                    <button
                      type="button"
                      className="inspection-action-primary"
                      onClick={() => {
                        setInspectionTab("页面");
                        setSubmitted(false);
                        onAction("请填写新的隐患排查记录");
                      }}
                    >
                      <Add24Regular />
                      新增
                    </button>
                    <button type="button" onClick={() => importInputRef.current?.click()}>
                      导入
                    </button>
                    <button type="button" onClick={() => exportRecords(filteredInspectionRecords)}>导出</button>
                  </div>
                  <input
                    ref={importInputRef}
                    className="inspection-import-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={importRecords}
                  />
                </div>
                <div className="inspection-data-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>填报人</th><th>检查日期</th><th>作业班次</th><th>作业地点</th><th>凿岩设备防护装置完好</th><th>作业面通风与照明符合要求</th><th>人员防护用品佩戴规范</th><th>隐患描述与整改建议</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInspectionRecords.length ? filteredInspectionRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.reporter}</td><td>{record.date}</td><td>{record.shift}</td><td>{record.location}</td><td>{record.equipment}</td><td>{record.environment}</td><td>{record.protection}</td><td>{record.description}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="8" className="inspection-data-empty">暂无历史填报数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </section>
        ) : (
          <>
            <div className="prevention-breadcrumb">
              <span>双重预防管理</span>
              <ChevronRight24Regular />
              <button onClick={() => setSelectedItem("隐患排查治理")}>
                隐患排查治理
              </button>
              <ChevronRight24Regular />
              <strong id="prevention-page-title">{selectedLabel}</strong>
            </div>
            <div className="prevention-strip" />
            {["岗位隐患排查清单", "隐患排查审批流程"].includes(
              selectedItem,
            ) ? (
              <section className="prevention-list prevention-menu-catalog">
                <div className="prevention-list-heading">
                  <h2>全部</h2>
                </div>
                <div className="prevention-catalog-grid">
                  {(selectedItem === "隐患排查审批流程"
                    ? preventionApprovalFlows
                    : preventionForms
                  ).map((form) => {
                    const { title, icon: Icon, tone } = form;
                    return (
                    <button
                      type="button"
                      className="prevention-catalog-card"
                      key={title}
                      onClick={() => openForm(form, selectedItem)}
                    >
                      <span className={`prevention-form-icon ${tone}`}>
                        <Icon />
                      </span>
                      <b>{title}</b>
                    </button>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="prevention-list prevention-empty-content">
                <div className="prevention-list-heading">
                  <h2>功能页面</h2>
                </div>
                <p>请从左侧菜单选择需要处理的业务。</p>
              </section>
            )}
          </>
        )}
      </div>
      {approvalDraftRestore ? (
        <div
          className="process-draft-restore-layer"
          role="presentation"
          onMouseDown={() => setApprovalDraftRestore(null)}
        >
          <section
            className="process-draft-restore-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-draft-restore-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p>草稿箱提醒</p>
                <h2 id="approval-draft-restore-title">发现同名流程草稿</h2>
              </div>
              <button
                type="button"
                className="process-dialog-close"
                aria-label="关闭草稿提醒"
                onClick={() => setApprovalDraftRestore(null)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="process-draft-restore-body">
              <p>当前草稿箱内有 {approvalDraftRestore.drafts.length} 条“{approvalDraftRestore.form.title}”草稿，请选择恢复继续填报，或重新发起新的流程。</p>
              <div className="process-draft-options" role="radiogroup" aria-label="选择要恢复的流程草稿">
                {approvalDraftRestore.drafts.map((draft) => (
                  <label key={draft.id} className={selectedApprovalDraftId === draft.id ? "selected" : ""}>
                    <input
                      type="radio"
                      name="approval-process-draft"
                      value={draft.id}
                      checked={selectedApprovalDraftId === draft.id}
                      onChange={() => setSelectedApprovalDraftId(draft.id)}
                    />
                    <span><b>{draft.name}</b><small>最后保存：{draft.initiatedAt}</small></span>
                  </label>
                ))}
              </div>
            </div>
            <footer>
              <button type="button" className="process-reject" onClick={() => openFormDirect(approvalDraftRestore.form, approvalDraftRestore.source)}>重新发起</button>
              <button
                type="button"
                className="process-approve"
                onClick={() => {
                  const draft = approvalDraftRestore.drafts.find((item) => item.id === selectedApprovalDraftId);
                  openFormDirect(approvalDraftRestore.form, approvalDraftRestore.source, draft);
                }}
              >
                恢复并继续填报
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function MockApplicationPage({ app, onReturn, onAction, onSwitchApplication }) {
  const Icon = app.icon;
  const sampleRows = [
    `核对今日${app.name}记录`,
    `完成本周${app.description}复核`,
    `查看待处理异常提醒`,
  ];
  return (
    <section className="mock-app-page" aria-labelledby="mock-app-title">
      <aside className="mock-app-sidebar" aria-label={`${app.name}功能导航`}>
        <AppSwitcher currentName={app.name} onSelect={onSwitchApplication} />
        <nav>
          <button className="mock-nav-item active">
            <Home24Regular />
            应用概览
          </button>
          <button
            className="mock-nav-item"
            onClick={() => onAction(`${app.name}待办`)}
          >
            <ClipboardTask24Regular />
            待办处理
          </button>
          <button
            className="mock-nav-item"
            onClick={() => onAction(`${app.name}记录`)}
          >
            <DocumentText24Regular />
            业务记录
          </button>
          <button
            className="mock-nav-item"
            onClick={() => onAction(`${app.name}统计`)}
          >
            <DataBarVertical24Regular />
            数据统计
          </button>
        </nav>
      </aside>
      <div className="mock-app-content">
        <div className="mock-app-breadcrumb">
          <span>应用中心</span>
          <ChevronRight24Regular />
          <strong>{app.name}</strong>
        </div>
        <header className="mock-app-header">
          <span className="mock-app-icon">
            <Icon />
          </span>
          <div>
            <h1 id="mock-app-title">{app.name}工作台</h1>
            <p>示例业务页面，数据仅用于界面演示。</p>
          </div>
          <button
            className="mock-primary-action"
            onClick={() => onAction(`新建${app.name}记录`)}
          >
            <Add24Regular />
            新建记录
          </button>
        </header>
        <section className="mock-metrics" aria-label={`${app.name}概览`}>
          <div>
            <span>待处理</span>
            <b>6</b>
            <small>需你跟进</small>
          </div>
          <div>
            <span>今日记录</span>
            <b>14</b>
            <small>已同步更新</small>
          </div>
          <div>
            <span>异常提醒</span>
            <b>2</b>
            <small>等待复核</small>
          </div>
        </section>
        <section className="mock-work-list" aria-labelledby="mock-work-title">
          <div>
            <h2 id="mock-work-title">待处理事项</h2>
            <button onClick={() => onAction(`${app.name}全部事项`)}>
              查看全部 <ArrowRight24Regular />
            </button>
          </div>
          {sampleRows.map((row, index) => (
            <button key={row} onClick={() => onAction(row)}>
              <span className={`mock-row-icon tone-${index}`}>
                <ClipboardTask24Regular />
              </span>
              <span>
                <b>{row}</b>
                <small>{index === 0 ? "今天需完成" : "已分配给你"}</small>
              </span>
              <ArrowRight24Regular />
            </button>
          ))}
        </section>
        <button className="prevention-back" onClick={onReturn}>
          返回工作台 <ArrowRight24Regular />
        </button>
      </div>
    </section>
  );
}

function ActivityFeed({ onOpen, onOpenAll }) {
  return (
    <section className="activity-feed" aria-labelledby="activity-title">
      <div className="section-title">
        <div>
          <h2 id="activity-title">动态</h2>
        </div>
        <button className="quiet-action" onClick={onOpenAll}>
          查看全部 <ArrowRight24Regular />
        </button>
      </div>
      <div className="feed-list">
        {feedItems.length ? (
          feedItems.map(
            ({ person, tone, avatar, headline, detail, time, icon: Icon }) => (
              <button
                className="feed-item"
                key={headline}
                onClick={() => onOpen(headline)}
              >
                <span className={`feed-avatar ${tone}`}>{avatar}</span>
                <span className="feed-content">
                  <span>
                    <b>{person}</b>
                    <strong>{headline}</strong>
                  </span>
                  <p>{detail}</p>
                  <time>{time}</time>
                </span>
                <Icon className="feed-icon" />
              </button>
            ),
          )
        ) : (
          <div className="empty-feed">
            <LineHorizontal320Regular />
            <p>这一类动态已全部处理。</p>
          </div>
        )}
      </div>
    </section>
  );
}

function CommandPanel({ onAction, onOpenTask, onOpenProcess, onOpenDynamics }) {
  return (
    <aside className="command-panel" aria-label="快捷操作">
      <p>快捷入口</p>
      <button className="command-primary" onClick={onOpenTask}>
        <span>
          <Add24Regular />
        </span>
        <div>
          <b>发起任务</b>
          <small>交办或跟进一项工作</small>
        </div>
        <ArrowRight24Regular />
      </button>
      <button
        className="command-secondary"
        onClick={onOpenProcess}
      >
        <span>
          <Flowchart24Regular />
        </span>
        <div>
          <b>发起流程</b>
          <small>提交一次审批或申请</small>
        </div>
        <ArrowRight24Regular />
      </button>
      <button className="command-secondary" onClick={onOpenDynamics}>
        <span>
          <Chat24Regular />
        </span>
        <div>
          <b>发动态</b>
          <small>发布一条安全工作动态</small>
        </div>
        <ArrowRight24Regular />
      </button>
    </aside>
  );
}

function ActionDialog({ title, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  if (!title) return null;
  const isTask = title === "发起任务";
  return (
    <div className="dialog-layer" onMouseDown={onClose} role="presentation">
      <section
        className="action-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" aria-label="关闭" onClick={onClose}>
          ×
        </button>
        {submitted ? (
          <div className="dialog-success">
            <CheckmarkCircle24Regular />
            <h2>已准备好继续</h2>
            <p>这是工作台演示状态，实际接入后将在此进入对应业务表单。</p>
            <button onClick={onClose}>完成</button>
          </div>
        ) : (
          <>
            <p className="dialog-kicker">快速创建</p>
            <h2 id="action-dialog-title">{title}</h2>
            <p className="dialog-description">
              {isTask
                ? "填写最小必要信息，将工作直接交给相应负责人。"
                : "从授权模板中选择流程，减少重复填写。"}
            </p>
            <label>
              {isTask ? "任务名称" : "流程模板"}
              <input
                autoFocus
                placeholder={
                  isTask ? "例如：完成现场安全检查" : "例如：选择设备检修申请"
                }
              />
            </label>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={onClose}>
                取消
              </button>
              <button
                className="primary-button"
                onClick={() => setSubmitted(true)}
              >
                继续
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const dashboardItems = [
  {
    id: "safety",
    name: "安全风险总览",
    description: "风险等级、隐患整改与作业预警的综合视图",
    metrics: [
      ["今日检查", "28", "较昨日 +4"],
      ["待整改隐患", "16", "4 项临近逾期"],
      ["高风险作业", "3", "均在监控中"],
      ["整改完成率", "86%", "本月累计"],
    ],
    charts: ["risk", "rectification", "sources", "trend"],
  },
  {
    id: "device",
    name: "设备运行态势",
    description: "关键设备运行状态、点检执行与故障分布",
    metrics: [
      ["设备总数", "248", "当前在线 243"],
      ["待点检", "12", "今日需完成"],
      ["异常设备", "5", "等待处理"],
      ["设备完好率", "97.8%", "较上月 +0.6%"],
    ],
    charts: ["device", "trend", "sources", "risk"],
  },
  {
    id: "production",
    name: "生产进度跟踪",
    description: "产量计划、班组进度与生产指标完成情况",
    metrics: [
      ["本月产量", "12.6 万吨", "计划完成 91%"],
      ["今日进尺", "186 米", "较计划 +12 米"],
      ["作业班组", "8", "全部已开工"],
      ["生产达成率", "94%", "较上周 +3%"],
    ],
    charts: ["progress", "trend", "device", "rectification"],
  },
  {
    id: "emergency",
    name: "应急管理看板",
    description: "应急物资、演练计划和预案执行情况",
    metrics: [
      ["应急物资", "356", "库存充足"],
      ["本月演练", "4", "已完成 3 项"],
      ["应急预案", "18", "均为有效版本"],
      ["响应及时率", "100%", "本季度累计"],
    ],
    charts: ["sources", "progress", "risk", "trend"],
  },
];

function DashboardChart({ type }) {
  const chartRef = useRef(null);
  useEffect(() => {
    const node = chartRef.current;
    if (!node) return undefined;
    const chart = init(node);
    const axisStyle = {
      axisLine: { lineStyle: { color: "#dce4ec" } },
      axisLabel: { color: "#7b8998", fontSize: 10 },
      splitLine: { lineStyle: { color: "#eef2f6" } },
    };
    const options = {
      risk: {
        title: {
          text: "风险等级分布",
          left: 14,
          top: 11,
          textStyle: { fontSize: 13, fontWeight: 700, color: "#1f2d3d" },
        },
        tooltip: { trigger: "item" },
        legend: { bottom: 8, textStyle: { fontSize: 10, color: "#7b8998" } },
        series: [
          {
            type: "pie",
            radius: ["42%", "66%"],
            center: ["50%", "51%"],
            label: { show: false },
            data: [
              { value: 4, name: "重大", itemStyle: { color: "#d95745" } },
              { value: 12, name: "较大", itemStyle: { color: "#e89b3e" } },
              { value: 31, name: "一般", itemStyle: { color: "#3c98d3" } },
              { value: 47, name: "低风险", itemStyle: { color: "#5bb287" } },
            ],
          },
        ],
      },
      rectification: {
        title: {
          text: "隐患整改闭环",
          left: 14,
          top: 11,
          textStyle: { fontSize: 13, fontWeight: 700, color: "#1f2d3d" },
        },
        tooltip: { trigger: "axis" },
        grid: { left: 35, right: 16, top: 49, bottom: 26 },
        xAxis: {
          type: "category",
          data: ["一车间", "二车间", "南区", "北区", "选矿"],
          ...axisStyle,
        },
        yAxis: { type: "value", ...axisStyle },
        series: [
          {
            type: "bar",
            barWidth: 15,
            itemStyle: { color: "#1779ba", borderRadius: [3, 3, 0, 0] },
            data: [16, 22, 13, 18, 25],
          },
          {
            type: "bar",
            barWidth: 15,
            itemStyle: { color: "#a9d8c3", borderRadius: [3, 3, 0, 0] },
            data: [12, 18, 10, 15, 21],
          },
        ],
      },
      sources: {
        title: {
          text: "问题来源占比",
          left: 14,
          top: 11,
          textStyle: { fontSize: 13, fontWeight: 700, color: "#1f2d3d" },
        },
        tooltip: { trigger: "item" },
        series: [
          {
            type: "pie",
            radius: "62%",
            center: ["50%", "55%"],
            label: { formatter: "{b}\n{d}%", fontSize: 10, color: "#637386" },
            data: [
              { value: 38, name: "日常检查", itemStyle: { color: "#438fc1" } },
              { value: 26, name: "专项排查", itemStyle: { color: "#78b996" } },
              { value: 21, name: "巡检上报", itemStyle: { color: "#e3a056" } },
              { value: 15, name: "其他", itemStyle: { color: "#a8b5c3" } },
            ],
          },
        ],
      },
      trend: {
        title: {
          text: "近 7 日趋势",
          left: 14,
          top: 11,
          textStyle: { fontSize: 13, fontWeight: 700, color: "#1f2d3d" },
        },
        tooltip: { trigger: "axis" },
        grid: { left: 35, right: 17, top: 48, bottom: 26 },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: ["周一", "周二", "周三", "周四", "周五", "周六", "今日"],
          ...axisStyle,
        },
        yAxis: { type: "value", ...axisStyle },
        series: [
          {
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 5,
            lineStyle: { width: 2, color: "#1779ba" },
            itemStyle: { color: "#1779ba" },
            areaStyle: { color: "rgba(23,121,186,.12)" },
            data: [12, 18, 15, 24, 21, 27, 28],
          },
        ],
      },
      device: {
        title: {
          text: "设备状态监测",
          left: 14,
          top: 11,
          textStyle: { fontSize: 13, fontWeight: 700, color: "#1f2d3d" },
        },
        tooltip: { trigger: "axis" },
        radar: {
          center: ["50%", "57%"],
          radius: "59%",
          indicator: [
            { name: "运行", max: 100 },
            { name: "点检", max: 100 },
            { name: "保养", max: 100 },
            { name: "检修", max: 100 },
            { name: "备件", max: 100 },
          ],
          axisName: { color: "#718093", fontSize: 10 },
          splitArea: { areaStyle: { color: ["#fbfcfd", "#f4f7f9"] } },
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: [92, 84, 78, 88, 72],
                areaStyle: { color: "rgba(41,137,190,.23)" },
                lineStyle: { color: "#2684bf" },
                itemStyle: { color: "#2684bf" },
              },
            ],
          },
        ],
      },
      progress: {
        title: {
          text: "本月计划完成情况",
          left: 14,
          top: 11,
          textStyle: { fontSize: 13, fontWeight: 700, color: "#1f2d3d" },
        },
        tooltip: { trigger: "axis" },
        grid: { left: 36, right: 17, top: 48, bottom: 26 },
        xAxis: {
          type: "category",
          data: ["采矿", "掘进", "选矿", "运输", "充填"],
          ...axisStyle,
        },
        yAxis: { type: "value", max: 120, ...axisStyle },
        series: [
          {
            type: "bar",
            barWidth: 15,
            data: [96, 91, 103, 88, 94],
            itemStyle: { color: "#5bb287", borderRadius: [3, 3, 0, 0] },
          },
          {
            type: "line",
            symbol: "none",
            lineStyle: { color: "#de8c36", type: "dashed" },
            data: [100, 100, 100, 100, 100],
          },
        ],
      },
    };
    chart.setOption(options[type]);
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(node);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [type]);
  return (
    <div className="dashboard-chart" ref={chartRef} aria-label="数据图表" />
  );
}

function DashboardPage() {
  const [selectedId, setSelectedId] = useState("safety");
  const active =
    dashboardItems.find((item) => item.id === selectedId) ?? dashboardItems[0];
  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar" aria-label="看板列表">
          <header>
            <DataBarVertical24Regular />
            <span>数据看板</span>
          </header>
          <nav>
            {dashboardItems.map((item) => (
              <button
                key={item.id}
                className={item.id === selectedId ? "active" : ""}
                onClick={() => setSelectedId(item.id)}
              >
                <span>
                  <b>{item.name}</b>
                  <small>{item.description}</small>
                </span>
                <ChevronRight24Regular />
              </button>
            ))}
          </nav>
        </aside>
        <div className="dashboard-content">
          <header className="dashboard-header">
            <div>
              <p>看板中心</p>
              <h1 id="dashboard-title">{active.name}</h1>
              <span>{active.description}</span>
            </div>
            <button>
              <CalendarLtr24Regular />近 30 天<ChevronDown24Regular />
            </button>
          </header>
          <div className="dashboard-metrics">
            {active.metrics.map(([label, value, note]) => (
              <article key={label}>
                <span>{label}</span>
                <b>{value}</b>
                <small>{note}</small>
              </article>
            ))}
          </div>
          <div className="dashboard-charts">
            {active.charts.map((type) => (
              <section key={`${active.id}-${type}`}>
                <DashboardChart type={type} />
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmbeddedDynamicsPage({ onAction, initialTab = "动态" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [libraryTab, setLibraryTab] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const dynamicNumbers = [
    { category: "安全管理", tone: "blue", name: "安全检查动态号", favorite: true },
    { category: "安全管理", tone: "blue", name: "隐患整改动态号", recent: true },
    { category: "安全管理", tone: "blue", name: "班前会动态号" },
    { category: "生产管理", tone: "gold", name: "生产日报动态号", favorite: true },
    { category: "生产管理", tone: "gold", name: "现场交接动态号", recent: true },
    { category: "生产管理", tone: "gold", name: "产量异常动态号" },
    { category: "设备管理", tone: "red", name: "设备点检动态号" },
    { category: "设备管理", tone: "red", name: "设备保养动态号", recent: true },
    { category: "设备管理", tone: "red", name: "故障处置动态号" },
  ];
  const visibleDynamicNumbers = dynamicNumbers.filter(
    (item) =>
      (libraryTab === "全部" ||
        (libraryTab === "我的收藏" && item.favorite) ||
        (libraryTab === "最近使用" && item.recent)) &&
      (!keyword.trim() || item.name.includes(keyword.trim())),
  );

  return (
    <section className="embedded-dynamics-page" aria-label="动态">
      <nav className="embedded-dynamic-tabs" aria-label="动态页面">
        {["动态", "发动态"].map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
      {activeTab === "动态" ? (
        <iframe
          className="embedded-dynamics-frame"
          src={`${prototypeBase}index.html`}
          title="动态"
        />
      ) : (
        <section className="dynamic-publish-library" aria-label="发动态">
          <header>
            <div className="dynamic-publish-tabs" role="tablist" aria-label="动态号筛选">
              {["全部", "我的收藏", "最近使用"].map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={libraryTab === tab}
                  className={libraryTab === tab ? "active" : ""}
                  onClick={() => setLibraryTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="请输入动态号名称关键字"
              aria-label="搜索动态号"
            />
          </header>
          <div className="dynamic-publish-groups">
            {["安全管理", "生产管理", "设备管理"].map((category) => {
              const items = visibleDynamicNumbers.filter((item) => item.category === category);
              const tone = dynamicNumbers.find((item) => item.category === category)?.tone;
              return (
                <section key={category} className={`dynamic-publish-group ${tone}`}>
                  <h2><i />{category}<small>（{items.length}）</small></h2>
                  {items.length ? items.map((item) => (
                    <button key={item.name} onClick={() => onAction?.(`已选择${item.name}`)}>{item.name}</button>
                  )) : <p>暂无动态号</p>}
                </section>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}

function EmbeddedTaskFrame({ view, title, className }) {
  const request = JSON.stringify({ view });
  const srcDoc = newTaskPrototypeHtml
    .replace(
      "</head>",
      `<style>
        /* Navigation and context are provided by the host system. */
        .sidebar, .topbar, .logic { display: none !important; }
        .app, .stage { height: 100dvh !important; }
        .content { padding: 16px 20px 32px !important; }
        html, body { background: #f5f7fa !important; }
      </style></head>`,
    )
    .replace(
      "</body>",
      `<script>
        (function () {
          var request = ${request};
          var taskViews = ["view-template", "view-publish", "view-mytask", "view-ledger", "view-personnel"];
          if (taskViews.indexOf(request.view) !== -1 && typeof window.switchView === "function") {
            window.switchView(request.view);
          }
        })();
      </script></body>`,
    );

  return <iframe key={view} className={className} srcDoc={srcDoc} title={title} />;
}

function EmbeddedTasksPage({ initialTab = "我的任务" }) {
  const taskTabs = [
    { label: "发布任务", view: "view-publish" },
    { label: "我的任务", view: "view-mytask" },
    { label: "任务总台账", view: "view-ledger" },
    { label: "人员明细", view: "view-personnel" },
  ];
  const [activeTaskTab, setActiveTaskTab] = useState(initialTab);
  const activeTask = taskTabs.find((item) => item.label === activeTaskTab);

  return (
    <section className="embedded-tasks-page" aria-label="任务">
      <nav className="embedded-task-tabs" aria-label="任务页面">
        {taskTabs.map((tab) => (
          <button
            key={tab.label}
            className={activeTaskTab === tab.label ? "active" : ""}
            onClick={() => setActiveTaskTab(tab.label)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <EmbeddedTaskFrame
        view={activeTask.view}
        className="embedded-tasks-frame"
        title={activeTask.label}
      />
    </section>
  );
}

function EmbeddedWarningsPage() {
  const warningTabs = [
    { label: "预警分级看板", view: "warning-dashboard" },
    { label: "预警任务", view: "warning-task" },
    { label: "预警信息表统计", view: "warning-stats" },
    { label: "预警统计", view: "warning-stats-aggr" },
  ];
  const [activeWarningTab, setActiveWarningTab] = useState("预警任务");
  const activeWarning = warningTabs.find(
    (item) => item.label === activeWarningTab,
  );

  return (
    <section className="embedded-warnings-page" aria-label="预警">
      <nav className="embedded-warning-tabs" aria-label="预警页面">
        {warningTabs.map((tab) => (
          <button
            key={tab.label}
            className={activeWarningTab === tab.label ? "active" : ""}
            onClick={() => setActiveWarningTab(tab.label)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <iframe
        key={activeWarning.view}
        className="embedded-warnings-frame"
        src={`${prototypeBase}预警.html?view=${activeWarning.view}`}
        title={activeWarning.label}
      />
    </section>
  );
}

function EmbeddedLowCodePage({ module, view }) {
  const query = new URLSearchParams({ module, ...(view ? { view } : {}) });
  const request = JSON.stringify({
    module,
    view,
    dictionaries: {
      // The embedded flow editor reads this as the system "流程分类" dictionary.
      flowCategory: FLOW_CATEGORY_DICTIONARY_OPTIONS,
    },
  });
  const srcDoc = lowCodePrototypeHtml.replace(
    "<head>",
    `<head><script>window.__hostLowCodeRequest = ${request};</script>`,
  );

  return (
    <section className="settings-lowcode-embed" aria-label={module}>
      <iframe
        key={query.toString()}
        srcDoc={srcDoc}
        title="低代码平台"
      />
    </section>
  );
}

function WarningCenterPage() {
  const [filter, setFilter] = useState("全部");
  const warnings = [
    {
      category: "设备",
      tone: "urgent",
      title: "南区排水泵房液位接近预警阈值",
      detail: "液位持续上升，请安排现场复核并填写处置记录。",
      time: "10 分钟前",
      status: "待处置",
    },
    {
      category: "作业",
      tone: "notice",
      title: "动火作业许可将在 2 小时后到期",
      detail: "作业区域：南区 2# 采场，请确认是否继续作业。",
      time: "今天 12:30",
      status: "需关注",
    },
    {
      category: "环境",
      tone: "urgent",
      title: "北区提升机房视频监控离线",
      detail: "监控设备已离线 18 分钟，请联系值班人员恢复。",
      time: "今天 11:46",
      status: "待处置",
    },
    {
      category: "设备",
      tone: "check",
      title: "3 号球磨机振动值恢复正常",
      detail: "预警已自动解除，系统已保留本次监测记录。",
      time: "今天 09:05",
      status: "已解除",
    },
  ];
  const visible =
    filter === "全部"
      ? warnings
      : warnings.filter((warning) => warning.category === filter);
  return (
    <section
      className="safety-dynamics-page"
      aria-labelledby="warning-center-title"
    >
      <header className="safety-dynamics-header">
        <div>
          <p>安全管理</p>
          <h1 id="warning-center-title">预警中心</h1>
          <span>集中查看设备、作业与环境风险预警，及时跟进现场处置。</span>
        </div>
        <button>
          <ErrorCircle24Regular />3 项待处置
        </button>
      </header>
      <div className="safety-dynamics-summary">
        <article>
          <b>3</b>
          <span>待处置预警</span>
        </article>
        <article>
          <b>1</b>
          <span>需关注预警</span>
        </article>
        <article>
          <b>8</b>
          <span>今日已解除</span>
        </article>
      </div>
      <section className="safety-dynamics-list">
        <header>
          <div className="safety-filter" role="tablist">
            {["全部", "设备", "作业", "环境"].map((item) => (
              <button
                key={item}
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button className="safety-view-all">
            查看预警台账 <ArrowRight24Regular />
          </button>
        </header>
        {visible.map((warning) => (
          <article className="safety-dynamics-row" key={warning.title}>
            <span className={`safety-type ${warning.tone}`}>预警</span>
            <div>
              <h2>{warning.title}</h2>
              <p>{warning.detail}</p>
            </div>
            <time>
              {warning.time}
              <b>{warning.status}</b>
            </time>
            <ChevronRight24Regular />
          </article>
        ))}
      </section>
    </section>
  );
}

const todoGroups = [
  {
    id: "task",
    label: "待执行任务",
    tone: "blue",
    icon: ClipboardTask24Regular,
    items: [
      {
        title: "完成设备点检复核",
        source: "设备管理",
        deadline: "今天 17:30 前",
        owner: "陈伟",
        note: "3 号球磨机点检结果待复核",
        action: "执行任务",
      },
      {
        title: "平巷凿岩作业隐患排查",
        source: "双重预防机制",
        deadline: "今天 16:00 前",
        owner: "李明",
        note: "按岗位隐患排查表完成现场检查",
        action: "执行任务",
      },
      {
        title: "南区排水泵巡检",
        source: "设备管理",
        deadline: "明天 10:00 前",
        owner: "设备管理部",
        note: "完成设备运行参数记录",
        action: "执行任务",
      },
      {
        title: "提交第二季度风险排查记录",
        source: "安全管理",
        deadline: "7 月 30 日 18:00 前",
        owner: "安环部",
        note: "补充风险分级管控记录",
        action: "执行任务",
      },
      {
        title: "核对井下作业人员定位数据",
        source: "安全管理",
        deadline: "7 月 31 日 10:00 前",
        owner: "调度室",
        note: "补充人员定位异常情况说明",
        action: "执行任务",
      },
      {
        title: "更新选矿车间设备保养记录",
        source: "设备管理",
        deadline: "7 月 31 日 17:00 前",
        owner: "刘海",
        note: "同步本周关键设备保养信息",
        action: "执行任务",
      },
    ],
  },
  {
    id: "approval",
    label: "待审批流程",
    tone: "orange",
    icon: ApprovalsApp24Regular,
    items: [
      {
        title: "矿山应急照明设备采购申请",
        source: "机电管理部",
        deadline: "今天内处理",
        owner: "王建国",
        note: "当前节点：部门负责人审批",
        action: "去审批",
      },
      {
        title: "南区 2# 采场动火作业申请",
        source: "生产管理部",
        deadline: "今天 15:00 前",
        owner: "李明",
        note: "当前节点：安全管理部审批",
        action: "去审批",
      },
      {
        title: "碎矿车间停机检修计划",
        source: "设备管理部",
        deadline: "明天 09:00 前",
        owner: "赵磊",
        note: "当前节点：设备平台主管审批",
        action: "去审批",
      },
    ],
  },
  {
    id: "warning",
    label: "待处理预警",
    tone: "red",
    icon: ErrorCircle24Regular,
    items: [
      {
        title: "南区排水泵房液位接近预警阈值",
        source: "安全预警",
        deadline: "立即处理",
        owner: "系统监测",
        note: "液位持续上升，请安排现场复核",
        action: "查看处置",
      },
      {
        title: "动火作业许可将在 2 小时后到期",
        source: "作业许可",
        deadline: "今天 14:30 前",
        owner: "系统监测",
        note: "作业区域：南区 2# 采场",
        action: "查看处置",
      },
      {
        title: "高风险作业视频监控离线",
        source: "安全预警",
        deadline: "今天内处理",
        owner: "安环部",
        note: "北区提升机房摄像头离线 18 分钟",
        action: "查看处置",
      },
      {
        title: "井下局部通风机风量波动预警",
        source: "通风监测",
        deadline: "今天 18:00 前",
        owner: "通风区",
        note: "连续 15 分钟低于设定风量阈值",
        action: "查看处置",
      },
      {
        title: "尾矿库在线监测数据中断",
        source: "安全预警",
        deadline: "明天 09:00 前",
        owner: "环保部",
        note: "请核实数据采集设备与通信链路",
        action: "查看处置",
      },
    ],
  },
];

function TodoOverviewPage({ onOpenTasks, onOpenProcesses, onOpenSafety }) {
  const visibleGroups = todoGroups;
  const totalCount = todoGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  );
  const handleAction = (group) => {
    if (group.id === "task") onOpenTasks();
    else if (group.id === "approval") onOpenProcesses();
    else onOpenSafety();
  };
  return (
    <section
      className="todo-overview-page"
      aria-labelledby="todo-overview-title"
    >
      <header className="todo-overview-header">
        <div>
          <h1 id="todo-overview-title">待办总览</h1>
          <span>集中处理分派给你的任务、流程和安全预警。</span>
        </div>
        <div className="todo-overview-total">
          <b>{totalCount}</b>
          <span>项待办需要处理</span>
        </div>
      </header>
      <div className="todo-groups">
        {visibleGroups.map((group) => {
          const Icon = group.icon;
          const displayedItems = group.items.slice(0, 5);
          return (
            <section className={`todo-group ${group.tone}`} key={group.id}>
              <header>
                <span>
                  <Icon />
                </span>
                <div>
                  <h2>{group.label}</h2>
                  <p>{group.items.length} 项待你处理</p>
                </div>
                <button onClick={() => handleAction(group)}>
                  查看全部 <ArrowRight24Regular />
                </button>
              </header>
              <div>
                {displayedItems.map((item) => (
                  <article className="todo-row" key={item.title}>
                    <span className="todo-row-dot" />
                    <div className="todo-row-main">
                      <h3>{item.title}</h3>
                      <p>
                        <b>{item.source}</b>
                        <i>发起人：{item.owner}</i>
                        {item.note}
                      </p>
                    </div>
                    <time>{item.deadline}</time>
                    <button onClick={() => handleAction(group)}>
                      {item.action}
                      <ArrowRight24Regular />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

const settingsItems = [
  {
    label: "安全动态",
    icon: ShieldCheckmark24Regular,
    title: "安全动态",
    description: "设置与你相关的安全提醒、预警升级和动态订阅。",
  },
  {
    label: "工作表",
    icon: DocumentText24Regular,
    title: "工作表",
    description: "管理常用工作表模板、字段与填报规则。",
  },
  {
    label: "任务",
    icon: ClipboardTask24Regular,
    title: "任务",
    description: "配置任务提醒、默认执行人和逾期处理规则。",
  },
  {
    label: "流程",
    icon: Flowchart24Regular,
    title: "流程",
    description: "维护审批模板、节点时限与流转通知。",
  },
  {
    label: "预警",
    icon: ErrorCircle24Regular,
    title: "预警",
    description: "维护预警规则、分级管控与处置统计。",
  },
  {
    label: "数据台",
    icon: DataBarVertical24Regular,
    title: "数据台",
    description: "管理业务数据接入、字段口径和同步状态。",
  },
  {
    label: "数据看板",
    icon: DataBarVertical24Regular,
    title: "数据看板",
    description: "设置个人看板的指标、排序和共享范围。",
  },
  {
    label: "应用中心",
    icon: Apps24Regular,
    title: "应用中心",
    description: "管理应用、工作表与流程中心的配置入口。",
  },
  {
    label: "系统设置",
    icon: Settings24Regular,
    title: "系统设置",
    description: "管理系统角色、用户和个人账号信息。",
  },
];

function appendOrganizationNode(nodes, parentId, node) {
  return nodes.map((item) =>
    item.id === parentId
      ? { ...item, children: [...item.children, node] }
      : {
          ...item,
          children: appendOrganizationNode(item.children, parentId, node),
        },
  );
}

function updateOrganizationNode(nodes, nodeId, updates) {
  return nodes.map((item) =>
    item.id === nodeId
      ? { ...item, ...updates }
      : {
          ...item,
          children: updateOrganizationNode(item.children, nodeId, updates),
        },
  );
}

function removeOrganizationNode(nodes, nodeId) {
  return nodes
    .filter((item) => item.id !== nodeId)
    .map((item) => ({
      ...item,
      children: removeOrganizationNode(item.children, nodeId),
    }));
}

function flattenOrganizationNodes(nodes) {
  return nodes.flatMap((node) => [
    node,
    ...flattenOrganizationNodes(node.children),
  ]);
}

function OrganizationTree({ nodes, onAddChild, onEdit, onDelete }) {
  return (
    <ul className="organization-tree">
      {nodes.map((node) => (
        <li key={node.id}>
          <span className="organization-node">
            <People24Regular />
            <b>{node.name}</b>
            <small>
              {node.children.length
                ? `${node.children.length} 个下级组织`
                : "末级组织"}
            </small>
            <span className="organization-node-actions">
              <button
                aria-label={`新增 ${node.name} 的下级组织`}
                onClick={() => onAddChild(node)}
              >
                新增
              </button>
              <button
                aria-label={`编辑 ${node.name}`}
                onClick={() => onEdit(node)}
              >
                编辑
              </button>
              <button
                aria-label={`删除 ${node.name}`}
                className="danger"
                onClick={() => onDelete(node)}
              >
                删除
              </button>
            </span>
          </span>
          {node.children.length ? (
            <OrganizationTree
              nodes={node.children}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SinglePersonPickerDialog({
  organizations,
  users,
  selectedUser,
  onSelect,
  onClose,
  title = "选择人员",
  selectedLabel = "已选人员",
}) {
  const [draftUser, setDraftUser] = useState(selectedUser);
  const [selectedOrganization, setSelectedOrganization] = useState(
    draftUser?.organizationId ?? users[0]?.organizationId ?? organizations[0]?.id ?? "",
  );
  const visibleUsers = selectedOrganization
    ? users.filter((user) => user.organizationId === selectedOrganization)
    : users;
  const OrganizationPickerTree = ({ nodes }) => (
    <ul className="assignment-org-tree">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            className={selectedOrganization === node.id ? "active" : ""}
            onClick={() => setSelectedOrganization(node.id)}
          >
            {node.name}
          </button>
          {node.children?.length ? (
            <OrganizationPickerTree nodes={node.children} />
          ) : null}
        </li>
      ))}
    </ul>
  );
  return (
    <div
      className="single-person-picker-layer"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        className="management-dialog assign-user-dialog organization-leader-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="single-person-picker-title"
      >
        <header>
          <h2 id="single-person-picker-title">{title}</h2>
          <button
            type="button"
            className="management-dialog-close"
            aria-label={`关闭${title}弹窗`}
            onClick={onClose}
          >
            <DismissRegular />
          </button>
        </header>
        <div className="assign-user-body">
          <aside>
            <header>组织架构</header>
            {organizations.length ? (
              <OrganizationPickerTree nodes={organizations} />
            ) : (
              <p className="assign-user-empty">暂无可选组织</p>
            )}
          </aside>
          <section>
            <header>
              人员 <span>{visibleUsers.length} 人</span>
            </header>
            {visibleUsers.length ? (
              visibleUsers.map((user) => (
                <label key={user.id}>
                  <input
                    type="radio"
                    name="single-person-picker"
                    checked={draftUser?.id === user.id}
                    onChange={() => setDraftUser(user)}
                  />
                  <span>
                    <b>{user.name}</b>
                    <small>{user.account} · {user.department}</small>
                  </span>
                </label>
              ))
            ) : (
              <p className="assign-user-empty">该组织暂无人员</p>
            )}
          </section>
          <section>
            <header>
              {selectedLabel} <span>{draftUser ? "1 人" : "0 人"}</span>
            </header>
            {draftUser ? (
              <div>
                <span>
                  <b>{draftUser.name}</b>
                  <small>{draftUser.department || "未设置部门"}</small>
                </span>
                <button type="button" onClick={() => setDraftUser(null)}>移除</button>
              </div>
            ) : (
              <p className="assign-user-empty">暂未选择人员</p>
            )}
          </section>
        </div>
        <footer>
          <button type="button" className="management-dialog-cancel" onClick={onClose}>取消</button>
          <button
            type="button"
            className="management-dialog-primary"
            onClick={() => {
              onSelect(draftUser);
              onClose();
            }}
          >
            确认选择
          </button>
        </footer>
      </section>
    </div>
  );
}

function MultiPersonPickerDialog({
  organizations,
  users,
  selectedUsers,
  onSelect,
  onClose,
  title = "分配用户",
  selectedLabel = "已选人员",
}) {
  const [draftUserIds, setDraftUserIds] = useState(selectedUsers.map((user) => user.id));
  const [selectedOrganization, setSelectedOrganization] = useState(
    selectedUsers[0]?.organizationId ?? users[0]?.organizationId ?? organizations[0]?.id ?? "",
  );
  const organizationOf = (user) => user.organizationId ?? user.organization;
  const visibleUsers = selectedOrganization
    ? users.filter((user) => organizationOf(user) === selectedOrganization)
    : users;
  const chosenUsers = users.filter((user) => draftUserIds.includes(user.id));
  const allVisibleSelected = visibleUsers.length > 0 && visibleUsers.every((user) => draftUserIds.includes(user.id));
  const toggleUser = (id) => setDraftUserIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const selectVisibleUsers = () => setDraftUserIds((current) => [...new Set([...current, ...visibleUsers.map((user) => user.id)])]);
  const clearVisibleUsers = () => setDraftUserIds((current) => current.filter((id) => !visibleUsers.some((user) => user.id === id)));
  const OrganizationPickerTree = ({ nodes }) => (
    <ul className="assignment-org-tree">
      {nodes.map((node) => (
        <li key={node.id}>
          <button type="button" className={selectedOrganization === node.id ? "active" : ""} onClick={() => setSelectedOrganization(node.id)}>{node.name}</button>
          {node.children?.length ? <OrganizationPickerTree nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="single-person-picker-layer" onMouseDown={onClose} role="presentation">
      <section className="management-dialog assign-user-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="multi-person-picker-title">
        <header>
          <h2 id="multi-person-picker-title">{title}</h2>
          <button type="button" className="management-dialog-close" aria-label={`关闭${title}弹窗`} onClick={onClose}><DismissRegular /></button>
        </header>
        <div className="assign-user-body">
          <aside>
            <header>组织架构</header>
            {organizations.length ? <OrganizationPickerTree nodes={organizations} /> : <p className="assign-user-empty">暂无可选组织</p>}
          </aside>
          <section>
            <header>
              <div className="assign-user-list-heading"><b>人员</b><span>{visibleUsers.length} 人</span></div>
              {visibleUsers.length ? <div className="assign-user-bulk-actions"><button type="button" onClick={selectVisibleUsers} disabled={allVisibleSelected}>全选</button><button type="button" onClick={clearVisibleUsers} disabled={!visibleUsers.some((user) => draftUserIds.includes(user.id))}>全不选</button></div> : null}
            </header>
            {visibleUsers.length ? visibleUsers.map((user) => (
              <label key={user.id}>
                <input type="checkbox" checked={draftUserIds.includes(user.id)} onChange={() => toggleUser(user.id)} />
                <span><b>{user.name}</b><small>{user.account} · {user.department}</small></span>
              </label>
            )) : <p className="assign-user-empty">该组织暂无人员</p>}
          </section>
          <section>
            <header>{selectedLabel} <span>{chosenUsers.length} 人</span></header>
            {chosenUsers.length ? chosenUsers.map((user) => (
              <div key={user.id}>
                <span><b>{user.name}</b><small>{user.department || "未设置部门"}</small></span>
                <button type="button" onClick={() => toggleUser(user.id)}>移除</button>
              </div>
            )) : <p className="assign-user-empty">暂未选择人员</p>}
          </section>
        </div>
        <footer>
          <button type="button" className="management-dialog-cancel" onClick={onClose}>取消</button>
          <button type="button" className="management-dialog-primary" onClick={() => { onSelect(chosenUsers); onClose(); }}>确认选择</button>
        </footer>
      </section>
    </div>
  );
}

function OrganizationCenter({ organizations, setOrganizations, users }) {
  const [formState, setFormState] = useState(null);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("公司");
  const [organizationLeader, setOrganizationLeader] = useState(null);
  const [leaderPickerOpen, setLeaderPickerOpen] = useState(false);
  const [message, setMessage] = useState("尚未建立组织架构，可手动新增根组织。");
  const hasOrganization = organizations.length > 0;
  const isRootOrganizationForm =
    formState?.mode === "root" ||
    (formState?.mode === "edit" &&
      organizations.some((node) => node.id === formState.node.id));
  const openLeaderPicker = () => setLeaderPickerOpen(true);
  const openRootForm = () => {
    setOrganizationName("");
    setOrganizationType("公司");
    setOrganizationLeader(null);
    setFormState({ mode: "root" });
  };
  const openChildForm = (node) => {
    setOrganizationName("");
    setOrganizationType("部门");
    setOrganizationLeader(null);
    setFormState({ mode: "child", node });
  };
  const openEditForm = (node) => {
    setOrganizationName(node.name);
    setOrganizationType(node.type ?? "部门");
    setOrganizationLeader(
      users.find((user) => user.id === node.leaderId) ??
        (node.leaderName
          ? { id: node.leaderId ?? "", name: node.leaderName, department: "" }
          : null),
    );
    setFormState({ mode: "edit", node });
  };
  const saveOrganization = (event) => {
    event.preventDefault();
    const name = organizationName.trim();
    if (!name) return;
    const organizationData = isRootOrganizationForm
      ? { name }
      : {
          name,
          type: organizationType,
          leaderId: organizationLeader?.id ?? "",
          leaderName: organizationLeader?.name ?? "",
        };
    if (formState.mode === "edit") {
      setOrganizations((current) =>
        updateOrganizationNode(current, formState.node.id, organizationData),
      );
      setMessage(`已更新组织：${name}`);
    } else {
      const node = { id: `org-${Date.now()}`, ...organizationData, children: [] };
      setOrganizations((current) =>
        formState.mode === "child"
          ? appendOrganizationNode(current, formState.node.id, node)
          : [...current, node],
      );
      setMessage(`已新增组织：${name}`);
    }
    setOrganizationName("");
    setOrganizationLeader(null);
    setFormState(null);
  };
  const deleteOrganization = (node) => {
    setOrganizations((current) => removeOrganizationNode(current, node.id));
    setMessage(`已删除组织：${node.name}`);
  };
  const formTitle =
    formState?.mode === "edit"
      ? `编辑组织：${formState.node.name}`
      : formState?.mode === "child"
        ? `新增 ${formState.node.name} 的下级组织`
        : "新增根组织";
  return (
    <>
      <section
        className="organization-center"
        aria-labelledby="organization-title"
      >
        <div className="organization-toolbar">
          <div>
            <h2 id="organization-title">组织架构</h2>
          </div>
        </div>
        <div
          className={
            hasOrganization ? "organization-tip locked" : "organization-tip"
          }
        >
          <CheckmarkCircle24Regular />
          <span>{message}</span>
        </div>
        {hasOrganization ? (
          <div className="organization-tree-panel">
            <div className="organization-tree-heading">
              <b>组织树</b>
            </div>
            <OrganizationTree
              nodes={organizations}
              onAddChild={openChildForm}
              onEdit={openEditForm}
              onDelete={deleteOrganization}
            />
          </div>
        ) : (
          <div className="organization-empty">
            <People24Regular />
            <h3>还没有组织架构</h3>
            <p>请先新增组织架构根组织</p>
            <button onClick={openRootForm}>
              <Add24Regular />
              新增根组织
            </button>
          </div>
        )}
      </section>
      {formState ? (
        <div
          className="management-dialog-layer"
          onMouseDown={() => setFormState(null)}
          role="presentation"
        >
          <form
            className="management-dialog"
            onSubmit={saveOrganization}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="organization-dialog-title"
          >
            <header>
              <h2 id="organization-dialog-title">{formTitle}</h2>
              <button
                type="button"
                className="management-dialog-close"
                aria-label="关闭新增组织弹窗"
                onClick={() => setFormState(null)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="management-dialog-body">
              {formState.mode === "child" ? (
                <label>
                  上级组织
                  <input value={formState.node.name} disabled />
                </label>
              ) : null}
              <label>
                组织名称
                <input
                  value={organizationName}
                  onChange={(event) => setOrganizationName(event.target.value)}
                  placeholder="例如：安全管理部"
                  autoFocus
                />
              </label>
              {!isRootOrganizationForm ? (
                <>
                  <label>
                    组织类型
                    <select
                      value={organizationType}
                      onChange={(event) => setOrganizationType(event.target.value)}
                    >
                      <option>公司</option>
                      <option>部门</option>
                    </select>
                  </label>
                  <label className="organization-leader-field">
                    负责人
                    <button type="button" onClick={openLeaderPicker}>
                      {organizationLeader
                        ? `${organizationLeader.name}${organizationLeader.department ? ` · ${organizationLeader.department}` : ""}`
                        : "选择负责人"}
                    </button>
                  </label>
                </>
              ) : null}
            </div>
            <footer>
              <button
                type="button"
                className="management-dialog-cancel"
                onClick={() => setFormState(null)}
              >
                取消
              </button>
              <button type="submit" className="management-dialog-primary">
                保存组织
              </button>
            </footer>
          </form>
        </div>
      ) : null}
      {leaderPickerOpen ? (
        <SinglePersonPickerDialog
          organizations={organizations}
          users={users}
          selectedUser={organizationLeader}
          onSelect={setOrganizationLeader}
          onClose={() => setLeaderPickerOpen(false)}
          title="选择负责人"
          selectedLabel="已选负责人"
        />
      ) : null}
    </>
  );
}

function UserOrganizationTree({ nodes, selectedId, onSelect }) {
  return (
    <ul className="user-organization-tree">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            className={selectedId === node.id ? "active" : ""}
            onClick={() => onSelect(node.id)}
          >
            <span>{node.name}</span>
          </button>
          {node.children.length ? (
            <UserOrganizationTree
              nodes={node.children}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function organizationPath(nodes, id, trail = []) {
  for (const node of nodes) {
    const nextTrail = [...trail, node.name];
    if (node.id === id) return nextTrail.slice(-3).join(" / ");
    const found = organizationPath(node.children, id, nextTrail);
    if (found) return found;
  }
  return "";
}

function UserMultiSelect({ label, options, value, onChange, activeMenu, setActiveMenu }) {
  const open = activeMenu === label;
  const selectedLabels = options.filter((option) => value.includes(option));
  const toggleOption = (option) =>
    onChange(
      value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option],
    );

  return (
    <div className="user-multi-select">
      <span>{label}</span>
      <button
        type="button"
        className={open ? "open" : ""}
        aria-expanded={open}
        onClick={() => setActiveMenu(open ? "" : label)}
      >
        <b>{selectedLabels.length ? selectedLabels.join("、") : `请选择${label}`}</b>
        <ChevronDown24Regular />
      </button>
      {open ? (
        <div className="user-multi-options" role="listbox" aria-label={label}>
          {options.map((option) => (
            <label key={option}>
              <input
                type="checkbox"
                checked={value.includes(option)}
                onChange={() => toggleOption(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function UserManagementCenter({ organizations, setOrganizations, users, setUsers }) {
  const [activeTab, setActiveTab] = useState("users");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [dialog, setDialog] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [userAccount, setUserAccount] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [userPassword, setUserPassword] = useState("abc123#");
  const [userOrganization, setUserOrganization] = useState("");
  const [userPositions, setUserPositions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [activeUserMultiSelect, setActiveUserMultiSelect] = useState("");
  const [userFieldErrors, setUserFieldErrors] = useState({});
  const [filters, setFilters] = useState({
    name: "",
    account: "",
    phone: "",
    status: "",
  });
  const [notice, setNotice] = useState("");
  const importRef = useRef(null);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const organizationNodes = flattenOrganizationNodes(organizations);
  const selectedNode = organizationNodes.find(
    (node) => node.id === selectedOrganization,
  );
  const visibleUsers = users.filter(
    (user) =>
      (!selectedOrganization || user.organizationId === selectedOrganization) &&
      (!filters.name || user.name.includes(filters.name)) &&
      (!filters.account || user.account.includes(filters.account)) &&
      (!filters.phone || user.phone.includes(filters.phone)) &&
      (!filters.status || user.status === filters.status),
  );
  const openUserDialog = () => {
    setEditingUser(null);
    setUserName("");
    setUserAccount("");
    setUserPhone("");
    setUserPassword("abc123#");
    setUserOrganization(selectedOrganization || organizationNodes[0]?.id || "");
    setUserPositions([]);
    setUserRoles([]);
    setUserFieldErrors({});
    setActiveUserMultiSelect("");
    setDialog("create");
  };
  const openEditUserDialog = (user) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserAccount(user.account);
    setUserPhone(user.phone === "未填写" ? "" : user.phone);
    setUserPassword(user.password || "abc123#");
    setUserOrganization(user.organizationId || organizationNodes[0]?.id || "");
    setUserPositions(user.positions || []);
    setUserRoles(user.roles || []);
    setUserFieldErrors({});
    setActiveUserMultiSelect("");
    setDialog("create");
  };
  const clearUserFieldError = (field) =>
    setUserFieldErrors((current) =>
      current[field] ? { ...current, [field]: "" } : current,
    );
  const addUser = (event) => {
    event.preventDefault();
    const name = userName.trim();
    const account = userAccount.trim();
    const errors = {
      name: name ? "" : "请输入用户名称",
      phone: !userPhone || /^\d{11}$/.test(userPhone) ? "" : "请输入 11 位数字手机号",
      account: account ? "" : "请输入账号",
      password: userPassword.trim() ? "" : "请输入默认密码",
      organization: userOrganization ? "" : "请选择所属组织",
    };
    if (Object.values(errors).some(Boolean)) {
      setUserFieldErrors(errors);
      return;
    }
    const department = organizationPath(organizations, userOrganization);
    const userData = {
      name,
      account,
      phone: userPhone || "未填写",
      password: userPassword,
      organizationId: userOrganization,
      department,
      positions: userPositions,
      roles: userRoles,
    };
    setUsers((current) =>
      editingUser
        ? current.map((user) =>
            user.id === editingUser.id ? { ...user, ...userData } : user,
          )
        : [
            ...current,
            { id: `user-${Date.now()}`, ...userData, status: "启用" },
          ],
    );
    setSelectedOrganization(userOrganization);
    setDialog(null);
    setNotice(`${editingUser ? "已保存用户" : "已新增用户"}：${name}`);
  };
  const downloadUserTemplate = () => {
    const csv =
      "\ufeff账号,用户名称,手机号,所属组织\nzhangyu,张宇,13800000000,安全管理部\n";
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "用户导入模板.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const importUsers = (event) => {
    const file = event.target.files?.[0];
    if (!file || !organizationNodes.length) return;
    const organizationId = selectedOrganization || organizationNodes[0].id;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = String(reader.result)
        .replace(/^\ufeff/, "")
        .split(/\r?\n/)
        .slice(1)
        .filter(Boolean);
      const imported = rows
        .map((line, index) => {
          const [account, name, phone] = line
            .split(",")
            .map((item) => item.trim());
          return account && name
            ? {
                id: `import-${Date.now()}-${index}`,
                account,
                name,
                phone: phone || "未填写",
                password: "abc123#",
                organizationId,
                department: organizationPath(organizations, organizationId),
                status: "启用",
              }
            : null;
        })
        .filter(Boolean);
      if (imported.length) {
        setUsers((current) => [...current, ...imported]);
        setNotice(`已导入 ${imported.length} 位用户`);
      } else setNotice("未识别到可导入的用户数据");
      setDialog(null);
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  };
  const toggleUser = (id) =>
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? { ...user, status: user.status === "启用" ? "停用" : "启用" }
          : user,
      ),
    );
  const removeUser = (id) => {
    setUsers((current) => current.filter((user) => user.id !== id));
    setNotice("已删除用户");
  };
  const requestStatusToggle = (user) =>
    setConfirmAction({ type: "status", user });
  const requestDelete = (user) => {
    if (user.status === "启用") {
      setNotice(`用户“${user.name}”处于启用状态，请先停用后再删除`);
      return;
    }
    setConfirmAction({ type: "delete", user });
  };
  const requestPasswordReset = (user) =>
    setConfirmAction({ type: "reset-password", user });
  const requestCreateCancel = () => setConfirmAction({ type: "cancel-create" });
  const confirmUserAction = () => {
    if (confirmAction.type === "cancel-create") {
      setDialog(null);
      setActiveUserMultiSelect("");
    } else if (confirmAction.type === "status") {
      toggleUser(confirmAction.user.id);
      setNotice(
        `已${confirmAction.user.status === "启用" ? "停用" : "启用"}用户：${confirmAction.user.name}`,
      );
    } else if (confirmAction.type === "reset-password") {
      setUsers((current) =>
        current.map((user) =>
          user.id === confirmAction.user.id
            ? { ...user, password: "abc123#" }
            : user,
        ),
      );
      setNotice(`已将 ${confirmAction.user.name} 的密码重置为 abc123#`);
    } else {
      removeUser(confirmAction.user.id);
    }
    setConfirmAction(null);
  };
  return (
    <>
      <section className="user-management" aria-label="用户中心管理">
        <nav className="user-management-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "organization"}
            className={activeTab === "organization" ? "active" : ""}
            onClick={() => setActiveTab("organization")}
          >
            <b>组织架构</b>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "users"}
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            <b>用户中心</b>
          </button>
        </nav>
        {activeTab === "organization" ? (
          <OrganizationCenter
            organizations={organizations}
            setOrganizations={setOrganizations}
            users={users}
          />
        ) : (
          <section className="user-center-layout">
            <aside className="user-center-organization">
              <header>
                <b>组织架构</b>
                <span>{organizationNodes.length} 个组织</span>
              </header>
              {organizations.length ? (
                <UserOrganizationTree
                  nodes={organizations}
                  selectedId={selectedOrganization}
                  onSelect={setSelectedOrganization}
                />
              ) : (
                <div className="user-center-org-empty">
                  请先在组织架构中建立组织
                </div>
              )}
            </aside>
            <section className="user-directory">
              <header>
                <div>
                  <h2>{selectedNode?.name || "全部用户"}</h2>
                </div>
              </header>
              <div className="user-filter">
                <input
                  placeholder="用户名称"
                  value={filters.name}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <input
                  placeholder="账号"
                  value={filters.account}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      account: event.target.value,
                    }))
                  }
                />
                <input
                  placeholder="手机号"
                  value={filters.phone}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
                <select
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="">全部状态</option>
                  <option>启用</option>
                  <option>停用</option>
                </select>
                <button onClick={() => setNotice("已按当前条件筛选用户")}>
                  确定
                </button>
                <button
                  onClick={() =>
                    setFilters({ name: "", account: "", phone: "", status: "" })
                  }
                >
                  重置
                </button>
              </div>
              <div className="user-directory-actions">
                <button
                  className="user-add"
                  onClick={openUserDialog}
                  disabled={!organizationNodes.length}
                >
                  <Add24Regular />
                  新增用户
                </button>
              </div>
              {organizationNodes.length ? (
                <div className="user-directory-list">
                  <div className="user-directory-head">
                    <span>账号</span>
                    <span>用户名称</span>
                    <span>部门</span>
                    <span>手机号</span>
                    <span>用户状态</span>
                    <span>操作</span>
                  </div>
                  {visibleUsers.length ? (
                    visibleUsers.map((user) => (
                      <div className="user-directory-row" key={user.id}>
                        <span>{user.account}</span>
                        <strong>{user.name}</strong>
                        <span>{user.department}</span>
                        <span>{user.phone}</span>
                        <button
                          className={
                            user.status === "启用"
                              ? "user-status enabled"
                              : "user-status"
                          }
                          onClick={() => requestStatusToggle(user)}
                          aria-label={`切换 ${user.name} 状态`}
                        >
                          <i />
                          <b>{user.status}</b>
                        </button>
                        <span className="user-row-actions">
                          <button
                            onClick={() => openEditUserDialog(user)}
                          >
                            编辑
                          </button>
                          <button onClick={() => requestDelete(user)}>
                            删除
                          </button>
                          <button
                            onClick={() => requestPasswordReset(user)}
                          >
                            重置密码
                          </button>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="user-directory-empty">
                      <People24Regular />
                      <h3>暂无符合条件的用户</h3>
                    </div>
                  )}
                </div>
              ) : (
                <div className="user-directory-empty">
                  <People24Regular />
                  <h3>请先建立组织架构</h3>
                </div>
              )}
            </section>
          </section>
        )}
      </section>
      {dialog ? (
        <div
          className="management-dialog-layer"
          onMouseDown={() => setDialog(null)}
          role="presentation"
        >
          <div
            className="management-dialog user-management-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-dialog-title"
          >
            {dialog === "create" ? (
              <form onSubmit={addUser}>
                <header>
                  <h2 id="user-dialog-title">{editingUser ? "编辑用户" : "新增用户"}</h2>
                  <button
                    type="button"
                    className="management-dialog-close"
                    aria-label="关闭新增用户弹窗"
                    onClick={() => setDialog(null)}
                  >
                    <DismissRegular />
                  </button>
                </header>
                <div
                  className="management-dialog-body user-create-form"
                  onMouseDown={(event) => {
                    if (!event.target.closest(".user-multi-select")) {
                      setActiveUserMultiSelect("");
                    }
                  }}
                >
                  <label className={userFieldErrors.name ? "field-error" : ""}>
                    <span className="user-field-label"><i aria-hidden="true">*</i>用户名称</span>
                    <input
                      value={userName}
                      maxLength={10}
                      onChange={(event) => {
                        setUserName(event.target.value);
                        clearUserFieldError("name");
                      }}
                      placeholder="例如：张宇"
                      autoFocus
                    />
                    {userFieldErrors.name ? <em>{userFieldErrors.name}</em> : null}
                  </label>
                  <label className={userFieldErrors.phone ? "field-error" : ""}>
                    手机号
                    <input
                      type="tel"
                      value={userPhone}
                      maxLength={11}
                      inputMode="numeric"
                      onChange={(event) => {
                        setUserPhone(
                          event.target.value.replace(/\D/g, "").slice(0, 11),
                        );
                        clearUserFieldError("phone");
                      }}
                      placeholder="例如：13800000000"
                    />
                    {userFieldErrors.phone ? <em>{userFieldErrors.phone}</em> : null}
                  </label>
                  <label className={userFieldErrors.account ? "field-error" : ""}>
                    <span className="user-field-label"><i aria-hidden="true">*</i>账号</span>
                    <input
                      value={userAccount}
                      onChange={(event) => {
                        setUserAccount(event.target.value);
                        clearUserFieldError("account");
                      }}
                      placeholder="例如：zhangyu"
                    />
                    {userFieldErrors.account ? <em>{userFieldErrors.account}</em> : null}
                  </label>
                  <label className={userFieldErrors.password ? "field-error" : ""}>
                    默认密码
                    <input
                      type="text"
                      value={userPassword}
                      onChange={(event) => {
                        setUserPassword(event.target.value);
                        clearUserFieldError("password");
                      }}
                    />
                    {userFieldErrors.password ? <em>{userFieldErrors.password}</em> : null}
                  </label>
                  <label className={`user-organization-field${userFieldErrors.organization ? " field-error" : ""}`}>
                    所属组织
                    <select
                      value={userOrganization}
                      onChange={(event) => {
                        setUserOrganization(event.target.value);
                        clearUserFieldError("organization");
                      }}
                    >
                      {organizationNodes.map((node) => (
                        <option key={node.id} value={node.id}>
                          {organizationPath(organizations, node.id)}
                        </option>
                      ))}
                    </select>
                    {userFieldErrors.organization ? <em>{userFieldErrors.organization}</em> : null}
                  </label>
                  <UserMultiSelect
                    label="岗位"
                    options={managedPositionOptions}
                    value={userPositions}
                    onChange={setUserPositions}
                    activeMenu={activeUserMultiSelect}
                    setActiveMenu={setActiveUserMultiSelect}
                  />
                  <UserMultiSelect
                    label="角色"
                    options={managedRoleOptions}
                    value={userRoles}
                    onChange={setUserRoles}
                    activeMenu={activeUserMultiSelect}
                    setActiveMenu={setActiveUserMultiSelect}
                  />
                </div>
                <footer>
                  <button
                    type="button"
                    className="management-dialog-cancel"
                    onClick={requestCreateCancel}
                  >
                    取消
                  </button>
                  <button type="submit" className="management-dialog-primary">
                    保存用户
                  </button>
                </footer>
              </form>
            ) : (
              <>
                <header>
                  <h2 id="user-dialog-title">导入用户</h2>
                  <button
                    type="button"
                    className="management-dialog-close"
                    aria-label="关闭导入用户弹窗"
                    onClick={() => setDialog(null)}
                  >
                    <DismissRegular />
                  </button>
                </header>
                <div className="management-dialog-body">
                  <label>
                    导入到组织
                    <input value={selectedNode?.name || "默认组织"} disabled />
                  </label>
                  <label>
                    选择文件
                    <input
                      ref={importRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={importUsers}
                    />
                  </label>
                  <button
                    type="button"
                    className="user-template"
                    onClick={downloadUserTemplate}
                  >
                    <DocumentText24Regular />
                    下载导入模板
                  </button>
                </div>
                <footer>
                  <button
                    type="button"
                    className="management-dialog-cancel"
                    onClick={() => setDialog(null)}
                  >
                    取消
                  </button>
                </footer>
              </>
            )}
          </div>
        </div>
      ) : null}
      {confirmAction ? (
        <div
          className="management-dialog-layer"
          onMouseDown={() => setConfirmAction(null)}
          role="presentation"
        >
          <section
            className="management-dialog management-confirm-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-confirm-title"
          >
            <header>
              <h2 id="user-confirm-title">确认操作</h2>
              <button
                type="button"
                className="management-dialog-close"
                aria-label="关闭确认弹窗"
                onClick={() => setConfirmAction(null)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="management-dialog-body">
              <p>
                {confirmAction.type === "cancel-create"
                  ? `确定取消${editingUser ? "编辑" : "新增"}用户吗？已填写的信息将不会保存。`
                  : confirmAction.type === "delete"
                  ? `确定删除用户“${confirmAction.user.name}”吗？删除后无法恢复。`
                  : confirmAction.type === "reset-password"
                  ? `确定将用户“${confirmAction.user.name}”的密码重置为默认密码 abc123# 吗？`
                  : `确定${confirmAction.user.status === "启用" ? "停用" : "启用"}用户“${confirmAction.user.name}”吗？`}
              </p>
            </div>
            <footer>
              <button
                type="button"
                className="management-dialog-cancel"
                onClick={() => setConfirmAction(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="management-dialog-primary"
                onClick={confirmUserAction}
              >
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {notice ? (
        <div className="user-management-notice" role="status">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      ) : null}
    </>
  );
}

function RolePermissionCheckbox({ node, selectedIds, getLeafIds, onToggle }) {
  const inputRef = useRef(null);
  const descendantIds = getLeafIds(node);
  const selectedCount = descendantIds.filter((id) => selectedIds.has(id)).length;
  const isChecked = selectedCount === descendantIds.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < descendantIds.length;

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = isIndeterminate;
  }, [isIndeterminate]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      checked={isChecked}
      aria-checked={isIndeterminate ? "mixed" : isChecked}
      data-indeterminate={isIndeterminate ? "true" : undefined}
      onChange={() => onToggle(node)}
    />
  );
}

function RbacPage({ onAction }) {
  const [roles, setRoles] = useState([
    {
      id: "admin",
      name: "系统管理员",
      creator: "系统管理员",
      status: "启用",
      createdAt: "2026-07-01 09:20",
    },
    {
      id: "safety",
      name: "安全管理员",
      creator: "张宇",
      status: "启用",
      createdAt: "2026-07-08 14:35",
    },
    {
      id: "executor",
      name: "任务执行人",
      creator: "李明",
      status: "启用",
      createdAt: "2026-07-12 10:16",
    },
    {
      id: "viewer",
      name: "数据查看员",
      creator: "王强",
      status: "停用",
      createdAt: "2026-07-15 16:42",
    },
  ]);
  const menuTree = [
    { name: "工作台" },
    {
      name: "应用",
      children: [
        {
          name: "双重预防机制",
          children: [
            { name: "风险分级管控" },
            {
              name: "隐患排查治理",
              children: [
                { name: "法律法规" },
                { name: "制度文件" },
                { name: "隐患排查任务发布" },
                {
                  name: "岗位隐患排查清单",
                  children: preventionForms.map((form) => ({ name: form.title })),
                },
                { name: "隐患排查治理记录" },
                {
                  name: "隐患排查审批流程",
                  children: preventionApprovalFlows.map((flow) => ({ name: flow.title })),
                },
                { name: "隐患排查工作表" },
                { name: "隐患整改通知单" },
                { name: "隐患整改台账" },
                { name: "隐患信息统计" },
                { name: "隐患汇报" },
              ],
            },
            { name: "风险告知卡" },
            { name: "风险四色图" },
          ],
        },
        {
          name: "安全管理",
          children: [
            { name: "应用概览" },
            { name: "待办处理" },
            { name: "业务记录" },
            { name: "数据统计" },
          ],
        },
        {
          name: "设备管理",
          children: [
            { name: "应用概览" },
            { name: "待办处理" },
            { name: "业务记录" },
            { name: "数据统计" },
          ],
        },
        {
          name: "火工品管理",
          children: [
            { name: "应用概览" },
            { name: "待办处理" },
            { name: "业务记录" },
            { name: "数据统计" },
          ],
        },
        {
          name: "生产管理",
          children: [
            { name: "应用概览" },
            { name: "待办处理" },
            { name: "业务记录" },
            { name: "数据统计" },
          ],
        },
        {
          name: "机电管理",
          children: [
            { name: "应用概览" },
            { name: "待办处理" },
            { name: "业务记录" },
            { name: "数据统计" },
          ],
        },
        {
          name: "消防管理",
          children: [
            { name: "应用概览" },
            { name: "待办处理" },
            { name: "业务记录" },
            { name: "数据统计" },
          ],
        },
        {
          name: "应急管理",
          children: [
            { name: "应用概览" },
            { name: "待办处理" },
            { name: "业务记录" },
            { name: "数据统计" },
          ],
        },
      ],
    },
    {
      name: "任务",
      children: [
        { name: "发布任务" },
        {
          name: "我的任务",
          children: [
            { name: "我发起的" },
            { name: "已执行" },
            { name: "已转发" },
            { name: "我撤回的" },
            { name: "我参与的" },
          ],
        },
        { name: "任务总台账" },
        { name: "人员明细" },
      ],
    },
    {
      name: "流程",
      children: [
        {
          name: "发起流程",
          children: [
            {
              name: "人资管理",
              children: [
                { name: "员工离职申请" },
                { name: "职员晋升审批" },
                { name: "职员调岗审批" },
              ],
            },
            {
              name: "基建管理",
              children: [
                { name: "地表基建项目报建申请" },
                { name: "年度工程计划编制审批" },
                { name: "项目合同申报审批" },
              ],
            },
            {
              name: "选矿管理",
              children: [
                { name: "换矿申请" },
                { name: "选厂药剂领用申请" },
                { name: "材料采购流程" },
              ],
            },
          ],
        },
        { name: "待审批" },
        { name: "已审批" },
        { name: "抄送我的" },
        { name: "我发起的" },
      ],
    },
    {
      name: "动态",
      children: [{ name: "动态列表" }, { name: "发动态" }],
    },
    {
      name: "预警",
      children: [
        { name: "预警分级看板" },
        { name: "预警任务" },
        { name: "预警信息表统计" },
        { name: "预警统计" },
      ],
    },
    {
      name: "看板",
      children: dashboardItems.map((item) => ({ name: item.name })),
    },
    {
      name: "设置中心",
      children: [
        { name: "安全动态" },
        { name: "工作表" },
        { name: "任务" },
        { name: "流程" },
        {
          name: "预警",
          children: [
            { name: "预警信息表" },
            { name: "预警规则设置" },
          ],
        },
        { name: "数据台" },
        { name: "数据看板" },
        { name: "应用中心" },
        {
          name: "系统设置",
          children: [
            { name: "角色权限" },
            { name: "组织用户" },
            { name: "菜单管理" },
            { name: "字典管理" },
            { name: "企业设置" },
          ],
        },
      ],
    },
  ];
  const leafMenus = (nodes) =>
    nodes.flatMap((node) =>
      node.children?.length ? leafMenus(node.children) : [node.name],
    );
  const roleActionPermissions = {
    "设置中心/系统设置/角色权限": [
      "查看",
      "新增",
      "编辑",
      "删除",
      "分配用户",
      "数据权限",
    ],
  };
  const tabPermissionPaths = new Set([
    ...preventionForms.map(
      (form) =>
        `应用/双重预防机制/隐患排查治理/岗位隐患排查清单/${form.title}`,
    ),
    ...preventionApprovalFlows.map(
      (flow) =>
        `应用/双重预防机制/隐患排查治理/隐患排查审批流程/${flow.title}`,
    ),
  ]);
  const roleActionIdsForPath = (path) =>
    (roleActionPermissions[path] ?? []).map(
      (action) => `button:${path}:${action}`,
    );
  const roleTabIdsForPath = (path) =>
    tabPermissionPaths.has(path)
      ? ["页面", "数据"].map((tab) => `tab:${path}:${tab}`)
      : [];
  const createRolePermissionTree = (nodes, parents = []) =>
    nodes.map((node) => {
      const path = [...parents, node.name];
      const key = path.join("/");
      if (node.children?.length) {
        return {
          id: `menu:${key}`,
          name: node.name,
          type: "menu",
          children: createRolePermissionTree(node.children, path),
        };
      }
      const actions = roleActionPermissions[key] ?? [];
      const tabs = tabPermissionPaths.has(key) ? ["页面", "数据"] : [];
      return {
        id: `page:${key}`,
        name: node.name,
        type: "page",
        children: actions.length || tabs.length
          ? [
              ...actions.map((action) => ({
              id: `button:${key}:${action}`,
              name: action,
              type: "button",
              })),
              ...tabs.map((tab) => ({
                id: `tab:${key}:${tab}`,
                name: tab,
                type: "tab",
              })),
            ]
          : undefined,
      };
    });
  const rolePermissionTree = createRolePermissionTree(menuTree);
  const rolePermissionLeafIds = (node) =>
    node.children?.length
      ? node.children.flatMap(rolePermissionLeafIds)
      : [node.id];
  const allRolePermissionIds = rolePermissionTree.flatMap(rolePermissionLeafIds);
  const defaultExpandedRoleMenuIds = () => {
    const collectMenuIds = (nodes) =>
      nodes.flatMap((node) =>
        node.type === "menu"
          ? [node.id, ...collectMenuIds(node.children ?? [])]
          : [],
      );
    // Keep menus open and expose the dedicated role-management actions by default.
    return new Set([
      ...collectMenuIds(rolePermissionTree),
      "page:设置中心/系统设置/角色权限",
    ]);
  };
  const defaultDataMenuScopes = () =>
    Object.fromEntries(leafMenus(menuTree).map((name) => [name, "仅自己"]));
  const [dialog, setDialog] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [roleStatus, setRoleStatus] = useState("启用");
  const [roleMenus, setRoleMenus] = useState(
    new Set(allRolePermissionIds.slice(0, 18)),
  );
  const [rolePermissionTab, setRolePermissionTab] = useState("menu");
  const [expandedRoleMenuIds, setExpandedRoleMenuIds] = useState(
    defaultExpandedRoleMenuIds,
  );
  const [confirmRole, setConfirmRole] = useState(null);
  const [dataRole, setDataRole] = useState(null);
  const [dataMenuScopes, setDataMenuScopes] = useState(defaultDataMenuScopes);
  const [assignRole, setAssignRole] = useState(null);
  const [assignOrganization, setAssignOrganization] = useState("group");
  const [selectedUserIds, setSelectedUserIds] = useState(["u-zhang"]);
  const assignmentOrganizations = [
    {
      id: "group",
      name: "华北矿业集团",
      children: [
        {
          id: "mine",
          name: "矿山事业部",
          children: [
            { id: "safety", name: "安全管理部" },
            { id: "equipment", name: "设备管理部" },
            { id: "production", name: "生产技术部" },
          ],
        },
      ],
    },
  ];
  const assignmentUsers = [
    {
      id: "u-zhang",
      name: "张宇",
      account: "zhangyu",
      department: "安全管理部",
      organization: "safety",
    },
    {
      id: "u-li",
      name: "李明",
      account: "liming",
      department: "设备管理部",
      organization: "equipment",
    },
    {
      id: "u-wang",
      name: "王强",
      account: "wangqiang",
      department: "生产技术部",
      organization: "production",
    },
    {
      id: "u-zhao",
      name: "赵敏",
      account: "zhaomin",
      department: "安全管理部",
      organization: "safety",
    },
    {
      id: "u-chen",
      name: "陈磊",
      account: "chenlei",
      department: "设备管理部",
      organization: "equipment",
    },
  ];
  const dataPermissionOrganizations = [
    {
      id: "group",
      name: "华北矿业集团",
      children: [
        {
          id: "mine",
          name: "矿山事业部",
          children: [
            { id: "safety", name: "安全管理部" },
            { id: "equipment", name: "设备管理部" },
            { id: "production", name: "生产技术部" },
          ],
        },
        {
          id: "service",
          name: "综合服务中心",
          children: [
            { id: "human", name: "人力资源部" },
            { id: "finance", name: "财务部" },
          ],
        },
      ],
    },
  ];
  const dataPermissionUsers = [
    { id: "u-zhang", name: "张宇", department: "安全管理部", organization: "safety" },
    { id: "u-zhao", name: "赵敏", department: "安全管理部", organization: "safety" },
    { id: "u-li", name: "李明", department: "设备管理部", organization: "equipment" },
    { id: "u-chen", name: "陈磊", department: "设备管理部", organization: "equipment" },
    { id: "u-wang", name: "王强", department: "生产技术部", organization: "production" },
    { id: "u-zhou", name: "周杰", department: "人力资源部", organization: "human" },
    { id: "u-sun", name: "孙丽", department: "财务部", organization: "finance" },
  ];
  const openCreate = () => {
    setRoleName("");
    setRoleStatus("启用");
    setRoleMenus(new Set(allRolePermissionIds.slice(0, 40)));
    setDataMenuScopes(defaultDataMenuScopes());
    setRolePermissionTab("menu");
    setExpandedRoleMenuIds(defaultExpandedRoleMenuIds());
    setDialog({ mode: "create" });
  };
  const openEdit = (role) => {
    setRoleName(role.name);
    setRoleStatus(role.status);
    setRoleMenus(new Set(allRolePermissionIds.slice(0, 40)));
    setDataMenuScopes(defaultDataMenuScopes());
    setRolePermissionTab("menu");
    setExpandedRoleMenuIds(defaultExpandedRoleMenuIds());
    setDialog({ mode: "edit", role });
  };
  const saveRole = (event) => {
    event.preventDefault();
    const name = roleName.trim();
    if (!name) return;
    if (dialog.mode === "edit")
      setRoles((current) =>
        current.map((item) =>
          item.id === dialog.role.id
            ? { ...item, name, status: roleStatus }
            : item,
        ),
      );
    else
      setRoles((current) => [
        ...current,
        {
          id: `role-${Date.now()}`,
          name,
          creator: "张宇",
          status: roleStatus,
          createdAt: "2026-08-12 10:30",
        },
      ]);
    setDialog(null);
    onAction(
      dialog.mode === "edit" ? `已保存角色：${name}` : `已新增角色：${name}`,
    );
  };
  const toggleMenu = (menu) =>
    setRoleMenus((current) => {
      const next = new Set(current);
      const descendants = rolePermissionLeafIds(menu);
      const isFullySelected = descendants.every((id) => next.has(id));
      descendants.forEach((id) => {
        if (isFullySelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  const toggleRoleMenuExpanded = (menuId) =>
    setExpandedRoleMenuIds((current) => {
      const next = new Set(current);
      next.has(menuId) ? next.delete(menuId) : next.add(menuId);
      return next;
    });
  const selectedDataPermissionTree = (nodes, parents = []) =>
    nodes.flatMap((node) => {
      const path = [...parents, node.name];
      if (node.children?.length) {
        const children = selectedDataPermissionTree(node.children, path);
        return children.length ? [{ ...node, children }] : [];
      }

      // A page is available for data authorization once its menu is granted.
      const pageKey = path.join("/");
      const pageGranted = roleMenus.has(`page:${pageKey}`)
        || roleActionIdsForPath(pageKey).some((id) => roleMenus.has(id))
        || roleTabIdsForPath(pageKey).some((id) => roleMenus.has(id));
      return pageGranted ? [node] : [];
    });
  const dataPermissionMenuTree = selectedDataPermissionTree(menuTree);
  const dataPermissionLeafCount = leafMenus(dataPermissionMenuTree).length;
  const setAllDataPermissionScopes = (scope) =>
    setDataMenuScopes((current) => ({
      ...current,
      ...Object.fromEntries(
        leafMenus(dataPermissionMenuTree).map((name) => [name, scope]),
      ),
    }));
  const MenuTree = ({ nodes }) => (
    <ul className="role-menu-tree">
      {nodes.map((node, index) => (
        <li
          className={
            node.type === "button"
              ? "role-menu-action"
              : node.type === "tab"
                ? "role-menu-tab"
                : ""
          }
          key={`${node.id}-${index}`}
        >
          <div className="role-menu-node">
            <label className={
              node.type === "button"
                ? "role-menu-button"
                : node.type === "tab"
                  ? "role-menu-tab-label"
                  : ""
            }>
              <RolePermissionCheckbox
                node={node}
                selectedIds={roleMenus}
                getLeafIds={rolePermissionLeafIds}
                onToggle={toggleMenu}
              />
              <span>{node.name}</span>
            </label>
            {node.children ? (
              <button
                type="button"
                className={`role-menu-expand ${
                  expandedRoleMenuIds.has(node.id) ? "expanded" : ""
                }`}
                aria-label={`${expandedRoleMenuIds.has(node.id) ? "收起" : "展开"}${node.name}`}
                onClick={() => toggleRoleMenuExpanded(node.id)}
              >
                <ChevronRight24Regular />
              </button>
            ) : null}
          </div>
          {node.children && expandedRoleMenuIds.has(node.id) ? (
            <MenuTree nodes={node.children} />
          ) : null}
        </li>
      ))}
    </ul>
  );
  const AssignmentTree = ({ nodes }) => (
    <ul className="assignment-org-tree">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            className={assignOrganization === node.id ? "active" : ""}
            onClick={() => setAssignOrganization(node.id)}
          >
            {node.name}
          </button>
          {node.children ? <AssignmentTree nodes={node.children} /> : null}
        </li>
      ))}
    </ul>
  );
  const findOrganizationNode = (nodes, id) =>
    nodes.reduce(
      (found, node) =>
        found ??
        (node.id === id ? node : findOrganizationNode(node.children ?? [], id)),
      null,
    );
const organizationLeafIds = (node) =>
    node.children?.length
      ? node.children.flatMap(organizationLeafIds)
      : [node.id];
  const selectedOrganizationNode = findOrganizationNode(
    assignmentOrganizations,
    assignOrganization,
  );
  const visibleAssignmentUsers = assignmentUsers.filter(
    (user) => user.organization === assignOrganization,
  );
  const visibleAssignmentUserIds = visibleAssignmentUsers.map((user) => user.id);
  const hasVisibleSelectedUsers = visibleAssignmentUserIds.some((id) =>
    selectedUserIds.includes(id),
  );
  const allVisibleUsersSelected =
    visibleAssignmentUserIds.length > 0 &&
    visibleAssignmentUserIds.every((id) => selectedUserIds.includes(id));
  const selectedDataPermissionOrganizationIds =
    dataRole?.dataPermissionOrganizationIds ?? [];
  const visibleDataPermissionUsers = dataPermissionUsers.filter((user) =>
    selectedDataPermissionOrganizationIds.includes(user.organization),
  );
  const selectedUsers = assignmentUsers.filter((user) =>
    selectedUserIds.includes(user.id),
  );
  const toggleAssignedUser = (id) =>
    setSelectedUserIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const selectVisibleAssignedUsers = () =>
    setSelectedUserIds((current) => [
      ...new Set([...current, ...visibleAssignmentUserIds]),
    ]);
  const clearVisibleAssignedUsers = () =>
    setSelectedUserIds((current) =>
      current.filter((id) => !visibleAssignmentUserIds.includes(id)),
    );
  const openAssign = (role) => {
    setAssignRole(role);
    setAssignOrganization("group");
    setSelectedUserIds(["u-zhang"]);
  };
  const openDataPermission = (role) => {
    setDataRole({
      ...role,
      dataPermissionOrganizationIds: [
        "safety",
        "equipment",
        "production",
      ],
      dataAuthorizedUserIds: dataPermissionUsers
        .filter((user) => ["safety", "equipment", "production"].includes(user.organization))
        .map((user) => user.id),
    });
    setDataMenuScopes(defaultDataMenuScopes());
    setExpandedRoleMenuIds(defaultExpandedRoleMenuIds());
  };
  const toggleDataPermissionOrganization = (organization) => {
    const organizationIds = organizationLeafIds(organization);
    setDataRole((current) => ({
      ...current,
      dataPermissionOrganizationIds: (() => {
        const selected = current.dataPermissionOrganizationIds;
        const fullySelected = organizationIds.every((id) => selected.includes(id));
        return fullySelected
          ? selected.filter((id) => !organizationIds.includes(id))
          : [...new Set([...selected, ...organizationIds])];
      })(),
      dataAuthorizedUserIds: (() => {
        const selected = current.dataPermissionOrganizationIds;
        const fullySelected = organizationIds.every((id) => selected.includes(id));
        const nextOrganizationIds = fullySelected
          ? selected.filter((id) => !organizationIds.includes(id))
          : [...new Set([...selected, ...organizationIds])];
        const visibleUserIds = dataPermissionUsers
          .filter((user) => nextOrganizationIds.includes(user.organization))
          .map((user) => user.id);
        const addedUserIds = dataPermissionUsers
          .filter((user) => organizationIds.includes(user.organization))
          .map((user) => user.id);
        return fullySelected
          ? current.dataAuthorizedUserIds.filter((id) => visibleUserIds.includes(id))
          : [
              ...new Set([
                ...current.dataAuthorizedUserIds.filter((id) =>
                  visibleUserIds.includes(id),
                ),
                ...addedUserIds,
              ]),
            ];
      })(),
    }));
  };
  const toggleDataAuthorizedUser = (userId) =>
    setDataRole((current) => ({
      ...current,
      dataAuthorizedUserIds: current.dataAuthorizedUserIds.includes(userId)
        ? current.dataAuthorizedUserIds.filter((id) => id !== userId)
        : [...current.dataAuthorizedUserIds, userId],
    }));
  const DataPermissionOrganizationTree = ({ nodes }) => (
    <ul className="data-permission-organization-tree">
      {nodes.map((node) => (
        <li key={node.id}>
          <label
            className={
              organizationLeafIds(node).some((id) =>
                selectedDataPermissionOrganizationIds.includes(id),
              )
                ? "active"
                : ""
            }
          >
            <input
              type="checkbox"
              checked={organizationLeafIds(node).every((id) =>
                selectedDataPermissionOrganizationIds.includes(id),
              )}
              ref={(element) => {
                if (!element) return;
                const ids = organizationLeafIds(node);
                const selectedCount = ids.filter((id) =>
                  selectedDataPermissionOrganizationIds.includes(id),
                ).length;
                element.indeterminate =
                  selectedCount > 0 && selectedCount < ids.length;
              }}
              onChange={() => toggleDataPermissionOrganization(node)}
            />
            <span>{node.name}</span>
          </label>
          {node.children ? (
            <DataPermissionOrganizationTree nodes={node.children} />
          ) : null}
        </li>
      ))}
    </ul>
  );
  const renderDataPermissionMenuTree = (nodes, parents = []) =>
    nodes.map((node) => {
      const path = [...parents, node.name];
      const nodeId = `${node.children?.length ? "menu" : "page"}:${path.join("/")}`;
      const hasChildren = Boolean(node.children?.length);

      return hasChildren ? (
        <li className="data-permission-menu-group" key={nodeId}>
          <div className="data-permission-menu-group-title">
            <strong>{node.name}</strong>
            <button
              type="button"
              className={expandedRoleMenuIds.has(nodeId) ? "expanded" : ""}
              aria-label={`${expandedRoleMenuIds.has(nodeId) ? "收起" : "展开"}${node.name}`}
              onClick={() => toggleRoleMenuExpanded(nodeId)}
            >
              <ChevronRight24Regular />
            </button>
          </div>
          {expandedRoleMenuIds.has(nodeId) ? (
            <ul>{renderDataPermissionMenuTree(node.children, path)}</ul>
          ) : null}
        </li>
      ) : (
        <li className="data-permission-menu-leaf" key={nodeId}>
          <span>{node.name}</span>
          <select
            aria-label={`${node.name}数据权限范围`}
            value={dataMenuScopes[node.name] ?? "全部"}
            onChange={(event) =>
              setDataMenuScopes((current) => ({
                ...current,
                [node.name]: event.target.value,
              }))
            }
          >
            <option>全部</option>
            <option>所在组织及下级</option>
            <option>仅自己</option>
          </select>
        </li>
      );
    });
  const deleteRole = () => {
    setRoles((current) => current.filter((item) => item.id !== confirmRole.id));
    onAction(`已删除角色：${confirmRole.name}`);
    setConfirmRole(null);
  };
  return (
    <>
      <section className="role-list-page" aria-label="角色权限管理">
        <header className="role-list-header">
          <div>
            <h2>角色权限</h2>
            <span>通过角色统一管理系统访问与操作权限。</span>
          </div>
          <button onClick={openCreate}>
            <Add24Regular />
            新增角色
          </button>
        </header>
        <div className="role-list-toolbar">
          <input placeholder="请输入角色名称" />
          <button onClick={() => onAction("已按角色名称筛选")}>查询</button>
          <button onClick={() => onAction("角色筛选已重置")}>重置</button>
        </div>
        <div className="role-list-table">
          <div className="role-list-head">
            <span>角色名称</span>
            <span>创建人</span>
            <span>角色状态</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>
          {roles.map((role) => (
            <div className="role-list-row" key={role.id}>
              <strong>{role.name}</strong>
              <span>{role.creator}</span>
              <i className={role.status === "启用" ? "enabled" : ""}>
                {role.status}
              </i>
              <time>{role.createdAt}</time>
              <span className="role-list-actions">
                <button onClick={() => openEdit(role)}>编辑</button>
                <button onClick={() => setConfirmRole(role)}>删除</button>
                <button onClick={() => openAssign(role)}>分配用户</button>
              </span>
            </div>
          ))}
        </div>
      </section>
      {dialog ? (
        <div
          className="management-dialog-layer"
          onMouseDown={() => setDialog(null)}
          role="presentation"
        >
          <form
            className="management-dialog role-dialog"
            onSubmit={saveRole}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-dialog-title"
          >
            <header>
              <h2 id="role-dialog-title">
                {dialog.mode === "edit" ? "编辑角色" : "新增角色"}
              </h2>
              <button
                type="button"
                className="management-dialog-close"
                aria-label="关闭角色弹窗"
                onClick={() => setDialog(null)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="management-dialog-body">
              <div className="role-form-grid">
                <label>
                  角色名称
                  <input
                    value={roleName}
                    onChange={(event) => setRoleName(event.target.value)}
                    placeholder="例如：车间安全员"
                    autoFocus
                  />
                </label>
                <label>
                  角色状态
                  <select
                    value={roleStatus}
                    onChange={(event) => setRoleStatus(event.target.value)}
                  >
                    <option>启用</option>
                    <option>停用</option>
                  </select>
                </label>
              </div>
              <nav className="role-permission-tabs" role="tablist" aria-label="角色权限类型">
                <button
                  type="button"
                  role="tab"
                  aria-selected={rolePermissionTab === "menu"}
                  className={rolePermissionTab === "menu" ? "active" : ""}
                  onClick={() => setRolePermissionTab("menu")}
                >
                  菜单权限
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={rolePermissionTab === "data"}
                  className={rolePermissionTab === "data" ? "active" : ""}
                  onClick={() => setRolePermissionTab("data")}
                >
                  数据权限
                </button>
              </nav>
              {rolePermissionTab === "menu" ? (
                <section className="role-menu-selector" role="tabpanel">
                  <header>
                    <b>菜单权限</b>
                    <span>按菜单与页面选择可访问范围</span>
                  </header>
                  <MenuTree nodes={rolePermissionTree} />
                </section>
              ) : (
                <section className="role-data-selector" role="tabpanel">
                  <header>
                    <b>授权项</b>
                    <div className="role-data-permission-header-actions">
                      <span>全部设置为：</span>
                      {['全部', '所在组织及下级', '仅自己'].map((scope) => (
                        <button
                          type="button"
                          key={scope}
                          onClick={() => setAllDataPermissionScopes(scope)}
                        >
                          {scope}
                        </button>
                      ))}
                    </div>
                  </header>
                  <div className="data-permission-menu-panel">
                    <ul>{renderDataPermissionMenuTree(dataPermissionMenuTree)}</ul>
                  </div>
                </section>
              )}
            </div>
            <footer>
              <button
                type="button"
                className="management-dialog-cancel"
                onClick={() => setDialog(null)}
              >
                取消
              </button>
              <button type="submit" className="management-dialog-primary">
                保存角色
              </button>
            </footer>
          </form>
        </div>
      ) : null}
      {dataRole ? (
        <div
          className="management-dialog-layer"
          onMouseDown={() => setDataRole(null)}
          role="presentation"
        >
          <section
            className="management-dialog data-permission-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="data-permission-title"
          >
            <header>
              <h2 id="data-permission-title">数据权限</h2>
              <button
                type="button"
                className="management-dialog-close"
                aria-label="关闭数据权限弹窗"
                onClick={() => setDataRole(null)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="data-permission-body">
              <div className="data-permission-role">
                <span>角色名称</span>
                <strong>{dataRole.name}</strong>
              </div>
              <div className="data-permission-workspace">
                <section className="data-permission-subjects">
                  <header>
                    <div>
                      <h3>被授权对象</h3>
                      <p>选择组织后，对应人员将默认勾选</p>
                    </div>
                  </header>
                  <div className="data-permission-subject-columns">
                    <aside>
                      <h4>组织架构</h4>
                      <DataPermissionOrganizationTree
                        nodes={dataPermissionOrganizations}
                      />
                    </aside>
                    <section>
                      <header>
                        <h4>人员</h4>
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              Boolean(visibleDataPermissionUsers.length) &&
                              visibleDataPermissionUsers.every((user) =>
                                dataRole.dataAuthorizedUserIds.includes(user.id),
                              )
                            }
                            onChange={() =>
                              setDataRole((current) => {
                                const visibleIds = visibleDataPermissionUsers.map(
                                  (user) => user.id,
                                );
                                const allSelected = visibleIds.every((id) =>
                                  current.dataAuthorizedUserIds.includes(id),
                                );
                                return {
                                  ...current,
                                  dataAuthorizedUserIds: allSelected
                                    ? current.dataAuthorizedUserIds.filter(
                                        (id) => !visibleIds.includes(id),
                                      )
                                    : [
                                        ...new Set([
                                          ...current.dataAuthorizedUserIds,
                                          ...visibleIds,
                                        ]),
                                      ],
                                };
                              })
                            }
                          />
                          全选
                        </label>
                      </header>
                      <div className="data-authorized-user-list">
                        {visibleDataPermissionUsers.map((user) => (
                          <label key={user.id}>
                            <input
                              type="checkbox"
                              checked={dataRole.dataAuthorizedUserIds.includes(user.id)}
                              onChange={() => toggleDataAuthorizedUser(user.id)}
                            />
                            <span>
                              <b>{user.name}</b>
                              <small>{user.department}</small>
                            </span>
                          </label>
                        ))}
                      </div>
                    </section>
                  </div>
                </section>
                <section className="data-permission-items">
                  <header>
                    <div>
                      <h3>授权项</h3>
                      <p>仅对没有下级菜单的功能配置数据权限</p>
                    </div>
                    <span>{dataPermissionLeafCount} 项</span>
                  </header>
                  <div className="data-permission-menu-panel">
                    <ul>{renderDataPermissionMenuTree(dataPermissionMenuTree)}</ul>
                  </div>
                </section>
              </div>
            </div>
            <footer>
              <button
                type="button"
                className="management-dialog-cancel"
                onClick={() => setDataRole(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="management-dialog-primary"
                onClick={() => {
                  onAction(`已保存${dataRole.name}的数据权限`);
                  setDataRole(null);
                }}
              >
                保存权限
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {assignRole ? (
        <div
          className="management-dialog-layer assign-user-dialog-layer"
          onMouseDown={() => setAssignRole(null)}
          role="presentation"
        >
          <section
            className="management-dialog assign-user-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-user-title"
          >
            <header>
              <h2 id="assign-user-title">分配用户</h2>
              <button
                type="button"
                className="management-dialog-close"
                aria-label="关闭分配用户弹窗"
                onClick={() => setAssignRole(null)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="assign-user-body">
              <aside>
                <header>组织架构</header>
                <AssignmentTree nodes={assignmentOrganizations} />
              </aside>
              <section>
                <header>
                  <div className="assign-user-list-heading">
                    <b>{selectedOrganizationNode?.name || "人员"}</b>
                    <span>{visibleAssignmentUsers.length} 人</span>
                  </div>
                  {visibleAssignmentUsers.length ? (
                    <div className="assign-user-bulk-actions">
                      <button
                        type="button"
                        onClick={selectVisibleAssignedUsers}
                        disabled={allVisibleUsersSelected}
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        onClick={clearVisibleAssignedUsers}
                        disabled={!hasVisibleSelectedUsers}
                      >
                        全不选
                      </button>
                    </div>
                  ) : null}
                </header>
                {visibleAssignmentUsers.length ? (
                  visibleAssignmentUsers.map((user) => (
                    <label key={user.id}>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => toggleAssignedUser(user.id)}
                      />
                      <span>
                        <b>{user.name}</b>
                        <small>
                          {user.account} · {user.department}
                        </small>
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="assign-user-empty">该组织暂无人员</p>
                )}
              </section>
              <section>
                <header>
                  已选人员 <span>{selectedUsers.length} 人</span>
                </header>
                {selectedUsers.length ? (
                  selectedUsers.map((user) => (
                    <div key={user.id}>
                      <span>
                        <b>{user.name}</b>
                        <small>{user.department}</small>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleAssignedUser(user.id)}
                      >
                        移除
                      </button>
                    </div>
                  ))
                ) : (
                  <p>暂未选择人员</p>
                )}
              </section>
            </div>
            <footer>
              <button
                type="button"
                className="management-dialog-cancel"
                onClick={() => setAssignRole(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="management-dialog-primary"
                onClick={() => {
                  onAction(
                    `已为${assignRole.name}分配 ${selectedUsers.length} 位用户`,
                  );
                  setAssignRole(null);
                }}
              >
                确认分配
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {confirmRole ? (
        <div
          className="management-dialog-layer"
          onMouseDown={() => setConfirmRole(null)}
          role="presentation"
        >
          <section
            className="management-dialog management-confirm-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-role-title"
          >
            <header>
              <h2 id="delete-role-title">确认删除</h2>
              <button
                type="button"
                className="management-dialog-close"
                aria-label="关闭删除确认"
                onClick={() => setConfirmRole(null)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="management-dialog-body">
              <p>
                确定删除角色“{confirmRole.name}
                ”吗？已分配该角色的用户将不再保留该角色权限。
              </p>
            </div>
            <footer>
              <button
                type="button"
                className="management-dialog-cancel"
                onClick={() => setConfirmRole(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="management-dialog-primary"
                onClick={deleteRole}
              >
                确认删除
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

function PersonalCenter({ onAction }) {
  const [editing, setEditing] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [profile, setProfile] = useState({
    name: "张宇",
    phone: "138 0000 0000",
    email: "zhangyu@huabei-mining.com",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const saveProfile = () => {
    setEditing(false);
    onAction("个人资料已保存");
  };
  const savePassword = (event) => {
    event.preventDefault();
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPasswordError("请完整填写密码信息");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }
    if (passwords.current !== "123456") {
      setPasswordError("旧密码输入错误，请重新输入");
      return;
    }
    setPasswordDialog(false);
    setPasswords({ current: "", next: "", confirm: "" });
    setPasswordError("");
    onAction("密码已修改");
  };
  return (
    <>
      <section className="personal-center" aria-label="个人中心">
        <header className="personal-profile-hero">
          <span className="personal-center-avatar">张</span>
          <div>
            <h2>{profile.name}</h2>
            <span>矿山事业部 / 安全管理部 · 安全管理员</span>
          </div>
          <button
            className="personal-profile-logout"
            onClick={() => setLogoutDialog(true)}
          >
            <DismissRegular />
            退出登录
          </button>
        </header>
        <section className="personal-information">
          <header>
            <div>
              <h3>个人信息</h3>
              <span>账号资料与岗位身份</span>
            </div>
            <div className="personal-information-actions">
              <button
                onClick={() => (editing ? saveProfile() : setEditing(true))}
              >
                {editing ? "保存资料" : "编辑资料"}
              </button>
              <button onClick={() => setPasswordDialog(true)}>修改密码</button>
            </div>
          </header>
          <dl>
            <div>
              <dt>用户名称</dt>
              <dd>
                {editing ? (
                  <input
                    value={profile.name}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                ) : (
                  profile.name
                )}
              </dd>
            </div>
            <div>
              <dt>手机号</dt>
              <dd>
                {editing ? (
                  <input
                    value={profile.phone}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                  />
                ) : (
                  profile.phone
                )}
              </dd>
            </div>
            <div>
              <dt>邮箱</dt>
              <dd>
                {editing ? (
                  <input
                    value={profile.email}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                  />
                ) : (
                  profile.email
                )}
              </dd>
            </div>
            <div>
              <dt>所属部门</dt>
              <dd>华北矿业集团 / 矿山事业部 / 安全管理部</dd>
            </div>
            <div>
              <dt>角色</dt>
              <dd>安全管理员</dd>
            </div>
            <div>
              <dt>账号状态</dt>
              <dd>
                <i>已启用</i>
              </dd>
            </div>
          </dl>
        </section>
      </section>
      {passwordDialog ? (
        <div
          className="management-dialog-layer"
          onMouseDown={() => setPasswordDialog(false)}
          role="presentation"
        >
          <form
            className="management-dialog password-dialog"
            onSubmit={savePassword}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-dialog-title"
          >
            <header>
              <h2 id="password-dialog-title">修改密码</h2>
              <button
                type="button"
                className="management-dialog-close"
                aria-label="关闭修改密码弹窗"
                onClick={() => setPasswordDialog(false)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="management-dialog-body">
              <label>
                旧密码
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      current: event.target.value,
                    }))
                  }
                  autoFocus
                />
              </label>
              <label>
                新密码
                <input
                  type="password"
                  value={passwords.next}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      next: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                确认新密码
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(event) =>
                    setPasswords((current) => ({
                      ...current,
                      confirm: event.target.value,
                    }))
                  }
                />
              </label>
              {passwordError ? (
                <p className="password-error">{passwordError}</p>
              ) : null}
            </div>
            <footer>
              <button
                type="button"
                className="management-dialog-cancel"
                onClick={() => setPasswordDialog(false)}
              >
                取消
              </button>
              <button type="submit" className="management-dialog-primary">
                确认修改
              </button>
            </footer>
          </form>
        </div>
      ) : null}
      {logoutDialog ? (
        <div
          className="management-dialog-layer"
          onMouseDown={() => setLogoutDialog(false)}
          role="presentation"
        >
          <section
            className="management-dialog logout-confirm-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
          >
            <header>
              <h2 id="logout-dialog-title">确认退出登录</h2>
              <button
                type="button"
                className="management-dialog-close"
                aria-label="关闭退出登录确认"
                onClick={() => setLogoutDialog(false)}
              >
                <DismissRegular />
              </button>
            </header>
            <div className="management-dialog-body">
              <p>退出后将结束当前会话，确定要退出登录吗？</p>
            </div>
            <footer>
              <button
                type="button"
                className="management-dialog-cancel"
                onClick={() => setLogoutDialog(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="logout-confirm-button"
                onClick={() => {
                  setLogoutDialog(false);
                  onAction("已退出登录");
                }}
              >
                确认退出
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

function PositionManagement({ onAction }) {
  const [positions, setPositions] = useState([
    { id: "position-1", code: "SAFETY_MANAGER", name: "安全管理员", order: 10, enabled: true, createdAt: "2026-08-14 09:20" },
    { id: "position-2", code: "EQUIPMENT_ENGINEER", name: "设备工程师", order: 20, enabled: true, createdAt: "2026-08-13 15:36" },
    { id: "position-3", code: "PRODUCTION_SUPERVISOR", name: "生产主管", order: 30, enabled: false, createdAt: "2026-08-12 11:08" },
  ]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState({ code: "", name: "", order: 10, enabled: true });
  const openEditor = (position = null) => {
    setDraft(
      position
        ? { code: position.code, name: position.name, order: position.order, enabled: position.enabled }
        : { code: "", name: "", order: positions.length * 10 + 10, enabled: true },
    );
    setDialog({ type: "editor", position });
  };
  const savePosition = (event) => {
    event.preventDefault();
    const code = draft.code.trim();
    const name = draft.name.trim();
    if (!code || !name) return;
    const nameExists = positions.some(
      (item) =>
        item.id !== dialog.position?.id &&
        item.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    if (nameExists) {
      onAction("岗位名称已存在，请使用其他名称。");
      return;
    }

    if (dialog.position) {
      setPositions((current) => current.map((item) =>
        item.id === dialog.position.id ? { ...item, code, name, order: Number(draft.order), enabled: draft.enabled } : item,
      ));
      onAction(`已保存岗位：${name}`);
    } else {
      setPositions((current) => [
        ...current,
        { id: `position-${Date.now()}`, code, name, order: Number(draft.order), enabled: draft.enabled, createdAt: "刚刚" },
      ]);
      onAction(`已新增岗位：${name}`);
    }
    setDialog(null);
  };
  const deletePositions = (ids) => {
    setPositions((current) => current.filter((item) => !ids.includes(item.id)));
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
    setDialog(null);
    onAction("岗位已删除");
  };
  const toggleSelection = (id) => setSelectedIds((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
  );

  return (
    <>
      <section className="position-management" aria-label="岗位管理">
        <header className="position-management-header">
          <h1>岗位管理</h1>
          <div>
            <button type="button" className="position-delete-button" disabled={!selectedIds.length} onClick={() => setDialog({ type: "delete", ids: selectedIds })}>
              <Delete24Regular />删除岗位
            </button>
            <button type="button" className="position-add-button" onClick={() => openEditor()}>
              <Add24Regular />新增岗位
            </button>
          </div>
        </header>
        <section className="position-table" aria-label="岗位列表">
          <div className="position-table-head">
            <span><input aria-label="全选岗位" type="checkbox" checked={positions.length > 0 && selectedIds.length === positions.length} onChange={() => setSelectedIds((current) => current.length === positions.length ? [] : positions.map((item) => item.id))} /></span>
            <span>岗位编码</span><span>岗位名称</span><span>岗位排序</span><span>状态</span><span>创建时间</span><span>操作</span>
          </div>
          {positions.map((position) => (
            <div className="position-table-row" key={position.id}>
              <span><input aria-label={`选择${position.name}`} type="checkbox" checked={selectedIds.includes(position.id)} onChange={() => toggleSelection(position.id)} /></span>
              <code>{position.code}</code><strong>{position.name}</strong><span>{position.order}</span>
              <button type="button" className={`position-status ${position.enabled ? "enabled" : ""}`} aria-pressed={position.enabled} onClick={() => setPositions((current) => current.map((item) => item.id === position.id ? { ...item, enabled: !item.enabled } : item))}>
                {position.enabled ? "启用" : "停用"}
              </button>
              <time>{position.createdAt}</time>
              <span className="position-actions">
                <button type="button" onClick={() => openEditor(position)}>修改</button>
                <button type="button" onClick={() => setDialog({ type: "delete", ids: [position.id] })}>删除</button>
              </span>
            </div>
          ))}
        </section>
      </section>
      {dialog?.type === "editor" ? (
        <div className="management-dialog-layer" onMouseDown={() => setDialog(null)} role="presentation">
          <form className="management-dialog position-dialog" onSubmit={savePosition} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="position-dialog-title">
            <header>
              <h2 id="position-dialog-title">{dialog.position ? "修改岗位" : "新增岗位"}</h2>
              <button type="button" className="management-dialog-close" aria-label="关闭岗位弹窗" onClick={() => setDialog(null)}><DismissRegular /></button>
            </header>
            <div className="management-dialog-body position-form-grid">
              <label><b>岗位编码</b><input value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} placeholder="请输入岗位编码" autoFocus /></label>
              <label><b>岗位名称</b><input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="请输入岗位名称" /></label>
              <label><b>岗位排序</b><input type="number" min="0" value={draft.order} onChange={(event) => setDraft((current) => ({ ...current, order: event.target.value }))} /></label>
              <label className="position-enabled-field"><b>状态</b><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))} /><span>{draft.enabled ? "启用" : "停用"}</span></label>
            </div>
            <footer>
              <button type="button" className="management-dialog-cancel" onClick={() => setDialog(null)}>取消</button>
              <button type="submit" className="management-dialog-primary">确定</button>
            </footer>
          </form>
        </div>
      ) : null}
      {dialog?.type === "delete" ? (
        <div className="management-dialog-layer" onMouseDown={() => setDialog(null)} role="presentation">
          <section className="management-dialog management-confirm-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-position-title">
            <header><h2 id="delete-position-title">确认删除</h2><button type="button" className="management-dialog-close" aria-label="关闭删除确认" onClick={() => setDialog(null)}><DismissRegular /></button></header>
            <div className="management-dialog-body"><p>确定删除已选岗位吗？删除后无法恢复。</p></div>
            <footer><button type="button" className="management-dialog-cancel" onClick={() => setDialog(null)}>取消</button><button type="button" className="management-dialog-primary" onClick={() => deletePositions(dialog.ids)}>确认删除</button></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}

function DictionaryManagement({ onAction }) {
  const [dictionaries, setDictionaries] = useState([
    {
      id: "dict-1",
      code: "SAFETY_LEVEL",
      name: "安全风险等级",
      type: "系统字典",
      remark: "用于风险辨识与预警分级。",
      references: 28,
      updater: "张宇",
      updatedAt: "2026-08-14 10:24",
      data: [
        { id: "level-1", code: "01", name: "重大风险", updater: "张宇", updatedAt: "2026-08-14 10:24" },
        { id: "level-2", code: "02", name: "较大风险", updater: "张宇", updatedAt: "2026-08-14 10:24" },
      ],
    },
    {
      id: "dict-2",
      code: "EQUIPMENT_TYPE",
      name: "设备类型",
      type: "业务字典",
      remark: "用于设备台账和巡检记录。",
      references: 16,
      updater: "李明",
      updatedAt: "2026-08-13 16:40",
      data: [
        { id: "type-1", code: "01", name: "采矿车", updater: "李明", updatedAt: "2026-08-13 16:40" },
        { id: "type-2", code: "02", name: "掘进机", updater: "李明", updatedAt: "2026-08-13 16:40" },
      ],
    },
    {
      id: "dict-3",
      code: "POSITION",
      name: "岗位字典",
      type: "系统字典",
      remark: "用于用户岗位配置与任务分派。",
      references: 12,
      updater: "张宇",
      updatedAt: "2026-08-19 09:30",
      data: [
        { id: "position-1", code: "SAFETY_ADMIN", name: "安全管理员", updater: "张宇", updatedAt: "2026-08-19 09:30" },
        { id: "position-2", code: "EQUIPMENT_ENGINEER", name: "设备工程师", updater: "张宇", updatedAt: "2026-08-19 09:30" },
        { id: "position-3", code: "PRODUCTION_SUPERVISOR", name: "生产主管", updater: "张宇", updatedAt: "2026-08-19 09:30" },
      ],
    },
    { id: "dict-4", code: "HAZARD_CATEGORY", name: "隐患类别", type: "业务字典", remark: "", references: 21, updater: "陈伟", updatedAt: "2026-08-13 14:18", data: [] },
    { id: "dict-5", code: "WORK_STATUS", name: "作业状态", type: "系统字典", remark: "", references: 9, updater: "张宇", updatedAt: "2026-08-12 09:36", data: [] },
    {
      id: "dict-6",
      code: "FLOW_CATEGORY",
      name: "流程分类",
      type: "业务字典",
      remark: "用于流程中心的流程归类。",
      references: 2,
      updater: "张宇",
      updatedAt: "2026-08-24 10:30",
      data: FLOW_CATEGORY_DICTIONARY_OPTIONS.map((name, index) => ({
        id: `flow-category-${index + 1}`,
        code: String(index + 1).padStart(2, "0"),
        name,
        updater: "张宇",
        updatedAt: "2026-08-24 10:30",
      })),
    },
  ]);
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState({ code: "", name: "", type: "业务字典", remark: "" });
  const [dataRows, setDataRows] = useState([]);
  const [selectedDataIds, setSelectedDataIds] = useState([]);
  const [editingData, setEditingData] = useState(null);
  const [dataSearch, setDataSearch] = useState("");
  const [dataPage, setDataPage] = useState(1);
  const [dataPageSize, setDataPageSize] = useState(10);

  const filteredDataRows = dataRows.filter((item) =>
    item.name.toLowerCase().includes(dataSearch.trim().toLowerCase()),
  );
  const dataPageCount = Math.max(
    1,
    Math.ceil(filteredDataRows.length / dataPageSize),
  );
  const currentDataPage = Math.min(dataPage, dataPageCount);
  const pagedDataRows = filteredDataRows.slice(
    (currentDataPage - 1) * dataPageSize,
    currentDataPage * dataPageSize,
  );

  const openEditor = (dictionary = null) => {
    setDraft(
      dictionary
        ? {
            code: dictionary.code,
            name: dictionary.name,
            type: dictionary.type ?? "业务字典",
            remark: dictionary.remark ?? "",
          }
        : { code: "", name: "", type: "业务字典", remark: "" },
    );
    setDataRows(dictionary?.data ?? []);
    setSelectedDataIds([]);
    setEditingData(null);
    setDataSearch("");
    setDataPage(1);
    setDialog({ type: "editor", dictionary });
  };

  const saveDictionaryInfo = (event) => {
    event.preventDefault();
    const code = draft.code.trim();
    const name = draft.name.trim();
    const type = draft.type;
    if (!code || !name) return;

    if (dialog.dictionary) {
      setDictionaries((current) =>
        current.map((item) =>
          item.id === dialog.dictionary.id
            ? {
                ...item,
                code,
                name,
                type,
                remark: draft.remark.trim(),
                updater: "张宇",
                updatedAt: "刚刚",
              }
            : item,
        ),
      );
      setDialog((current) => ({
        ...current,
        dictionary: { ...current.dictionary, code, name, type, remark: draft.remark.trim() },
      }));
      onAction(`已保存字典信息：${name}`);
    } else {
      const dictionary = {
        id: `dict-${Date.now()}`,
        code,
        name,
        type,
        remark: draft.remark.trim(),
        data: [],
        references: 0,
        updater: "张宇",
        updatedAt: "刚刚",
      };
      setDictionaries((current) => [
        dictionary,
        ...current,
      ]);
      setDialog((current) => ({ ...current, dictionary }));
      onAction(`已新增字典：${name}`);
    }
  };

  const closeDictionaryEditor = () => {
    if (!dialog?.dictionary) {
      setDialog(null);
      return;
    }

    const data = dataRows
      .filter((entry) => !entry.isDraft)
      .map(({ isDraft, ...entry }) => entry);
    setDictionaries((current) =>
      current.map((item) =>
        item.id === dialog.dictionary.id
          ? {
              ...item,
              data,
              references: data.length,
              updater: "张宇",
              updatedAt: "刚刚",
            }
          : item,
      ),
    );
    onAction(`已保存字典数据：${dialog.dictionary.name}`);
    setDialog(null);
  };

  const addDataRow = () => {
    setDataPage(1);
    setEditingData(null);
    setDataRows((current) =>
      current.some((item) => item.isDraft)
        ? current
        : [
            {
              id: `data-${Date.now()}`,
              code: "",
              name: "",
              updater: "",
              updatedAt: "",
              isDraft: true,
            },
            ...current,
          ],
    );
  };

  const updateDataRow = (id, field, value) => {
    setDataRows((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const confirmDataRow = (id) => {
    setDataRows((current) =>
      current.map((item) =>
        item.id === id && item.code.trim() && item.name.trim()
          ? { ...item, isDraft: false, updater: "张宇", updatedAt: "刚刚" }
          : item,
      ),
    );
  };

  const startEditingDataRow = (item) => {
    setEditingData({ id: item.id, code: item.code, name: item.name });
  };

  const confirmEditingDataRow = () => {
    if (!editingData?.code.trim() || !editingData.name.trim()) return;

    setDataRows((current) =>
      current.map((item) =>
        item.id === editingData.id
          ? {
              ...item,
              code: editingData.code.trim(),
              name: editingData.name.trim(),
              updater: "张宇",
              updatedAt: "刚刚",
            }
          : item,
      ),
    );
    setEditingData(null);
  };

  const toggleDataRow = (id) => {
    setSelectedDataIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const deleteDataRows = (ids) => {
    setDataRows((current) => current.filter((item) => !ids.includes(item.id)));
    setSelectedDataIds((current) => current.filter((id) => !ids.includes(id)));
    setEditingData((current) => (current && ids.includes(current.id) ? null : current));
  };

  const deleteDictionary = () => {
    setDictionaries((current) =>
      current.filter((item) => item.id !== dialog.dictionary.id),
    );
    onAction(`已删除字典：${dialog.dictionary.name}`);
    setDialog(null);
  };

  return (
    <section className="dictionary-management" aria-labelledby="dictionary-title">
      <header className="dictionary-toolbar">
        <div>
          <h1 id="dictionary-title">字典管理</h1>
        </div>
        <button type="button" onClick={() => openEditor()}>
          <Add24Regular />新增字典
        </button>
      </header>
      <section className="dictionary-panel" aria-label="字典列表">
        <div className="dictionary-table-head">
          <span>编码</span>
          <span>字典名称</span>
          <span>类型</span>
          <span>被引用次数</span>
          <span>更新人</span>
          <span>更新时间</span>
          <span>操作</span>
        </div>
        {dictionaries.map((dictionary) => (
          <div className="dictionary-table-row" key={dictionary.id}>
            <code>{dictionary.code}</code>
            <strong>{dictionary.name}</strong>
            <span>{dictionary.type ?? "业务字典"}</span>
            <span>{dictionary.references}</span>
            <span>{dictionary.updater}</span>
            <time>{dictionary.updatedAt}</time>
            <span className="dictionary-actions">
              <button
                type="button"
                aria-label={`编辑${dictionary.name}`}
                title="编辑"
                onClick={() => openEditor(dictionary)}
              >
                <Edit24Regular />
              </button>
              <button
                type="button"
                aria-label={`删除${dictionary.name}`}
                title="删除"
                onClick={() => setDialog({ type: "delete", dictionary })}
              >
                <Delete24Regular />
              </button>
            </span>
          </div>
        ))}
      </section>
      {dialog?.type === "editor" ? (
        <div className="management-dialog-layer" onMouseDown={() => setDialog(null)} role="presentation">
          <form
            className="management-dialog dictionary-dialog"
            onSubmit={saveDictionaryInfo}
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dictionary-dialog-title"
          >
            <header>
              <h2 id="dictionary-dialog-title">
                {dialog.dictionary ? "编辑字典" : "新增字典"}
              </h2>
              <button type="button" className="management-dialog-close" aria-label="保存字典数据并关闭" onClick={closeDictionaryEditor}>
                <DismissRegular />
              </button>
            </header>
            <div className="dictionary-dialog-body">
              <div className="dictionary-form-grid">
                <label>
                  <b>字典编码</b>
                  <input value={draft.code} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value }))} placeholder="请输入字典编码" autoFocus />
                </label>
                <label>
                  <b>字典名称</b>
                  <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="请输入字典名称" />
                </label>
                <label>
                  <b>类型</b>
                  <select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
                    <option>系统字典</option>
                    <option>业务字典</option>
                  </select>
                </label>
                <label>
                  <b>字典备注</b>
                  <textarea value={draft.remark} onChange={(event) => setDraft((current) => ({ ...current, remark: event.target.value }))} placeholder="请输入字典备注" />
                </label>
              </div>
              <div className="dictionary-confirm-bar">
                <button type="button" className="management-dialog-cancel" onClick={() => setDialog(null)}>取消</button>
                <button type="submit" className="management-dialog-primary">确定</button>
              </div>
              <section className="dictionary-data-section" aria-label="字典数据">
                <header>
                  <h3>字典数据</h3>
                  <div>
                    <input
                      aria-label="搜索字典数据"
                      placeholder="请输入数据名称"
                      value={dataSearch}
                      onChange={(event) => {
                        setDataSearch(event.target.value);
                        setDataPage(1);
                      }}
                    />
                    <button type="button" className="dictionary-add-data" onClick={addDataRow}>添加数据</button>
                    <button type="button" className="dictionary-batch-delete" disabled={!selectedDataIds.length} onClick={() => deleteDataRows(selectedDataIds)}>批量删除</button>
                  </div>
                </header>
                <div className="dictionary-data-scroll">
                  <div className="dictionary-data-head">
                    <span>
                      <input
                        aria-label="全选字典数据"
                        type="checkbox"
                        checked={
                          Boolean(filteredDataRows.filter((item) => !item.isDraft).length) &&
                          selectedDataIds.length ===
                            filteredDataRows.filter((item) => !item.isDraft).length
                        }
                        onChange={() => {
                          const selectableIds = filteredDataRows
                            .filter((item) => !item.isDraft)
                            .map((item) => item.id);
                          setSelectedDataIds((current) =>
                            current.length === selectableIds.length ? [] : selectableIds,
                          );
                        }}
                      />
                    </span>
                    <span>编码</span>
                    <span>数据名称</span>
                    <span>更新人</span>
                    <span>更新时间</span>
                    <span>操作</span>
                  </div>
                  {pagedDataRows.map((item) => {
                    const isInlineEditing = editingData?.id === item.id;

                    return (
                    <div
                      className={`dictionary-data-row ${item.isDraft || isInlineEditing ? "draft" : ""}`}
                      key={item.id}
                    >
                      <span>
                        <input
                          aria-label={`选择${item.name || "新增数据"}`}
                          type="checkbox"
                          disabled={item.isDraft}
                          checked={selectedDataIds.includes(item.id)}
                          onChange={() => toggleDataRow(item.id)}
                        />
                      </span>
                      {item.isDraft || isInlineEditing ? (
                        <input
                          aria-label={item.isDraft ? "新增数据编码" : `编辑${item.name}的编码`}
                          value={item.isDraft ? item.code : editingData.code}
                          onChange={(event) =>
                            item.isDraft
                              ? updateDataRow(item.id, "code", event.target.value)
                              : setEditingData((current) => ({ ...current, code: event.target.value }))
                          }
                        />
                      ) : (
                        <code>{item.code}</code>
                      )}
                      {item.isDraft || isInlineEditing ? (
                        <input
                          aria-label={item.isDraft ? "新增数据名称" : `编辑${item.name}的数据名称`}
                          value={item.isDraft ? item.name : editingData.name}
                          onChange={(event) =>
                            item.isDraft
                              ? updateDataRow(item.id, "name", event.target.value)
                              : setEditingData((current) => ({ ...current, name: event.target.value }))
                          }
                        />
                      ) : (
                        <strong>{item.name}</strong>
                      )}
                      <span>{item.updater}</span>
                      <time>{item.updatedAt}</time>
                      {item.isDraft ? (
                        <span className="dictionary-draft-actions">
                          <button type="button" aria-label="确认新增数据" onClick={() => confirmDataRow(item.id)}>
                            <CheckmarkCircle24Regular />
                          </button>
                          <button type="button" aria-label="取消新增数据" onClick={() => deleteDataRows([item.id])}>
                            <DismissRegular />
                          </button>
                        </span>
                      ) : isInlineEditing ? (
                        <span className="dictionary-draft-actions">
                          <button type="button" aria-label="确认编辑数据" onClick={confirmEditingDataRow}>
                            <CheckmarkCircle24Regular />
                          </button>
                          <button type="button" aria-label="取消编辑数据" onClick={() => setEditingData(null)}>
                            <DismissRegular />
                          </button>
                        </span>
                      ) : (
                        <span className="dictionary-actions">
                          <button type="button" aria-label={`编辑${item.name}`} title="编辑" onClick={() => startEditingDataRow(item)}>
                            <Edit24Regular />
                          </button>
                          <button type="button" aria-label={`删除${item.name}`} title="删除" onClick={() => deleteDataRows([item.id])}>
                            <Delete24Regular />
                          </button>
                        </span>
                      )}
                    </div>
                    );
                  })}
                </div>
                <footer className="dictionary-pagination">
                  <span>共 {filteredDataRows.length} 条</span>
                  <label>
                    每页
                    <select
                      aria-label="每页数据条数"
                      value={dataPageSize}
                      onChange={(event) => {
                        setDataPageSize(Number(event.target.value));
                        setDataPage(1);
                      }}
                    >
                      <option value={10}>10 条</option>
                      <option value={20}>20 条</option>
                      <option value={50}>50 条</option>
                    </select>
                  </label>
                  <button type="button" aria-label="上一页" disabled={currentDataPage === 1} onClick={() => setDataPage((current) => current - 1)}>上一页</button>
                  <b>{currentDataPage} / {dataPageCount}</b>
                  <button type="button" aria-label="下一页" disabled={currentDataPage === dataPageCount} onClick={() => setDataPage((current) => current + 1)}>下一页</button>
                </footer>
              </section>
            </div>
          </form>
        </div>
      ) : null}
      {dialog?.type === "delete" ? (
        <div className="management-dialog-layer" onMouseDown={() => setDialog(null)} role="presentation">
          <section className="management-dialog management-confirm-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-dictionary-title">
            <header>
              <h2 id="delete-dictionary-title">确认删除</h2>
              <button type="button" className="management-dialog-close" aria-label="关闭删除确认" onClick={() => setDialog(null)}>
                <DismissRegular />
              </button>
            </header>
            <div className="management-dialog-body">
              <p>确定删除字典“{dialog.dictionary.name}”吗？删除后无法恢复。</p>
            </div>
            <footer>
              <button type="button" className="management-dialog-cancel" onClick={() => setDialog(null)}>取消</button>
              <button type="button" className="management-dialog-primary" onClick={deleteDictionary}>确认删除</button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function EnterpriseSettings({ branding, onBrandingChange, onAction }) {
  const logoInputRef = useRef(null);
  const backgroundInputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const uploadImage = (key, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("请选择 PNG、JPG 或 WebP 格式的图片");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError("图片大小不能超过 1.5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onBrandingChange((current) => ({ ...current, [key]: String(reader.result) }));
      setUploadError("");
      onAction(key === "logo" ? "企业 Logo 已更新" : "登录页背景图已更新");
    };
    reader.readAsDataURL(file);
  };
  const clearImage = (key) => {
    onBrandingChange((current) => ({ ...current, [key]: "" }));
    onAction(key === "logo" ? "已恢复默认 Logo" : "已恢复默认登录背景");
  };
  const selectSystemIcon = (icon) => {
    onBrandingChange((current) => ({ ...current, systemIcon: icon.id }));
    setIconPickerOpen(false);
    onAction(`已选择系统图标：${icon.label}`);
  };
  return (
    <section className="enterprise-settings" aria-labelledby="enterprise-settings-title">
      <header>
        <h1 id="enterprise-settings-title">企业设置</h1>
      </header>
      <div className="enterprise-settings-grid">
        <section className="enterprise-setting-card">
          <header><h2>企业 Logo</h2></header>
          <div className="enterprise-logo-preview">
            {branding.logo ? <img src={branding.logo} alt="企业 Logo 预览" /> : <span>C</span>}
          </div>
          <div className="enterprise-setting-actions">
            <button type="button" onClick={() => logoInputRef.current?.click()}>上传 Logo</button>
            {branding.logo ? <button type="button" className="secondary" onClick={() => clearImage("logo")}>恢复默认</button> : null}
          </div>
          <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadImage("logo", event)} hidden />
        </section>
        <section className="enterprise-setting-card enterprise-background-card">
          <header><h2>登录页背景图</h2></header>
          <div
            className={`enterprise-background-preview${branding.loginBackground ? " custom" : ""}`}
            style={branding.loginBackground ? { backgroundImage: `url(${branding.loginBackground})` } : undefined}
          >
            <span>登录页背景预览</span>
          </div>
          <div className="enterprise-setting-actions">
            <button type="button" onClick={() => backgroundInputRef.current?.click()}>上传背景图</button>
            {branding.loginBackground ? <button type="button" className="secondary" onClick={() => clearImage("loginBackground")}>恢复默认</button> : null}
          </div>
          <input ref={backgroundInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadImage("loginBackground", event)} hidden />
        </section>
        <section className="enterprise-setting-card enterprise-icon-card">
          <header><h2>系统图标管理</h2></header>
          <div className="enterprise-system-icon-preview" aria-label="当前系统图标预览">
            <SystemIcon name={branding.systemIcon} />
          </div>
          <p>统一维护系统内可复用的功能图标。</p>
          <div className="enterprise-setting-actions">
            <button type="button" onClick={() => setIconPickerOpen(true)}>选择图标</button>
          </div>
        </section>
      </div>
      {uploadError ? <p className="enterprise-upload-error" role="alert">{uploadError}</p> : null}
      {iconPickerOpen ? (
        <div className="management-dialog-layer" onMouseDown={() => setIconPickerOpen(false)} role="presentation">
          <section
            className="management-dialog icon-picker-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="选择系统图标"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="system-icon-picker-close"
              aria-label="关闭图标选择弹窗"
              onClick={() => setIconPickerOpen(false)}
            >
              <DismissRegular />
            </button>
            <h2 className="system-icon-picker-title">请选择图标</h2>
            <div className="system-icon-picker-grid">
              {systemIconLibrary.map((icon) => (
                <button
                  type="button"
                  key={icon.id}
                  aria-label={`选择${icon.label}图标`}
                  title={icon.label}
                  className={branding.systemIcon === icon.id ? "selected" : ""}
                  onClick={() => selectSystemIcon(icon)}
                >
                  <span><SystemIcon name={icon.id} /></span>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function MenuManagementPage({ onAction }) {
  const initialMenus = [
    {
      id: "settings", name: "设置中心", type: "目录", icon: "settings", sort: 8, path: "/settings", component: "", perms: "", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00",
      children: [
        { id: "settings-dynamics", name: "安全动态", type: "菜单", icon: "message", sort: 1, path: "dynamics", component: "DynamicsSettings", perms: "settings:dynamics:view", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00", children: [] },
        { id: "settings-worksheet", name: "工作表", type: "菜单", icon: "document", sort: 2, path: "worksheet", component: "EmbeddedLowCodePage", perms: "settings:worksheet:view", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00", children: [] },
        { id: "settings-task", name: "任务", type: "菜单", icon: "task", sort: 3, path: "task", component: "EmbeddedTaskFrame", perms: "settings:task:view", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00", children: [] },
        { id: "settings-flow", name: "流程", type: "菜单", icon: "flow", sort: 4, path: "flow", component: "EmbeddedLowCodePage", perms: "settings:flow:view", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00", children: [] },
        {
          id: "system-settings", name: "系统设置", type: "目录", icon: "settings", sort: 8, path: "system", component: "", perms: "", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00",
          children: [
            { id: "organization-users", name: "组织用户", type: "菜单", icon: "people", sort: 1, path: "organization-users", component: "UserManagementCenter", perms: "system:user:view", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00", children: [] },
            { id: "role-permission", name: "角色权限", type: "菜单", icon: "approval", sort: 2, path: "role-permission", component: "RbacPage", perms: "system:role:view", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00", children: [] },
            { id: "menu-management", name: "菜单管理", type: "菜单", icon: "sort", sort: 3, path: "menu-management", component: "MenuManagementPage", perms: "system:menu:view", visible: "显示", status: "启用", createdAt: "2026-08-31 09:00", children: [] },
            { id: "dictionary", name: "字典管理", type: "菜单", icon: "document", sort: 4, path: "dictionary", component: "DictionaryManagement", perms: "system:dictionary:view", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00", children: [] },
            { id: "enterprise", name: "企业设置", type: "菜单", icon: "briefcase", sort: 5, path: "enterprise", component: "EnterpriseSettings", perms: "system:enterprise:view", visible: "显示", status: "启用", createdAt: "2026-08-20 09:00", children: [] },
          ],
        },
      ],
    },
  ];
  const emptyMenu = (parentId = "settings") => ({ parentId, name: "", type: "菜单", icon: "apps", sort: 1, path: "", component: "", perms: "", visible: "显示", status: "启用" });
  const [menus, setMenus] = useState(initialMenus);
  const [queryName, setQueryName] = useState("");
  const [queryStatus, setQueryStatus] = useState("");
  const [expanded, setExpanded] = useState(() => new Set(["settings", "system-settings"]));
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(emptyMenu());
  const [formError, setFormError] = useState("");

  const flattenMenus = (nodes, depth = 0, parentId = "0") =>
    nodes.flatMap((node) => [
      { ...node, depth, parentId },
      ...flattenMenus(node.children ?? [], depth + 1, node.id),
    ]);
  const menuRows = flattenMenus(menus);
  const parentOptions = menuRows.filter((item) => item.type !== "按钮");
  const visibleRows = menuRows.filter((record) => {
    const ownMatch = (!queryName || record.name.includes(queryName.trim())) && (!queryStatus || record.status === queryStatus);
    if (ownMatch) return true;
    return menuRows.some((item) => item.id !== record.id && item.depth > record.depth && item.parentId === record.id && (!queryName || item.name.includes(queryName.trim())) && (!queryStatus || item.status === queryStatus));
  });
  const isRowVisible = (record) => {
    let parentId = record.parentId;
    while (parentId !== "0") {
      if (!expanded.has(parentId)) return false;
      parentId = menuRows.find((item) => item.id === parentId)?.parentId ?? "0";
    }
    return true;
  };
  const replaceNode = (nodes, id, update) => nodes.map((node) => node.id === id ? { ...node, ...update } : { ...node, children: replaceNode(node.children ?? [], id, update) });
  const appendNode = (nodes, parentId, node) => parentId === "0" ? [...nodes, node] : nodes.map((item) => item.id === parentId ? { ...item, children: [...(item.children ?? []), node] } : { ...item, children: appendNode(item.children ?? [], parentId, node) });
  const removeNode = (nodes, id) => nodes.filter((node) => node.id !== id).map((node) => ({ ...node, children: removeNode(node.children ?? [], id) }));
  const openCreate = (parentId = "settings") => {
    const parent = menuRows.find((item) => item.id === parentId);
    setForm({ ...emptyMenu(parentId), sort: (parent?.children?.length ?? menus.length) + 1 });
    setFormError("");
    setDialog({ mode: "create", parentId });
  };
  const openEdit = (record) => {
    setForm({ ...record });
    setFormError("");
    setDialog({ mode: "edit", id: record.id });
  };
  const saveMenu = (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("请输入菜单名称");
      return;
    }
    const duplicate = menuRows.some((item) => item.id !== dialog?.id && item.parentId === form.parentId && item.name === name);
    if (duplicate) {
      setFormError("同级菜单名称不能重复");
      return;
    }
    const payload = { ...form, name, sort: Number(form.sort) || 1 };
    if (dialog?.mode === "edit") setMenus((items) => replaceNode(items, dialog.id, payload));
    else setMenus((items) => appendNode(items, payload.parentId, { ...payload, id: `menu-${Date.now()}`, createdAt: "2026-08-31 10:00", children: [] }));
    setDialog(null);
    onAction(`${dialog?.mode === "edit" ? "保存" : "新增"}菜单成功`);
  };
  const toggleStatus = (record) => {
    const nextStatus = record.status === "启用" ? "停用" : "启用";
    setMenus((items) => replaceNode(items, record.id, { status: nextStatus }));
    onAction(`${record.name}已${nextStatus}`);
  };
  const deleteMenu = () => {
    setMenus((items) => removeNode(items, dialog.id));
    setDialog(null);
    onAction("删除菜单成功");
  };
  const expandAll = () => setExpanded(new Set(menuRows.filter((item) => item.children?.length).map((item) => item.id)));
  const collapseAll = () => setExpanded(new Set());
  const setField = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setFormError(""); };
  return (
    <section className="menu-management" aria-labelledby="menu-management-title">
      <header className="menu-management-toolbar">
        <h1 id="menu-management-title">菜单管理</h1>
        <button type="button" className="menu-management-primary" onClick={() => openCreate("settings")}><Add24Regular />新增菜单</button>
      </header>
      <section className="menu-management-panel">
        <div className="menu-management-filters">
          <label>菜单名称<input value={queryName} onChange={(event) => setQueryName(event.target.value)} maxLength={20} placeholder="请输入菜单名称" /></label>
          <label>状态<select value={queryStatus} onChange={(event) => setQueryStatus(event.target.value)}><option value="">全部</option><option>启用</option><option>停用</option></select></label>
          <button type="button" className="menu-filter-search">搜索</button>
          <button type="button" className="menu-filter-reset" onClick={() => { setQueryName(""); setQueryStatus(""); }}>重置</button>
          <span />
          <button type="button" className="menu-tree-tool" onClick={expandAll}>展开</button>
          <button type="button" className="menu-tree-tool" onClick={collapseAll}>折叠</button>
        </div>
        <div className="menu-management-table" role="table" aria-label="菜单列表">
          <div className="menu-management-table-head" role="row"><span>菜单名称</span><span>图标</span><span>排序</span><span>权限标识</span><span>组件路径</span><span>状态</span><span>创建时间</span><span>操作</span></div>
          {visibleRows.filter(isRowVisible).map((record) => {
            const hasChildren = (record.children ?? []).length > 0;
            return <div className="menu-management-table-row" role="row" key={record.id}>
              <div className="menu-tree-name" style={{ "--menu-depth": record.depth }}>
                {hasChildren ? <button type="button" className={expanded.has(record.id) ? "expanded" : ""} onClick={() => setExpanded((current) => { const next = new Set(current); next.has(record.id) ? next.delete(record.id) : next.add(record.id); return next; })}><ChevronRight24Regular /></button> : <i />}
                <SystemIcon name={record.icon} />
                <strong>{record.name}</strong><em>{record.type}</em>
              </div>
              <span><SystemIcon name={record.icon} /></span><span>{record.sort}</span><code>{record.perms || "-"}</code><code>{record.component || "-"}</code><span><i className={record.status === "启用" ? "menu-status enabled" : "menu-status"}>{record.status}</i></span><time>{record.createdAt}</time>
              <div className="menu-row-actions"><button type="button" onClick={() => openCreate(record.id)} disabled={record.type === "按钮"}>新增</button><button type="button" onClick={() => openEdit(record)}>修改</button><button type="button" onClick={() => toggleStatus(record)}>{record.status === "启用" ? "停用" : "启用"}</button><button type="button" className="danger" disabled={record.id === "settings"} onClick={() => setDialog({ mode: "delete", id: record.id, name: record.name })}>删除</button></div>
            </div>;
          })}
        </div>
      </section>
      {dialog?.mode === "create" || dialog?.mode === "edit" ? <div className="management-dialog-layer" onMouseDown={() => setDialog(null)} role="presentation"><form className="management-dialog menu-editor-dialog" onSubmit={saveMenu} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="menu-editor-title"><header><h2 id="menu-editor-title">{dialog.mode === "edit" ? "修改菜单" : "新增菜单"}</h2><button type="button" className="management-dialog-close" aria-label="关闭菜单编辑弹窗" onClick={() => setDialog(null)}><DismissRegular /></button></header><div className="management-dialog-body menu-editor-form">
        <label><b>上级菜单</b><select value={form.parentId} onChange={(event) => setField("parentId", event.target.value)} disabled={dialog.mode === "edit"}>{dialog.mode === "edit" && form.parentId === "0" ? <option value="0">主类目</option> : null}{parentOptions.filter((item) => item.id !== dialog.id).map((item) => <option value={item.id} key={item.id}>{"　".repeat(item.depth)}{item.name}</option>)}</select></label>
        <label><b>菜单类型</b><select value={form.type} onChange={(event) => setField("type", event.target.value)}><option>目录</option><option>菜单</option><option>按钮</option></select></label>
        <label><b>菜单名称</b><input value={form.name} onChange={(event) => setField("name", event.target.value)} maxLength={20} placeholder="请输入菜单名称" autoFocus /></label>
        <label><b>显示排序</b><input value={form.sort} onChange={(event) => setField("sort", event.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4} placeholder="请输入排序号" /></label>
        <label><b>路由地址</b><input value={form.path} onChange={(event) => setField("path", event.target.value)} maxLength={60} placeholder="例如：system/menu" /></label>
        <label><b>组件路径</b><input value={form.component} onChange={(event) => setField("component", event.target.value)} maxLength={60} placeholder="例如：system/menu/index" /></label>
        <label><b>权限标识</b><input value={form.perms} onChange={(event) => setField("perms", event.target.value)} maxLength={60} placeholder="例如：system:menu:view" /></label>
        <label><b>菜单图标</b><select value={form.icon} onChange={(event) => setField("icon", event.target.value)}>{systemIconLibrary.map((icon) => <option key={icon.id} value={icon.id}>{icon.label}</option>)}</select></label>
        <label><b>显示状态</b><select value={form.visible} onChange={(event) => setField("visible", event.target.value)}><option>显示</option><option>隐藏</option></select></label>
        <label><b>菜单状态</b><select value={form.status} onChange={(event) => setField("status", event.target.value)}><option>启用</option><option>停用</option></select></label>
        {formError ? <p className="menu-editor-error">{formError}</p> : null}
      </div><footer><button type="button" className="management-dialog-cancel" onClick={() => setDialog(null)}>取消</button><button type="submit" className="management-dialog-primary">保存</button></footer></form></div> : null}
      {dialog?.mode === "delete" ? <div className="management-dialog-layer" onMouseDown={() => setDialog(null)} role="presentation"><section className="management-dialog management-confirm-dialog" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-menu-title"><header><h2 id="delete-menu-title">确认删除</h2><button type="button" className="management-dialog-close" aria-label="关闭删除确认" onClick={() => setDialog(null)}><DismissRegular /></button></header><div className="management-dialog-body"><p>确定删除菜单“{dialog.name}”吗？其下级菜单也将一并删除。</p></div><footer><button type="button" className="management-dialog-cancel" onClick={() => setDialog(null)}>取消</button><button type="button" className="management-dialog-primary" onClick={deleteMenu}>确认删除</button></footer></section></div> : null}
    </section>
  );
}

function SettingsPage({ onAction, initialSelected = "安全动态", branding, onBrandingChange }) {
  const [selected, setSelected] = useState(initialSelected);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [worksheetExpanded, setWorksheetExpanded] = useState(false);
  const [processExpanded, setProcessExpanded] = useState(false);
  const [taskExpanded, setTaskExpanded] = useState(false);
  const [warningExpanded, setWarningExpanded] = useState(false);
  const [systemExpanded, setSystemExpanded] = useState(false);
  const worksheetMenus = [
    { label: "工作表单", module: "form" },
  ];
  const processMenus = [{ label: "流程中心", module: "flow" }];
  const worksheetMenu = worksheetMenus.find((entry) => entry.label === selected);
  const processMenu = processMenus.find((entry) => entry.label === selected);
  const applicationCenterMenu =
    selected === "应用中心" ? { label: "应用中心", module: "app" } : null;
  const directSettingsLowCodeMenu =
    selected === "工作表"
      ? { label: "工作表", module: "form" }
      : selected === "流程"
        ? { label: "流程", module: "flow" }
        : null;
  const lowCodeMenu = directSettingsLowCodeMenu ?? applicationCenterMenu;
  const taskPageMenus = [
    { label: "任务模版", view: "view-template" },
  ];
  const taskPageMenu = selected === "任务"
    ? { label: "任务", view: "view-template" }
    : taskPageMenus.find((entry) => entry.label === selected);
  const warningPageMenus = [
    { label: "预警信息表", view: "warning-info-table" },
    { label: "预警规则设置", view: "warning-rule" },
  ];
  const warningPageMenu = warningPageMenus.find(
    (entry) => entry.label === selected,
  );
  const systemSettingsMenus = ["组织用户", "角色权限", "菜单管理", "字典管理", "企业设置"];
  const item =
    settingsItems.find((entry) => entry.label === selected) ??
    worksheetMenu ??
    taskPageMenu ??
    warningPageMenu ??
    settingsItems[0];
  const Icon = item.icon ?? DocumentText24Regular;
  const rowsBySetting = {
    安全动态: [
      ["隐患整改逾期提醒", "整改期限前 24 小时通知", "已启用"],
      ["高风险作业预警", "出现预警时即时通知", "已启用"],
      ["安全检查动态", "每日汇总推送", "已启用"],
    ],
    工作表: [
      ["岗位隐患排查表", "双重预防机制", "使用中"],
      ["设备点检记录表", "设备管理", "使用中"],
      ["动火作业申请表", "安全管理", "使用中"],
    ],
    任务: [
      ["任务到期提醒", "截止前 2 小时", "已启用"],
      ["任务指派通知", "站内消息 + 待办", "已启用"],
      ["逾期升级规则", "超期 24 小时通知负责人", "已启用"],
    ],
    流程: [
      ["动火作业申请", "安全管理部审批", "已发布"],
      ["设备采购申请", "部门负责人审批", "已发布"],
      ["外协队入场审核", "安环部备案", "已发布"],
    ],
    数据台: [
      ["设备运行台账", "每 30 分钟同步", "正常"],
      ["隐患整改台账", "实时同步", "正常"],
      ["生产日报数据", "每日 18:00 汇总", "正常"],
    ],
    数据看板: [
      ["安全风险总览", "个人可见", "已添加"],
      ["设备健康度", "管理层共享", "已添加"],
      ["生产进度跟踪", "个人可见", "已添加"],
    ],
    角色权限: [
      ["安全管理员", "隐患、检查、预警管理", "当前角色"],
      ["任务执行人", "任务处理与反馈", "当前角色"],
      ["流程审批人", "审批与意见填写", "当前角色"],
    ],
    组织用户: [
      ["姓名", "张宇", "已认证"],
      ["所属部门", "安全管理部", "已同步"],
      ["通知方式", "站内消息、短信提醒", "已启用"],
    ],
  };
  const rows = rowsBySetting[selected] ?? [];
  const isUserCenter = selected === "组织用户";
  const isRbac = selected === "角色权限";
  const isMenuManagement = selected === "菜单管理";
  const isDynamicsSetting = selected === "安全动态";
  const isDictionarySetting = selected === "字典管理";
  const isEnterpriseSetting = selected === "企业设置";
  const isLowCodeSetting = Boolean(lowCodeMenu);
  const isWorksheetPageSetting = Boolean(worksheetMenu?.module);
  const isTaskPageSetting = Boolean(taskPageMenu);
  const isWarningPageSetting = Boolean(warningPageMenu);
  const isProcessPageSetting = Boolean(processMenu);
  const isSystemSetting = systemSettingsMenus.includes(selected);
  const toggleSettingsSubmenu = (menu) => {
    const expanded =
      menu === "worksheet"
        ? !worksheetExpanded
        : menu === "process"
          ? !processExpanded
          : menu === "task"
          ? !taskExpanded
          : menu === "warning"
            ? !warningExpanded
            : !systemExpanded;

    setWorksheetExpanded(menu === "worksheet" && expanded);
    setProcessExpanded(menu === "process" && expanded);
    setTaskExpanded(menu === "task" && expanded);
    setWarningExpanded(menu === "warning" && expanded);
    setSystemExpanded(menu === "system" && expanded);

    if (!expanded) return;
    if (menu === "worksheet") setSelected("工作表单");
    if (menu === "process") setSelected("流程中心");
    if (menu === "task") setSelected("任务模版");
    if (menu === "warning") setSelected("预警信息表");
  };
  return (
    <section className="settings-page" aria-labelledby="settings-title">
      <div className="settings-layout">
        <aside className="settings-sidebar" aria-label="设置菜单">
          <header>
            <Settings24Regular />
            <span>设置中心</span>
          </header>
          <nav>
            {settingsItems.map(({ label, icon: MenuIcon }) =>
              ["工作表", "任务", "流程"].includes(label) ? (
                <button
                  key={label}
                  className={selected === label ? "active" : ""}
                  onClick={() => setSelected(label)}
                >
                  <MenuIcon />
                  <span>{label}</span>
                </button>
              ) : label === "预警" ? (
                <div className="settings-menu-group" key={label}>
                  <button
                    className={`settings-parent-menu ${
                      selected === "预警" || isWarningPageSetting
                        ? "active"
                        : ""
                    }`}
                    onClick={() => toggleSettingsSubmenu("warning")}
                    aria-expanded={warningExpanded}
                  >
                    <MenuIcon />
                    <span>{label}</span>
                    <ChevronRight24Regular
                      className={warningExpanded ? "expanded" : ""}
                    />
                  </button>
                  {warningExpanded ? (
                    <div className="settings-submenu-list">
                      {warningPageMenus.map((entry) => (
                        <button
                          key={entry.label}
                          className={selected === entry.label ? "active" : ""}
                          onClick={() => setSelected(entry.label)}
                        >
                          {entry.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : label === "系统设置" ? (
                <div className="settings-menu-group" key={label}>
                  <button
                    className={`settings-parent-menu ${
                      isSystemSetting ? "active" : ""
                    }`}
                    onClick={() => toggleSettingsSubmenu("system")}
                    aria-expanded={systemExpanded}
                  >
                    <MenuIcon />
                    <span>{label}</span>
                    <ChevronRight24Regular
                      className={systemExpanded ? "expanded" : ""}
                    />
                  </button>
                  {systemExpanded ? (
                    <div className="settings-submenu-list">
                      {systemSettingsMenus.map((entry) => (
                        <button
                          key={entry}
                          className={selected === entry ? "active" : ""}
                          onClick={() => setSelected(entry)}
                        >
                          {entry}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  key={label}
                  className={selected === label ? "active" : ""}
                  onClick={() => setSelected(label)}
                >
                  <MenuIcon />
                  <span>{label}</span>
                  {label === "安全动态" ? null : <ChevronRight24Regular />}
                </button>
              ),
            )}
          </nav>
        </aside>
        <div className="settings-content">
          {!isUserCenter &&
          !isRbac &&
          !isMenuManagement &&
          !isEnterpriseSetting &&
          !isDynamicsSetting &&
          !isDictionarySetting &&
          !isLowCodeSetting &&
          !isTaskPageSetting &&
          !isWarningPageSetting ? (
            <header className="settings-header">
              <span className="settings-header-icon">
                <Icon />
              </span>
              <div>
                <h1 id="settings-title">{item.title}</h1>
                <p>{item.description}</p>
              </div>
              <button onClick={() => onAction(`新增${item.title}配置`)}>
                <Add24Regular />
                新增配置
              </button>
            </header>
          ) : null}
          {isDynamicsSetting ? (
            <section
              className="settings-dynamics-embed"
              aria-label="动态圈管理"
            >
              <iframe
                src={`${prototypeBase}index.html?view=feedno`}
                title="动态圈管理"
              />
            </section>
          ) : isEnterpriseSetting ? (
            <EnterpriseSettings
              branding={branding}
              onBrandingChange={onBrandingChange}
              onAction={onAction}
            />
          ) : isDictionarySetting ? (
            <DictionaryManagement onAction={onAction} />
          ) : isLowCodeSetting ? (
            <EmbeddedLowCodePage
              module={lowCodeMenu.module}
              view={lowCodeMenu.view}
            />
          ) : isTaskPageSetting ? (
            <section className="settings-task-embed" aria-label={taskPageMenu.label}>
              <EmbeddedTaskFrame
                view={taskPageMenu.view}
                title={taskPageMenu.label}
              />
            </section>
          ) : isWarningPageSetting ? (
            <section
              className="settings-warning-embed"
              aria-label={warningPageMenu.label}
            >
              <iframe
                src={`${prototypeBase}预警.html?view=${warningPageMenu.view}`}
                title={warningPageMenu.label}
              />
            </section>
          ) : isUserCenter ? (
            <UserManagementCenter
              organizations={organizations}
              setOrganizations={setOrganizations}
              users={users}
              setUsers={setUsers}
            />
          ) : isRbac ? (
            <RbacPage onAction={onAction} />
          ) : isMenuManagement ? (
            <MenuManagementPage onAction={onAction} />
          ) : (
            <>
              <section
                className="settings-panel"
                aria-labelledby="settings-list-title"
              >
                <div className="settings-panel-title">
                  <div>
                    <h2 id="settings-list-title">{item.title}配置</h2>
                    <p>以下内容为当前生效的配置项。</p>
                  </div>
                  <button onClick={() => onAction(`保存${item.title}设置`)}>
                    保存设置
                  </button>
                </div>
                <div className="settings-table">
                  <div className="settings-table-head">
                    <span>配置名称</span>
                    <span>规则 / 说明</span>
                    <span>状态</span>
                    <span>操作</span>
                  </div>
                  {rows.map(([name, description, status]) => (
                    <div className="settings-table-row" key={name}>
                      <strong>{name}</strong>
                      <span>{description}</span>
                      <i>{status}</i>
                      <button onClick={() => onAction(`编辑${name}`)}>
                        编辑
                      </button>
                    </div>
                  ))}
                </div>
              </section>
              <section className="settings-note">
                <CheckmarkCircle24Regular />
                <div>
                  <b>设置即时生效</b>
                  <span>保存后将应用到当前账号及相应的业务模块。</span>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function LoginPage({ onLogin, branding }) {
  const [savedCredentials] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem("ething-login") || "null");
    } catch {
      return null;
    }
  });
  const [account, setAccount] = useState(savedCredentials?.account ?? "");
  const [password, setPassword] = useState(savedCredentials?.password ?? "");
  const [rememberPassword, setRememberPassword] = useState(Boolean(savedCredentials));
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const submitLogin = (event) => {
    event.preventDefault();
    if (!account.trim() || !password) {
      setError("请输入账号和密码");
      return;
    }
    if (account.trim() !== "zhangyu" || password !== "123456") {
      setError("账号或密码不正确，请重新输入");
      return;
    }
    try {
      if (rememberPassword) {
        window.localStorage.setItem(
          "ething-login",
          JSON.stringify({ account: account.trim(), password }),
        );
      } else {
        window.localStorage.removeItem("ething-login");
      }
    } catch {}
    setError("");
    onLogin();
  };
  return (
    <main className="login-page">
      <section
        className={`login-brand-panel${branding.loginBackground ? " has-custom-background" : ""}`}
        style={
          branding.loginBackground
            ? { "--login-background-image": `url(${branding.loginBackground})` }
            : undefined
        }
        aria-labelledby="login-brand-title"
      >
        <div className="login-brand-mark">
          {branding.logo ? <img src={branding.logo} alt="企业 Logo" /> : "C"}
        </div>
        <div className="login-brand-content">
          <p>智慧应急安全管理平台</p>
          <h1 id="login-brand-title">把安全工作放在一处，清晰推进。</h1>
          <span>面向矿山现场的任务、流程、预警和业务应用协同入口。</span>
          <ul>
            <li><CheckmarkCircle24Regular /> 待办、流程与预警集中处理</li>
            <li><CheckmarkCircle24Regular /> 业务应用与表单快速进入</li>
            <li><CheckmarkCircle24Regular /> 动态信息及时同步到人</li>
          </ul>
        </div>
        <div className="login-brand-grid" aria-hidden="true">
          <i /><i /><i /><i />
        </div>
      </section>
      <section className="login-form-panel" aria-labelledby="login-title">
        <form className="login-form" onSubmit={submitLogin} noValidate>
          <div className="login-form-heading">
            <span>账号登录</span>
            <h2 id="login-title">欢迎登录</h2>
            <p>请输入账号和密码进入系统。</p>
          </div>
          <label>
            账号
            <input
              value={account}
              onChange={(event) => {
                setAccount(event.target.value);
                setError("");
              }}
              autoComplete="username"
              placeholder="请输入账号"
              autoFocus
            />
          </label>
          <label>
            密码
            <span className="login-password-field">
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                placeholder="请输入密码"
              />
              <button
                type="button"
                className="login-password-visibility"
                aria-label={passwordVisible ? "隐藏密码" : "显示密码"}
                title={passwordVisible ? "隐藏密码" : "显示密码"}
                onClick={() => setPasswordVisible((current) => !current)}
              >
                {passwordVisible ? <EyeOff24Regular /> : <Eye24Regular />}
              </button>
            </span>
          </label>
          {error ? <p className="login-error" role="alert">{error}</p> : null}
          <div className="login-options">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberPassword}
                onChange={(event) => setRememberPassword(event.target.checked)}
              />
              <span>记住密码</span>
            </label>
            <button
              type="button"
              className="login-forgot-password"
              onClick={() => setForgotPassword(true)}
            >
              忘记密码
            </button>
          </div>
          {forgotPassword ? (
            <p className="login-forgot-note" role="status">
              请联系管理员重置密码。
            </p>
          ) : null}
          <button type="submit" className="login-submit">
            登录系统
            <ArrowRight24Regular />
          </button>
          <p className="login-demo-account">演示账号：zhangyu　密码：123456</p>
        </form>
      </section>
    </main>
  );
}

function InputLengthGuard() {
  const [limitNotice, setLimitNotice] = useState("");
  const noticeTimer = useRef(null);

  useEffect(() => {
    const ignoredInputTypes = new Set([
      "button",
      "checkbox",
      "color",
      "date",
      "datetime-local",
      "file",
      "hidden",
      "image",
      "month",
      "radio",
      "range",
      "reset",
      "submit",
      "time",
      "week",
    ]);
    const isGuardedField = (element) =>
      (element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement) &&
      !element.disabled &&
      !element.readOnly &&
      !(element instanceof HTMLInputElement &&
        ignoredInputTypes.has(element.type));
    const getDefaultLimit = (element) => {
      if (element instanceof HTMLTextAreaElement) return 500;
      if (element.type === "password") return 64;
      if (element.type === "email") return 100;
      if (element.type === "tel") return 20;
      if (element.type === "number") return 12;
      if (element.type === "url") return 200;
      return 100;
    };
    const getLimit = (element) => {
      const configuredLimit = element.getAttribute("maxlength");
      if (configuredLimit !== null) {
        const parsedLimit = Number(configuredLimit);
        if (Number.isFinite(parsedLimit) && parsedLimit >= 0) {
          return parsedLimit;
        }
      }
      return getDefaultLimit(element);
    };
    const applyLimit = (element) => {
      if (!isGuardedField(element)) return null;
      const limit = getLimit(element);
      if (!element.hasAttribute("maxlength")) {
        element.setAttribute("maxlength", String(limit));
      }
      return limit;
    };
    const showLimitNotice = (limit) => {
      setLimitNotice(`输入内容最多 ${limit} 个字符，超出部分未保存`);
      window.clearTimeout(noticeTimer.current);
      noticeTimer.current = window.setTimeout(() => setLimitNotice(""), 3000);
    };
    const guardInputLength = (event) => {
      const element = event.target;
      const limit = applyLimit(element);
      if (limit === null) return;
      if (element.value.length <= limit) return;

      element.value = element.value.slice(0, limit);
      showLimitNotice(limit);
    };
    const notifyBeforeExceeding = (event) => {
      const element = event.target;
      const limit = applyLimit(element);
      if (limit === null || !event.data) return;
      const selectionLength =
        (element.selectionEnd ?? element.value.length) -
        (element.selectionStart ?? element.value.length);
      if (element.value.length - selectionLength + event.data.length > limit) {
        showLimitNotice(limit);
      }
    };
    const applyAddedFields = (node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.matches("input, textarea")) applyLimit(node);
      node.querySelectorAll("input, textarea").forEach(applyLimit);
    };
    document.querySelectorAll("input, textarea").forEach(applyLimit);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) =>
        mutation.addedNodes.forEach(applyAddedFields),
      );
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("input", guardInputLength, true);
    document.addEventListener("beforeinput", notifyBeforeExceeding, true);
    document.addEventListener("focusin", guardInputLength, true);
    return () => {
      document.removeEventListener("input", guardInputLength, true);
      document.removeEventListener("beforeinput", notifyBeforeExceeding, true);
      document.removeEventListener("focusin", guardInputLength, true);
      observer.disconnect();
      window.clearTimeout(noticeTimer.current);
    };
  }, []);

  return limitNotice ? (
    <div className="input-length-toast" role="status" aria-live="polite">
      {limitNotice}
    </div>
  ) : null;
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [enterpriseBranding, setEnterpriseBranding] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("enterprise-branding") ?? "{}");
      return {
        logo: typeof stored.logo === "string" ? stored.logo : "",
        loginBackground: typeof stored.loginBackground === "string" ? stored.loginBackground : "",
        systemIcon: typeof stored.systemIcon === "string" ? stored.systemIcon : "apps",
      };
    } catch {
      return { logo: "", loginBackground: "", systemIcon: "apps" };
    }
  });
  const [activeNav, setActiveNav] = useState("工作台");
  const [activeQueue, setActiveQueue] = useState("task");
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState("");
  const appNoticeTimer = useRef(null);
  const [openTabs, setOpenTabs] = useState(initialTabs);
  const [activeTab, setActiveTab] = useState("workbench");
  const [favoriteApps, setFavoriteApps] = useState(() =>
    apps.map((app) => app.name),
  );
  const [taskInitial, setTaskInitial] = useState("我的任务");
  const [processInitial, setProcessInitial] = useState("待审批");
  const [dynamicsInitial, setDynamicsInitial] = useState("动态");
  const [preventionInitial, setPreventionInitial] = useState(
    preventionForms[0].title,
  );
  const [preventionFormOpen, setPreventionFormOpen] = useState(false);
  const [settingsInitial, setSettingsInitial] = useState("安全动态");
  const [messages, setMessages] = useState(messageEntries);
  const [taskDetail, setTaskDetail] = useState(null);
  const [annotationsOpen, setAnnotationsOpen] = useState(true);
  const [annotationsManaging, setAnnotationsManaging] = useState(false);
  const [prototypeAnnotations, setPrototypeAnnotations] = useState([]);
  useEffect(() => {
    try {
      localStorage.setItem("enterprise-branding", JSON.stringify(enterpriseBranding));
    } catch {
      // The current session still uses the uploaded assets when browser storage is unavailable.
    }
  }, [enterpriseBranding]);
  useEffect(() => {
    let cancelled = false;

    fetch(PROTOTYPE_ANNOTATIONS_URL, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load prototype annotations");
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) setPrototypeAnnotations(getAnnotationsFromPayload(payload));
      })
      .catch(() => {
        if (!cancelled) setPrototypeAnnotations([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  const showNotice = (label) => {
    setNotice(`已选择 ${label}`);
    window.clearTimeout(appNoticeTimer.current);
    appNoticeTimer.current = window.setTimeout(() => setNotice(""), 3000);
  };
  const selectTab = (id) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setActiveTab(id);
      setActiveNav(
        id === "workbench" || id === "messages" || id === "todos"
          ? "工作台"
          : id === "tasks"
            ? "任务"
            : id === "processes"
              ? "流程"
              : id === "settings"
                ? "设置"
                : id === "personal-center"
                  ? ""
                : id === "dashboard"
                  ? "看板"
                  : id === "safety-dynamics"
                    ? "动态"
                    : id === "warnings"
                      ? "预警"
                      : "应用",
      );
    });
  };
  const openApplication = (name) => {
    const preventionForm = [...preventionForms, ...preventionApprovalFlows].find(
      (form) => form.title === name,
    );
    if (preventionForm) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      startTransition(() => {
        setPreventionInitial(preventionForm.title);
        setPreventionFormOpen(true);
        setOpenTabs((current) =>
          current.some((tab) => tab.id === "双重预防机制")
            ? current
            : [
                ...current,
                {
                  id: "双重预防机制",
                  label: "双重预防机制",
                  icon: ShieldCheckmark24Regular,
                },
              ],
        );
        setActiveTab("双重预防机制");
        setActiveNav("应用");
      });
      return;
    }
    const targetName = name === "应用中心" ? "双重预防机制" : name;
    const app = apps.find((item) => item.name === targetName);
    if (!app) {
      showNotice(name);
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      if (targetName === "双重预防机制") setPreventionFormOpen(false);
      setOpenTabs((current) =>
        current.some((tab) => tab.id === targetName)
          ? current
          : [...current, { id: targetName, label: targetName, icon: app.icon }],
      );
      setActiveTab(targetName);
      setActiveNav("应用");
    });
  };
  const openMessages = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "messages")
          ? current
          : [
              ...current,
              { id: "messages", label: "消息", icon: Chat24Regular },
            ],
      );
      setActiveTab("messages");
      setActiveNav("工作台");
    });
  };
  const openTasks = (initialTab = "我的任务") => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setTaskDetail(null);
      setTaskInitial(initialTab);
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "tasks")
          ? current
          : [
              ...current,
              { id: "tasks", label: "任务", icon: ClipboardTask24Regular },
            ],
      );
      setActiveTab("tasks");
      setActiveNav("任务");
    });
  };
  const openProcesses = (initialFilter = "待审批") => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setProcessInitial(initialFilter);
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "processes")
          ? current
          : [
              ...current,
              { id: "processes", label: "流程", icon: Flowchart24Regular },
            ],
      );
      setActiveTab("processes");
      setActiveNav("流程");
    });
  };
  const openDashboard = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "dashboard")
          ? current
          : [
              ...current,
              {
                id: "dashboard",
                label: "看板",
                icon: DataBarVertical24Regular,
              },
            ],
      );
      setActiveTab("dashboard");
      setActiveNav("看板");
    });
  };
  const openSafetyDynamics = (initialTab = "动态") => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setDynamicsInitial(initialTab);
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "safety-dynamics")
          ? current
          : [
              ...current,
              {
                id: "safety-dynamics",
                label: "安全动态",
                icon: ShieldCheckmark24Regular,
              },
            ],
      );
      setActiveTab("safety-dynamics");
      setActiveNav("动态");
    });
  };
  const openWarnings = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "warnings")
          ? current
          : [
              ...current,
              { id: "warnings", label: "预警", icon: ErrorCircle24Regular },
            ],
      );
      setActiveTab("warnings");
      setActiveNav("预警");
    });
  };
  const openTodoOverview = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "todos")
          ? current
          : [
              ...current,
              { id: "todos", label: "待办总览", icon: ClipboardTask24Regular },
            ],
      );
      setActiveTab("todos");
      setActiveNav("工作台");
    });
  };
  const openSettings = (initialSelected = "安全动态") => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setSettingsInitial(initialSelected);
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "settings")
          ? current
          : [
              ...current,
              { id: "settings", label: "设置", icon: Settings24Regular },
            ],
      );
      setActiveTab("settings");
      setActiveNav("设置");
    });
  };
  const openPersonalCenter = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startTransition(() => {
      setOpenTabs((current) =>
        current.some((tab) => tab.id === "personal-center")
          ? current
          : [
              ...current,
              { id: "personal-center", label: "个人中心", icon: People24Regular },
            ],
      );
      setActiveTab("personal-center");
      setActiveNav("");
    });
  };
  const markMessageRead = (id) =>
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, read: true } : message,
      ),
    );
  const markAllMessagesRead = () =>
    setMessages((current) =>
      current.map((message) => ({ ...message, read: true })),
    );
  const closeTab = (id) => {
    const closingIndex = openTabs.findIndex((tab) => tab.id === id);
    const remainingTabs = openTabs.filter((tab) => tab.id !== id);
    startTransition(() => {
      setOpenTabs(remainingTabs);
      if (activeTab === id) {
        const fallback =
          remainingTabs[Math.max(0, closingIndex - 1)] ?? initialTabs[0];
        setActiveTab(fallback.id);
        setActiveNav(
          fallback.id === "workbench"
            ? "工作台"
            : fallback.id === "settings"
              ? "设置"
              : fallback.id === "personal-center"
                ? ""
                : "应用中心",
        );
      }
    });
  };
  const activeApplication = apps.find((app) => app.name === activeTab);
  if (!authenticated) {
    return (
      <FluentProvider theme={webLightTheme}>
        <InputLengthGuard />
        <LoginPage branding={enterpriseBranding} onLogin={() => setAuthenticated(true)} />
      </FluentProvider>
    );
  }
  return (
    <FluentProvider theme={webLightTheme}>
      <InputLengthGuard />
      <div className="workbench theme-light">
        <AppNav
          active={activeNav}
          brandLogo={enterpriseBranding.logo}
          onOpenSettings={openSettings}
          onChange={(label) => {
            if (label === "工作台") {
              selectTab("workbench");
              return;
            }
            if (label === "应用") {
              openApplication("应用中心");
              return;
            }
            if (label === "任务") {
              openTasks();
              return;
            }
            if (label === "流程") {
              openProcesses();
              return;
            }
            if (label === "动态") {
              openSafetyDynamics();
              return;
            }
            if (label === "预警") {
              openWarnings();
              return;
            }
            if (label === "看板") {
              openDashboard();
              return;
            }
            setActiveNav(label);
            showNotice(label);
          }}
        />
        <div className="page-shell">
          <ApplicationTabs
            tabs={openTabs}
            activeTab={activeTab}
            onSelect={selectTab}
            onClose={closeTab}
            onOpenMessages={openMessages}
            onOpenPersonal={openPersonalCenter}
            onLogout={() => setAuthenticated(false)}
            annotationVisible={annotationsOpen}
            onToggleAnnotations={() => setAnnotationsOpen((current) => !current)}
            annotationManaging={annotationsManaging}
            onToggleAnnotationManager={() => setAnnotationsManaging((current) => !current)}
          />
          <main>
            {activeTab === "messages" ? (
              <MessageCenter
                messages={messages}
                onMarkRead={markMessageRead}
                onMarkAllRead={markAllMessagesRead}
                onReturn={() => selectTab("workbench")}
              />
            ) : activeTab === "todos" ? (
              <TodoOverviewPage
                onOpenTasks={openTasks}
                onOpenProcesses={openProcesses}
                onOpenSafety={openSafetyDynamics}
              />
            ) : activeTab === "tasks" ? (
              <EmbeddedTasksPage key={taskInitial} initialTab={taskInitial} />
            ) : activeTab === "processes" ? (
              <ProcessListPage
                key={processInitial}
                initialFilter={processInitial}
                onAction={showNotice}
              />
            ) : activeTab === "safety-dynamics" ? (
              <EmbeddedDynamicsPage
                key={dynamicsInitial}
                initialTab={dynamicsInitial}
                onAction={showNotice}
              />
            ) : activeTab === "warnings" ? (
              <EmbeddedWarningsPage />
            ) : activeTab === "dashboard" ? (
              <DashboardPage />
            ) : activeTab === "settings" ? (
              <SettingsPage
                key={settingsInitial}
                initialSelected={settingsInitial}
                onAction={showNotice}
                branding={enterpriseBranding}
                onBrandingChange={setEnterpriseBranding}
              />
            ) : activeTab === "personal-center" ? (
              <PersonalCenter onAction={showNotice} />
            ) : activeApplication?.name === "双重预防机制" ? (
              <DualPreventionPage
                key={`${preventionInitial}-${preventionFormOpen ? "form" : "catalog"}`}
                initialFormTitle={preventionInitial}
                initialOpenForm={preventionFormOpen}
                onAction={showNotice}
                onSwitchApplication={openApplication}
              />
            ) : activeApplication ? (
              <MockApplicationPage
                app={activeApplication}
                onReturn={() => selectTab("workbench")}
                onAction={showNotice}
                onSwitchApplication={openApplication}
              />
            ) : (
              <div className="workbench-home">
                <header className="workbench-welcome">
                  <div>
                    <h1>
                      智慧应急安全管理平台欢迎您，
                      <button
                        className="workbench-user-link"
                        onClick={openPersonalCenter}
                      >
                        张宇
                      </button>
                    </h1>
                  </div>
                  <span>今日工作已更新</span>
                </header>
                <div className="main-layout">
                  <div className="primary-column">
                    <section
                      className="priority-zone"
                      aria-labelledby="priority-title"
                    >
                    <div className="section-title priority-title">
                      <div>
                        <h2 id="priority-title">待办事项</h2>
                      </div>
                      <button
                        className="quiet-action"
                        onClick={openTodoOverview}
                      >
                        待办总览 <ArrowRight24Regular />
                      </button>
                    </div>
                    <div className="queue-grid">
                      {workQueues.map((item) => (
                        <WorkQueue
                          item={item}
                          key={item.id}
                          active={activeQueue === item.id}
                          onSelect={() => setActiveQueue(item.id)}
                          onOpen={(id) => {
                            if (id === "message") openMessages();
                            if (id === "task") openTasks();
                            if (id === "approval") openProcesses();
                            if (id === "warning") openWarnings();
                          }}
                        />
                      ))}
                    </div>
                    </section>
                    <RecentApps onOpen={openApplication} />
                    <ApplicationRail
                      onOpen={openApplication}
                      favoriteApps={favoriteApps}
                      onCustomize={setFavoriteApps}
                    />
                  </div>
                  <div className="secondary-column">
                    <CommandPanel
                      onAction={setDialog}
                      onOpenTask={() => openTasks("发布任务")}
                      onOpenProcess={() => openProcesses("发起流程")}
                      onOpenDynamics={() => openSafetyDynamics("发动态")}
                    />
                    <ActivityFeed
                      onOpen={showNotice}
                      onOpenAll={openSafetyDynamics}
                    />
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
        <PrototypeAnnotations
          visible={annotationsOpen}
          managing={annotationsManaging}
          pageId={activeTab}
          pageLabel={openTabs.find((tab) => tab.id === activeTab)?.label ?? "工作台"}
          annotations={prototypeAnnotations}
          onCloseManager={() => setAnnotationsManaging(false)}
          onAdd={({ pageId, pageLabel, content, left, top }) => {
            setAnnotationsOpen(true);
            setPrototypeAnnotations((current) => [
              ...current,
              { id: `annotation-${Date.now()}`, pageId, pageLabel, content, left, top },
            ]);
          }}
          onUpdate={(id, content) =>
            setPrototypeAnnotations((current) =>
              current.map((annotation) =>
                annotation.id === id ? { ...annotation, content } : annotation,
              ),
            )
          }
          onRemove={(id) =>
            setPrototypeAnnotations((current) =>
              current.filter((annotation) => annotation.id !== id),
            )
          }
          onReposition={(id, position) => {
            setAnnotationsOpen(true);
            setPrototypeAnnotations((current) =>
              current.map((annotation) =>
                annotation.id === id ? { ...annotation, ...position } : annotation,
              ),
            );
          }}
        />
        {notice ? (
          <div className="toast" role="status" aria-label={notice}>
            <CheckmarkCircle24Regular />
            {notice}
          </div>
        ) : null}
        <ActionDialog title={dialog} onClose={() => setDialog(null)} />
      </div>
    </FluentProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
