// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 大六壬 古籍备查层 统一自包含求值器（兵战五十篇 / 景祐神定经 / 逐月神煞）
// 不引用 app.js 内部变量；所有课象经 ctx 传入：
//   ctx = { day:'甲子', si:[{xia,shang}×4], chuan:[初,中,末],
//           tp:{宫支→天盘支}, tjMap:{宫支→天将简称}, sui:太岁支, yue:月建支,
//           monthZhi:月建支(可省,默认取yue) }
// 命中收集；渲染/UI 由集成方做。node --check 必须通过。
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.lnGuJi = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  var ZHI_WX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };        // 前者克后者
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };    // 前者生后者
  var CHONG = { 子: '午', 丑: '未', 寅: '申', 卯: '酉', 辰: '戌', 巳: '亥', 午: '子', 未: '丑', 申: '寅', 酉: '卯', 戌: '辰', 亥: '巳' };
  var QIKE = { 寅: '巳', 巳: '申', 申: '寅', 丑: '戌', 戌: '未', 未: '丑', 子: '卯', 卯: '子', 辰: '辰', 午: '午', 酉: '酉', 亥: '亥' };
  var HAI6 = { 子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉' };
  var WX_MU = { 木: '未', 火: '戌', 金: '丑', 水: '辰', 土: '辰' };
  // 旬首支 → 旬空二支
  var XUNKONG = { 子: '戌亥', 戌: '申酉', 申: '午未', 午: '辰巳', 辰: '寅卯', 寅: '子丑' };
  // 日支三合 → 驿马
  var YIMA = { 申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' };
  // 日干 → 日德支（神定经·释德）
  var RIDE = { 甲: '寅', 乙: '申', 丙: '巳', 丁: '亥', 戊: '巳', 己: '寅', 庚: '申', 辛: '巳', 壬: '亥', 癸: '巳' };
  // 日干 → 游都支（十干神煞表）
  var YOUDU = { 甲: '丑', 乙: '子', 丙: '寅', 丁: '巳', 戊: '申', 己: '丑', 庚: '子', 辛: '寅', 壬: '巳', 癸: '申' };
  // 天将全称 → tjMap 简称
  var TJ_F2S = { 贵人: '贵', 螣蛇: '螣', 朱雀: '朱', 六合: '六', 勾陈: '勾', 青龙: '青', 天空: '空', 白虎: '白', 太常: '常', 玄武: '玄', 太阴: '阴', 天后: '后' };
  var TJ_FULL = ['贵人', '螣蛇', '朱雀', '六合', '勾陈', '青龙', '天空', '白虎', '太常', '玄武', '太阴', '天后'];
  var JIANG_JI = ['贵人', '六合', '青龙', '太常', '天后'];   // 吉将
  var JIANG_XIONG = ['螣蛇', '朱雀', '勾陈', '天空', '白虎', '玄武', '太阴']; // 八凶将(除天后)之在课常见者
  // 十二支别名 → 本支
  var ZHI_ALIAS = { 大吉: '丑', 小吉: '未', 天罡: '辰', 河魁: '戌', 登明: '亥', 神后: '子', 太冲: '卯', 功曹: '寅', 传送: '申', 从魁: '酉', 胜光: '午', 太乙: '巳' };
  var MENG = ['寅', '申', '巳', '亥'];
  var ZHONG = ['子', '午', '卯', '酉'];
  var JI = ['辰', '戌', '丑', '未'];

  function idxOf(z) { return ZHI.indexOf(z); }

  // 由 day(干支) 求旬空
  function xunkongOf(day) {
    if (!day || day.length < 2) return '';
    var gIdx = GAN.indexOf(day[0]), zIdx = idxOf(day[1]);
    if (gIdx < 0 || zIdx < 0) return '';
    // 旬首支 = 找到与日干同旬的地支（旬首地支序列：子戌申午辰寅 对应 旬首干甲）
    // 用 60 甲子序求旬首
    var jiazi = [];
    for (var i = 0; i < 60; i++) jiazi.push(GAN[i % 10] + ZHI[i % 12]);
    var pos = jiazi.indexOf(day);
    if (pos < 0) return '';
    var xunHead = jiazi[Math.floor(pos / 10) * 10];
    return XUNKONG[xunHead[1]] || '';
  }

  // 归一化 ctx，预计算课象状态
  function buildCtx(ctx) {
    ctx = ctx || {};
    var day = ctx.day || '甲子';
    var si = ctx.si || [];
    var chuan = ctx.chuan || [];
    var tp = ctx.tp || {};
    var tjMap = ctx.tjMap || {};
    var sui = ctx.sui || '';
    var yue = ctx.yue || ctx.monthZhi || '';
    var c = { day: day, si: si, chuan: chuan, tp: tp, tjMap: tjMap, sui: sui, yue: yue };
    c.dayGan = day[0]; c.dayZhi = day[1];
    c.set = {};
    si.forEach(function (k) { if (k.shang) c.set[k.shang] = 1; if (k.xia) c.set[k.xia] = 1; });
    chuan.forEach(function (x) { if (x) c.set[x] = 1; });
    c.gs = si[0] ? si[0].shang : '';       // 干上神
    c.gx = si[0] ? si[0].xia : '';
    c.zs = si[1] ? si[1].shang : '';       // 支上神
    c.zx = si[1] ? si[1].xia : '';
    c.c0 = chuan[0] || ''; c.c1 = chuan[1] || ''; c.c2 = chuan[2] || '';
    // 天将所乘：地盘宫 p 乘天盘神 tp[p]，天将 tjMap[p]
    c.godJiang = {};
    ZHI.forEach(function (p) { if (tp[p]) c.godJiang[tp[p]] = tjMap[p]; });
    c.xk = xunkongOf(day);
    c.xkSet = {};
    c.xk.split('').forEach(function (z) { c.xkSet[z] = 1; });
    c.ym = YIMA[c.dayZhi] || '';
    c.rde = RIDE[c.dayGan] || '';
    c.youdu = YOUDU[c.dayGan] || '';
    c.yuePo = CHONG[yue] || '';
    c.suiPo = CHONG[sui] || '';
    // 伏吟/返吟
    c.fuyin = ZHI.every(function (p) { return !tp[p] || tp[p] === p; });
    c.fanyin = ZHI.every(function (p) { return !tp[p] || tp[p] === CHONG[p]; });
    // 天盘辰(天罡)所临地盘
    c.gangPalace = '';
    ZHI.forEach(function (p) { if (tp[p] === '辰') c.gangPalace = p; });
    return c;
  }

  function hasSet(c, z) { return !!c.set[z]; }
  function inXk(c, z) { return !!c.xkSet[z]; }
  function strength(c, z) {
    if (!z) return '';
    var w = ZHI_WX[z], mw = ZHI_WX[c.yue];
    if (!w || !mw) return '';
    if (w === mw) return '旺';
    if (SHENG[mw] === w) return '相';
    if (KE[w] === mw) return '囚';
    if (KE[mw] === w) return '死';
    if (SHENG[w] === mw) return '休';
    return '';
  }
  function isWangXiang(c, z) { var s = strength(c, z); return s === '旺' || s === '相'; }
  function isQiuSi(c, z) { var s = strength(c, z); return s === '囚' || s === '死'; }
  // 课集是否含三刑对
  function hasXing(c) {
    var arr = Object.keys(c.set), done = {};
    for (var i = 0; i < arr.length; i++) for (var j = 0; j < arr.length; j++) {
      var a = arr[i], b = arr[j];
      if (QIKE[a] === b) { var k = [a, b].sort().join(''); if (!done[k]) return true; }
    }
    return false;
  }
  function hasHai(c) {
    var arr = Object.keys(c.set);
    for (var i = 0; i < arr.length; i++) for (var j = 0; j < arr.length; j++)
      if (HAI6[arr[i]] === arr[j]) return true;
    return false;
  }
  // 天将 J(全称) 是否乘神入课 / 临干 / 临支 / 临初传
  function jiangInKe(c, J) { var s = TJ_F2S[J]; return Object.keys(c.set).some(function (g) { return c.godJiang[g] === s; }); }
  function jiangOnGod(c, J, g) { return c.godJiang[g] === TJ_F2S[J]; }

  // cond 求值：cond 中出现的每个已知短语都须成立（AND）；无任何已知短语 → false（未命中不假装）
  function lnEval(cond, c) {
    if (!cond) return false;
    var hitsAny = false, allTrue = true;
    function test(phrase, pred) {
      if (cond.indexOf(phrase) >= 0) {
        hitsAny = true;
        if (!pred()) allTrue = false;
      }
    }
    // 太岁/月建
    test('太岁临课', function () { return hasSet(c, c.sui); });
    test('太岁临干', function () { return c.gs === c.sui; });
    test('太岁临支', function () { return c.zs === c.sui; });
    test('月建临课', function () { return hasSet(c, c.yue); });
    test('月建临干', function () { return c.gs === c.yue; });
    test('月破临课', function () { return hasSet(c, c.yuePo); });
    test('月破加日', function () { return c.gs === c.yuePo; });
    test('岁破临课', function () { return hasSet(c, c.suiPo); });
    // 魁罡(辰戌)
    test('魁罡临课', function () { return hasSet(c, '辰') || hasSet(c, '戌'); });
    test('魁罡临干', function () { return c.gs === '辰' || c.gs === '戌'; });
    test('魁罡临支', function () { return c.zs === '辰' || c.zs === '戌'; });
    test('辰戌临课', function () { return hasSet(c, '辰') || hasSet(c, '戌'); });
    // 神煞
    test('驿马临课', function () { return !!c.ym && hasSet(c, c.ym); });
    test('旬空临课', function () { return Object.keys(c.set).some(function (z) { return inXk(c, z); }); });
    test('初传空亡', function () { return inXk(c, c.c0); });
    test('干上神空亡', function () { return inXk(c, c.gs); });
    test('日德临课', function () { return !!c.rde && hasSet(c, c.rde); });
    test('游都临课', function () { return !!c.youdu && hasSet(c, c.youdu); });
    // 干支五关系
    test('干上神克干', function () { return KE[ZHI_WX[c.gs]] === GAN_WX[c.dayGan]; });
    test('干上神生干', function () { return SHENG[ZHI_WX[c.gs]] === GAN_WX[c.dayGan]; });
    test('支上神克支', function () { return KE[ZHI_WX[c.zs]] === ZHI_WX[c.dayZhi]; });
    test('干上克支上', function () { return KE[ZHI_WX[c.gs]] === ZHI_WX[c.zs]; });
    test('支上克干上', function () { return KE[ZHI_WX[c.zs]] === ZHI_WX[c.gs]; });
    test('干上支上比和', function () { return ZHI_WX[c.gs] === ZHI_WX[c.zs]; });
    // 三传
    test('初传克末传', function () { return KE[ZHI_WX[c.c0]] === ZHI_WX[c.c2]; });
    test('末传生初传', function () { return SHENG[ZHI_WX[c.c2]] === ZHI_WX[c.c0]; });
    test('初传旺相', function () { return isWangXiang(c, c.c0); });
    test('初传囚死', function () { return isQiuSi(c, c.c0); });
    test('初中旺相', function () { return isWangXiang(c, c.c0) && isWangXiang(c, c.c1); });
    test('初中囚死末旺', function () { return isQiuSi(c, c.c0) && isQiuSi(c, c.c1) && isWangXiang(c, c.c2); });
    test('末囚初旺', function () { return isQiuSi(c, c.c2) && isWangXiang(c, c.c0); });
    // 课体
    test('伏吟课', function () { return c.fuyin; });
    test('返吟课', function () { return c.fanyin; });
    // 刑害墓
    test('三刑临课', function () { return hasXing(c); });
    test('六害临课', function () { return hasHai(c); });
    test('墓神临课', function () { return hasSet(c, WX_MU[GAN_WX[c.dayGan]]); });
    test('墓神临干', function () { return c.gs === WX_MU[GAN_WX[c.dayGan]]; });
    // 天罡加孟/仲/季
    test('天罡加孟', function () { return MENG.indexOf(c.gangPalace) >= 0; });
    test('天罡加仲', function () { return ZHONG.indexOf(c.gangPalace) >= 0; });
    test('天罡加季', function () { return JI.indexOf(c.gangPalace) >= 0; });
    // 天将（全称）临课/临干/临支/临初传
    TJ_FULL.forEach(function (J) {
      test(J + '临课', function () { return jiangInKe(c, J); });
      test(J + '临干', function () { return jiangOnGod(c, J, c.gs); });
      test(J + '临支', function () { return jiangOnGod(c, J, c.zs); });
      test(J + '临初传', function () { return jiangOnGod(c, J, c.c0); });
    });
    test('吉将临课', function () { return JIANG_JI.some(function (J) { return jiangInKe(c, J); }); });
    test('凶将临课', function () { return JIANG_XIONG.some(function (J) { return jiangInKe(c, J); }); });
    // 别名支 临干/临支/临课
    Object.keys(ZHI_ALIAS).forEach(function (alias) {
      var z = ZHI_ALIAS[alias];
      test(alias + '临课', function () { return hasSet(c, z); });
      test(alias + '临干', function () { return c.gs === z; });
      test(alias + '临支', function () { return c.zs === z; });
    });
    return hitsAny && allTrue;
  }

  // 兵战：按篇遍历 rules
  function lnGuJiHits(cat, ctx) {
    var c = buildCtx(ctx);
    var out = [];
    (cat && cat.rules || []).forEach(function (r) {
      if (lnEval(r.cond, c)) out.push({ cond: r.cond, duan: r.duan, src: r.src });
    });
    return out;
  }
  // 神定经：同构（rules 极少）
  function lnSdjHits(cat, ctx) { return lnGuJiHits(cat, ctx); }

  // 逐月神煞：monthCat.table = {支:[煞名...]}。
  // 煞临课判定：该煞本月居于地盘支 z，z 上所乘天盘神 tp[z] 入课集 → 煞临课。
  function lnShenshaMonthHits(monthCat, ctx) {
    var c = buildCtx(ctx);
    var table = (monthCat && monthCat.table) || {};
    var out = [];
    Object.keys(table).forEach(function (z) {
      var god = c.tp[z];                 // 该宫天盘神
      if (!god || !c.set[god]) return;   // 所乘神不入课 → 煞不临课
      (table[z] || []).forEach(function (sha) {
        out.push({ cond: (monthCat.month || '') + z + '宫' + sha + '临课', duan: sha + '（本月居' + z + '宫）所乘神' + god + '入课', src: '六壬大全·逐月神煞' });
      });
    });
    return out;
  }

  // 岁神煞机判：suiTables = {煞名:{子:煞支,...12支}}；以 ctx.sui 查煞支，看煞支所乘神是否入课
  function lnSuiShaHits(suiTables, ctx) {
    var c = buildCtx(ctx);
    var out = [];
    if (!c.sui) return out;
    Object.keys(suiTables || {}).forEach(function (name) {
      var z = suiTables[name][c.sui];
      if (!z) return;
      var god = c.tp[z];
      out.push({ cond: '太岁' + c.sui + '年' + name + '在' + z, duan: name + '煞' + z + (god && c.set[god] ? '临课' : '不临课'), src: '六壬大全·岁神煞' });
    });
    return out;
  }
  // 日支神煞机判：zhiTables = {煞名:{子:煞支,...}}；以 ctx.dayZhi 查
  function lnZhiShaHits(zhiTables, ctx) {
    var c = buildCtx(ctx);
    var out = [];
    Object.keys(zhiTables || {}).forEach(function (name) {
      var z = zhiTables[name][c.dayZhi];
      if (!z) return;
      var god = c.tp[z];
      out.push({ cond: '日支' + c.dayZhi + name + '在' + z, duan: name + '煞' + z + (god && c.set[god] ? '临课' : '不临课'), src: '六壬大全·十二支神煞' });
    });
    return out;
  }

  return {
    lnGuJiHits: lnGuJiHits,
    lnSdjHits: lnSdjHits,
    lnShenshaMonthHits: lnShenshaMonthHits,
    lnSuiShaHits: lnSuiShaHits,
    lnZhiShaHits: lnZhiShaHits,
    // 导出内部供测试
    _buildCtx: buildCtx, _lnEval: lnEval,
    XUNKONG: XUNKONG, YIMA: YIMA
  };
});
