// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 荆诀·北大竹简西汉算筹十六卦（jingjue/kentang2017/MIT 现代整理层移植）
// jingjue.py 逐行对译：30 算筹随机分两段，上/中/下三份各以 4 除取余（余 0 作 4），
// 三位余数合成三位键查 gua_dict。原包为 random 起卦，不依赖四柱/历法，故 compute 不使用 L。
// 红线：卦辞照录源码（繁体转简体），不增删字；吉凶/祟为展示层从卦辞结尾语提取。
'use strict';
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { const api = factory(); root.jingjueMod = api; root.jingjueInit = api.init; }
})(typeof self !== 'undefined' ? self : this, function () {

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Python 式取模（支持负数：division_second 在 divider 大/r2 小时可为负）
  function mod4(x) {
    let r = x % 4;
    if (r < 0) r += 4;
    if (r === 0) r = 4;
    return r;
  }

  // 指定分筹结果的确定性起卦：divider∈[10,29]（源 random.sample(range(10,30),1)），r2∈[1,16]
  // 与 jingjue.qigua() 同算式：
  //   division_first  = [divider-10, 40-divider]
  //   division_second  = (40-divider) - r2
  //   division_third  = r2
  //   top=mod4(division_first[0])  middle=mod4(division_second)  bottom=mod4(division_third)
  function jjCast(divider, r2, T) {
    if (!T || !T.gua_dict) return { ok: false, reason: '数据表未加载' };
    if (!(divider >= 10 && divider <= 29) || !(r2 >= 1 && r2 <= 16)) {
      return { ok: false, reason: '分筹越界（divider 10-29，r2 1-16）' };
    }
    const df0 = divider - 10, df1 = 40 - divider;
    const ds = df1 - r2;   // division_second
    const dt = df1 - ds;   // division_third = r2
    const top = mod4(df0), middle = mod4(ds), bottom = mod4(dt);
    const key = '' + top + middle + bottom;
    const row = T.gua_dict[key];
    if (!row) return { ok: false, reason: '三位余数 ' + key + ' 原表未载（十六卦键之外）', 上: top, 中: middle, 下: bottom, key };
    // 吉凶/祟：展示层从卦辞末句提取（原包不输出此二字段，仅整理）
    // 末句 = 去句号后最后一个分句整录（如「吉，祟王父母，小吉」「凶，祟外、死不葬」「祟阳」）
    const verse = row[1];
    const tail = verse.replace(/。\s*$/, '').split('。').pop();
    const jixiong = tail.indexOf('小吉') >= 0 ? '小吉' : (tail.indexOf('凶') >= 0 ? '凶' : (tail.indexOf('吉') >= 0 ? '吉' : '辞不载'));
    const sui = tail;
    return {
      ok: true,
      分筹: { divider, r2, division_first: [df0, df1], division_second: ds, division_third: dt },
      上: top, 中: middle, 下: bottom, key,
      卦名: row[0],
      卦辞: verse,
      吉凶: jixiong,
      祟: sui,
      关键词: (T.keywords && T.keywords[row[0]]) || ''
    };
  }

  // UI 起卦：随机分筹（与源 qigua() 相同的分布）。y/m/d/h/L 形参保留以贴合 compute 签名约定，原包不用日期。
  function jjCompute(y, m, d, h, T, L, rng) {
    const r = rng || Math.random;
    const divider = 10 + Math.floor(r() * 20); // range(10,30) → 10..29
    const r2 = 1 + Math.floor(r() * 16);      // range(1,17) → 1..16
    const out = jjCast(divider, r2, T);
    out.生辰 = (y != null ? y + '年' + m + '月' + d + '日' + h + '时' : '');
    return out;
  }

  function render(r) {
    if (!r.ok) return '<div class="muted" style="color:#d17a7a;">' + esc(r.reason) + '</div>';
    return '' +
      '<div class="card"><h3>十六卦 <b style="color:var(--acc);font-size:22px;">' + esc(r.卦名) + '</b>卦</h3>' +
      '<div class="row" style="margin:8px 0;color:var(--tx2);font-size:13px;">' +
      '三余数：上 <b>' + r.上 + '</b> · 中 <b>' + r.中 + '</b> · 下 <b>' + r.下 + '</b>' +
      '<span class="muted" style="margin-left:10px;">（键 ' + esc(r.key) + '）</span></div>' +
      '<div class="muted" style="font-size:12px;">关键词：' + esc(r.关键词) + '</div></div>' +
      '<div class="card"><h3>卦辞</h3><div style="line-height:2.1;font-size:15px;">' + esc(r.卦辞) + '</div></div>' +
      '<div class="card"><h3>吉凶与祟</h3>' +
      '<div style="font-size:14px;line-height:2;">吉凶：<b>' + esc(r.吉凶) + '</b><br>末句：' + esc(r.祟) + '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:6px;">说明：原包 qigua() 仅返回卦名与卦辞；吉凶/祟为展示层从卦辞结尾语整理提取，不改表值。</div></div>' +
      '<div class="muted" style="font-size:11px;margin-top:6px;">来源：jingjue/kentang2017/MIT 现代整理层（繁体转简体）。北大西汉竹简《荆诀》：卅算分三分，四四而除，不盈者勿除。</div>';
  }

  function init() {
    if (typeof document === 'undefined') return;
    const go = document.getElementById('jj-go');
    if (!go) return;
    go.addEventListener('click', () => {
      const T = (typeof window !== 'undefined' && window.__DATA && window.__DATA.jingjue) || null;
      const out = document.getElementById('jj-result');
      out.innerHTML = render(jjCompute(null, null, null, null, T, null));
    });
    const hint = document.getElementById('jj-hint');
    if (hint && window.__DATA && window.__DATA.jingjue) {
      const T = window.__DATA.jingjue;
      hint.textContent = '已载入卦辞 ' + Object.keys(T.gua_dict || {}).length + ' 条（十六卦：天干八 + 地支八）。点「起卦」即以三十算筹随机分三段、四四除余（余 0 作 4）得卦。';
    }
  }

  return { jjCast, jjCompute, render, mod4, init };
});
