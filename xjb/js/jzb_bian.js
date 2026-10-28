//SPDX-License-Identifier: GPL-3.0-or-later
//Copyright (C) 2026 wang-er-1-2003
// 卷三十六 辨讹 · 计算模块（JZB_BIAN）
// 官修《钦定协纪辨方书》辨讹：俗术命中计算 + 官方结论标注
(function () {
  "use strict";
  var DATA = window.JZB_FULU_DATA; // 复用卷35数据（红沙/杨公忌/六道/支退/天狗/斗首/合婚等）
  var GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  var ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  var GAN_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  var ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  var CHONG = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
  var CHANGSHENG = { 0: 11, 1: 2, 2: 8, 3: 5, 4: 8 };
  var JI = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // 宫号
  var GONG_GUA = { 1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兑", 8: "艮", 9: "离" };
  var GONG_IDX = { "坎": 0, "坤": 1, "震": 2, "巽": 3, "乾": 4, "兑": 5, "艮": 6, "离": 7 };
  var BIAN = {};

  // 1. 红沙：孟月酉 仲月巳 季月丑
  BIAN.hongSha = function (monthZhi, dayZhi) {
    var mz = monthZhi % 12, dz = dayZhi % 12;
    var want = DATA.hongSha[ZHI[mz]];
    if (!want) return { hit: false };
    var hit = ZHI[dz] === want;
    return { hit: hit, 忌支: want, 说: "转神历：孟月酉 仲月巳 季月丑。官修辨：即身壬煞，通书万年书不用" };
  };

  // 2. 四不祥：初四初七十六十九二十八
  BIAN.siBuXiang = function (day) {
    var hit = DATA.siBuXiang.indexOf(day) >= 0;
    return { hit: hit, 说: "每月初四初七十六十九二十八忌上官。官修辨：隔三为破对七为冲" };
  };

  // 3. 杨公忌：室火猪日（正月十三 二月十一 三月初九 四月初七 五月初五 六月初三 七月初一/廿九 八月廿七 九月廿五 十月廿三 十一月廿一 十二月十九）
  BIAN.yangGong = function (month, day) {
    var list = DATA.yangGongJiList[month] || [];
    var hit = list.indexOf(day) >= 0;
    return { hit: hit, 说: "杨公忌十三日（室火猪日，元旦起角宿顺数值室宿之日）。官修辨其惑世" };
  };

  // 4. 六道：年支顺移方位组
  BIAN.liuDao = function (yearZhi) {
    var yz = yearZhi % 12;
    var start = yz % 6; // 子年(0)起艮坤组0，六岁一周
    var out = [];
    for (var i = 0; i < 6; i++) {
      var grp = DATA.liuDao[(start + i) % 6];
      var nm = DATA.liuDaoName[i];
      var good = (i < 4);
      out.push({ 道: nm, 方位: grp, 吉凶: good ? "吉" : "凶" });
    }
    return { 年支: ZHI[yz], 六道: out, 说: "子年艮坤天道 甲庚地道 乙辛兵道 巽乾人道 丙壬鬼道 丁癸死道，六岁一周" };
  };

  // 5. 支退流财：子年起巳逆行十二支
  BIAN.zhiTui = function (yearZhi) {
    var yz = yearZhi % 12;
    return { 年支: ZHI[yz], 流财方: DATA.zhiTui[ZHI[yz]] || "?", 说: "子年起巳逆行十二支。官修辨：毫无理路，删去不用" };
  };

  // 6. 神煞同位异名
  BIAN.tongWei = function () { return DATA.tongWei; };

  // 7. 斗首五行：坐山 → 元辰五行；日时干支五行 → 五变
  BIAN.douShou = function (shan, dayWxIdx, hourWxIdx) {
    var wx = null, shanName = null;
    for (var k in DATA.douShouShan) {
      if (DATA.douShouShan[k].indexOf(shan) >= 0) { wx = k; break; }
    }
    if (!wx) return { hit: false, note: "山名不在斗首配山表" };
    var wxi = ["木", "火", "土", "金", "水"].indexOf(wx);
    function rel(w) {
      if (w === wxi) return "元辰(旺)";
      // 生克：生我=廉贞(吉)，我生=贪狼，克我=武曲(凶)，我克=破军(凶)
      var shengMap = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 0 };
      var keMap = { 0: 2, 1: 3, 2: 4, 3: 0, 4: 1 };
      if (keMap[w] === wxi) return "武曲(受克·凶)";
      if (keMap[wxi] === w) return "破军(所克·凶)";
      if (shengMap[w] === wxi) return "廉贞(生我·吉)";
      if (shengMap[wxi] === w) return "贪狼(我生)";
      return "?";
    }
    return { hit: true, 山: shan, 元辰: wx, 日干五行: rel(dayWxIdx), 时干五行: rel(hourWxIdx),
             说: "元辰生旺为吉，受克凶。辨：伪托杨筠松，台本不载" };
  };

  // 8. 尊星帝星（年/月/日/时四例，不入中宫）
  var ZUN_SEQ = DATA.zunDiSeq; // [6,7,8,9,1,2,3,4] 乾兑艮离坎坤震巽
  var GONG_N = { 6: "乾", 7: "兑", 8: "艮", 9: "离", 1: "坎", 2: "坤", 3: "震", 4: "巽" };
  var YANG_MONTH = [8, 9, 1, 2, 3, 4, 6, 7, 8, 9, 1, 2]; // 阳年 1-12月
  var YIN_MONTH = [3, 4, 6, 7, 2, 1, 9, 8, 3, 4, 6, 7]; // 阴年 1-12月
  function duiGong(g) { return 10 - g; }
  BIAN.zunDi = function (year, yearGan, month, gzDay, gzh, isYangBanNian) {
    // 年：三元（1864上/1924中/1984下 甲子起乾六或坎一）
    var y0 = 1864 + Math.floor((year - 1864) / 180) * 180;
    var yuan = year - y0 >= 120 ? "下元" : (year - y0 >= 60 ? "中元" : "上元");
    var n = ((year - y0) % 60 + 60) % 60;
    var start = (yuan === "中元") ? 4 : 0;
    var zg = ZUN_SEQ[(start + n) % 8];
    // 月
    var mg = ((yearGan % 10) % 2 === 0) ? YANG_MONTH[month - 1] : YIN_MONTH[month - 1];
    // 日：冬至后起乾(0)、夏至后起坎(4)
    var ds = isYangBanNian ? 0 : 4; // 冬至~芒种=乾起
    var dn = ((gzDay.idx || 0) % 60 + 60) % 60;
    var dg = ZUN_SEQ[(ds + dn) % 8];
    // 时：六阳日甲子时起乾、六阴日丑时起坎
    var yangDay = (gzDay.gan % 2 === 0);
    var hs = yangDay ? 0 : 4;
    var hz = gzh.zhi % 12;
    var hn = yangDay ? hz : ((hz - 1 + 12) % 12);
    var hg = ZUN_SEQ[(hs + hn) % 8];
    return {
      年: { 尊: GONG_N[zg], 帝: GONG_N[duiGong(zg)], 元: yuan },
      月: { 尊: GONG_N[mg], 帝: GONG_N[duiGong(mg)] },
      日: { 尊: GONG_N[dg], 帝: GONG_N[duiGong(dg)] },
      时: { 尊: GONG_N[hg], 帝: GONG_N[duiGong(hg)] },
      说: "官修辨其无义理，台本不用" };
  };

  // 9. 天狗头/尾：按季
  BIAN.tianGou = function (month) {
    var season = month <= 3 ? "春" : month <= 6 ? "夏" : month <= 9 ? "秋" : "冬";
    var hw = DATA.tianGou[season];
    return { 季: season, 头: hw[0], 尾: hw[1], 说: "头妨小姑无子，尾妨夫主（月厌正位折中）。官修辨：天狗头尾俗忌" };
  };

  // 10. 五符择时：日禄起五符，临官(禄)与胎养时吉
  BIAN.wuFu = function (dayGan) {
    var lu = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0][dayGan % 10]; // 甲寅乙卯丙巳丁午戊巳己午庚申辛酉壬亥癸子
    // 胎养：按日干五行长生后推 9（绝）→胎→养
    var wx = GAN_WX[dayGan % 10];
    var cs = CHANGSHENG[wx];
    var jue = (cs + 9) % 12, tai = (jue + 1) % 12, yang = (tai + 1) % 12;
    return { 五符起: ZHI[lu], 临官时: ZHI[lu], 胎时: ZHI[tai], 养时: ZHI[yang],
             说: "日禄起五符顺布十二位名透天关，临官胎养时吉。今日表已删" };
  };

  // 11. 九仙择时：共数判定（太元数）
  BIAN.jiuXian = function () {
    return { 吉数: DATA.jiuXian.吉, 凶数: DATA.jiuXian.凶, 例: DATA.jiuXian.例,
             说: "太元数干支配数原文仅一例（丙七寅七巳四），未全列，仅可依共数判定表；官修判毫无义理今删" };
  };

  // 12. 男女合婚（八宅游年）：输入男女年 → 命卦 → 八星 → 吕才级别
  BIAN.heHun = function (maleYear, femaleYear) {
    // 命卦用卷35九宫法
    var F = window.JZB_FULU;
    var m = F.jiuGong(maleYear), f = F.jiuGong(femaleYear);
    var mgua = GONG_GUA[m.男宫], fgua = GONG_GUA[f.女宫];
    var mIdx = GONG_IDX[mgua], fIdx = GONG_IDX[fgua];
    var star = DATA.heHun[mgua][fIdx];
    var star2 = DATA.heHunMap[star] || star;
    var lvl = DATA.heHunLevel[star2] || "?";
    return { 男命卦: mgua, 女命卦: fgua, 八星: star2, 级别: lvl,
             说: "吕才：生气天医福德上吉，绝体游魂归魂中等，五鬼口舌绝命多忧" };
  };

  // 13. 上吉七圣（十五大明日）查表
  var DA_MING = ["辛未", "壬申", "癸酉", "己卯", "壬午", "甲申", "壬寅", "甲辰", "丙午", "己酉", "庚戌", "丙辰", "己未", "庚申", "辛酉"];
  BIAN.daMing = function (gzStr) { return DA_MING.indexOf(gzStr) >= 0; };

  // 14. 内容项清单（官修结论，短行）
  BIAN.bianItems = [
    { 名: "諸家鑾駕星曜", 结论: "玉皇鑾駕紫微帝星等：既无此星且必无此理，今删" },
    { 名: "驛馬臨官", 结论: "即驿马前二干及对方；马前六害/金童撞命等驳斥，删去不用" },
    { 名: "逆血刃九良星暗刀煞", 结论: "分佈六十甲子毫无理路，今删" },
    { 名: "冰消瓦解滅門大禍", 结论: "即年支之平收日（阳月平阴月收，天罡加遁干/河魁加大祸），官修辨其惑世" },
    { 名: "五姓修宅", 结论: "吕才驳之，考原但存其说" },
    { 名: "神在", 结论: "通书三十五日宜祭祀，存旧" },
    { 名: "上吉七聖", 结论: "即十五日大明日（辛未壬申癸酉己卯壬午甲申壬寅甲辰丙午己酉庚戌丙辰己未庚申辛酉）" },
    { 名: "伏斷日密日裁衣日", 结论: "以值宿起算，来自西域（伏断子日起虚八十四日一周；密日=房虚星昴四宿），本引擎未含值宿算法" },
    { 名: "章光", 结论: "月厌前一辰章光后一辰无翘，附会" },
    { 名: "五合五離", 结论: "俗术以甲寅乙卯日月合、申酉日为离，非本义" },
    { 名: "的呼日", 结论: "皆删" },
    { 名: "殃煞出去方", 结论: "月将加死时男取天罡下女取河魁下；康熙七年钦天监会议取用" },
    { 名: "滿德吉慶", 结论: "宗镜以为伪吉日" },
    { 名: "巡山二十四神煞", 结论: "子年起癸顺行二十四山（罗睺/暗曜/土宿…煞名原文仅列部分），太岁本山旺蚕吉；本引擎仅给起山与太岁山" }
  ];

  window.JZB_BIAN = BIAN;
  if (typeof module !== "undefined" && module.exports) module.exports = BIAN;
})();
