// 明细：某个数据点（或某个组件）背后的原始记录，也就是用户在应用里提交的那些数据。
// 点开一行，可以看到这条记录关联的流程、任务和预警。

import { Fragment, useEffect, useMemo, useState } from "react";
import { getModule } from "../data/datasets.js";
import { formatCell, formatDateTime } from "../query/format.js";
import { relatedRecords } from "./linkage.js";

function Cell({ field, value, now }) {
  const color = field.colors?.[value];
  if (color) return <i className="bi-tag" style={{ "--bi-tag": color }}>{value}</i>;
  return formatCell(value, field, now);
}

function RelatedList({ items, now }) {
  if (!items.length) return <p className="bi-detail__none">这条记录没有关联的流程、任务或预警。</p>;
  return (
    <ul className="bi-detail__related">
      {items.map(({ dataset, row, relation }) => {
        const status = dataset.fields.find((field) => field.colors && /status/i.test(field.key));
        const title = dataset.fields.find((field) => field.key === dataset.titleField);
        return (
          <li key={`${dataset.id}:${row.id}`}>
            <em>{getModule(dataset.module).label}</em>
            <span className="bi-detail__no">{row.id}</span>
            <b>{dataset.module === "form" ? `《${dataset.name}》${row[dataset.titleField] ?? ""}` : formatCell(row[title.key], title, now)}</b>
            {status ? <Cell field={status} value={row[status.key]} now={now} /> : null}
            <time>{formatDateTime(row[dataset.timeField], "smart-short", now)}</time>
            <small>{relation}</small>
          </li>
        );
      })}
    </ul>
  );
}

export function DetailPanel({ detail, onClose }) {
  const { title, dataset, rows, total, conditions, at } = detail;
  const [expanded, setExpanded] = useState(null);
  const module = getModule(dataset.module);
  // The record number leads every row, so a separate 编号 field would only repeat it.
  const columns = useMemo(() => dataset.fields.filter((field) => field.control !== "自动编号"), [dataset]);
  const related = useMemo(() => new Map(rows.map((row) => [row.id, relatedRecords(dataset, row)])), [dataset, rows]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div className="bi-detail" role="dialog" aria-modal="true" aria-label={`${title}明细`}>
      <button type="button" className="bi-detail__scrim" aria-label="关闭明细" onClick={onClose} />
      <section className="bi-detail__panel">
        <header>
          <div>
            <h2>{title}<span>明细</span></h2>
            <p>
              数据来源：{dataset.module === "form" ? `${dataset.app} › ` : ""}{dataset.name}（{module.label}）· 截至 {formatDateTime(at, "clock")}
            </p>
          </div>
          <button type="button" className="bi-detail__close" onClick={onClose}>关闭</button>
        </header>
        <div className="bi-detail__conditions">
          <span>统计条件</span>
          {conditions.length ? conditions.map((text) => <i key={text}>{text}</i>) : <i>全部记录</i>}
          <b>
            共 {total.toLocaleString("zh-CN")} 条{total > rows.length ? `，显示最近 ${rows.length} 条` : ""}
          </b>
        </div>
        {rows.length ? (
          <div className="bi-detail__scroll">
            <table>
              <thead>
                <tr>
                  <th>编号</th>
                  {columns.map((field) => (
                    <th key={field.key} className={field.type === "number" ? "is-number" : ""}>
                      {field.label}{field.unit ? `（${field.unit}）` : ""}
                    </th>
                  ))}
                  <th>关联记录</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const items = related.get(row.id);
                  const open = expanded === row.id;
                  return (
                    <Fragment key={row.id}>
                      <tr className={open ? "is-open" : ""} onClick={() => setExpanded(open ? null : row.id)}>
                        <td className="bi-detail__no">{row.id}</td>
                        {columns.map((field) => (
                          <td key={field.key} className={field.type === "number" ? "is-number" : field.type === "text" ? "is-text" : ""}>
                            <Cell field={field} value={row[field.key]} now={at} />
                          </td>
                        ))}
                        <td>
                          <button type="button" className="bi-detail__toggle" aria-expanded={open}>
                            {items.length ? `${items.length} 条` : "无"}
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="bi-detail__expand">
                          <td colSpan={columns.length + 2}>
                            <RelatedList items={items} now={at} />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="bi-detail__empty">当前条件下没有记录。</p>
        )}
      </section>
    </div>
  );
}
