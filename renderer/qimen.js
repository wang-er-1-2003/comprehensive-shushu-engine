// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 奇门遁甲引擎（Tab 23）· 转盘/飞盘起局 + 十干克应查格 + 分类占断语
// 数据层 qimen.json（金函玉镜 / 奇门遁甲统宗）
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  let D = null; // qimen 数据

  // ── 常量 ──
  const GAN10 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const YI = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙']; // 六仪三奇（甲隐）
  const GONG_NAME = { 1: '坎', 2: '坤', 3: '震', 4: '巽', 5: '中', 6: '乾', 7: '兑', 8: '艮', 9: '离' };
  const GONG_WX = { 1: '水', 2: '土', 3: '木', 4: '木', 5: '土', 6: '金', 7: '金', 8: '土', 9: '火' };
  const STAR_BY_GONG = { 1: '天蓬', 2: '天芮', 3: '天冲', 4: '天辅', 5: '天禽', 6: '天心', 7: '天柱', 8: '天任', 9: '天英' };
  const MEN_BY_GONG = { 1: '休门', 2: '死门', 3: '伤门', 4: '杜门', 5: '中门', 6: '开门', 7: '惊门', 8: '生门', 9: '景门' };
  const MEN_WX = { '休门': '水', '生门': '土', '伤门': '木', '杜门': '木', '景门': '火', '死门': '土', '惊门': '金', '开门': '金' };
  const SHEN8 = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
  // 旬首：甲子戊 甲戌己 甲申庚 甲午辛 甲辰壬 甲寅癸
  const XUNSHOU = [
    { zhi: '子', yi: '戊' }, { zhi: '戌', yi: '己' }, { zhi: '申', yi: '庚' },
    { zhi: '午', yi: '辛' }, { zhi: '辰', yi: '壬' }, { zhi: '寅', yi: '癸' }
  ];
  // 地盘地支落宫（子坎1、丑寅艮8、卯震3、辰巳巽4、午离9、未申坤2、酉兑7、戌亥乾6）
  const ZHI_GONG = { 子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6 };
  // 阳遁12节 / 阴遁12节
  const YANG_JIE = ['冬至', '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种'];
  const YIN_JIE = ['夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪'];
  // 洛书宫排（九宫飞序）
  const GONG_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // 三奇到宫克应（数据键）
  const QI_DI = { 乙: '乙', 丙: '丙', 丁: '丁' };
  const DI8 = ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑'];

  // 简体化（引擎内小表）
  const SIMP = {
    '尅': '克', '尅應': '克应', '爲': '为', '於': '于', '與': '与', '萬': '万', '門': '门', '開': '开', '閉': '闭',
    '關': '关', '時': '时', '將': '将', '勝': '胜', '敗': '败', '戰': '战', '敵': '敌', '來': '来', '兩': '两',
    '無': '无', '從': '从', '報': '报', '蓋': '盖', '華': '华', '龍': '龙', '鳳': '凤', '鳥': '鸟', '蛇': '蛇',
    '螢': '萤', '龜': '龟', '鶴': '鹤', '雞': '鸡', '鵝': '鹅', '豬': '猪', '獼': '猕', '猴': '猴', '爭': '争',
    '鬪': '斗', '鬥': '斗', '網': '网', '羅': '罗', '經': '经', '書': '书', '圖': '图', '壘': '垒', '營': '营',
    '塵': '尘', '雲': '云', '霧': '雾', '風': '风', '雷': '雷', '電': '电', '聲': '声', '響': '响', '樂': '乐',
    '樓': '楼', '閣': '阁', '臺': '台', '階': '阶', '廟': '庙', '祠': '祠', '祭': '祭', '禱': '祷', '誦': '诵',
    '呪': '咒', '符': '符', '籙': '箓', '冊': '册', '錄': '录', '驗': '验', '應': '应', '賢': '贤', '聖': '圣',
    '禍': '祸', '災': '灾', '變': '变', '異': '异', '夢': '梦', '產': '产', '婦': '妇', '難': '难', '險': '险',
    '飭': '饬', '責': '责', '罰': '罚', '審': '审', '問': '问', '獄': '狱', '囚': '囚', '牽': '牵', '連': '连',
    '擊': '击', '斬': '斩', '殺': '杀', '喪': '丧', '哭': '哭', '泣': '泣', '怕': '怕', '驚': '惊', '駭': '骇',
    '後': '后', '發': '发', '歲': '岁', '學': '学', '斷': '断', '當': '当', '誰': '谁', '儀': '仪', '擊刑': '击刑'
  };
  function simp(s) {
    if (!s) return '';
    let out = '';
    for (const ch of s) out += SIMP[ch] || ch;
    return out;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── 数据辅助 ──
  function pickQimen() {
    return window.__qimenData || null;
  }
  function findFenlei(tag) {
    if (!D || !D.fenlei || !D.fenlei.items) return null;
    const t = D.fenlei.items.find((x) => x.t === tag || x.t_zh === tag);
    return t || null;
  }

  // ── 起局核心 ──
  // 输入：y/m/d/h（公历，h 为小时 0-23）；流派 caicha(拆补)/zhirun(置闰)；布法 zhuan(转盘)/fei(飞盘)
  function qiJu(y, m, d, h, liupai, bufa) {
    const lunar = Lunar.fromYmdHms(y, m, d, h, 0, 0);
    const yearGZ = lunar.getYearInGanZhi();
    const monthGZ = lunar.getMonthInGanZhi();
    const dayGZ = lunar.getDayInGanZhi();
    const timeGZ = lunar.getTimeInGanZhi();
    const dayGan = dayGZ[0], dayZhi = dayGZ[1];
    const timeGan = timeGZ[0], timeZhi = timeGZ[1];
    const zhiIdx = ZHI12.indexOf(timeZhi);
    // 时干 → 六仪/三奇名（甲为旬首隐入六仪）
    const shiganYi = timeGan === '甲' ? '戊' : (timeGan === '乙' ? '乙' : timeGan === '丙' ? '丙' : timeGan === '丁' ? '丁' : timeGan);

    // 1) 当前节气（最近交节）
    let curJie = null, curJieT = -1;
    const table = lunar.getJieQiTable();
    const now = new Date(y, m - 1, d, h, 0, 0).getTime();
    for (const n of Object.keys(table)) {
      const s = table[n];
      const t = new Date(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), 0).getTime();
      if (t <= now && t > curJieT) { curJie = n; curJieT = t; }
    }
    if (!curJie) curJie = '冬至';
    const dun = YANG_JIE.includes(curJie) ? '阳遁' : (YIN_JIE.includes(curJie) ? '阴遁' : (YANG_JIE.indexOf(curJie) >= 0 ? '阳遁' : '阴遁'));
    const jueqi = (D && D.jueqi) || {};
    const tri = (jueqi[dun] && jueqi[dun][curJie]) || null;

    // 2) 元（符头定元：子午卯酉上 / 寅申巳亥中 / 辰戌丑未下）
    const yuanMap = { 子: 0, 午: 0, 卯: 0, 酉: 0, 寅: 1, 申: 1, 巳: 1, 亥: 1, 辰: 2, 戌: 2, 丑: 2, 未: 2 };
    const yuanIdx = yuanMap[dayZhi] || 0;
    let ju = tri ? tri[yuanIdx] : 3;
    // 置闰：芒种/大雪后超神一旬以上 → 用上一节气之下元
    let note = '';
    if (liupai === 'zhirun') {
      // 交节日前推最近的甲/己日（符头）
      let jieSolar = table[curJie];
      let jd = new Date(jieSolar.getYear(), jieSolar.getMonth() - 1, jieSolar.getDay()).getTime();
      let days = 0, fuTou = 0;
      for (let k = 0; k < 20; k++) {
        const t = jd - k * 86400000;
        const dd = new Date(t);
        const ll = Lunar.fromYmd(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
        const g = ll.getDayInGanZhi()[0];
        if (g === '甲' || g === '己') { fuTou = k; break; }
      }
      // 符头早于交节 fuTou 天：超神 = fuTou（符头先到）
      if (fuTou >= 10 && (curJie === '芒种' || curJie === '大雪')) {
        // 置闰：用上一节气下元
        const jieList = dun === '阳遁' ? YANG_JIE : YIN_JIE;
        const idx = jieList.indexOf(curJie);
        const prev = jieList[(idx - 1 + 12) % 12];
        const prevTri = jueqi[dun] && jueqi[dun][prev];
        ju = prevTri ? prevTri[2] : ju;
        note = '置闰：' + curJie + '后符头先至一旬以上（超神），用上一节气『' + prev + '』下元局数';
      } else {
        note = fuTou > 0 ? ('拆补（接气）：符头迟交节 ' + fuTou + ' 日，按当前节气起局') : '拆补（接气）：交节后起局';
      }
    } else {
      note = '拆补：交节后即按『' + curJie + '』三元起局';
    }

    // 3) 布地盘奇仪（阳遁顺仪逆奇 / 阴遁逆仪顺奇）
    const diPan = {}; // 宫 → 奇仪
    const isYang = dun === '阳遁';
    // 戊从局数宫起：阳遁顺布（戊己庚辛壬癸丁丙乙），阴遁逆布
    let start = ju;
    for (let k = 0; k < 9; k++) {
      let gong = isYang ? wrap1(start + k) : wrap1(start - k);
      diPan[gong] = YI[k];
    }

    // 4) 旬首 & 值符/值使
    // 旬首地支 = 时支逆推时干距甲之位（时干 index 即旬首支距时支之位数）
    const ganIdx = GAN10.indexOf(timeGan); // 0=甲 … 9=癸（甲隐戊）
    const xsZhi = ZHI12[(zhiIdx - ganIdx + 12) % 12];
    let xun = null;
    for (const xs of XUNSHOU) {
      if (xs.zhi === xsZhi) { xun = xs; break; }
    }
    if (!xun) xun = XUNSHOU[0];
    const xunYi = xun.yi;            // 旬首六仪
    const xunGong = parseInt(Object.keys(diPan).find((g) => diPan[g] === xunYi), 10) || 0; // 旬首仪地盘宫
    const zhiFuStar = STAR_BY_GONG[xunGong];     // 值符星
    const zhiShiMen = MEN_BY_GONG[xunGong];      // 值使门

    // 5) 时干宫（地盘时干所在宫）
    const shiGanGong = Object.keys(diPan).find((g) => diPan[g] === shiganYi) | 0;
    // 时支宫
    const shiZhiGong = ZHI_GONG[timeZhi];

    // 6) 天盘（转盘 / 飞盘）
    const rot = (shiGanGong - xunGong + 9) % 9; // 阳遁顺转量；阴遁反向
    function wrap1(n) { return ((n - 1 + 9) % 9) + 1; }
    const tianPan = {};   // 宫 → 星
    const tianYi = {};    // 宫 → 天盘奇仪
    if (bufa === 'fei') {
      // 飞盘：值符加时干宫，余按宫序顺(阳)/逆(阴)依次飞布
      const order = isYang ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, -1, -2, -3, -4, -5, -6, -7, -8];
      // 星按洛书宫序从时干宫起
      let seq = [];
      for (let k = 0; k < 9; k++) seq.push(wrap1(shiGanGong + (isYang ? k : -k)));
      // 星表：以值符星为首，其余按洛书宫序
      const stars = [zhiFuStar];
      for (let g2 = 1; g2 <= 9; g2++) {
        if (g2 === xunGong) continue;
        stars.push(STAR_BY_GONG[g2]);
      }
      for (let k = 0; k < 9; k++) tianPan[seq[k]] = stars[k];
      // 奇仪：值符（旬首仪）加时干宫，其余按宫序
      const yis = [xunYi];
      for (const yv of YI) if (yv !== xunYi) yis.push(yv);
      for (let k = 0; k < 9; k++) tianYi[seq[k]] = yis[k];
    } else {
      // 转盘：天盘星[r] = 地盘星[wrap1(r ∓ rot)]；天盘奇仪同转
      for (let r = 1; r <= 9; r++) {
        const srcG = isYang ? wrap1(r - rot) : wrap1(r + rot);
        tianPan[r] = STAR_BY_GONG[srcG];
        tianYi[r] = diPan[srcG];
      }
    }

    // 7) 八门（值使加时支；转盘旋转 / 飞盘飞布）
    const menPan = {}; // 宫 → 门
    if (bufa === 'fei') {
      const seq = [];
      for (let k = 0; k < 9; k++) seq.push(wrap1(shiZhiGong + (isYang ? k : -k)));
      const mens = [zhiShiMen];
      for (let g2 = 1; g2 <= 9; g2++) if (g2 !== xunGong) mens.push(MEN_BY_GONG[g2]);
      for (let k = 0; k < 9; k++) menPan[seq[k]] = mens[k];
    } else {
      const rot2 = (shiZhiGong - xunGong + 9) % 9;
      for (let r = 1; r <= 9; r++) {
        const srcG = isYang ? wrap1(r - rot2) : wrap1(r + rot2);
        menPan[r] = MEN_BY_GONG[srcG];
      }
    }

    // 8) 八神（值符落时干宫，阳顺阴逆）
    const shenPan = {}; // 宫 → 神
    for (let k = 0; k < 8; k++) {
      const g = bufa === 'fei' ? wrap1(shiGanGong + (isYang ? k : -k)) : wrap1(shiGanGong + (isYang ? k : -k));
      shenPan[g] = SHEN8[k];
    }

    // 9) 值符宫 = 时干宫
    const zhiFuGong = shiGanGong;

    // 10) 反吟/伏吟判定
    const fanYin = (tianPan[shiGanGong] === STAR_BY_GONG[wrap1(shiGanGong + (isYang ? 4 : -4))]) || (wrap1(shiGanGong - rot) === xunGong && !(bufa === 'fei') && false);
    const fuYin = (tianYi[shiGanGong] === diPan[shiGanGong]) && (xunYi === shiganYi ? tianPan[shiGanGong] === STAR_BY_GONG[shiGanGong] : false);

    return {
      lunar, yearGZ, monthGZ, dayGZ, timeGZ, dun, curJie, ju, yuanIdx, note, liupai, bufa,
      diPan, tianPan, tianYi, menPan, shenPan,
      xunYi, xunGong, zhiFuStar, zhiShiMen, shiGanGong, shiZhiGong, zhiFuGong,
      fanYin, fuYin, isYang,
    };
  }

  // ── 查格 ──
  function judgeGe(R) {
    const hits = []; // {ge, text, gong, ji}
    // 1) 十干克应：天盘干 vs 地盘干，每宫
    const shigan = (D && D.shigan) || {};
    for (let r = 1; r <= 9; r++) {
      const tg = R.tianYi[r], dg = R.diPan[r];
      if (!tg || !dg) continue;
      const cell = shigan[tg] && shigan[tg][dg];
      if (cell && cell.name) {
        hits.push({ ge: cell.name, text: (cell.text_zh || cell.text), gong: r, ji: isJiGe(cell.name), src: '十干克应' });
      }
    }
    // 2) 值符宫主断（取该宫克应为主）
    const zfG = R.zhiFuGong;
    const zfCell = shigan[R.tianYi[zfG]] && shigan[R.tianYi[zfG]][R.diPan[zfG]];
    // 3) 特殊格（岁/月/日/时格、伏宫、飞宫、飞干、五不遇、门迫、三奇入墓、六仪击刑）
    // 日干宫 / 月干宫 / 岁干宫
    const dayGan = R.dayGZ[0], monthGan = R.monthGZ[0], yearGan = R.yearGZ[0];
    const gan2Yi = (g) => (g === '甲' ? '戊' : (g === '乙' ? '乙' : g === '丙' ? '丙' : g === '丁' ? '丁' : g));
    const dayYi = gan2Yi(dayGan), monthYi = gan2Yi(monthGan), yearYi = gan2Yi(yearGan);
    const dayGong = Object.keys(R.diPan).find((g) => R.diPan[g] === dayYi) | 0;
    const monthGong = Object.keys(R.diPan).find((g) => R.diPan[g] === monthYi) | 0;
    const yearGong = Object.keys(R.diPan).find((g) => R.diPan[g] === yearYi) | 0;
    const shiGanYi = gan2Yi(R.timeGZ[0]);
    const shiGanGong2 = R.shiGanGong;
    // 庚加年月日时干 → 岁格/月格/日格/时格（庚临某干）
    const gGong = Object.keys(R.diPan).find((g) => R.diPan[g] === '庚') | 0;
    if (R.tianYi[gGong] === '庚' && R.diPan[gGong] === dayYi && dayGan !== '庚' && dayGan !== '甲') {
      hits.push({ ge: '日格', text: '庚临日干（日干宫' + GONG_NAME[gGong] + '）——主对日干所主之人事有阻格', gong: gGong, ji: false, src: '四十格' });
    }
    if (R.tianYi[gGong] === '庚' && R.diPan[gGong] === monthYi && monthGan !== '庚') {
      hits.push({ ge: '月格', text: '庚临月干（月干宫' + GONG_NAME[gGong] + '）', gong: gGong, ji: false, src: '四十格' });
    }
    if (R.tianYi[gGong] === '庚' && R.diPan[gGong] === yearYi && yearGan !== '庚') {
      hits.push({ ge: '岁格', text: '庚临岁干（年干宫' + GONG_NAME[gGong] + '）', gong: gGong, ji: false, src: '四十格' });
    }
    // 时格：庚临时干三奇（庚加时干）
    if (R.tianYi[shiGanGong2] === '庚' && R.diPan[shiGanGong2] === shiGanYi && shiGanYi !== '庚') {
      hits.push({ ge: '时格', text: '庚临时干（时干宫' + GONG_NAME[shiGanGong2] + '）', gong: shiGanGong2, ji: false, src: '四十格' });
    }
    // 伏宫：庚临值符（天盘庚在值符宫）
    if (R.tianYi[R.zhiFuGong] === '庚') {
      hits.push({ ge: '伏宫', text: '庚临值符宫（值符宫' + GONG_NAME[R.zhiFuGong] + '）——主所谋阻隔难成', gong: R.zhiFuGong, ji: false, src: '四十格' });
    }
    // 飞宫：值符临庚（天盘值符仪落庚宫）
    if (R.tianYi[gGong] === R.xunYi) {
      hits.push({ ge: '飞宫格', text: '值符临庚（庚宫' + GONG_NAME[gGong] + '）', gong: gGong, ji: false, src: '四十格' });
    }
    // 飞干：日干临庚（天盘日干仪落庚宫）
    if (R.tianYi[gGong] === dayYi && dayGan !== '甲' && dayGan !== '庚') {
      hits.push({ ge: '飞干格', text: '日干临庚（庚宫' + GONG_NAME[gGong] + '）', gong: gGong, ji: false, src: '四十格' });
    }
    // 五不遇：时干克日干
    const ke = (a, b) => ({ '甲乙': true, '甲戊': true, '乙庚': true, '丙辛': true, '丁壬': true, '戊癸': true, '庚丙': true, '辛丁': true, '壬己': true, '癸戊': true }[a + b]);
    if (ke(R.timeGZ[0], dayGan)) {
      hits.push({ ge: '五不遇格', text: '时干『' + R.timeGZ[0] + '』克日干『' + dayGan + '』，龙不精，日月损光明——诸事不宜强行', gong: R.shiGanGong, ji: false, src: '四十格' });
    }
    // 门迫
    const ms = R.menPan[R.zhiFuGong];
    if (ms && MEN_WX[ms] && R.zhiFuGong !== 5) {
      const mw = MEN_WX[ms], gw = GONG_WX[R.zhiFuGong];
      if (ke5(mw, gw)) {
        hits.push({ ge: '门迫', text: ms + '（' + mw + '）克宫（' + gw + '）——门迫主所谋受制', gong: R.zhiFuGong, ji: false, src: '门迫' });
      }
    }
    // 三奇入墓：乙落坤2 丙落乾6 丁落艮8
    for (const q of ['乙', '丙', '丁']) {
      const qg = Object.keys(R.tianYi).find((g) => R.tianYi[g] === q) | 0;
      const mu = (q === '乙' && qg === 2) || (q === '丙' && qg === 6) || (q === '丁' && qg === 8);
      if (mu) hits.push({ ge: '三奇入墓', text: q + '奇入墓（' + GONG_NAME[qg] + '宫）——' + q + '奇之力被困，谋为暗淡', gong: qg, ji: false, src: '四十格' });
    }
    // 六仪击刑：值符六仪落刑宫
    const xingMap = { 戊: 3, 己: 2, 庚: 8, 辛: 9, 壬: 4, 癸: 4 };
    if (xingMap[R.xunYi] && xingMap[R.xunYi] === R.zhiFuGong) {
      hits.push({ ge: '六仪击刑', text: '旬首六仪『' + R.xunYi + '』落' + GONG_NAME[R.zhiFuGong] + '宫（击刑宫）——百凶俱集，谋为多阻', gong: R.zhiFuGong, ji: false, src: '四十格' });
    }
    // 天网四张 / 地罗遮蔽：天盘壬癸临时干（值符宫天盘 = 旬首仪 = 壬/癸 且值符宫为时干宫）
    if (R.xunYi === '癸' && R.zhiFuGong === R.shiGanGong) {
      hits.push({ ge: '天网四张', text: '六癸临时干——如天网四张，走投无路，利静不利动', gong: R.zhiFuGong, ji: false, src: '四十格' });
    }
    if (R.xunYi === '壬' && R.zhiFuGong === R.shiGanGong) {
      hits.push({ ge: '地罗遮蔽', text: '六壬临时干——如地罗遮障，不能前进', gong: R.zhiFuGong, ji: false, src: '四十格' });
    }
    // 反吟/伏吟（值符落宫视角，古籍口径：统宗"反吟星加对宫/伏吟本星加本宫"）
    // 另说（全盘级，现代教材口径）：八宫天干全同=伏吟、八宫天干全落对冲=反吟（玄鉴/回测实证修正）。两说并存照录。
    const fullFuYin = (() => { for (let r = 1; r <= 9; r++) { if (r === 5) continue; if (R.tianYi[r] !== R.diPan[r]) return false; } return true; })();
    const oppMap = { 1: 9, 9: 1, 3: 7, 7: 3, 4: 2, 2: 4, 8: 6, 6: 8 };
    const fullFanYin = (() => { for (let r = 1; r <= 9; r++) { if (r === 5 || !R.diPan[r] || !R.tianYi[r]) continue; if (R.tianYi[r] !== R.diPan[oppMap[r]]) return false; } return true; })();
    const fullNote = '另说（全盘级口径）：八宫天干全同=' + (fullFuYin ? '是' : '否') + '，八宫全落对冲=' + (fullFanYin ? '是' : '否') + '——两说并存照录';
    if (R.fuYin) hits.push({ ge: '伏吟', text: '值符加本宫，天盘与地盘同（伏吟）——万事闭塞，静守为吉。' + fullNote, gong: R.zhiFuGong, ji: false, src: '四十格' });
    if (R.fanYin) hits.push({ ge: '反吟', text: '值符加对宫（反吟）——事多反复，谋为中变。' + fullNote, gong: R.zhiFuGong, ji: false, src: '四十格' });

    // 去重（同名同宫）
    const seen = new Set();
    const uniq = hits.filter((h) => {
      const k = h.ge + '|' + h.gong;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return { main: zfCell, hits: uniq };
  }

  function ke5(a, b) { // 五行生克：a 克 b？
    const keMap = { '金木': true, '木土': true, '土水': true, '水火': true, '火金': true };
    return !!keMap[a + b];
  }
  const JI_GE = new Set(['龙回首', '青龙返首', '鸟跌穴', '飞鸟跌穴', '天遁', '地遁', '人遁', '云遁', '风遁', '龙遁', '虎遁', '神遁', '鬼遁', '三奇得使', '玉女守门', '青龙合灵', '青龙耀明', '青龙华盖', '青龙转光', '青龙焕彩', '青龙入户', '青龙曳光', '青龙入堂', '青龙飞腾', '青龙临门', '青龙折足', '天乙会合', '贵人升堂', '贵人登坛', '日月并行', '日月齐明', '小蛇化龙', '螣蛇化龙', '蛇化龙', '太白入荧', '火入金乡', '太白同宫', '太白擒蛇', '螣蛇入狱', '凶蛇入狱']);
  function isJiGe(name) {
    return JI_GE.has(name);
  }

  // ── 断语拼装 ──
  function buildSummary(R) {
    const out = [];
    // A. 局盘摘要（固定在盘下方，不随断语滚动）
    out.push('<h3>局盘摘要</h3>');
    out.push('<div class="qm-sum">' + esc(R.timeGZ) + '时 · ' + R.dun + '·' + R.curJie + ' ' + R.ju + '局 · ' + (R.bufa === 'fei' ? '飞盘' : '转盘') + ' · ' + (R.liupai === 'zhirun' ? '置闰' : '拆补') + '</div>');
    out.push('<div class="qm-sum muted">' + esc(R.note) + '</div>');
    out.push('<div class="qm-sum muted">节气口径：以 24 节气全表取最近交节定局（含十二中气；若只用十二节会在中气时段错档，已规避）。</div>');
    out.push('<div class="qm-sum">值符：<b>' + esc(R.zhiFuStar) + '</b>（落' + GONG_NAME[R.zhiFuGong] + '宫）　值使：<b>' + esc(R.zhiShiMen) + '</b>（落' + GONG_NAME[R.shiZhiGong] + '宫）　旬首：六' + esc(R.xunYi) + '</div>');
    return out.join('');
  }

  function buildVerdict(R, judge, shi) {
    const out = [];
    // B. 主断（值符宫克应）
    out.push('<h3>值符宫主断（' + GONG_NAME[R.zhiFuGong] + '宫：' + esc(R.tianYi[R.zhiFuGong]) + '加' + esc(R.diPan[R.zhiFuGong]) + '）</h3>');
    if (judge.main && judge.main.name) {
      out.push('<div class="qm-verdict ' + (isJiGe(judge.main.name) ? 'ji' : 'xiong') + '"><b>『' + esc(judge.main.name) + '』</b>' + (isJiGe(judge.main.name) ? '（吉格）' : '（凶格）') + '<br>' + esc(simp(judge.main.text)) + '</div>');
    } else {
      out.push('<div class="muted">值符宫无克应专格（' + esc(R.tianYi[R.zhiFuGong]) + '加' + esc(R.diPan[R.zhiFuGong]) + '），以全局格局参断。</div>');
    }
    // C. 命中格局清单（除主断外）
    const others = judge.hits.filter((h) => !(h.ge === judge.main.name && h.gong === R.zhiFuGong && judge.main));
    if (others.length) {
      out.push('<h3>全局格局（命中 ' + others.length + ' 格）</h3>');
      for (const h of others) {
        out.push('<div class="qm-verdict ' + (h.ji ? 'ji' : 'xiong') + '"><b>『' + esc(h.ge) + '』</b>（' + GONG_NAME[h.gong] + '宫 · ' + h.src + '）' + (h.ji ? '（吉）' : '（凶）') + '<br>' + esc(simp(h.text)) + '</div>');
      }
    }
    // D. 三遁九遁（原文条件 + 详条）
    const dunHits = judgeDun(R);
    if (dunHits.length) {
      out.push('<h3>三遁九遁</h3>');
      for (const d of dunHits) {
        out.push('<div class="qm-verdict ji"><b>『' + esc(d.name) + '』</b>（' + esc(d.cond) + '）<br>' + esc(d.desc) + '</div>');
      }
    }
    // D2. 三诈五假（可机判：开休生+三奇+地盘神 / 五假门+奇+神）
    const szHits = judgeSanZhaWuJia(R);
    if (szHits.length) {
      out.push('<h3>三诈五假</h3>');
      for (const d of szHits) {
        out.push('<div class="qm-verdict ji"><b>『' + esc(d.name) + '』</b>（' + esc(d.cond) + '）<br>' + esc(d.desc) + '</div>');
      }
    }
    // E. 星门所主
    const jx = (D && D.jiuxing) || {};
    const star = jx[R.zhiFuStar];
    out.push('<h3>值符星·' + R.zhiFuStar + '所主</h3>');
    if (star) {
      out.push('<div class="qm-si">' + esc(simp(star.zhu)) + '</div>');
      const shiIdx = R.timeGZ[1];
      if (star.shi && star.shi[shiIdx]) {
        out.push('<div class="qm-si">' + esc(R.timeGZ[1]) + '时克应：' + esc(simp(star.shi[shiIdx])) + '</div>');
      }
    }
    const bm = (D && D.bamen) || {};
    const men = bm[R.zhiShiMen];
    if (men && men.zhu) {
      out.push('<h3>值使门·' + R.zhiShiMen + '所主</h3>');
      out.push('<div class="qm-si">' + esc(simp(men.zhu)) + '</div>');
    }
    // E2. 值使门静应克应（门加临天盘/地盘干 → 命中条）
    const kyHits = judgeZhiShiKeYing(R);
    if (kyHits.length) {
      out.push('<h3>值使门克应（' + R.zhiShiMen + '落' + GONG_NAME[R.shiZhiGong] + '宫加临）</h3>');
      for (const h of kyHits) {
        out.push('<div class="qm-si"><b>' + esc(h.src) + '</b>：' + esc(h.text) + '</div>');
      }
    }
    // E3. 八门主事 + 类神象意（值使门主事 / 六神落宫 / 值符宫八卦 / 时支）
    const lxHits = judgeLeiXing(R);
    if (lxHits.length) {
      out.push('<h3>八门主事与类神象意</h3>');
      for (const h of lxHits) {
        out.push('<div class="qm-si"><b>' + esc(h.name) + '</b>' + (h.gong ? '（' + GONG_NAME[h.gong] + '宫）' : '') + '：' + esc(h.text) + '</div>');
      }
    }
    // E4. 八门宜忌（古籍原文照录：奇门遁甲统宗·烟波钓叟歌；三吉开休生/三凶死惊伤/杜景中平——杜景不作凶门）
    out.push('<h3>八门宜忌（古籍原文）</h3>');
    out.push('<div class="qm-si">八门若遇休开生，诸事遇之总称情。伤宜捕猎终须获，杜好逃遮更隐形。景士投书与破阵，死唯游猎葬埋宜。试问惊门何所益，捕捉公庭较是非。——《奇门遁甲统宗》烟波钓叟歌（照录）</div>');
    out.push('<div class="qm-si muted">通行断法：三吉门=开/休/生（诸事称情）；三凶门=死/惊/伤；杜/景为中平（各有所宜，不作凶门）。</div>');
    // F. 三奇到宫克应
    const sq = (D && D.sanqi) || {};
    const sqHits = [];
    for (const q of ['乙', '丙', '丁']) {
      const qg = Object.keys(R.tianYi).find((g) => R.tianYi[g] === q) | 0;
      if (qg && sq[q] && sq[q][GONG_NAME[qg]]) {
        sqHits.push({ q, gong: qg, text: sq[q][GONG_NAME[qg]] });
      }
    }
    if (sqHits.length) {
      out.push('<h3>三奇到宫克应</h3>');
      for (const h of sqHits) {
        out.push('<div class="qm-si"><b>' + h.q + '奇落' + GONG_NAME[h.gong] + '宫</b>：' + esc(simp(h.text)) + '</div>');
      }
    }
    // G. 分类占
    if (shi) {
      const fl = findFenlei(shi);
      out.push('<h3>分类占 · ' + esc(shi) + '</h3>');
      if (fl) {
        // 古籍机判层：本类规则机判命中 + 活步骤红字（未命中不假装）
        const gjFen = (D && D.guji_cat && D.guji_cat.fenlei) || [];
        const gjCat = gjFen.find(c => c.name === shi || (fl && (c.name === fl.t || c.name === fl.t_zh)));
        if (gjCat) {
          const gHits = (typeof window.qmGuJiCatHits === 'function') ? (window.qmGuJiCatHits(gjCat, R, shi) || []) : [];
          if (gHits.length) {
            out.push('<div style="color:#8fbf8f;font-weight:700;margin:4px 0;">机判命中 ' + gHits.length + ' 条（按本局盘象）</div>');
            for (const x of gHits) out.push('<div class="qm-si" style="border-left-color:#8fbf8f;"><b>' + esc(x.cond) + '</b>——' + esc(simp(x.duan)) + '<div style="font-size:11px;color:var(--tx3);">' + esc(x.src) + '</div></div>');
          } else {
            out.push('<div class="muted">本局未命中「' + esc(shi) + '」的机判规则——未命中不假装，可参考下方活步骤与原文。</div>');
          }
          for (const hu of (gjCat.huobu || [])) {
            out.push('<div style="margin:8px 0 2px;color:#e06c6c;font-weight:800;">活步骤 · ' + esc(hu.title) + '（需人工对照局盘逐步判断）</div>' +
              '<div style="color:#e08a8a;line-height:1.9;font-weight:700;">' + hu.steps.map((st, k) => (k + 1) + '. ' + esc(simp(st))).join('<br>') + '</div>');
          }
        }
        out.push('<div class="qm-si">' + esc(simp(fl.text)) + '</div>');
      } else {
        out.push('<div class="muted">『' + esc(shi) + '』原书未设专条，以全局格局与星门参断。</div>');
      }
    }
    // H. 兵事 · 三胜地五不击（纯宫位机判）
    const bingHits = judgeBingShi(R);
    if (bingHits.length) {
      out.push('<h3>兵事 · 三胜地五不击</h3>');
      for (const h of bingHits) {
        out.push('<div class="qm-si"><b>' + esc(h.name) + '</b>：' + esc(h.cond) + '<br>' + esc(h.desc) + '</div>');
      }
    }
    // I. 应期
    out.push('<h3>应期</h3>');
    out.push('<div class="qm-si muted">以盘中所断之应验为期：十干克应、三奇到宫、九星时克应条内所载年月日数即应期参考；若另见庚加岁/月/日/时干之格，则依所临干支推期。</div>');
    return out.join('');
  }

  // 三遁九遁判定（原文条件：扫九宫 门 + 奇 + 神 + 地盘干；命中附 jiudun_xiang 详条）
  function judgeDun(R) {
    const res = [];
    const jd = (D && D.jiudun_xiang) || {};
    const detail = (n) => (jd[n] ? jd[n] : '');
    const findMen = (n) => Object.keys(R.menPan).find((g) => R.menPan[g] === n) | 0;
    const findQi = (q) => Object.keys(R.tianYi).find((g) => R.tianYi[g] === q) | 0;
    const shengG = findMen('生门'), kaiG = findMen('开门'), xiuG = findMen('休门');
    const bG = findQi('乙'), cG = findQi('丙'), dG = findQi('丁');
    const sanMen = (g) => !!g && (g === shengG || g === kaiG || g === xiuG);
    // 天遁：开休生 + 丙奇 + 地盘丁；或 开休生+丙 临九地/太阴
    if (sanMen(cG) && R.diPan[cG] === '丁') res.push({ name: '天遁', cond: '开休生临丙奇加地盘丁（' + GONG_NAME[cG] + '宫）', desc: detail('天遁') });
    else if (sanMen(cG) && (R.shenPan[cG] === '九地' || R.shenPan[cG] === '太阴')) res.push({ name: '天遁', cond: '开休生临丙奇合' + R.shenPan[cG] + '（' + GONG_NAME[cG] + '宫）', desc: detail('天遁') });
    // 地遁：开休生 + 乙奇 + 地盘六合/九地/太阴
    if (sanMen(bG) && ['六合', '九地', '太阴'].indexOf(R.shenPan[bG]) >= 0) res.push({ name: '地遁', cond: '开休生临乙奇合' + R.shenPan[bG] + '（' + GONG_NAME[bG] + '宫）', desc: detail('地遁') });
    // 人遁：开休生 + 三奇 + 地盘六合
    for (const qg of [bG, cG, dG]) {
      if (sanMen(qg) && R.shenPan[qg] === '六合') { res.push({ name: '人遁', cond: '开休生临' + R.tianYi[qg] + '奇合六合（' + GONG_NAME[qg] + '宫）', desc: detail('人遁') }); break; }
    }
    // 风遁：开休生 + 乙奇 + 地盘辛 + 巽四宫
    if (sanMen(bG) && R.diPan[bG] === '辛' && bG === 4) res.push({ name: '风遁', cond: '开休生临乙奇加地盘辛于巽宫', desc: detail('风遁') });
    // 云遁：开休生 + 乙奇 + 地盘辛
    if (sanMen(bG) && R.diPan[bG] === '辛') res.push({ name: '云遁', cond: '开休生临乙奇加地盘辛（' + GONG_NAME[bG] + '宫）', desc: detail('云遁') });
    // 龙遁：开休生临甲辰壬/六合于坎一宫
    if (sanMen(1) && (R.tianYi[1] === '壬' || R.tianYi[1] === '癸')) res.push({ name: '龙遁', cond: '开休生临' + R.tianYi[1] + '于坎宫', desc: detail('龙遁') });
    // 虎遁：开门 + 甲申庚 + 兑七宫
    if (kaiG === 7 && R.tianYi[7] === '庚') res.push({ name: '虎遁', cond: '开门临庚于兑宫', desc: detail('虎遁') });
    // 神遁：开门 + 乙奇 + 九天 + 乾六宫
    if (kaiG === 6 && R.tianYi[6] === '乙' && R.shenPan[6] === '九天') res.push({ name: '神遁', cond: '开门临乙奇合九天于乾宫', desc: detail('神遁') });
    // 鬼遁：休门 + 六辛 + 地盘丁 + 艮八宫
    if (xiuG === 8 && R.tianYi[8] === '辛' && R.diPan[8] === '丁') res.push({ name: '鬼遁', cond: '休门临辛加地盘丁于艮宫', desc: detail('鬼遁') });
    return res;
  }

  // 三诈五假（原文条件：开休生+三奇+地盘太阴/六合/九地；五假 景/杜/伤/惊/死门+奇+神）
  function judgeSanZhaWuJia(R) {
    const res = [];
    const sz = (D && D.sanzha_wujia) || {};
    const wj = sz['五假'] || {};
    const wjText = (n) => (wj[n] && wj[n][0]) ? wj[n][0] : '';
    const qi3 = ['乙', '丙', '丁'], qisi = ['丁', '己', '癸'];
    for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const men = R.menPan[g], tq = R.tianYi[g], sp = R.shenPan[g];
      if (['开门', '休门', '生门'].indexOf(men) >= 0 && qi3.indexOf(tq) >= 0) {
        if (sp === '太阴') res.push({ name: '真诈', cond: men.replace('门', '') + '门合' + tq + '奇临太阴（' + GONG_NAME[g] + '宫）', desc: (sz['三诈'] && sz['三诈']['真诈'] && sz['三诈']['真诈'][0]) || '利施恩、隐遁、祈祷、求仙' });
        if (sp === '六合') res.push({ name: '休诈', cond: men.replace('门', '') + '门合' + tq + '奇临六合（' + GONG_NAME[g] + '宫）', desc: (sz['三诈'] && sz['三诈']['休诈'] && sz['三诈']['休诈'][0]) || '宜合药、法符、祈神、禳灾、祭祀' });
        if (sp === '九地') res.push({ name: '重诈', cond: men.replace('门', '') + '门合' + tq + '奇临九地（' + GONG_NAME[g] + '宫）', desc: (sz['三诈'] && sz['三诈']['重诈'] && sz['三诈']['重诈'][0]) || '宜收降、添兵、进人口、纳财' });
      }
      if (men === '景门' && qi3.indexOf(tq) >= 0 && sp === '九天') res.push({ name: '天假', cond: '景门合' + tq + '奇临九天（' + GONG_NAME[g] + '宫）', desc: wjText('天假') || '利进谒、干贵、上书献策' });
      if (men === '杜门' && qisi.indexOf(tq) >= 0 && sp === '九地') res.push({ name: '地假', cond: '杜门合' + tq + '临九地（' + GONG_NAME[g] + '宫）', desc: wjText('地假') });
      if (men === '伤门' && qisi.indexOf(tq) >= 0 && sp === '太阴') res.push({ name: '地假', cond: '伤门合' + tq + '临太阴（' + GONG_NAME[g] + '宫）', desc: wjText('地假') });
      if (men === '伤门' && qisi.indexOf(tq) >= 0 && sp === '九地') res.push({ name: '神假', cond: '伤门合' + tq + '临九地（' + GONG_NAME[g] + '宫）', desc: wjText('神假') || '利埋名、藏身、遁迹' });
      if (men === '惊门' && sp === '九天') res.push({ name: '人假', cond: '惊门临九天（' + GONG_NAME[g] + '宫）', desc: wjText('人假') || '利捕逃亡、追捕' });
      if (men === '死门' && qisi.indexOf(tq) >= 0 && sp === '九地') res.push({ name: '鬼假', cond: '死门合' + tq + '临九地（' + GONG_NAME[g] + '宫）', desc: wjText('鬼假') || '利超度、破敌、偷营' });
    }
    return res;
  }

  // 值使门静应克应（值使门加临天盘干/地盘干 → bamen[门].jingying 命中；戊→加甲戊）
  function judgeZhiShiKeYing(R) {
    const res = [];
    const bm = (D && D.bamen) || {};
    const men = bm[R.zhiShiMen];
    if (!men || !men.jingying) return res;
    const g = R.shiZhiGong;
    const tq = R.tianYi[g], dq = R.diPan[g];
    const keyOf = (q) => (q === '戊' ? '加甲戊' : '加' + q);
    const add = (q, src) => {
      if (!q) return;
      const t = men.jingying[keyOf(q)];
      if (t && !res.some((x) => x.src === src)) res.push({ src, q, text: t });
    };
    add(tq, '天盘' + tq);
    add(dq, '地盘' + dq);
    return res;
  }

  // 八门主事 + 类神象意（值使门主事 / 六神落宫 / 值符宫八卦类神 / 时支类神）
  function judgeLeiXing(R) {
    const res = [];
    const lx = (D && D.leixing_ku) || {};
    const zhu = lx['八门主事'] || [];
    const menShort = R.zhiShiMen.replace('门', '');
    const zt = zhu.find((x) => x.indexOf(menShort + '：') === 0);
    if (zt) res.push({ name: '八门主事·' + R.zhiShiMen, text: zt });
    const liu = lx['六神尅应'] || [];
    for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const sp = R.shenPan[g];
      if (['螣蛇', '朱雀', '勾陈', '白虎', '玄武'].indexOf(sp) >= 0) {
        const t = liu.find((x) => x.indexOf(sp + '：') === 0);
        if (t) res.push({ name: '六神类神·' + sp, gong: g, text: t });
      }
    }
    const bagua = lx['八卦类神'] || [];
    const gname = GONG_NAME[R.zhiFuGong];
    const bg = bagua.find((x) => x.indexOf(gname + '：') === 0);
    if (bg) res.push({ name: '值符宫八卦类神·' + gname, gong: R.zhiFuGong, text: bg });
    const zhi = lx['地支尅应'] || [];
    const sz = R.timeGZ[1];
    const zt2 = zhi.find((x) => x.indexOf(sz + '：') === 0);
    if (zt2) res.push({ name: '时支' + sz + '类神', text: zt2 });
    return res;
  }

  // 兵事 · 三胜地五不击（天乙/九天/生门/九地/直使宫位纯判定；阴遁天乙以旬首地盘宫计）
  function judgeBingShi(R) {
    const res = [];
    const isYin = R.dun.indexOf('阴') >= 0;
    const tianYiG = isYin ? (R.xunGong || R.zhiFuGong) : R.zhiFuGong;
    const jiuTianG = Object.keys(R.shenPan).find((g) => R.shenPan[g] === '九天') | 0;
    const shengMenG = Object.keys(R.menPan).find((g) => R.menPan[g] === '生门') | 0;
    const jiuDiG = Object.keys(R.shenPan).find((g) => R.shenPan[g] === '九地') | 0;
    const zhiShiG = R.shiZhiGong;
    res.push({ name: '三胜地', cond: '第一胜 天乙' + GONG_NAME[tianYiG] + '宫 · 第二胜 九天' + GONG_NAME[jiuTianG] + '宫 · 第三胜 生门' + GONG_NAME[shengMenG] + '宫', desc: '背亭亭向天门一胜，背月建二胜，背生击死三胜。上将引兵从生门击死门，百战百胜。' });
    res.push({ name: '五不击', cond: '不击 天乙' + GONG_NAME[tianYiG] + '宫 / 九天' + GONG_NAME[jiuTianG] + '宫 / 生门' + GONG_NAME[shengMenG] + '宫 / 九地' + GONG_NAME[jiuDiG] + '宫 / 直使' + GONG_NAME[zhiShiG] + '宫', desc: '汤曰：第一不击天乙，二不击九天，三不击生门，四不击九地，五不击直使。我军居之必雄盛。' });
    return res;
  }

  // ── 盘面 SVG ──
  const LUO = { 4: [0, 0], 9: [1, 0], 2: [2, 0], 3: [0, 1], 5: [1, 1], 7: [2, 1], 8: [0, 2], 1: [1, 2], 6: [2, 2] };
  function renderPan(R) {
    const W = 660, H = 660, C = 220;
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
    svg += '<style>#qm-pan text{font-family:inherit;fill:#e8ecf4}#qm-pan .star{fill:#ffd166}#qm-pan .yi{fill:#fff}#qm-pan .men{fill:#7fd1ff}#qm-pan .shen{fill:#c9a7ff}#qm-pan .di{fill:#ff9d9d}#qm-pan .zf{fill:#4ade80}#qm-pan .lbl{fill:#8b93a7;font-size:15px}</style>';
    for (const r of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const [cx, cy] = LUO[r];
      const x = cx * C, y = cy * C;
      const zf = (r === R.zhiFuGong);
      svg += '<rect x="' + x + '" y="' + y + '" width="' + C + '" height="' + C + '" rx="8" fill="' + (zf ? 'rgba(74,222,128,0.10)' : 'rgba(255,255,255,0.025)') + '" stroke="' + (zf ? '#4ade80' : 'rgba(255,255,255,0.15)') + '" stroke-width="' + (zf ? 2 : 1) + '"/>';
      const gx = x + C / 2, gy = y + C / 2;
      // 神（左上角小字）
      if (R.shenPan[r]) svg += '<text x="' + (x + 12) + '" y="' + (y + 26) + '" class="shen" font-size="17">' + esc(R.shenPan[r]) + '</text>';
      // 天盘星（上中）
      svg += '<text x="' + gx + '" y="' + (gy - 34) + '" class="star" font-size="20" text-anchor="middle" font-weight="bold">' + esc(R.tianPan[r]) + '</text>';
      // 天盘奇仪（中心大字）
      svg += '<text x="' + gx + '" y="' + (gy + 12) + '" class="yi" font-size="30" text-anchor="middle" font-weight="bold">' + esc(R.tianYi[r]) + '</text>';
      // 地盘奇仪（下左）
      svg += '<text x="' + (x + 14) + '" y="' + (y + C - 18) + '" class="di" font-size="20">' + esc(R.diPan[r]) + '</text>';
      // 八门（下右）
      if (R.menPan[r]) svg += '<text x="' + (x + C - 12) + '" y="' + (y + C - 18) + '" class="men" font-size="20" text-anchor="end">' + esc(R.menPan[r].replace('门', '')) + '</text>';
      // 宫名（右上角小字）
      svg += '<text x="' + (x + C - 12) + '" y="' + (y + 26) + '" class="lbl" text-anchor="end">' + GONG_NAME[r] + '</text>';
      // 值符标记
      if (zf) {
        svg += '<circle cx="' + (x + 12) + '" cy="' + (y + C / 2 - 6) + '" r="6" fill="#4ade80" opacity="0.9"/>';
        svg += '<text x="' + (x + 22) + '" y="' + (y + C / 2) + '" class="zf" font-size="14" font-weight="bold">值符</text>';
      }
    }
    svg += '</svg>';
    return svg;
  }

  // ── 事件 ──
  function qiGongGo() {
    const y = parseInt($('qm-year').value, 10) || new Date().getFullYear();
    const mo = parseInt($('qm-month').value, 10) || (new Date().getMonth() + 1);
    const dd = parseInt($('qm-day').value, 10) || new Date().getDate();
    const hh = parseInt($('qm-hour').value, 10) || 0;
    const liupai = $('qm-liupai').value;
    const bufa = $('qm-bufa').value;
    const shi = $('qm-shi').value;
    const R = qiJu(y, mo, dd, hh, liupai, bufa);
    window._qmR = R; // 供奇门论命分析层（qimen_luming.js）取用
    const judge = judgeGe(R);
    $('qm-pan').innerHTML = renderPan(R);
    $('qm-verdict').innerHTML = buildSummary(R) + buildVerdict(R, judge, shi);
    $('qm-out').innerHTML = buildOut(R, judge, shi);
  }

  // 右侧输出：活层（主客/临机/原文备查 折叠）
  function buildOut(R, judge, shi) {
    const o = [];
    o.push('<div class="qm-verdict ' + (judge.main && isJiGe(judge.main.name) ? 'ji' : 'xiong') + '">主断：' + (judge.main && judge.main.name ? '『' + esc(judge.main.name) + '』' : '无专格') + '</div>');
    o.push('<div class="qm-verdict">盘面：' + esc(R.dun) + ' ' + esc(R.curJie) + ' ' + R.ju + '局 · 值符' + esc(R.zhiFuStar) + '落' + GONG_NAME[R.zhiFuGong] + ' · 值使' + esc(R.zhiShiMen) + '落' + GONG_NAME[R.shiZhiGong] + '</div>');
    // 主客活层
    o.push('<details><summary>主客活层（原文备查）</summary><div class="qm-si">奇门占事以值符为主、六庚为客：凡占胜负，值符宫克六庚之宫主胜，六庚宫克值符之宫客胜；旺相为胜，休囚为负。出行趋避首重八门，星克门吉门克星凶；造葬迁移首重九宫，门宫相生俱吉相克俱凶。</div></details>');
    // 十天干克应法
    const tg = (D && D.tiangan) || {};
    if (Object.keys(tg).length) {
      o.push('<details><summary>十天干克应法（原文备查）</summary>');
      for (const k of ['六甲', '六乙', '六丙', '六丁', '六戊', '六己', '六庚', '六辛', '六壬', '六癸']) {
        if (tg[k]) o.push('<div class="qm-si"><b>' + k + '</b>：' + esc(simp(tg[k])) + '</div>');
      }
      o.push('</details>');
    }
    // 十二神应验
    const ss = (D && D.shier_shen) || {};
    if (Object.keys(ss).length > 1) {
      o.push('<details><summary>十二神应验（原文备查）</summary>');
      for (const k of Object.keys(ss)) {
        if (k === '_note') continue;
        o.push('<div class="qm-si"><b>' + k + '</b>在门：' + esc(simp(ss[k])) + '</div>');
      }
      o.push('</details>');
    }
    // 时加六甲至六癸
    const sgs = (D && D.shigan_shi) || {};
    if (Object.keys(sgs).length) {
      o.push('<details><summary>时加六甲至六癸（原文备查）</summary>');
      for (const k of ['六甲', '六乙', '六丙', '六丁', '六戊', '六己', '六庚', '六辛', '六壬', '六癸']) {
        if (sgs[k]) o.push('<div class="qm-si"><b>' + k + '</b>：' + esc(simp(sgs[k])) + '</div>');
      }
      o.push('</details>');
    }
    // 分类占全部目录（速查）
    if (D && D.fenlei && D.fenlei.items) {
      o.push('<details><summary>分类占目录（' + D.fenlei.items.length + ' 类，点开看对应原文）</summary><div class="qm-tj">');
      for (const f of D.fenlei.items) {
        o.push('<span class="qm-tj-item" data-t="' + esc(f.t_zh || f.t) + '">' + esc(f.t_zh || f.t) + '</span>');
      }
      o.push('</div></details>');
    }
    // 古籍断语层 · 机判化（能机判的机判，不能的活步骤红字；原文备查保留在下方折叠）
    const gjLayers = (D && D.guji_cat && D.guji_cat.layers) || [];
    if (gjLayers.length) {
      o.push('<details open><summary>古籍断语层 · 机判化（' + gjLayers.length + ' 层 · 能机判的机判，不能的活步骤红字）</summary>');
      for (const L of gjLayers) {
        const lHits = (typeof window.qmGuJiLayerHits === 'function') ? (window.qmGuJiLayerHits(L, R, shi) || []) : [];
        o.push('<div style="margin:6px 0;"><b>' + esc(L.name) + '</b>');
        if (lHits.length) {
          o.push('<div style="color:#8fbf8f;font-weight:700;">机判命中 ' + lHits.length + ' 条</div>');
          for (const x of lHits) {
            o.push('<div class="qm-si" style="border-left-color:#8fbf8f;"><b>' + esc(x.name || x.cond) + '</b>' + (x.cond && x.cond !== x.name ? '（' + esc(x.cond) + '）' : '') + '——' + esc(simp(x.duan)) + (x.src ? '<div style="font-size:11px;color:var(--tx3);">' + esc(x.src) + '</div>' : '') + '</div>');
          }
        } else {
          o.push('<div class="muted">本局未命中「' + esc(L.name) + '」机判规则——未命中不假装。</div>');
        }
        for (const hu of (L.huobu || [])) {
          o.push('<div style="margin:6px 0 2px;color:#e06c6c;font-weight:800;">活步骤 · ' + esc(hu.title) + '（需人工对照局盘逐步判断）</div>' +
            '<div style="color:#e08a8a;line-height:1.9;font-weight:700;">' + hu.steps.map((st, k) => (k + 1) + '. ' + esc(simp(st))).join('<br>') + '</div>');
        }
        o.push('</div>');
      }
      o.push('</details>');
    }
    appendQmDocs(o, R);
    return o.join('');
  }

  // ── 古籍原文备查区（不可机判的原文一律折叠备查；新增块已简体入库）──
  function appendQmDocs(o, R) {
    if (!D) return;
    const sz = D.sanzha_wujia;
    if (sz && (sz['五假'] || sz['三诈'])) {
      o.push('<details><summary>三诈五假（原文备查）</summary>');
      if (sz['五假']) {
        o.push('<div class="qm-si"><b>五假</b></div>');
        for (const k of ['天假', '地假', '神假', '人假', '鬼假']) if (sz['五假'][k]) for (const t of sz['五假'][k]) o.push('<div class="qm-si">' + k + '：' + esc(t) + '</div>');
      }
      if (sz['三诈']) {
        o.push('<div class="qm-si"><b>三诈</b></div>');
        for (const k of ['真诈', '休诈', '重诈']) if (sz['三诈'][k]) for (const t of sz['三诈'][k]) o.push('<div class="qm-si">' + k + '：' + esc(t) + '</div>');
        if (sz['三诈']['_论']) for (const t of sz['三诈']['_论']) o.push('<div class="qm-si muted">' + esc(t) + '</div>');
      }
      o.push('</details>');
    }
    const jd = D.jiudun_xiang;
    if (jd) {
      o.push('<details><summary>九遁变化法（原文备查）</summary>');
      for (const k of ['天遁', '地遁', '人遁', '风遁', '云遁', '龙遁', '虎遁', '神遁', '鬼遁']) if (jd[k]) o.push('<div class="qm-si"><b>' + k + '</b>：' + esc(jd[k]) + '</div>');
      o.push('</details>');
    }
    const bm = (D && D.bamen) || {};
    if (bm && bm['开门'] && bm['开门'].jingying) {
      o.push('<details><summary>八门克应详解（门加十干/八门 → 出行所见；原文备查）</summary>');
      for (const mn of ['开门', '休门', '生门', '伤门', '杜门', '景门', '死门', '惊门']) {
        const b = bm[mn];
        if (!b || !b.jingying) continue;
        o.push('<div class="qm-si"><b>' + mn + '</b>' + (mn === R.zhiShiMen ? '（当前值使门）' : '') + '</div>');
        for (const k of Object.keys(b.jingying)) o.push('<div class="qm-si">' + k + '：' + esc(b.jingying[k]) + '</div>');
      }
      o.push('</details>');
    }
    const sl = D.sanqi_luying;
    if (sl && Object.keys(sl).length > 1) {
      o.push('<details><summary>三奇八门出行克应（原文备查）</summary>');
      for (const k of Object.keys(sl)) {
        if (k === '_note') continue;
        o.push('<div class="qm-si"><b>' + k + '</b></div>');
        for (const t of (sl[k] || [])) o.push('<div class="qm-si">' + esc(t) + '</div>');
      }
      o.push('</details>');
    }
    const lx = D.leixing_ku;
    if (lx && Object.keys(lx).length > 1) {
      o.push('<details><summary>类神库（八卦/六亲/六神/地支类神·象意；原文备查）</summary>');
      for (const k of Object.keys(lx)) {
        if (k === '_note') continue;
        o.push('<div class="qm-si"><b>' + k + '</b></div>');
        for (const t of (lx[k] || [])) o.push('<div class="qm-si">' + esc(t) + '</div>');
      }
      o.push('</details>');
    }
    const ql = D.qimen_luying;
    if (ql && ql.items && ql.items.length) {
      o.push('<details><summary>奇门路应（原文备查）</summary>');
      for (const t of ql.items) o.push('<div class="qm-si">' + esc(t) + '</div>');
      o.push('</details>');
    }
    const dz = D.duanzong;
    if (dz) {
      o.push('<details><summary>断局总纲：烟波钓叟歌 + 武侯玄机赋（原文备查）</summary>');
      for (const k of ['烟波钓叟歌等歌诀', '武侯玄机赋（上中下篇）']) {
        if (dz[k]) o.push('<div class="qm-si"><b>' + k + '</b></div><pre class="qm-doc">' + esc(dz[k]) + '</pre>');
      }
      o.push('</details>');
    }
    const bs = D.bing_shi;
    if (bs) {
      o.push('<details><summary>兵事避忌：三胜地/五不击/孤虚/亭亭白奸等（原文备查）</summary>');
      for (const k of ['统宗兵事', '符应经三胜五不击']) {
        if (bs[k]) o.push('<div class="qm-si"><b>' + k + '</b></div><pre class="qm-doc">' + esc(bs[k]) + '</pre>');
      }
      o.push('</details>');
    }
  }

  // 事类下拉初始化
  function fillShi() {
    const sel = $('qm-shi');
    if (!sel || !D || !D.fenlei || !D.fenlei.items) return;
    const tags = [
      '占求财', '占婚姻', '占词讼吉凶', '占官讼', '占出行', '占出行水陆吉凶', '占行人在外', '占行人归期',
      '占病何日愈', '占失物', '占走失', '占捕捉', '占干谒', '占借贷', '占升迁', '占乡会试', '占武举',
      '占大计吉凶', '占新任官员贤吏及何处人', '占官事催提缓急', '占领批文迟速', '占迁移吉凶', '占雀噪',
      '占投军', '占攻城', '占守城', '占盗贼', '占贼临境城可守否', '占胜败', '占远信', '占船主善恶',
      '占出外之人安否', '占访友', '占求人推荐', '占胎产', '占生产男女', '占雪', '占雨', '占风', '占宅',
      '占迷路法', '占出外预定归期', '占出外不知家安否', '占立窑', '占人生贵贱', '占名利', '占谋事',
    ];
    sel.innerHTML = '<option value="">（不选分类占，只出盘与格局）</option>';
    for (const t of tags) {
      const hit = findFenlei(t);
      if (hit) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        sel.appendChild(opt);
      }
    }
  }

  function init() {
    window.qianzhan.data().then((d) => {
      D = (d && d.qimen) || null;
      if (!D) { $('qm-out').innerHTML = '<div style="color:#d17a7a;">奇门数据加载失败：' + JSON.stringify(d && Object.keys(d)) + '</div>'; return; }
      window.__qimenData = D; // contextBridge 对象不可扩展，缓存挂 window 自有属性
      fillShi();
      $('qm-out').innerHTML = '<div class="qm-verdict">奇门数据已载入（' + (D.fenlei && D.fenlei.items ? D.fenlei.items.length : 0) + ' 类分类占 · ' + (D.shigan ? Object.keys(D.shigan).filter(k => !k.endsWith('_zh') && k !== '_note').length : 0) + ' 干克应）</div>';
    }).catch((e) => {
      $('qm-out').innerHTML = '<div style="color:#d17a7a;">奇门数据加载异常：' + e.message + '</div>';
    });
    // 默认当前时间
    const now = new Date();
    $('qm-year').value = now.getFullYear();
    $('qm-month').value = now.getMonth() + 1;
    $('qm-day').value = now.getDate();
    $('qm-hour').value = now.getHours();
    $('qm-go').addEventListener('click', qiGongGo);
    $('qm-now').addEventListener('click', () => {
      const n = new Date();
      $('qm-year').value = n.getFullYear();
      $('qm-month').value = n.getMonth() + 1;
      $('qm-day').value = n.getDate();
      $('qm-hour').value = n.getHours();
      qiGongGo();
    });
    // 分类占目录点击 → 填充事类并起局
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains('qm-tj-item')) {
        $('qm-shi').value = t.dataset.t;
        qiGongGo();
      }
    });
    $('qm-pan').innerHTML = '<div class="muted" style="padding:40px;text-align:center;">设置起局时间后点「起局」。</div>';
  }

  window.qimenInit = init;
})();
