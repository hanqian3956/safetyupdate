/*!
 * MineSpace - 矿山 / 煤矿 参数化立体线框组件库
 * 每个组件: { type, name, cat, w, d, h, zone, layer, tint, build(b, p) }
 *   局部坐标: 占地 0..w (x) × 0..d (y)，z 为高度；旋转与平移由引擎处理
 */
(function () {
  'use strict';
  var MS = window.MineSpace;
  var Bp = MS.iso.Builder.prototype;
  var PI = Math.PI;

  /* ---------- 扩展几何辅助 ---------- */
  function ext(o, extra) {
    var r = {}, k;
    for (k in o || {}) r[k] = o[k];
    for (k in extra || {}) r[k] = extra[k];
    return r;
  }
  // 圆柱表面环线（分段带法向，背面自动虚线）
  Bp.ringLine = function (cx, cy, z, r, o, n) {
    n = n || 14;
    var pts = this.ringPts(cx, cy, z, r, r, n);
    for (var i = 0; i < n; i++) {
      var a = pts[i], c = pts[(i + 1) % n];
      var mx = (a[0] + c[0]) / 2 - cx, my = (a[1] + c[1]) / 2 - cy, l = Math.hypot(mx, my) || 1;
      this.line([a, c], ext(o, { n: [mx / l, my / l, 0] }));
    }
    return this;
  };
  // 卧式圆柱（轴沿 X）
  Bp.cylX = function (x0, x1, cy, cz, r, o, n) {
    var prof = [];
    n = n || 12;
    for (var i = 0; i < n; i++) {
      var t = (i / n) * PI * 2;
      prof.push([cy + Math.cos(t) * r, cz + Math.sin(t) * r]);
    }
    return this.extrudeX(prof, x0, x1, o);
  };
  // 卧式圆柱（轴沿 Y）
  Bp.cylY = function (y0, y1, cx, cz, r, o, n) {
    var prof = [];
    n = n || 12;
    for (var i = 0; i < n; i++) {
      var t = (i / n) * PI * 2;
      prof.push([cx + Math.cos(t) * r, cz + Math.sin(t) * r]);
    }
    return this.extrudeY(prof, y0, y1, o);
  };
  // XZ 平面圆环（天轮）
  Bp.wheelXZ = function (cx, cy, cz, r, o, spokes) {
    var pts = [], n = 16, i;
    for (i = 0; i < n; i++) {
      var t = (i / n) * PI * 2;
      pts.push([cx + Math.cos(t) * r, cy, cz + Math.sin(t) * r]);
    }
    this.line(pts, ext(o, { close: true }));
    for (i = 0; i < (spokes || 0); i++) {
      var a = (i / spokes) * PI;
      this.line([[cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r], [cx - Math.cos(a) * r, cy, cz - Math.sin(a) * r]], ext(o, { thin: true }));
    }
    return this;
  };
  // YZ 平面车轮（侧面法向 nx）
  Bp.wheelYZ = function (cx, cy, cz, r, nx, o) {
    var pts = [];
    for (var i = 0; i < 12; i++) {
      var t = (i / 12) * PI * 2;
      pts.push([cx, cy + Math.cos(t) * r, cz + Math.sin(t) * r]);
    }
    return this.line(pts, ext(o, { close: true, n: [nx, 0, 0] }));
  };
  // 矩形围栏
  Bp.fenceRect = function (x, y, w, d, h, step, o) {
    var pts = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]], i, k;
    for (i = 0; i < 4; i++) {
      var a = pts[i], c = pts[(i + 1) % 4];
      var L = Math.hypot(c[0] - a[0], c[1] - a[1]), n = Math.max(1, Math.round(L / step));
      for (k = 0; k < n; k++) {
        var t = k / n;
        this.pole(a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, 0, h, ext(o, { thin: true }));
      }
      this.line([[a[0], a[1], h], [c[0], c[1], h]], ext(o, { thin: true }));
      this.line([[a[0], a[1], h * 0.45], [c[0], c[1], h * 0.45]], ext(o, { thin: true }));
    }
    return this;
  };
  Bp.car = function (x, y, rotY, o) {
    if (rotY) {
      this.box(x, y, 0, 2, 1, 0.55, o);
      this.box(x + 0.45, y + 0.1, 0.55, 1, 0.8, 0.4, o);
    } else {
      this.box(x, y, 0, 1, 2, 0.55, o);
      this.box(x + 0.1, y + 0.45, 0.55, 0.8, 1, 0.4, o);
    }
    return this;
  };
  // 带放射坡面纹理的圆锥料堆/煤堆（贴合参考图“堆存区”样式）
  Bp.mound = function (cx, cy, r, h, o) {
    var n = 14, bot = [], top = [], i;
    var J = [1, 0.94, 1.03, 0.96, 1, 0.93, 1.02, 0.95, 1, 0.96, 1.02, 0.94, 0.99, 0.96];
    for (i = 0; i < n; i++) {
      var a = (i / n) * PI * 2, j = J[i % J.length];
      bot.push([cx + Math.cos(a) * r * j, cy + Math.sin(a) * r * j, 0]);
      top.push([cx + Math.cos(a) * r * 0.08, cy + Math.sin(a) * r * 0.08, h]);
    }
    this.loft(bot, top, ext({ cls: 'coal', noHidden: true }, o));
    for (i = 0; i < n; i++) {
      var b0 = bot[i], t0 = top[i], mx = b0[0] - cx, my = b0[1] - cy, l = Math.hypot(mx, my) || 1;
      var m1 = [cx + (b0[0] - cx) * 0.55, cy + (b0[1] - cy) * 0.55, h * 0.45];
      this.line([t0, m1, b0], { n: [mx / l, my / l, 0.35], thin: true });
    }
    return this;
  };

  var shapes = [];
  function def(s) { shapes.push(s); }

  /* =====================================================================
   *  一、煤矿生产区
   * ===================================================================== */
  def({
    type: 'headframe', name: '主井井架', cat: 'coal', w: 9, d: 8, h: 15, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      // 左侧副井房与后侧绞车房
      b.box(0.2, 0.6, 0, w * 0.36, d * 0.48, h * 0.28);
      b.floors(0.2, 0.6, 0, w * 0.36, d * 0.48, h * 0.28, 2);
      b.mullions(0.2, 0.6, 0, w * 0.36, d * 0.48, h * 0.28, 1.1);
      b.box(w * 0.54, 0.5, 0, w * 0.42, d * 0.44, h * 0.26);
      b.gable(w * 0.54, 0.5, h * 0.26, w * 0.42, d * 0.44, h * 0.07);
      b.mullions(w * 0.54, 0.5, 0, w * 0.42, d * 0.44, h * 0.26, 1.1);
      // 井口基座
      var tx = w * 0.22, ty = d * 0.36, tw = w * 0.42, td = d * 0.46;
      b.box(tx + 0.4, ty + 0.4, 0, tw - 0.8, td - 0.8, h * 0.18);
      // 主井架四柱锥台 + 桁架交叉斜撑
      var bot = b.rect(tx, ty, 0, tw, td);
      var topH = h * 0.82;
      var top = b.rect(tx + tw * 0.24, ty + td * 0.24, topH, tw * 0.52, td * 0.52);
      b.loft(bot, top, { cls: 'ghost', noHidden: true });
      for (var c = 0; c < 4; c++) b.line([bot[c], top[c]], { w: 1.6 });
      b.braces(bot, top, 5, {});
      // 斜撑A字腿（向右侧绞车房方向斜撑，贴合参考图“一号井”）
      var sTop1 = [top[1][0], top[1][1], topH * 0.92], sTop2 = [top[2][0], top[2][1], topH * 0.92];
      var sBot1 = [w * 0.88, ty + td * 0.18, 0], sBot2 = [w * 0.88, ty + td * 0.82, 0];
      b.line([sTop1, sBot1], { w: 1.6, top: true });
      b.line([sTop2, sBot2], { w: 1.6, top: true });
      for (var k = 1; k <= 4; k++) {
        var t0 = (k - 1) / 4, t1 = k / 4;
        var a0 = [sTop1[0] + (sBot1[0] - sTop1[0]) * t0, sTop1[1] + (sBot1[1] - sTop1[1]) * t0, sTop1[2] * (1 - t0)];
        var b0 = [sTop2[0] + (sBot2[0] - sTop2[0]) * t0, sTop2[1] + (sBot2[1] - sTop2[1]) * t0, sTop2[2] * (1 - t0)];
        var a1 = [sTop1[0] + (sBot1[0] - sTop1[0]) * t1, sTop1[1] + (sBot1[1] - sTop1[1]) * t1, sTop1[2] * (1 - t1)];
        var b1 = [sTop2[0] + (sBot2[0] - sTop2[0]) * t1, sTop2[1] + (sBot2[1] - sTop2[1]) * t1, sTop2[2] * (1 - t1)];
        b.line([a1, b1], { top: true, thin: true });
        b.line([a0, b1], { top: true, thin: true });
        b.line([b0, a1], { top: true, thin: true });
      }
      // 天轮平台与天轮
      var px = tx + tw * 0.16, py = ty + td * 0.16, pw = tw * 0.68, pd = td * 0.68;
      b.box(px, py, topH, pw, pd, 0.45);
      b.fenceRect(px, py, pw, pd, 0.8, 0.9, {});
      var r = Math.min(1.15, tw * 0.24), cz = topH + 0.45 + r, cx = tx + tw / 2;
      [ty + td * 0.42, ty + td * 0.58].forEach(function (cy) {
        b.wheelXZ(cx, cy, cz, r, { top: true }, 4);
      });
      // 顶部龙门架
      b.box(px + 0.2, py + 0.2, topH + 0.45 + r * 2, pw - 0.4, pd - 0.4, 0.35);
      b.pole(px + 0.3, py + 0.3, topH + 0.45, topH + 0.45 + r * 2, {});
      b.pole(px + pw - 0.3, py + 0.3, topH + 0.45, topH + 0.45 + r * 2, {});
      b.pole(px + pw - 0.3, py + pd - 0.3, topH + 0.45, topH + 0.45 + r * 2, {});
      b.pole(px + 0.3, py + pd - 0.3, topH + 0.45, topH + 0.45 + r * 2, {});
    }
  });

  def({
    type: 'inclineShaft', name: '斜井井口', cat: 'coal', w: 5, d: 7, h: 3.5, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, gw = w * 0.56, gx = (w - gw) / 2, wh = h * 0.5, y1 = d * 0.62, i;
      var prof = [[gx, 0], [gx + gw, 0]];
      for (i = 0; i <= 8; i++) {
        var t = (i / 8) * PI;
        prof.push([gx + gw / 2 + Math.cos(t) * gw / 2, wh + Math.sin(t) * (h - wh)]);
      }
      b.extrudeY(prof, 0, y1);
      b.box(0, y1 - 0.6, 0, gx, 0.6, wh * 0.9);
      b.box(gx + gw, y1 - 0.6, 0, w - gx - gw, 0.6, wh * 0.9);
      var m = [], ins = 0.35;
      m.push([gx + ins, y1, 0]);
      for (i = 8; i >= 0; i--) {
        var t2 = (i / 8) * PI;
        m.push([gx + gw / 2 + Math.cos(t2) * (gw / 2 - ins), y1, wh + Math.sin(t2) * (h - wh - ins)]);
      }
      m.push([gx + gw - ins, y1, 0]);
      m = [m[0]].concat(m.slice(1).reverse());
      b.line(m, { close: true, cls: 'mouth', n: [0, 1, 0] });
      b.flat(b.rect(gx, y1, 0, gw, d - y1), { dash: true });
      [0.36, 0.64].forEach(function (k) {
        b.line([[gx + gw * k, 0.2, 0], [gx + gw * k, d, 0]], { thin: true });
      });
      for (var yy = y1 + 0.4; yy < d; yy += 0.7) b.line([[gx + gw * 0.28, yy, 0], [gx + gw * 0.72, yy, 0]], { thin: true });
    }
  });

  def({
    type: 'coalYard', name: '堆存区/储煤场', cat: 'coal', w: 14, d: 10, h: 4.5, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      // L型挡煤墙与分隔隔墙（贴合参考图“堆存区”）
      b.box(0.4, 0.4, 0, w * 0.72, 0.35, 1.3);
      b.box(0.4, 0.75, 0, 0.35, d * 0.78, 1.3);
      b.box(w * 0.44, 0.75, 0, 0.32, d * 0.72, 1.2);
      b.box(w * 0.88, d * 0.45, 0, 0.35, d * 0.48, 1.2);
      // 三座带放射坡面纹理的圆锥煤堆
      b.mound(w * 0.24, d * 0.48, Math.min(w, d) * 0.24, h * 0.82);
      b.mound(w * 0.63, d * 0.34, Math.min(w, d) * 0.26, h);
      b.mound(w * 0.67, d * 0.68, Math.min(w, d) * 0.22, h * 0.78);
      // 右侧桁架落煤栈桥与支腿塔架
      var tx = w - 2.2, ty = 0.8, tw = 1.6, td = 1.6, th = h + 1.8;
      var bot = b.rect(tx, ty, 0, tw, td), top = b.rect(tx + 0.15, ty + 0.15, th, tw - 0.3, td - 0.3);
      b.loft(bot, top, { cls: 'ghost', noHidden: true });
      for (var c = 0; c < 4; c++) b.line([bot[c], top[c]], {});
      b.braces(bot, top, 3, {});
      b.box(tx, ty, th, tw, td, 0.4);
      // 斜向桁架廊道伸向煤堆上方
      var x0 = w * 0.56, y0 = d * 0.42, z0 = h * 0.72, x1 = tx + 0.2, y1 = ty + td / 2, z1 = th + 0.2;
      var gBot = [[x0, y0 - 0.4, z0], [x1, y1 - 0.4, z1], [x1, y1 + 0.4, z1], [x0, y0 + 0.4, z0]];
      var gTop = gBot.map(function (q) { return [q[0], q[1], q[2] + 0.75]; });
      b.loft(gBot, gTop);
      for (var k = 0; k < 5; k++) {
        var t0 = k / 5, t1 = (k + 1) / 5;
        var p0 = [x0 + (x1 - x0) * t0, y0 + 0.4 + (y1 - y0) * t0, z0 + (z1 - z0) * t0];
        var p1 = [x0 + (x1 - x0) * t1, y0 + 0.4 + (y1 - y0) * t1, z0 + (z1 - z0) * t1];
        b.line([[p0[0], p0[1], p0[2]], [p1[0], p1[1], p1[2] + 0.75]], { top: true, thin: true });
        b.line([[p0[0], p0[1], p0[2] + 0.75], [p1[0], p1[1], p1[2]]], { top: true, thin: true });
      }
    }
  });

  def({
    type: 'coalPile', name: '散料/原煤堆', cat: 'coal', w: 5, d: 5, h: 3.4, zone: false,
    build: function (b, p) {
      b.mound(p.w / 2, p.d / 2, Math.min(p.w, p.d) * 0.46, p.h);
    }
  });

  def({
    type: 'coalShed', name: '封闭储煤棚', cat: 'coal', w: 12, d: 7, h: 5, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, n = 10, prof = [], i;
      for (i = 0; i <= n; i++) {
        var t = (i / n) * PI;
        prof.push([d / 2 + Math.cos(t) * d / 2, Math.sin(t) * h]);
      }
      b.extrudeX(prof, 0, w);
      var ribs = Math.max(3, Math.round(w / 2));
      for (var k = 1; k < ribs; k++) {
        var x = (w * k) / ribs;
        for (i = 0; i < n; i++) {
          var a = prof[i], c = prof[i + 1], my = (a[0] + c[0]) / 2 - d / 2, mz = (a[1] + c[1]) / 2, l = Math.hypot(my, mz) || 1;
          b.line([[x, a[0], a[1]], [x, c[0], c[1]]], { n: [0, my / l, mz / l], thin: true });
        }
      }
      b.line([[w, d * 0.32, 0], [w, d * 0.32, h * 0.55], [w, d * 0.68, h * 0.55], [w, d * 0.68, 0]], { n: [1, 0, 0] });
      b.line([[0, d * 0.32, 0], [0, d * 0.32, h * 0.55], [0, d * 0.68, h * 0.55], [0, d * 0.68, 0]], { n: [-1, 0, 0] });
    }
  });

  def({
    type: 'silo', name: '原煤/精煤筒仓', cat: 'coal', w: 9, d: 3, h: 10, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, cnt = Math.max(1, Math.round(w / d)), step = w / cnt;
      var r = Math.min(d, step) * 0.45, legH = Math.min(2.8, h * 0.28);
      for (var i = 0; i < cnt; i++) {
        var cx = (i + 0.5) * step, cy = d / 2, q = r * 0.7;
        [[-q, -q], [q, -q], [q, q], [-q, q]].forEach(function (o) { b.pole(cx + o[0], cy + o[1], 0, legH, { thin: true }); });
      }
      for (i = 0; i < cnt; i++) {
        var x = (i + 0.5) * step, y = d / 2;
        b.cone(x, y, legH * 0.55, r * 0.25, r, legH * 0.45);
        b.cyl(x, y, legH, r, h - legH - 0.8);
        b.ringLine(x, y, legH + (h - legH) * 0.33, r, { thin: true });
        b.ringLine(x, y, legH + (h - legH) * 0.66, r, { thin: true });
        b.cone(x, y, h - 0.8, r, r * 0.25, 0.8);
      }
      if (cnt > 1) b.box(step * 0.5, d / 2 - 0.35, h - 0.35, w - step, 0.7, 0.8);
    }
  });

  def({
    type: 'washPlant', name: '选煤厂/洗煤厂', cat: 'coal', w: 10, d: 7, h: 9, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, mw = w * 0.55;
      b.box(0, 0, 0, mw, d, h);
      b.floors(0, 0, 0, mw, d, h, Math.max(2, Math.round(h / 2.2)));
      b.mullions(0, 0, 0, mw, d, h, 1.2);
      b.box(mw, 0, 0, w - mw, d * 0.7, h * 0.55);
      b.floors(mw, 0, 0, w - mw, d * 0.7, h * 0.55, 2);
      b.mullions(mw, 0, 0, w - mw, d * 0.7, h * 0.55, 1.5);
      b.box(mw * 0.3, d * 0.3, h, mw * 0.4, d * 0.4, 1.2);
      b.box(mw + 0.3, d * 0.72, 0, 1.4, d * 0.28, h * 0.7);
    }
  });

  def({
    type: 'loading', name: '装车站', cat: 'coal', w: 4, d: 10, h: 9, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, lh = h * 0.45, ty = d * 0.35, td = d * 0.3;
      [0.36, 0.64].forEach(function (k) { b.line([[w * k, 0, 0], [w * k, d, 0]], { thin: true }); });
      for (var yy = 0.3; yy < d; yy += 0.8) b.line([[w * 0.28, yy, 0], [w * 0.72, yy, 0]], { thin: true });
      [[0.4, ty], [w - 0.4, ty], [w - 0.4, ty + td], [0.4, ty + td]].forEach(function (c) { b.pole(c[0], c[1], 0, lh, {}); });
      b.box(w * 0.3, 0.4, 0, w * 0.4, 2.4, 1.2, { cls: 'coal' });
      b.cone(w / 2, ty + td / 2, lh - 1.6, 0.25, 0.7, 1.6);
      b.box(0.4, ty, lh, w - 0.8, td, h - lh);
      b.floors(0.4, ty, lh, w - 0.8, td, h - lh, 2);
      b.mullions(0.4, ty, lh, w - 0.8, td, h - lh, 1);
      b.box(w * 0.3, d - 2.8, 0, w * 0.4, 2.4, 1.2, { cls: 'coal' });
    }
  });

  def({
    type: 'dump', name: '排土场', cat: 'coal', w: 12, d: 10, h: 6, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, tiers = 3, th = h / tiers;
      for (var k = 0; k < tiers; k++) {
        var ix = k * Math.min(w, d) * 0.14, z = k * th, sl = Math.min(w, d) * 0.05;
        b.frustum(ix, ix, z, w - 2 * ix, d - 2 * ix, th, sl);
        var x0 = ix + sl + 0.35, y0 = ix + sl + 0.35, x1 = w - x0, y1 = d - y0, zt = z + th;
        b.line([[x0, y0, zt], [x1, y0, zt], [x1, y1, zt], [x0, y1, zt]], { close: true, dash: true, thin: true, cls: 'berm' });
      }
      b.line([[w * 0.75, d, 0], [w * 0.85, d - Math.min(w, d) * 0.14, th]], { top: true, cls: 'berm', dash: true });
    }
  });

  def({
    type: 'gangue', name: '矸石山', cat: 'coal', w: 8, d: 8, h: 7, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, n = 9, cx = w / 2, cy = d / 2, bot = [], top = [];
      var J = [1, 0.86, 0.95, 0.8, 1, 0.9, 0.84, 0.97, 0.88];
      for (var i = 0; i < n; i++) {
        var t = (i / n) * PI * 2, j = J[i];
        bot.push([cx + Math.cos(t) * (w / 2) * j, cy + Math.sin(t) * (d / 2) * j, 0]);
        top.push([cx + Math.cos(t) * w * 0.09 * j, cy + Math.sin(t) * d * 0.09 * j, h]);
      }
      b.loft(bot, top, { cls: 'coal' });
      b.line([[cx + w * 0.42, cy + d * 0.18, 0], [cx + w * 0.07, cy + d * 0.03, h]], { top: true, thin: true });
      b.line([[cx + w * 0.42, cy + d * 0.08, 0], [cx + w * 0.07, cy - d * 0.04, h]], { top: true, thin: true });
    }
  });

  def({
    type: 'boiler', name: '锅炉房/烟囱', cat: 'coal', w: 6, d: 5, h: 15, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, bh = Math.min(5, h * 0.35), r = Math.min(w, d) * 0.15;
      b.box(0, 0, 0, w * 0.65, d, bh);
      b.gable(0, 0, bh, w * 0.65, d, 1.2);
      b.mullions(0, 0, 0, w * 0.65, d, bh, 1.4);
      b.cone(w * 0.83, d / 2, 0, r * 1.5, r, h);
      b.ringLine(w * 0.83, d / 2, h * 0.85, r * 1.08, { thin: true, cls: 'warnln' });
      b.ringLine(w * 0.83, d / 2, h * 0.92, r * 1.04, { thin: true, cls: 'warnln' });
    }
  });

  /* =====================================================================
   *  二、安全与机电设施
   * ===================================================================== */
  def({
    type: 'gasPump', name: '瓦斯抽采泵站', cat: 'safety', w: 8, d: 6, h: 4, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, bw = w * 0.5, r = Math.min(0.9, d * 0.15);
      b.box(0, 0, 0, bw, d, h);
      b.mullions(0, 0, 0, bw, d, h, 1.2);
      [d * 0.28, d * 0.72].forEach(function (cy) {
        b.box(bw + 0.6, cy - 0.4, 0, 0.3, 0.8, 0.5);
        b.box(w - 0.9, cy - 0.4, 0, 0.3, 0.8, 0.5);
        b.cylX(bw + 0.4, w - 0.4, cy, 0.5 + r, r);
        b.line([[bw, cy, h * 0.7], [bw + 0.4, cy, h * 0.7], [bw + 0.4, cy, 0.5 + r]], { top: true });
      });
      b.cyl(bw * 0.25, d * 0.25, h, 0.25, 3.2);
      b.cone(bw * 0.25, d * 0.25, h + 3.2, 0.4, 0.4, 0.3, { cls: 'warn' });
    }
  });

  def({
    type: 'fanHouse', name: '主通风机房', cat: 'safety', w: 8, d: 6, h: 3.5, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, bw = w * 0.45, r = Math.min(0.85, d * 0.14);
      b.box(0, 0, 0, bw, d, h);
      b.mullions(0, 0, 0, bw, d, h, 1.2);
      [d * 0.27, d * 0.73].forEach(function (cy) {
        var x0 = bw, x1 = w * 0.72;
        b.cylX(x0, x1, cy, r + 0.15, r);
        b.loft(b.rect(x1, cy - 0.9, 0, 1.5, 1.8), b.rect(x1 + 0.4, cy - 1.15, h + 2.6, 1.9, 2.3));
      });
    }
  });

  def({
    type: 'explosive', name: '火工品仓库/炸药库', cat: 'safety', w: 9, d: 6, h: 3.6, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, bw = w * 0.78, bd = d * 0.72, wh = h * 0.68, rh = h * 0.32;
      // 双坡仓库主体（贴合参考图“火工品仓库”）
      b.box(0.4, 0.4, 0, bw, bd, wh);
      b.gable(0.4, 0.4, wh, bw, bd, rh);
      b.mullions(0.4, 0.4, 0, bw, bd, wh, 1.5);
      // 屋面瓦楞线
      for (var k = 1; k < 5; k++) {
        var rx = 0.4 + (bw * k) / 5;
        b.line([[rx, 0.4 + bd, wh], [rx, 0.4 + bd / 2, wh + rh]], { top: true, thin: true });
        b.line([[rx, 0.4, wh], [rx, 0.4 + bd / 2, wh + rh]], { top: true, thin: true });
      }
      // 侧山墙卷帘大门
      b.line([[0.4 + bw, 0.4 + bd * 0.3, 0], [0.4 + bw, 0.4 + bd * 0.3, wh * 0.78], [0.4 + bw, 0.4 + bd * 0.7, wh * 0.78], [0.4 + bw, 0.4 + bd * 0.7, 0]], { n: [1, 0, 0] });
      // 附属值班小配电箱体
      b.box(0.4 + bw + 0.5, 0.4 + bd * 0.55, 0, w - bw - 1.1, bd * 0.38, wh * 0.52);
    }
  });

  def({
    type: 'substation', name: '变电所', cat: 'safety', w: 8, d: 7, h: 3, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      b.fenceRect(0, 0, w, d, 1.3, 1.2, {});
      b.box(0.6, 0.6, 0, w * 0.4, d * 0.42, h);
      b.mullions(0.6, 0.6, 0, w * 0.4, d * 0.42, h, 1);
      [[w * 0.56, d * 0.55], [w * 0.56, d * 0.2]].forEach(function (c) {
        b.box(c[0], c[1], 0, 1.6, 1.4, 1.4);
        b.cylX(c[0] + 0.2, c[0] + 1.4, c[1] + 0.7, 1.75, 0.25, {}, 8);
      });
      var gx = w * 0.88;
      b.pole(gx, 0.5, 0, h + 2, {});
      b.pole(gx, d - 0.5, 0, h + 2, {});
      b.line([[gx, 0.5, h + 1.6], [gx, d - 0.5, h + 1.6]], {});
      [0.25, 0.5, 0.75].forEach(function (k) {
        var y = 0.5 + (d - 1) * k;
        b.line([[gx, y, h + 1.6], [gx, y, h + 1.1]], { thin: true });
        b.line([[gx, y, h + 1.1], [w * 0.62, d * 0.62, 1.4]], { thin: true, dash: true });
      });
    }
  });

  def({
    type: 'waterPlant', name: '矿井水处理站', cat: 'safety', w: 10, d: 7, h: 1.6, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, r = Math.min(w * 0.22, d * 0.3);
      b.box(w * 0.55, d * 0.08, 0, w * 0.42, d * 0.45, h * 0.7);
      for (var k = 1; k < 4; k++) b.line([[w * 0.55 + (w * 0.42 * k) / 4, d * 0.08, h * 0.7], [w * 0.55 + (w * 0.42 * k) / 4, d * 0.53, h * 0.7]], { thin: true });
      b.box(w * 0.62, d * 0.62, 0, w * 0.3, d * 0.32, h * 2);
      b.mullions(w * 0.62, d * 0.62, 0, w * 0.3, d * 0.32, h * 2, 1);
      [[r + 0.3, d * 0.3], [r + 0.3, d - r - 0.3]].forEach(function (c) {
        b.cyl(c[0], c[1], 0, r * 0.95, h, {}, 18);
        b.ringLine(c[0], c[1], h, r * 0.7, { thin: true, dash: true, top: true }, 18);
        b.line([[c[0] - r * 0.9, c[1], h + 0.15], [c[0] + r * 0.9, c[1], h + 0.15]], { top: true });
      });
    }
  });

  def({
    type: 'dispatch', name: '调度指挥中心', cat: 'safety', w: 7, d: 6, h: 7, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, ph = h * 0.4;
      b.box(0, 0, 0, w, d, ph);
      b.floors(0, 0, 0, w, d, ph, 2);
      b.mullions(0, 0, 0, w, d, ph, 1.4);
      var tx = w * 0.12, ty = d * 0.12, tw = w * 0.5, td = d * 0.55, th = h - ph;
      b.box(tx, ty, ph, tw, td, th);
      b.floors(tx, ty, ph, tw, td, th, Math.max(2, Math.round(th / 1.5)));
      b.mullions(tx, ty, ph, tw, td, th, 0.9);
      var ax = tx + tw / 2, ay = ty + td / 2;
      b.pole(ax, ay, h, h + 3.2, { top: true });
      [0.8, 1.6, 2.4].forEach(function (z, i) {
        var s = 0.6 - i * 0.15;
        b.line([[ax - s, ay, h + z], [ax + s, ay, h + z]], { top: true, thin: true });
      });
      b.cone(w * 0.8, d * 0.72, ph, 0.8, 0.15, 1.1, {}, 10);
    }
  });

  def({
    type: 'rescue', name: '救护队/消防站', cat: 'safety', w: 8, d: 6, h: 4, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      b.box(0, 0, 0, w, d, h);
      b.floors(0, 0, 0, w, d, h, 2);
      for (var i = 0; i < 3; i++) {
        var x0 = w * 0.08 + i * w * 0.3;
        b.line([[x0, d, 0], [x0, d, h * 0.42], [x0 + w * 0.24, d, h * 0.42], [x0 + w * 0.24, d, 0]], { n: [0, 1, 0], cls: 'warnln' });
      }
      b.box(w * 0.7, d * 0.2, h, 1.2, 1.2, 3.2);
      b.mullions(w * 0.7, d * 0.2, h, 1.2, 1.2, 3.2, 0.6);
    }
  });

  /* =====================================================================
   *  三、通用建筑与卡口
   * ===================================================================== */
  def({
    type: 'office', name: '办公楼', cat: 'build', w: 10, d: 6, h: 6.5, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, bd = Math.max(2, d - 1.2);
      // 主楼体 + 屋顶女儿墙线 + 4层窗格（贴合参考图“办公楼”）
      b.box(0, 0, 0, w, bd, h);
      b.floors(0, 0, 0, w, bd, h, 4);
      b.mullions(0, 0, 0, w, bd, h, 1.1);
      // 屋顶楼梯间突出机房
      b.box(w * 0.25, bd * 0.2, h, w * 0.5, bd * 0.55, 1.1);
      b.mullions(w * 0.25, bd * 0.2, h, w * 0.5, bd * 0.55, 1.1, 1.1);
      // 正门门厅雨棚与立柱
      var cw = Math.min(3.2, w * 0.34), cx = (w - cw) / 2;
      b.pole(cx + 0.15, d - 0.15, 0, h * 0.32, {});
      b.pole(cx + cw - 0.15, d - 0.15, 0, h * 0.32, {});
      b.box(cx, bd, h * 0.32, cw, d - bd, 0.32);
    }
  });

  def({
    type: 'lampHouse', name: '联合建筑(灯房浴室)', cat: 'build', w: 10, d: 6, h: 5, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      b.box(0, 0, 0, w * 0.6, d, h);
      b.floors(0, 0, 0, w * 0.6, d, h, Math.max(2, Math.round(h / 1.7)));
      b.mullions(0, 0, 0, w * 0.6, d, h, 1.2);
      b.box(w * 0.6, d * 0.3, 0, w * 0.4, d * 0.7, h * 0.6);
      b.mullions(w * 0.6, d * 0.3, 0, w * 0.4, d * 0.7, h * 0.6, 1.2);
      b.box(w * 0.15, d * 0.3, h, w * 0.3, d * 0.4, 0.6);
    }
  });

  def({
    type: 'workshop', name: '维修场/机修车间', cat: 'build', w: 12, d: 7, h: 4.4, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      var sx = w * 0.16, sy = 0.4, sw = w * 0.66, sd = d * 0.72, wh = h * 0.75, rh = h * 0.25;
      // 两侧附属集装箱工具房
      b.box(0, d * 0.48, 0, w * 0.13, d * 0.36, h * 0.4);
      b.box(w * 0.85, d * 0.52, 0, w * 0.14, d * 0.36, h * 0.4);
      // 敞开式维修大棚内停放的铲车与设备柜
      b.box(sx + 0.8, sy + sd * 0.42, 0, 2.2, 1.5, 1.1, { cls: 'veh' });
      b.box(sx + 1.3, sy + sd * 0.52, 1.1, 1.1, 1.1, 0.9, { cls: 'veh' });
      b.box(sx + 0.2, sy + sd * 0.55, 0.1, 0.6, 1.2, 0.5, { cls: 'veh' });
      b.box(sx + sw - 2.2, sy + 0.6, 0, 1.5, 1.2, 1.5);
      // 维修大棚主体与屋盖（贴合参考图“维修场”）
      b.box(sx, sy, 0, sw, sd, wh);
      b.gable(sx, sy, wh, sw, sd, rh);
      b.mullions(sx, sy, 0, sw, sd, wh, 1.8);
      for (var k = 1; k < 5; k++) {
        var rx = sx + (sw * k) / 5;
        b.line([[rx, sy + sd, wh], [rx, sy + sd / 2, wh + rh]], { top: true, thin: true });
      }
      // 正面敞口大跨门洞线
      b.line([[sx + 0.5, sy + sd, 0], [sx + 0.5, sy + sd, wh * 0.86], [sx + sw - 0.5, sy + sd, wh * 0.86], [sx + sw - 0.5, sy + sd, 0]], { n: [0, 1, 0] });
    }
  });

  def({
    type: 'gate', name: '矿区大门', cat: 'build', w: 10, d: 3.5, h: 4, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, y0 = d * 0.28, pd = d * 0.44;
      // 左侧门架立柱与顶棚（贴合参考图“大门”）
      b.box(0.2, y0, 0, 0.9, pd, h * 0.85);
      b.box(2.1, y0, 0, 0.8, pd, h * 0.85);
      b.box(0, y0 - 0.15, h * 0.85, 3.1, pd + 0.3, h * 0.15);
      // 中间铁艺伸缩闸门
      var gx0 = 2.9, gx1 = w - 2.8, gy = d * 0.5;
      b.line([[gx0, gy, 0], [gx1, gy, 0]], {});
      b.line([[gx0, gy, 1.05], [gx1, gy, 1.05]], {});
      var bars = Math.max(5, Math.round((gx1 - gx0) / 0.45));
      for (var i = 0; i <= bars; i++) {
        var x = gx0 + ((gx1 - gx0) * i) / bars;
        b.pole(x, gy, 0, 1.05, { thin: true });
      }
      // 右侧门卫值班室
      b.box(w - 2.8, y0 - 0.1, 0, 2.6, pd + 0.35, h * 0.65);
      b.box(w - 3, y0 - 0.25, h * 0.65, 3, pd + 0.65, h * 0.12);
      b.mullions(w - 2.8, y0 - 0.1, 0, 2.6, pd + 0.35, h * 0.65, 0.9);
    }
  });

  def({
    type: 'weighbridge', name: '地磅房', cat: 'build', w: 5, d: 9, h: 3, zone: true,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, pw = w * 0.58;
      b.box(0.3, 0.8, 0, pw, d - 1.6, 0.25);
      for (var k = 1; k < 4; k++) b.line([[0.3, 0.8 + ((d - 1.6) * k) / 4, 0.25], [0.3 + pw, 0.8 + ((d - 1.6) * k) / 4, 0.25]], { thin: true });
      b.box(w * 0.7, d / 2 - 1, 0, w * 0.3, 2, h);
      b.mullions(w * 0.7, d / 2 - 1, 0, w * 0.3, 2, h, 0.7);
    }
  });

  def({
    type: 'parking', name: '停车场', cat: 'build', w: 10, d: 6, h: 1, zone: true, layer: 0,
    build: function (b, p) {
      var w = p.w, d = p.d, n = Math.max(2, Math.floor(w / 1.4));
      b.flat(b.rect(0, 0, 0, w, d), {});
      for (var i = 0; i <= n; i++) {
        var x = (w * i) / n;
        b.line([[x, 0, 0], [x, d * 0.38, 0]], { thin: true });
        b.line([[x, d, 0], [x, d * 0.62, 0]], { thin: true });
      }
      b.line([[0, d / 2, 0], [w, d / 2, 0]], { dash: true, thin: true });
      for (i = 0; i < n; i += 2) b.car((w * i) / n + (w / n - 1) / 2, 0.15, false, { cls: 'veh' });
      for (i = 1; i < n; i += 3) b.car((w * i) / n + (w / n - 1) / 2, d - 2.15, false, { cls: 'veh' });
    }
  });

  def({
    type: 'zone', name: '区域框(矩形)', cat: 'build', w: 14, d: 10, h: 0, zone: true, layer: 0,
    build: function (b, p) {
      var w = p.w, d = p.d;
      b.flat(b.rect(0, 0, 0, w, d), { cls: 'zonefill' });
      if (p.fenced !== false) b.fenceRect(0, 0, w, d, 1.1, 2.2, { cls: 'zfence' });
    }
  });

  /* =====================================================================
   *  四、点缀与环境地形组件
   * ===================================================================== */
  def({
    type: 'mountain', name: '远山背景(线框)', cat: 'deco', w: 28, d: 9, h: 7, tint: 'terrain', layer: 0,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      var peaks = [
        [0.14, 0.45, 0.62], [0.3, 0.38, 0.95], [0.48, 0.46, 0.74],
        [0.66, 0.36, 1.0], [0.84, 0.44, 0.68]
      ];
      peaks.forEach(function (pk, idx) {
        var cx = w * pk[0], cy = d * pk[1], ph = h * pk[2];
        var rx = w * 0.19, ry = d * 0.44;
        var base = [
          [clamp(cx - rx, 0, w), clamp(cy - ry * 0.6, 0, d), 0],
          [clamp(cx - rx * 0.4, 0, w), 0, 0],
          [clamp(cx + rx * 0.45, 0, w), 0, 0],
          [clamp(cx + rx, 0, w), clamp(cy - ry * 0.3, 0, d), 0],
          [clamp(cx + rx * 0.65, 0, w), clamp(cy + ry, 0, d), 0],
          [clamp(cx, 0, w), clamp(cy + ry * 1.05, 0, d), 0],
          [clamp(cx - rx * 0.68, 0, w), clamp(cy + ry * 0.9, 0, d), 0]
        ];
        var top = [cx, cy, ph];
        for (var i = 0; i < base.length; i++) {
          var a = base[i], c = base[(i + 1) % base.length];
          b.line([top, a], { thin: true });
          b.line([a, c], { thin: true });
          var m1 = [(top[0] + a[0]) / 2, (top[1] + a[1]) / 2, ph * 0.48];
          var m2 = [(top[0] + c[0]) / 2, (top[1] + c[1]) / 2, ph * 0.48];
          b.line([m1, m2], { thin: true });
        }
        if (idx > 0) {
          var prev = peaks[idx - 1];
          b.line([[w * prev[0], d * prev[1], h * prev[2]], [cx, cy, ph]], {});
        }
      });
      function clamp(v, a, c) { return Math.max(a, Math.min(c, v)); }
    }
  });

  def({
    type: 'openPit', name: '露天采场(阶梯)', cat: 'deco', w: 22, d: 14, h: 5, tint: 'terrain', layer: 0,
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, tiers = 5;
      for (var k = 0; k < tiers; k++) {
        var t0 = k / tiers, t1 = (k + 0.65) / tiers;
        var z0 = h * (1 - t0 * 0.85), z1 = h * (1 - t1 * 0.85);
        var arc0 = [], arc1 = [], n = 12;
        for (var i = 0; i <= n; i++) {
          var a = PI * 0.08 + (i / n) * PI * 0.88;
          var r0x = w * (0.92 - t0 * 0.58), r0y = d * (0.9 - t0 * 0.56);
          var r1x = w * (0.92 - t1 * 0.58), r1y = d * (0.9 - t1 * 0.56);
          arc0.push([w * 0.55 - Math.cos(a) * r0x * 0.5, d * 0.88 - Math.sin(a) * r0y * 0.78, z0]);
          arc1.push([w * 0.55 - Math.cos(a) * r1x * 0.5, d * 0.88 - Math.sin(a) * r1y * 0.78, z1]);
        }
        b.line(arc0, {});
        b.line(arc1, { thin: true });
        for (var j = 0; j <= n; j += 2) b.line([arc0[j], arc1[j]], { thin: true });
      }
    }
  });
  def({
    type: 'pine', name: '松树', cat: 'deco', w: 1.4, d: 1.4, h: 3.6, tint: 'green',
    build: function (b, p) {
      var cx = p.w / 2, cy = p.d / 2, r = Math.min(p.w, p.d) * 0.48, h = p.h;
      b.pole(cx, cy, 0, h * 0.3, { cls: 'trunk' });
      b.cone(cx, cy, h * 0.22, r, r * 0.2, h * 0.45, { noHidden: true }, 7);
      b.cone(cx, cy, h * 0.5, r * 0.75, 0.02, h * 0.5, { noHidden: true }, 7);
    }
  });

  def({
    type: 'tree', name: '乔木', cat: 'deco', w: 1.6, d: 1.6, h: 3.4, tint: 'green',
    build: function (b, p) {
      var cx = p.w / 2, cy = p.d / 2, r = Math.min(p.w, p.d) * 0.5, h = p.h, zm = h * 0.62;
      b.pole(cx, cy, 0, h * 0.4, { cls: 'trunk' });
      var low = b.ringPts(cx, cy, h * 0.32, r * 0.35, r * 0.35, 8), mid = b.ringPts(cx, cy, zm, r, r, 8), top = b.ringPts(cx, cy, h, r * 0.3, r * 0.3, 8);
      b.loft(low, mid, { noHidden: true });
      b.loft(mid, top, { noHidden: true });
    }
  });

  def({
    type: 'shrub', name: '灌木丛', cat: 'deco', w: 2.4, d: 1.2, h: 0.9, tint: 'green',
    build: function (b, p) {
      var cx = p.w / 2, cy = p.d / 2;
      b.loft(b.ringPts(cx, cy, 0, p.w / 2, p.d / 2, 10), b.ringPts(cx, cy, p.h, p.w * 0.38, p.d * 0.3, 10), { noHidden: true });
    }
  });

  def({
    type: 'flowerbed', name: '绿化花坛', cat: 'deco', w: 5, d: 2.5, h: 0.35, tint: 'green',
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      b.box(0, 0, 0, w, d, h, { noHidden: true });
      var n = Math.max(1, Math.floor(w / 1.4));
      for (var i = 0; i < n; i++) {
        var cx = (w * (i + 0.5)) / n, cy = d / 2, r = Math.min(0.55, d * 0.3);
        b.cone(cx, cy, h, r, r * 0.25, 0.7, { noHidden: true }, 7);
      }
    }
  });

  def({
    type: 'lamp', name: '路灯', cat: 'deco', w: 1, d: 1, h: 4.5, tint: 'lamp',
    build: function (b, p) {
      var cx = p.w / 2, cy = p.d / 2, h = p.h, lx = cx + 1.1;
      b.flat(b.ringPts(lx, cy, 0, 1.2, 1.2, 16), { cls: 'glow' });
      b.pole(cx, cy, 0, h, { w: 1.8 });
      b.line([[cx, cy, h - 0.2], [cx + 0.5, cy, h + 0.2], [lx + 0.2, cy, h + 0.2]], {});
      b.box(lx - 0.3, cy - 0.17, h, 0.6, 0.34, 0.16, { noHidden: true, cls: 'lampHead' });
      b.line([[lx - 0.25, cy, h], [lx - 1.1, cy, 0]], { top: true, dash: true, thin: true, cls: 'beam' });
      b.line([[lx + 0.25, cy, h], [lx + 1.2, cy, 0]], { top: true, dash: true, thin: true, cls: 'beam' });
    }
  });

  def({
    type: 'camera', name: '监控立杆', cat: 'deco', w: 1, d: 1, h: 4, tint: 'lamp', zone: true,
    build: function (b, p) {
      var cx = p.w / 2, cy = p.d / 2, h = p.h, R = 4, pts = [[cx, cy, 0]];
      for (var i = 0; i <= 8; i++) {
        var a = PI / 2 - PI / 6 + (i / 8) * (PI / 3);
        pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0]);
      }
      b.flat(pts, { cls: 'glow', dash: true });
      b.pole(cx, cy, 0, h, { w: 1.6 });
      b.box(cx - 0.18, cy - 0.1, h - 0.2, 0.36, 0.7, 0.3, { noHidden: true });
    }
  });

  def({
    type: 'sign', name: '安全警示牌', cat: 'deco', w: 1.6, d: 0.4, h: 2.4, tint: 'warn',
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h;
      b.pole(0.15, d / 2, 0, h * 0.5, {});
      b.pole(w - 0.15, d / 2, 0, h * 0.5, {});
      b.box(0, d / 2 - 0.05, h * 0.45, w, 0.1, h * 0.55, { noHidden: true });
      for (var k = 1; k < 4; k++) {
        b.line([[(w * k) / 4 - 0.25, d / 2 + 0.05, h * 0.47], [(w * k) / 4 + 0.25, d / 2 + 0.05, h * 0.98]], { n: [0, 1, 0], thin: true });
      }
    }
  });

  def({
    type: 'truck', name: '矿用卡车', cat: 'deco', w: 3, d: 5, h: 2.6, tint: 'warn',
    build: function (b, p) {
      var w = p.w, d = p.d, h = p.h, r = Math.min(0.65, h * 0.25);
      b.box(0.3, 0.3, r * 0.8, w - 0.6, d - 0.6, 0.35, { noHidden: true });
      b.frustum(0.15, 0.15, r * 0.8 + 0.35, w - 0.3, d - 1.9, h - r * 0.8 - 0.35, -0.12, -0.12, { noHidden: true });
      b.box(0.35, d - 1.6, r * 0.8 + 0.35, w * 0.48, 1.2, h * 0.42, { noHidden: true });
      [1, d - 1].forEach(function (y) {
        b.wheelYZ(w - 0.25, y, r, r, 1, {});
        b.wheelYZ(0.25, y, r, r, -1, {});
      });
    }
  });

  var map = {};
  shapes.forEach(function (s) {
    if (s.layer == null) s.layer = 1;
    map[s.type] = s;
  });

  /* =====================================================================
   *  折线类工具（自由折线）
   * ===================================================================== */
  var paths = [
    { ptype: 'road', name: '道路', width: 3, h: 0, layer: 0, zone: false, desc: '路面 + 路缘 + 中心虚线' },
    { ptype: 'rail', name: '铁路专用线', width: 1.6, h: 0, layer: 0, zone: false, desc: '双轨 + 枕木' },
    { ptype: 'belt', name: '皮带走廊/栈桥', width: 1.2, h: 4, h2: 4, layer: 1, zone: true, desc: '架空廊道，可设起止高度' },
    { ptype: 'pipe', name: '管廊/瓦斯管线', width: 0.4, h: 2.2, layer: 1, zone: true, desc: '架空管线 + 支架' },
    { ptype: 'fence', name: '围栏/电子围栏', width: 0.2, h: 1.6, layer: 1, zone: true, desc: '立柱 + 横杆' },
    { ptype: 'area', name: '区域框(多边形)', width: 0, h: 0, layer: 0, zone: true, closed: true, desc: '自由多边形风险分区' }
  ];
  var pmap = {};
  paths.forEach(function (p) { pmap[p.ptype] = p; });

  var cats = [
    { key: 'coal', name: '煤矿生产区' },
    { key: 'safety', name: '安全与机电设施' },
    { key: 'build', name: '通用建筑与卡口' },
    { key: 'deco', name: '点缀组件' }
  ];

  MS.shapes = { list: shapes, map: map, paths: paths, pathMap: pmap, cats: cats };
})();
