// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// qimen_luming.js — 奇门禄命（对译 kinastro(MIT) sanshi/qimen_luming.py）
// 输入：引擎奇门排盘 R（window._qmR，由 renderer/qimen.js 起局后写入）
// 流程：convertChart(R) → chart 契约（天盤/地盤/門/星/神/值符值使/排局/天乙）→ computeQimenLuming 分析
// 断语繁体照原文（UI 层 t2s 转简）；判定逻辑逐条照 py，无删改。
(function () {
  "use strict";
  const GONG_ORDER = ["巽", "離", "坤", "震", "中", "兌", "艮", "坎", "乾"];
  const GONG_GRID = [["巽", "離", "坤"], ["震", "中", "兌"], ["艮", "坎", "乾"]];
  const SI_ZHENG_GONG = { "坎": 1, "離": 1, "震": 1, "兌": 1 };
  const XIONG_KEYWORDS = ["不利", "凶", "貧窮", "嗽咳", "昏迷", "刑傷", "憂愁"];
  const GAN_WUXING = { "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土", "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水" };
  const GONG_WUXING = { "坎": "水", "坤": "土", "震": "木", "巽": "木", "中": "土", "乾": "金", "兌": "金", "艮": "土", "離": "火" };
  const GAN_YINYANG = { "甲": "陽", "乙": "陰", "丙": "陽", "丁": "陰", "戊": "陽", "己": "陰", "庚": "陽", "辛": "陰", "壬": "陽", "癸": "陰" };
  const WUXING_SHENGKE = {
    "木火": "我生", "火土": "我生", "土金": "我生", "金水": "我生", "水木": "我生",
    "木土": "我剋", "土水": "我剋", "水火": "我剋", "火金": "我剋", "金木": "我剋",
    "木木": "比肩", "火火": "比肩", "土土": "比肩", "金金": "比肩", "水水": "比肩",
    "火木": "生我", "土火": "生我", "金土": "生我", "水金": "生我", "木水": "生我",
    "土木": "剋我", "水土": "剋我", "火水": "剋我", "金火": "剋我", "木金": "剋我"
  };
  const LIUQIN_MAP = { "生我": "父母", "我生": "子孫", "比肩": "兄弟", "剋我": "官祿（疾厄）", "我剋": "妻財（奴僕）" };
  const MEN_WUXING = { "休": "水", "生": "土", "傷": "木", "杜": "木", "景": "火", "死": "土", "驚": "金", "開": "金" };
  const XING_WUXING = { "蓬": "水", "任": "土", "沖": "木", "輔": "木", "英": "火", "禽": "土", "柱": "金", "心": "金" };
  const SHEN_FULLNAME = { "符": "值符（青龍）", "蛇": "螣蛇", "陰": "太陰", "合": "六合", "勾": "勾陳（白虎）", "雀": "朱雀（玄武）", "虎": "白虎", "玄": "玄武", "地": "九地", "天": "九天" };
  const MEN_LIUQIN_DUAN = {
    "休": { "summary": "休門主休養安和", "父母": "父慈子孝，和氣藹人", "兄弟": "真心愛敬，無分彼我", "子孫": "少有和合，各守家園", "官祿": "功名妥手，職位安穩", "疾厄": "隱虛暗疾，延拖難愈", "妻妾": "幽閑貞靜，和偕得助", "財帛": "錢財進益，滔滔不絕" },
    "生": { "summary": "生門主發生安閑", "父母": "財祿旺相，安福尊榮", "兄弟": "和順愛敬，情誼深切", "子孫": "家道興隆，義高得厚", "官祿": "官職高升，榮華赫奕", "疾厄": "身軀強壯，無災無病", "妻妾": "和順貞潔", "財帛": "積聚富厚" },
    "傷": { "summary": "傷門主振動傷殘", "父母": "殘忍寡愛，性若浮萍", "兄弟": "一生不和，無情無義", "子孫": "後嗣美麗，振作英發", "官祿": "顯赫威權，亦多掣時", "疾厄": "手足拘攣，骨節疼痛", "妻妾": "才德俱全，內治有力", "財帛": "謀遠奔走，辛勤成家" },
    "杜": { "summary": "杜門主閉塞無為", "父母": "一生蹇滯，牢守家園", "兄弟": "彼此睽違，情同陌路", "子孫": "難生少育，須藉陰功", "官祿": "仕途閉塞，難得職位", "疾厄": "少病少災，風病宜防", "妻妾": "心性閉澀，難以調和", "財帛": "少年貧窘，晚來方裕" },
    "景": { "summary": "景門主張大虛華之事，事無實濟", "父母": "浮躁虛假，狂風疾雨", "兄弟": "無情少義，面上虛文", "子孫": "生產難有，從養螟蛉", "官祿": "少年早發，忽升忽降", "疾厄": "風火暴疾，易作易止", "妻妾": "聰明智慧，心性乖舛", "財帛": "以無為有，虛張實少" },
    "死": { "summary": "死門主死亡敗絕，凡百無成", "父母": "病不離床，死亡相繼", "兄弟": "無情少義，刑克傷亡", "子孫": "刑傷忤逆，雖有若無", "官祿": "功名不遂，南畝終身", "疾厄": "有病難療，終致殘生", "妻妾": "必有死亡，繼室方安", "財帛": "虛耗傷敗，聚散不常" },
    "驚": { "summary": "驚門主驚惶不安", "父母": "生平多怨，父子不和", "兄弟": "乖戾欺妒，各使神通", "子孫": "恃財矜夸，刻薄少情", "官祿": "凶險地面，散職閑員", "疾厄": "卒暴驚險，危篤傍惶", "妻妾": "詭詐口舌，夫婦不和", "財帛": "寡少難聚，入不償出" },
    "開": { "summary": "開門主豁達開暢", "父母": "性不真切，浮泛相待", "兄弟": "意不相聯，似親非親", "子孫": "聰明俊秀，科甲貴顯", "官祿": "功名顯達，職位高遷", "疾厄": "一生少病，強健安和", "妻妾": "正直果決，內助賢能", "財帛": "資材難聚，聚亦易散" }
  };
  const SHEN_PERSONALITY = {
    "符": "六甲值符屬青龍，其人仁厚溫和，若得美格更妙，做事有始有終",
    "蛇": "螣蛇之性虛花不實，無有誠信，多疑猜善呻吟，有成有敗",
    "陰": "太陰多謀多為，能剛能柔，性則廉潔",
    "合": "六合面上有情，心無專主，不生慳吝，女命逢之淫亂污穢",
    "勾": "白虎性剛激烈，逼迫無情，有殺伐之心，遭刀兵之慘，在女人則有傷損",
    "雀": "玄武性多詭詐，不是穿窬便是盜賊，暗地謀人，人難防避",
    "虎": "白虎性剛激烈，逼迫無情，有殺伐之心，遭刀兵之慘，在女人則有傷損",
    "玄": "玄武性多詭詐，不是穿窬便是盜賊，暗地謀人，人難防避",
    "地": "九地心性昏濛，稟質重厚，能陰謀善籌畫，做事能下毒手",
    "天": "九天性氣發揚，浮躁剛暴，英氣逼人，令人難當，然心無私曲，掣日月而行，不為暗昧事"
  };
  const SHEN_LUMING = {
    "符": "值符為貴神，加本命非貴即富，正直端方，人皆尊敬，生平有吉無凶",
    "蛇": "螣蛇加本命，做人必古怪難交，言語欺誑，作事虛花，有名無實",
    "陰": "太陰加本命，一生善於計算，陰謀詭詐，終無良策",
    "合": "六合加本命，心性和同，恩仇一類，善惡無分，同流合污",
    "勾": "白虎加年命，做人殘刻無情，所遇傷損，一生破敗",
    "雀": "玄武加本命，不是穿窬就是劫盜，立心陰險，做事惡毒",
    "虎": "白虎加年命，做人殘刻無情，所遇傷損，一生破敗",
    "玄": "玄武加本命，不是穿窬就是劫盜，立心陰險，做事惡毒",
    "地": "九地加本命，陰晦暗滯，昏迷度日，毫無光彩之色",
    "天": "九天加本命，虛張聲勢，假裝門面，實少情義，不可依仗"
  };
  const SHEN_GONG_YIJI = {
    "符": { "_default": "吉", "_desc": "八將之中最喜值符貴神，命宮及父母、兄弟、子孫宮遇之，必主富貴榮華" },
    "蛇": { "_default": "凶", "_desc": "螣蛇白虎加之，必主有疾病" },
    "陰": { "_default": "吉", "_desc": "太陰吉神不拘何宮，加之皆吉" },
    "合": { "_default": "吉", "妻妾": "凶：六合之宮百事和諧，惟妻妾宮忌之，有此必主淫佚無恥、醜聲遠播", "_desc": "六合之宮百事和諧，惟妻妾宮忌之" },
    "虎": { "_default": "凶", "_desc": "白虎加之，必主有疾病" },
    "勾": { "_default": "凶", "_desc": "白虎加之，必主有疾病" },
    "玄": { "_default": "凶", "疾厄": "吉：玄武疾厄宮加之則終身必少病", "財帛": "吉：玄武財帛宮加之則喜聚金錢，必成富翁", "_desc": "玄武各宮俱不宜，惟疾厄宮、財帛宮逢之則吉" },
    "雀": { "_default": "凶", "疾厄": "吉：玄武疾厄宮加之則終身必少病", "財帛": "吉：玄武財帛宮加之則喜聚金錢，必成富翁", "_desc": "玄武各宮俱不宜，惟疾厄宮、財帛宮逢之則吉" },
    "地": { "_default": "凶", "財帛": "吉：九地財帛宮逢之則吉，金銀滿室，盜賊不能偷劫", "疾厄": "大凶：九地疾厄宮遇之尤不喜，必至死亡", "_desc": "九地幽暗閉藏，諸宮俱不喜，惟財帛宮逢之則吉" },
    "天": { "_default": "平", "官祿": "大吉：九天官祿宮逢之則主功高顯達，職位超遷", "本命": "大吉：九天本命宮遇之尤為喜慶", "_desc": "九天性烈，他宮不宜，惟官祿宮逢之主功高顯達，本命宮遇之尤喜" }
  };
  const GANZHI_POZHI = {
    "木": { "乾": "木被金克：金旺木衰則主折傷之禍", "兌": "木被金克：金旺木衰則主折傷之禍" },
    "火": { "坎": "火被水克：水旺火衰則主有滅亡之禍" },
    "土": { "震": "土被木克：木旺土衰則主有癰疽瘡毒之症", "巽": "土被木克：木旺土衰則主有癰疽瘡毒之症" },
    "金": { "離": "金被火克：火旺金衰則主有痰火嗽癆之症" },
    "水": { "坤": "水被土克：土旺水衰則主有下元虛耗之災", "艮": "水被土克：土旺水衰則主有下元虛耗之災" }
  };

  // 引擎宫名（简）→ qimen_luming 宫名（繁）
  const GONG_T2T = { "坎": "坎", "坤": "坤", "震": "震", "巽": "巽", "中": "中", "乾": "乾", "兑": "兌", "艮": "艮", "离": "離" };
  const SHEN_MAP = { "值符": "符", "螣蛇": "蛇", "太阴": "陰", "六合": "合", "白虎": "虎", "玄武": "玄", "九地": "地", "九天": "天" };

  // 工具函数
  function _get_wuxing(char) { return GAN_WUXING[char] || GONG_WUXING[char] || ""; }
  function _get_shengke(my_wx, other_wx) { return WUXING_SHENGKE[my_wx + other_wx] || ""; }
  function _get_liuqin(relation) { return LIUQIN_MAP[relation] || relation; }
  function _find_stem_palace(chart, stem) {
    const sky = chart["天盤"] || {}, earth = chart["地盤"] || {};
    for (const g of Object.keys(sky)) if (sky[g] === stem) return g;
    for (const g of Object.keys(earth)) if (earth[g] === stem) return g;
    return null;
  }
  function _find_year_stem_substitute(year_gan) { return year_gan === "甲" ? "戊" : year_gan; }
  function _get_palace_info(chart, gong) {
    return {
      "天干": (chart["天盤"] || {})[gong] || "",
      "地干": (chart["地盤"] || {})[gong] || "",
      "門": (chart["門"] || {})[gong] || "",
      "星": (chart["星"] || {})[gong] || "",
      "神": (chart["神"] || {})[gong] || ""
    };
  }
  function _analyze_six_relations(benming_gan, chart) {
    const my_wx = _get_wuxing(benming_gan);
    if (!my_wx) return [];
    const sky = chart["天盤"] || {}, men = chart["門"] || {}, xing = chart["星"] || {}, shen = chart["神"] || {};
    const results = [];
    for (const gong of GONG_ORDER) {
      if (gong === "中") continue;
      const tian_gan = sky[gong];
      if (!tian_gan) continue;
      const other_wx = _get_wuxing(tian_gan);
      if (!other_wx) continue;
      const relation = _get_shengke(my_wx, other_wx);
      const liuqin = _get_liuqin(relation);
      const liuqin_simple = liuqin.split("（")[0];
      const door = men[gong] || "";
      let door_duan = {};
      if (door && MEN_LIUQIN_DUAN[door]) {
        const dd = MEN_LIUQIN_DUAN[door];
        door_duan = { "summary": dd.summary || "" };
        for (const key of ["父母", "兄弟", "子孫", "官祿", "疾厄", "妻妾", "財帛"]) {
          if (liuqin.indexOf(key) >= 0 || liuqin_simple.indexOf(key) >= 0) { door_duan["斷語"] = dd[key] || ""; door_duan["六親類別"] = key; break; }
        }
        if (liuqin.indexOf("官祿") >= 0) { door_duan["官祿"] = dd["官祿"] || ""; door_duan["疾厄"] = dd["疾厄"] || ""; }
        if (liuqin.indexOf("妻財") >= 0) { door_duan["妻妾"] = dd["妻妾"] || ""; door_duan["財帛"] = dd["財帛"] || ""; }
      }
      const god = shen[gong] || "";
      const god_personality = SHEN_PERSONALITY[god] || "";
      const god_luming = SHEN_LUMING[god] || "";
      const god_fullname = SHEN_FULLNAME[god] || god;
      const star = xing[gong] || "";
      const yinyang = GAN_YINYANG[tian_gan] || "";
      results.push({ "宮位": gong, "天干": tian_gan, "天干五行": other_wx, "天干陰陽": yinyang, "五行關係": relation, "六親": liuqin, "門": door, "門斷語": door_duan, "星": star, "神": god, "神全名": god_fullname, "神性情": god_personality, "神論命": god_luming });
    }
    return results;
  }
  function _analyze_suppression(benming_gan, benming_gong) {
    if (!benming_gong) return "";
    const wx = _get_wuxing(benming_gan);
    if (!wx) return "";
    const suppression = GANZHI_POZHI[wx] || {};
    return suppression[benming_gong] || "";
  }
  function _analyze_shen_special(shen, liuqin_category) {
    const yiji = SHEN_GONG_YIJI[shen] || {};
    if (!Object.keys(yiji).length) return "";
    const specific = yiji[liuqin_category] || "";
    if (specific) return specific;
    return yiji["_default"] || "";
  }
  function _analyze_patterns(chart, benming_gong) {
    const patterns = [];
    if (!benming_gong || benming_gong === "中") return patterns;
    const sky = chart["天盤"] || {}, earth = chart["地盤"] || {}, men = chart["門"] || {};
    const tian_gan = sky[benming_gong] || "", di_gan = earth[benming_gong] || "", door = men[benming_gong] || "";
    if (tian_gan === "乙" && di_gan === "丙") patterns.push("天遁（乙加丙）：吉格，可安守家園");
    if (tian_gan === "丙" && di_gan === "丁") patterns.push("地遁（丙加丁）：吉格，可安守家園");
    if (tian_gan === "丁" && di_gan === "乙") patterns.push("人遁（丁加乙）：吉格，可安守家園");
    if ((tian_gan === "戊" && di_gan === "丙") || (tian_gan === "丙" && di_gan === "戊")) patterns.push("甲（戊）加丙或丙加甲（戊）：各宮皆利，惟疾厄宮主一生疾病纏綿");
    if (tian_gan === "庚" && di_gan === "丙") patterns.push("太白入熒惑（庚加丙）：作事受虧，一世貧窮");
    if (tian_gan === "丙" && di_gan === "庚") patterns.push("熒惑入太白（丙加庚）：火旺克金，嗽咳喘急");
    if (tian_gan === "癸" && di_gan === "丁") patterns.push("六癸加丁：昏迷惑亂，事事傷嗟");
    if (tian_gan === "丁" && di_gan === "癸") patterns.push("六丁加癸：憂愁恐驚，自投刑獄");
    if (tian_gan === "庚" && di_gan === "癸") patterns.push("大格（庚加癸）：有刑傷阻格");
    if (tian_gan === "庚" && di_gan === "壬") patterns.push("小格（庚加壬）：有刑傷阻格");
    if (tian_gan === "庚" && di_gan === "己") patterns.push("刑格（庚加己）：有刑傷阻格");
    if (door) {
      const door_wx = MEN_WUXING[door] || "", gong_wx = GONG_WUXING[benming_gong] || "";
      if (door_wx && gong_wx) {
        const gm_rel = _get_shengke(gong_wx, door_wx);
        if (gm_rel === "我生") patterns.push("宮生門（" + benming_gong + "宮" + gong_wx + "生" + door + "門" + door_wx + "）：宮門相生，吉");
        else if (gm_rel === "生我") patterns.push("門生宮（" + door + "門" + door_wx + "生" + benming_gong + "宮" + gong_wx + "）：宮門相生，吉");
        else if (gm_rel === "剋我") patterns.push("門克宮（" + door + "門" + door_wx + "克" + benming_gong + "宮" + gong_wx + "）：宮門相剋，不利");
        else if (gm_rel === "我剋") patterns.push("宮克門（" + benming_gong + "宮" + gong_wx + "克" + door + "門" + door_wx + "）：宮門相剋，耗氣");
      }
    }
    if (SI_ZHENG_GONG[benming_gong]) patterns.push("本命落四正宮（" + benming_gong + "）：格局較高，主貴");
    return patterns;
  }
  function _overall_assessment(benming_gong, benming_shen, benming_door, suppression, patterns) {
    const parts = [];
    if (benming_gong && SI_ZHENG_GONG[benming_gong]) parts.push("本命落四正宮，格局較高");
    if (benming_shen === "符") parts.push("值符貴神臨本命，非貴即富");
    else if (benming_shen === "陰") parts.push("太陰臨本命，一生善計");
    else if (benming_shen === "蛇") parts.push("螣蛇臨本命，虛花不實");
    else if (benming_shen === "虎" || benming_shen === "勾") parts.push("白虎臨本命，殘克無情");
    else if (benming_shen === "玄" || benming_shen === "雀") parts.push("玄武臨本命，詭詐陰險");
    else if (benming_shen === "地") parts.push("九地臨本命，陰晦暗滯");
    else if (benming_shen === "天") parts.push("九天臨本命，英氣發揚，惟虛張聲勢");
    else if (benming_shen === "合") parts.push("六合臨本命，和同心性");
    if (benming_door === "開" || benming_door === "休" || benming_door === "生") parts.push("本命逢" + benming_door + "門，三吉門，主吉");
    else if (benming_door === "傷" || benming_door === "杜") parts.push("本命逢" + benming_door + "門，有振動閉塞之象");
    else if (benming_door === "景") parts.push("本命逢" + benming_door + "門，虛華不實");
    else if (benming_door === "死") parts.push("本命逢" + benming_door + "門，死氣沉沉");
    else if (benming_door === "驚") parts.push("本命逢" + benming_door + "門，驚惶不安");
    if (suppression) parts.push("十干迫制：" + suppression);
    const xiong_patterns = patterns.filter(p => XIONG_KEYWORDS.some(w => p.indexOf(w) >= 0));
    if (xiong_patterns.length) parts.push("命局有凶格：" + xiong_patterns.join("；"));
    if (!parts.length) parts.push("命局平穩，無特別凶吉");
    return parts.join("。") + "。";
  }

  // ── chart 适配器：引擎排盘 R → qimen_luming chart 契约 ──
  function convertChart(R) {
    const GONG_NAME = { 1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兑", 8: "艮", 9: "离" };
    const tian = {}, di = {}, men = {}, xing = {}, shen = {};
    for (const num of Object.keys(R.diPan)) {
      const gname = GONG_T2T[GONG_NAME[num]] || GONG_NAME[num];
      tian[gname] = R.tianYi[num] || "";
      di[gname] = R.diPan[num] || "";
      const m = R.menPan[num] || "";
      men[gname] = m.length > 1 ? m[0] : m; // 休门→休
      const x = R.tianPan[num] || "";
      xing[gname] = x.length > 1 ? x[1] : x; // 天蓬→蓬
      const s = R.shenPan[num] || "";
      shen[gname] = SHEN_MAP[s] || s; // 值符→符 等
    }
    return {
      "天盤": tian,
      "地盤": di,
      "門": men,
      "星": xing,
      "神": shen,
      "值符值使": {
        "值符星宮": [R.zhiFuStar.length > 1 ? R.zhiFuStar[1] : R.zhiFuStar, GONG_T2T[GONG_NAME[R.zhiFuGong]] || GONG_NAME[R.zhiFuGong]],
        "值使門宮": [R.zhiShiMen.length > 1 ? R.zhiShiMen[0] : R.zhiShiMen, GONG_T2T[GONG_NAME[R.shiZhiGong]] || GONG_NAME[R.shiZhiGong]]
      },
      "排局": String(R.dun) + " " + String(R.curJie) + " " + R.ju + "局",
      "天乙": R.tianYi[5] || ""
    };
  }

  // ── 主计算（对译 compute_qimen_luming，排盘改用引擎 R）──
  function computeQimenLuming(R) {
    return analyzeFromChart(convertChart(R), R.yearGZ, R.monthGZ, R.dayGZ, R.timeGZ);
  }

  function analyzeFromChart(chart, yearGZ, monthGZ, dayGZ, timeGZ) {
    const year_gan = yearGZ[0];
    const benming_gan = _find_year_stem_substitute(year_gan);
    const benming_gong = _find_stem_palace(chart, benming_gan);
    const benming_info = benming_gong ? _get_palace_info(chart, benming_gong) : {};
    const zhifu_zhishi = chart["值符值使"] || {};
    const zhifu_xing_gong = zhifu_zhishi["值符星宮"] || [];
    const zhifu_gong = zhifu_xing_gong.length > 1 ? zhifu_xing_gong[1] : "";
    const zhifu_info = zhifu_gong ? _get_palace_info(chart, zhifu_gong) : {};
    const zhishi_men_gong = zhifu_zhishi["值使門宮"] || [];
    const zhishi_gong = zhishi_men_gong.length > 1 ? zhishi_men_gong[1] : "";
    const zhishi_info = zhishi_gong ? _get_palace_info(chart, zhishi_gong) : {};
    const six_relations = _analyze_six_relations(benming_gan, chart);
    const suppression = _analyze_suppression(benming_gan, benming_gong);
    const pattern_analysis = _analyze_patterns(chart, benming_gong);
    const shen_special = [];
    for (const rel of six_relations) {
      const lq = rel["六親"];
      for (const cat of ["父母", "兄弟", "子孫", "官祿", "疾厄", "妻妾", "財帛"]) {
        if (lq.indexOf(cat) >= 0) {
          const special = _analyze_shen_special(rel["神"], cat);
          if (special) shen_special.push({ "宮位": rel["宮位"], "六親": cat, "神": rel["神全名"], "喜忌": special });
          break;
        }
      }
    }
    const benming_shen = benming_info["神"] || "";
    const benming_door = benming_info["門"] || "";
    const overall = _overall_assessment(benming_gong, benming_shen, benming_door, suppression, pattern_analysis);
    return {
      "排盤": chart,
      "四柱": { "年柱": yearGZ, "月柱": monthGZ, "日柱": dayGZ, "時柱": timeGZ },
      "本命干": benming_gan,
      "本命宮": benming_gong,
      "本命宮資訊": benming_info,
      "值符宮": { "宮位": zhifu_gong, "資訊": zhifu_info, "意義": "天上值符宮之星儀門將為本身；值符下地盤之星儀門將為住宅、為子孫" },
      "值使宮": { "宮位": zhishi_gong, "資訊": zhishi_info, "意義": "值使之門為立業、為妻妾、為官職、為客旅；值使下地盤之星儀八門為地頭、為任所、為子女" },
      "六親分析": six_relations,
      "十干迫制": suppression,
      "格局分析": pattern_analysis,
      "八神喜忌": shen_special,
      "綜合評斷": overall
    };
  }

  window.QMLife = { convertChart, computeQimenLuming, analyzeFromChart, GONG_GRID, GONG_ORDER };

  // ---- UI 层（依赖 qimen.js 排盘结果 window._qmR） ----
  const T2S = { "離":"离","兌":"兑","門":"门","剋":"克","傷":"伤","斷":"断","宮":"宫","總":"总","見":"见","無":"无","婦":"妇","財":"财","孫":"孙","祿":"禄","疾":"疾","厄":"厄","僕":"仆","遠":"远","傳":"传","隱":"隐","繼":"继","賢":"贤","關":"关","閉":"闭","難":"难","陰":"阴","虛":"虚","積":"积","謀":"谋","亂":"乱","勝":"胜","負":"负","營":"营","殘":"残","儀":"仪","為":"为","當":"当","處":"处","發":"发","達":"达","顯":"显","赫":"赫","威":"威","權":"权","掣":"掣","縛":"缚","衷":"衷","蕩":"荡","資":"资","勢":"势","竄":"窜","變":"变","襲":"袭","擊":"击","斬":"斩","殺":"杀","義":"义","書":"书","畫":"画","黨":"党","獨":"独","穢":"秽","寬":"宽","盜":"盗","劫":"劫","險":"险","惡":"恶","毒":"毒","晦":"晦","暗":"暗","滯":"滞","昏":"昏","迷":"迷","彩":"彩","裝":"装","實":"实","從":"从","檢":"检","聞":"闻","膽":"胆","國":"国","敵":"敌","風":"风","塵":"尘","際":"际","會":"会","滄":"沧","桑":"桑","醉":"醉","仙":"仙","疆":"疆","場":"场","職":"职","位":"位","升":"升","遷":"迁","絕":"绝","屈":"屈","躬":"躬","卑":"卑","諂":"谄","盡":"尽","守":"守","貞":"贞","儉":"俭","慈":"慈","謙":"谦","懷":"怀","惠":"惠","敬":"敬","摯":"挚","篤":"笃","昭":"昭","雪":"雪","誦":"诵","諳":"谙","尚":"尚","貴":"贵","瑩":"莹","澈":"澈","馴":"驯","誑":"诳","矯":"矫","語":"语","貳":"贰","恭":"恭","順":"顺","曠":"旷","飄":"飘","逸":"逸","瀟":"潇","灑":"洒","覊":"羁","開":"开","時":"时","將":"将","後":"后","斷":"断","厭":"厌","頑":"顽","詐":"诈","賊":"贼","穢":"秽","麗":"丽","關":"关","過":"过","歸":"归","歲":"岁","龍":"龙","鳳":"凤","孫":"孙","華":"华","門":"门","問":"问","間":"间","閑":"闲","隱":"隐","憂":"忧","愁":"愁","繼":"继","嗣":"嗣","絕":"绝","監":"监","虧":"亏","螢":"萤","夥":"伙","淺":"浅","濱":"滨","詢":"询","誤":"误","調":"调","誼":"谊","諳":"谙","誦":"诵","詳":"详","試":"试","詩":"诗","詞":"词","評":"评","誰":"谁","課":"课","論":"论","講":"讲","謁":"谒","謙":"谦","謗":"谤","譜":"谱","警":"警","議":"议","護":"护","讀":"读","變":"变","讓":"让","讚":"赞","豊":"丰","豈":"岂","豎":"竖","豐":"丰","貝":"贝","負":"负","貢":"贡","貧":"贫","貨":"货","販":"贩","貪":"贪","貫":"贯","責":"责","貴":"贵","敗":"败","賬":"账","質":"质","賺":"赚","贅":"赘","贈":"赠","贖":"赎","贓":"赃","車":"车","軌":"轨","軍":"军","軒":"轩","軟":"软","軸":"轴","輕":"轻","較":"较","載":"载","輔":"辅","輩":"辈","輪":"轮","辭":"辞","辦":"办","邊":"边","邏":"逻","違":"违","選":"选","遺":"遗","遲":"迟","遷":"迁","適":"适","遠":"远","還":"还","鄉":"乡","鄰":"邻","鄭":"郑","郵":"邮","醜":"丑","醫":"医","醬":"酱","釋":"释","鐘":"钟","鎮":"镇","鏡":"镜","鐵":"铁","鑑":"鉴","鑰":"钥","長":"长","門":"门","閃":"闪","閉":"闭","問":"问","閒":"闲","間":"间","開":"开","陽":"阳","陰":"阴","隊":"队","階":"阶","隨":"随","隱":"隐","雖":"虽","雙":"双","雜":"杂","雞":"鸡","離":"离","難":"难","電":"电","露":"露","霸":"霸","響":"响","驚":"惊","體":"体","鬥":"斗","鬧":"闹","魚":"鱼","鳥":"鸟","麗":"丽","麥":"麦","黃":"黄","黑":"黑","齊":"齐","龍":"龙","龜":"龟" };
  function t2s(s) { if (!s) return s; let r = ""; for (const c of String(s)) r += T2S[c] || c; return r; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  window.qimenLumingInit = function () {
    const btn = document.getElementById("qml-go");
    if (!btn) return;
    const box = document.getElementById("qml-out");
    btn.onclick = function () {
      const R = window._qmR;
      if (!R) { box.innerHTML = '<div class="qm-si">请先在上方完成起局占断，再生成奇门禄命。</div>'; return; }
      try {
        const res = computeQimenLuming(R);
        const chart = res["排盤"];
        const sizhu = res["四柱"];
        let h = '<h3>奇门禄命（kinastro/MIT qimen_luming.py 对译）</h3>';
        h += '<div class="qm-si">排局：' + esc(t2s(chart["排局"])) + ' · 本命干（年干）：' + esc(t2s(res["本命干"])) + ' · 本命宫：' + esc(t2s(res["本命宮"] || "未入盘")) + '</div>';
        h += '<div class="qm-verdict"><b>四柱</b>：年 ' + esc(t2s(sizhu["年柱"])) + ' · 月 ' + esc(t2s(sizhu["月柱"])) + ' · 日 ' + esc(t2s(sizhu["日柱"])) + ' · 时 ' + esc(t2s(sizhu["時柱"])) + '</div>';
        // 九宫盘
        h += '<details open><summary>九宫盘（★=本命宫）</summary><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:6px 0;">';
        for (const row of GONG_GRID) for (const gong of row) {
          const tp = chart["天盤"][gong] || "", dp = chart["地盤"][gong] || "", m = chart["門"][gong] || "", x = chart["星"][gong] || "", s = chart["神"][gong] || "";
          const isBm = gong === res["本命宮"];
          const isZhong = gong === "中";
          h += '<div style="border:1px solid var(--line);border-radius:6px;padding:6px;text-align:center;font-size:12px;line-height:1.7;' + (isBm ? 'border-color:#e06c6c;background:rgba(224,108,108,0.08);' : '') + (isZhong ? 'border-color:#d8b45a;' : '') + '"><b>' + esc(gong) + '</b>' + (isBm ? ' <span style="color:#e06c6c;">★本命</span>' : '') + '<br>' + (isZhong ? '天乙：' + esc(t2s(chart["天乙"])) + '<br>地：' + esc(t2s(dp)) : '<span style="color:#d8b45a;">神</span> ' + esc(t2s(SHEN_FULLNAME[s] || s)) + '<br><span style="color:#a78bfa;">星</span> ' + esc(t2s(x)) + '<br><span style="color:#60a5fa;">门</span> ' + esc(t2s(m)) + '<br>天 ' + esc(t2s(tp)) + ' / 地 ' + esc(t2s(dp))) + '</div>';
        }
        h += '</div></details>';
        // 本命宫/值符/值使
        h += '<div class="qm-verdict"><b>本命宫</b>：' + esc(t2s(res["本命宮"] || "未入盘（年干奇仪不在盘中）")) + ' · <b>值符宫</b>：' + esc(t2s(res["值符宮"]["宮位"])) + '（' + esc(t2s((res["值符宮"]["資訊"] && res["值符宮"]["資訊"]["星"]) || "")) + '星 ' + esc(t2s((res["值符宮"]["資訊"] && res["值符宮"]["資訊"]["門"]) || "")) + '门） · <b>值使宫</b>：' + esc(t2s(res["值使宮"]["宮位"])) + '（' + esc(t2s((res["值使宮"]["資訊"] && res["值使宮"]["資訊"]["門"]) || "")) + '门）</div>';
        // 六亲分析（按六亲分组）
        h += '<details open><summary>六亲分析（本命年干五行为主，各宫奇仪生克）</summary>';
        const groups = {};
        for (const rel of res["六親分析"]) (groups[rel["六親"]] = groups[rel["六親"]] || []).push(rel);
        for (const lq of Object.keys(groups)) {
          h += '<div style="margin:6px 0;"><b>' + esc(t2s(lq)) + '</b>';
          for (const rel of groups[lq]) {
            h += '<div class="qm-si" style="margin:4px 0 4px 12px;">' + esc(t2s(rel["宮位"])) + '宫 · 天干 ' + esc(t2s(rel["天干"])) + '（' + esc(t2s(rel["天干五行"])) + esc(t2s(rel["天干陰陽"])) + '） · 门 ' + esc(t2s(rel["門"])) + ' · 星 ' + esc(t2s(rel["星"])) + ' · 神 ' + esc(t2s(rel["神全名"])) + '</div>';
            const dd = rel["門斷語"];
            if (dd && Object.keys(dd).length) {
              h += '<div class="qm-si" style="margin:2px 0 2px 12px;color:#8fbf8f;">' + esc(t2s(dd.summary || "")) + (dd["斷語"] ? '——' + esc(t2s(dd["斷語"])) : '');
              for (const sub of ["官祿", "疾厄", "妻妾", "財帛"]) if (dd[sub]) h += '<br>　' + esc(t2s(sub)) + '：' + esc(t2s(dd[sub]));
              h += '</div>';
            }
            if (rel["神性情"]) h += '<div class="qm-si" style="margin:2px 0 2px 12px;">八将性情：' + esc(t2s(rel["神性情"])) + '</div>';
          }
          h += '</div>';
        }
        h += '</details>';
        // 八神喜忌
        if (res["八神喜忌"].length) {
          h += '<details open><summary>八神（八将）特殊喜忌</summary>';
          for (const sp of res["八神喜忌"]) h += '<div class="qm-si">' + esc(t2s(sp["宮位"])) + '宫（' + esc(t2s(sp["六親"])) + '）——' + esc(t2s(sp["神"])) + '：' + esc(t2s(sp["喜忌"])) + '</div>';
          h += '</details>';
        }
        // 十干迫制
        if (res["十干迫制"]) h += '<div class="qm-verdict xiong"><b>十干迫制</b>：' + esc(t2s(res["十干迫制"])) + '</div>';
        // 格局
        if (res["格局分析"].length) {
          h += '<details open><summary>格局分析</summary>';
          for (const p of res["格局分析"]) {
            const bad = XIONG_KEYWORDS.some(w => p.indexOf(w) >= 0);
            const good = p.indexOf("吉") >= 0 || p.indexOf("貴") >= 0;
            h += '<div class="qm-si ' + (bad ? 'xiong' : good ? 'ji' : '') + '">' + esc(t2s(p)) + '</div>';
          }
          h += '</details>';
        }
        // 综合评断
        h += '<div class="qm-verdict ' + (res["格局分析"].some(p => XIONG_KEYWORDS.some(w => p.indexOf(w) >= 0)) ? 'xiong' : 'ji') + '"><b>综合评断</b>：' + esc(t2s(res["綜合評斷"])) + '</div>';
        h += '<div class="qm-si muted" style="margin-top:8px;">奇门禄命算法对译 kinastro(MIT) qimen_luming.py（现代整理层），断语口径依据《奇门遁甲》禄命篇；判定逻辑逐条照原文实现，无删改。排盘取自本页奇门遁甲引擎（拆补/置闰 × 转盘/飞盘）。</div>';
        box.innerHTML = h;
      } catch (e) {
        box.innerHTML = '<div class="qm-si xiong">分析失败：' + esc(e && e.message) + '</div>';
      }
    };
  };
})();
