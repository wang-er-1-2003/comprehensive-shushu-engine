// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// diqiyijue.js — 涤器遗诀（对译 kinastro(MIT) astro/diqiyijue/calculator.py，2329 行）
// 输入：birth = {年,月,日,時} 四柱干支 + gender（男/女）
// 入口：window.DQYJ.compute(birth, gender) → calculate_chart() 全量排盘
// 断语繁体照原文（UI 层 t2s 转简）；判定逻辑逐条照 py，无删改。
(function () {
  "use strict";
  const TIANGAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const DIZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const NAYIN_TABLE = ["金", "火", "木", "土", "金", "火", "水", "土", "金", "木", "水", "土", "火", "木", "水", "金", "火", "木", "土", "金", "火", "水", "土", "金", "木", "水", "土", "火", "木", "水"];
  const NAYIN_DETAIL = ["海中金", "爐中火", "大林木", "路旁土", "劍鋒金", "山頭火", "澗下水", "城頭土", "白蠟金", "楊柳木", "井泉水", "屋上土", "霹靂火", "松柏木", "長流水", "砂石金", "山下火", "平地木", "壁上土", "金箔金", "覆燈火", "天河水", "大驛土", "釵釧金", "桑拓木", "大溪水", "沙中土", "天上火", "石榴木", "大海水"];
  const HETU_WUXING = { 1: "水", 6: "水", 2: "火", 7: "火", 3: "木", 8: "木", 4: "金", 9: "金", 5: "土", 0: "土", 10: "土" };
  const WUXING_SHENG = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
  const WUXING_KE = { "木": "土", "土": "水", "水": "火", "火": "金", "金": "木" };
  const BAGONG_NAMES = ["倫", "己", "雁", "翡", "乳", "養", "鬼", "基"];
  const BAGONG_FULLNAMES = ["倫（父母）", "己（己身）", "雁（兄弟）", "翡（夫妻）", "乳（子女）", "養（官祿）", "鬼（疾厄）", "基（家宅）"];
  const BAGONG_XING = ["貪狼", "巨門", "祿存", "文曲", "廉貞", "武曲", "破軍", "伏吟"];
  const BAGONG_GUA = ["坎", "坤", "震", "巽", "離", "乾", "兌", "艮"];
  const SHIER_CHANGSHENG = ["胞", "胎", "養", "生", "敗", "冠", "官", "旺", "衰", "病", "死", "墓"];
  const QIPAO_START = { "金": "寅", "水": "巳", "土": "巳", "木": "申", "火": "亥" };
  const GUA_DIZHI_MAP = { "兌": ["酉"], "乾": ["戌", "亥"], "坎": ["子"], "艮": ["丑", "寅"], "震": ["卯"], "巽": ["辰", "巳"], "離": ["午"], "坤": ["未", "申"] };
  const DIZHI_TO_GUA = {};
  for (const g of Object.keys(GUA_DIZHI_MAP)) for (const z of GUA_DIZHI_MAP[g]) DIZHI_TO_GUA[z] = g;
  const GUA_YAO = { "乾": [1, 1, 1], "兌": [0, 1, 1], "離": [1, 0, 1], "震": [0, 0, 1], "巽": [1, 1, 0], "坎": [0, 1, 0], "艮": [1, 0, 0], "坤": [0, 0, 0] };
  const GUA_WUXING = { "乾": "金", "兌": "金", "離": "火", "震": "木", "巽": "木", "坎": "水", "艮": "土", "坤": "土" };
  const BAGUA_HOUTIAN_ORDER = ["兌", "乾", "坎", "艮", "震", "巽", "離", "坤"];

  function _baguan_relation(zhu_gua, ke_gua) {
    const y1 = GUA_YAO[zhu_gua], y2 = GUA_YAO[ke_gua];
    const diff = [];
    for (let i = 0; i < 3; i++) if (y1[i] !== y2[i]) diff.push(i);
    const n = diff.length;
    if (n === 0) return "歸魂";
    if (n === 1) {
      if (diff[0] === 0) return "生氣";
      if (diff[0] === 1) return "絕命";
      return "禍害";
    }
    if (n === 2) {
      if (diff[0] === 0 && diff[1] === 1) return "天宜";
      if (diff[0] === 1 && diff[1] === 2) return "福德";
      return "遊魂";
    }
    return "絕體";
  }
  const BAGUAN_TABLE = {};
  for (const g1 of Object.keys(GUA_YAO)) { BAGUAN_TABLE[g1] = {}; for (const g2 of Object.keys(GUA_YAO)) BAGUAN_TABLE[g1][g2] = _baguan_relation(g1, g2); }

  function tiangan_index(gan) { return TIANGAN.indexOf(gan); }
  function dizhi_index(zhi) { return DIZHI.indexOf(zhi); }
  function ganzhi_to_index(gz) {
    const g = tiangan_index(gz[0]), z = dizhi_index(gz[1]);
    for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
    throw new Error("無效干支組合: " + gz);
  }
  function nayin_wuxing(gz) { return NAYIN_TABLE[Math.floor(ganzhi_to_index(gz) / 2)]; }
  function nayin_detail(gz) { return NAYIN_DETAIL[Math.floor(ganzhi_to_index(gz) / 2)]; }
  function hetu_wuxing(num) { return HETU_WUXING[num % 10] || "土"; }
  function wuxing_relation(zhu, ke) {
    if (zhu === ke) return "比和";
    if (WUXING_SHENG[zhu] === ke) return "生";
    if (WUXING_SHENG[ke] === zhu) return "被生";
    if (WUXING_KE[zhu] === ke) return "克";
    if (WUXING_KE[ke] === zhu) return "被克";
    return "無";
  }
  function count_forward_gan(from_gan, to_gan) { return ((tiangan_index(to_gan) - tiangan_index(from_gan)) % 10 + 10) % 10 + 1; }
  function count_forward_zhi(from_zhi, to_zhi) { return ((dizhi_index(to_zhi) - dizhi_index(from_zhi)) % 12 + 12) % 12 + 1; }
  function reduce_number(n) {
    if (n <= 0) return 0;
    if (n === 10) return 1;
    if (n > 10) { const m = n % 10; return m !== 0 ? m : 1; }
    return n;
  }
  function qipao_position(wx, zhi) {
    const start_zhi = QIPAO_START[wx];
    if (start_zhi === undefined) return "未知";
    const pos = ((dizhi_index(zhi) - dizhi_index(start_zhi)) % 12 + 12) % 12;
    return SHIER_CHANGSHENG[pos];
  }
  function is_qipao_ji(position) { return position === "胎" || position === "養" || position === "生" || position === "冠" || position === "官" || position === "旺" || position === "墓"; }
  function _yinyang_of(n) { return n % 2 === 1 ? 1 : 0; }
  function bagua_tibian(four_pos) {
    const yy = four_pos.map(_yinyang_of);
    const map = {
      "1111": ["乾", "本"], "1011": ["乾", "變"], "1110": ["巽", "本"], "1100": ["巽", "變"],
      "0110": ["坎", "本"], "0010": ["坎", "變"], "1001": ["離", "本"], "1101": ["離", "變"],
      "1000": ["艮", "本"], "1010": ["艮", "變"], "0000": ["坤", "本"], "0100": ["坤", "變"],
      "0001": ["震", "本"], "0011": ["震", "變"], "0111": ["兌", "本"], "0101": ["兌", "變"]
    };
    const key = yy.join("");
    const hit = map[key] || ["未知", "未知"];
    const gua_name = hit[0], ben_bian = hit[1];
    const _three = { "111": "乾", "011": "兌", "101": "離", "001": "震", "110": "巽", "010": "坎", "100": "艮", "000": "坤" };
    const xian_gua = _three[yy.slice(0, 3).join("")] || "未知";
    const hou_gua = _three[yy.slice(1).join("")] || "未知";
    const shang_sum = four_pos[0] + four_pos[1];
    const xia_sum = four_pos[2] + four_pos[3];
    return {
      "四位": four_pos.slice(), "陰陽": yy, "卦名": gua_name, "本變": ben_bian,
      "卦五行": GUA_WUXING[gua_name] || "未知", "先卦": xian_gua, "後卦": hou_gua,
      "先卦五行": GUA_WUXING[xian_gua] || "未知", "後卦五行": GUA_WUXING[hou_gua] || "未知",
      "上數": shang_sum % 10, "上五行": hetu_wuxing(shang_sum % 10),
      "下數": xia_sum % 10, "下五行": hetu_wuxing(xia_sum % 10)
    };
  }
  function guankong_dinggua(four_pos) {
    const a = four_pos[0], b = four_pos[1], c = four_pos[2], d = four_pos[3];
    const total = a + b + c + d;
    const s234 = b + c + d, s123 = a + b + c, s14 = a + d, s23 = b + c, s34 = c + d, s12 = a + b;
    const all_zero = a === 0 && b === 0 && c === 0 && d === 0;
    const quan_kong = total % 10 === 0;
    const xia_san_kong = (s234 % 10 === 0) && !quan_kong;
    const shang_san_kong = (s123 % 10 === 0) && !quan_kong;
    const ge_jian_kong = (s14 % 10 === 0) && (s23 % 10 !== 0) && !quan_kong;
    const zhong_wei_kong = (s23 % 10 === 0) && (s14 % 10 !== 0) && !quan_kong;
    const xia_wei_kong = (s34 % 10 === 0) && (s12 % 10 !== 0) && !quan_kong;
    const shang_wei_kong = (s12 % 10 === 0) && (s34 % 10 !== 0) && !quan_kong;
    let gua, kong_type;
    if (all_zero || quan_kong) { gua = "坤"; kong_type = "全位空"; }
    else if (shang_san_kong) { gua = "震"; kong_type = "上三空"; }
    else if (xia_san_kong) { gua = "艮"; kong_type = "下三空"; }
    else if (zhong_wei_kong) { gua = "離"; kong_type = "中位空"; }
    else if (ge_jian_kong) { gua = "坎"; kong_type = "隔間空"; }
    else if (shang_wei_kong) { gua = "兌"; kong_type = "上位空"; }
    else if (xia_wei_kong) { gua = "巽"; kong_type = "下位空"; }
    else { gua = "乾"; kong_type = "全不空"; }
    const zong_ling = total % 10;
    return { "卦名": gua, "空類型": kong_type, "卦五行": GUA_WUXING[gua] || "未知", "總數": total, "總零": zong_ling, "總零五行": hetu_wuxing(zong_ling), "開閉": zong_ling === 0 ? "閉數" : "開數" };
  }

  class DiQiYiJue {
    constructor(birth_ganzhi, gender) {
      this.birth = birth_ganzhi;
      this.gender = gender || "男";
      this.year_gz = birth_ganzhi["年"];
      this.month_gz = birth_ganzhi["月"];
      this.day_gz = birth_ganzhi["日"];
      this.hour_gz = birth_ganzhi["時"];
      this.year_gan = this.year_gz[0]; this.year_zhi = this.year_gz[1];
      this.month_gan = this.month_gz[0]; this.month_zhi = this.month_gz[1];
      this.day_gan = this.day_gz[0]; this.day_zhi = this.day_gz[1];
      this.hour_gan = this.hour_gz[0]; this.hour_zhi = this.hour_gz[1];
      this.year_nayin = nayin_wuxing(this.year_gz);
      this.month_nayin = nayin_wuxing(this.month_gz);
      this.day_nayin = nayin_wuxing(this.day_gz);
      this.hour_nayin = nayin_wuxing(this.hour_gz);
      this.tai_gz = this._calc_tai_month();
      this.tai_gan = this.tai_gz[0]; this.tai_zhi = this.tai_gz[1];
      this.tai_nayin = nayin_wuxing(this.tai_gz);
      this.wu_tiao = [this.tai_gz, this.year_gz, this.month_gz, this.day_gz, this.hour_gz];
      this.wu_tiao_nayin = [this.tai_nayin, this.year_nayin, this.month_nayin, this.day_nayin, this.hour_nayin];
      const yy = this._calc_yuan_ying();
      this.yuan_shu = yy[0]; this.ying_shu = yy[1];
      this.ba_gong_raw = this._calc_bagong();
      this.ba_gong_wuxing = [];
      this._fill_bagong_wuxing();
      this.ben_gong_siwei = this._calc_bengong_siwei();
      this.guankong = guankong_dinggua(this.ben_gong_siwei);
      this.bagua_tibian_result = bagua_tibian(this.ben_gong_siwei);
      this.du_shu = this.ba_gong_raw.reduce((a, b) => a + b, 0);
      const mg = this._calc_ming_gong();
      this.ming_gong_idx = mg[0]; this.ming_gong_wx = mg[1];
      this.dayun = this._calc_dayun();
      this.xiaoyun = this._calc_xiaoyun();
      this.shu_wei = this._calc_shuwei();
      this.he_yun = this._calc_heyun();
      this.qipao_bagong = this._calc_qipao_bagong();
      this.qipao_bengong = this._calc_qipao_bengong();
      this.ben_gong_biefa = this._calc_bengong_biefa();
    }
    _calc_tai_month() {
      const gan_idx = (tiangan_index(this.month_gan) + 1) % 10;
      const zhi_idx = (dizhi_index(this.month_zhi) + 3) % 12;
      return TIANGAN[gan_idx] + DIZHI[zhi_idx];
    }
    _calc_yuan_ying() {
      const yuan = [
        reduce_number(count_forward_gan(this.tai_gan, this.year_gan)),
        reduce_number(count_forward_gan(this.tai_gan, this.month_gan)),
        reduce_number(count_forward_gan(this.tai_gan, this.day_gan)),
        reduce_number(count_forward_gan(this.tai_gan, this.hour_gan))
      ];
      const ying = [
        reduce_number(count_forward_zhi(this.tai_zhi, this.year_zhi)),
        reduce_number(count_forward_zhi(this.tai_zhi, this.month_zhi)),
        reduce_number(count_forward_zhi(this.tai_zhi, this.day_zhi)),
        reduce_number(count_forward_zhi(this.tai_zhi, this.hour_zhi))
      ];
      return [yuan, ying];
    }
    _calc_bagong() {
      const yuan_num = this.yuan_shu[0] * 1000 + this.yuan_shu[1] * 100 + this.yuan_shu[2] * 10 + this.yuan_shu[3];
      const ying_num = this.ying_shu[0] * 1000 + this.ying_shu[1] * 100 + this.ying_shu[2] * 10 + this.ying_shu[3];
      let prod_str = String(yuan_num * ying_num);
      if (prod_str.length < 8) prod_str = prod_str + "0".repeat(8 - prod_str.length);
      return prod_str.slice(0, 8).split("").map(Number);
    }
    _fill_bagong_wuxing() {
      const raw = this.ba_gong_raw.slice();
      let start_offset = 0;
      for (let i = 0; i < raw.length; i++) { if (raw[i] !== 0) { start_offset = i; break; } }
      const rearranged = raw.slice(start_offset).concat(raw.slice(0, start_offset));
      while (rearranged.length < 8) rearranged.push(0);
      this.ba_gong_raw = rearranged.slice(0, 8);
      const wuxing_list = [];
      for (let i = 0; i < this.ba_gong_raw.length; i++) {
        const val = this.ba_gong_raw[i];
        if (val === 0) {
          const gong_name = BAGONG_NAMES[i];
          if (gong_name === "己") wuxing_list.push(this.year_nayin);
          else if (gong_name === "雁") wuxing_list.push(this.month_nayin);
          else if (gong_name === "翡") wuxing_list.push(this.day_nayin);
          else if (gong_name === "乳") wuxing_list.push(this.hour_nayin);
          else if (gong_name === "養" || gong_name === "鬼" || gong_name === "基") wuxing_list.push(wuxing_list[1]);
          else wuxing_list.push(hetu_wuxing(val));
        } else wuxing_list.push(hetu_wuxing(val));
      }
      this.ba_gong_wuxing = wuxing_list;
    }
    _calc_bengong_siwei() {
      const bg = this.ba_gong_raw;
      let carry = 0;
      let s4 = bg[6] + bg[7] + carry; const d4 = s4 % 10; carry = Math.floor(s4 / 10);
      let s3 = bg[4] + bg[5] + carry; const d3 = s3 % 10; carry = Math.floor(s3 / 10);
      let s2 = bg[2] + bg[3] + carry; const d2 = s2 % 10; carry = Math.floor(s2 / 10);
      let s1 = bg[0] + bg[1] + carry; let d1 = s1 % 10; const carry1 = Math.floor(s1 / 10);
      d1 = (d1 + carry1) % 10;
      return [d1, d2, d3, d4];
    }
    _calc_bengong_biefa() {
      const bg = this.ba_gong_raw;
      const _reduce = (n) => {
        if (n === 10) return 1;
        if (n > 10) { const m = n % 10; return m !== 0 ? m : 1; }
        return n;
      };
      return [_reduce(bg[0] + bg[4]), _reduce(bg[1] + bg[5]), _reduce(bg[2] + bg[6]), _reduce(bg[3] + bg[7])];
    }
    _calc_qipao_bagong() {
      const results = [];
      for (let i = 0; i < this.ba_gong_wuxing.length; i++) {
        const wx = this.ba_gong_wuxing[i];
        const pos = qipao_position(wx, this.month_zhi);
        results.push({ "宮": BAGONG_NAMES[i], "數": this.ba_gong_raw[i], "五行": wx, "胞胎位": pos, "吉凶": is_qipao_ji(pos) ? "吉" : "凶" });
      }
      return results;
    }
    _calc_qipao_bengong() {
      const results = [];
      for (let i = 0; i < this.ben_gong_siwei.length; i++) {
        const val = this.ben_gong_siwei[i];
        const wx = hetu_wuxing(val);
        const pos = qipao_position(wx, this.month_zhi);
        results.push({ "位": i + 1, "數": val, "五行": wx, "胞胎位": pos, "吉凶": is_qipao_ji(pos) ? "吉" : "凶" });
      }
      return results;
    }
    _calc_ming_gong() {
      const du = this.du_shu;
      if (du === 0) return [0, this.ba_gong_wuxing[0]];
      const idx = (du - 1) % 8;
      return [idx, this.ba_gong_wuxing[idx]];
    }
    _calc_dayun() {
      let ling = this.du_shu % 10;
      if (ling === 0) ling = 10;
      const dayun_list = [];
      const start_idx = this.ming_gong_idx;
      let current_age = 1;
      let i = 0;
      while (current_age <= 100) {
        const gong_idx = (start_idx + i) % 8;
        const age_start = current_age;
        let age_end;
        if (i === 0) age_end = ling; else age_end = age_start + 9;
        if (age_start > 100) break;
        dayun_list.push({ "起始歲": age_start, "終止歲": Math.min(age_end, 100), "宮": BAGONG_NAMES[gong_idx], "宮五行": this.ba_gong_wuxing[gong_idx] });
        current_age = age_end + 1;
        i += 1;
      }
      return dayun_list;
    }
    _calc_xiaoyun() {
      const xiaoyun_list = [];
      for (let age = 1; age <= 100; age++) {
        const gong_idx = (this.ming_gong_idx + age - 1) % 8;
        xiaoyun_list.push({ "歲": age, "宮": BAGONG_NAMES[gong_idx], "宮五行": this.ba_gong_wuxing[gong_idx] });
      }
      return xiaoyun_list;
    }
    _calc_shuwei() {
      const total = this.ben_gong_siwei.reduce((a, b) => a + b, 0);
      const ling = total % 10;
      const wx = hetu_wuxing(ling);
      return { "總計": total, "零數": ling, "五行": wx, "與本卦關係": wuxing_relation(this.bagua_tibian_result["卦五行"], wx) };
    }
    _calc_heyun() {
      const sp = this.ben_gong_siwei;
      const fu = sp[0], fu2 = sp[3], yun1 = sp[1], yun2 = sp[2];
      const fu_wx = hetu_wuxing(fu), fu2_wx = hetu_wuxing(fu2);
      const yun_sum = yun1 + yun2;
      const yun_ling = yun_sum % 10;
      const fufu_sum = fu + fu2;
      const fufu_ling = fufu_sum % 10;
      const fu_yy = fu % 2 === 1 ? "陽" : "陰";
      const fu2_yy = fu2 % 2 === 1 ? "陽" : "陰";
      let dewei;
      if (fu_yy === "陽" && fu2_yy === "陰") dewei = "得位（吉）";
      else if (fu_yy === "陰" && fu2_yy === "陽") dewei = "失位（凶）";
      else if (fu_yy === fu2_yy) dewei = "純陰純陽（不佳）";
      else dewei = "其他";
      const fufu_rel = wuxing_relation(fu_wx, fu2_wx);
      const yun_kong = yun1 === 0 && yun2 === 0;
      const yun_po = yun_sum % 10 === 0 && yun_sum > 0;
      let nan_nv;
      if (yun_kong) nan_nv = "無子（孕空）";
      else if (yun_po) nan_nv = "落胎（破孕）";
      else if (yun1 === 0 || yun2 === 0) { const eff = yun1 !== 0 ? yun1 : yun2; nan_nv = eff % 2 === 1 ? "陽（男多）" : "陰（女多）"; }
      else nan_nv = yun_ling % 2 === 1 ? "陽（男多）" : "陰（女多）";
      return { "夫": { "數": fu, "五行": fu_wx, "陰陽": fu_yy }, "婦": { "數": fu2, "五行": fu2_wx, "陰陽": fu2_yy }, "得位": dewei, "夫婦關係": fufu_rel, "夫婦合數": fufu_sum, "夫婦合零": fufu_ling, "孕一": yun1, "孕二": yun2, "孕合數": yun_sum, "孕零數": yun_ling, "孕空": yun_kong, "破孕": yun_po, "男女": nan_nv };
    }
    flow_year_biefa(year_ganzhi, age) {
      if (age === null || age === undefined) throw new Error("必須提供行年歲數 age");
      const bp = this.ben_gong_biefa;
      const yuan_num = bp[0] * 1000 + bp[1] * 100 + bp[2] * 10 + bp[3];
      const digits = String(yuan_num * age).split("").map(Number);
      let tui_shu = null, ruan_shu = null, liu_chou;
      if (digits.length >= 6) { tui_shu = digits[0]; ruan_shu = digits[digits.length - 1]; liu_chou = digits.slice(1, 5); }
      else if (digits.length === 5) { tui_shu = digits[0]; liu_chou = digits.slice(1, 5); }
      else if (digits.length === 4) { liu_chou = digits.slice(); }
      else { while (digits.length < 4) digits.unshift(0); liu_chou = digits.slice(0, 4); }
      return { "方法": "本宮別法", "本宮別法四位": bp.slice(), "行年": age, "乘積": yuan_num * age, "退數": tui_shu, "軟數": ruan_shu, "流籌四位": liu_chou, "八卦體變": bagua_tibian(liu_chou), "觀空定卦": guankong_dinggua(liu_chou) };
    }
    shu_chi_gua(age) {
      if (age < 10) return "未及齒卦（未滿十歲）";
      const offset = age - 10;
      const idx = this.gender === "男" ? offset % 8 : ((-offset) % 8 + 8) % 8;
      return BAGUA_HOUTIAN_ORDER[idx];
    }
    baguan(zhu_gua, ke_zhi) {
      const ke_gua = DIZHI_TO_GUA[ke_zhi];
      if (ke_gua === undefined) return "未知";
      const row = BAGUAN_TABLE[zhu_gua];
      return row ? (row[ke_gua] || "未知") : "未知";
    }
    flow_year(year_ganzhi, age) {
      if (age === null || age === undefined) throw new Error("必須提供行年歲數 age");
      const bp = this.ben_gong_siwei;
      const yuan_num = bp[0] * 1000 + bp[1] * 100 + bp[2] * 10 + bp[3];
      let digits = String(yuan_num * age).split("").map(Number);
      let tui_shu = null, ruan_shu = null;
      while (digits.length > 6) {
        const head = digits[0] + digits[1];
        const tail = digits[digits.length - 2] + digits[digits.length - 1];
        const mid = digits.slice(2, digits.length - 2);
        const new_digits = [head].concat(mid, [tail]);
        let carry = 0;
        for (let i = new_digits.length - 1; i >= 0; i--) {
          new_digits[i] += carry;
          carry = Math.floor(new_digits[i] / 10);
          new_digits[i] %= 10;
        }
        if (carry > 0) new_digits.unshift(carry);
        digits = new_digits;
      }
      let liu_chou;
      if (digits.length >= 6) { tui_shu = digits[0]; ruan_shu = digits[digits.length - 1]; liu_chou = digits.slice(1, 5); }
      else if (digits.length === 5) { tui_shu = digits[0]; liu_chou = digits.slice(1, 5); }
      else if (digits.length === 4) { liu_chou = digits.slice(); }
      else { while (digits.length < 4) digits.unshift(0); liu_chou = digits.slice(0, 4); }
      const lc_guankong = guankong_dinggua(liu_chou);
      const lc_tibian = bagua_tibian(liu_chou);
      const chi_gua = age >= 10 ? this.shu_chi_gua(age) : "未及";
      let chi_liuchou_baguan = "";
      if (chi_gua !== "未及齒卦（未滿十歲）" && chi_gua !== "未及") {
        const lc_gua = lc_tibian["卦名"];
        const row = BAGUAN_TABLE[chi_gua];
        chi_liuchou_baguan = row ? (row[lc_gua] || "未知") : "未知";
      }
      let lc_year_baguan = "";
      if (year_ganzhi && year_ganzhi.length >= 2) lc_year_baguan = this.baguan(lc_tibian["卦名"], year_ganzhi[1]);
      const guan_wu = this._guanshu_wuzhang(liu_chou);
      const zei_xing = this._calc_zeixing(liu_chou);
      const lc_total = liu_chou.reduce((a, b) => a + b, 0);
      const lc_ling = lc_total % 10;
      let dayun_info = null;
      for (const dy of this.dayun) { if (dy["起始歲"] <= age && age <= dy["終止歲"]) { dayun_info = dy; break; } }
      let xiaoyun_info = null;
      if (1 <= age && age <= this.xiaoyun.length) xiaoyun_info = this.xiaoyun[age - 1];
      return { "行年": age, "流年干支": year_ganzhi || "", "乘積": yuan_num * age, "流籌四位": liu_chou, "觀空定卦": lc_guankong, "八卦體變": lc_tibian, "齒卦": chi_gua, "齒卦與流籌八觀": chi_liuchou_baguan, "流籌與年支八觀": lc_year_baguan, "觀數五章": guan_wu, "賊星": zei_xing, "總數": lc_total, "總零": lc_ling, "總零五行": hetu_wuxing(lc_ling), "大運": dayun_info, "小運": xiaoyun_info };
    }
    _guanshu_wuzhang(four_pos) {
      const yang_count = four_pos.filter(x => x % 2 === 1).length;
      const yin_count = 4 - yang_count;
      let yinyang;
      if (yang_count === yin_count) yinyang = "陰陽平分（吉）";
      else if (yang_count > yin_count) yinyang = "陽眾陰寡（陽" + yang_count + "陰" + yin_count + "）";
      else yinyang = "陰眾陽寡（陰" + yin_count + "陽" + yang_count + "）";
      const shunni = this._check_shunni(four_pos);
      const wx_list = four_pos.map(hetu_wuxing);
      const liandie = this._check_liandie(wx_list);
      const zei = this._calc_zeixing(four_pos);
      const total = four_pos.reduce((a, b) => a + b, 0);
      const ling = total % 10;
      return { "陰陽眾寡": yinyang, "數位順逆": shunni, "五行連疊": liandie, "賊星": zei, "總餘": ling, "總餘奇偶": ling % 2 === 1 ? "奇" : "偶" };
    }
    _check_shunni(fp) {
      let shun_count = 0, ni_count = 0;
      for (let i = 0; i < fp.length - 1; i++) {
        if (fp[i + 1] > fp[i]) shun_count += 1;
        else if (fp[i + 1] < fp[i]) ni_count += 1;
      }
      if (shun_count === 3) return "四位俱順（登科第一）";
      if (ni_count === 3) return "四位俱逆（成事歸虛）";
      if (shun_count === 2 && ni_count === 1) return "三順一逆（運數平常）";
      if (shun_count === 1 && ni_count === 2) return "一順三逆（觸事見害）";
      if (shun_count === ni_count) return "二順二逆（吉凶散錯）";
      return "平";
    }
    _check_liandie(wx_list) {
      let max_run = 1, cur_run = 1, run_wx = wx_list[0];
      for (let i = 1; i < wx_list.length; i++) {
        if (wx_list[i] === wx_list[i - 1]) {
          cur_run += 1;
          if (cur_run > max_run) { max_run = cur_run; run_wx = wx_list[i]; }
        } else cur_run = 1;
      }
      const liandie_desc = { "金": "金之比疊者，遭刑殺損財貨", "木": "木之比疊者，陰密之事或風散之嘆", "水": "水之比疊者，淫事之謗或死別生離", "火": "火之比疊者，口舌爭訟之辨", "土": "土之比疊者，萬事遲鈍" };
      if (max_run >= 4) return "四位連疊（" + run_wx + "）——一年動靜莫非辛苦憂患。" + (liandie_desc[run_wx] || "");
      if (max_run >= 3) return "三位連疊（" + run_wx + "）——尋者遠失，存者遠亡。" + (liandie_desc[run_wx] || "");
      if (max_run >= 2) return "二位連疊（" + run_wx + "）——所謀阻滯，成敗無常。" + (liandie_desc[run_wx] || "");
      return "無連疊";
    }
    _calc_zeixing(liu_chou) {
      const bagong_set = new Set(this.ba_gong_raw);
      const zei = [];
      for (const val of liu_chou) { if (!bagong_set.has(val) && val !== 0) zei.push(val); }
      return Array.from(new Set(zei));
    }
    siwei_baguan(four_pos, start_year_gz) {
      if (start_year_gz === null || start_year_gz === undefined) start_year_gz = this.year_gz;
      const start_zhi_idx = dizhi_index(start_year_gz[1]);
      const tibian = bagua_tibian(four_pos);
      const gua_name = tibian["卦名"];
      const results = [];
      for (let i = 0; i < four_pos.length; i++) {
        const val = four_pos[i];
        if (val === 0) { results.push({ "位": i + 1, "數": val, "地支": "空", "八觀": "空位" }); continue; }
        const target_zhi_idx = (start_zhi_idx + val - 1) % 12;
        const target_zhi = DIZHI[target_zhi_idx];
        const bg = this.baguan(gua_name, target_zhi);
        results.push({ "位": i + 1, "數": val, "地支": target_zhi, "干支": TIANGAN[((tiangan_index(start_year_gz[0]) + val - 1) % 10 + 10) % 10] + target_zhi, "八觀": bg });
      }
      return results;
    }
    ying_gua(four_pos) {
      if (four_pos === null || four_pos === undefined) four_pos = this.ben_gong_siwei;
      const xiantian_gua = { 1: "乾", 2: "兌", 3: "離", 4: "震", 5: "巽", 6: "坎", 7: "艮", 0: "坤" };
      const shang_sum = four_pos[0] + four_pos[3];
      const xia_sum = four_pos[1] + four_pos[2];
      const total = four_pos.reduce((a, b) => a + b, 0);
      const shang_gua_num = shang_sum % 8;
      const xia_gua_num = xia_sum % 8;
      let dong_yao = total % 6;
      if (dong_yao === 0) dong_yao = 6;
      const shang_gua = xiantian_gua[shang_gua_num] || "坤";
      const xia_gua = xiantian_gua[xia_gua_num] || "坤";
      return { "上卦": shang_gua, "下卦": xia_gua, "上卦數": shang_sum, "下卦數": xia_sum, "動爻": dong_yao, "總數": total };
    }
    static ershisi_shan_qishu(shan_data) {
      const shan_table = {
        "乾": { "高": 40, "平": 30, "低": 20 }, "戌": { "高": 36, "平": 27, "低": 18 }, "亥": { "高": 44, "平": 33, "低": 22 },
        "壬": { "高": 28, "平": 21, "低": 14 }, "子": { "高": 36, "平": 27, "低": 18 }, "癸": { "高": 52, "平": 39, "低": 26 },
        "丑": { "高": 24, "平": 18, "低": 12 }, "艮": { "高": 32, "平": 24, "低": 16 }, "寅": { "高": 28, "平": 21, "低": 14 },
        "甲": { "高": 16, "平": 12, "低": 8 }, "卯": { "高": 8, "平": 6, "低": 4 }, "乙": { "高": 8, "平": 6, "低": 4 },
        "辰": { "高": 20, "平": 15, "低": 10 }, "巽": { "高": 32, "平": 24, "低": 16 }, "巳": { "高": 38, "平": 28, "低": 19 },
        "丙": { "高": 36, "平": 27, "低": 18 }, "午": { "高": 36, "平": 27, "低": 18 }, "丁": { "高": 42, "平": 32, "低": 21 },
        "未": { "高": 44, "平": 33, "低": 22 }, "坤": { "高": 56, "平": 42, "低": 28 }, "申": { "高": 50, "平": 38, "低": 25 },
        "庚": { "高": 44, "平": 33, "低": 22 }, "酉": { "高": 28, "平": 21, "低": 14 }, "辛": { "高": 32, "平": 24, "低": 16 }
      };
      const groups = [["乾", "戌", "亥"], ["壬", "子", "癸"], ["丑", "艮", "寅"], ["甲", "卯", "乙"], ["辰", "巽", "巳"], ["丙", "午", "丁"], ["未", "坤", "申"], ["庚", "酉", "辛"]];
      const bagong_nums = [];
      for (const group of groups) {
        let total = 0;
        for (const shan of group) { const level = shan_data[shan] || "平"; total += (shan_table[shan] || {})[level] || 0; }
        bagong_nums.push(total);
      }
      const bagong_ling = bagong_nums.map(n => n % 10);
      let carry = 0;
      let s4 = bagong_ling[6] + bagong_ling[7] + carry; const d4 = s4 % 10; carry = Math.floor(s4 / 10);
      let s3 = bagong_ling[4] + bagong_ling[5] + carry; const d3 = s3 % 10; carry = Math.floor(s3 / 10);
      let s2 = bagong_ling[2] + bagong_ling[3] + carry; const d2 = s2 % 10; carry = Math.floor(s2 / 10);
      let s1 = bagong_ling[0] + bagong_ling[1] + carry; let d1 = s1 % 10; const carry1 = Math.floor(s1 / 10);
      d1 = (d1 + carry1) % 10;
      const siwei = [d1, d2, d3, d4];
      const sw_total = siwei.reduce((a, b) => a + b, 0);
      const sw_ling = sw_total % 10;
      return { "八宮原數": bagong_nums, "八宮零數": bagong_ling, "八宮五行": bagong_ling.map(hetu_wuxing), "四位": siwei, "數尾": sw_ling, "數尾五行": hetu_wuxing(sw_ling) };
    }
    static lihe_calc(year_zhi, month_num, day_num, hour_zhi, person_age) {
      const year_num = reduce_number(dizhi_index(year_zhi) + 1);
      const hour_num = reduce_number(dizhi_index(hour_zhi) + 1);
      const day_reduced = reduce_number(day_num);
      const month_reduced = reduce_number(month_num);
      const yuan = year_num * 10 + day_reduced;
      const ying = month_reduced * 10 + hour_num;
      const bengong_product = yuan * ying;
      const liuchou_product = bengong_product * person_age;
      let digits = String(liuchou_product).split("").map(Number);
      let siwei;
      if (digits.length >= 6) siwei = digits.slice(1, 5);
      else if (digits.length === 5) siwei = digits.slice(1, 5);
      else if (digits.length === 4) siwei = digits.slice();
      else { while (digits.length < 4) digits.unshift(0); siwei = digits.slice(0, 4); }
      return { "元數": yuan, "影數": ying, "本宮乘積": bengong_product, "流籌乘積": liuchou_product, "四位": siwei, "觀空定卦": guankong_dinggua(siwei), "八卦體變": bagua_tibian(siwei) };
    }
    san_qi_ji_men() {
      const ming_gua = this.bagua_tibian_result["卦名"];
      const four_zhi = [this.year_zhi, this.month_zhi, this.day_zhi, this.hour_zhi];
      const results = [];
      let san_qi_count = 0;
      for (let i = 0; i < four_zhi.length; i++) {
        const bg = this.baguan(ming_gua, four_zhi[i]);
        const is_san_qi = bg === "生氣" || bg === "天宜" || bg === "福德";
        if (is_san_qi) san_qi_count += 1;
        results.push({ "柱": ["年", "月", "日", "時"][i], "地支": four_zhi[i], "八觀": bg, "三奇": is_san_qi });
      }
      return { "命卦": ming_gua, "四管八觀": results, "三奇數": san_qi_count, "有三奇": san_qi_count > 0 };
    }
    gui_ge() {
      const guis = [];
      const tai_ny = this.tai_nayin;
      const nians = [this.year_nayin, this.month_nayin, this.day_nayin, this.hour_nayin];
      const all_sheng_tai = nians.every(ny => WUXING_SHENG[ny] === tai_ny || ny === tai_ny);
      if (all_sheng_tai) guis.push("仙宮貴人");
      if (this.month_nayin === tai_ny && this.day_nayin === tai_ny) guis.push("學堂貴人");
      const wx_counts = {};
      for (const ny of this.wu_tiao_nayin) wx_counts[ny] = (wx_counts[ny] || 0) + 1;
      const yangxian_patterns = [{ "水": 4, "火": 1 }, { "火": 4, "金": 1 }, { "金": 4, "木": 1 }, { "木": 4, "土": 1 }, { "土": 4, "水": 1 }];
      for (const pat of yangxian_patterns) { if (Object.keys(pat).every(k => (wx_counts[k] || 0) >= pat[k])) { guis.push("養閒貴人"); break; } }
      const longhu_patterns = [{ "木": 4, "火": 1 }, { "火": 4, "土": 1 }, { "土": 4, "金": 1 }, { "金": 4, "水": 1 }, { "水": 4, "木": 1 }];
      for (const pat of longhu_patterns) { if (Object.keys(pat).every(k => (wx_counts[k] || 0) >= pat[k])) { guis.push("龍虎貴人"); break; } }
      const gans = [this.year_gan, this.month_gan, this.day_gan, this.hour_gan];
      const gan_counts = {};
      for (const g of gans) gan_counts[g] = (gan_counts[g] || 0) + 1;
      const wenxing_patterns = [["丙", 3, "甲"], ["丁", 3, "乙"], ["戊", 3, "丙"], ["己", 3, "丁"], ["庚", 3, "戊"], ["辛", 3, "己"], ["壬", 3, "庚"], ["癸", 3, "辛"], ["甲", 3, "壬"], ["乙", 3, "癸"]];
      for (const p of wenxing_patterns) { if ((gan_counts[p[0]] || 0) >= p[1] && (gan_counts[p[2]] || 0) >= 1) { guis.push("文星貴人"); break; } }
      const all_gans = gans.concat([this.tai_gan]);
      const tiangan_pair_counts = {};
      for (const g of all_gans) tiangan_pair_counts[g] = (tiangan_pair_counts[g] || 0) + 1;
      const tianyi_checks = [["甲", "乙", "水"], ["丙", "丁", "木"], ["戊", "己", "火"], ["庚", "辛", "土"], ["壬", "癸", "金"]];
      for (const p of tianyi_checks) { if ((tiangan_pair_counts[p[0]] || 0) >= 2 && (tiangan_pair_counts[p[1]] || 0) >= 2 && this.tai_nayin === p[2]) { guis.push("天乙貴人"); break; } }
      const all_5gans = [this.tai_gan, this.year_gan, this.month_gan, this.day_gan, this.hour_gan];
      const _gan_wx_map = { "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土", "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水" };
      const gan_wuxing = all_5gans.map(g => _gan_wx_map[g]);
      let all_sheng = true;
      for (let i = 0; i < gan_wuxing.length - 1; i++) { if (WUXING_SHENG[gan_wuxing[i]] !== gan_wuxing[i + 1]) { all_sheng = false; break; } }
      if (all_sheng && this.hour_nayin === this.tai_nayin) guis.push("鄉井貴人");
      const _xiangdui_gan = (g1, g2) => Math.abs(tiangan_index(g1) - tiangan_index(g2)) === 5;
      const _xiangdui_zhi = (z1, z2) => Math.abs(dizhi_index(z1) - dizhi_index(z2)) === 6;
      if (_xiangdui_gan(this.tai_gan, this.day_gan) && _xiangdui_zhi(this.tai_zhi, this.day_zhi)) guis.push("壽星貴人（日）");
      if (_xiangdui_gan(this.tai_gan, this.hour_gan) && _xiangdui_zhi(this.tai_zhi, this.hour_zhi)) guis.push("壽星貴人（時）");
      return guis;
    }
    xiong_xing() {
      const xiongs = [];
      const gans = [this.year_gan, this.month_gan, this.day_gan, this.hour_gan];
      const gan_counts = {};
      for (const g of gans) gan_counts[g] = (gan_counts[g] || 0) + 1;
      if ((gan_counts["丙"] || 0) >= 4) xiongs.push("四丙凶星");
      if ((gan_counts["丁"] || 0) >= 4) xiongs.push("四丁凶星");
      if ((gan_counts["庚"] || 0) >= 4) xiongs.push("四庚凶星");
      if ((gan_counts["戊"] || 0) >= 4 || (gan_counts["己"] || 0) >= 4) xiongs.push("四戊/四己凶星");
      return xiongs;
    }
    guan_sha() {
      const guan_list = [];
      const wugong_nayin_pairs = [[0, this.tai_nayin, "倫"], [1, this.year_nayin, "己"], [2, this.month_nayin, "雁"], [3, this.day_nayin, "翡"], [4, this.hour_nayin, "乳"]];
      for (const p of wugong_nayin_pairs) {
        const gong_wx = this.ba_gong_wuxing[p[0]];
        const rel = wuxing_relation(gong_wx, p[1]);
        if (rel.indexOf("克") >= 0) guan_list.push(p[2] + "宮" + gong_wx + "與" + p[1] + "納音相克——關殺");
      }
      const lun_wx = this.ba_gong_wuxing[0];
      const tai_gan_wx = { "甲": "木", "乙": "木", "丙": "火", "丁": "火", "戊": "土", "己": "土", "庚": "金", "辛": "金", "壬": "水", "癸": "水" }[this.tai_gan] || "";
      if (tai_gan_wx) {
        const rel = wuxing_relation(lun_wx, tai_gan_wx);
        if (rel.indexOf("克") >= 0) guan_list.push("倫宮" + lun_wx + "與胎干" + this.tai_gan + tai_gan_wx + "相克——關殺");
      }
      const fei_wx = this.ba_gong_wuxing[3];
      const day_zhi_wx = { "子": "水", "丑": "土", "寅": "木", "卯": "木", "辰": "土", "巳": "火", "午": "火", "未": "土", "申": "金", "酉": "金", "戌": "土", "亥": "水" }[this.day_zhi] || "";
      if (day_zhi_wx) {
        const rel = wuxing_relation(fei_wx, day_zhi_wx);
        if (rel.indexOf("克") >= 0) guan_list.push("翡宮" + fei_wx + "與日支" + this.day_zhi + day_zhi_wx + "相克——關殺");
      }
      const chong_pairs = [["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]];
      const zhis = [this.year_zhi, this.month_zhi, this.day_zhi, this.hour_zhi];
      const names = ["年", "月", "日", "時"];
      for (let i = 0; i < zhis.length; i++) for (let j = i + 1; j < zhis.length; j++) {
        for (const p of chong_pairs) {
          if ((zhis[i] === p[0] && zhis[j] === p[1]) || (zhis[i] === p[1] && zhis[j] === p[0])) guan_list.push("對沖關殺：" + names[i] + "支" + zhis[i] + "沖" + names[j] + "支" + zhis[j]);
        }
      }
      const bengong = this.ben_gong_siwei;
      const nayin_pairs = [[this.year_nayin, bengong[0], "年"], [this.month_nayin, bengong[1], "月"], [this.day_nayin, bengong[2], "日"], [this.hour_nayin, bengong[3], "時"]];
      for (const p of nayin_pairs) { if (p[0] === hetu_wuxing(p[1])) guan_list.push("疊關殺：" + p[2] + "納音" + p[0] + "與本宮" + p[2] + "位" + p[1] + hetu_wuxing(p[1]) + "比疊"); }
      return guan_list;
    }
    ming_zhu() {
      const raw_yuan = [count_forward_gan(this.tai_gan, this.year_gan), count_forward_gan(this.tai_gan, this.month_gan), count_forward_gan(this.tai_gan, this.day_gan), count_forward_gan(this.tai_gan, this.hour_gan)];
      const raw_ying = [count_forward_zhi(this.tai_zhi, this.year_zhi), count_forward_zhi(this.tai_zhi, this.month_zhi), count_forward_zhi(this.tai_zhi, this.day_zhi), count_forward_zhi(this.tai_zhi, this.hour_zhi)];
      const yuan_total = raw_yuan.reduce((a, b) => a + b, 0);
      const ying_total = raw_ying.reduce((a, b) => a + b, 0);
      const wai_ling = yuan_total % 10;
      const nei_ling = ying_total % 10;
      return { "外盤命主": { "原始元數": raw_yuan, "合數": yuan_total, "零數": wai_ling, "五行": hetu_wuxing(wai_ling) }, "內盤命主": { "原始影數": raw_ying, "合數": ying_total, "零數": nei_ling, "五行": hetu_wuxing(nei_ling) } };
    }
    xingyun_biefa(age) {
      const ling = age % 10;
      const wx = hetu_wuxing(ling);
      const is_kong = ling === 0;
      const kong_map = { 10: "水空", 20: "火空", 30: "木空", 40: "金空", 50: "土空" };
      let kong_desc = "";
      if (is_kong) { const base = Math.floor(age / 10) * 10; kong_desc = kong_map[base % 60] || wx + "空"; }
      return { "歲": age, "零數": ling, "五行": wx, "空": is_kong, "空描述": kong_desc };
    }
    bagong_jixiong() {
      const results = [];
      const ji_wx = this.ba_gong_wuxing[1];
      for (let i = 0; i < 8; i++) {
        const gong = BAGONG_NAMES[i];
        const gong_wx = this.ba_gong_wuxing[i];
        const gong_num = this.ba_gong_raw[i];
        const jia_left = this.ba_gong_wuxing[((i - 1) % 8 + 8) % 8];
        const jia_right = this.ba_gong_wuxing[(i + 1) % 8];
        const ji_rel = i !== 1 ? wuxing_relation(ji_wx, gong_wx) : "自身";
        const pos = qipao_position(gong_wx, this.month_zhi);
        const entry = { "宮": gong, "全名": BAGONG_FULLNAMES[i], "數": gong_num, "五行": gong_wx, "胞胎位": pos, "胞胎吉凶": is_qipao_ji(pos) ? "吉" : "凶", "與己宮關係": ji_rel, "左夾": jia_left, "右夾": jia_right, "星": BAGONG_XING[i], "所屬卦": BAGONG_GUA[i] };
        if (gong === "倫") entry["與胎納音"] = wuxing_relation(gong_wx, this.tai_nayin);
        else if (gong === "己") entry["與年納音"] = wuxing_relation(gong_wx, this.year_nayin);
        else if (gong === "雁") entry["與月納音"] = wuxing_relation(gong_wx, this.month_nayin);
        else if (gong === "翡") entry["與日納音"] = wuxing_relation(gong_wx, this.day_nayin);
        else if (gong === "乳") entry["與時納音"] = wuxing_relation(gong_wx, this.hour_nayin);
        else if (gong === "養" || gong === "鬼" || gong === "基") entry["與己宮"] = wuxing_relation(ji_wx, gong_wx);
        results.push(entry);
      }
      return results;
    }
    ke_shu() {
      const ji_wx = this.ba_gong_wuxing[1];
      const fei_wx = this.ba_gong_wuxing[3];
      const yang_wx = this.ba_gong_wuxing[5];
      return { "文曲（翡宮）": fei_wx, "武曲（養宮）": yang_wx, "文曲與己宮": wuxing_relation(fei_wx, ji_wx), "武曲與己宮": wuxing_relation(yang_wx, ji_wx), "文武互觀": wuxing_relation(fei_wx, yang_wx) };
    }
    shou_xian() {
      const sw = this.shu_wei;
      const sw_pos = qipao_position(sw["五行"], this.month_zhi);
      const ming_pos = qipao_position(this.ming_gong_wx, this.month_zhi);
      const bengong_gua_wx = this.bagua_tibian_result["卦五行"];
      const ming_rel = wuxing_relation(this.ming_gong_wx, bengong_gua_wx);
      return { "數尾五行": sw["五行"], "數尾胞胎（月支）": sw_pos, "數尾壽判": is_qipao_ji(sw_pos) ? "壽" : "夭", "命宮五行": this.ming_gong_wx, "命宮胞胎（月支）": ming_pos, "命宮壽判": is_qipao_ji(ming_pos) ? "壽" : "夭", "本宮卦與命宮": ming_rel };
    }
    calculate_chart() {
      return {
        "四柱": { "年": this.year_gz, "月": this.month_gz, "日": this.day_gz, "時": this.hour_gz },
        "胎月": this.tai_gz,
        "五條": { "胎": { "干支": this.tai_gz, "納音": this.tai_nayin }, "年": { "干支": this.year_gz, "納音": this.year_nayin }, "月": { "干支": this.month_gz, "納音": this.month_nayin }, "日": { "干支": this.day_gz, "納音": this.day_nayin }, "時": { "干支": this.hour_gz, "納音": this.hour_nayin } },
        "性別": this.gender,
        "元數": this.yuan_shu.slice(),
        "影數": this.ying_shu.slice(),
        "八宮": { "數列": this.ba_gong_raw.slice(), "五行": this.ba_gong_wuxing.slice(), "詳情": this.bagong_jixiong() },
        "本宮四位": this.ben_gong_siwei.slice(),
        "本宮別法": this.ben_gong_biefa.slice(),
        "觀空定卦": this.guankong,
        "八卦體變": this.bagua_tibian_result,
        "都數": this.du_shu,
        "命宮": { "宮序": this.ming_gong_idx, "宮名": BAGONG_NAMES[this.ming_gong_idx], "五行": this.ming_gong_wx },
        "起胞（八宮）": this.qipao_bagong,
        "起胞（本宮）": this.qipao_bengong,
        "大運": this.dayun.slice(),
        "小運前十年": this.xiaoyun.slice(0, 10),
        "數尾": this.shu_wei,
        "合孕數": this.he_yun,
        "盈卦": this.ying_gua(),
        "四位觀八觀": this.siwei_baguan(this.ben_gong_siwei),
        "命主": this.ming_zhu(),
        "三奇吉門": this.san_qi_ji_men(),
        "貴格": this.gui_ge(),
        "凶星": this.xiong_xing(),
        "關殺": this.guan_sha(),
        "科數得失": this.ke_shu(),
        "壽限": this.shou_xian()
      };
    }
  }

  window.DQYJ = { DiQiYiJue, guankong_dinggua, bagua_tibian, nayin_wuxing, nayin_detail, hetu_wuxing, BAGONG_NAMES, BAGONG_FULLNAMES };

  // ================= UI 层 =================
  const T2S = { "貴":"贵","宮":"宫","數":"数","詳":"详","陰":"阴","陽":"阳","眾":"众","寡":"寡","疊":"叠","賊":"贼","籌":"筹","體":"体","變":"变","觀":"观","空":"空","開":"开","閉":"闭","餘":"余","連":"连","屬":"属","齒":"齿","婦":"妇","孕":"孕","棄":"弃","軟":"软","退":"退","終":"终","殺":"杀","壽":"寿","驗":"验","遺":"遗","訣":"诀","歲":"岁","華":"华","夢":"梦","斷":"断","醫":"医","藥":"药","譯":"译","納":"纳","煙":"烟","雲":"云","霧":"雾","聲":"声","萬":"万","長":"长","門":"门","無":"无","為":"为","於":"于","與":"与","並":"并","後":"后","從":"从","來":"来","會":"会","總":"总","時":"时","間":"间","對":"对","雙":"双","專":"专","則":"则","遠":"远","遷":"迁","經":"经","歷":"历","節":"节","氣":"气","離":"离","震":"震","巽":"巽","兌":"兑","乾":"干","間":"间","見":"见","現":"现","應":"应","點":"点","滿":"满","種":"种","勝":"胜","臨":"临","衝":"冲","處":"处","驚":"惊","蟄":"蛰","穀":"谷","曆":"历","晝":"昼","將":"将","財":"财","農":"农","廣":"广","縣":"县","當":"当","動":"动","樣":"样","憂":"忧","務":"务","實":"实","際":"际","邊":"边","衛":"卫","敵":"敌","負":"负","責":"责","敗":"败","賢":"贤","舉":"举","國":"国","學":"学","習":"习","風":"风","飄":"飘","遲":"迟","鈍":"钝","淫":"淫","謗":"谤","爭":"争","訟":"讼","刑":"刑","貨":"货","損":"损","財":"财","密":"密","嘆":"叹","離":"离","別":"别","生":"生","靈":"灵","衝":"冲","獲":"获","藥":"药" };
  function t2s(s) { if (!s) return s; let r = ""; for (const c of String(s)) r += T2S[c] || c; return r; }
  function esc(s) { return String(s === null || s === undefined ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  const TIANGAN_UI = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const DIZHI_UI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const WUSHU_DUN = { "甲": "甲", "己": "甲", "乙": "丙", "庚": "丙", "丙": "戊", "辛": "戊", "丁": "庚", "壬": "庚", "戊": "壬", "癸": "壬" };

  // 涤器遗诀原版四柱口径：23 点按次日整柱；年柱按农历年（春节换年，非立春）；月柱按节气；时柱五鼠遁
  function diqiFourPillars(y, mo, d, h, mi) {
    if (!y || !mo || !d || h === null || h === undefined) return null;
    let cy = y, cm = mo, cd = d, ch = h;
    if (ch === 23) {
      const dt = new Date(y, mo - 1, d + 1);
      cy = dt.getFullYear(); cm = dt.getMonth() + 1; cd = dt.getDate(); ch = 0;
    }
    if (!window.Lunar || !window.Lunar.fromDate) return null;
    const lunar = window.Lunar.fromDate(new Date(cy, cm - 1, cd, ch, mi || 0, 0));
    const ly = lunar.getYear();
    const yIdx = ((ly - 4) % 60 + 60) % 60;
    const yGz = TIANGAN_UI[yIdx % 10] + DIZHI_UI[yIdx % 12];
    const mGz = lunar.getMonthInGanZhi();
    const dGz = lunar.getDayInGanZhi();
    const hBranchIdx = ch === 23 ? 0 : Math.floor((ch + 1) / 2) % 12;
    const hBase = WUSHU_DUN[dGz[0]];
    const hGan = TIANGAN_UI[(TIANGAN_UI.indexOf(hBase) + hBranchIdx) % 10];
    return { "年": yGz, "月": mGz, "日": dGz, "時": hGan + DIZHI_UI[hBranchIdx] };
  }

  function renderDiqiChart(chart) {
    const h = [];
    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    h.push('<b>五条（胎年日月时）</b><table class="tbl"><tr><th>条</th><th>干支</th><th>纳音</th></tr>');
    const tiao = chart["五條"];
    for (const k of ["胎", "年", "月", "日", "時"]) {
      const v = tiao[k];
      h.push('<tr><td>' + t2s(k) + '</td><td>' + esc(v["干支"]) + '</td><td>' + esc(t2s(v["納音"])) + '</td></tr>');
    }
    h.push('</table>');
    h.push('<div class="muted" style="font-size:12px;margin-top:4px;">元数：' + esc(chart["元數"].join(" ")) + '　影数：' + esc(chart["影數"].join(" ")) + '　都数：' + chart["都數"] + '</div>');
    h.push('</div>');

    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    h.push('<b>八宫</b><table class="tbl"><tr><th>宫</th><th>全名</th><th>数</th><th>五行</th><th>胞胎位</th><th>吉凶</th><th>星</th><th>卦</th><th>与己宫</th><th>与纳音</th></tr>');
    for (const d of chart["八宮"]["詳情"]) {
      let ny = "";
      if (d["與胎納音"]) ny = "胎:" + t2s(d["與胎納音"]);
      else if (d["與年納音"]) ny = "年:" + t2s(d["與年納音"]);
      else if (d["與月納音"]) ny = "月:" + t2s(d["與月納音"]);
      else if (d["與日納音"]) ny = "日:" + t2s(d["與日納音"]);
      else if (d["與時納音"]) ny = "时:" + t2s(d["與時納音"]);
      else if (d["與己宮"]) ny = "己:" + t2s(d["與己宮"]);
      h.push('<tr><td>' + esc(d["宮"]) + '</td><td>' + esc(t2s(d["全名"])) + '</td><td>' + d["數"] + '</td><td>' + esc(t2s(d["五行"])) + '</td><td>' + esc(t2s(d["胞胎位"])) + '</td><td>' + (d["胞胎吉凶"] === "吉" ? '<span style="color:#0a7a3c;">吉</span>' : '<span style="color:#c00;">凶</span>') + '</td><td>' + esc(d["星"]) + '</td><td>' + esc(d["所屬卦"]) + '</td><td>' + esc(t2s(d["與己宮關係"])) + '</td><td>' + esc(t2s(ny)) + '</td></tr>');
    }
    h.push('</table>');
    h.push('</div>');

    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    h.push('<b>本宫四位：</b>' + esc(chart["本宮四位"].join(" ")) + '　<b>本宫别法：</b>' + esc(chart["本宮別法"].join(" ")));
    h.push('<div class="muted" style="font-size:12px;margin-top:4px;">观空定卦：' + esc(t2s(chart["觀空定卦"]["卦名"])) + '（' + esc(t2s(chart["觀空定卦"]["空類型"])) + '，' + esc(t2s(chart["觀空定卦"]["開閉"])) + '，总零' + chart["觀空定卦"]["總零"] + esc(t2s(chart["觀空定卦"]["總零五行"])) + '）　八卦体变：' + esc(t2s(chart["八卦體變"]["卦名"])) + '（' + esc(t2s(chart["八卦體變"]["本變"])) + '，' + esc(t2s(chart["八卦體變"]["卦五行"])) + '，先' + esc(chart["八卦體變"]["先卦"]) + '后' + esc(chart["八卦體變"]["後卦"]) + '）</div>');
    h.push('</div>');

    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    h.push('<b>命宫：</b>' + esc(chart["命宮"]["宮名"]) + '（' + esc(t2s(chart["命宮"]["五行"])) + '）　<b>数尾：</b>' + esc(t2s(chart["數尾"]["五行"])) + '（总计' + chart["數尾"]["總計"] + '，零' + chart["數尾"]["零數"] + '，与本卦' + esc(t2s(chart["數尾"]["與本卦關係"])) + '）　<b>合孕：</b>' + esc(t2s(chart["合孕數"]["得位"])) + '　<b>男女：</b>' + esc(t2s(chart["合孕數"]["男女"])) + '</div>');
    h.push('<div class="muted" style="font-size:12px;margin-top:4px;">夫：' + chart["合孕數"]["夫"]["數"] + esc(t2s(chart["合孕數"]["夫"]["五行"])) + chart["合孕數"]["夫"]["陰陽"] + '　妇：' + chart["合孕數"]["婦"]["數"] + esc(t2s(chart["合孕數"]["婦"]["五行"])) + chart["合孕數"]["婦"]["陰陽"] + '　夫妇关系：' + esc(t2s(chart["合孕數"]["夫婦關係"])) + '　孕：' + chart["合孕數"]["孕一"] + ' ' + chart["合孕數"]["孕二"] + '（合' + chart["合孕數"]["孕合數"] + '，零' + chart["合孕數"]["孕零數"] + (chart["合孕數"]["孕空"] ? '，孕空' : '') + (chart["合孕數"]["破孕"] ? '，破孕' : '') + '）</div>');
    h.push('</div>');

    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    h.push('<b>起胞（八宫）：</b>' + chart["起胞（八宮）"].map(x => esc(x["宮"]) + esc(t2s(x["胞胎位"])) + (x["吉凶"] === "吉" ? '<span style="color:#0a7a3c;">吉</span>' : '<span style="color:#c00;">凶</span>')).join("　"));
    h.push('<div class="muted" style="font-size:12px;margin-top:4px;"><b>起胞（本宫）：</b>' + chart["起胞（本宮）"].map(x => "位" + x["位"] + esc(t2s(x["胞胎位"])) + (x["吉凶"] === "吉" ? "吉" : "凶")).join("　") + '</div>');
    h.push('</div>');

    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    h.push('<b>盈卦：</b>上' + esc(chart["盈卦"]["上卦"]) + ' 下' + esc(chart["盈卦"]["下卦"]) + '　动爻' + chart["盈卦"]["動爻"] + '（总数' + chart["盈卦"]["總數"] + '）');
    h.push('<div class="muted" style="font-size:12px;margin-top:4px;"><b>四位观八观：</b>' + chart["四位觀八觀"].map(x => "位" + x["位"] + ":" + x["數"] + (x["地支"] === "空" ? "空" : esc(t2s(x["干支"])) + "·" + esc(t2s(x["八觀"])))).join("　") + '</div>');
    h.push('<div class="muted" style="font-size:12px;"><b>命主：</b>外盘' + esc(t2s(chart["命主"]["外盤命主"]["五行"])) + '（零' + chart["命主"]["外盤命主"]["零數"] + '）　内盘' + esc(t2s(chart["命主"]["內盤命主"]["五行"])) + '（零' + chart["命主"]["內盤命主"]["零數"] + '）</div>');
    h.push('</div>');

    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    const sq = chart["三奇吉門"];
    h.push('<b>三奇吉门：</b>命卦' + esc(t2s(sq["命卦"])) + '　' + (sq["有三奇"] ? '<span style="color:#0a7a3c;">有三奇（' + sq["三奇數"] + ' 处）</span>' : '无三奇'));
    h.push('<div class="muted" style="font-size:12px;">' + sq["四管八觀"].map(x => esc(t2s(x["柱"])) + "支" + esc(x["地支"]) + "·" + esc(t2s(x["八觀"])) + (x["三奇"] ? '<span style="color:#0a7a3c;">[三奇]</span>' : '')).join("　") + '</div>');
    if (chart["貴格"].length) h.push('<div class="muted" style="font-size:12px;color:#0a7a3c;"><b>贵格：</b>' + chart["貴格"].map(x => esc(t2s(x))).join("、") + '</div>');
    if (chart["凶星"].length) h.push('<div class="muted" style="font-size:12px;color:#c00;"><b>凶星：</b>' + chart["凶星"].map(x => esc(t2s(x))).join("、") + '</div>');
    if (chart["關殺"].length) h.push('<div class="muted" style="font-size:12px;color:#c00;"><b>关杀：</b>' + chart["關殺"].map(x => esc(t2s(x))).join("<br>") + '</div>');
    const ks = chart["科數得失"];
    h.push('<div class="muted" style="font-size:12px;"><b>科数：</b>文曲（翡宫）' + esc(t2s(ks["文曲（翡宮）"])) + '·与己宫' + esc(t2s(ks["文曲與己宮"])) + '；武曲（养宫）' + esc(t2s(ks["武曲（養宮）"])) + '·与己宫' + esc(t2s(ks["武曲與己宮"])) + '；文武互观' + esc(t2s(ks["文武互觀"])) + '</div>');
    h.push('<div class="muted" style="font-size:12px;"><b>寿限：</b>数尾' + esc(t2s(chart["壽限"]["數尾五行"])) + '胞胎月支' + esc(t2s(chart["壽限"]["數尾胞胎（月支）"])) + '判' + esc(t2s(chart["壽限"]["數尾壽判"])) + '；命宫' + esc(t2s(chart["壽限"]["命宮五行"])) + '胞胎月支' + esc(t2s(chart["壽限"]["命宮胞胎（月支）"])) + '判' + esc(t2s(chart["壽限"]["命宮壽判"])) + '；本宫卦与命宫' + esc(t2s(chart["壽限"]["本宮卦與命宮"])) + '</div>');
    h.push('</div>');

    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    h.push('<b>大运：</b>' + chart["大運"].map(x => x["起始歲"] + "-" + x["終止歲"] + "岁·" + esc(x["宮"]) + esc(t2s(x["宮五行"]))).join("　"));
    h.push('<div class="muted" style="font-size:12px;margin-top:4px;"><b>小运前十年：</b>' + chart["小運前十年"].map(x => x["歲"] + "岁·" + esc(x["宮"]) + esc(t2s(x["宮五行"]))).join("　") + '</div>');
    h.push('</div>');
    return h.join("");
  }

  function renderDiqiFlow(f, chart) {
    const h = [];
    h.push('<div class="card" style="padding:10px;margin-bottom:8px;">');
    h.push('<b>流筹四位：</b>' + esc(f["流籌四位"].join(" ")) + '　<b>属齿卦：</b>' + esc(t2s(f["齒卦"])) + '　<b>总数：</b>' + f["總數"] + '（零' + f["總零"] + esc(t2s(f["總零五行"])) + '）');
    h.push('<div class="muted" style="font-size:12px;margin-top:4px;">观空定卦：' + esc(t2s(f["觀空定卦"]["卦名"])) + '（' + esc(t2s(f["觀空定卦"]["空類型"])) + '）　八卦体变：' + esc(t2s(f["八卦體變"]["卦名"])) + '（' + esc(t2s(f["八卦體變"]["本變"])) + '，先' + esc(f["八卦體變"]["先卦"]) + '后' + esc(f["八卦體變"]["後卦"]) + '）</div>');
    if (f["齒卦與流籌八觀"]) h.push('<div class="muted" style="font-size:12px;">齿卦与流筹八观：' + esc(t2s(f["齒卦與流籌八觀"])) + '　流筹与年支八观：' + esc(t2s(f["流籌與年支八觀"])) + '</div>');
    const g5 = f["觀數五章"];
    h.push('<div class="muted" style="font-size:12px;">观数五章：' + esc(t2s(g5["陰陽眾寡"])) + '｜' + esc(t2s(g5["數位順逆"])) + '｜' + esc(t2s(g5["五行連疊"])) + '｜' + (g5["賊星"].length ? '贼星：' + esc(g5["賊星"].join("、")) : '无贼星') + '｜总余' + g5["總餘"] + esc(t2s(g5["總餘奇偶"])) + '</div>');
    if (f["大運"]) h.push('<div class="muted" style="font-size:12px;">落位大运：' + f["大運"]["起始歲"] + "-" + f["大運"]["終止歲"] + "岁·" + esc(f["大運"]["宮"]) + esc(t2s(f["大運"]["宮五行"])) + '　小运：' + f["小運"]["歲"] + "岁·" + esc(f["小運"]["宮"]) + esc(t2s(f["小運"]["宮五行"])) + '</div>');
    h.push('</div>');
    return h.join("");
  }

  function diqiInit() {
    const goBtn = document.getElementById("dq-go");
    const flowBtn = document.getElementById("dq-flow");
    const result = document.getElementById("dq-result");
    const flowOut = document.getElementById("dq-flow-out");
    let lastChart = null;
    if (goBtn) goBtn.addEventListener("click", function () {
      try {
        const y = parseInt(document.getElementById("dq-y").value, 10);
        const m = parseInt(document.getElementById("dq-m").value, 10);
        const d = parseInt(document.getElementById("dq-d").value, 10);
        const h = parseInt(document.getElementById("dq-h").value, 10);
        const g = document.getElementById("dq-gender").value;
        if (!y || !m || !d || isNaN(h)) { result.innerHTML = '<div class="card" style="color:#c00;">请输入完整的公历出生年月日时。</div>'; return; }
        const birth = diqiFourPillars(y, m, d, h, 0);
        if (!birth) { result.innerHTML = '<div class="card" style="color:#c00;">四柱转换失败（农历库未就绪或日期无效）。</div>'; return; }
        const eng = new DQYJ.DiQiYiJue(birth, g);
        lastChart = eng.calculate_chart();
        let h2 = '<div class="card" style="padding:10px;margin-bottom:8px;"><b>四柱：</b>' + esc(birth["年"]) + ' ' + esc(birth["月"]) + ' ' + esc(birth["日"]) + ' ' + esc(birth["時"]) + '　<b>胎月：</b>' + esc(birth["年"][0] === "甲" ? "" : "") + esc(lastChart["胎月"]) + '　性别：' + esc(g) + '</div>';
        result.innerHTML = h2 + renderDiqiChart(lastChart);
      } catch (e) { result.innerHTML = '<div class="card" style="color:#c00;">排盘出错：' + esc(e && e.message ? e.message : e) + '</div>'; }
    });
    if (flowBtn) flowBtn.addEventListener("click", function () {
      try {
        if (!lastChart) { flowOut.innerHTML = '<div class="card" style="color:#c00;">请先完成排盘。</div>'; return; }
        const age = parseInt(document.getElementById("dq-age").value, 10);
        if (!age || age < 1) { flowOut.innerHTML = '<div class="card" style="color:#c00;">请输入行年岁数（1 起）。</div>'; return; }
        const ygzRaw = document.getElementById("dq-yeargz").value.trim();
        const eng = new DQYJ.DiQiYiJue(lastChart["四柱"], lastChart["性別"]);
        const f = eng.flow_year(ygzRaw || undefined, age);
        flowOut.innerHTML = renderDiqiFlow(f, lastChart);
      } catch (e) { flowOut.innerHTML = '<div class="card" style="color:#c00;">流年计算出错：' + esc(e && e.message ? e.message : e) + '</div>'; }
    });
  }
  window.diqiInit = diqiInit;
  window._diqiFourPillars = diqiFourPillars;
})();
