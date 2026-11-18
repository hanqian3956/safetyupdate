import { useEffect, useId, useRef, useState } from "react";
import { LEVELS } from "./mine-prevention-data";
import "./mine-risk-zones.css";

const zones = [
  { code: "A01", name: "东翼采区", path: "M529 119 L665 111 735 157 705 241 624 247 585 202 527 186 Z", label: [633, 165] },
  { code: "A02", name: "主井提升区", path: "M306 215 L346 167 421 168 484 195 474 271 422 293 316 277 Z", label: [396, 223] },
  { code: "A03", name: "井下泵房", path: "M523 245 L567 226 614 274 598 324 531 342 499 298 Z", label: [553, 279] },
  { code: "A04", name: "露天采场", path: "M95 120 L199 82 263 105 294 166 260 238 182 255 114 227 77 175 Z", label: [188, 164] },
  { code: "A05", name: "尾矿库", path: "M69 303 L159 279 233 298 241 369 209 407 86 397 57 353 Z", label: [146, 335] },
  { code: "A06", name: "选矿车间", path: "M296 319 L393 318 439 311 474 370 415 412 307 403 278 359 Z", label: [373, 358] },
];
const roads = "M29 428 L242 428 L265 418 Q273 414 272 398 L262 351 L280 304 L285 253 307 199 345 144 426 139 481 163 511 218 558 210 581 195 M280 304 L423 306 487 277 506 229 511 218 M487 277 L513 358 594 349 644 279 644 246 M272 398 L262 356 224 347";

export default function MineRiskZones({ risks, colors, Badge, onOpenRisk }) {
  const mapRef = useRef(null);
  const gridId = useId();
  const [full, setFull] = useState(false);
  const [level, setLevel] = useState("");
  const [area, setArea] = useState("");
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === mapRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const areas = zones.map((zone) => {
    const rows = risks.filter((risk) => risk.area === zone.name);
    const highestIndex = LEVELS.findIndex((name) => rows.some((row) => row.level === name));
    return { ...zone, rows, highest: LEVELS[highestIndex], color: colors[highestIndex] ?? "#788897" };
  });
  const visible = areas.filter((zone) => !level || zone.highest === level);
  const selected = visible.find((zone) => zone.name === area);
  async function toggleFullscreen() {
    try {
      if (full) await document.exitFullscreen();
      else await mapRef.current.requestFullscreen();
    } catch { /* Keep the regular view when fullscreen is not available. */ }
  }
  async function openRisk(row) {
    if (document.fullscreenElement === mapRef.current) {
      try { await document.exitFullscreen(); } catch { return; }
    }
    onOpenRisk(row);
  }

  return <section ref={mapRef} className="mp-panel mp-zones" aria-label="矿区风险分区图">
    <header className="mp-panel-head mp-zones-head">
      <div><h3>矿区风险分区图</h3><small>按区域内最高风险等级着色 · 来源：风险点台账</small></div>
      <button type="button" onClick={toggleFullscreen}>{full ? "退出全屏" : "全屏展示"}</button>
    </header>
    <div className="mp-zone-filters" role="group" aria-label="筛选区域风险等级">
      {["", ...LEVELS].map((value, index) => (
        <button type="button" key={value} aria-pressed={level === value} onClick={() => { setLevel(value); setArea(""); }}>
          {value && <i style={{ backgroundColor: colors[index - 1] }} />}{value || "全部区域"}
          <span>{value ? areas.filter((zone) => zone.highest === value).length : areas.length}</span>
        </button>
      ))}
    </div>
    <div className="mp-zone-body">
      <figure className="mp-zone-plan">
        <svg viewBox="0 0 800 460" aria-label="矿区总平面示意图，选择区域查看台账">
          <defs>
            <pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="#dee6eb" strokeWidth=".7" />
            </pattern>
          </defs>
          <rect width="800" height="460" fill={`url(#${gridId})`} />
          <path d="M49 151 L91 95 232 49 363 69 445 113 594 86 706 82 763 152 758 259 695 326 640 389 530 424 430 439 286 430 201 422 57 417 29 353 41 278 Z" fill="#fff" fillOpacity=".52" stroke="#9eacb7" strokeWidth="1.4" strokeDasharray="6 5" />
          <g fill="none" stroke="#dce5e9" strokeWidth="1.2" aria-hidden="true">
            <path d="M0 141 C54 94 117 91 144 61 S219 20 303 25 M0 124 C65 68 118 71 148 42 S219 5 271 7 M14 98 C66 46 100 51 141 20 M513 68 C602 27 668 65 706 38 S748 18 800 10 M484 55 C582 8 642 40 689 22 S745 4 783 0 M632 414 C709 412 720 355 800 343 M648 430 C728 429 753 369 800 363 M668 444 C742 447 768 392 800 387" />
          </g>
          <path d={roads} fill="none" stroke="#d4dfe6" strokeWidth="13" strokeLinejoin="round" strokeLinecap="round" />
          <path d={roads} fill="none" stroke="#fff" strokeWidth="1.4" strokeDasharray="5 5" />
          {areas.map((zone) => {
            const matches = !level || zone.highest === level;
            const [x, y] = zone.label;
            return <g key={zone.code} role="button" tabIndex={matches ? 0 : -1} aria-disabled={!matches}
              aria-label={`${zone.name}，${zone.highest || "未定级"}，${zone.rows.length} 个风险点`}
              aria-pressed={selected?.code === zone.code} className="mp-zone-shape" style={{ "--zone-color": zone.color }}
              onClick={() => { if (matches) setArea(zone.name); }}
              onKeyDown={(event) => {
                if (matches && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setArea(zone.name); }
              }}>
              <path d={zone.path} className="mp-zone-boundary" />
              <text x={x} y={y - 19} className="mp-zone-code">{zone.code}</text>
              <text x={x} y={y + 3} className="mp-zone-name">{zone.name}</text>
              <text x={x} y={y + 23} className="mp-zone-count">{zone.highest || "未定级"} / {zone.rows.length} 个风险点</text>
            </g>;
          })}
          <g transform="translate(753 49)" textAnchor="middle" fill="#556b7d" aria-hidden="true">
            <text y="-10" fontSize="13">北</text><path d="M0 0 L-7 20 0 15 7 20 Z" />
          </g>
          <text x="36" y="444" fill="#52687b" fontSize="12">矿区入口</text>
        </svg>
        <figcaption><span>矿区总平面 · 示意底图</span><span>非测绘图，不作为现场作业依据</span></figcaption>
      </figure>
      <aside className="mp-zone-inspector" aria-label="区域风险信息">
        <header><h3>{selected?.name || "区域风险一览"}</h3>
          {selected ? <button type="button" className="mp-link" onClick={() => setArea("")}>返回区域列表</button> : <small>{visible.length} 个区域</small>}
        </header>
        {selected ? <>
          <div className="mp-zone-inspector-meta">{selected.highest ? <Badge value={selected.highest} /> : "未定级"}<small>{selected.rows.length} 个风险点</small></div>
          <ul className="mp-zone-list">{[...selected.rows].sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level)).map((row) => (
            <li key={row.id}><button type="button" onClick={() => openRisk(row)}><div><b>{row.name}</b><small>{row.id} · 责任人：{row.owner || "未指定"}</small></div><Badge value={row.level} /></button></li>
          ))}</ul>
          {!selected.rows.length && <p>该区域暂无风险点。</p>}
        </> : <>
          <ul className="mp-zone-list">{visible.map((zone) => (
            <li key={zone.code}><button type="button" onClick={() => setArea(zone.name)}>
              <div><b>{zone.name}</b><small>{zone.code} · {zone.rows.length} 个风险点</small></div>
              {zone.highest ? <Badge value={zone.highest} /> : <small>未定级</small>}
            </button></li>
          ))}</ul>
          {!visible.length && <p>暂无该等级的区域。</p>}
        </>}
      </aside>
    </div>
  </section>;
}
