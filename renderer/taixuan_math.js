// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 太玄数 — 算法结构对译 kinastro(MIT) taixuan_calculator.py（本命排盘 + 即时问卜）
// 数据源：引擎《太玄经》81 首原文（taixuan.json；taixuanshifa 字典未随 kinastro zip 提供，以 81 首全序替代原版 80 首，每首 ≈365.25/81≈4.51 天，口径差异在输出中如实标注）
// 干支修正说明（相对原版）：仅时柱按五鼠遁+子时归子（原版 hour//2 在 23 时落亥，已修正为 23-0 点子时）；月柱沿用原版公历月建近似（公历 2 月=寅月），已在输出标注
'use strict';
(() => {
  const escW = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const $ = (id) => document.getElementById(id);

  const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const ZHAN_NAMES = ['初一', '次二', '次三', '次四', '次五', '次六', '次七', '次八', '上九'];
  const WUXING = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水', '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  const NUM_ZH = { 1: '一', 2: '二', 3: '三' };
  const SISHI = { '旦': [3, 9], '日中': [9, 15], '夕': [15, 21], '夜中': [21, 3] };
  const TWENTY_EIGHT = ['角', '亢', '氐', '房', '心', '尾', '箕', '斗', '牛', '女', '虚', '危', '室', '壁', '奎', '娄', '胃', '昴', '毕', '觜', '参', '井', '鬼', '柳', '星', '张', '翼', '轸'];
  const MANSION_WIDTHS = [['斗', 26], ['牛', 8], ['女', 12], ['虚', 10], ['危', 17], ['室', 16], ['壁', 9], ['奎', 16], ['娄', 12], ['胃', 14], ['昴', 11], ['毕', 16], ['觜', 2], ['参', 9], ['井', 33], ['鬼', 4], ['柳', 15], ['星', 7], ['张', 18], ['翼', 18], ['轸', 17], ['角', 12], ['亢', 9], ['氐', 15], ['房', 5], ['心', 5], ['尾', 18], ['箕', 11]];
  const MANSION_TOTAL = MANSION_WIDTHS.reduce((a, b) => a + b[1], 0); // 365
  const PLANET_SEQ = ['太阳', '太阴', '金星', '木星', '水星', '火星', '土星', '罗喉', '计都']; // 九行星循环 (serial-1)%9
  const DAYS_PER_YEAR = 365.25;
  const TOTAL = 81; // 《太玄经》81 首全序（原版 taixuanshifa 为 80 首口径）

  function allShou() { const d = (window.__DATA && window.__DATA.taixuan) || []; return Array.isArray(d) ? d : []; }
  function julianDay(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function winterSolsticeJd(y) { return julianDay(y, 12, 22); }
  function hourToSishi(h) { if (h >= 3 && h < 9) return '旦'; if (h >= 9 && h < 15) return '日中'; if (h >= 15 && h < 21) return '夕'; return '夜中'; }
  function gzYear(y) { return TIANGAN[((y - 4) % 10 + 10) % 10] + DIZHI[((y - 4) % 12 + 12) % 12]; }
  // 月柱：公历月建近似（原版口径，公历 2 月=寅月，1 月≈丑月）——与 taixuan_calculator.py 一致
  function gzMonth(y, m) {
    const dzIdx = m % 12; // m=2→寅(2) … m=1→丑(1)
    const yt = ((y - 4) % 10 + 10) % 10;
    const tgBase = ((yt % 5) * 2 + 2) % 10; // 五虎遁寅月起
    const tgIdx = (tgBase + (((m - 2) % 12) + 12) % 12) % 10;
    return TIANGAN[tgIdx] + DIZHI[dzIdx];
  }
  function gzDay(y, m, d) {
    const idx = Math.floor(julianDay(y, m, d) + 0.5) + 49;
    return TIANGAN[((idx % 10) + 10) % 10] + DIZHI[((idx % 12) + 12) % 12];
  }
  // 时柱：五鼠遁 + 子时归子（23-0 点子时）——原版 hour//2 在 23 时落亥，已修正
  function gzHour(h, dayTg) {
    const dzIdx = Math.floor(((h + 1) % 24) / 2) % 12;
    const tgBase = (TIANGAN.indexOf(dayTg) % 5) * 2;
    return TIANGAN[(tgBase + dzIdx) % 10] + DIZHI[dzIdx];
  }
  function keyToName(serial) {
    const s = String(serial);
    // 《太玄经》81 首按序：首名 = 方州部家编号（serial→9×9 网格行优先）
    const row = Math.floor((serial - 1) / 9), col = (serial - 1) % 9;
    const fang = Math.floor(row / 3), zhou = row % 3, bu = Math.floor(col / 3), jia = col % 3;
    return NUM_ZH[fang + 1] + '方' + NUM_ZH[zhou + 1] + '州' + NUM_ZH[bu + 1] + '部' + NUM_ZH[jia + 1] + '家';
  }
  function mansionForSerial(serial) { const idx = Math.floor(((serial - 1) * 28) / TOTAL); return TWENTY_EIGHT[idx % 28]; }
  function mansionDegreeForDays(days) {
    const dm = ((days % MANSION_TOTAL) + MANSION_TOTAL) % MANSION_TOTAL;
    let cum = 0;
    for (const [name, w] of MANSION_WIDTHS) {
      if (cum + w >= dm) return { name, degree: Math.max(1, Math.floor(dm - cum) + 1) };
      cum += w;
    }
    return { name: MANSION_WIDTHS[MANSION_WIDTHS.length - 1][0], degree: 1 };
  }
  function planetForSerial(serial) { return PLANET_SEQ[(serial - 1) % 9]; }
  function pickZhanByHour(h) { return Math.min(Math.floor((h * 9) / 24), 8); }

  function shouData(serial, sishi, zhanIdx, daysPrecise) {
    const list = allShou();
    const idx = serial - 1;
    const item = list[idx] || null;
    const name = item ? item.name : '';
    const guaText = item ? (item.shouci || '') : '';
    const zan = item ? (item.zan || []) : [];
    const zhanName = ZHAN_NAMES[zhanIdx];
    const zhanText = (zan[zhanIdx] && zan[zhanIdx].ci) || '';
    const md = mansionDegreeForDays(daysPrecise);
    return {
      serial, keyName: keyToName(serial), guaName: name, guaText,
      zhanName, zhanText, sishi, mansion: md.name, mansionDegree: md.degree,
      planet: planetForSerial(serial), allZan: zan.map((z) => ({ weizhi: z.weizhi, ci: z.ci })),
    };
  }

  function calcNatal(y, m, d, h) {
    const birthJd = julianDay(y, m, d);
    let wsYear = (m < 12) ? y - 1 : y;
    let wsJd = winterSolsticeJd(wsYear);
    let days = birthJd - wsJd;
    if (days < 0) { wsJd = winterSolsticeJd(wsYear - 1); days = birthJd - wsJd; }
    const daysPerShou = DAYS_PER_YEAR / TOTAL;
    const serial = Math.floor(days / daysPerShou) % TOTAL + 1;
    const sishi = hourToSishi(h);
    const zhanIdx = pickZhanByHour(h);
    const daysPrecise = days + h / 24;
    const shou = shouData(serial, sishi, zhanIdx, daysPrecise);
    const yg = gzYear(y), mg = gzMonth(y, m), dg = gzDay(y, m, d), hg = gzHour(h, dg[0]);
    const annual = [];
    for (let off = 0; off < 81; off++) {
      const yr = y + off;
      const s = ((serial - 1 + off) % TOTAL + TOTAL) % TOTAL + 1;
      const it = allShou()[s - 1] || null;
      annual.push({ year: yr, age: off, gz: gzYear(yr), serial: s, guaName: it ? it.name : '' });
    }
    return { mode: 'natal', shou, yg, mg, dg, hg, annual };
  }

  function calcQigua() {
    const serial = Math.floor(Math.random() * TOTAL) + 1;
    const zhanIdx = Math.floor(Math.random() * 9);
    const sishi = Object.keys(SISHI)[Math.floor(Math.random() * 4)];
    const now = new Date();
    const wsYear = (now.getMonth() + 1 < 12) ? now.getFullYear() - 1 : now.getFullYear();
    const wsJd = winterSolsticeJd(wsYear);
    const nowJd = julianDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const days = nowJd - wsJd + now.getHours() / 24;
    const shou = shouData(serial, sishi, zhanIdx, days);
    return { mode: 'qigua', shou, now: now.toLocaleString('zh-CN') };
  }

  function txNatal() {
    const y = parseInt($('tx-year').value, 10);
    const m = parseInt($('tx-month').value, 10);
    const d = parseInt($('tx-day').value, 10);
    const h = parseInt($('tx-hour').value, 10) || 12;
    const out = $('tx-num-result');
    if (!(y && m && d)) { out.innerHTML = '<div class="err">请输入完整的公历 年/月/日。</div>'; return; }
    render(calcNatal(y, m, d, h), out);
  }
  function txQigua() {
    const out = $('tx-num-result');
    render(calcQigua(), out);
  }

  function render(c, out) {
    const s = c.shou;
    let htm = '<div class="card">';
    htm += '<span class="k">太玄数 · ' + (c.mode === 'natal' ? '本命排盘' : '即时问卜（随机取首取赞，模拟蓍草）') + '</span>';
    if (c.mode === 'natal') {
      htm += '<div class="muted" style="font-size:12px;">出生：' + escW(c.yg) + '年 ' + escW(c.mg) + '月 ' + escW(c.dg) + '日 ' + escW(c.hg) + '时（四柱：年柱' + escW(c.yg) + '·月柱' + escW(c.mg) + '·日柱' + escW(c.dg) + '·时柱' + escW(c.hg) + '）</div>';
    } else {
      htm += '<div class="muted" style="font-size:12px;">' + escW(c.now) + '（取首取赞为随机乱数）</div>';
    }
    // 命宫首
    htm += '<div style="margin:8px 0;"><b style="color:var(--tx1);">命宫首</b>：<span class="tag">' + escW(s.keyName) + '</span>（第 ' + s.serial + ' 首）　卦名：<b>' + escW(s.guaName) + '</b>';
    htm += '<div class="muted" style="margin-top:4px;">四时段：' + escW(s.sishi) + '　当值赞：<b>' + escW(s.zhanName) + '</b>　二十八宿：' + escW(s.mansion) + '（入宿 ' + s.mansionDegree + ' 度）　七政：' + escW(s.planet) + '</div>';
    if (s.guaText) htm += '<div style="margin-top:6px;padding:8px 10px;background:rgba(0,0,0,.14);border-radius:6px;"><b>首辞</b>：' + escW(s.guaText) + '</div>';
    if (s.zhanText) htm += '<div style="margin-top:4px;padding:8px 10px;background:rgba(0,0,0,.14);border-radius:6px;"><b>' + escW(s.zhanName) + ' 赞辞</b>：' + escW(s.zhanText) + '</div>';
    htm += '</div>';
    // 全部九赞
    if (s.allZan && s.allZan.length) {
      htm += '<div style="border-top:1px solid var(--line);margin:8px 0;"></div><b style="color:var(--tx1);">全首九赞</b>';
      htm += '<div style="display:flex;flex-direction:column;gap:3px;margin-top:4px;">' + s.allZan.map((z) => {
        const active = z.weizhi === s.zhanName;
        return '<div style="padding:3px 8px;background:' + (active ? 'rgba(255,215,0,.10)' : 'rgba(0,0,0,.10)') + ';border-radius:6px;"><span class="tag">' + escW(z.weizhi) + '</span> ' + escW(z.ci) + (active ? ' <span style="color:#FFD700;">← 当值</span>' : '') + '</div>';
      }).join('') + '</div>';
    }
    // 行年大限
    if (c.mode === 'natal' && c.annual) {
      htm += '<div style="border-top:1px solid var(--line);margin:8px 0;"></div><b style="color:var(--tx1);">行年大限（' + c.annual.length + ' 年，从本命首起逐年顺推一首）</b>';
      htm += '<table style="width:100%;border-collapse:collapse;margin-top:4px;font-size:12px;"><tr style="color:var(--muted);text-align:left;"><th style="padding:2px 6px;border-bottom:1px solid var(--line);">年份</th><th style="padding:2px 6px;border-bottom:1px solid var(--line);">年龄</th><th style="padding:2px 6px;border-bottom:1px solid var(--line);">年干支</th><th style="padding:2px 6px;border-bottom:1px solid var(--line);">首序</th><th style="padding:2px 6px;border-bottom:1px solid var(--line);">卦名</th></tr>';
      for (const a of c.annual) {
        htm += '<tr><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + a.year + '</td><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + a.age + '</td><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + escW(a.gz) + '</td><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + a.serial + '</td><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + escW(a.guaName) + '</td></tr>';
      }
      htm += '</table>';
    }
    // 81 首参照
    const list = allShou();
    if (list.length) {
      htm += '<div style="border-top:1px solid var(--line);margin:8px 0;"></div><b style="color:var(--tx1);">《太玄经》81 首参照</b>';
      htm += '<table style="width:100%;border-collapse:collapse;margin-top:4px;font-size:12px;"><tr style="color:var(--muted);text-align:left;"><th style="padding:2px 6px;border-bottom:1px solid var(--line);">序</th><th style="padding:2px 6px;border-bottom:1px solid var(--line);">方州部家</th><th style="padding:2px 6px;border-bottom:1px solid var(--line);">首名</th><th style="padding:2px 6px;border-bottom:1px solid var(--line);">二十八宿</th><th style="padding:2px 6px;border-bottom:1px solid var(--line);">七政</th></tr>';
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        htm += '<tr><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + (i + 1) + '</td><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + escW(keyToName(i + 1)) + '</td><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + escW(it.name || '') + '</td><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + escW(mansionForSerial(i + 1)) + '</td><td style="padding:2px 6px;border-bottom:1px solid var(--line);">' + escW(planetForSerial(i + 1)) + '</td></tr>';
      }
      htm += '</table>';
    }
    htm += '<div class="muted" style="font-size:11px;margin-top:6px;">来源：算法结构对译 kinastro(MIT) taixuan_calculator.py（现代整理层）；数据用引擎《太玄经》81 首原文（首辞/九赞）。口径差异：原版 taixuanshifa 为 80 首/每首≈4.57 天，本版按《太玄经》81 首全序/每首≈4.51 天；月柱为公历月建近似（公历 2 月=寅月，与原版一致）；时柱按五鼠遁、23-0 点子时归子（原版 23 时落亥，已修正）；二十八宿入宿度按传统 365 度从斗起。断语为《太玄经》原文。</div>';
    htm += '</div>';
    out.innerHTML = htm;
  }

  function txInit() {
    if ($('tx-go')) $('tx-go').addEventListener('click', txNatal);
    if ($('tx-qigua')) $('tx-qigua').addEventListener('click', txQigua);
  }
  window.taixuanMathInit = txInit;
  window.taixuanMathNatal = calcNatal;
})();
