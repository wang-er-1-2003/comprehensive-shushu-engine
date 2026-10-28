// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 堅五兆（唐宋折竹弹占术·敦煌 P.2859《五兆要诀略》复原）
// kentang2017/MIT 现代整理层移植（kinwuzhao.py / config.py / kinliuren 天地盘片段逐行对译，繁体转简体）
// 四柱/节气/农历月口径：lunar.js（立春换年/节气月/23时晚子时按次日日干起子，与源 sxtwl 默认开关一致）
'use strict';
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { const api = factory(); root.kinwuzhaoMod = api; root.kinwuzhaoInit = api.init; }
})(typeof self !== 'undefined' ? self : this, function () {

  const ZHIS = '子丑寅卯辰巳午未申酉戌亥';
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function nextDay(y, m, d) {
    const dt = new Date(Date.UTC(y, m - 1, d + 1));
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }

  // 取模 5，余 0 归 5（P.2859：「尽则为五」）
  function mod5nz(n) { const r = ((n % 5) + 5) % 5; return r === 0 ? 5 : r; }

  function arrangeBeasts(T, dayGan) {
    const order = T.sixbeast_order;
    const start = T.day_gan_to_beast[dayGan];
    const si = order.indexOf(start);
    const out = [];
    for (let i = 0; i < 6; i++) out.push(order[(si + i) % order.length]);
    return out;
  }

  // 六壬天地盘（月将加支）：skyToEarth[天盘支] = 地盘支（仅用 kinliuren.Liuren.result_m 的「地转天盘」）
  function buildSkyToEarth(earthZhi, mgZhi) {
    const i0 = ZHIS.indexOf(earthZhi);
    const m0 = ZHIS.indexOf(mgZhi);
    const map = {};
    for (let i = 0; i < 12; i++) map[ZHIS[(m0 + i) % 12]] = ZHIS[(i0 + i) % 12];
    return map;
  }

  function seasonOf(T, jq) {
    for (const s of ['春', '夏', '秋', '冬']) {
      if (T.solar_terms_by_season[s].terms.indexOf(jq) >= 0) return s;
    }
    return '';
  }

  function wangxiangOf(T, jq, gongChar) {
    for (let gi = 0; gi < T.jieqi_groups.length; gi++) {
      if (T.jieqi_groups[gi].indexOf(jq) >= 0) {
        for (let i = 0; i < T.wangxiang_trigrams.length; i++) {
          if (T.wangxiang_trigrams[(gi + i) % T.wangxiang_trigrams.length] === gongChar) {
            return T.wangxiang_stages[i];
          }
        }
        return '';
      }
    }
    return '';
  }

  function guxuOf(T, gz) {
    const idx = T.jiazi.indexOf(gz);
    const xunKey = T.jiazi[Math.floor(idx / 10) * 10];
    const xun = T.guxu[xunKey];
    if (!xun) return { gu: '', xu: '' };
    const yy = T.yang_gan.indexOf(gz[0]) >= 0 ? '阳' : '阴';
    return { gu: T.zhi2gua[xun[yy].孤], xu: T.zhi2gua[xun[yy].虚] };
  }

  // 核心排算：与 kinwuzhao.py gangzhi_paipan / five_zhao_paipan / WuzhaoDivination 输出逐字段对应
  // y/m/d/h：公历年月日与时辰(0-23)；T：数据表（kinwuzhao.json）；L：lunar 库 Solar 类
  // opts: { mode:'ganzhi'|'rigan'|'tang', num:0, splits:[6] }
  function kzCompute(y, m, d, h, T, L, opts) {
    opts = opts || {};
    if (!T || !L || typeof L.fromYmdHms !== 'function') return { ok: false, reason: '数据表或历法库未加载' };

    // 四柱：23 时换日（年月日柱取次日；时柱按原时刻 lunar 晚子时口径，对应源 after23_new_day=1/late_zi=1）
    let Y = y, M = m, D = d;
    if (h === 23) { const nd = nextDay(y, m, d); Y = nd.y; M = nd.m; D = nd.d; }
    const lunDay = L.fromYmdHms(Y, M, D, 12, 0, 0).getLunar();
    const lunHour = L.fromYmdHms(y, m, d, h, 0, 0).getLunar();
    const gz = {
      年: lunDay.getYearInGanZhiExact(),
      月: lunDay.getMonthInGanZhiExact(),
      日: lunDay.getDayInGanZhi(),
      时: lunHour.getTimeInGanZhi()
    };

    // 节气（原时刻当日口径；交节气当日取当日节气，否则取前一个节气）
    // lunar.js：getJieQi() 返回字符串（非交节日为 ""），getPrevJieQi(true) 返回 JieQi 对象需取 .name
    const jqName = function (v) {
      if (typeof v === 'string') return v;
      if (v && v.name) return v.name;
      if (v && v._p && v._p.name) return v._p.name;
      return '';
    };
    let jq = (typeof lunHour.getJieQi === 'function') ? jqName(lunHour.getJieQi()) : '';
    if (!jq && typeof lunHour.getPrevJieQi === 'function') jq = jqName(lunHour.getPrevJieQi(true));
    if (!jq) jq = '';
    // 农历月（原日期，单字：正..冬/腊）
    const cm = lunHour.getMonthInChinese();

    // 分干支（五狗遁：子时干起戌，1440 分钟连续循环；本移植分钟固定 0）
    const zi = L.fromYmdHms(y, m, d, 0, 0, 0).getLunar().getTimeInGanZhi();
    const startJia = T.fivedogs[zi[0]] || '甲戌';
    const startIdx = T.jiazi.indexOf(startJia);
    const mi = T.jiazi[((startIdx + (h * 60) % 60) % 60 + 60) % 60];

    let num = parseInt(opts.num, 10) || 0;
    if (num > 9) num = num % 9; // 源 app.py 口径

    const mode = opts.mode || 'ganzhi';
    let gz1, gz2;
    if (mode === 'ganzhi') { gz1 = gz.时; gz2 = mi; }        // 干支起盘：时干起六兽，分干定天地盘/孤虚
    else if (mode === 'tang') { gz1 = gz.日; gz2 = gz.时; }  // 唐代正法（app.py 接线）
    else { gz1 = gz.月; gz2 = gz.日; }                        // 日干起盘
    if (!T.day_gan_to_beast[gz1[0]]) return { ok: false, reason: '日干不正确，请输入：甲乙丙丁戊己庚辛壬癸' };

    const beastSeq = arrangeBeasts(T, gz1[0]);

    // 关籥将军（六壬天地盘：月将加支）
    const mg = T.moon_general[jq] || '';
    const skyToEarth = buildSkyToEarth(gz2[1], mg);
    const season = seasonOf(T, jq);
    const lockZhi = season ? T.solar_terms_by_season[season].关 : '';
    const keyZhi = season ? T.solar_terms_by_season[season].籥 : '';
    const lockGong = lockZhi ? (T.zhi2gua[skyToEarth[lockZhi]] || '') : '';
    const keyGong = keyZhi ? (T.zhi2gua[skyToEarth[keyZhi]] || '') : '';
    const genGong = T.zhi2gua[skyToEarth[T.general_map[gz2[1]]]] || '';
    const guXu = guxuOf(T, gz2);
    const ctx = { lockGong, keyGong, genGong, guGong: guXu.gu, xuGong: guXu.xu };

    // 六宫五行数
    let nums;
    if (mode === 'ganzhi') {
      const jz = {};
      T.jiazi.forEach(function (g, i) { jz[g] = i + 1; });
      const parts = [
        [gz.年, gz.月, gz.日, gz.时, mi, num],
        [gz.月, gz.日, gz.时, mi, num],
        [gz.日, gz.时, mi, num],
        [gz.时, mi, num],
        [mi, num],
        [num]
      ];
      nums = parts.map(function (pp) {
        let s = 0;
        for (const p of pp) s += (jz[p] || (typeof p === 'number' ? p : 0));
        return mod5nz(s);
      });
    } else {
      // 折竹揲筮（36 算子六次五五除之）：手动 splits 或随机
      const splits = Array.isArray(opts.splits) ? opts.splits : null;
      let remain = T.base_sticks;
      nums = [];
      for (let i = 0; i < 6; i++) {
        let left;
        if (splits && i < splits.length) {
          left = remain > 1 ? Math.max(1, Math.min(splits[i], remain - 1)) : 1;
        } else {
          left = remain > 1 ? Math.floor(Math.random() * (remain - 1)) + 1 : 1;
        }
        nums.push(mod5nz(left));
        remain -= left;
        if (remain <= 0) { for (let j = i + 1; j < 6; j++) nums.push(5); break; } // 尽则为五
      }
    }

    let my = '';
    const result = {};
    for (let i = 0; i < 6; i++) {
      const gong = T.positions[i][0], label = T.positions[i][1];
      const gongChar = gong[0];
      const el = T.num_to_element[String(nums[i])];
      if (i === 0) my = el;
      const rel = i === 0 ? '' : (T.liuqin[T.wuxing_relation[my + el]] || '');
      const wxGong = gongChar === '中' ? '坤' : gongChar;
      const weak = T.beast_weakness[beastSeq[i]] || ['', ''];
      result[label] = {
        宮位: label,
        旺相: wangxiangOf(T, jq, wxGong),
        宮位1: gongChar,
        數字: nums[i],
        五行: el,
        六獸: beastSeq[i],
        六獸死: weak[0] === gongChar ? '死' : '',
        六獸害: weak[1] === gongChar ? '害' : '',
        六親: rel,
        孤: ctx.guGong === gongChar ? '孤' : '',
        虚: ctx.xuGong === gongChar ? '虚' : '',
        关: ctx.lockGong === gongChar ? '关' : '',
        籥: ctx.keyGong === gongChar ? '籥' : '',
        将军: ctx.genGong === gongChar ? '将军' : ''
      };
    }
    return {
      ok: true,
      生辰: y + '年' + m + '月' + d + '日' + h + '时',
      四柱: gz,
      节气: jq,
      农历月: cm,
      分干支: mi,
      月将: mg,
      孤虚: { 孤宫: ctx.guGong, 虚宫: ctx.xuGong, 关宫: ctx.lockGong, 籥宫: ctx.keyGong, 将军宫: ctx.genGong },
      模式: mode,
      result: result
    };
  }

  // UI 渲染（九宫格，布局同源 app.py build_svg grid）
  const GRID = [['兆', 0, 0], ['火乡', 1, 0], ['', 2, 0], ['木乡', 0, 1], ['土乡', 1, 1], ['金乡', 2, 1], ['', 0, 2], ['水乡', 1, 2], ['', 2, 2]];
  const EL_COLOR = { '木': '#4caf50', '火': '#ff5252', '土': '#ffd740', '金': '#e0e0e0', '水': '#42a5f5' };

  function render(r) {
    if (!r.ok) return '<div class="muted" style="color:#d17a7a;">' + esc(r.reason || '排盘失败') + '</div>';
    const gz = r.四柱;
    let html = '<div class="card"><h3>四柱（' + esc(r.生辰) + '）</h3>' +
      '<div class="sy-gz">' + ['年', '月', '日', '时'].map(function (k) {
        return '<span class="sy-gz-i"><b>' + esc(gz[k]) + '</b>' + esc(k) + '柱</span>';
      }).join('') +
      '<span class="sy-gz-i"><b>' + esc(r.分干支) + '</b>分柱</span></div>' +
      '<div class="muted" style="font-size:11px;margin-top:6px;">节气：<b>' + esc(r.节气) + '</b> · 农历' + esc(r.农历月) + '月 · 月将：' + esc(r.月将) + ' · 孤宫 ' + esc(r.孤虚.孤宫 || '—') + ' / 虚宫 ' + esc(r.孤虚.虚宫 || '—') + '</div></div>';

    let cells = '';
    for (const [name, col, row] of GRID) {
      if (!name) { cells += '<div class="kz-cell kz-empty"></div>'; continue; }
      const c = r.result[name];
      const tags = [c.孤, c.虚, c.关, c.籥, c.将军].filter(Boolean).join('');
      cells += '<div class="kz-cell">' +
        '<div class="kz-name">' + esc(name) + '</div>' +
        '<div class="kz-el" style="color:' + (EL_COLOR[c.五行] || '#e0e0e0') + ';">' + esc(c.五行) + esc(c.旺相) + '</div>' +
        '<div class="kz-sub">' + esc(c.六獸) + (c.六獸死 || c.六獸害 ? '<span style="color:#ff8a8a;">' + esc(c.六獸死 + c.六獸害) + '</span>' : '') + '</div>' +
        '<div class="kz-sub">' + (c.六親 ? '六亲·' + esc(c.六親) : '') + '</div>' +
        (tags ? '<div class="kz-tag">' + esc(tags) + '</div>' : '') +
        '</div>';
    }
    html += '<div class="card"><h3>五兆九宫（数字 ' + r.result['兆'].數字 + ' 水一/火二/木三/金四/土五）</h3><div class="kz-grid">' + cells + '</div></div>';
    html += '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinwuzhao/kentang2017/MIT 现代整理层（敦煌 P.2859《五兆要诀略》），繁体转简体；表数据照录原 Python 源码。</div>';
    return html;
  }

  function init() {
    if (typeof document === 'undefined') return;
    const go = document.getElementById('kz-go');
    if (!go) return;
    go.addEventListener('click', function () {
      const T = (typeof window !== 'undefined' && window.__DATA && window.__DATA.kinwuzhao) || null;
      const L = (typeof window !== 'undefined' && window.Solar && window.Solar.fromYmdHms) ? window.Solar : null;
      const y = parseInt(document.getElementById('kz-y').value, 10);
      const m = parseInt(document.getElementById('kz-m').value, 10);
      const d = parseInt(document.getElementById('kz-d').value, 10);
      const h = parseInt(document.getElementById('kz-h').value, 10);
      const num = parseInt(document.getElementById('kz-num').value, 10) || 0;
      const modeSel = document.getElementById('kz-mode');
      const mode = modeSel ? modeSel.value : 'ganzhi';
      const out = document.getElementById('kz-result');
      if (!(y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31 && h >= 0 && h <= 23)) {
        out.innerHTML = '<div class="muted" style="color:#d17a7a;">请输入合法公历年(1-9999)/月/日/时(0-23)。</div>';
        return;
      }
      out.innerHTML = render(kzCompute(y, m, d, h, T, L, { mode: mode, num: num }));
    });
    const hint = document.getElementById('kz-hint');
    if (hint && window.__DATA && window.__DATA.kinwuzhao) {
      hint.textContent = '已加载五兆数据表（五行映射/六兽/孤虚/月将/旺相表）。输入公历年/月/日/时(0-23)点「起盘」：四柱→节气月将→六宫揲筮→五行六亲/六兽死害/孤虚关籥将军。';
    }
  }

  return { kzCompute, render, init, nextDay, mod5nz, guxuOf, wangxiangOf, buildSkyToEarth, arrangeBeasts };
});
