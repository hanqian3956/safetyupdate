import { Fragment, useLayoutEffect, useMemo, useState } from "react";
import { getTheme, themeCssVariables } from "../screen/themes.js";
import { WidgetBody } from "../widgets/WidgetBody.jsx";
import { DetailPanel } from "./DetailPanel.jsx";
import { selectionDetail, useRuntime } from "./runtime.jsx";

/**
 * Scale that makes a width × height stage fit inside the referenced element.
 * mode "width" fills the element's width (the element grows as tall as needed);
 * mode "contain" fits both directions, for elements with a fixed height.
 */
export function useFitScale(ref, width, height, padding = 0, mode = "contain") {
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => {
      const availableWidth = element.clientWidth - padding * 2;
      const availableHeight = element.clientHeight - padding * 2;
      if (availableWidth <= 0) return;
      const byWidth = availableWidth / width;
      setScale(mode === "contain" && availableHeight > 0 ? Math.min(byWidth, availableHeight / height) : byWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, width, height, padding, mode]);
  return scale;
}

export function stageStyle(screen) {
  const theme = getTheme(screen.theme);
  const style = { ...themeCssVariables(theme), width: screen.width, height: screen.height };
  if (screen.backgroundColor) style.background = screen.backgroundColor;
  if (screen.backgroundImage) {
    style.backgroundImage = `url("${screen.backgroundImage}")`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }
  return style;
}

// Says what is selected, how many records that is, and offers the records themselves.
function SelectionBar({ screen }) {
  const runtime = useRuntime();
  const { linkage } = runtime;
  const summary = useMemo(
    () => (linkage ? selectionDetail(runtime, screen) : null),
    // The runtime object changes on every refresh; the selection, the filters and the data are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linkage, runtime.globalFilters, runtime.dataKey, screen.widgets],
  );
  if (!summary) return null;
  return (
    <div className="bi-selection" role="status">
      <p>
        已选中
        {linkage.levels.map((level, index) => (
          <Fragment key={`${level.field}:${level.key}`}>
            {index ? <i aria-hidden="true">›</i> : null}
            <b>{level.fieldLabel}：{level.label}</b>
          </Fragment>
        ))}
        <span>
          对应《{summary.dataset.name}》<strong>{summary.total.toLocaleString("zh-CN")}</strong> 条记录，其它组件已按它筛选
        </span>
      </p>
      <button type="button" className="is-primary" onClick={() => runtime.openDetail(summary)}>查看明细</button>
      <button type="button" onClick={runtime.clearLinkage}>取消选中</button>
    </div>
  );
}

function RiskAlertPanel({ alerts }) {
  if (!alerts.length) return null;
  return (
    <aside className="bi-risk-alert" aria-live="polite" aria-label="实时预警信息">
      <header>
        <span><i aria-hidden="true" />实时预警</span>
        <b>{alerts.length} 条待处置</b>
      </header>
      <div>
        {alerts.slice(0, 2).map((alert) => (
          <article key={alert.id}>
            <em className={`is-${alert.level}`}>{alert.level}</em>
            <p>
              <strong title={alert.content}>{alert.content}</strong>
              <span>实测 {alert.actual}，阈值 {alert.threshold}</span>
            </p>
            <time>{alert.time}</time>
          </article>
        ))}
      </div>
    </aside>
  );
}

/** Read-only rendering of a screen at the given scale. Must sit inside <ScreenRuntime>. */
export function ScreenStage({ screen, scale, riskAlerts = [] }) {
  const theme = getTheme(screen.theme);
  const runtime = useRuntime();
  const isSafetyOverview = screen.id === "tpl-safety" || screen.name === "安全风险总览";
  const hasRiskAlerts = isSafetyOverview && riskAlerts.length > 0;
  return (
    // The stage is scaled to fit; the selection bar and the detail panel sit beside it,
    // unscaled, so they stay readable at any size. They share the stage's theme variables.
    <div
      className={theme.dark ? "bi-stage-box is-dark" : "bi-stage-box is-light"}
      style={{ ...themeCssVariables(theme), width: screen.width * scale, height: screen.height * scale }}
    >
      <div
        className={theme.dark ? "bi-stage is-dark" : "bi-stage is-light"}
        style={{ ...stageStyle(screen), transform: `scale(${scale})` }}
      >
        {screen.widgets.map((widget) => {
          const isRightTicker = hasRiskAlerts && widget.type === "ticker" && widget.x >= screen.width * 0.7 && widget.y < 160;
          const style = {
            left: widget.x,
            top: isRightTicker ? widget.y + 136 : widget.y,
            width: widget.w,
            height: isRightTicker ? Math.max(160, widget.h - 136) : widget.h,
          };
          return widget.hidden ? null : (
            <div key={widget.id} className={`bi-item bi-item--${widget.type}`} style={style}>
              <WidgetBody widget={widget} />
            </div>
          );
        })}
        {hasRiskAlerts ? <RiskAlertPanel alerts={riskAlerts} /> : null}
      </div>
      {runtime.interactive ? <SelectionBar screen={screen} /> : null}
      {runtime.detail ? <DetailPanel detail={runtime.detail} onClose={runtime.closeDetail} /> : null}
    </div>
  );
}
