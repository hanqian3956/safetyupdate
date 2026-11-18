// Pure geometry for the canvas: bounding boxes, snapping and alignment.

export const MIN_SIZE = 20;

export function boundsOf(widgets) {
  if (!widgets.length) return null;
  const left = Math.min(...widgets.map((widget) => widget.x));
  const top = Math.min(...widgets.map((widget) => widget.y));
  const right = Math.max(...widgets.map((widget) => widget.x + widget.w));
  const bottom = Math.max(...widgets.map((widget) => widget.y + widget.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Lines a moving box may snap to: the canvas edges and centre, and every other widget's edges and centre. */
export function snapLines(screen, movingIds) {
  const moving = new Set(movingIds);
  const xs = [0, screen.width / 2, screen.width];
  const ys = [0, screen.height / 2, screen.height];
  screen.widgets.forEach((widget) => {
    if (widget.hidden || moving.has(widget.id)) return;
    xs.push(widget.x, widget.x + widget.w / 2, widget.x + widget.w);
    ys.push(widget.y, widget.y + widget.h / 2, widget.y + widget.h);
  });
  return { xs, ys };
}

function nearest(candidates, lines, threshold) {
  let best = null;
  candidates.forEach((candidate) => {
    lines.forEach((line) => {
      const diff = line - candidate;
      if (Math.abs(diff) <= threshold && (!best || Math.abs(diff) < Math.abs(best.diff))) best = { diff, line };
    });
  });
  return best;
}

export function snapMove(box, lines, threshold) {
  const x = nearest([box.x, box.x + box.w / 2, box.x + box.w], lines.xs, threshold);
  const y = nearest([box.y, box.y + box.h / 2, box.y + box.h], lines.ys, threshold);
  return { dx: x ? x.diff : 0, dy: y ? y.diff : 0, guideX: x ? x.line : null, guideY: y ? y.line : null };
}

/** Resizes `start` by dragging `handle` ("n", "se", …) by (dx, dy), snapping the dragged edges. */
export function resizeBox(start, handle, dx, dy, lines, threshold) {
  let left = start.x;
  let top = start.y;
  let right = start.x + start.w;
  let bottom = start.y + start.h;
  let guideX = null;
  let guideY = null;
  if (handle.includes("w")) {
    left = Math.min(left + dx, right - MIN_SIZE);
    const snap = lines && nearest([left], lines.xs, threshold);
    if (snap && right - (left + snap.diff) >= MIN_SIZE) {
      left += snap.diff;
      guideX = snap.line;
    }
  }
  if (handle.includes("e")) {
    right = Math.max(right + dx, left + MIN_SIZE);
    const snap = lines && nearest([right], lines.xs, threshold);
    if (snap && right + snap.diff - left >= MIN_SIZE) {
      right += snap.diff;
      guideX = snap.line;
    }
  }
  if (handle.includes("n")) {
    top = Math.min(top + dy, bottom - MIN_SIZE);
    const snap = lines && nearest([top], lines.ys, threshold);
    if (snap && bottom - (top + snap.diff) >= MIN_SIZE) {
      top += snap.diff;
      guideY = snap.line;
    }
  }
  if (handle.includes("s")) {
    bottom = Math.max(bottom + dy, top + MIN_SIZE);
    const snap = lines && nearest([bottom], lines.ys, threshold);
    if (snap && bottom + snap.diff - top >= MIN_SIZE) {
      bottom += snap.diff;
      guideY = snap.line;
    }
  }
  return {
    box: { x: Math.round(left), y: Math.round(top), w: Math.round(right - left), h: Math.round(bottom - top) },
    guideX,
    guideY,
  };
}

/**
 * Positions for aligning widgets. One widget aligns to the canvas, several align to their
 * shared bounding box. mode: left | hcenter | right | top | vcenter | bottom.
 */
export function alignedPositions(widgets, mode, screen) {
  const frame = widgets.length > 1 ? boundsOf(widgets) : { x: 0, y: 0, w: screen.width, h: screen.height };
  return new Map(
    widgets.map((widget) => {
      const next = { x: widget.x, y: widget.y };
      if (mode === "left") next.x = frame.x;
      if (mode === "hcenter") next.x = frame.x + (frame.w - widget.w) / 2;
      if (mode === "right") next.x = frame.x + frame.w - widget.w;
      if (mode === "top") next.y = frame.y;
      if (mode === "vcenter") next.y = frame.y + (frame.h - widget.h) / 2;
      if (mode === "bottom") next.y = frame.y + frame.h - widget.h;
      return [widget.id, { x: Math.round(next.x), y: Math.round(next.y) }];
    }),
  );
}

/** Evenly spaces three or more widgets between the outermost two. axis: "x" | "y". */
export function distributedPositions(widgets, axis) {
  if (widgets.length < 3) return new Map();
  const size = axis === "x" ? "w" : "h";
  const sorted = [...widgets].sort((left, right) => left[axis] - right[axis]);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const total = sorted.reduce((sum, widget) => sum + widget[size], 0);
  const gap = (last[axis] + last[size] - first[axis] - total) / (sorted.length - 1);
  let cursor = first[axis];
  return new Map(
    sorted.map((widget) => {
      const position = { x: widget.x, y: widget.y, [axis]: Math.round(cursor) };
      cursor += widget[size] + gap;
      return [widget.id, position];
    }),
  );
}
