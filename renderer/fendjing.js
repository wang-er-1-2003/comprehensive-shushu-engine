// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 鬼谷分定经（两头钳）— 算法对译 kinastro(MIT) fendjing_calculator.py
// 数据：engine/data/twogan.json（100 组：判断/命格/基业/兄弟/行藏/婚姻/子息/收成，现代整理层，繁体已转简体）
// 历法：lunar.js（立春分年，与原版 sxtwl 同口径）；晚子时默认 23 时换日换干（原版 after23_new_day=1、hour_gan_use_next_day=1）
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const escW = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const FIVE_TIGERS = { '甲': '丙寅', '己': '丙寅', '乙': '戊寅', '庚': '戊寅', '丙': '庚寅', '辛': '庚寅', '丁': '壬寅', '壬': '壬寅', '戊': '甲寅', '癸': '甲寅' };

  function gzIndex(gz) { return TIANGAN.indexOf(gz[0]); }
  function gzMonthList(yearGan) {
    const start = FIVE_TIGERS[yearGan] || '丙寅';
    const si = gzIndex(start);
    const list = [];
    for (let i = 0; i < 12; i++) list.push(TIANGAN[(si + i) % 10] + DIZHI[(2 + i) % 12]); // 寅月起循环
    return list; // index 0=正月(寅月) … 11=腊月(丑月)
  }

  function compute(y, m, d, h) {
    const data = (window.__DATA && window.__DATA.twogan) || null;
    const items = (data && data.items) || {};
    let cy = y, cm = m, cd = d;
    // 晚子时：23 点算次日（after23_new_day=1 默认）
    if (h === 23) {
      const dt = new Date(y, m - 1, d + 1);
      cy = dt.getFullYear(); cm = dt.getMonth() + 1; cd = dt.getDate();
    }
    const lunar = Lunar.fromDate(new Date(cy, cm - 1, cd));
    const yearGz = lunar.getYearInGanZhiExact(); // 立春分年
    const lunarMonth = Math.abs(lunar.getMonth()); // 农历月（闰月归同月）
    const dayGz = lunar.getDayInGanZhi();
    // 时柱：五鼠遁。23 点时日柱已进位（after23_new_day=1 默认），时干即按进位后日柱（次日）日干起（hour_gan_use_next_day=1 默认）
    const hourDayTg = dayGz[0];
    const hourZhiIdx = Math.floor(((h + 1) % 24) / 2) % 12;
    const hourTg = (gzIndex(hourDayTg) * 2 + hourZhiIdx) % 10;
    const hourGz = TIANGAN[hourTg] + DIZHI[hourZhiIdx];
    const monthList = gzMonthList(yearGz[0]);
    const monthGz = monthList[(lunarMonth - 1 + 12) % 12];
    const twoGanKey = yearGz[0] + hourGz[0];
    const entry = items[twoGanKey] || null;
    return { yearGz, monthGz, dayGz, hourGz, twoGanKey, entry, lunarMonth };
  }

  function fendjingGo() {
    const y = parseInt($('fj-year').value, 10);
    const m = parseInt($('fj-month').value, 10);
    const d = parseInt($('fj-day').value, 10);
    const h = parseInt($('fj-hour').value, 10) || 12;
    const out = $('fj-result');
    if (!(y && m && d)) { out.innerHTML = '<div class="err">请输入完整的公历 年/月/日。</div>'; return; }
    let c;
    try { c = compute(y, m, d, h); } catch (e) { out.innerHTML = '<div class="err">计算失败：' + escW(e.message) + '</div>'; return; }
    let htm = '<div class="card">';
    htm += '<span class="k">鬼谷分定经（两头钳）排盘</span>';
    htm += '<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">';
    htm += '<span class="tag">年柱 ' + escW(c.yearGz) + '</span><span class="tag">月柱 ' + escW(c.monthGz) + '</span><span class="tag">日柱 ' + escW(c.dayGz) + '</span><span class="tag">时柱 ' + escW(c.hourGz) + '</span>';
    htm += '</div>';
    htm += '<div style="margin-top:8px;padding:10px;background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.3);border-radius:8px;text-align:center;"><b style="font-size:20px;color:#FFD700;">两头钳 ' + escW(c.twoGanKey) + '</b>　<span class="muted">（年干 ' + escW(c.yearGz[0]) + ' + 时干 ' + escW(c.hourGz[0]) + '）</span></div>';
    if (!c.entry) {
      htm += '<div class="err">该组合（' + escW(c.twoGanKey) + '）在库中未收录（数据仅 100 组年干×时干组合）。</div>';
    } else {
      if (c.entry.判断) htm += '<div style="margin-top:10px;padding:10px;background:rgba(0,0,0,.14);border-radius:8px;"><b style="color:var(--fj1);">判断</b><div style="margin-top:4px;">' + escW(c.entry.判断) + '</div></div>';
      if (c.entry.命格 && c.entry.命格.length) {
        htm += '<div style="margin-top:10px;"><b style="color:var(--fj1);">命格</b><ul style="margin:4px 0 0 18px;">' + c.entry.命格.map((s) => '<li>' + escW(s) + '</li>').join('') + '</ul></div>';
      }
      const secs = [['基业', '基业'], ['兄弟', '兄弟'], ['行藏', '行藏'], ['婚姻', '婚姻'], ['子息', '子息'], ['收成', '收成']];
      for (const [label, k] of secs) {
        if (c.entry[k]) htm += '<div style="margin-top:8px;"><b style="color:var(--fj1);">' + label + '</b><div class="muted" style="margin-top:3px;">' + escW(c.entry[k]) + '</div></div>';
      }
    }
    htm += '<div class="muted" style="font-size:11px;margin-top:8px;">来源：算法对译 kinastro(MIT) fendjing_calculator.py；数据为现代整理层 twogan.pickle（100 组年干×时干），繁体已转简体，断语非古籍原文。历法：立春分年、农历月取月柱（五虎遁）、23 点子时换日换干（晚子时默认口径）。</div>';
    htm += '</div>';
    out.innerHTML = htm;
  }

  function fjInit() {
    if ($('fj-go')) $('fj-go').addEventListener('click', fendjingGo);
  }
  window.fendjingInit = fjInit;
  window.fendjingCompute = compute;
})();
