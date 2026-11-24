/*!
 * MineSpace - 矿山安全空间态势组件（编辑器 + 预览）
 * 依赖: iso.js, shapes.js（同目录）
 * 用法: var ms = MineSpace.create('#el', { mode, layout, alarms, onChange, onSelectZone, onAlarmClick, onAlarmClear })
 */
(function () {
  'use strict';
  var MS = window.MineSpace, iso = MS.iso, SH = MS.shapes;
  var T = iso.T;

  var RISK = [
    { lv: 0, name: '正常', short: '正常', warn: '正常', color: '#22d3ee' },
    { lv: 1, name: '重大风险', short: '红', warn: '重大预警', color: '#ef4444' },
    { lv: 2, name: '较大风险', short: '橙', warn: '较大预警', color: '#f97316' },
    { lv: 3, name: '一般风险', short: '黄', warn: '一般预警', color: '#eab308' },
    { lv: 4, name: '低风险', short: '蓝', warn: '低风险预警', color: '#3b82f6' }
  ];
  var ALIAS = { critical: 1, major: 1, red: 1, high: 2, orange: 2, medium: 3, yellow: 3, normal: 3, low: 4, blue: 4, info: 4 };
  var ALARM_TYPES = ['瓦斯浓度超限', '一氧化碳超限', '温度异常/自燃预警', '边坡位移超限', '人员违规闯入', '设备故障停机', '烟雾/火灾告警', '水位超限', '粉尘浓度超限', 'AI识别:未戴安全帽'];
  var DEFAULT_CANVAS = { cols: 64, rows: 64, theme: 'sketch', snap: 0.5, showLabels: true, showHidden: false, showBaseRisk: true, glow: 1, title: '矿山安全空间态势' };
  var IDXF = { x: 0, y: 0, w: 1, d: 1, rot: 0 };

  /* ---------------- 通用工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var _uid = 0;
  function uid(p) { return (p || 'it') + '_' + Date.now().toString(36) + (++_uid).toString(36) + Math.random().toString(36).slice(2, 5); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function fx(v) { return Math.round(v * 10) / 10; }
  function num(v, d) { v = parseFloat(v); return isFinite(v) ? v : d; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtTime(t) { var d = new Date(t); if (isNaN(d)) return String(t); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function fmtDate(t) { var d = new Date(t); if (isNaN(d)) return String(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + fmtTime(t); }
  function ovl(a, b) { return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1; }
  function textW(s) { var w = 0; for (var i = 0; i < s.length; i++) w += s.charCodeAt(i) > 255 ? 11 : 6.6; return w; }
  function normLevel(l) {
    if (typeof l === 'number') return clamp(Math.round(l), 1, 4);
    var s = String(l || '').toLowerCase();
    if (ALIAS[s]) return ALIAS[s];
    var n = parseInt(s, 10);
    return isFinite(n) ? clamp(n, 1, 4) : 3;
  }
  function normAlarm(a) {
    return {
      id: a.id != null ? String(a.id) : uid('al'),
      zoneId: a.zoneId != null ? String(a.zoneId) : '',
      level: normLevel(a.level),
      type: a.type || '报警',
      message: a.message || '',
      time: a.time || Date.now(),
      raw: a
    };
  }
  function isPath(it) { return it && it.kind === 'path'; }
  function fpOf(it) {
    var odd = ((Math.round((it.rot || 0) / 90) % 2) + 2) % 2 === 1;
    var fw = odd ? it.d : it.w, fd = odd ? it.w : it.d;
    return { x0: it.x, y0: it.y, x1: it.x + fw, y1: it.y + fd, fw: fw, fd: fd };
  }
  function pathBox(pts, m) {
    var b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    pts.forEach(function (p) {
      b.x0 = Math.min(b.x0, p[0] - m); b.y0 = Math.min(b.y0, p[1] - m);
      b.x1 = Math.max(b.x1, p[0] + m); b.y1 = Math.max(b.y1, p[1] + m);
    });
    return b;
  }
  function unionB(a, b) {
    if (!a) return { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 };
    return { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) };
  }

  /* ---------------- 折线几何 ---------------- */
  function segNormal(a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  }
  function offsetPts(pts, off, closed) {
    var n = pts.length, out = [];
    for (var i = 0; i < n; i++) {
      var p = pts[i];
      var prev = i > 0 ? pts[i - 1] : closed ? pts[n - 1] : null;
      var next = i < n - 1 ? pts[i + 1] : closed ? pts[0] : null;
      var n1 = prev ? segNormal(prev, p) : null, n2 = next ? segNormal(p, next) : null;
      var nx, ny, sc = 1;
      if (n1 && n2) {
        nx = n1[0] + n2[0]; ny = n1[1] + n2[1];
        var l = Math.hypot(nx, ny);
        if (l < 1e-6) { nx = n1[0]; ny = n1[1]; } else {
          nx /= l; ny /= l;
          sc = 1 / Math.max(nx * n1[0] + ny * n1[1], 0.35);
        }
      } else { var nn = n1 || n2; nx = nn[0]; ny = nn[1]; }
      out.push([p[0] + nx * off * sc, p[1] + ny * off * sc]);
    }
    return out;
  }
  function polyLen(pts) {
    var L = 0;
    for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }
  function along(pts, step, cb) {
    var acc = step / 2;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L < 1e-6) continue;
      var ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      while (acc <= L) { cb(a[0] + ux * acc, a[1] + uy * acc, ux, uy); acc += step; }
      acc -= L;
    }
  }
  function midOf(pts) {
    var L = polyLen(pts) / 2;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], s = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L <= s) { var t = s ? L / s : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
      L -= s;
    }
    return pts[0];
  }
  function z0(p) { return [p[0], p[1], 0]; }
  function hitPath(pts3) {
    var d = '';
    pts3.forEach(function (p, i) { var s = iso.proj(p[0], p[1], p[2]); d += (i ? 'L' : 'M') + fx(s[0]) + ' ' + fx(s[1]); });
    return '<path class="ms-hit" d="' + d + '"/>';
  }

  /* ---------------- 组件 → 绘制片段 ---------------- */
  function shapePieces(it) {
    var def = SH.map[it.type];
    if (!def) return [];
    var r = iso.renderShape(def.build, it, {});
    var f = fpOf(it);
    return [{
      id: it.id, html: r.html, bounds: r.bounds, fp: f, layer: def.layer,
      sub: it.type === 'zone' ? 0 : it.type === 'parking' ? 3 : 1,
      depth: (f.x0 + f.x1 + f.y0 + f.y1) / 2
    }];
  }

  function pathPieces(it) {
    var P = SH.pathMap[it.ptype], pts = it.pts;
    if (!P || !pts || pts.length < 2) return [];
    var w = num(it.width, P.width), h = num(it.h, P.h), out = [];
    function piece(build, fp, layer, sub, extra) {
      var r = iso.renderShape(build, IDXF, {});
      out.push({ id: it.id, html: r.html + (extra || ''), bounds: r.bounds, fp: fp, layer: layer, sub: sub, depth: (fp.x0 + fp.x1 + fp.y0 + fp.y1) / 2 });
    }
    var t = it.ptype;
    if (t === 'road') {
      var L = offsetPts(pts, w / 2), R = offsetPts(pts, -w / 2);
      piece(function (b) {
        b.flat(L.concat(R.slice().reverse()).map(z0), { cls: 'road-surf' });
        b.line(L.map(z0), { cls: 'road-edge' });
        b.line(R.map(z0), { cls: 'road-edge' });
        if (w >= 2) b.line(pts.map(z0), { cls: 'road-mid', thin: true });
      }, pathBox(pts, w / 2), 0, 1, hitPath(pts.map(z0)));
    } else if (t === 'rail') {
      var g = w * 0.28, RL = offsetPts(pts, g), RR = offsetPts(pts, -g);
      piece(function (b) {
        along(pts, 0.7, function (x, y, ux, uy) {
          var nx = -uy, ny = ux, s = w * 0.5;
          b.line([[x + nx * s, y + ny * s, 0], [x - nx * s, y - ny * s, 0]], { thin: true });
        });
        b.line(RL.map(z0), { cls: 'road-edge' });
        b.line(RR.map(z0), { cls: 'road-edge' });
      }, pathBox(pts, w / 2), 0, 2, hitPath(pts.map(z0)));
    } else if (t === 'area') {
      piece(function (b) {
        b.flat(pts.map(z0), { cls: 'area-fill' });
        if (it.fenced !== false) {
          var fh = 0.95, n = pts.length;
          for (var i = 0; i < n; i++) {
            var a = pts[i], c = pts[(i + 1) % n], L = Math.hypot(c[0] - a[0], c[1] - a[1]);
            var steps = Math.max(1, Math.round(L / 2.2));
            for (var k = 0; k < steps; k++) {
              var tt = k / steps;
              b.pole(a[0] + (c[0] - a[0]) * tt, a[1] + (c[1] - a[1]) * tt, 0, fh, { thin: true, cls: 'zfence' });
            }
            b.line([[a[0], a[1], fh], [c[0], c[1], fh]], { thin: true, cls: 'zfence' });
            b.line([[a[0], a[1], fh * 0.5], [c[0], c[1], fh * 0.5]], { thin: true, cls: 'zfence' });
          }
        }
      }, pathBox(pts, 0), 0, 0);
    } else {
      var total = polyLen(pts) || 1, acc = 0, h2 = num(it.h2, h);
      for (var i = 0; i < pts.length - 1; i++) {
        (function (i) {
          var A = pts[i], B = pts[i + 1], SL = Math.hypot(B[0] - A[0], B[1] - A[1]);
          if (SL < 1e-6) return;
          var n = segNormal(A, B), hw = w / 2;
          var zA = t === 'belt' ? h + ((h2 - h) * acc) / total : h;
          var zB = t === 'belt' ? h + ((h2 - h) * (acc + SL)) / total : h;
          acc += SL;
          var fp = pathBox([A, B], Math.max(hw, 0.3));
          var at = function (tt) { return [A[0] + (B[0] - A[0]) * tt, A[1] + (B[1] - A[1]) * tt, zA + (zB - zA) * tt]; };
          if (t === 'belt') {
            piece(function (b) {
              var cnt = Math.max(1, Math.round(SL / 4));
              for (var k = i === 0 ? 0 : 1; k <= cnt; k++) {
                var q = at(k / cnt), ox = n[0] * hw * 0.8, oy = n[1] * hw * 0.8;
                if (q[2] < 0.3) continue;
                b.pole(q[0] + ox, q[1] + oy, 0, q[2], { thin: true });
                b.pole(q[0] - ox, q[1] - oy, 0, q[2], { thin: true });
                b.line([[q[0] + ox, q[1] + oy, q[2] * 0.55], [q[0] - ox, q[1] - oy, q[2] * 0.55]], { thin: true });
              }
              var bot = [[A[0] - n[0] * hw, A[1] - n[1] * hw, zA], [B[0] - n[0] * hw, B[1] - n[1] * hw, zB], [B[0] + n[0] * hw, B[1] + n[1] * hw, zB], [A[0] + n[0] * hw, A[1] + n[1] * hw, zA]];
              var top = bot.map(function (p) { return [p[0], p[1], p[2] + 1]; });
              b.loft(bot, top);
            }, fp, 1, 1, hitPath([[A[0], A[1], zA + 0.5], [B[0], B[1], zB + 0.5]]));
          } else if (t === 'fence') {
            piece(function (b) {
              var cnt = Math.max(1, Math.round(SL / 1.6));
              for (var k = i === 0 ? 0 : 1; k <= cnt; k++) { var q = at(k / cnt); b.pole(q[0], q[1], 0, h, {}); }
              b.line([[A[0], A[1], h], [B[0], B[1], h]], {});
              b.line([[A[0], A[1], h * 0.5], [B[0], B[1], h * 0.5]], { thin: true, dash: true });
            }, fp, 1, 1, hitPath([[A[0], A[1], h * 0.7], [B[0], B[1], h * 0.7]]));
          } else if (t === 'pipe') {
            piece(function (b) {
              var cnt = Math.max(1, Math.round(SL / 4));
              for (var k = i === 0 ? 0 : 1; k <= cnt; k++) {
                var q = at(k / cnt), ox = n[0] * 0.5, oy = n[1] * 0.5;
                b.pole(q[0], q[1], 0, h, { thin: true });
                b.line([[q[0] + ox, q[1] + oy, h - 0.15], [q[0] - ox, q[1] - oy, h - 0.15]], { thin: true });
              }
              b.line([[A[0], A[1], h], [B[0], B[1], h]], { cls: 'pipe-ln' });
            }, fp, 1, 1, hitPath([[A[0], A[1], h], [B[0], B[1], h]]));
          }
        })(i);
      }
    }
    return out;
  }

  function behind(a, b) {
    if (a.fp.x1 <= b.fp.x0 + 1e-6) return true;
    if (b.fp.x1 <= a.fp.x0 + 1e-6) return false;
    if (a.fp.y1 <= b.fp.y0 + 1e-6) return true;
    if (b.fp.y1 <= a.fp.y0 + 1e-6) return false;
    return a.depth <= b.depth;
  }
  // 拓扑排序（画家算法），处理不规则尺寸物体之间的遮挡
  function topo(ps) {
    var n = ps.length, i, j;
    if (n < 2) return ps;
    var indeg = new Array(n).fill(0), adj = ps.map(function () { return []; });
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        if (!ovl(ps[i].bounds, ps[j].bounds)) continue;
        if (behind(ps[i], ps[j])) { adj[i].push(j); indeg[j]++; } else { adj[j].push(i); indeg[i]++; }
      }
    }
    var done = new Array(n).fill(false), out = [];
    for (var c = 0; c < n; c++) {
      var best = -1;
      for (i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (best < 0 || ps[i].depth < ps[best].depth)) best = i;
      if (best < 0) for (i = 0; i < n; i++) if (!done[i] && (best < 0 || ps[i].depth < ps[best].depth)) best = i;
      done[best] = true;
      out.push(ps[best]);
      adj[best].forEach(function (k) { indeg[k]--; });
    }
    return out;
  }

  function thumbSvg(html, bounds, cls, pad) {
    pad = pad || 4;
    var x = bounds.x0 - pad, y = bounds.y0 - pad, w = bounds.x1 - bounds.x0 + pad * 2, h = bounds.y1 - bounds.y0 + pad * 2;
    return '<svg viewBox="' + fx(x) + ' ' + fx(y) + ' ' + fx(w) + ' ' + fx(h) + '" preserveAspectRatio="xMidYMid meet"><g class="ms-item ' + (cls || '') + '">' + html + '</g></svg>';
  }

  function normalizeLayout(l) {
    l = l ? clone(l) : {};
    var c = {}, k;
    for (k in DEFAULT_CANVAS) c[k] = DEFAULT_CANVAS[k];
    for (k in l.canvas || {}) c[k] = l.canvas[k];
    var items = (l.items || []).map(function (it) {
      it = clone(it);
      if (!it.id) it.id = uid(isPath(it) ? 'p' : 's');
      if (isPath(it)) {
        var P = SH.pathMap[it.ptype] || {};
        if (it.width == null) it.width = P.width;
        if (it.h == null) it.h = P.h;
        if (it.ptype === 'belt' && it.h2 == null) it.h2 = it.h;
        if (it.name == null) it.name = P.name;
        if (it.showLabel == null) it.showLabel = it.ptype === 'area' || it.ptype === 'belt';
      } else {
        var D = SH.map[it.type] || {};
        ['w', 'd', 'h'].forEach(function (f) { if (it[f] == null) it[f] = D[f]; });
        if (it.x == null) it.x = 0;
        if (it.y == null) it.y = 0;
        if (it.rot == null) it.rot = 0;
        if (it.name == null) it.name = D.name;
        if (it.showLabel == null) it.showLabel = !!D.zone && it.type !== 'camera';
      }
      if (it.zoneId == null) it.zoneId = '';
      if (it.baseRisk == null) it.baseRisk = 0;
      return it;
    });
    return { version: 1, canvas: c, items: items };
  }

  /* =====================================================================
   *  组件实例
   * ===================================================================== */
  function create(el, opts) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) throw new Error('MineSpace: 容器不存在');
    opts = opts || {};

    var S = {
      mode: opts.mode === 'preview' ? 'preview' : 'edit',
      canvasOnly: !!opts.canvasOnly,
      layout: normalizeLayout(opts.layout),
      alarms: (opts.alarms || []).map(normAlarm),
      sel: [],
      k: 1, tx: 0, ty: 0,
      tool: null,
      draft: null,
      cursor: null,
      cache: {},
      itemBounds: {},
      hist: [], hi: -1,
      clip: null,
      space: false,
      hover: false,
      simOpen: false,
      drawerId: null,
      op: null,
      dragType: null,
      raf: 0, rafO: 0,
      timers: []
    };
    var readonly = !!opts.readonly;

    /* ---------------- DOM ---------------- */
    var root = document.createElement('div');
    root.className = 'ms-root';
    root.innerHTML =
      '<div class="ms-toolbar">' +
      '<div class="ms-title"><i></i><span data-ref="title"></span></div>' +
      (readonly ? '' : '<div class="ms-seg"><button class="ms-btn" data-act="mode-edit">编辑</button><button class="ms-btn" data-act="mode-preview">预览</button></div><span class="ms-sep"></span>') +
      '<span class="ms-edit-only" style="display:inline-flex;gap:6px;align-items:center">' +
      '<button class="ms-btn" data-act="undo" title="撤销 Ctrl+Z">↶ 撤销</button>' +
      '<button class="ms-btn" data-act="redo" title="重做 Ctrl+Shift+Z">↷ 重做</button><span class="ms-sep"></span>' +
      '<button class="ms-btn" data-act="rotate" title="旋转 90° (R)">⟳ 旋转</button>' +
      '<button class="ms-btn" data-act="dup" title="复制 Ctrl+D">⧉ 复制</button>' +
      '<button class="ms-btn danger" data-act="del" title="删除 Delete">✕ 删除</button><span class="ms-sep"></span>' +
      '<button class="ms-btn" data-act="import">导入</button>' +
      '<button class="ms-btn" data-act="export">导出</button>' +
      '<button class="ms-btn" data-act="demo">示例</button>' +
      '<button class="ms-btn danger" data-act="clear">清空</button>' +
      '</span>' +
      '<span class="ms-preview-only" style="display:inline-flex;gap:6px">' +
      '<button class="ms-btn" data-act="sim">报警模拟</button>' +
      '<button class="ms-btn" data-act="clear-alarms">清除报警</button>' +
      '</span>' +
      '<span class="ms-sp"></span>' +
      '<span class="ms-hint" data-ref="hint"></span>' +
      '<button class="ms-btn" data-act="theme" title="切换主题">◐ 主题</button>' +
      '<button class="ms-btn" data-act="fullscreen" title="全屏">⛶</button>' +
      '</div>' +
      '<div class="ms-body">' +
      '<div class="ms-left"><div class="ms-panel-h">组件库<small style="color:var(--ms-text2);font-weight:normal">拖拽或点击放置</small></div>' +
      '<div class="ms-search"><input class="ms-input" data-ref="search" placeholder="搜索组件…"></div>' +
      '<div class="ms-scroll" data-ref="lib"></div></div>' +
      '<div class="ms-stage" data-ref="stage" tabindex="0">' +
      '<svg class="ms-svg" data-ref="svg" xmlns="http://www.w3.org/2000/svg"><g data-ref="vp">' +
      '<g data-ref="grid"></g><g data-ref="under"></g><g data-ref="scene"></g><g data-ref="over"></g><g data-ref="edit"></g>' +
      '</g></svg>' +
      '<div class="ms-hud ms-preview-only" data-ref="hud"></div>' +
      '<div class="ms-drawer ms-preview-only" data-ref="drawer"></div>' +
      '<div class="ms-sim ms-preview-only" data-ref="sim" style="display:none"></div>' +
      '<div class="ms-legend" data-ref="legend"></div>' +
      '<div class="ms-coord" data-ref="coord"></div>' +
      '<div class="ms-zoombar"><button class="ms-btn" data-act="zoom-in" title="放大">＋</button><button class="ms-btn" data-act="zoom-out" title="缩小">－</button><button class="ms-btn" data-act="fit" title="适配视图">⤢</button></div>' +
      '</div>' +
      '<div class="ms-right"><div class="ms-panel-h" data-ref="propTitle">属性</div><div class="ms-scroll" data-ref="props"></div></div>' +
      '</div>';
    el.innerHTML = '';
    el.appendChild(root);

    var R = {};
    root.querySelectorAll('[data-ref]').forEach(function (n) { R[n.getAttribute('data-ref')] = n; });

    /* ---------------- 基础访问 ---------------- */
    function items() { return S.layout.items; }
    function cv() { return S.layout.canvas; }
    function byId(id) {
      var a = items();
      for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
      return null;
    }
    function snap(v) { var s = num(cv().snap, 0); return s > 0 ? Math.round(v / s) * s : Math.round(v * 100) / 100; }
    function emit(name) {
      var fn = opts[name];
      if (typeof fn === 'function') {
        try { fn.apply(null, Array.prototype.slice.call(arguments, 1)); } catch (e) { console.error(e); }
      }
    }
    function toast(msg) {
      var t = document.createElement('div');
      t.className = 'ms-toast';
      t.textContent = msg;
      root.appendChild(t);
      setTimeout(function () { t.style.opacity = 0; }, 1400);
      setTimeout(function () { t.remove(); }, 1800);
    }
    function defOf(it) { return isPath(it) ? SH.pathMap[it.ptype] : SH.map[it.type]; }
    function zoneable(it) { var d = defOf(it); return !!(d && (d.zone || it.zoneId)); }

    /* ---------------- 风险计算 ---------------- */
    function alarmsOf(zoneId) {
      if (!zoneId) return [];
      return S.alarms.filter(function (a) { return a.zoneId === zoneId; });
    }
    function riskOf(it) {
      var lv = 0, al = alarmsOf(it.zoneId);
      al.forEach(function (a) { if (!lv || a.level < lv) lv = a.level; });
      var alarmLv = lv;
      if (cv().showBaseRisk && it.baseRisk && (!lv || it.baseRisk < lv)) lv = +it.baseRisk;
      return { lv: lv, alarm: alarmLv, count: al.length };
    }
    function zones() {
      var map = {}, list = [];
      items().forEach(function (it) {
        if (!it.zoneId) return;
        var z = map[it.zoneId];
        if (!z) { z = map[it.zoneId] = { zoneId: it.zoneId, name: it.name, items: [], base: 0 }; list.push(z); }
        z.items.push(it);
        if (it.baseRisk && (!z.base || it.baseRisk < z.base)) z.base = +it.baseRisk;
      });
      list.forEach(function (z) {
        z.alarms = alarmsOf(z.zoneId);
        var lv = 0;
        z.alarms.forEach(function (a) { if (!lv || a.level < lv) lv = a.level; });
        z.alarmLv = lv;
        if (cv().showBaseRisk && z.base && (!lv || z.base < lv)) lv = z.base;
        z.lv = lv;
      });
      return list;
    }

    /* ---------------- 视图 ---------------- */
    function stageSize() { var r = R.stage.getBoundingClientRect(); return { w: r.width || 800, h: r.height || 600, l: r.left, t: r.top }; }
    function setView(k, tx, ty) {
      S.k = clamp(k, 0.08, 8);
      S.tx = tx; S.ty = ty;
      R.vp.setAttribute('transform', 'translate(' + fx(S.tx) + ',' + fx(S.ty) + ') scale(' + S.k.toFixed(4) + ')');
      scheduleOverlay();
    }
    function toLocal(e) { var s = stageSize(); return [(e.clientX - s.l - S.tx) / S.k, (e.clientY - s.t - S.ty) / S.k]; }
    function toWorld(e) { var p = toLocal(e); return iso.unproj(p[0], p[1]); }
    function groundBounds() {
      var c = cv(), b = null;
      [[0, 0], [c.cols, 0], [c.cols, c.rows], [0, c.rows]].forEach(function (p) {
        var s = iso.proj(p[0], p[1], 0);
        b = unionB(b, { x0: s[0], y0: s[1], x1: s[0], y1: s[1] });
      });
      return b;
    }
    function contentBounds() {
      var b = null;
      for (var id in S.itemBounds) b = unionB(b, S.itemBounds[id]);
      return b || groundBounds();
    }
    function fitBounds(b, padPx, animate) {
      var s = stageSize(), pw = padPx || 40;
      var bw = Math.max(40, b.x1 - b.x0), bh = Math.max(40, b.y1 - b.y0);
      var offL = S.mode === 'preview' && !S.canvasOnly && s.w > 900 ? 320 : 0;
      var k = clamp(Math.min((s.w - offL - pw * 2) / bw, (s.h - pw * 2) / bh), 0.08, 4);
      var cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      var tx = offL + (s.w - offL) / 2 - cx * k, ty = s.h / 2 - cy * k;
      if (animate) animateView(k, tx, ty); else setView(k, tx, ty);
    }
    function fit(animate) { fitBounds(contentBounds(), 50, animate); }
    function animateView(k, tx, ty) {
      var k0 = S.k, x0 = S.tx, y0 = S.ty, t0 = performance.now(), D = 450;
      function step(now) {
        var t = clamp((now - t0) / D, 0, 1), e = 1 - Math.pow(1 - t, 3);
        setView(k0 + (k - k0) * e, x0 + (tx - x0) * e, y0 + (ty - y0) * e);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    function zoomAt(f, mx, my) {
      var k2 = clamp(S.k * f, 0.08, 8);
      setView(k2, mx - ((mx - S.tx) * k2) / S.k, my - ((my - S.ty) * k2) / S.k);
    }

    /* ---------------- 渲染 ---------------- */
    function keyOf(it) {
      return isPath(it)
        ? 'p|' + it.ptype + '|' + JSON.stringify(it.pts) + '|' + it.width + '|' + it.h + '|' + it.h2
        : 's|' + it.type + '|' + it.x + '|' + it.y + '|' + it.w + '|' + it.d + '|' + it.h + '|' + it.rot;
    }
    function piecesOf(it) {
      var k = keyOf(it), c = S.cache[it.id];
      if (c && c.key === k) return c.pieces;
      var p = isPath(it) ? pathPieces(it) : shapePieces(it);
      S.cache[it.id] = { key: k, pieces: p };
      return p;
    }

    function renderGrid() {
      var c = cv(), d1 = '', d2 = '', i, a, b;
      for (i = 0; i <= c.cols; i++) {
        a = iso.proj(i, 0, 0); b = iso.proj(i, c.rows, 0);
        var s = 'M' + fx(a[0]) + ' ' + fx(a[1]) + 'L' + fx(b[0]) + ' ' + fx(b[1]);
        if (i % 5 === 0) d2 += s; else d1 += s;
      }
      for (i = 0; i <= c.rows; i++) {
        a = iso.proj(0, i, 0); b = iso.proj(c.cols, i, 0);
        var s2 = 'M' + fx(a[0]) + ' ' + fx(a[1]) + 'L' + fx(b[0]) + ' ' + fx(b[1]);
        if (i % 5 === 0) d2 += s2; else d1 += s2;
      }
      var g = [[0, 0], [c.cols, 0], [c.cols, c.rows], [0, c.rows]].map(function (p) { var s = iso.proj(p[0], p[1], 0); return fx(s[0]) + ',' + fx(s[1]); }).join(' ');
      var lbl = '';
      for (i = 0; i <= c.cols; i += 10) { a = iso.proj(i, -1.2, 0); lbl += '<text class="ms-axis-t" x="' + fx(a[0]) + '" y="' + fx(a[1]) + '" text-anchor="middle">' + i + '</text>'; }
      for (i = 10; i <= c.rows; i += 10) { a = iso.proj(-1.2, i, 0); lbl += '<text class="ms-axis-t" x="' + fx(a[0]) + '" y="' + fx(a[1]) + '" text-anchor="middle">' + i + '</text>'; }
      R.grid.innerHTML = '<polygon class="ms-ground" points="' + g + '"/><path class="ms-grid" d="' + d1 + '"/><path class="ms-grid major" d="' + d2 + '"/>' + lbl;
    }

    function renderScene() {
      var all = [], idx = {};
      S.itemBounds = {};
      items().forEach(function (it, i) {
        idx[it.id] = i;
        piecesOf(it).forEach(function (p) {
          all.push(p);
          S.itemBounds[it.id] = unionB(S.itemBounds[it.id], p.bounds);
        });
      });
      var g0 = all.filter(function (p) { return p.layer === 0; }).sort(function (a, b) { return a.sub - b.sub || idx[a.id] - idx[b.id]; });
      var g1 = topo(all.filter(function (p) { return p.layer !== 0; }));
      var html = '';
      g0.concat(g1).forEach(function (p) { html += '<g class="ms-item" data-id="' + p.id + '">' + p.html + '</g>'; });
      R.scene.innerHTML = html;
      applyClasses();
      renderOverlay();
    }

    function itemClass(it) {
      var c = 'ms-item', d = defOf(it);
      if (isPath(it)) c += ' p-' + it.ptype;
      else if (d && d.tint) c += ' tint-' + d.tint;
      if (zoneable(it)) c += ' zoneable';
      var r = riskOf(it);
      if (r.lv) c += ' risk-' + r.lv;
      if (r.alarm) c += ' alarm';
      if (S.sel.indexOf(it.id) >= 0 && S.mode === 'edit') c += ' sel';
      return { cls: c, risk: r };
    }
    function applyClasses() {
      var nodes = R.scene.children;
      for (var i = 0; i < nodes.length; i++) {
        var g = nodes[i], it = byId(g.getAttribute('data-id'));
        if (!it) continue;
        var ic = itemClass(it);
        g.setAttribute('class', ic.cls);
        if (it.color && !ic.risk.lv) g.style.setProperty('--c', it.color);
        else g.style.removeProperty('--c');
      }
      root.style.setProperty('--ms-glow', num(cv().glow, 1));
      root.classList.toggle('no-hidden', !cv().showHidden);
      root.classList.toggle('no-labels', !cv().showLabels);
    }

    function scheduleRender() {
      if (S.raf) return;
      S.raf = requestAnimationFrame(function () { S.raf = 0; renderScene(); });
    }
    function scheduleOverlay() {
      if (S.rafO) return;
      S.rafO = requestAnimationFrame(function () { S.rafO = 0; renderOverlay(); });
    }

    // 标签 / 告警波纹 / 预警气泡引线 / 编辑手柄
    function renderOverlay() {
      var k = S.k, inv = 1 / k, under = '', over = '', isSketch = cv().theme === 'sketch';
      var calloutDone = {};
      items().forEach(function (it) {
        var b = S.itemBounds[it.id];
        if (!b) return;
        var r = riskOf(it), col = r.lv ? RISK[r.lv].color : null;
        var gx, gy, ax, ay, rr = 2;
        if (isPath(it)) {
          if (it.ptype === 'area') {
            var cx = 0, cy = 0, n = it.pts.length;
            it.pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
            cx /= n; cy /= n;
            var sc = iso.proj(cx + (it.lx || 0), cy + (it.ly || 0), 0);
            gx = sc[0]; gy = sc[1]; ax = sc[0]; ay = sc[1];
            var bb = pathBox(it.pts, 0);
            rr = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) * 0.35;
          } else {
            var m = midOf(it.pts), zz = it.ptype === 'belt' ? (num(it.h, 0) + num(it.h2, it.h)) / 2 + 1 : num(it.h, 0);
            var sp = iso.proj(m[0], m[1], zz), sg = iso.proj(m[0], m[1], 0);
            ax = sp[0]; ay = sp[1]; gx = sg[0]; gy = sg[1];
          }
        } else {
          var f = fpOf(it), c = iso.proj(f.x0 + f.fw / 2 + (it.lx || 0), f.y0 + f.fd / 2 + (it.ly || 0), 0);
          gx = c[0]; gy = c[1];
          ax = isSketch ? c[0] : (b.x0 + b.x1) / 2;
          ay = isSketch ? c[1] + 10 : b.y0;
          rr = Math.max(f.fw, f.fd) * 0.62;
        }
        if (r.alarm && !isSketch) {
          var rx = rr * 1.22 * T, ry = rr * 0.707 * T;
          under += '<g data-id="' + it.id + '" style="--rc:' + RISK[r.alarm].color + '"><ellipse class="ms-ripple" cx="' + fx(gx) + '" cy="' + fx(gy) + '" rx="' + fx(rx) + '" ry="' + fx(ry) + '"/><ellipse class="ms-ripple d2" cx="' + fx(gx) + '" cy="' + fx(gy) + '" rx="' + fx(rx) + '" ry="' + fx(ry) + '"/></g>';
        }
        // 区域名称白底标签牌（贴合参考图“火工品仓库 / 一号井 / 办公楼 / 堆存区 / 维修场 / 大门”）
        if (it.showLabel && it.name) {
          var txt = it.name, tw = textW(txt) * (isSketch ? 1.18 : 1) + (isSketch ? 24 : 16);
          var th = isSketch ? 26 : 18, lift = isSketch ? 0 : 26;
          var cls = 'ms-label' + (isSketch ? ' zone' : '') + (r.lv ? '' : ' normal');
          over += '<g data-id="' + it.id + '"><g class="' + cls + '" style="' + (col ? '--lc:' + col : '') + '" transform="translate(' + fx(ax) + ',' + fx(ay) + ') scale(' + inv.toFixed(4) + ')">' +
            (isSketch ? '' : '<line x1="0" y1="0" x2="0" y2="' + -(lift - 9) + '"/>') +
            '<rect x="' + fx(-tw / 2) + '" y="' + -(lift + th / 2) + '" width="' + fx(tw) + '" height="' + th + '" rx="' + (isSketch ? 5 : 3) + '"/>' +
            '<text x="0" y="' + -lift + '">' + esc(txt) + '</text>' +
            (!isSketch && r.count ? '<g class="ms-badge" style="--rc:' + RISK[r.alarm].color + '"><circle cx="' + fx(tw / 2) + '" cy="' + -(lift + th / 2) + '" r="8"/><text x="' + fx(tw / 2) + '" y="' + -(lift + th / 2) + '">' + (r.count > 99 ? '99+' : r.count) + '</text></g>' : '') +
            '</g></g>';
        }
        // 顶部彩色预警引线气泡（贴合参考图“⚠ 重大预警 2 / 较大预警 1 / 一般预警 3”）
        if (r.alarm && it.zoneId && !calloutDone[it.zoneId]) {
          // 优先锚定在该区域的主建筑（非区域底板）上
          var zoneItems = items().filter(function (x) { return x.zoneId === it.zoneId; });
          var anchor = zoneItems.filter(function (x) { return !isPath(x) && x.type !== 'zone' && x.type !== 'camera'; })[0] || it;
          var ab = S.itemBounds[anchor.id] || b;
          calloutDone[it.zoneId] = 1;
          var dotX = (ab.x0 + ab.x1) / 2 + (anchor.cxOff || 0);
          var dotY = ab.y0 + (ab.y1 - ab.y0) * 0.28 + (anchor.cyOff || 0);
          var dir = anchor.cDir || (dotX > 0 ? 1 : -1);
          var dx = dir * 24, dy = -44;
          var wtxt = RISK[r.alarm].warn + ' ' + r.count;
          var bw = textW(wtxt) * 1.1 + 38, bh = 26;
          var bx = dx + (dir > 0 ? -16 : -bw + 16), by = dy - bh;
          var rc = RISK[r.alarm].color;
          var triX = bx + 15, triY = by + bh / 2;
          over += '<g class="ms-callout" data-id="' + anchor.id + '" data-callout="' + esc(it.zoneId) + '" style="--rc:' + rc + '" transform="translate(' + fx(dotX) + ',' + fx(dotY) + ') scale(' + inv.toFixed(4) + ')">' +
            '<line x1="0" y1="0" x2="' + fx(dx) + '" y2="' + fx(dy) + '"/>' +
            '<circle cx="0" cy="0" r="4"/>' +
            '<rect x="' + fx(bx) + '" y="' + fx(by) + '" width="' + fx(bw) + '" height="' + bh + '" rx="5"/>' +
            '<path d="M ' + fx(triX) + ' ' + fx(triY - 6.5) + ' L ' + fx(triX + 7) + ' ' + fx(triY + 5.5) + ' L ' + fx(triX - 7) + ' ' + fx(triY + 5.5) + ' Z"/>' +
            '<rect x="' + fx(triX - 0.9) + '" y="' + fx(triY - 2.8) + '" width="1.8" height="4.2" fill="' + rc + '"/>' +
            '<rect x="' + fx(triX - 0.9) + '" y="' + fx(triY + 2.4) + '" width="1.8" height="1.8" fill="' + rc + '"/>' +
            '<text x="' + fx(bx + 24 + (bw - 26) / 2) + '" y="' + fx(by + bh / 2 + 0.5) + '">' + esc(wtxt) + '</text>' +
            '</g>';
        }
      });
      R.under.innerHTML = under;
      R.over.innerHTML = over;
      renderEdit();
    }

    function diamond(x0, y0, x1, y1) {
      return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(function (p) { var s = iso.proj(p[0], p[1], 0); return fx(s[0]) + ',' + fx(s[1]); }).join(' ');
    }
    function renderEdit() {
      var html = '', inv = 1 / S.k, hr = 5 * inv;
      if (S.mode === 'edit') {
        S.sel.forEach(function (id) {
          var it = byId(id);
          if (!it) return;
          if (isPath(it)) {
            var b = S.itemBounds[id];
            if (b && S.sel.length > 1) html += '<g data-id="' + id + '"><rect class="ms-sel-box" x="' + fx(b.x0 - 4) + '" y="' + fx(b.y0 - 4) + '" width="' + fx(b.x1 - b.x0 + 8) + '" height="' + fx(b.y1 - b.y0 + 8) + '"/></g>';
          } else {
            var f = fpOf(it);
            html += '<g data-id="' + id + '"><polygon class="ms-sel-box" points="' + diamond(f.x0, f.y0, f.x1, f.y1) + '"/></g>';
          }
        });
        if (S.sel.length === 1 && !S.tool) {
          var it = byId(S.sel[0]);
          if (it && isPath(it)) {
            var pts = it.pts, closed = it.ptype === 'area', n = pts.length;
            for (var i = 0; i < n - (closed ? 0 : 1); i++) {
              var a = pts[i], c = pts[(i + 1) % n], m = iso.proj((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, 0);
              html += '<circle class="ms-handle mid" data-h="m" data-i="' + i + '" cx="' + fx(m[0]) + '" cy="' + fx(m[1]) + '" r="' + fx(hr * 0.8) + '"><title>拖拽插入顶点</title></circle>';
            }
            pts.forEach(function (p, i) {
              var s = iso.proj(p[0], p[1], 0);
              html += '<circle class="ms-handle" data-h="v" data-i="' + i + '" cx="' + fx(s[0]) + '" cy="' + fx(s[1]) + '" r="' + fx(hr) + '"><title>拖拽移动 · 双击删除</title></circle>';
            });
          } else if (it) {
            var f2 = fpOf(it), s2 = iso.proj(f2.x1, f2.y1, 0);
            html += '<g data-id="' + it.id + '"><circle class="ms-handle rs" data-h="rs" cx="' + fx(s2[0]) + '" cy="' + fx(s2[1]) + '" r="' + fx(hr) + '"><title>拖拽调整占地尺寸</title></circle></g>';
          }
        }
        // 放置预览
        if (S.cursor && (S.dragType || (S.tool && S.tool.kind === 'shape'))) {
          var type = S.dragType ? S.dragType.type : S.tool.type, D = SH.map[type];
          if (D) {
            var x = snap(S.cursor[0] - D.w / 2), y = snap(S.cursor[1] - D.d / 2);
            html += '<polygon class="ms-ghost-fp" points="' + diamond(x, y, x + D.w, y + D.d) + '"/>';
          }
        }
        // 折线绘制中
        if (S.draft && S.draft.length) {
          var dp = S.draft.slice();
          if (S.cursor) dp.push([snap(S.cursor[0]), snap(S.cursor[1])]);
          if (S.tool && S.tool.ptype === 'area' && dp.length > 2) dp.push(dp[0]);
          html += '<path class="ms-draft" d="' + dp.map(function (p, i) { var s = iso.proj(p[0], p[1], 0); return (i ? 'L' : 'M') + fx(s[0]) + ' ' + fx(s[1]); }).join('') + '"/>';
          S.draft.forEach(function (p) { var s = iso.proj(p[0], p[1], 0); html += '<circle class="ms-draft-pt" cx="' + fx(s[0]) + '" cy="' + fx(s[1]) + '" r="' + fx(3 * inv) + '"/>'; });
        }
        if (S.op && S.op.type === 'marquee' && S.op.cur) {
          var a0 = S.op.start, a1 = S.op.cur;
          html += '<rect class="ms-marquee" x="' + fx(Math.min(a0[0], a1[0])) + '" y="' + fx(Math.min(a0[1], a1[1])) + '" width="' + fx(Math.abs(a1[0] - a0[0])) + '" height="' + fx(Math.abs(a1[1] - a0[1])) + '"/>';
        }
      }
      R.edit.innerHTML = html;
    }

    /* ---------------- 历史记录 ---------------- */
    function snapshot() { return JSON.stringify(S.layout); }
    function commit(silent) {
      var s = snapshot();
      if (S.hist[S.hi] === s) return;
      S.hist = S.hist.slice(0, S.hi + 1);
      S.hist.push(s);
      if (S.hist.length > 100) S.hist.shift();
      S.hi = S.hist.length - 1;
      updateToolbar();
      if (!silent) emit('onChange', getLayout());
    }
    function restore(i) {
      if (i < 0 || i >= S.hist.length) return;
      S.hi = i;
      S.layout = JSON.parse(S.hist[i]);
      S.sel = S.sel.filter(byId);
      applyTheme();
      renderGrid();
      renderScene();
      renderProps();
      updateToolbar();
      emit('onChange', getLayout());
    }
    function undo() { restore(S.hi - 1); }
    function redo() { restore(S.hi + 1); }

    /* ---------------- 编辑操作 ---------------- */
    function nextZoneId() {
      var used = {}, n = 1;
      items().forEach(function (it) { if (it.zoneId) used[it.zoneId] = 1; });
      while (used['ZONE-' + (n < 10 ? '00' : n < 100 ? '0' : '') + n]) n++;
      return 'ZONE-' + (n < 10 ? '00' : n < 100 ? '0' : '') + n;
    }
    function addShape(type, cx, cy) {
      var D = SH.map[type];
      if (!D) return null;
      var it = {
        id: uid('s'), type: type, name: D.name,
        x: snap(cx - D.w / 2), y: snap(cy - D.d / 2), w: D.w, d: D.d, h: D.h, rot: 0,
        zoneId: D.zone && type !== 'camera' ? nextZoneId() : '', baseRisk: 0,
        showLabel: !!D.zone && type !== 'camera', sensors: '', owner: '', phone: '', note: ''
      };
      items().push(it);
      S.sel = [it.id];
      renderScene(); renderProps(); commit();
      return it;
    }
    function addPath(ptype, pts) {
      var P = SH.pathMap[ptype];
      var clean = [];
      pts.forEach(function (p) { var l = clean[clean.length - 1]; if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 1e-6) clean.push(p); });
      if (clean.length < (P.closed ? 3 : 2)) { toast(P.closed ? '多边形至少需要 3 个点' : '至少需要 2 个点'); return null; }
      var it = { id: uid('p'), kind: 'path', ptype: ptype, name: P.name, pts: clean, width: P.width, h: P.h, zoneId: P.zone ? nextZoneId() : '', baseRisk: 0, showLabel: ptype === 'area' || ptype === 'belt', sensors: '', owner: '', phone: '', note: '' };
      if (ptype === 'belt') it.h2 = P.h2;
      items().push(it);
      S.sel = [it.id];
      renderScene(); renderProps(); commit();
      return it;
    }
    function delSel() {
      if (!S.sel.length) return;
      S.layout.items = items().filter(function (it) { return S.sel.indexOf(it.id) < 0; });
      S.sel = [];
      renderScene(); renderProps(); commit();
    }
    function moveItem(it, dx, dy) {
      if (isPath(it)) it.pts = it.pts.map(function (p) { return [fx2(p[0] + dx), fx2(p[1] + dy)]; });
      else { it.x = fx2(it.x + dx); it.y = fx2(it.y + dy); }
    }
    function fx2(v) { return Math.round(v * 100) / 100; }
    function rotateSel() {
      if (!S.sel.length) return;
      S.sel.forEach(function (id) {
        var it = byId(id);
        if (!it) return;
        if (isPath(it)) {
          var b = pathBox(it.pts, 0), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
          it.pts = it.pts.map(function (p) { return [snap(cx - (p[1] - cy)), snap(cy + (p[0] - cx))]; });
        } else {
          var f = fpOf(it), ccx = f.x0 + f.fw / 2, ccy = f.y0 + f.fd / 2;
          it.rot = ((it.rot || 0) + 90) % 360;
          var f2 = fpOf(it);
          it.x = snap(ccx - f2.fw / 2); it.y = snap(ccy - f2.fd / 2);
        }
      });
      renderScene(); renderProps(); commit();
    }
    function copySel() {
      S.clip = S.sel.map(byId).filter(Boolean).map(clone);
      if (S.clip.length) toast('已复制 ' + S.clip.length + ' 个组件');
    }
    function paste() {
      if (!S.clip || !S.clip.length) return;
      var ids = [];
      S.clip = S.clip.map(function (o) {
        var it = clone(o);
        it.id = uid(isPath(it) ? 'p' : 's');
        moveItem(it, 2, 2);
        if (it.zoneId) it.zoneId = nextZoneId();
        items().push(it);
        ids.push(it.id);
        return clone(it);
      });
      S.sel = ids;
      renderScene(); renderProps(); commit();
    }
    function dupSel() { copySel(); paste(); }
    function selectAll() { S.sel = items().map(function (i) { return i.id; }); applyClasses(); renderEdit(); renderProps(); }
    function setSel(ids) { S.sel = ids; applyClasses(); renderEdit(); renderProps(); updateToolbar(); }
    function setTool(t) {
      S.tool = t;
      S.draft = t && t.kind === 'path' ? [] : null;
      R.stage.classList.toggle('drawing', !!t);
      root.querySelectorAll('.ms-lib-item').forEach(function (n) {
        var on = t && (n.getAttribute('data-type') === t.type || n.getAttribute('data-ptype') === t.ptype);
        n.classList.toggle('on', !!on);
      });
      if (t) { S.sel = []; applyClasses(); renderProps(); }
      renderEdit();
      updateToolbar();
    }
    function finishDraft() {
      if (!S.tool || S.tool.kind !== 'path' || !S.draft) return;
      var pts = S.draft.slice(), pt = S.tool.ptype;
      setTool(null);
      if (pts.length) addPath(pt, pts);
    }

    /* ---------------- 组件库 ---------------- */
    function buildLibrary() {
      var html = '';
      SH.cats.forEach(function (c) {
        html += '<div class="ms-cat" data-cat="' + c.key + '"><div class="ms-cat-h">' + c.name + '<b>▾</b></div><div class="ms-cat-b">';
        SH.list.filter(function (s) { return s.cat === c.key; }).forEach(function (s) {
          var r = iso.renderShape(s.build, { x: 0, y: 0, w: s.w, d: s.d, h: s.h, rot: 0 }, { hidden: false });
          html += '<div class="ms-lib-item" draggable="true" data-type="' + s.type + '" data-name="' + esc(s.name) + '" title="' + esc(s.name) + '">' +
            thumbSvg(r.html, r.bounds, s.tint ? 'tint-' + s.tint : '', 6) + '<span>' + esc(s.name) + '</span></div>';
        });
        html += '</div></div>';
      });
      html += '<div class="ms-cat" data-cat="path"><div class="ms-cat-h">折线工具（点击后在画布逐点绘制）<b>▾</b></div><div class="ms-cat-b">';
      var sample = [[0, 4], [4, 4], [6, 1.5], [10, 1.5]];
      SH.paths.forEach(function (P) {
        var fake = { id: 'thumb', kind: 'path', ptype: P.ptype, pts: P.closed ? [[0, 0], [7, 0], [8, 5], [1, 6]] : sample, width: P.width, h: P.h, h2: P.h2 != null ? P.h2 + 2 : P.h };
        var ps = pathPieces(fake), h = '', b = null;
        ps.forEach(function (p) { h += p.html; b = unionB(b, p.bounds); });
        html += '<div class="ms-lib-item path-tool" data-ptype="' + P.ptype + '" data-name="' + esc(P.name) + '" title="' + esc(P.name + '：' + P.desc) + '">' +
          thumbSvg(h, b, 'p-' + P.ptype, 6) + '<span>' + esc(P.name) + '</span></div>';
      });
      html += '</div></div>';
      R.lib.innerHTML = html;
    }

    /* ---------------- 指针交互 ---------------- */
    function hitItem(t) {
      var g = t && t.closest ? t.closest('#__none, .ms-item') : null;
      if (!g || !R.scene.contains(g)) return null;
      return byId(g.getAttribute('data-id'));
    }
    function startPan(e) {
      S.op = { type: 'pan', sx: e.clientX, sy: e.clientY, tx: S.tx, ty: S.ty, moved: false, item: hitItem(e.target) };
      R.stage.classList.add('panning');
    }
    function onDown(e) {
      R.stage.focus({ preventScroll: true });
      if (e.button === 1 || e.button === 2 || S.space) { e.preventDefault(); R.svg.setPointerCapture(e.pointerId); startPan(e); return; }
      if (e.button !== 0) return;
      R.svg.setPointerCapture(e.pointerId);
      var w = toWorld(e);
      if (S.mode === 'preview') { startPan(e); return; }
      if (S.tool && S.tool.kind === 'shape') {
        addShape(S.tool.type, w[0], w[1]);
        if (!e.shiftKey) setTool(null);
        return;
      }
      if (S.tool && S.tool.kind === 'path') {
        if (e.detail >= 2) { finishDraft(); return; }
        S.draft.push([snap(w[0]), snap(w[1])]);
        renderEdit();
        return;
      }
      var h = e.target.getAttribute && e.target.getAttribute('data-h');
      if (h) {
        var it0 = byId(S.sel[0]);
        if (!it0) return;
        if (h === 'v' && e.detail >= 2) {
          var min = it0.ptype === 'area' ? 3 : 2;
          if (it0.pts.length > min) { it0.pts.splice(+e.target.getAttribute('data-i'), 1); renderScene(); commit(); }
          return;
        }
        if (h === 'm') {
          var mi = +e.target.getAttribute('data-i');
          it0.pts.splice(mi + 1, 0, [snap(w[0]), snap(w[1])]);
          S.op = { type: 'vertex', id: it0.id, i: mi + 1 };
          renderScene();
          return;
        }
        S.op = h === 'v' ? { type: 'vertex', id: it0.id, i: +e.target.getAttribute('data-i') } : { type: 'resize', id: it0.id };
        return;
      }
      var it = hitItem(e.target);
      if (it) {
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          var i = S.sel.indexOf(it.id);
          if (i >= 0) S.sel.splice(i, 1); else S.sel.push(it.id);
          setSel(S.sel.slice());
          if (i >= 0) return;
        } else if (S.sel.indexOf(it.id) < 0) setSel([it.id]);
        S.op = { type: 'move', start: w, dx: 0, dy: 0, ids: S.sel.slice() };
        return;
      }
      if (!e.shiftKey) setSel([]);
      S.op = { type: 'marquee', start: toLocal(e), cur: null, add: e.shiftKey };
    }

    function onMove(e) {
      var w = toWorld(e);
      S.cursor = w;
      R.coord.textContent = 'X ' + w[0].toFixed(1) + '  Y ' + w[1].toFixed(1) + '  ·  ' + Math.round(S.k * 100) + '%';
      var op = S.op;
      if (!op) {
        if (S.mode === 'edit' && S.tool) renderEdit();
        return;
      }
      if (op.type === 'pan') {
        var mx = e.clientX - op.sx, my = e.clientY - op.sy;
        if (Math.abs(mx) + Math.abs(my) > 3) op.moved = true;
        setView(S.k, op.tx + mx, op.ty + my);
      } else if (op.type === 'move') {
        var dx = snap(w[0] - op.start[0]), dy = snap(w[1] - op.start[1]);
        if (dx === op.dx && dy === op.dy) return;
        op.dx = dx; op.dy = dy;
        var s = iso.proj(dx, dy, 0), tr = 'translate(' + fx(s[0]) + ',' + fx(s[1]) + ')';
        op.ids.forEach(function (id) {
          root.querySelectorAll('svg [data-id="' + id + '"]').forEach(function (n) { n.setAttribute('transform', tr); });
        });
      } else if (op.type === 'resize') {
        var it = byId(op.id), f = fpOf(it);
        var fw = Math.max(0.5, snap(w[0] - f.x0)), fd = Math.max(0.5, snap(w[1] - f.y0));
        var odd = ((Math.round((it.rot || 0) / 90) % 2) + 2) % 2 === 1;
        if (odd) { it.w = fd; it.d = fw; } else { it.w = fw; it.d = fd; }
        scheduleRender();
      } else if (op.type === 'vertex') {
        var p = byId(op.id);
        p.pts[op.i] = [snap(w[0]), snap(w[1])];
        scheduleRender();
      } else if (op.type === 'marquee') {
        op.cur = toLocal(e);
        renderEdit();
      }
    }

    function onUp(e) {
      var op = S.op;
      S.op = null;
      R.stage.classList.remove('panning');
      try { R.svg.releasePointerCapture(e.pointerId); } catch (er) { /* noop */ }
      if (!op) return;
      if (op.type === 'pan') {
        if (!op.moved && S.mode === 'preview' && e.button === 0) {
          if (op.item && zoneable(op.item)) openDrawer(op.item.id, true);
          else closeDrawer();
        }
      } else if (op.type === 'move') {
        if (op.dx || op.dy) {
          op.ids.forEach(function (id) { var it = byId(id); if (it) moveItem(it, op.dx, op.dy); });
          renderScene(); renderProps(); commit();
        }
      } else if (op.type === 'resize' || op.type === 'vertex') {
        renderScene(); renderProps(); commit();
      } else if (op.type === 'marquee') {
        if (op.cur) {
          var r = { x0: Math.min(op.start[0], op.cur[0]), y0: Math.min(op.start[1], op.cur[1]), x1: Math.max(op.start[0], op.cur[0]), y1: Math.max(op.start[1], op.cur[1]) };
          var ids = op.add ? S.sel.slice() : [];
          if (r.x1 - r.x0 > 3 || r.y1 - r.y0 > 3) {
            items().forEach(function (it) {
              var b = S.itemBounds[it.id];
              if (b && ovl(b, r) && ids.indexOf(it.id) < 0) ids.push(it.id);
            });
          }
          setSel(ids);
        } else renderEdit();
      }
    }

    function onWheel(e) {
      e.preventDefault();
      var s = stageSize();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - s.l, e.clientY - s.t);
    }

    function onKey(e) {
      var tag = (e.target && e.target.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
      if (!S.hover && !root.contains(document.activeElement)) return;
      var mod = e.ctrlKey || e.metaKey, k = e.key;
      if (k === ' ') { if (!S.space) { S.space = true; R.stage.classList.add('pan'); } e.preventDefault(); return; }
      if (k === 'Escape') {
        if (S.tool) setTool(null);
        else if (S.mode === 'preview') closeDrawer();
        else setSel([]);
        return;
      }
      if (S.mode !== 'edit') return;
      if (k === 'Enter' && S.tool && S.tool.kind === 'path') { finishDraft(); return; }
      if (k === 'Backspace' && S.draft && S.draft.length) { S.draft.pop(); renderEdit(); e.preventDefault(); return; }
      if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return; }
      if (mod && (k === 'c' || k === 'C')) { copySel(); return; }
      if (mod && (k === 'v' || k === 'V')) { paste(); return; }
      if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); dupSel(); return; }
      if (mod && (k === 'a' || k === 'A')) { e.preventDefault(); selectAll(); return; }
      if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); delSel(); return; }
      if ((k === 'r' || k === 'R') && !mod) { rotateSel(); return; }
      var arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (arrows[k] && S.sel.length) {
        e.preventDefault();
        var st = e.shiftKey ? 5 : num(cv().snap, 0) || 0.5;
        S.sel.forEach(function (id) { var it = byId(id); if (it) moveItem(it, arrows[k][0] * st, arrows[k][1] * st); });
        renderScene(); renderProps(); commit();
      }
    }
    function onKeyUp(e) { if (e.key === ' ') { S.space = false; R.stage.classList.remove('pan'); } }

    /* ---------------- 属性面板 ---------------- */
    function fld(label, f, val, type, extra, full) {
      var inp;
      if (type === 'select') {
        inp = '<select class="ms-select" data-f="' + f + '">' + extra.map(function (o) {
          return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(val) ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
        }).join('') + '</select>';
      } else if (type === 'textarea') {
        inp = '<textarea class="ms-textarea" data-f="' + f + '" placeholder="' + esc(extra || '') + '">' + esc(val) + '</textarea>';
      } else if (type === 'chk') {
        return '<div class="ms-f-row chk' + (full ? ' full' : '') + '"><input type="checkbox" data-f="' + f + '" data-t="chk" id="msf_' + f + '"' + (val ? ' checked' : '') + '><label for="msf_' + f + '">' + label + '</label></div>';
      } else if (type === 'ro') {
        inp = '<input class="ms-input" value="' + esc(val) + '" disabled>';
      } else {
        inp = '<input class="ms-input" data-f="' + f + '" data-t="' + (type || 'text') + '" type="' + (type === 'num' ? 'number' : type === 'color' ? 'color' : 'text') + '"' + (type === 'num' ? ' step="' + (extra || 0.5) + '"' : '') + ' value="' + esc(val) + '"' + (type === 'color' ? ' style="padding:2px"' : '') + '>';
      }
      return '<div class="ms-f-row' + (full ? ' full' : '') + '"><label>' + label + '</label>' + inp + '</div>';
    }
    function sec(title, body, key) {
      return '<div class="ms-sec" data-sec="' + key + '"><div class="ms-sec-h">' + title + '<span>▾</span></div><div class="ms-sec-b">' + body + '</div></div>';
    }
    function riskPick(val) {
      var btn = function (lv, t, c) { return '<button data-risk="' + lv + '" class="' + (+val === lv ? 'on' : '') + '" style="' + (c ? 'color:' + c : '') + '">' + t + '</button>'; };
      return '<div class="ms-f-row full"><label>固有风险等级（四色分级管控）</label><div class="ms-risk-pick">' + btn(0, '无', '') + btn(1, '红', RISK[1].color) + btn(2, '橙', RISK[2].color) + btn(3, '黄', RISK[3].color) + btn(4, '蓝', RISK[4].color) + '</div></div>';
    }
    function bindSec(it) {
      return sec('区域与报警绑定',
        fld('区域编码 zoneId（报警按此路由到该区域）', 'zoneId', it.zoneId || '', 'text', null, true) +
        riskPick(it.baseRisk || 0) +
        fld('关联测点 / 传感器', 'sensors', it.sensors || '', 'textarea', '如: CH4-01, CO-03, 视频通道 12', true) +
        fld('安全负责人', 'owner', it.owner || '') +
        fld('应急电话', 'phone', it.phone || '') +
        fld('备注', 'note', it.note || '', 'text', null, true), 'bind');
    }
    function renderProps() {
      if (S.mode !== 'edit') return;
      var html = '', title = '画布属性';
      if (S.sel.length > 1) {
        title = '多选（' + S.sel.length + '）';
        html = '<div class="ms-empty">已选中 ' + S.sel.length + ' 个组件<br>可整体拖拽、旋转、复制、删除</div>' +
          sec('批量设置', riskPick(-1) + fld('批量设置区域编码', 'zoneId', '', 'text', null, true), 'batch');
      } else if (S.sel.length === 1) {
        var it = byId(S.sel[0]), D = defOf(it);
        title = (D ? D.name : '组件') + ' 属性';
        if (isPath(it)) {
          var g = fld('名称', 'name', it.name || '', 'text', null, true) +
            fld('类型', '', D.name, 'ro') + fld('顶点数', '', it.pts.length, 'ro');
          if (it.ptype !== 'area' && it.ptype !== 'fence') g += fld('宽度', 'width', it.width, 'num', 0.1);
          if (it.ptype === 'belt') g += fld('起点高度', 'h', it.h, 'num', 0.5) + fld('终点高度', 'h2', it.h2, 'num', 0.5);
          else if (it.ptype === 'pipe' || it.ptype === 'fence') g += fld('高度', 'h', it.h, 'num', 0.1);
          g += fld('显示标签', 'showLabel', it.showLabel, 'chk') +
            fld('自定义线框色', 'color', it.color || '#22d3ee', 'color') +
            '<div class="ms-f-row full" style="color:var(--ms-text2);font-size:11px">拖拽圆点移动顶点 · 拖拽虚线圆点插入顶点 · 双击顶点删除</div>';
          html = sec('基础与几何', g, 'geo') + bindSec(it);
        } else {
          html = sec('基础与几何',
            fld('名称', 'name', it.name || '', 'text', null, true) +
            fld('类型', '', D ? D.name : it.type, 'ro') +
            fld('朝向', 'rot', it.rot || 0, 'select', [[0, '0°'], [90, '90°'], [180, '180°'], [270, '270°']]) +
            fld('X 坐标', 'x', it.x, 'num') + fld('Y 坐标', 'y', it.y, 'num') +
            fld('宽 W', 'w', it.w, 'num') + fld('深 D', 'd', it.d, 'num') +
            fld('高 H', 'h', it.h, 'num') + fld('显示标签', 'showLabel', it.showLabel, 'chk') +
            fld('自定义线框色', 'color', it.color || (D && D.tint === 'green' ? '#34d399' : '#22d3ee'), 'color') +
            '<div class="ms-f-row"><label>&nbsp;</label><button class="ms-btn" data-act="color-reset">恢复默认色</button></div>', 'geo') +
            (D && (D.zone || it.zoneId) ? bindSec(it) : sec('区域与报警绑定', '<div class="ms-f-row full" style="color:var(--ms-text2)">点缀组件默认不参与风险研判，如需绑定请填写区域编码</div>' + fld('区域编码 zoneId', 'zoneId', it.zoneId || '', 'text', null, true), 'bind'));
        }
      } else {
        var c = cv();
        html = sec('画布设置',
          fld('标题', 'c.title', c.title, 'text', null, true) +
          fld('网格列数', 'c.cols', c.cols, 'num', 1) + fld('网格行数', 'c.rows', c.rows, 'num', 1) +
          fld('主题', 'c.theme', c.theme, 'select', [['sketch', '线稿浅色（参考图）'], ['dark', '暗黑大屏'], ['blueprint', '工程蓝图']]) +
          fld('吸附步长', 'c.snap', c.snap, 'select', [[1, '1 格'], [0.5, '0.5 格'], [0.25, '0.25 格'], [0, '关闭']]) +
          fld('显示组件标签', 'c.showLabels', c.showLabels, 'chk', null, true) +
          fld('显示背面透视虚线', 'c.showHidden', c.showHidden, 'chk', null, true) +
          fld('平时显示固有风险色', 'c.showBaseRisk', c.showBaseRisk, 'chk', null, true) +
          '<div class="ms-f-row full"><label>报警发光强度</label><input type="range" min="0" max="3" step="0.5" data-f="c.glow" data-t="num" value="' + c.glow + '"></div>', 'canvas') +
          sec('操作说明', '<div class="ms-kbd" style="grid-column:1/-1;padding:0">' +
            '<b>拖拽/点击</b><span>从左侧组件库放置（Shift 连续放置）</span>' +
            '<b>折线工具</b><span>单击加点 · 双击/Enter 完成 · Backspace 撤点</span>' +
            '<b>空格+拖拽</b><span>平移画布（或右键/中键拖拽）</span>' +
            '<b>滚轮</b><span>缩放</span>' +
            '<b>框选/Shift</b><span>多选</span>' +
            '<b>R</b><span>旋转 90°</span>' +
            '<b>方向键</b><span>微调位置（Shift ×5）</span>' +
            '<b>Ctrl+C/V/D</b><span>复制 / 粘贴 / 原位复制</span>' +
            '<b>Ctrl+Z / Y</b><span>撤销 / 重做</span>' +
            '<b>Delete</b><span>删除</span></div>', 'help') +
          '<div class="ms-empty">共 ' + items().length + ' 个组件 · ' + zones().length + ' 个监测区域</div>';
      }
      R.propTitle.textContent = title;
      R.props.innerHTML = html;
    }

    function onPropInput(e, isChange) {
      var t = e.target, f = t.getAttribute('data-f');
      if (!f) return;
      var tp = t.getAttribute('data-t'), v;
      if (tp === 'chk') v = t.checked;
      else if (tp === 'num') v = num(t.value, 0);
      else v = t.value;
      if (f.indexOf('c.') === 0) {
        var key = f.slice(2), c = cv();
        if (key === 'snap') v = num(v, 0);
        if (key === 'cols' || key === 'rows') v = clamp(Math.round(v), 10, 300);
        c[key] = v;
        if (key === 'theme') applyTheme();
        if (key === 'title') R.title.textContent = v;
        if (key === 'cols' || key === 'rows') renderGrid();
        applyClasses(); renderOverlay();
        if (isChange || tp === 'chk' || t.tagName === 'SELECT') commit();
        return;
      }
      var targets = S.sel.map(byId).filter(Boolean);
      if (!targets.length) return;
      if (S.sel.length > 1 && f === 'zoneId' && !isChange) return;
      targets.forEach(function (it) {
        if (f === 'rot') {
          var fp0 = fpOf(it), cx = fp0.x0 + fp0.fw / 2, cy = fp0.y0 + fp0.fd / 2;
          it.rot = +v;
          var f2 = fpOf(it);
          it.x = snap(cx - f2.fw / 2); it.y = snap(cy - f2.fd / 2);
        } else if (f === 'w' || f === 'd' || f === 'h' || f === 'width' || f === 'h2') {
          it[f] = Math.max(f === 'h' || f === 'h2' ? 0 : 0.1, v);
        } else it[f] = v;
      });
      if (['name', 'sensors', 'owner', 'phone', 'note', 'showLabel', 'zoneId'].indexOf(f) >= 0) { applyClasses(); renderOverlay(); } else if (f === 'color') applyClasses();
      else scheduleRender();
      if (isChange || tp === 'chk' || t.tagName === 'SELECT' || tp === 'color') { commit(); if (f === 'rot') renderProps(); }
    }

    /* ---------------- 预览：HUD / 抽屉 / 模拟器 ---------------- */
    function renderHud() {
      if (S.mode !== 'preview') return;
      var zs = zones(), cnt = [0, 0, 0, 0, 0], worst = 0;
      zs.forEach(function (z) { cnt[z.lv]++; if (z.lv && (!worst || z.lv < worst)) worst = z.lv; });
      var now = new Date();
      var al = S.alarms.slice().sort(function (a, b) { return a.level - b.level || new Date(b.time) - new Date(a.time); });
      var zmap = {};
      zs.forEach(function (z) { zmap[z.zoneId] = z; });
      var stats = [1, 2, 3, 4].map(function (lv) {
        return '<div class="ms-stat" style="border-color:' + RISK[lv].color + '66;color:' + RISK[lv].color + '"><b>' + cnt[lv] + '</b><span>' + RISK[lv].name + '</span></div>';
      }).join('');
      var list = al.length ? al.map(function (a) {
        var z = zmap[a.zoneId];
        return '<div class="ms-alarm" data-alarm="' + esc(a.id) + '"><i class="dot" style="background:' + RISK[a.level].color + ';box-shadow:0 0 6px ' + RISK[a.level].color + '"></i><div class="bd">' +
          '<div class="t1"><b>' + esc(a.type) + '</b><small>' + fmtTime(a.time) + '</small></div>' +
          '<div class="t2">' + esc(z ? z.name : a.zoneId || '未绑定区域') + (a.message ? ' · ' + esc(a.message) : '') + '</div></div></div>';
      }).join('') : '<div class="ms-alarm-empty">✓ 暂无报警，全矿运行正常</div>';
      R.hud.innerHTML =
        '<div class="ms-card"><div class="ms-card-h">安全态势总览<small data-ref="clock">' + fmtDate(now) + '</small></div>' +
        '<div class="ms-stats">' + stats + '</div>' +
        '<div class="ms-overall"><span>全矿态势</span><span class="lv" style="background:' + (worst ? RISK[worst].color : '#10b981') + '">' + (worst ? RISK[worst].name : '安全') + '</span>' +
        '<small style="color:var(--ms-text2)">区域 ' + zs.length + ' · 报警 ' + S.alarms.length + '</small></div></div>' +
        '<div class="ms-card" style="display:flex;flex-direction:column;min-height:0"><div class="ms-card-h">实时报警<small>' + S.alarms.length + ' 条</small></div><div class="ms-alarm-list ms-scroll">' + list + '</div></div>';
    }
    function openDrawer(id, emitIt) {
      S.drawerId = id;
      renderDrawer();
      var it = byId(id);
      if (emitIt && it) emit('onSelectZone', zoneInfo(it));
    }
    function closeDrawer() { S.drawerId = null; R.drawer.classList.remove('open'); }
    function zoneInfo(it) {
      var r = riskOf(it);
      return { item: clone(it), zoneId: it.zoneId, name: it.name, risk: r.lv, riskName: RISK[r.lv].name, alarms: alarmsOf(it.zoneId).map(function (a) { return a.raw; }) };
    }
    function renderDrawer() {
      var it = S.drawerId && byId(S.drawerId);
      if (!it || S.mode !== 'preview') { R.drawer.classList.remove('open'); return; }
      var r = riskOf(it), D = defOf(it), al = alarmsOf(it.zoneId);
      var tag = function (lv) { return '<span class="ms-tag" style="background:' + (lv ? RISK[lv].color : '#10b981') + '">' + (lv ? RISK[lv].name : '正常') + '</span>'; };
      R.drawer.innerHTML = '<div class="ms-card"><div class="ms-card-h"><span>' + esc(it.name) + '</span><span class="ms-x" data-act="drawer-close">×</span></div>' +
        '<div class="ms-kv">' +
        '<span>当前态势</span><div>' + tag(r.lv) + '</div>' +
        '<span>区域编码</span><div>' + esc(it.zoneId || '-') + '</div>' +
        '<span>设施类型</span><div>' + esc(D ? D.name : '-') + '</div>' +
        '<span>固有风险</span><div>' + (it.baseRisk ? tag(+it.baseRisk) : '-') + '</div>' +
        '<span>安全负责人</span><div>' + esc(it.owner || '-') + '</div>' +
        '<span>应急电话</span><div>' + esc(it.phone || '-') + '</div>' +
        '<span>关联测点</span><div>' + esc(it.sensors || '-') + '</div>' +
        (it.note ? '<span>备注</span><div>' + esc(it.note) + '</div>' : '') +
        '</div><div class="ms-card-h" style="border-top:1px solid var(--ms-border)">区域报警<small>' + al.length + ' 条</small></div>' +
        '<div class="ms-alarm-list ms-scroll">' + (al.length ? al.map(function (a) {
          return '<div class="ms-alarm" data-alarm="' + esc(a.id) + '"><i class="dot" style="background:' + RISK[a.level].color + '"></i><div class="bd"><div class="t1"><b>' + esc(a.type) + '</b><small>' + fmtTime(a.time) + '</small></div>' +
            '<div class="t2">' + RISK[a.level].name + (a.message ? ' · ' + esc(a.message) : '') + '</div></div>' +
            '<button class="ms-btn" data-act="ack" data-id="' + esc(a.id) + '" style="height:22px">消警</button></div>';
        }).join('') : '<div class="ms-alarm-empty">该区域暂无报警</div>') + '</div></div>';
      R.drawer.classList.add('open');
    }
    function renderSim() {
      var zs = zones();
      R.sim.style.display = S.simOpen && S.mode === 'preview' ? '' : 'none';
      if (!S.simOpen) return;
      var keep = {};
      R.sim.querySelectorAll('[data-s]').forEach(function (n) { keep[n.getAttribute('data-s')] = n.value; });
      R.sim.innerHTML = '<div class="ms-card"><div class="ms-card-h">报警模拟器<span class="ms-x" data-act="sim">×</span></div><div class="ms-sec-b">' +
        '<div class="ms-f-row full"><label>区域</label><select class="ms-select" data-s="zone">' + zs.map(function (z) { return '<option value="' + esc(z.zoneId) + '">' + esc(z.name + '（' + z.zoneId + '）') + '</option>'; }).join('') + '</select></div>' +
        '<div class="ms-f-row"><label>等级</label><select class="ms-select" data-s="level">' + [1, 2, 3, 4].map(function (l) { return '<option value="' + l + '">' + RISK[l].name + '</option>'; }).join('') + '</select></div>' +
        '<div class="ms-f-row"><label>类型</label><select class="ms-select" data-s="type">' + ALARM_TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></div>' +
        '<div class="ms-f-row full"><label>描述</label><input class="ms-input" data-s="msg" placeholder="如: CH4 1.2%（阈值 1.0%）"></div>' +
        '<div class="ms-f-row full" style="flex-direction:row;gap:6px"><button class="ms-btn primary" data-act="sim-add">添加报警</button><button class="ms-btn" data-act="sim-rand">随机 3 条</button><button class="ms-btn danger" data-act="clear-alarms">清空</button></div>' +
        '</div></div>';
      R.sim.querySelectorAll('[data-s]').forEach(function (n) { var k = n.getAttribute('data-s'); if (keep[k] != null && keep[k] !== '') n.value = keep[k]; });
    }

    function refreshStatus() {
      applyClasses();
      renderOverlay();
      renderHud();
      renderDrawer();
    }

    /* ---------------- 工具栏 / 模式 / 主题 ---------------- */
    function updateToolbar() {
      root.querySelectorAll('[data-act="mode-edit"]').forEach(function (b) { b.classList.toggle('on', S.mode === 'edit'); });
      root.querySelectorAll('[data-act="mode-preview"]').forEach(function (b) { b.classList.toggle('on', S.mode === 'preview'); });
      var q = function (a) { return root.querySelector('[data-act="' + a + '"]'); };
      if (q('undo')) q('undo').disabled = S.hi <= 0;
      if (q('redo')) q('redo').disabled = S.hi >= S.hist.length - 1;
      ['rotate', 'dup', 'del'].forEach(function (a) { if (q(a)) q(a).disabled = !S.sel.length; });
      if (q('sim')) q('sim').classList.toggle('on', S.simOpen);
      var hint = '';
      if (S.mode === 'edit') {
        if (S.tool && S.tool.kind === 'path') hint = '绘制「' + SH.pathMap[S.tool.ptype].name + '」：单击加点，双击/Enter 完成，Esc 取消';
        else if (S.tool) hint = '点击画布放置「' + SH.map[S.tool.type].name + '」，按住 Shift 连续放置，Esc 取消';
        else hint = '拖拽组件到画布 · 空格/右键拖拽平移 · 滚轮缩放';
      } else hint = '点击区域查看详情 · 拖拽平移 · 滚轮缩放';
      R.hint.textContent = hint;
    }
    function applyTheme() {
      var th = cv().theme || 'sketch';
      root.classList.toggle('theme-sketch', th === 'sketch');
      root.classList.toggle('theme-blueprint', th === 'blueprint');
      R.title.textContent = cv().title || DEFAULT_CANVAS.title;
    }
    function setMode(m) {
      m = m === 'preview' ? 'preview' : 'edit';
      if (readonly) m = 'preview';
      var changed = S.mode !== m;
      S.mode = m;
      root.classList.toggle('mode-edit', m === 'edit');
      root.classList.toggle('mode-preview', m === 'preview');
      setTool(null);
      if (m === 'preview') closeDrawer();
      requestAnimationFrame(function () {
        applyClasses(); renderOverlay(); renderProps(); renderHud(); renderSim(); updateToolbar();
        if (changed) fit(true);
      });
      if (changed) emit('onModeChange', m);
    }
    function renderLegend() {
      R.legend.innerHTML = '<b>风险等级图例</b>' + [1, 2, 3, 4].map(function (l) {
        return '<span><i style="background:' + RISK[l].color + 'b8"></i>' + RISK[l].name + '</span>';
      }).join('');
    }

    /* ---------------- 导入导出弹窗 ---------------- */
    function modal(title, text, okText, onOk, extraBtn) {
      var m = document.createElement('div');
      m.className = 'ms-modal-mask';
      m.innerHTML = '<div class="ms-modal"><div class="ms-panel-h">' + esc(title) + '<span class="ms-x">×</span></div><textarea class="ms-textarea"></textarea><div class="ms-modal-f">' + (extraBtn || '') + '<button class="ms-btn" data-m="cancel">取消</button><button class="ms-btn primary" data-m="ok">' + esc(okText) + '</button></div></div>';
      var ta = m.querySelector('textarea');
      ta.value = text || '';
      m.addEventListener('click', function (e) {
        var a = e.target.getAttribute('data-m');
        if (e.target === m || e.target.classList.contains('ms-x') || a === 'cancel') m.remove();
        else if (a === 'ok') { if (onOk(ta.value, m) !== false) m.remove(); }
        else if (a === 'file') {
          var inp = document.createElement('input');
          inp.type = 'file'; inp.accept = '.json,application/json';
          inp.onchange = function () { var f = inp.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { ta.value = rd.result; }; rd.readAsText(f); };
          inp.click();
        } else if (a === 'download') {
          var blob = new Blob([ta.value], { type: 'application/json' }), url = URL.createObjectURL(blob), ln = document.createElement('a');
          ln.href = url; ln.download = 'mine-space-layout.json'; ln.click();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        }
      });
      root.appendChild(m);
      ta.focus();
    }

    function onAct(act, btn) {
      switch (act) {
        case 'mode-edit': setMode('edit'); break;
        case 'mode-preview': setMode('preview'); break;
        case 'undo': undo(); break;
        case 'redo': redo(); break;
        case 'rotate': rotateSel(); break;
        case 'dup': dupSel(); break;
        case 'del': delSel(); break;
        case 'fit': fit(true); break;
        case 'zoom-in': { var s = stageSize(); zoomAt(1.25, s.w / 2, s.h / 2); break; }
        case 'zoom-out': { var s2 = stageSize(); zoomAt(0.8, s2.w / 2, s2.h / 2); break; }
        case 'theme': {
          var order = ['sketch', 'dark', 'blueprint'];
          cv().theme = order[(order.indexOf(cv().theme) + 1) % order.length];
          applyTheme(); renderOverlay(); renderProps(); commit();
          break;
        }
        case 'fullscreen':
          if (document.fullscreenElement) document.exitFullscreen();
          else if (root.requestFullscreen) root.requestFullscreen();
          break;
        case 'export':
          navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(getLayout(), null, 2)).catch(function () {});
          modal('导出布局 JSON（已尝试复制到剪贴板）', JSON.stringify(getLayout(), null, 2), '关闭', function () {}, '<button class="ms-btn" data-m="download">下载文件</button>');
          break;
        case 'import':
          modal('导入布局 JSON', '', '导入', function (txt) {
            try { setLayout(JSON.parse(txt)); commit(); toast('导入成功'); } catch (e) { alert('JSON 解析失败：' + e.message); return false; }
          }, '<button class="ms-btn" data-m="file">从文件选择…</button>');
          break;
        case 'demo':
          if (!MS.demoLayout) { toast('未加载 demo-layout.js'); break; }
          if (items().length && !confirm('载入示例将替换当前画布，是否继续？')) break;
          setLayout(MS.demoLayout); commit(); break;
        case 'clear':
          if (!items().length || !confirm('确定清空画布上的全部组件？')) break;
          S.layout.items = []; S.sel = []; renderScene(); renderProps(); commit(); break;
        case 'sim': S.simOpen = !S.simOpen; renderSim(); updateToolbar(); break;
        case 'sim-add': {
          var z = R.sim.querySelector('[data-s="zone"]').value;
          if (!z) { toast('画布中没有绑定区域编码的组件'); break; }
          addAlarm({ zoneId: z, level: +R.sim.querySelector('[data-s="level"]').value, type: R.sim.querySelector('[data-s="type"]').value, message: R.sim.querySelector('[data-s="msg"]').value });
          focusZone(z);
          break;
        }
        case 'sim-rand': {
          var zs = zones();
          if (!zs.length) break;
          for (var i = 0; i < 3; i++) {
            var zz = zs[Math.floor(Math.random() * zs.length)];
            addAlarm({ zoneId: zz.zoneId, level: 1 + Math.floor(Math.random() * 4), type: ALARM_TYPES[Math.floor(Math.random() * ALARM_TYPES.length)], message: '模拟报警 #' + Math.floor(Math.random() * 1000) });
          }
          break;
        }
        case 'clear-alarms': clearAlarms(); break;
        case 'drawer-close': closeDrawer(); break;
        case 'ack': {
          var id = btn.getAttribute('data-id'), a = S.alarms.filter(function (x) { return x.id === id; })[0];
          if (a) { emit('onAlarmClear', a.raw); if (opts.autoClear !== false) removeAlarm(id); }
          break;
        }
        case 'color-reset': S.sel.map(byId).forEach(function (it) { if (it) delete it.color; }); applyClasses(); renderProps(); commit(); break;
      }
    }

    /* ---------------- 事件绑定 ---------------- */
    var L = [];
    function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); L.push([t, ev, fn, o]); }

    on(root, 'click', function (e) {
      var b = e.target.closest('[data-act]');
      if (b && root.contains(b) && !b.disabled) { onAct(b.getAttribute('data-act'), b); return; }
      var co = e.target.closest('[data-callout]');
      if (co) { focusZone(co.getAttribute('data-callout')); return; }
      var al = e.target.closest('[data-alarm]');
      if (al) {
        var a = S.alarms.filter(function (x) { return x.id === al.getAttribute('data-alarm'); })[0];
        if (a) { emit('onAlarmClick', a.raw); focusZone(a.zoneId); }
        return;
      }
      var sh = e.target.closest('.ms-sec-h, .ms-cat-h');
      if (sh) { sh.parentNode.classList.toggle('closed'); return; }
      var rk = e.target.closest('[data-risk]');
      if (rk) {
        var lv = +rk.getAttribute('data-risk');
        S.sel.map(byId).forEach(function (it) { if (it) it.baseRisk = lv; });
        refreshStatus(); renderProps(); commit();
        return;
      }
      var li = e.target.closest('.ms-lib-item');
      if (li) {
        var tp = li.getAttribute('data-type'), pt = li.getAttribute('data-ptype');
        var cur = S.tool && (S.tool.type === tp && tp || S.tool.ptype === pt && pt);
        if (cur) setTool(null);
        else setTool(tp ? { kind: 'shape', type: tp } : { kind: 'path', ptype: pt });
      }
    });
    on(R.props, 'input', function (e) { onPropInput(e, false); });
    on(R.props, 'change', function (e) { onPropInput(e, true); });
    on(R.search, 'input', function () {
      var q = R.search.value.trim().toLowerCase();
      R.lib.querySelectorAll('.ms-lib-item').forEach(function (n) {
        n.style.display = !q || n.getAttribute('data-name').toLowerCase().indexOf(q) >= 0 ? '' : 'none';
      });
      R.lib.querySelectorAll('.ms-cat').forEach(function (c) { if (q) c.classList.remove('closed'); });
    });
    on(R.lib, 'dragstart', function (e) {
      var li = e.target.closest('.ms-lib-item[data-type]');
      if (!li) { e.preventDefault(); return; }
      S.dragType = { type: li.getAttribute('data-type') };
      e.dataTransfer.setData('text/plain', S.dragType.type);
      e.dataTransfer.effectAllowed = 'copy';
    });
    on(R.lib, 'dragend', function () { S.dragType = null; renderEdit(); });
    on(R.stage, 'dragover', function (e) {
      if (!S.dragType) return;
      e.preventDefault();
      S.cursor = toWorld(e);
      renderEdit();
    });
    on(R.stage, 'dragleave', function () { S.cursor = null; renderEdit(); });
    on(R.stage, 'drop', function (e) {
      if (!S.dragType) return;
      e.preventDefault();
      var w = toWorld(e), t = S.dragType.type;
      S.dragType = null;
      addShape(t, w[0], w[1]);
    });
    on(R.svg, 'pointerdown', onDown);
    on(R.svg, 'pointermove', onMove);
    on(R.svg, 'pointerup', onUp);
    on(R.svg, 'pointercancel', onUp);
    on(R.svg, 'wheel', onWheel, { passive: false });
    on(R.svg, 'contextmenu', function (e) { e.preventDefault(); });
    on(R.svg, 'dblclick', function (e) { if (S.mode === 'edit' && S.tool && S.tool.kind === 'path') finishDraft(); });
    on(root, 'mouseenter', function () { S.hover = true; });
    on(root, 'mouseleave', function () { S.hover = false; S.cursor = null; if (S.tool) renderEdit(); });
    on(window, 'keydown', onKey);
    on(window, 'keyup', onKeyUp);
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function () {
      scheduleOverlay();
      if (S.canvasOnly) fit(false);
    }) : null;
    if (ro) ro.observe(R.stage);
    S.timers.push(setInterval(function () {
      var c = R.hud.querySelector('[data-ref="clock"]');
      if (c) c.textContent = fmtDate(new Date());
    }, 1000));

    /* ---------------- 对外 API ---------------- */
    function getLayout() { return clone(S.layout); }
    function setLayout(l) {
      S.layout = normalizeLayout(l);
      S.sel = [];
      S.cache = {};
      applyTheme(); renderGrid(); renderScene(); renderProps(); renderHud(); renderSim();
      requestAnimationFrame(function () { fit(false); });
    }
    function setAlarms(list) { S.alarms = (list || []).map(normAlarm); refreshStatus(); renderSim(); }
    function addAlarm(a) {
      var n = normAlarm(a);
      S.alarms = S.alarms.filter(function (x) { return x.id !== n.id; });
      S.alarms.push(n);
      refreshStatus();
      return n.id;
    }
    function removeAlarm(id) { S.alarms = S.alarms.filter(function (x) { return x.id !== String(id); }); refreshStatus(); }
    function clearAlarms() { S.alarms = []; refreshStatus(); }
    function focusZone(key) {
      var its = items().filter(function (it) { return it.zoneId === key || it.id === key; });
      if (!its.length) return false;
      var b = null;
      its.forEach(function (it) { if (S.itemBounds[it.id]) b = unionB(b, S.itemBounds[it.id]); });
      if (!b) return false;
      var s = stageSize(), offL = S.mode === 'preview' && s.w > 900 ? 320 : 0, offR = S.drawerId || S.mode === 'preview' ? 340 : 0;
      var vw = s.w - offL - offR, bw = Math.max(80, b.x1 - b.x0), bh = Math.max(80, b.y1 - b.y0);
      var k = clamp(Math.min(vw / bw, s.h / bh) * 0.45, 0.5, 2.6);
      var cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      animateView(k, offL + vw / 2 - cx * k, s.h / 2 - cy * k);
      setTimeout(function () {
        its.forEach(function (it) {
          R.scene.querySelectorAll('[data-id="' + it.id + '"]').forEach(function (g) {
            g.classList.remove('flash'); void g.getBoundingClientRect(); g.classList.add('flash');
            setTimeout(function () { g.classList.remove('flash'); }, 2800);
          });
        });
      }, 300);
      if (S.mode === 'preview') openDrawer(its[0].id, false);
      return true;
    }
    function getZoneStatus() {
      return zones().map(function (z) {
        return { zoneId: z.zoneId, name: z.name, risk: z.lv, riskName: RISK[z.lv].name, baseRisk: z.base, alarmCount: z.alarms.length };
      });
    }
    function destroy() {
      L.forEach(function (x) { x[0].removeEventListener(x[1], x[2], x[3]); });
      if (ro) ro.disconnect();
      S.timers.forEach(clearInterval);
      root.remove();
    }

    /* ---------------- 初始化 ---------------- */
    if (readonly) root.classList.add('readonly');
    buildLibrary();
    renderLegend();
    applyTheme();
    renderGrid();
    root.classList.add(S.mode === 'edit' ? 'mode-edit' : 'mode-preview');
    renderScene();
    commit(true);
    renderProps();
    renderHud();
    updateToolbar();
    requestAnimationFrame(function () { fit(false); });

    return {
      root: root,
      getLayout: getLayout,
      setLayout: function (l) { setLayout(l); commit(true); },
      setAlarms: setAlarms,
      addAlarm: addAlarm,
      removeAlarm: removeAlarm,
      clearAlarms: clearAlarms,
      getAlarms: function () { return S.alarms.map(function (a) { return a.raw; }); },
      setMode: setMode,
      getMode: function () { return S.mode; },
      focusZone: focusZone,
      getZoneStatus: getZoneStatus,
      fit: function () { fit(true); },
      setTheme: function (t) { cv().theme = t; applyTheme(); },
      undo: undo,
      redo: redo,
      destroy: destroy
    };
  }

  MS.create = create;
  MS.RISK = RISK;
  MS.version = '1.0.0';
})();
