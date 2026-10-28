// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 子平八字引擎（Tab 24）· 排盘（EightChar）+ 大运（Yun）+ 命宫胎元 + 旺衰 + 神煞25 + 格局 + 断语机判 + 活层红字
// 数据层 bazi.json（金不换骨髓歌119条/干支体象/何知章/命理约言赋20篇/断语12类716条含子节/神煞25/八格喜忌/时断119段/十二月支吉凶/十干宜忌/调候/提纲/小限/活步骤5组）
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let D = null; // bazi 数据

  // ── 常量 ──
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const YANG_GAN = { '甲': 1, '丙': 1, '戊': 1, '庚': 1, '壬': 1 };
  const WX = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  // 五行生：木→火→土→金→水→木；克：木→土→水→火→金→木
  const SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  // 三合局（驿马/桃花/华盖/将星共用）
  const SANHE = [
    { group: ['申', '子', '辰'], ma: '寅', tao: '酉', gai: '辰', jiang: '子' },
    { group: ['寅', '午', '戌'], ma: '申', tao: '卯', gai: '戌', jiang: '午' },
    { group: ['巳', '酉', '丑'], ma: '亥', tao: '午', gai: '丑', jiang: '酉' },
    { group: ['亥', '卯', '未'], ma: '巳', tao: '子', gai: '未', jiang: '卯' },
  ];
  // 天乙贵人：日干→支
  const GUI_REN = { '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'], '乙': ['子', '申'], '己': ['子', '申'],
    '丙': ['亥', '酉'], '丁': ['亥', '酉'], '壬': ['卯', '巳'], '癸': ['卯', '巳'], '辛': ['寅', '午'] };
  // 禄神：日干→支
  const LU = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
  // 羊刃：五阳干
  const YANG_REN = { '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子' };
  // 月德：月支三合局→干
  const YUE_DE = { '寅': '丙', '午': '丙', '戌': '丙', '申': '壬', '子': '壬', '辰': '壬', '亥': '甲', '卯': '甲', '未': '甲', '巳': '庚', '酉': '庚', '丑': '庚' };
  // 天德：月支→（干或支，任一出现即天德）
  const TIAN_DE = { '寅': ['丁'], '卯': ['申'], '辰': ['壬'], '巳': ['辛'], '午': ['亥'], '未': ['甲'], '申': ['癸'], '酉': ['寅'], '戌': ['丙'], '亥': ['乙'], '子': ['巳'], '丑': ['庚'] };
  // 魁罡日
  const KUI_GANG = ['庚辰', '壬辰', '戊戌', '庚戌'];
  // 十恶大败日（甲辰旬+甲戌旬各5）
  const SHIE = ['甲辰', '乙巳', '丙申', '丁亥', '戊戌', '己丑', '庚辰', '辛巳', '壬申', '癸亥'];
  // 阴阳差错日
  const YINYANG = ['丙子', '丁丑', '戊寅', '辛卯', '壬辰', '癸巳', '丙午', '丁未', '戊申', '辛酉', '壬戌', '癸亥'];
  // 孤辰寡宿：年支三合局前一位为孤、后一位为寡
  const GU = { '亥': '寅', '子': '寅', '丑': '寅', '寅': '巳', '卯': '巳', '辰': '巳', '巳': '申', '午': '申', '未': '申', '申': '亥', '酉': '亥', '戌': '亥' };
  const GUA = { '亥': '戌', '子': '戌', '丑': '戌', '寅': '丑', '卯': '丑', '辰': '丑', '巳': '辰', '午': '辰', '未': '辰', '申': '未', '酉': '未', '戌': '未' };
  // 天罗地网：戌亥罗 辰巳网
  const LUO_WANG = { '戌': '天罗', '亥': '天罗', '辰': '地网', '巳': '地网' };
  // 五虎遁（年干→寅月干）
  const WUHU = { '甲': '丙', '乙': '戊', '丙': '庚', '丁': '壬', '戊': '甲', '己': '丙', '庚': '戊', '辛': '庚', '壬': '壬', '癸': '甲' };
  // 六冲/六合（流年简判）
  const CHONG = { '子': '午', '丑': '未', '寅': '申', '卯': '酉', '辰': '戌', '巳': '亥', '午': '子', '未': '丑', '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳' };
  const HE6 = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
  // 扩展神煞表（三命通会卷二）：六害对（单向）、劫煞/亡神、灾煞、六厄、暗金的煞
  const HIT6 = { '子': '未', '丑': '午', '寅': '巳', '卯': '辰', '申': '亥', '酉': '戌' };
  const SANHE_GRP = { '申子辰': 0, '寅午戌': 1, '巳酉丑': 2, '亥卯未': 3 }; // 与 SANHE 数组顺序对应
  const JIE_WANG = { '申子辰': { jie: '巳', wang: '亥' }, '寅午戌': { jie: '亥', wang: '巳' }, '巳酉丑': { jie: '寅', wang: '申' }, '亥卯未': { jie: '申', wang: '寅' } };
  const ZAI_E = { '申子辰': '午', '寅午戌': '子', '巳酉丑': '卯', '亥卯未': '酉' };
  const LIU_E = { '申子辰': '卯', '寅午戌': '酉', '亥卯未': '午', '巳酉丑': '子' };
  const AJIN = { '子': '巳', '午': '巳', '卯': '巳', '酉': '巳', '寅': '酉', '申': '酉', '巳': '酉', '亥': '酉', '辰': '丑', '戌': '丑', '丑': '丑', '未': '丑' };
  // 流霞（神峰通考 1397）：甲鸡乙犬丙羊加，丁是猴乡戊见蛇，己马庚龙辛逐兔，壬猪癸虎是流霞（年干查）
  const LIU_XIA = { '甲': '酉', '乙': '戌', '丙': '未', '丁': '申', '戊': '巳', '己': '午', '庚': '辰', '辛': '卯', '壬': '亥', '癸': '寅' };
  const XING_EN = ['寅', '巳', '申'], XING_SHI = ['丑', '戌', '未'], XING_ZI = ['辰', '午', '酉', '亥'];
  const HE_GAN = { '甲': '己', '乙': '庚', '丙': '辛', '丁': '壬', '戊': '癸', '己': '甲', '庚': '乙', '辛': '丙', '壬': '丁', '癸': '戊' };
  // 天厨（三命通会 4942/4950"食神逢禄号天厨"：日干食神之禄）
  const TIAN_CHU = { '甲': '巳', '乙': '午', '丙': '巳', '丁': '午', '戊': '申', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯' };
  // 太极贵人（三命通会·论太极贵 2423-2431：甲乙先造乎子终乎午、丙丁喜卯藏酉、庚辛得寅见亥、壬癸得申纳巳、戊己喜生申得辰戌丑未为正库）
  const TAI_JI = { '甲': ['子', '午'], '乙': ['子', '午'], '丙': ['卯', '酉'], '丁': ['卯', '酉'], '戊': ['辰', '戌', '丑', '未'], '己': ['辰', '戌', '丑', '未'], '庚': ['寅', '亥'], '辛': ['寅', '亥'], '壬': ['巳', '申'], '癸': ['巳', '申'] };
  // 学堂词馆（三命通会·论学堂词馆 2441-2467）：以年命纳音五行长生为学堂、临官为词馆（水土同宫）
  const XUETANG = { '木': { xue: '亥', guan: '寅' }, '火': { xue: '寅', guan: '巳' }, '金': { xue: '巳', guan: '申' }, '水': { xue: '申', guan: '亥' }, '土': { xue: '申', guan: '亥' } };
  // 日德五日（渊海子平·论日德 433）
  const RI_DE = ['甲寅', '戊辰', '丙辰', '庚辰', '壬戌'];
  const LIUHE = { '子': '丑', '丑': '子', '寅': '亥', '卯': '戌', '辰': '酉', '巳': '申', '午': '未', '未': '午', '申': '巳', '酉': '辰', '戌': '卯', '亥': '寅' };
  const COL_LBL = { year: '年', month: '月', day: '日', time: '时' };
  const XUN_KONG = [['戌', '亥'], ['申', '酉'], ['午', '未'], ['辰', '巳'], ['寅', '卯'], ['子', '丑']]; // 甲子起十旬各旬空亡
  // 干支归旬空亡：地支领先天干 n 位 → 旬甲子起 [n, n+9] 区间外二支为空
  function xunKongOf(gz) {
    const g = GAN.indexOf(gz[0]), z = ZHI.indexOf(gz[1]);
    if (g < 0 || z < 0) return [];
    const n = ((z - g) % 12 + 12) % 12;
    const kong = [];
    for (let i = 0; i < 12; i++) if (((i - n + 12) % 12) > 9) kong.push(ZHI[i]);
    return kong;
  }
  function shiDiName(dayGan, z) {
    const cs = (D && D.changsheng && D.changsheng.items) || {};
    const csn = (D && D.changsheng && D.changsheng.names) || [];
    const arr = cs[dayGan];
    if (!arr) return '';
    return csn[arr.indexOf(z)] || '';
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function pickBazi() { return window.__baziData || null; }

  // ── 十神（自建：日干 vs 他干，阴阳定偏正）──
  function shiShenOf(dayGan, other) {
    const dw = WX[dayGan], ow = WX[other];
    const sameYin = (YANG_GAN[dayGan] === 1) === (YANG_GAN[other] === 1);
    if (ow === dw) return sameYin ? '比肩' : '劫财';
    if (SHENG[ow] === dw) return sameYin ? '偏印' : '正印';
    if (SHENG[dw] === ow) return sameYin ? '食神' : '伤官';
    if (KE[dw] === ow) return sameYin ? '偏财' : '正财';
    if (KE[ow] === dw) return sameYin ? '七杀' : '正官';
    return '';
  }

  // ── 排盘核心 ──
  function paiPan(y, m, d, h, gender) {
    // 表单输入为公历：先转农历再取八字（Solar.fromYmdHms→getLunar）。原 Lunar.fromYmdHms 是把输入当农历，导致整个排盘错位（公历5月7日被当农历五月初七=公历6月6日）
    const lunar = Solar.fromYmdHms(y, m, d, h, 0, 0).getLunar();
    const ec = lunar.getEightChar();
    const gz = { year: ec.getYear(), month: ec.getMonth(), day: ec.getDay(), time: ec.getTime() };
    const hide = { year: ec.getYearHideGan(), month: ec.getMonthHideGan(), day: ec.getDayHideGan(), time: ec.getTimeHideGan() };
    const na = { year: ec.getYearNaYin(), month: ec.getMonthNaYin(), day: ec.getDayNaYin(), time: ec.getTimeNaYin() };
    const dayGan = ec.getDayGan(), dayZhi = ec.getDayZhi();
    const monthGan = ec.getMonthGan(), monthZhi = ec.getMonthZhi();
    const yearGan = ec.getYearGan();
    // 十神（四干）
    const ssGan = { year: shiShenOf(dayGan, yearGan), month: shiShenOf(dayGan, monthGan), day: '日主', time: shiShenOf(dayGan, ec.getTimeGan()) };
    // 支藏干十神
    const ssZhi = {};
    for (const k of ['year', 'month', 'day', 'time']) {
      const z = gz[k][1];
      const cg = (D && D.zanggan && D.zanggan[z]) || [];
      ssZhi[k] = cg.map((c) => shiShenOf(dayGan, c));
    }
    // 旬空（日旬）
    const xunKong = ec.getDayXunKong ? ec.getDayXunKong() : '';
    const dayKongZhi = xunKong ? (String(xunKong).match(/[子丑寅卯辰巳午未申酉戌亥]/g) || []) : [];
    return { lunar, ec, gz, hide, na, dayGan, dayZhi, monthGan, monthZhi, yearGan, ssGan, ssZhi, xunKong, dayKongZhi };
  }

  // ── 命宫（命理探源法：子位起正月逆数至生月，生时加临顺数至卯）──
  function mingGongZhi(monthZhi, timeZhi) {
    const mi = ZHI.indexOf(monthZhi), ti = ZHI.indexOf(timeZhi);
    const monthPos = (2 - mi + 12) % 12; // 子位起正月逆数
    const mg = (monthPos + 3 - ti + 12) % 12; // 卯=3
    return ZHI[mg];
  }
  function ganOfMG(yearGan, mgZhi) {
    const start = WUHU[yearGan]; // 寅月干
    const idx = ZHI.indexOf(mgZhi); // 寅=2 → 0步
    const offset = (ZHI.indexOf(mgZhi) - 2 + 12) % 12;
    return GAN[(GAN.indexOf(start) + offset) % 10];
  }
  // 胎元（月干进一，月支进三）
  function taiYuan(monthGan, monthZhi) {
    const g = GAN[(GAN.indexOf(monthGan) + 1) % 10];
    const z = ZHI[(ZHI.indexOf(monthZhi) + 3) % 12];
    return g + z;
  }

  // ── 旺衰（得令/得地/得势 打分，半规则）──
  function wangShuai(p) {
    let score = 0;
    const dw = WX[p.dayGan];
    // 得令：月支本气五行对日干
    const mz = p.monthZhi;
    const mw = WX[mz];
    if (mw === dw) score += 40;
    else if (SHENG[mw] === dw) score += 30;
    else if (KE[mw] === dw) score -= 25;
    else score += 5; // 日干生月（泄气）
    // 得地：四支通根（藏干含日干同五行）
    for (const k of ['year', 'month', 'day', 'time']) {
      const cg = (D && D.zanggan && D.zanggan[p.gz[k][1]]) || [];
      for (const c of cg) {
        if (WX[c] === dw) { score += 14; break; } // 通根（本气/中气/余气任一同五行）
      }
    }
    // 得势：天干同党（比劫印）
    for (const k of ['year', 'month', 'time']) {
      const g = p.gz[k][0];
      const s = shiShenOf(p.dayGan, g);
      if (s === '比肩' || s === '劫财') score += 8;
      else if (s === '正印' || s === '偏印') score += 6;
      else if (s === '正官' || s === '七杀' || s === '正财' || s === '偏财' || s === '食神' || s === '伤官') score -= 3;
    }
    let verdict = '中和';
    if (score >= 65) verdict = '身旺';
    else if (score <= 35) verdict = '身弱';
    return { score, verdict };
  }

  // ── 神煞机判（24 项，三命通会卷二全；元辰/勾绞按阴阳年分男女）──
  function shenSha(p, gender) {
    const hits = [];
    const COLS = ['year', 'month', 'day', 'time'];
    const zhis = [p.gz.year[1], p.gz.month[1], p.gz.day[1], p.gz.time[1]];
    const gans = [p.gz.year[0], p.gz.month[0], p.gz.day[0], p.gz.time[0]];
    const dayZhi = p.dayZhi, dayGan = p.dayGan;
    const yearZhi = p.gz.year[1];
    const findDuan = (n) => (D.shensha || []).find(s => s.name === n || s.name === n.split('（')[0]).duan;
    // 命中柱位辅助
    const zidx = (z) => COLS.filter((k, i) => zhis[i] === z);
    const gidx = (g) => COLS.filter((k, i) => gans[i] === g);
    // 天乙贵人：日干+年干双查（三命通会·论天乙贵人；主流排盘年干日干合并）
    const grAll = Array.from(new Set((GUI_REN[dayGan] || []).concat(GUI_REN[p.yearGan] || [])));
    if (grAll.length) for (const z of grAll) if (zhis.includes(z)) hits.push({ name: '天乙贵人', pos: '地支见' + z, cols: zidx(z), duan: findDuan('天乙贵人') });
    // 驿马（年支三合，三命通会 2109"寅午戌生人马在申…亥卯未人马在巳"）+ 日支坐马（命理约言）
    for (const baseZhi of new Set([yearZhi, dayZhi])) {
      const shMa = SANHE.find(s => s.group.includes(baseZhi));
      if (shMa && zhis.includes(shMa.ma)) hits.push({ name: '驿马', pos: (baseZhi === yearZhi ? '年支' : '日支') + baseZhi + '三合马在' + shMa.ma, cols: zidx(shMa.ma), duan: findDuan('驿马') });
    }
    // 桃花（咸池）/华盖/将星：年支+日支双查（神峰通考 1373"以生年上起，或又以日上起"）
    for (const sh of SANHE) {
      for (const baseZhi of new Set([yearZhi, dayZhi])) {
        if (sh.group.includes(baseZhi)) {
          for (const [nm, target] of [['桃花（咸池）', sh.tao], ['华盖', sh.gai], ['将星', sh.jiang]]) {
            if (zhis.includes(target)) hits.push({ name: nm, pos: (baseZhi === yearZhi ? '年支' : '日支') + baseZhi + '三合见' + target, cols: zidx(target), duan: findDuan(nm) });
          }
        }
      }
    }
    // 羊刃
    const yr = YANG_REN[dayGan];
    if (yr && zhis.includes(yr)) hits.push({ name: '羊刃', pos: '地支见' + yr, cols: zidx(yr), duan: findDuan('羊刃') });
    // 禄神
    const lu = LU[dayGan];
    if (lu && zhis.includes(lu)) hits.push({ name: '禄神', pos: '地支见' + lu, cols: zidx(lu), duan: findDuan('禄神') });
    // 天德（月支）
    const td = TIAN_DE[p.monthZhi];
    if (td) for (const c of td) if (gans.includes(c) || zhis.includes(c)) hits.push({ name: '天德', pos: '月支' + p.monthZhi + '，四柱见' + c, cols: Array.from(new Set(gidx(c).concat(zidx(c)))), duan: findDuan('天德') });
    // 月德（月支）
    const yd = YUE_DE[p.monthZhi];
    if (yd && gans.includes(yd)) hits.push({ name: '月德', pos: '四柱天干见' + yd, cols: gidx(yd), duan: findDuan('月德') });
    // 三奇（年月日 / 月日时 顺连；三命通会·论三奇 2327-2369：天上三奇乙丙丁，甲戊庚亦以为天上三奇；太乙经以辛壬癸为人间三奇，其说无据）
    for (const [nm, trio, note] of [['天上三奇', ['乙', '丙', '丁'], ''], ['天上三奇', ['甲', '戊', '庚'], '（甲戊庚亦以为天上三奇）'], ['人间三奇', ['辛', '壬', '癸'], '（太乙经说，其说无据，备查）']]) {
      for (const triple of [[gans[0], gans[1], gans[2]], [gans[1], gans[2], gans[3]]]) {
        if (trio[0] === triple[0] && trio[1] === triple[1] && trio[2] === triple[2]) {
          hits.push({ name: nm, pos: triple.join('') + '顺连' + note, cols: ['year', 'month', 'day'], duan: '凡命遇三奇，主人精神异常，襟怀卓越，好奇尚大，博学多能；有三奇要得体得地，不欲失时；值元辰、咸池、冲破、天罗地网者，为无用（三命通会·论三奇 2327-2369）。' });
        }
      }
    }
    // 魁罡（三命通会·论魁罡；庚辰/壬辰/戊戌/庚戌）
    if (KUI_GANG.includes(p.gz.day)) hits.push({ name: '魁罡', pos: '日柱' + p.gz.day, cols: ['day'], duan: findDuan('魁罡') });
    // 孤辰寡宿（年支，三命通会 2724"亥子丑逐方三位，进前一辰见寅为孤，退后一辰见戌为寡"）
    if (GU[yearZhi] && zhis.includes(GU[yearZhi])) hits.push({ name: '孤辰', pos: '年支' + yearZhi + '进一位见' + GU[yearZhi], cols: zidx(GU[yearZhi]), duan: findDuan('孤辰寡宿') });
    if (GUA[yearZhi] && zhis.includes(GUA[yearZhi])) hits.push({ name: '寡宿', pos: '年支' + yearZhi + '退一位见' + GUA[yearZhi], cols: zidx(GUA[yearZhi]), duan: findDuan('孤辰寡宿') });
    // 天罗地网（三命通会 2755-2775）：辰生人得巳（重）/巳生人得辰（轻）=地网，戌生人得亥（轻）/亥生人得戌（重）=天罗；男怕天罗、女怕地网
    const LW = { '辰': ['巳', '地网', '重'], '巳': ['辰', '地网', '轻'], '戌': ['亥', '天罗', '轻'], '亥': ['戌', '天罗', '重'] };
    const lw = LW[yearZhi];
    if (lw && zhis.includes(lw[0])) hits.push({ name: lw[1], pos: '年支' + yearZhi + '见' + lw[0] + '（' + lw[2] + '犯' + (lw[1] === '天罗' ? (gender === 1 ? '，男命尤忌' : '') : (gender === 0 ? '，女命尤忌' : '')) + '）', cols: zidx(lw[0]), duan: findDuan('天罗地网') });
    // 十恶大败
    if (SHIE.includes(p.gz.day)) hits.push({ name: '十恶大败', pos: '日柱' + p.gz.day, cols: ['day'], duan: findDuan('十恶大败') });
    // 阴阳差错
    if (YINYANG.includes(p.gz.day)) hits.push({ name: '阴阳差错', pos: '日柱' + p.gz.day, cols: ['day'], duan: findDuan('阴阳差错') });
    // ── 扩展 10 项 ──
    // 金舆（三命通会 2090"金舆常居禄前二辰，如甲子人禄在寅，辰为金舆"——以年干论）
    const jin = ZHI[(ZHI.indexOf(LU[p.yearGan]) + 2) % 12];
    if (zhis.includes(jin)) hits.push({ name: '金舆', pos: '地支见' + jin + '（' + p.yearGan + '年禄' + LU[p.yearGan] + '前二辰）', cols: zidx(jin), duan: findDuan('金舆') });
    // 六害（成对）
    for (const a of Object.keys(HIT6)) {
      if (zhis.includes(a) && zhis.includes(HIT6[a])) hits.push({ name: '六害', pos: a + HIT6[a] + '相害', cols: Array.from(new Set(zidx(a).concat(zidx(HIT6[a])))), duan: findDuan('六害') });
    }
    // 三刑
    if (XING_EN.every(z => zhis.includes(z))) hits.push({ name: '三刑', pos: '寅巳申（无恩之刑）', cols: Array.from(new Set([].concat(zidx('寅'), zidx('巳'), zidx('申')))), duan: findDuan('三刑') });
    if (XING_SHI.every(z => zhis.includes(z))) hits.push({ name: '三刑', pos: '丑戌未（恃势之刑）', cols: Array.from(new Set([].concat(zidx('丑'), zidx('戌'), zidx('未')))), duan: findDuan('三刑') });
    if (zhis.includes('子') && zhis.includes('卯')) hits.push({ name: '三刑', pos: '子卯（无礼之刑）', cols: Array.from(new Set(zidx('子').concat(zidx('卯')))), duan: findDuan('三刑') });
    for (const z of XING_ZI) if (zhis.filter(x => x === z).length >= 2) hits.push({ name: '三刑', pos: z + z + '（自刑）', cols: zidx(z), duan: findDuan('三刑') });
    // 劫煞/亡神（年支+日支双查；三命通会 2518"水绝在巳，申子辰以巳为劫煞"，劫在绝处、亡在临官）
    for (const baseZhi of new Set([yearZhi, dayZhi])) {
      const g = Object.keys(JIE_WANG).find(k => k.includes(baseZhi));
      if (!g) continue;
      const jw = JIE_WANG[g];
      const bsrc = (baseZhi === yearZhi ? '年' : '日') + '支' + baseZhi;
      if (zhis.includes(jw.jie)) hits.push({ name: '劫煞', pos: bsrc + '局见' + jw.jie + '（劫在' + g[1] + '之绝处）', cols: zidx(jw.jie), duan: findDuan('劫煞') });
      if (zhis.includes(jw.wang)) hits.push({ name: '亡神', pos: bsrc + '局见' + jw.wang + '（亡在' + g[1] + '之临官）', cols: zidx(jw.wang), duan: findDuan('亡神') });
    }
    // 隔角（神峰通考 1371）：以日时上起，日与时隔一字即为隔角（如丑日卯时、辰日午时、未日酉时、戌日子时）
    {
      const diff = (ZHI.indexOf(p.gz.time[1]) - ZHI.indexOf(p.gz.day[1]) + 12) % 12;
      if (diff === 2 || diff === 10) hits.push({ name: '隔角', pos: '日支' + p.gz.day[1] + '与时支' + p.gz.time[1] + '相隔一字', cols: ['day', 'time'], duan: '以日时上起，日与时隔一字即为隔角（神峰通考）。《心镜赋》云：隔角相逢犯岁君，徒流定分明。' });
    }
    // 流霞（神峰通考 1397，年干查）：甲鸡乙犬丙羊加，丁是猴乡戊见蛇，己马庚龙辛逐兔，壬猪癸虎是流霞
    {
      const lx = LIU_XIA[p.yearGan];
      if (lx && zhis.includes(lx)) hits.push({ name: '流霞', pos: '年干' + p.yearGan + '见' + lx, cols: zidx(lx), duan: '甲鸡乙犬丙羊加，丁是猴乡戊见蛇，己马庚龙辛逐兔，壬猪癸虎是流霞；男主他乡死，女主产后亡（神峰通考）。注：命理约言斥流霞为妄煞（"乙遇申乃正官…何所见其淫亵乎"），仅作备查。' });
    }
    // 灾煞/六厄（年支三合局）
    for (const g of Object.keys(ZAI_E)) {
      if (g.includes(yearZhi)) {
        const zz = ZAI_E[g], le = LIU_E[g];
        if (zhis.includes(zz)) hits.push({ name: '灾煞', pos: g + '局见' + zz + '（冲破将星' + g[1] + '）', cols: zidx(zz), duan: findDuan('灾煞') });
        if (zhis.includes(le)) hits.push({ name: '六厄', pos: g + '局见' + le + '（' + g[1] + '之死地）', cols: zidx(le), duan: findDuan('六厄') });
        break;
      }
    }
    // 元辰/勾绞（分阴阳年男女）
    const yangYear = YANG_GAN[p.yearGan] === 1;
    const isYangM = (yangYear && gender === 1) || (!yangYear && gender === 0); // 阳男阴女
    const chongIdx = ZHI.indexOf(CHONG[yearZhi]);
    const yuanZ = ZHI[(chongIdx + (isYangM ? 1 : -1) + 12) % 12];
    if (zhis.includes(yuanZ)) hits.push({ name: '元辰', pos: '年支' + yearZhi + '冲' + CHONG[yearZhi] + (isYangM ? '前' : '后') + '一位见' + yuanZ, cols: zidx(yuanZ), duan: findDuan('元辰') });
    const gouIdx = ZHI.indexOf(yearZhi);
    const gouZ = ZHI[(gouIdx + (isYangM ? 3 : -3) + 12) % 12];
    const jiaoZ = ZHI[(gouIdx + (isYangM ? -3 : 3) + 12) % 12];
    if (zhis.includes(gouZ)) hits.push({ name: '勾绞', pos: '年支' + yearZhi + (isYangM ? '前' : '后') + '三辰见' + gouZ + '（勾）', cols: zidx(gouZ), duan: findDuan('勾绞') });
    if (zhis.includes(jiaoZ)) hits.push({ name: '勾绞', pos: '年支' + yearZhi + (isYangM ? '后' : '前') + '三辰见' + jiaoZ + '（绞）', cols: zidx(jiaoZ), duan: findDuan('勾绞') });
    // 暗金的煞（年支孟仲季）
    const aj = AJIN[yearZhi];
    if (aj && zhis.includes(aj)) hits.push({ name: '暗金的煞', pos: '年支' + yearZhi + '见' + aj, cols: zidx(aj), duan: findDuan('暗金的煞') });
    // 天厨（三命通会 4942/4950"食神逢禄号天厨"：日干食神之禄）
    const tc = TIAN_CHU[dayGan];
    if (tc && zhis.includes(tc)) hits.push({ name: '天厨', pos: '日干' + dayGan + '食神之禄见' + tc, cols: zidx(tc), duan: '食神逢禄号天厨，冲克空亡官煞忌；食神月上号天厨，人命逢之富有余，切忌枭来明减福（三命通会 4942/4950）。' });
    // 太极贵人（三命通会·论太极贵 2423-2431）
    const tj = TAI_JI[dayGan];
    if (tj) {
      const tHit = tj.filter(z => zhis.includes(z));
      if (tHit.length) hits.push({ name: '太极贵人', pos: '日干' + dayGan + '见' + tHit.join('') + '（始终之地）', cols: tHit.flatMap(z => zidx(z)), duan: '造化始终相保，乃曰太极贵。甲乙木先造乎子终乎午、丙丁喜卯藏酉、庚辛得寅见亥、壬癸得申纳巳、戊己得辰戌丑未为正库；四库全时为至贵，位班上列据权衡（三命通会·论太极贵 2423-2431）。' });
    }
    // 学堂词馆（三命通会·论学堂词馆 2441-2467：以本命纳音五行长生为学堂、临官为词馆；忌空亡冲破、支干纳音见克）
    {
      const naWx = (p.na.year || '').slice(-1);
      const xg = XUETANG[naWx];
      if (xg) {
        if (zhis.includes(xg.xue)) hits.push({ name: '学堂', pos: '年纳音' + p.na.year + '（' + naWx + '）长生在' + xg.xue, cols: zidx(xg.xue), duan: '长生乃学堂之正位；凡学堂词馆，切不要犯空亡及冲破，支干纳音不要见克（三命通会·论学堂词馆 2441-2467）。' });
        if (zhis.includes(xg.guan)) hits.push({ name: '词馆', pos: '年纳音' + p.na.year + '（' + naWx + '）临官在' + xg.guan, cols: zidx(xg.guan), duan: '临官乃词馆之位；生来禄马真学堂，若同词馆主文章（三命通会·论学堂词馆）。' });
      }
    }
    // 日德（渊海子平·论日德 433-444）
    if (RI_DE.includes(p.gz.day)) hits.push({ name: '日德', pos: '日柱' + p.gz.day, cols: ['day'], duan: '日德有五：甲寅、戊辰、丙辰、庚辰、壬戌。其福要多，而忌刑冲破害，恶官星，憎财旺；加临会合，但空亡而忌魁罡。主人性格慈善；日德俱多，福必丰厚，运行身旺大是奇绝；若旺气已衰，运至魁罡，其死必矣（渊海子平·论日德）。' });
    // 去重
    const seen = new Set();
    return hits.filter(h => { const k = h.name + h.pos; if (seen.has(k)) return false; seen.add(k); return true; });
  }

  // ── 民间神煞定义表机判（《四柱神煞查法对照表_完整版.txt》民间整理版照录，与上方经籍神煞并存区分）──
  // 数据 bazi.json.minjian_shensha：detail=33详解（口诀/查法/主事）、tables=6大查法对照表（年干28/年支43/纳音15/月支78/日干59/日支9）
  // 机判口径：按表基准（年干/日干/年支/日支/月支/纳音）取列值，按行尾注（对X）匹配目标；"a"不命中；昼夜分天乙阳贵阴贵；
  // 元辰/勾绞按阴阳年男女分行；需运限/岁运/流年/十二宫/财帛宫数据或命宫分行的行（天马/注受等）如实不判；
  // 值含斜杠（子/午）任一中即命中；多字地支组（辰戌丑未）任一命中；干支对格按四柱干支对匹配。
  function jipanMinJianShenSha(p, gender, hour) {
    const MJ = (D && D.minjian_shensha) || { detail: [], tables: [] };
    const EX = (D && D.minjian_extras && D.minjian_extras.extras) || (MJ.extras) || {}; // 冷门神煞补含义（原文节录+来源）
    const E_ALIAS = {
      '旌钺1': '旌钺煞', '旌钺2': '旌钺煞',
      '天乙贵人（白天生人用阳贵）': '天乙（昼生阳贵）', '玉堂贵人（夜间生人用阴贵）': '玉堂（夜生阴贵）',
      '真宫': '真官', '金举禄': '金舆禄', '金举引从': '金舆引从', '被祖空亡': '破祖空亡', '恫怅杀': '惆怅杀',
      '十干学馆': '官贵学馆'
    };
    const gz = p.gz, na = p.na;
    const yG = gz.year[0], yZ = gz.year[1], mG = gz.month[0], mZ = gz.month[1], dG = gz.day[0], dZ = gz.day[1], tG = gz.time[0], tZ = gz.time[1];
    const ganIdx = GAN.indexOf(dG), yIdx = GAN.indexOf(yG);
    const zhiIdx = ZHI.indexOf;
    const dayNaWx = (na.day || '').slice(-1);
    const mzYueIdx = (ZHI.indexOf(mZ) - 2 + 12) % 12; // 月支为主表列序：寅0..丑11
    const mgZhi = mingGongZhi(mZ, tZ);
    const lunarDay = (p.lunar && p.lunar.getDay) ? Number(p.lunar.getDay()) : 0;
    const isDay = (hour === undefined) ? true : (hour >= 6 && hour < 18); // 昼=卯至酉（6≤h<18），引擎设定近似
    const yangYear = ['甲', '丙', '戊', '庚', '壬'].indexOf(yG) >= 0;
    const isYangM = (yangYear && gender === 1) || (!yangYear && gender === 0); // 阳男阴女（与官方元辰同口径）
    const NA_WX = ['木', '火', '土', '金', '水'];
    const hits = [], skipped = [];
    const T = {
      // 目标：zhis=地支、gz=干支对、gans=天干、num=数字（生日）
      build(dui) {
        const s = dui || '';
        const z = [], g = [], gn = [], n = [];
        if (!s) { z.push(yZ, mZ, dZ, tZ); g.push(gz.year, gz.month, gz.day, gz.time); return { z, g, gn, n }; }
        const addZ = (x) => { if (z.indexOf(x) < 0) z.push(x); };
        const addG = (x) => { if (g.indexOf(x) < 0) g.push(x); };
        if (s.indexOf('四柱') >= 0) { addZ(yZ); addZ(mZ); addZ(dZ); addZ(tZ); addG(gz.year); addG(gz.month); addG(gz.day); addG(gz.time); }
        if (s.indexOf('日') >= 0) { addZ(dZ); if (s.indexOf('柱') >= 0 || s.indexOf('干支') >= 0) addG(gz.day); }
        if (s.indexOf('时') >= 0) { addZ(tZ); if (s.indexOf('柱') >= 0 || s.indexOf('干支') >= 0) addG(gz.time); }
        if (s.indexOf('月') >= 0) { addZ(mZ); if (s.indexOf('柱') >= 0 || s.indexOf('干支') >= 0) addG(gz.month); }
        if (s.indexOf('年') >= 0) { addZ(yZ); if (s.indexOf('柱') >= 0 || s.indexOf('干支') >= 0) addG(gz.year); }
        if (s.indexOf('日干') >= 0) gn.push(dG);
        if (s.indexOf('时干') >= 0) gn.push(tG);
        if (s.indexOf('生日') >= 0 && lunarDay > 0) n.push(lunarDay);
        if (s.indexOf('命宫') >= 0) addZ(mgZhi);
        if (s.indexOf('运限') >= 0 || s.indexOf('岁运') >= 0 || s.indexOf('流年') >= 0 || s.indexOf('十二宫') >= 0 || s.indexOf('财帛') >= 0) return null;
        return { z, g, gn, n };
      },
      segHit(seg, t) {
        if (!t) return false;
        if (/^\d/.test(seg)) {
          return seg.split('/').some(r => { const mm = r.split('-'); if (mm.length !== 2) return false; const a = Number(mm[0]), b = Number(mm[1]); return t.n.some(x => x >= a && x <= b); });
        }
        if (seg.length === 1) return t.z.indexOf(seg) >= 0 || t.gn.indexOf(seg) >= 0;
        if (seg.length === 4 && /^[子丑寅卯辰巳午未申酉戌亥]{4}$/.test(seg)) return t.z.some(x => seg.indexOf(x) >= 0);
        return t.g.indexOf(seg) >= 0 || t.z.indexOf(seg) >= 0;
      },
      rowHit(row, v, t) {
        if (!t) return null; // 需运限等数据，不判
        // 昼夜两版：天乙（昼）/玉堂（夜）
        if (row.name.indexOf('昼') >= 0 && !isDay) return null;
        if (row.name.indexOf('夜') >= 0 && isDay) return null;
        // 阴阳年男女分行
        if (row.name.indexOf('阳男阴女') >= 0 && !isYangM) return null;
        if (row.name.indexOf('阴男阳女') >= 0 && isYangM) return null;
        // 只测基准列的值 v（整行其他列与本命无关，不可混测）
        const segs = [v];
        for (const seg of segs) {
          // 值格按斜杠/空格拆多候选（"子/午"、"丙寅丙子"）
          const cands = seg.split(/[\/ ]/).filter(Boolean);
          if (cands.some(c => this.segHit(c, t))) return row;
        }
        return null;
      }
    };
    // 逐表匹配
    for (const tb of MJ.tables) {
      let baseIdx = -1;
      if (tb.base === '年干') baseIdx = yIdx;
      else if (tb.base === '日干') baseIdx = ganIdx;
      else if (tb.base === '年支') baseIdx = ZHI.indexOf(yZ);
      else if (tb.base === '日支') baseIdx = ZHI.indexOf(dZ);
      else if (tb.base === '月支') baseIdx = mzYueIdx;
      else if (tb.base === '纳音') baseIdx = NA_WX.indexOf(dayNaWx);
      if (baseIdx < 0) continue;
      for (const row of tb.rows) {
        const v = row.vals[baseIdx];
        if (!v || v === 'a' || v === 'A') continue;
        const t = T.build(row.dui || '四柱');
        if (!t) { skipped.push(tb.base + '·' + row.name + '（需' + (row.dui || '）运限岁运等数据，本局不判')); continue; }
        const hitRow = T.rowHit(row, v, t);
        if (hitRow) hits.push({ table: tb.title.replace('神煞查法对照表 —— 以', '以'), base: tb.base, name: row.name, v, dui: row.dui, no: row.no });
      }
    }
    // 附带：33 详解主事（同名+别名命中补充说明）；经籍神煞库含义（duan）作第二源互证；两者皆无则如实标注"原文仅查法"
    const detailMap = {};
    for (const d of MJ.detail) detailMap[d.name] = d;
    // 行名→详解名（同一神煞的异写/别名，非编造；映射基于同名或通行同指）
    const D_ALIAS = {
      '天乙（昼生阳贵）': '天乙贵人', '玉堂（夜生阴贵）': '天乙贵人', '天乙贵人（白天生人用阳贵）': '天乙贵人', '玉堂贵人（夜间生人用阴贵）': '天乙贵人',
      '文昌': '文昌贵人', '太极贵人': '太极贵人', '天医': '天医', '天医2': '天医', '天赦': '天赦', '日天赦': '天赦',
      '四废日': '四废', '十恶大败': '十恶大败', '天罗': '天罗地网', '地网': '天罗地网', '驿马': '驿马', '亡神': '亡神', '劫煞': '劫煞',
      '元辰（阳男阴女）': '元辰（大耗）', '元辰（阴男阳女）': '元辰（大耗）', '勾绞（阳男阴女）': '勾绞煞', '勾绞（阴男阳女）': '勾绞煞',
      '灾杀': '灾煞', '孤辰': '孤辰寡宿', '寡宿': '孤辰寡宿', '桃花': '咸池（桃花）', '咸池': '咸池（桃花）', '将星': '将星',
      '魁罡': '魁罡贵人', '阴阳差错': '阴阳差错', '阳刃': '羊刃', '真羊刃': '羊刃', '金神': '金神', '金神七煞': '金神', '孤鸾寡鹄': '孤鸾煞',
      '正桃花': '咸池（桃花）', '沐浴咸池': '咸池（桃花）', '禄神': '禄神', '金舆': '金舆', '天德': '天德贵人', '月德': '月德贵人',
      '学堂': '学堂词馆', '词馆': '学堂词馆', '拱禄': '拱禄', '空亡': '空亡（六甲空亡）', '华盖自墓': '华盖', '羊刃': '羊刃',
      '天德合': '天德贵人', '月德合': '月德贵人', '咸池（桃花）': '咸池（桃花）', '华盖': '华盖', '天罗地网': '天罗地网'
    };
    // 行名→经籍库名（经籍 shensha 25 条的断语作互证第二源）
    const J_ALIAS = {
      '桃花': '桃花（咸池）', '咸池': '桃花（咸池）', '正桃花': '桃花（咸池）', '沐浴咸池': '桃花（咸池）',
      '孤辰': '孤辰寡宿', '寡宿': '孤辰寡宿', '六厄': '六厄', '暗金的杀': '暗金的煞', '灾杀': '灾煞', '劫煞': '劫煞', '亡神': '亡神',
      '勾绞（阳男阴女）': '勾绞', '勾绞（阴男阳女）': '勾绞', '元辰（阳男阴女）': '元辰', '元辰（阴男阳女）': '元辰',
      '天罗': '天罗地网', '地网': '天罗地网', '十恶大败': '十恶大败', '阴阳差错': '阴阳差错', '阳刃': '羊刃', '真羊刃': '羊刃',
      '魁罡': '魁罡', '禄神': '禄神', '金舆': '金舆', '驿马': '驿马', '将星': '将星', '华盖': '华盖', '华盖自墓': '华盖',
      '天德': '天德', '月德': '月德', '金神': '金神', '勾绞': '勾绞', '羊刃': '羊刃', '六害': '六害', '三刑': '三刑', '元辰': '元辰', '灾煞': '灾煞', '桃花（咸池）': '桃花（咸池）'
    };
    const jingjiMap = {};
    if (D && D.shensha && Array.isArray(D.shensha)) for (const s of D.shensha) jingjiMap[s.name] = s;
    const dedup = [];
    const seenK = new Set();
    for (const h of hits) {
      const k = h.name + h.table + h.v;
      if (seenK.has(k)) continue;
      seenK.add(k);
      const ddName = D_ALIAS[h.name] || h.name;
      const dd = detailMap[ddName] || null;
      const jj = jingjiMap[J_ALIAS[h.name]] || null;
      let zhushi = '', zsSrc = '';
      if (dd && dd.zhushi) { zhushi = dd.zhushi; zsSrc = '详解'; }
      else if (jj && jj.duan) { zhushi = jj.duan; zsSrc = '经籍'; }
      else {
        const ex = EX[E_ALIAS[h.name] || h.name];
        if (ex && ex.text) { zhushi = ex.text; zsSrc = '神煞篇'; }
      }
      dedup.push({ h, zhushi, koujue: dd ? (dd.koujue || '') : '', zsSrc, exSrc: (zsSrc === '神煞篇' && EX[E_ALIAS[h.name] || h.name]) ? EX[E_ALIAS[h.name] || h.name].src : '' });
    }
    return { hits: dedup, skipped, total: MJ.tables.reduce((s, t) => s + t.rows.length, 0), detail: MJ.detail };
  }

  // ── 袁天罡称骨机判（称骨算命：农历年干支/月/日/时辰四重相加查歌诀）──
  // 数据 bazi.json.chenggu：cgYear(60甲子年骨重) cgMonth(正月..腊月) cgDay(初一..三十) cgHour(子..亥) cgPoems(52档歌诀含命格名/四句诗/注解)
  // 口径：年重按干支纪年（立春为界，与排盘口径一致；民间另有按春节一派，两说并存）；月/日按农历；时按十二时辰；
  // 闰月按来源口径"上半月算本月、下半月算下月"（日≥16取下月；闰十二月下半月罕见无明文，引擎按仍取十二月处理，注明）；满十钱进一两；
  // 注意口径差异：称骨传统"夜11-12点算第二天"，本引擎 lunar 库 23 点不换日（0点换日），与称骨原口径有出入，卡内注明。
  function jipanChengGu(p) {
    const CG = (D && D.chenggu) || null;
    if (!CG) return null;
    const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const dayCn = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
    const fmt = (liang, qian) => (liang === 0 ? (qian ? CN[qian] + '钱' : '零两') : CN[liang] + '两' + (qian ? CN[qian] + '钱' : ''));
    const yGz = p.gz.year || '', tZ = p.gz.time ? p.gz.time[1] : '';
    const yv = CG.cgYear[yGz];
    let m = (p.lunar && p.lunar.getMonth) ? Number(p.lunar.getMonth()) : 0;
    const d = (p.lunar && p.lunar.getDay) ? Number(p.lunar.getDay()) : 0;
    let leap = false, leapNote = '';
    if (m < 0) { leap = true; m = -m; if (d >= 16 && m < 12) { leapNote = '（闰' + CN[m] + '月·' + dayCn[d - 1] + '属下半月→取下月' + CN[m + 1] + '月）'; m = m + 1; } else if (d < 16) { leapNote = '（闰' + CN[m] + '月·' + dayCn[d - 1] + '属上半月→取本月' + CN[m] + '月）'; } else { leapNote = '（闰十二月下半月，来源无明文，引擎按仍取十二月）'; } }
    const mv = (m >= 1 && m <= 12) ? CG.cgMonth[m - 1] : null;
    const dv = (d >= 1 && d <= 30) ? CG.cgDay[d - 1] : null;
    const hv = CG.cgHour[tZ];
    if (yv === undefined || mv === undefined || dv === undefined || hv === undefined) {
      return { err: '骨重表缺值：农历' + yGz + '年' + CN[m] + '月' + dayCn[d - 1] + '日' + tZ + '时（年:' + yv + ' 月:' + mv + ' 日:' + dv + ' 时:' + hv + '）——如实不编造' };
    }
    const qian = Math.round(yv * 10) + Math.round(mv * 10) + Math.round(dv * 10) + Math.round(hv * 10); // 以"钱"为整数单位，免浮点误差
    const liang = Math.floor(qian / 10), yu = qian % 10;
    const key = CN[liang] + '两' + (yu ? CN[yu] + '钱' : '');
    // 数据键不带"钱"字（如"三两五"）；先按带钱键查，再回退不带钱键，避免整两档外全部查表失败
    const g = CG.cgPoems[key] || CG.cgPoems[CN[liang] + '两' + (yu ? CN[yu] : '')] || null;
    return {
      parts: [
        { k: '年（' + yGz + '）', v: fmt(Math.floor(yv), Math.round((yv - Math.floor(yv)) * 10)) },
        { k: '月（农历' + CN[m] + '月）', v: fmt(Math.floor(mv), Math.round((mv - Math.floor(mv)) * 10)) },
        { k: '日（农历' + dayCn[d - 1] + '）', v: fmt(Math.floor(dv), Math.round((dv - Math.floor(dv)) * 10)) },
        { k: '时（' + tZ + '时）', v: fmt(Math.floor(hv), Math.round((hv - Math.floor(hv)) * 10)) }
      ],
      totalQian: qian, liang, yu, key,
      g: g || null, leap, leapNote, yGz, m, d, tZ
    };
  }

  // ── 巾箱秘术：日柱×月令口诀 + 字碰字比对（十部照录，两版并存照录）──
  function jipanJinXiang(p) {
    const JX = (D && D.jinxiang) || null;
    if (!JX) return null;
    const day = p.gz.day || '';
    const mon = p.gz.month ? p.gz.month[1] : '';
    const poem = (JX.parts && JX.parts[day] && JX.parts[day][mon]) || null;
    const gz8 = [p.gz.year[0], p.gz.year[1], p.gz.month[0], p.gz.month[1], p.gz.day[0], p.gz.day[1], p.gz.time[0], p.gz.time[1]];
    const has = (c) => gz8.indexOf(c) >= 0;
    const map = {};
    const add = (k, v) => {
      if (!map[k]) map[k] = [];
      const arr = Array.isArray(v) ? v : [v];
      arr.forEach(x => { if (x && map[k].indexOf(x) < 0) map[k].push(x); });
    };
    '甲乙丙丁戊己庚辛壬癸'.split('').forEach(g => add(g, g));
    '子丑寅卯辰巳午未申酉戌亥'.split('').forEach(z => add(z, z));
    if (JX.translate) {
      const t = JX.translate;
      Object.keys(t.tiangan || {}).forEach(g => add(t.tiangan[g], g));
      Object.keys(t.dizhi || {}).forEach(z => add(t.dizhi[z], z));
      Object.keys(t.guiren || {}).forEach(k => { const v = t.guiren[k]; if (v && v.length >= 2) add(k, [v[0], v[1]]); });
      Object.keys(t.xiu28_rebo || {}).forEach(k => { if (k === '癸2') return; add(t.xiu28_rebo[k], k); });
    }
    const linesOut = String(poem || '').split('\n').map(s => s.trim()).filter(Boolean).map(ln => {
      const found = [];
      for (const w of Object.keys(map)) {
        if (ln.indexOf(w) >= 0) {
          const targets = map[w].filter(has);
          if (targets.length) found.push(w + '→' + targets.join(''));
        }
      }
      const uniq = [];
      found.forEach(f => { if (uniq.indexOf(f) < 0) uniq.push(f); });
      return { ln, found: uniq };
    });
    return { day, mon, poem, isMiss: poem === '（该月口决缺）', linesOut, hitCount: linesOut.filter(r => r.found.length).length, gz8, translate: JX.translate || null, meta: JX.meta || null, totalPoems: JX.totalPoems, missCount: JX.missCount };
  }

  // ── 李虚中命书：四柱干支各查卷上六十甲子「神头禄/禄临官」文（照录不判吉凶）──
  function jipanLiXuZhong(p) {
    const LX = (D && D.lixuzhong) || null;
    if (!LX) return null;
    const gzStr = (x) => (Array.isArray(x) ? x.join('') : x);
    const gzs = [
      { k: '年柱', gz: gzStr(p.gz.year) },
      { k: '月柱', gz: gzStr(p.gz.month) },
      { k: '日柱', gz: gzStr(p.gz.day) },
      { k: '时柱', gz: gzStr(p.gz.time) }
    ];
    const rows = gzs.map(x => {
      const it = (LX.liuShi && LX.liuShi[x.gz]) || null;
      return { k: x.k, gz: x.gz, it, miss: !it };
    });
    return { rows, meta: LX.meta || null, total: LX.liuShi ? Object.keys(LX.liuShi).length : 0 };
  }

  // ── 格局（月令取格 + 成败救应简判）──
  function geJu(p, liupai) {
    const mz = p.monthZhi;
    const cg = (D && D.zanggan && D.zanggan[mz]) || [];
    const benqi = cg[0] || '';
    const ss = shiShenOf(p.dayGan, benqi);
    let ge = ss;
    // 建禄/阳刃/月劫
    if (LU[p.dayGan] === mz) ge = '建禄';
    else if (YANG_REN[p.dayGan] === mz) ge = '阳刃';
    else if (ss === '劫财') ge = '月劫';
    // 成败救应简判（子平真诠）
    const gans = [p.gz.year[0], p.gz.month[0], p.gz.time[0]];
    const ssGans = gans.map(g => shiShenOf(p.dayGan, g));
    let verdict = '成格（简判）', notes = [];
    if (ge === '正官') {
      if (ssGans.includes('伤官')) { verdict = '败格（官逢伤克）'; notes.push('伤官克官，官格败'); }
      if (ssGans.includes('正印') || ssGans.includes('偏印')) notes.push('官逢印护，成格加分');
      if (ssGans.includes('七杀')) { verdict = '带忌（官煞混杂）'; notes.push('官杀混杂须去留'); }
      if (ssGans.includes('正财') || ssGans.includes('偏财')) notes.push('官逢财生，成格加分');
    } else if (ge === '七杀' || ge === '偏官') {
      if (ssGans.includes('食神') || ssGans.includes('伤官')) notes.push('食伤制煞，成格加分');
      if (ssGans.includes('正印') || ssGans.includes('偏印')) notes.push('印化煞，成格加分');
      if (ssGans.includes('正财') || ssGans.includes('偏财')) { verdict = '带忌（财党煞）'; notes.push('财滋煞攻身'); }
    } else if (ge === '正财' || ge === '偏财') {
      if (ssGans.includes('比肩') || ssGans.includes('劫财')) { verdict = '败格（财逢比劫）'; notes.push('比劫夺财'); }
      if (ssGans.includes('食神') || ssGans.includes('伤官')) notes.push('食伤生财，成格加分');
      if (ssGans.includes('正官') || ssGans.includes('七杀')) notes.push('财生官，成格加分');
    } else if (ge === '正印' || ge === '偏印') {
      if (ssGans.includes('正财') || ssGans.includes('偏财')) { verdict = '败格（印逢财坏）'; notes.push('财坏印'); }
      if (ssGans.includes('七杀')) notes.push('杀印相生，成格加分');
    } else if (ge === '食神') {
      if (ssGans.includes('偏印')) { verdict = '败格（食逢枭夺）'; notes.push('枭神夺食'); }
      if (ssGans.includes('正财') || ssGans.includes('偏财')) notes.push('食神生财，成格加分');
    } else if (ge === '伤官') {
      if (ssGans.includes('正官')) notes.push('伤官见官，须看有无印救');
      if (ssGans.includes('正财') || ssGans.includes('偏财')) notes.push('伤官生财，成格加分');
      if (ssGans.includes('正印') || ssGans.includes('偏印')) notes.push('伤官佩印，成格加分');
    } else if (ge === '建禄' || ge === '月劫' || ge === '阳刃') {
      if (!ssGans.some(s => ['正官', '七杀', '正财', '偏财', '食神', '伤官'].includes(s))) { verdict = '无财官透出（另取用神）'; notes.push('建禄月劫本身不能为用，须另取财官煞食'); }
      else notes.push('透财官煞食，即同其格');
    }
    // 用神五法推荐
    let yong = '扶抑法（身' + (p._ws ? p._ws.verdict : '') + '）：' + (p._ws && p._ws.verdict === '身旺' ? '宜克泄耗（财官食伤）' : p._ws && p._ws.verdict === '身弱' ? '宜生扶（印比）' : '中和随格取用');
    return { ge, benqi, ss, verdict, notes, yong };
  }

  // ── 大运流年干支 × 原局 生克冲合 机判（天干合/生克 + 地支冲(分冲克冲动)/六合/三合/刑 + 六害 + 伏吟反吟 + 晦气 + 盖头 + 运克岁）──
  // 依据：三命通会·总论岁运（1610-1630）、命理约言（266 六害/349 盖头/281 天克地冲）、子平真诠（172 冲克冲动之分）、实践断语八百条（423 天克地冲）
  function jipanGx(gz, p, ctx) {
    const g = gz[0], z = gz[1];
    const isDayun = !!(ctx && ctx.isDayun);
    const cols = ['year', 'month', 'day', 'time'];
    const hits = [];
    // 伏吟/反吟（三命通会 1619-1620：岁运与日相对谓之返吟，岁运压日谓之伏吟，不利六亲，非横破财，不为吉兆）
    let fanYin = false;
    if (gz === p.gz.day) {
      hits.push('伏吟：' + gz + ' 与日柱相同——不利六亲，非横破财，不为吉兆（三命通会 1619）');
    } else {
      const dg = p.gz.day[0], dz = p.gz.day[1];
      if (CHONG[z] === dz && g !== dg && (KE[WX[g]] === WX[dg] || KE[WX[dg]] === WX[g])) {
        fanYin = true;
        hits.push('反吟/天克地冲：' + gz + ' 与日柱' + p.gz.day + '干克支冲——不利六亲，非横破财，不为吉兆；冲入本限运尤重（三命通会 1619；实践断语 423）');
      }
    }
    // 天干五合（流年干合日干 → 晦气，三命通会 1624：日干与时干不宜与太岁合，合则名晦气；甲合己灾重、己合甲灾轻，岁位近者灾重远者灾轻）
    for (const k of cols) {
      const gg = p.gz[k][0];
      if (HE_GAN[g] === gg) {
        if (k === 'day' && !isDayun) hits.push('晦气：' + g + '合日干' + gg + '（太岁合日干为晦气，甲合己灾重、己合甲灾轻，岁位近者灾重远者灾轻，三命通会 1624）');
        else hits.push('合' + COL_LBL[k] + '干' + gg);
      }
    }
    // 天干五行生克（干对干）
    for (const k of cols) {
      const gg = p.gz[k][0];
      if (gg === g) continue;
      if (SHENG[WX[g]] === WX[gg]) hits.push('生' + COL_LBL[k] + '干' + gg);
      else if (KE[WX[g]] === WX[gg]) hits.push('克' + COL_LBL[k] + '干' + gg);
    }
    // 地支冲（分冲克之冲/冲动之冲：子平真诠 172「子午卯酉之类二者相仇乃冲克之冲，四墓土自为冲乃冲动之冲」；四正四生=冲克、四库=冲动）
    for (const k of cols) {
      const zz = p.gz[k][1];
      if (CHONG[z] === zz) {
        if (k === 'day' && fanYin) continue; // 反吟已单独报天克地冲，避免重复
        const isKu = ['辰', '戌', '丑', '未'].includes(zz);
        hits.push('冲' + COL_LBL[k] + '支' + zz + (isKu ? '（四库自冲为冲动之冲，非冲克之冲，子平真诠 172）' : '（四正/四生相冲为冲克之冲，子平真诠 172）'));
      }
    }
    // 日刃忌运（渊海子平 419-421）：日柱坐阳刃，岁运支冲刃支为忌——"独阳刃以时言之，四柱中不要入财乡，怕冲阳刃"；甲日忌酉运、丙日刃在午忌子运、庚刃在酉忌卯运、壬刃在子忌午运、戊日刃在午忌子正财运
    {
      const yrZhi = YANG_REN[p.dayGan];
      if (yrZhi && CHONG[z] === yrZhi) {
        hits.push('日刃' + yrZhi + '忌' + z + (isDayun ? '运' : '岁') + '：怕冲阳刃（渊海子平"独阳刃以时言之，四柱中不要入财乡，怕冲阳刃；甲日忌酉运、丙日刃在午忌子运、庚刃在酉忌卯运、壬刃在子忌午运、戊日刃在午忌子正财运"）');
      }
    }
    // 地支六合
    for (const k of cols) {
      const zz = p.gz[k][1];
      if (HE6[z] === zz) hits.push('六合' + COL_LBL[k] + '支' + zz);
    }
    // 地支三合（完整局 = 本支+原局两支；半合 = 本支+原局一支）
    for (const sh of SANHE) {
      if (!sh.group.includes(z)) continue;
      const others = sh.group.filter(x => x !== z);
      const hitCols = cols.filter(k => others.includes(p.gz[k][1]));
      if (hitCols.length === 2) hits.push('会' + sh.group.join('') + '三合局');
      else if (hitCols.length === 1) hits.push('半合' + sh.group.join('') + '局');
    }
    // 地支刑（三刑成对/自刑/子卯无礼）
    for (const trio of [XING_EN, XING_SHI]) {
      if (!trio.includes(z)) continue;
      const others = trio.filter(x => x !== z);
      const hitCols = cols.filter(k => others.includes(p.gz[k][1]));
      if (hitCols.length === 2) hits.push('三刑' + trio.join(''));
    }
    if ((z === '子' || z === '卯') && cols.filter(k => p.gz[k][1] === (z === '子' ? '卯' : '子')).length) hits.push('子卯无礼之刑');
    if (XING_ZI.includes(z)) {
      const same = cols.filter(k => p.gz[k][1] === z);
      if (same.length >= 2) hits.push('自刑' + z + z);
    }
    // 六害（命理约言 266 / 命理探源 97：冲其合我者，故为害；寅巳相害兼相刑——遇寅巳从害、遇寅巳申从刑）
    for (const k of cols) {
      const zz = p.gz[k][1];
      if (HIT6[z] === zz || HIT6[zz] === z) {
        const zi = [z, zz].sort().join('');
        if (zi === '巳寅') {
          const xing = cols.filter(x => ['寅', '巳', '申'].includes(p.gz[x][1]));
          if (xing.length >= 3) hits.push('刑' + COL_LBL[k] + '支' + zz + '（寅巳相害兼相刑，遇寅巳申从刑，命理约言 266）');
          else hits.push('害' + COL_LBL[k] + '支' + zz + '（寅巳相害兼相刑，从害，命理约言 266）');
        } else {
          hits.push('害' + COL_LBL[k] + '支' + zz + '（六害·冲其合我者而来，以吉害凶未必能去凶，以凶害吉亦能损吉，命理约言 266）');
        }
      }
    }
    // 盖头（命理约言 349 张神峰盖头说：干如头面，行运虽值所喜之支而所憎之干盖之则不吉；结构=运/岁干克支）
    if (KE[WX[g]] === WX[z]) hits.push('盖头：' + g + '克' + z + '（运干盖运支——行运虽值所喜之支，而所憎之干盖之则不吉，命理约言 349）');
    // 运克岁（三命通会 1629：大运不宜与太岁相克相冲，尤忌运克岁，主破耗丧事，有贵人禄马解之稍吉，八字有救无虞）
    if (!isDayun && ctx && ctx.dayunGz) {
      const dg2 = ctx.dayunGz[0], dz2 = ctx.dayunGz[1];
      if (KE[WX[dg2]] === WX[g]) hits.push('运克岁：大运' + ctx.dayunGz + '天干' + dg2 + '克流年干' + g + '——主破耗丧事，有贵人禄马解之稍吉，八字有救无虞（三命通会 1629）');
      if (CHONG[dz2] === z) hits.push('运冲岁：大运' + ctx.dayunGz + '地支' + dz2 + '冲流年支' + z + '——大运不宜与太岁相克相冲（三命通会 1629）');
    }
    return hits;
  }

  // ── 空亡/地势/自坐 用法机判（三命通会·论空亡 / 渊海子平 / 命理约言·空亡论）──
  // 口径：空亡以日柱旬推（命理约言·空亡论"皆以生日推之"；三命通会"空亡以生日係何旬所屬"）
  function kongWangJiPan(p, sh) {
    const hits = [];
    const cols = ['year', 'month', 'day', 'time'];
    const kw = p.dayKongZhi || [];
    if (!kw.length) return hits;
    const kongCols = cols.filter(k => kw.includes(p.gz[k][1]));
    const kongZhis = Array.from(new Set(kongCols.map(k => p.gz[k][1])));
    const otherZhis = cols.map(k => p.gz[k][1]);
    const lu = LU[p.dayGan];
    const grp = SANHE.find(s => s.group.includes(p.gz.year[1]));
    const ma = grp ? grp.ma : null;
    const csArr = (D && D.changsheng && D.changsheng.items && D.changsheng.items[p.dayGan]) || [];
    const csn = (D && D.changsheng && D.changsheng.names) || [];
    const csZ = (csArr.length && csn[0] === '长生') ? csArr[0] : null;
    const timeShangGuan = p.ssGan.time === '伤官';
    const huaGaiHit = sh.some(h => h.name === '华盖');
    // 每支空亡的冲合刑状态
    for (const k of kongCols) {
      const z = p.gz[k][1];
      const lbl = COL_LBL[k];
      const others = otherZhis.filter(x => x !== z);
      const heZ = others.find(x => LIUHE[z] === x);
      const sanheZ = SANHE.some(s2 => s2.group.includes(z) && s2.group.filter(x => x !== z && others.includes(x)).length >= 1);
      const chongZ = others.find(x => CHONG[z] === x);
      const xingZ = others.find(x => (XING_EN.includes(z) && XING_EN.includes(x)) || (XING_SHI.includes(z) && XING_SHI.includes(x))) ||
        ((z === '子' && others.includes('卯')) || (z === '卯' && others.includes('子'))) ||
        (XING_ZI.includes(z) && others.includes(z));
      // 得时判半空/失时判真空（命理约言·空亡论：失时为真空，得时为半空）
      const deShi = WX[z] === WX[p.monthZhi];
      if (heZ || sanheZ) hits.push(lbl + '支' + z + '落空亡，逢' + (heZ ? '六合' : '三合') + '——空亡逢合则不能空矣（福聚之气见合不失；恶煞见合则解），三命通会·论空亡');
      else if (chongZ) hits.push(lbl + '支' + z + '落空亡而逢' + chongZ + '冲——"如犯空亡，有他位來沖，亦為破禍成福"，三命通会·论空亡（约言则批"空则无气，冲之恐益破散"，两说并存）');
      else if (xingZ) hits.push(lbl + '支' + z + '落空亡而逢刑——非真空（原文：无冲无合无刑乃真空亡）');
      else hits.push(lbl + '支' + z + '落空亡，无冲无合无刑——' + (deShi ? '得时为半空（命理约言·空亡论）' : '真空亡，四孟太毒，只作小伎巧求人（三命通会·论空亡）'));
      // 吉神/凶神减分（命理约言·空亡论：吉神真空减十之七、半空减十之三；凶神同理）
      const zhiShen = (p.ssZhi && p.ssZhi[k] && p.ssZhi[k][0]) || '';
      if (zhiShen && ['正官', '正财', '偏财', '正印', '食神'].indexOf(zhiShen) >= 0) hits.push(lbl + '支' + z + '空亡为' + zhiShen + '（吉神）——' + (deShi ? '半空则吉减十之三' : '真空则吉减十之七') + '；有扶助则真空同于半空（命理约言·空亡论）');
      if (zhiShen && ['七杀', '伤官', '偏印', '劫财'].indexOf(zhiShen) >= 0) hits.push(lbl + '支' + z + '空亡为' + zhiShen + '（凶神）——' + (deShi ? '半空则凶减十之三' : '真空则凶减十之七') + '；逢冲克则半空同于真空，吉凶俱无（命理约言·空亡论）');
    }
    // 坐空：四干在空支之上（命理约言·空亡论：坐空较支之自空更有间）
    for (const k of kongCols) {
      const z = p.gz[k][1];
      hits.push(p.gz[k][0] + '干坐空亡支' + z + '——坐空，较支之自空更有间，其力更减（命理约言·空亡论）');
    }
    // 柱位断语
    if (kongCols.includes('day')) hits.push('日支' + p.gz.day[1] + '落空亡——"日坐空亡，難為妻妾"（渊海子平）；"日上見多庶出，或妻妾間離"（三命通会·论空亡）');
    if (kongCols.includes('time')) {
      hits.push('时支' + p.gz.time[1] + '落空亡——"時上見多拗性，為事高而虛"（三命通会·论空亡）' + (huaGaiHit ? '，更遇华盖——"決主少子"' : ''));
      if (timeShangGuan) hits.push('时上伤官并空亡——"難為子息"（渊海子平）');
    }
    if (['month', 'day', 'time'].every(k => kongCols.includes(k))) hits.push('月、日、时三位俱空亡——"不害為大貴人"（三命通会·论空亡；值两位虽有官不大）');
    // 禄/马/长生 落空亡（地势×空亡交叠）
    if (lu && kw.includes(lu) && kongZhis.includes(lu)) hits.push('禄神' + lu + '落空亡——"建祿臨空虛有名，平生向學老無成"（三命通会·论空亡古歌）');
    if (ma && kw.includes(ma) && kongZhis.includes(ma)) hits.push('驿马' + ma + '落空亡——"馬落空亡，操心落魄之人"（渊海子平）');
    if (csZ && kw.includes(csZ) && kongZhis.includes(csZ)) hits.push('长生位' + csZ + '落空亡——"長生陷於空亡，貧寒偃蹇"（渊海子平）');
    // 互换空亡
    const yearKw = xunKongOf(p.gz.year), dayKw = xunKongOf(p.gz.day);
    if (dayKw.includes(p.gz.year[1]) && yearKw.includes(p.gz.day[1])) hits.push('年支' + p.gz.year[1] + '落日旬空、日支' + p.gz.day[1] + '落年旬空——太岁与日互换空亡，"帶互換空亡者災深，主一生財物耗散，大破家宅"（三命通会·论空亡）');
    // 空亡五行之性
    for (const z of kongZhis) {
      const w = WX[z] || '';
      const gist = { '金': '金空則響', '火': '火空則明', '水': '水空則清', '木': '木空則折', '土': '土空則崩' }[w];
      if (gist) hits.push('空亡支' + z + '（' + w + '）——' + gist + '（三命通会·论空亡）');
    }
    // 特定日柱空亡忌克命（甲寅戊午庚申见丑）
    if (['甲寅', '戊午', '庚申'].includes(p.gz.day) && kw.includes('丑') && kongZhis.includes('丑')) hits.push('日柱' + p.gz.day + '逢丑空亡——"本分生來當受祿，因逢五鬼遂衰貧"（三命通会·论空亡，丑上鬼來克命）');
    return hits;
  }

  // ── 十二宫四贵四忌（三命通会 1409-1426："古以胎生旺库为四贵，死绝病败为四忌，余为四平，亦大概言之；生旺太过宜乎制伏，死绝不及宜乎生扶，妙在识其通变"）──
  function jipanSiGui(p) {
    const name = shiDiName(p.dayGan, p.gz.day[1]);
    if (!name) return [];
    const GUI = { '胎': 1, '长生': 1, '临官': 1, '帝旺': 1, '墓': 1 };
    const JI = { '死': 1, '绝': 1, '病': 1, '沐浴': 1 };
    const tag = GUI[name] ? '四贵' : JI[name] ? '四忌' : '四平';
    return [
      '日主' + p.dayGan + '坐日支' + p.gz.day[1] + '为' + name + '——古以胎生旺库为四贵，死绝病败为四忌，余为四平，此属' + tag + '（三命通会 1425，亦大概言之）',
      '注：见生旺未必便作吉，见休囚死绝未必便作凶；生旺太过宜乎制伏，死绝不及宜乎生扶，妙在识其通变（三命通会 1423-1425，活层）'
    ];
  }

  // ── 墓库根力（命理约言·十干生旺墓等位论 271："若是逢库，则阳为有根，而阴为无用；投库而必冲者，俗书之谬"）──
  function jipanKu(p) {
    const kuOf = { '甲': '未', '乙': '未', '丙': '戌', '丁': '戌', '戊': '辰', '己': '辰', '庚': '丑', '辛': '丑', '壬': '辰', '癸': '辰' };
    const ku = kuOf[p.dayGan];
    const zhi4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    if (zhi4.indexOf(ku) < 0) return [];
    const yang = ['甲', '丙', '戊', '庚', '壬'].indexOf(p.dayGan) >= 0;
    const hits = [];
    hits.push('日主' + p.dayGan + '五行墓库在' + ku + '（' + (zhi4.indexOf(ku) >= 0 ? '四柱见之' : '') + '）——' + (yang ? '阳干逢库为有根，其力有力' : '阴干逢库为无用，阴不能兼阳，其力不强') + '（命理约言·十干生旺墓等位论）');
    hits.push('投库而必冲者，俗书之谬也——逢库不必机械求冲（命理约言同篇）');
    return hits;
  }

  // ── 三命通会·卷末五行神煞（9149-9151）+ 财官太多身弱（9145-9148）──
  function jipanWuXingShenSha(p) {
    const hits = [];
    const wxC = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    for (const k of ['year', 'month', 'day', 'time']) wxC[WX[p.gz[k][0]]]++;
    for (const z of ['year', 'month', 'day', 'time']) { const zg = (D.zanggan || {})[p.gz[z][1]]; if (zg && zg.length) wxC[WX[zg[0]]]++; }
    const maxWx = Object.keys(wxC).reduce((a, b) => wxC[a] >= wxC[b] ? a : b);
    if (wxC[maxWx] >= 4) hits.push('五行' + maxWx + '最多（' + wxC[maxWx] + '处，干支藏干并计）——' + { '金': '金多夭折', '水': '水盛漂流', '木': '木旺则夭', '土': '土多痴呆', '火': '火多愚顽' }[maxWx] + '；太过不及作此论，一不可拘，二须敢断（三命通会·五行神煞 9149-9151，活层）');
    let qiang = 0;
    for (const z of ['year', 'month', 'day', 'time']) if (((D && D.zanggan && D.zanggan[p.gz[z][1]]) || []).indexOf(p.dayGan) >= 0) qiang += 2;
    const gan4 = ['year', 'month', 'time'].map(k => p.gz[k][0]);
    for (const g of gan4) { const s = shiShenOf(p.dayGan, g); if (s === '比肩' || s === '劫财' || s === '正印' || s === '偏印') qiang += 1; }
    if (qiang <= 2) {
      if ((p.dayGan === '丙' || p.dayGan === '丁') && (gan4.indexOf('庚') >= 0 || gan4.indexOf('辛') >= 0)) hits.push('丙丁日干，年月时见庚辛金且身弱——财官太多身弱，元犯七煞身轻：行酉运或庚辛年必死之断（三命通会 9145-9146）；若有救则吉，无救定凶');
      if ((p.dayGan === '甲' || p.dayGan === '乙') && gan4.filter(g => g === '庚' || g === '辛').length >= 2) hits.push('甲乙日干，庚辛月时夹杂且身弱——年运见庚辛必死之断（三命通会 9147）；若有救则吉，无救定凶');
    }
    return hits;
  }

  // ── 神峰通考·五行生克制化喜忌例（1302-1314）+ 天元一字歌（1690-1695）──
  function jipanWuXingXiJi(p) {
    const hits = [];
    const wxC = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    for (const k of ['year', 'month', 'day', 'time']) wxC[WX[p.gz[k][0]]]++;
    for (const z of ['year', 'month', 'day', 'time']) { const zg = (D.zanggan || {})[p.gz[z][1]]; if (zg && zg.length) wxC[WX[zg[0]]]++; }
    const me = WX[p.dayGan];
    const sheng = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' }[me];
    const keWo = { '金': '火', '水': '土', '木': '金', '火': '水', '土': '木' }[me];
    const woKe = { '金': '木', '水': '火', '木': '土', '火': '金', '土': '水' }[me];
    const shengWo = { '金': '土', '水': '金', '木': '水', '火': '木', '土': '火' }[me];
    const gan4 = ['year', 'month', 'time'].map(k => p.gz[k][0]);
    let qiang = 0;
    for (const z of ['year', 'month', 'day', 'time']) if (((D && D.zanggan && D.zanggan[p.gz[z][1]]) || []).indexOf(p.dayGan) >= 0) qiang += 2;
    for (const g of gan4) { const s = shiShenOf(p.dayGan, g); if (s === '比肩' || s === '劫财' || s === '正印' || s === '偏印') qiang += 1; }
    const strong = qiang >= 4, weak = qiang <= 2;
    const qi = { '金': '器皿', '木': '栋梁', '水': '池沼', '火': '相济', '土': '疏通' }[me];
    if (strong) hits.push('日主' + p.dayGan + '旺——' + me + '旺得' + keWo + '，方成' + qi + '；身旺遇官杀入格，纯粹不杂，运又不背，即至卿相之地（神峰通考·五行生克制化各有所喜忌例）');
    if (wxC[shengWo] >= 3) hits.push('生我之' + shengWo + '多（印绶太旺重叠）——' + { '金': '土多金埋', '水': '金多水浊', '木': '水多木漂', '火': '木多火炽', '土': '火多土焦' }[me] + '，身弱逢印太旺重叠即为所害（神峰通考同篇）');
    if (wxC[sheng] >= 3 && weak) hits.push('我生之' + sheng + '多（食伤重叠太旺）——' + { '金': '水多金沉', '水': '木盛水缩', '木': '火多木焚', '火': '土多火掩', '土': '金多土虚' }[me] + '，身弱伤官食神重叠故有所害；日强又比肩重则不忌（神峰通考同篇）');
    if (wxC[woKe] >= 3 && weak) hits.push('我克之' + woKe + '多（财太旺重叠）——' + { '金': '木坚金缺', '水': '火炎水干', '木': '土重木折', '火': '金多火息', '土': '水多土荡' }[me] + '，身弱逢财太旺返能相害；身强遇财入格局者即富贵（神峰通考同篇）');
    if (wxC[keWo] >= 2 && weak) hits.push('克我之' + keWo + '重（官杀剥杂太旺）——' + { '金': '金弱遇火必见销熔', '水': '水弱逢土必为淤塞', '木': '木弱逢金必为坎折', '火': '火弱逢水必见息灭', '土': '土弱逢木必遭倾陷' }[me] + '，必为残疾夭折贫贱（神峰通考同篇）');
    if (strong && wxC[sheng] >= 2) hits.push('强' + me + '得' + sheng + '泄化——' + { '金': '强金得水方挫其锋', '水': '强水得木方泄其势', '木': '强木得火方化其顽', '火': '强火得土方止其焰', '土': '强土得金方宣其滞' }[me] + '，身弱遇鬼得物以化则吉（神峰通考同篇）');
    if (gan4.every(g => g === p.dayGan)) hits.push('天元一字（四柱天干皆' + p.dayGan + '）——' + { '水': '天元一字水为源，生在秋冬妙莫言；大小吉神逢一位，少年云路必高迁', '土': '天元一字土为基，四季生时便是奇；辛酉二支为格局，聪明俊秀异常儿', '木': '天元一字木为根，传送登明显福元；四柱官星如得地，功名利禄好争先', '金': '天元一字若逢金，时日魁罡福气深；库位逢冲并带贵，平生德行贵人钦', '火': '天元一字火融融，大吉功曹时日冲；冲起财官为发用，生平富贵福兴隆' }[me] + '（神峰通考·天元一字歌）');
    return hits;
  }

  // ── 渊海子平·十神论喜忌条件句（144-403：伤官/食神/正财/偏财/正官/偏官七杀/印绶/倒食/阳刃，纯配置可判）──
  function jipanSsLun(p) {
    const hits = [];
    const gan4 = ['year', 'month', 'time'].map(k => p.gz[k][0]);
    const zhi4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const ss = gan4.map(g => shiShenOf(p.dayGan, g));
    const has = s => ss.indexOf(s) >= 0;
    const hasGuan = has('正官');
    let qiang = 0;
    for (const z of zhi4) if (((D && D.zanggan && D.zanggan[z]) || []).indexOf(p.dayGan) >= 0) qiang += 2;
    for (const g of gan4) { const s = shiShenOf(p.dayGan, g); if (s === '比肩' || s === '劫财' || s === '正印' || s === '偏印') qiang += 1; }
    const strong = qiang >= 4, weak = qiang <= 2;
    // 伤官
    if (has('伤官') && hasGuan) hits.push('柱透伤官又见正官——伤官见官，为祸百端；四柱有官被祸重，无官被祸浅（渊海子平·论伤官）');
    if (has('伤官') && !hasGuan) hits.push('柱透伤官而不见正官——伤官伤尽最为奇；用伤官格局见财方可用（渊海子平·论伤官）');
    if (has('伤官') && weak) hits.push('伤官身弱——忌官星，不怕七杀（渊海子平·伤官说）');
    if (has('伤官') && (has('正财') || has('偏财'))) hits.push('伤官见财——伤官生财，财行得地则发（渊海子平·论伤官）');
    if (has('伤官')) {
      const wx = WX[p.dayGan];
      if (wx === '火' || wx === '土') hits.push('火土伤官宜伤尽（渊海子平·论伤官歌）');
      if (wx === '金' || wx === '水') hits.push('金水伤官要见官（渊海子平·论伤官歌）');
    }
    // 食神
    if (has('食神') && hasGuan) hits.push('食神不喜见官星，恐伤其食神（渊海子平·论食神）');
    if (has('食神') && has('偏印')) hits.push('食神忌倒食（偏印），亦不喜印绶，恐伤其食神（渊海子平·论食神）');
    if (has('食神') && weak) hits.push('食神却喜身旺，不喜印绶（渊海子平·论食神）');
    if (has('食神') && has('七杀')) hits.push('食神居先杀居后衣禄无亏富贵厚；食神近杀却为殃（渊海子平·论食神）');
    // 正财
    if (has('正财') && hasGuan) hits.push('正财忌见官星，恐盗财之气（渊海子平·论正财）');
    if (has('正财') && weak) hits.push('财多身弱力不任财，祸患百出；财多生官要须身健（渊海子平·论正财）');
    if (has('正财') && strong) hits.push('身旺无劫财无官星为妙；正财喜身旺印绶（渊海子平·论正财）');
    if (has('正财') && (has('比肩') || has('劫财'))) hits.push('正财忌比肩劫财（渊海子平·论正财）');
    // 偏财
    if (has('偏财') && (has('比肩') || has('劫财'))) hits.push('偏财乃众人之财，只恐兄弟姊妹分夺，则福不全；怕空亡（渊海子平·论偏财）');
    if (has('偏财') && weak) hits.push('财盛身弱，运至官乡，防祸患（渊海子平·论偏财）');
    // 正官
    if (hasGuan && has('伤官')) hits.push('正官大忌伤官——官星被伤，行官运则灾连（渊海子平·正官论）');
    if (hasGuan && weak) hits.push('官星须得印绶身旺则发；正官大抵要身强（渊海子平·正官论）');
    const guanCount = ss.filter(s => s === '正官').length;
    if (hasGuan && guanCount >= 2) hits.push('正官多反不为福，宜得中和之气；官星要纯不要杂（渊海子平·正官论/官杀混杂论）');
    // 七杀
    const hasZhi = has('食神') || has('伤官');
    if (has('七杀') && hasZhi) hits.push('七杀有制伏则为偏官——喜身旺有制，运经制伏之乡大贵（渊海子平·论偏官/七杀）');
    if (has('七杀') && !hasZhi && weak) hits.push('七杀无制伏且身弱——身弱无制为七杀，祸不旋踵（渊海子平·论七杀）');
    if (has('七杀') && (has('正财') || has('偏财'))) hits.push('七杀忌见财，财能生杀；岁运临之身旺亦多灾（渊海子平·论七杀）');
    if (hasGuan && has('七杀')) hits.push('官杀混杂要制伏——官星要纯不要杂，混杂为杀，行制伏运则发福（渊海子平·论官杀混杂要制伏）');
    // 印绶/倒食
    if ((has('正印') || has('偏印')) && (has('正财') || has('偏财'))) hits.push('贪财坏印——印绶畏财，忌财旺破印；运若去财还作福（渊海子平·论印绶）');
    if ((has('正印') || has('偏印')) && hasGuan) hits.push('印绶喜官星生印，官印两全必为贵命（渊海子平·论印绶）');
    if ((has('正印') || has('偏印')) && strong) hits.push('印绶不宜身太旺，纵然无事也平常；除非元命多官杀（渊海子平·论印绶）');
    if (has('偏印') && (has('食神') || has('正财') || has('偏财'))) hits.push('倒食者吞啖煞——用财神大忌见之，用食神亦忌见之，主福浅寿薄（渊海子平·论倒食）');
    // 阳刃
    const yangGan = ['甲', '丙', '戊', '庚', '壬'].indexOf(p.dayGan) >= 0;
    const lu = { '甲': '寅', '丙': '巳', '戊': '巳', '庚': '申', '壬': '亥' }[p.dayGan];
    const ren = lu ? { '寅': '卯', '巳': '午', '申': '酉', '亥': '子' }[lu] : '';
    if (yangGan && ren && zhi4.indexOf(ren) >= 0) {
      hits.push('阳刃在' + ren + '——喜偏官七杀、喜印绶；忌反吟伏吟、忌魁罡、忌三合（渊海子平·论阳刃）');
      if (has('七杀')) hits.push('杀无刃不显，刃无杀不威——刃杀俱全非常人有之（渊海子平·论阳刃）');
      if (['戊戌', '庚辰', '庚戌', '壬辰'].indexOf(p.gz.day) >= 0) hits.push('阳刃见魁罡日为忌（渊海子平·论阳刃）');
    }
    return hits;
  }

  // ── 十神宜忌（命理探源 500-520，以日主强弱为纲）──
  function jipanSsYiji(p) {
    const SS = {
      '比肩': { qiang: '比肩要逢官煞制——日主太强，比劫叠出而伤食鲜见，必须官煞以制之', ruo: '日干无气遇劫为强——日主太弱而无印，官煞财伤甚重，籍劫财败财之赞助' },
      '食神': { qiang: '用之食神不可夺——日主太强赖食神盗泄精华，若见印绶夺之则坏', ruo: '食神最喜劫财乡——日主太弱，食神重重而财无印，籍劫财败财之赞助' },
      '伤官': { qiang: '伤官伤尽最为奇；伤官犹喜见财星——日主太强比劫重逢，赖伤官生财；伤官见官祸百端，用财化解', ruo: '伤官用印宜去财——日主太弱伤官叠出赖印绶生扶，见财则破印；伤官不怕比劫逢' },
      '正财': { qiang: '用之财星不可劫——日主太强赖财星为用，见比劫则财破；身强财旺皆为福，若带官星更妙', ruo: '日主无根财太重，全凭印绶护身躯；财旺者遇比何妨——日主太弱籍比劫之助；日主无根弃命从财' },
      '偏财': { qiang: '用之财星不可劫——日主太强赖财星为用，见比劫则财破', ruo: '日主无根财太重，全凭印绶护身躯；日主无根弃命从财' },
      '正官': { qiang: '用之正官不可伤；官轻见财为福利——日主太强官星轻，籍财生官', ruo: '有官有印无破作庙廊之材——日主太弱赖印绶生扶；重犯官星只宜制伏' },
      '七杀': { qiang: '身强煞浅假煞为权；煞轻者喜财生之', ruo: '煞重身轻制乡有益；身弱有印煞旺无妨；日主无根弃命从煞' },
      '正印': { qiang: '印多者行财而发——印绶多比劫众，必赖财星破印', ruo: '用之印绶不可破——日主太弱官煞重比劫轻，赖印绶生扶' },
      '偏印': { qiang: '印多者行财而发——印绶多比劫众，必赖财星破印', ruo: '用之印绶不可破——日主太弱官煞重比劫轻，赖印绶生扶' },
    };
    const hits = [];
    const gan4 = ['year', 'month', 'time'].map(k => p.gz[k][0]); // 年月时干（十神宜忌以日主对他干，日主不自算比劫）
    const zhi4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    let qiang = 0;
    for (const z of zhi4) if (((D && D.zanggan && D.zanggan[z]) || []).indexOf(p.dayGan) >= 0) qiang += 2;
    for (const g of gan4) { const s = shiShenOf(p.dayGan, g); if (s === '比肩' || s === '劫财' || s === '正印' || s === '偏印') qiang += 1; }
    const state = qiang >= 4 ? 'qiang' : qiang <= 2 ? 'ruo' : 'mid';
    const shenSet = new Set();
    for (const g of gan4) { const s = shiShenOf(p.dayGan, g); if (s && s !== '日主') shenSet.add(s); }
    for (const k of Object.keys(SS)) {
      if (shenSet.has(k)) {
        const line = SS[k][state] || SS[k].qiang;
        if (line) hits.push('柱透' + k + '——' + line + '（命理探源·' + k + '宜忌）');
      }
    }
    return { state: state === 'qiang' ? '身强' : state === 'ruo' ? '身弱' : '中和', hits };
  }

  // ── 征太岁（三命通会 1572-1608；命理约言 281 太岁论批"征太岁之说尤为不经，唯天克地冲间有不利"，两说并存）──
  function jipanZhengTaiSui(p, gender) {
    const hits = [];
    let curGz = '';
    try { curGz = Lunar.fromDate(new Date()).getYearInGanZhi(); } catch (e) { return hits; }
    if (!curGz) return hits;
    const curYear = new Date().getFullYear();
    const cg = curGz[0], cz = curGz[1];
    const dg = p.gz.day[0], dz = p.gz.day[1];
    const yg = p.gz.year[0], yz = p.gz.year[1];
    // 真太岁/转趾煞：生年干支同流年
    if (p.gz.year === curGz) hits.push('流年' + curGz + '与生年' + p.gz.year + '相同——真太岁/转趾煞：要大运日主与太岁相和相顺其年则吉；若值刑冲破害与太岁互相战克则凶（三命通会 1584）');
    // 征太岁：日干支冲克太岁 / 太岁冲日干支
    const gKe = (KE[WX[cg]] === WX[dg]);       // 流年干克日干（岁伤日）
    const gKe2 = (KE[WX[dg]] === WX[cg]);      // 日干克流年干（日犯岁君）
    const zChong = (CHONG[cz] === dz) || (CHONG[dz] === cz);
    if (gKe || gKe2 || zChong) {
      const parts = [];
      if (gKe) parts.push('岁干' + cg + '伤日干' + dg + '（岁伤日干，祸轻）');
      if (gKe2) parts.push('日干' + dg + '犯岁君' + cg + '（日犯岁君，灾殃必重——下凌上逆，五阳干重五阴干轻）');
      if (zChong) parts.push('日支' + dz + '与太岁支' + cz + (CHONG[dz] === cz ? '相冲' : '相冲') + '（太岁干支冲日干支亦曰征）');
      hits.push('流年' + curGz + '（' + curYear + '年）：日干支冲克太岁曰征——其年则凶，灾祸未免（三命通会 1587）。' + parts.join('；') + '；若五行有救（四柱/大运有制）、四柱有情（如' + dg + '所克之神被合）则凶为吉兆');
    }
    // 岁运并临：流年与大运干支同
    let yun = null;
    try { yun = p.ec.getYun(gender); } catch (e) { yun = null; }
    if (yun) {
      const dys = yun.getDaYun(9);
      for (let i = 1; i < dys.length; i++) {
        if (dys[i].getGanZhi() === curGz) hits.push('流年' + curGz + '与第' + i + '步大运相同——岁运并临：独羊刃七杀为凶，财官印绶亦吉（三命通会 1589）');
      }
    }
    // 日年相并
    if (p.gz.day === curGz) hits.push('流年' + curGz + '与日柱相同——日年相并，君臣处会：君子利奏对面君之喜，常人遇之最不善，生时相和灾稍轻（三命通会 1590）');
    return hits;
  }

  // ── 日贵四日（命理约言·贵人论 287："日贵格只丁酉丁亥癸卯癸巳四日，亦助吉之一端，不可遽言格"）──
  function jipanRiGui(p) {
    const riGui = ['丁酉', '丁亥', '癸卯', '癸巳'];
    if (riGui.indexOf(p.gz.day) < 0) return [];
    return ['日柱' + p.gz.day + '为日贵格四日之一——贵人助吉之一端（命理约言·贵人论）；但不可遽言格，须全观四柱（若干头见煞、巳午逢冲、煞刃相济等另论）'];
  }

  // ── 驿马状态（命理约言·驿马论 290-291）──
  function jipanMa(p) {
    const hits = [];
    const zhi4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const maZhis = [];
    for (const base of [p.gz.year[1], p.gz.day[1]]) {
      const g2 = SANHE.find(s => s.group.indexOf(base) >= 0);
      if (g2) maZhis.push(g2.ma);
    }
    const maHit = Array.from(new Set(maZhis.filter(z => zhi4.indexOf(z) >= 0)));
    for (const z of maHit) {
      const others = zhi4.filter(x => x !== z);
      const he = others.find(x => LIUHE[z] === x);
      const sanhe = SANHE.some(s => s.group.indexOf(z) >= 0 && s.group.filter(x => x !== z && others.indexOf(x) >= 0).length >= 1);
      const chong = others.find(x => CHONG[z] === x);
      const col = ['year', 'month', 'day', 'time'].filter(k => p.gz[k][1] === z).map(k => COL_LBL[k]).join('');
      if (chong) hits.push(col + '支' + z + '为驿马逢' + chong + '冲——譬如加鞭，动之甚（命理约言·驿马论）');
      else if (he || sanhe) hits.push(col + '支' + z + '为驿马逢' + (he ? '六合' : '三合') + '——等于系足，马被绊住（命理约言·驿马论）');
      else hits.push(col + '支' + z + '为驿马——吉神为马则超迁顺动之利，凶神为马则奔蹶驰逐之劳（命理约言·驿马论）');
    }
    if (maZhis.indexOf(p.gz.day[1]) >= 0) hits.push('日支' + p.gz.day[1] + '坐驿马——日干坐马多动（命理约言·驿马论）');
    return hits;
  }

  // ── 天月二德·月将（命理约言 284-289）──
  function jipanErDe(p) {
    const hits = [];
    const gan4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const zhi4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const ssG = g => shiShenOf(p.dayGan, g);
    // 天德干（四仲月乾坤艮巽无干——命理约言 284："四仲之月不论天德"）
    const tianDe = { '寅': '丁', '卯': '', '辰': '壬', '巳': '辛', '午': '', '未': '甲', '申': '癸', '酉': '', '戌': '丙', '亥': '乙', '子': '', '丑': '庚' };
    // 月德干（三合局旺干）
    const yueDe = { '寅': '丙', '午': '丙', '戌': '丙', '申': '壬', '子': '壬', '辰': '壬', '亥': '甲', '卯': '甲', '未': '甲', '巳': '庚', '酉': '庚', '丑': '庚' };
    const td = tianDe[p.monthZhi], yd = yueDe[p.monthZhi];
    const tdHit = td && gan4.filter(g => g === td).length;
    const ydHit = yd && gan4.filter(g => g === yd).length;
    if (tdHit) {
      const s = ssG(td);
      hits.push('天德' + td + '透干（月' + p.monthZhi + '月天德在' + td + '）——临' + s + '：' + (['正官', '正财', '偏财', '正印', '食神'].indexOf(s) >= 0 ? '福力倍增' : ['七杀', '伤官', '偏印', '劫财'].indexOf(s) >= 0 ? '暴横亦化' : '吉者增吉，凶者减凶') + '；二德自造行冲则无力（命理约言·天月二德论）');
    }
    if (ydHit) {
      const s = ssG(yd);
      hits.push('月德' + yd + '透干（月' + p.monthZhi + '月月德在' + yd + '）——临' + s + '：' + (['正官', '正财', '偏财', '正印', '食神'].indexOf(s) >= 0 ? '福力倍增' : ['七杀', '伤官', '偏印', '劫财'].indexOf(s) >= 0 ? '暴横亦化' : '吉者增吉，凶者减凶') + '；多多益善（命理约言·天月二德论）');
    }
    // 月将：每月中气后太阳躔次（命理约言·月将论 289：正月雨水后二月春分前地支得亥）
    const yueJiang = ZHI[(ZHI.indexOf(p.monthZhi) + 9) % 12];
    const jCols = ['year', 'month', 'day', 'time'].filter(k => p.gz[k][1] === yueJiang);
    if (jCols.length) {
      const zs = jCols.map(k => p.gz[k][1]);
      const ssB = (D.zanggan[yueJiang] || [])[0];
      const s2 = ssB ? ssG(ssB) : '';
      const inKong = (p.dayKongZhi || []).indexOf(yueJiang) >= 0;
      hits.push('月将（太阳躔次）= ' + yueJiang + '，' + jCols.map(k => COL_LBL[k] + '支见').join('') + yueJiang + '——太阳所临，吉增凶散：系吉神（本气' + s2 + '）则益吉，系凶神则减凶' + (inKong ? '；即值空亡亦不可以空论（太阳为诸曜之主，管三旬之事）' : '') + '（命理约言·月将论）');
    }
    return hits;
  }

  // ── 六X日财官喜忌（三命通会 2934-3091，十干各一组模板）──
  function jipanLiuxiri(p) {
    const L = (D && D.liuxiri) || [];
    const g = L.find(x => x.gan === p.dayGan);
    if (!g) return { hits: [], g: null };
    const hits = [];
    const gans = ['year', 'month', 'time'].map(k => p.gz[k][0]); // 年月时干
    const monthWx = WX[p.monthZhi] || '';
    // 魁罡日
    if (g.kui && g.kui.includes(p.gz.day)) hits.push('日柱' + p.gz.day + '为魁罡日——财官喜忌单论，不入本表');
    // 得局/无气局（月支五行）
    const juMap = {
      '三秋四季及金土局': ['金', '土'], '秋冬金水局': ['金', '水'], '春冬水木局': ['水', '木'],
      '春夏及火木局': ['火', '木'], '春夏火木局': ['火', '木'], '九夏四季火土局': ['火', '土'],
    };
    const juHit = (juMap[g.ju] || []).includes(monthWx);
    const wuqiHit = (juMap[g.wuqi] || []).includes(monthWx);
    const touHit = g.tou.filter(t => gans.includes(t));
    if (touHit.length) hits.push('年月时干透' + touHit.join('、') + '，生' + g.ju + '——财官有用');
    else if (juHit) hits.push('不透财官字，但生' + g.ju + '——亦作财官论');
    else if (wuqiHit) hits.push('生' + g.wuqi + '——财官无气，纵得滋助亦轻');
    // 夺财/伤官
    const duoHit = g.duo.filter(x => gans.includes(x));
    const sgHit = g.sg.filter(x => gans.includes(x));
    if (duoHit.length && sgHit.length) hits.push('见' + duoHit.join('') + '夺财、' + sgHit.join('') + '伤官——名利艰难');
    else if (duoHit.length) hits.push('见' + duoHit.join('') + '夺财——财被争夺');
    else if (sgHit.length) hits.push('见' + sgHit.join('') + '伤官——名利艰难');
    // 官煞混杂
    const hasZg = gans.includes(g.zgc), hasPg = gans.includes(g.pgc);
    if (hasZg && hasPg) hits.push('官煞混杂（' + g.zgc + '官' + g.pgc + '煞俱见），无去留制伏——反主贫贱');
    else if (hasPg && !hasZg) hits.push('偏官独见无制——作鬼论；制伏得中作偏官，太过反不为福（制伏属活层权衡）');
    else if (hasZg && !hasPg) hits.push('透正官' + g.zgc + '，无煞混杂——得官之象');
    if (!hits.length) hits.push('未触发明确断句（透出/得局/夺财/伤官/官煞混杂均未命中）');
    return { hits, g, touHit, juHit };
  }

  // ── 渊海子平·外格成格检测（WAIGE 47 项，机判命中绿字；忌句原文灰字）──
  function detectWaiGe(p) {
    const W = (D && D.waige) || [];
    const byName = {};
    W.forEach(x => { byName[x.name] = x; });
    const hit = [];
    const add = n => { if (byName[n]) hit.push(byName[n]); };
    const gan4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const zhi4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const G = p.dayGan;
    const ssG = g => shiShenOf(G, g);
    const ssBen = z => { const a = ((D && D.zanggan && D.zanggan[z]) || []); return a.length ? shiShenOf(G, a[0]) : ''; };
    const cntG = x => gan4.filter(v => v === x).length;
    const cntZ = x => zhi4.filter(v => v === x).length;
    const hasZ = x => zhi4.indexOf(x) >= 0;
    const zhiAll = zs => zs.every(z => hasZ(z));
    const sanheWx = () => { for (const s of SANHE) if (s.group.every(z => hasZ(z))) return WX[s.group[0]]; return ''; };
    const pair = (a, b) => p.gz[a] + p.gz[b];
    const ty = taiYuan(p.monthGan, p.monthZhi);
    const tyWx = WX[ty[1]] || '';
    const genRoot = () => { // 日干四支有根（藏干含日干）
      for (const z of zhi4) { const a = (D.zanggan[z] || []); if (a.indexOf(G) >= 0) return true; }
      return false;
    };
    const shiZhiSet = () => { const s = new Set(); for (const z of zhi4) s.add(ssBen(z)); return s; };
    // 内十八格
    if (ssBen(p.monthZhi) === '七杀') add('月上偏官格');
    if ((ssG(p.gz.time[0]) === '偏财' || ssBen(p.gz.time[1]) === '偏财') && !['year', 'month', 'day'].some(k => ssG(p.gz[k][0]) === '偏财')) add('时上偏财格');
    if ((ssG(p.gz.time[0]) === '七杀' || ssBen(p.gz.time[1]) === '七杀') && !['year', 'month', 'day'].some(k => ssG(p.gz[k][0]) === '七杀')) add('时上一位贵');
    if (ssBen(p.monthZhi) === '正官' || ssG(p.monthGan) === '正官') add('正官格');
    if (['辰', '戌', '丑', '未'].indexOf(p.monthZhi) >= 0 && gan4.some(g => ['正财', '偏财', '正官', '七杀', '正印', '偏印'].indexOf(ssG(g)) >= 0)) add('杂气财官格');
    if (ssBen(p.monthZhi) === '正印' || ssBen(p.monthZhi) === '偏印' || ssG(p.monthGan) === '正印' || ssG(p.monthGan) === '偏印') add('印绶格');
    if (['辰', '戌', '丑', '未'].indexOf(p.monthZhi) >= 0 && gan4.some(g => ssG(g) === '正印' || ssG(g) === '偏印')) add('杂气印绶格');
    if (G === '戊' && p.gz.time === '庚申') add('合禄格');
    if (G === '癸' && p.gz.time === '庚申') add('合禄格又格');
    if (LU[G] && p.gz.time[1] === LU[G] && !gan4.some(g => ssG(g) === '正官' || ssG(g) === '七杀')) add('归禄格');
    if (['丁巳丁未', '己未己巳', '戊辰戊午', '癸丑癸亥', '癸亥癸丑'].indexOf(p.gz.day + p.gz.time) >= 0) add('拱禄格');
    if (['甲寅甲子', '壬子壬寅', '甲申甲戌', '戊申戊午', '乙未乙酉', '辛丑辛卯'].indexOf(p.gz.day + p.gz.time) >= 0) add('拱贵格');
    if (G === '乙' && p.gz.time[1] === '子') { add('乙巳鼠贵格'); add('六乙鼠贵格'); }
    if (G === '庚' && zhiAll(['申', '子', '辰'])) add('井栏叉格');
    if (['庚', '壬'].indexOf(G) >= 0 && cntZ('子') >= 2 && (hasZ('寅') || hasZ('未') || hasZ('戌'))) add('飞天禄马格');
    if (['辛', '癸'].indexOf(G) >= 0 && cntZ('亥') >= 2 && (hasZ('申') || hasZ('酉') || hasZ('丑'))) add('飞天禄马格又格');
    if (G === '辛' && p.gz.time[1] === '子') add('六陰朝陽格');
    if (G === '壬' && (cntZ('辰') >= 1 || cntZ('寅') >= 1)) add('壬骑龙背格');
    if (G === '癸' && p.gz.time === '甲寅') add('刑合格');
    if (G === '甲' && p.gz.day === '甲子' && p.gz.time === '甲子') add('子遥巳格');
    if (['辛', '癸'].indexOf(G) >= 0 && ['丑'].indexOf(p.gz.day[1]) >= 0 && cntZ('丑') >= 1) add('丑遥巳格');
    if (G === '丙' && cntZ('午') >= 2) add('倒冲格');
    if (G === '丁' && cntZ('巳') >= 2) add('倒冲格又格');
    // 外十八格
    if (G === '甲' && cntZ('亥') >= 2) add('六甲趋干格');
    if (G === '壬' && cntZ('寅') >= 2) add('六壬趋艮格');
    if (['甲', '乙'].indexOf(G) >= 0 && (zhiAll(['寅', '卯', '辰']) || sanheWx() === '木') && !gan4.some(g => g === '庚' || g === '辛')) add('曲直格');
    if (['丙', '丁'].indexOf(G) >= 0 && (zhiAll(['寅', '午', '戌']) || zhiAll(['巳', '午', '未']))) add('炎上格');
    if (['戊', '己'].indexOf(G) >= 0 && zhiAll(['辰', '戌', '丑', '未'])) add('稼穑格');
    if (['庚', '辛'].indexOf(G) >= 0 && (zhiAll(['巳', '酉', '丑']) || zhiAll(['申', '酉', '戌']))) add('从革格');
    if (['壬', '癸'].indexOf(G) >= 0 && (zhiAll(['申', '子', '辰']) || zhiAll(['亥', '子', '丑']))) add('润下格');
    if (['戊', '己'].indexOf(G) >= 0 && ['戊寅', '戊子', '戊申', '己卯', '己亥', '己未'].indexOf(p.gz.day) >= 0) add('勾陈得位格');
    if (['壬', '癸'].indexOf(G) >= 0 && ['壬寅', '壬午', '壬戌', '癸巳', '癸未', '癸丑'].indexOf(p.gz.day) >= 0) add('玄武当权格');
    if ((cntG('乙') === 3 && zhiAll(['巳', '酉', '丑'])) || ['丙子', '壬子', '辛卯', '丁酉'].indexOf(p.gz.day) >= 0) add('日德秀气格');
    if (['乙', '丁', '己', '辛', '癸'].indexOf(G) >= 0 && ['巳', '酉', '丑'].indexOf(p.gz.day[1]) >= 0 && zhiAll(['巳', '酉', '丑'])) add('福德格');
    if (G === '乙' && zhiAll(['寅', '午', '戌'])) add('伤官生财格');
    if (['甲', '乙'].indexOf(G) >= 0 && zhiAll(['寅', '午', '戌']) && gan4.some(g => g === '庚' || g === '辛')) add('伤官带杀格');
    if (ssG(p.gz.year[0]) === '正财' || ssG(p.gz.year[0]) === '偏财') add('岁德扶财格');
    if (ssG(p.gz.year[0]) === '七杀') add('岁德扶杀格');
    const noRoot = !genRoot();
    const wxCnt = {}; zhi4.forEach(z => { const w = WX[z]; wxCnt[w] = (wxCnt[w] || 0) + 1; });
    const maxWx = Object.keys(wxCnt).sort((a, b) => wxCnt[b] - wxCnt[a])[0];
    if (noRoot && (['正财', '偏财'].indexOf(ssBen(p.monthZhi)) >= 0 || (wxCnt[maxWx] >= 3 && maxWx === '土'))) add('弃命从财格');
    if (noRoot && sanheWx() === '金' && !gan4.some(g => ssG(g) === '食神' || ssG(g) === '伤官')) add('弃命从杀格');
    if (['甲寅甲子', '乙卯丁巳', '甲午壬申', '癸酉癸亥'].indexOf(p.gz.day + p.gz.time) >= 0) add('夹丘格');
    if (new Set(gan4).size === 2 && (cntG(gan4[0]) === 2)) add('两干不杂格');
    {
      const w5 = new Set([tyWx, WX[p.gz.year[1]], WX[p.gz.month[1]], WX[p.gz.day[1]], WX[p.gz.time[1]]]);
      if (w5.size >= 5) add('五行俱足格');
    }
    // 化气/时墓/福德秀气/杂气
    const heGan = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
    if (heGan[G] && gan4.some(g => g === heGan[G])) add('化气十段锦');
    { const mu = { '木': '未', '火': '戌', '土': '戌', '金': '丑', '水': '辰' }; const zw = WX[G];
      if (mu[zw] && p.gz.time[1] === mu[zw] && (ssBen(p.gz.time[1]) === '正财' || ssBen(p.gz.time[1]) === '偏财' || ssBen(p.gz.time[1]) === '正官' || ssBen(p.gz.time[1]) === '七杀')) add('论时墓'); }
    if (['乙巳', '乙酉', '乙丑', '丁巳', '丁酉', '丁丑', '己巳', '己酉', '己丑', '癸巳', '癸酉', '癸丑'].indexOf(p.gz.day) >= 0) add('论福德秀气');
    if (['辰', '戌', '丑', '未'].indexOf(p.monthZhi) >= 0 && !gan4.some(g => ['正财', '偏财', '正官', '七杀', '正印', '偏印'].indexOf(ssG(g)) >= 0)) add('论杂气');
    return hit;
  }

  function daYunInfo(p, gender) {
    try {
      const yun = p.ec.getYun(gender);
      const dys = yun.getDaYun(9); // index 0 = 未起运
      const list = [];
      for (let i = 1; i < dys.length; i++) {
        const dy = dys[i];
        const dyGz = dy.getGanZhi();
        const lns = dy.getLiuNian(10).map(ln => ({ year: ln.getYear(), age: ln.getAge(), gz: ln.getGanZhi(), gx: jipanGx(ln.getGanZhi(), p, { isDayun: false, dayunGz: dyGz }) }));
        list.push({ idx: i, gz: dyGz, startYear: dy.getStartYear(), startAge: dy.getStartAge(), endYear: dy.getEndYear(), lns, gx: jipanGx(dyGz, p, { isDayun: true }) });
      }
      return { forward: yun.isForward(), startAge: dys[0] ? 0 : 0, list };
    } catch (e) {
      return { error: e.message, list: [] };
    }
  }

  // ── 断语机判 ──
  function duanYuHits(p, focus) {
    const out = { jinyang: null, ti: null, hezhi: [], cat: [], ge: null, fu20: [] };
    // 金不换（月令大运宜忌）
    if (D.yue_ling && D.yue_ling[p.dayGan] && D.yue_ling[p.dayGan][p.monthZhi]) {
      out.jinyang = D.yue_ling[p.dayGan][p.monthZhi];
    } else if (D.yue_ling && D.yue_ling[p.dayGan]) {
      out.jinyang = D.yue_ling[p.dayGan]['子'] ? null : '（原书缺' + p.dayGan + '日' + p.monthZhi + '月条）';
    }
    // 干支体象
    if (D.gan_ti && D.gan_ti[p.dayGan]) out.ti = D.gan_ti[p.dayGan];
    if (D.zhi_ti && D.zhi_ti[p.gz.day[1]]) out.zhiTi = D.zhi_ti[p.gz.day[1]];
    // 何知章（8项，标注综合判定）
    if (D.hezhi) for (const k of Object.keys(D.hezhi)) out.hezhi.push({ key: k, four: D.hezhi[k].four, yuanzhu: D.hezhi[k].yuanzhu });
    // 断语12类：按关注类输出 + 关键词命中标记
    if (D.duanyu12 && focus) {
      const cat = D.duanyu12.find(c => c.cat === focus);
      if (cat) {
        const hitNames = shenSha(p, 1).map(h => h.name).concat([geJu(p, '').ge, '比劫', '正印', '偏印', '食神', '伤官', '正官', '七杀', '正财', '偏财']);
        for (const it of cat.items) {
          let tag = 'ref';
          for (const nm of hitNames) {
            if (nm && it.text.includes(nm)) { tag = 'hit'; break; }
          }
          out.cat.push({ text: it.text, sub: it.sub || null, tag });
        }
      }
    }
    // 时断（六X日Y時斷：按日干+时柱精确查，原文歌诀+详注）
    if (D.shishizhen && D.shishizhen[p.dayGan] && D.shishizhen[p.dayGan][p.gz.time]) {
      out.shishi = D.shishizhen[p.dayGan][p.gz.time];
    }
    // 十二月支得日干吉凶（按月支查 5 组）
    if (D.shier_yueji && D.shier_yueji[p.monthZhi]) out.yueji = D.shier_yueji[p.monthZhi];
    // 十干宜忌（命理探源·滴天髓十干）
    if (D.gan_yiji && D.gan_yiji[p.dayGan]) out.ganyiji = D.gan_yiji[p.dayGan];
    // 调候（日干五行 × 生月季节，穷通宝鉴式）
    const SEASON = { '寅': '春', '卯': '春', '辰': '春', '巳': '夏', '午': '夏', '未': '夏', '申': '秋', '酉': '秋', '戌': '秋', '亥': '冬', '子': '冬', '丑': '冬' };
    const season = SEASON[p.monthZhi];
    const dw = WX[p.dayGan];
    if (D.tiaohou && D.tiaohou[dw] && D.tiaohou[dw][season]) out.tiaohou = { wx: dw, season: season, text: D.tiaohou[dw][season] };
    // 日主五行宜忌提纲
    if (D.yiji_zonggang && D.yiji_zonggang[dw]) out.zonggang = { wx: dw, text: D.yiji_zonggang[dw] };
    // 八格喜忌
    const gj = geJu(p, '');
    if (D.ge_xiyi_builtin && D.ge_xiyi_builtin[gj.ge]) out.ge = { ge: gj.ge, text: D.ge_xiyi_builtin[gj.ge] };
    // 赋20篇（备查）
    if (D.fu20) out.fu20 = D.fu20.slice(0, 20);
    return out;
  }

  // ── 小限（命理探源法：生年支加临命宫逆数至流年岁支；干以流年干五虎遁）──
  function xiaoXian(p) {
    try {
      const now = Lunar.fromDate(new Date());
      const liuGz = now.getYearInGanZhi ? now.getYearInGanZhi() : '';
      if (!liuGz || liuGz.length < 2) return null;
      const mgZhi = mingGongZhi(p.monthZhi, p.gz.time[1]);
      const yIdx = ZHI.indexOf(p.gz.year[1]);
      const lIdx = ZHI.indexOf(liuGz[1]);
      const step = ((lIdx - yIdx) % 12 + 12) % 12; // 生年支顺数至流年支步数
      const xz = ZHI[((ZHI.indexOf(mgZhi) - step) % 12 + 12) % 12];
      const startGan = WUHU[liuGz[0]];
      const xg = GAN[(GAN.indexOf(startGan) + ((ZHI.indexOf(xz) - 2 + 12) % 12)) % 10];
      return { liu: liuGz, limit: xg + xz, mg: mgZhi, step: step };
    } catch (e) { return null; }
  }

  // ── UI 输出 ──
  // ── 半规则·选项法机判（用户先选喜用/忌神/身强弱，选后触发原文条件断语；口径：十神透干计数，定性原文作近似提示，不假装定论）──
  function tenShenCounts(p) {
    const c = { '正印': 0, '偏印': 0, '正官': 0, '七杀': 0, '正财': 0, '偏财': 0, '食神': 0, '伤官': 0, '比肩': 0, '劫财': 0 };
    for (const k of ['year', 'month', 'day', 'time']) {
      const s = p.ssGan[k];
      if (s && c[s] !== undefined) c[s]++;
    }
    return c;
  }
  // 大运流年喜忌（命理探源 560"盖大运重地支" / 568"看喜行何运，忌行何运" / 565"太岁值用神，则反有益"；567"太岁重天干"）
  function jipanXiJi(p, dy, xi, ji) {
    const hits = [];
    if (!xi && !ji) return hits;
    const ganWx = (gz) => WX[gz[0]], zhiWx = (gz) => WX[gz[1]];
    if (xi || ji) {
      const mk = (w) => (w === xi ? '喜用' : (w === ji ? '忌神' : null));
      for (const d of dy.list) {
        const tag = mk(zhiWx(d.gz));
        if (tag) hits.push(d.gz + '运（' + d.startYear + '起）：地支属' + zhiWx(d.gz) + '，为' + tag + '——' + (tag === '喜用' ? '行运得所，益用神，吉（命理探源 560）' : '行忌神之运，损用神，凶（命理探源 560"反是则凶"）'));
      }
      // 流年：太岁重天干
      const yiLns = [];
      for (const d of dy.list) for (const ln of d.lns) {
        const tag = mk(ganWx(ln.gz));
        if (tag) yiLns.push(ln.year + '年' + ln.gz + '（天干属' + ganWx(ln.gz) + '为' + tag + '，' + (tag === '喜用' ? '太岁值用神，反有益' : '太岁值忌神，主不顺') + '，命理探源 565）');
      }
      if (yiLns.length) hits.push('流年喜忌：' + yiLns.slice(0, 15).join('；') + (yiLns.length > 15 ? '…' : ''));
    }
    // 岁运战冲和好（命理探源 570-578，依赖喜用 xi；战=运岁干相克、冲=运岁支相冲、和=运岁干支五合六合、好=运岁干支比和；吉凶视喜用）
    if (xi) {
      const KE_WO = { '木': '金', '土': '木', '水': '土', '火': '水', '金': '火' }; // 克我者
      const HE_GAN = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
      const HE_ZHI = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
      const rows = [];
      for (const d of dy.list) {
        for (const ln of d.lns) {
          const yg = d.gz[0], yz = d.gz[1], lg = ln.gz[0], lz = ln.gz[1];
          const tags = [], notes = [];
          const ygWx = WX[yg], lgWx = WX[lg];
          if (KE_WO[lgWx] === ygWx) { tags.push('战（运伐岁）'); notes.push('运干' + yg + '克岁干' + lg + '（571"丙运庚年，谓之运伐岁"）：' + (lgWx === xi ? '岁干为喜用被伐，凶' : ygWx === xi ? '运干为喜用，岁不降运，得和神为妙' : '非喜忌，视局中他神和之')); }
          else if (KE_WO[ygWx] === lgWx) { tags.push('战（岁伐运）'); notes.push('岁干' + lg + '克运干' + yg + '（571"庚运丙年，谓之岁伐运"）：' + (ygWx === xi ? '运干为喜用被伐，凶' : lgWx === xi ? '岁干为喜用，运不降岁' : '非喜忌，视局中他神和之')); }
          if (CHONG[yz] === lz) { tags.push('冲'); notes.push('运支' + yz + '冲岁支' + lz + '（573"子运午年，谓之运冲岁"）：' + (lz === xi ? '岁支为喜用被冲，凶' : yz === xi ? '运支为喜用，岁冲运，视党助多寡' : '非喜忌，视局中党助')); }
          if (HE_GAN[yg] === lg) { tags.push('和'); notes.push('运岁天干' + yg + lg + '相合（576"乙运庚年…则和"）：' + (WX[lg] === xi ? '合中' + lg + '为喜用，吉' : WX[yg] === xi ? '合中' + yg + '为喜用，原文以"喜木则不吉"例之，视强弱' : '双方非喜用，不专断吉凶')); }
          if (HE_ZHI[yz] === lz) { tags.push('和'); notes.push('运岁地支' + yz + lz + '六合（576"子运丑年…喜土则吉"）：' + (WX[lz] === xi || WX[yz] === xi ? '合支带喜用，吉' : '合支非喜用，不专断吉凶')); }
          if (ygWx === lgWx && WX[yz] === WX[lz]) { tags.push('好'); notes.push('运岁干支比和（578"庚运辛年…则好"）：' + (ygWx === xi ? '比和为喜用，吉' : '比和为忌神，不吉')); }
          if (tags.length) rows.push(ln.year + '年' + ln.gz + '（运' + d.gz + '）：' + tags.join('+') + '——' + notes.join('；'));
        }
      }
      if (rows.length) {
        hits.push('岁运战冲和好（命理探源 570-578，喜用' + xi + '）');
        for (const r of rows.slice(0, 25)) hits.push(r);
        if (rows.length > 25) hits.push('…（共' + rows.length + '年命中，可逐年核对；战冲视孰降、和好视孰切，喜用定吉凶）');
      }
    }
    return hits;
  }
  // 六亲星机判（渊海子平·六亲总篇/论父/论母/论兄弟/论子息 470-509）
  function jipanLiuQin(p, cs) {
    const hits = [];
    const hasYin = cs['正印'] + cs['偏印'] > 0, hasCai = cs['正财'] + cs['偏财'] > 0;
    const hasBi = cs['比肩'] + cs['劫财'] > 0, hasGuan = cs['正官'] + cs['七杀'] > 0;
    const hasShi = cs['食神'] + cs['伤官'] > 0;
    if (hasYin && hasCai) hits.push('印绶见财——克母及祖母也（渊海子平·六亲总篇）');
    if (hasBi && hasCai) hits.push('见比劫阳刃，克妻妾及父也（渊海子平·六亲总篇）');
    if (cs['正官'] + cs['七杀'] >= 2) hits.push('官杀多者，难为兄弟（渊海子平·六亲总篇）');
    if (cs['食神'] + cs['伤官'] >= 2) hits.push('伤官食神多，难为子息（渊海子平·六亲总篇）');
    // 偏财=父（渊海 486"偏财是父"）：偏财所坐支逢冲/死绝 → 克父（487）
    for (const k of ['year', 'month', 'day', 'time']) {
      if (p.ssGan[k] !== '偏财') continue;
      const z = p.gz[k][1];
      const chonged = ['year', 'month', 'day', 'time'].some(k2 => k2 !== k && CHONG[p.gz[k2][1]] === z);
      if (chonged) hits.push('偏财（父星）坐' + z + '被冲——临死绝冲刑之地，主克父；不然主离异不睦、或疾病残伤（渊海子平·论父 487）');
      const chang = shiDiName(p.gz[k][0], z);
      if (['死', '绝', '墓'].includes(chang)) hits.push('偏财（父星）坐' + z + '为' + chang + '地——居衰败受制、墓绝之地，主父平常，不得父力也（渊海子平·论父 491）');
    }
    // 正印=母 / 偏印=偏母（渊海 493"正印者，乃生我之身也"、472"偏印偏母及祖父也"）：坐阳刃/墓绝 → 母不贤（498）
    for (const k of ['year', 'month', 'day', 'time']) {
      const s = p.ssGan[k];
      if (s !== '正印' && s !== '偏印') continue;
      const z = p.gz[k][1];
      const chang = shiDiName(p.gz[k][0], z);
      const yangRen = YANG_REN[p.dayGan] === z;
      if (['死', '绝', '墓'].includes(chang) || yangRen) hits.push((s === '正印' ? '正印' : '偏印') + '（' + (s === '正印' ? '母' : '偏母') + '星）坐' + z + (yangRen ? '临阳刃' : '为' + chang + '地') + '——主母不贤或有残疾不睦（渊海子平·论母 498）');
    }
    return hits;
  }
  // 夫妻断语树（滴天髓 1052-1063 任铁樵：财星轻重×身强弱×比劫官杀食伤印，原文条件句）
  function jipanFuQi(p, cs, xi, sq) {
    const hits = [];
    const cai = cs['正财'] + cs['偏财'], bi = cs['比肩'] + cs['劫财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    if (!sq && !xi) return hits;
    if (cai <= 1 && guan === 0 && bi >= 2) hits.push('财神轻而无官，比劫多——主克妻（滴天髓 1053）');
    if (cai >= 2 && sq === '身弱' && bi === 0) hits.push('财神重而身弱，无比劫——主克妻（滴天髓 1054）');
    if (guan >= 2 && yin > 0 && cai > 0) hits.push('官杀旺而用印，见财星——主妻陋而克（滴天髓 1055）');
    if (guan <= 1 && sq === '身强' && cai > 0 && bi > 0) hits.push('官杀轻而身旺，见财星，遇比劫——主妻美而克（滴天髓 1056）');
    if (bi >= 2 && cai <= 1 && shi > 0 && cs['偏印'] > 0) hits.push('劫刃重，财星轻，有食伤，逢枭印——主妻遭凶死（滴天髓 1057）');
    if (cai <= 1 && guan >= 2 && shi === 0 && yin > 0) hits.push('财星微，官杀旺，无食伤，有印绶——主妻有弱病（滴天髓 1058）');
    if (guan <= 1 && cai > 0) hits.push('官星弱，遇财星——妻陋不克（滴天髓 1060）');
    // 日主坐财（滴天髓 1063）：日支本气十神为财（正财/偏财），且该财星五行为喜用 → 必得妻财
    {
      const dayZhiMainShen = (p.ssZhi && p.ssZhi.day && p.ssZhi.day[0]) || '';
      const dayZhiWx = WX[p.gz.day[1]];
      if (xi && ['正财', '偏财'].includes(dayZhiMainShen) && dayZhiWx === xi) hits.push('日主坐财（日支' + p.gz.day[1] + '本气' + dayZhiMainShen + '，属' + dayZhiWx + '为喜用）——必得妻财（滴天髓 1063"日主坐财，财为喜用者，必得妻财"）');
    }
    // 喜神傍天财（滴天髓 1046-1047：喜神有意傍天财，喜神即是财神其妻美且富贵；喜神与财神不相妒忌亦好，否则克妻）
    if (xi) {
      const caiWx = ['正财', '偏财'].map(s => { const k = Object.keys(p.ssGan).find(kk => p.ssGan[kk] === s); return k ? WX[p.gz[k][0]] : null; }).filter(Boolean);
      if (caiWx.length && caiWx.includes(xi)) hits.push('喜神' + xi + '与财星相傍——喜神即财神，其妻美而且富贵（滴天髓 1046-1047"喜神有意傍天财"）');
      else if (caiWx.length) hits.push('喜神' + xi + '与财星（' + caiWx.join('/') + '）不相合——喜神与财神相妒忌，否则克妻，或亦不美欠和（滴天髓 1047）');
    }
    return hits;
  }
  // ── 渊海歌诀条件机判（四言独步1936-2026/身弱论2028-2044/弃命从杀2045-2060/五言独步2061-2084/撮要法2206-2221/格局生死引用2222-2235；无条件：干支同字/同支/五行计数/十神透干均可枚举）──
  function wuxingCount(p) {
    const w = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    for (const k of ['year', 'month', 'day', 'time']) { w[WX[p.gz[k][0]]]++; w[WX[p.gz[k][1]]]++; }
    return w;
  }
  function jipanGeJue(p, cs, gender, sh) {
    const hits = [];
    const G = (k) => p.gz[k][0], Z = (k) => p.gz[k][1], zhLabel = { year: '年', month: '月', day: '日', time: '时' };
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    const LU = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
    const CS = { '甲': '亥', '乙': '午', '丙': '寅', '丁': '酉', '戊': '寅', '己': '酉', '庚': '巳', '辛': '子', '壬': '申', '癸': '卯' };
    const KU = { '木': '未', '火': '戌', '金': '丑', '水': '辰', '土': '辰' };
    const wc = wuxingCount(p);
    const zhis = ['year', 'month', 'day', 'time'].map(Z);
    const ziCount = (z) => zhis.filter(x => x === z).length;
    const riWx = WX[p.dayGan];
    const caiWx = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' }[riWx];
    const guanWx = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' }[riWx];
    for (const k of ['year', 'month', 'day', 'time']) if (G(k) === Z(k)) hits.push('干与支同，损财伤妻 —— ' + p.gz[k] + '柱干支同字（渊海·四言独步）');
    if (Z('day') === Z('year')) hits.push('身支年同，破荡祖基 —— 日支与年支同为' + Z('day') + '（渊海·四言独步）');
    if (LU[p.dayGan] === Z('month')) hits.push('月令见禄，不住祖屋；一见财官，自然发福 —— ' + p.dayGan + '禄在' + Z('month') + '，月令建禄（渊海·四言独步）');
    if (zhis.filter(z => ['子', '午', '卯', '酉'].includes(z)).length >= 3) hits.push('子午卯酉，四败之局；男犯兴衰，女犯孤独 —— 地支' + zhis.join('') + '中子午卯酉≥3（渊海·四言独步）');
    for (const k of ['year', 'month', 'day', 'time']) {
      const z = Z(k);
      if (z === KU[caiWx]) hits.push('财官临库，不冲不发 —— 财库' + z + '（' + caiWx + '库）临' + zhLabel[k] + '支，逢冲则发（渊海·四言独步）');
      if (z === KU[guanWx]) hits.push('财官临库，不冲不发 —— 官库' + z + '（' + guanWx + '库）临' + zhLabel[k] + '支，逢冲则发（渊海·四言独步）');
    }
    {
      const sha = (sh || []).find(h => h.name && h.name.indexOf('十恶大败') >= 0);
      if (sha) hits.push('十恶大败，格中大忌；若遇财官，反成富贵 —— 日柱' + p.gz.day + '为十恶大败日，' + ((cai + guan) > 0 ? '本局透财官，反成富贵之论' : '本局无财官，作大忌看') + '（渊海·四言独步）');
    }
    if (cs['七杀'] > 0 && yin > 0) hits.push('杀不离印，印不离杀；杀印相生，功名显达 —— 七杀与印绶同透（渊海·四言独步）');
    if (cs['正官'] > 0 && cs['七杀'] > 0) hits.push('官杀重逢，制伏有功 —— 正官与七杀同透（官杀混杂），' + (shi > 0 ? '有食伤制伏' : '无制伏，宜岁运见制') + '（渊海·四言独步）');
    {
      const k = ['year', 'month', 'day', 'time'].find(kk => p.ssGan[kk] === '七杀');
      if (k) hits.push('时杀无根，杀旺取贵；时杀多根，杀旺不利 —— 七杀在' + zhLabel[k] + '，' + (WX[Z(k)] === WX[G(k)] ? '坐' + Z(k) + '有根（杀旺多根不利）' : '坐' + Z(k) + '无根（杀旺取贵）') + '（渊海·四言独步）');
    }
    if (yin > 0) hits.push('印绶' + (bi > 0 ? '比肩，喜行财乡 —— 印绶透而比肩亦透（渊海·四言独步）' : '无比肩，忌见财伤 —— 印绶透而无比肩，' + (cai > 0 ? '本局又见财，忌财伤印' : '忌见财伤') + '（渊海·四言独步）'));
    if ((p.ssGan.year === '正财' || p.ssGan.year === '偏财') && (p.ssGan.month === '正印' || p.ssGan.month === '偏印')) hits.push('先财后印，反成其福 —— 年财月印（渊海·四言独步）');
    if ((p.ssGan.year === '正印' || p.ssGan.year === '偏印') && (p.ssGan.month === '正财' || p.ssGan.month === '偏财')) hits.push('先印后财，反成其辱 —— 年印月财（渊海·四言独步）');
    if ((cai > 0 ? 1 : 0) + (guan > 0 ? 1 : 0) + (yin > 0 ? 1 : 0) >= 2 && bi > 0) hits.push('财官印绶，大忌比肩 —— 财官印中≥2透而又见比劫（渊海·四言独步）');
    if (cs['伤官'] > 0) hits.push(cai > 0 ? '伤官用财，死宫有子 —— 伤官透而有财（渊海·四言独步）' : '伤官无财，子宫有死 —— 伤官透而四柱无财（渊海·四言独步）');
    if (p.ssGan.time === '偏财' && bi > 0) hits.push('时上偏财，怕逢兄弟 —— 时干偏财而又比劫透（渊海·四言独步）');
    {
      const mzShen = (p.ssZhi && p.ssZhi.month && p.ssZhi.month[0]) || '';
      if ((mzShen === '正财' || mzShen === '偏财' || mzShen === '正官') && bi >= 2) hits.push('月令财官，遇之发福；禄位高强，比肩夺福 —— 月令' + mzShen + '而比肩≥2透（渊海·四言独步）');
    }
    if (p.dayGan === '庚' && Z('time') === '申' && cai > 0) hits.push('庚日申时，透财归禄 —— 庚日申时，财透（渊海·四言独步）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && Z('month') === '丑' && ['乙丑', '己巳', '癸酉'].includes(p.gz.time)) hits.push('甲乙丑月，时带金神；月干见杀，双目不明 —— 时柱' + p.gz.time + '为金神（渊海·四言独步）');
    if ((p.dayGan === '庚' || p.dayGan === '辛') && ['辰', '戌', '丑', '未'].includes(Z('month'))) hits.push('月生四季，日主庚辛；何愁主弱，旺地成名 —— ' + p.dayGan + '日' + Z('month') + '月（渊海·四言独步）');
    if (p.dayGan === '壬' && Z('day') === '午') hits.push('壬生午位，禄马同乡；重重遇火，格局高强（玄武当权）—— 壬日坐午，局中火' + wc['火'] + '个（渊海·四言独步）');
    if (p.dayGan === '癸' && Z('day') === '巳') hits.push('癸向巳宫，财官拘印；运至南方，利名必振（玄武当权）—— 癸日坐巳（渊海·四言独步）');
    if (gender === 0 && cs['伤官'] > 0) hits.push('伤官之格，女人最忌；带印带财，反为富贵 —— 女命伤官透' + ((yin + cai) > 0 ? '，带印/带财' : '，无印财作忌看') + '（渊海·四言独步）');
    {
      const t = [Z('year'), Z('day')].map(base => ({ '申': '酉', '子': '酉', '辰': '酉', '寅': '卯', '午': '卯', '戌': '卯', '巳': '午', '酉': '午', '丑': '午', '亥': '子', '卯': '子', '未': '子' }[base])).filter(Boolean);
      if (['year', 'month', 'day', 'time'].some(k => t.includes(Z(k)))) {
        if (cs['正官'] > 0) hits.push('官星桃花，福禄堪夸 —— 官星与桃花并见（渊海·四言独步）');
        if (cs['七杀'] > 0) hits.push('杀星桃花，朝劫暮巴 —— 七杀与桃花并见（渊海·四言独步）');
      }
    }
    if ((p.dayGan === '戊' || p.dayGan === '己') && Z('month') === '丑' && cs['比肩'] > 0) hits.push('戊己丑月，比肩透出；宜金入局，忌逢午未 —— ' + p.dayGan + '日丑月比肩透（渊海·四言独步）');
    if ((p.dayGan === '庚' || p.dayGan === '辛') && Z('month') === '巳' && bi > 0) hits.push('庚辛巳月，金生火旺；比劫栽根，西行成象 —— ' + p.dayGan + '日巳月比劫透（渊海·四言独步）');
    if ((p.dayGan === '丙' || p.dayGan === '丁') && Z('month') === '酉' && cs['比肩'] > 0) hits.push('丙丁酉月，比肩不忌 —— ' + p.dayGan + '日酉月（渊海·四言独步）');
    if (p.dayGan === '乙' && Z('month') === '丑') hits.push('乙木无根，生临丑月；' + (wc['金'] >= 3 ? '金多转贵' : ((wc['火'] + wc['土']) >= 3 ? '火土则折' : '水多转贵')) + '（渊海·身弱论）');
    if (p.dayGan === '丙' && zhis.includes('子') && zhis.includes('申')) hits.push('丙火无根，子申全见；无制无生，此身贫贱 —— 丙日地支子申全见（渊海·身弱论）');
    if (p.dayGan === '甲' && Z('day') === '申' && ziCount('子') >= 3) hits.push('六甲坐申，三重见子；运至北方，须防横死 —— 甲日坐申而三见子（渊海·身弱论）');
    if (p.dayGan === '己' && Z('month') === '亥' && yin > 0) hits.push('己入亥月，月逢印生，自然成福 —— 己日亥月印透（渊海·身弱论）');
    if (p.dayGan === '丁' && Z('day') === '酉' && wc['水'] >= 3) hits.push('丁酉阴柔，不怕多水 —— 丁日坐酉而水多（渊海·身弱论）');
    if (p.dayGan === '戊' && Z('day') === '寅' && cs['七杀'] > 0) hits.push('戊寅日主，何愁杀旺 —— 戊日坐寅见杀，' + (yin > 0 ? '露火（印）成名' : '宜岁运见火（印）化杀') + (wc['水'] >= 3 ? '；水来漂荡' : '') + '（渊海·身弱论）');
    if (p.dayGan === '辛' && Z('month') === '卯') hits.push('辛金身弱，卯提入格 —— 辛日卯月（渊海·身弱论）');
    if (p.dayGan === '癸' && Z('day') === '酉' && cai > 0) hits.push('癸酉主衰，见财成格 —— 癸日坐酉而财透（渊海·身弱论）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && (zhis.includes('申') || zhis.includes('酉')) && !zhis.includes('寅') && !zhis.includes('卯')) hits.push('甲乙无根，怕逢申酉 —— 甲乙日地支申酉而根（寅卯）不现（渊海·弃命从杀论）');
    if (p.dayGan === '乙' && Z('month') === '酉' && wc['水'] > 0) hits.push('乙木酉月，见水为奇 —— 乙日酉月见水（渊海·弃命从杀论）');
    if (p.dayGan === '丙' && Z('month') === '申') hits.push('丙火申提，' + (['巳', '午', '未', '戌'].some(z => zhis.includes(z)) ? '有根南旺' : '无根从杀，脱根寿促') + '（渊海·弃命从杀论）');
    if ((p.dayGan === '戊' || p.dayGan === '己') && Z('month') === '亥') hits.push('戊己亥月，身弱为弃 —— ' + p.dayGan + '日亥月（渊海·弃命从杀论）');
    if ((p.dayGan === '壬' && Z('month') === '戌') || (p.dayGan === '癸' && Z('month') === '未')) hits.push('壬日戌提，癸干未月；运喜东方，逢冲则绝 —— ' + p.dayGan + '日' + Z('month') + '月（渊海·弃命从杀论）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && Z('month') === '卯') hits.push('甲乙生居卯，' + (wc['金'] >= 3 ? '金多反吉祥' : '不宜重见杀') + '（渊海·五言独步）');
    for (const k of ['year', 'month', 'day', 'time']) {
      const di = shiDiName(p.dayGan, Z(k));
      const wxTip = { '火': '火忌西方酉', '金': '金沉怕水乡', '木': '木神休见午', '水': '水到卯中伤' }[WX[p.dayGan]];
      if (di === '死' && wxTip) hits.push(wxTip + ' —— ' + p.dayGan + '坐' + Z(k) + '为死地（渊海·五言独步，十二长生）');
    }
    if ((p.dayGan === '戊' || p.dayGan === '己') && zhis.includes('亥')) hits.push('土宿休行亥 —— ' + p.dayGan + '日地支见亥（渊海·五言独步）');
    if (p.dayGan === '乙' && Z('month') === '酉' && zhis.includes('巳') && zhis.includes('丑')) hits.push('乙木生居酉，莫逢全巳丑 —— 乙日酉月巳丑全见（渊海·五言独步）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && (zhis.includes('申') || zhis.includes('酉'))) hits.push('甲乙若逢申，杀印暗相生 —— 甲乙日地支见申（渊海·五言独步）');
    if (p.dayGan === '甲' && Z('month') === '酉') hits.push('八月官星旺，甲逢秋气深 —— 甲日酉月（渊海·五言独步）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && ['寅', '卯'].includes(Z('month')) && guan > 0) hits.push('曲直生春月，庚辛干上逢；南离推富贵 —— 甲乙日寅卯月见官杀（渊海·五言独步）');
    if (CS[p.dayGan] === Z('time')) hits.push('时上胞胎格，月逢印绶通 —— 时支' + Z('time') + '为' + p.dayGan + '之长生（胞胎）（渊海·五言独步）');
    if (cs['正官'] > 0 && cai > 0) hits.push('正官尤忌见财星 —— 正官与财星同透（渊海·论八字撮要法）');
    if (yin > 0 && cs['七杀'] > 0) hits.push('印绶好杀 —— 印绶与七杀同透（渊海·论八字撮要法）');
    if (yin > 0 && cai > 0) hits.push('印绶嫌财位 —— 印绶与财星同透（渊海·论八字撮要法）');
    {
      const yr = YANG_REN[p.dayGan];
      if (yr && zhis.includes(yr)) hits.push('阳刃怕冲，宜合迎 —— 阳刃' + yr + '在支，' + (['year', 'month', 'day', 'time'].some(k => Z(k) === CHONG[yr]) ? '本局见冲' : '忌岁运冲刃') + '（渊海·论八字撮要法）');
    }
    if (bi >= 2 && cs['七杀'] > 0) hits.push('比肩要逢七杀制 —— 比劫≥2透而七杀亦透（渊海·论八字撮要法）');
    if (cs['七杀'] > 0 && cs['食神'] > 0) hits.push('七杀喜见食神 —— 七杀与食神同透（食神制杀）（渊海·论八字撮要法）');
    if (cs['食神'] > 0 && cs['偏财'] > 0) hits.push('食神最喜偏财临 —— 食神与偏财同透（渊海·论八字撮要法）');
    if (yin > 0 && cai > 0) hits.push('印绶见财，行财运、又兼死绝，必入黄泉；如柱有比肩，庶几有解 —— 印财同透，' + (bi > 0 ? '有比肩可解' : '无比肩，忌行财运、忌印入死绝') + '（渊海·格局生死引用）');
    if (cs['正官'] > 0 && cs['七杀'] > 0) hits.push('正官见杀，及伤官刑冲破害，岁运相并必死 —— 正官与七杀同透（渊海·格局生死引用）');
    if (cai > 0 && bi > 0) hits.push('正财偏财，见比肩分夺、劫财阳刃，又见岁运冲合必死 —— 财星与比劫同透（渊海·格局生死引用）');
    {
      const m = Object.keys(wc).reduce((a, b) => wc[b] > wc[a] ? b : a);
      if (wc[m] >= 5) hits.push({ '金': '金多夭折', '水': '水盛飘流', '木': '木旺则夭', '土': '土多痴呆', '火': '火多顽愚' }[m] + ' —— ' + m + '五行计数' + wc[m] + '，太过不及（渊海·格局生死引用）');
    }
    if (cai >= 3 && cs['七杀'] > 0) hits.push('官星太岁、财多身弱，元犯七杀，身轻有救则吉，无救则凶 —— 财多（≥3透）而犯七杀，身弱者尤验（渊海·格局生死引用）');
    return hits;
  }
  // ── 渊海/神峰·继善篇 条件句机判（2026-10-26 补：原误划活层，实为条件断句，773-855/2027-2215）──
  function jipanJiShan(p, cs, gender, sh) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    const wc = wuxingCount(p);
    const gz = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const has = (wx) => gz.some(g => WX[g] === wx);
    const KE5 = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    const ganWu = WX[p.dayGan];
    const yearWx = WX[p.gz.year[0]];
    if (KE5[yearWx] === ganWu) hits.push('年伤日干，名为主本不和 —— 年干' + p.gz.year[0] + '（' + yearWx + '）克日干' + p.dayGan + '（' + ganWu + '）（渊海/神峰·继善篇）');
    if (guan >= 2 && weak) hits.push('官星太旺，临旺处必倾 —— 官杀' + guan + '透而身弱（渊海/神峰·继善篇；神峰歌释"身衰若行财地，化鬼反必倾危"）');
    if (yin > 0 && cai > 0) hits.push('印绶被伤，倘若荣华不久 —— 印绶与财星同透（渊海/神峰·继善篇；神峰六神篇"印逢财而罢职"同义）');
    if (strong && guan > 0) hits.push('名标金榜，须还身旺逢官 —— 身旺而官星透（渊海/神峰·继善篇）');
    if (weak && guan > 0) hits.push('身弱遇官，得后徒然费力 —— 身弱而官星透（渊海/神峰·继善篇；神峰"身若居官难发，运行身旺财荣"）');
    if (strong && guan === 1) hits.push('身强杀浅，假杀为权 —— 身强而官杀恰一位透（渊海/神峰·继善篇）');
    if (weak && guan >= 2) hits.push('杀重身轻，终身有损 —— 身弱而官杀' + guan + '透（渊海/神峰·继善篇）');
    if (strong && cai === 0 && guan === 0 && yin === 0) hits.push('天元虽旺，若无依倚是常人 —— 身旺而财官印皆不透（渊海/神峰·继善篇）');
    if (weak && (cai > 0 || guan > 0)) hits.push('日主太柔，纵遇财官为寒士 —— 身弱而财/官透（渊海/神峰·继善篇）');
    if (gender === 0 && guan === 0) { const de = (sh || []).filter(h => /天德|月德/.test(h.name)); if (de.length) hits.push('女人无杀带二德，作两代之封 —— 女命无官杀透而天/月德入命（渊海/神峰·继善篇）'); }
    if (gender === 1 && strong) { const sq = (sh || []).find(h => h.name === '三奇'); if (sq) hits.push('男命身强遇三奇，为一品之贵 —— 男命身强而三奇入命（渊海/神峰·继善篇）'); }
    // 五行偏枯断句（继善篇五行段 838-854 / 神峰 2175-2211）
    if (ganWu === '金' && wc['火'] >= 3 && wc['金'] <= 1) hits.push('金弱遇火炎之地，血疾无疑 —— 日主金而火' + wc['火'] + '个（渊海/神峰·继善篇）');
    if (ganWu === '土' && wc['木'] >= 3 && wc['土'] <= 1) hits.push('土虚逢木旺之乡，脾伤定论 —— 日主土而木' + wc['木'] + '个（渊海/神峰·继善篇）');
    if (wc['木'] >= 2 && wc['金'] >= 2) hits.push('筋疼骨痛，盖因木被金伤 —— 木' + wc['木'] + '个、金' + wc['金'] + '个（渊海·继善篇）');
    if (wc['火'] >= 2 && wc['水'] >= 2) hits.push('眼昏目暗，必是火遭水克 —— 火' + wc['火'] + '个、水' + wc['水'] + '个（渊海·继善篇）');
    if (wc['水'] >= 2 && wc['火'] >= 2) hits.push('下元冷疾，必是水值火伤 —— 水' + wc['水'] + '个、火' + wc['火'] + '个（渊海·继善篇）');
    if (ganWu === '木' && wc['木'] >= 2 && wc['火'] >= 2) hits.push('一木重逢火位，名为气散之文 —— 日主木而木' + wc['木'] + '个、火' + wc['火'] + '个（渊海/神峰·继善篇）');
    if (wc['水'] >= 3 && has('金')) hits.push('独水三犯庚辛，号曰体全之象 —— 水' + wc['水'] + '个而天干有金（壬癸配庚辛）（渊海/神峰·继善篇）');
    if (wc['水'] >= 3 && ['亥', '子', '丑'].includes(p.monthZhi)) hits.push('水归冬旺，生平乐自无忧 —— 水' + wc['水'] + '个而冬月（渊海/神峰·继善篇）');
    if (wc['木'] >= 3 && ['寅', '卯', '辰'].includes(p.monthZhi)) hits.push('木向春生，处世安然必寿 —— 木' + wc['木'] + '个而春月（渊海/神峰·继善篇）');
    if (ganWu === '木' && wc['水'] >= 3) hits.push('木从水养，水盛而木则漂流 —— 日主木而水' + wc['水'] + '个（渊海/神峰·继善篇）');
    if (ganWu === '金' && wc['土'] >= 3) hits.push('金赖土生，土厚而金遭埋没 —— 日主金而土' + wc['土'] + '个（渊海/神峰·继善篇）');
    // 干头救应（继善篇 823 / 神峰 2138-2140：克者与被克者同现，若制神透则无危）
    const jiu = [
      ['庚辛伤甲乙而丙丁透，无危', ['金'], ['木'], ['火']],
      ['丙丁克庚辛而壬癸透，不畏', ['火'], ['金'], ['水']],
      ['戊己克壬癸而甲乙透，有救', ['土'], ['水'], ['木']],
      ['壬癸克丙丁而戊己透，不惧', ['水'], ['火'], ['土']]
    ];
    for (const [name, keWu, beiKe, jiuWu] of jiu) {
      if (has(keWu[0]) && has(beiKe[0]) && has(jiuWu[0])) hits.push(name + ' —— 天干' + gz.join('') + '中' + keWu[0] + '克' + beiKe[0] + '而' + jiuWu[0] + '透为救（渊海/神峰·继善篇）');
    }
    return hits;
  }
  // ── 渊海·心镜歌 条件句机判（1109-1160）──
  function jipanXinJing(p, cs, sh) {
    const hits = [];
    const guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'];
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const name = (n) => (sh || []).some(h => h.name === n);
    if (name('天乙贵人') && name('孤辰寡宿')) hits.push('生逢贵人值孤寡，决定为僧也 —— 天乙贵人与孤辰/寡宿同入命（渊海·心镜歌）');
    if (shi >= 2) hits.push('欲知人命主有权，食神旺必全 —— 食伤' + shi + '透（渊海·心镜歌）');
    if (guan > 0 && cs['食神'] === 0 && cs['伤官'] === 0 && cs['正财'] === 0 && cs['偏财'] === 0 && cs['比肩'] === 0 && cs['劫财'] === 0) hits.push('日月纯官无财位，反主无官贵 —— 官星透而财/食/比皆不现（渊海·心镜歌）');
    if (name('天德') || name('月德')) hits.push('天月二德为救解，百灾不为害 —— 天/月德入命（渊海·心镜歌）');
    {
      const yr = YANG_REN[p.dayGan];
      if (yr && zhis.includes(yr) && cs['七杀'] > 0 && ['year', 'month', 'day', 'time'].some(k => p.gz[k][1] === CHONG[yr])) hits.push('相冲阳刃再杀伤，必主上法场 —— 阳刃' + yr + '在支被冲而七杀透（渊海·心镜歌）');
    }
    if (name('天乙贵人') && (p.xunKong || '').length && guan > 0) hits.push('空亡官禄遇贵人，淡服作高僧 —— 日旬空' + (p.xunKong || '') + '而官星贵人均见（渊海·心镜歌）');
    return hits;
  }
  // ── 神峰通考·六神篇 条件句机判（2216-2306）──
  function jipanLiuShen(p, cs, gender) {
    const hits = [];
    const ws = wangShuai(p);
    const weak = ws.verdict === '身弱', strong = ws.verdict === '身旺';
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    const dayZhiShen = (p.ssZhi && p.ssZhi.day && p.ssZhi.day[0]) || '';
    if (gender === 1 && (dayZhiShen === '比肩' || dayZhiShen === '劫财')) hits.push('身坐比肩成比局，当为几度新郎 —— 男命日支本气' + dayZhiShen + '（神峰·六神篇）');
    if (gender === 1 && (dayZhiShen === '正财' || dayZhiShen === '偏财')) hits.push('妻宫妻守，贤齐孟光 —— 男命日支本气' + dayZhiShen + '（神峰·六神篇）');
    if (gender === 1 && bi > 0 && cai > 0) hits.push('夫妻随娶随伤，盖为比肩伏马 —— 男命比肩与财星同透（神峰·六神篇）');
    if (guan === 1 && bi >= 2) hits.push('争正官不可无伤 —— 官星一位而比肩' + bi + '透，官被争夺（神峰·六神篇）');
    if (weak && cai >= 2 && bi > 0) hits.push('财旺劫处祸犹轻 —— 财多身弱而得比劫分财（神峰·六神篇诗释"真逢比劫分将去，省得贫魔与病魔"）');
    if (cai > 0 && yin > 0 && strong) hits.push('财逢印以迁官 —— 财印同透而身旺（神峰·六神篇）');
    if (shi === 1 && cs['偏印'] > 0 && cai === 0) hits.push('命当夭折，食神孑立逢枭 —— 食神一位、偏印透而无财救（神峰·六神篇）');
    if (yin >= 2 && shi === 0) hits.push('印旺无制孤蹇 —— 印' + yin + '透而无食伤制（神峰·继善篇歌释）');
    return hits;
  }
  // ── 渊海子平·女命断歌 机判（陰命赋596-609/总断歌610-634/富贵贫贱635-663/滚浪桃花664-676/贵格677-696/贱格697-707；仅 gender=0 触发）──
  function jipanNvMing(p, cs, sh) {
    const hits = [];
    const ws = wangShuai(p);
    const weak = ws.verdict === '身弱', strong = ws.verdict === '身旺';
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    const wcNv = wuxingCount(p);
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const gz4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const dayZhiShen = (p.ssZhi && p.ssZhi.day && p.ssZhi.day[0]) || '';
    const timeZhiShen = (p.ssZhi && p.ssZhi.time && p.ssZhi.time[0]) || '';
    const name = (n) => (sh || []).some(h => h.name === n);
    const LU2 = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
    const HE = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
    let heCnt = 0;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (HE[gz4[i]] === gz4[j]) heCnt++;
    const hasTdYd = name('天德') || name('月德');
    const yr = YANG_REN[p.dayGan];
    const yrHit = yr && zhis.includes(yr);
    const dayLu = LU2[p.dayGan];
    const hit = (t, src) => hits.push(t + ' —— ' + src + '（渊海·女命篇）');
    // 陰命赋
    if (guan >= 1 && shi >= 1) hit('夫荣子旺，定知富贵荣华', '官星与食伤并透');
    if (guan === 0 && shi === 0 && weak) hit('子死夫衰，只是穷孤下贱', '无官无食伤而身弱');
    if (weak && guan > 0 && shi > 0) hit('有夫有子而贫寒者，盖因身在衰乡', '官食俱有而身弱');
    if (strong && guan === 0 && shi === 0) hit('无夫无子而昌盛者，亦是身居旺地', '无官无食伤而身旺');
    if (strong && guan <= 1) hit('夫衰身旺，主为廉洁之人', '身旺而官星' + guan + '位');
    if (weak && guan >= 2) hit('鬼旺身衰，必作孤寒之妇', '身弱而官杀' + guan + '透');
    if (p.ssGan.year === '正官' || p.ssGan.year === '七杀') hit('招婿者，夫显于门户之中', '官杀临年柱');
    if ((dayZhiShen === '正官' || dayZhiShen === '七杀') || (timeZhiShen === '正官' || timeZhiShen === '七杀')) hit('偏夫者，夫旺于日时之上', '官杀临日/时支本气');
    // 女命总断歌
    if (name('驿马') && name('天乙贵人')) hit('驿马带贵人，终久落风尘', '驿马与天乙贵人均入命');
    if (zhis.includes('辰') && zhis.includes('戌')) hit('有辰休见戌，辰戌若相见多是淫贱人', '地支辰戌同现');
    if (yrHit && cs['伤官'] > 0) hit('阳刃带伤官，驳杂事多端', '阳刃在支而伤官透');
    if (yin >= 2) hit('满盘多是印，损子必须定', '印' + yin + '透');
    if (hasTdYd && (dayZhiShen === '正财' || dayZhiShen === '偏财')) hit('二德坐正财，富贵自然来', '天/月德入命而日支本气为财');
    if (wcNv['金'] >= 1 && wcNv['水'] >= 1) hit('金水若相逢，必招美丽容', '金水并见');
    if (['寅', '申', '巳', '亥'].every(z => zhis.includes(z))) hit('寅申巳亥全，孤淫口便便', '地支寅申巳亥齐全');
    if ((zhis.includes('子') || zhis.includes('午')) && (zhis.includes('卯') || zhis.includes('酉'))) hit('子午逢卯酉，定是随人走', '地支子午与卯酉并见');
    if ((zhis.includes('辰') || zhis.includes('戌')) && (zhis.includes('丑') || zhis.includes('未'))) hit('辰戌逢丑未，妇道之大忌', '地支辰戌与丑未并见');
    // 富贵贫贱篇 / 滚浪桃花
    if (cs['伤官'] >= 2) hit('伤官太重必妨夫，且是为人性重', '伤官' + cs['伤官'] + '透');
    if (guan >= 2) hit('女命官星多者，伤夫主贱', '官杀' + guan + '透');
    if (cs['偏印'] >= 2 && name('孤辰寡宿')) hit('倒食重逢须减福，那堪更犯孤辰', '偏印' + cs['偏印'] + '透而孤辰/寡宿入命');
    if (name('桃花') && (cs['伤官'] > 0 || cs['七杀'] > 0)) hit('伤官桃花，为妓女命，或主克子息', '咸池与伤官/七杀并见');
    if (yrHit && (['day', 'time'].some(k => p.gz[k][1] === yr))) hit('时日阳刃，本是凶神，不利于夫主之宫', '阳刃' + yr + '临日/时支');
    if (cs['食神'] > 0 && cs['偏印'] === 0) hit('食专得子嗣之宜', '食神透而无偏印夺食');
    if (yin > 0 && cai > 0) hit('印坏与公姑相妒', '印绶与财星同透');
    if (bi >= 2) hit('姊妹透出，便见争夫', '比肩/劫财' + bi + '透');
    if (dayLu && p.gz.time[1] === dayLu) hit('日禄归时，贵重为人所敬', '时支' + dayLu + '为日干' + p.dayGan + '之禄');
    if (heCnt >= 2) hit('合多定损贞名（合神若是多，非妓亦讴歌）', '天干五合' + heCnt + '组');
    if (guan >= 2 && shi === 0 && yin === 0) hit('官杀胜而无制伏，不为娼妓定作尼姑', '官杀' + guan + '透而无食伤印制化');
    // 女命贵格（677-696）——命中即输出
    const gui = [];
    if (cs['正官'] > 0 && cs['七杀'] === 0) gui.push('正气官星');
    if (cai >= 2 && guan >= 2) gui.push('财官两旺');
    if (yin > 0 && hasTdYd) gui.push('印绶天德');
    if (cs['七杀'] === 1 && cs['食神'] > 0) gui.push('独杀有制');
    if (cs['伤官'] > 0 && cai > 0) gui.push('伤官生财');
    if (dayLu && p.gz.day[1] === dayLu && cai > 0) gui.push('坐禄逢财');
    if (cs['正官'] > 0 && name('桃花')) gui.push('官星桃花');
    if (cs['食神'] > 0) gui.push('食神生旺');
    if (cs['食神'] > 0 && cai > 0) gui.push('食神生财');
    if (cs['七杀'] > 0 && yin > 0) gui.push('杀化印绶');
    if (hasTdYd) gui.push('二德扶身');
    if (yrHit && (shi > 0 || guan > 0)) gui.push('阳刃有制');
    if (dayLu && p.gz.time[1] === dayLu && cai > 0) gui.push('归禄逢财');
    if (gui.length) hits.push('女命贵格命中：' + gui.join('、') + ' —— ' + gui.map(g => ({ '正气官星': '正官透而无杀', '财官两旺': '财官皆≥2透', '印绶天德': '印透而天/月德入命', '独杀有制': '七杀一位而食神制之', '伤官生财': '伤官与财同透', '坐禄逢财': '日支为日禄而财透', '官星桃花': '正官与咸池并见', '食神生旺': '食神透', '食神生财': '食神与财同透', '杀化印绶': '七杀与印同透', '二德扶身': '天/月德入命', '阳刃有制': '阳刃在支而有食伤/官杀制', '归禄逢财': '时支为日禄而财透' }[g] || '')).join('；') + '（渊海·女命贵格）');
    // 女命贱格（697-707）——命中即输出
    const jian = [];
    if (cs['正官'] > 0 && cs['七杀'] > 0) jian.push('官杀混杂');
    if (guan >= 2 && shi === 0 && yin === 0) jian.push('官杀无制');
    if (cs['七杀'] >= 2) jian.push('杀星太重');
    if (cs['伤官'] >= 2) jian.push('伤官太重');
    if (cai > 0 && yin > 0) jian.push('贪财坏印');
    if (bi >= 2) jian.push('比肩犯重');
    if (guan === 0 && heCnt >= 1) jian.push('无官见合');
    if (yin === 0 && cs['七杀'] > 0) jian.push('无印见杀');
    if (cs['伤官'] > 0 && cs['七杀'] > 0) jian.push('伤官七杀');
    if (heCnt >= 1 && name('桃花')) jian.push('带合桃花');
    if (cai >= 2 && weak) jian.push('财多身弱');
    if (yrHit && ['year', 'month', 'day', 'time'].some(k => p.gz[k][1] === CHONG[yr])) jian.push('阳刃冲刑');
    if (cs['伤官'] > 0 && cs['正官'] > 0) jian.push('伤官见官');
    if (yin > 0 && cs['劫财'] > 0) jian.push('印绶遇劫');
    if (jian.length) hits.push('女命贱格命中：' + jian.join('、') + ' —— ' + jian.map(j => ({ '官杀混杂': '正官七杀同透', '官杀无制': '官杀≥2而无食伤印制化', '杀星太重': '七杀≥2透', '伤官太重': '伤官≥2透', '贪财坏印': '财印同透', '比肩犯重': '比肩/劫财≥2透', '无官见合': '无官而天干有合', '无印见杀': '无印而七杀透', '伤官七杀': '伤官与七杀同透', '带合桃花': '天干有合而咸池入命', '财多身弱': '财≥2透而身弱', '阳刃冲刑': '阳刃在支被冲', '伤官见官': '伤官与正官同透', '印绶遇劫': '印与劫财同透' }[j] || '')).join('；') + '（渊海·女命贱格）');
    return hits;
  }
  // ── 滴天髓·女命章 机判（阐微 1274-1280 任铁樵论女命：夫星变通/克夫/子息/婬贱；僅 gender=0 触发）──
  function jipanDiTianNv(p, cs, sh) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    const shang = cs['伤官'], shiShen = cs['食神'];
    const wc = wuxingCount(p);
    const gz4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const HE = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
    let heCnt = 0;
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (HE[gz4[i]] === gz4[j]) heCnt++;
    // 夫星变通取用（1277：官星不现/太旺太弱时"以X为夫"）
    const fu = [];
    if (guan >= 3 && bi === 0 && yin > 0) fu.push('官星太旺，无比劫以印为夫');
    if (guan >= 3 && bi > 0 && yin === 0) fu.push('官星太旺，有比劫而无印绶，以伤食为夫');
    if (guan <= 1 && shang > 0 && cai > 0) fu.push('官星太弱，有伤官，以财为夫');
    if (guan <= 1 && cai === 0 && bi >= 2) fu.push('官星太弱，无财星而比劫旺，以伤食为夫');
    if (bi >= 3 && yin === 0 && guan === 0) fu.push('满盘比劫而无印无官，以伤食为夫');
    if (yin >= 3 && guan === 0 && shi === 0) fu.push('满局印绶而无官无伤，以财为夫');
    if (weak && shi >= 2) fu.push('伤官旺日主衰，以印为夫');
    if (strong && shi >= 2) fu.push('日主旺食伤多，以财为夫');
    if (guan <= 1 && yin >= 2) fu.push('官星轻印绶重，亦以财为夫');
    if (fu.length) hits.push('夫星变通取用（滴天髓 1277）：' + fu.join('；') + ' —— 原文"不必专执官星而论夫"，按四柱组合变通定夫星');
    // 克夫断句（1278）
    if (strong && shang >= 2 && guan <= 1 && cai > 0) hits.push('官星微、有财星、日主强、伤官重，必克夫（滴天髓 1278）');
    if (guan <= 1 && cai === 0 && bi >= 2) hits.push('官星微、无财星、比劫旺，必欺夫（滴天髓 1278）');
    if (strong && guan <= 1 && cai === 0 && yin >= 2) hits.push('官星微、无财星、日主旺、印绶重，必欺夫克夫（滴天髓 1278）');
    if (guan <= 1 && yin >= 2 && cai === 0) hits.push('官星弱、印绶多、无财星，必克夫（滴天髓 1278）');
    if (bi >= 2 && guan === 0 && yin >= 2 && cai === 0) hits.push('比劫旺而无官、印旺无财，必克夫（滴天髓 1278）');
    if (guan >= 2 && yin <= 1) hits.push('官星旺、印绶轻，必克夫（滴天髓 1278）');
    if (bi >= 2 && guan === 0 && shang > 0 && yin >= 2) hits.push('比劫旺、无官星、有伤官、印绶重，必克夫（滴天髓 1278）');
    if (shiShen >= 2 && guan <= 1 && yin > 0 && cai > 0) hits.push('食神多、官星微、有印绶、遇财星，必克夫（滴天髓 1278）');
    // 子息断句（1279：日主旺弱×食伤印财官杀组合）
    const zi = [];
    if (strong && shi >= 2 && yin === 0 && cai > 0) zi.push('日主旺、伤官旺、无印绶、有财星，子多而贵');
    if (strong && shi >= 2 && yin === 0 && cai === 0) zi.push('日主旺、伤官旺、无财印，子多而强');
    if (strong && shi <= 1 && yin === 0 && cai === 0) zi.push('日主旺、伤官轻、无财印，子多而富');
    if (strong && shi === 0 && guan >= 2) zi.push('日主旺、无食伤、官得局，子多而贤');
    if (strong && shi === 0 && cai > 0 && guan === 0) zi.push('日主旺、无食伤、有财星、无官杀，子多而能');
    if (weak && shi >= 2 && yin > 0 && cai === 0) zi.push('日主弱、食伤重、有印绶、无财星，必有子');
    if (weak && shi <= 1 && cai === 0) zi.push('日主弱、食伤轻、无财星，必有子');
    if (weak && cai <= 1 && guan >= 2 && yin > 0) zi.push('日主弱、财星轻、官印旺，必有子');
    if (weak && guan >= 2 && cai === 0 && yin > 0) zi.push('日主弱、官星旺、无财星、有印绶，必有子');
    if (weak && guan === 0 && shang > 0) zi.push('日主弱、无官星、有伤官，必有子');
    if (strong && yin > 0 && cai === 0) zi.push('日主旺、有印绶、无财星，子必少');
    if (strong && bi >= 2 && guan === 0 && yin > 0) zi.push('日主旺、比肩多、无官星、有印绶，子必少');
    if (strong && yin >= 2 && cai === 0) zi.push('日主旺、印绶重、无财星，必无子');
    if (weak && shang >= 2 && yin <= 1) zi.push('日主弱、伤官重、印绶轻，必无子');
    if (weak && cai >= 2 && yin > 0) zi.push('日主弱、财星重、逢印绶，必无子');
    if (weak && guan >= 2) zi.push('日主弱、官杀旺，必无子');
    if (weak && shi >= 2 && yin === 0) zi.push('日主弱、食伤旺、无印绶，必无子');
    if (wc['火'] + wc['土'] >= 6 && wc['水'] === 0) zi.push('火炎土燥，无子');
    if (wc['水'] >= 4 && wc['土'] === 0) zi.push('水泛木浮，无子');
    if (wc['金'] + wc['水'] >= 6 && wc['火'] === 0) zi.push('金寒水冷，无子');
    if (yin >= 2) zi.push('重叠印绶，无子');
    if (cai + guan >= 5) zi.push('财官太旺，无子');
    if (shi >= 3) zi.push('满局食伤，无子');
    if (zi.length) hits.push('子息断句（滴天髓 1279）：' + zi.join('；') + ' —— 原文"女命之子星即是喜神，不可专论伤食为子"；命中为原文条件句，近似提示');
    // 婬贱断句（1280，原文"不可轻断婬邪"——仅作组合提示，不作文本结论）
    const yinJian = [];
    if (strong && guan <= 1 && cai === 0 && shi >= 2) yinJian.push('日主旺、官星微、无财星、伤食重');
    if (weak && shi >= 2 && yin <= 1) yinJian.push('日主弱、伤食重、印绶轻');
    if (weak && shi >= 2 && yin === 0 && cai > 0) yinJian.push('日主弱、食伤重、无印绶、有财星');
    if (shang >= 3 && cai === 0) yinJian.push('满局伤官无财');
    if (guan >= 3 && yin === 0) yinJian.push('满局官星无印');
    if (bi >= 3 && shi === 0) yinJian.push('满局比劫无食伤');
    if (yin >= 3 && cai === 0) yinJian.push('满局印绶无财');
    if (heCnt >= 3) yinJian.push('干支多合（贪合忘官）');
    if (yinJian.length) hits.push('婬贱组合提示（滴天髓 1280，任氏"不可轻断婬邪，以渎神怒"——仅列原文所列组合，不作命主定性）：' + yinJian.join('；'));
    return hits;
  }
  // ── 三命通会·论十干禄/论驿马 机判（2002-2242）──
  function jipanLuMa(p, cs, sh) {
    const hits = [];
    const LU2 = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
    const ZHI_IDX = { '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5, '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11 };
    const IDX_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const LIUHE6 = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
    const MABY = { '寅': '申', '午': '申', '戌': '申', '申': '寅', '子': '寅', '辰': '寅', '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳' };
    const KUAN = { '巳': ['壬', '亥'], '酉': ['壬', '亥'], '丑': ['壬', '亥'], '亥': ['丙', '巳'], '卯': ['丙', '巳'], '未': ['丙', '巳'], '申': ['甲', '寅'], '子': ['甲', '寅'], '辰': ['甲', '寅'], '寅': ['戊', '申'], '午': ['戊', '申'], '戌': ['戊', '申'] };
    const SANHE = { '寅': ['寅', '午', '戌'], '午': ['寅', '午', '戌'], '戌': ['寅', '午', '戌'], '申': ['申', '子', '辰'], '子': ['申', '子', '辰'], '辰': ['申', '子', '辰'], '巳': ['巳', '酉', '丑'], '酉': ['巳', '酉', '丑'], '丑': ['巳', '酉', '丑'], '亥': ['亥', '卯', '未'], '卯': ['亥', '卯', '未'], '未': ['亥', '卯', '未'] };
    const LU_KU = { '甲': '未', '乙': '未', '丙': '戌', '丁': '戌', '戊': '辰', '己': '辰', '庚': '丑', '辛': '丑', '壬': '辰', '癸': '辰' };
    const wc = wuxingCount(p);
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const gz4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const name = (n) => (sh || []).some(h => h.name === n);
    const lu = LU2[p.dayGan];
    const ma = MABY[p.gz.year[1]];
    // 禄论
    let luState = [];
    if (zhis.includes(lu)) luState.push('建');
    const luIdx = ZHI_IDX[lu];
    const xiangZ = IDX_ZHI[(luIdx + 10) % 12]; // 禄前二辰（向）
    const jinZ = IDX_ZHI[(luIdx + 1) % 12];    // 禄后一辰（近）
    const heZ = LIUHE6[lu];
    if (zhis.includes(xiangZ)) luState.push('向');
    if (zhis.includes(jinZ)) luState.push('近');
    if (zhis.includes(heZ)) luState.push('合');
    if (luState.length) hits.push('禄神状态（三命通会·论十干禄 2066：沈芝取建向近合四字为贵，得两字者贵）：' + p.dayGan + '禄在' + lu + '，本局' + luState.join('、') + '（' + luState.length + '字' + (luState.length >= 2 ? '，得两字为贵' : '') + '）—— 建不如向，近不如合');
    if (zhis.includes(LU_KU[p.dayGan])) hits.push('库者禄之聚 —— ' + p.dayGan + '之禄库' + LU_KU[p.dayGan] + '在局，' + (luState.includes('建') ? '禄厚丰足之人' : '得库为禄之归宿，主丰足') + '（三命通会·论十干禄 2077-2078）');
    if (zhis.includes(heZ) && luState.includes('建')) hits.push('合者禄之横（明合）—— 禄' + lu + '与其合支' + heZ + '并见，主儻来之福（三命通会 2078-2079）');
    if (zhis.includes(heZ) && !zhis.includes(lu)) hits.push('暗合见禄 —— 无禄支' + lu + '而见合支' + heZ + '，虽非见禄亦曰见禄（三命通会 2079-2080）');
    const gongA = IDX_ZHI[(luIdx + 10) % 12], gongB = IDX_ZHI[(luIdx + 1) % 12];
    if (!zhis.includes(lu) && zhis.includes(gongA) && zhis.includes(gongB)) hits.push('拱者禄之尊（虚拱）—— 不见禄支' + lu + '而见' + gongA + gongB + '两傍，拱实不若拱虚，主大富贵（三命通会 2080-2082）');
    if (zhis.includes(lu) && zhis.includes(gongA) && zhis.includes(gongB)) hits.push('拱者禄之尊（实拱）—— 禄支' + lu + '与' + gongA + gongB + '两傍拱之，主大富贵（三命通会 2082）');
    {
      const di = shiDiName(p.dayGan, lu);
      if (di === '死' || di === '绝') hits.push('禄怕衰绝 —— ' + p.dayGan + '禄' + lu + '坐' + di + '地，"自衰自死兼败绝，若无吉煞加助，定知破祖多浮劣"（三命通会 2086-2087）');
    }
    // 建禄带煞（2072-2076，仅列现有神煞）
    if (luState.includes('建')) {
      const jb = [];
      if (name('劫煞')) jb.push('与劫煞并，好贱技小商，不义横财');
      if (name('亡神')) jb.push('与亡神并，多遗失破财');
      if (name('羊刃')) jb.push('禄刃并见');
      if (jb.length) hits.push('建禄带煞（三命通会 2072-2076）：' + jb.join('；'));
    }
    // 马论
    const maGanPair = ['year', 'month', 'day', 'time'].filter(k => p.gz[k][1] === ma).map(k => p.gz[k][0]);
    if (maGanPair.length) {
      const g = maGanPair[0];
      const kuan = KUAN[p.gz.year[1]];
      const maZhi = ma;
      if (g === kuan[0] && maZhi === kuan[1]) hits.push('驿马·款段 —— ' + p.gz.year[1] + '年生人马在' + ma + '而得' + g + ma + '，平生坎坷，止作选人（三命通会·论驿马 2132/2152-2153）');
      if ((p.dayKongZhi || []).includes(ma)) hits.push('驿马·蹶蹄 —— 带驿马而生日值空亡（日支' + p.gz.day[1] + '落日旬空' + (p.xunKong || '') + '），蹶蹄则复起（三命通会 2133/2154）');
      if (SANHE[p.gz.year[1]].every(z => zhis.includes(z)) && maGanPair.length) hits.push('驿马·折足 —— 三合' + SANHE[p.gz.year[1]].join('') + '全见（三人骑一马），折足则永失，少年虽泰后还穷（三命通会 2134-2137/2153-2154）');
      if (p.gz.day[1] === ma && (p.xunKong || '').length) hits.push('驿马·无粮 —— 生日值马而时落空亡（本局日支为马' + ma + '且旬空' + p.xunKong + '），无粮不食天俸（三命通会 2137-2138）');
      if ((p.dayKongZhi || []).includes(ma)) hits.push('驿马·趋途 —— 驿马' + ma + '落日旬空' + (p.xunKong || '') + '，虽有禄在空亡，漫劳求禄（三命通会 2139/2154）');
      if (WX[ma] === '金' && WX[p.gz.time[1]] === '木') hits.push('驿马·食芻 —— 驿马属金而生时得木，驿马克其时，官可六品（三命通会 2147/2154）');
      if (['庚', '辛'].includes(g)) hits.push('驿马·马头带剑 —— 驿马上见' + g + '（庚辛金），主名振边疆（三命通会 2159）');
      if (['year', 'month', 'day', 'time'].some(k => p.gz[k][1] === LIUHE6[ma])) hits.push('干支合马 —— 驿马' + ma + '与' + LIUHE6[ma] + '相合，主官职崇重（三命通会 2157-2158）');
      {
        const di = shiDiName(p.dayGan, ma);
        if (di === '长生') hits.push('驿马·生马 —— 马在' + ma + '为' + p.dayGan + '长生之地，老方得遂，官卑任远（三命通会 2124-2125）');
        if (di === '帝旺') hits.push('驿马·旺马 —— 马在' + ma + '为' + p.dayGan + '帝旺之地，资壮岁之荣（三命通会 2124）');
        if (di === '墓') hits.push('驿马·库马 —— 马在' + ma + '为' + p.dayGan + '墓库之地，主少年之喜（三命通会 2124）');
      }
    } else {
      if (maGanPair.length === 0) hits.push('驿马' + ma + '（' + p.gz.year[1] + '年生人）不临四柱——柱无驿马，不作马论（三命通会·论驿马；珞子"生马未必有马，背禄未必无禄"）');
    }
    // 禄多马少 / 禄少马多（2088）
    const luCnt = zhis.filter(z => z === lu).length + zhis.filter(z => z === xiangZ).length;
    const maCnt = zhis.filter(z => z === ma).length;
    if (maCnt > 0 && luCnt > maCnt) hits.push('禄多马少，使主神劳（三命通会 2088）');
    if (maCnt > 0 && maCnt > luCnt) hits.push('禄少马多，能操善负（三命通会 2088）');
    return hits;
  }
  // ── 三命通会·论五行旺相休囚死（1390-1427）：按月令定各五行旺相休囚死状态 ──
  function jipanWangXiang(p, xiOpt) {
    const out = { state: '', opt: '' };
    const m = p.monthZhi;
    let table;
    if (['寅', '卯', '辰'].includes(m)) table = { '木': '旺', '火': '相', '水': '休', '金': '囚', '土': '死' };
    else if (['巳', '午'].includes(m)) table = { '火': '旺', '土': '相', '木': '休', '水': '囚', '金': '死' };
    else if (['申', '酉', '戌'].includes(m)) table = { '金': '旺', '水': '相', '土': '休', '火': '囚', '木': '死' };
    else if (['亥', '子'].includes(m)) table = { '水': '旺', '木': '相', '金': '休', '土': '囚', '火': '死' };
    else if (['辰', '戌', '丑', '未'].includes(m)) table = { '土': '旺', '金': '相', '火': '休', '木': '囚', '水': '死' };
    const gz = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const wc = wuxingCount(p);
    const dayWx = WX[p.dayGan];
    const stateStr = ['木', '火', '土', '金', '水'].map(w => w + ':' + (table[w] || '—')).join('　');
    out.state = '月令' + m + '：' + stateStr + '（三命通会·论五行旺相休囚死 1390-1401；"见生旺者未必便作吉论，见休囚死绝未必便作凶言，妙在识其通变"）';
    if (table[dayWx]) out.opt = '日主' + p.dayGan + '（' + dayWx + '）当月' + table[dayWx] + '。';
    if (xiOpt && xiOpt.xi && table[xiOpt.xi]) out.opt += '所选喜用神' + xiOpt.xi + '当月' + table[xiOpt.xi] + '（命理约言 267："日主喜神欲旺相"）。';
    if (xiOpt && xiOpt.ji && table[xiOpt.ji]) out.opt += '所选忌神' + xiOpt.ji + '当月' + table[xiOpt.ji] + '（命理约言 267："忌神欲休囚"，忌神' + (table[xiOpt.ji] === '旺' ? '旺相为忌' : (table[xiOpt.ji] === '相' ? '偏旺' : '得休囚，忌力减轻')) + '）。';
    return out;
  }
  // ── 三命通会·十干十二年生大贵人例 查表（4354-4359，纯查表；原文自承"未必皆大贵人…年月日时多不足凭"）──
  function jipanDaGuiRen(p) {
    const gz4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0] + p.gz[k][1]);
    const TAB = {
      '甲': ['丁卯', '乙未', '戊寅'],
      '乙': ['己卯', '甲戌', '乙亥'],
      '丙': ['庚寅', '丁巳', '丙午'],
      '丁': ['丙午', '壬辰', '丁未'],
      '戊': ['壬戌', '己丑', '戊寅'],
      '己': ['辛未', '己未', '丙寅'],
      '庚': ['甲申', '庚申', '辛巳'],
      '辛': ['丙申', '庚午', '辛巳'],
      '壬': ['辛亥', '壬辰', '丁未'],
      '癸': ['丙辰', '丙辰', '戊子']
    };
    const g = p.gz.year[0];
    const t = TAB[g];
    if (!t) return [];
    if (gz4[1] === t[0] && gz4[2] === t[1] && gz4[3] === t[2]) {
      return ['十干十二年生大贵人例命中 —— ' + g + '年 ' + gz4[1] + '月 ' + gz4[2] + '日 ' + gz4[3] + '时（三命通会 4354-4359）｜原文自注："如此年月日时生者，岂无其人？然未必皆大贵人。天生大贵人，必有冥数气运以主之，年月日时多不足凭。"——仅供查表对照，不作定论。'];
    }
    return [];
  }
  // ── 三命通会·论疾病先知五脏六腑所属干支 机判（5245-5360：部位歌查表 + 五行受亏/死绝/相克/相生成疾条件句）──
  function jipanJiBing(p) {
    const hits = [];
    const cs = tenShenCounts(p);
    const wc = wuxingCount(p);
    const GAN_POS = { '甲': '头', '乙': '顶', '丙': '肩', '丁': '心', '戊': '肋', '己': '腹', '庚': '脐', '辛': '股', '壬': '胫', '癸': '足' };
    const ZHI_POS = { '子': '膀胱/水道/耳', '丑': '胞肚/脾', '寅': '胆/发脉/两手', '卯': '十指/肝', '辰': '皮/肩胸', '巳': '面/咽齿/肛', '午': '精神/眼目', '未': '胃腕/膈脊', '申': '大肠/经络/肺', '酉': '精血/小肠', '戌': '命门/腿踝足', '亥': '头/肾囊' };
    const dayWu = WX[p.dayGan];
    hits.push('部位歌（三命通会 5248-5252）：' + p.dayGan + '→' + GAN_POS[p.dayGan] + '；日支' + p.gz.day[1] + '→' + ZHI_POS[p.gz.day[1]] + '（"若依此法推人病"——干支分属部位查表）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && wc['金'] >= 3) hits.push('甲乙见庚辛申酉多——内主肝胆惊悸、劳瘵、手足顽麻、筋骨疼痛；外主头目眩晕、口眼歪斜、左瘫右痪（三命通会·论疾病 5268-5269，金' + wc['金'] + '个克木）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && wc['火'] >= 3 && wc['水'] <= 1) hits.push('甲乙遇丙丁火多无水相济——痰喘咯血、中风不语、皮肤干燥、内热口干（三命通会 5270，火' + wc['火'] + '个而水' + wc['水'] + '个）');
    if ((p.dayGan === '丙' || p.dayGan === '丁') && wc['水'] >= 3) hits.push('丙丁见壬癸亥子多——内主心气疼痛、颠痫舌强、口痛咽哑；外主潮热发狂、眼暗失明、小肠疝气（三命通会 5273-5274，水' + wc['水'] + '个克火）');
    if ((p.dayGan === '戊' || p.dayGan === '己') && wc['木'] >= 3) hits.push('戊己见甲乙寅卯多——脾胃不和、翻胃隔食、气噎蛊胀、泄泻黄肿（三命通会 5277-5278，木' + wc['木'] + '个克土）');
    if ((p.dayGan === '庚' || p.dayGan === '辛') && wc['火'] >= 3) hits.push('庚辛见丙丁巳午多——肠风痔漏、粪后下血、痰火咳嗽、气喘吐血（三命通会 5281-5282，火' + wc['火'] + '个克金）');
    if ((p.dayGan === '壬' || p.dayGan === '癸') && wc['土'] >= 3) hits.push('壬癸见戊己辰戌丑未多——遗精盗汗、夜梦鬼交、血浊虚损、寒战咬牙、耳聋眼盲（三命通会 5285-5286，土' + wc['土'] + '个克水）');
    {
      const di = shiDiName(p.dayGan, p.monthZhi);
      const BING = { '水': '肾气腰足攻注、滑泄便溺不利（肾）', '火': '肠气结塞、惊悸健忘、精神不安（心小肠）', '木': '虚风目涩眩晕、筋急、爪甲枯悴、喜怒颠倒（肝胆）', '金': '气虚喘急、咳嗽、皮毛焦燥、骨节疼痛、大便秘血（肺大肠）', '土': '面黄减食、隔噻吐逆、肢体怠惰、耳聋神浊健忘（脾胃）' };
      if ((di === '死' || di === '绝') && BING[dayWu]) hits.push(p.dayGan + '（' + dayWu + '）坐月令' + p.monthZhi + '为' + di + '地——"五行有死绝而成疾"，主' + BING[dayWu] + '（三命通会 5332-5338）');
    }
    if (wc['金'] >= 2 && wc['火'] >= 2) hits.push('金火相克——生旺则疡疮瘫肿，死绝则痨瘵呕血（三命通会 5339，金' + wc['金'] + '火' + wc['火'] + '并见）');
    if (wc['木'] >= 2 && wc['土'] >= 2) hits.push('土木相克——生旺主疲闷昏眩、小肠疾痛肿，死绝主吐食症块、或主中风（三命通会 5340-5341）');
    if (wc['金'] >= 2 && wc['木'] >= 2) hits.push('金木相克——生旺主肢足骨节不完、眼目之疾，死绝主气虚精脱、痨疾瘫痪（三命通会 5341-5342）');
    if (wc['水'] >= 2 && wc['土'] >= 2) hits.push('水土相克——主脾湿泄泻、中满痰嗽不利之疾（三命通会 5343）');
    if (wc['火'] >= 2 && wc['木'] >= 2) hits.push('火木相生——生旺则上盛隔壅、目赤头风，死绝则伤寒作狂、闷乱疾（三命通会 5344）');
    if (wc['火'] >= 2 && wc['土'] >= 2) hits.push('火土相生——生旺则胃实，死绝则唇焦红气、热结大便不利（三命通会 5345）');
    if (wc['金'] >= 2 && wc['水'] >= 2) hits.push('金水相生——生旺则气滞，死绝则睛滑（三命通会 5346）');
    if (wc['水'] >= 2 && wc['木'] >= 2) hits.push('水木相生——生旺则呕吐胃虚，死绝则精败、伤寒粘疟（三命通会 5347）');
    if ((p.dayGan === '戊' || p.dayGan === '己') && (p.ssGan.month === '伤官' || p.ssGan.time === '伤官')) hits.push('古歌：戊己生时气不全，月时两处见伤官；必当头面有亏损，脓血之疮苦少年（三命通会 5320-5321）');
    const wsv = wangShuai(p);
    if ((p.dayGan === '丙' || p.dayGan === '丁') && cs['七杀'] > 0 && wsv.verdict === '身弱') hits.push('古歌：丙丁日干五行衰，七煞加临三合来；升合日求衣食缺，耳聋残疾面尘埃（三命通会 5321-5322）');
    if ((p.dayGan === '壬' || p.dayGan === '癸') && wc['水'] >= 3 && (p.ssGan.time === '正财' || p.ssGan.time === '偏财')) hits.push('古歌：壬癸重重叠叠排，时辰设若见天财；纵然头面无癍癞，定主其人眼目灾（三命通会 5322-5323）');
    return hits;
  }
  // ── 渊海·挈要捷驰玄妙诀（1809-1890）+渊源集说（1891-1929）条件句机判 ──
  function jipanQieYao(p, cs, gender, sh) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    const wc = wuxingCount(p);
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const name = (n) => (sh || []).some(h => (h.name || '').includes(n));
    const hasSha = (n) => (sh || []).some(h => (h.name || '').includes(n));
    const yr = YANG_REN[p.dayGan];
    const yrHit = yr && zhis.includes(yr);
    const LU3 = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
    const CHANGSHENG = { '甲': '亥', '乙': '午', '丙': '寅', '丁': '酉', '戊': '寅', '己': '酉', '庚': '巳', '辛': '子', '壬': '申', '癸': '卯' };
    const A = (t, s) => hits.push(t + ' —— ' + s + '（渊海·挈要捷驰玄妙诀/渊源集说）');
    if (guan > 0 && cai > 0) A('逢官而看财，见财富贵', '官财并透');
    if (cs['七杀'] > 0 && yin > 0) A('逢杀而看印，遇印荣华', '七杀与印同透');
    if (yin > 0 && guan > 0) A('逢印看官而遇官，八而七贵', '印官同透');
    if (cai > 0 && cs['七杀'] > 0) A('逢财看杀原有杀，十有九贫', '财杀同透');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && wc['金'] >= 3 && strong) A('甲乙运入西方，身旺功名可许', '甲乙日而金' + wc['金'] + '个（西方金地）身旺——原文"运入"指行运，全局金多作近似提示');
    if ((p.dayGan === '壬' || p.dayGan === '癸') && wc['火'] >= 3 && strong) A('壬癸路经南域，主健为贵', '壬癸日而火' + wc['火'] + '个（南域火地）身旺——同上近似');
    if (yin > 0 && cai > 0 && strong) A('印财不宜身旺地', '印财同透而身旺');
    if (cs['食神'] > 0 && cs['劫财'] > 0) A('食神最喜劫财乡', '食神与劫财同透');
    if (cs['正官'] > 0 && cs['七杀'] > 0 && weak) A('官杀混杂，身弱则贫', '官杀混杂而身弱');
    if (p.ssGan.year === '正官' || p.ssGan.year === '七杀') A('年月官星，早年出仕', '官杀临年柱');
    if (p.ssGan.day === '正官' || p.ssGan.day === '七杀' || p.ssGan.time === '正官' || p.ssGan.time === '七杀') A('日时正贵，晚岁得名', '官杀临日/时柱');
    if (CHANGSHENG[p.dayGan] && zhis.includes(CHANGSHENG[p.dayGan]) && yin > 0) A('胞胎逢印绶，禄享千钟', '时支' + CHANGSHENG[p.dayGan] + '为' + p.dayGan + '之长生（胞胎）而印透');
    if (cai >= 2 && guan > 0) A('财旺生官者，何贵少而富多', '财' + cai + '透而官透');
    if (cs['伤官'] > 0 && cs['正官'] > 0) A('伤官见官者，何官高而财足', '伤官与正官同透——与"伤官见官为祸"为原文两说并存');
    if (cai <= 1 && cs['劫财'] > 0) A('财轻莫逢劫地', '财' + cai + '透而劫财透');
    if (yin >= 2 && cai > 0) A('印多最妙财乡', '印' + yin + '透而财透');
    if (strong && cs['偏财'] > 0) A('身旺偏财何取，必取横财', '身旺而偏财透');
    if (cs['正财'] > 0 && cs['劫财'] > 0) A('主捷正财偏劫，频见妻灾', '正财与劫财同透');
    if (cs['劫财'] > 0 && guan > 0) A('劫财阳刃入官杀，台阁之臣', '劫财与官杀同透');
    if (strong && cs['七杀'] > 0 && yin > 0) A('身旺有杀逢印绶，权断之官', '身旺而杀印同透');
    if (weak && yin > 0 && cai > 0) A('主弱逢印见财星，寻常之客', '身弱而印财同透');
    if (cs['正官'] > 0 && cs['正印'] > 0 && shi === 0) A('正官正印无伤，出仕牧其士庶', '正官正印同透而无伤官损');
    if (p.dayGan === '癸' && p.gz.time[0] === '癸' && (zhis.includes('亥') || zhis.includes('丑'))) A('癸日癸时兼亥丑，魁名及第入翰林', '癸日癸时' + (zhis.includes('亥') ? '亥' : '') + (zhis.includes('丑') ? '丑' : '') + '在支');
    if (p.dayGan === '壬' && p.gz.time[0] === '壬' && (zhis.includes('寅') || zhis.includes('辰'))) A('壬日壬时迭寅辰，高爵承恩登御阁', '壬日壬时' + (zhis.includes('寅') ? '寅' : '') + (zhis.includes('辰') ? '辰' : '') + '在支');
    if (hasSha('日德') && hasSha('魁罡')) A('日德见魁罡，纵吉运，贫寒之士', '日德与魁罡同入命');
    if (hasSha('魁罡') && (cai > 0 || guan > 0)) A('魁罡见财官，任得地，衣禄之人', '魁罡入命而财/官透');
    if (cs['伤官'] > 0 && cs['正官'] > 0 && (cai > 0 || yin > 0)) A('伤官见官，妙入财印之地', '伤官见官而财/印透为解');
    if (cai > 0 && yin > 0 && bi > 0) A('财星破印，贵行比劫之中', '财印同透而比劫亦透为救');
    if (gender === 1 && yrHit && weak) A('男逢阳刃，身弱遇之为奇', '男命阳刃' + yr + '在支而身弱');
    if (cs['正官'] > 0 && yin === 0) A('正官无印，居官不显', '正官透而无印');
    if (yrHit && cs['七杀'] > 0) A('阳刃七杀，出牧驰名（又"阳刃兼会七杀，千里徒流"——原文两说并存）', '阳刃与七杀并见');
    if (hasSha('亡神') && cs['七杀'] > 0) A('亡神拱杀，盗贼之徒', '亡神与七杀并见');
    if (yin >= 2 && strong) A('印旺身强多嗜酒', '印' + yin + '透而身强');
    if (strong && yin >= 2) A('身印俱强，平生少病', '身强而印' + yin + '透');
    if (cs['食神'] >= 2) A('食神生旺，胜似财官', '食神' + cs['食神'] + '透');
    if (cai === 0 && guan === 0 && shi === 0) A('绝食、绝财、绝官者，无限贫穷', '食财官皆不透');
    if (guan > 0 && (p.ssGan.time === '正财' || p.ssGan.time === '偏财')) A('官星为命，时得偏正财为福', '官星透而时干见财');
    if (cs['七杀'] > 0 && (hasSha('天德') || hasSha('月德'))) A('七杀临身，逢天月二德为祥', '七杀透而天/月德入命');
    if (cs['正官'] > 0 && cs['劫财'] > 0) A('官星若遇劫财，虽官无贵', '正官与劫财同透');
    if (cs['七杀'] > 0 && cai > 0) A('七杀如逢资助，其杀愈重', '七杀得财生——财透资杀');
    if (yin > 0 && cs['劫财'] > 0) A('露形印绶，得劫财为贵', '印与劫财同透');
    if (cs['伤官'] > 0 && yin > 0) A('伤官要见印绶，贵不可言', '伤官与印同透（伤官佩印）');
    if (LU3[p.dayGan] && p.gz.time[1] === LU3[p.dayGan] && cs['食神'] > 0) A('归禄若见子孙（食神），禄无限妙', '时支' + LU3[p.dayGan] + '为日禄（归禄）而食神透');
    if ((p.gz.year[1] === yr || p.gz.month[1] === yr)) A('年月立有阴阳阳刃，刑罚重犯', '阳刃' + yr + '临年/月支');
    if (cs['正官'] > 0 && cs['七杀'] > 0 && (hasSha('天德') || hasSha('月德'))) A('官杀混逢天月德，寿位高迁', '官杀混杂而天/月德入命为解');
    if (yrHit && yin > 0) A('阳刃若逢印绶，纵贵，有病疾在身', '阳刃在支而印透');
    if (hasSha('金神') && wc['水'] >= 2 && weak) A('金神运入水乡，身衰夭折', '金神入命而水' + wc['水'] + '个身弱——"运入"指行运，全局水多作近似提示');
    if (cai > 0 && cs['劫财'] > 0) A('用财若遇劫夺，一生贫困', '财与劫财同透');
    return hits;
  }
  // ── 渊海·子平举要歌（709-715）+喜忌篇（731-772）剩余条件句机判（外格46格已另卡覆盖，此处只取未被覆盖的条件断句）──
  function jipanXiJiPian(p, cs, gender, sh) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'], shi = cs['食神'] + cs['伤官'];
    const gz4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k]);
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const gans = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const yr = YANG_REN[p.dayGan];
    const LU = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
    const SIX = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
    const TRIPLE = [['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑']];
    const hasSha = (n) => (sh || []).some(h => (h.name || '').includes(n));
    const A = (t, s) => hits.push(t + ' —— ' + s + '（渊海·喜忌篇/子平举要歌）');
    // 举要歌
    if (cs['正官'] > 0 && cs['七杀'] > 0) A('官杀俱露，混杂财官取财议 —— 原文两说："略有一位正官，官杀混杂反贱"与"官星七杀交差，却以合杀为贵"并存', '正官与七杀同透，' + (cai > 0 ? '本局有财可取议' : '本局无财') + '（未判贵贱，两说照录）');
    if (cs['正官'] > 0 && cs['七杀'] === 0 && gans.includes('正官') && zhis.some(z => ['寅', '申', '巳', '亥'].includes(z))) A('露官藏杀方为福', '干透正官而支有' + zhis.filter(z => ['寅', '申', '巳', '亥'].includes(z)).join('') + '（驿马四长生位，藏杀之象）');
    if (cs['七杀'] > 0 && cs['正官'] === 0 && gans.includes('七杀') && zhis.some(z => ['寅', '申', '巳', '亥'].includes(z))) A('露杀藏官是祸胎', '干透七杀而支有' + zhis.filter(z => ['寅', '申', '巳', '亥'].includes(z)).join('') + '（驿马四长生位）——原文断语，未作祸福判定照录');
    if (p.ssGan.year === '伤官') A('年上伤官最可嫌，重怕伤官不可蠲', '年干见伤官' + (cs['伤官'] >= 2 ? '（伤官重）' : ''));
    if (p.ssGan.time === '七杀' && shi > 0 && strong) A('时逢七杀，月制干强，其杀反为权印', '时干七杀而食伤透（月制）且身旺——原文"见之未必为凶，月制干强其杀反为权印"');
    // 喜忌篇
    if (p.dayGan === '戊' && p.gz.month[1] === '午') A('戊日午月，勿作刃看；时岁火多，却为印绶', '戊日午月' + (wcCount(p)['火'] >= 2 ? '，火' + wcCount(p)['火'] + '个作印绶看' : '') + '——原文"戊日午月勿作刃看"（午为戊之刃位但戊以火为印）');
    if (LU[p.dayGan] === p.gz.month[1] && cs['七杀'] > 0) A('月令虽逢建禄，切忌会杀为凶', p.dayGan + '建禄' + p.gz.month[1] + '月而七杀透');
    if (p.ssGan.month === '正印' || p.ssGan.month === '偏印') {
      const nianShiCai = ['year', 'time'].filter(k => p.ssGan[k] === '正财' || p.ssGan[k] === '偏财');
      if (nianShiCai.length) A('印绶生月，岁时忌见财星；运入财乡，却宜退身避位', '月干' + p.ssGan.month + '而' + nianShiCai.map(k => (k === 'year' ? '年' : '时') + '干见财').join('、') + '——原文为忌（"运入财乡"指行运）');
    }
    if (p.ssGan.time === '劫财' || (yr && p.gz.time[1] === yr)) A('劫财阳刃，切忌时逢；岁运并临，灾殃立至', '时' + (p.ssGan.time === '劫财' ? '干劫财' : '支' + p.gz.time[1] + '为阳刃') + '——原文"切忌时逢"（岁运并临指行运，作原文提示）');
    {
      let he = 0;
      const HE5 = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
      for (let i = 0; i < gans.length; i++) for (let j = i + 1; j < gans.length; j++) if (HE5[gans[i]] === gans[j]) he++;
      if (he >= 2 && cs['正官'] > 0) A('地支天干合多，亦云贪合忘官', '天干五合' + he + '组而正官透——原文"贪合忘官荣不足"');
      if (he >= 2 && cs['七杀'] > 0) A('贪合忘杀为己福', '天干五合' + he + '组而七杀透——原文断语，作提示照录');
      let tri = 0, six = 0;
      for (const t of TRIPLE) if (t.every(z => zhis.includes(z))) tri++;
      for (const z of zhis) if (zhis.includes(SIX[z]) && z < SIX[z]) six++;
      if (tri + six >= 1) A('四柱干支，喜三合六合之地', '地支三合' + tri + '组、六合' + six + '组');
    }
    if (weak && yr && p.gz.time[1] === yr) A('日干无气，时逢阳刃不为凶', '日干' + (ws.verdict) + '而时支' + p.gz.time[1] + '为阳刃——原文"时逢阳刃不为凶"');
    if (cs['七杀'] >= 2 && strong) A('四柱杀旺运纯，身旺为官清贵', '七杀' + cs['七杀'] + '透而身旺——原文断语（另"柱中七杀全彰，身旺极贫"两说并存照录）');
    if (cs['七杀'] >= 2 && strong) A('柱中七杀全彰，身旺极贫', '七杀' + cs['七杀'] + '透而身旺——与"杀旺身旺为官清贵"为原文两说并存，照录不作定论');
    if (gender === 0 && cs['七杀'] === 0 && hasSha('天乙')) A('无杀女人之命，一贵可作良人', '女命无七杀而天乙贵人入命');
    if (gender === 0) {
      const guiN = (sh || []).filter(h => /天乙/.test(h.name || '')).length;
      let he2 = 0;
      const HE5B = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
      for (let i = 0; i < gans.length; i++) for (let j = i + 1; j < gans.length; j++) if (HE5B[gans[i]] === gans[j]) he2++;
      if (guiN >= 2 && he2 >= 2) A('贵众合多，定是师妮娼婢', '女命天乙' + guiN + '位、天干五合' + he2 + '组——原文断语，作提示照录（定性词照录原文，不作实判）');
    }
    if (p.ssGan.time === '七杀' && shi >= 2) A('偏官时遇，制伏太过，乃是贫儒', '时干七杀而食伤' + shi + '透（制伏太过）');
    if (cs['伤官'] > 0 && cs['正官'] > 0) A('四柱伤官，运入官乡必破', '原局伤官与正官同见——"运入官乡"指行运，原局见官作近似提示（伤官见官两说并存处照录）');
    if (cai >= 2 && weak && cs['食神'] > 0 && cs['七杀'] > 0) A('财多身弱食神来，食神会杀必为灾', '财' + cai + '透、身弱、食神与七杀同透（食神会杀）');
    return hits;
  }
  // ── 神峰通考·讲命捷径赋 条件句机判（1858-1860；四言/五言独步重复篇不入此卡）──
  function jipanJiangMing(p, cs, gender) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'], shi = cs['食神'] + cs['伤官'];
    const wc = wuxingCount(p);
    const gans = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const yr = YANG_REN[p.dayGan];
    const A = (t, s) => hits.push(t + ' —— ' + s + '（神峰通考·讲命捷径赋）');
    if ((p.dayGan === '壬' || p.dayGan === '癸') && ['巳', '午'].includes(p.gz.month[1])) A('壬癸生巳午月，逆运当主荣华', p.dayGan + '日' + p.gz.month[1] + '月——"逆运"指行运，原局条件作提示');
    if ((p.dayGan === '丙' || p.dayGan === '丁') && p.gz.month[1] === '亥') A('丙丁值孟冬时，顺行早当发达', p.dayGan + '日亥月——"顺行"指行运，原局条件作提示');
    if (p.dayGan === '壬' && p.gz.month[1] === '酉' && cai > 0) A('壬水喜财官，惟八月逢财则破', '壬日酉月而财透');
    if ((p.dayGan === '戊' || p.dayGan === '己') && wc['水'] >= 3) A('戊己入北方之运，一生作事无成', '戊己日而水' + wc['水'] + '个（北方水）——"入运"指行运，全局水多作近似提示');
    if ((p.dayGan === '庚' || p.dayGan === '辛') && wc['火'] === 0) A('庚金无火，非夭即贫', p.dayGan + '日四柱无火');
    if (strong && cai === 0) A('身旺无财，纵寿则否', '日主身旺而四柱无财');
    if (yr && p.gz.month[1] === yr && (cai > 0 || guan > 0)) A('建刃若行财官运，为人必白手成家', '月支' + p.gz.month[1] + '为' + p.dayGan + '之刃，财/官' + (cai > 0 ? '财' : '') + (guan > 0 ? '官' : '') + '透');
    if ((p.dayGan === '庚' || p.dayGan === '辛') && wc['火'] >= 2) A('庚金若行巳午方，定是中年损寿', p.dayGan + '日而巳午火' + wc['火'] + '个——"行方"指行运，全局火多作近似提示');
    if (yr && p.gz.month[1] === yr) A('月逢羊刃，运神喜杀以嫌财轻', '月支' + p.gz.month[1] + '为' + p.dayGan + '之刃');
    if (cs['七杀'] > 0 && shi > 0) A('杀透天干，岁月怕官而喜制', '七杀透而食伤' + shi + '透为制');
    if (cs['七杀'] === 1 && shi >= 2) A('杀轻制重，为人到底屯禀', '七杀1透而食伤' + shi + '透（制伏过重）');
    if (cs['七杀'] >= 2 && shi <= 1 && strong) A('杀重制轻，身旺终须发达', '七杀' + cs['七杀'] + '透、食伤' + shi + '、日主身旺');
    if (gender === 1 && p.ssGan.time === '伤官') A('时带伤官，男命决然损子', '男命时干伤官——原文断语（伤官损子，配合"伤官用财死宫有子"两说并存照录）');
    if (gender === 0 && yin > 0) A('柱中印绶，女命决定无儿', '女命印' + yin + '透——原文断语（配合"印绶多而日主旺子息难成"照录）');
    if (yin > 0 && cs['伤官'] > 0) A('印绶与伤官，为人奸吝偏浅，兼作事虚花', '印与伤官同透——原文断语，作提示照录');
    if (p.ssGan.month === '正官' || p.ssGan.month === '七杀' || p.ssGan.time === '正官' || p.ssGan.time === '七杀') A('官杀透于时月，浮潺浅露之人', (p.ssGan.month === '正官' || p.ssGan.month === '七杀' ? '月干' : '') + (p.ssGan.time === '正官' || p.ssGan.time === '七杀' ? '时干' : '') + '见官杀——原文断语，作提示照录');
    if (wc['金'] >= 2 && wc['水'] >= 2) A('金白水清，聪明特达', '金' + wc['金'] + '水' + wc['水'] + '并见');
    if (wc['土'] >= 3 && wc['火'] <= 1) A('土多火少，晦性昏朦', '土' + wc['土'] + '个而火' + wc['火'] + '个');
    if (['辰', '戌', '丑', '未'].includes(p.gz.month[1]) && cs['正官'] > 0 && cs['七杀'] > 0) A('月逢墓库，官杀混杂亦无伤', '月支' + p.gz.month[1] + '（墓库）而官杀混杂');
    {
      const gzStr = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0] + p.gz[k][1]);
      const sameGZ = gzStr.filter((s, i) => gzStr.indexOf(s) !== i).length > 0;
      if (sameGZ && cs['伤官'] >= 2) A('干支同而伤官重，害子刑妻', '四柱干支同字而伤官' + cs['伤官'] + '透');
    }
    if (cai >= 2 && strong) A('财星旺而日主强，兴家创业', '财' + cai + '透而身旺');
    if (p.dayGan === '丁' && p.gz.month[1] === '卯' && cs['七杀'] > 0) A('二月丁火有杀，荣贵非常', '丁日卯月而七杀透');
    if (p.gz.month[1] === '子' && ['丙', '丁'].includes(p.dayGan) && cai === 0) A('子提干火无财，飘荡之士', p.dayGan + '日子月而四柱无财');
    if (strong && cs['七杀'] === 1 && shi === 0) A('身强杀浅，不宜有制', '身旺而七杀1透、无食伤（原文"不宜有制"）');
    if (yin >= 2 && strong && cai > 0) A('印多身旺，最喜逢财', '印' + yin + '透、身旺而财透');
    if (cai + guan >= 2 && strong) A('财官旺而身主强，多主富贵', '财官共' + (cai + guan) + '透而身旺');
    if (strong && cai + guan <= 1) A('财官轻而日太旺，亦见贫寒', '身旺而财官仅' + (cai + guan) + '透');
    if (yin >= 2 && cs['七杀'] > 0) A('印绶多而宜见杀', '印' + yin + '透而七杀透（杀印相生之喜）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && p.gz.month[1] === '丑') A('甲乙木生丑月，必主光亨', p.dayGan + '日丑月');
    if ((p.dayGan === '壬' || p.dayGan === '癸') && p.gz.month[1] === '申') A('壬癸水值孟秋，终当富贵', p.dayGan + '日申月');
    if (gender === 0 && cs['食神'] === 1) A('一位食神，富贵贤良之女', '女命食神1透');
    if (gender === 0 && cs['正官'] > 0 && cs['七杀'] > 0 && cai >= 2) A('官杀混而财星多，夫多重叠', '女命官杀混杂而财' + cai + '透');
    if (zhis.includes('辰')) A('四柱中有辰龙，方为得化', '地支见辰——原文指化气格见辰为得化之机，非化格成立判');
    if (cs['比肩'] + cs['劫财'] === 0) A('三元内无比劫，可作得从', '四柱无比劫——原文"三元内无比劫，可作得从"，从格是否成立仍属活层，此条只作提示照录');
    return hits;
  }
  // ── 神峰·一行禅师天元赋 十干生克组合提示（2917-3060；原文为"日干×天干"生克断句，查表式）──
  function jipanTianYuan(p, cs) {
    const hits = [];
    const gans = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const has = (g) => gans.includes(g);
    const hasZ = (z) => zhis.includes(z);
    // 印绶吉句表（原文 2920-2936）
    const YIN = { '甲': ['癸', '甲得癸而滋荣，衣食自然丰足'], '乙': ['壬', '乙伴壬而获福，天赐禄位高崇'], '丙': ['乙', '丙乙友会，平生福寿超群，出世深茂才举'], '戊': ['丁', '戊印丁兮，似虎居山谷之威'], '己': ['丙', '己交丙兮，象龙得风云之势'], '庚': ['己', '庚逢己丑，官禄有余'], '辛': ['戊', '辛到戊乡，衣食自足'], '壬': ['辛', '壬辛得会，福寿无疆'], '癸': ['庚', '癸庚相逢，偏饶仆马'] };
    // 食神吉句表（原文 2962-2976）
    const SHI = { '甲': ['丙', '尊堂福寿崇高，皆言甲到丙乡'], '乙': ['丁', '朝省权贵优升，盖为乙居丁舍'], '丙': ['戊', '官木并叠，丙食戊而成功'], '丁': ['己', '谷麦盈仓，丁啖己而有旺'], '戊': ['庚', '要得丰足，无过戊得逢庚'], '己': ['辛', '欲问高迁，全赖己加辛地'], '庚': ['壬', '满堂金玉，庚禄有壬'], '辛': ['癸', '广置田园，辛能食癸'], '壬': ['甲', '壬食甲而有旺，众福如麻'], '癸': ['乙', '癸向乙而生成，入食列鼎'] };
    // 伤官凶句表（原文 2982-2994，原文为"盗气/散财"断）
    const SHANG = { '甲': ['丁', '甲逢丁而成焰，资财累岁多亏（伤官盗气）'], '乙': ['丙', '乙遇丙而化灰，金玉自消难聚（伤官盗气）'], '戊': ['辛', '戊若逢辛，须仗吉杀以扶持（土金伤官）'], '庚': ['癸', '庚申见癸，荡散资金（须得土以止之）'], '辛': ['壬', '辛禄遇壬，销熔福禄（金水伤官，须土止之）'], '壬': ['乙', '年少逢灾，壬伤乙运（伤官）'], '癸': ['甲', '祖财随废，癸被甲侵（伤官，有制则吉无制则凶）'] };
    // 正官吉句表（原文 3020-3036）
    const GUAN = { '甲': ['辛', '甲见辛而化官，刚柔相济'], '乙': ['庚', '乙见庚而为福，兄弟同乡'], '丙': ['癸', '水火既济，却言丙对癸乡'], '丁': ['壬', '意气相承，乃是丁归壬舍'], '戊': ['乙', '戊临乙位，土得木而生成'], '己': ['甲', '己向甲乡，阴遇阳而可贵'], '庚': ['丁', '白虎通道，庚加丁临'], '辛': ['丙', '太阴得路，辛归丙舍'], '壬': ['己', '壬怜己兮，远泛洪波（须阳土止之）'], '癸': ['戊', '癸喜戊兮，澄澜漂渺'] };
    // 七杀凶句表（原文 2942-2956）
    const SHA = { '甲': ['庚', '阳木甲逢庚败，枝干不得无伤（行火运制庚为解）'], '乙': ['辛', '阴木乙遇辛金，茎叶自然有损（木主有气则不畏）'], '丙': ['壬', '炎炎丙火，遇壬而赫赫无光'], '丁': ['癸', '烁烁阴丁，逢癸而明辉自暗'], '戊': ['甲', '戊守甲位，惟赖庚方能吉（阳土被阳木克，须庚金救）'], '庚': ['丙', '庚逢丙战，势自倾危（须壬癸制火）'], '辛': ['丁', '辛被丁侵，克伐成害（须壬癸制火）'], '壬': ['戊', '壬忧戊至，蹇涩难通'], '癸': ['己', '癸怕己临，屯晦惊惶'] };
    const Y = (t, s) => hits.push(t + ' —— ' + s + '（神峰通考·一行禅师天元赋）');
    for (const [g, [gan, txt]] of Object.entries(YIN)) if (p.dayGan === g && has(gan)) Y(txt, p.dayGan + '日见' + gan + '（印绶生身）');
    for (const [g, [gan, txt]] of Object.entries(SHI)) if (p.dayGan === g && has(gan)) Y(txt, p.dayGan + '日见' + gan + '（食神就禄）');
    for (const [g, [gan, txt]] of Object.entries(SHANG)) if (p.dayGan === g && has(gan)) Y(txt, p.dayGan + '日见' + gan + '（伤官盗气）');
    for (const [g, [gan, txt]] of Object.entries(GUAN)) if (p.dayGan === g && has(gan)) Y(txt, p.dayGan + '日见' + gan + '（正官相济）');
    for (const [g, [gan, txt]] of Object.entries(SHA)) if (p.dayGan === g && has(gan)) Y(txt, p.dayGan + '日见' + gan + '（七杀克身）');
    if (p.dayGan === '己' && (hasZ('卯') || hasZ('寅'))) Y('己坐乙乡，知是干头有鬼', '己日坐' + (hasZ('卯') ? '卯' : '寅') + '——原文"己土日主生临卯位，乃为坐下之鬼；身旺则逢官为福，身弱则遇鬼为祸"');
    if (p.dayGan === '庚' && (has('己') || hasZ('丑'))) Y('庚逢己丑，官禄有余', '庚日见己/丑（印绶）');
    // 化气组合（原文 3040-3048，只列组合提示，不作化格成立判）
    const HE5 = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' };
    const HUA = { '甲己': '化土为福，则夫妇遐昌', '乙庚': '成金得位，则东西类化', '丙辛': '化水，智显则必主文章', '丁壬': '为木，聪明则近善多仁', '戊癸': '得化，禄位崇高，三才可立' };
    for (const [k, v] of Object.entries(HUA)) {
      const a = k[0], b = k[1];
      if (has(a) && has(b) && HE5[a] === b) Y(k + '相逢，' + v, '天干' + a + b + '并透——原文化气断，化格是否成立属活层，只作组合提示照录');
    }
    return hits;
  }
  // ── 命理探源·论六亲常法 条件句机判（599 行按文；袁氏"常法"条件句，喜用前置处只作提示）──
  function jipanTanYuanLiuQin(p, cs, gender) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'], bi = cs['比肩'] + cs['劫财'], shi = cs['食神'] + cs['伤官'];
    const yr = YANG_REN[p.dayGan];
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const A = (t, s) => hits.push(t + ' —— ' + s + '（命理探源·论六亲按 599）');
    if (cs['偏财'] >= 2) A('偏财旺者，主父寿', '偏财' + cs['偏财'] + '透');
    if (bi >= 2) A('比劫重者，主父丧', '比劫' + bi + '透');
    if (cs['正印'] >= 1) A('正印有气者，主母寿', '正印' + cs['正印'] + '透' + (strong ? '，日主亦旺' : ''));
    if (cai >= 2 && cs['正印'] > 0) A('财旺破印者，主母丧', '财' + cai + '透而正印亦透（财旺克印）');
    if (bi >= 2) A('比肩劫财旺者，雁行众（兄弟多）', '比劫' + bi + '透');
    if (guan >= 2) A('正官七杀盛者，昆仲希（兄弟稀少）', '官杀' + guan + '透');
    if (gender === 1 && cs['正财'] > 0 && guan > 0 && p.ssGan.month === '正财') A('正财得令、官煞有权，男命则妻贤子盛', '男命月干正财而官杀亦透');
    if (gender === 1 && bi + shi + (yr && zhis.includes(yr) ? 1 : 0) >= 3) A('叠逢比、刃、伤、食者，则有鼓盆丧明之痛（男命）', '男命比劫' + bi + '、伤食' + shi + (yr && zhis.includes(yr) ? '、阳刃' + yr : '') + '重叠');
    if (gender === 0 && guan === 1 && shi <= 1) A('官煞不杂而有精神、伤食不繁而居旺相，女命则夫荣子贵', '女命正官/七杀' + guan + '透而伤食' + shi + '（伤食不繁）');
    if (gender === 0 && shi + yin >= 2) A('重见伤、食、枭、印者，女命有敬姜器夫器子之悲', '女命伤食' + shi + '、枭印' + yin + '并见——原文断语，作提示照录');
    return hits;
  }
  // ── 子平真诠评注·论通根重轻 明细（305-307；原文"长生禄旺根之重者，墓库余气根之轻者"）──
  function jipanZhenQuanTongGen(p) {
    const hits = [];
    const zhis = ['year', 'month', 'day', 'time'];
    const A = (t, s) => hits.push(t + ' —— ' + s + '（子平真诠评注·论通根重轻 305-307）');
    // 长生禄刃（根之重者）：原文例"甲逢亥子寅卯"。取各日干之长生/禄/刃（阳刃）/帝旺
    const CS_SD = { '甲': ['亥', '寅', '卯'], '乙': ['辰', '卯', '寅'], '丙': ['寅', '巳', '午'], '丁': ['未', '巳', '午'], '戊': ['寅', '巳', '午'], '己': ['未', '巳', '午'], '庚': ['巳', '申', '酉'], '辛': ['戌', '申', '酉'], '壬': ['申', '亥', '子'], '癸': ['丑', '亥', '子'] };
    const YY_MA = { '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子' };
    // 墓库（根之轻者）：甲未/丙戌/庚丑/壬辰（原文 306"未为木库，戌为火库，辰为水库，丑为金库"）
    const KU = { '甲': '未', '丙': '戌', '戊': '戌', '庚': '丑', '壬': '辰' };
    // 余气（根之轻者）：乙辰/丁未/辛戌/癸丑（原文 306"辰为木之余气，未为火之余气，戌为金之余气，丑为水之余气"）
    const YU = { '乙': '辰', '丁': '未', '辛': '戌', '癸': '丑' };
    // 非本库不作论（原文 305"乙逢戌、丁逢丑不作此论"；徐注"木至午火至酉皆为死地，阴长生不作根"）
    for (const k of zhis) {
      const z = p.gz[k][1];
      const list = [];
      if (CS_SD[p.dayGan] && CS_SD[p.dayGan].includes(z)) list.push('长生禄刃根（重）');
      if (YY_MA[p.dayGan] === z) list.push('阳刃（重）');
      if (KU[p.dayGan] === z) list.push('墓库根（轻）');
      if (YU[p.dayGan] === z) list.push('余气根（轻）');
      const cg = (D && D.zanggan && D.zanggan[z]) || [];
      if (cg.some((c) => WX[c] === WX[p.dayGan])) {
        // 同气藏干（通根）；区分是否为"非本库不作论"情形
        const ban = (p.dayGan === '乙' && z === '戌') || (p.dayGan === '丁' && z === '丑') || (p.dayGan === '乙' && z === '午') || (p.dayGan === '丁' && z === '酉');
        if (!list.length && !ban) list.push('同气通根（藏干含' + cg.filter((c) => WX[c] === WX[p.dayGan]).join('') + '）');
      }
      if (list.length) A(k + '支' + z + '为' + p.dayGan + '日之根：' + list.join('；'), '原文例证见 305"甲逢未丙逢戌墓库根、乙逢辰丁逢未余气根、甲逢亥子寅卯长生禄刃"');
    }
    if (!hits.length) A('四支无' + p.dayGan + '日通根', '原文"十干不论月令休囚，只要四柱有根，便能受财官食神而当伤官七煞"——本局四支无同气之根，作提示照录');
    return hits;
  }
  // ── 命理探源·论男女合婚 625-628（双人八字机判：夫星/子星/比劫食伤相配/五行损益互补）──
  function jipanHeHun(pA, pB, gA, gB) {
    const hits = [];
    // 女方 = 性别为 0 者；夫星/子星判定按女方日主（原文 627 按）
    const W = gA === 0 ? pA : pB, M = gA === 0 ? pB : pA;
    const wcsW = tenShenCounts(W), wcsM = tenShenCounts(M);
    const wsW = wangShuai(W);
    const gW = wcsW['正官'] + wcsW['七杀'], shiW = wcsW['食神'] + wcsW['伤官'], caiW = wcsW['正财'] + wcsW['偏财'], yinW = wcsW['正印'] + wcsW['偏印'], biM = wcsM['比肩'] + wcsM['劫财'], shiM = wcsM['食神'] + wcsM['伤官'];
    const wcW = wuxingCount(W), wcM = wuxingCount(M);
    const A = (t, s) => hits.push(t + ' —— ' + s + '（命理探源·论男女合婚 625-628）');
    // 夫星（女方日主）：原文"看夫星不可泥正官，日主平正者以官煞为夫星；官煞盛而日主衰弱者以伤食为夫星；官煞缺或衰而日主盛者以财为夫星"
    if (wsW.verdict === '中和') A('女方日主平正：以官、煞为夫星', '女命旺衰为' + wsW.verdict + '（原文"不可泥正官"）');
    if (gW >= 2 && wsW.verdict === '身弱') A('女方官煞盛而日主衰弱：以伤食为夫星', '女命官煞' + gW + '透、身弱');
    if (gW <= 1 && wsW.verdict === '身旺') A('女方官煞缺/衰而日主盛：以财为夫星', '女命官煞仅' + gW + '、身旺');
    // 子星（女方日主）：原文"食神伤官不弱而日主有气者以食伤为子星；食伤盛而日主衰者以枭印为子星"
    if (shiW >= 2 && wsW.verdict !== '身弱') A('女方食伤不弱而日主有气：以食伤为子星', '女命食伤' + shiW + '透、日主' + wsW.verdict);
    if (shiW >= 2 && wsW.verdict === '身弱') A('女方食伤盛而日主衰：以枭印为子星', '女命食伤' + shiW + '透、身弱（原文"参伍错综，岂可见伤官即云妨夫"）');
    // 比劫↔食伤相配（原文 627"男命比肩劫财重者择女命伤官食神重者；似合正理，然按五行每多抵触"）
    if (biM >= 2 && shiW >= 2) A('男方比劫重、女方食伤重：原文谓可配（比劫食伤相配）', '男比劫' + biM + '、女食伤' + shiW + '——原文自批"似合正理，然按五行每多抵触"，作提示级');
    // 五行损益互补（原文 628 两例 + "余仿此"）
    const maxOf = (wc) => Object.entries(wc).sort((a, b) => b[1] - a[1])[0];
    const mMax = maxOf(wcM);
    if (mMax[0] === '木' && mMax[1] >= 2 && wcM['金'] <= 1) {
      const parts = [];
      if (wcW['金'] >= 2) parts.push('女金旺——得刚金补之则为尽美');
      if (wcW['土'] >= 2) parts.push('女土旺——得土生金亦佳');
      if (wcW['火'] >= 2) parts.push('女火旺——得火较次');
      if (wcW['水'] >= 2 || wcW['木'] >= 2) parts.push('女水/木旺——得水木则无取');
      if (parts.length) A('男命木盛（木' + mMax[1] + '个、金' + wcM['金'] + '个）：' + parts.join('；'), '原文例"男命木盛亦金者，得女命之刚金补之则为尽美…余仿此"，按双方五行计数近似');
    }
    const wMax = maxOf(wcW);
    if (wMax[0] === '金' && wMax[1] >= 2 && wcW['火'] <= 1) {
      const parts = [];
      if (wcM['火'] >= 2) parts.push('男火旺——得烈火助之则为尽美');
      if (wcM['木'] >= 2) parts.push('男木旺——得木生火亦佳');
      if (wcM['水'] >= 2) parts.push('男水旺——得水较次');
      if (wcM['金'] >= 2 || wcM['土'] >= 2) parts.push('男金/土旺——得金土则无取');
      if (parts.length) A('女命金盛（金' + wMax[1] + '个、火' + wcW['火'] + '个）：' + parts.join('；'), '原文例"女命金刚喜火者，得男命之烈火助之则为尽美…余仿此"，按双方五行计数近似');
    }
    if (!hits.length) A('本对双方未命中夫星/子星/比劫食伤/五行损益原文条件句', '未命中如实不编造——合婚不可执一，须"统观命运，乃无遗憾"（袁按 628）');
    return hits;
  }
  // ── 渊海子平·六亲散论补缺机判（论兄弟姊妹500-509 / 论妻妾510-527 / 论子息528-541 / 论小儿542-545；论父485-491与论母492-499已入 jipanLiuQin）──
  function jipanYuanHaiLiuQin(p, cs, gender) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'], bi = cs['比肩'] + cs['劫财'], shi = cs['食神'] + cs['伤官'];
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const A = (t, s) => hits.push(t + ' —— ' + s + '（渊海子平）');
    const yangGan = ['甲', '丙', '戊', '庚', '壬'].includes(p.dayGan);
    const yangShi = ['甲', '丙', '戊', '庚', '壬'].includes(p.gz.time[0]);
    // 论兄弟姊妹（500-509）
    if (p.dayGan === '甲' && (cs['比肩'] + cs['劫财'] >= 2)) A('甲乙寅卯既多，则兄弟姊妹夺财不和，争斗是非', '甲日比劫' + (cs['比肩'] + cs['劫财']) + '透（504）');
    if (p.dayGan === '甲' && p.gz.month[1] === '寅') A('甲木寅月，乙木受制，主兄旺弟衰', '甲日寅月（508）');
    // 论妻妾（510-527）
    if (p.dayGan === '甲' && ['year', 'month', 'day', 'time'].filter(k => ['亥', '卯', '未'].includes(p.gz[k][1])).length >= 2) A('甲木见乙木局、亥卯未，伤妻', '甲日而亥卯未' + ['year', 'month', 'day', 'time'].filter(k => ['亥', '卯', '未'].includes(p.gz[k][1])).length + '支见（513）');
    if (cai > 0) {
      const caiZhi = ['year', 'month', 'day', 'time'].filter(k => p.ssGan[k] === '正财' || p.ssGan[k] === '偏财').map(k => p.gz[k][1]);
      const caiChang = caiZhi.map(z => shiDiName(p.dayGan, z));
      if (caiChang.some(c => ['死', '绝', '墓', '败'].includes(c))) A('财衰败墓绝，主妻有疾不贤，否则年高再嫁', '财星坐' + caiZhi.join('、') + '（' + caiChang.join('、') + '地）（515）');
    }
    if (bi > 0 && cai > 0) A('比肩分夺、财临沐浴桃花，主妻妾私通', '比劫与财同见（518）');
    if (['day', 'month'].some(k => p.ssZhi[k] && ['正财', '偏财', '正官'].includes(p.ssZhi[k][0]))) A('日下月下坐财官，主妻多内助，更得妻财', (p.ssZhi.day && ['正财', '偏财', '正官'].includes(p.ssZhi.day[0]) ? '日支' + p.gz.day[1] + '坐' + p.ssZhi.day[0] : '') + (p.ssZhi.month && ['正财', '偏财', '正官'].includes(p.ssZhi.month[0]) ? (p.ssZhi.day && ['正财', '偏财', '正官'].includes(p.ssZhi.day[0]) ? '且' : '') + '月支' + p.gz.month[1] + '坐' + p.ssZhi.month[0] : '') + '（519，原文"坐财官"，不含七杀）');
    if (p.ssZhi.day && ['正财', '偏财'].includes(p.ssZhi.day[0]) && cs['偏财'] > 0) A('偏财得位，妾胜于妻', '日支' + p.gz.day[1] + '本气偏财而偏财透（520）');
    if (guan >= 2) A('官杀重见，妻招干蛊可畏', '官杀' + guan + '透（522）');
    if (cai >= 2 && weak && gender === 1) A('财多身弱，妻反胜夫', '男命财' + cai + '透而身弱（524）');
    if (cai >= 2 && strong) A('财命有气，妻妾和顺，是得妻力', '财' + cai + '透而身旺（525）');
    if (p.ssZhi.day && p.ssZhi.day[0] === '空亡') A('日坐空亡，难为妻妾', '日支' + p.gz.day[1] + '空亡（526）');
    // 论子息（528-541）
    if (gender === 1) A('八字有一杀一子，二杀二子，无杀无子', '男命七杀' + cs['七杀'] + '透（按原文查表 540；地支藏杀未计——若时上无子星、运行官杀旺乡主有子 538）');
    if (gender === 1 && cs['七杀'] > 0) A('阳日阳时男重见；阳日阴时先男后女；阴日阴时女重见；阴日阳时先女后男', '男命日干' + (yangGan ? '阳' : '阴') + '、时干' + (yangShi ? '阳' : '阴') + '（531，子女性别倾向查表）');
    if (cs['伤官'] > 0 && guan > 0) A('伤官见官，子孙凶顽', '伤官与官星同透（532）');
    if (p.ssGan.time === '伤官' || (p.ssZhi.time && p.ssZhi.time[0] === '空亡')) A('时上伤官及空亡，难为子息', (p.ssGan.time === '伤官' ? '时干伤官' : '') + (p.ssZhi.time && p.ssZhi.time[0] === '空亡' ? (p.ssGan.time === '伤官' ? '且' : '') + '时支空亡' : '') + '（533）');
    if (gender === 0 && yin >= 2 && cs['伤官'] > 0) A('女命取伤官是子，食神是女；若见印绶枭神，难得子也', '女命伤官透而印' + yin + '重（534）');
    if (gender === 1 && guan >= 2 && strong === false) A('男命官杀得地而禀中和者，言其有子', '男命官杀' + guan + '、日主' + ws.verdict + '——"太过不及不以此断"（535）');
    // 论小儿（542-545）
    if (cai >= 2) A('小儿命见财多，必庶出螟蛉，克父母也', '财' + cai + '透（543）');
    A('小儿命大要身旺，最喜印绶生之，无财克之；不要官星七杀、阳刃伤官太旺', '按原局日主' + ws.verdict + '、印' + yin + '、财' + cai + '、官杀' + guan + '参考（545，小儿专项提示）');
    return hits;
  }
  // ── 神峰通考·五行元理消息赋+五行生克赋条件句机判（2602-2814 / 2815-2916；避开与三命/渊海已覆盖句重复）──
  function jipanYuanLiFu(p, cs, gender) {
    const hits = [];
    const ws = wangShuai(p);
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'], bi = cs['比肩'] + cs['劫财'], shi = cs['食神'] + cs['伤官'];
    const wc = wuxingCount(p);
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const yr = YANG_REN[p.dayGan];
    const A = (t, s) => hits.push(t + ' —— ' + s + '（神峰通考·五行元理消息赋）');
    const B = (t, s) => hits.push(t + ' —— ' + s + '（神峰通考·五行生克赋）');
    const has = z => zhis.includes(z);
    // 元理赋（2602-2814）
    if (cs['七杀'] > 0 && yin === 0) A('当权者，用杀而不用印', '七杀透而无印（2610）');
    if (yin > 0 && cs['七杀'] > 0) A('印赖煞生', '印与杀并透（2612）');
    if (cs['正官'] > 0 && cai > 0) A('官因财旺', '正官与财并透（2614）');
    if (cs['食神'] > 0 && cs['七杀'] > 0) A('食居先，杀居后，功名两全', '食神与七杀并透（2616）');
    if (wc['火'] >= 3 && wc['土'] >= 3 && ['丙', '丁'].includes(p.dayGan)) A('晦火无光于稼穑', '火' + wc['火'] + '土' + wc['土'] + '（2629）');
    if (wc['木'] >= 3 && wc['火'] >= 3) A('盗木绝气于丙丁', '木' + wc['木'] + '火' + wc['火'] + '（2632）');
    if (wc['水'] >= 3 && (p.dayGan === '甲' || p.dayGan === '乙')) A('水泛木浮者活木', '水' + wc['水'] + '而日主' + p.dayGan + '（2641）');
    if (wc['土'] >= 3 && (p.dayGan === '庚' || p.dayGan === '辛')) A('土重金埋者阳金', '土' + wc['土'] + '而日主' + p.dayGan + '（2644）');
    if (wc['水'] >= 3) A('水盛则危', '水' + wc['水'] + '（2647）');
    if (wc['火'] >= 3 && wc['金'] >= 3 && (p.dayGan === '庚' || p.dayGan === '辛')) A('阳金得炼太过，变革奔波', '金' + wc['金'] + '火' + wc['火'] + '而日主' + p.dayGan + '（2652）');
    if (wc['土'] >= 2 && wc['火'] >= 2 && ['丙', '丁'].includes(p.dayGan)) A('土重而掩火无光，逢木反为有用', '土' + wc['土'] + '火' + wc['火'] + '日主' + p.dayGan + '（2658）');
    if (wc['木'] >= 3) A('木盛多仁', '木' + wc['木'] + '（2671）');
    if (wc['土'] <= 1) A('土薄寡信', '土仅' + wc['土'] + '（2674）');
    if (wc['水'] >= 3) A('水旺居垣须有智', '水' + wc['水'] + '（2678）');
    if (wc['金'] >= 3) A('金坚主义却能为', '金' + wc['金'] + '（2680）');
    if (wc['金'] >= 2 && wc['水'] >= 2) A('金水聪明而好色', '金' + wc['金'] + '水' + wc['水'] + '（2682）');
    if (wc['水'] >= 2 && wc['土'] >= 2) A('水土混杂必多愚', '水' + wc['水'] + '土' + wc['土'] + '（2684）');
    if (has('辰') && has('戌')) A('辰戌克制并冲，犯刑名', '辰戌并见（2688）');
    if (has('子') && has('卯')) A('子卯相刑门户，全无礼德', '子卯并见（2690）');
    if (cs['伤官'] > 0 && cai === 0) A('伤官无财难恃，虽巧必贫', '伤官透而无财（2698）');
    if (cs['食神'] > 0 && cs['七杀'] > 0 && cs['偏印'] > 0) A('食神制煞逢枭，不贫则夭', '食神、七杀、偏印并透（2702）');
    if (gender === 1 && yr && zhis.filter(z => z === yr).length >= 2) A('男多羊刃必重婚', '男命阳刃' + yr + '重见（2705）');
    if (gender === 0 && cs['伤官'] > 0) A('女犯伤官须再嫁', '女命伤官透（2707）');
    if (cai > 0 && cs['劫财'] > 0) A('孤寡者，只为财神被劫', '财与劫财并透（2711）');
    if (gender === 0 && cs['伤官'] > 0 && cai > 0) A('逢伤官反得夫星，乃为财命有气', '女命伤官透而财透（2715）');
    if (gender === 0 && cs['偏印'] > 0 && cs['食神'] > 0) A('遇枭神而丧子息，定因福薄无嗣', '女命偏印与食神并透（2717）');
    if (['year', 'month', 'day', 'time'].filter(k => p.gz[k][1] === '戌').length >= 2 && has('辰')) A('二戌冲辰祸不浅', '戌' + ['year', 'month', 'day', 'time'].filter(k => p.gz[k][1] === '戌').length + '见辰（2719）');
    if (has('子') && has('午') && has('卯') && has('酉')) A('子午卯酉全备，酒色荒迷', '子午卯酉全备（2726）');
    if (cs['七杀'] > 0 && shi === 0) A('天干煞显，无制者贱', '七杀透而无食伤制（2728）');
    if (cai === 0 && guan > 0 && ws.verdict !== '身弱') A('地支财伏，暗生者奇', '财不露干而藏支（2731）');
    if (cs['食神'] > 0 && cs['偏印'] > 0) A('贪食乖疑，命带枭神应有祸', '食神与偏印并透（2735）');
    if ((has('卯') && has('酉'))) A('日时相逢卯酉，始生必主迁移', '卯酉并见（2738）');
    if ((has('戌') && has('亥'))) A('造化因逢戌亥，平生敬信神祗', '戌亥并见（2741）');
    if (cai >= 3 && cs['七杀'] > 0) A('财多逢财，运逢化杀生灾', '财' + cai + '而七杀透（2750）');
    if (cai > 0 && guan > 0 && yin === 0) A('财官俱败者死（财官无印救应，弱极之危）', '财官并透而无印（2770）');
    if (cs['食神'] > 0 && cs['偏印'] > 0) A('食神逢枭者凶', '食神与偏印并透（2773）');
    if (yr && zhis.some(z => z !== yr && CHONG[yr] === z)) A('羊刃不喜刑冲', '阳刃' + yr + '被' + zhis.filter(z => CHONG[yr] === z).join('、') + '冲（2784）');
    if (cai >= 2) A('财逢旺人多富', '财' + cai + '透（2808）');
    if (cs['正官'] > 0) A('官遇长生命必荣', '正官透（2810）');
    // 五行生克赋抽句（2815-2916，仅日干×五行强弱的直接断句）
    if (wc['金'] >= 2 && (p.dayGan === '甲' || p.dayGan === '乙')) B('甲乙遇金强，魂归西兑', '甲乙日而金' + wc['金'] + '（2870）');
    if (wc['火'] >= 2 && (p.dayGan === '庚' || p.dayGan === '辛')) B('庚辛逢火旺，气散南离', '庚辛日而火' + wc['火'] + '（2872）');
    if (p.dayGan === '乙' && p.gz.month[1] === '申') B('乙木秋生，拉枯摧朽之易也', '乙日申月（2894）');
    if (p.dayGan === '庚' && p.gz.month[1] === '亥') B('庚金冬死，沉沙坠海岂难乎', '庚日亥月（2896）');
    return hits;
  }
  function jipanSanMingShiShen(p, cs, gender) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'], bi = cs['比肩'] + cs['劫财'], shi = cs['食神'] + cs['伤官'];
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const A = (t, s) => hits.push(t + ' —— ' + s + '（三命通会）');
    const yr = YANG_REN[p.dayGan];
    // 正官篇（3370-3430）
    if (cs['正官'] >= 2) A('正官止许一位，多则不宜', '正官' + cs['正官'] + '透（3371）');
    const zq = { '甲': ['酉'], '乙': ['申', '巳'], '丙': ['子'], '丁': ['亥'], '戊': ['卯'], '己': ['寅'], '庚': ['午'], '辛': ['寅', '巳'], '壬': ['午', '未', '丑'], '癸': ['辰', '巳', '戌'] };
    if (zq[p.dayGan] && zq[p.dayGan].includes(p.gz.month[1]) && cs['正官'] > 0 && strong) A('正气官星，支藏干透，日主健旺，得财印两扶，不见伤煞——大富大贵命也', p.dayGan + '日' + p.gz.month[1] + '月（正气官星）而官透、日主身旺（3374-3378）');
    if (zq[p.dayGan] && zq[p.dayGan].includes(p.gz.month[1]) && (cs['伤官'] > 0 || cs['七杀'] > 0 || bi > 0)) A('正官格大忌：伤官七煞、贪合忘官、劫财分福，为破格', p.dayGan + '日' + p.gz.month[1] + '月正官格而伤官/七杀/劫财' + (cs['伤官'] > 0 ? '伤官' : '') + (cs['七杀'] > 0 ? '七杀' : '') + (bi > 0 ? '劫财' : '') + '同见（3379-3380）');
    if (cs['正官'] > 0 && yin > 0) A('四干迭相官印足者，主贵', '官' + cs['正官'] + '与印' + yin + '并透（3415）');
    // 偏官篇（3531-3627）
    if (cs['七杀'] > 0) A('有制谓之偏官，无制谓之七煞', '七杀透而' + (shi > 0 ? '食伤' + shi + '透为制' : '无制') + '（3534）');
    if (strong && cs['七杀'] === 1 && cai > 0) A('身强煞弱，有财星则吉', '身旺、七杀1透而财透（3535-3536）');
    if (weak && cs['七杀'] >= 2 && cai > 0) A('身弱煞强，有财引鬼盗气，非贫则夭', '身弱、七杀' + cs['七杀'] + '透而财透（3536）');
    if (cs['七杀'] > 0 && yr && zhis.includes(yr)) A('煞无刃不显，逢煞看刃', '七杀透而' + yr + '（' + p.dayGan + '之刃）在支（3537）');
    if (cs['七杀'] > 0 && p.ssGan.month === '七杀' && ['year', 'day', 'time'].some(k => p.gz[k][1] === p.gz.month[1])) A('五行遇月支偏官，只许地支一位，多则不佳', '月支' + p.gz.month[1] + '为七杀而他柱亦见' + p.gz.month[1] + '（3558）');
    if (cs['七杀'] >= 2 && shi > 0) A('四柱纯煞有制，定居一品之尊', '七杀' + cs['七杀'] + '透而有食伤制（3559）');
    if (cs['正官'] === 1 && cs['七杀'] === 1) A('略见一位正官，官煞混杂反贱', '正官七杀各1透（三命版官煞混杂断，3559-3560）');
    if (gender === 1 && p.ssGan.time === '七杀' && (p.ssGan.year === '七杀' || p.ssGan.month === '七杀')) A('时上偏官要干上透出只一位为妙，年月日重见，反主辛苦劳碌', '男命时干七杀而年/月干亦见七杀（3604-3605）');
    if (gender === 1 && p.ssGan.time === '七杀' && strong && (shi > 0 || yr && zhis.includes(yr))) A('时上偏官喜刃冲，身强制伏禄丰隆', '男命时干七杀、身旺而有' + (shi > 0 ? '制' : '刃') + '（3612）');
    if (gender === 1 && p.ssGan.time === '七杀' && cs['正官'] > 0 && weak && cai >= 2) A('正官若来相混，身弱财多主困穷', '男命时干七杀、官星同混、身弱财' + cai + '透（3612-3613）');
    if (gender === 1 && p.ssGan.time === '七杀' && shi > 0) A('时逢七煞本无儿；底月时中如有制，定知有子贵而迟', '男命时干七杀而有食伤制（3615-3616）');
    // 论财（4422-4451）
    if (cai >= 2 && weak && gender === 1) A('财旺身衰，主妻秉男权；运行比劫，妻妾多危', '男命财' + cai + '透而身弱（4424-4426）');
    if (cai >= 2 && cs['正官'] > 0) A('财旺生官，富而且贵', '财' + cai + '透而官透（4426-4427）');
    if (cs['正官'] > 0 && cai === 0 && zhis.length) A('露官藏财，无不高位', '官透干而财不露干（藏于支）（4427）');
    if (weak && cai >= 2 && (bi > 0 || yr && zhis.includes(yr))) A('身弱财多，喜兄弟羊刃为助', '身弱财' + cai + '透而有比劫/刃扶（4428）');
    if (cai > 0 && cs['劫财'] > 0) A('财源被劫，父命先倾', '财与劫财同透（4432）');
    if (cai >= 2 && weak && gender === 1) A('男逢财多身弱，妻话偏听', '男命财' + cai + '透而身弱（4432）');
    if (p.ssZhi.day && p.ssZhi.day[0] && ['正财', '偏财'].includes(p.ssZhi.day[0])) A('财星得位，因妻致富成家', '日支' + p.gz.day[1] + '本气' + p.ssZhi.day[0] + '（4433）');
    if (cai > 0 && cs['正官'] === 0 && cs['七杀'] === 0) A('大贵者用财而不用官', '财透而官杀不露（4434）');
    if (cai >= 2 && strong && cs['比肩'] > 0) A('财生身旺两相停，不喜再见比肩', '财' + cai + '透、身旺而比肩透（4436）');
    if (cai >= 2 && weak && yin > 0) A('财多身弱，要印扶身', '财' + cai + '透、身弱而印透（4438-4439）');
    if (strong && cai <= 1 && cs['劫财'] > 0) A('身旺财衰，怕劫分夺', '身旺财仅' + cai + '而劫财透（4439）');
    if (strong && cai > 0 && guan === 0) A('身旺无官，只取财', '身旺无官而财透（4445）');
    if (weak && cai >= 2) A('身衰财旺，还知夭', '身弱财' + cai + '透（4445）');
    // 论印（4641-4654）
    if (yin > 0 && cs['正官'] > 0) A('逢印看官，而遇官十有七贵', '印' + yin + '与官并透（4642）');
    if (cs['正印'] > 0 && cai > 0) A('正印见财则凶（印绶忌财）', '正印与财同透（4643-4644）');
    if (cs['正官'] > 0 && yin === 0) A('有官无印，纵富贵而伤残', '官透而无印（4644）');
    if (yin > 0 && cs['正官'] === 0) A('有印无官，纵荣华而有失', '印透而无官（4644）');
    if (yin >= 2 && strong) A('印绶不宜身太旺，总然无事也平常；除非原命多官煞', '印' + yin + '透而身旺（4651-4653）');
    if (p.ssGan.month === '正印' && cai > 0) A('正印居月令，决不可见财（弃印就财明偏正）', '月干正印而财透（4668-4670）');
    if (cs['偏印'] > 0 && cs['食神'] > 0) A('凡命带倒食（偏印吞啖煞），福薄寿夭；食神最忌见之', '偏印与食神同透（枭神夺食，4675-4680）');
    // 阳刃（5023-5060）
    if (yr && zhis.includes(yr) && cai > 0) A('阳刃格大概不宜财乡，怕冲起', '阳刃' + yr + '在支而财透（5049-5053，行财乡为忌之近似提示）');
    if (yr && zhis.filter(z => z === yr).length >= 2 && cai > 0) A('阳刃重重又见财，富贵饶金帛', '阳刃' + yr + '重见而财透（5057）');
    // 女命（5379-5415）
    if (gender === 0 && ((cs['正官'] === 1 && cs['七杀'] === 0) || (cs['七杀'] === 1 && cs['正官'] === 0))) A('女命用官为夫不要见煞；用煞为夫不要见官，一位为好', '女命官或杀一位而不杂（5385）');
    if (gender === 0 && ((cs['正官'] === 2 && cs['七杀'] === 0) || (cs['七杀'] >= 2 && cs['正官'] === 0))) A('两位官星无煞以杂之，或四柱纯煞无官以混之，俱为良妇', '女命官' + cs['正官'] + '杀' + cs['七杀'] + '（5386）');
    if (gender === 0 && cs['食神'] > 0 && strong) A('食为子息，引时逢旺，再得二德扶身，乃夫贵子荣之命；不宜身旺，重叠夫神及伤官七煞魁罡羊刃太重，皆主不美', '女命食神透、日主身旺——原文"旺不可太过"（5387-5389）');
    if (gender === 0 && weak === false && guan >= 2 && (cs['伤官'] > 0 || cs['七杀'] > 1)) A('浊者混也：身太旺，正夫不显，偏夫丛杂，为下贱村浊', '女命身' + ws.verdict + '而官杀' + guan + '透（5401-5402）——原文定性"浊"，作提示照录');
    return hits;
  }
  // ── 命理探源·论双生 608（乾元秘旨：太旺幼者胜/太弱长者胜/不旺不弱长幼略同）──
  function jipanShuangSheng(p) {
    const ws = wangShuai(p);
    const v = ws.verdict;
    return '（命理探源·论双生 608《乾元秘旨》按引擎旺衰判定）本命旺衰：' + v + '（分' + ws.score + '） → ' + (v === '身旺' ? '命主太旺，幼者胜' : v === '身弱' ? '命主太弱，长者胜' : '命主不旺不弱，长幼略同');
  }
  // ── 韦千里《八字提要》1440条查表（12月×10日×12时，纯查表照录）──
  function jipanBaZiTiYao(p) {
    const hits = [];
    const row = (D.bazitiyao || []).find(x => x.m === p.gz.month[1] && x.d === p.dayGan && x.t === p.gz.time[0] + p.gz.time[1]);
    if (row) hits.push('韦千里《八字提要》' + p.gz.month[1] + '月' + p.dayGan + '日' + p.gz.time[0] + p.gz.time[1] + '时（查表原文）：' + row.text);
    else hits.push('八字提要查表：本局无对应条目（' + p.gz.month[1] + '月' + p.dayGan + '日' + p.gz.time[0] + p.gz.time[1] + '时，如实不编造）');
    return hits;
  }
  // ── 渊海子平 856-1108（看命入式/杂论口诀/寸金搜髓论/论命细法条件句）──
  function jipanYuanHai856(p, cs, gender) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'];
    const shi = cs['食神'] + cs['伤官'], bi = cs['比肩'] + cs['劫财'];
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const gan4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const yr = YANG_REN[p.dayGan];
    const A = (t, s, ln) => hits.push(t + ' —— ' + s + '（渊海子平 ' + ln + '）');
    const wxC = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    for (const k of ['year', 'month', 'day', 'time']) wxC[WX[p.gz[k][0]]]++;
    for (const z of zhis) { const zg = (D.zanggan || {})[z]; if (zg) for (const g of zg) wxC[WX[g]]++; }
    const LU = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
    const CHONG = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };
    const isIn = (arr, v) => arr.includes(v);
    if (cai > 0 && strong) A('年时露出财官，须要身旺；如身衰财旺，但多反破财伤妻', '财' + cai + '透而身旺（863）', '863');
    if (cai === 0 && guan === 0 && yin === 0) A('若无财官，次看印绶得何局式，吉凶断之', '本局无财无官，看印绶（865）', '865');
    if (cs['正官'] > 0 && cs['伤官'] > 0) A('官怕伤；伤官见官，为祸百端，若非疾病伤躯，必当官讼囚系、子丧妻伤', '正官与伤官同见（882/885）', '882/885');
    if (cai > 0 && cs['劫财'] > 0) A('财怕劫', '财与劫财同见（883）', '883');
    if (yin > 0 && cai > 0) A('印绶见财，愈多愈灾', '印' + yin + '与财' + cai + '同见（884）', '884');
    if (cs['伤官'] > 0 && cai > 0) A('伤官用财者富', '伤官与财同见（889）', '889');
    if (cs['伤官'] > 0 && cs['劫财'] > 0) A('伤官劫财者贫', '伤官与劫财同见（890）', '890');
    if (p.ssGan.year === '伤官') A('年上伤官，富贵不久', '年干伤官（891）', '891');
    if (p.ssGan.month === '伤官') A('月上伤官，父母不完', '月干伤官（892）', '892');
    if (p.ssGan.day === '伤官') A('日上伤官，难为妻妾', '日干伤官（893）', '893');
    if (p.ssGan.time === '伤官') A('时上伤官，子孙无传', '时干伤官（894）', '894');
    if (['year', 'month'].some(k => p.ssGan[k] === '伤官' || p.ssGan[k] === '劫财')) A('岁月伤官劫财，生于贫贱之家', '年月干为伤官/劫财（895）', '895');
    if ((p.ssZhi.day && ['正财', '偏财', '正官', '七杀'].includes(p.ssZhi.day[0])) || (p.ssZhi.time && ['正财', '偏财', '正官', '七杀'].includes(p.ssZhi.time[0]))) A('日下时中有财官，先贫后富', '日支/时支藏财官（896）', '896');
    if (['year', 'month'].some(k => ['正财', '偏财', '正官', '七杀', '正印', '偏印'].includes(p.ssGan[k]))) A('岁月财官印绶，生于富贵之家', '年月干为财官印（897）', '897');
    if (['day', 'time'].some(k => p.ssGan[k] === '伤官' || p.ssGan[k] === '劫财')) A('日时伤官劫财，先富后贫，伤损子息，无晚福', '日/时干伤官或劫财（898）', '898');
    if (cs['伤官'] > 0 && guan >= 2) A('伤官见官、官杀混杂，为人好色多淫，作事小巧寒贱', '伤官见官且官杀混杂（899）', '899');
    if (p.dayGan === '乙' && (isIn(zhis, '巳') || isIn(zhis, '亥'))) A('乙木巳上为太乙，亥上登明；男好色，女淫滥', '乙日见巳/亥（900）', '900');
    if (guan >= 2 && cai > 0) A('官杀混杂，有财者吉', '官杀' + guan + '而财' + cai + '透（901）', '901');
    if (guan >= 2 && cai === 0 && yin === 0) A('官杀混杂，无财印者凶', '官杀' + guan + '而无财无印（901）', '901');
    if (cai >= 2 && strong) A('财命有气，纵背禄而不贫', '财' + cai + '透且身旺（902）', '902');
    if (cs['劫财'] > 0) A('劫财败财，心高下贱，见者主贪婪', '劫财透（903）', '903');
    if (p.ssGan.month === '正财' || p.ssGan.month === '偏财') A('财入月令，勤俭悭吝', '月干财星（909）', '909');
    if (bi >= 2 || (yr && zhis.filter(z => z === yr).length >= 1)) A('柱有劫财比刃多者，刑父伤妻，不聚财也', '比劫' + bi + '、刃' + (yr ? zhis.filter(z => z === yr).length : 0) + '处（910）', '910');
    if (cs['七杀'] > 0 && cs['偏印'] > 0) A('七杀枭重，走遍他乡之客', '七杀与偏印同见（913）', '913');
    if (cs['伤官'] > 0 && cs['劫财'] > 0) A('伤官劫财，瞒心负赖之徒', '伤官劫财同见（914）', '914');
    if (cai + guan >= 3) A('重犯财官者，贵', '财官合计' + (cai + guan) + '（重犯阈值≥3，引擎设定）（915）', '915');
    if (cs['七杀'] > 0 && shi > 0) A('七杀宜制，独立为强', '七杀有食伤制（917）', '917');
    if (cs['伤官'] > 0 && yin > 0 && cai === 0) A('伤官用印去财，方可驰名', '伤官配印而无财（922）', '922');
    if (cs['伤官'] > 0 && cai > 0) A('伤官用财，伤官处须当发福', '伤官配财（923）', '923');
    if (cs['伤官'] > 0 && ((yr && isIn(zhis, yr)) || cs['劫财'] > 0)) A('伤官劫刃，难逃寡恶之名', '伤官见刃/劫财（931）', '931');
    if (p.dayGan === '壬' && isIn(zhis, '寅') && p.gz.month[1] === '亥') A('六壬趋艮（寅），逢亥月者贫', '壬日寅在支而亥月（933）', '933');
    if (cs['食神'] > 0) A('食神干旺，胜似财官；顺食者食前方丈，倒食者箪食豆羹', '食神透干（948）', '948');
    if (cs['食神'] === 0 && cs['偏印'] >= 2) A('食衰枭旺，不死也灾', '无食神而偏印' + cs['偏印'] + '（949）', '949');
    if (wxC['水'] >= 3) A('水润下兮，文学显达', '水' + wxC['水'] + '（含藏干）（950）', '950');
    if (wxC['土'] >= 3) A('土稼穑兮，富贵经商', '土' + wxC['土'] + '（含藏干）（951）', '951');
    if (wxC['金'] + wxC['水'] >= 4) A('金水双清而为道', '金' + wxC['金'] + '水' + wxC['水'] + '（952）', '952');
    if (wxC['火'] + wxC['土'] >= 4) A('火土混浊而为僧', '火' + wxC['火'] + '土' + wxC['土'] + '（953）', '953');
    if ((isIn(zhis, '子') && isIn(zhis, '午')) && (isIn(zhis, '巳') && isIn(zhis, '亥'))) A('子午最嫌巳亥', '子午与巳亥同见（954）', '954');
    if ((isIn(zhis, '卯') && isIn(zhis, '酉')) && (isIn(zhis, '寅') && isIn(zhis, '申'))) A('卯酉切忌寅申', '卯酉与寅申同见（955）', '955');
    if (p.dayGan === '己' && isIn(zhis, '亥') && isIn(gan4, '乙')) A('己入亥宫，见阴木终为损寿', '己日亥支而乙木透（956）', '956');
    if (strong && cai + guan > 0) A('造化先须看日主；身旺财官多富贵', '身旺而财官透（990-991）', '990-991');
    if (strong && cai + guan === 0) A('若还身旺财官损，只是朝求暮讨儿', '身旺而无财官（992）', '992');
    if (cai + guan >= 2 && strong) A('财官旺时日主强，紫袍金带有何疑', '财官' + (cai + guan) + '而身旺（993）', '993');
    if (cai + guan >= 2 && weak) A('财官旺而日主弱，运行身旺最为奇', '财官' + (cai + guan) + '而身弱（指行运，994）', '994');
    if (strong && cai + guan <= 1) A('日主旺而财官弱，运入财官名利驰', '身旺而财官仅' + (cai + guan) + '（指行运，995）', '995');
    if ((p.ssZhi.day && ['正财', '偏财', '正官', '七杀'].includes(p.ssZhi.day[0])) && (p.ssGan.month === '正财' || p.ssGan.month === '偏财' || p.ssGan.month === '正官' || p.ssGan.month === '七杀')) A('日主坐下有财官，月令相逢贵不难', '日支藏财官且月令财官（996）', '996');
    if (strong && cai === 0 && guan === 0 && yin === 0 && shi === 0) A('身旺无依更迁祖；身旺无倚，损财伤妻、或过房入舍', '身旺而财官印食全无（998-999）', '998-999');
    if (strong && yin >= 2) A('身旺印旺，破财不聚；有财只好善破', '身旺而印' + yin + '（1000）', '1000');
    if (cs['正官'] > 0) A('官喜露，露则清高', '正官透干（1001）', '1001');
    if (cai > 0 && gan4.filter(g => ['正财', '偏财'].includes(shiShenOf(p.dayGan, g))).length === 0 && ((p.ssZhi.day && ['正财', '偏财'].includes(p.ssZhi.day[0])) || (p.ssZhi.month && ['正财', '偏财'].includes(p.ssZhi.month[0])))) A('财要藏，藏则丰厚', '财藏支而不露干（1002）', '1002');
    if (cs['七杀'] > 0 && cs['正官'] === 0 && p.ssZhi.day && p.ssZhi.day[0] === '正官' && p.ssGan.month === '正官') A('杀藏官露，恶隐善扬；人生遇此，名振乡邦', '杀藏支官露干（1003，近似：杀在支官在干）', '1003');
    if (guan >= 2 && strong && shi > 0) A('官杀太重身更强，一逢制伏作贤良', '官杀' + guan + '身旺有食伤制（1004）', '1004');
    if (guan > 0 && yin > 0) A('杀官拱印贵非轻，烜赫威扬定振名', '官杀配印（1005）', '1005');
    if (wxC['火'] + wxC['土'] >= 4 && wxC['水'] > 0) A('身居九夏火土多，相逢水济贵中和；水火元来要既济', '火' + wxC['火'] + '土' + wxC['土'] + '而水' + wxC['水'] + '（1006）', '1006');
    if (wxC['金'] + wxC['水'] >= 4 && wxC['火'] > 0) A('生居三冬，水冷金寒；得火相扶，莫作等闲', '金' + wxC['金'] + '水' + wxC['水'] + '而火' + wxC['火'] + '（1007）', '1007');
    if (wxC['火'] >= 3 && wxC['水'] === 0) A('火势炎炎如无水，运行水乡亦是美', '火' + wxC['火'] + '而无水（指行运，1008）', '1008');
    if (wxC['水'] >= 3 && wxC['火'] === 0) A('水势滔滔若无火，运入火乡亦为奇', '水' + wxC['水'] + '而无火（指行运，1009）', '1009');
    if (['辰', '戌', '丑', '未'].filter(z => isIn(zhis, z)).length >= 3) A('三丘五行，辰戌丑未；若是重见，骨肉刑悲、父母不足、兄弟异离', '四库' + ['辰', '戌', '丑', '未'].filter(z => isIn(zhis, z)).length + '处（1017）', '1017');
    if (['year', 'day', 'time'].some(k => p.gz[k][1] === CHONG[p.gz.month[1]])) A('冲破提纲，多亏父母，或是刑、或是离异', '月支' + p.gz.month[1] + '被' + CHONG[p.gz.month[1]] + '冲破（1018）', '1018');
    if (strong && bi > 0 && (function () { const g = SANHE.find(s => s.group.includes(p.gz.month[1]) || s.group.includes(p.gz.day[1])); return g; })()) A('身旺比肩坐驿马，兄弟飘蓬好潇洒', '身旺比劫见驿马（1019，近似）', '1019');
    if (cai > 0 && ['辰', '戌', '丑', '未'].some(z => isIn(zhis, z))) A('财星入库主聚财；财星入库妻悭吝，谨守赀财不做人', '财透而四库在支（1021-1022）', '1021-1022');
    if (guan >= 2 && cai === 0) A('官杀重重不带财，妻能内助不和谐；公姑不敬妻无礼，夺却夫权命所排', '官杀' + guan + '而无财（1024）', '1024');
    if (bi >= 2 && cs['伤官'] > 0) A('比劫伤官旺，伤妻更损儿', '比劫' + bi + '伤官' + cs['伤官'] + '（1026）', '1026');
    if (cs['七杀'] > 0 && cs['偏印'] > 0) A('日主七杀带枭神，妻主虚胎小产多，血气不调成血疾', '七杀配枭神（1027）', '1027');
    if (gender === 1 && cs['偏印'] >= 2 && cs['食神'] >= 2 && weak) A('男子枭食重重见，身弱多因痨病随', '男命枭' + cs['偏印'] + '食' + cs['食神'] + '而身弱（1028）', '1028');
    if (gender === 0 && cs['偏印'] >= 2 && cs['食神'] >= 2) A('女人枭食非为吉，产难惊人病亦危', '女命枭' + cs['偏印'] + '食' + cs['食神'] + '（1029）', '1029');
    if (gender === 0 && guan > 0 && cai > 0) A('女人官旺兼财旺，招得贤夫更好儿', '女命官' + guan + '财' + cai + '（1030）', '1030');
    if (gender === 0 && cs['伤官'] > 0 && cs['劫财'] > 0) A('若是财官俱受损，伤夫克子守空帷', '女命伤官克官、劫财克财（1030，近似）', '1030');
    if (strong && yin >= 2) A('印绶旺身身更旺，为人刑克主孤贫', '身旺印' + yin + '（1031）', '1031');
    if (strong && yin >= 2 && guan > 0 && cai > 0) A('若得官显财又显，亦为超群拔萃人', '身旺印' + yin + '而官财并显（1031）', '1031');
    if (wxC['火'] >= 2 && wxC['水'] >= 2) A('惹是招非，只缘水火相克，或是目昏眼暗', '火' + wxC['火'] + '水' + wxC['水'] + '相战（1032）', '1032');
    if (gender === 0 && cs['伤官'] >= 2) A('女命若也伤官旺，坐下伤官会骂夫；朝暮喃喃口不绝，百年终见带刑孤', '女命伤官' + cs['伤官'] + '（1033）', '1033');
    const riZhuT = {
      '辛巳': ['俱是坐下财官，逢之富贵不少', 1036], '壬午': ['俱是坐下财官，逢之富贵不少', 1036], '甲申': ['俱是坐下财官，逢之富贵不少', 1036], '乙酉': ['俱是坐下财官，逢之富贵不少', 1036],
      '丁亥': ['日主逢之命不轻', 1037], '戊子': ['日主逢之命不轻', 1037], '庚寅': ['日主逢之命不轻', 1037],
      '辛卯': ['财官内隐显声名', 1038], '丙申': ['财官内隐显声名', 1038], '丁酉': ['财官内隐显声名', 1038],
      '己亥': ['印绶财官内里藏', 1039], '甲申': ['更得丙辰壬戌至，四时符印不非常', 1039],
      '丙辰': ['四时符印不非常', 1039], '壬戌': ['四时符印不非常', 1039],
      '甲子': ['虚名虚利任飘蓬', 1040], '丙寅': ['虚名虚利任飘蓬', 1040], '丁卯': ['虚名虚利任飘蓬', 1040], '己巳': ['虚名虚利任飘蓬', 1040], '壬辰': ['虚名虚利任飘蓬', 1040], '癸巳': ['虚名虚利任飘蓬', 1040],
      '乙亥': ['生下财官并无有；妻宫子女带虚花', 1041], '庚申': ['生下财官并无有；妻宫子女带虚花', 1041],
      '甲午': ['女克丈夫男克子', 1042], '戊戌': ['女克丈夫男克子', 1042], '庚子': ['女克丈夫男克子', 1042],
      '乙巳': ['重重壬子主孤穷', 1043], '丙午': ['重重壬子主孤穷', 1043], '丁未': ['重重壬子主孤穷', 1043],
      '甲寅': ['支干同类子不足', 1044], '乙卯': ['支干同类子不足', 1044], '戊午': ['支干同类子不足', 1044],
      '己未': ['月令更旺成祸害', 1045], '癸亥': ['月令更旺成祸害', 1045]
    };
    const dz = p.gz.day[0] + p.gz.day[1];
    if (riZhuT[dz]) A('日柱查表·' + dz + '：' + riZhuT[dz][0], '（' + riZhuT[dz][1] + '；庚申/己巳原文两见两说并存照录）', String(riZhuT[dz][1]));
    if (['正财', '偏财', '正官', '七杀', '正印', '偏印'].includes(p.ssGan.month)) A('月主财官印绶全，月时符合福绵绵', '月干为财官印（1046）', '1046');
    if (bi >= 2 && strong) A('干支同类并身旺，克子刑妻破祖田', '比劫' + bi + '而身旺（1047）', '1047');
    if (cs['比肩'] > 0 && SANHE.some(s => s.group.every(z => isIn(zhis, z)))) A('比肩三合族人害，三刑零落及离妻', '比肩透且三合全（1053）', '1053');
    if (cs['比肩'] > 0) A('比肩暗损及门房，兄弟无情被罔欺', '比肩透（1054）', '1054');
    if (p.ssZhi.day && ['正财', '偏财'].includes(p.ssZhi.day[0]) && ['year', 'month', 'time'].some(k => p.ssGan[k] === '正财' || p.ssGan[k] === '偏财')) A('坐妻透妻成别象，定主离妻再娶妻', '日支藏财且财透干（1057）', '1057');
    if (cai >= 2) A('多透妻财须怕妇', '财' + cai + '透（1058）', '1058');
    if (LU[p.dayGan] && p.gz.time[1] === LU[p.dayGan]) A('日禄归时须应梦', '日干' + p.dayGan + '禄' + LU[p.dayGan] + '在时支（1066）', '1066');
    if (p.ssZhi.day && p.ssZhi.day[0] === '七杀') A('凡坐杀者，不可行杀旺运', '日支七杀（指行运，1074）', '1074');
    if (yin > 0 && cai > 0) A('印绶怕行财运，主恶死或血疾', '印财同见（指行运，1076）', '1076');
    if (yin >= 2) A('印绶多母众，或食众乳、或寄养外人家', '印' + yin + '（1077）', '1077');
    if (wxC['火'] >= 2 && wxC['水'] >= 2) A('火入水乡，主血疾', '火' + wxC['火'] + '水' + wxC['水'] + '（1085）', '1085');
    if ((p.dayGan === '壬' || p.dayGan === '癸') && (isIn(zhis, '寅') || isIn(zhis, '卯'))) A('壬癸引归寅卯，主阳不兴；时归败绝，老后无成', '壬癸日见寅卯（1086）', '1086');
    if (['寅', '申', '巳', '亥'].filter(z => isIn(zhis, z)).length >= 2) A('寅申巳亥，乃四长生，必得聪明妻', '四长生' + ['寅', '申', '巳', '亥'].filter(z => isIn(zhis, z)).length + '在支（1090）', '1090');
    if (cai >= 2 && yin <= 1) A('财多印陷，少年克母；母不贞洁，必重嫁', '财' + cai + '而印' + yin + '（1093）', '1093');
    if (wxC['水'] >= 3 && gender === 1) A('壬癸之水盛者，聪明多智', '壬癸水' + wxC['水'] + '（男命，1095）', '1095');
    if (wxC['水'] >= 3 && gender === 0) A('壬癸之水盛者，女多淫滥', '壬癸水' + wxC['水'] + '（女命，1095）', '1095');
    if (p.ssZhi.day && ['正官', '七杀'].includes(p.ssZhi.day[0]) && !['month', 'year', 'time'].some(k => p.gz[k][1] === CHONG[p.gz.day[1]])) A('支中有官无刑破者，因妻发官', '日支藏官/杀而无刑破（1097）', '1097');
    if (p.ssZhi.day && ['正官', '七杀'].includes(p.ssZhi.day[0]) && shi === 0) A('支中有杀无制，因妻致祸', '日支藏杀而无食伤制（1098）', '1098');
    if ((cs['食神'] > 0 || cs['伤官'] > 0) && ['辰', '戌', '丑', '未'].some(z => isIn(zhis, z))) A('子女不入墓库；如子女入库，主无子女', '食伤透而墓库在支（1102，近似提示）', '1102');
    if (gender === 0 && YANG_GAN[p.dayGan] && cs['食神'] >= 2) A('阳干女命，食神多者为娼', '阳干女命食神' + cs['食神'] + '（1104）', '1104');
    if (gender === 0 && !YANG_GAN[p.dayGan] && (cs['食神'] + cs['伤官'] + cs['正官']) >= 3) A('阴干女命，食伤官多者为妓；有物去之为良', '阴干女命食伤官' + (cs['食神'] + cs['伤官'] + cs['正官']) + '（1105）', '1105');
    return hits;
  }
  // ── 三命通会 卷末综合赋条件句（8747-10286；9143-9151 已由卷末五行神煞卡覆盖，此处不重复）──
  function jipanSanMingJuanMo(p, cs, gender) {
    const hits = [];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'];
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const gan4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const yr = YANG_REN[p.dayGan];
    const LU = { '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' };
    const A = (t, s, ln) => hits.push(t + ' —— ' + s + '（三命通会 ' + ln + '）');
    const wxC = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    for (const k of ['year', 'month', 'day', 'time']) wxC[WX[p.gz[k][0]]]++;
    for (const z of zhis) { const zg = (D.zanggan || {})[z]; if (zg) for (const g of zg) wxC[WX[g]]++; }
    const isIn = (arr, v) => arr.includes(v);
    if (p.gz.day[0] + p.gz.day[1] === '甲寅' && p.gz.time[0] + p.gz.time[1] === '丁卯') A('甲寅日丁卯时为精木，遇者皆主富贵', '日柱甲寅、时柱丁卯（8770）', '8770');
    let shengShang = 0, keNi = 0;
    for (const k of ['year', 'month', 'day', 'time']) {
      const gWx = WX[p.gz[k][0]], zWx = WX[p.gz[k][1]];
      if (SHENG[zWx] === gWx) shengShang++; else if (SHENG[gWx] === zWx) keNi++;
    }
    if (shengShang >= 2) A('凡命五行下生上曰助气，主一生自享其福', '支生干' + shengShang + '柱（8794）', '8794');
    if (keNi >= 2) A('下克上曰逆，主多沉滞而难发', '支克干' + keNi + '柱（8797）', '8797');
    if (p.dayGan === '甲' && (gan4.filter(g => g === '壬').length >= 3 || gan4.filter(g => g === '己').length >= 3)) A('甲人逢三壬三己，谓之三吞三偶，主不吉', '甲日而壬' + gan4.filter(g => g === '壬').length + '或己' + gan4.filter(g => g === '己').length + '（8805）', '8805');
    if (wxC['金'] >= 4) A('金旺太过，则动作多凶', '金' + wxC['金'] + '（8998）', '8998');
    if (cs['正官'] > 0 && cs['七杀'] > 0 && cs['伤官'] > 0) A('正官见煞及伤官刑冲破害，岁运相并必死', '正官七杀伤官同见（指岁运并临，9136）', '9136');
    if (cai > 0 && (cs['比肩'] > 0 || cs['劫财'] > 0 || (yr && isIn(zhis, yr)))) A('正财偏财见比肩分夺，阳刃劫财，岁运冲合必死', '财' + cai + '见比劫/刃（指岁运，9137）', '9137');
    if (cs['伤官'] > 0 && cai >= 2 && weak && guan >= 2) A('伤官之格，财旺身弱，官煞重见，混杂冲刃，岁运又见必死', '伤官配财' + cai + '身弱官杀' + guan + '（指岁运，9137）', '9137');
    if (LU[p.dayGan] && p.gz.time[1] === LU[p.dayGan] && (cs['七杀'] > 0 || cs['正官'] > 0)) A('日禄归时，刑冲破害见七煞，官星空亡冲刃必死', '日禄归时' + LU[p.dayGan] + '而官杀见（指岁运，9140）', '9140');
    if (['day', 'time'].some(k => p.ssGan[k] === '伤官' || p.ssGan[k] === '劫财')) A('日时伤官劫财，伤损子孙，主无晚福', '日/时干伤官或劫财（9225）', '9225');
    if (LU[p.dayGan] && isIn(zhis, LU[p.dayGan]) && cai === 0 && guan === 0) A('日虽建禄，不逢财官，主孤贫', '日干' + p.dayGan + '禄' + LU[p.dayGan] + '在支而无财官（9353）', '9353');
    if (yr && zhis.filter(z => z === yr).length >= 2) A('飞刃伏刃，会刃多凶', '阳刃' + yr + '重见（9451）', '9451');
    if (strong) A('身旺若逢福轻，运到衰败必死', '身旺（指行运衰败，9470）', '9470');
    if (guan + (yr ? zhis.filter(z => z === yr).length : 0) >= 4) A('岁干日干，遇满局煞刃等恶，决主不祥，贫夭恶死', '官杀' + guan + '加刃' + (yr ? zhis.filter(z => z === yr).length : 0) + '（9928）', '9928');
    const ku4 = ['辰', '戌', '丑', '未'].filter(z => isIn(zhis, z)).length;
    if (ku4 >= 2) {
      const siYin = { '戊': '戊己得之偏主信', '己': '戊己得之偏主信', '甲': '甲乙若逢鄙且贪', '乙': '甲乙若逢鄙且贪', '丙': '丙丁或遇多贫病', '丁': '丙丁或遇多贫病', '庚': '庚辛格号母生儿', '辛': '庚辛格号母生儿' };
      if (siYin[p.dayGan]) A('四印古歌·' + p.dayGan + '日：' + siYin[p.dayGan], '辰戌丑未' + ku4 + '处（9957）', '9957');
      if ((p.dayGan === '庚' || p.dayGan === '辛') && isIn(zhis, '丑') && cs['七杀'] > 0) A('聚煞丑宫多短命', '庚辛日丑宫聚煞（9957）', '9957');
    }
    return hits;
  }
  // ── 滴天髓阐微 命例集匹配参照（1281-2207，原文照录作参照）──
  function jipanDiTianMingLi(p) {
    const hits = [];
    const my = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0] + p.gz[k][1]).join(' ');
    const myDay = p.gz.day[0] + p.gz.day[1];
    const list = D.dtd_mingli || [];
    const full = list.filter(x => x.b === my);
    if (full.length) {
      hits.push('滴天髓阐微·命例四柱全同（' + my + '）：' + full.map(x => x.b + '／运：' + x.y + '／断：' + x.txt).join('\n') + '（原文照录，作命例参照不作断语）');
    } else {
      const sameDay = list.filter(x => x.b.split(' ')[2] === myDay);
      if (sameDay.length) {
        const show = sameDay.slice(0, 3);
        hits.push('滴天髓阐微·命例日柱同（' + myDay + '，共' + sameDay.length + '例，仅列前3例；仅日柱同非本命，作参考）：' + show.map(x => x.b + '／运：' + x.y + '／断：' + x.txt).join('\n') + '（原文照录）');
      } else hits.push('滴天髓阐微·命例集：无四柱全同、亦无日柱相同之例（如实不编造）');
    }
    return hits;
  }
  // ── 全库命例参照（滴天髓通神论1-1045正文5例 + 子平真诠评注306-1535命例174 + 神峰通考全文造例41 + 三命通会如/一命例19 = 239 例）──
  function jipanMingLiAll(p) {
    const hits = [];
    const my = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0] + p.gz[k][1]).join(' ');
    const myDay = p.gz.day[0] + p.gz.day[1];
    const list = D.mingli_all || [];
    const full = list.filter(x => x.bz.join(' ') === my);
    if (full.length) {
      hits.push('命例四柱全同（' + my + '）：' + full.map(x => '【' + x.src + ' ' + x.line + '行' + (x.name ? '·' + x.name + '造' : '') + '】' + x.text).join('\n') + '（原文照录，作命例参照不作断语）');
    } else {
      const sameDay = list.filter(x => x.bz[2] === myDay);
      if (sameDay.length) {
        const show = sameDay.slice(0, 3);
        hits.push('命例日柱同（' + myDay + '，共' + sameDay.length + '例，仅列前3例；仅日柱同非本命，作参考）：' + show.map(x => '【' + x.src + ' ' + x.line + '行' + (x.name ? '·' + x.name + '造' : '') + '】' + x.text).join('\n') + '（原文照录）');
      } else hits.push('全库命例：无四柱全同、亦无日柱相同之例（滴天髓通神论5/真诠174/神峰66/三命19=264例，如实不编造）');
    }
    return hits;
  }
  // ── 神峰通考·正格详论群机判（1966-2025：正倒禄飞/刑合/子遥巳/丑遥巳/时上偏财/六阴朝阳/偏官/羊刃非刃/建禄会杀/合杀/官旺身弱/时旺/印绶/劫财羊刃忌时/背禄/正气官星/日干无气时逢刃/官杀两停/贪合忘官/杀旺化官/自坐官杀/七杀全彰/女命总论/贵众合多/偏官制伏/伤官官乡/胞胎受气）──
  function jipanShenFengZhengGe(p, gender) {
    const hits = [];
    const COLS = ['year', 'month', 'day', 'time'];
    const dayGan = p.dayGan, dayZhi = p.gz.day[1];
    const gans = COLS.map(k => p.gz[k][0]);
    const zhis = COLS.map(k => p.gz[k][1]);
    const shen = tenShenCounts(p);
    const strong = wangShuai(p).verdict === '身旺';
    const weak = wangShuai(p).verdict === '身弱';
    const hasG = (g) => gans.includes(g), hasZ = (z) => zhis.includes(z);
    const zhiCnt = (z) => zhis.filter(x => x === z).length;
    const ganCnt = (g) => gans.filter(x => x === g).length;
    const guan = shen['正官'] + shen['七杀'], cai = shen['正财'] + shen['偏财'], yin = shen['正印'] + shen['偏印'];
    const shi = shen['食神'] + shen['伤官'];
    const dayGZ = p.gz.day[0] + p.gz.day[1], timeGZ = p.gz.time[0] + p.gz.time[1];
    // 合计数（六合/三合）
    let heCnt = 0;
    for (const z of zhis) { const o = LIUHE[z]; if (o && zhis.includes(o)) heCnt++; }
    for (const s3 of SANHE) { const hit = s3.group.filter(z => zhis.includes(z)).length; if (hit >= 2) heCnt++; }
    // 1 飞天禄马（1966）
    if (dayGZ === '丁巳' && zhiCnt('巳') >= 2) hits.push('正飞天禄马：丁巳日得巳字多，巳冲出亥中壬水为官星（神峰 1966）' + ((hasZ('子') || hasZ('辰') || hasG('壬') || hasG('癸')) ? '——四柱见壬癸/辰巳，官星羁绊则减分数（原文）' : ''));
    if (dayGan === '辛' && zhiCnt('亥') >= 2) hits.push('倒飞天禄马：辛日得亥字多，亥冲出巳中丙火为官星（神峰 1966）' + ((hasZ('壬') || hasZ('癸') || hasG('壬') || hasG('癸')) ? '——见壬癸辰巳官星羁绊则减分数（原文）' : ''));
    // 2 刑合格（1968）
    if (dayGan === '癸' && timeGZ === '甲寅') {
      let t = '刑合格：六癸日时逢寅位，用巳中戊土为官星（神峰 1968）';
      if (hasG('戊') || hasG('己') || hasZ('申') || ganCnt('庚') >= 1) t += '；四柱见戊己/庚/申——怕戊己二方、庚寅伤甲、忌申字（原文）';
      hits.push(t);
    }
    // 3 子遥巳格（1970）
    if (dayGZ === '甲子' && timeGZ === '甲子') {
      let t = '子遥巳格：甲子日再遇甲子时，遥合巳中之丙戊为甲之官（神峰 1970）';
      if (hasG('庚') || hasG('辛') || /[申酉丑午]/.test(zhis.join(''))) t += '；见庚辛申酉丑午——金伤甲/午冲子/丑羁绊，畏之（原文）';
      hits.push(t);
    }
    // 4 丑遥巳格（1972）
    if ((dayGZ === '辛丑' || dayGZ === '癸丑') && shen['正官'] === 0) {
      let t = '丑遥巳格：辛丑癸丑二日，四柱无一点官星方用此格（神峰 1972）';
      if (hasZ('巳')) t += '；巳位填实则不能遥（原文"不要填实巳位"）';
      if (hasZ('子')) t += '；子字羁绊不能遥（原文）';
      hits.push(t);
    }
    // 5 时上偏财（1976）
    if (shen['偏财'] === 1 && p.ssGan.time === '偏财') hits.push('时上偏财：时上一位有之始为贵（神峰 1976）' + (strong ? '，要身旺（原文）' : ''));
    if (shen['偏财'] >= 2) hits.push('偏财多位：别位有之便多了，难作偏财而论（神峰 1976）');
    // 6 六阴朝阳（1978）
    if (dayGan === '辛' && timeGZ === '戊子') {
      let t = '六阴朝阳：辛日得戊子时，尽阴还阳，喜戊干合癸动巳中丙为官（神峰 1978）';
      if (hasZ('午')) t += '；忌午冲破子禄（原文）';
      hits.push(t);
    }
    // 7 偏官七杀（1981）
    if (shen['正官'] === 0 && shen['七杀'] >= 1) hits.push('偏官：四柱全无官星，用七杀为偏官（神峰 1981）' + (strong ? '，最要日干生旺（原文）' : '') + (shi >= 1 ? '，有食伤制伏' : '') + (shen['七杀'] >= 2 ? '；七杀' + shen['七杀'] + '透，原文"小人多凶暴"须制伏' : ''));
    if (shen['正官'] >= 1 && shen['七杀'] >= 1) hits.push('官杀混杂：四柱见正官又见七杀，不为清福反贱（神峰 1981；2007"须去杀用官或去官用杀方发福"）');
    // 8 戊日午月非刃（1984）
    if (dayGan === '戊' && p.gz.month[1] === '午') {
      let t = '戊日午月不作刃看：午为戊禄前一位之刃，然月生日干（阴火生阳土），午上不为刃（神峰 1984）';
      if (ganCnt('丙') + ganCnt('丁') >= 1) t += '；岁干时干见火，却为印绶格（原文"时岁火多却为印绶"）';
      hits.push(t);
    }
    // 9 建禄会杀（1986）
    if (dayGan === '甲' && p.gz.month[1] === '酉' && (hasZ('子') || hasZ('辰'))) hits.push('建禄会杀：甲日用酉月为官星正气，年时见子辰则申子辰会局，会起申中庚金七杀反为凶兆（神峰 1986）');
    // 10 合杀为贵（1988）
    if (dayGan === '甲' && p.gz.time[1] === '卯') hits.push('合杀：甲日得卯时，卯中乙木合庚为甲之偏官，合杀不为凶（神峰 1988）' + (gender === 1 ? '；男子得之温和与人投合贵（原文）' : '；女命多生心意不足，性乐私情，主克夫坏子（原文照录）'));
    // 11 官星太旺身弱（1990，神峰版，与继善篇同义——重叠补录）
    if (guan >= 2 && weak) hits.push('官星太旺，天元赢弱：取中和之气为福厚，偏党为福薄；身弱行官旺乡反成祸（神峰 1990）');
    // 12 时旺（1992）
    if (strong && cai === 0 && guan === 0 && yin === 0) hits.push('日干旺甚无依：财官禄马俱无，若不为僧即道（神峰 1992）');
    // 13 印绶见财（1994）
    if (yin >= 1 && cai >= 1) hits.push('印绶见财：印绶生月，岁时忌见财星，运入财乡宜退身避位（贪财坏印，神峰 1994）');
    // 14 劫财羊刃忌时逢（1996）
    if (YANG_REN[dayGan] && p.gz.time[1] === YANG_REN[dayGan]) hits.push('劫财羊刃切忌时逢：' + dayGan + '日羊刃在' + YANG_REN[dayGan] + '，时逢之（神峰 1996；"岁运并临灾殃立至"属行运，留待流年接口）');
    // 15 背禄（1999）
    if (dayGan === '甲' && (hasG('己') || hasG('丙'))) hits.push('背禄：甲得寅为禄，四柱见己丙为背禄，主初明后晦，喜财星戊己土助身（神峰 1999）');
    // 16 正气官星（2001）
    if (p.ssZhi.month && p.ssZhi.month[0] === '正官') {
      let t = '正气官星：提纲之要，月令为日主正官（神峰 2001）';
      if (cai >= 1) t += '；年时上有财气乃贵人（原文）';
      const mz = p.gz.month[1];
      const chongZ = zhis.find(x => CHONG[x] === mz);
      if (chongZ) t += '；月令官星被' + chongZ + '冲，忌刑冲克破之神填之（原文"忌刑冲克破之神填之"）';
      hits.push(t);
    }
    // 17 日干无气时逢刃（2005）
    if (weak && YANG_REN[dayGan] && p.gz.time[1] === YANG_REN[dayGan]) hits.push('日干无气，时逢羊刃不为凶：' + dayGan + '日弱而时逢' + YANG_REN[dayGan] + '刃帮身（神峰 2005）');
    // 18 官杀两停（2007）
    if (shen['正官'] >= 1 && shen['七杀'] >= 1) hits.push('官杀两停：须去杀用官或去官用杀方发福，行制伏之运；岁更旺乡混官杀其祸不可述（神峰 2007）');
    // 19 贪合忘官（2009）
    if (dayGan === '甲' && ((hasG('丙') && hasG('辛')) || (hasG('乙') && hasG('庚')))) hits.push('贪合忘官：甲用辛为官有丙合之，见庚为杀有乙合之，四柱有合为贪合忘官；合官不为贵，合杀不为凶（神峰 2009）');
    // 20 杀旺身旺化官（2011）
    if (strong && shen['七杀'] >= 1) hits.push('杀旺运纯身旺为官清贵：' + dayGan + '身旺不畏杀，以杀化为官星，行纯旺运乃极品之贵（神峰 2011；身旺为前提）');
    // 21 日主自坐官杀（2013）
    if (p.ssZhi.day && (p.ssZhi.day[0] === '正官' || p.ssZhi.day[0] === '七杀')) hits.push('日主自坐官杀：日支为' + p.ssZhi.day[0] + '，人元弱处复生（胎生元命），要官星旺运方可发福，不要冲破刑克（神峰 2013）');
    // 22 七杀全彰（2015）
    if (shen['七杀'] >= 2 && strong) hits.push('柱中七杀全彰：身旺建禄不为富，极贫无救（神峰 2015）');
    // 23 女命总论（2017）
    if (gender === 0) hits.push('女命：不取官星财星贵人三合六合，不要干支刚强羊刃比肩，喜安静清贵旺夫旺子；绝气刑冲破害不美（神峰 2017，原文照录）');
    // 24 贵众合多（2019）
    if (gender === 0 && guan >= 2 && heCnt >= 1) hits.push('贵众合多：女命官杀多而合多，定是尼师娼婢（神峰 2019，原文照录，作古籍断语不作定论）');
    // 25 偏官制伏太过（2021）
    if (shen['七杀'] >= 1 && shi >= 2) hits.push('偏官制伏太过：四柱制伏多乃尽法无民，中和之气为福厚偏党为福薄，贫儒（神峰 2021）');
    // 26 伤官官乡（2023）
    if (shen['伤官'] >= 1) hits.push('四柱伤官：运入官乡必破，须明轻重（神峰 2023；行运层面留待流年接口，原局"有官星运入官乡破者轻"）');
    // 27 胞胎受气（2025）
    const csArr = (D.changsheng && D.changsheng.items && D.changsheng.items[dayGan]) || [];
    const Z12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    const taiZ = csArr.length ? Z12[csArr.indexOf('胎')] : null;
    if (taiZ && dayZhi === taiZ) hits.push('胞胎日受气：五行绝处即是胎元，生日逢之受气（神峰 2025，' + dayGan + '日' + dayZhi + '为胎地）');
    return hits;
  }
  function jipanShenFengJuanMo(p, cs, gender) {
    const hits = [];
    const COLS = ['year', 'month', 'day', 'time'];
    const G = (k) => p.gz[k][0], Z = (k) => p.gz[k][1];
    const gans = COLS.map(G), zhis = COLS.map(Z);
    const inZ = (z) => zhis.includes(z);
    const ganCnt = (g) => gans.filter(x => x === g).length;
    const wc = wuxingCount(p);
    const riWx = WX[p.dayGan];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'];
    const shi = cs['食神'] + cs['伤官'], bi = cs['比肩'] + cs['劫财'];
    const kw = p.dayKongZhi || [];
    const kongZhis = zhis.filter(z => kw.includes(z));
    const S = (k) => p.ssGan[k], ZS = (k) => p.ssZhi[k] ? p.ssZhi[k][0] : '';
    const atCol = (k, names) => (S(k) && names.includes(S(k))) || (ZS(k) && names.includes(ZS(k)));
    const hasXing = zhis.some((z, i) => zhis.some((x, j) => j > i && z !== x && ((XING_EN.includes(z) && XING_EN.includes(x)) || (XING_SHI.includes(z) && XING_SHI.includes(x)) || ((z === '子' && x === '卯') || (z === '卯' && x === '子')) || (z === x && XING_ZI.includes(z)))));
    const hasHai = zhis.some((z, i) => zhis.some((x, j) => j > i && (HIT6[z] === x || HIT6[x] === z)));
    // 神煞自算（年支+日支双查，与神煞渲染区同口径）
    const shZhi = (kind) => { const s = new Set(); for (const b of new Set([Z('year'), Z('day')])) { const grp = SANHE.find(g2 => g2.group.includes(b)); if (grp && grp[kind]) s.add(grp[kind]); } return [...s]; };
    const taoZhi = shZhi('tao'), gaiZhi = shZhi('gai'), maZhi = shZhi('ma');
    const yr = YANG_REN[p.dayGan];
    const lu = LU[p.dayGan];
    const tdArr = TIAN_DE[p.monthZhi] || [];
    const yd = YUE_DE[p.monthZhi];
    const erDe = tdArr.some(c => gans.includes(c) || zhis.includes(c)) || (yd && gans.includes(yd));
    const riDe = RI_DE.includes(p.gz.day);
    const riGui = ['丁酉', '丁亥', '癸卯', '癸巳'].includes(p.gz.day);
    const PIAN_CAI = { '甲': '戊', '乙': '己', '丙': '庚', '丁': '辛', '戊': '壬', '己': '癸', '庚': '甲', '辛': '乙', '壬': '丙', '癸': '丁' };
    const A = (t, s, ln) => hits.push(t + ' —— ' + s + '（神峰通考 ' + ln + '）');
    // 络绎赋 3079-3081（宫位六亲）
    if (S('time') === '七杀' && KE[WX[Z('time')]] === WX[Z('year')]) A('后煞克年，父母早丧', '时柱七杀且时支' + Z('time') + '克年支' + Z('year') + '（3080）', '3080');
    if (S('year') === '七杀' && KE[WX[Z('year')]] === WX[Z('time')]) A('前煞克后，子息必亏', '年干七杀且年支' + Z('year') + '克时支' + Z('time') + '（3080）', '3080');
    if (maZhi.includes(Z('day'))) A('马入妻宫，必得能家之妇', '驿马' + Z('day') + '临日支（妻宫）（3080）', '3080');
    if (atCol('time', ['七杀'])) A('煞临子位，当招悖逆之儿', '时柱（子位）见七杀（3080）', '3080');
    if (lu && lu === Z('day')) A('禄入妻宫，食妻之禄', '日支' + Z('day') + '为日干' + p.dayGan + '之禄（3080）', '3080');
    if (atCol('time', ['正印', '偏印'])) A('印临子位，受子之荣', '时柱（子位）见印星（3080）', '3080');
    if (atCol('year', ['偏印'])) A('枭居年位，破祖之基', '年柱见偏印（3080）', '3080');
    if (atCol('month', ['正财', '偏财'])) A('财宫月旺，得父资财', '月柱见财星（原文"月旺"按财星居月作近似）（3080）', '3080');
    if (cs['食神'] === 0 && COLS.some(k => ZS(k) === '食神')) A('食神暗见，人物丰肥', '食神藏于支而不透干（3080）', '3080');
    if (cs['偏印'] >= 2 || (cs['偏印'] + cs['正印'] >= 3)) A('枭印重生，祖产飘荡', '偏印' + cs['偏印'] + '透（重生按≥2/印≥3 引擎设定）（3080）', '3080');
    if (cai > 0 && cs['正官'] > 0 && yin > 0) A('财生官，官生印，印生身，富贵双全', '财官印同透（原文指连续相生，作近似）（3081）', '3081');
    if (cs['伤官'] > 0 && cai > 0 && cs['七杀'] > 0) A('伤党财，财党杀，杀攻身，凶穷两逼', '伤官财七杀同透（3081）', '3081');
    if (lu && zhis.some(z => CHONG[lu] === z)) A('禄遭冲破，别土离乡', '禄神' + lu + '被' + zhis.find(z => CHONG[lu] === z) + '冲（3081）', '3081');
    // 玄机赋 3083
    if (cs['正官'] > 0 && cs['正印'] > 0 && cs['正财'] > 0 && cs['食神'] > 0) A('官印财食，无破清高', '正官正印正财食神四者并透（原文"无破"按无刑冲近似）（3083）', '3083');
    if ((cs['七杀'] + cs['伤官'] + cs['偏印']) >= 2 || (cs['七杀'] + cs['伤官'] + cs['偏印']) === 1 && yr && inZ(yr)) A('煞伤枭刃，用之最吉', '七杀/伤官/偏印' + (cs['七杀'] + cs['伤官'] + cs['偏印']) + '透' + (yr && inZ(yr) ? '且阳刃' + yr + '入命' : '') + '（3083）', '3083');
    if (gender === '1' && bi > 0 && cs['伤官'] > 0) A('男逢比劫伤官，克妻害子', '男命比劫' + bi + '与伤官同见（3083）', '3083');
    if (gender === '0' && cs['伤官'] > 0 && cs['偏印'] > 0) A('女犯伤官偏印，丧子刑夫', '女命伤官与偏印同见（3083）', '3083');
    if (cai >= 3) A('幼失双亲，财星太重', '财星' + cai + '透（"太重"按≥3 引擎设定）（3083）', '3083');
    if (CHONG[Z('year')] === Z('month')) A('年冲月令，离祖成家', '年支' + Z('year') + '冲月支' + Z('month') + '（3083）', '3083');
    if (CHONG[Z('day')] === Z('month')) A('日被提冲，弦断再续', '日支' + Z('day') + '冲月支' + Z('month') + '（3083）', '3083');
    if (CHONG[Z('day')] === Z('time')) A('时日对冲，伤妻克子', '日支' + Z('day') + '冲时支' + Z('time') + '（3083）', '3083');
    if (WX[Z('day')] === WX[Z('month')]) A('日通月气，得祖安身', '日支' + Z('day') + '与月支' + Z('month') + '同五行（3083）', '3083');
    if (riWx === '木' && ['寅', '卯'].includes(Z('month')) && (gans.includes('庚') || gans.includes('辛'))) A('木归春长，遇庚辛反假为权', '木日主春月见庚辛（3083）', '3083');
    if (riWx === '火' && ['巳', '午'].includes(Z('month')) && (gans.includes('壬') || gans.includes('癸'))) A('火居夏生，见壬癸能为福厚', '火日主夏月见壬癸（3083）', '3083');
    if (riWx === '土' && ['辰', '戌', '丑', '未'].some(z => inZ(z))) A('土逢辰戌丑未，木重成名', '土日主临四库（原文"木重"作近似）（3083）', '3083');
    if (riWx === '金' && ['申', '酉', '巳', '丑'].filter(z => inZ(z)).length >= 2) A('金生申酉巳丑，火乡发福', '金日主支见申酉巳丑（"火乡发福"指行运，近似）（3083）', '3083');
    if (riWx === '水' && (inZ('亥') || inZ('子'))) A('水居亥子，戊己难侵', '水日主支见亥子（"戊己难侵"指行运，近似）（3083）', '3083');
    if (weak) A('身坐休囚，平生未济', '日主身弱（3083）', '3083');
    if (weak && bi > 0) A('日干无气，遇劫为强', '日主弱而比劫' + bi + '透（3083）', '3083');
    if (cs['正官'] >= 2) A('重犯官星，只宜制伏', '正官' + cs['正官'] + '透（重犯按≥2 引擎设定）（3083）', '3083');
    if (cs['食神'] >= 2) A('食神叠至，须忌官乡', '食神' + cs['食神'] + '透（叠至按≥2 引擎设定；"忌官乡"指行运，近似）（3083）', '3083');
    if (riWx === '金' && wc['火'] === 0) A('顽金无火，大用不成', '金日主而四柱无火（3083）', '3083');
    if (riWx === '木' && wc['金'] === 0) A('强木无金，清名难著', '木日主而四柱无金（3083）', '3083');
    if (riWx === '木' && wc['土'] >= 2) A('木多得土，财帛厚', '木日主而土' + wc['土'] + '（3083）', '3083');
    if (riWx === '火' && wc['水'] >= 1) A('火焰逢波，禄位高', '火日主而见水（3083）', '3083');
    if (yr && inZ(yr) && cs['七杀'] > 0) A('羊刃极喜偏官', '阳刃' + yr + '入命且七杀透（3083）', '3083');
    if (['乙丑', '己巳', '癸酉'].includes(p.gz.time)) A('金神最宜制伏', '时柱' + p.gz.time + '为金神格（原文"最宜制伏"；制伏指见火制金，近似）（3083）', '3083');
    if (taoZhi.some(z => inZ(z)) && cs['七杀'] > 0) A('桃花带煞喜淫奔', '桃花' + zhis.filter(z => taoZhi.includes(z)).join('') + '与七杀并见（3083）', '3083');
    if (gaiZhi.filter(z => inZ(z)).length >= 2) A('华盖重逢多克剥', '华盖' + zhis.filter(z => gaiZhi.includes(z)).join('') + '两处（重逢按≥2 引擎设定）（3083）', '3083');
    // 万金赋 3091-3099
    if (cs['正官'] > 0 && cs['七杀'] > 0) A('官杀混杂人必夭，去官留杀仔细寻', '官杀同透（3091；与渊海901"官杀混杂有财者吉"两说并存）', '3091');
    if (S('time') === '劫财') A('日时偏正问何财，大怕干头带劫来', '时干劫财（3092）', '3092');
    if (cs['劫财'] >= 2) A('劫若重来人夭寿', '劫财' + cs['劫财'] + '透（重按≥2 引擎设定）（3093）', '3093');
    if (cs['食神'] > 0 && (WX[Z('month')] === SHENG[riWx] || SHENG[WX[Z('month')]] === SHENG[riWx])) A('食神有气胜财官', '食神透且食神得月令之气（"有气"按月支生助近似）（3096）', '3096');
    if (cs['伤官'] > 0 && cs['正官'] === 0 && cs['七杀'] === 0) A('伤官伤尽，行官运以无妨', '伤官透而无官杀（"伤尽"按无官杀近似；行官运作近似）（3097）', '3097');
    if (riDe && zhis.some(z => z !== Z('day') && CHONG[Z('day')] === z)) A('日德逢克战，此命危亡立马看', '日德' + p.gz.day + '被' + zhis.find(z => z !== Z('day') && CHONG[Z('day')] === z) + '冲（3097）', '3097');
    if (riGui && zhis.some(z => z !== Z('day') && (CHONG[Z('day')] === z || KE[WX[Z('day')]] === WX[z]))) A('日贵逢克战，此命危亡立马看', '日贵' + p.gz.day + '逢冲或受克（3097）', '3097');
    // 仙机赋 3104-3109
    if (cs['偏财'] > 0 && kongZhis.length && atCol('time', ['偏财'])) A('随母从父，偏财空而印旺', '偏财坐空' + (yin >= 2 ? '且印' + yin + '旺' : '') + '（3106）', '3106');
    if (yin > 0 && guan > 0) A('印绶逢生，母当贤贵', '印' + yin + '与官杀' + guan + '同透（官杀生印）（3107）', '3107');
    if (cs['偏财'] > 0 && inZ(LU[PIAN_CAI[p.dayGan]])) A('偏财归禄，父必峥嵘', '偏财' + PIAN_CAI[p.dayGan] + '之禄' + LU[PIAN_CAI[p.dayGan]] + '入支（3107）', '3107');
    if (guan > 0) { const gz = COLS.filter(k => S(k) === '正官' || S(k) === '七杀'); if (gz.some(k => inZ(LU[G(k)]))) A('官煞逢禄，子当显达', '官杀干' + gz.map(k => G(k)).join('') + '禄入支（3107）', '3107'); }
    if (cs['比肩'] > 0 && inZ(LU[p.dayGan])) A('比肩得禄，兄弟名高', '比肩（日干' + p.dayGan + '）禄' + LU[p.dayGan] + '入支（3107）', '3107');
    if (yin >= 3) A('印绶多而老无子', '印' + yin + '透（多按≥3 引擎设定）（3109）', '3109');
    if (gender === '0' && cs['伤官'] > 0) A('伤官旺而防伤夫', '女命伤官透（"旺"按透出作近似）（3109）', '3109');
    if (cs['食神'] === 1 && !weak) A('食神一位逢生旺，招子须当拜圣明', '食神恰一位且日主不弱（"逢生旺"按日主不弱近似）（3109）', '3109');
    // 金玉赋 3111
    if (guan > 0 && strong) A('他来克我为官星，身旺当权', '官杀' + guan + '透且身旺（3111）', '3111');
    if (cai > 0 && strong) A('我去克他为妻财，干强则富', '财' + cai + '透且身旺（"干强"按身旺近似）（3111）', '3111');
    if (gaiZhi.some(z => inZ(z)) && erDe) A('柱中若有华盖，逢二德乃清贵之人', '华盖与天/月德并见（3111）', '3111');
    if ((cs['正官'] > 0 && kongZhis.some(z => COLS.some(k => S(k) === '正官' && Z(k) === z))) || (cs['七杀'] > 0 && kongZhis.some(z => COLS.some(k => S(k) === '七杀' && Z(k) === z)))) A('官星七煞落空亡，在於九流之辈', '官/杀坐空亡（3111）', '3111');
    if (gender === '1' && cai > 0) A('妻星显露，子息必多', '男命财星' + cai + '透（妻星=财）（3111）', '3111');
    {
      const timeXing = COLS.some(k2 => k2 !== 'time' && Z(k2) !== Z('time') && ((XING_EN.includes(Z('time')) && XING_EN.includes(Z(k2))) || (XING_SHI.includes(Z('time')) && XING_SHI.includes(Z(k2))) || ((Z('time') === '子' && Z(k2) === '卯') || (Z('time') === '卯' && Z(k2) === '子')) || (Z('time') === Z(k2) && XING_ZI.includes(Z('time')))));
      const timeHai = COLS.some(k2 => k2 !== 'time' && (HIT6[Z('time')] === Z(k2) || HIT6[Z(k2)] === Z('time')));
      if (timeXing || timeHai) A('刑害嗣宫，男女罕得', '时柱（嗣宫）' + Z('time') + (timeXing ? '逢刑' : '') + (timeHai ? '逢害' : '') + '（3111）', '3111');
    }
    if (cai === 0 && COLS.every(k => ZS(k) !== '正财' && ZS(k) !== '偏财')) A('八字无财，须求本分', '四柱无财星（透干与支本气皆无）（3111）', '3111');
    // 渊源集说 3120-3124
    if (cs['正官'] > 0 && atCol('time', ['正财', '偏财'])) A('最贵者官星为命，时得偏正财为福', '正官透且时柱见财（3120）', '3120');
    if (cs['七杀'] > 0 && erDe) A('最凶者七煞临身，逢天月二德呈祥', '七杀透而天/月德入命（3120）', '3120');
    if (cs['正官'] > 0 && cs['劫财'] > 0) A('官星如遇劫财，虽官不贵', '正官与劫财同见（3121）', '3121');
    if (yr && inZ(yr) && yin > 0) A('羊刃若逢印绶，纵贵有残疾在身', '阳刃' + yr + '入命且印' + yin + '透（3122）', '3122');
    if (cs['七杀'] > 0 && cs['正官'] > 0 && shi === 0) A('七煞无制逢官，为祸而寿元不长', '七杀正官同透而无食伤制（3122）', '3122');
    if (yr && inZ(yr) && cs['七杀'] > 0) A('羊刃更兼会杀，千里徒流', '阳刃' + yr + '与七杀并见（3124）', '3124');
    if (cai > 0 && cs['劫财'] > 0) A('用财若遇劫压，一生贫困', '财与劫财同见（3124）', '3124');
    // 幽微天干赋 3132-3141
    if (ganCnt('辛') >= 2 && ganCnt('丙') >= 1) A('三辛见丙兮，财多破散', '辛' + ganCnt('辛') + '见丙（3136）', '3136');
    if (ganCnt('壬') >= 1 && ganCnt('丁') >= 1) A('二壬就丁兮，家道丰稔', '壬见丁（3136）', '3136');
    if (wc['土'] >= 3 && wc['水'] >= 1 && wc['土'] > wc['水']) A('土力败水，则胃弱而色黑', '土' + wc['土'] + '胜水' + wc['水'] + '（3136）', '3136');
    if (wc['木'] >= 3 && wc['土'] >= 1 && wc['木'] > wc['土']) A('木气刑土，则脾衰而面黄', '木' + wc['木'] + '克土' + wc['土'] + '（3136）', '3136');
    if (gender === '1' && cai >= 2) A('男逢两位之妻，必须置妾', '男命财星' + cai + '透（两位按≥2 引擎设定）（3137）', '3137');
    if (wc['火'] >= 3 && wc['水'] === 0) A('火炎水涸者，多自坏之苦', '火' + wc['火'] + '而水绝（3137）', '3137');
    if (wc['木'] >= 2 && wc['火'] >= 2) A('木秀火明者，有吉庆之祥', '木' + wc['木'] + '火' + wc['火'] + '并见（3137）', '3137');
    if (cai === 1 && guan >= 2) A('一财未必胜两官，一禄不能当两鬼', '财1而官杀' + guan + '（3138）', '3138');
    if (inZ('申') && (gans.includes('甲') || gans.includes('乙'))) A('头面有损，则申破甲乙', '支见申而甲乙透（申金克甲乙木）（3139）', '3139');
    if (gans.includes('丙') && (inZ('亥') || inZ('子'))) A('眼目有灾，则丙沉亥子', '丙透而支见亥子（3139/3146 两赋同义）', '3139');
    if (cs['正官'] > 0 && yin > 0) A('官印双全，乘旄戟而居武职', '正官与印同透（3140）', '3140');
    if (guan >= 2 && cs['偏印'] > 0) A('两在鬼乡，逢倒食必为奴婢', '官杀' + guan + '重而偏印透（3140）', '3140');
    // 人元消息赋 3143-3148
    if (ganCnt('丙') >= 1 && ganCnt('辛') >= 1 && wc['水'] >= 2) A('丙辛化水，到亥子位列天庭', '丙辛同透且水' + wc['水'] + '（化气得地作近似）（3146）', '3146');
    if (ganCnt('丁') >= 1 && ganCnt('壬') >= 1 && wc['木'] >= 2) A('丁壬化木，临寅位身居宰职', '丁壬同透且木' + wc['木'] + '（化气得地作近似）（3146）', '3146');
    if (riWx === '金' && wc['火'] >= 2) A('金到火乡，财多聚散', '金日主而火' + wc['火'] + '（3146）', '3146');
    if (riWx === '水' && wc['火'] >= 2) A('旺水入火地，家道荣昌', '水日主而火' + wc['火'] + '（3146）', '3146');
    if (inZ('酉') && (gans.includes('甲') || gans.includes('乙'))) A('头面有损，酉金逢于甲乙', '支见酉而甲乙透（3146）', '3146');
    // 形貌性度查表（3147：按日主五行照录）
    {
      const XM = {
        '木': '木象带青而秀长，兼主聪明仁义',
        '火': '火相面赤而圆；火好礼而性急',
        '土': '土象色黄而厚；土主信而敦崇',
        '金': '金木相面多青白；金好杀而刚直',
        '水': '壬癸相面多黑色；水方圆而多智' + (p.dayGan === '壬' ? '（壬得气而肥）' : (p.dayGan === '癸' ? '（癸失时而瘦）' : ''))
      };
      A('形貌性度（按日主' + riWx + '查表照录）：' + XM[riWx], '人元消息赋 3147', '3147');
    }
    // 地支赋 3150-3156
    if (riWx === '土') A('土居专位，为人丰厚尊崇', '日主土（3152）', '3152');
    if (riWx === '水' && (inZ('亥') || inZ('子'))) A('水临亥子，足智方圆大量', '水日主支见亥子（3152）', '3152');
    if (p.dayGan === '甲' && wc['金'] >= 2) A('甲游从革，风灾困苦', '甲日而金' + wc['金'] + '（从革指金旺）（3152）', '3152');
    if (p.dayGan === '戊' && wc['水'] >= 2) A('戊逢润下，萍梗屯禀', '戊日而水' + wc['水'] + '（润下指水旺）（3152）', '3152');
    if (wc['金'] >= 2 && wc['火'] >= 2) A('金旺火盛，坚刚得制无亏', '金' + wc['金'] + '火' + wc['火'] + '并见（金得火制）（3153）', '3153');
    if (wc['木'] >= 3 && wc['金'] === 0) A('木盛金衰，一世为人下贱', '木' + wc['木'] + '而金绝（3153）', '3153');
    if (wc['金'] >= 3 && wc['水'] >= 2) A('金多好杀，水性多淫', '金' + wc['金'] + '水' + wc['水'] + '并盛（3153）', '3153');
    if ((p.dayGan === '戊' || p.dayGan === '己') && wc['土'] >= 3) A('戊己壮而富足', '戊己日主而土' + wc['土'] + '（3153）', '3153');
    if ((p.dayGan === '庚' || p.dayGan === '辛') && wc['金'] <= 1) A('庚辛亏而寡贫', '庚辛日主而金' + wc['金'] + '（亏按≤1 引擎设定）（3153）', '3153');
    if (p.dayGan === '丁' && inZ('巳')) A('丁到巳而飘泊', '丁日支见巳（3153）', '3153');
    if (p.dayGan === '辛' && inZ('子')) A('辛到子而性忤', '辛日支见子（3153）', '3153');
    if (p.dayGan === '己' && (inZ('戌') || inZ('未'))) A('己逢戌未多差', '己日支见戌/未（3153）', '3153');
    if (p.dayGan === '庚' && (inZ('亥') || inZ('辰'))) A('庚到亥辰儒雅', '庚日支见亥/辰（3153）', '3153');
    if (p.dayGan === '癸' && inZ('子')) A('癸临子位，坐居两府之权', '癸日支见子（3154）', '3154');
    if ((p.dayGan === '丙' || p.dayGan === '丁') && wc['火'] >= 3) A('丙丁盛而好礼', '丙丁日主而火' + wc['火'] + '（3154）', '3154');
    if ((p.dayGan === '壬' || p.dayGan === '癸') && wc['水'] >= 3) A('壬癸旺而足智', '壬癸日主而水' + wc['水'] + '（3154）', '3154');
    return hits;
  }
  // ── 神峰通考·病源赋机判（3157-3160）──
  function jipanBingYuanFu(p, cs) {
    const hits = [];
    const COLS = ['year', 'month', 'day', 'time'];
    const G = (k) => p.gz[k][0], Z = (k) => p.gz[k][1];
    const gans = COLS.map(G), zhis = COLS.map(Z);
    const inZ = (z) => zhis.includes(z);
    const wc = wuxingCount(p);
    const riWx = WX[p.dayGan];
    const ws = wangShuai(p);
    const weak = ws.verdict === '身弱';
    const hasXing = zhis.some((z, i) => zhis.some((x, j) => j > i && z !== x && ((XING_EN.includes(z) && XING_EN.includes(x)) || (XING_SHI.includes(z) && XING_SHI.includes(x)) || ((z === '子' && x === '卯') || (z === '卯' && x === '子')) || (z === x && XING_ZI.includes(z)))));
    const A = (t, s, ln) => hits.push(t + ' —— ' + s + '（神峰通考·病源赋 ' + ln + '）');
    if (gans.includes('甲') && gans.includes('庚')) A('甲庚乙辛，气损于肢', '甲庚并见（3159）', '3159');
    else if (gans.includes('乙') && gans.includes('辛')) A('甲庚乙辛，气损于肢', '乙辛并见（3159）', '3159');
    if (gans.includes('戊') && gans.includes('甲')) A('戊甲己乙，风中乎体', '戊甲并见（3159）', '3159');
    else if (gans.includes('己') && gans.includes('乙')) A('戊甲己乙，风中乎体', '己乙并见（3159）', '3159');
    if (riWx === '木' && wc['金'] >= 3) A('木为金制，不无掌手之儿童', '木日主而金' + wc['金'] + '（制按≥3 引擎设定）（3159）', '3159');
    if (riWx === '火' && wc['水'] >= 3) A('火被水刑，未免失明之子弟', '火日主而水' + wc['水'] + '（3159）', '3159');
    if (p.dayGan === '丁' && ['亥', '卯', '未'].every(z => inZ(z))) A('丁旺于亥卯未之乡，感离火之太热', '丁日支会亥卯未（3159）', '3159');
    if (p.dayGan === '丙' && ['申', '子', '辰'].every(z => inZ(z))) A('丙绝于申子辰之地，伤坎水之尤寒', '丙日支会申子辰（3159）', '3159');
    if (riWx === '土' && weak) A('土败而胃有积', '土日主身弱（3159）', '3159');
    if (gans.includes('乙') && gans.includes('辛')) A('乙见于辛，岂是目神之弱', '乙辛并见（3159）', '3159');
    if (gans.includes('戊') && gans.includes('甲')) A('戊逢于甲，安能手足之完', '戊甲并见（3159）', '3159');
    if (gans.includes('癸') && gans.includes('己')) A('癸逢己而内疝当针', '癸己并见（3159）', '3159');
    if (gans.includes('壬') && gans.includes('戊')) A('壬遇戊而外癃可畏', '壬戊并见（3159）', '3159');
    if (gans.includes('庚') && gans.includes('丙')) A('庚缘丙而血下；庚丙主赘瘤之疾', '庚丙并见（3159/3160 两句原文照录）', '3159');
    if (gans.includes('辛') && gans.includes('丁')) A('辛值丁而气郁', '辛丁并见（3159）', '3159');
    if (riWx === '木' && hasXing) A('木犯刑而疥癣', '木日主而地支逢刑（3160）', '3160');
    if (riWx === '火' && cs['七杀'] > 0) A('火因鬼而遇狂', '火日主见七杀（鬼=官杀）（3160）', '3160');
    if (riWx === '土' && (gans.includes('甲') || gans.includes('乙'))) A('土临甲乙，则呕吐而损胃', '土日主见甲乙（3160）', '3160');
    if (riWx === '金' && (gans.includes('丙') || gans.includes('丁'))) A('金见丙丁则衄血', '金日主见丙丁（3160）', '3160');
    if (p.dayGan === '辛' && gans.includes('丁')) A('辛见乎丁，常有失强之妾', '辛见丁（3160）', '3160');
    if (p.dayGan === '庚' && gans.includes('丙')) A('庚逢于丙，每怀疾病之心', '庚见丙（3160）', '3160');
    if (['乙', '丁', '己', '辛', '癸'].includes(p.dayGan) && hasXing) A('阴干三刑，邪必中脏', '阴日干' + p.dayGan + '而地支逢刑（3160）', '3160');
    if (['甲', '丙', '戊', '庚', '壬'].includes(p.dayGan) && cs['七杀'] > 0) A('阳神七煞，病败于腑', '阳日干' + p.dayGan + '见七杀（3160）', '3160');
    return hits;
  }
  // ── 神峰通考·定真篇宫位机判（2567-2601）──
  function jipanDingZhenPian(p, cs, gender) {
    const hits = [];
    const COLS = ['year', 'month', 'day', 'time'];
    const G = (k) => p.gz[k][0], Z = (k) => p.gz[k][1];
    const zhis = COLS.map(Z), gans = COLS.map(G);
    const inZ = (z) => zhis.includes(z);
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'];
    // 死墓绝胎位（阳干顺行/阴干逆行十二长生，按日干查）
    const SI_JUE = {
      '甲': ['午', '未', '申', '酉'], '乙': ['亥', '戌', '酉', '申'],
      '丙': ['酉', '戌', '亥', '子'], '丁': ['寅', '丑', '子', '亥'],
      '戊': ['酉', '戌', '亥', '子'], '己': ['寅', '丑', '子', '亥'],
      '庚': ['子', '丑', '寅', '卯'], '辛': ['巳', '辰', '卯', '寅'],
      '壬': ['卯', '辰', '巳', '午'], '癸': ['申', '未', '午', '巳'],
    };
    const hasXingAt = (z0) => zhis.some(x => x !== z0 && ((XING_EN.includes(z0) && XING_EN.includes(x)) || (XING_SHI.includes(z0) && XING_SHI.includes(x)) || ((z0 === '子' && x === '卯') || (z0 === '卯' && x === '子')) || (z0 === x && XING_ZI.includes(z0))));
    const hasChongAt = (z0) => zhis.some(x => x !== z0 && CHONG[z0] === x);
    const hasHaiAt = (z0) => zhis.some(x => x !== z0 && (HIT6[z0] === x || HIT6[x] === z0));
    const A = (t, s, ln) => hits.push(t + ' —— ' + s + '（神峰通考·定真篇 ' + ln + '）');
    if (cai >= 2 && strong) A('财多干旺，则多称意', '财' + cai + '透且日干旺（2582）', '2582');
    if (cai >= 2 && weak) A('财多干衰，则财反祸（"财多身弱，正为富室贫人"）', '财' + cai + '透而日干弱（2582/2583）', '2582');
    if (['甲寅', '乙卯', '丙午', '丁未', '戊辰', '己丑', '庚申', '辛酉', '壬子', '癸亥'].includes(p.gz.day)) A('干与支同，损财伤妻', '日柱' + p.gz.day + '干支同字（2584）', '2584');
    if (gender === '1') {
      const zi = COLS.filter(k => p.ssGan[k] === '正官' || p.ssGan[k] === '七杀');
      if (zi.length) A('男取克干为嗣（子星=官杀）', '子星（官杀）' + zi.map(k => G(k)).join('') + '透（2585）', '2585');
      if (cs['食神'] + cs['伤官'] >= 2) A('四柱有克子息之星（食伤制官杀），可言无子之近似', '食伤' + (cs['食神'] + cs['伤官']) + '（克子息之星，2586 近似）', '2586');
    } else {
      const zi = COLS.filter(k => p.ssGan[k] === '食神' || p.ssGan[k] === '伤官');
      if (zi.length) A('女取干生为子（子星=食伤）', '子星（食伤）' + zi.map(k => G(k)).join('') + '透（2585）', '2585');
    }
    if (cs['比肩'] + cs['劫财'] > 0 && SI_JUE[p.dayGan].includes(Z('month'))) A('月为兄弟宫：比和同干为兄弟之星，临死绝墓胎月，兄弟不得力', '月支' + Z('month') + '为日干' + p.dayGan + '死墓绝胎位（2593/2594）', '2593');
    if (Z('day') && hasXingAt(Z('day'))) A('日为妻宫，在刑地，克妻妾', '日支' + Z('day') + '逢刑（2596）', '2596');
    if (p.ssZhi.day && p.ssZhi.day[0] === '七杀') A('日为妻宫，坐杀，克妻妾', '日支' + Z('day') + '本气七杀（2596）', '2596');
    if (hasXingAt(Z('year')) || hasChongAt(Z('year')) || hasHaiAt(Z('year'))) A('生年为祖上宫，忌刑冲破害伤于生年，应主祖宗暌败', '年支' + Z('year') + (hasChongAt(Z('year')) ? '逢冲' : '') + (hasXingAt(Z('year')) ? '逢刑' : '') + (hasHaiAt(Z('year')) ? '逢害' : '') + '（2601）', '2601');
    return hits;
  }
  // ── 神峰通考·金不换骨髓歌行运提示（1112-1231，十干×十二月 119首查表；己土寅月原文缺失）──
  function jipanJinBuHuan(p) {
    const hits = [];
    const list = D.jinbuhuan || [];
    const key = p.dayGan + p.monthZhi;
    const found = list.find(x => x.d + x.m === key);
    if (found) hits.push('金不换骨髓歌（' + p.dayGan + '日·' + p.monthZhi + '月提）：' + found.txt + '（原文照录；行运方向提示，非原局断语）');
    else if (key === '己寅') hits.push('金不换骨髓歌：己土寅月一首原文缺失（古籍原缺，如实说明）');
    else hits.push('金不换骨髓歌：' + key + '组合不在 119 首表内（如实不编造）');
    return hits;
  }
  // ── 神峰通考·认格局生死之歌（1102）/看命绳尺（1111） + 命理约言·干支一气（303）/双美二日（315）──
  function jipanShengSiGe(p, cs) {
    const hits = [];
    const COLS = ['year', 'month', 'day', 'time'];
    const G = (k) => p.gz[k][0], Z = (k) => p.gz[k][1];
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'];
    const bi = cs['比肩'] + cs['劫财'];
    const A = (t, s, src, ln) => hits.push(t + ' —— ' + s + '（' + src + ' ' + ln + '）');
    if (yin > 0 && cai > 0) A('印绶见财行财运，又见死绝入黄泉', '印' + yin + '与财' + cai + '同透（"行财运/死绝"指行运，作近似）', '神峰通考·认格局生死之歌', '1102');
    if (cai > 0 && bi > 0) A('正财偏财见比肩分夺，又见岁运冲合必死', '财' + cai + '见比肩' + bi + '分夺（"岁运"指行运，作近似）', '神峰通考·认格局生死之歌', '1102');
    if (strong && guan + cai <= 1) A('日主旺而财官弱，运行财乡名利驰', '身旺而财官' + (guan + cai) + '（"运行财乡"指行运，作近似）', '神峰通考·金不换看命绳尺', '1111');
    if (strong && bi >= 2) A('身旺比劫重，损财又伤妻', '身旺而比劫' + bi + '（1111）', '神峰通考·金不换看命绳尺', '1111');
    if (cs['伤官'] >= 2) A('伤官四柱见，伯道老无儿', '伤官' + cs['伤官'] + '（1111）', '神峰通考·金不换看命绳尺', '1111');
    // 命理约言 303/315（旧说照录+素庵驳）
    const ganAll = COLS.map(G).join('');
    const zhiAll = COLS.map(Z).join('');
    if (new Set(ganAll.split('')).size === 1 && new Set(zhiAll.split('')).size === 1) A('天干一气，地支相同，人命值此，位至三公（旧说）；素庵驳：干支各一字必有所缺陷，须合财官印食取用', '四柱' + ganAll + zhiAll + '干支各同（命理约言·干支一气论 303）', '命理约言', '303');
    if (p.gz.day === '壬午' || p.gz.day === '癸巳') A('壬午癸巳二日为财官双美格（旧说）；素庵驳：日支财官只一端，须日主能任', '日柱' + p.gz.day + '（命理约言·双美论 315）', '命理约言', '315');
    // 子平真诠·阳干逢库（徐注 307：壬逢辰、丙坐戌为通根身库，不作弱论）
    if ((p.dayGan === '甲' && Z('day') === '未') || (p.dayGan === '丙' && Z('day') === '戌') || (p.dayGan === '戊' && Z('day') === '戌') || (p.dayGan === '庚' && Z('day') === '丑') || (p.dayGan === '壬' && Z('day') === '辰')) A('阳干逢库：' + p.dayGan + '日坐' + Z('day') + '，为通根身库，不作弱论', '徐注"壬逢辰、丙坐戌之类，不以为水火通根身库…必宜一切扫除"（子平真诠评注 307）', '子平真诠评注', '307');
    return hits;
  }
  // ── 三命通会·六十甲子纳音性质详论（294-478，逐柱照录含五行要论/阎东叟/玉宵宝鉴引文）──
  function jipanNayinXiang(p) {
    const hits = [];
    const list = D.nayin_xiang || [];
    const find = (gz, col) => list.find(x => x.k === gz);
    const y = find(p.na.year, '年'), d = find(p.na.day, '日');
    if (y) hits.push('年柱' + p.gz.year + '·纳音详论（' + y.txt + '）（原文照录）');
    else hits.push('年柱' + p.gz.year + '纳音详论未收录（如实不编造）');
    if (d) hits.push('日柱' + p.gz.day + '·纳音详论（' + d.txt + '）（原文照录）');
    else hits.push('日柱' + p.gz.day + '纳音详论未收录（如实不编造）');
    return hits;
  }
  // ── 命理约言·正变诸格名目机判（60-91：暗冲/暗合/从官从伤从食/两神成象；化气/从财从杀/五行成局已由A2外格46格覆盖不重复）──
  function jipanMingLiYueYanGe(p, cs) {
    const hits = [];
    const COLS = ['year', 'month', 'day', 'time'];
    const G = (k) => p.gz[k][0], Z = (k) => p.gz[k][1];
    const zhis = COLS.map(Z), gans = COLS.map(G);
    const hasZ = (z) => zhis.includes(z);
    const cntZ = (z) => zhis.filter(x => x === z).length;
    const dayG = G('day'), dayZ = Z('day');
    const A = (t, s, ln) => hits.push(t + ' —— ' + s + '（命理约言·看格局法 ' + ln + '）');
    // 暗冲格（87-89）
    if (dayG === '丙' && dayZ === '午' && cntZ('午') >= 2) A('暗冲格：丙午日午多冲子（冲官格）', '日柱丙午，支午' + cntZ('午') + '（87）', '87');
    if (dayG === '丁' && dayZ === '巳' && cntZ('巳') >= 2) A('暗冲格：丁巳日巳多冲亥（冲官格）', '日柱丁巳，支巳' + cntZ('巳') + '（87）', '87');
    if (['庚子', '壬子'].includes(p.gz.day) && cntZ('子') >= 2) A('暗冲格：' + p.gz.day + '日子多冲午（冲官格）', '日柱' + p.gz.day + '，支子' + cntZ('子') + '（88）', '88');
    if (['辛亥', '癸亥'].includes(p.gz.day) && cntZ('亥') >= 2) A('暗冲格：' + p.gz.day + '日亥多冲巳（冲官格）', '日柱' + p.gz.day + '，支亥' + cntZ('亥') + '（88）', '88');
    if (dayG === '庚' && ['申', '子', '辰'].every(z => hasZ(z))) A('暗冲格：庚日申子辰全，冲寅午戌', '庚日支全申子辰（89）', '89');
    // 暗合格（90）
    if (p.gz.day === '甲辰' && cntZ('辰') >= 2) A('暗合格：甲辰日辰多合酉（合官格）', '日柱甲辰，支辰' + cntZ('辰') + '（90）', '90');
    if (p.gz.day === '戊戌' && cntZ('戌') >= 2) A('暗合格：戊戌日戌多合卯（合官格）', '日柱戊戌，支戌' + cntZ('戌') + '（90）', '90');
    if (p.gz.day === '癸卯' && cntZ('卯') >= 2) A('暗合格：癸卯日卯多合戌（合官格）', '日柱癸卯，支卯' + cntZ('卯') + '（90）', '90');
    if (p.gz.day === '癸酉' && cntZ('酉') >= 2) A('暗合格：癸酉日酉多合辰（合官格）', '日柱癸酉，支酉' + cntZ('酉') + '（90）', '90');
    // 从格（62/64/67：从官/从伤/从食；从财914从杀915已由外格卡覆盖不重复）
    const rootChars = [];
    for (const z of zhis) rootChars.push(...(D.zanggan[z] || ''));
    const noRoot = !rootChars.includes(dayG);
    const ssGanAll = COLS.map(k => p.ssGan[k]);
    const biyin = ssGanAll.filter(s => s === '比肩' || s === '劫财' || s === '正印' || s === '偏印').length;
    if (noRoot && cs['正官'] + cs['七杀'] >= 3 && biyin === 0) A('从官格（日主无根，满局皆官）', '日干无根，官' + (cs['正官'] + cs['七杀']) + '无印比劫（62 近似）', '62');
    if (noRoot && cs['伤官'] >= 3 && biyin === 0) A('从伤格（日主无根，满局皆伤）', '日干无根，伤官' + cs['伤官'] + '无印比劫（64 近似）', '64');
    if (noRoot && cs['食神'] >= 3 && biyin === 0) A('从食格（日主无根，满局皆食）', '日干无根，食神' + cs['食神'] + '无印比劫（67 近似）', '67');
    // 两神成象格（78-86：各占两干两支）
    const WX_GAN = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
    const cnt = {};
    for (const g of gans) cnt[WX_GAN[g]] = (cnt[WX_GAN[g]] || 0) + 1;
    for (const z of zhis) cnt[WX[z]] = (cnt[WX[z]] || 0) + 1;
    const wxs = Object.keys(cnt);
    const ganWx = {}; for (const g of gans) ganWx[WX_GAN[g]] = (ganWx[WX_GAN[g]] || 0) + 1;
    const zhiWx = {}; for (const z of zhis) zhiWx[WX[z]] = (zhiWx[WX[z]] || 0) + 1;
    if (wxs.length === 2) {
      const [a, b] = wxs;
      if (cnt[a] === 4 && cnt[b] === 4 && ganWx[a] === 2 && ganWx[b] === 2 && zhiWx[a] === 2 && zhiWx[b] === 2) {
        const sheng = { '水木': '水木相生格', '木火': '木火相生格', '火土': '火土相生格', '土金': '土金相生格', '金水': '金水相生格' };
        const cheng = { '木土': '木土相成格', '水火': '水火相成格', '火金': '火金相成格', '金木': '金木相成格' };
        const nm = sheng[a + b] || sheng[b + a] || cheng[a + b] || cheng[b + a];
        if (nm) A('两神成象格：' + nm, a + '与' + b + '各占两干两支（78-86）', '78');
      }
    }
    return hits;
  }
  // ── 神峰通考·外格断语照录（432-1056 各格段首原文，按成格名匹配）──
  function jipanShenfengWaige(wg) {
    const hits = [];
    const list = D.shenfeng_waige || [];
    const names = (wg || []).map(x => x.name || '');
    for (const nm of names) {
      const n2 = nm.slice(0, 2);
      const row = list.find(x => x.k === nm || x.k.slice(0, 2) === n2 || nm.includes(x.k));
      if (row) hits.push('【' + nm + '】' + row.txt + '（神峰通考 ' + row.start + ' 起，原文照录·节选）');
      else hits.push('【' + nm + '】神峰通考外格断语未收录该格（如实说明）');
    }
    return hits;
  }
  // ── 三命通会·三十纳音象论（559-1094，按纳音象名查表照录）──
  function jipanSanMingNayinXiang(p) {
    const hits = [];
    const list = D.sanming_nayin_xiang || [];
    const y = p.na.year, d = p.na.day;
    const rowY = list.find(x => x.k === y), rowD = list.find(x => x.k === d);
    if (rowY) hits.push('年柱纳音【' + y + '】' + rowY.txt + '（三命通会 ' + rowY.start + ' 起，原文照录·节选）');
    else hits.push('年柱纳音' + y + '象论未收录（如实不编造）');
    if (rowD) hits.push('日柱纳音【' + d + '】' + rowD.txt + '（三命通会 ' + rowD.start + ' 起，原文照录·节选）');
    else hits.push('日柱纳音' + d + '象论未收录（如实不编造）');
    return hits;
  }
  // ── 三命通会·外格各论照录（3748-4353，随成格命中；与神峰版解释不同，另行照录）──
  function jipanSanMingWaige(wg) {
    const hits = [];
    const list = D.sanming_waige || [];
    for (const w of (wg || [])) {
      const nm = w.name || '';
      const row = list.find(x => x.k === nm || nm.includes(x.k) || x.k.includes(nm) || x.k.slice(0, 2) === nm.slice(0, 2));
      if (row) hits.push('【三命通会版·' + nm + '】' + row.txt + '（三命通会 ' + row.start + ' 起，原文照录·节选）');
      else hits.push('【' + nm + '】三命通会外格段未收录该格（如实说明）');
    }
    return hits;
  }
  // ── 三命通会·时断后看命心法（8680-8746，机械条件句）──
  function jipanShiDuanHouXinFa(p, cs) {
    const hits = [];
    const A = (t, s, ln) => hits.push(t + ' —— ' + s + '（三命通会 ' + ln + '）');
    const guan = cs['正官'], sha = cs['七杀'], cai = cs['正财'] + cs['偏财'], yin = cs['正印'] + cs['偏印'], shi = cs['食神'] + cs['伤官'];
    if (guan === 1) A('凡正官一位，乃君子贵人，笃厚纯粹，刚直廉明，年时有印尤妙', '正官透' + guan + '（8683-8684）', '8683');
    if (guan >= 4) A('正官多则反主成败，四位纯官，仕宦虚名', '正官透' + guan + '（8685）', '8685');
    if (sha === 1) A('凡七煞一位，聪明伶俐', '七杀透' + sha + '（8686）', '8686');
    if (sha >= 2 && sha <= 3) A('七煞二位三位，先清后浊', '七杀透' + sha + '（8686）', '8686');
    if (sha >= 4) A('四柱纯煞' + (shi > 0 ? '有制贵' : '无制贫'), '七杀透' + sha + '，食伤' + shi + '（8687）', '8687');
    if (cai === 1) A('凡财一位务要得时，富贵成家，为人性燥紧急', '财透' + cai + '（8688）', '8688');
    if (cai === 2) A('财二位，性气灭半', '财透' + cai + '（8689）', '8689');
    if (cai >= 3) A('财三位四位，耗气身衰；' + (wangShuai(p).verdict === '身旺' ? '身旺甚则可成立' : '身弱则劳苦生受'), '财透' + cai + '（8689-8690）', '8689');
    if (yin >= 1 && cai > 0) A('凡印不论位数都好，格中不宜见财破印', '印' + yin + '而财' + cai + '同透（8691）', '8691');
    if (shiShenOf(p.dayGan, p.gz.year[0]) === '正官') A('年干上有日之官星，福气最厚', '年干' + p.gz.year[0] + '为日主正官（8718）', '8718');
    if (shiShenOf(p.dayGan, p.gz.year[0]) === '七杀') A('年干上有日之七煞，终身不可除去', '年干' + p.gz.year[0] + '为日主七杀（8719）', '8719');
    return hits;
  }
  // ── 神峰通考·六亲说（47：年上财官祖宗荣显/月上官杀兄弟凋零）──
  function jipanShenFengLiuQin(p, cs) {
    const hits = [];
    const A = (t, s, ln) => hits.push(t + ' —— ' + s + '（神峰通考·六亲说 ' + ln + '）');
    const ySS = shiShenOf(p.dayGan, p.gz.year[0]);
    const mSS = shiShenOf(p.dayGan, p.gz.month[0]);
    if (ySS === '正财' || ySS === '偏财' || ySS === '正官') A('年上财官，主祖宗之荣显', '年干' + p.gz.year[0] + '为' + ySS + '（47）', '47');
    if (mSS === '正官' || mSS === '七杀') A('月上官杀，主兄弟之凋零', '月干' + p.gz.month[0] + '为' + mSS + '（47）', '47');
    return hits;
  }
  // ── 渊海子平·论杂气（2610-2617 条件句）──
  function jipanYuanHaiZaQi(p, cs) {
    const hits = [];
    const mu = ['辰', '戌', '丑', '未'];
    if (mu.includes(p.monthZhi) && cs['正财'] + cs['偏财'] >= 2) hits.push('杂气要财多，便是贵命（若年时别入他格，当以他格例断之） —— 月支' + p.monthZhi + '杂气而财' + (cs['正财'] + cs['偏财']) + '透（渊海子平·论杂气 2615）');
    return hits;
  }
  // ── 小运（星平会海 295/神峰 1435-1441：从时柱起，阳男阴女顺行、阴男阳女逆行，一岁一柱）──
  function xiaoYunList(p, gender) {
    const GAN = '甲乙丙丁戊己庚辛壬癸'.split('');
    const ZHI = '子丑寅卯辰巳午未申酉戌亥'.split('');
    let gi = GAN.indexOf(p.gz.time[0]), zi = ZHI.indexOf(p.gz.time[1]);
    const yangYear = ['甲', '丙', '戊', '庚', '壬'].includes(p.gz.year[0]);
    const forward = (yangYear && gender === 1) || (!yangYear && gender === 0);
    const out = [];
    for (let y = 1; y <= 12; y++) {
      gi = forward ? (gi + 1) % 10 : (gi + 9) % 10;
      zi = forward ? (zi + 1) % 12 : (zi + 11) % 12;
      out.push(y + '岁' + GAN[gi] + ZHI[zi]);
    }
    return out;
  }
  // ── 命理探源·推息法/推变法（284-289：息=日干合处+日支合处；变=时干合处+时支合处；通法袁氏自批毋容拘泥不作机判）──
  function jipanTaiXiBianTong(p, gender) {
    const hits = [];
    const HE_GAN = { '甲': '己', '乙': '庚', '丙': '辛', '丁': '壬', '戊': '癸', '己': '甲', '庚': '乙', '辛': '丙', '壬': '丁', '癸': '戊' };
    const HE_ZHI = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
    const xi = HE_GAN[p.gz.day[0]] + HE_ZHI[p.gz.day[1]];
    const bian = HE_GAN[p.gz.time[0]] + HE_ZHI[p.gz.time[1]];
    hits.push('推息法：日主天干合处' + HE_GAN[p.gz.day[0]] + '、地支合处' + HE_ZHI[p.gz.day[1]] + '，即息为' + xi + '（命理探源 284-286，《星平会海》例：甲子日主→己丑是息）');
    hits.push('推变法：时上天干合处' + HE_GAN[p.gz.time[0]] + '、时下地支合处' + HE_ZHI[p.gz.time[1]] + '，即变为' + bian + '（命理探源 287-289，《星平会海》例：丙寅时→辛亥是变；柱中无合字虚邀亦可）');
    hits.push('推通法/推小运法：原书起通法含五虎遁推算，袁树珊自批"胎息变通四法不过古人言命一说，似可毋容拘泥，录之聊备一格"（293）；小运从时柱起' + (xiaoYunList(p, gender).length ? xiaoYunList(p, gender).slice(0, 3).join('，') : '') + '……（星平会海 295"阳男阴女顺相宜，阴男阳女随逆转"）');
    return hits;
  }
  function jipanXiaoEr(p) {
    const hits = [];
    const cs = tenShenCounts(p);
    const ws = wangShuai(p);
    const strong = ws.verdict === '身旺', weak = ws.verdict === '身弱';
    const cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], yin = cs['正印'] + cs['偏印'];
    const zhis = ['year', 'month', 'day', 'time'].map(k => p.gz[k][1]);
    const gz4 = ['year', 'month', 'day', 'time'].map(k => p.gz[k][0]);
    const wcX = wuxingCount(p);
    // 子平之关：日干七杀透干对应关岁（5507-5510 查表）
    const GUAN = { '甲': ['庚', '九岁'], '丁': ['癸', '六岁'], '戊': ['甲', '三岁'], '丙': ['壬', '一岁'], '壬': ['戊', '五岁'], '癸': ['己', '半岁'] };
    const g = GUAN[p.dayGan];
    if (g && gz4.includes(g[0])) hits.push('子平之关：' + p.dayGan + '日见' + g[0] + '为' + g[1] + '关（三命通会·论小儿 5507-5510；"子平之关只以煞论"）');
    // 易养/难养（5494-5498）
    if (strong && cai > 0 && guan > 0 && (cs['正官'] + cs['七杀']) <= 2) hits.push('日主强、财官旺，有关无煞——易养长寿之命（三命通会 5501；"日主强财官旺，有关无煞"）');
    if (weak && cai <= 1 && guan <= 1) hits.push('日干弱、财官少——常病易养（三命通会 5501-5502）');
    if (weak && (cai >= 2 || guan >= 2)) hits.push('日干弱、财官多，有煞有关——难养（三命通会 5502）');
    if (cs['七杀'] >= 2 && weak) hits.push('煞重身轻——难养促寿之命（三命通会 5496）');
    if (cai >= 2 && weak) hits.push('财多身弱——难养促寿之命（三命通会 5497）');
    if (cs['伤官'] >= 2) hits.push('伤官叠遇——难养促寿之命（三命通会 5497）');
    if (cs['食神'] >= 2) hits.push('食神重逢——难养促寿之命（三命通会 5497）');
    if (strong && cai === 0 && guan === 0 && yin === 0) hits.push('日干旺甚无依——难养促寿之命（三命通会 5497）');
    if (weak && yin === 0) hits.push('日干太柔少印——难养促寿之命（三命通会 5498）');
    // 过房/执拗/疝气/疮疾（5521-5527）
    if (['辰', '戌', '丑', '未'].includes(p.gz.time[1]) && ['辰', '戌', '丑', '未'].filter(z => zhis.includes(z)).length >= 3) hits.push('生时' + p.gz.time[1] + '而四柱墓库多（' + ['辰', '戌', '丑', '未'].filter(z => zhis.includes(z)).join('') + '）——主过房（三命通会 5521）');
    if (['午', '未'].filter(z => zhis.includes(z)).length >= 2) hits.push('带午未多，名执拗煞，主为性执拗（三命通会 5521-5522）');
    if (['子', '亥'].filter(z => zhis.includes(z)).length >= 2) hits.push('带子亥多，主疝气偏坠，是子时者无不应，壬子、丙子尤紧（三命通会 5522-5523）');
    if (zhis.filter(z => ['寅', '申', '巳', '亥'].includes(z)).length >= 2 && wcX['金'] >= 2 && wcX['火'] >= 2) hits.push('四孟月带金火相克，多疮癤惊疾（三命通会 5525-5526）');
    // 重元星（月日时干支错乱重见太岁 → 过房寄生）
    if (['month', 'day', 'time'].filter(k => p.gz[k][1] === p.gz.year[1]).length >= 2) hits.push('月日时重见太岁支' + p.gz.year[1] + '（重元星）——主过房寄生螟蛉之子（三命通会 5532-5533）');
    // 无乳/满盘刃（5533-5534）
    if (cs['食神'] >= 2) hits.push('初生食神重叠——主无乳（三命通会 5533）');
    if (yin >= 2) hits.push('偏印太旺——主无乳（三命通会 5533）');
    if (cs['劫财'] >= 2) hits.push('羊刃犯重（满盘刃）——多养不成，更时带刑害者决死（三命通会 5533-5534，劫刃' + cs['劫财'] + '透）');
    return hits;
  }
  // ── 滴天髓·六亲论断语（任铁樵更定）──
  // 兄弟论（1141，无条件：比肩为兄、败财为弟、禄刃同论；十神组合条件句）
  function jipanXiongDi(p, cs) {
    const hits = [];
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    if (cs['七杀'] >= 2 && shi === 0 && yin === 0 && cs['劫财'] > 0) hits.push('杀旺无食，杀重无印，得败财合杀 —— 必得弟力（滴天髓·兄弟论 1141）');
    if (cs['七杀'] >= 2 && shi <= 1 && yin <= 1 && cs['比肩'] > 0) hits.push('杀旺食轻，印弱逢财，得比肩敌杀 —— 必得兄力（滴天髓·兄弟论 1141）');
    if (yin >= 2) hits.push('日主虽衰，印旺月提 —— 兄弟成群（滴天髓·兄弟论 1141）');
    if (bi >= 2 && cai <= 1 && shi > 0) hits.push('财轻劫重，食伤化劫 —— 可无斗粟尺布之谣（滴天髓·兄弟论 1141）');
    if (cai <= 1 && bi >= 1 && guan > 0) hits.push('财轻遇劫，官得明显 —— 不作煮豆燃萁之咏（滴天髓·兄弟论 1141）');
    if (cs['偏印'] > 0 && bi >= 2 && cai <= 1 && cs['七杀'] > 0) hits.push('枭比重逢，财轻杀伏 —— 未免折翎之悲啼（滴天髓·兄弟论 1141）');
    if (bi >= 3 && cai <= 1 && guan <= 1) hits.push('劫刃太旺，财官无气 —— 兄弟反少，纵有不如无（滴天髓·兄弟论 1141）');
    return hits;
  }
  // 子女论（1083-1098，任氏更定"以食伤为子女"，依赖身强弱 sq：日主旺/弱 × 印食伤财官杀比劫组合）
  function jipanZiNv(p, cs, sq) {
    const hits = [];
    if (!sq) return hits;
    const yin = cs['正印'] + cs['偏印'], shi = cs['食神'] + cs['伤官'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], bi = cs['比肩'] + cs['劫财'];
    const qiang = sq === '身强', ruo = sq === '身弱';
    if (qiang && yin === 0 && shi > 0) hits.push('日主旺，无印绶，有食伤 —— 子必多（滴天髓·子女论 1083）');
    if (qiang && yin >= 2 && shi <= 1) hits.push('日主旺，印绶重，食伤轻 —— 子必少（滴天髓·子女论 1084）');
    if (qiang && yin >= 2 && shi <= 1 && cai > 0) hits.push('日主旺，印绶重，食伤轻，有财星 —— 子多而贤（滴天髓·子女论 1085）');
    if (qiang && yin >= 2 && shi === 0 && cai > 0) hits.push('日主旺，印绶多，无食伤，有财星 —— 子多而能（滴天髓·子女论 1086）');
    if (ruo && yin <= 1 && cai > 0) hits.push('日主弱，印绶轻，有财星 —— 子必无（滴天髓·子女论 1087）');
    if (ruo && shi >= 2 && yin === 0) hits.push('日主弱，食伤重，印绶无 —— 亦无子（滴天髓·子女论 1088）');
    if (ruo && shi <= 1 && bi === 0 && guan > 0) hits.push('日主弱，食伤轻，无比劫，有官星 —— 子必无（滴天髓·子女论 1089）');
    if (ruo && guan >= 2 && yin <= 1 && cai > 0) hits.push('日主弱，官杀重，印绶轻，微伏财 —— 必多女（滴天髓·子女论 1090）');
    if (ruo && cs['七杀'] >= 2 && shi <= 1 && bi > 0) hits.push('日主弱，七杀重，食伤轻，有比劫 —— 女多子少（滴天髓·子女论 1091）');
    if (ruo && guan >= 2 && yin === 0 && bi === 0) hits.push('日主弱，官杀重，无印比 —— 子必无（滴天髓·子女论 1092）');
    if (qiang && shi <= 1 && yin > 0 && cai > 0) hits.push('日主旺，食伤轻，逢印绶，遇财星 —— 子少孙多（滴天髓·子女论 1093）');
    if (qiang && yin >= 2 && guan <= 1 && cai > 0) hits.push('日主旺，印绶重，官杀轻，有财星 —— 子虽克则有孙（滴天髓·子女论 1094）');
    if (qiang && shi >= 2 && yin > 0 && cai > 0) hits.push('日主旺，食伤旺，有印绶，遇财星 —— 虽有若无（滴天髓·子女论 1095）');
    if (ruo && guan >= 2 && yin > 0 && cai > 0) hits.push('日主弱，官杀旺，有印绶，遇财星 —— 有子必逆（滴天髓·子女论 1096）');
    if (qiang && yin === 0 && shi === 0 && guan > 0) hits.push('日主旺，无印绶，食伤伏，有官杀 —— 子必多者（逆局反克相生，滴天髓·子女论 1098）');
    if (qiang && bi >= 2 && yin === 0 && shi === 0) hits.push('日主旺，比劫多，无印绶，食伤伏 —— 子必多者（逆局反克相生，滴天髓·子女论 1098）');
    return hits;
  }
  // 父母论（1125，任氏更定"以财为父以印为母"之批判后，按"年月官印财伤×日主喜忌"条件句，依赖喜用 xi）
  function jipanFuMu(p, cs, xi) {
    const hits = [];
    if (!xi) return hits;
    const gy = p.ssGan.year, gm = p.ssGan.month, gd = p.ssGan.day, gt = p.ssGan.time;
    const isGuan = (s) => s === '正官' || s === '七杀';
    const isYin = (s) => s === '正印' || s === '偏印';
    const isCai = (s) => s === '正财' || s === '偏财';
    const isShang = (s) => s === '伤官';
    const wOf = (k) => WX[p.gz[k][0]];
    const xiGuan = (isGuan(gy) && wOf('year') === xi) || (isGuan(gm) && wOf('month') === xi);
    const xiYin = (isYin(gy) && wOf('year') === xi) || (isYin(gm) && wOf('month') === xi);
    const xiCai = (isCai(gy) && wOf('year') === xi) || (isCai(gm) && wOf('month') === xi);
    const xiBi = gy === '比肩' && wOf('year') === xi;
    const shangRiShi = isShang(gd) || isShang(gt);
    const chongDayTime = (CHONG[p.gz.day[1]] === p.gz.time[1]) || (CHONG[p.gz.time[1]] === p.gz.day[1]);
    if ((isGuan(gy) && isYin(gm)) || (isGuan(gm) && isYin(gy))) {
      hits.push('年月官印相生 —— ' + (shangRiShi || chongDayTime ? '日时刑伤冲犯，破荡祖业，败坏门风' : '日时财伤不犯，上叨荫庇，下受儿荣') + '（滴天髓·父母论 1125）');
      hits.push('年官月印（月官年印）—— 祖上清高（滴天髓·父母论 1125）');
      if (xiGuan) {
        if (isCai(gd) || isCai(gt)) hits.push('年官月印，日主喜官，时日逢财 —— 出身富贵，守成之造（滴天髓·父母论 1125）');
        if (shangRiShi) hits.push('日主喜官，时日逢伤 —— 必败祖辱宗（滴天髓·父母论 1125）');
      }
    }
    if (xiYin) {
      if (shangRiShi || isCai(gd) || isCai(gt)) hits.push('日主喜印，时日逢财 —— 必败祖辱宗（滴天髓·父母论 1125）');
      if ((gy === '正财' || gy === '偏财') && isYin(gm) && (isGuan(gd) || isGuan(gt) || isYin(gd) || isYin(gt))) hits.push('年财月印，日主喜印，时日逢官印者 —— 知其帮父兴家（滴天髓·父母论 1125）');
      if (gy === '伤官' && isYin(gm) && (isGuan(gd) || isGuan(gt))) hits.push('年伤月印，日主喜印，时日逢官者 —— 知其父母创业之命（滴天髓·父母论 1125）');
      if ((gy === '正印' || gy === '偏印') && (gm === '正财' || gm === '偏财')) {
        if (isGuan(gt)) hits.push('年印月财，日主喜印，时上遇官者 —— 知其父母破败（滴天髓·父母论 1125）');
        if (isYin(gd) || isYin(gt)) hits.push('年印月财，日主喜印，时日逢印者 —— 知其自创成家（滴天髓·父母论 1125）');
      }
    }
    if (xiCai) {
      if (gy === '伤官' && gm === '劫财' && (isCai(gd) || isCai(gt) || shangRiShi)) hits.push('年伤月劫，日主喜财，时日逢财或伤者 —— 出身寒窘，创业之命（滴天髓·父母论 1125）');
      if (gy === '劫财' && (gm === '正财' || gm === '偏财')) hits.push('年劫月财，日主喜财 —— 遗绪丰勇（滴天髓·父母论 1125）');
      if ((gy === '正官' || gy === '七杀') && gm === '伤官') {
        if (isGuan(gd) || isGuan(gt)) hits.push('年官月伤，日主喜官，时日适官 —— 必跨灶（滴天髓·父母论 1125）');
        if (gd === '劫财' || gt === '劫财') hits.push('年官月伤，日主喜官，时日遇劫 —— 必破败（滴天髓·父母论 1125）');
      }
    }
    if (xiBi && gy === '劫财' && (gm === '正财' || gm === '偏财')) hits.push('年劫月财，日主喜劫 —— 清高贫寒（滴天髓·父母论 1125）');
    if (['year', 'month'].some(k => isGuan(p.ssGan[k]) || isYin(p.ssGan[k]) || isCai(p.ssGan[k]))) {
      hits.push('财官印绶在于年月，为日主之' + (xiGuan || xiYin || xiCai ? '喜' : '忌') + ' —— 为喜父母不贵亦富；为忌不贫亦贱（滴天髓·父母论 1125）');
    }
    return hits;
  }
  // ── 神峰通考·歌诀群条件机判（运晦/刑克/刑妻/克子/带疾/寿元/飘荡/女命/看命捷歌/五阴歌/月建歌/取格指诀——无条件枚举）──
  // 排除说明：十段锦/十段化气/从化定诀依赖化格成立（化格属活层未判，套断语即编造）；岁运类句依赖大运流年；节气歌断依赖节气深浅——均不入此卡。
  // 纳音取象表（三命通会·释六十甲子性质吉凶 183-281，象名/喜/神煞名目照原文抄录）
  const NAYIN = {
    '甲子': ['金', '为宝物', '喜金木旺地', '进神/福星/平头/悬针/破字'], '乙丑': ['金', '为顽矿', '喜火及南方日时', '福星/华盖/正印'],
    '丙寅': ['火', '为炉炭', '喜冬及木', '福星/禄刑/平头/聋哑'], '丁卯': ['火', '为炉烟', '喜巽地及秋冬', '平头/截路/悬针'],
    '戊辰': ['木', '山林山野处不材之木', '喜水', '禄库/华盖/水禄马库/棒杖/伏神/平头'], '己巳': ['木', '山头花草', '喜春及秋', '禄库/八吉/阙字/曲脚'],
    '庚午': ['土', '路旁干土', '喜水及春', '福星/官贵/截路/棒杖/悬针'], '辛未': ['土', '含万宝待秋成', '喜秋及火', '华盖/悬针/破字'],
    '壬申': ['金', '戈戟', '大喜子午卯酉', '平头/大败/妨害/聋哑/破字/悬针'], '癸酉': ['金', '金之椎凿', '喜木及寅卯', '伏神/破字/聋哑'],
    '甲戌': ['火', '火所宿处', '喜春及夏', '正印/华盖/平头/悬针/破字/棒杖'], '乙亥': ['火', '火之热气', '喜土及夏', '天德/曲脚'],
    '丙子': ['水', '江湖', '喜木及土', '福星/官贵/平头/聋哑/交神/飞刃'], '丁丑': ['水', '水之不流清澈处', '喜金及夏', '华盖/进神/平头/飞刃/阙字'],
    '戊寅': ['土', '堤阜城郭', '喜木及火', '伏神/棒杖/聋哑'], '己卯': ['土', '破堤败城', '喜申酉及火', '进神/短夭/九丑/阙字/曲脚/悬针'],
    '庚辰': ['金', '锡蜡', '喜秋及微木', '华盖/大败/棒杖/平头'], '辛巳': ['金', '金之幽者杂沙石', '喜火及秋', '天德/福星/官贵/截路/大败/悬针/曲脚'],
    '壬午': ['木', '杨柳干节', '喜春夏', '官贵/九丑/飞刃/平头/聋哑/悬针'], '癸未': ['木', '杨柳根', '喜冬及水亦宜春', '正印/华盖/短夭/伏神/飞刃/破字'],
    '甲申': ['水', '甘井', '喜春及夏', '破禄马/截路/平头/破字/悬针'], '乙酉': ['水', '阴壑水', '喜东方及南', '破禄/短夭/九丑/曲脚/破字/聋哑'],
    '丙戌': ['土', '堆阜', '喜春夏及水', '天德/华盖/平头/聋哑'], '丁亥': ['土', '平原', '喜火及木', '天乙/福星/官贵/德合/平头'],
    '戊子': ['火', '雷也', '喜水及春夏得土而神天', '伏神/短夭/九丑/杖刑/飞刃'], '己丑': ['火', '电也', '喜水及春夏得地而晦', '华盖/大败/飞刃/曲脚/阙字'],
    '庚寅': ['木', '松柏干节', '喜秋冬', '破禄马/相刑/杖刑/聋哑'], '辛卯': ['木', '松柏之根', '喜水土及宜春', '破禄/交神/九丑/悬针'],
    '壬辰': ['水', '龙水', '喜雷电及春夏', '正印/天德/水禄马库/退神/平头/聋哑'], '癸巳': ['水', '水之不息流入海', '喜亥子乃变化', '天乙/官贵/德合/伏马/破字/曲脚'],
    '甲午': ['金', '百炼精金', '喜水木土', '进神/德合/平头/破字/悬针'], '乙未': ['金', '炉炭余金', '喜大火及土', '华盖/截路/曲脚/破字'],
    '丙申': ['火', '白茅野烧', '喜秋冬及木', '平头/聋哑/大败/破字/悬针'], '丁酉': ['火', '鬼神之灵响火无形者', '喜辰戌丑未', '天乙/喜神/平头/破字/聋哑/大败'],
    '戊戌': ['木', '蒿艾之枯者', '喜火及春夏', '华盖/大败/八专/杖刑/截路'], '己亥': ['木', '蒿艾之茅', '喜水及春夏', '阙字/曲脚'],
    '庚子': ['土', '土中空者屋宇也', '喜木及金', '木德合/杖刑'], '辛丑': ['土', '坟墓', '喜木及火与春', '华盖/悬针/阙字'],
    '壬寅': ['金', '金之华饰者', '喜木及微火', '截路/平头/聋哑'], '癸卯': ['金', '环钮钤铎', '喜盛火及秋', '贵人/破字/悬针'],
    '甲辰': ['火', '灯也', '喜夜及水恶昼', '华盖/大败/平头/破字/悬针'], '乙巳': ['火', '灯光也', '同上尤喜申酉及秋', '正禄马/大败/曲脚/阙字'],
    '丙午': ['火', '月轮', '喜夜及秋水旺也', '喜神/羊刃/交神/平头/聋哑/悬针'], '丁未': ['水', '火光也', '同上', '华盖/羊刃/退神/八专/平头/破字'],
    '戊申': ['土', '秋间田地', '喜申酉及火', '福星/伏马/杖刑/破字/悬针'], '己酉': ['土', '秋间禾稼', '喜申酉及冬', '退神/截路/九丑/阙字/曲脚/破字/聋哑'],
    '庚戌': ['金', '刃剑之余', '喜微火及木', '华盖/杖刑'], '辛亥': ['金', '钟鼎实物', '喜木火及土', '正禄马/悬针'],
    '壬子': ['木', '伤水多之木', '喜火土及夏', '羊刃/九丑/平头/聋哑'], '癸丑': ['木', '伤水少之木', '喜金水及秋', '华盖/福星/八专/破字/阙字/羊刃'],
    '甲寅': ['水', '雨也', '喜夏及火', '正禄马/福神/八专/平头/破字/悬针/聋哑'], '乙卯': ['水', '露也', '喜水及火', '建禄/喜神/八专/九刃/曲脚/悬针'],
    '丙辰': ['土', '堤岸', '喜金及木', '禄库/正印/华盖/截路/平头/聋哑'], '丁巳': ['土', '土之沮', '喜火及西北', '禄库/平头/阙字/曲脚'],
    '戊午': ['火', '日轮', '夏则人畏冬则人爱忌戊子己丑甲寅乙卯', '伏神/羊刃/九丑/棒杖/悬针'], '己未': ['火', '日光', '忌夜亦畏四者', '福星/华盖/羊刃/阙字/曲脚/破字'],
    '庚申': ['木', '榴花', '喜夏不宜秋冬', '建禄马/八专/杖刑/破字/悬针'], '辛酉': ['木', '榴子', '喜秋及夏', '建禄/交神/九丑/八专/悬针/聋哑'],
    '壬戌': ['水', '海也', '喜春夏及木', '华盖/退神/平头/聋哑/杖刑'], '癸亥': ['水', '百川', '喜金土火', '伏马/大败/破字/截路']
  };
  function jipanNaYin(p) {
    const hits = [];
    const names = { 'year': '年柱', 'month': '月柱', 'day': '日柱', 'time': '时柱' };
    for (const k of ['year', 'month', 'day', 'time']) {
      const n = NAYIN[p.gz[k]];
      if (!n) continue;
      hits.push(names[k] + p.gz[k] + '：纳音' + n[0] + '，' + n[1] + '，' + n[2] + '；名目：' + n[3]);
    }
    return hits;
  }
  function jipanShenFeng(p, cs, gender) {
    const hits = [];
    const G = (k) => p.gz[k][0], Z = (k) => p.gz[k][1];
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    const wc = wuxingCount(p);
    const zhis = ['year', 'month', 'day', 'time'].map(Z);
    const yr = YANG_REN[p.dayGan];
    const HELIU = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
    const sanHe = [['寅', '午', '戌'], ['申', '子', '辰'], ['巳', '酉', '丑'], ['亥', '卯', '未']].some(t => t.every(z => zhis.includes(z)));
    const pureYang = ['year', 'month', 'day', 'time'].every(k => ['甲', '丙', '戊', '庚', '壬'].includes(G(k)));
    // 运晦歌
    if (cs['比肩'] > 0) hits.push('比肩事物莫争论，闻讼官司为别人 —— 比肩透，行运防口舌争讼（神峰通考·运晦歌）');
    if (cs['劫财'] > 0 && yr && (Z('year') === yr || Z('time') === yr)) hits.push('劫财羊刃两头居，外面光华内本虚 —— 劫财透而' + yr + '刃居年/时（神峰通考·运晦歌）');
    // 刑克歌
    if (cs['比肩'] > 0 || (yr && (Z('day') === yr || Z('time') === yr))) hits.push('比肩羊刃日时逢，若问年龄父道凶 —— ' + (cs['比肩'] > 0 ? '比肩透' : '') + (yr && (Z('day') === yr || Z('time') === yr) ? (cs['比肩'] > 0 ? '且' : '') + yr + '刃在日/时' : '') + '（神峰通考·刑克歌）');
    if (['year', 'month'].some(k => p.ssGan[k] === '正财' || p.ssGan[k] === '偏财') && ['year', 'month'].some(k => p.ssGan[k] === '正印' || p.ssGan[k] === '偏印')) hits.push('父母干支相会合，旺星健旺寿如松 —— 年/月财印并见，父母星有气（神峰通考·刑克歌）');
    // 刑妻歌
    if (bi >= 3 && cai <= 1) hits.push('天干透出弟兄多，财绝官衰旺太过 —— 比劫≥3而财≤1，刑妻之象（神峰通考·刑妻歌）');
    if (cai > 0 && yr && Z('time') === yr) hits.push('当生四柱有财星，羊刃时逢定克刑 —— 有财星而' + yr + '刃在时（神峰通考·刑妻歌）');
    // 克子歌
    if (cs['伤官'] > 0) hits.push('五行四柱有伤官，子息初年必不安 —— 伤官透（神峰通考·克子歌）');
    if (yin >= 2) hits.push('印绶重叠克子断，子息难存谁为伴 —— 印绶≥2透（神峰通考·克子歌）');
    if (p.ssGan.time === '七杀') hits.push('时逢七杀本无儿，此理人当仔细推 —— 时干七杀（神峰通考·克子歌）');
    if (cs['食神'] > 0 && zhis.some(z1 => zhis.some(z2 => z2 !== z1 && HELIU[z1] === z2))) hits.push('干上食神支又合，儿孙定是贵而奇 —— 食神透而地支有六合（神峰通考·克子歌）');
    if (gender === 0 && ['month', 'time'].some(k => p.ssGan[k] === '正印' || p.ssGan[k] === '偏印')) hits.push('女人印绶月时逢，官食遭伤子息空 —— 女命印绶居月/时（神峰通考·克子歌）');
    if (gender === 0 && cs['正官'] > 0 && cs['七杀'] > 0 && (pureYang || cs['偏印'] > 0)) hits.push('官杀混杂' + (pureYang ? '且八字纯阳' : '') + (cs['偏印'] > 0 ? '且偏印重' : '') + ' —— 妨夫叠叠更妨儿（神峰通考·克子歌）');
    // 带疾歌
    if ((p.dayGan === '戊' || p.dayGan === '己') && ['month', 'time'].some(k => p.ssGan[k] === '伤官')) hits.push('戊己生时气不全，月时两处见伤官 —— 必当头面有亏损，脓血之疮苦少年（神峰通考·带疾歌）');
    if ((p.dayGan === '戊' || p.dayGan === '己') && wc['火'] >= 3) hits.push('日主' + p.dayGan + '，支神火局气薰蒸 —— 冲刑克破当残疾，发秃那堪眼不明（神峰通考·带疾歌）');
    if ((p.dayGan === '丙' || p.dayGan === '丁') && cs['七杀'] > 0 && sanHe) hits.push('丙丁日主五行衰，七杀加临三合来 —— 耳聋残疾面尘埃（神峰通考·带疾歌）');
    if ((p.dayGan === '丙' || p.dayGan === '丁') && wc['火'] >= 3 && (zhis.includes('辰') || zhis.includes('巳'))) hits.push('丙丁火旺疾难防，四柱休囚辰巳方 —— 哑中风疾暗中亡（神峰通考·带疾歌）');
    // 寿元歌
    if (p.dayGan === '丙' && Z('day') === '申' && guan > 0) hits.push('丙临申位逢阳水，定见天年夭可知 —— 丙日坐申，干头透壬癸，寿元之警示（神峰通考·寿元歌）');
    // 飘荡歌
    if (cs['偏财'] > 0) hits.push('偏财得位发他乡，慷慨风流性要刚 —— 偏财透' + (yr && zhis.includes(yr) ? '，透出羊刃甚可伤，破荡家庭' : '') + '（神峰通考·飘荡歌）');
    if (cs['偏财'] >= 2) hits.push('偏财别立在他乡，宠妾防妻更足伤 —— 偏财≥2透（神峰通考·飘荡歌）');
    // 女命歌
    if (gender === 0 && cai > 0 && guan > 0 && yin > 0) hits.push('财官印绶三般物，女命逢之必旺夫 —— 女命财官印全透（神峰通考·女命歌）');
    if (gender === 0 && cs['伤官'] > 0) hits.push('女命伤官福不真，' + ((cai + yin) > 0 ? '带财带印福方坚' : '无财无印受孤贫') + ' —— 局中伤官透（神峰通考·女命歌）');
    if (gender === 0 && guan >= 2) hits.push('官杀犯重成下格 —— 女命官杀≥2（神峰通考·女命歌）');
    if (gender === 0 && cs['食神'] >= 2) hits.push('食神多者，非尼即妓 —— 女命食神≥2（神峰通考·女命歌）');
    // 看命捷歌（六亲星坐死绝：财死虑丧妻/官死宜克子/印死父母亡/比死伤兄弟）
    for (const s of ['正财', '偏财', '正官', '七杀', '正印', '偏印', '比肩', '劫财']) {
      const k = ['year', 'month', 'day', 'time'].find(kk => p.ssGan[kk] === s);
      if (!k) continue;
      const d = shiDiName(p.gz[k][0], Z(k));
      if (d === '死' || d === '绝') {
        const t = { '正财': '财死虑丧妻', '偏财': '财死虑丧妻', '正官': '官死宜克子', '七杀': '官死宜克子', '正印': '印死父母亡', '偏印': '印死父母亡', '比肩': '比死伤兄弟', '劫财': '比死伤兄弟' }[s];
        hits.push(t + ' —— ' + s + '（' + p.gz[k][0] + '）坐' + Z(k) + '为' + d + '地（神峰通考·看命捷歌）');
      }
    }
    // 取格指诀
    if (guan > 0) hits.push('逢官看财 —— 官星为用，看财星生官（神峰通考·取格指诀）');
    if (cai > 0) hits.push('逢财看杀 —— 财星为用，看杀星护财（神峰通考·取格指诀）');
    if (cs['七杀'] > 0) hits.push('逢杀看印 —— 七杀为用，看印绶化杀（神峰通考·取格指诀）');
    if (yin > 0) hits.push('逢印看官 —— 印绶为用，看官星生印（神峰通考·取格指诀）');
    // 五阴歌
    if (['己巳', '己酉', '己丑'].includes(p.gz.day)) hits.push('己巳己酉并己丑，福德秀气真希有 —— 日柱' + p.gz.day + '（神峰通考·五阴歌）');
    if (p.dayGan === '乙' && (zhis.includes('丑') || zhis.includes('巳')) && Z('month') === '酉') hits.push('阴木相逢牛与蛇，生居八月暗咨嗟 —— 乙日丑/巳支酉月（神峰通考·五阴歌）');
    if (p.dayGan === '丁' && ['巳', '酉', '丑'].filter(z => zhis.includes(z)).length >= 2) hits.push('阴火相连巳酉丑，生居木日寿难长 —— 丁日巳酉丑≥2（神峰通考·五阴歌）');
    if (p.dayGan === '癸' && (zhis.includes('酉') || zhis.includes('丑'))) hits.push('癸临酉丑月临风，百事迟延作者空 —— 癸日酉/丑支（神峰通考·五阴歌）');
    // 月建歌（仅无条件句：日干+月支即可判）
    if ((p.dayGan === '庚' || p.dayGan === '辛') && Z('month') === '寅' && (zhis.includes('午') || zhis.includes('戌'))) hits.push('庚辛主弱逢寅月，午戌加临会杀星 —— 庚辛日寅月午戌见（神峰通考·月建生克）');
    if ((p.dayGan === '丙' || p.dayGan === '丁') && Z('month') === '卯' && (guan > 0 || zhis.includes('酉') || zhis.includes('丑'))) hits.push('丙丁二月身逢印，大怕庚辛酉丑伤 —— 丙丁日卯月见官杀/酉丑（神峰通考·月建生克）');
    if ((p.dayGan === '甲' || p.dayGan === '乙') && Z('month') === '巳') hits.push('甲乙如临巳月，木乡水旺振财源 —— 甲乙日巳月（神峰通考·月建生克）');
    if ((p.dayGan === '丙' || p.dayGan === '丁') && Z('month') === '丑') hits.push('丙丁坐丑财中杀，四柱无根忌水乡 —— 丙丁日丑月（神峰通考·月建生克）');
    if ((p.dayGan === '壬' || p.dayGan === '癸') && Z('month') === '丑' && (yin > 0 || cs['正官'] > 0)) hits.push('壬癸生居丑月提，有金有土格中奇 —— 壬癸日丑月见印/官（神峰通考·月建生克）');
    if (p.dayGan === '戊' && Z('month') === '丑') hits.push('戊土生居十二月，伤官财旺藏时节 —— 戊日丑月（神峰通考·月建生克）');
    return hits;
  }

  // ── 千里命稿·韦千里 教材体机判（2026-10-26 入库）──
  // 数据：window.__qlmgData（renderer/qlmg_data.js，条目均照录原文条件句）
  // 死活标注：取格四法/八格用神+善运恶运/女命27条/富贵贫贱/月建时令→死（机判）；
  //           六神利弊喜忌→半规则（身强弱+原局他神有无，可机判，属教材条件命中）；
  //           流年干支12法/流年看法/月建看法→选项法（需喜用神选择）。
  function nvMingQuYong(p, cs) {
    const QL = window.__qlmgData || {};
    const strong = p._ws.verdict === '身旺';
    const weak = p._ws.verdict === '身弱';
    const c = { shi: cs['食神'] + cs['伤官'], guan: cs['正官'] + cs['七杀'], cai: cs['正财'] + cs['偏财'], yin: cs['正印'] + cs['偏印'], bi: cs['比肩'] + cs['劫财'] };
    const kinds = { shi: '伤食多', guan: '官杀多', cai: '财多', yin: '印多', bi: '比劫多' };
    const entries = Object.keys(kinds).map(k => ({ k, v: c[k] })).sort((a, b) => b.v - a.v);
    const main = entries.find(e => e.v >= 2);
    if (!main) return '';
    const has = (kk) => c[kk] > 0;
    const K = { '财': 'cai', '印': 'yin', '伤食': 'shi', '官杀': 'guan', '比劫': 'bi' };
    for (let i = 0; i < (QL.nvMing || []).length; i++) {
      const r = QL.nvMing[i];
      if (r.qiang && !strong) continue;
      if (r.weak && !weak) continue;
      if (r.zhu !== kinds[main.k]) continue;
      let ok = true;
      if (r.you) ok = has(K[r.you]);
      if (ok && r.wu) for (const w of r.wu) if (has(K[w])) { ok = false; break; }
      if (ok) return '第' + (i + 1) + '条：日主' + (strong ? '强' : '弱') + '，' + r.zhu + (r.you ? '，有' + r.you : '，无' + (r.wu || []).join('、无')) + '，取' + r.yong + '为用——' + r.jie;
    }
    return '';
  }

  function qlmgModule(p, cs, gender, sh, xiOpt, gj, dy) {
    const QL = window.__qlmgData || {};
    const hits = [];
    const opt = [];
    const ws = p._ws;
    const strong = ws.verdict === '身旺';
    const weak = ws.verdict === '身弱';
    const bi = cs['比肩'] + cs['劫财'], cai = cs['正财'] + cs['偏财'], guan = cs['正官'] + cs['七杀'], shi = cs['食神'] + cs['伤官'], yin = cs['正印'] + cs['偏印'];
    const condOk = (cond) => {
      if (!cond) return true;
      if (typeof cond === 'string') { if (cond === 'strong') return strong; if (cond === 'weak') return weak; return false; }
      for (const k in cond) {
        const v = cond[k];
        if (k === 'strong' && !strong) return false;
        if (k === 'weak' && !weak) return false;
        if (k === 'bi' && (v === 0 ? bi !== 0 : bi < v)) return false;
        if (k === 'cai' && (v === 0 ? cai !== 0 : cai < v)) return false;
        if (k === 'guan' && (v === 0 ? guan !== 0 : guan < v)) return false;
        if (k === 'shi' && (v === 0 ? shi !== 0 : shi < v)) return false;
        if (k === 'yin' && (v === 0 ? yin !== 0 : yin < v)) return false;
        if (k === 'gz' && (v === 0 ? cs['正官'] !== 0 : cs['正官'] < v)) return false;
        if (k === 'qs' && (v === 0 ? cs['七杀'] !== 0 : cs['七杀'] < v)) return false;
        if (k === 'even') { const vs = Object.values(wuxingCount(p)); if (Math.max.apply(null, vs) - Math.min.apply(null, vs) > 2) return false; }
        if (k === 'noChong') { const zs = ['year', 'month', 'day', 'time'].map(x => p.gz[x][1]); const gs = ['year', 'month', 'day', 'time'].map(x => p.gz[x][0]); for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { if (CHONG[zs[i]] === zs[j]) return false; if (gs[i] !== gs[j] && (KE[WX[gs[i]]] === WX[gs[j]] || KE[WX[gs[j]]] === WX[gs[i]])) return false; } }
        if (k === 'monthNoChong') { const mz = p.monthZhi; if (['year', 'day', 'time'].some(x => CHONG[p.gz[x][1]] === mz)) return false; }
        if (k === 'wxC') { const wc2 = wuxingCount(p); for (const wx in cond.wxC) if ((wc2[wx] || 0) < cond.wxC[wx]) return false; }
      }
      return true;
    };
    const wxName = { '比': '比劫', '印': '印星', '财': '财星', '官': '官星', '杀': '七杀', '伤': '伤官', '食': '食神' };
    const fmtWx = (arr) => Array.from(new Set(arr)).map(w => wxName[w] || w + '星').join('、');
    // 1) 千里命稿取格（详例四法）
    {
      const mz = p.monthZhi;
      const cg = (D && D.zanggan && D.zanggan[mz]) || [];
      const benqi = cg[0] || '';
      const gans = [p.gz.year[0], p.gz.month[0], p.gz.time[0]];
      if (LU[p.dayGan] === mz) hits.push('【千里命稿取格】月支' + mz + '为' + p.dayGan + '之禄，非在八格之内，详于外格篇（千里命稿·取法：比劫不能取格，禄刃非在八格之内）');
      else if (YANG_REN[p.dayGan] === mz) hits.push('【千里命稿取格】月支' + mz + '为' + p.dayGan + '之阳刃，非在八格之内，详于外格篇（千里命稿·取法）');
      else {
        const benSs = shiShenOf(p.dayGan, benqi);
        if (benSs === '劫财') hits.push('【千里命稿取格】月支' + mz + '本气' + benqi + '（劫财），非在八格之内，详于外格篇（千里命稿·取法：比劫不能取格）');
        else if (gans.includes(benqi)) hits.push('【千里命稿取格】' + p.dayGan + '生' + mz + '月，月支本气' + benqi + '透于干上，取' + benSs + '格（千里命稿·取法一：月支本气透于天干，应先取以为格）');
        else {
          const cands = cg.map(c => ({ gan: c, ss: shiShenOf(p.dayGan, c) })).filter(x => x.ss !== '比肩' && x.ss !== '劫财');
          const tou = cands.filter(x => gans.includes(x.gan));
          if (tou.length) {
            const pick = tou.find(x => x.gan === p.gz.month[0]) || tou[0];
            hits.push('【千里命稿取格】' + p.dayGan + '生' + mz + '月，本气' + benqi + '未透，透' + pick.gan + '（' + pick.ss + '），取' + pick.ss + '格（千里命稿·取法二：干上未透月支本气，而透月支所藏之神，即以该神取为格）');
          } else {
            hits.push('【千里命稿取格】' + p.dayGan + '生' + mz + '月，月支所藏' + cg.join('') + '皆不透干，酌取本气' + benqi + '为' + benSs + '格（千里命稿·取法三：以月内人元轻重较量，择一有力而无克合者为格）');
          }
        }
      }
    }
    // 2) 八格用神 + 善运恶运分析表（千里命稿·格局篇1570-1611/运限篇1822-1855）
    const geKey = { '正财': '财', '偏财': '财', '正印': '印', '偏印': '印', '正官': '正官', '七杀': '七杀', '食神': '食神', '伤官': '伤官' }[gj.ge];
    if (geKey) {
      let n = 0;
      for (const r of QL.yongShanE || []) {
        if (r.ge !== geKey) continue;
        if (!condOk(r)) continue;
        n++;
        const condTxt = [r.weak && '日干弱', r.strong && '日干强', r.cai && '财星重', r.shi && '伤食多', r.guan && '官杀重', r.yin && '印多', r.bi && '比劫多'].filter(Boolean).join('，');
        hits.push('【八格用神·善运恶运·' + gj.ge + '格】' + condTxt + '，取' + r.yong + '为用；逢' + fmtWx(r.shan) + '之运为善，' + fmtWx(r.e) + '之运为恶（千里命稿·八格用神/善运恶运分析表，' + (n > 1 ? '多分支并中' : '') + '）');
      }
      if (!n) hits.push('【八格用神】本局' + gj.ge + '格未命中千里命稿八格用神原文条件（' + (strong ? '日干强' : weak ? '日干弱' : '日主中和') + '，财' + cai + '伤' + shi + '官' + guan + '印' + yin + '比' + bi + '）——如实不编造。');
    }
    // 3) 建禄/月刃善运恶运（千里命稿 1870-1882）
    if (gj.ge === '建禄' || gj.ge === '阳刃' || gj.ge === '月劫') {
      const kind = gj.ge === '建禄' ? '建禄' : '月刃';
      let n = 0;
      for (const r of QL.jianLuYueRen || []) {
        if (r.kind !== kind) continue;
        if (!condOk(r)) continue;
        n++;
        const sy = (r.shan && r.shan.length) ? '；逢' + fmtWx(r.shan) + '之运为善，' + fmtWx(r.e) + '之运为恶' : (r.note ? '；' + r.note : '');
        hits.push('【' + kind + '格善运恶运】' + r.cond + '，取' + r.yong + '为用' + sy + '（千里命稿·运限篇' + kind + '节）');
      }
      if (!n) hits.push('【' + kind + '格善运恶运】本局未命中千里命稿' + kind + '善运恶运原文条件（财' + cai + '官' + guan + '伤' + shi + '印' + yin + '比' + bi + '）——如实不编造。');
    }
    // 3b) 外格善运恶运（千里命稿 1856-1869，匹配 detectWaiGe 成格）
    {
      const wgNames = (sh && sh.length ? [] : []).concat([]);
      for (const w of (detectWaiGe(p) || [])) {
        const nm = w.name || '';
        const row = (QL.waiGeShanE || []).find(r => nm.indexOf(r.ge) >= 0 && (['曲直', '炎上', '稼穑', '从革', '润下'].indexOf(r.ge) >= 0 || nm.indexOf(r.ge) >= 0));
        if (row) hits.push('【外格善运恶运·' + nm + '】' + (nm.indexOf('从财') >= 0 ? '从财格' : nm.indexOf('从杀') >= 0 ? '从杀格' : nm.indexOf('化') >= 0 ? '化气格' : nm) + '，逢' + fmtWx(row.shan) + '之运为善，' + fmtWx(row.e) + '之运为恶（千里命稿·运限篇外格节）');
      }
    }
    // 4) 六神利弊喜忌（千里命稿·六神篇 995-1284；条件：该神透出 + 身强弱/原局他神）
    {
      for (const g of QL.liuShen || []) {
        if ((cs[g.ss] || 0) <= 0) continue;
        const parts = [];
        if (condOk(g.liCond)) parts.push('利·' + g.cap + '：' + g.li);
        if (condOk(g.biCond)) parts.push('弊·' + g.cap + '：' + g.bi);
        if (condOk(g.xiCond)) parts.push('喜：' + g.xi);
        if (g.xi2 && condOk(g.xi2Cond)) parts.push('喜：' + g.xi2);
        if (condOk(g.jiCond)) parts.push('忌：' + g.ji);
        if (g.ji2 && condOk(g.ji2Cond)) parts.push('忌：' + g.ji2);
        if (parts.length) hits.push('【六神·' + g.ss + '（' + g.cap + '）】' + parts.join('；') + '（千里命稿·六神篇，' + ws.verdict + '，' + g.ss + '透出' + cs[g.ss] + '）');
      }
    }
    // 5) 女命取用大法 27 条（千里命稿·女命篇 2162-2188）
    if (gender === 0) {
      const nv = nvMingQuYong(p, cs);
      if (nv) hits.push('【女命取用大法】' + nv + '（千里命稿·女命篇，' + ws.verdict + '；27条原文穷举，主类按透干计数≥2且为该局最大）');
    }
    // 6) 富贵吉寿（千里命稿 2218-2278）
    {
      const fg = [];
      for (const r of QL.fuGui || []) if (condOk(r.cond)) fg.push(r.text);
      if (fg.length) hits.push('【富贵吉寿·机判命中】' + fg.join('；') + '（千里命稿·富贵吉寿篇；"重/多/旺/当令"为原文定性，机判阈值：透干计数≥2，强弱取旺衰判定——近似提示）');
    }
    // 7) 贫贱凶夭（千里命稿 2280-2344）
    {
      const pj = [];
      for (const r of QL.pinJian || []) if (condOk(r.cond)) pj.push(r.kind + '：' + r.text);
      if (pj.length) hits.push('【贫贱凶夭·机判命中】' + pj.join('；') + '（千里命稿·贫贱凶夭篇；未命中不输出——机判为条件命中提示，非定论）');
    }
    // 8) 月建时令（千里命稿·月建篇 2009-2013，无条件）
    {
      const season = (QL.yuejianSeason || []).find(s => s.months.includes(p.monthZhi));
      if (season) {
        const lines = Object.keys(season.lines).map(wx => wx + '：' + season.lines[wx]).join('；');
        hits.push('【月建时令·' + season.season + '】' + p.monthZhi + '月（' + p.monthGan + '月建），' + lines + '（千里命稿·月建篇）');
      }
    }
    // 8b) 六亲更定（千里命稿 2015-2027，韦氏更定口径——与旧籍不同）
    {
      const defs = (QL.liuQin || []).map(r => r.k + '=' + r.v).join('、');
      const pos = (QL.liuQinWei || []).map(r => r.k + '=' + r.v).join('、');
      if (defs) hits.push('【六亲（韦千里更定口径）】' + defs + '；官位：' + pos + '（千里命稿·六亲篇 2015-2027——更定：父=印、夫=官杀、妻=财、兄弟=比劫、子=伤食，与旧籍不同）');
    }
    // 9) 选项法：流年干支12法 / 流年看法 / 月建看法（需选喜用神，千里命稿·流年篇1955-1985/月建篇1988-2004）
    if (!xiOpt.xi) {
      opt.push('流年干支 12 法：' + (QL.liunian12 || []).join('；') + '（千里命稿·流年篇）——需先选「喜用神五行」后逐流年判定（选项法）');
      opt.push('流年看法/月建看法：' + (QL.liunianKanFa || []).slice(0, 2).join('；') + '（千里命稿·流年篇/月建篇）——同上，需选喜用神');
      opt.push('运之善恶总论：' + (QL.yunZongLun || []).join('；') + '（千里命稿·运限篇）——同上');
      opt.push('富贵吉寿·依赖用神（不机判）：为用神而不遭克破，财助用神而有力；官为用神而遭克破，官助用神而有力（千里命稿·富贵吉寿篇原文）——需先定用神，属活层，不做选项法自动判定');
      opt.push('贫贱凶夭·依赖用神/合冲（不机判）：财为忌神；用财而被冲破；喜财而财神被合（千里命稿·贫贱凶夭篇原文）——需先定用神并查合冲，属活层，不做选项法自动判定');
    } else {
      const xi = xiOpt.xi;
      const li = (wx) => wx === xi || SHENG[wx] === xi;
      const ke = (wx) => KE[wx] === xi;
      const wxFmt = { '木': '木', '火': '火', '土': '土', '金': '金', '水': '水' }[xi] || xi;
      // 收集全部流年并逐条判定（用第一个大运列表）
      const cnt = { '大吉': 0, '大凶': 0, '吉凶参半': 0, '吉凶互见': 0, '吉力减轻': 0, '凶力减轻': 0 };
      const ex = [];
      for (const d of ((dy && dy.list) || [])) for (const ln of d.lns) {
        const gz = ln.gz, g = gz[0], z = gz[1];
        const gL = li(WX[g]), zL = li(WX[z]);
        let tag;
        if (gL && zL) tag = '大吉';
        else if (!gL && !zL) tag = '大凶';
        else if (gL && ke(WX[z])) tag = '吉力减轻';
        else if (!gL && ke(WX[g])) tag = '凶力减轻';
        else if (gL) tag = '吉凶参半';
        else tag = '吉凶互见';
        cnt[tag] = (cnt[tag] || 0) + 1;
        if (ex.length < 6) ex.push(ln.year + '年 ' + gz + '：' + tag);
      }
      opt.push('喜用神=' + wxFmt + '：全盘流年判定——' + Object.keys(cnt).map(k => k + ' ' + cnt[k] + '年').join('，') + '；示例：' + ex.join('，') + '（千里命稿·流年干支12法：干支皆利大吉/皆不利大凶/干利支不利参半/干不利支利互见/克挫则减轻）');
    }
    return { hits, opt };
  }

  function buildOut(p, gender, liupai, focus, xiOpt) {
    const ws = wangShuai(p);
    p._ws = ws;
    const sh = shenSha(p, gender);
    const gj = geJu(p, liupai);
    const dy = daYunInfo(p, gender);
    const dh = duanYuHits(p, focus);
    const xx = xiaoXian(p);
    const mgZhi = mingGongZhi(p.monthZhi, p.gz.time[1]);
    const mgGan = ganOfMG(p.yearGan, mgZhi);
    const ty = taiYuan(p.monthGan, p.monthZhi);

    let o = [];
    // 排盘卡
    o.push('<div class="card"><h3>四柱排盘</h3>');
    o.push('<div class="row" style="gap:4px;margin-bottom:8px;">');
    for (const k of ['year', 'month', 'day', 'time']) {
      const label = { year: '年柱', month: '月柱', day: '日柱', time: '时柱' }[k];
      const shaNames = Array.from(new Set(sh.filter(h => (h.cols || []).includes(k)).map(h => h.name)));
      o.push('<div style="border:1px solid var(--line);border-radius:8px;padding:8px 12px;min-width:120px;flex:1;">');
      o.push('<div class="muted">' + label + '</div>');
      o.push('<div style="font-size:22px;color:var(--acc);font-weight:700;">' + p.gz[k] + '</div>');
      o.push('<div class="muted" style="font-size:12px;">' + p.ssGan[k] + ' · ' + p.na[k] + '</div>');
      o.push('<div class="muted" style="font-size:12px;">藏干：' + (p.hide[k] || '') + '</div>');
      o.push('<div class="muted" style="font-size:12px;">支藏十神：' + (p.ssZhi[k].join(' ')) + '</div>');
      const di = shiDiName(p.dayGan, p.gz[k][1]);
      o.push('<div class="muted" style="font-size:12px;">地势：' + p.dayGan + '坐' + p.gz[k][1] + '为' + (di || '—') + '</div>');
      // 空亡列：各柱自身旬空（年/月/日/时干支各归其旬，如癸未年→甲戌旬→空申酉）；若该柱地支落日柱旬空，追加绿色"落日旬空"（论命用法）
      const inKong = (p.dayKongZhi || []).includes(p.gz[k][1]);
      const selfKw = xunKongOf(p.gz[k]).join('');
      o.push('<div class="muted" style="font-size:12px;">空亡：' + (selfKw ? '<span style="color:#999;">旬空 ' + selfKw + '</span>' : '<span style="color:#999;">无</span>') + (inKong ? ' · <span style="color:#8fbf8f;font-weight:600;">' + p.gz[k][1] + ' 落日旬空</span>' : '') + '</div>');
      // 干坐支（本柱干对本柱支）＝"自坐"：四柱统一口径——本柱干坐本柱支之十二运 + 支本气十神（十神一律以日主为太极，与全盘口径一致）
      const gk = p.gz[k][0];
      const zz = ((D.zanggan && D.zanggan[p.gz[k][1]]) || [''])[0];
      const di2 = shiDiName(gk, p.gz[k][1]);
      const zsShi = zz ? shiShenOf(p.dayGan, zz) : '';
      o.push('<div style="font-size:12px;color:var(--acc);font-weight:600;">自坐：' + (zsShi || '—') + (di2 ? '（' + gk + '坐' + p.gz[k][1] + '为' + di2 + '）' : '') + '</div>');
      if (shaNames.length) o.push('<div style="font-size:12px;color:var(--acc);font-weight:600;margin-top:4px;">神煞：' + shaNames.join('、') + '</div>');
      o.push('</div>');
    }
    o.push('</div>');
    o.push('<div class="row muted">日主 <b style="color:var(--acc);">' + p.dayGan + '</b> · 日旬空：' + (p.xunKong || '无') + ' · 命宫：<b style="color:var(--acc);">' + mgGan + mgZhi + '</b> · 胎元：<b style="color:var(--acc);">' + ty + '</b></div>');
    o.push('</div>');
    // 旺衰卡
    o.push('<div class="card"><h3>旺衰（得令/得地/得势打分，半规则）</h3>');
    o.push('<div class="row"><span class="tag ' + (ws.verdict === '身旺' ? 'ji' : ws.verdict === '身弱' ? 'xiong' : 'ban') + '">' + ws.verdict + '</span><span class="muted">评分 ' + ws.score + '（权重为引擎设定：得令±40/通根14/天干党±8，古籍无统一标准）</span></div>');
    o.push('</div>');
    // 神煞卡
    o.push('<div class="card"><h3>神煞（机判命中 ' + sh.length + ' 项）</h3>');
    if (!sh.length) o.push('<div class="muted">本命四柱无神煞命中。</div>');
    for (const h of sh) o.push('<div class="item-block"><span class="k">' + esc(h.name) + '</span><span class="muted">' + esc(h.pos) + '</span><div class="v">' + esc(h.duan) + '</div></div>');
    o.push('</div>');
    // 民间神煞定义表卡（民间整理版照录，与上方经籍神煞并存区分）
    {
      let hh = 12; try { hh = parseInt($('bz-hour').value, 10); } catch (e) {}
      const mj = jipanMinJianShenSha(p, gender, hh);
      const mjTables = (D && D.minjian_shensha && D.minjian_shensha.tables) || [];
      o.push('<div class="card" style="border-color:rgba(255,200,120,.45);"><h3>民间神煞定义表（民间整理版·机判命中 ' + mj.hits.length + ' 项）</h3>');
      o.push('<div class="row muted">来源：国学典籍网《四柱八字入门》第14章 常用神煞（471 行照录入 JSON：33 详解 + 6 大查法对照表 ' + mj.total + ' 行）；与上方经籍神煞并存区分——查法口径/基准不同的以本表"民间版"照录；"a"=该栏无此神煞；昼=6≤时<18（引擎设定近似）用于天乙阳贵/玉堂阴贵。</div>');
      if (!mj.hits.length) o.push('<div class="muted">本命四柱未命中民间表神煞（如实不编造）。</div>');
      for (const it of mj.hits) {
        o.push('<div class="item-block"><span class="k">' + esc(it.h.name) + '</span><span class="muted">' + esc('以' + it.h.base + '查·' + it.h.v + (it.h.dui ? '·' + it.h.dui : '')) + '</span>' + (it.koujue ? '<div class="v">' + esc(it.koujue) + '</div>' : '') + (it.zhushi ? '<div class="muted">' + (it.zsSrc === '经籍' ? '含义（经籍版）：' : it.zsSrc === '神煞篇' ? '解说（原文节录）：' : '主事：') + esc(it.zhushi) + (it.zsSrc === '经籍' ? ' <span class="q">[民间表原文无主事，引引擎经籍神煞库断语互证]</span>' : it.zsSrc === '神煞篇' ? ' <span class="q">[来源：' + esc(it.exSrc || '神煞解说') + '，原文句节录]</span>' : ' <span class="q">[民间表详解原文]</span>') + '</div>' : '<div class="muted">民间对照表原文仅列查法、详解/经籍/神煞篇均未收录该神煞含义——如实不编造。</div>') + '</div>');
      }
      if (mj.skipped.length) o.push('<div class="muted">未判项（需运限/岁运/流年/十二宫等本局无数据）：' + esc(mj.skipped.slice(0, 6).join('；')) + (mj.skipped.length > 6 ? ' 等 ' + mj.skipped.length + ' 项' : '') + '——如实不判。</div>');
      o.push('<details><summary>33 个常用神煞详解（口诀/查法/主事，照录）</summary>');
      for (const d of mj.detail) o.push('<div class="item-block"><span class="k">' + d.no + '. ' + esc(d.name) + '</span>' + (d.koujue ? '<div class="v">口诀：' + esc(d.koujue) + '</div>' : '') + (d.chafa ? '<div class="muted">查法：' + esc(d.chafa) + '</div>' : '') + (d.zhushi ? '<div class="muted">主事：' + esc(d.zhushi) + '</div>' : '') + '</div>');
      o.push('</details>');
      o.push('<details><summary>6 大神煞查法对照表（照录，共 ' + mj.total + ' 行）</summary>');
      for (const tb of mjTables) {
        o.push('<div class="muted" style="margin-top:6px;"><b>' + esc(tb.title) + '</b>（' + tb.rows.length + ' 行；基准=' + esc(tb.base) + '；列=' + esc(tb.cols.join(' ')) + '）</div>');
        o.push('<table style="border-collapse:collapse;font-size:10px;line-height:1.5;margin:2px 0 8px;">');
        o.push('<tr><td style="border:1px solid rgba(255,255,255,.12);padding:1px 4px;color:var(--acc);">行</td><td style="border:1px solid rgba(255,255,255,.12);padding:1px 4px;color:var(--acc);">神煞</td>');
        for (const c of tb.cols) o.push('<td style="border:1px solid rgba(255,255,255,.12);padding:1px 4px;color:var(--acc);">' + esc(c) + '</td>');
        o.push('<td style="border:1px solid rgba(255,255,255,.12);padding:1px 4px;color:var(--acc);">注</td></tr>');
        for (const r of tb.rows) {
          o.push('<tr><td style="border:1px solid rgba(255,255,255,.12);padding:1px 4px;">' + r.no + '</td><td style="border:1px solid rgba(255,255,255,.12);padding:1px 4px;">' + esc(r.name) + '</td>');
          for (const v of r.vals) o.push('<td style="border:1px solid rgba(255,255,255,.12);padding:1px 4px;">' + esc(v) + '</td>');
          o.push('<td style="border:1px solid rgba(255,255,255,.12);padding:1px 4px;">' + esc(r.dui || '') + '</td></tr>');
        }
        o.push('</table>');
      }
      o.push('<div class="muted">录毕说明：原表 471 行照录未删改；同一神煞不同表查法可能不同（如天医两种起法、地网两种查法）原文并列存录未取舍；天马（按命宫/官禄分 12 行）未入机判表。</div>');
      o.push('</details>');
      o.push('</div>');
    }
    // 空亡·地势·自坐 用法机判卡
    o.push('<div class="card"><h3>空亡·地势·自坐 用法机判</h3>');
    o.push('<div class="row muted">口径：四柱空亡列＝各柱自身旬（每柱干支各归其旬，如癸未年→甲戌旬→空申酉）；机判以日柱旬空推四柱是否落空（命理约言"皆以生日推之"；三命通会"空亡以生日係何旬所屬"）。日旬空：' + esc(p.xunKong || '无') + '。地势＝日干对各支十二运；自坐＝本柱干坐本柱支之十二运与本气十神（十神以日主为太极）。</div>');
    const kwHits = kongWangJiPan(p, sh);
    if (!kwHits.length) o.push('<div class="muted">日旬空亡未临四柱地支，或规则未触发（空亡无命中）。</div>');
    for (const h of kwHits) o.push('<div class="item-block"><span class="tag g" style="font-size:11px;">机判命中</span><div class="v" style="color:#8fbf8f;">' + esc(h) + '</div></div>');
    o.push('<div class="steps muted">以上为源书成文规则（可机械判定部分）；空亡轻重权衡、何时论吉何时论凶、以及十二长生旺衰吉凶的最终取用，属活层——见下方活步骤。</div>');
    o.push('</div>');
    // 格局卡
    o.push('<div class="card"><h3>格局（月令取格 · ' + esc(liupai) + '）</h3>');
    o.push('<div class="row"><span class="tag p">' + esc(gj.ge) + '</span><span class="muted">月支' + p.monthZhi + '藏干本气：' + esc(gj.benqi) + '（' + esc(gj.ss) + '）</span></div>');
    o.push('<div class="item-block"><span class="k">成败救应（简判）</span><span class="v">' + esc(gj.verdict) + '</span></div>');
    if (gj.notes.length) o.push('<div class="steps">' + gj.notes.map(n => '<b>' + esc(n) + '</b>').join(' · ') + '</div>');
    o.push('<div class="item-block"><span class="k">用神五法推荐</span><span class="v">' + esc(gj.yong) + '</span></div>');
    o.push('<div class="steps muted">流派影响：子平真诠专寻月令；滴天髓主中和；评注调候为重。取用不同则结论不同——见下方活步骤。</div>');
    o.push('</div>');
    // 断语卡
    o.push('<div class="card"><h3>断语</h3>');
    if (dh.jinyang) o.push('<div class="item-block"><span class="k">金不换·' + p.dayGan + '日' + p.monthZhi + '月（大运宜忌）</span><div class="v">' + esc(dh.jinyang) + '</div></div>');
    {
      const lx = jipanLiuxiri(p);
      if (lx.g) {
        o.push('<div class="item-block"><span class="k">六' + p.dayGan + '日财官喜忌（三命通会 2934-3091）</span>');
        for (const h of lx.hits) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('<div class="muted" style="margin-top:4px;">财：' + esc(lx.g.cai.join('')) + ' · 正官：' + esc(lx.g.zgc) + ' · 偏官：' + esc(lx.g.pgc) + '；喜行' + esc(lx.g.xi) + '运，忌行' + esc(lx.g.ji) + '运。官煞混杂：' + esc(lx.g.hunza) + '</div>');
        o.push('</div>');
      }
    }
    {
      const wg = detectWaiGe(p);
      if (wg.length) {
        o.push('<div class="item-block"><span class="k">外格成格检测（渊海子平 2241-2610）</span>');
        wg.forEach(x => {
          o.push('<div class="v" style="color:#8fbf8f;">成格：' + esc(x.name) + '（' + esc(x.cond) + '）</div>');
          o.push('<div class="muted" style="margin-top:2px;">忌：' + esc(x.ji) + '</div>');
        });
        o.push('</div>');
      }
      // 神峰通考 外格断语照录卡（432-1056，随成格命中）
      {
        const hitsSfw = jipanShenfengWaige(wg);
        if (hitsSfw.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·外格断语照录（432-1056）</h3>' + hitsSfw.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：随外格成格命中的格，照录神峰该格段首原文（每格节选≤400字），含成格条件与喜忌；"忌官杀/畏水/忌南方运"等为原文断语照录不作自动判定。未收录格如实说明。</div></div>');
      }
      // 三命通会 外格各论照录卡（3748-4353，与神峰版文字解释不同，另行照录）
      {
        const hitsSmw = jipanSanMingWaige(wg);
        if (hitsSmw.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·外格各论照录（3748-4353）</h3>' + hitsSmw.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：随外格成格命中的格，照录三命通会该格段首原文（每格节选≤400字）；三命版与神峰版文字解释不同，两版并存照录；"须如是並參，方盡其理"（707）为原文声明。未收录格如实说明。</div></div>');
      }
    }
    {
      const ed = jipanErDe(p);
      if (ed.length) {
        o.push('<div class="item-block"><span class="k">天月二德·月将（命理约言 284-289）</span>');
        for (const h of ed) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    {
      const ma = jipanMa(p);
      if (ma.length) {
        o.push('<div class="item-block"><span class="k">驿马状态（命理约言·驿马论）</span>');
        for (const h of ma) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    {
      const rg = jipanRiGui(p);
      if (rg.length) {
        o.push('<div class="item-block"><span class="k">日贵格（命理约言·贵人论）</span>');
        for (const h of rg) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    {
      const zs = jipanZhengTaiSui(p, gender);
      if (zs.length) {
        o.push('<div class="item-block"><span class="k">征太岁·流年战克（三命通会 1572-1608）</span>');
        for (const h of zs) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('<div class="muted">注：命理约言·太岁论批"征太岁之说尤为不经，唯天克地冲间有不利"——两说并存。</div>');
        o.push('</div>');
      }
    }
    {
      const sy = jipanSsYiji(p);
      if (sy.hits.length) {
        o.push('<div class="item-block"><span class="k">十神宜忌（命理探源 500-520 · 日主' + esc(sy.state) + '）</span>');
        for (const h of sy.hits) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    {
      const ku = jipanKu(p);
      if (ku.length) {
        o.push('<div class="item-block"><span class="k">墓库根力（命理约言·十干生旺墓等位论）</span>');
        for (const h of ku) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    {
      const sg = jipanSiGui(p);
      if (sg.length) {
        o.push('<div class="item-block"><span class="k">十二宫四贵四忌（三命通会 1409-1426）</span>');
        for (const h of sg) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    {
      const sl = jipanSsLun(p);
      if (sl.length) {
        o.push('<div class="item-block"><span class="k">十神论喜忌条件句（渊海子平 144-403）</span>');
        for (const h of sl) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    {
      const wx = jipanWuXingXiJi(p);
      if (wx.length) {
        o.push('<div class="item-block"><span class="k">五行生克喜忌（神峰通考 1302-1314）</span>');
        for (const h of wx) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    {
      const wxs = jipanWuXingShenSha(p);
      if (wxs.length) {
        o.push('<div class="item-block"><span class="k">五行神煞·生死断（三命通会 9143-9151）</span>');
        for (const h of wxs) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('</div>');
      }
    }
    if (dh.ti) o.push('<div class="item-block"><span class="k">十干体象·' + p.dayGan + '</span><div class="v">' + esc(dh.ti) + '</div></div>');
    if (dh.zhiTi) o.push('<div class="item-block"><span class="k">地支体象·日支' + p.gz.day[1] + '</span><div class="v">' + esc(dh.zhiTi) + '</div></div>');
    if (dh.ge) o.push('<div class="item-block"><span class="k">八格取运喜忌·' + esc(dh.ge.ge) + '</span><div class="v">' + esc(dh.ge.text) + '</div></div>');
    if (dh.hezhi.length) {
      o.push('<details><summary>何知章（富贵贫贱吉凶寿夭，标准明确·应用靠综合）</summary>');
      for (const h of dh.hezhi) o.push('<div class="item-block"><span class="k">' + h.key + '</span><div class="v">' + esc(h.four) + (h.yuanzhu ? '<div class="muted">' + esc(h.yuanzhu) + '</div>' : '') + '</div></div>');
      o.push('</details>');
    }
    if (dh.cat.length) {
      o.push('<details open><summary>断语查表 · ' + esc(focus) + '（' + dh.cat.filter(c => c.tag === 'hit').length + ' 条疑似命中 / 共 ' + dh.cat.length + ' 条）</summary>');
      const hits = dh.cat.filter(c => c.tag === 'hit');
      const rests = dh.cat.filter(c => c.tag !== 'hit');
      for (const c of hits) o.push('<div class="item-block"><span class="tag g">疑似命中</span><div class="v">' + esc(c.text) + '</div></div>');
      if (rests.length) o.push('<div class="muted" style="margin:8px 0;">其余 ' + rests.length + ' 条（无关键词命中，仅供参考，不假装命中）：</div>');
      for (const c of rests.slice(0, 15)) o.push('<div class="item-block"><div class="v muted">' + esc(c.text) + '</div></div>');
      if (rests.length > 15) o.push('<div class="muted">…余 ' + (rests.length - 15) + ' 条折叠（见数据文件）</div>');
      o.push('</details>');
    }
    if (dh.fu20.length) {
      o.push('<details><summary>命理约言 · 赋二十篇（备查）</summary>');
      for (const f of dh.fu20) o.push('<div class="item-block"><span class="k">' + esc(f.name) + '</span><div class="v muted">' + esc(f.text) + '</div></div>');
      o.push('</details>');
    }
    {
      const lm = jipanLuMa(p, null, sh);
      if (lm.length) {
        o.push('<div class="item-block"><span class="k">十干禄·驿马机判（三命通会·论十干禄 2002-2088 / 论驿马 2100-2242）</span>');
        for (const h of lm) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('<div class="muted">口径：禄按日干取，马按年支三合取；"建向近合"按沈芝四字统计；"款段/蹶蹄/折足/无粮/趋途/食芻/马头带剑/生旺库马"按原文组合机判（部分依赖胎月的驮屍/乘轩/乘轺未机判）。</div>');
        o.push('</div>');
      }
    }
    {
      const wxq = jipanWangXiang(p, xiOpt);
      if (wxq.state) o.push('<div class="item-block"><span class="k">五行旺相休囚死（三命通会 1390-1401）</span><div class="v" style="color:#8fbf8f;">' + esc(wxq.state) + '</div>' + (wxq.opt ? '<div class="v">' + esc(wxq.opt) + '</div>' : '') + '<div class="muted">原文"见生旺者未必便作吉论，见休囚死绝未必便作凶言，妙在识其通变"；喜忌部分依赖所选喜用神（上排选项法）。</div></div>');
    }
    {
      const dg = jipanDaGuiRen(p);
      if (dg.length) o.push('<div class="item-block"><span class="k">十干十二年生大贵人例（三命通会 4354-4359 查表）</span><div class="v" style="color:#8fbf8f;">' + dg.map(x => esc(x)).join('<br>') + '</div></div>');
    }
    {
      const jb = jipanJiBing(p);
      if (jb.length) {
        o.push('<div class="item-block"><span class="k">论疾病·干支部位与五行病机（三命通会 5245-5360）</span>');
        for (const h of jb) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('<div class="muted">口径：部位歌为纯查表；受亏/死绝/相克/相生成疾为原文条件句（"多"按五行计数≥3、双行并见≥2 机判，引擎阈值近似提示）；原文"康泰生于和合，疾病起于刑伤"——命理提示非医诊。</div>');
        o.push('</div>');
      }
      const xe = jipanXiaoEr(p);
      if (xe.length) {
        o.push('<div class="item-block"><span class="k">论小儿·关煞与养否机判（三命通会 5487-5550）</span>');
        for (const h of xe) o.push('<div class="v" style="color:#8fbf8f;">' + esc(h) + '</div>');
        o.push('<div class="muted">口径：子平之关按日干七杀透干查表（甲庚九岁关等）；易养/难养为原文条件句，"多/重/叠"按透干计数≥2 机判；"主过房/无乳/满盘刃"为原文断语，命理提示非医学结论。</div>');
        o.push('</div>');
      }
    }
    o.push('</div>');
    // 袁天罡称骨卡（称骨算命：独立于八字断语的四重相加查歌诀；民俗参考不作定论）
    {
      const CG = (D && D.chenggu) || { cgYear: {}, cgMonth: [], cgDay: [], cgHour: {}, cgPoems: {} };
      const cg = jipanChengGu(p);
      if (cg) {
        o.push('<div class="card" style="border-color:rgba(255,200,120,.45);"><h3>袁天罡称骨（重量 ' + esc(cg.key) + '）</h3>');
        if (cg.err) o.push('<div class="err">' + esc(cg.err) + '</div>');
        else {
          o.push('<div class="row">' + cg.parts.map(x => '<div style="border:1px solid var(--line);border-radius:8px;padding:6px 10px;min-width:110px;flex:1;"><div class="muted" style="font-size:11px;">' + esc(x.k) + '</div><div style="font-size:16px;color:var(--acc);font-weight:700;">' + esc(x.v) + '</div></div>').join('') + '</div>');
          o.push('<div class="item-block"><span class="k">总骨重（四项相加）</span><span class="v" style="color:var(--acc);font-weight:700;font-size:18px;">' + esc(cg.key) + '</span><div class="muted">' + cg.parts.map(x => esc(x.k.replace(/[（）]/g, '') + ' ' + x.v)).join(' ＋ ') + ' ＝ ' + esc(cg.key) + (cg.leap ? '；' + esc(cg.leapNote) : '') + '（满十钱进一两）</div></div>');
          if (cg.g) {
            o.push('<div class="item-block"><span class="k">' + esc(cg.key + ' · ' + cg.g.title) + '</span><div class="v" style="white-space:pre-wrap;">' + esc(cg.g.poem) + '</div>' + (cg.g.note ? '<div class="muted" style="margin-top:4px;">注解：' + esc(cg.g.note) + '</div>' : '') + '</div>');
          } else {
            o.push('<div class="err">歌诀表无 ' + esc(cg.key) + ' 档（称骨歌仅二两一～七两二 52 档）——如实不编造。</div>');
          }
          o.push('<details><summary>全表与 52 档歌诀（照录备查）</summary>');
          o.push('<div class="muted" style="margin:4px 0;">【年骨重】' + Object.keys(CG.cgYear).map(k => k + ' ' + CG.cgYear[k]).join('、') + '</div>');
          o.push('<div class="muted" style="margin:4px 0;">【月骨重】' + ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'].map((n, i) => n + ' ' + CG.cgMonth[i]).join('、') + '</div>');
          o.push('<div class="muted" style="margin:4px 0;">【日骨重】' + Array.from({ length: 30 }, (_, i) => i + 1).map(n => n + '日 ' + CG.cgDay[n - 1]).join('、') + '</div>');
          o.push('<div class="muted" style="margin:4px 0;">【时骨重】' + Object.keys(CG.cgHour).map(k => k + '时 ' + CG.cgHour[k]).join('、') + '</div>');
          o.push('<div style="max-height:300px;overflow-y:auto;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:12px;line-height:1.7;">' + Object.keys(CG.cgPoems).map(k => '<div><b style="color:var(--acc);">' + esc(k) + '</b> ' + esc(CG.cgPoems[k].title) + '<br>' + esc(CG.cgPoems[k].poem) + (CG.cgPoems[k].note ? '<div class="muted">' + esc(CG.cgPoems[k].note) + '</div>' : '') + '</div>').join('') + '</div>');
          o.push('</details>');
        }
        o.push('<div class="steps muted" style="margin-top:6px;">口径与来源：年重按干支纪年（立春为界，与排盘口径一致；民间另有按春节一派，两说并存）；月/日按农历，时按十二时辰，四项相加满十钱进一两；闰月按来源口径"上半月算本月、下半月算下月"。本引擎农历 23 点不换日（0 点换日），与称骨传统"夜 11-12 点算第二天"口径有出入，子时出生者按引擎排盘口径计。歌诀以通行版照录，版本文字差异两说并存（如五两八钱：主流版"平生福禄自然来，名利兼全福寿偕；雁塔题名为贵客，紫袍玉带走金阶"，另通行版作"平生衣食自然来，名利双全富贵偕；金榜题名登甲第，紫袍玉带走金阶"）。称骨仅 52 档、粒度粗，民俗参考；古籍所提示内容不代表平台观点，仅供学习参考。</div>');
        o.push('</div>');
      }
    }
    // 巾箱秘术卡（日柱×月令口诀 + 字碰字比对；民间口诀体系，照录不判）
    {
      const JX = (D && D.jinxiang) || null;
      if (JX) {
        const jx = jipanJinXiang(p);
        if (jx) {
          o.push('<div class="card" style="border-color:rgba(160,210,255,.45);"><h3>巾箱秘术 · ' + esc(jx.day + '日元' + jx.mon + '月命局口诀') + '</h3>');
          if (jx.isMiss) o.push('<div class="err">该日柱此月口诀原文即标"（该月口决缺）"——照录，不补写。</div>');
          else if (!jx.poem) o.push('<div class="err">该日柱此月口诀原文未收录——如实标注，不编造。</div>');
          else {
            o.push('<div class="item-block"><span class="k">字碰字比对范围＝原局四柱八干支</span><div class="muted">' + esc(jx.gz8.join(' ')) + '</div></div>');
            for (const row of jx.linesOut) {
              const isHit = row.found.length > 0;
              o.push('<div class="v' + (isHit ? '" style="color:var(--acc);font-weight:600;' : ' muted') + '">' + (isHit ? '▲碰 ' : '') + esc(row.ln) + (isHit ? '<span class="muted" style="font-weight:400;">　[' + esc(row.found.join('；')) + ']</span>' : '') + '</div>');
            }
            o.push('<div class="muted" style="margin-top:4px;">共 ' + esc(jx.linesOut.length) + ' 句，字碰字命中 ' + esc(jx.hitCount) + ' 句。命中＝该句提到的干支/神将/星宿（经翻译表映射）字面出现在原局四柱；未命中句照录不判；原文未规定"碰"字后的具体断法，引擎只做比对不做扩展推断。</div>');
          }
          if (jx.translate) {
            const t = jx.translate, dG = jx.day[0], dZ = jx.day[1], mZ = jx.mon, sm = [];
            if (t.tiangan && t.tiangan[dG]) sm.push('日干' + dG + '→' + t.tiangan[dG]);
            if (t.dizhi && t.dizhi[dZ]) sm.push('日支' + dZ + '→' + t.dizhi[dZ]);
            if (t.xiu28_rebo && t.xiu28_rebo[dZ]) sm.push('日支星宿→' + t.xiu28_rebo[dZ]);
            if (t.dizhi && t.dizhi[mZ]) sm.push('月支' + mZ + '→' + t.dizhi[mZ]);
            if (t.xiu28_rebo && t.xiu28_rebo[mZ]) sm.push('月支星宿→' + t.xiu28_rebo[mZ]);
            o.push('<div class="item-block"><span class="k">本命翻译映射（照录原文对照表）</span><div class="muted">' + esc(sm.join('；')) + '</div></div>');
            o.push('<details><summary>专用词汇翻译对照表（照录备查）</summary>');
            o.push('<div class="muted" style="margin:4px 0;">【天干神将】' + esc(Object.entries(t.tiangan || {}).map(([k, v]) => k + '--' + v).join('；')) + '</div>');
            o.push('<div class="muted" style="margin:4px 0;">【地支神将】' + esc(Object.entries(t.dizhi || {}).map(([k, v]) => k + '为' + v).join('，')) + '</div>');
            o.push('<div class="muted" style="margin:4px 0;">【二十八宿·热卜附注简版】' + esc(Object.entries(t.xiu28_rebo || {}).filter(([k]) => k !== '癸2').map(([k, v]) => k + '为' + v).join('，')) + '（原文末"癸为角"与前"癸为女"重复，照录未改）</div>');
            o.push('<div class="muted" style="margin:4px 0;">【二十八宿·全名】' + esc(Object.entries(t.xiu28_full || {}).map(([k, v]) => k + '为' + v).join('，')) + '</div>');
            o.push('<div class="muted" style="margin:4px 0;">【十二贵人】' + esc(Object.entries(t.guiren || {}).map(([k, v]) => k + v).join('，')) + '</div>');
            o.push('<div class="muted" style="margin:4px 0;">【十神术语】' + esc(Object.entries(t.shishen || {}).map(([k, v]) => k + '=' + v).join('，')) + '</div>');
            o.push('</details>');
          }
          if (jx.meta) o.push('<details style="margin-top:4px;"><summary>来源与版本说明</summary><div class="muted" style="margin-top:4px;">来源：' + esc(jx.meta.source) + '。版本：' + esc(jx.meta.note) + '。全库收录日柱×月令口诀 ' + esc(jx.totalPoems) + ' 条，原文缺月 ' + esc(jx.missCount) + ' 处（照录"口决缺"）。古籍所提示内容不代表平台观点，仅供学习参考。</div></details>');
          o.push('</div>');
        }
      }
    }
    // 李虚中命书卡（四柱干支各查卷上六十甲子「神头禄/禄临官」文；照录不判吉凶）
    {
      const LX = (D && D.lixuzhong) || null;
      if (LX) {
        const lx = jipanLiXuZhong(p);
        if (lx) {
          o.push('<div class="card" style="border-color:rgba(210,230,180,.45);"><h3>李虚中命书 · 四柱干支神头禄（卷上六十甲子）</h3>');
          for (const r of lx.rows) {
            if (r.miss || !r.it) { o.push('<div class="err">' + esc(r.k + ' ' + r.gz) + ' 原文未收录——如实标注，不编造。</div>'); continue; }
            o.push('<div class="item-block"><span class="k">论' + esc(r.k) + '：' + esc(r.gz + '·' + r.it.name) + '</span><div class="v" style="white-space:pre-wrap;">' + esc(r.it.text) + '</div><div class="muted" style="margin-top:2px;">' + esc('（' + r.it.note + '）') + '</div></div>');
          }
          o.push('<details><summary>六十甲子全表（' + esc(lx.total) + ' 条照录备查）</summary><div style="max-height:300px;overflow-y:auto;border:1px solid var(--line);border-radius:8px;padding:8px;font-size:12px;line-height:1.7;">' + Object.keys(LX.liuShi).map(gz => '<div><b style="color:var(--acc);">' + esc(gz + '·' + LX.liuShi[gz].name) + '</b> ' + esc(LX.liuShi[gz].text) + '（' + esc(LX.liuShi[gz].note) + '）</div>').join('') + '</div></details>');
          o.push('<details style="margin-top:4px;"><summary>口径与来源</summary><div class="muted" style="margin-top:4px;">' + esc(lx.meta.source) + '。' + esc(lx.meta.note) + '。按年/月/日/时四柱干支各查卷上六十甲子文照录展示；原文各条为"物性+宜忌"描述及括注，未直接给吉凶断语，引擎照录不引申不判吉凶。古籍所提示内容不代表平台观点，仅供学习参考。</div></details>');
          o.push('</div>');
        }
      }
    }
    // 盲派八字卡（随排盘自动输出，与李虚中/称骨/巾箱同形态；依据夏仲奇/陈秉志体系，kinastro(MIT) 现代整理层）
    try {
      if (window.blindBaziRender) {
        o.push('<div id="bz-blind-card">' + window.blindBaziRender([p.gz.year, p.gz.month, p.gz.day, p.gz.time]) + '</div>');
      }
    } catch (eB) {
      o.push('<div class="err">盲派八字卡渲染失败：' + esc(eB && eB.message) + '</div>');
    }
    // 现代整理层（liki 断语真值表）卡——独立标注，不与古籍原文层混淆；命中即直断、不命中明说（GitHub ml8s/liki MIT）
    {
      const LIKI = (D && D.liki) || null;
      if (LIKI && window.evalLikiBazi) {
        const nowYear = new Date().getFullYear();
        let curDy = null, curLn = null;
        for (const d of ((dy && dy.list) || [])) {
          if (d.startYear <= nowYear && nowYear <= d.endYear) curDy = d;
          for (const ln of (d.lns || [])) if (ln.year === nowYear) curLn = ln;
        }
        const likiOpts = {
          gender: gender,
          year: nowYear,
          liunian: curLn ? { gan: curLn.gz[0], zhi: curLn.gz[1], shi_shen: '' } : null,
          dayun: curDy ? { name: curDy.gz, gan: curDy.gz[0], zhi: curDy.gz[1], start_year: curDy.startYear, shi_shen: '' } : null,
          xiOpt: { use: xiOpt.xi ? [xiOpt.xi] : [], xi: xiOpt.xi ? [xiOpt.xi] : [], ji: xiOpt.ji ? [xiOpt.ji] : [] },
          sh: sh,
          gj: gj
        };
        let likiRes = null;
        try { likiRes = window.evalLikiBazi(LIKI, p, likiOpts); } catch (e) { likiRes = null; }
        if (likiRes && likiRes.ok) {
          o.push('<div class="card" style="border-color:rgba(140,180,255,.45);"><h3>现代整理层（liki 断语真值表 · 命中 ' + likiRes.hitCount + ' 条）</h3>');
          o.push('<div class="row muted">来源：GitHub ml8s/liki（MIT，专业命理开源项目；829 断语 × 893 条件组 × 1355 条件行，命中即直断、不命中明说）。本卡为<b>现代整理层</b>，与上方古籍原文层分开标注，不冒充原文；口径为引擎设定（如十神组合旺弱=其五行当令旺弱）。本命断语 ' + likiRes.total + ' 条（bazi 侧），条件因子求值 ' + likiRes.factorEvaluated + ' 个，不可判定 ' + likiRes.factorUnknown + ' 个；' + likiRes.blockedByUnknown + ' 条断语因缺上下文被阻断（大运/用神/神煞类未传时如实不判）。' + (curLn ? '流年上下文：' + nowYear + ' 年 ' + curLn.gz + (curDy ? '（' + curDy.gz + ' 运）' : '') + '。' : '未匹配到当前流年上下文，流年断语如实不判。') + '</div>');
          if (!likiRes.detail.length) o.push('<div class="muted">本命未命中任何 liki 断语条件（如实不编造）。</div>');
          const byD = {};
          for (const h of likiRes.detail) { const k = h.领域 || '其他'; (byD[k] = byD[k] || []).push(h); }
          for (const k of Object.keys(byD)) {
            o.push('<details><summary>' + esc(k) + '（' + byD[k].length + ' 条）</summary>');
            for (const h of byD[k]) {
              o.push('<div class="item-block"><span class="k">' + esc(h.事件类型 || (h.rule || '')) + '</span><div class="v" style="color:#8fbf8f;">' + esc((h.事件 || '') + (h.结论 ? '——' + h.结论 : '')) + '</div>' + (h.依据 ? '<div class="muted">依据：' + esc(h.依据) + '</div>' : '') + '</div>');
            }
            o.push('</details>');
          }
          o.push('</div>');
        }
      }
    }
    // 古籍素材卡（三命通会时断/十二月支 + 命理探源宜忌/调候/提纲 + 小限）
    o.push('<div class="card"><h3>古籍素材（三命通会 · 命理探源）</h3>');
    if (dh.shishi) {
      o.push('<details open><summary>时断 · ' + esc(dh.shishi.title) + '（' + p.dayGan + '日' + p.gz.time + '时）</summary>');
      for (const ln of String(dh.shishi.text).split('\n')) {
        const isGist = /日生時/.test(ln);
        o.push('<div class="v' + (isGist ? '" style="color:var(--acc);font-weight:600;' : ' muted') + '">' + esc(ln) + '</div>');
      }
      o.push('<div class="muted" style="margin-top:4px;">节内"以上六日年月喜忌，当通融活看"等句为原文活层声明——年月喜忌不可机械照搬。</div>');
      o.push('</details>');
    }
    if (dh.yueji) {
      o.push('<details><summary>十二月支得日干吉凶 · ' + p.monthZhi + '月（5 组）</summary>');
      for (const k of ['甲乙', '丙丁', '戊己', '庚辛', '壬癸']) {
        if (dh.yueji[k]) o.push('<div class="item-block"><span class="k">' + k + '日</span><div class="v muted">' + esc(dh.yueji[k]) + '</div></div>');
      }
      o.push('</details>');
    }
    if (dh.ganyiji) o.push('<div class="item-block"><span class="k">十干宜忌 · ' + p.dayGan + '（滴天髓）</span><div class="v muted">' + esc(dh.ganyiji) + '</div></div>');
    if (dh.tiaohou) o.push('<div class="item-block"><span class="k">调候 · ' + dh.tiaohou.wx + '生' + dh.tiaohou.season + '（穷通宝鉴式）</span><div class="v muted">' + esc(dh.tiaohou.text) + '</div></div>');
    if (dh.zonggang) o.push('<div class="item-block"><span class="k">日主宜忌提纲 · ' + dh.zonggang.wx + '</span><div class="v muted">' + esc(dh.zonggang.text) + '</div></div>');
    if (D.ge_wen && D.ge_wen.length) {
      o.push('<details><summary style="color:#e06c6c;font-weight:800;">子平真诠 · 论用神文论（活层原文 · ' + D.ge_wen.length + ' 节）</summary>');
      for (const w of D.ge_wen) {
        o.push('<div class="item-block"><span class="k" style="color:#e06c6c;">' + esc(w.name) + '</span><div class="v muted" style="white-space:pre-wrap;">' + esc(w.text) + '</div></div>');
      }
      o.push('<div class="muted" style="margin-top:4px;">以上为子平真诠评注原文（徐注未收）；成败/救应/高低/先后皆活层判断，无机械规则，随局观理。</div>');
      o.push('</details>');
    }
    if (xx) o.push('<div class="item-block"><span class="k">流年小限（' + xx.liu + '年 · 命理探源法）</span><div class="v">命宫' + xx.mg + '，生年支顺数' + xx.step + '步至流年支，限落 <b style="color:var(--acc);">' + esc(xx.limit) + '</b>（' + esc(xx.liu) + '年五虎遁干）</div><div class="muted">规则：以生年之支加临命宫之上，以次逆数至本流年岁支为止；干以本流年之干遁之（命理探源 255-257）。</div></div>');
    {
      const xy = xiaoYunList(p, gender);
      const txx = jipanTaiXiBianTong(p, gender);
      o.push('<div class="item-block"><span class="k">流年小运（1-12 岁 · 神峰女命小运定局 1435-1441/星平会海）</span><div class="v">时柱' + esc(p.gz.time) + '起，' + (['甲', '丙', '戊', '庚', '壬'].includes(p.gz.year[0]) ? '阳年' : '阴年') + (gender === 1 ? '男' : '女') + '，' + (((['甲', '丙', '戊', '庚', '壬'].includes(p.gz.year[0]) && gender === 1) || (!['甲', '丙', '戊', '庚', '壬'].includes(p.gz.year[0]) && gender === 0)) ? '顺行' : '逆行') + '：<b style="color:var(--acc);">' + esc(xy.join('，')) + '</b></div><div class="muted">规则：从时柱起，阳男阴女顺行、阴男阳女逆行，一位一岁不差移（星平会海"阳男阴女顺相宜，阴男阳女随逆转"；神峰 1441"阴命甲子时生则行乙丑，二岁丙寅，阳则癸亥，周而复始"）。</div></div>');
      o.push('<div class="item-block"><span class="k">命理探源·推息法/推变法（284-289）</span><div class="v" style="color:#8fbf8f;">' + txx.map(h => esc(h)).join('<br>') + '</div></div>');
    }
    o.push('</div>');
    // 大运卡
    o.push('<div class="card"><h3>大运流年（起运' + (dy.forward ? '顺行' : '逆行') + '）</h3>');
    if (dy.error) o.push('<div class="err">大运计算异常：' + esc(dy.error) + '</div>');
    else if (!dy.list.length) o.push('<div class="muted">无大运数据。</div>');
    else {
      o.push('<table style="width:100%;border-collapse:collapse;font-size:12.5px;">');
      o.push('<tr><th style="border:1px solid var(--line);padding:5px;">大运</th><th style="border:1px solid var(--line);padding:5px;">干支</th><th style="border:1px solid var(--line);padding:5px;">起岁</th><th style="border:1px solid var(--line);padding:5px;">起止年</th><th style="border:1px solid var(--line);padding:5px;">流年数</th><th style="border:1px solid var(--line);padding:5px;">与原局生克冲合</th></tr>');
      for (const d of dy.list) {
        o.push('<tr><td style="border:1px solid var(--line);padding:5px;">' + d.idx + '</td><td style="border:1px solid var(--line);padding:5px;color:var(--acc);font-weight:600;">' + esc(d.gz) + '</td><td style="border:1px solid var(--line);padding:5px;">' + d.startAge + '</td><td style="border:1px solid var(--line);padding:5px;">' + d.startYear + '–' + d.endYear + '</td><td style="border:1px solid var(--line);padding:5px;">' + d.lns.length + '</td><td style="border:1px solid var(--line);padding:5px;" class="muted">' + (d.gx.length ? d.gx.join('，') : '—') + '</td></tr>');
      }
      o.push('</table>');
      o.push('<details open><summary>流年明细（每运 ' + (dy.list[0].lns.length || 10) + ' 年 · 共 ' + dy.list.reduce((s, d) => s + d.lns.length, 0) + ' 个流年）</summary>');
      o.push('<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;">');
      o.push('<tr><th style="border:1px solid var(--line);padding:4px;">大运</th><th style="border:1px solid var(--line);padding:4px;">干支</th><th style="border:1px solid var(--line);padding:4px;">流年</th><th style="border:1px solid var(--line);padding:4px;">岁</th><th style="border:1px solid var(--line);padding:4px;">干支</th><th style="border:1px solid var(--line);padding:4px;">与原局生克冲合</th></tr>');
      for (const d of dy.list) {
        for (const ln of d.lns) {
          o.push('<tr><td style="border:1px solid var(--line);padding:4px;">' + d.idx + '</td><td style="border:1px solid var(--line);padding:4px;color:var(--acc);">' + esc(d.gz) + '</td><td style="border:1px solid var(--line);padding:4px;">' + ln.year + '</td><td style="border:1px solid var(--line);padding:4px;">' + ln.age + '</td><td style="border:1px solid var(--line);padding:4px;">' + esc(ln.gz) + '</td><td style="border:1px solid var(--line);padding:4px;" class="muted">' + (ln.gx.length ? ln.gx.join('，') : '—') + '</td></tr>');
        }
      }
      o.push('</table>');
      o.push('</details>');
      // 空亡填实（命理约言·空亡论：运逢原空之神是为填实，不为愈空；苟原无而运遇之亦以空论，然不如局遇之紧）
      const kw = p.dayKongZhi || [];
      const tianShi = [];
      for (const d of dy.list) {
        if (kw.indexOf(d.gz[1]) >= 0) tianShi.push(d.gz + '运（起' + d.startYear + '）');
        for (const ln of d.lns) if (kw.indexOf(ln.gz[1]) >= 0) tianShi.push(ln.year + '年' + ln.gz);
      }
      if (tianShi.length) o.push('<div class="item-block"><span class="k">空亡填实（原空支：' + esc(kw.join('、')) + '）</span><div class="v" style="color:#8fbf8f;">行运/流年逢原空之神：' + esc(tianShi.slice(0, 12).join('，')) + (tianShi.length > 12 ? '…' : '') + '——为填实，不为愈空（命理约言·空亡论）</div></div>');
    }
    o.push('<div class="steps muted">流年吉凶：上表为大运/流年干支与原局四柱的生克冲合机判（天干合·生克 / 地支冲·六合·三合·刑）；喜忌判断属活层（见下）。</div>');
    o.push('</div>');
    // 半规则·选项法卡（六亲星无条件机判；大运流年喜忌/夫妻断语需先选喜用·忌神·身强弱）
    o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>喜用神选择 · 条件机判（活层前置·选项法）</h3>');
    const cs2 = tenShenCounts(p);
    const hitsLq = jipanLiuQin(p, cs2);
    if (hitsLq.length) o.push('<div class="item-block"><span class="k">六亲星机判（渊海子平 470-509，无条件）</span><div class="v" style="color:#8fbf8f;">' + hitsLq.map(x => esc(x)).join('<br>') + '</div><div class="muted">口径：十神按透干计数（支藏未计）；"死绝墓"按所坐支十二运。原文为定性语，机判为近似提示。</div></div>');
    else o.push('<div class="item-block"><span class="k">六亲星机判（渊海子平 470-509）</span><div class="muted">本局未命中原文六亲受克条件句（印绶见财克母 / 比劫克妻父 / 官杀多难兄弟 / 食伤多难子息 / 偏财父坐死绝冲刑 / 印母坐阳刃墓绝）——如实不编造。</div></div>');
    if (!xiOpt.xi && !xiOpt.ji && !xiOpt.sq) {
      o.push('<div class="muted">上排选择喜用神五行 / 忌神五行 / 身强弱后点「排盘」，触发下列原文条件断语：<br>① 大运流年喜忌（命理探源 560/565/568：大运重地支、太岁重天干，"看喜行何运，忌行何运"）；<br>② 夫妻断语树（滴天髓 1046-1063：财星轻重×身强弱×比劫官杀食伤印，原文条件句）。<br>未选部分不机判，不编造。</div>');
    } else {
      const hitsXi = jipanXiJi(p, dy, xiOpt.xi, xiOpt.ji);
      const hitsFq = jipanFuQi(p, cs2, xiOpt.xi, xiOpt.sq);
      if (hitsXi.length) o.push('<div class="item-block"><span class="k">大运流年喜忌（' + (xiOpt.xi ? '喜用' + xiOpt.xi : '') + (xiOpt.ji ? ' · 忌' + xiOpt.ji : '') + '）</span><div class="v" style="color:#8fbf8f;">' + hitsXi.map(x => esc(x)).join('<br>') + '</div><div class="muted">规则：大运重地支、太岁重天干（命理探源 567"大运譬所到之地，故重地支…太岁譬所遇之人，故重天干"）；益用神者得运生之皆吉，反是则凶（560）；太岁值用神则反有益（565）；战冲和好视孰降孰切、以喜用定吉凶（570-578）。</div></div>');
      if (hitsFq.length) o.push('<div class="item-block"><span class="k">夫妻断语（滴天髓 1052-1063）</span><div class="v" style="color:#8fbf8f;">' + hitsFq.map(x => esc(x)).join('<br>') + '</div><div class="muted">口径：财神轻重/比劫官杀食伤印按透干计数，身强弱取你上排所选。任铁樵原注"须分日主衰旺喜忌之别，四柱配合活看为是"——机判为条件命中提示，非定论。</div></div>');
      if (!hitsXi.length && !hitsFq.length) o.push('<div class="muted">所选选项未命中大运流年喜忌/夫妻原文条件句（如实：不命中即不编造断语）。</div>');
    }
    o.push('</div>');
    // 渊海歌诀条件机判卡（四言独步/身弱论/弃命从杀/五言独步/撮要法/格局生死引用——无条件枚举）
    {
      const hitsGj = jipanGeJue(p, cs2, gender, sh);
      if (hitsGj.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海歌诀条件机判（四言独步/五言独步/撮要法/格局生死 · 无条件）</h3>' + hitsGj.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：干支同字/同支/五行计数按四干四支本气计，十神按透干计数；歌诀为原文四字断句，命中即提示（近似断语），未命中不编造；涉及喜用/身强弱/女命细分者不在此卡。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海歌诀条件机判（四言独步/五言独步等）</h3><div class="muted">本局未命中歌诀条件句（如实不编造）。</div></div>');
    }
    // 喜忌篇+子平举要歌 条件句卡（渊海 709-772，外格46格已另卡覆盖，此处只取条件断句）
    {
      const hitsXjP = jipanXiJiPian(p, cs2, gender, sh);
      if (hitsXjP.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海·喜忌篇/子平举要歌 条件机判（709-772）</h3>' + hitsXjP.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：十神按透干计数；"露官藏杀/露杀藏官"以驿马四长生位（寅申巳亥）藏杀之象作近似提示；"运入官乡/财乡/岁运并临"原文指行运，原局条件作近似提示；原文吉凶两说并存者照录不作定论。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海·喜忌篇/子平举要歌</h3><div class="muted">本局未命中喜忌篇/举要歌条件句（如实不编造）。</div></div>');
    }
    // 神峰·讲命捷径赋 条件句卡（1858-1860）
    {
      const hitsJm = jipanJiangMing(p, cs2, gender);
      if (hitsJm.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰·讲命捷径赋 条件机判（1858-1860）</h3>' + hitsJm.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：十神按透干计数；"逆运/顺行/入运/行方"原文指行运，原局条件作近似提示；从格/化格属活层，"无比劫可作得从/四柱有辰得化"只作提示不作成立判；原文断语定性词照录不作实判。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰·讲命捷径赋</h3><div class="muted">本局未命中讲命捷径赋条件句（如实不编造）。</div></div>');
    }
    // 神峰·一行禅师天元赋 十干生克组合提示卡（2917-3060，查表式）
    {
      const hitsTy = jipanTianYuan(p, cs2);
      if (hitsTy.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰·一行禅师天元赋 十干生克组合（2917-3060 查表）</h3>' + hitsTy.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：按"日干×四干透出"查原文生克断句表（印绶吉/食神吉/伤官盗气/正官相济/七杀克身五类）；原文注文中的解厄条件（如"须壬癸制火""行火运制庚"）照录于句末作提示；化气组合只列原文断句、不作化格成立判。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰·一行禅师天元赋</h3><div class="muted">本局未命中天元赋十干组合句（如实不编造）。</div></div>');
    }
    // 命理探源·论六亲常法 条件句卡（599 按文）
    {
      const hitsTyLq = jipanTanYuanLiuQin(p, cs2, gender);
      if (hitsTyLq.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>命理探源·论六亲常法 条件机判（599）</h3>' + hitsTyLq.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：十神按透干计数、"旺/盛/重"按≥2 机判（引擎阈值近似提示）；原文"由常而变，参伍错综，不可专泥财印论"——常法断语作提示照录；夫妻/子女细分已入选项法卡。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>命理探源·论六亲常法</h3><div class="muted">本局未命中六亲常法条件句（如实不编造）。</div></div>');
    }
    // 子平真诠评注·论通根重轻 明细卡（305-307）
    {
      const hitsZq = jipanZhenQuanTongGen(p);
      o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>子平真诠评注·论通根重轻（305-307 明细）</h3>' + hitsZq.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：按原文 305"长生禄旺根之重者、墓库余气根之轻者"；墓库根甲未/丙戌/庚丑/壬辰，余气根乙辰/丁未/辛戌/癸丑，"乙逢戌丁逢丑不作此论"、阴长生（乙午/丁酉）不作真根（徐注 306）；通根权重已并入旺衰计分，本卡为原文根型明细提示，非新增断语。未命中不编造。</div></div>');
    }
    // 三命通会·十神论条件句卡（正官/偏官/财/印/阳刃/女命）
    {
      const hitsSm = jipanSanMingShiShen(p, cs2, gender);
      if (hitsSm.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·十神论条件机判（3370-5415）</h3>' + hitsSm.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：十神按透干计数、旺衰取引擎判定；"多/重/纯/杂/太过"为原文定性，机判阈值≈≥2（引擎近似）；与渊海喜忌/挈要/神峰/千里命稿已覆盖句不重复输出（此卡为三命独有句）；"行财乡/行煞旺地"原文指行运，原局条件作近似提示；女命"浊"类原文定性词照录作提示。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·十神论条件机判</h3><div class="muted">本局未命中三命十神论条件句（如实不编造）。</div></div>');
    }
    // 渊海子平·六亲散论补缺卡（兄弟/妻妾/子息/小儿）
    {
      const hitsYh = jipanYuanHaiLiuQin(p, cs2, gender);
      if (hitsYh.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海子平·六亲散论补缺机判（500-545）</h3>' + hitsYh.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：论父485-491/论母492-499已入六亲总篇卡，本卡补兄弟姊妹/妻妾/子息/小儿四篇条件句；"财衰败墓绝"按财星透干所坐支十二宫死绝墓败判；"一杀一子二杀二子无杀无子"为男命查表提示；531 子女性别倾向为纯查表。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海子平·六亲散论补缺机判</h3><div class="muted">本局未命中渊海六亲散论（兄弟/妻妾/子息）条件句（如实不编造）。</div></div>');
    }
    // 神峰通考·五行元理消息赋+五行生克赋条件句卡
    {
      const hitsYl = jipanYuanLiFu(p, cs2, gender);
      if (hitsYl.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·五行元理消息赋机判（2602-2916）</h3>' + hitsYl.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：五行按四柱干支计数（天干各1+藏干本气各1）；"旺/盛/重/多"原文定性，机判阈值≈≥2或≥3（引擎近似）；"运逢/行土运/岁运并临"原文指行运，原局条件作近似提示；原文两说并存处（如水盛则危 2647 vs 水旺居垣须有智 2678）照录不作定论；与三命/渊海已覆盖句（大贵者用财而不用官、弃印就财等）不重复输出；生克赋仅抽日干×五行强弱的直接断句（2870/2872/2894/2896），余为五行形象活断。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·五行元理消息赋机判</h3><div class="muted">本局未命中五行元理消息赋条件句（如实不编造）。</div></div>');
    }
    // 韦千里《八字提要》1440条查表卡（12月×10日×12时）
    {
      const hitsBy = jipanBaZiTiYao(p);
      if (hitsBy.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>八字提要（韦千里）查表</h3>' + hitsBy.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：按 月支×日干×时柱 查 1440 条原文照录；本表覆盖全部组合，无遗漏。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>八字提要（韦千里）查表</h3><div class="muted">本局无对应提要条目（如实不编造）。</div></div>');
    }
    // 渊海子平 856-1108（看命入式/杂论口诀/寸金搜髓论/论命细法）条件句卡
    {
      const hits856 = jipanYuanHai856(p, cs2, gender);
      if (hits856.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海子平·杂论口诀/寸金搜髓/论命细法机判（856-1108）</h3>' + hits856.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：条件按原文单句机判，均带行号；"运/行运/岁运"原文指行运，原局条件作近似提示；"重犯/多/重重"阈值≈≥2或≥3（引擎设定）；神趣八法（类象/从象/化象）与从化外格重叠不入本卡；群兴论/宝法为活层文论不入本卡；日柱查表 1034-1045 两说并存处（己巳/庚申）照录不作定论；与十神论/喜忌篇已覆盖句不重复。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海子平·杂论口诀机判（856-1108）</h3><div class="muted">本局未命中渊海 856-1108 条件句（如实不编造）。</div></div>');
    }
    // 三命通会 卷末综合赋条件句卡（8747-10286，9143-9151 已由卷末五行神煞卡覆盖）
    {
      const hitsJm = jipanSanMingJuanMo(p, cs2, gender);
      if (hitsJm.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·卷末综合赋机判（8747-10286）</h3>' + hitsJm.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：仅抽单句机械可判条件；玉井奥诀等通篇综合权衡句不入；9146/9147/9150（丙丁/甲乙日见庚辛必死、金多夭折等）已由卷末五行神煞卡（9149-9151）覆盖，本卡不重复；"岁运相并必死"原文指岁运并临，原局条件作近似提示；四印古歌按日干×四库查表照录。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·卷末综合赋机判</h3><div class="muted">本局未命中卷末综合赋条件句（如实不编造）。</div></div>');
    }
    // 滴天髓阐微 命例集匹配参照卡（1281-2207，226例）
    {
      const hitsMl = jipanDiTianMingLi(p);
      if (hitsMl.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>滴天髓阐微·命例集匹配参照</h3>' + hitsMl.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：四柱全同→照录命例作参照；无全同时按日柱匹配并标注"仅日柱同非本命"，最多列3例；原文照录不作断语，未命中如实。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>滴天髓阐微·命例集匹配参照</h3><div class="muted">无匹配命例（如实不编造）。</div></div>');
      // 全库命例参照卡（通神论正文/真诠/神峰/三命 239 例）
      {
        const hitsMla = jipanMingLiAll(p);
        o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>全库命例参照（通神论5 + 真诠174 + 神峰66 + 三命19）</h3>' + hitsMla.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：提取 滴天髓通神论1-1045 正文"八字："命例 / 子平真诠评注306-1535 独立四柱行命例 / 神峰通考"XX造 四柱"+"[四柱]"方括号+"假如此X命/此八字/八字后缀"四式命例（含已→己异体）/ 三命通会"如X、X、X、X"本行含命格结果词命例；四柱全同→照录原文，无全同→按日柱列前3（标注"仅日柱同非本命"）；原文照录作命例参照不作断语；未命中如实。命例提取为机械行模式，每行仅取首个命例（同行第二例未收）、个别未带命例标记的未收录（提取口径如实说明）。</div></div>');
      }
    }
    // 神峰通考 正格详论群机判卡（1966-2025：正倒禄飞/刑合/子遥巳/丑遥巳/时上偏财/六阴朝阳/偏官/羊刃非刃/建禄会杀/合杀/官旺身弱/时旺/印绶/劫财羊刃忌时/背禄/正气官星/日干无气时逢刃/官杀两停/贪合忘官/杀旺化官/自坐官杀/七杀全彰/女命总论/贵众合多/偏官制伏/伤官官乡/胞胎受气）
    {
      const hitsZg = jipanShenFengZhengGe(p, gender);
      if (hitsZg.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·正格详论群机判（1966-2025）</h3>' + hitsZg.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：十神按透干+支本气；"旺/弱"取引擎旺衰判定；"巳字多/亥字多/制伏多/官杀多"阈值≥2 为引擎设定近似；行运句（"行杀旺乡""运入财乡""岁运并临"等）作原局条件提示，行运层面留待流年接口；与继善篇同义句（官旺身弱/印绶见财/身旺无依）两处重叠照录，注明版本；女命贵众合多句为古籍原文照录不作定论；未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·正格详论群机判</h3><div class="muted">本局未命中正格详论群条件句（如实不编造）。</div></div>');
    }
    // 神峰通考 卷末赋群条件机判卡（3060-3160：捷驰千里马赋/络绎赋/玄机赋/憎爱赋/万金赋/相心赋/仙机赋/金玉赋/人鉴论/渊源集说/妖祥赋/幽微天干赋/人元消息赋/地支赋）
    {
      const hitsJm = jipanShenFengJuanMo(p, cs2, gender);
      if (hitsJm.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·卷末赋群机判（3060-3160）</h3>' + hitsJm.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：宫位十神按透干+支本气；五行按干支本气计数；"旺/弱"取引擎旺衰判定；"重/多/太过/重逢"阈值≥2/≥3 为引擎设定近似；行运句（"火乡发福""忌官乡""行官运"等）作原局条件近似提示；官杀混杂与渊海901两说并存照录；形貌句按日主五行查表照录；"破/制"未达明确条件的原文句不入。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·卷末赋群机判</h3><div class="muted">本局未命中卷末赋群条件句（如实不编造）。</div></div>');
    }
    // 神峰通考 病源赋机判卡（3157-3160）
    {
      const hitsBy = jipanBingYuanFu(p, cs2);
      if (hitsBy.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·病源赋机判（3157-3160）</h3>' + hitsBy.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：干支并见/日主五行+计数/地支刑/三合局按原文条件机判；"制/刑/绝"阈值与旺衰取引擎判定近似；此为命理原文照录（命理提示非医诊）。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·病源赋机判</h3><div class="muted">本局未命中病源赋条件句（如实不编造）。</div></div>');
    }
    // 三命通会 六十甲子纳音性质详论卡（294-478）
    {
      const hitsNx = jipanNayinXiang(p);
      o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·六十甲子纳音性质详论（294-478 原文照录）</h3>' + hitsNx.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：年/日两柱纳音逐柱详论（含《五行要论》《阎东叟》《玉宵宝鉴》引文）照录原文；断语多为"纳音自论"（忌见某干支纳音等），须与他柱纳音互参，本卡不自动断吉凶。未收录柱如实说明。</div></div>');
    }
    // 三命通会 三十纳音象论照录卡（559-1094，按纳音象名查表）
    {
      const hitsNxx = jipanSanMingNayinXiang(p);
      o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·三十纳音象论（559-1094 原文照录）</h3>' + hitsNxx.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：按年/日两柱纳音象名（海中金/炉中火…三十象）查表照录段首原文（每象节选≤400字）；象论为"纳音自象"（如金箔金喜木忌火），含各象妙选格名（崑山片玉/玉兔东升等），须与他柱纳音/地支互参，不自动断吉凶。未收录象如实说明。</div></div>');
    }
    // 命理约言 正变诸格名目机判卡（60-91）
    {
      const hitsYy = jipanMingLiYueYanGe(p, cs2);
      if (hitsYy.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>命理约言·正变诸格名目机判（60-91）</h3>' + hitsYy.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：暗冲/暗合/从官从伤从食/两神成象按原文成格条件机判（两神成象严格按"各占两干两支"）；从财/从杀/化气/五行成局已由外格46格卡覆盖，本卡不重复；"满局皆X"作无印比劫近似。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>命理约言·正变诸格名目机判</h3><div class="muted">本局未命中暗冲/暗合/从官从伤从食/两神成象条件（如实不编造）。</div></div>');
    }
    // 神峰通考 定真篇宫位机判卡（2567-2601）
    {
      const hitsDz = jipanDingZhenPian(p, cs2, gender);
      if (hitsDz.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·定真篇宫位机判（2567-2601）</h3>' + hitsDz.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：宫位（年祖上月兄弟日妻时子）按原文规则机判；死墓绝胎按阳顺阴逆十二长生查表（日干）；"旺/弱"取引擎旺衰判定；2587 时辰生旺宫断子息多少依赖地势表未机判（备查）。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·定真篇宫位机判</h3><div class="muted">本局未命中定真篇宫位条件（如实不编造）。</div></div>');
    }
    // 神峰通考 金不换骨髓歌行运提示卡（1112-1231）
    {
      const hitsJb = jipanJinBuHuan(p);
      o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰通考·金不换骨髓歌行运提示（十干×十二月 119首）</h3>' + hitsJb.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：按 日干×月令 查表照录原文（顺行/逆行/行运方位提示），作行运参考不作原局断语；己土寅月一首原文缺失（古籍原缺）如实说明。</div></div>');
    }
    // 神峰 认格局生死之歌/看命绳尺 + 命理约言 干支一气/双美 + 子平真诠 阳干逢库 条件机判卡
    {
      const hitsSg = jipanShengSiGe(p, cs2);
      if (hitsSg.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰生死之歌/看命绳尺 + 命理约言/子平真诠条件机判</h3>' + hitsSg.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径："行财运/岁运/运行"原文指行运，原局条件作近似提示；"重/弱"取引擎旺衰与计数判定；干支一气/双美为旧说照录并附素庵驳语（两说并存）；阳干逢库为徐注通根提示。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰生死之歌/看命绳尺 + 命理约言/子平真诠条件机判</h3><div class="muted">本局未命中上述条件句（如实不编造）。</div></div>');
    }
    // 三命通会 时断后看命心法机判卡（8680-8746 机械条件句）
    {
      const hitsXf = jipanShiDuanHouXinFa(p, cs2);
      if (hitsXf.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·时断后看命心法机判（8680-8746）</h3>' + hitsXf.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：官/煞/财/印按透干计数（一位/二位三位/四位纯官等）机判；"年干日之官星/七煞"按十神查表；晦气煞/转趾煞（8697-8699）需流年干支，留待流年接口；"月上有用神得祖宗之力"等依赖用神属活层（见下方活步骤）。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>三命通会·时断后看命心法机判</h3><div class="muted">本局未命中看命心法条件句（如实不编造）。</div></div>');
    }
    // 神峰六亲说 + 渊海论杂气 条件句机判卡
    {
      const hitsLq = jipanShenFengLiuQin(p, cs2);
      const hitsZq = jipanYuanHaiZaQi(p, cs2);
      const allQ = hitsLq.concat(hitsZq);
      if (allQ.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰六亲说·渊海论杂气 条件机判</h3>' + allQ.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：六亲说年上财官/月上官杀按年干/月干十神机判；杂气"要财多便是贵命"按月支辰戌丑未+财透≥2 机判（阈值引擎设定，近似提示）；杂气"刑冲破害反伤福"原文指行运，未机判。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰六亲说·渊海论杂气</h3><div class="muted">本局未命中六亲说/杂气条件句（如实不编造）。</div></div>');
    }
    // 歌诀条件机判卡二（继善篇/心镜歌/神峰六神篇——2026-10-26 补，原误划活层，实为条件断句）
    {
      const hitsJs = jipanJiShan(p, cs2, gender, sh);
      const hitsXj = jipanXinJing(p, cs2, sh);
      const hitsSf = jipanLiuShen(p, cs2, gender);
      const all = hitsJs.concat(hitsXj, hitsSf);
      if (all.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>歌诀条件机判（继善篇/心镜歌/神峰六神篇 · 无条件）</h3>' + all.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：十神按透干计数，五行按四干四支本气计，"旺/弱"取引擎旺衰判定；歌诀为原文断句（渊海773-855/1109-1160、神峰2027-2306），命中即提示（近似断语），未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>歌诀条件机判（继善篇/心镜歌/神峰六神篇）</h3><div class="muted">本局未命中新增歌诀条件句（如实不编造）。</div></div>');
    }
    // 挈要捷驰玄妙诀+渊源集说 条件句机判卡（渊海 1809-1929，无条件枚举）
    {
      const hitsQy = jipanQieYao(p, cs2, gender, sh);
      if (hitsQy.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>挈要捷驰玄妙诀·渊源集说 条件机判（渊海 1809-1929）</h3>' + hitsQy.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：十神按透干计数、五行按四干四支本气计、"旺/弱"取引擎旺衰判定；口诀为原文断句，命中即提示（近似断语）；"运入西方/南域/水乡"原文指行运，全局同向多寡作近似提示；"伤官见官"吉凶两说并存照录。未命中不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>挈要捷驰玄妙诀·渊源集说</h3><div class="muted">本局未命中挈要捷驰/渊源集说条件句（如实不编造）。</div></div>');
    }
    // 渊海女命断歌机判卡（僅 gender=0 女命触发；陰命赋/总断歌/富贵贫贱/滚浪桃花/贵格/贱格）
    if (gender === 0) {
      const hitsNv = jipanNvMing(p, cs2, sh);
      if (hitsNv.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海女命断歌机判（陰命赋/总断歌/富贵贫贱/滚浪桃花/贵格/贱格）</h3>' + hitsNv.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：仅女命触发；十神按透干计数，五行按四干四支本气计，"旺/弱"取引擎旺衰判定；断语为原文，命中即提示（近似断语）；"贵格/贱格"为原文条目式归类，命中列出。未命中项不编造。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>渊海女命断歌机判</h3><div class="muted">本女命局未命中女命断歌条件句（如实不编造）。</div></div>');
    }
    // 滴天髓女命章机判卡（仅 gender=0 触发；夫星变通/克夫/子息/婬贱组合）
    if (gender === 0) {
      const hitsDt = jipanDiTianNv(p, cs2, sh);
      if (hitsDt.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>滴天髓·女命章机判（任铁樵论女命 1274-1280）</h3>' + hitsDt.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：仅女命触发；十神按透干计数、五行按四干四支本气计，"旺/弱"取引擎旺衰判定；断语为原文条件句（近似提示），"必有子/必无子/必克夫"为原文定性语，命中组合即列；婬贱组合任氏明言"不可轻断"，仅作组合提示。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>滴天髓·女命章机判</h3><div class="muted">本女命局未命中滴天髓女命条件句（如实不编造）。</div></div>');
    }
    // 千里命稿·韦千里 教材体机判卡（2026-10-26 入库：取格四法/八格用神+善运恶运/建禄月刃/外格善运恶运/六神利弊喜忌/女命27条/富贵贫贱/月建时令=机判；流年12法=选项法）
    {
      const ql = qlmgModule(p, cs2, gender, sh, xiOpt, gj, dy);
      if (ql.hits.length || ql.opt.length) {
        o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>千里命稿·韦千里 教材体机判（民国三大家）</h3>');
        if (ql.hits.length) o.push(ql.hits.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join(''));
        if (ql.opt.length) o.push('<details><summary style="color:#e0b36c;">选项法·活层前置（' + ql.opt.length + ' 项，需选喜用神）</summary>' + ql.opt.map(h => '<div class="item-block"><span class="v muted" style="white-space:pre-wrap;">· ' + esc(h) + '</span></div>').join('') + '</details>');
        o.push('<div class="muted">口径：千里命稿为教材体，身强弱（旺衰判定）+格局+十神透干计数皆可机判，故上列条件命中为「原文条件句命中」；"重/多/轻/浅"为原文定性语，机判阈值=透干计数≥2（引擎设定）——近似提示，非定论；取用神/评断综合属活层（见下方活步骤），此处不机判。流年12法/月建看法需先选喜用神（上排选项法）。</div></div>');
      }
    }
    // 滴天髓六亲论断语卡（兄弟无条件；子女需选身强弱；父母需选喜用神）
    {
      const hitsXd = jipanXiongDi(p, cs2);
      const hitsZn = jipanZiNv(p, cs2, xiOpt.sq);
      const hitsFm = jipanFuMu(p, cs2, xiOpt.xi);
      const any = hitsXd.length || hitsZn.length || hitsFm.length || xiOpt.sq || xiOpt.xi;
      if (any) {
        o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>滴天髓六亲论断语（任铁樵更定：以食伤为子女·以年月喜忌看父母）</h3>');
        if (hitsXd.length) o.push('<div class="item-block"><span class="k">兄弟论（滴天髓 1141，无条件）</span><div class="v" style="color:#8fbf8f;">' + hitsXd.map(x => esc(x)).join('<br>') + '</div></div>');
        else o.push('<div class="item-block"><span class="k">兄弟论（滴天髓 1141，无条件）</span><div class="muted">本局未命中兄弟原文条件句（杀旺得败财/比肩敌杀/印旺成群/财轻劫重食伤化劫等）——如实不编造。</div></div>');
        if (hitsZn.length) o.push('<div class="item-block"><span class="k">子女论（滴天髓 1083-1098 · 身' + xiOpt.sq + '）</span><div class="v" style="color:#8fbf8f;">' + hitsZn.map(x => esc(x)).join('<br>') + '</div><div class="muted">任铁樵更定"以食伤为子女"，原注"官轻须要助官、杀重身轻只要印比…命理不可执一，总要变通"——机判为条件命中提示，非定论。</div></div>');
        if (xiOpt.sq && !hitsZn.length) o.push('<div class="item-block"><span class="k">子女论（滴天髓 1083-1098）</span><div class="muted">所选项未命中子女原文条件句（如实不编造）。</div></div>');
        if (hitsFm.length) o.push('<div class="item-block"><span class="k">父母论（滴天髓 1125 · 喜用' + xiOpt.xi + '）</span><div class="v" style="color:#8fbf8f;">' + hitsFm.map(x => esc(x)).join('<br>') + '</div><div class="muted">任铁樵批"以财印分属父母又论克父母…无把握"，更定"年月官印财伤×日主喜忌"断父母兴替；"日时刑伤冲犯"按日时支相冲/伤官透简化判。机判为条件命中提示。</div></div>');
        if (xiOpt.xi && !hitsFm.length) o.push('<div class="item-block"><span class="k">父母论（滴天髓 1125）</span><div class="muted">所选喜用未命中父母原文条件句（如实不编造）。</div></div>');
        if (!xiOpt.sq) o.push('<div class="muted">子女论需先选「身强弱」后触发（上排选项法）。</div>');
        if (!xiOpt.xi) o.push('<div class="muted">父母论需先选「喜用神五行」后触发（上排选项法）。</div>');
        o.push('</div>');
      }
    }
    // 神峰歌诀条件机判卡（无条件）
    {
      const hitsSf = jipanShenFeng(p, cs2, gender);
      if (hitsSf.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰歌诀条件机判（运晦/刑克/刑妻/克子/带疾/寿元/飘荡/女命/看命捷歌/五阴歌/月建歌 · 无条件）</h3>' + hitsSf.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：歌诀四字断句命中即提示（近似断语）；排除十段锦/从化定诀（依赖化格成立，化格属活层未判，不套断语）、岁运类句与节气歌断（依赖大运/节气深浅）；未命中不编造。女命细分句仅女命触发。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>神峰歌诀条件机判（运晦/刑妻/克子/带疾等）</h3><div class="muted">本局未命中神峰歌诀条件句（如实不编造）。</div></div>');
    }
    // 纳音取象卡（三命通会·释六十甲子性质吉凶 183-281 纯查表）
    {
      const hitsNy = jipanNaYin(p);
      if (hitsNy.length) o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>纳音取象（三命通会·释六十甲子性质吉凶 183-281）</h3>' + hitsNy.map(h => '<div class="item-block"><span class="v" style="color:#8fbf8f;">· ' + esc(h) + '</span></div>').join('') + '<div class="muted">口径：象名/喜/神煞名目照原文逐条抄录，为"纳音自喜"非命局喜用；平头/悬针/破字/八专/九丑等为字形神煞名目照录未逐一另判；"盛大者忌变为小弱，小弱者欲变盛大，皆当从其变者而论之"（282-293）须与他柱纳音大小互参，本卡不自动断大小强弱。</div></div>');
      else o.push('<div class="card" style="border-color:rgba(143,191,143,.5);"><h3>纳音取象（三命通会 183-281）</h3><div class="muted">本局无纳音数据（如实不编造）。</div></div>');
    }
    // 活步骤卡（红字）
    o.push('<div class="card" style="border-color:rgba(224,108,108,.45);"><h3 style="color:#e06c6c;">活步骤（不可机械化的部分 · 原文）</h3>');
    if (D.huoju) {
      for (const hj of D.huoju) {
        o.push('<div class="item-block"><span class="k" style="color:#e06c6c;font-weight:800;">' + esc(hj.title) + '</span>');
        for (const s of hj.steps) o.push('<div class="v" style="color:#e06c6c;font-weight:800;">· ' + esc(s) + '</div>');
        if (hj.note) o.push('<div class="muted" style="margin-top:4px;">' + esc(hj.note) + '</div>');
        o.push('</div>');
      }
    }
    o.push('<div class="muted">以上活步骤按古籍原文（子平真诠/评注/神峰通考/滴天髓/命理约言）原样输出，不做机判——取用神/格局高低/行运喜忌/六亲参配皆"神而明之存乎其人"。</div>');
    o.push('</div>');

    return o.join('');
  }

  // ── 起盘 ──
  function baziGo() {
    const y = parseInt($('bz-year').value, 10), m = parseInt($('bz-month').value, 10), d = parseInt($('bz-day').value, 10), h = parseInt($('bz-hour').value, 10);
    const gender = $('bz-gender').value === '1' ? 1 : 0;
    const liupai = $('bz-liupai').value;
    const focus = $('bz-focus').value;
    const xiOpt = { xi: $('bz-xi').value, ji: $('bz-ji').value, sq: $('bz-sq').value };
    if (!y || !m || !d || h === undefined) { $('bz-out').innerHTML = '<div class="err">请填写完整的出生年月日时。</div>'; return; }
    try {
      const p = paiPan(y, m, d, h, gender);
      window.__baziLast = p; // 供盲派八字卡复用本次四柱（输入跟着子平走）
      let out = buildOut(p, gender, liupai, focus, xiOpt);
      // 合婚：对方八字（性别自动取反）
      const oy = parseInt($('bz-o-year').value, 10), om = parseInt($('bz-o-month').value, 10), od = parseInt($('bz-o-day').value, 10), oh = parseInt($('bz-o-hour').value, 10);
      if (oy && om && od && oh !== undefined) {
        const pB = paiPan(oy, om, od, oh, 1 - gender);
        const hitsHh = jipanHeHun(p, pB, gender, 1 - gender);
        out += '<div class="card" style="border-color:rgba(223,180,255,.5);"><h3>合婚参考（命理探源·论男女合婚 625-628）</h3><div class="item-block"><span class="k">本人：' + p.gz.year + ' ' + p.gz.month + ' ' + p.gz.day + ' ' + p.gz.time + '（' + (gender === 1 ? '男' : '女') + ' · ' + wangShuai(p).verdict + '）　对方：' + pB.gz.year + ' ' + pB.gz.month + ' ' + pB.gz.day + ' ' + pB.gz.time + '（' + (gender === 1 ? '女' : '男') + ' · ' + wangShuai(pB).verdict + '）</span></div>' + hitsHh.map(x => '<div class="item-block"><span class="v" style="color:#dfb4ff;">· ' + esc(x) + '</span></div>').join('') + '<div class="muted">口径：夫星/子星按女方日主（原文"男家择妇看夫子二星"）；"盛/衰/重/不弱"按透干≥2、≤1 引擎阈值近似；五行损益仅按原文两例（男木盛取女金、女金盛取男火）及"余仿此"提示，未命中不编造。袁按：三元九宫上中下婚、骨髓破、铁扫帚、六害、八败等恶煞之说"毫无义理，万不可信"，不入判。</div></div>';
      }
      // 双生：长幼提示（608）
      if ($('bz-twins').checked) {
        out += '<div class="card" style="border-color:rgba(223,180,255,.5);"><h3>双生长幼提示</h3><div class="item-block"><span class="v" style="color:#dfb4ff;">' + esc(jipanShuangSheng(p)) + '</span></div></div>';
      }
      $('bz-out').innerHTML = out;
    } catch (e) {
      $('bz-out').innerHTML = '<div class="err">排盘异常：' + esc(e && e.message) + '</div>';
    }
  }

  function fillFocus() {
    const sel = $('bz-focus');
    if (!sel || !D || !D.duanyu12) return;
    sel.innerHTML = '<option value="">（不选断语类，只出排盘/旺衰/神煞/格局/金不换）</option>';
    for (const c of D.duanyu12) {
      const opt = document.createElement('option');
      opt.value = c.cat;
      opt.textContent = c.cat + '（' + c.items.length + ' 条）';
      sel.appendChild(opt);
    }
  }

  function init() {
    window.qianzhan.data().then((d) => {
      D = (d && d.bazi) || null;
      if (!D) { $('bz-out').innerHTML = '<div style="color:#d17a7a;">八字数据加载失败：' + JSON.stringify(d && Object.keys(d)) + '</div>'; return; }
      window.__baziData = D;
      fillFocus();
      $('bz-out').innerHTML = '<div class="muted" style="padding:30px;text-align:center;">填写出生年月日时与性别后点「排盘」。<br>断语素材：金不换骨髓歌 119 条 · 断语查表 12 类（含子节）· 三命通会时断 119 段 · 十二月支吉凶 12 月 · 何知章 8 项 · 赋 20 篇 · 十干宜忌/调候/提纲 · 八格喜忌 · 神煞 25 项 · 流年小限。</div>';
    }).catch((e) => {
      $('bz-out').innerHTML = '<div style="color:#d17a7a;">八字数据加载异常：' + e.message + '</div>';
    });
    const now = new Date();
    $('bz-year').value = now.getFullYear();
    $('bz-month').value = now.getMonth() + 1;
    $('bz-day').value = now.getDate();
    $('bz-hour').value = now.getHours();
    $('bz-go').addEventListener('click', baziGo);
    $('bz-now').addEventListener('click', () => {
      const n = new Date();
      $('bz-year').value = n.getFullYear();
      $('bz-month').value = n.getMonth() + 1;
      $('bz-day').value = n.getDate();
      $('bz-hour').value = n.getHours();
      baziGo();
    });
  }

  window.baziInit = init;
})();
