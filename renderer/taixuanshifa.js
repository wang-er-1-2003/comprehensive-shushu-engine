// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 太玄筮法 · 扬雄《太玄经》方州部家八十一首（kentang2017/MIT 现代整理层移植）
// taixuanshifa.py 逐行对译（qigua_number 四掷 + pan 排盘），繁体转简体
// 红线：81 首数据照录源包 taixuandict.p（pickle 反序列化）；与引擎 taixuan.json 为同一《太玄经》81 首体系的不同数据源（2026-10-28 起三法并入同 tab：太玄筮法/太玄数/揲蓍占法）
// 历法：农历/干支展示一律用 vendor/lunar.js（与源 cnlunar 同口径：立春换年/节气月）
'use strict';
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { const api = factory(); root.taixuanshifaMod = api; root.taixuanshifaInit = api.init; }
})(typeof self !== 'undefined' ? self : this, function () {

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 二十八宿 365 度表：照译源码 gen_clist + itertools.chain（宿名以「牛」起转，宿度按位对应）
  function buildSu(T) {
    const seed = T.su_seed;
    const cn = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
      '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十', '三十一', '三十二', '三十三'];
    const out = [];
    for (let i = 0; i < seed['宿'].length; i++) {
      for (let j = 1; j <= seed['度'][i]; j++) out.push(seed['宿'][i] + cn[j - 1]);
    }
    return out;
  }

  // 随机整数 [a,b]，对译 python random.sample(range(a,b+1),1)
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  // 一掷：照译源码两次挂揲，wai=7/8/9 → 1/2/3
  function oneDraw() {
    const stalksFirst = 36 - 3 - 1; // 36 策，虚三，挂一
    const v = randInt(25, stalksFirst - 1); // range(25, stalksFirst)
    let left = (v - 10) % 3; if (left === 0) left = 3;
    let right = (stalksFirst + 10 - v) % 3; if (right === 0) right = 3;
    const stalksSecond = stalksFirst - left - right;
    const v2 = randInt(25, stalksSecond - 1); // range(25, stalksSecond)
    let left2 = (v2 - 10) % 3; if (left2 === 0) left2 = 3;
    let right2 = (stalksSecond + 10 - v2) % 3; if (right2 === 0) right2 = 3;
    const stalksThird = stalksSecond - left2 - right2;
    const wai = stalksThird / 3;
    return { 7: 1, 8: 2, 9: 3 }[wai];
  }

  function qiguaNumber() {
    const result = [oneDraw(), oneDraw(), oneDraw(), oneDraw()];
    let zhan = (result[0] + result[1] + result[2] + result[3]) % 9;
    if (zhan === 0) zhan = 9;
    return { zhou: result.join(''), zhan, result };
  }

  // 核心排算：对译 Taixuan.pan()
  // y/m/d/h：公历年月日时(0-23)；T：数据表；L：lunar Solar 类；draw：可选注入 [1/2/3 x4]（金标固定掷用）
  function tsxCompute(y, m, d, h, T, L, draw) {
    if (!T || !L || typeof L.fromYmdHms !== 'function') return { ok: false, reason: '数据表或历法库未加载' };
    // 四掷：默认随机（照译 qigua_number）；draw 注入固定（供金标复算）
    let q;
    if (draw && draw.length === 4 && draw.every((v) => v >= 1 && v <= 3)) {
      const sum = draw[0] + draw[1] + draw[2] + draw[3];
      q = { zhou: draw.join(''), zhan: sum % 9 === 0 ? 9 : sum % 9, result: draw.slice() };
    } else {
      q = qiguaNumber();
    }
    const guaDetails = T.taixuandict[q.zhou];
    if (!guaDetails) return { ok: false, reason: '卦数据缺失：掷串 ' + q.zhou };
    const gua = guaDetails['卦'];
    const headName = Object.keys(gua)[0];

    // 起筮时段：照译源码 hours 分箱（6-11 旦 / 12-17 日中 / 18-23 夕 / 0-5 夜中）
    const currenttime = (h >= 6 && h < 12) ? '旦' : (h >= 12 && h < 18) ? '日中' : (h >= 18 && h < 24) ? '夕' : '夜中';
    const dnn = T.daynightselect[currenttime];

    const cnNum = { 1: '一', 2: '二', 3: '三' };
    const cr = q.result.map((i) => cnNum[i]);
    const head = cr[0] + '方' + cr[1] + '州' + cr[2] + '部' + cr[3] + '家';
    const xz = T.xzlist;
    const xuanHead = xz[head.slice(0, 2)] + xz[head.slice(2, 4)] + xz[head.slice(4, 6)] + xz[head.slice(6, 8)];
    const oe = (xuanHead % 2 === 1) ? '阳' : '阴';
    const congWei = (oe === '阳') ? '从' : '违';
    const gb = T.divine_yy[currenttime + oe];

    const zhan = (xuanHead - 1) * 9;
    const xuanZan = Math.floor(zhan / 2);
    if (!tsxCompute._su) tsxCompute._su = buildSu(T);
    const su = tsxCompute._su[xuanZan];

    // 农历/干支：lunar.js（Exact 口径与引擎四柱锚点一致）
    const lun = L.fromYmdHms(y, m, d, h, 0, 0).getLunar();
    const ganzhi = {
      年: lun.getYearInGanZhiExact(),
      月: lun.getMonthInGanZhiExact(),
      日: lun.getDayInGanZhi(),
      时: lun.getTimeInGanZhi()
    };
    const nongli = ganzhi.年 + '年 ' + lun.getMonthInChinese() + '月' + lun.getDayInChinese();

    return {
      ok: true,
      起卦时间: y + '年' + m + '月' + d + '日' + h + '时',
      农历: nongli,
      干支: ganzhi,
      起筮时段: currenttime,
      首名: headName,
      首辞: gua[headName],
      方州部家: head,
      掷串: q.zhou,
      玄首: { 数: xuanHead, 阴阳: oe, 从违: congWei },
      起筮休咎: { 筮名: gb[0], 从违序列: gb[1], 休咎: gb[2] },
      星宿度: su,
      表赞: dnn.map((zan) => ({ 赞: zan, 辞: guaDetails[zan] }))
    };
  }

  // 爻象：照译源码 yaolist（1=长列/2=中分/3=三分）
  const yaoBar = {
    '1': '▅▅▅▅▅▅▅▅▅▅',
    '2': '▅▅▅▅  ▅▅▅▅',
    '3': '▅▅  ▅▅  ▅▅'
  };

  function render(r) {
    if (!r.ok) return '<div class="muted" style="color:#d17a7a;">' + esc(r.reason) + '</div>';
    const xs = r.玄首, jx = r.起筮休咎;
    return '' +
      '<div class="card"><h3>太玄筮法 · ' + esc(r.首名) + '首</h3>' +
      '<div class="tsx-gz"><span><b>' + esc(r.干支.年) + '</b>年柱</span><span><b>' + esc(r.干支.月) + '</b>月柱</span><span><b>' + esc(r.干支.日) + '</b>日柱</span><span><b>' + esc(r.干支.时) + '</b>时柱</span></div>' +
      '<div class="muted" style="font-size:12px;margin-top:6px;">起卦时间：' + esc(r.起卦时间) + '　农历：' + esc(r.农历) + '　起筮时段：' + esc(r.起筮时段) + '</div></div>' +
      '<div class="card"><h3>' + esc(r.方州部家) + '（掷串 ' + esc(r.掷串) + '）</h3>' +
      '<pre class="tsx-yao">' + r.掷串.split('').map((c) => esc(yaoBar[c] || '')).join('\n') + '</pre>' +
      '<div class="tsx-line">玄首：第 <b style="color:var(--acc)">' + xs.数 + '</b> 首　' + xs.阴阳 + '首 → 属<b>' + esc(xs.从违) + '</b>　星宿：<b>' + esc(r.星宿度) + '</b>度</div></div>' +
      '<div class="card"><h3>首辞</h3><div class="tsx-ci">' + esc(r.首辞) + '</div></div>' +
      '<div class="card"><h3>' + esc(jx.筮名) + '　<span class="tag-ji">' + esc(jx.休咎) + '</span></h3>' +
      '<div class="tsx-line">三投从违：<b>' + esc(jx.从违序列) + '</b></div>' +
      '<table class="tsx-biao"><tbody>' +
      r.表赞.map((z) => '<tr><td class="tsx-zan">' + esc(z.赞) + '</td><td>' + esc(z.辞) + '</td></tr>').join('') +
      '</tbody></table></div>' +
      '<div class="muted" style="font-size:11px;margin-top:6px;">本体系为扬雄《太玄经》方州部家 81 首筮法（四揲成卦），与同 tab 内「太玄数·本命排盘」「揲蓍占法」为同一 81 首体系的不同筮法实现；本卡数据照录源包 taixuandict.p（含独有起筮休咎/三投从违断辞），上方太玄数/揲蓍用本地 taixuan.json 无标点本。<br>来源：taixuanshifa/kentang2017/MIT 现代整理层（繁体转简体）；农历/干支用 lunar.js。</div>';
  }

  function init() {
    if (typeof document === 'undefined') return;
    const go = document.getElementById('tsx-go');
    if (!go) return;
    go.addEventListener('click', () => {
      const T = (typeof window !== 'undefined' && window.__DATA && window.__DATA.taixuanshifa) || null;
      const L = (typeof window !== 'undefined' && window.Solar && window.Solar.fromYmdHms) ? window.Solar : null;
      const y = parseInt(document.getElementById('tsx-y').value, 10);
      const m = parseInt(document.getElementById('tsx-m').value, 10);
      const d = parseInt(document.getElementById('tsx-d').value, 10);
      const h = parseInt(document.getElementById('tsx-h').value, 10);
      const out = document.getElementById('tsx-result');
      if (!(y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31 && h >= 0 && h <= 23)) {
        out.innerHTML = '<div class="muted" style="color:#d17a7a;">请输入合法公历年(1-9999)/月/日/时(0-23)。</div>';
        return;
      }
      out.innerHTML = render(tsxCompute(y, m, d, h, T, L));
    });
    const hint = document.getElementById('tsx-hint');
    if (hint && window.__DATA && window.__DATA.taixuanshifa) {
      const T = window.__DATA.taixuanshifa;
      const n = Object.keys(T.taixuandict || {}).length;
      hint.textContent = '已加载太玄 81 首（每首 9 赞）。输入公历年/月/日/时(0-23)点「起筮」：四揲得方州部家 → 定首 → 旦夕选赞 → 休咎与宿度。';
    }
  }

  return { tsxCompute, buildSu, qiguaNumber, oneDraw, render, init };
});
