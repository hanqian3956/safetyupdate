// Small UI kit for the BI module's own chrome (designer, screen list, dialogs).
// Kept local so the module does not depend on the workbench's page-specific styles.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Dismiss24Regular } from "@fluentui/react-icons";

export function Button({ variant = "default", icon, children, className = "", ...props }) {
  return (
    <button type="button" className={`bi-btn bi-btn--${variant} ${className}`} {...props}>
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

export function IconButton({ label, active, children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`bi-iconbtn ${active ? "is-active" : ""} ${className}`}
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : Boolean(active)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className={`bi-switch ${disabled ? "is-disabled" : ""}`}>
      <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

export function Dialog({ title, subtitle, onClose, footer, width = 520, children }) {
  const panelRef = useRef(null);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    panelRef.current?.querySelector("input, select, textarea, button:not(.bi-dialog__close)")?.focus();
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return createPortal(
    <div className="bi-ui bi-dialog-layer" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="bi-dialog" role="dialog" aria-modal="true" aria-label={title} style={{ width: `min(${width}px, calc(100vw - 40px))` }} ref={panelRef}>
        <header>
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="bi-dialog__close" aria-label="关闭" onClick={onClose}>
            <Dismiss24Regular />
          </button>
        </header>
        <div className="bi-dialog__body">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

/** Dropdown menu anchored to its trigger. items: [{ label, onSelect, danger, disabled, icon } | "divider"] */
export function Menu({ trigger, items, align = "right" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="bi-menu" ref={rootRef}>
      {trigger({ open, toggle: () => setOpen((current) => !current) })}
      {open ? (
        <div className={`bi-menu__list bi-menu__list--${align}`} role="menu">
          {items.filter(Boolean).map((item, index) =>
            item === "divider" ? (
              <hr key={`divider-${index}`} />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={item.danger ? "is-danger" : ""}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}

// ---- toasts -------------------------------------------------------------
let toasts = [];
let toastId = 0;
const toastListeners = new Set();
const emitToasts = () => toastListeners.forEach((listener) => listener());

export function notify(message, tone = "success") {
  toastId += 1;
  const id = toastId;
  toasts = [...toasts.slice(-2), { id, message, tone }];
  emitToasts();
  window.setTimeout(() => {
    toasts = toasts.filter((toast) => toast.id !== id);
    emitToasts();
  }, tone === "error" ? 5200 : 2800);
}

export function ToastHost() {
  const list = useSyncExternalStore(
    (listener) => {
      toastListeners.add(listener);
      return () => toastListeners.delete(listener);
    },
    () => toasts,
  );
  if (!list.length) return null;
  return createPortal(
    <div className="bi-ui bi-toasts" role="status" aria-live="polite">
      {list.map((toast) => (
        <div key={toast.id} className={`bi-toast bi-toast--${toast.tone}`}>{toast.message}</div>
      ))}
    </div>,
    document.body,
  );
}

export function Field({ label, hint, children, inline }) {
  return (
    <label className={inline ? "bi-field bi-field--inline" : "bi-field"}>
      <span className="bi-field__label">{label}</span>
      {children}
      {hint ? <small className="bi-field__hint">{hint}</small> : null}
    </label>
  );
}

/** Text input that commits on every change but keeps its own text while focused. */
export function NumberInput({ value, onChange, min, max, step = 1, ...props }) {
  const [text, setText] = useState(String(value ?? ""));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(String(value ?? ""));
  }, [value, focused]);
  const commit = (raw) => {
    if (raw === "" || raw === "-") return;
    let next = Number(raw);
    if (Number.isNaN(next)) return;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
  };
  return (
    <input
      type="number"
      className="bi-input"
      value={text}
      min={min}
      max={max}
      step={step}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        setText(String(value ?? ""));
      }}
      onChange={(event) => {
        setText(event.target.value);
        commit(event.target.value);
      }}
      {...props}
    />
  );
}
