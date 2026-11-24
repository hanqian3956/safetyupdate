/*!
 * MineSpace 示例布局：参考图煤矿安全四色空间态势图
 * 加载后通过 MineSpace.demoLayout 访问
 */
(function () {
  'use strict';
  var items = [];
  var n = 0;
  function S(type, name, x, y, w, d, h, zoneId, baseRisk, extra) {
    var it = { id: 'd' + (++n), type: type, name: name, x: x, y: y, w: w, d: d, h: h, rot: 0, zoneId: zoneId || '', baseRisk: baseRisk || 0, showLabel: false };
    for (var k in extra || {}) it[k] = extra[k];
    items.push(it);
    return it;
  }
  function P(ptype, name, pts, o) {
    var it = { id: 'd' + (++n), kind: 'path', ptype: ptype, name: name, pts: pts, zoneId: '', baseRisk: 0, showLabel: false };
    for (var k in o || {}) it[k] = o[k];
    items.push(it);
    return it;
  }
  function deco(type, x, y, extra) {
    var it = { id: 'd' + (++n), type: type, x: x, y: y, rot: 0, showLabel: false };
    for (var k in extra || {}) it[k] = extra[k];
    items.push(it);
  }

  /* =====================================================================
   *  1. 远景地形线框（远山 + 右上角露天矿坑阶梯）
   * ===================================================================== */
  deco('mountain', 1, 2, { w: 28, d: 9, h: 7.5 });
  deco('mountain', 2, 26, { w: 24, d: 8, h: 6.5, rot: 90 });
  deco('openPit', 28, 1, { w: 22, d: 13, h: 5.5 });

  /* =====================================================================
   *  2. 六大功能风险分区底板（带围栏 + 区域白底名称牌）
   * ===================================================================== */
  // 一号井（重大风险 · 红）
  P('area', '一号井', [[15, 13], [32, 13], [32, 28], [15, 28]], {
    zoneId: 'ZONE-SHAFT-1', baseRisk: 1, showLabel: true, lx: 2.5, ly: 2.5
  });
  // 火工品仓库（较大风险 · 橙）
  P('area', '火工品仓库', [[9, 31], [22, 31], [22, 43], [9, 43]], {
    zoneId: 'ZONE-EXP', baseRisk: 2, showLabel: true, lx: 1.8, ly: 1.5
  });
  // 办公楼（低风险 · 蓝）
  P('area', '办公楼', [[21, 46], [36, 46], [36, 60], [21, 60]], {
    zoneId: 'ZONE-OFFICE', baseRisk: 4, showLabel: true, lx: 1.5, ly: 1.2
  });
  // 维修场（低风险 · 蓝）
  P('area', '维修场', [[35, 14], [49, 14], [49, 26], [35, 26]], {
    zoneId: 'ZONE-WORKSHOP', baseRisk: 4, showLabel: true, lx: 1.2, ly: 1.2
  });
  // 堆存区（一般风险 · 黄）
  P('area', '堆存区', [[35, 29], [54, 29], [54, 46], [35, 46]], {
    zoneId: 'ZONE-YARD', baseRisk: 3, showLabel: true, lx: 1.5, ly: 1.8
  });
  // 大门（低风险 · 蓝）
  P('area', '大门', [[39, 50], [49, 50], [49, 56], [39, 56]], {
    zoneId: 'ZONE-GATE', baseRisk: 4, showLabel: true, fenced: false, lx: -0.6, ly: -0.5
  });

  /* =====================================================================
   *  3. 矿区道路网
   * ===================================================================== */
  P('road', '矿区外公路', [[18, 63], [59, 51]], { width: 3.4 });
  P('road', '进矿主干道', [[43.5, 56], [33.5, 44.5], [33.5, 29.5]], { width: 2.8 });
  P('road', '西侧支路', [[33.5, 44.5], [22.5, 44.5], [22.5, 30]], { width: 2.5 });
  P('road', '东侧支路', [[33.5, 29.5], [33.5, 14]], { width: 2.5 });

  /* =====================================================================
   *  4. 各区域内主体立体线框建筑与设备
   * ===================================================================== */
  // 一号井区域（主井井架 + 副井房 + 双联筒仓 + 走廊）
  S('headframe', '一号井主井架', 18, 16, 9.5, 8.5, 15.5, 'ZONE-SHAFT-1', 1, {
    sensors: '提升机 TS-01, 井口 CH4-01, CO-01', owner: '机电科 张工', phone: '0351-6001201',
    cDir: 1, cxOff: 12, cyOff: -8
  });
  S('silo', '井口原煤仓', 26.5, 14.2, 4.4, 2.2, 8.5, 'ZONE-SHAFT-1', 1, {
    sensors: '仓温 T-01, 料位 LV-01'
  });

  // 火工品仓库区域
  S('explosive', '火工品仓库', 11, 33, 9, 6.2, 3.8, 'ZONE-EXP', 2, {
    sensors: '红外对射 IR-01, 温湿度 TH-02, 视频 08', owner: '保卫科 王队', phone: '0351-6001110',
    cDir: -1, cxOff: -6, cyOff: -6
  });

  // 办公楼区域（办公楼 + 前广场车位）
  S('office', '综合办公楼', 23.5, 48, 10, 6.2, 6.8, 'ZONE-OFFICE', 4, {
    sensors: '消防烟感 SM-01~12', owner: '综合办 李主任', phone: '0351-6001000'
  });
  S('parking', '办公区车位', 28, 55, 6.5, 4, 0.8, 'ZONE-OFFICE', 4);

  // 维修场区域
  S('workshop', '机修大棚', 36.5, 15.8, 11, 7.2, 4.5, 'ZONE-WORKSHOP', 4, {
    sensors: '烟感 SM-21, 视频 15', owner: '机修厂 赵工', phone: '0351-6001308'
  });

  // 堆存区区域（挡墙 + 3座圆锥煤堆 + 桁架栈桥）
  S('coalYard', '原煤堆存区', 36.8, 30.8, 15.5, 13.2, 4.8, 'ZONE-YARD', 3, {
    sensors: '测温光纤 FT-01~03, CO-21, 喷淋联动', owner: '储运科 孙工', phone: '0351-6001502',
    cDir: 1, cxOff: -35, cyOff: 6
  });

  // 大门区域
  S('gate', '矿区大门', 39.5, 51, 9.2, 3.2, 4, 'ZONE-GATE', 4, {
    sensors: '车牌识别 01, 门禁道闸 02', owner: '保卫科', phone: '0351-6001001'
  });

  /* =====================================================================
   *  5. 绿植、路灯等点缀组件
   * ===================================================================== */
  // 道路两侧行道树
  [[24, 43], [27, 43], [30, 43], [32, 39], [32, 35], [32, 31],
   [22, 48], [22, 52], [22, 56], [26, 58.5], [31, 58.5],
   [49, 48], [52, 48], [55, 48]].forEach(function (p) {
    deco('tree', p[0], p[1], { w: 1.5, d: 1.5, h: 3.1 });
  });
  // 厂区路灯
  [[14, 29], [23, 29], [31, 29], [34.5, 25], [34.5, 36], [34.5, 43], [38, 49], [20, 45]].forEach(function (p) {
    deco('lamp', p[0], p[1], { w: 0.9, d: 0.9, h: 4 });
  });

  window.MineSpace = window.MineSpace || {};
  window.MineSpace.demoLayout = {
    version: 2,
    canvas: {
      cols: 64, rows: 64, theme: 'sketch', snap: 0.5,
      showLabels: true, showHidden: false, showBaseRisk: true, glow: 1,
      title: '某煤矿 · 空间安全态势一张图'
    },
    items: items
  };
  // 对应参考图中的 3 处预警气泡：一号井(重大预警 2)、火工品仓库(较大预警 1)、堆存区(一般预警 3)
  window.MineSpace.demoAlarms = [
    { id: 'A1', zoneId: 'ZONE-SHAFT-1', level: 1, type: '瓦斯浓度超限', message: '一号井井口 CH4 达 1.28%（阈值 1.0%）', time: Date.now() - 45 * 1000 },
    { id: 'A2', zoneId: 'ZONE-SHAFT-1', level: 1, type: '设备故障停机', message: '主提升机减速箱温度偏高告警', time: Date.now() - 120 * 1000 },
    { id: 'A3', zoneId: 'ZONE-EXP', level: 2, type: '人员违规闯入', message: '火工品仓库周界红外对射触发', time: Date.now() - 5 * 60 * 1000 },
    { id: 'A4', zoneId: 'ZONE-YARD', level: 3, type: '温度异常/自燃预警', message: '1# 煤堆内部测温 64℃', time: Date.now() - 12 * 60 * 1000 },
    { id: 'A5', zoneId: 'ZONE-YARD', level: 3, type: '粉尘浓度超限', message: '落煤栈桥粉尘传感器超标', time: Date.now() - 18 * 60 * 1000 },
    { id: 'A6', zoneId: 'ZONE-YARD', level: 3, type: 'AI识别:未戴安全帽', message: '堆存区南侧通道抓拍', time: Date.now() - 25 * 60 * 1000 }
  ];
})();
