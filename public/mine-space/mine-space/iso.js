/*!
 * MineSpace - 2.5D 等轴测立体线框引擎
 * 世界坐标 (x, y, z) 以“网格单位”计；屏幕坐标为 SVG 像素
 */
(function () {
  'use strict';
  var MS = (window.MineSpace = window.MineSpace || {});

  var T = 20; // 每网格单位像素
  var CX = 0.8660254; // cos30
  var SY = 0.5; // sin30
  var ZK = 0.82; // 高度压缩系数
  var VIEW = [1, 1, (2 * SY) / ZK]; // 指向观察者的视线向量（用于背面判断）

  function proj(x, y, z) {
    return [(x - y) * CX * T, (x + y) * SY * T - (z || 0) * ZK * T];
  }
  function unproj(sx, sy) {
    var a = sx / (CX * T), b = sy / (SY * T);
    return [(a + b) / 2, (b - a) / 2];
  }

  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function centroid(pts) {
    var x = 0, y = 0, z = 0, n = pts.length;
    for (var i = 0; i < n; i++) { x += pts[i][0]; y += pts[i][1]; z += pts[i][2]; }
    return [x / n, y / n, z / n];
  }
  // Newell 法求面法向
  function normal(pts) {
    var nx = 0, ny = 0, nz = 0, n = pts.length;
    for (var i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n];
      nx += (p[1] - q[1]) * (p[2] + q[2]);
      ny += (p[2] - q[2]) * (p[0] + q[0]);
      nz += (p[0] - q[0]) * (p[1] + q[1]);
    }
    var l = Math.sqrt(nx * nx + ny * ny + nz * nz);
    return l < 1e-7 ? null : [nx / l, ny / l, nz / l];
  }

  /* ---------------- 几何构建器 ---------------- */
  function Builder() {
    this.solids = [];
    this.lines = [];
    this.flats = [];
  }
  var B = Builder.prototype;

  B.rect = function (x, y, z, w, d) {
    return [[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]];
  };
  B.ringPts = function (cx, cy, z, rx, ry, n) {
    var pts = [];
    n = n || 16;
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2;
      pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, z]);
    }
    return pts;
  };
  // 放样：底面多边形 → 顶面多边形（点数一致，凸体）
  B.loft = function (bot, top, o) {
    var n = bot.length, faces = [bot, top];
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n;
      faces.push([bot[i], bot[j], top[j], top[i]]);
    }
    this.solids.push({ faces: faces, o: o || {} });
    return this;
  };
  B.box = function (x, y, z, w, d, h, o) {
    return this.loft(this.rect(x, y, z, w, d), this.rect(x, y, z + h, w, d), o);
  };
  B.frustum = function (x, y, z, w, d, h, ix, iy, o) {
    if (iy == null) iy = ix;
    return this.loft(this.rect(x, y, z, w, d), this.rect(x + ix, y + iy, z + h, w - 2 * ix, d - 2 * iy), o);
  };
  B.cyl = function (cx, cy, z, r, h, o, n) {
    return this.loft(this.ringPts(cx, cy, z, r, r, n || 14), this.ringPts(cx, cy, z + h, r, r, n || 14), o);
  };
  B.cone = function (cx, cy, z, r1, r2, h, o, n) {
    return this.loft(this.ringPts(cx, cy, z, r1, r1, n || 14), this.ringPts(cx, cy, z + h, r2, r2, n || 14), o);
  };
  // 截面在 YZ 平面，沿 X 拉伸
  B.extrudeX = function (prof, x0, x1, o) {
    return this.loft(
      prof.map(function (p) { return [x0, p[0], p[1]]; }),
      prof.map(function (p) { return [x1, p[0], p[1]]; }), o);
  };
  // 截面在 XZ 平面，沿 Y 拉伸
  B.extrudeY = function (prof, y0, y1, o) {
    return this.loft(
      prof.map(function (p) { return [p[0], y0, p[1]]; }),
      prof.map(function (p) { return [p[0], y1, p[1]]; }), o);
  };
  // 双坡屋顶（屋脊沿 X）
  B.gable = function (x, y, z, w, d, h, o) {
    return this.extrudeX([[y, z], [y + d, z], [y + d / 2, z + h]], x, x + w, o);
  };
  B.gableY = function (x, y, z, w, d, h, o) {
    return this.extrudeY([[x, z], [x + w, z], [x + w / 2, z + h]], y, y + d, o);
  };
  // 线：默认依附于最近一个实体（随其绘制顺序），o.n 为法向（用于判断可见/虚线）
  B.line = function (pts, o) {
    o = o || {};
    this.lines.push({ pts: pts, o: o, after: o.top ? 1e9 : this.solids.length - 1 });
    return this;
  };
  B.flat = function (pts, o) {
    this.flats.push({ pts: pts, o: o || {} });
    return this;
  };
  B.pole = function (x, y, z0, z1, o) { return this.line([[x, y, z0], [x, y, z1]], o); };
  // 楼层分隔线（四面，带法向）
  B.floors = function (x, y, z, w, d, h, n, o) {
    for (var k = 1; k < n; k++) {
      var zz = z + (h * k) / n;
      this.facadeRing(x, y, zz, w, d, o);
    }
    return this;
  };
  B.facadeRing = function (x, y, zz, w, d, o) {
    o = o || {};
    var mk = function (nv) { var r = {}; for (var k in o) r[k] = o[k]; r.n = nv; return r; };
    this.line([[x, y + d, zz], [x + w, y + d, zz]], mk([0, 1, 0]));
    this.line([[x + w, y, zz], [x + w, y + d, zz]], mk([1, 0, 0]));
    this.line([[x, y, zz], [x + w, y, zz]], mk([0, -1, 0]));
    this.line([[x, y, zz], [x, y + d, zz]], mk([-1, 0, 0]));
  };
  // 立面竖向分格（幕墙感）
  B.mullions = function (x, y, z, w, d, h, step, o) {
    o = o || {};
    var mk = function (nv) { var r = { thin: true }; for (var k in o) r[k] = o[k]; r.n = nv; return r; };
    var i, t;
    for (t = step; t < w - 0.01; t += step) {
      this.line([[x + t, y + d, z], [x + t, y + d, z + h]], mk([0, 1, 0]));
      this.line([[x + t, y, z], [x + t, y, z + h]], mk([0, -1, 0]));
    }
    for (t = step; t < d - 0.01; t += step) {
      this.line([[x + w, y + t, z], [x + w, y + t, z + h]], mk([1, 0, 0]));
      this.line([[x, y + t, z], [x, y + t, z + h]], mk([-1, 0, 0]));
    }
    return this;
  };
  // 桁架斜撑：底/顶四边形之间每个侧面画 X
  B.braces = function (bot, top, levels, o) {
    o = o || {};
    var c = centroid(bot.concat(top));
    for (var i = 0; i < 4; i++) {
      var j = (i + 1) % 4;
      var quad = [bot[i], bot[j], top[j], top[i]];
      var n = normal(quad);
      if (!n) continue;
      var fc = centroid(quad);
      if (dot(n, [fc[0] - c[0], fc[1] - c[1], fc[2] - c[2]]) < 0) n = [-n[0], -n[1], -n[2]];
      for (var k = 0; k < levels; k++) {
        var t0 = k / levels, t1 = (k + 1) / levels;
        var a0 = lerp3(bot[i], top[i], t0), b0 = lerp3(bot[j], top[j], t0);
        var a1 = lerp3(bot[i], top[i], t1), b1 = lerp3(bot[j], top[j], t1);
        var lo = { n: n, thin: true };
        for (var key in o) lo[key] = o[key];
        this.line([a0, b1], lo);
        this.line([b0, a1], lo);
        this.line([a1, b1], lo);
      }
    }
    return this;
  };
  function lerp3(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  /* ---------------- 变换（旋转 + 平移） ---------------- */
  function makeXf(p) {
    var x = p.x || 0, y = p.y || 0, w = p.w || 1, d = p.d || 1;
    var r = (((Math.round((p.rot || 0) / 90) % 4) + 4) % 4);
    return {
      pt: function (q) {
        var lx = q[0], ly = q[1];
        switch (r) {
          case 1: return [x + d - ly, y + lx, q[2]];
          case 2: return [x + w - lx, y + d - ly, q[2]];
          case 3: return [x + ly, y + w - lx, q[2]];
          default: return [x + lx, y + ly, q[2]];
        }
      },
      n: function (v) {
        switch (r) {
          case 1: return [-v[1], v[0], v[2]];
          case 2: return [-v[0], -v[1], v[2]];
          case 3: return [v[1], -v[0], v[2]];
          default: return v;
        }
      }
    };
  }

  function fx(v) { return Math.round(v * 10) / 10; }

  /* ---------------- 渲染：Builder → SVG 字符串 ---------------- */
  function renderShape(build, p, st) {
    st = st || {};
    var b = new Builder();
    build(b, p);
    var X = makeXf(p);
    var bb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };

    function P(w) {
      var s = proj(w[0], w[1], w[2]);
      if (s[0] < bb.x0) bb.x0 = s[0];
      if (s[0] > bb.x1) bb.x1 = s[0];
      if (s[1] < bb.y0) bb.y0 = s[1];
      if (s[1] > bb.y1) bb.y1 = s[1];
      return s;
    }
    function path(ws, close) {
      var str = '';
      for (var i = 0; i < ws.length; i++) {
        var s = P(ws[i]);
        str += (i ? 'L' : 'M') + fx(s[0]) + ' ' + fx(s[1]);
      }
      return str + (close ? 'Z' : '');
    }
    function styleOf(o, isFill) {
      var s = '';
      if (o.color) s += 'stroke:' + o.color + ';' + (isFill ? 'fill:' + o.color + ';' : '');
      if (o.fill != null && isFill) s += 'fill-opacity:' + o.fill + ';';
      if (o.op != null) s += 'stroke-opacity:' + o.op + ';';
      if (o.w != null) s += 'stroke-width:' + o.w + ';';
      return s ? ' style="' + s + '"' : '';
    }

    var out = '';
    // 1. 地面平面
    b.flats.forEach(function (f) {
      var ws = f.pts.map(X.pt);
      out += '<path class="ms-fl' + (f.o.dash ? ' dash' : '') + (f.o.cls ? ' ' + f.o.cls : '') + '" d="' + path(ws, f.o.open ? false : true) + '"' + styleOf(f.o, true) + '/>';
    });

    // 2. 实体面处理
    var hiddenD = '';
    var solids = b.solids.map(function (s, idx) {
      var wfaces = s.faces.map(function (f) { return f.map(X.pt); });
      var all = [];
      wfaces.forEach(function (f) { all = all.concat(f); });
      var c = centroid(all);
      var faces = [];
      wfaces.forEach(function (wf) {
        var n = normal(wf);
        if (!n) return;
        var fc = centroid(wf);
        if (dot(n, [fc[0] - c[0], fc[1] - c[1], fc[2] - c[2]]) < 0) n = [-n[0], -n[1], -n[2]];
        var vis = dot(n, VIEW) > 1e-6;
        if (!vis) {
          if (st.hidden !== false && !s.o.noHidden) hiddenD += path(wf, true);
          else wf.forEach(P);
          return;
        }
        var cls = n[2] > 0.55 ? 't' : n[1] >= n[0] ? 'l' : 'r';
        faces.push({ d: path(wf, true), cls: cls });
      });
      return { idx: idx, depth: c[0] + c[1] + c[2] * 0.3, faces: faces, o: s.o };
    });
    if (hiddenD) out += '<path class="ms-h" d="' + hiddenD + '"/>';

    function lineOut(L) {
      var ws = L.pts.map(X.pt);
      var hidden = false;
      if (L.o.n) hidden = dot(X.n(L.o.n), VIEW) <= 1e-6;
      if (hidden && st.hidden === false) { ws.forEach(P); return ''; }
      var cls = hidden ? 'ms-h' : 'ms-l';
      if (!hidden && L.o.dash) cls += ' dash';
      if (L.o.thin) cls += ' thin';
      if (L.o.cls) cls += ' ' + L.o.cls;
      return '<path class="' + cls + '" d="' + path(ws, !!L.o.close) + '"' + (hidden ? '' : styleOf(L.o, false)) + '/>';
    }

    // 3. 先画不依附实体的线
    b.lines.forEach(function (L) { if (L.after < 0) out += lineOut(L); });
    // 4. 实体按深度由远到近
    solids.slice().sort(function (a, b2) { return a.depth - b2.depth; }).forEach(function (s) {
      var sty = styleOf(s.o, true);
      s.faces.forEach(function (f) {
        out += '<path class="ms-f ' + f.cls + (s.o.cls ? ' ' + s.o.cls : '') + '" d="' + f.d + '"' + sty + '/>';
      });
      b.lines.forEach(function (L) { if (L.after === s.idx) out += lineOut(L); });
    });
    // 5. 顶层线
    b.lines.forEach(function (L) { if (L.after >= 1e9) out += lineOut(L); });

    return { html: out, bounds: bb };
  }

  MS.iso = {
    T: T, CX: CX, SY: SY, ZK: ZK,
    proj: proj, unproj: unproj,
    Builder: Builder,
    makeXf: makeXf,
    renderShape: renderShape,
    fx: fx
  };
})();
