// 「显示说明」打开后出现在页面右侧的设计说明：这个页面为什么这样设计、每一块的规则是什么。
// 内容在 content.jsx 里，按页面分节。

import { useState } from "react";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { DOCS } from "./content.jsx";

export function DocPanel({ page, onClose, className = "" }) {
  const doc = DOCS[page];
  const [sectionId, setSectionId] = useState(doc.sections[0].id);
  const section = doc.sections.find((entry) => entry.id === sectionId) ?? doc.sections[0];
  const Content = section.content;
  return (
    <aside className={`bi-doc ${className}`} aria-label={`${doc.title}设计说明`}>
      <header>
        <b>设计说明</b>
        <span>{doc.title}</span>
        <button type="button" aria-label="收起说明" title="收起说明" onClick={onClose}>
          <Dismiss24Regular />
        </button>
      </header>
      <nav className="bi-doc__nav" aria-label="说明章节">
        {doc.sections.map((entry) => (
          <button key={entry.id} type="button" className={entry.id === section.id ? "is-active" : ""} aria-pressed={entry.id === section.id} onClick={() => setSectionId(entry.id)}>
            {entry.label}
          </button>
        ))}
      </nav>
      <div className="bi-doc__body" key={section.id}>
        <Content />
      </div>
    </aside>
  );
}
