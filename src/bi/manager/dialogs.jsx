import { useState } from "react";
import { createScreen, duplicateScreen } from "../screen/model.js";
import { patchScreen, shareUrl, useScreens } from "../screen/screenStore.js";
import { buildTemplates } from "../screen/templates.js";
import { SCREEN_SIZES, THEMES } from "../screen/themes.js";
import { Button, Dialog, Field, notify, Switch } from "../ui.jsx";
import { Thumbnail } from "./Thumbnail.jsx";

/** extra: optional third choice shown apart from the main buttons, e.g. { label, onSelect }. */
export function ConfirmDialog({ title, message, confirmLabel = "确定", danger, extra, onConfirm, onClose }) {
  return (
    <Dialog
      title={title}
      onClose={onClose}
      width={440}
      footer={
        <>
          {extra ? <Button variant="quiet" className="bi-dialog__extra" onClick={extra.onSelect}>{extra.label}</Button> : null}
          <Button onClick={onClose}>取消</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="bi-dialog__text">{message}</p>
    </Dialog>
  );
}

export function ShareDialog({ screenId, onClose }) {
  const screen = useScreens().find((entry) => entry.id === screenId);
  if (!screen) return null;
  const url = shareUrl(screen.id);
  const published = screen.status === "published";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify("已复制分享链接");
    } catch {
      notify("浏览器不允许自动复制，请手动选中链接复制", "error");
    }
  };
  return (
    <Dialog
      title="分享大屏"
      subtitle={screen.name}
      onClose={onClose}
      width={540}
      footer={<Button onClick={onClose}>关闭</Button>}
    >
      {published ? (
        <>
          <Switch
            checked={screen.shared}
            label="开启链接分享（打开链接无需登录）"
            onChange={(shared) => {
              patchScreen(screen.id, { shared });
              notify(shared ? "已开启分享" : "已关闭分享");
            }}
          />
          <div className={screen.shared ? "bi-share-link" : "bi-share-link is-off"}>
            <input className="bi-input" readOnly value={url} onFocus={(event) => event.target.select()} aria-label="分享链接" />
            <Button variant="primary" disabled={!screen.shared} onClick={copy}>复制链接</Button>
            <Button disabled={!screen.shared} onClick={() => window.open(url, "_blank", "noopener")}>打开</Button>
          </div>
          <p className="bi-dialog__note">
            开启后，拿到链接的人不用登录就能查看这个大屏，看到的数据与「看板」里一致。关闭分享或下架大屏后，链接立即失效。
          </p>
        </>
      ) : (
        <p className="bi-dialog__text">这个大屏还没有发布。发布之后才能开启分享。</p>
      )}
    </Dialog>
  );
}

export function NewScreenDialog({ onCreate, onClose }) {
  const [templates] = useState(() => buildTemplates());
  const [name, setName] = useState("");
  const [sizeId, setSizeId] = useState(SCREEN_SIZES[0].id);
  const [theme, setTheme] = useState("shaft");
  const [templateId, setTemplateId] = useState("blank");

  const template = templates.find((entry) => entry.id === templateId);
  const submit = () => {
    const finalName = name.trim() || (template ? `${template.name} 副本` : "未命名大屏");
    if (template) {
      onCreate({ ...duplicateScreen(template, finalName), description: template.description });
      return;
    }
    const size = SCREEN_SIZES.find((entry) => entry.id === sizeId) ?? SCREEN_SIZES[0];
    onCreate(createScreen({ name: finalName, width: size.width, height: size.height, theme }));
  };

  return (
    <Dialog
      title="新建大屏"
      onClose={onClose}
      width={720}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={submit}>创建并开始设计</Button>
        </>
      }
    >
      <Field label="大屏名称">
        <input className="bi-input" value={name} maxLength={30} placeholder="如：南区采场安全态势" onChange={(event) => setName(event.target.value)} />
      </Field>
      <div className="bi-field">
        <span className="bi-field__label">从哪里开始</span>
        <div className="bi-template-grid">
          <button type="button" className={templateId === "blank" ? "bi-template is-active" : "bi-template"} onClick={() => setTemplateId("blank")}>
            <span className="bi-template__blank">空白画布</span>
            <b>空白大屏</b>
            <small>自己拖组件搭建</small>
          </button>
          {templates.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={templateId === entry.id ? "bi-template is-active" : "bi-template"}
              onClick={() => setTemplateId(entry.id)}
            >
              <Thumbnail screen={entry} />
              <b>{entry.name}</b>
              <small>{entry.description}</small>
            </button>
          ))}
        </div>
      </div>
      {template ? null : (
        <div className="bi-form-row">
          <Field label="画布尺寸">
            <select className="bi-input" value={sizeId} onChange={(event) => setSizeId(event.target.value)}>
              {SCREEN_SIZES.map((size) => (
                <option key={size.id} value={size.id}>{size.label}</option>
              ))}
            </select>
          </Field>
          <Field label="主题">
            <select className="bi-input" value={theme} onChange={(event) => setTheme(event.target.value)}>
              {Object.values(THEMES).map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name}（{entry.hint}）</option>
              ))}
            </select>
          </Field>
        </div>
      )}
    </Dialog>
  );
}
