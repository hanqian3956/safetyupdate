// 设置中心「数据看板」：大屏列表，新建、编辑、发布、复制、分享、导入导出。

import { useRef, useState } from "react";
import {
  Add24Regular,
  ArrowUpload24Regular,
  DataBarVertical24Regular,
  Edit24Regular,
  MoreHorizontal24Regular,
} from "@fluentui/react-icons";
import { formatDateTime } from "../query/format.js";
import {
  copyScreen,
  exportScreenFile,
  importScreenText,
  removeScreen,
  restoreTemplates,
  saveScreen,
  setPublished,
  useScreens,
} from "../screen/screenStore.js";
import { DocPanel } from "../docs/DocPanel.jsx";
import { getTheme } from "../screen/themes.js";
import { Button, IconButton, Menu, notify, Switch } from "../ui.jsx";
import { ConfirmDialog, NewScreenDialog, ShareDialog } from "./dialogs.jsx";
import { Thumbnail } from "./Thumbnail.jsx";

const FILTERS = [
  ["all", "全部"],
  ["published", "已发布"],
  ["draft", "草稿"],
];

export function ScreenManager({ onEdit, onOpenViewer }) {
  const screens = useScreens();
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [sharingId, setSharingId] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [showDoc, setShowDoc] = useState(false);
  const fileRef = useRef(null);

  const visible = screens.filter((screen) => filter === "all" || screen.status === filter);
  const counts = {
    all: screens.length,
    published: screens.filter((screen) => screen.status === "published").length,
    draft: screens.filter((screen) => screen.status !== "published").length,
  };
  const now = Date.now();

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = importScreenText(await file.text());
      notify(`已导入「${imported.name}」，保存为草稿`);
    } catch (error) {
      notify(error.message, "error");
    }
  };

  return (
    <section className={showDoc ? "bi-ui bi-manager has-doc" : "bi-ui bi-manager"} aria-labelledby="bi-manager-title">
      <div className="bi-docbar">
        <Switch checked={showDoc} onChange={setShowDoc} label="显示说明" />
      </div>
      <header className="bi-manager__head">
        <span className="bi-manager__icon"><DataBarVertical24Regular /></span>
        <div>
          <h1 id="bi-manager-title">数据看板</h1>
          <p>把各应用里提交的表单、流程、任务和预警数据，拖拽搭建成可视化大屏。发布后显示在主导航「看板」里。</p>
        </div>
        <div className="bi-manager__actions">
          <Button icon={<ArrowUpload24Regular />} onClick={() => fileRef.current?.click()}>导入配置</Button>
          <Button variant="primary" icon={<Add24Regular />} onClick={() => setCreating(true)}>新建大屏</Button>
          <Menu
            trigger={({ toggle, open }) => (
              <IconButton label="更多操作" active={open} onClick={toggle}><MoreHorizontal24Regular /></IconButton>
            )}
            items={[
              { label: "查看已发布的看板", onSelect: onOpenViewer },
              { label: "恢复内置模板", onSelect: () => setRestoring(true) },
            ]}
          />
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importFile} />
        </div>
      </header>

      <div className="bi-manager__filters" role="tablist" aria-label="按状态筛选">
        {FILTERS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={filter === id} className={filter === id ? "is-active" : ""} onClick={() => setFilter(id)}>
            {label}
            <b>{counts[id]}</b>
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="bi-cards">
          {visible.map((screen) => {
            const published = screen.status === "published";
            return (
              <article className="bi-card" key={screen.id}>
                <button type="button" className="bi-card__thumb" onClick={() => onEdit(screen.id)} aria-label={`编辑 ${screen.name}`}>
                  <Thumbnail screen={screen} />
                  <span><Edit24Regular />进入设计</span>
                </button>
                <div className="bi-card__body">
                  <h2>
                    <span title={screen.name}>{screen.name}</span>
                    <i className={published ? "bi-status is-published" : "bi-status"}>{published ? "已发布" : "草稿"}</i>
                  </h2>
                  <p>{screen.description || "暂无说明"}</p>
                  <small>
                    {screen.width} × {screen.height} · {getTheme(screen.theme).name}主题 · {screen.widgets.length} 个组件 · {formatDateTime(screen.updatedAt, "smart-short", now)} 更新
                  </small>
                </div>
                <footer>
                  <Button onClick={() => onEdit(screen.id)}>编辑</Button>
                  {published ? (
                    <Button
                      onClick={() => {
                        setPublished(screen.id, false);
                        notify(`「${screen.name}」已下架`);
                      }}
                    >
                      下架
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => {
                        setPublished(screen.id, true);
                        notify(`「${screen.name}」已发布，可在「看板」中查看`);
                      }}
                    >
                      发布
                    </Button>
                  )}
                  <Menu
                    trigger={({ toggle, open }) => (
                      <IconButton label={`${screen.name}的更多操作`} active={open} onClick={toggle}><MoreHorizontal24Regular /></IconButton>
                    )}
                    items={[
                      {
                        label: "复制",
                        onSelect: () => {
                          const copy = copyScreen(screen.id);
                          if (copy) notify(`已复制为「${copy.name}」`);
                        },
                      },
                      { label: "分享", disabled: !published, onSelect: () => setSharingId(screen.id) },
                      { label: "导出配置文件", onSelect: () => exportScreenFile(screen) },
                      "divider",
                      { label: "删除", danger: true, onSelect: () => setDeleting(screen) },
                    ]}
                  />
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bi-blank">
          <h2>{filter === "all" ? "还没有大屏" : filter === "published" ? "没有已发布的大屏" : "没有草稿"}</h2>
          <p>{filter === "published" ? "在大屏卡片上点「发布」，它就会出现在主导航「看板」里。" : "新建一个空白大屏，或从内置模板开始。"}</p>
          <Button variant="primary" icon={<Add24Regular />} onClick={() => setCreating(true)}>新建大屏</Button>
        </div>
      )}
      {showDoc ? <DocPanel page="manager" onClose={() => setShowDoc(false)} /> : null}

      {creating ? (
        <NewScreenDialog
          onClose={() => setCreating(false)}
          onCreate={(screen) => {
            if (!saveScreen(screen)) {
              notify("创建失败，请稍后重试", "error");
              return;
            }
            setCreating(false);
            onEdit(screen.id);
          }}
        />
      ) : null}
      {deleting ? (
        <ConfirmDialog
          title={`删除「${deleting.name}」？`}
          message={deleting.status === "published" ? "这个大屏已发布，删除后「看板」里也会消失，分享链接随之失效。删除后无法恢复。" : "删除后无法恢复。"}
          confirmLabel="删除"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            removeScreen(deleting.id);
            notify(`已删除「${deleting.name}」`);
            setDeleting(null);
          }}
        />
      ) : null}
      {restoring ? (
        <ConfirmDialog
          title="恢复内置模板？"
          message="安全风险总览、设备运行态势、生产进度跟踪、应急管理看板这 4 个内置大屏会恢复成初始内容，你对它们的修改会被覆盖。其它大屏不受影响。"
          confirmLabel="恢复"
          onClose={() => setRestoring(false)}
          onConfirm={() => {
            restoreTemplates();
            notify("已恢复 4 个内置大屏");
            setRestoring(false);
          }}
        />
      ) : null}
      {sharingId ? <ShareDialog screenId={sharingId} onClose={() => setSharingId(null)} /> : null}
    </section>
  );
}
