// "查看数据" dialog: what a dataset contains and the latest records users submitted.

import { useMemo, useState } from "react";
import { FIELD_TYPE_LABEL, getDataset, getModule } from "../data/datasets.js";
import { getRows } from "../data/dataStore.js";
import { formatCell, formatDateTime } from "../query/format.js";
import { Dialog } from "../ui.jsx";

const PAGE_SIZE = 50;

export function DatasetPreview({ datasetId, onClose }) {
  const dataset = getDataset(datasetId);
  const [tab, setTab] = useState("records");
  const rows = useMemo(() => (dataset ? getRows(dataset.id) : []), [dataset]);
  const latest = useMemo(() => rows.slice(-PAGE_SIZE).reverse(), [rows]);
  if (!dataset) return null;
  // The record number leads every row, so a separate 编号 field would only repeat it.
  const columns = dataset.fields.filter((field) => field.control !== "自动编号");
  const module = getModule(dataset.module);
  const now = Date.now();
  const newest = rows.length ? rows[rows.length - 1][dataset.timeField] : null;

  return (
    <Dialog title={dataset.name} subtitle={`${dataset.app} · ${module.label} · ${dataset.description}`} onClose={onClose} width={1040}>
      <div className="bi-dataset-stats">
        <span><b>{rows.length.toLocaleString("zh-CN")}</b>条记录（近 90 天）</span>
        <span><b>{dataset.fields.length}</b>个字段</span>
        <span>最近一条 <b>{newest ? formatDateTime(newest, "smart", now) : "—"}</b></span>
        <em>{module.grain}</em>
      </div>
      <div className="bi-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "records"} className={tab === "records" ? "is-active" : ""} onClick={() => setTab("records")}>
          最新 {Math.min(PAGE_SIZE, rows.length)} 条记录
        </button>
        <button type="button" role="tab" aria-selected={tab === "fields"} className={tab === "fields" ? "is-active" : ""} onClick={() => setTab("fields")}>
          字段说明
        </button>
      </div>
      {tab === "fields" ? (
        <div className="bi-datatable-wrap">
          <table className="bi-datatable">
            <thead>
              <tr>
                <th>字段名称</th>
                <th>在 BI 中的用途</th>
                <th>表单控件</th>
                <th>单位</th>
                <th>可选值</th>
              </tr>
            </thead>
            <tbody>
              {dataset.fields.map((field) => (
                <tr key={field.key}>
                  <td><b>{field.label}</b></td>
                  <td>{FIELD_TYPE_LABEL[field.type]}</td>
                  <td>{field.control}</td>
                  <td>{field.unit || "—"}</td>
                  <td className="bi-datatable__options">{field.options?.join("、") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bi-datatable-wrap">
          <table className="bi-datatable">
            <thead>
              <tr>
                <th>编号</th>
                {columns.map((field) => (
                  <th key={field.key} className={field.type === "number" ? "is-number" : ""}>{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {latest.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  {columns.map((field) => (
                    <td key={field.key} className={field.type === "number" ? "is-number" : ""}>
                      {field.colors?.[row[field.key]] ? (
                        <span className="bi-dot" style={{ "--dot": field.colors[row[field.key]] }}>{row[field.key]}</span>
                      ) : (
                        formatCell(row[field.key], field, now)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Dialog>
  );
}
