//SPDX-License-Identifier: GPL-3.0-or-later
//Copyright (C) 2026 wang-er-1-2003
// 卷三十五 附录 · 计算模块（JZB_FULU）
// 数据源：window.JZB_FULU_DATA（build_fulu.py 生成）；依赖 jzb_engine.js 的 JZB.tools
(function () {
  "use strict";
  var DATA = window.JZB_FULU_DATA;
  var GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  var ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  var WXNAME = ["木", "火", "土", "金", "水"];
  var GAN_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]; // 木木火火土土金金水水
  var ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4]; // 水土木木土火火土金金土水
  var CHANGSHENG = { 0: 11, 1: 2, 2: 8, 3: 5, 4: 8 }; // 长生支：木亥 火寅 土申 金巳 水申
  var LIN = [8, 2, 5, 11]; // 禄支：甲乙卯辰? 甲寅乙卯丙巳丁午戊巳己午庚申辛酉壬亥癸子
  function linZhi(g) { return [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][g]; }
  function diWang(g) { return [3, 2, 6, 5, 6, 5, 9, 8, 0, 11][g]; } // 帝旺：甲卯乙寅丙午丁巳戊午己巳庚酉辛申壬子癸亥
  function shengWo(g, z) { // 生我的干（印绶）：木→水,火→木,土→火,金→土,水→金
    var wx = GAN_WX[g];
    return [4, 0, 1, 2, 3][wx];
  }
  function keWo(g) { // 克我的干（官杀）：木→金,火→水,土→木,金→火,水→土
    var wx = GAN_WX[g];
    return [3, 4, 0, 1, 2][wx];
  }
  function woSheng(g) { // 我生的干（食伤）：木→火,火→土,土→金,金→水,水→木
    var wx = GAN_WX[g];
    return [1, 2, 3, 4, 0][wx];
  }
  function tongWo(g) { return g; }
  var LIUHE = { 0: 4, 4: 0, 1: 6, 6: 1, 2: 7, 7: 2, 3: 8, 8: 3, 5: 9, 9: 5 }; // 甲己 乙庚 丙辛 丁壬 戊癸
  var CHONG = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

  var FULU = {};

  // 1. 推测时刻：太阳视黄经 → 段 → 日出/日入/昼/夜
  FULU.tuiCe = function (jd) {
    var lon = JZB.tools.solarLong(jd);
    var segs = DATA.tuiCe, best = null;
    for (var i = 0; i < segs.length; i++) {
      if (segs[i].黄经 <= lon) best = segs[i]; else break;
    }
    if (!best && segs.length) best = segs[segs.length - 1];
    return { 黄经: lon, 段: best, 日出: best ? best.日出 : "", 日入: best ? best.日入 : "", 昼: best ? best.昼 : "", 夜: best ? best.夜 : "" };
  };

  // 2. 男女九宫（三元：1864上元/1924中元/1984下元，180年周期）
  FULU.jiuGong = function (year) {
    var y = year, base = 1864 + Math.floor((y - 1864) / 180) * 180;
    var yuan = y - base >= 120 ? "下元" : (y - base >= 60 ? "中元" : "上元");
    var a = DATA.jiuGong.yuanStart[yuan], n = ((y - a) % 60 + 60) % 60;
    var m = DATA.jiuGong.maleStart[yuan], f = DATA.jiuGong.femaleStart[yuan];
    // 男逆行：宫 = 起宫 - n（1坎..9离，1-based 循环）
    var mg = ((m - 1 - n) % 9 + 9) % 9 + 1;
    var fg = ((f - 1 + n) % 9 + 9) % 9 + 1;
    if (mg === 5) mg = 2; if (fg === 5) fg = 8; // 中宫寄坤男/寄艮女
    return { 元: yuan, 男宫: mg, 女宫: fg };
  };

  // 3. 逐日人神
  FULU.renShen = function (day, dayGan, dayZhi, hourZhi) {
    return { 日: DATA.renShen.d30[(day - 1) % 30], 干: DATA.renShen.gan[dayGan % 10],
             支: DATA.renShen.zhi[dayZhi % 12], 时: DATA.renShen.shi[hourZhi % 12] };
  };

  // 4. 太白逐日游方（初一正东…初十在天，周而复始）
  FULU.taiBai = function (day) { return DATA.taiBai[(day - 1) % 30]; };

  // 5. 长星短星（历例列日）
  FULU.changDuan = function (month, day) {
    var a = DATA.changDuan.长星[month] || [], b = DATA.changDuan.短星[month] || [];
    return { 长星: a.indexOf(day) >= 0, 短星: b.indexOf(day) >= 0 };
  };

  // 6. 百忌日
  FULU.baiJi = function (dayGan, dayZhi) {
    var out = [];
    out.push(DATA.baiJi.gan[dayGan % 10]);
    out.push(DATA.baiJi.zhi[dayZhi % 12]);
    return out;
  };

  // 7. 祀灶（六癸日）
  FULU.siZao = function (dayGan) { return dayGan % 10 === 9; };

  // 8. 洗头日：宜日/宜支；忌伏社建破平收
  FULU.xiTou = function (day, dayZhi, jianchu, fuShe) {
    var yi = [], ji = [];
    if (DATA.xiTou.yiRi.indexOf(day) >= 0) yi.push("宜日");
    if (DATA.xiTou.yiZhi.indexOf(dayZhi % 12) >= 0) yi.push("宜支(申酉亥子)");
    if (fuShe) ji.push("忌伏社日");
    if (jianchu === "建" || jianchu === "破" || jianchu === "平" || jianchu === "收") ji.push("忌" + jianchu + "日");
    return { 宜: yi, 忌: ji };
  };

  // 9. 嫁娶周堂：大月从夫(离)顺数，小月从妇(震)逆数；遇第堂厨灶吉，翁姑夫妇俗忌
  FULU.zhouTang = function (isBigMonth, day) {
    var start = isBigMonth ? 5 : 3, step = isBigMonth ? 1 : -1;
    var idx = (((start + (day - 1) * step) % 8) + 8) % 8;
    var w = DATA.zhouTang.wei[idx];
    var wm = w.replace(/[\(（].*?[\)）]/g, "");
    var good = (wm === "第" || wm === "堂" || wm === "厨" || wm === "灶");
    return { 位: w, 吉凶: good ? "吉·可用" : "俗忌·官修辨之" };
  };

  // 10. 年月神煞（年干起例）：官星/催官/干鬼/羊刃/天禄/文昌/魁名/天财/文魁
  var WX_PAIR = [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]]; // 木火土金水 各干对
  FULU.nianYueShenSha = function (yearGan) {
    var g = yearGan % 10;
    var wx = GAN_WX[g];
    var keW = [3, 4, 0, 1, 2][wx];        // 克我五行
    var shengW = [4, 0, 1, 2, 3][wx];     // 生我五行
    var woW = [1, 2, 3, 4, 0][wx];        // 我生五行
    var zg = (g % 2 === 0) ? WX_PAIR[keW][1] : WX_PAIR[keW][0]; // 正官(异阴阳)
    var qg = (g % 2 === 0) ? WX_PAIR[keW][0] : WX_PAIR[keW][1]; // 偏官(同阴阳)
    var cuiguan = LIUHE[zg];
    var yangren = diWang(g), feiren = CHONG[yangren];
    var tianlu = linZhi(g);
    var shi = (g % 2 === 0) ? WX_PAIR[woW][0] : WX_PAIR[woW][1]; // 食神(我生同阴阳)
    var shang = (g % 2 === 0) ? WX_PAIR[woW][1] : WX_PAIR[woW][0]; // 伤官(我生异阴阳)
    var wenchang = linZhi(shi);           // 食神之禄
    var queiming = tongWo(g);             // 比劫
    var tiancai = (g % 2 === 0) ? WX_PAIR[shengW][1] : WX_PAIR[shengW][0]; // 印绶(生我异阴阳=正印)
    var wenkui = shang, wenkui_he = LIUHE[wenkui];
    return [
      { 神: "官星", 值: GAN[zg], 说: "正官（克我异阴阳）" },
      { 神: "催官", 值: GAN[cuiguan], 说: "官星之六合" },
      { 神: "干鬼", 值: GAN[qg], 说: "偏官（克我同阴阳）" },
      { 神: "羊刃", 值: ZHI[yangren], 说: "日主帝旺（飞刃" + ZHI[feiren] + "）" },
      { 神: "天禄", 值: ZHI[tianlu], 说: "干禄" },
      { 神: "文昌", 值: ZHI[wenchang], 说: "食神之禄" },
      { 神: "魁名", 值: GAN[queiming], 说: "比劫" },
      { 神: "天财", 值: GAN[tiancai], 说: "印绶（生我异阴阳）" },
      { 神: "文魁", 值: GAN[wenkui] + "（六合" + GAN[wenkui_he] + "）", 说: "伤官及其六合" }
    ];
  };

  // 11. 天帑星纳甲
  FULU.tianTang = function (yearGan) { return DATA.tianTang[GAN[yearGan % 10]]; };

  // 12. 吉将加时：月将（太阳过宫）+ 六吉将说明
  var YUEJIANG = { 雨水: "亥", 春分: "戌", 谷雨: "酉", 小满: "申", 夏至: "未", 大暑: "午",
                   处暑: "巳", 秋分: "辰", 霜降: "卯", 小雪: "寅", 冬至: "丑", 大寒: "子" };
  FULU.yueJiang = function (jieqiName) {
    var j = YUEJIANG[jieqiName];
    return { 月将: j ? "月将" + j + "将" : "未知", 说明: "月将即太阳所躔宫，加于用时；六吉将（贵人六合青龙太常太阴天后）临时为吉。贵登天门见卷三十二立成。" };
  };

  // 13. 奇门三元：定遁/局数/三元/地盘/直符直使/三奇与三吉门
  FULU.qiMen = function (gzd, gzh, jieqiName) {
    if (!gzd || gzd.gan === undefined || !gzh || gzh.gan === undefined) return { 遁: "不明", note: "干支参数缺失" };
    var qi = DATA.qiMen;
    var isYang = !!qi.yang[jieqiName], isYin = !!qi.yin[jieqiName];
    if (!isYang && !isYin) return { 遁: "不明", note: "节气不在奇门三元歌内" };
    var tbl = isYang ? qi.yang : qi.yin;
    // 三元：符首日（日干甲/己）
    var dg = gzd.gan % 10, dz = gzd.zhi % 12;
    var yuan = "下元";
    if (dg === 0 || dg === 5) {
      // 甲子己卯上元 甲寅己巳中元 甲辰己未下元（甲午己酉上元 甲申己亥中元 甲戌己丑下元）
      var zi = (dz - (dg === 0 ? 0 : 4) + 12) % 12; // 距符首甲子/己卯的支距（近似：按符首日定元）
      var xun = Math.floor(dz / 2); // 以日支奇偶粗判（甲日：子午上 寅申中 辰戌下；己日：卯酉上 巳亥中 丑未下）
      if (dg === 0) yuan = (dz === 0 || dz === 6) ? "上元" : (dz === 2 || dz === 8) ? "中元" : "下元";
      else yuan = (dz === 3 || dz === 9) ? "上元" : (dz === 5 || dz === 11) ? "中元" : "下元";
    }
    var ju = tbl[jieqiName][yuan === "上元" ? 0 : yuan === "中元" ? 1 : 2];
    // 地盘：戊己庚辛壬癸丁丙乙，阳遁从局宫顺布九宫，阴遁逆布
    var seq = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 戊己庚辛壬癸丁丙乙
    var gongOrder = [1, 8, 3, 4, 9, 2, 7, 6]; // 洛书飞序（中5寄坤2）
    var di = {};
    var c = ju;
    for (var i = 0; i < 9; i++) {
      var gong = c;
      di[seq[i]] = gong;
      c = isYang ? (c % 9) + 1 : ((c - 2 + 8) % 9) + 1; // 顺/逆九宫（1-9 循环）
    }
    // 中五宫寄坤二
    var hmm = di[4]; // 壬在中五
    // 直符：时干旬首仪
    var hg = gzh.gan % 10, hz = gzh.zhi % 12;
    var xunshou = Math.floor(hz / 2) * 2; // 时支所在旬首支（0子6午12? 0,2,4,6,8,10）
    var xunzhi = [0, 2, 4, 6, 8, 10][Math.floor(hz / 2)]; // 甲子/甲戌/甲申/甲午/甲辰/甲寅
    var yiIdx = Math.floor(hz / 2); // 戊己庚辛壬癸
    var yiGong = di[yiIdx]; // 旬首仪地盘宫
    var xingMen = qi.xing[yiGong > 5 ? 6 : yiGong === 5 ? 2 : yiGong];
    if (yiGong === 5) xingMen = qi.xing[2];
    var zhiFu = xingMen[0], zhiShi = xingMen[1];
    // 直符加时干：时干地盘宫 → 天盘直符落此宫
    var shiganGong = di[hg];
    // 三奇（丁丙乙）所在宫 & 三吉门（开休生）所在宫：直使门加时宫顺转
    var menGong = shiganGong; // 简化：直使随直符加时干，八门按洛书顺转
    var sanQi = { 丁: di[6], 丙: di[7], 乙: di[8] };
    var sanJiMen = {};
    var ji = { 开: 6, 休: 1, 生: 8 };
    for (var k in ji) sanJiMen[k] = ji[k];
    // 会合判断：三吉门宫与三奇宫是否重合（经直符加时干后）
    var dMove = isYang ? ((shiganGong - yiGong + 9) % 9) : ((yiGong - shiganGong + 9) % 9);
    var he = [];
    for (var m in ji) {
      var mg = ji[m];
      for (var q in sanQi) {
        var dq = ((mg - 1 + dMove) % 9) + 1;
        var dqq = ((sanQi[q] - 1 + dMove) % 9) + 1;
        if (dq === dqq) he.push(m + "+" + q);
      }
    }
    return { 遁: isYang ? "阳遁" : "阴遁", 局数: ju, 三元: yuan, 节气: jieqiName,
             地盘: di, 直符: zhiFu + "(宫" + shiganGong + ")", 直使: zhiShi,
             三奇宫: sanQi, 三吉门宫: sanJiMen, 会合: he,
             note: "未含超神接气置闰（按节气直接三元定局）" };
  };

  // 14. 五姓修宅配年（考原算法：按姓五行与年支五行关系判八类）
  FULU.wuXingZhai = function (xing, yearZhi) {
    var w = DATA.wuXingZhai[xing];
    if (!w) return null;
    var wx = WXNAME.indexOf(w); // 0木1火2土3金4水
    var z = yearZhi % 12, zwx = ZHI_WX[z];
    // 长生绝胎墓
    var cs = CHANGSHENG[wx];
    var j = 0, idx = cs;
    while (j < 9) { idx = (idx + 1) % 12; j++; } // 长生后数9位=绝
    var jue = idx;
    var tai = (jue + 1) % 12;
    var mu = (cs + 8) % 12; // 墓=长生后8位（土长生申→墓辰）
    var xiaomu = CHONG[mu];
    if (z === jue) return { 类: "气绝", 凶: true };
    if (z === tai) return { 类: "白虎", 凶: true };
    if (z === mu) return { 类: "大墓", 凶: true };
    if (z === xiaomu) return { 类: "小墓", 凶: true };
    if (zwx === wx) return { 类: "大通", 凶: false };
    // 生克
    var shengMap = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 0 }; // 木生火 火生土 土生金 金生水 水生木（w 生 shengMap[w]）
    var keMap = { 0: 2, 1: 3, 2: 4, 3: 0, 4: 1 }; // 木克土 火克金 土克水 金克木 水克火（w 克 keMap[w]）
    if (keMap[wx] === zwx) return { 类: "害财", 凶: true }; // 我克
    if (keMap[zwx] === wx) return { 类: "鬼贼", 凶: true }; // 克我
    // 相生（含我生/生我）= 小通
    if (shengMap[wx] === zwx || shengMap[zwx] === wx) return { 类: "小通", 凶: false };
    return { 类: "未知", 凶: false };
  };

  // 15. 杂用宜忌：逐月吉日命中（内/外）
  FULU.zaYong = function (month, gzStr, isOuter) {
    var out = [];
    for (var key in DATA.zaYong) {
      var tbl = DATA.zaYong[key][month];
      if (!tbl) continue;
      var hit = (isOuter ? tbl.outer : tbl.inner).indexOf(gzStr) >= 0;
      if (hit) out.push(key);
    }
    return out;
  };

  // 16. 入棺/入殓吉时
  FULU.ruGuan = function (dayZhi) { return DATA.ruGuan[ZHI[dayZhi % 12]] || null; };
  FULU.ruLian = function (gzStr) { return DATA.ruLian[gzStr] || null; };

  // 17. 伏社日：初伏=夏至后第三庚，中伏=第四庚，末伏=立秋后第一庚；春社=立春后第五戊，秋社=立秋后第五戊
  function jdToYmd(jd) {
    var a = Math.floor(jd + 0.5), b, c, d, e, f;
    if (a > 2299160) { var aa = Math.floor((a - 1867216.25) / 36524.25); b = a + 1 + aa - Math.floor(aa / 4); }
    else b = a;
    c = b + 1524; d = Math.floor((c - 122.1) / 365.25); e = Math.floor(365.25 * d);
    f = Math.floor((c - e) / 30.6001);
    var day = c - e - Math.floor(30.6001 * f);
    var month = f < 14 ? f - 1 : f - 13;
    var year = month > 2 ? d - 4716 : d - 4715;
    return { y: year, m: month, d: day };
  }
  FULU.fuShe = function (y) {
    var T = (typeof JZB !== "undefined" && JZB.tools) ? JZB.tools : (window.JZB && window.JZB.tools);
    function nthGan(termJd, gan, nth) {
      var jd = Math.floor(termJd) + 0.5, cnt = 0;
      for (var k = 0; k < 50; k++) {
        var ym = jdToYmd(jd);
        var g = T.gzDay(ym.y, ym.m, ym.d);
        if (g.gan === gan) { cnt++; if (cnt === nth) return { 月: ym.m, 日: ym.d, 干支: g.name }; }
        jd += 1;
      }
      return null;
    }
    var xiaZhi = T.termJD(y, 90), liQiu = T.termJD(y, 135), liChun = T.termJD(y, 315);
    var res = {
      初伏: nthGan(xiaZhi, 6, 3), 中伏: nthGan(xiaZhi, 6, 4),
      末伏: nthGan(liQiu, 6, 1),
      春社: nthGan(liChun, 4, 5), 秋社: nthGan(liQiu, 4, 5)
    };
    res.说明 = "初/中伏=夏至（黄经90°）后第三/四庚日，末伏=立秋（135°）后第一庚日；春/秋社=立春（315°）/立秋（135°）后第五戊日，按太阳黄经节气日逐日推干支";
    return res;
  };

  window.JZB_FULU = FULU;
  if (typeof module !== "undefined" && module.exports) module.exports = FULU;
})();
