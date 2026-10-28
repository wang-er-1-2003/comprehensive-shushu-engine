// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 太乙四法积年对照 + 太乙人道命法（kintaiyi/kentang2017/MIT 现代整理层移植，有限补强）
// 口径核对结论见测试：与引擎既有 taiyi.json（金镜式经立成表144局）在 1588 锚点一致
// 红线：积年锚点/局/元/落宫照录源码表值，未载处返回空不伪造；sxtwl 天文排星链不移植
'use strict';
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { const api = factory(); root.kintaiyiMod = api; root.kintaiyiInit = api.init; }
})(typeof self !== 'undefined' ? self : this, function () {

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const JIAZI = (function () {
    const g = '甲乙丙丁戊己庚辛壬癸', z = '子丑寅卯辰巳午未申酉戌亥', r = [];
    for (let i = 0; i < 60; i++) r.push(g[i % 10] + z[i % 12]);
    return r;
  })();
  const jiaziIdx1 = (gz) => { const i = JIAZI.indexOf(gz); return i < 0 ? 0 : i + 1; };
  const ZHI = '子丑寅卯辰巳午未申酉戌亥';

  const wxNum = (T, wx) => T.wxNum[wx] || 0;
  const gzWxNum = (T, ch) => wxNum(T, (T.ganzhiWx || {})[ch] || '');
  const nayinWxNum = (T, gz) => wxNum(T, (T.nayin || {})[gz] || '');

  // ---- 四柱（与 shenyishu.js 同口径：23时换日；lunar.js）----
  function fourPillars(y, m, d, h, L) {
    let Y = y, M = m, Dd = d;
    if (h === 23) {
      const dt = new Date(Date.UTC(y, m - 1, d + 1));
      Y = dt.getUTCFullYear(); M = dt.getUTCMonth() + 1; Dd = dt.getUTCDate();
    }
    const lunDay = L.fromYmdHms(Y, M, Dd, 12, 0, 0).getLunar();
    const lunHour = L.fromYmdHms(y, m, d, h, 0, 0).getLunar();
    const lunBase = L.fromYmdHms(y, m, d, 12, 0, 0).getLunar();
    return {
      gz: [lunDay.getYearInGanZhiExact(), lunDay.getMonthInGanZhiExact(), lunDay.getDayInGanZhi(), lunHour.getTimeInGanZhi()],
      minuteGz: JIAZI[((h * 60) >> 1) % 60],
      lunarYear: lunBase.getYear(), lunarMonth: lunBase.getMonth()
    };
  }

  // ---- 四法积年对照（kintaiyi.py accnum + getyuan + ty_gong 对译）----
  // T.fourMethod = {統宗:10153917, 金鏡:1936557, 淘金歌:10154193, 太乙局:10153917}
  // 統宗/太乙局: acum = anchor + lunarYear；金鏡/淘金歌: acum = anchor + lunarYear（同式，锚点常数不同）
  function siFaTable(lunarYear, T) {
    const out = {};
    Object.keys(T.fourMethod).forEach((method) => {
      const acum = T.fourMethod[method] + lunarYear;
      const ju = acum % 72 === 0 ? 72 : acum % 72;
      // getyuan: find = 1 if acum%360==1 else round((acum%360)/72)；五元 jiazi[0::12]
      const rem360 = acum % 360;
      let find = rem360 === 1 ? 1 : Math.round(rem360 / 72);
      if (find < 1) find = 1;
      const yuan = ['甲子', '丙子', '戊子', '庚子', '壬子'][find - 1] || '';
      const gong = (T.taiyiPai || [])[ju - 1] || '';
      out[method] = { 积年: acum, 局: ju, 元: yuan, 落宫卦: gong };
    });
    return out;
  }

  // ---- 太乙人道命法起数（kintaiyi.py life_start_gua 链 + taiyi_life_accum 对译）----
  // startSum = Σ(干五行数+支五行数+纳音五行数) over 四柱 + 55；startNum = startSum % 64
  // config.gua 键 1..64（1=乾..64=未濟），键0为 None（源如此照录）
  function nameByKey(T, k) { return k === 0 ? null : (T.gua64 || [])[k - 1] || null; }
  function bump(T, num) { return num > 64 ? num % 64 : num; }

  function taiyiLife(y, m, d, h, age, T, L) {
    if (!T || !L || typeof L.fromYmdHms !== 'function') return { ok: false, reason: '数据表或历法库未加载' };
    const fp = fourPillars(y, m, d, h, L);
    let sum = 0;
    fp.gz.forEach((gz) => { sum += gzWxNum(T, gz[0]) + gzWxNum(T, gz[1]) + nayinWxNum(T, gz); });
    sum += 55;
    const startNum = sum % 64;
    const yearNum = bump(T, startNum + age);
    const monthNum = bump(T, yearNum + 2 + fp.lunarMonth);
    const dayNum = bump(T, monthNum + jiaziIdx1(fp.gz[2]));
    const hourNum = bump(T, dayNum + ZHI.indexOf(fp.gz[3][1]) + 1);
    const minuteNum = bump(T, hourNum + jiaziIdx1(fp.minuteGz));

    // 三才数（taiyi_life_accum）：本引擎以 lunar.js 当前上一节气替代 sxtwl 天文节气
    const lun = L.fromYmdHms(y, m, d, h, 0, 0).getLunar();
    let sky = null, earth = null, people = null, jqName = '', daysSinceTerm = 0;
    try {
      const prev = lun.getPrevJieQi(true);
      if (prev) {
        jqName = prev.getName();
        daysSinceTerm = Math.floor(L.fromYmdHms(y, m, d, h, 0, 0).getSolar().subtract(prev.getSolar()));
        if (daysSinceTerm < 0) daysSinceTerm = 0;
        const Lf = T.life, jqOff = (T.jqAccum || {})[jqName] || 0;
        const jiaziAccum = jiaziIdx1(fp.gz[0]) * Lf.jiaziUnit;
        const yBase = Lf.base + Math.floor((fp.lunarYear - Lf.anchorYear) / 60) * Lf.per60;
        const accum = Math.floor((jiaziAccum + yBase + jqOff + daysSinceTerm * 10000) / 10000);
        sky = accum % 720; earth = sky % 72; people = earth % 72;
      }
    } catch (e) { /* 节气不可得时如实留空 */ }

    return {
      ok: true,
      四柱: fp.gz,
      农历: { 年: fp.lunarYear, 月: fp.lunarMonth },
      四法: siFaTable(fp.lunarYear, T),
      出身卦: { 数: startNum, 卦: nameByKey(T, startNum) },
      流年卦: { 数: yearNum, 卦: nameByKey(T, yearNum) },
      流月卦: { 数: monthNum, 卦: nameByKey(T, monthNum) },
      流日卦: { 数: dayNum, 卦: nameByKey(T, dayNum) },
      流时卦: { 数: hourNum, 卦: nameByKey(T, hourNum) },
      分流卦: { 数: minuteNum, 卦: nameByKey(T, minuteNum) },
      三才: { 节气: jqName, 距节气日: daysSinceTerm, 天: sky, 地: earth, 人: people }
    };
  }

  // ---- 渲染 ----
  function renderLife(r, T) {
    if (!r.ok) return '<div class="muted">' + esc(r.reason) + '</div>';
    const g = (o) => o.卦 ? esc(o.卦) : '<span class="muted">（数' + o.数 + '，源表0值不载卦名）</span>';
    const rows = Object.keys(r.四法).map((k) => {
      const v = r.四法[k];
      return '<tr><td style="padding:3px 8px;border:1px solid #444;">' + esc(k) + '</td><td style="padding:3px 8px;border:1px solid #444;">' + v.积年 + '</td><td style="padding:3px 8px;border:1px solid #444;">' + v.局 + '局</td><td style="padding:3px 8px;border:1px solid #444;">' + esc(v.元) + '</td><td style="padding:3px 8px;border:1px solid #444;">' + esc(v.落宫卦) + '</td></tr>';
    }).join('');
    return '' +
      '<div class="card"><h3>太乙四法积年对照（农历' + r.农历.年 + '年）</h3>' +
      '<table style="border-collapse:collapse;margin:6px 0;"><thead><tr><th style="padding:3px 8px;border:1px solid #444;">法</th><th style="padding:3px 8px;border:1px solid #444;">积年</th><th style="padding:3px 8px;border:1px solid #444;">局</th><th style="padding:3px 8px;border:1px solid #444;">元</th><th style="padding:3px 8px;border:1px solid #444;">落宫卦</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="muted" style="font-size:11px;">积年锚点常数：' + Object.keys(T.fourMethod).map((k) => k + '=' + T.fourMethod[k]).join('，') + '（kintaiyi accnum 对译；統宗=太乙局）。局=积年%72，元=round((积年%360)/72) 查五元甲子/丙子/戊子/庚子/壬子。</div></div>' +
      '<div class="card"><h3>太乙人道命法（四柱：' + r.四柱.map(esc).join(' / ') + '）</h3>' +
      '<div class="sy-zw">' +
      '<div class="sy-zw-i"><b>' + g(r.出身卦) + '</b><span>出身卦（数' + r.出身卦.数 + '）</span></div>' +
      '<div class="sy-zw-i"><b>' + g(r.流年卦) + '</b><span>流年卦（数' + r.流年卦.数 + '）</span></div>' +
      '<div class="sy-zw-i"><b>' + g(r.流月卦) + '</b><span>流月卦（数' + r.流月卦.数 + '）</span></div>' +
      '<div class="sy-zw-i"><b>' + g(r.流日卦) + '</b><span>流日卦（数' + r.流日卦.数 + '）</span></div>' +
      '<div class="sy-zw-i"><b>' + g(r.流时卦) + '</b><span>流时卦（数' + r.流时卦.数 + '）</span></div>' +
      '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:6px;">三才数：' + (r.三才.天 != null ? '节气「' + esc(r.三才.节气) + '」后第' + r.三才.距节气日 + '日　天' + r.三才.天 + '·地' + r.三才.地 + '·人' + r.三才.人 : '<span class="muted">节气数据不可得，留空待核</span>') + '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:4px;">来源：kintaiyi/kentang2017/MIT 现代整理层（taiyi_life_accum / life_start_gua 链对译，繁体转简体）；五行数：金13木11水7火9土15；sxtwl 天文排星（七政四余/十六神排星）依赖未移植。</div></div>';
  }

  function init() {
    if (typeof document === 'undefined') return;
    const T = (typeof window !== 'undefined' && window.__DATA && window.__DATA.taiyi_ming) || null;
    const L = (typeof window !== 'undefined' && window.Solar && window.Solar.fromYmdHms) ? window.Solar : null;
    const go = document.getElementById('ty2-go');
    if (go) {
      go.addEventListener('click', () => {
        const num = (id) => parseInt((document.getElementById(id) || {}).value, 10);
        const out = document.getElementById('ty2-result');
        out.innerHTML = renderLife(taiyiLife(num('ty2-y'), num('ty2-m'), num('ty2-d'), num('ty2-h'), num('ty2-age') || 0, T, L), T);
      });
    }
    const hint = document.getElementById('ty2-hint');
    if (hint && T) hint.textContent = '已加载四法锚点 4 套 + 72局落宫 + 60纳音五行。';
  }

  return { siFaTable, taiyiLife, fourPillars, renderLife, init };
});
