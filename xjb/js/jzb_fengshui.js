//SPDX-License-Identifier: GPL-3.0-or-later
//Copyright (C) 2026 wang-er-1-2003
// 卷二 · 山家五行与风水计算模块（JZB_FENGSHUI）
// 数据源：协纪辨方书_卷二_本原二_翻译表.xlsx（中针双山五行/缝针三合五行/洪范五行/墓龙变运/年月克山家/八卦纳甲三合/小游年/大游年/二十四节气方位）
(function () {
  "use strict";
  var GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  var ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  var WX5 = ["木", "火", "土", "金", "水"];
  var SHENG = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  var KE = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" }; // A克B：KE[A]=B
  var KE_INV = { "木": "金", "火": "水", "土": "木", "金": "火", "水": "土" }; // 克A者：KE_INV[A]
  var B = {};

  // ---- 双山三合五行（缝针三合五行=双山法；中针同法）----
  var SHUANGSHAN = [
    { 局: "水局", 取支: "申子辰", 山: ["坤", "申", "壬", "子", "乙", "辰"] },
    { 局: "木局", 取支: "亥卯未", 山: ["乾", "亥", "甲", "卯", "丁", "未"] },
    { 局: "火局", 取支: "寅午戌", 山: ["艮", "寅", "丙", "午", "辛", "戌"] },
    { 局: "金局", 取支: "巳酉丑", 山: ["巽", "巳", "庚", "酉", "癸", "丑"] }
  ];
  B.shuangShan = function (shan) {
    for (var i = 0; i < SHUANGSHAN.length; i++) {
      if (SHUANGSHAN[i].山.indexOf(shan) >= 0) {
        return { 山: shan, 局: SHUANGSHAN[i].局, 取生旺墓支: SHUANGSHAN[i].取支, 六山: SHUANGSHAN[i].山.join("、"), 属: SHUANGSHAN[i].局.slice(0, 1), 源: "卷二·缝针三合五行（双山法）" };
      }
    }
    return null;
  };

  // ---- 洪范五行（山家大五行）：水8 火4 木3 金4 土5 ----
  var HONGFAN = {
    "水": ["甲", "寅", "辰", "巽", "戌", "坎", "辛", "申"],
    "火": ["离", "壬", "丙", "乙"],
    "木": ["震", "艮", "巳"],
    "金": ["乾", "亥", "兑", "丁"],
    "土": ["丑", "癸", "坤", "庚", "未"]
  };
  var HF_INV = {};
  (function () {
    for (var k in HONGFAN) HONGFAN[k].forEach(function (s) { HF_INV[s] = k; });
    // 四正支由四正卦代名（洪范表原文用坎离震兑）：子=坎位水、午=离位火、卯=震位木、酉=兑位金
    HF_INV["子"] = HF_INV["坎"]; HF_INV["午"] = HF_INV["离"];
    HF_INV["卯"] = HF_INV["震"]; HF_INV["酉"] = HF_INV["兑"];
  })();
  B.hongFan = function (shan) {
    var wx = HF_INV[shan];
    if (!wx) return null;
    return { 山: shan, 洪范五行: wx, 同组山: HONGFAN[wx].join("、"), 源: "卷二·洪范五行（山家五行）" };
  };

  // ---- 纳音（60甲子名 + 五行）----
  var NAYIN_NAME = ["海中金", "海中金", "炉中火", "炉中火", "大林木", "大林木", "路旁土", "路旁土", "剑锋金", "剑锋金",
    "山头火", "山头火", "涧下水", "涧下水", "城头土", "城头土", "白蜡金", "白蜡金", "杨柳木", "杨柳木",
    "泉中水", "泉中水", "屋上土", "屋上土", "霹雳火", "霹雳火", "松柏木", "松柏木", "长流水", "长流水",
    "砂中金", "砂中金", "山下火", "山下火", "平地木", "平地木", "壁上土", "壁上土", "金箔金", "金箔金",
    "覆灯火", "覆灯火", "天河水", "天河水", "大驿土", "大驿土", "钗钏金", "钗钏金", "桑柘木", "桑柘木",
    "大溪水", "大溪水", "沙中土", "沙中土", "天上火", "天上火", "石榴木", "石榴木", "大海水", "大海水"];
  B.nayinName = function (gzIdx) { return NAYIN_NAME[((gzIdx % 60) + 60) % 60]; };
  B.nayinWx = function (gzIdx) {
    var n = NAYIN_NAME[((gzIdx % 60) + 60) % 60];
    return n.slice(-1); // 纳音名末字即五行：海中金→金、炉中火→火…
  };
  B.gzName = function (gzIdx) {
    var i = ((gzIdx % 60) + 60) % 60;
    return GAN[i % 10] + ZHI[i % 12];
  };
  // 干/支索引 → 60甲子序号（CRT：n≡g(mod10), n≡z(mod12)；与 benyuan.gzIdxOf 同）
  B.gzIdxOf = function (gan, zhi) {
    var g = ((gan % 10) + 10) % 10, z = ((zhi % 12) + 12) % 12;
    var k = ((((g - z) / 2) % 6) + 6) % 6;
    return ((g + 10 * k) % 60 + 60) % 60;
  };

  // ---- 墓龙变运：五子元遁（五鼠遁年上起子）数至本山墓辰，墓辰纳音为变运 ----
  // 五子元遁起干（子月）：甲己甲子、乙庚丙子、丙辛戊子、丁壬庚子、戊癸壬子
  var WUZI = { "甲": 0, "乙": 2, "丙": 4, "丁": 6, "戊": 8, "己": 0, "庚": 2, "辛": 4, "壬": 6, "癸": 8 };
  var MU = { "水": { 墓支: "辰", 山: HONGFAN["水"].concat(HONGFAN["土"]) }, "火": { 墓支: "戌", 山: HONGFAN["火"] }, "木": { 墓支: "未", 山: HONGFAN["木"] }, "金": { 墓支: "丑", 山: HONGFAN["金"] } };
  // 土山与水同墓（水土墓在辰）
  function muOf(wx) { return wx === "土" ? { 墓支: "辰", 山: HONGFAN["水"].concat(HONGFAN["土"]) } : MU[wx]; }
  function muChen(yearGan, muZhi) {
    var pos = ZHI.indexOf(muZhi) + 1; // 子=1 … 亥=12
    var g = (WUZI[yearGan] + pos - 1) % 10;
    var idx = B.gzIdxOf(g, ZHI.indexOf(muZhi));
    return { 干支: GAN[g] + muZhi, 纳音: NAYIN_NAME[idx], 五行: NAYIN_NAME[idx].slice(-1) };
  }
  // 墓龙变运：shan + 年干（本年）→ 墓运；金墓丑另有冬至后（下岁口径）运
  B.muLong = function (shan, yearGan) {
    var hf = HF_INV[shan];
    if (!hf) return null;
    var m = muOf(hf);
    var yun = muChen(yearGan, m.墓支);
    var out = {
      山: shan, 洪范五行: hf, 墓库: m.墓支 + "（" + hf + "山墓）",
      本年墓辰: yun.干支, 本年墓运: yun.纳音, 本年墓运五行: yun.五行,
      同墓山: m.山.join("、"), 忌用: KE_INV[yun.五行] + "年月日时", // 忌克墓运之纳音
      源: "卷二·墓龙变运（通书大全）"
    };
    if (m.墓支 === "丑") { // 金墓丑：冬至后岁君未更而墓运已改（用下岁五子元遁）
      var nextGan = GAN[(GAN.indexOf(yearGan) + 1) % 10];
      var yun2 = muChen(nextGan, "丑");
      out.冬至后墓辰 = yun2.干支; out.冬至后墓运 = yun2.纳音; out.冬至后墓运五行 = yun2.五行;
      out.冬至后忌用 = KE_INV[yun2.五行] + "年月日时";
    }
    return out;
  };
  // 太岁纳音与墓运纳音吉凶（通书大全）：相生合为吉、墓运克太岁尤吉、忌年月日时纳音克墓运
  B.muYunJi = function (taiSuiWx, muYunWx) {
    var rel, ji;
    if (taiSuiWx === muYunWx) { rel = "同（合）"; ji = "吉"; }
    else if (SHENG[taiSuiWx] === muYunWx) { rel = "太岁生墓运"; ji = "吉"; }
    else if (SHENG[muYunWx] === taiSuiWx) { rel = "墓运生太岁"; ji = "平"; }
    else if (KE[muYunWx] === taiSuiWx) { rel = "墓运克太岁"; ji = "尤吉"; }
    else { rel = "太岁克墓运"; ji = "忌"; }
    return { 关系: rel, 吉凶: ji, 忌: KE_INV[muYunWx] + "年月日时" };
  };

  // ---- 年月克山家：年月纳音克墓运即克某山（五子元遁历丑辰未戌四墓）----
  // gzIdx：年/月/日/时干支；type 仅用于标注
  B.keShanJia = function (gzIdx, yearGan) {
    var gz = ((gzIdx % 60) + 60) % 60;
    var g = gz % 10;
    var nayinWx = NAYIN_NAME[gz].slice(-1);
    var hits = [];
    ["丑", "辰", "未", "戌"].forEach(function (mz) {
      var yun = muChen(yearGan, mz);
      if (KE[nayinWx] === yun.五行) { // 年（月）纳音克墓运
        var m = muOf(mz === "辰" ? "水" : (mz === "戌" ? "火" : (mz === "未" ? "木" : "金")));
        hits.push({ 墓辰: yun.干支, 墓运: yun.纳音, 墓运五行: yun.五行, 山: m.山 });
      }
    });
    return {
      干支: GAN[gz % 10] + ZHI[gz % 12], 纳音: NAYIN_NAME[gz], 纳音五行: nayinWx,
      被克: hits, 源: "卷二·年月克山家（通书大全）"
    };
  };
  // 本年（某年干）四墓运全表
  B.muYunBiao = function (yearGan) {
    return ["丑", "辰", "未", "戌"].map(function (mz) {
      var m = muOf(mz === "辰" ? "水" : (mz === "戌" ? "火" : (mz === "未" ? "木" : "金")));
      var yun = muChen(yearGan, mz);
      return { 墓辰: yun.干支, 墓运: yun.纳音, 墓运五行: yun.五行, 墓主: (mz === "辰" ? "水/土" : mz === "戌" ? "火" : mz === "未" ? "木" : "金"), 山: m.山.join("、") };
    });
  };

  // ---- 八卦纳甲三合（后天纳甲兼纳支；四正卦兼纳八支取三合局）----
  var SHAN_GONG = {
    "戌": "乾", "乾": "乾", "亥": "乾", "壬": "坎", "子": "坎", "癸": "坎",
    "丑": "艮", "艮": "艮", "寅": "艮", "甲": "震", "卯": "震", "乙": "震",
    "辰": "巽", "巽": "巽", "巳": "巽", "丙": "离", "午": "离", "丁": "离",
    "未": "坤", "坤": "坤", "申": "坤", "庚": "兑", "酉": "兑", "辛": "兑"
  };
  B.shanGong = function (shan) { return SHAN_GONG[shan] || null; };
  var NAJIA3 = {
    "乾": { 纳干: "甲", 支: [], 三合: "（四隅）" },
    "坎": { 纳干: "癸（代戊）", 支: ["申", "辰"], 三合: "申子辰水局" },
    "艮": { 纳干: "丙", 支: [], 三合: "（四隅）" },
    "震": { 纳干: "庚", 支: ["亥", "未"], 三合: "亥卯未木局" },
    "巽": { 纳干: "辛", 支: [], 三合: "（四隅）" },
    "离": { 纳干: "壬（代己）", 支: ["寅", "戌"], 三合: "寅午戌火局" },
    "坤": { 纳干: "乙", 支: [], 三合: "（四隅）" },
    "兑": { 纳干: "丁", 支: ["巳", "丑"], 三合: "巳酉丑金局" }
  };
  B.naJiaSanHe = function (shan) {
    var gong = B.shanGong(shan);
    if (!gong) return null;
    var r = NAJIA3[gong];
    return { 山: shan, 宫: gong, 纳干: r.纳干, 兼纳支: r.支.length ? r.支.join("、") : "—", 三合局: r.三合, 源: "卷二·八卦纳甲三合（后天纳甲）" };
  };

  // ---- 小游年 / 大游年 翻卦（九曜）----
  // 卦三爻（上中下）二进制：乾111兑011离101震001巽110坎010艮100坤000
  var GUA_BIT = { "乾": 7, "兑": 3, "离": 5, "震": 1, "巽": 6, "坎": 2, "艮": 4, "坤": 0 };
  var BIT_GUA = { 7: "乾", 3: "兑", 5: "离", 1: "震", 6: "巽", 2: "坎", 4: "艮", 0: "坤" };
  var BIAN_SEQ = [4, 2, 1, 2, 4, 2, 1, 2]; // 上中下中上中下中
  var BIAN_NAME = ["上爻变", "中爻变", "下爻变", "中爻变", "上爻变", "中爻变", "下爻变", "中爻变"];
  var XIAO_YAO = ["贪狼", "巨门", "禄存", "文曲", "廉贞", "武曲", "破军", "辅弼"];
  var DA_YAO = ["贪狼", "廉贞", "武曲", "文曲", "禄存", "巨门", "破军", "辅弼"];
  var XIAO_JX = { "贪狼": "吉（两派皆吉）", "巨门": "吉（地理吉）", "禄存": "凶", "文曲": "选择吉/地理凶", "廉贞": "地理吉/选择凶", "武曲": "吉（两派皆吉）", "破军": "凶", "辅弼": "凶" };
  var DA_JX = { "贪狼": "吉（生气）", "廉贞": "凶（五鬼）", "武曲": "吉（延年）", "文曲": "凶（六煞）", "禄存": "凶（祸害）", "巨门": "吉（天医）", "破军": "凶（绝命）", "辅弼": "吉（伏位）" };
  var DA_BIE = { "贪狼": "生气", "廉贞": "五鬼", "武曲": "延年", "文曲": "六煞", "禄存": "祸害", "巨门": "天医", "破军": "绝命", "辅弼": "伏位" };
  function fangua(benGua, yaoNames, jx) {
    var v = GUA_BIT[benGua];
    var rows = [];
    for (var i = 0; i < 8; i++) {
      v = v ^ BIAN_SEQ[i];
      rows.push({ 步: i + 1, 变爻: BIAN_NAME[i], 得卦: BIT_GUA[v], 曜: yaoNames[i], 别名: DA_BIE[yaoNames[i]], 吉凶: jx[yaoNames[i]] });
    }
    return rows;
  }
  B.xiaoYouNian = function (benGua) { return { 本宫: benGua, 九曜: fangua(benGua, XIAO_YAO, XIAO_JX), 源: "卷二·小游年变卦（青囊经九曜/翻卦）" }; };
  B.daYouNian = function (benGua) { return { 本宫: benGua, 九曜: fangua(benGua, DA_YAO, DA_JX), 源: "卷二·大游年变卦（相宅八宅法）" }; };

  // ---- 八宅东西四宅：乾兑老阳艮坤老阴=西四宅；离震少阴巽坎少阳=东四宅 ----
  var ZHAI = { "乾": "西四", "兑": "西四", "艮": "西四", "坤": "西四", "离": "东四", "震": "东四", "巽": "东四", "坎": "东四" };
  B.zhaiType = function (gua) { return ZHAI[gua] || null; };

  // ---- 二十四节气方位全表（卷二：立春艮…大寒丑）----
  var JIEQI24 = {
    "立春": "艮", "雨水": "寅", "惊蛰": "甲", "春分": "震", "清明": "乙", "谷雨": "辰",
    "立夏": "巽", "小满": "巳", "芒种": "丙", "夏至": "离", "小暑": "丁", "大暑": "未",
    "立秋": "坤", "处暑": "申", "白露": "庚", "秋分": "兑", "寒露": "辛", "霜降": "戌",
    "立冬": "乾", "小雪": "亥", "大雪": "壬", "冬至": "坎", "小寒": "癸", "大寒": "丑"
  };
  B.jieqiFangWei24 = function (name) { return JIEQI24[name] || null; };
  B.jieqiFangWei24Biao = function () {
    var out = [];
    for (var k in JIEQI24) out.push(k + "→" + JIEQI24[k]);
    return out;
  };

  if (typeof window !== "undefined") window.JZB_FENGSHUI = B;
  if (typeof module !== "undefined" && module.exports) module.exports = B;
})();
