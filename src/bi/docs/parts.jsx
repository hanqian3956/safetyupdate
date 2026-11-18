// 设计说明里用到的几种排版块。

import { Fragment } from "react";

export function H({ children }) {
  return <h4>{children}</h4>;
}

export function Sub({ children }) {
  return <h5>{children}</h5>;
}

export function Tip({ children }) {
  return <p className="bi-doc__tip">{children}</p>;
}

/** rows: [[名称, 内容], …] */
export function KV({ rows }) {
  return (
    <dl className="bi-doc__kv">
      {rows.map(([name, value]) => (
        <Fragment key={name}>
          <dt>{name}</dt>
          <dd>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** head: 列名数组；rows: 二维数组，第一列是行名。 */
export function Table({ head, rows }) {
  return (
    <table className="bi-doc__table">
      <thead>
        <tr>
          {head.map((cell) => (
            <th key={cell}>{cell}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, position) => (
              <td key={position}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function List({ items, ordered = false }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </Tag>
  );
}
