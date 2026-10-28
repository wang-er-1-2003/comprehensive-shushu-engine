// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 皇极经世起数推演 + 心易（kinwangji/kentang2017/MIT 现代整理层移植）
// wanji.py（皇极四卦）/ xinyi.py（先天数·后天方位·年月日时起卦）逐行对译，繁体转简体
// 四柱口径：lunar.js（立春换年/节气月/23时换日晚子按次日日干起子，与源 sxtwl 默认开关一致）
// 红线：卦名/爻辞照录 pkl 提取表，未载处返回空串不伪造
'use strict';
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { const api = factory(); root.kinwangjiMod = api; root.kinwangjiInit = api.init; }
})(typeof self !== 'undefined' ? self : this, function () {

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---- 常量表（译自 kinwangji/jieqi.py + wanji.py + xinyi.py）----
  const JIAZI = (function () {
    const g = '甲乙丙丁戊己庚辛壬癸', z = '子丑寅卯辰巳午未申酉戌亥', r = [];
    for (let i = 0; i < 60; i++) r.push(g[i % 10] + z[i % 12]);
    return r;
  })();
  const jiaziIndex = (gz) => { const i = JIAZI.indexOf(gz); return i < 0 ? 0 : i; };

  // 特殊卦（乾/坤/离/坎不在60卦周期内）的邻卦替代（wanji.py _SPECIAL_GUA_NEIGHBOR，繁转简）
  const NEIGHBOR = { '乾': '姤', '坤': '复', '离': '革', '坎': '蒙' };

  // new_list(lst, target)：把列表旋转到 target 在首位（jieqi.py 语义）
  function rotateTo(lst, target) {
    const actual = NEIGHBOR[target] || target;
    const i = lst.indexOf(actual);
    if (i < 0) return lst.slice();
    return lst.slice(i).concat(lst.slice(0, i));
  }

  // change(code, yao)：第 yao 爻(1=底爻)阴阳翻转（wanji.py change，7=阳 8=阴）
  function change(code, yao) {
    const idx = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 }[yao];
    if (idx === undefined) throw new Error('yao must be 1-6');
    const arr = code.split('');
    arr[idx] = arr[idx] === '7' ? '8' : '7';
    return arr.join('');
  }

  const CODE2NAME = (T, code) => T.code2name[code];
  const name2code = (T, name) => T.gua_canon[name];

  // 旬首：甲子旬=1 ... 甲寅旬=6（wanji.py liujiashun_dict + shi_shun）
  function xunYao(ygz) {
    const i = jiaziIndex(ygz);
    return (Math.floor(i / 10) + 1); // 1..6
  }

  // _derive_month_hexagrams：由年卦码推十二月卦（wanji.py，逐对翻转）
  function deriveMonth(T, yearCode) {
    const flips = [];
    for (let i = 0; i < 6; i++) flips.push(flips.length ? flips[flips.length - 1] : yearCode);
    // 手动按 Python 展开
    const first = (yearCode[0] === '7' ? '8' : '7') + yearCode.slice(1);
    const second = (first[0] === '7' ? '8' : '7') + (first[1] === '7' ? '8' : '7') + first.slice(2);
    const third = second[0] + (second[1] === '7' ? '8' : '7') + (second[2] === '7' ? '8' : '7') + second.slice(3);
    const forth = third[0] + third[1] + (third[2] === '7' ? '8' : '7') + (third[3] === '7' ? '8' : '7') + third.slice(4);
    const fifth = forth[0] + forth[1] + forth[2] + (forth[3] === '7' ? '8' : '7') + (forth[4] === '7' ? '8' : '7') + forth[5];
    const sixth = fifth[0] + fifth[1] + fifth[2] + fifth[3] + (fifth[4] === '7' ? '8' : '7') + (fifth[5] === '7' ? '8' : '7');
    const mlist = [first, first, second, second, third, third, forth, forth, fifth, fifth, sixth, sixth];
    return mlist.map((c) => CODE2NAME(T, c));
  }

  // ---- 四柱（与 shenyishu.js 同口径：23时换日；lunar.js）----
  function fourPillars(y, m, d, h, mi, L) {
    let Y = y, M = m, Dd = d;
    if (h === 23) {
      const dt = new Date(Date.UTC(y, m - 1, d + 1));
      Y = dt.getUTCFullYear(); M = dt.getUTCMonth() + 1; Dd = dt.getUTCDate();
    }
    const lunDay = L.fromYmdHms(Y, M, Dd, 12, 0, 0).getLunar();
    const lunHour = L.fromYmdHms(y, m, d, h, 0, 0).getLunar();
    const lunBase = L.fromYmdHms(y, m, d, 12, 0, 0).getLunar();
    return {
      gz: {
        年: lunDay.getYearInGanZhiExact(),
        月: lunDay.getMonthInGanZhiExact(),
        日: lunDay.getDayInGanZhi(),
        时: lunHour.getTimeInGanZhi()
      },
      minuteGz: JIAZI[(((h * 60 + mi) >> 1) % 60 + 60) % 60],
      lunarYear: lunBase.getYear(), lunarMonth: lunBase.getMonth(), lunarDay: lunBase.getDay()
    };
  }

  // ---- 皇极四卦主链（wanji.py wanji_four_gua 对译）----
  function wanjiCompute(y, m, d, h, mi, T, L) {
    if (!T || !T.wangji60 || !L || typeof L.fromYmdHms !== 'function') return { ok: false, reason: '数据表或历法库未加载' };
    if (!(y >= -12999 && y <= 16799 && m >= 1 && m <= 12 && d >= 1 && d <= 31 && h >= 0 && h <= 23 && mi >= 0 && mi <= 59)) {
      return { ok: false, reason: '参数越界（年 -12999~16799，月1-12，日1-31，时0-23，分0-59）' };
    }
    const fp = fourPillars(y, m, d, h, mi, L);
    let effYear = y;
    // 农历12月逢公历正月 → 年退一（wanji.py lunar 跨年）
    if (fp.lunarMonth === 12 && m === 1) effYear = effYear - 1;
    if (effYear === 0) effYear = 1;

    const acum = effYear < 0 ? 67017 + effYear + 1 : 67017 + effYear;
    const hui = Math.floor(acum / 10800) + 1;
    const yun = Math.floor(acum / 360) + 1;
    const shi = Math.floor(acum / 30) + (effYear < 0 ? 2 : 1);

    // 正卦：round(acum/2160) → wangji_gua 1..60
    const mainIdx = Math.round(acum / 2160);
    const mainGua = T.wangji60[mainIdx - 1];

    // 運卦：正卦码动 yun_gua_yao
    const mys = name2code(T, mainGua);
    const yunYao = yun % 6 === 0 ? 6 : yun % 6;
    const mys1 = change(mys, yunYao);
    const yungua = CODE2NAME(T, mys1);

    // 世卦：運卦码动 shi_yao
    let shiYao = (Math.floor(shi / 2)) % 6;
    shiYao = shiYao === 0 ? 6 : shiYao;
    const shis1 = change(mys1, shiYao);
    const shigua = CODE2NAME(T, shis1);

    // 旬卦：世卦码动 旬首爻
    const shunYao = xunYao(fp.gz.年);
    const shungua1 = change(shis1, shunYao);
    const shunGua = CODE2NAME(T, shungua1);

    // 年卦：以世卦为轴旋转60卦周期，按年干支查
    const yearGua = rotateTo(T.wangji60, shigua)[jiaziIndex(fp.gz.年)];

    // 月卦：由年卦码推12月卦，取农历月
    const mguaList = deriveMonth(T, name2code(T, yearGua));
    const mgua = mguaList[fp.lunarMonth - 1];

    // 日卦：以月卦为轴旋转，按日干支查
    const dayGua = rotateTo(T.wangji60, mgua)[jiaziIndex(fp.gz.日)];

    // 時卦：以日卦为轴旋转，按时干支查
    const hourGua = rotateTo(T.wangji60, dayGua)[jiaziIndex(fp.gz.时)];

    // 分卦：時卦为基 + 分干支序 + 分数
    const baseIdx = T.wangji60.indexOf(hourGua);
    const fenOffset = jiaziIndex(fp.minuteGz);
    const newIdx = (((baseIdx < 0 ? 0 : baseIdx) + fenOffset) % 60 + mi) % 60;
    const fenGua = T.wangji60[newIdx];

    return {
      ok: true,
      日期: y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') + ' ' + String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0'),
      干支: [fp.gz.年, fp.gz.月, fp.gz.日, fp.gz.时, fp.minuteGz],
      农历: { 年: fp.lunarYear, 月: fp.lunarMonth, 日: fp.lunarDay },
      积年: acum, 会: hui, 运: yun, 世: shi,
      运卦动爻: yunYao, 世卦动爻: shiYao, 旬卦动爻: shunYao,
      正卦: mainGua, 运卦: yungua, 世卦: shigua, 旬卦: shunGua,
      年卦: yearGua, 月卦: mgua, 日卦: dayGua, 时卦: hourGua, 分卦: fenGua
    };
  }

  // ---- 心易（xinyi.py 对译）----
  const TRIGRAM_CODE = { '乾': '777', '兑': '778', '离': '787', '震': '788', '巽': '877', '坎': '878', '艮': '887', '坤': '888' };
  const XIANTIAN = { 1: '乾', 2: '兑', 3: '离', 4: '震', 5: '巽', 6: '坎', 7: '艮', 8: '坤' };
  const DIRECTION_GUA = { '北': '坎', '西南': '坤', '东': '震', '东南': '巽', '南': '离', '中': '坤', '西北': '乾', '西': '兑', '东北': '艮' };
  const GUA_WX = { '乾': '金', '兑': '金', '离': '火', '震': '木', '巽': '木', '坎': '水', '艮': '土', '坤': '土' };
  const WX_SHENG = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
  const WX_KE = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };
  const HOUR_SHICHEN = {};
  (function () {
    const pairs = [[23, 1], [0, 1], [1, 2], [2, 2], [3, 3], [4, 3], [5, 4], [6, 4], [7, 5], [8, 5], [9, 6], [10, 6], [11, 7], [12, 7], [13, 8], [14, 8], [15, 9], [16, 9], [17, 10], [18, 10], [19, 11], [20, 11], [21, 12], [22, 12]];
    pairs.forEach(([a, b]) => { HOUR_SHICHEN[a] = b; });
  })();

  const xtNum = (n) => XIANTIAN[(n % 8) === 0 ? 8 : (n % 8)];
  const movingLine = (total) => { const r = total % 6; return r === 0 ? 6 : r; };

  function huGua(T, code) {
    const c = code.replace('9', '7').replace('6', '8');
    const hu = c[1] + c[2] + c[3] + c[2] + c[3] + c[4];
    return CODE2NAME(T, hu);
  }

  function buildResult(T, upper, lower, yao) {
    const hexCode = TRIGRAM_CODE[lower] + TRIGRAM_CODE[upper];
    const ben = CODE2NAME(T, hexCode);
    const bian = CODE2NAME(T, change(hexCode, yao));
    const hu = huGua(T, hexCode);
    const ti = yao <= 3 ? upper : lower;
    const yong = yao <= 3 ? lower : upper;
    const tiWx = GUA_WX[ti], yongWx = GUA_WX[yong];
    let rel = '比和';
    if (tiWx !== yongWx) {
      if (WX_SHENG[yongWx] === tiWx) rel = '用生体';
      else if (WX_SHENG[tiWx] === yongWx) rel = '体生用';
      else if (WX_KE[yongWx] === tiWx) rel = '用克体';
      else if (WX_KE[tiWx] === yongWx) rel = '体克用';
    }
    return { 本卦: ben, 变卦: bian, 动爻: yao, 上卦: upper, 下卦: lower, 体卦: ti, 用卦: yong, 互卦: hu, 体用五行: '体' + ti + '(' + tiWx + ') ' + rel + ' 用' + yong + '(' + yongWx + ')' };
  }

  function xinyiNumber(T, n1, n2) {
    if (n1 < 1 || n2 < 1) return { ok: false, reason: '两数须 ≥ 1' };
    return Object.assign({ ok: true }, buildResult(T, xtNum(n1), xtNum(n2), movingLine(n1 + n2)));
  }

  function xinyiDirection(T, obj, dir, hour) {
    if (!TRIGRAM_CODE[obj] || !DIRECTION_GUA[dir]) return { ok: false, reason: '对象须为八卦之一，方位须为 北/东北/东/东南/南/西南/西/西北/中' };
    const ht = { '坎': 1, '坤': 2, '震': 3, '巽': 4, '乾': 6, '兑': 7, '艮': 8, '离': 9 };
    const yao = movingLine(ht[obj] + ht[DIRECTION_GUA[dir]] + HOUR_SHICHEN[hour]);
    return Object.assign({ ok: true }, buildResult(T, obj, DIRECTION_GUA[dir], yao));
  }

  function xinyiDatetime(T, y, m, d, h, L) {
    if (!L || typeof L.fromYmdHms !== 'function') return { ok: false, reason: '历法库未加载' };
    const lun = L.fromYmdHms(y, m, d, 12, 0, 0).getLunar();
    const yearBranch = ((lun.getYear() - 4) % 12 + 12) % 12 + 1;
    const upperSum = yearBranch + lun.getMonth() + lun.getDay();
    const lowerSum = upperSum + HOUR_SHICHEN[h];
    return Object.assign({ ok: true, yearBranch: yearBranch, lunarMonth: lun.getMonth(), lunarDay: lun.getDay() }, buildResult(T, xtNum(upperSum), xtNum(lowerSum), movingLine(lowerSum)));
  }

  // ---- 渲染 ----
  function renderWanji(r, T) {
    if (!r.ok) return '<div class="muted">' + esc(r.reason) + '</div>';
    const keys = ['正卦', '运卦', '世卦', '旬卦', '年卦', '月卦', '日卦', '时卦', '分卦'];
    const row = keys.map((k) => '<td style="text-align:center;padding:4px 8px;border:1px solid #444;"><b style="font-size:15px;">' + esc(r[k]) + '</b></td>').join('');
    const guayao = (T.guayao && T.guayao[r.年卦]) || {};
    let ya = '';
    for (let i = 0; i <= 6; i++) {
      const t = guayao[String(i)];
      if (t) ya += '<div style="margin:3px 0;font-size:12px;line-height:1.8;">' + (i === 0 ? '卦辞' : '第' + i + '爻') + '：' + esc(t) + '</div>';
    }
    if (!ya) ya = '<div class="muted" style="font-size:12px;">年卦卦爻详解表未载该卦，待核。</div>';
    return '' +
      '<div class="card"><h3>皇极起数（' + esc(r.日期) + '）</h3>' +
      '<div class="sy-gz">' + r.干支.map((g, i) => '<span class="sy-gz-i"><b>' + esc(g) + '</b>' + ['年', '月', '日', '时', '分'][i] + '柱</span>').join('') + '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:6px;">农历 ' + r.农历.年 + '年' + r.农历.月 + '月' + r.农历.日 + '日　积年 ' + r.积年 + '　' + r.会 + '会 ' + r.运 + '运 ' + r.世 + '世（67017+公元年，1会=10800，1运=360，1世=30）</div></div>' +
      '<div class="card"><h3>九卦排盘（动爻：运' + r.运卦动爻 + '·世' + r.世卦动爻 + '·旬' + r.旬卦动爻 + '）</h3>' +
      '<table style="border-collapse:collapse;margin:6px 0;"><thead><tr>' + keys.map((k) => '<th style="padding:4px 8px;border:1px solid #444;font-size:12px;">' + k + '</th>').join('') + '</tr></thead><tbody><tr>' + row + '</tr></tbody></table></div>' +
      '<div class="card"><h3>年卦【' + esc(r.年卦) + '】卦爻详解</h3>' + ya + '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinwangji/kentang2017/MIT 现代整理层（皇极经世起数 wanji.py 对译），繁体转简体；60卦周期不含乾坤离坎。</div>';
  }

  function renderXinyi(r, title) {
    if (!r.ok) return '<div class="muted">' + esc(r.reason) + '</div>';
    return '<div class="card"><h3>' + esc(title) + '</h3>' +
      '<div class="sy-zw">' +
      '<div class="sy-zw-i"><b>' + esc(r.本卦) + '</b><span>本卦（上' + esc(r.上卦) + '下' + esc(r.下卦) + '）</span></div>' +
      '<div class="sy-zw-i"><b>' + esc(r.变卦) + '</b><span>变卦（动爻第' + r.动爻 + '爻）</span></div>' +
      '<div class="sy-zw-i"><b>' + esc(r.互卦) + '</b><span>互卦（2-4·3-5爻）</span></div>' +
      '</div>' +
      '<div class="sy-wx">体用：' + esc(r.体用五行) + '</div></div>';
  }

  function init() {
    if (typeof document === 'undefined') return;
    const T = (typeof window !== 'undefined' && window.__DATA && window.__DATA.kinwangji) || null;
    const L = (typeof window !== 'undefined' && window.Solar && window.Solar.fromYmdHms) ? window.Solar : null;
    const go = document.getElementById('hj2-go');
    if (go) {
      go.addEventListener('click', () => {
        const num = (id) => parseInt((document.getElementById(id) || {}).value, 10);
        const out = document.getElementById('hj2-result');
        out.innerHTML = renderWanji(wanjiCompute(num('hj2-y'), num('hj2-m'), num('hj2-d'), num('hj2-h'), num('hj2-mi'), T, L), T);
      });
    }
    const xn = document.getElementById('hj2-xn');
    if (xn) xn.addEventListener('click', () => {
      const out = document.getElementById('hj2-result');
      out.innerHTML = renderXinyi(xinyiNumber(T, parseInt(document.getElementById('hj2-n1').value, 10), parseInt(document.getElementById('hj2-n2').value, 10)), '心易·先天数两数起卦');
    });
    const xd = document.getElementById('hj2-xd');
    if (xd) xd.addEventListener('click', () => {
      const out = document.getElementById('hj2-result');
      const obj = document.getElementById('hj2-obj').value;
      const dir = document.getElementById('hj2-dir').value;
      out.innerHTML = renderXinyi(xinyiDirection(T, obj, dir, new Date().getHours()), '心易·后天方位起卦（' + obj + '·' + dir + '）');
    });
    // 典籍卷选择
    const bookSel = document.getElementById('hj2-book');
    const secSel = document.getElementById('hj2-sec');
    if (bookSel && secSel && T && T.classics) {
      const fillSecs = () => {
        const key = bookSel.value === 'yanyi' ? 'guanwu_yanyi' : 'xinyi_fawei';
        secSel.innerHTML = (T.classics[key].sections || []).map((s, i) => '<option value="' + i + '">' + esc(s.title) + '</option>').join('');
      };
      bookSel.addEventListener('change', fillSecs);
      fillSecs();
      const bgo = document.getElementById('hj2-bookgo');
      if (bgo) bgo.addEventListener('click', () => {
        const key = bookSel.value === 'yanyi' ? 'guanwu_yanyi' : 'xinyi_fawei';
        const secs = T.classics[key].sections || [];
        const sec = secs[parseInt(secSel.value, 10) || 0];
        const out = document.getElementById('hj2-bookresult');
        if (!sec) { out.innerHTML = '<div class="muted">无卷。</div>'; return; }
        out.innerHTML = '<div class="card"><span class="k">' + esc(T.classics[key].title) + ' · ' + esc(sec.title) + '</span><div style="margin:8px 0;line-height:1.9;white-space:pre-wrap;font-size:13px;max-height:420px;overflow:auto;">' + esc(sec.text) + '</div><div class="muted" style="font-size:11px;">来源：kinwangji/kentang2017/MIT（明·杨体仁《心易发微》/宋·张行成《观物外篇衍义》，繁体转简体）。与引擎既有《皇极经世书》全文为不同著作；观物外篇衍义第1卷起句与原书外篇引文重叠，已如实保留来源标注。</div></div>';
      });
    }
    const hint = document.getElementById('hj2-hint');
    if (hint && T) {
      hint.textContent = '已加载皇极起数卦表 64 + 60卦周期 + 补遗典籍 ' + (T.classics ? (T.classics.guanwu_yanyi.sections.length + T.classics.xinyi_fawei.sections.length) : 0) + ' 卷。';
    }
  }

  return { wanjiCompute, xinyiNumber, xinyiDirection, xinyiDatetime, change, rotateTo, deriveMonth, huGua, renderWanji, renderXinyi, init };
});
