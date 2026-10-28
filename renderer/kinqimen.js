// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 坚奇门补充层（kinqimen/kentang2017/MIT 现代整理层）——B 类重叠包
// 引擎时家奇门已验收，本模块不重起局、不改 qimen.js，只在既有 qm-* 起局结果上补 Horosa 特有三层：
//   1) 神煞三件：天马(moonhorse)/驿马(hourhorse)/丁马(dinhorse)——config.py 原算式对译
//   2) 空亡：daykong_shikong（旬首旬空）
//   3) 刻家暗干：angan.py 360 条查表（仅 阳一/四/七、阴三/六/九 局有时家表可查，其余如实标未载）
//   4) 日干十二长生：find_shier_luck 对译（阳顺阴逆），作展示参考
'use strict';
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { const api = factory(); root.kinqimenMod = api; root.kinqimenInit = api.init; }
})(typeof self !== 'undefined' ? self : this, function () {

  const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const TG = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const CNUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 驿马（时支三合局）：config.hourhorse 对译
  const YIMA = { 申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 亥: '巳', 卯: '巳', 未: '巳', 巳: '亥', 酉: '亥', 丑: '亥' };
  // 天马（日支）：config.moonhorse 对译（寅申→午，卯酉→申，辰戌→戌，巳亥→子，午子→寅，丑未→辰）
  const TIANMA = { 寅: '午', 申: '午', 卯: '申', 酉: '申', 辰: '戌', 戌: '戌', 巳: '子', 亥: '子', 午: '寅', 子: '寅', 丑: '辰', 未: '辰' };
  // 丁马（日干支旬首）：config.dinhorse 对译
  const DINGMA = { 甲子: '卯', 甲戌: '丑', 甲申: '亥', 甲午: '酉', 甲辰: '未', 甲寅: '巳' };
  // 旬空：config.daykong_shikong 对译
  const KONG = { 甲子: ['戌', '亥'], 甲戌: ['申', '酉'], 甲申: ['午', '未'], 甲午: ['辰', '巳'], 甲辰: ['寅', '卯'], 甲寅: ['子', '丑'] };

  function jiaziIdx(gz) {
    const g = TG.indexOf(gz[0]), z = DZ.indexOf(gz[1]);
    for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === z) return i;
    return -1;
  }
  function xunHead(gz) {
    const i = jiaziIdx(gz);
    if (i < 0) return '';
    const h = Math.floor(i / 10) * 10;
    return TG[h % 10] + DZ[h % 12];
  }

  // 神煞三件 + 空亡（输入日柱、时柱干支）
  function kqHorses(dayGZ, timeGZ) {
    if (!dayGZ || !timeGZ || dayGZ.length < 2 || timeGZ.length < 2) return { ok: false, reason: '四柱未就绪' };
    const dZhi = dayGZ[1], tZhi = timeGZ[1];
    const dh = xunHead(dayGZ), th = xunHead(timeGZ);
    return {
      ok: true,
      天马: TIANMA[dZhi] || '辞不载',
      驿马: YIMA[tZhi] || '辞不载',
      丁马: DINGMA[dh] || '辞不载',
      旬首: { 日: dh, 时: th },
      日空: (KONG[dh] || []).join(''),
      时空: (KONG[th] || []).join('')
    };
  }

  // 日干十二长生：config.find_shier_luck 对译
  // 阳干(甲丙戊庚壬)：起长生 亥/寅/寅/巳/申，顺行 长生沐浴冠带临冠帝旺衰病死墓绝胎养
  // 阴干(乙丁己辛癸)：同起点，cheungsunlist = 死病衰帝旺临冠冠带沐浴长生养胎绝墓
  const CHANGSHENG_START = { 甲: 11, 丙: 2, 戊: 2, 庚: 5, 壬: 8, 乙: 11, 丁: 2, 己: 2, 辛: 5, 癸: 8 }; // DZ 下标：亥11寅2巳5申8
  function kqChangsheng(dayGan) {
    if (CHANGSHENG_START[dayGan] == null) return { ok: false };
    const yi = TG.indexOf(dayGan) % 2 === 0; // 阳干
    const start = CHANGSHENG_START[dayGan];
    const yangOrder = ['长生', '沐浴', '冠带', '临冠', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
    const yinOrder = ['死', '病', '衰', '帝旺', '临冠', '冠带', '沐浴', '长生', '养', '胎', '绝', '墓'];
    const map = {};
    for (let k = 0; k < 12; k++) map[DZ[(start + k) % 12]] = (yi ? yangOrder : yinOrder)[k];
    return { ok: true, gan: dayGan, yin: !yi, map, 长生宫: DZ[start] };
  }

  // 刻家暗干查表：angan.py Angan 字典（键=阴阳遁+局数汉字+时干支）。
  // T 兼容两种传入：整表 {_meta,angan:{...}} 或纯 360 条字典。
  function kqAngan(dun, juNum, shiGZ, T) {
    if (!T) return { ok: false, reason: '暗干表未加载' };
    if (!(juNum >= 1 && juNum <= 9)) return { ok: false, reason: '局数未就绪' };
    const yin = (dun || '').indexOf('阴') === 0;
    const g = (yin ? '阴' : '阳') + CNUM[juNum - 1];
    const key = g + shiGZ;
    const dict = (T && T.angan && T.angan.angan) ? T.angan.angan : ((T && T.angan) ? T.angan : T);
    const row = dict[key];
    if (!row) return { ok: false, key, g, shiGZ, reason: '未载（刻家暗干表仅收 阳一/四/七、阴三/六/九局；本局属时家奇门另一局数，原表无此键）' };
    return { ok: true, key, gangan: row.slice(0, 9), feigan: row[9] || '' };
  }

  function renderExtra(R, T) {
    const out = [];
    out.push('<div class="qm-verdict"><b>坚奇门补充层</b> <span style="color:var(--tx3);font-size:11px;">（kinqimen/kentang2017/MIT 现代整理层；不重起局，仅在本页起局结果上补 Horosa 特有层）</span>');
    const h = kqHorses(R.dayGZ, R.timeGZ);
    if (h.ok) {
      out.push('<div style="margin-top:4px;">神煞：天马 <b>' + esc(h.天马) + '</b> · 驿马 <b>' + esc(h.驿马) + '</b> · 丁马 <b>' + esc(h.丁马) + '</div>');
      out.push('<div>空亡：日空 <b>' + esc(h.日空) + '</b>（旬首' + esc(h.旬首.日) + '）· 时空 <b>' + esc(h.时空) + '</b>（旬首' + esc(h.旬首.时) + '）</div>');
    } else out.push('<div style="color:var(--tx3);">神煞/空亡：' + esc(h.reason || '') + '</div>');
    const cs = kqChangsheng((R.dayGZ || '')[0]);
    if (cs.ok) {
      const seg = DZ.map((z) => z + cs.map[z]).join(' ');
      out.push('<div>日干 <b>' + esc(cs.gan) + '</b> 十二长生（' + (cs.yin ? '阴干逆行' : '阳干顺行') + '，长生在' + esc(cs.长生宫) + '）：' + esc(seg) + '</div>');
    }
    const ag = kqAngan(R.dun, R.ju, R.timeGZ, T && T.angan ? T : (window.__DATA && window.__DATA.qimen ? window.__DATA.qimen : null));
    if (ag.ok) {
      const palaces = ['坎', '坤', '震', '巽', '中', '乾', '兑', '艮', '离'];
      out.push('<div>刻家暗干（' + esc(ag.key) + '）：' + palaces.map((p, i) => p + ag.gangan[i]).join(' · ') + '　飞干 <b>' + esc(ag.feigan) + '</b></div>');
    } else {
      out.push('<div>刻家暗干：' + esc(ag.reason || '未载') + '</div>');
    }
    out.push('<div style="font-size:11px;color:var(--tx3);margin-top:4px;">口径差异记录（引擎不改）：①八神——Horosa 阳盘用勾陈/朱雀、阴盘用白虎/玄武，引擎统一白虎/玄武；②定元——Horosa 用符头五日语定元，引擎用日支直接定元；③置闰——Horosa 含全节气超神接气，引擎置闰仅特判芒种/大雪。</div>');
    out.push('</div>');
    return out.join('');
  }

  function init() {
    if (typeof document === 'undefined') return;
    const go = document.getElementById('qm-go');
    if (!go) return;
    go.addEventListener('click', () => {
      // qimen.js 的监听先注册先执行，window._qmR 已就绪；本层只读不写
      const R = window._qmR;
      const box = document.getElementById('kq-extra');
      if (!R || !box) return;
      box.innerHTML = renderExtra(R, null);
    });
  }

  return { kqHorses, kqChangsheng, kqAngan, xunHead, renderExtra, init };
});
