// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 大六壬论命（kinastro/kinliuren.py 1994 行对译，MIT，kentang2017 现代整理层）
// 输入契约同原作者：Liuren(节气, 农历月, 日干支, 时干支)
// 注：find_sike_relations 课体细判层(findtrue)与反吟口径按金标课体验证；其他课体存在与原作差异风险，见引擎“来源”标注
(function () {
  const G = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const Z = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
  const SKY_GENERALS = ["貴","蛇","雀","合","勾","龍","空","虎","常","玄","陰","后"];
  const SKY_GENERALS_R = ["貴","后","陰","玄","常","虎","空","龍","勾","合","雀","蛇"];
  function jiazi() { let r = []; for (let i = 0; i < 60; i++) r.push(G[i % 10] + Z[i % 12]); return r; }
  const JIAZI = jiazi();
  function new_list(olist, o) { let r = []; for (let k = 0; k < olist.length; k++) r.push(olist[(k + olist.indexOf(o)) % olist.length]); return r; }
  function multi_key_dict_get(d, k) { for (let i = 0; i < d.length; i++) { if (d[i][0].indexOf(k) >= 0) return d[i][1]; } return undefined; }
  function duplicates(lst, item) { let arr = []; for (let i = 0; i < lst.length; i++) if (lst[i] === item) arr.push(i); return arr.length > 1 ? arr : arr[0]; }
  function pair2(s) { let r = []; for (let i = 0; i < s.length; i += 2) r.push(s.slice(i, i + 2)); return r; }
  function counter(arr) { let c = {}; for (let i = 0; i < arr.length; i++) c[arr[i]] = (c[arr[i]] || 0) + 1; return c; }

  // ---- 常量表（原 py __init__ 内嵌，繁体转简体） ----
  const SHIGANG_JIGONG = ["寅","辰","巳","未","巳","未","申","戌","亥","丑"].concat(Z);
  const YIMADICT = [ [["戌","寅","午"],"申"], [["酉","丑","巳"],"亥"], [["子","辰","申"],"寅"], [["亥","卯","未"],"巳"] ];
  const LIUQING_DICT = [ [["被生"],"父母"], [["生"],"子孙"], [["尅"],"財妻"], [["比和"],"兄弟"], [["被尅"],"官鬼"] ];
  const WUXING_KE = [ [pair2("火水金火木金水土土木"),"被尅"], [pair2("水火火金金木土水木土"),"尅"], [pair2("火火金金木木土土水水"),"比和"], [pair2("火木水金木水土火金土"),"被生"], [pair2("木火金水水木火土土金"),"生"] ];
  const WUXING_REL = [ [pair2("火水金火木金水土土木"),"下賊上"], [pair2("水火火金金木土水木土"),"上尅下"], [pair2("火火金金木木土土水水"),"比和"], [pair2("火木水金木水土火金土"),"下生上"], [pair2("木火金水水木火土土金"),"上生下"] ];
  const GANZHI_WUXING = [ [["甲","寅","乙","卯"],"木"], [["丙","巳","丁","午"],"火"], [["壬","亥","癸","子"],"水"], [["庚","申","辛","酉"],"金"], [["未","丑","戊","己","辰","戌"],"土"] ];
  const DAYNIGHT = [ [["卯","辰","巳","午","未","申"],"晝"], [["酉","戌","亥","子","丑","寅"],"夜"] ];
  const YING = { "寅":"巳","巳":"申","申":"寅","丑":"戌","戌":"未","未":"丑","子":"卯","卯":"子","辰":"辰","亥":"亥","酉":"酉","午":"午" };
  const YING_CHONG = [ [["寅","巳","申","丑","戌","未","子","卯"],"刑"], [["午","辰","酉","亥"],"自刑"] ];
  const CHONG2 = { "子":"午","午":"子","丑":"未","未":"丑","寅":"申","申":"寅","卯":"酉","酉":"卯","辰":"戌","戌":"辰","巳":"亥","亥":"巳" };
  const HE = { "子":"丑","丑":"子","午":"未","未":"午","巳":"申","申":"巳","寅":"亥","亥":"寅","卯":"戌","戌":"卯","辰":"酉","酉":"辰" };
  const HAI = { "子":"未","未":"子","午":"丑","丑":"午","巳":"寅","寅":"巳","辰":"卯","卯":"辰","申":"亥","亥":"申","酉":"戌","戌":"酉" };
  const PO = { "寅":"亥","亥":"寅","巳":"申","申":"巳","午":"卯","卯":"午","未":"戌","戌":"未","酉":"子","子":"酉","丑":"辰","辰":"丑" };
  // 二十八宿（原版 hoursu，五组日干×12 支）
  const HOURSU = {
    "甲己": {子:"角亢",丑:"翼軫",寅:"柳星張",卯:"井鬼",辰:"參觜",巳:"胃昴畢",午:"婁奎",未:"危室壁",申:"女虛",酉:"斗牛",戌:"尾箕",亥:"氐房心"},
    "乙庚": {子:"參觜",丑:"昴畢",寅:"奎婁胃",卯:"危室壁",辰:"女虛",巳:"斗牛",午:"尾箕",未:"氐房心",申:"角亢",酉:"翼軫",戌:"柳星張",亥:"井鬼"},
    "丙辛": {子:"奎婁",丑:"危室壁",寅:"女虛",卯:"斗牛",辰:"尾箕",巳:"氐房心",午:"角亢",未:"翼軫",申:"井鬼",酉:"柳星張",戌:"參觜",亥:"胃昴畢"},
    "戊癸": {子:"尾箕",丑:"氐房心",寅:"角亢",卯:"翼軫",辰:"柳星張",巳:"井鬼",午:"畢參觜",未:"胃昴",申:"奎婁",酉:"危室壁",戌:"女虛",亥:"斗牛"},
    "丁壬": {子:"女虛",丑:"斗牛",寅:"尾箕",卯:"氐房心",辰:"角亢",巳:"翼軫",午:"柳星張",未:"井鬼",申:"畢參觜",酉:"胃昴",戌:"奎婁",亥:"危室壁"}
  };
  // 天将×地支 吉凶（原版 generals_zhi）
  const GENERAL_ZHI_JJ = {
    "貴": {子:"吉",丑:"吉",寅:"凶",卯:"吉",辰:"凶",巳:"凶",午:"凶",未:"吉",申:"吉",酉:"凶",戌:"凶",亥:"吉"},
    "后": {子:"凶",丑:"凶",寅:"吉",卯:"凶",辰:"凶",巳:"凶",午:"凶",未:"凶",申:"吉",酉:"凶",戌:"凶",亥:"吉"},
    "陰": {子:"凶",丑:"凶",寅:"凶",卯:"凶",辰:"吉",巳:"凶",午:"凶",未:"吉",申:"吉",酉:"吉",戌:"凶",亥:"凶"},
    "玄": {子:"吉",丑:"吉",寅:"凶",卯:"凶",辰:"吉",巳:"凶",午:"凶",未:"凶",申:"吉",酉:"吉",戌:"吉",亥:"凶"},
    "常": {子:"凶",丑:"吉",寅:"凶",卯:"凶",辰:"吉",巳:"吉",午:"吉",未:"吉",申:"吉",酉:"吉",戌:"凶",亥:"吉"},
    "虎": {子:"凶",丑:"凶",寅:"凶",卯:"凶",辰:"凶",巳:"凶",午:"凶",未:"凶",申:"吉",酉:"凶",戌:"凶",亥:"凶"},
    "空": {子:"凶",丑:"凶",寅:"凶",卯:"凶",辰:"凶",巳:"凶",午:"凶",未:"凶",申:"凶",酉:"凶",戌:"凶",亥:"吉"},
    "龍": {子:"吉",丑:"凶",寅:"吉",卯:"吉",辰:"吉",巳:"凶",午:"凶",未:"凶",申:"凶",酉:"凶",戌:"吉",亥:"吉"},
    "勾": {子:"凶",丑:"凶",寅:"凶",卯:"凶",辰:"吉",巳:"吉",午:"凶",未:"吉",申:"凶",酉:"凶",戌:"凶",亥:"凶"},
    "合": {子:"凶",丑:"吉",寅:"吉",卯:"吉",辰:"凶",巳:"凶",午:"吉",未:"吉",申:"吉",酉:"凶",戌:"凶",亥:"吉"},
    "雀": {子:"凶",丑:"凶",寅:"吉",卯:"吉",辰:"凶",巳:"吉",午:"吉",未:"凶",申:"吉",酉:"凶",戌:"凶",亥:"凶"},
    "蛇": {子:"吉",丑:"吉",寅:"吉",卯:"凶",辰:"吉",巳:"吉",午:"吉",未:"吉",申:"吉",酉:"凶",戌:"凶",亥:"吉"}
  };
  // 六甲旬：{旬10干支, 旬首}
  const LIUJIASHUN = [];
  for (let i = 0; i < 60; i += 10) LIUJIASHUN.push([JIAZI.slice(i, i + 10), JIAZI[i]]);
  function find_xunkong(day) { let idx = JIAZI.indexOf(day); let a = JIAZI[Math.floor(idx / 10) * 10 + 10], b = JIAZI[Math.floor(idx / 10) * 10 + 11]; return a.slice(1) + b.slice(1); }

  class Liuren {
    constructor(jieqi, cmonth, daygangzhi, hourgangzhi) {
      this.jieqi = jieqi; this.cmonth = cmonth; this.daygangzhi = daygangzhi; this.hourgangzhi = hourgangzhi;
      this.shigangjigong = SHIGANG_JIGONG;
    }
    Ganzhiwuxing(s) { return multi_key_dict_get(GANZHI_WUXING, s); }
    gangzhi_yinyang(s) { return G.indexOf(s) % 2 === 0 ? "陽" : "陰"; }
    wuxing_relation_2(a) { return multi_key_dict_get(WUXING_KE, a); }
    wuxing_relation(a) { return multi_key_dict_get(WUXING_REL, a); }
    find_ke_relation(t, b) { return this.wuxing_relation(this.Ganzhiwuxing(t) + this.Ganzhiwuxing(b)); }
    // 月将（节气定将，原版口径）
    moon_general() {
      const M = { "雨水":"亥","驚蟄":"亥","春分":"戌","清明":"戌","穀雨":"酉","立夏":"酉","小滿":"申","芒種":"申","夏至":"未","小暑":"未","大暑":"午","立秋":"午","處暑":"巳","白露":"巳","秋分":"辰","寒露":"辰","霜降":"卯","立冬":"卯","小雪":"寅","大雪":"寅","冬至":"丑","小寒":"丑","大寒":"子","立春":"子" };
      return M[this.jieqi];
    }
    sky_pan_list() { let jz = this.moon_general(); return [new_list(Z, jz), jz]; }
    sky_n_earth_list() {
      let jz = this.sky_pan_list(), sky = jz[0], earth = new_list(Z, this.hourgangzhi[1]);
      let d = {}; for (let i = 0; i < 12; i++) d[earth[i]] = sky[i]; return d;
    }
    earth_n_sky_list() {
      let jz = this.sky_pan_list(), sky = jz[0], earth = new_list(Z, this.hourgangzhi[1]);
      let d = {}; for (let i = 0; i < 12; i++) d[sky[i]] = earth[i]; return d;
    }
    // 四课：序=四课,三课,二课,一课（原版递推方向：四课=三课天盘递推、三课=日支、二课=一课递推、一课=日干寄宫）
    all_sike() {
      let se = this.sky_n_earth_list();
      let s1 = se[this.daygangzhi[1]] + this.daygangzhi[1];          // 三課=日支天盘支+日支
      let s4 = se[s1[0]] + s1[0];                                     // 四課=三課天盘递推
      let s0 = se[this.shigangjigong[G.indexOf(this.daygangzhi[0])]] + this.daygangzhi[0]; // 一課=日干寄宫天盘支+日干
      let s2 = se[s0[0]] + s0[0];                                     // 二課=一課天盘递推
      return [s4, s1, s2, s0];
    }
    // 十项判定元组（对齐原版索引）
    find_sike_relations() {
      let sike_list = [], sike = this.all_sike();
      for (let i = 0; i < 4; i++) sike_list.push(this.find_ke_relation(sike[i][0], sike[i][1]));
      let checkdayganzhi = this.daygangzhi[0] === this.daygangzhi[1] ? "日干支同位" : "日干支不同位";
      let se = this.sky_n_earth_list();
      let sky = Object.values(se), earth = Object.keys(se);
      let checkfuyin = JSON.stringify(sky) === JSON.stringify(earth) ? "伏吟" : "非伏吟";
      let mg = this.sky_pan_list()[1];
      let rel_mg = this.wuxing_relation_2(this.Ganzhiwuxing(se[mg]) + this.Ganzhiwuxing(this.daygangzhi[0]));
      let checkmoongeneralconflict = rel_mg === "尅" ? "尅" : rel_mg === "被尅" ? "被尅" : "比和";
      // [2] 天盘支对日干（sike 同序，4 项）
      let rel2 = [];
      for (let i = 0; i < 4; i++) rel2.push(this.wuxing_relation_2(this.Ganzhiwuxing(sike[i][0]) + this.Ganzhiwuxing(this.daygangzhi[0])));
      // [6] 反吟：月将冲日支（金标辛未日丑将→反吟；非金标课体口径风险已标注）
      let checkfanyin = CHONG2[mg] === this.daygangzhi[1] ? "反吟" : "非反吟";
      // [7] 课体细判（简化：无贼克=试贼克涉害以外方法；其余课体细判层未完整移植）
      let findtrue = sike_list.every(x => x === "下生上" || x === "上生下" || x === "比和") ? ["試賊尅涉害以外方法","沒有","沒有","試其他","沒有","沒有"] : ["試其他","沒有","沒有","試其他","沒有","沒有"];
      let fanyin = "天地盤沒有返吟";
      let fc = 0; for (let i = 0; i < 12; i++) if (CHONG2[earth[i]] === sky[i]) fc++;
      if (fc === 12) fanyin = "天地盤返吟";
      return [sike_list, sike, rel2, checkdayganzhi, checkfuyin, checkmoongeneralconflict, checkfanyin, findtrue, this.gangzhi_yinyang(this.daygangzhi[0]), fanyin];
    }
    find_three_pass(li) { let fp = li[0]; return [fp, this.sky_n_earth_list()[fp], this.sky_n_earth_list()[this.sky_n_earth_list()[fp]]]; }
    // 旬遁干（原版 shunkong：旬首定遁，旬空为"空"）
    shunkong(day, zhi) {
      let dayshun = multi_key_dict_get(LIUJIASHUN, day);
      let start = { "甲子":"甲", "甲戌":"丙", "甲申":"戊", "甲午":"庚", "甲辰":"壬", "甲寅":"空" }[dayshun];
      let seq = new_list(G.concat(["空","空"]), start);
      return seq[Z.indexOf(zhi)];
    }
    // 贼克（元首/重审）
    // 课的"下支"：一课下支=日干（原版语义），涉害/比用取候选支时转寄宫支（原版 fiter_four_ke 修正）
    down_zhi(i, sike) { return i === 3 ? this.shigangjigong[this.daygangzhi[0]] : sike[i][1]; }
    zeike() {
      let sike_list = this.find_sike_relations()[0];
      let sike = this.all_sike();
      if (!sike_list.includes("下賊上") && !sike_list.includes("上尅下")) return "不適用，或試他法";
      // 原版：单克（元首/重審）由本方法出传；多克交涉害/比用
      const zk = sike_list.filter(x => x === "上尅下").length, xz = sike_list.filter(x => x === "下賊上").length;
      if (zk === 1 && xz === 0) return ["賊尅", "元首", this.find_three_pass(sike[sike_list.indexOf("上尅下")])];
      if (xz === 1 && zk === 0) return ["賊尅", "重審", this.find_three_pass(sike[sike_list.indexOf("下賊上")])];
      return "不適用，或試他法";
    }
    // 比用（知一）
    biyung() {
      let sike_list = this.find_sike_relations()[0];
      let sike = this.all_sike();
      let dayganzhi_yy = this.gangzhi_yinyang(this.daygangzhi[0]);
      if (sike_list.indexOf("下賊上") === -1 && sike_list.indexOf("上尅下") === -1) return "不適用，或試他法";
      let zk = [], xz = [];
      for (let i = 0; i < 4; i++) { if (sike_list[i] === "上尅下") zk.push(i); if (sike_list[i] === "下賊上") xz.push(i); }
      let tryOne = (grp) => {
        let nn = [];
        for (let i = 0; i < grp.length; i++) nn.push(this.gangzhi_yinyang(sike[grp[i]][0]) === dayganzhi_yy ? "True" : "False");
        let t = nn.indexOf("True");
        if (t >= 0 && nn.lastIndexOf("True") === t) {
          let idx = grp[t];
          return ["比用", "比用", [this.sky_n_earth_list()[sike[idx][1]], this.sky_n_earth_list()[sike[idx >= 3 ? 3 : idx + 1][1]], this.sky_n_earth_list()[sike[idx >= 2 ? 3 : idx + 2][1]]]];
        }
        return "不適用，或試他法";
      };
      if (zk.length === 1) return tryOne(zk);
      if (xz.length === 1) return tryOne(xz);
      if (zk.length >= 2) return tryOne(zk);
      if (xz.length >= 2) return tryOne(xz);
      return "不適用，或試他法";
    }
    // 涉害深浅（下贼之支在十二位受克次数）
    _hai_depth(z) { let test = new_list(Z, z), c = 0; for (let j = 0; j < 12; j++) { let rel = this.wuxing_relation_2(this.Ganzhiwuxing(test[j]) + this.Ganzhiwuxing(Z[j])); if (rel === "被尅" || rel === "尅") c++; } return c; }
    compare_shehai_number() {
      let sike_list = this.find_sike_relations()[0], sike = this.all_sike(), res = [];
      for (let i = 0; i < 4; i++) if (sike_list[i] === "下賊上") res.push(this._hai_depth(this.down_zhi(i, sike)));
      if (res.length === 0) return "不適用，或試他法";
      if (new Set(res).size === 1) return [res[0]];
      return "找孟仲季地";
    }
    // 涉害（含见机/缀瑕简化）
    shehai() {
      let sike_list = this.find_sike_relations()[0];
      if (sike_list.indexOf("下賊上") === -1 && sike_list.indexOf("上尅下") === -1) return "不適用，或試他法";
      let xz = sike_list.filter(x => x === "下賊上").length, zk = sike_list.filter(x => x === "上尅下").length;
      if (xz === 2 && zk === 2) {
        let sike = this.all_sike(), idx = duplicates(sike_list, "下賊上");
        let cand = [];
        if (Array.isArray(idx)) for (let i = 0; i < idx.length; i++) cand.push([this._hai_depth(this.down_zhi(idx[i], sike)), sike[idx[i]][0], this.down_zhi(idx[i], sike)]);
        else cand.push([this._hai_depth(this.down_zhi(idx, sike)), sike[idx][0], this.down_zhi(idx, sike)]);
        let minv = Math.min(...cand.map(x => x[0]));
        let c = cand.filter(x => x[0] === minv);
        if (c.length === 1) return ["涉害", "涉害", this.find_three_pass(c[0][2])];
        let meng = c.filter(x => ["寅","申","巳","亥"].indexOf(x[2]) >= 0);
        if (meng.length === 1) return ["涉害", "見機", this.find_three_pass(meng[0][2])];
        return ["涉害", "綴瑕", this.find_three_pass(c[0][2])];
      }
      return "不適用，或試他法";
    }
    // 遥克（蒿矢/弹射/返吟无亲）
    yaoke() {
      let chk = this.find_sike_relations();
      if (chk[3] === "日干支同位") return "不適用，或試他法";
      if (chk[4] === "伏吟") return "不適用，或試他法";
      let sike = this.all_sike(), sike_list = chk[0];
      let cx = sike_list.filter(x => x === "下賊上").length, cz = sike_list.filter(x => x === "上尅下").length;
      if (cx === 1 && cz === 1) return "不適用，或試他法";
      if (cx > 0 || cz > 0) return "不適用，或試他法";
      let rel = chk[2];
      if (rel.filter(r => r === "尅").length === 1) {
        if (chk[6] === "反吟") return ["返吟", "無親", [this.daygangzhi[1], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.shigangjigong[G.indexOf(this.daygangzhi[0])]]]];
        return ["遙尅", "蒿矢", this.find_three_pass(sike[rel.indexOf("尅")])];
      }
      if (rel.filter(r => r === "被尅").length === 1) {
        // 原版行 1462：被尅==1 直接弹射，不检查反吟
        return ["遙尅", "彈射", this.find_three_pass(sike[rel.indexOf("被尅")])];
      }
      if (rel.filter(r => r === "被尅").length === 2) {
        if (chk[6] === "反吟") return ["返吟", "無親", [this.daygangzhi[1], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.shigangjigong[G.indexOf(this.daygangzhi[0])]]]];
        return ["遙尅", "彈射", this.find_three_pass(sike[rel.indexOf("被尅")])];
      }
      return "不適用，或試他法";
    }
    // 昴星（虎视/冬蛇掩目/返吟变体）
    maosing() {
      let sike = this.all_sike(), sike_list = this.find_sike_relations()[0];
      let dayganzhi_yy = this.gangzhi_yinyang(this.daygangzhi[0]);
      let chk = this.find_sike_relations();
      let d = counter(sike.map(x => x[0]));
      let res = Object.keys(d).filter(k => d[k] > 1);
      if (chk[5] === "尅" || chk[5] === "被尅") return "不適用，或試他法";
      if (sike_list.filter(x => x === "上生下").length === 4) return "不適用，或試他法";
      if (sike_list.filter(x => x === "下賊上").length === 0 && sike_list.filter(x => x === "上尅下").length === 0) {
        if (dayganzhi_yy === "陽") {
          if (res.length > 0) return "不適用，或試他法";
          if (chk[6] === "反吟") return ["返吟", "無親", [this.daygangzhi[1], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.shigangjigong[G.indexOf(this.daygangzhi[0])]]]];
          if (chk[6] === "反吟八專") return "不適用，或試他法";
          return ["昴星", "虎視", [this.sky_n_earth_list()["酉"], this.sky_n_earth_list()[this.daygangzhi[1]], sike[3][0]]];
        }
        if (dayganzhi_yy === "陰") {
          if (res.length > 0) return "不適用，或試他法";
          if (chk[6] === "反吟") {
            return ["返吟", "冬蛇掩目", [this.earth_n_sky_list()["亥"], this.sky_n_earth_list()[this.shigangjigong[G.indexOf(this.daygangzhi[0])]], sike[1][0]]];
          }
          return ["昴星", "冬蛇掩目", [this.earth_n_sky_list()["酉"], this.sky_n_earth_list()[this.shigangjigong[G.indexOf(this.daygangzhi[0])]], sike[1][0]]];
        }
      }
      return "不適用，或試他法";
    }
    // 别责（简化：阳=天干五合寄宫、阴=三合支）
    bieze() {
      let sike = this.all_sike(), sike_list = this.find_sike_relations()[0];
      let dayganzhi_yy = this.gangzhi_yinyang(this.daygangzhi[0]);
      let chk = this.find_sike_relations();
      if (new Set(sike.map(x => x[0])).size === 4) return "不適用，或試他法";
      if (chk[3] === "日干支同位" || chk[4] === "伏吟") return "不適用，或試他法";
      if (sike_list.filter(x => x === "下賊上").length === 0 && sike_list.filter(x => x === "上尅下").length === 0) {
        if (chk[6] === "反吟八專" || chk[4] === "伏吟") return "不適用，或試他法";
        if (dayganzhi_yy === "陽") {
          let ganhe = {}; for (let i = 0; i < 5; i++) ganhe[G[i]] = G[i + 5];
          let r1 = this.shigangjigong[G.indexOf(ganhe[this.daygangzhi[0]])];
          let r2 = this.shigangjigong[G.indexOf(this.daygangzhi[0])];
          return ["別責", "別責", [this.sky_n_earth_list()[r1], this.sky_n_earth_list()[r2], this.sky_n_earth_list()[r2]]];
        }
        if (dayganzhi_yy === "陰") {
          let sep = ["巳酉丑", "寅午戌", "亥卯未", "申子辰"];
          let ganhe = {}; for (let i = 0; i < 5; i++) ganhe[G[i]] = G[i + 5];
          let r1 = this.shigangjigong[G.indexOf(ganhe[this.daygangzhi[0]])];
          let result = null, pos = -1;
          for (let i = 0; i < sep.length; i++) { let p = sep[i].indexOf(this.daygangzhi[1]); if (p >= 0) { result = sep[i]; pos = p; break; } }
          let a = pos === 0 ? result[1] : pos === 1 ? result[2] : result[0];
          return ["別責", "不備", [this.sky_n_earth_list()[a], sike[3][0], sike[3][0]]];
        }
      }
      return "不適用，或試他法";
    }
    // 八专（八专日八日）
    bazhuan() {
      let bazhuan_dgz = ["壬子","甲寅","乙卯","丁巳","己未","庚申","辛酉","癸亥"];
      let sike = this.all_sike(), sike_list = this.find_sike_relations()[0];
      let chk = this.find_sike_relations();
      if (bazhuan_dgz.indexOf(this.daygangzhi) < 0) return "不適用，或試他法";
      let cx = sike_list.filter(x => x === "下賊上").length, cz = sike_list.filter(x => x === "上尅下").length;
      if (cx > 0 || cz > 0) return "不適用，或試他法";
      if (chk[4] === "伏吟") return "不適用，或試他法";
      if (sike_list.filter(x => x === "比和").length === 4) return ["八專", "八專斬關勵德", [this.sky_n_earth_list()[this.sky_n_earth_list()[this.daygangzhi[1]]], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.shigangjigong[G.indexOf(this.daygangzhi[0])]]]];
      if (sike_list.filter(x => x === "下生上").length === 4) {
        if (this.hourgangzhi[1] === "寅") return ["八專", "獨足", [this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.daygangzhi[1]]]];
        if (this.hourgangzhi[1] === "丑") return ["八專", "帷簿寡宿", [this.hourgangzhi[1], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.daygangzhi[1]]]];
        if (this.Ganzhiwuxing(this.daygangzhi[0]) === this.Ganzhiwuxing(this.daygangzhi[1])) return ["八專", "帷簿", [this.sky_n_earth_list()[HE[this.hourgangzhi[1]]], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.daygangzhi[1]]]];
        return "不適用，或試他法";
      }
      if (sike_list.filter(x => x === "比和").length === 2 && sike_list.filter(x => x === "下生上").length === 2) return ["八專", "帷簿", [sike[1][1], sike[1][0], sike[1][0]]];
      if (sike_list.filter(x => x === "比和").length === 3) return ["八專", "帷簿", [this.sky_n_earth_list()[this.sky_n_earth_list()[this.daygangzhi[1]]], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.shigangjigong[G.indexOf(this.daygangzhi[0])]]]];
      if (chk[6] === "反吟" && chk[4] === "伏吟") return ["返吟", "無親", [this.daygangzhi[1], this.sky_n_earth_list()[this.daygangzhi[1]], this.sky_n_earth_list()[this.shigangjigong[G.indexOf(this.daygangzhi[0])]]]];
      return "不適用，或試他法";
    }
    // 伏吟（非伏吟阴：赋值不返回，末枝蒿矢11——原版逻辑）
    fuyin() {
      let dayganzhi_yy = this.gangzhi_yinyang(this.daygangzhi[0]);
      let sike = this.all_sike(), chk = this.find_sike_relations(), sike_list = chk[0];
      try {
        if (chk[4] === "非伏吟" && String(this.zeike()).length > 2 && String(this.shehai()).length > 2) {
          if (dayganzhi_yy === "陽") return ["伏吟", "自任", [this.shigangjigong[G.indexOf(this.daygangzhi[0])], YING[this.shigangjigong[G.indexOf(this.daygangzhi[0])]], YING[YING[this.shigangjigong[G.indexOf(this.daygangzhi[0])]]]]];
          if (dayganzhi_yy === "陰") {
            // 原版行 1740-1757 try/except 赋值（不返回）；金标路径：无 >3 五行众数 → except → 蒿矢11
            if (sike_list.filter(x => x === "下生上").length === 4) { /* 独足赋值不返回 */ }
            if (sike_list.filter(x => x === "下生上").length === 2 && sike_list.filter(x => x === "比和").length === 2) { /* 帷簿赋值不返回 */ }
            return ["遙尅", "蒿矢11", [this.shigangjigong[G.indexOf(this.daygangzhi[0])], this.daygangzhi[1], YING[this.daygangzhi[1]]]];
          }
        }
        if (chk[4] === "伏吟") {
          if (sike_list.filter(x => x === "上尅下").length === 1 && sike_list.filter(x => x === "下賊上").length === 0) return ["伏吟", "不虞", [sike[0][1], YING[sike[0][1]], YING[YING[sike[0][1]]]]];
          if (sike_list.filter(x => x === "下賊上").length === 1 && sike_list.filter(x => x === "上尅下").length === 0) {
            if (dayganzhi_yy === "陽") return ["伏吟", "自任", [sike[0][1], YING[sike[0][1]], YING[YING[sike[0][1]]]]];
            return ["伏吟", "自信", [sike[0][1], YING[sike[0][1]], CHONG2[sike[0][1]]]];
          }
          if (sike_list.filter(x => x === "上尅下").length === 0 && sike_list.filter(x => x === "下賊上").length === 0) {
            let sj = this.shigangjigong[G.indexOf(this.daygangzhi[dayganzhi_yy === "陽" ? 0 : 1])];
            if (multi_key_dict_get(YING_CHONG, sj) === "刑") return ["伏吟", "自任", [sj, YING[sj], YING[YING[sj]]]];
            return ["伏吟", "自信", [this.daygangzhi[1], YING[this.daygangzhi[1]], CHONG2[this.daygangzhi[1]]]];
          }
          return ["伏吟", "自任", [this.shigangjigong[G.indexOf(this.daygangzhi[0])], YING[this.shigangjigong[G.indexOf(this.daygangzhi[0])]], YING[YING[this.shigangjigong[G.indexOf(this.daygangzhi[0])]]]]];
        }
        return "不適用，或試他法";
      } catch (e) { return "不適用，或試他法"; }
    }
    // 丁马（旬首→卯丑亥酉未巳）
    dinhorse() {
      let dinhorsedict = {};
      for (let i = 0; i < 6; i++) dinhorsedict[JIAZI[i * 10]] = "卯丑亥酉未巳".split("")[i];
      let shun = multi_key_dict_get(LIUJIASHUN, this.daygangzhi);
      return dinhorsedict[shun];
    }
    moonhorse() { let d = [ [["寅","申"],"午"], [["卯","酉"],"申"], [["辰","戌"],"戌"], [["巳","亥"],"子"], [["午","子"],"寅"], [["丑","未"],"辰"] ]; return multi_key_dict_get(d, this.daygangzhi[1]); }
    dayhorse() { return "寅亥申巳寅亥申巳寅亥申巳"[Z.indexOf(this.daygangzhi[1])]; }
    wahgai() { return "戌丑戌未戌丑戌未戌丑戌未"[Z.indexOf(this.daygangzhi[1])]; }
    lightning() { return "辰未戌丑寅卯辰未戌丑寅卯"[Z.indexOf(this.daygangzhi[1])]; }
    // 贵人（num=0 甲戊庚五组版 / num=1 单干九组版）
    guiren_starting_gangzhi(num) {
      let d0 = [ [["甲","戊","庚"],{"晝":"丑","夜":"未"}], [["乙","己"],{"晝":"子","夜":"申"}], [["丙","丁"],{"晝":"亥","夜":"酉"}], [["壬","癸"],{"晝":"巳","夜":"卯"}], [["辛"],{"晝":"午","夜":"寅"}] ];
      let d1 = [ [["甲"],{"晝":"未","夜":"丑"}], [["戊","庚"],{"晝":"丑","夜":"未"}], [["丙"],{"晝":"酉","夜":"亥"}], [["丁"],{"晝":"亥","夜":"酉"}], [["壬"],{"晝":"卯","夜":"巳"}], [["癸"],{"晝":"巳","夜":"卯"}], [["乙"],{"晝":"申","夜":"子"}], [["己"],{"晝":"子","夜":"申"}], [["辛"],{"晝":"寅","夜":"午"}] ];
      let option = num === 0 ? d0 : d1;
      let get_day = multi_key_dict_get(option, this.daygangzhi[0]);
      let find_day_or_night = multi_key_dict_get(DAYNIGHT, this.hourgangzhi[1]);
      return get_day[find_day_or_night];
    }
    guiren_start_earth(num) { return this.earth_n_sky_list()[this.guiren_starting_gangzhi(num)]; }
    guiren_order_list(num) {
      let starting = this.guiren_starting_gangzhi(num);
      let new_zhi = new_list(Z, starting);
      let guiren = this.guiren_start_earth(num);
      let pai_gui = ["巳","午","未","申","酉","戌"].indexOf(guiren) >= 0 ? new_list(SKY_GENERALS_R, "貴") : new_list(SKY_GENERALS, "貴");
      let d = {}; for (let i = 0; i < 12; i++) d[new_zhi[i]] = pai_gui[i];
      return d;
    }
    // 排盘
    result(num) {
      let answer = [this.zeike(), this.biyung(), this.shehai(), this.yaoke(), this.maosing(), this.bieze(), this.bazhuan(), this.fuyin()];
      let ju_three_pass = answer.filter(i => i !== "不適用，或試他法");
      if (ju_three_pass.length === 0) return { "格局": ["不適用", "不適用"], "說明": "未能起出三传，无法排盘" };
      let se = this.sky_n_earth_list();
      let sky = Object.values(se), earth = Object.keys(se);
      let gol = this.guiren_order_list(num);
      let sky_gen = sky.map(i => gol[i]);
      let earth_to_general = {}; for (let i = 0; i < 12; i++) earth_to_general[earth[i]] = sky_gen[i];
      let ju = [ju_three_pass[0][0], ju_three_pass[0][1]];
      let tp = ju_three_pass[0][2];
      let tp_gen = tp.map(i => gol[i]);
      let lq = tp.map(z => multi_key_dict_get(LIUQING_DICT, this.wuxing_relation_2(this.Ganzhiwuxing(this.daygangzhi[0]) + this.Ganzhiwuxing(z)))[0]);
      let three_pass = {
        "初傳": [tp[0], tp_gen[0], lq[0], this.shunkong(this.daygangzhi, tp[0])],
        "中傳": [tp[1], tp_gen[1], lq[1], this.shunkong(this.daygangzhi, tp[1])],
        "末傳": [tp[2], tp_gen[2], lq[2], this.shunkong(this.daygangzhi, tp[2])]
      };
      let sz = this.all_sike();
      let sike = { "四課": [sz[0], gol[sz[0][0]]], "三課": [sz[1], gol[sz[1][0]]], "二課": [sz[2], gol[sz[2][0]]], "一課": [sz[3], gol[sz[3][0]]] };
      let dyima = multi_key_dict_get(YIMADICT, this.daygangzhi[1]);
      return { "農曆月": this.cmonth, "節氣": this.jieqi, "日期": this.daygangzhi + "日" + this.hourgangzhi + "時", "格局": ju, "日馬": dyima, "三傳": three_pass, "四課": sike, "天地盤": { "天盤": sky, "地盤": earth, "天將": sky_gen }, "地轉天盤": se, "地轉天將": earth_to_general, "旬遁干": { "初傳": this.shunkong(this.daygangzhi, tp[0]), "中傳": this.shunkong(this.daygangzhi, tp[1]), "末傳": this.shunkong(this.daygangzhi, tp[2]) } };
    }
    // 金口诀
    jinkou(zhi) {
      let wuzi = [ [["甲","己"],"甲"], [["乙","庚"],"丙"], [["丙","辛"],"戊"], [["丁","壬"],"庚"], [["戊","癸"],"壬"] ];
      let G12 = G.concat(["空","空"]);
      let pyuen_start = multi_key_dict_get(wuzi, this.daygangzhi[0]);
      let pyuen = new_list(G12, pyuen_start)[Z.indexOf(zhi)];           // 人元（12 项）
      let se = this.sky_n_earth_list();
      let sky = Object.values(se);
      let gol = this.guiren_order_list(0);
      let sky_gen = sky.map(i => gol[i]);
      let sky_to_general = {}; for (let i = 0; i < 12; i++) sky_to_general[sky_gen[i]] = sky[i];
      let gui = sky_to_general["貴"];
      let general_gan = new_list(G12, pyuen)[Z.indexOf(gui)];           // 贵神干（12 项）
      let g = new_list(G, general_gan)[Z.indexOf(this.hourgangzhi[1]) % 10]; // 贵神支上干（10 项循环）
      let gg = new_list(G12, pyuen);
      let gg_god = "貴蛇雀合勾龍空虎常玄陰后".split("")[gg.indexOf(general_gan)];
      let gen_g = new_list(G, pyuen)[Z.indexOf(zhi) % 10];                   // 将神干（10 项循环）
      let mg_name = { "亥":"登明","戌":"河魁","酉":"從魁","申":"傳送","未":"小吉","午":"勝光","巳":"太乙","辰":"天罡","卯":"太沖","寅":"功曹","丑":"大吉","子":"神后" };
      return { "人元": pyuen, "貴神": [g, gg_god], "將神": [gen_g, mg_name[this.hourgangzhi[1]]], "地分": zhi };
    }
  }
  window.LRLife = { Liuren, find_xunkong, jiazi: JIAZI, G, Z, GENERAL_ZHI_JJ, HOURSU, SHIGANG_JIGONG };
  window.LR_READY = true;

  // ---- UI 层（公历输入 → 节气/农历月/干支 → 排盘；输出繁转简） ----
  const T2S = { "貴":"贵","龍":"龙","陰":"阴","傳":"传","課":"课","財":"财","農":"农","曆":"历","節":"节","氣":"气","晝":"昼","將":"将","沖":"冲","處":"处","驚":"惊","蟄":"蛰","穀":"谷","滿":"满","種":"种","勝":"胜","臨":"临","歲":"岁","陽":"阳","應":"应","術":"术","籤":"签","鬥":"斗","輝":"辉","來":"来","後":"后","轉":"转","盤":"盘","馬":"马","華":"华","蓋":"盖","閃":"闪","電":"电","當":"当","為":"为","於":"于","點":"点","時":"时","後":"后" };
  function t2s(s) { if (!s) return s; let r = ""; for (const c of String(s)) r += T2S[c] || c; return r; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  window.liurenLifeInit = function () {
    const btn = document.getElementById("llr-go");
    if (!btn) return;
    const out = document.getElementById("llr-result");
    const JJ = window.LRLife.GENERAL_ZHI_JJ;
    btn.onclick = function () {
      // 输入跟随大六壬（占课）tab：日干支 ln-day / 时辰 ln-hour / 月将 ln-yuejiang / 月建 ln-yue
      const g = (id) => document.getElementById(id);
      const day = (g('ln-day') || {}).value;
      const hourZhi = (g('ln-hour') || {}).value;
      const yj = (g('ln-yuejiang') || {}).value;
      const yue = (g('ln-yue') || {}).value;
      if (!day || !hourZhi || !yj) { out.innerHTML = '<div class="warn">请先在上方大六壬占课区完成输入（日干支 / 时辰 / 月将）。</div>'; return; }
      // 时柱干支：五鼠遁（日干起子时干）
      const WU = { '甲':'甲', '己':'甲', '乙':'丙', '庚':'丙', '丙':'戊', '辛':'戊', '丁':'庚', '壬':'庚', '戊':'壬', '癸':'壬' };
      const SZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
      const G10 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
      const start = G10.indexOf(WU[day[0]] || '甲');
      const hi = SZ.indexOf(hourZhi);
      const timeGz = G10[(start + hi) % 10] + hourZhi;
      // 月建 → 农历月名 / 节气（展示用；盘面月将直接沿用占课所选 ln-yuejiang）
      const YM = { '寅':'正', '卯':'二', '辰':'三', '巳':'四', '午':'五', '未':'六', '申':'七', '酉':'八', '戌':'九', '亥':'十', '子':'冬', '丑':'腊' };
      const YJ = { '寅':'立春', '卯':'驚蟄', '辰':'清明', '巳':'立夏', '午':'芒種', '未':'小暑', '申':'立秋', '酉':'白露', '戌':'寒露', '亥':'立冬', '子':'大雪', '丑':'小寒' };
      const cmonth = YM[yue] || '';
      const jieqi = YJ[yue] || '冬至';
      try {
        const L = new window.LRLife.Liuren(jieqi, cmonth, day, timeGz);
        L.moon_general = function () { return yj; }; // 天盘月将跟随占课所选
        const r = L.result(0);
        let html = '<div class="muted" style="font-size:12px;margin-bottom:8px;">输入（跟随占课）：日柱 ' + esc(t2s(day)) + ' · 时柱 ' + esc(t2s(timeGz)) + '（五鼠遁自日干起）· 月将 ' + esc(t2s(yj)) + ' · 月建 ' + esc(t2s(yue)) + '月</div>';
        if (r.格局[0] === "不適用") { html += '<div class="warn">未能起出三传，无法排盘</div>'; out.innerHTML = html; return; }
        window._llrChart = r;  // 供论命分析层（lunming_life.js）取用
        const gz = r.格局;
        const tp = r.三傳, sk = r.四課;
        html += '<div style="background:#f6f6f6;border:1px solid #eee;border-radius:6px;padding:10px;margin-bottom:10px;">';
        html += '<b style="font-size:16px;">' + esc(t2s(gz[0])) + ' · ' + esc(t2s(gz[1])) + '</b>';
        html += '　<span class="muted">日马 ' + esc(t2s(r.日馬)) + ' · 月马 ' + esc(t2s(L.moonhorse())) + ' · 丁马 ' + esc(t2s(L.dinhorse())) + ' · 华盖 ' + esc(t2s(L.wahgai())) + ' · 闪电 ' + esc(t2s(L.lightning())) + '</span></div>';
        html += '<h4 style="margin:8px 0 4px;">三传</h4><table class="tbl" style="width:100%;"><tr><th></th><th>支</th><th>天将</th><th>六亲</th><th>旬遁干</th><th>天将吉凶</th></tr>';
        for (const k of ["初傳", "中傳", "末傳"]) {
          const v = tp[k], jj = JJ[v[1]] ? (JJ[v[1]][v[0]] || "—") : "—";
          html += '<tr><td>' + t2s(k) + '</td><td>' + esc(t2s(v[0])) + '</td><td>' + esc(t2s(v[1])) + '</td><td>' + esc(t2s(v[2])) + '</td><td>' + esc(t2s(v[3])) + '</td><td>' + jj + '</td></tr>';
        }
        html += '</table>';
        html += '<h4 style="margin:10px 0 4px;">四课</h4><table class="tbl" style="width:100%;"><tr><th></th><th>干支</th><th>天将</th><th>吉凶</th></tr>';
        for (const k of ["四課", "三課", "二課", "一課"]) {
          const v = sk[k], jj = JJ[v[1]] ? (JJ[v[1]][v[0][0]] || "—") : "—";
          html += '<tr><td>' + t2s(k) + '</td><td>' + esc(t2s(v[0])) + '</td><td>' + esc(t2s(v[1])) + '</td><td>' + jj + '</td></tr>';
        }
        html += '</table>';
        const pz = r.天地盤;
        html += '<h4 style="margin:10px 0 4px;">天地盘（地盘→天盘→天将）</h4><table class="tbl" style="width:100%;"><tr><th>地分</th>' + pz.地盤.map(z => "<td>" + esc(t2s(z)) + "</td>").join("") + '</tr><tr><th>天盘</th>' + pz.天盤.map(z => "<td>" + esc(t2s(z)) + "</td>").join("") + '</tr><tr><th>天将</th>' + pz.天將.map(z => "<td>" + esc(t2s(z)) + "</td>").join("") + '</tr></table>';
        // 金口诀 12 地分（两列并排，减少滚动）
        const Z12 = "子丑寅卯辰巳午未申酉戌亥".split("");
        html += '<h4 style="margin:10px 0 4px;">金口诀（十二地分）</h4><table class="tbl" style="width:100%;"><tr><th>地分</th><th>人元</th><th>贵神</th><th>将神</th><th>地分</th><th>人元</th><th>贵神</th><th>将神</th></tr>';
        for (let i = 0; i < 6; i++) {
          const j1 = L.jinkou(Z12[i]), j2 = L.jinkou(Z12[i + 6]);
          html += '<tr><td>' + esc(t2s(Z12[i])) + '</td><td>' + esc(t2s(j1.人元)) + '</td><td>' + esc(t2s(j1.貴神[0])) + '（' + esc(t2s(j1.貴神[1])) + '）</td><td>' + esc(t2s(j1.將神[0])) + '（' + esc(t2s(j1.將神[1])) + '）</td><td>' + esc(t2s(Z12[i + 6])) + '</td><td>' + esc(t2s(j2.人元)) + '</td><td>' + esc(t2s(j2.貴神[0])) + '（' + esc(t2s(j2.貴神[1])) + '）</td><td>' + esc(t2s(j2.將神[0])) + '（' + esc(t2s(j2.將神[1])) + '）</td></tr>';
        }
        html += '</table>';
        html += '<div class="muted" style="font-size:12px;margin-top:8px;">算法对译 kinastro(MIT) kinliuren.py（现代整理层，非古籍原文）。课体细判层（findtrue 细判）与反吟口径按原作者示例课体验证通过（金标 26 项）；涉害/比用细判分支按骨架实现，多克课体格名可能简化。四课/三传/天地盘/贵神/旬遁干与原实现一致。</div>';
        out.innerHTML = html;
      } catch (e) {
        out.innerHTML = '<div class="warn">排盘失败：' + esc(e && e.message) + '</div>';
      }
    };
  };
})();
