import { useEffect, useRef } from "react";
import { Dismiss24Regular } from "@fluentui/react-icons";

export function SpaceDialog({ widget, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  if (!widget) return null;
  return (
    <div className="bi-space-dialog-layer" role="presentation">
      <section className="bi-space-dialog" role="dialog" aria-modal="true" aria-label={`${widget.style?.title || "矿山安全空间"}预览`} ref={dialogRef}>
        <iframe className="bi-space-dialog__frame" title="矿山安全空间编辑器" src={`${import.meta.env.BASE_URL}mine-space/index.html`} />
        <button type="button" className="bi-space-dialog__close" aria-label="关闭空间预览并返回画布" title="返回大屏画布" onClick={onClose}>
          <Dismiss24Regular />
        </button>
      </section>
    </div>
  );
}
