// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
'use strict';
/* ============================================================================
 * 紫微斗数古籍机判层 · 统一求值器（自包含，不引用 app.js 内部变量）
 *   zwGuJiHits(cat, P) —— 十四主星（engine/data/ziwei_guji_cat.json）
 *   fxGuJiHits(cat, P) —— 十八飞星（engine/data/feixing_guji_cat.json）
 * P：{ ming:0-11, shen:0-11, zhuyao:{星:宫}, fuyao:{星:宫},
 *      sihua:{禄:星,权:星,科:星,忌:星}, gender:'男'/'女' }
 *     十八飞星用 stars:{星:宫} 代替 zhuyao/fuyao（其余同上）。
 * cond 中文关键词词汇表：
 *   命宫见X / 身宫见X / 命身见X / 三方见X / 对宫见X / 夹命见X
 *   <宫>见X（兄弟/夫妻/子女/财帛/疾厄/迁移/交友/官禄/田宅/福德/父母宫）
 *   命宫地支Z / 命宫在Z（Z 为子丑…亥，或「四库」=辰戌丑未）
 *   命宫带化忌 / 命宫带化权 / 命宫带化科（某宫同）
 *   命宫见九吉星 / 命宫见九凶星（十八飞星九吉九凶）
 * 多条件以 , ， ; ； 分隔，须全部成立。未命中不假装。
 * ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ZW_GUJI = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var OFF = { 命宫: 0, 兄弟宫: 1, 夫妻宫: 2, 子女宫: 3, 财帛宫: 4, 疾厄宫: 5,
    迁移宫: 6, 交友宫: 7, 仆役宫: 7, 官禄宫: 8, 田宅宫: 9, 福德宫: 10, 父母宫: 11 };
  var JIU_JI = ['紫微', '文昌', '红鸾', '天贵', '天福', '天禄', '天印', '天寿', '天库'];
  var JIU_XIONG = ['天刑', '天异', '天刃', '天杖', '天虚', '天哭', '毛头', '天姚'];
  var ALIAS = { '天贯': '贯索', '贯索': '天贯' };

  function off(i) { return ((i % 12) + 12) % 12; }
  function starMap(P) {
    var m = {};
    var add = function (s, i) { if (typeof i === 'number') m[s] = off(i); };
    var srcs = [P.zhuyao, P.fuyao, P.stars];
    srcs.forEach(function (o) { if (o) Object.keys(o).forEach(function (s) { add(s, o[s]); }); });
    return m;
  }
  function atStars(map, idx) {
    return Object.keys(map).filter(function (s) { return map[s] === off(idx); });
  }
  function starHere(map, idx, star) {
    return atStars(map, idx).some(function (s) {
      if (s === star) return true;
      var a = ALIAS[s], b = ALIAS[star];
      return (a && a === star) || (b && b === s);
    });
  }
  function locusIdxs(locus, P) {
    var ming = P.ming, shen = P.shen;
    switch (locus) {
      case '命宫': return [ming];
      case '身宫': return [shen];
      case '命身': return [ming, shen];
      case '三方': return [ming, ming + 4, ming + 8];
      case '对宫': return [ming + 6];
      case '夹命': return [ming - 1, ming + 1];
      default:
        if (OFF[locus] !== undefined) return [ming + OFF[locus]];
        return [];
    }
  }
  function condTrue(cond, P) {
    if (!P || P.ming === undefined) return false;
    var map = starMap(P);
    var clauses = String(cond).split(/[,，;；]/).map(function (s) { return s.trim(); }).filter(Boolean);
    return clauses.every(function (cl) {
      var m, i, z;
      // 地支判定：命宫在午 / 命宫地支四库
      m = cl.match(/^(命宫|身宫)(?:地支|在)(四库|[子丑寅卯辰巳午未申酉戌亥])$/);
      if (m) {
        i = m[1] === '命宫' ? P.ming : P.shen;
        z = DZ[off(i)];
        return m[2] === '四库' ? ['辰', '戌', '丑', '未'].indexOf(z) >= 0 : z === m[2];
      }
      // 化X在某宫：命宫带化忌 / 疾厄宫带化权
      m = cl.match(/^(命宫|身宫|兄弟宫|夫妻宫|子女宫|财帛宫|疾厄宫|迁移宫|交友宫|仆役宫|官禄宫|田宅宫|福德宫|父母宫)带化(禄|权|科|忌)$/);
      if (m) {
        var sk = P.sihua && P.sihua[m[2]];
        if (!sk) return false;
        return locusIdxs(m[1], P).some(function (g) { return starHere(map, g, sk); });
      }
      // 见星：命宫见紫微 / 三方见左辅 / 夹命见武曲 / 九吉星
      m = cl.match(/^(命宫|身宫|命身|三方|对宫|夹命|兄弟宫|夫妻宫|子女宫|财帛宫|疾厄宫|迁移宫|交友宫|仆役宫|官禄宫|田宅宫|福德宫|父母宫)见(.+)$/);
      if (m) {
        var locus = m[1], rest = m[2];
        if (rest === '九吉星') return JIU_JI.some(function (s) { return locusIdxs(locus, P).some(function (g) { return starHere(map, g, s); }); });
        if (rest === '九凶星') return JIU_XIONG.some(function (s) { return locusIdxs(locus, P).some(function (g) { return starHere(map, g, s); }); });
        return locusIdxs(locus, P).some(function (g) { return starHere(map, g, rest); });
      }
      return false; // 未识别条件一律不命中（未命中不假装）
    });
  }
  function hits(cat, P) {
    return (cat && cat.rules ? cat.rules : []).filter(function (r) {
      return condTrue(r.cond, P);
    }).map(function (r) { return { cond: r.cond, duan: r.duan, src: r.src }; });
  }
  return {
    zwGuJiHits: function (cat, P) { return hits(cat, P); },
    fxGuJiHits: function (cat, P) { return hits(cat, P); },
    __condTrue: condTrue,
  };
});
