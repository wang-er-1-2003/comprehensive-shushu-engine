// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// lunming_life.js — 大六壬论命分析层（对译 kinastro(MIT) sanshi/lunming.py）
// 输入契约：chart = window.LRLife.Liuren(...).result(0) 的返回值 + 本命地支 benming
// 输出：analyze_all() = 身命总则/女命专论/五节总决/十二宫论/二十四格/十六局/流年寿夭
// 繁体照原文（UI 层 t2s 转简）；判定逻辑逐条照 py，无删改。
(function () {
  "use strict";
  const DIZHI = "子丑寅卯辰巳午未申酉戌亥".split("");
  const TIANGAN = "甲乙丙丁戊己庚辛壬癸".split("");
  const ZHI_WUXING = { "子":"水","丑":"土","寅":"木","卯":"木","辰":"土","巳":"火","午":"火","未":"土","申":"金","酉":"金","戌":"土","亥":"水" };
  const GAN_WUXING = { "甲":"木","乙":"木","丙":"火","丁":"火","戊":"土","己":"土","庚":"金","辛":"金","壬":"水","癸":"水" };
  const GANZHI_WUXING = Object.assign({}, GAN_WUXING, ZHI_WUXING);
  const WUXING_SHENGKE = {
    "木火":"生","火土":"生","土金":"生","金水":"生","水木":"生",
    "木土":"剋","土水":"剋","水火":"剋","火金":"剋","金木":"剋",
    "木木":"比和","火火":"比和","土土":"比和","金金":"比和","水水":"比和",
    "火木":"被生","土火":"被生","金土":"被生","水金":"被生","木水":"被生",
    "土木":"被剋","水土":"被剋","火水":"被剋","金火":"被剋","木金":"被剋"
  };
  const LIUQIN_MAP = { "生":"子孫", "被生":"父母", "剋":"妻財", "被剋":"官鬼", "比和":"兄弟" };
  const CHANGSHENG_ORDER = ["長生","沐浴","冠帶","臨官","帝旺","衰","病","死","墓","絕","胎","養"];
  const CHANGSHENG_START = { "木":10, "火":2, "金":5, "水":8, "土":8 };
  const CHONG = { "子":"午","午":"子","丑":"未","未":"丑","寅":"申","申":"寅","卯":"酉","酉":"卯","辰":"戌","戌":"辰","巳":"亥","亥":"巳" };
  const HE = { "子":"丑","丑":"子","寅":"亥","亥":"寅","卯":"戌","戌":"卯","辰":"酉","酉":"辰","巳":"申","申":"巳","午":"未","未":"午" };
  const XING = { "寅":"巳","巳":"申","申":"寅","丑":"戌","戌":"未","未":"丑","子":"卯","卯":"子","辰":"辰","午":"午","酉":"酉","亥":"亥" };
  const HAI = { "子":"未","未":"子","丑":"午","午":"丑","寅":"巳","巳":"寅","卯":"辰","辰":"卯","申":"亥","亥":"申","酉":"戌","戌":"酉" };
  const PO = { "子":"酉","酉":"子","丑":"辰","辰":"丑","寅":"亥","亥":"寅","卯":"午","午":"卯","巳":"申","申":"巳","未":"戌","戌":"未" };
  const MU = { "木":"未","火":"戌","金":"丑","水":"辰","土":"辰" };
  const JIANG_JIXI = { "貴":"吉","龍":"吉","合":"吉","后":"吉","陰":"吉","常":"吉","蛇":"凶","雀":"凶","勾":"凶","空":"凶","虎":"凶","玄":"凶" };
  const JIANG_FULLNAME = { "貴":"天乙貴人","蛇":"騰蛇","雀":"朱雀","合":"六合","勾":"勾陳","龍":"青龍","空":"天空","虎":"白虎","常":"太常","玄":"玄武","陰":"太陰","后":"天后" };
  const JIANG_WUXING = { "貴":"土","蛇":"火","雀":"火","合":"木","勾":"土","龍":"木","空":"土","虎":"金","常":"土","玄":"水","陰":"金","后":"水" };
  const YUEJIANG_NAME = { "亥":"登明","戌":"河魁","酉":"從魁","申":"傳送","未":"小吉","午":"勝光","巳":"太乙","辰":"天罡","卯":"太沖","寅":"功曹","丑":"大吉","子":"神後" };
  const TWELVE_PALACES = ["命宮","兄弟宮","夫妻宮","子女宮","財帛宮","疾厄宮","遷移宮","奴僕宮","官祿宮","田宅宮","福德宮","相貌宮"];
  const WANGXIANG = {
    "春": { "木":"旺","火":"相","水":"休","金":"囚","土":"死" },
    "夏": { "火":"旺","土":"相","木":"休","水":"囚","金":"死" },
    "秋": { "金":"旺","水":"相","土":"休","火":"囚","木":"死" },
    "冬": { "水":"旺","木":"相","金":"休","土":"囚","火":"死" },
    "四季": { "土":"旺","金":"相","火":"休","木":"囚","水":"死" }
  };
  const JIEQI_SEASON = {
    "立春":"春","雨水":"春","驚蟄":"春","春分":"春","清明":"春","穀雨":"春",
    "立夏":"夏","小滿":"夏","芒種":"夏","夏至":"夏","小暑":"夏","大暑":"夏",
    "立秋":"秋","處暑":"秋","白露":"秋","秋分":"秋","寒露":"秋","霜降":"秋",
    "立冬":"冬","小雪":"冬","大雪":"冬","冬至":"冬","小寒":"冬","大寒":"冬"
  };

  // 工具函数
  function _wx(gz) { return GANZHI_WUXING[gz] || ""; }
  function _shengke(a, b) { const wa = _wx(a), wb = _wx(b); if (!wa || !wb) return ""; return WUXING_SHENGKE[wa + wb] || ""; }
  function _liuqin(ri_gan, target) { return LIUQIN_MAP[_shengke(ri_gan, target)] || ""; }
  function _changsheng_state(wx, zhi) {
    const start = CHANGSHENG_START[wx];
    if (start === undefined) return "";
    return CHANGSHENG_ORDER[((DIZHI.indexOf(zhi) - start) % 12 + 12) % 12];
  }
  function _is_kongwang(day_gz, zhi) {
    const jz = []; for (let x = 0; x < 60; x++) jz.push(TIANGAN[x % 10] + DIZHI[x % 12]);
    let pos = -1; for (let i = 0; i < 60; i++) if (jz[i] === day_gz) { pos = i; break; }
    if (pos < 0) return false;
    const xun_start = Math.floor(pos / 10) * 10;
    const xun_zhis = []; for (let j = 0; j < 10; j++) xun_zhis.push(DIZHI[(xun_start + j) % 12]);
    return DIZHI.indexOf(zhi) >= 0 && xun_zhis.indexOf(zhi) < 0;
  }
  function _is_mu(wx, zhi) { return MU[wx] === zhi; }
  function _season_from_jieqi(jieqi) { return JIEQI_SEASON[jieqi] || "春"; }
  function _wangxiang_state(wx, season) { const m = WANGXIANG[season] || {}; return m[wx] || ""; }
  function _is_wangxiang(state) { return state === "旺" || state === "相"; }
  function _is_xiuqiu(state) { return state === "休" || state === "囚" || state === "死"; }
  function _jiang_jixi(jiang) { if (!jiang) return ""; return JIANG_JIXI[jiang[0]] || ""; }
  function _has_relation(zhi_a, zhi_b, rel_dict) { return rel_dict[zhi_a] === zhi_b; }

  class LunMingAnalyzer {
    constructor(chart, benming_zhi) {
      this.chart = chart;
      this.benming = benming_zhi;
      const riqi = chart["日期"] || "";
      this.ri_gan = riqi.length >= 1 ? riqi[0] : "";
      this.ri_zhi = riqi.length >= 2 ? riqi[1] : "";
      this.day_gz = riqi.length >= 2 ? riqi.slice(0, 2) : "";
      this.jieqi = chart["節氣"] || "";
      this.season = _season_from_jieqi(this.jieqi);
      this.san_chuan = chart["三傳"] || {};
      this.si_ke = chart["四課"] || {};
      this.tiandi_pan = chart["天地盤"] || {};
      this.di_to_jiang = chart["地轉天將"] || {};
      this.di_to_tian = chart["地轉天盤"] || {};
      this.geju = chart["格局"] || [];
      this.ri_wx = _wx(this.ri_gan);
      this.benming_wx = _wx(this.benming);
      this.benming_shang = this.di_to_tian[this.benming] || "";
      const ri_gong = this._ri_gong();
      this.ri_shang = this.di_to_tian[ri_gong] || "";
      this.chen_shang = this.di_to_tian[this.ri_zhi] || "";
      this.ri_jiang = this.di_to_jiang[ri_gong] || "";
      this.chen_jiang = this.di_to_jiang[this.ri_zhi] || "";
      this.benming_jiang = this.di_to_jiang[this.benming] || "";
      this._chuan_zhis = []; this._chuan_jiangs = []; this._chuan_liuqin = []; this._chuan_kong = [];
      for (const k of ["初傳", "中傳", "末傳"]) {
        const vals = this.san_chuan[k] || [];
        this._chuan_zhis.push(vals.length > 0 ? vals[0] : "");
        this._chuan_jiangs.push(vals.length > 1 ? vals[1] : "");
        this._chuan_liuqin.push(vals.length > 2 ? vals[2] : "");
        const kong_val = vals.length > 3 ? vals[3] : "";
        this._chuan_kong.push(kong_val === "空");
      }
    }
    _ri_gong() {
      const mapping = { "甲":"寅","乙":"辰","丙":"巳","丁":"未","戊":"巳","己":"未","庚":"申","辛":"戌","壬":"亥","癸":"丑" };
      return mapping[this.ri_gan] || "";
    }
    _wangxiang(gz) { const wx = _wx(gz); return _wangxiang_state(wx, this.season); }
    _changsheng(gz) { const wx = _wx(gz); return _changsheng_state(wx, this.benming); }
    _is_kong(zhi) { return _is_kongwang(this.day_gz, zhi); }
    _is_mu_ku(zhi) { return _is_mu(this.ri_wx, zhi); }
    _check_xiong_jiang(jiang) { return _jiang_jixi(jiang) === "凶"; }
    _check_ji_jiang(jiang) { return _jiang_jixi(jiang) === "吉"; }
    _chuan_zhi(idx) { return idx < this._chuan_zhis.length ? this._chuan_zhis[idx] : ""; }
    _chuan_jiang(idx) { return idx < this._chuan_jiangs.length ? this._chuan_jiangs[idx] : ""; }
    _chuan_lq(idx) { return idx < this._chuan_liuqin.length ? this._chuan_liuqin[idx] : ""; }
    _has_chong(a, b) { return _has_relation(a, b, CHONG); }
    _has_he(a, b) { return _has_relation(a, b, HE); }
    _has_xing(a, b) { return _has_relation(a, b, XING); }
    _has_hai(a, b) { return _has_relation(a, b, HAI); }
    _has_po(a, b) { return _has_relation(a, b, PO); }
    _sanchuan_has_ji() { return this._chuan_jiangs.some(j => this._check_ji_jiang(j)); }
    _sanchuan_has_xiong() { return this._chuan_jiangs.some(j => this._check_xiong_jiang(j)); }
    _count_chuan_shengke(target) {
      const counts = { "生":0, "剋":0, "被生":0, "被剋":0, "比和":0 };
      for (const z of this._chuan_zhis) { const rel = _shengke(z, target); if (rel in counts) counts[rel]++; }
      return counts;
    }
    _twelve_palace_zhis() {
      const start = DIZHI.indexOf(this.benming);
      const res = []; for (let i = 0; i < 12; i++) res.push(DIZHI[(start + i) % 12]);
      return res;
    }
    analyze_shenming() {
      const results = {};
      const ri_state = this._wangxiang(this.ri_shang);
      const ri_jiang_ji = this._check_ji_jiang(this.ri_jiang);
      const ri_kong = this._is_kong(this.ri_shang);
      const ri_mu = this._is_mu_ku(this.ri_shang);
      const body_comments = [];
      if (_is_wangxiang(ri_state) && ri_jiang_ji) body_comments.push("身命旺相遇吉神良將，主富貴福壽");
      else if (_is_xiuqiu(ri_state) && this._check_xiong_jiang(this.ri_jiang)) body_comments.push("身命休囚無氣，更遇凶神惡將剋制，主非夭即貧");
      else if (_is_wangxiang(ri_state) && this._check_xiong_jiang(this.ri_jiang)) body_comments.push("日上有氣卻臨凶煞，乃修偉榮顯而帶殘疾之人；若凶煞有制反主假煞為權");
      else if (_is_xiuqiu(ri_state) && ri_jiang_ji) body_comments.push("身命無氣雖遇吉神，亦足小可規模，主虛花不實之象");
      if (ri_kong) body_comments.push("大忌身命空亡：一身作事無成，多謀少遂，難立家計");
      if (ri_mu) body_comments.push("身命入墓：一世昏晦不明，行藏動靜必不亨快");
      const ri_sheng_counts = this._count_chuan_shengke(this.ri_gan);
      if (_is_xiuqiu(ri_state) && ri_sheng_counts["被生"] === 0 && ri_sheng_counts["比和"] === 0) {
        if (this._sanchuan_has_xiong()) body_comments.push("無氣無助更遇刑衝剋害，官府欺凌、小人謗毀");
        else body_comments.push("無氣遇扶必因人並立");
      } else if (_is_wangxiang(ri_state) && ri_sheng_counts["被生"] === 0 && ri_sheng_counts["比和"] === 0) {
        if (this._sanchuan_has_ji()) body_comments.push("有氣無助但遇生扶合助，貴人提攜");
        else body_comments.push("有氣無助必獨立撐持");
      }
      results["身（日上）"] = {
        "日上神": this.ri_shang,
        "天將": JIANG_FULLNAME[this.ri_jiang] || this.ri_jiang,
        "旺衰": ri_state,
        "空亡": ri_kong,
        "入墓": ri_mu,
        "論斷": body_comments
      };
      const chen_state = this._wangxiang(this.chen_shang);
      const chen_ji = this._check_ji_jiang(this.chen_jiang);
      const chen_comments = [];
      const rel_day_chen = _shengke(this.ri_gan, this.chen_shang);
      if (rel_day_chen === "生" || rel_day_chen === "比和" || this._has_he(this.ri_zhi, this.chen_shang)) chen_comments.push("日辰相生相合，夫妻和翕偕老百年");
      else if (rel_day_chen === "剋" || rel_day_chen === "被剋" || this._has_chong(this.ri_zhi, this.chen_shang)) chen_comments.push("日辰相剋相衝，夫妻反目朝夕不睦");
      if (chen_ji) chen_comments.push("辰上吉神臨之主好妻");
      else if (this._check_xiong_jiang(this.chen_jiang)) chen_comments.push("辰上凶神惡煞臨之，其妻必惡");
      if (this._is_kong(this.chen_shang)) chen_comments.push("辰上值空，主妻刑傷");
      results["宅（辰上）"] = {
        "辰上神": this.chen_shang,
        "天將": JIANG_FULLNAME[this.chen_jiang] || this.chen_jiang,
        "旺衰": chen_state,
        "論斷": chen_comments
      };
      const limit_names = ["初限（早年）", "中限（中年）", "末限（晚年）"];
      const limit_comments_all = [];
      for (let i = 0; i < 3; i++) {
        const cz = this._chuan_zhi(i), cj = this._chuan_jiang(i), clq = this._chuan_lq(i);
        const c_state = this._wangxiang(cz);
        const c_kong = this._is_kong(cz);
        const c_ji = this._check_ji_jiang(cj);
        const c_comments = [];
        if (i === 0) {
          if (clq === "財" && _is_wangxiang(c_state) && cj === "龍") c_comments.push("財旺乘龍臨吉地，早年身必富貴");
          else if (clq === "子" && _is_wangxiang(c_state)) c_comments.push("子旺興隆，初年子定軒昂");
          if (cj === "合" || cj === "常") if (clq === "財") c_comments.push("六合太常臨財，作經商買賣興家");
          if (cj === "陰" || cj === "后") if (clq === "財") c_comments.push("太陰天后見妻財，婚姻早娶");
          if (cj === "虎" && clq === "官") c_comments.push("白虎乘鬼發用，初歲多災");
          if (c_ji && _is_wangxiang(c_state)) c_comments.push("初得吉神臨於生旺，初景清高富貴");
          else if (this._check_xiong_jiang(cj)) c_comments.push("初年遇凶煞惡將，積害多災疾");
        } else if (i === 1) {
          if (clq === "財" && _is_wangxiang(c_state)) c_comments.push("中傳財馬，中年立業興家");
          if (clq === "子" && cj === "龍") c_comments.push("子乘青龍並立，金玉滿堂餘慶");
          if ((cj === "雀" || cj === "蛇") && _is_wangxiang(c_state) && clq === "官") c_comments.push("雀蛇乘旺臨鬼，中年多遭非禍");
          if ((cj === "勾" || cj === "空") && c_kong) c_comments.push("勾空帶空亡，詞訟有傷");
        } else {
          if (c_ji) c_comments.push("末見吉神，一路春風");
          else if (this._check_xiong_jiang(cj) && !this._sanchuan_has_ji()) c_comments.push("末遇凶煞無制，老來孤困極窮");
        }
        if (!c_comments.length) {
          if (c_ji && _is_wangxiang(c_state)) c_comments.push("此限吉神旺相，順利發達");
          else if (this._check_xiong_jiang(cj) && _is_xiuqiu(c_state)) c_comments.push("此限凶將休囚，恐有災厄");
          else c_comments.push("此限平常");
        }
        limit_comments_all.push({ "傳名": limit_names[i], "地支": cz, "天將": JIANG_FULLNAME[cj] || cj, "六親": clq, "旺衰": c_state, "空亡": c_kong, "論斷": c_comments });
      }
      const cross_comments = [];
      const cj0 = this._chuan_jiang(0), cj2 = this._chuan_jiang(2);
      if (this._check_ji_jiang(cj0) && this._check_xiong_jiang(cj2)) cross_comments.push("初傳德合末傳剋害，即幼年發福末年貧寒");
      else if (this._check_xiong_jiang(cj0) && this._check_ji_jiang(cj2)) cross_comments.push("初傳刑傷末傳生比，即幼年貧困老境亨通");
      results["三傳限運"] = limit_comments_all;
      if (cross_comments.length) results["初末對比"] = cross_comments;
      results["課爻總論"] = "課命旺不如爻象旺，得課象旺可許根基壯實；更得爻乘吉臨得力之地扶助身命，乃為十全造化";
      return results;
    }
    analyze_female() {
      const results = {};
      const comments = [];
      const zhi_shang = this.chen_shang, zhi_jiang = this.chen_jiang;
      if (this._check_ji_jiang(zhi_jiang)) comments.push("支上神吉，其女良");
      else if (this._check_xiong_jiang(zhi_jiang)) comments.push("支上神惡，其女悍");
      const benming_rel = _shengke(this.benming, this.ri_zhi);
      if (benming_rel === "被剋") comments.push("女命喜坐剋宮，主慎重而有禮");
      else if (benming_rel === "生") comments.push("坐小宮恐太過而嬌恣");
      if (this._has_chong(this.benming, this.ri_zhi)) comments.push("最不宜衝宮動搖，更有陰合乘之恐別宮無制");
      if (this._has_hai(this.benming, this.ri_zhi)) comments.push("坐害宮主不睦而嫉妒");
      if (this._has_xing(this.benming, this.ri_zhi)) comments.push("坐刑害多刑傷暴戾");
      const benming_state = this._wangxiang(this.benming);
      if (_is_wangxiang(benming_state) && this._check_ji_jiang(this.benming_jiang)) comments.push("坐德祿宮作命婦推之，歷重有福");
      if (this._is_kong(this.benming)) comments.push("入空鄉無救作寡婦斷之，孀居無依");
      const ri_ma = this.chart["日馬"] || "";
      if (this.benming === ri_ma) {
        if (this._check_ji_jiang(this.benming_jiang)) comments.push("坐丁馬乘貴常等吉將，他宮遙制，又當以貴論");
        else if (this._check_xiong_jiang(this.benming_jiang)) comments.push("坐丁馬帶凶將，恐棄禮義而忻私奔");
      }
      if (!comments.length) comments.push("女命平穩，無特殊格局");
      results["女命論斷"] = comments;
      results["支上神"] = zhi_shang;
      results["支上天將"] = JIANG_FULLNAME[zhi_jiang] || zhi_jiang;
      return results;
    }
    analyze_five_sections() {
      const results = {};
      const sec1 = [];
      const ri_state = this._wangxiang(this.ri_shang);
      const ri_ji = this._check_ji_jiang(this.ri_jiang);
      if (ri_ji && _is_wangxiang(ri_state)) sec1.push("日上見貴人青龍等吉神生旺，身命有氣，為可貴可富之人");
      else if (_is_xiuqiu(ri_state) && ri_ji) sec1.push("日上見墓絕身命無氣，雖遇龍常吉神亦足小可規模，主虛花不實之象");
      else if (_is_xiuqiu(ri_state) && this._check_xiong_jiang(this.ri_jiang)) sec1.push("日干無氣又臨凶煞，乃下等疾困之輩");
      else if (_is_wangxiang(ri_state) && this._check_xiong_jiang(this.ri_jiang)) sec1.push("日上有氣卻臨凶煞，乃修偉榮顯而帶殘疾之人");
      else sec1.push("日上平常，無特別吉凶");
      results["第一節（日上為主）"] = sec1;
      const sec2 = [];
      const rel_day_chen = _shengke(this.ri_gan, this.chen_shang);
      if (rel_day_chen === "生" || rel_day_chen === "比和" || this._has_he(this.ri_zhi, this.chen_shang)) sec2.push("福德日辰相生相合，夫妻和翕偕老百年");
      else if (rel_day_chen === "剋" || rel_day_chen === "被剋" || this._has_chong(this.ri_zhi, this.chen_shang)) sec2.push("相剋相衝，夫妻反目即朝夕不睦");
      const chen_ji = this._check_ji_jiang(this.chen_jiang);
      if (chen_ji) sec2.push("辰上吉神臨之主好妻");
      else if (this._check_xiong_jiang(this.chen_jiang)) sec2.push("凶神惡煞臨之，其妻必惡");
      const has_wife_wealth = this._chuan_liuqin.some(lq => lq === "財");
      if (!has_wife_wealth) sec2.push("課無妻財，主無妻室");
      const has_child = this._chuan_liuqin.some(lq => lq === "子");
      if (has_child) {
        sec2.push("課中有子，必有子孫");
        for (let i = 0; i < this._chuan_liuqin.length; i++) {
          if (this._chuan_liuqin[i] === "子" && this._chuan_kong[i]) { sec2.push("子孫空亡，多養少成"); break; }
        }
      } else {
        sec2.push("無子爻，後無子息");
      }
      if (this._is_kong(this.chen_shang)) sec2.push("辰上值空，主妻刑傷");
      results["第二節（辰上妻子）"] = sec2;
      const sec3 = [];
      const ri_state_wx = this._wangxiang(this.ri_gan);
      const has_guan = this._chuan_liuqin.some(lq => lq === "官");
      const has_zi = this._chuan_liuqin.some(lq => lq === "子");
      const has_cai = this._chuan_liuqin.some(lq => lq === "財");
      const has_xiong = this._chuan_liuqin.some(lq => lq === "兄");
      if (has_guan && has_zi) sec3.push("子爻制鬼則有官");
      else if (has_guan && !has_zi) sec3.push("子爻見而無制則有官災");
      if (has_cai && !has_xiong) sec3.push("有財無兄弟剋，財運亨通");
      else if (has_xiong && !has_cai) sec3.push("兄爻見無制則財薄");
      if (_is_wangxiang(ri_state_wx)) {
        if (has_guan && this._sanchuan_has_ji()) sec3.push("日月有氣，官祿貴馬龍常諸吉生合日干，乃官貴之命");
        if (has_cai && this._sanchuan_has_ji()) sec3.push("子孫妻財青龍常諸吉神臨日合日，乃富貴之命");
      }
      if (!sec3.length) sec3.push("財官平常");
      results["第三節（財官）"] = sec3;
      const sec4 = [];
      if (_is_wangxiang(ri_state_wx)) {
        if (has_cai || has_guan) sec4.push("日上旺相遇財官，發福增產");
        if (has_guan && this._sanchuan_has_xiong()) sec4.push("遇鬼煞須防險");
        if (has_xiong) sec4.push("遇兄弟必主破財");
      } else {
        if (has_guan) sec4.push("日衰遇官鬼則變官為鬼賊");
        if (this._chuan_liuqin.some(lq => lq === "父")) sec4.push("遇父母則變為艱辛");
        if (has_cai) sec4.push("遇財福稍可發");
        if (has_xiong) sec4.push("遇兄弟則必遭禍患");
      }
      if (!sec4.length) sec4.push("運限平穩");
      results["第四節（運限）"] = sec4;
      const sec5 = [];
      const ri_cs = _changsheng_state(_wx(this.ri_gan), this.benming);
      if (ri_cs === "長生" || ri_cs === "冠帶" || ri_cs === "臨官" || ri_cs === "帝旺") sec5.push("本命長生狀態為「" + ri_cs + "」，壯健可望壽");
      else if (ri_cs === "沐浴") sec5.push("沐浴好色多病，備氣不足");
      else if (ri_cs === "死" || ri_cs === "墓" || ri_cs === "絕") sec5.push("本命長生狀態為「" + ri_cs + "」，主夭");
      else if (ri_cs === "胎" || ri_cs === "養") sec5.push("本命長生狀態為「" + ri_cs + "」，主弱");
      else sec5.push("本命長生狀態為「" + ri_cs + "」，壽數中等");
      const rel_ri_shang = _shengke(this.ri_shang, this.ri_gan);
      if (rel_ri_shang === "生") sec5.push("日上神生日，主壽");
      else if (rel_ri_shang === "剋") sec5.push("日上神剋日，須防壽損");
      let has_tiger_ke = false;
      for (let i = 0; i < this._chuan_jiangs.length; i++) {
        if (this._chuan_jiangs[i] === "虎") {
          const cz = this._chuan_zhi(i);
          if (_shengke(cz, this.ri_gan) === "剋") { has_tiger_ke = true; sec5.push("白虎乘鬼剋日，須防壽厄"); break; }
        }
      }
      if (this._is_kong(this.benming) && has_tiger_ke) sec5.push("本命空亡又見白虎剋日，為黃泉鬼");
      const si_meng = ["寅","巳","申","亥"], si_zhong = ["子","午","卯","酉"], si_ji = ["辰","戌","丑","未"];
      const chuan_set = this._chuan_zhis.filter((v, i) => this._chuan_zhis.indexOf(v) === i);
      if (chuan_set.length && chuan_set.every(z => si_meng.indexOf(z) >= 0)) sec5.push("四孟作三傳，遞生日干本命主長壽");
      else if (chuan_set.length && chuan_set.every(z => si_zhong.indexOf(z) >= 0)) sec5.push("四仲作傳，不夭不壽");
      else if (chuan_set.length && chuan_set.every(z => si_ji.indexOf(z) >= 0)) sec5.push("四季作三傳，命無壽也");
      if (!sec5.length) sec5.push("壽數中等");
      results["第五節（壽數）"] = sec5;
      return results;
    }
    analyze_twelve_palaces() {
      const palace_zhis = this._twelve_palace_zhis();
      const results = {};
      for (let i = 0; i < TWELVE_PALACES.length; i++) {
        const pname = TWELVE_PALACES[i];
        const pz = palace_zhis[i];
        const p_shang = this.di_to_tian[pz] || "";
        const p_jiang = this.di_to_jiang[pz] || "";
        const p_state = this._wangxiang(p_shang);
        const p_ji = this._check_ji_jiang(p_jiang);
        const p_kong = this._is_kong(pz);
        const p_comments = [];
        const rel_to_ri = _shengke(p_shang, this.ri_gan);
        const rel_to_ming = _shengke(p_shang, this.benming);
        const has_chong_ming = this._has_chong(pz, this.benming);
        const has_xing_ming = this._has_xing(pz, this.benming);
        const has_hai_ming = this._has_hai(pz, this.benming);
        const has_he_ming = this._has_he(pz, this.benming);
        const has_po_ming = this._has_po(pz, this.benming);
        if (p_ji && _is_wangxiang(p_state)) p_comments.push(pname + "旺相吉神，主順利發達");
        else if (this._check_xiong_jiang(p_jiang) && _is_xiuqiu(p_state)) p_comments.push(pname + "凶神休囚，主不利");
        if (has_chong_ming) p_comments.push(pname + "衝命宮，動搖不安");
        if (has_xing_ming) p_comments.push(pname + "刑命宮，多刑傷");
        if (has_hai_ming) p_comments.push(pname + "害命宮，主不睦");
        if (has_he_ming && p_ji) p_comments.push(pname + "合命宮帶吉，主和順有益");
        if (p_kong) p_comments.push(pname + "入空亡，遇吉不吉凶不凶");
        if (pname === "命宮") {
          if (p_ji && _is_wangxiang(p_state) && !has_chong_ming) p_comments.push("命到吉位，身更入吉何求");
          else if (this._check_xiong_jiang(p_jiang)) p_comments.push("命宮凶，根基薄弱");
        } else if (pname === "財帛宮") {
          if (this._check_xiong_jiang(p_jiang)) p_comments.push("財帛宮見凶煞，不是寒士即浮誇");
          else if (p_ji && _is_wangxiang(p_state)) {
            p_comments.push("財帛宮吉神旺相，主財帛厚產業興隆");
            if ((rel_to_ri === "生" || rel_to_ri === "比和") && !has_chong_ming && !has_hai_ming) p_comments.push("與日干相生合無刑衝破害，財帛厚產業興隆");
          }
        } else if (pname === "兄弟宮") {
          if (has_xing_ming || this._check_xiong_jiang(p_jiang)) p_comments.push("兄弟之宮刑煞遇，若非只身是仇家");
          else if (p_ji && !has_chong_ming && !has_hai_ming) p_comments.push("兄弟富貴和睦");
        } else if (pname === "田宅宮") {
          if (this._check_xiong_jiang(p_jiang)) p_comments.push("田宅宮中見凶，漸蕭條");
          else if (p_ji && _is_wangxiang(p_state)) p_comments.push("旺相吉神，田宅日增盛利益");
        } else if (pname === "子女宮") {
          const cs_state = _changsheng_state(_wx(p_shang), pz);
          if (cs_state === "長生" && p_ji) p_comments.push("男女宮中見吉神長生，多兒女");
          else if (_is_xiuqiu(p_state) && this._check_xiong_jiang(p_jiang)) p_comments.push("反此子息無處尋");
        } else if (pname === "奴僕宮") {
          if (_shengke(pz, this.benming) === "被剋") p_comments.push("奴僕宮受剋為順");
          else if (_shengke(pz, this.benming) === "生") p_comments.push("奴僕宮生命不遜");
          if (p_jiang === "虎" || p_jiang === "勾") p_comments.push("遇虎勾並厭煞，將來惹禍累主人");
        } else if (pname === "夫妻宮") {
          if (!has_xing_ming && !has_chong_ming) {
            p_comments.push("無刑無劫便為佳");
            if (p_ji) p_comments.push("有善逢吉為良德，益夫益子善持家");
          } else {
            p_comments.push("妻妾之宮怕刑衝");
          }
        } else if (pname === "疾厄宮") {
          if (p_kong) p_comments.push("疾厄之宮卻喜空");
          if (this._is_mu_ku(pz)) p_comments.push("支忌丘墓莫相逢");
          if (p_ji) p_comments.push("遇德神為有救");
          else if (this._check_xiong_jiang(p_jiang)) p_comments.push("遭惡將定主凶");
        } else if (pname === "遷移宮") {
          if (p_kong) p_comments.push("遷移宮內逢空，空空如也");
          const opp_idx = (i + 6) % 12;
          const opp_pz = palace_zhis[opp_idx];
          const opp_jiang = this.di_to_jiang[opp_pz] || "";
          if (this._check_ji_jiang(opp_jiang)) p_comments.push("對宮有德祿馬，遷到處人欽敬");
        } else if (pname === "官祿宮") {
          const ri_ma = this.chart["日馬"] || "";
          if (pz === ri_ma || p_shang === ri_ma) p_comments.push("官祿之鄉有驛馬，動人應");
          else if (!ri_ma) p_comments.push("無馬官不顯");
          if (p_ji && _is_wangxiang(p_state)) p_comments.push("官祿宮吉旺，主得美官");
          else if (_is_xiuqiu(p_state)) p_comments.push("官祿宮休囚，主得微官或缺俸");
        } else if (pname === "福德宮") {
          if (p_ji && _is_wangxiang(p_state)) p_comments.push("福德之宮遇吉為榮");
          else if (this._check_xiong_jiang(p_jiang)) p_comments.push("凶則寒");
          if (p_kong) p_comments.push("此處逢空遇劫煞，一生坎坷無足言");
          else if (p_ji) p_comments.push("有吉神良將會，便得優游子孫綿");
        } else if (pname === "相貌宮") {
          if (p_jiang === "勾" || p_jiang === "玄" || p_jiang === "蛇" || p_jiang === "虎") p_comments.push("帶勾玄蛇虎，五官有破");
          else if ((p_jiang === "貴" || p_jiang === "常" || p_jiang === "龍" || p_jiang === "合") && _is_wangxiang(p_state)) p_comments.push("貴常龍合旺相吉，相貌魁偉人敬親");
        }
        if (!p_comments.length) p_comments.push("此宮平常");
        results[pname] = { "宮位地支": pz, "天盤上神": p_shang, "天將": JIANG_FULLNAME[p_jiang] || p_jiang, "旺衰": p_state, "空亡": p_kong, "論斷": p_comments };
      }
      return results;
    }
    detect_24_ge() {
      const matched = [];
      const bm = this.benming, bm_shang = this.benming_shang, bm_jiang = this.benming_jiang;
      const bm_state = this._wangxiang(bm);
      const tian_on_bm = this.di_to_tian[bm] || "";
      const jiang_on_bm = this.di_to_jiang[bm] || "";
      if (bm_shang === "寅" || (bm === "寅" && bm_jiang === "龍")) {
        if (this._check_ji_jiang(bm_jiang) && !this._sanchuan_has_xiong()) matched.push("正跨青龍：命帶吉將，主極貴台閣之命");
        else matched.push("正跨青龍（跨龍不住）：有蛇虎來衝剋壞其貴氣");
      }
      if (tian_on_bm === "寅" && jiang_on_bm === "龍") {
        if (this._sanchuan_has_ji()) matched.push("倒跨青龍：龍反來就我，喜課傳扶助，主大貴富之命");
        else matched.push("倒跨青龍：來衝剋更兼空亡則不美");
      }
      if ((bm === "辰" && bm_shang === "寅") || (bm === "寅" && bm_shang === "辰")) {
        const has_chong_shen_xu = this._has_chong("申", bm) || this._has_chong("戌", bm);
        if (!has_chong_shen_xu && this._check_ji_jiang(bm_jiang)) matched.push("雙騎龍背：吉神拱護，主富貴奇局");
        else matched.push("雙騎龍背：怕申戌來衝");
      }
      if (bm === "子" && tian_on_bm === "寅") {
        const tian_on_yin = this.di_to_tian["寅"] || "";
        if (tian_on_yin === "辰") {
          if (_is_wangxiang(bm_state)) matched.push("二龍禦命：最怕無氣衝剋");
          else matched.push("二龍禦命反為二龍傷命：窮困至賤");
        }
      }
      if (bm === "寅" && bm_shang === "巳" && bm_jiang === "蛇") matched.push("龍化土蛇：為賤命，反喜來衝，多生富貴之家");
      if (bm === "巳" && bm_shang === "寅") {
        if (this._sanchuan_has_ji() && _is_wangxiang(bm_state)) matched.push("土蛇化龍：前後吉神良將拱護，化之易且更顯");
        else matched.push("土蛇化龍：化而不化，反主賤，多生貧賤之家");
      }
      if ((bm === "午" && bm_shang === "亥" && bm_jiang === "虎") || (bm === "申" && bm_shang === "亥" && bm_jiang === "虎")) {
        if (_is_wangxiang(bm_state)) matched.push("乘虎登天：主威鎮邊夷，公侯之命");
        else matched.push("乘虎登天：無氣便為無賴惡徒");
      }
      if (bm === "未" || bm_shang === "未") {
        if (this._sanchuan_has_ji()) matched.push("履虎尾格：逢吉辰良將扶助亦稍可");
        else matched.push("履虎尾格：不見吉神良將便為術士吏卒之流");
      }
      if (bm === "酉" || bm_shang === "酉") {
        if (_is_wangxiang(bm_state) && this._check_ji_jiang(bm_jiang)) matched.push("立虎首格：主人折衝萬里功名蓋世");
        else matched.push("立虎首格：無氣則立虎首而抱驚懼之心");
      }
      if (bm === "申" && bm_jiang === "虎") {
        if (_is_wangxiang(bm_state)) matched.push("雙騎虎背：猛烈剛傲之性，武則好殺文則輕刑，乃英豪");
        else matched.push("雙騎虎背：喜有氣");
      }
      if ((bm === "申" && bm_shang === "戌") || (bm_jiang === "虎" && bm_shang === "戌")) {
        if (_is_xiuqiu(bm_state) && this._is_kong(bm)) matched.push("虎化狸格：無氣並空，乃為朱門餓莩");
        else matched.push("虎化狸格：軍座吏役或凶惡悍徒，有半福之象");
      }
      if (bm === "戌" && (bm_shang === "申" || bm_jiang === "虎")) {
        if (_is_wangxiang(bm_state) && this._sanchuan_has_ji()) matched.push("狸化虎格：化則貴，應白屋出公卿之喻");
        else matched.push("狸化虎格：不能化，不化則賤");
      }
      if (bm_shang === "亥") {
        if (this._check_ji_jiang(bm_jiang) && !this._is_kong(bm)) matched.push("司命天門：帶貴常龍后，總書記人樞秘之職");
        else matched.push("司命天門：凶將並空亡或衝剋，皆不得司");
      }
      if (bm_shang === "亥" && this._check_xiong_jiang(bm_jiang)) matched.push("天門不開：主有大志而不得伸，乃寒儒之命");
      if (bm_shang === "亥" && _is_wangxiang(bm_state)) matched.push("明入天門：主富貴不怕衝合空亡");
      if (bm_shang === "亥" && bm_jiang === "玄") matched.push("暗入天門：乘玄武喜夜不喜晝，逢旺氣為綠林豪傑");
      if (bm_shang === "巳") {
        if (this._check_ji_jiang(bm_jiang) && _is_wangxiang(bm_state)) matched.push("坐守地戶：帶貴常勾空，主為看財虜，最喜有氣");
        else if (_is_xiuqiu(bm_state)) matched.push("坐守地戶：無氣帶凶將，主至貧薄之命");
        else matched.push("坐守地戶：中人產業");
      }
      if (bm === "辰" && bm_shang === "午") {
        if (_is_wangxiang(bm_state) && this._check_ji_jiang(bm_jiang)) matched.push("來拱地戶：中格之極富，以財得官");
        else matched.push("來拱地戶：有衝剋帶凶則不以富貴取之");
      }
      if (bm_jiang === "雀" && (bm_shang === "亥" || bm_shang === "子" || bm_shang === "丑")) matched.push("朱雀束翅：雀落水束翅，主有七步之才而不得展");
      if (bm_jiang === "雀" && (bm_shang === "寅" || bm_shang === "卯" || bm_shang === "辰" || bm_shang === "巳" || bm_shang === "午")) {
        if (_is_wangxiang(bm_state)) matched.push("朱雀騰輝：主文章蓋世官由翰苑");
        else matched.push("朱雀騰輝：無氣帶凶則為寒儒");
      }
      if (_wx(bm) === "土" && _wx(bm_shang) === "土") matched.push("四墓交錯：主人豐厚有財產");
      if (bm === "戌" && bm_shang === "寅") {
        if (_is_wangxiang(bm_state)) matched.push("河魁貫甲：宜修武業，有氣則文武全備之貴命");
        else matched.push("河魁貫甲：無氣又被衝破不以此推");
      }
      if (bm === "寅" && bm_shang === "戌") {
        if (_is_wangxiang(bm_state) && this._sanchuan_has_ji()) matched.push("甲貫河魁：有氣得吉神將扶助即為貴命");
        else matched.push("甲貫河魁：取用與河魁貫甲相近");
      }
      if ((bm === "午" && bm_shang === "辰") || (_wx(bm) === "火" && bm_shang === "辰")) {
        if (_is_wangxiang(bm_state)) matched.push("朱勾拱拜：有氣主人性剛好辯有傳貴");
        else matched.push("朱勾拱拜：無氣徒抱不平之氣，逐日訟斗之人");
      }
      return matched;
    }
    detect_16_ju() {
      const matched = [];
      const czs = this._chuan_zhis.filter((v, i) => this._chuan_zhis.indexOf(v) === i);
      const bm = this.benming, bm_shang = this.benming_shang, bm_state = this._wangxiang(bm);
      const has = (set) => czs.length > 0 && set.every(z => czs.indexOf(z) >= 0);
      const jin_ju = ["巳","酉","丑"], mu_ju = ["亥","卯","未"], shui_ju = ["申","子","辰"], huo_ju = ["寅","午","戌"], tu_ju = ["辰","戌","丑","未"];
      if (has(jin_ju)) matched.push("庚星呈瑞（三合金局從革）");
      if (has(huo_ju)) matched.push("祥光搖拱（三合火局炎上）");
      if (has(shui_ju)) matched.push("帝座淵穆（三合水局潤下）");
      if (has(mu_ju)) matched.push("青帝施恩（三合木局曲直）");
      const tu_overlap = czs.filter(z => tu_ju.indexOf(z) >= 0);
      if (tu_overlap.length >= 2 && czs.length > 0 && czs.every(z => _wx(z) === "土")) matched.push("穩坐中宮（四季土局稼穡）");
      const bei = ["亥","子","丑"], nan = ["巳","午","未"], xi = ["申","酉","戌"], dong = ["寅","卯","辰"];
      const eq = (set) => czs.length === 3 && set.every(z => czs.indexOf(z) >= 0);
      if (eq(bei)) matched.push("北斗司權（三傳亥子丑）");
      if (eq(nan)) matched.push("南極獻圖（三傳巳午未）");
      if (eq(xi)) matched.push("西方專美（三傳申酉戌）");
      if (eq(dong)) matched.push("東海探珠（三傳寅卯辰）");
      const inSet = (z, set) => set.indexOf(z) >= 0;
      if ((inSet(bm, bei) && inSet(bm_shang, nan)) || (inSet(bm, nan) && inSet(bm_shang, bei))) {
        if (_is_wangxiang(bm_state) && this._sanchuan_has_ji()) matched.push("坎離交泰：有氣吉神將俱集，主發福");
        else matched.push("坎離交泰：無氣帶凶，始終貧困");
      }
      if ((inSet(bm, dong) && inSet(bm_shang, xi)) || (inSet(bm, xi) && inSet(bm_shang, dong))) {
        if (_is_wangxiang(bm_state) && this._sanchuan_has_ji()) matched.push("兌震投合：有氣吉將，主發福");
        else matched.push("兌震投合：無氣帶凶，貧困");
      }
      if (bm_shang === bm) {
        const ri_ma = this.chart["日馬"] || "";
        if (ri_ma && this._sanchuan_has_ji()) matched.push("周天守躔：丁馬有氣入傳帶吉，主發富發貴");
        else matched.push("周天守躔：本命坐本宮不動");
      }
      if ((inSet(bm, dong) && inSet(bm_shang, bei)) || (inSet(bm, bei) && inSet(bm_shang, dong))) {
        if (this._sanchuan_has_ji()) matched.push("紅雲雋秀：喜吉神不忌衝合");
        else matched.push("紅雲雋秀：帶罪煞則秀而不秀反不貴");
      }
      if ((inSet(bm, dong) && inSet(bm_shang, nan)) || (inSet(bm, nan) && inSet(bm_shang, dong))) {
        if (this._sanchuan_has_ji()) matched.push("林火揚光：喜吉神將");
        else matched.push("林火揚光：凶將亦損其光明");
      }
      if ((inSet(bm, xi) && inSet(bm_shang, bei)) || (inSet(bm, bei) && inSet(bm_shang, xi))) {
        if (_is_wangxiang(bm_state) && this._sanchuan_has_ji()) matched.push("天合北極：旺相遇德祿馬等大好達");
        else matched.push("天合北極：休囚無氣則不為合");
      }
      if ((inSet(bm, nan) && inSet(bm_shang, xi)) || (inSet(bm, xi) && inSet(bm_shang, nan))) {
        if (_is_wangxiang(bm_state) && !this._sanchuan_has_xiong()) matched.push("火明西嶽：旺相有氣無凶將惡煞，必崢嶸");
        else matched.push("火明西嶽：否則不以此論");
      }
      for (const m of matched.slice()) {
        if (["庚星", "祥光", "帝座", "青帝", "穩坐"].some(k => m.indexOf(k) >= 0)) {
          if (_shengke(this._chuan_zhi(0), this.benming) === "生" && this._sanchuan_has_ji()) matched.push("以上五局喜生命生身，更有吉神將扶助，旺氣則富貴奇局");
          break;
        }
      }
      return matched;
    }
    analyze_flow_year_month(liunian_zhi) {
      const results = {};
      const gui_jian = [];
      const si_zheng = ["子","午","丑","未","寅","申"];
      const si_yu = ["卯","酉","辰","戌","巳","亥"];
      const fu_gui_shen = ["功曹","傳送","神後","勝光","大吉","小吉"];
      const benming_jiang_name = YUEJIANG_NAME[this.benming_shang] || "";
      if (si_zheng.indexOf(this.benming) >= 0) {
        gui_jian.push("子午丑未寅申生人以天罡加本命");
        if (fu_gui_shen.indexOf(benming_jiang_name) >= 0) gui_jian.push("生月上見" + benming_jiang_name + "，主大富貴");
        else if (benming_jiang_name === "天罡" || benming_jiang_name === "河魁") gui_jian.push("見" + benming_jiang_name + "，主貧窮無神");
      } else if (si_yu.indexOf(this.benming) >= 0) {
        gui_jian.push("卯酉辰戌巳亥生人以天魁加本命");
        if (fu_gui_shen.indexOf(benming_jiang_name) >= 0) gui_jian.push("生月上見" + benming_jiang_name + "，主大富貴");
        else if (benming_jiang_name === "天罡" || benming_jiang_name === "河魁") gui_jian.push("見" + benming_jiang_name + "，主貧窮");
      }
      results["占貴賤"] = gui_jian.length ? gui_jian : ["無特殊貴賤格局"];
      const flow_comments = [];
      if (liunian_zhi) {
        const liunian_shang = this.di_to_tian[liunian_zhi] || "";
        const ln_jiang_name = YUEJIANG_NAME[liunian_shang] || "";
        const ln_jiang = this.di_to_jiang[liunian_zhi] || "";
        if (ln_jiang_name === "功曹" || ln_jiang_name === "傳送") flow_comments.push("流年" + liunian_zhi + "上見" + ln_jiang_name + "，其利加增官祿倍獲財利");
        else if (ln_jiang_name === "天罡" || ln_jiang_name === "河魁") flow_comments.push("流年" + liunian_zhi + "上見" + ln_jiang_name + "，其年災害疾病");
        const rel_ln = _shengke(liunian_zhi, this.ri_gan);
        if (rel_ln === "生" || rel_ln === "比和") {
          if (this._check_ji_jiang(ln_jiang)) flow_comments.push("流年與日干生旺比和，更有吉神良將，主有進益之喜凡事吉利通達");
          else flow_comments.push("流年與日干生旺比和，但缺吉將");
        } else if (rel_ln === "剋" || rel_ln === "被剋") {
          if (this._check_xiong_jiang(ln_jiang)) flow_comments.push("流年與日干刑衝破害，見凶神惡煞，此年不利");
          else flow_comments.push("流年與日干相剋，須謹慎");
        }
        if (this._has_chong(liunian_zhi, this.benming)) flow_comments.push("流年衝本命，此年動盪不安");
        if (this._has_he(liunian_zhi, this.benming)) flow_comments.push("流年合本命，此年和順有助");
      }
      if (!flow_comments.length) flow_comments.push("未指定流年或無特殊吉凶");
      results["流年禍福"] = flow_comments;
      const shou = [];
      const bm_cs = _changsheng_state(_wx(this.benming), this.benming);
      if (bm_cs === "長生") shou.push("本命長生，主延年上壽");
      else if (bm_cs === "冠帶" || bm_cs === "臨官" || bm_cs === "帝旺") shou.push("本命" + bm_cs + "，壯健可望壽");
      else if (bm_cs === "沐浴") shou.push("沐浴好色多病，備氣不足");
      else if (bm_cs === "死" || bm_cs === "墓" || bm_cs === "絕") shou.push("本命" + bm_cs + "，俱主夭");
      else if (bm_cs === "胎" || bm_cs === "養") shou.push("本命" + bm_cs + "，亦主夭");
      const rel_bm_shang = _shengke(this.benming_shang, this.benming);
      if (rel_bm_shang === "生") shou.push("本命上神生本命，主壽");
      else if (rel_bm_shang === "剋") shou.push("本命上神剋本命，須防壽損");
      if (this._has_he(this.benming_shang, this.benming)) shou.push("本命上神與本命合，德合則主延年");
      if (this._has_chong(this.benming_shang, this.benming)) shou.push("本命上神與本命衝，剋害刑衝反此");
      for (let i = 0; i < this._chuan_jiangs.length; i++) {
        if (this._chuan_jiangs[i] === "虎") {
          const cz = this._chuan_zhi(i);
          if (_shengke(cz, this.ri_gan) === "剋") {
            if (liunian_zhi && this._has_chong(liunian_zhi, this.benming)) shou.push("白虎有氣乘鬼剋日，行年衝本命，此年須防大厄");
            else shou.push("白虎乘鬼剋日，須防壽厄在某運中");
          }
        }
      }
      const bm_jiang_name = YUEJIANG_NAME[this.benming_shang] || "";
      if (bm_jiang_name) shou.push("命上得" + bm_jiang_name + "（" + this.benming_shang + "），便知壽盡之年與此支相關");
      if (!shou.length) shou.push("壽數中等，無特殊凶兆");
      results["壽夭"] = shou;
      return results;
    }
    analyze_all() {
      return {
        "身命總則": this.analyze_shenming(),
        "女命專論": this.analyze_female(),
        "五節總決": this.analyze_five_sections(),
        "十二宮論": this.analyze_twelve_palaces(),
        "二十四格": this.detect_24_ge(),
        "十六局": this.detect_16_ju(),
        "流年壽夭": this.analyze_flow_year_month()
      };
    }
  }

  window.LRLife.LunMingAnalyzer = LunMingAnalyzer;
  window.LM_READY = true;

  // ---- UI 层（依赖 liuren_life.js 排盘结果 window._llrChart） ----
  const T2S = { "貴":"贵","龍":"龙","陰":"阴","傳":"传","課":"课","財":"财","農":"农","曆":"历","節":"节","氣":"气","晝":"昼","將":"将","衝":"冲","處":"处","驚":"惊","蟄":"蛰","穀":"谷","滿":"满","種":"种","勝":"胜","臨":"临","歲":"岁","陽":"阳","應":"应","術":"术","籤":"签","鬥":"斗","輝":"辉","來":"来","後":"后","轉":"转","盤":"盘","馬":"马","華":"华","蓋":"盖","閃":"闪","電":"电","當":"当","為":"为","於":"于","點":"点","時":"时","剋":"克","傷":"伤","斷":"断","論":"论","宮":"宫","總":"总","見":"见","離":"离","遠":"远","遷":"迁","運":"运","壽":"寿","災":"灾","婦":"妇","鄉":"乡","頭":"头","開":"开","閉":"闭","軍":"军","樓":"楼","顯":"显","動":"动","樣":"样","憂":"忧","戶":"户","裏":"里","臺":"台","縣":"县","現":"现","雙":"双","體":"体","個":"个","對":"对","並":"并","專":"专","無":"无","幾":"几","會":"会","們":"们","長":"长","門":"门","聲":"声","棄":"弃","禮":"礼","義":"义","愛":"爱","惡":"恶","孀":"孀","脫":"脱","絕":"绝","壞":"坏","撲":"扑","亂":"乱","獎":"奖","積":"积","務":"务","實":"实","際":"际","廣":"广","邊":"边","衛":"卫","敵":"敌","則":"则","負":"负","責":"责","敗":"败","賢":"贤","驢":"驴","顏":"颜","檔":"档","馬":"马" };
  function t2s(s) { if (!s) return s; let r = ""; for (const c of String(s)) r += T2S[c] || c; return r; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  window.lunmingLifeInit = function () {
    const btn = document.getElementById("llr-analyze");
    if (!btn) return;
    const box = document.getElementById("llr-analysis");
    const sel = document.getElementById("llr-benming");
    btn.onclick = function () {
      const chart = window._llrChart;
      if (!chart) { box.innerHTML = '<div class="warn">请先在上方完成排盘，再生成论命分析</div>'; return; }
      // 本命地支跟随占课生年（ln-birth）：(生年−4)÷12 取支；无生年则用下拉手动值
      let benming = sel.value;
      const birthY = (document.getElementById("ln-birth") || {}).value;
      if (birthY && /^\d{4}$/.test(String(birthY))) {
        const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        const idx = ((parseInt(birthY, 10) - 4) % 12 + 12) % 12;
        benming = ZHI[idx];
        if (sel) sel.value = benming;
      }
      try {
        const A = new LunMingAnalyzer(chart, benming);
        const r = A.analyze_all();
        let h = '<div class="muted" style="font-size:12px;margin-bottom:8px;">本命地支（生肖支）：' + esc(t2s(benming)) + ' · 排盘：' + esc(t2s(chart["日期"])) + ' · 格局 ' + esc(t2s(chart["格局"][0])) + '/' + esc(t2s(chart["格局"][1])) + '</div>';
        h += '<h4 style="margin:10px 0 4px;">一、身命总则（《六壬论命秘要》第1节）</h4>';
        const sm = r["身命總則"];
        h += '<div class="card" style="padding:8px;"><b>身（日上）</b>：日上神 ' + esc(t2s(sm["身（日上）"]["日上神"])) + ' · 天将 ' + esc(t2s(sm["身（日上）"]["天將"])) + ' · 旺衰 ' + esc(t2s(sm["身（日上）"]["旺衰"])) + (sm["身（日上）"]["空亡"] ? ' · <span style="color:#c00;">空亡</span>' : '') + (sm["身（日上）"]["入墓"] ? ' · <span style="color:#c00;">入墓</span>' : '') + '</div>';
        h += '<div class="muted" style="font-size:12px;">' + sm["身（日上）"]["論斷"].map(x => "· " + esc(t2s(x))).join("<br>") + '</div>';
        h += '<div class="card" style="padding:8px;margin-top:6px;"><b>宅（辰上）</b>：辰上神 ' + esc(t2s(sm["宅（辰上）"]["辰上神"])) + ' · 天将 ' + esc(t2s(sm["宅（辰上）"]["天將"])) + ' · 旺衰 ' + esc(t2s(sm["宅（辰上）"]["旺衰"])) + '</div>';
        h += '<div class="muted" style="font-size:12px;">' + sm["宅（辰上）"]["論斷"].map(x => "· " + esc(t2s(x))).join("<br>") + '</div>';
        h += '<table class="tbl" style="width:100%;margin-top:6px;"><tr><th>限运</th><th>地支</th><th>天将</th><th>六亲</th><th>旺衰</th><th>论断</th></tr>';
        for (const l of sm["三傳限運"]) h += '<tr><td>' + esc(t2s(l["傳名"])) + '</td><td>' + esc(t2s(l["地支"])) + '</td><td>' + esc(t2s(l["天將"])) + '</td><td>' + esc(t2s(l["六親"])) + '</td><td>' + esc(t2s(l["旺衰"])) + '</td><td>' + l["論斷"].map(x => esc(t2s(x))).join("；") + '</td></tr>';
        h += '</table>';
        if (sm["初末對比"]) h += '<div class="muted" style="font-size:12px;margin-top:4px;">' + sm["初末對比"].map(x => "· " + esc(t2s(x))).join("<br>") + '</div>';
        h += '<div class="muted" style="font-size:12px;margin-top:4px;">' + esc(t2s(sm["課爻總論"])) + '</div>';
        h += '<h4 style="margin:10px 0 4px;">二、女命专论（第2节）</h4>';
        const fm = r["女命專論"];
        h += '<div class="muted" style="font-size:12px;">支上神 ' + esc(t2s(fm["支上神"])) + ' · 支上天将 ' + esc(t2s(fm["支上天將"])) + '</div>';
        h += '<div class="muted" style="font-size:12px;">' + fm["女命論斷"].map(x => "· " + esc(t2s(x))).join("<br>") + '</div>';
        h += '<h4 style="margin:10px 0 4px;">三、五节总决（第5-10节）</h4>';
        for (const k of Object.keys(r["五節總決"])) h += '<div style="margin:4px 0;"><b>' + esc(t2s(k)) + '</b><div class="muted" style="font-size:12px;">' + r["五節總決"][k].map(x => "· " + esc(t2s(x))).join("<br>") + '</div></div>';
        h += '<h4 style="margin:10px 0 4px;">四、十二宫论</h4>';
        h += '<table class="tbl" style="width:100%;"><tr><th>宫</th><th>地支</th><th>上神</th><th>天将</th><th>旺衰</th><th>空</th><th>论断</th></tr>';
        for (const k of ["命宮","兄弟宮","夫妻宮","子女宮","財帛宮","疾厄宮","遷移宮","奴僕宮","官祿宮","田宅宮","福德宮","相貌宮"]) {
          const p = r["十二宮論"][k];
          h += '<tr><td>' + esc(t2s(k)) + '</td><td>' + esc(t2s(p["宮位地支"])) + '</td><td>' + esc(t2s(p["天盤上神"])) + '</td><td>' + esc(t2s(p["天將"])) + '</td><td>' + esc(t2s(p["旺衰"])) + '</td><td>' + (p["空亡"] ? '<span style="color:#c00;">空</span>' : '') + '</td><td>' + p["論斷"].map(x => esc(t2s(x))).join("；") + '</td></tr>';
        }
        h += '</table>';
        h += '<h4 style="margin:10px 0 4px;">五、二十四格 / 十六局</h4>';
        h += '<div class="muted" style="font-size:12px;">' + (r["二十四格"].length ? r["二十四格"].map(x => "· " + esc(t2s(x))).join("<br>") : "无匹配格局") + '</div>';
        h += '<div class="muted" style="font-size:12px;margin-top:4px;">' + (r["十六局"].length ? r["十六局"].map(x => "· " + esc(t2s(x))).join("<br>") : "无匹配局") + '</div>';
        h += '<h4 style="margin:10px 0 4px;">六、流年寿夭</h4>';
        const fy = r["流年壽夭"];
        h += '<div class="muted" style="font-size:12px;"><b>占贵贱：</b>' + fy["占貴賤"].map(x => esc(t2s(x))).join("；") + '</div>';
        h += '<div class="muted" style="font-size:12px;"><b>流年祸福：</b>' + fy["流年禍福"].map(x => esc(t2s(x))).join("；") + '</div>';
        h += '<div class="muted" style="font-size:12px;"><b>寿夭：</b>' + fy["壽夭"].map(x => esc(t2s(x))).join("；") + '</div>';
        h += '<div class="muted" style="font-size:12px;margin-top:8px;">论命分析算法对译 kinastro(MIT) lunming.py（现代整理层），断语口径依据《六壬论命秘要》；判定逻辑逐条照原文实现，无删改。本面板暂未提供流年支输入，流年祸福显示静态结论。</div>';
        box.innerHTML = h;
      } catch (e) {
        box.innerHTML = '<div class="warn">分析失败：' + esc(e && e.message) + '</div>';
      }
    };
  };
})();
