// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 术数引擎子件 - 渲染层
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);

  // ---------- 数据层 ----------
  let D = null; // { lingqi, zhuge, num81, zhouyi, strokes, hexmap }
  const FULL_NAMES = ['乾为天','坤为地','水雷屯','山水蒙','水天需','天水讼','地水师','水地比','风天小畜','天泽履','地天泰','天地否','天火同人','火天大有','地山谦','雷地豫','泽雷随','山风蛊','地泽临','风地观','火雷噬嗑','山火贲','山地剥','地雷复','天雷无妄','山天大畜','山雷颐','泽风大过','坎为水','离为火','泽山咸','雷风恒','天山遯','雷天大壮','火地晋','地火明夷','风火家人','火泽睽','水山蹇','雷水解','山泽损','风雷益','泽天夬','天风姤','泽地萃','地风升','泽水困','水风井','泽火革','火风鼎','震为雷','艮为山','风山渐','雷泽归妹','雷火丰','火山旅','巽为风','兑为泽','风水涣','水泽节','风泽中孚','雷山小过','水火既济','火水未济'];

  window.qianzhan.data().then((d) => {
    D = d;
    window.__DATA = d;
    init();
  }).catch((e) => {
    document.body.innerHTML = '<div style="padding:40px;color:#d17a7a;">数据加载失败: ' + e.message + '</div>';
  });

  // ---------- 通用 ----------
  let dreamInit = null; // 解梦模块初始化（嵌套 IIFE 赋值，外层 init 调用）
  let ceziInit = null; // 测字模块初始化（嵌套 IIFE 赋值，外层 init 调用）
  let tarotInit = null; // 塔罗模块初始化（嵌套 IIFE 赋值，外层 init 调用）
  let liunrenInit = null; // 大六壬模块初始化
  let jinkoujueInit = null; // 金口诀模块初始化
  let liuyaoInit = null; // 六爻-纳甲模块初始化
  let qimenInit = window.qimenInit || null; // 奇门遁甲模块初始化（独立 qimen.js 挂载）
  let baziInit = window.baziInit || null; // 子平八字模块初始化（独立 bazi.js 挂载）
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function tag(cls, text) { return '<span class="tag ' + cls + '">' + esc(text) + '</span>'; }
  function strokesOf(ch) {
    if (!D || !D.strokes) return null;
    const v = D.strokes[ch];
    return v == null ? null : v;
  }
  function zhouyiGua(singleName) {
    if (!D || !D.zhouyi) return null;
    return (D.zhouyi.gua || []).find((g) => g.name === singleName) || null;
  }

  function init() {
    // Tab 切换
    document.querySelectorAll('#tabs button').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#tabs button').forEach((x) => x.classList.remove('on'));
        document.querySelectorAll('.tab').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        $(b.dataset.tab).classList.add('on');
      });
    });
    // 灵棋
    $('lingqi-throw').addEventListener('click', lingqiThrow);
    $('lingqi-query').addEventListener('click', lingqiQuery);
    // 诸葛
    $('zhuge-go').addEventListener('click', zhugeGo);
    $('zhuge-input').addEventListener('input', zhugePreviewStrokes);
    $('zhuge-mode-hz').addEventListener('click', () => zhugeSetMode('hz'));
    $('zhuge-mode-num').addEventListener('click', () => zhugeSetMode('num'));
    // 81
    $('num81-go').addEventListener('click', num81Go);
    $('num81-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') num81Go(); });
    $('wuge-go').addEventListener('click', wugeGo);
    // 周易
    $('zy-step').addEventListener('click', zyStep);
    $('zy-auto').addEventListener('click', zyAuto);
    $('zy-reset').addEventListener('click', zyReset);
    $('zy-mode-auto').addEventListener('click', () => zySetMode('auto'));
    $('zy-mode-manual').addEventListener('click', () => zySetMode('manual'));
    $('zy-mode-assist').addEventListener('click', () => zySetMode('assist'));
    $('zy-build').addEventListener('click', zyBuildManual);
    $('zy-a-go').addEventListener('click', zyAssistGo);
    $('zy-a-reset').addEventListener('click', () => { zyReset(); zyAssistReset(); });
    $('zy-a-left').addEventListener('keydown', (e) => { if (e.key === 'Enter') zyAssistGo(); });
    $('zy-a-right').addEventListener('keydown', (e) => { if (e.key === 'Enter') zyAssistGo(); });
    zyReset();
    // 金钱课 / 孔明神卦
    jqkInitPicker();
    kmInitPicker();
    $('jqk-throw').addEventListener('click', jqkThrow);
    $('jqk-query').addEventListener('click', jqkQuery);
    $('km-throw').addEventListener('click', kmThrow);
    $('km-query').addEventListener('click', kmQuery);
    // 小六壬 / 金钱卦（三枚版）
    xlnInit();
    jq3InitPicker();
    // 太玄经
    txInit();
    // 焦氏易林
    ylInit();
    // 京房易
    jfInit();
    // 梅花易数
    mhInit();
    // 太乙神数
    tyInit();
    // 各子模块 init 相互隔离（任一失败不阻断其余）
    const safeInit = (fn) => { try { if (typeof fn === 'function') fn(); } catch (e) { console.error('init:', e && e.message); } };
    safeInit(zwInit);
    safeInit(fxInit);
    safeInit(dreamInit);
    safeInit(ceziInit);
    safeInit(tarotInit);
    safeInit(liunrenInit);
    safeInit(jinkoujueInit);
    safeInit(liuyaoInit);
    safeInit(qimenInit);
    safeInit(baziInit);
    safeInit(kinastroInit);
    if (window.wuyunliuqiInit) safeInit(window.wuyunliuqiInit);
    if (window.blindBaziInit) safeInit(window.blindBaziInit);
    if (window.taixuanMathInit) safeInit(window.taixuanMathInit);
    if (window.fendjingInit) safeInit(window.fendjingInit);
    if (window.liurenLifeInit) safeInit(window.liurenLifeInit);
    if (window.lunmingLifeInit) safeInit(window.lunmingLifeInit);
    if (window.qimenLumingInit) safeInit(window.qimenLumingInit);
    if (window.diqiInit) safeInit(window.diqiInit);
    if (window.shenyishuInit) safeInit(window.shenyishuInit);
    // ===== MIT 8 包入库：新体系模块初始化注册（预埋；模块未生成前为 no-op）=====
    if (window.kinwuzhaoInit) safeInit(window.kinwuzhaoInit);
    if (window.kzExtInit) safeInit(window.kzExtInit);
    if (window.taixuanshifaInit) safeInit(window.taixuanshifaInit);
    if (window.jingjueInit) safeInit(window.jingjueInit);
    if (window.kinqimenInit) safeInit(window.kinqimenInit);
    if (window.kintaiyiInit) safeInit(window.kintaiyiInit);
    if (window.kinwangjiInit) safeInit(window.kinwangjiInit);
    if (window.kinjinkouInit) safeInit(window.kinjinkouInit);

    const zhu = D && D.zhuge;
    if (zhu) { $('zhuge-result').innerHTML = '<div class="muted">已加载 ' + zhu.qians.length + ' 签。输入汉字起数取签。</div>'; }
    const lq = D && D.lingqi;
    if (lq) { $('lingqi-result').innerHTML = '<div class="muted">已加载 ' + (lq.gua || []).length + ' 卦。掷十二棋子或手动选上中下数。</div>'; }
    if (!D || !D.strokes) {
      const note = '<div class="muted" style="color:#d17a7a;margin-top:6px;">提示：笔画库未加载，诸葛/五格需手动填写笔画。</div>';
      $('zhuge-strokes').innerHTML = note;
    }
  }

  // ========== Tab 1 灵棋经 ==========
  function lingqiThrow() {
    const cnt = () => Array.from({ length: 4 }, () => (Math.random() < 0.5 ? 1 : 0)).reduce((a, b) => a + b, 0);
    const board = $('lingqi-anim');
    board.innerHTML = '<div class="qi-board"></div>';
    const tbl = board.firstChild;
    const vals = [];
    for (let r = 0; r < 3; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'qi-row';
      let n = 0;
      for (let c = 0; c < 4; c++) {
        const word = Math.random() < 0.5;
        if (word) n++;
        const qi = document.createElement('div');
        qi.className = 'qi blank';
        qi.dataset.word = word ? '1' : '0';
        rowDiv.appendChild(qi);
      }
      vals.push(n);
      tbl.appendChild(rowDiv);
    }
    const qis = board.querySelectorAll('.qi');
    let i = 0;
    const fallTimer = setInterval(() => {
      const q = qis[i];
      q.classList.add('fall');
      if (q.dataset.word === '1') {
        setTimeout(() => { q.classList.remove('blank'); q.classList.add('word'); }, 220);
      }
      i++;
      if (i >= qis.length) {
        clearInterval(fallTimer);
        setTimeout(() => {
          $('lq-shang').value = String(vals[0]);
          $('lq-zhong').value = String(vals[1]);
          $('lq-xia').value = String(vals[2]);
          const info = document.createElement('div');
          info.className = 'muted';
          info.style.cssText = 'text-align:center;margin-top:10px;';
          info.innerHTML = '字面朝上：上 <b style="color:var(--acc);">' + vals[0] + '</b> · 中 <b style="color:var(--acc);">' + vals[1] + '</b> · 下 <b style="color:var(--acc);">' + vals[2] + '</b> → 查卦';
          board.appendChild(info);
          lingqiQuery();
        }, 450);
      }
    }, 130);
  }
  function lingqiQuery() {
    if (!D || !D.lingqi) return;
    const s = +$('lq-shang').value, z = +$('lq-zhong').value, x = +$('lq-xia').value;
    const no = D.lingqi.index[`${s},${z},${x}`];
    if (!no) { $('lingqi-result').innerHTML = '<div class="muted" style="color:#d17a7a;">无此组合 (上' + s + ',中' + z + ',下' + x + ')，上中下各取 0–4。</div>'; return; }
    const g = (D.lingqi.gua || []).find((q) => q.no === no);
    if (!g) { $('lingqi-result').innerHTML = '<div class="muted" style="color:#d17a7a;">第 ' + no + ' 卦数据缺失。</div>'; return; }
    const it = g.items || {};
    const defs = [
      ['象曰', it.xiang], ['颜曰', it.yan], ['何曰', it.he],
      ['陈曰', it.chen], ['刘曰', it.liu], ['诗曰', it.shi],
    ];
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:8px;">';
    h += '<span class="gua-name">第' + g.no + '卦 · ' + esc(g.name) + '</span>';
    if (g.fangwei) h += '<span class="muted">' + esc(g.fangwei) + '</span>';
    h += '</div>';
    h += '<div class="row" style="margin-bottom:6px;"><span class="muted">得卦：</span><b>' + esc(g.shang + ',' + g.zhong + ',' + g.xia) + '</b>';
    if (g.xiang) h += '<span class="muted">' + esc(g.xiang) + '</span>';
    h += '</div>';
    h += '</div>';
    h += '<div class="card">';
    defs.forEach(([k, v]) => {
      if (v) h += '<div class="item-block"><span class="k">' + k + '</span><span class="v">' + esc(v) + '</span></div>';
    });
    if (g.analysis) h += '<div class="item-block"><span class="k">此课</span><span class="v">' + esc(g.analysis) + '</span></div>';
    h += '</div>';
    $('lingqi-result').innerHTML = h;
  }

  // ========== Tab 2 诸葛神数 ==========
  function zhugeSetMode(mode) {
    const hz = $('zhuge-mode-hz'), num = $('zhuge-mode-num');
    hz.classList.toggle('on', mode === 'hz');
    num.classList.toggle('on', mode === 'num');
    const inp = $('zhuge-input');
    if (mode === 'num') {
      inp.placeholder = '输入 1–3 个数字（0–9）';
      inp.maxLength = 3;
      $('zhuge-strokes').innerHTML = '';
      $('zhuge-help').textContent = '数字起数（通行）：三数=百十个位组数，二数=十位个位，一数=个位；所得数对 384 取模，余 0 取第 384 签。';
    } else {
      inp.placeholder = '输入汉字（1–3 字）';
      inp.maxLength = 3;
      $('zhuge-help').textContent = '起数法（通行）：三字=百十个位笔画组数，二字=十位个位，一字=个位；所得数对 384 取模，余 0 取第 384 签。';
    }
    $('zhuge-result').innerHTML = '';
  }
  function zhugePreviewStrokes() {
    if ($('zhuge-mode-num').classList.contains('on')) return;
    const t = $('zhuge-input').value.trim();
    if (!t) { $('zhuge-strokes').innerHTML = ''; return; }
    const parts = [];
    for (const ch of t) {
      const v = strokesOf(ch);
      parts.push(ch + '=' + (v == null ? '?' : v) + '画');
    }
    $('zhuge-strokes').innerHTML = '笔画：' + parts.join('，');
  }
  function zhugeGo() {
    if (!D || !D.zhuge) return;
    const mode = $('zhuge-mode-num').classList.contains('on') ? 'num' : 'hz';
    const raw = $('zhuge-input').value.trim().replace(/[\s，。、]/g, '');
    let num = 0, desc = '';
    if (mode === 'num') {
      if (!/^\d{1,3}$/.test(raw)) {
        $('zhuge-result').innerHTML = '<div class="muted" style="color:#d17a7a;">请输入 1–3 个数字（0–9）。</div>';
        return;
      }
      const digits = Array.from(raw).map((d) => +d);
      num = digits.length === 3 ? digits[0] * 100 + digits[1] * 10 + digits[2]
          : digits.length === 2 ? digits[0] * 10 + digits[1]
          : digits[0];
      desc = '起数：' + digits.join(',') + ' → ' + num;
    } else {
      if (!raw) { $('zhuge-result').innerHTML = '<div class="muted" style="color:#d17a7a;">请输入汉字。</div>'; return; }
      const chars = Array.from(raw).slice(0, 3);
      const stk = chars.map((c) => ({ ch: c, n: strokesOf(c) }));
      if (stk.some((s) => s.n == null)) {
        $('zhuge-result').innerHTML = '<div class="muted" style="color:#d17a7a;">有字不在笔画库中，请按下方起数说明手动算。</div>';
        return;
      }
      // 通行起数：三字=百十个位；二字=十位个位；一字=个位
      if (chars.length === 3) num = stk[0].n * 100 + stk[1].n * 10 + stk[2].n;
      else if (chars.length === 2) num = stk[0].n * 10 + stk[1].n;
      else num = stk[0].n;
      desc = '起数：' + chars.map((c, i) => c + ' ' + stk[i].n + '画').join('，') + ' → ' + num;
    }
    let no = num % 384;
    if (no === 0) no = 384;
    const q = (D.zhuge.qians || []).find((x) => x.no === no);
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:6px;"><span class="muted">' + esc(desc) + '</span>';
    h += '<span class="muted">→ 384 取余 → 第 <b>' + no + '</b> 签</span></div>';
    h += '</div>';
    if (q) {
      h += '<div class="card"><div class="gua-name" style="margin-bottom:8px;">第' + q.no + '签</div>';
      h += '<div class="poem" style="margin-bottom:10px;">' + esc(q.poem) + '</div>';
      h += '<div class="jie">解签：' + esc(q.jie) + '</div></div>';
    } else {
      h += '<div class="muted" style="color:#d17a7a;">签 ' + no + ' 数据缺失。</div>';
    }
    $('zhuge-result').innerHTML = h;
  }

  // ========== Tab 3 81 数理 ==========
  function num81Card(item, label) {
    const sub = item.sub || {};
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:6px;">';
    h += '<span class="big-num">' + item.n + '</span>';
    h += '<span class="gua-name" style="font-size:17px;">' + esc(item.name) + '</span>';
    const jc = item.ji === '吉' ? 'ji' : item.ji === '凶' ? 'xiong' : 'ban';
    h += tag(jc, item.ji || '?');
    (item.tags || []).forEach((tg) => { h += tag('ban', tg); });
    h += '</div>';
    if (item.duanyu) h += '<div class="muted" style="margin-bottom:6px;">' + esc(item.duanyu) + '</div>';
    if (label) h += '<div class="muted" style="font-size:12px;">' + esc(label) + '</div>';
    h += '</div>';
    if (Object.keys(sub).length) {
      h += '<div class="card">';
      [['基业', sub['基业']], ['家庭', sub['家庭']], ['健康', sub['健康']], ['含义', sub['含义']]].forEach(([k, v]) => {
        if (v) h += '<div class="item-block"><span class="k">' + k + '</span><span class="v">' + esc(v) + '</span></div>';
      });
      h += '</div>';
    }
    return h;
  }
  function num81Go() {
    if (!D || !D.num81) return;
    const n = parseInt($('num81-input').value, 10);
    if (!(n >= 1 && n <= 81)) { $('num81-result').innerHTML = '<div class="muted" style="color:#d17a7a;">请输入 1–81。</div>'; return; }
    const item = (D.num81.items || []).find((x) => x.n === n);
    $('num81-result').innerHTML = item ? num81Card(item, '') : '<div class="muted" style="color:#d17a7a;">数理 ' + n + ' 缺失。</div>';
  }
  function wugeGo() {
    if (!D || !D.num81) return;
    const sur = $('wuge-surname').value.trim();
    const given = $('wuge-given').value.trim();
    if (!sur || !given) { $('num81-result').innerHTML = '<div class="muted" style="color:#d17a7a;">请填写姓与名。</div>'; return; }
    const sChars = Array.from(sur), gChars = Array.from(given);
    const all = sChars.concat(gChars);
    const stk = all.map((c) => { const v = strokesOf(c); return { ch: c, n: v }; });
    if (stk.some((s) => s.n == null)) {
      $('num81-result').innerHTML = '<div class="muted" style="color:#d17a7a;">有字不在笔画库中，无法起五格。</div>';
      return;
    }
    const sum = (arr) => arr.reduce((a, b) => a + b.n, 0);
    const sSum = sum(stk.slice(0, sChars.length)), gSum = sum(stk.slice(sChars.length));
    // 五格：天格（单姓=姓+1，复姓=姓和）；人格（单姓=姓+名首，复姓=姓末+名首）；地格（双名=名和，单名=名+1）；总格=全和；外格=总格-人格+1
    const singleSurname = sChars.length === 1;
    const singleGiven = gChars.length === 1;
    const tian = singleSurname ? sSum + 1 : sSum;
    const ren = singleSurname ? sSum + stk[sChars.length].n : stk[sChars.length - 1].n + stk[sChars.length].n;
    const di = singleGiven ? gSum + 1 : gSum;
    const zong = sSum + gSum;
    const wai = zong - ren + 1;
    const geList = [
      ['天格', tian], ['人格', ren], ['地格', di], ['外格', wai], ['总格', zong],
    ];
    const pick = (n) => (D.num81.items || []).find((x) => x.n === ((n % 81 === 0 ? 81 : n % 81)));
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:4px;"><span class="gua-name" style="font-size:17px;">' + esc(sur + given) + ' · 五格</span>';
    h += '<span class="muted">' + all.map((c, i) => c + stk[i].n).join(' ') + '</span></div>';
    geList.forEach(([nm, v]) => {
      const item = pick(v);
      const jc = item && item.ji === '吉' ? 'ji' : item && item.ji === '凶' ? 'xiong' : 'ban';
      h += '<div class="row" style="margin:6px 0;"><span style="width:44px;color:var(--acc2);">' + nm + '</span><b>' + v + '</b>';
      if (item) h += tag(jc, item.ji) + '<span class="muted">' + esc(item.name) + (item.duanyu ? ' · ' + item.duanyu : '') + '</span>';
      h += '</div>';
    });
    h += '</div>';
    // 吉凶最强一格的详细
    const first = geList.map(([nm, v]) => ({ nm, v, item: pick(v) })).filter((x) => x.item);
    if (first.length) {
      const bad = first.filter((x) => x.item.ji === '凶');
      const focus = bad.length ? bad[0] : first[0];
      h += '<div class="card"><div class="muted" style="margin-bottom:6px;">参考（' + (bad.length ? '凶格' : '吉格') + '优先）：' + focus.nm + ' ' + focus.v + '</div>';
      h += num81Card(focus.item, focus.nm + ' ' + focus.v + ' 对应的 81 数理');
    }
    $('num81-result').innerHTML = h;
  }

  // ========== Tab 4 周易蓍占（大衍筮法 / 手动定爻） ==========
  const ZY = {
    state: 'idle',       // idle | running | done
    yao: 0, ci: 0,       // 当前爻(0-5)、当前变(0-2)
    n: 49,               // 当前策数
    changes: [],         // 当前三变记录
    yaos: [],            // 6 爻 {val, pos}
    timer: null,
    lastDetail: '',
  };
  function zySetMode(mode) {
    const a = $('zy-mode-auto'), m = $('zy-mode-manual'), s = $('zy-mode-assist');
    a.classList.toggle('on', mode === 'auto');
    m.classList.toggle('on', mode === 'manual');
    s.classList.toggle('on', mode === 'assist');
    if (ZY.timer) { clearInterval(ZY.timer); ZY.timer = null; $('zy-auto').textContent = '自动十八变'; }
    $('zy-auto-area').style.display = mode === 'auto' ? '' : 'none';
    $('zy-manual-area').style.display = mode === 'manual' ? '' : 'none';
    $('zy-assist-area').style.display = mode === 'assist' ? '' : 'none';
    zyReset();
    if (mode === 'manual') zyBuildPicker();
    if (mode === 'assist') zyAssistReset();
  }
  // ---- 活人辅助（人机配合筮）----
  const ZYA = { yao: 0, ci: 0, n: 49, done: false };
  function zyAssistReset() {
    ZYA.yao = 0; ZYA.ci = 0; ZYA.n = 49; ZYA.done = false;
    $('zy-a-left').value = ''; $('zy-a-right').value = '';
    $('zy-assist-status').innerHTML = '第 1 爻 · 第 1 变 · 当前 <b>49</b> 策';
    $('zy-assist-log').innerHTML = '<div class="muted">把左右两堆「揲四后的余数」（各 1–4）填进来，点「记录本变」。</div>';
  }
  function zyAssistGo() {
    const l = parseInt($('zy-a-left').value, 10);
    const r = parseInt($('zy-a-right').value, 10);
    if (!(l >= 1 && l <= 4) || !(r >= 1 && r <= 4)) {
      $('zy-assist-log').innerHTML += '<div class="muted" style="color:#d17a7a;">余数须为 1–4（揲四后 0 按 4 计）。</div>';
      return;
    }
    const gui = 1 + l + r;
    const next = ZYA.n - gui;
    const first = ZYA.ci === 0;
    const normal = first ? (gui === 5 || gui === 9) : (gui === 4 || gui === 8);
    let log = '第' + (ZYA.yao + 1) + '爻 · 第' + (ZYA.ci + 1) + '变：' + ZYA.n + ' 策 → 挂 1 + 左余 ' + l + ' + 右余 ' + r + ' = 归奇 ' + gui +
      (normal ? '' : ' <b style="color:#e08a3c;">⚠ 非正常归奇（' + (first ? '应 5 或 9' : '应 4 或 8') + '），请检查数策</b>') + ' → 余 <b>' + next + '</b> 策。';
    ZYA.n = next; ZYA.ci++;
    if (ZYA.ci === 3) {
      const val = ZYA.n / 4;
      ZY.yaos.push({ val, pos: ZYA.yao });
      log += ' 三变毕：' + ZYA.n + ' ÷ 4 = <b>' + val + '</b>（' + ({6:'老阴·动',7:'少阳',8:'少阴',9:'老阳·动'})[val] + '）';
      ZYA.yao++; ZYA.ci = 0; ZYA.n = 49;
      if (ZYA.yao === 6) {
        ZYA.done = true;
        log += ' ★ 六爻成卦（卦象见下方）。';
        $('zy-assist-status').innerHTML = '成卦完成 · 六爻：' + ZY.yaos.map((y) => ({6:'老阴',7:'少阳',8:'少阴',9:'老阳'})[y.val]).join('、');
        zyRenderHex();
      } else {
        $('zy-assist-status').innerHTML = '第 ' + (ZYA.yao + 1) + ' 爻 · 第 1 变 · 当前 <b>49</b> 策';
      }
    } else {
      $('zy-assist-status').innerHTML = '第 ' + (ZYA.yao + 1) + ' 爻 · 第 ' + (ZYA.ci + 1) + ' 变 · 当前 <b>' + ZYA.n + '</b> 策';
    }
    $('zy-a-left').value = ''; $('zy-a-right').value = '';
    $('zy-assist-log').innerHTML += '<div class="steps">' + log + '</div>';
    $('zy-assist-log').scrollTop = $('zy-assist-log').scrollHeight;
  }
  function zyBuildPicker() {
    const opts = [['7', '少阳'], ['8', '少阴'], ['9', '老阳·动'], ['6', '老阴·动']];
    let h = '';
    for (let k = 0; k < 6; k++) {
      h += '<div class="yao-row"><span class="yao-label">' + ['初', '二', '三', '四', '五', '上'][k] + '爻</span>';
      h += '<select id="zy-pick-' + k + '">' + opts.map((o) => '<option value="' + o[0] + '">' + o[1] + '</option>').join('') + '</select></div>';
    }
    $('zy-picker').innerHTML = h;
  }
  function zyBuildManual() {
    ZY.yaos = [];
    for (let k = 0; k < 6; k++) ZY.yaos.push({ val: +$('zy-pick-' + k).value, pos: k });
    ZY.state = 'done';
    $('zy-vis').innerHTML = '';
    $('zy-vis-log').innerHTML = '<div class="muted">手动定爻：' + ZY.yaos.map((y) => ({6:'老阴·动',7:'少阳',8:'少阴',9:'老阳·动'})[y.val]).join('、') + '。</div>';
    zyRenderHex();
  }
  function zyReset() {
    if (ZY.timer) { clearInterval(ZY.timer); ZY.timer = null; }
    ZY.state = 'idle'; ZY.yao = 0; ZY.ci = 0; ZY.n = 49;
    ZY.changes = []; ZY.yaos = [];
    $('zy-vis').innerHTML = '';
    $('zy-vis-log').innerHTML = '<div class="muted">大衍筮法：49 策分二、挂一、揲四、归奇。点击「单步一变」或「自动十八变」。</div>';
    $('zy-hex').innerHTML = ''; $('zy-detail').innerHTML = '';
  }
  // 每变可视化：分二 → 挂一 → 揲四 → 归奇 → 余 N
  function zyVis(c) {
    const n = c.n, next = c.next;
    const leftPct = Math.round((c.left / n) * 100);
    const rightPct = Math.round(((c.right + 1) / n) * 100);
    let h = '<div class="vbox"><div class="vt">当前策数</div><div class="vn">' + n + '</div></div>';
    h += '<div class="vbox"><div class="vt">分二（左右）</div><div class="vn">' + c.left + '<small> / ' + (c.right + 1) + '</small></div>';
    h += '<div class="bar" style="width:' + leftPct + '%;"></div><div class="bar" style="width:' + rightPct + '%;background:#8a6d3b;"></div></div>';
    h += '<div class="vbox hot"><div class="vt">挂一 · 右取 1</div><div class="vn">−1</div></div>';
    h += '<div class="vbox"><div class="vt">揲四 左余/右余</div><div class="vn">' + c.lr + '<small> / ' + c.rr + '</small></div></div>';
    h += '<div class="vbox hot"><div class="vt">归奇 ' + (c.lr + c.rr + 1) + '</div><div class="vn">−' + c.gui + '</div></div>';
    h += '<div class="vbox"><div class="vt">余策</div><div class="vn">' + next + '</div></div>';
    $('zy-vis').innerHTML = h;
  }
  function zyStep() {
    if (ZY.state === 'done') { zyReset(); return; }
    ZY.state = 'running';
    const left = 1 + Math.floor(Math.random() * (ZY.n - 2));
    let right = ZY.n - left;
    right -= 1;                       // 挂一（自右取 1）
    const lr = left % 4 || 4;
    const rr = right % 4 || 4;
    const gui = 1 + lr + rr;
    const next = ZY.n - gui;
    ZY.changes.push({ left, right, lr, rr, gui, next, n: ZY.n });
    zyVis(ZY.changes[ZY.changes.length - 1]);
    ZY.n = next;
    ZY.ci++;
    const c = ZY.changes[ZY.changes.length - 1];
    let log = '第' + (ZY.yao + 1) + '爻 · 第' + (ZY.ci) + '变：' + c.n + ' 策 → 分二 ' + c.left + '/' + (c.right + 1) +
      ' → 挂一 1 → 揲四 左余' + c.lr + ' 右余' + c.rr + ' → 归奇 ' + c.gui + ' → 余 ' + c.next + ' 策。';
    if (ZY.ci === 3) {
      const val = ZY.n / 4;           // 6 老阴 / 7 少阳 / 8 少阴 / 9 老阳
      ZY.yaos.push({ val, pos: ZY.yao });
      log += ' 三变归奇合计 ' + ZY.changes.reduce((a, b) => a + b.gui, 0) + ' → ' + ZY.n + ' ÷ 4 = <b>' + val + '</b>';
      log += '（' + ({6: '老阴·动', 7: '少阳', 8: '少阴', 9: '老阳·动'})[val] + '）';
      ZY.yao++; ZY.ci = 0; ZY.n = 49; ZY.changes = [];
      if (ZY.yao === 6) { ZY.state = 'done'; zyRenderHex(); log += ' ★ 六爻成卦。'; }
    }
    const old = $('zy-vis-log').innerHTML;
    $('zy-vis-log').innerHTML = old + '<div class="steps">' + log + '</div>';
    $('zy-vis-log').scrollTop = $('zy-vis-log').scrollHeight;
    if (ZY.state === 'done' && ZY.timer) { clearInterval(ZY.timer); ZY.timer = null; $('zy-auto').textContent = '自动十八变'; }
  }
  function zyAuto() {
    if (ZY.timer) { clearInterval(ZY.timer); ZY.timer = null; $('zy-auto').textContent = '自动十八变'; return; }
    if (ZY.state === 'done') { zyReset(); }
    $('zy-auto').textContent = '暂停';
    ZY.timer = setInterval(() => { if (ZY.state === 'done') { clearInterval(ZY.timer); ZY.timer = null; $('zy-auto').textContent = '自动十八变'; } else { zyStep(); } }, 420);
  }
  // 断辞词频扫描（复刻玄鉴 XuanMirror 周易义理引擎 gloss_score，开源 zz9744813-lab/suan）
  // 词表原样取自该引擎 GLOSS_TERMS：长词优先、命中区间互斥（"无咎"命中则内层"咎"不再计）
  const GLOSS_TERMS = [
    ['元吉', 1.0], ['大吉', 0.95], ['吉', 0.7], ['无不利', 0.55],
    ['利涉大川', 0.5], ['利有攸往', 0.45],
    ['亨', 0.3], ['无咎', 0.2], ['无悔', 0.2], ['利', 0.15],
    ['凶', -1.0], ['无攸利', -0.6], ['不利', -0.5], ['厉', -0.5],
    ['吝', -0.45], ['勿用', -0.45], ['有悔', -0.4], ['咎', -0.5], ['悔', -0.25],
  ].sort((a, b) => b[0].length - a[0].length);
  function glossScore(text) {
    let sum = 0;
    const hits = [];
    let idx = 0;
    while (idx < text.length) {
      let matched = null;
      for (const t of GLOSS_TERMS) {
        if (text.startsWith(t[0], idx)) { matched = t; break; }
      }
      if (matched) {
        sum += matched[1];
        hits.push(matched[0] + ' ' + (matched[1] >= 0 ? '+' : '') + matched[1].toFixed(2));
        idx += matched[0].length;   // 区间互斥：跳过整词，内层短词不再计
      } else {
        idx++;
      }
    }
    return { sum: Math.round(sum * 100) / 100, hits };
  }
  function zyRenderHex() {
    if (!D || !D.hexmap) return;
    const yaos = ZY.yaos; // [0]=初爻
    const ben = yaos.map((y) => (y.val === 7 || y.val === 9 ? '1' : '0'));   // 自下而上：7少阳/9老阳=阳1，6老阴/8少阴=阴0
    const zhi = yaos.map((y) => (y.val === 9 || y.val === 6 ? (ben[y.pos] === '1' ? '0' : '1') : ben[y.pos]));
    const upper = ben.slice(3, 6).join(''), lower = ben.slice(0, 3).join('');
    const key = upper + lower;
    const hx = D.hexmap.map[key];
    const zUpper = zhi.slice(3, 6).join(''), zLower = zhi.slice(0, 3).join('');
    const zKey = zUpper + zLower;
    const zHx = D.hexmap.map[zKey];
    // 卦名单字 → 组合名（通行序）
    const i = FULL_NAMES.findIndex((n) => n === (hx ? hx.name : ''));
    const zI = FULL_NAMES.findIndex((n) => n === (zHx ? zHx.name : ''));
    const benGua = D.zhouyi && i >= 0 ? D.zhouyi.gua[i] : null;
    const zhiGua = D.zhouyi && zI >= 0 ? D.zhouyi.gua[zI] : null;

    const draw = (lines, name, label, opts) => {
      let h = '<div class="col"><div class="row" style="margin-bottom:6px;"><b style="color:var(--acc);">' + esc(name) + '</b>';
      h += '<span class="muted">' + label + '</span></div>';
      for (let k = 5; k >= 0; k--) {           // 上爻在上
        const v = lines[k];
        const yang = v === '1';
        const dong = opts && opts.dong && opts.dong[k];
        const yname = ['初','二','三','四','五','上'][k] + (yang ? '九' : '六');
        h += '<div class="yao-row"><span class="yao-label">' + yname + '</span>';
        h += '<div class="yao-lines"><div class="y ' + (yang ? 'yang' : 'yin') + (dong ? ' dong' : '') + '" style="animation-delay:' + ((5 - k) * 0.12).toFixed(2) + 's"></div></div>';
        if (opts && opts.valText) h += '<span class="muted" style="font-size:12px;">' + opts.valText[k] + '</span>';
        h += '</div>';
      }
      h += '</div>';
      return h;
    };
    const valText = yaos.map((y) => ({6: '老阴', 7: '少阳', 8: '少阴', 9: '老阳'})[y.val]);
    const dongFlags = yaos.map((y) => y.val === 6 || y.val === 9);
    const hasDong = dongFlags.some(Boolean);
    let h = draw(ben, (hx ? hx.name : '卦象缺失'), '本卦', { dong: dongFlags, valText });
    if (zHx && hasDong) h += draw(zhi, zHx.name, '之卦', { valText: yaos.map(() => '') });
    $('zy-hex').innerHTML = h;

    // 详情
    let dt = '';
    if (benGua) {
      dt += '<div class="card"><h3>本卦 ' + esc(hx.name) + ' · 卦辞（王弼注）</h3>';
      dt += '<div class="poem">' + esc(benGua.guaci) + '</div></div>';
      // 动爻
      const dongIdx = dongFlags.map((d, k) => (d ? k : -1)).filter((k) => k >= 0);
      if (dongIdx.length) {
        dt += '<div class="dong-info"><span class="k">动爻 ' + dongIdx.map((k) => ['初','二','三','四','五','上'][k]).join('、') + '</span><br>';
        dongIdx.forEach((k) => {
          const yang = ben[k] === '1';
          const p = ['初九','九二','九三','九四','九五','上九'][k] || '';
          const q = ['初六','六二','六三','六四','六五','上六'][k] || '';
          const pos = yang ? p : q;
          const yao = benGua.yaos ? benGua.yaos[pos] : null;
          if (yao) dt += '<div class="item-block" style="margin-top:8px;"><span class="k">' + pos + '</span><span class="v">' + esc(yao) + '</span></div>';
        });
        dt += '</div>';
      } else {
        dt += '<div class="muted" style="margin-top:6px;">六爻皆静，以本卦卦辞断。</div>';
      }
    }
    if (zhiGua) {
      dt += '<div class="card" style="margin-top:12px;"><h3>之卦 ' + esc(zHx.name) + ' · 卦辞</h3>';
      dt += '<div class="poem">' + esc(zhiGua.guaci) + '</div></div>';
    }
    if (!benGua && hx) dt += '<div class="muted" style="color:#d17a7a;">本卦 ' + esc(hx.name) + ' 在王弼注库中未匹配到。</div>';

    // 断辞词频扫描（文字解释卡）
    if (benGua) {
      const dongIdx = dongFlags.map((d, k) => (d ? k : -1)).filter((k) => k >= 0);
      let scanText = '卦辞「' + benGua.guaci + '」';
      const yaoTexts = [];
      dongIdx.forEach((k) => {
        const yang = ben[k] === '1';
        const p = ['初九','九二','九三','九四','九五','上九'][k] || '';
        const q = ['初六','六二','六三','六四','六五','上六'][k] || '';
        const pos = yang ? p : q;
        const yao = benGua.yaos ? benGua.yaos[pos] : null;
        if (yao) { yaoTexts.push(pos + '「' + yao + '」'); scanText += ' + ' + pos + '爻辞「' + yao + '」'; }
      });
      const gs = glossScore(scanText.replace(/[（(][^）)]*[）)]/g, ''));
      const level = gs.sum >= 0.25 ? '偏吉' : gs.sum <= -0.25 ? '示警' : '平缓';
      const lvColor = level === '偏吉' ? 'var(--good)' : level === '示警' ? 'var(--bad)' : 'var(--mid)';
      let sc = '<div class="card" style="margin-top:12px;border-color:#3a4466;">';
      sc += '<div class="row" style="margin-bottom:6px;"><span class="k" style="color:var(--acc);">断辞词频扫描</span>';
      sc += '<span style="color:' + lvColor + ';font-weight:700;">' + level + '</span>';
      sc += '<span class="muted">加权分 ' + gs.sum + '</span></div>';
      sc += '<div class="muted" style="margin-bottom:4px;">扫描文本：' + esc(scanText) + '</div>';
      sc += '<div class="v" style="font-size:13.5px;">命中：' + (gs.hits.length ? gs.hits.join('、') : '无吉凶断辞词命中') + '</div>';
      if (yaoTexts.length) {
        sc += '<div class="muted" style="margin-top:4px;">动爻爻辞：' + esc(yaoTexts.join('；')) + '</div>';
      }
      sc += '<div class="muted" style="margin-top:8px;font-size:12px;">算法：玄鉴 XuanMirror 周易义理引擎 gloss_score 断辞词表（开源 zz9744813-lab/suan）。其团队回测（45 人 105 事件）表明文献吉凶词频天然吉多凶少、方向信息量为零——此处仅作文字参读，不构成吉凶定断。</div>';
      sc += '</div>';
      dt += sc;
    }
    $('zy-detail').innerHTML = dt;
  }

  window.__qianzhan = { zyReset, zyStep, zyAuto, FULL_NAMES };

  // ========== Tab 5 六十四卦金钱课 ==========
  function makeMiniCoin(container, onToggle) {
    const c = document.createElement('div');
    c.className = 'coin-mini zheng';
    c.innerHTML = '<span class="face"></span><span class="hole"></span>';
    c.dataset.z = '1'; // 1=正(阳○) 0=反(阴●)
    c.addEventListener('click', () => {
      c.dataset.z = c.dataset.z === '1' ? '0' : '1';
      c.classList.toggle('zheng', c.dataset.z === '1');
      c.classList.toggle('fan', c.dataset.z !== '1');
      if (onToggle) onToggle();
    });
    container.appendChild(c);
    return c;
  }
  function jqkInitPicker() {
    const box = $('jqk-picker');
    box.innerHTML = '';
    for (let i = 0; i < 6; i++) makeMiniCoin(box);
  }
  function jqkReadCoin() { // 返回串：位1=上爻，○=正 阳，●=反 阴
    const cs = $('jqk-picker').querySelectorAll('.coin-mini');
    let s = '';
    for (let i = cs.length - 1; i >= 0; i--) s += cs[i].dataset.z === '1' ? '○' : '●';
    return s;
  }
  function jqkThrow() {
    if (!D || !D.jinqianke) return;
    const board = $('jqk-anim');
    board.innerHTML = '<div class="coin-board"></div>';
    const tbl = board.firstChild;
    const coins = [];
    for (let r = 0; r < 2; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'coin-row';
      for (let c = 0; c < 3; c++) {
        const z = Math.random() < 0.5;
        const coin = document.createElement('div');
        coin.className = 'coin ' + (z ? 'zheng' : 'fan');
        coin.innerHTML = '<span class="face"></span><span class="hole"></span>';
        coin.dataset.z = z ? '1' : '0';
        rowDiv.appendChild(coin);
        coins.push(coin);
      }
      tbl.appendChild(rowDiv);
    }
    let i = 0;
    const t = setInterval(() => {
      coins[i].classList.add('fall');
      i++;
      if (i >= coins.length) {
        clearInterval(t);
        setTimeout(() => {
          const cs = $('jqk-picker').querySelectorAll('.coin-mini');
          for (let k = 0; k < 6; k++) {
            const z = coins[k].dataset.z === '1';
            cs[k].dataset.z = z ? '1' : '0';
            cs[k].classList.toggle('zheng', z);
            cs[k].classList.toggle('fan', !z);
          }
          jqkQuery();
        }, 600);
      }
    }, 120);
  }
  function jqkQuery() {
    if (!D || !D.jinqianke) return;
    const coin = jqkReadCoin();
    const g = (D.jinqianke || []).find((x) => x.coin === coin);
    if (!g) { $('jqk-result').innerHTML = '<div class="muted" style="color:#d17a7a;">六十四卦中未找到卦象 ' + esc(coin) + '（数据异常）。</div>'; return; }
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:8px;">';
    h += '<span class="gua-name">' + esc(g.gua) + ' · ' + esc(g.alias) + '</span>';
    h += '<span class="tag ban">八宫·' + esc(g.gong || '') + '</span>';
    h += '<span class="muted">八宫序第 ' + g.xu + ' 卦</span>';
    h += '</div>';
    h += '<div class="qk-hex">';
    for (let i = 0; i < 6; i++) {
      const yang = coin[i] === '○';
      const pos = ['初爻','二爻','三爻','四爻','五爻','上爻'][i];
      h += '<div class="qk-yao"><span class="pos">' + pos + '</span><div class="line ' + (yang ? 'yang' : 'yin') + '"></div><span class="sym">' + (yang ? '○' : '●') + '</span></div>';
    }
    h += '</div><div class="src-line">卦象串（上→下）：' + esc(coin) + '，' + esc(g.duan || '') + '</div>';
    h += '</div>';
    const defs = [
      ['卦辞', g.guaci], ['推断', g.tuanduan], ['卦义', g.shiyi], ['象曰', g.xiang],
      ['典故', g.gushi], ['诗曰', g.shi], ['断曰', g.duan],
    ];
    h += '<div class="card">';
    defs.forEach(([k, v]) => {
      if (v) h += '<div class="item-block"><span class="k">' + k + '</span><span class="v">' + esc(v) + '</span></div>';
    });
    if (g.note) h += '<div class="note-box">' + esc(g.note) + '（源文如此，未补造）</div>';
    h += '<div class="src-line">来源：美篇《秘传文王六十四卦金钱课》（2024-06-01）全文录入；个别错字按通行卦序校正（如泽天诀→泽天夬、水火即济→水火既济）。</div>';
    h += '</div>';
    $('jqk-result').innerHTML = h;
  }

  // ========== Tab 6 孔明神卦 ==========
  function kmInitPicker() {
    const box = $('km-picker');
    box.innerHTML = '';
    for (let i = 0; i < 5; i++) makeMiniCoin(box);
  }
  function kmReadCoin() { // 串：位1=上爻
    const cs = $('km-picker').querySelectorAll('.coin-mini');
    let s = '';
    for (let i = cs.length - 1; i >= 0; i--) s += cs[i].dataset.z === '1' ? '○' : '●';
    return s;
  }
  function kmThrow() {
    if (!D || !D.kongming) return;
    const board = $('km-anim');
    board.innerHTML = '<div class="coin-board"></div>';
    const tbl = board.firstChild;
    const rowDiv = document.createElement('div');
    rowDiv.className = 'coin-row';
    const coins = [];
    for (let c = 0; c < 5; c++) {
      const z = Math.random() < 0.5;
      const coin = document.createElement('div');
      coin.className = 'coin ' + (z ? 'zheng' : 'fan');
      coin.innerHTML = '<span class="face"></span><span class="hole"></span>';
      coin.dataset.z = z ? '1' : '0';
      rowDiv.appendChild(coin);
      coins.push(coin);
    }
    tbl.appendChild(rowDiv);
    let i = 0;
    const t = setInterval(() => {
      coins[i].classList.add('fall');
      i++;
      if (i >= coins.length) {
        clearInterval(t);
        setTimeout(() => {
          const cs = $('km-picker').querySelectorAll('.coin-mini');
          for (let k = 0; k < 5; k++) {
            const z = coins[k].dataset.z === '1';
            cs[k].dataset.z = z ? '1' : '0';
            cs[k].classList.toggle('zheng', z);
            cs[k].classList.toggle('fan', !z);
          }
          kmQuery();
        }, 600);
      }
    }, 130);
  }
  function kmLuck(luck) {
    if (!luck) return '';
    const s = String(luck);
    let cls = 'ban';
    if (/(上上|大吉|上吉|上中|中上)/.test(s)) cls = 'ji';
    else if (/(下下|大凶|中下)/.test(s)) cls = 'xiong';
    return '<span class="luck-big ' + cls + '">' + esc(s) + '</span>';
  }
  function kmQuery() {
    if (!D || !D.kongming) return;
    const coin = kmReadCoin();
    const courses = D.kongming.courses || [];
    let c = courses.find((x) => x.coin === coin);
    // 未录课（coin=null 的 20 课）：按卦象串在观音感应灵课对照中找同串课
    const gy = c ? null : courses.find((x) => x.gy_coin === coin);
    if (!c && !gy) { $('km-result').innerHTML = '<div class="muted" style="color:#d17a7a;">三十二课中未找到卦象 ' + esc(coin) + '（数据异常）。</div>'; return; }
    const rec = c || gy;
    const isFallback = !c;
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:6px;">';
    if (rec.ke) h += '<span class="gua-name">第' + rec.no + '课' + (rec.ke ? ' · ' + esc(rec.ke) : '') + '</span>';
    else h += '<span class="gua-name">第' + rec.no + '课 · 孔明原文课名待补</span>';
    h += kmLuck(rec.luck);
    h += '</div>';
    h += '<div class="row"><span class="muted">卦象（上→下）：</span><b style="letter-spacing:4px;color:var(--acc);">' + esc(coin) + '</b></div>';
    h += '<div class="qk-hex">';
    for (let i = 0; i < 5; i++) {
      const yang = coin[i] === '○';
      const pos = ['上爻','四爻','三爻','二爻','初爻'][i];
      h += '<div class="qk-yao"><span class="pos">' + pos + '</span><div class="line ' + (yang ? 'yang' : 'yin') + '"></div><span class="sym">' + (yang ? '○' : '●') + '</span></div>';
    }
    h += '</div>';
    h += '</div>';
    if (isFallback) {
      h += '<div class="card">';
      h += '<div class="note-box">第 ' + rec.no + ' 课《孔明神卦》原文未取得（道客巴巴登录墙）。此卦象对应《观音感应灵课》同体系对照文本，<b>非孔明原文</b>，仅供参考。</div>';
      if (rec.gy_ke) h += '<div class="item-block" style="margin-top:8px;"><span class="k">对照课名</span><span class="v">' + esc(rec.gy_ke) + ' · ' + esc(rec.gy_luck || '') + '</span></div>';
      if (rec.gy_shi) h += '<div class="item-block"><span class="k">对照诗曰</span><span class="v">' + esc(rec.gy_shi) + '</span></div>';
      if (rec.gy_duan) h += '<div class="item-block"><span class="k">对照断语</span><span class="v">' + esc(rec.gy_duan) + '</span></div>';
      h += '<div class="src-line">对照来源：第一范文网《观音感应灵课》全文（记法已统一为 ○=阳）。</div>';
      h += '</div>';
    } else if (c.status === 'verified') {
      h += '<div class="card">';
      if (c.km_shi) h += '<div class="item-block"><span class="k">诗曰</span><span class="v">' + esc(c.km_shi) + '</span></div>';
      if (c.km_jie) h += '<div class="item-block"><span class="k">解曰</span><span class="v">' + esc(c.km_jie) + '</span></div>';
      if (c.km_duan) h += '<div class="item-block"><span class="k">断曰</span><span class="v">' + esc(c.km_duan) + '</span></div>';
      if (!c.km_shi && !c.km_duan) h += '<div class="muted">该课孔明原文仅存课名与卦象（道客巴巴序言示例），正文待补。</div>';
      h += '<div class="src-line">' + esc(c.note || '来源：道客巴巴《三十二课金钱卦之孔明神卦》') + '</div>';
      h += '</div>';
    } else {
      h += '<div class="card">';
      if (c.gys_shi) h += '<div class="item-block"><span class="k">诗曰（观音神课同文族）</span><span class="v">' + esc(c.gys_shi) + '</span></div>';
      if (c.gys_duan) h += '<div class="item-block"><span class="k">断曰（简版）</span><span class="v">' + esc(c.gys_duan) + '</span></div>';
      h += '<div class="note-box">' + esc(c.note || '') + '</div>';
      h += '<div class="src-line">来源：道客巴巴《观音神课三十二卦》（与《孔明神卦》同文族，符号记法已统一为 ○=阳）。</div>';
      h += '</div>';
    }
    $('km-result').innerHTML = h;
  }

  // ========== Tab 7 小六壬 ==========
  const XLN_ORDER = ['大安', '留连', '速喜', '赤口', '小吉', '空亡'];
  const XLN_LOCS = ['食指根', '食指尖', '中指尖', '无名指尖', '无名指根', '中指根'];
  let xlnMode = 'time';
  function xlnStep(start, n) { // 从 start(0-5) 顺数 n 个落点（n≥1，循环）
    n = Math.max(1, parseInt(n, 10) || 1);
    return (start + ((n - 1) % 6)) % 6;
  }
  function xlnInit() {
    const D0 = D && D.xiaoliuren;
    if (!D0) { $('xln-result').innerHTML = '<div class="muted" style="color:#d17a7a;">小六壬数据未加载。</div>'; return; }
    // 月下拉 1-12
    const mSel = $('xln-month');
    mSel.innerHTML = '';
    for (let m = 1; m <= 12; m++) {
      const o = document.createElement('option'); o.value = String(m); o.textContent = m + ' 月'; mSel.appendChild(o);
    }
    // 时辰下拉 1-12
    const sSel = $('xln-shichen');
    sSel.innerHTML = '';
    (D0.shichen || []).forEach(([name, span], i) => {
      const o = document.createElement('option'); o.value = String(i + 1); o.textContent = name + '（' + span + '）'; sSel.appendChild(o);
    });
    $('xln-mode-time').addEventListener('click', () => xlnSetMode('time'));
    $('xln-mode-num').addEventListener('click', () => xlnSetMode('num'));
    $('xln-mode-random').addEventListener('click', () => xlnSetMode('random'));
    $('xln-go').addEventListener('click', xlnGoTime);
    $('xln-go-num').addEventListener('click', xlnGoNum);
    $('xln-go-random').addEventListener('click', xlnGoRandom);
    $('xln-now').addEventListener('click', () => {
      const h = new Date().getHours(); // 0-23
      const idx = Math.floor(((h + 1) % 24) / 2); // 23-1→0(子)…22-23→11(亥)
      $('xln-shichen').value = String(idx + 1);
    });
    xlnDrawPalm([]);
  }
  function xlnSetMode(m) {
    xlnMode = m;
    const on = (id, is) => $(id).classList.toggle('on', is);
    on('xln-mode-time', m === 'time'); on('xln-mode-num', m === 'num'); on('xln-mode-random', m === 'random');
    $('xln-time-area').style.display = m === 'time' ? '' : 'none';
    $('xln-num-area').style.display = m === 'num' ? '' : 'none';
    $('xln-random-area').style.display = m === 'random' ? '' : 'none';
  }
  function xlnDrawPalm(hits, trail) {
    const R = 108, cx = 150, cy = 150;
    const pos = [];
    for (let i = 0; i < 6; i++) {
      const a = (-90 + i * 60) * Math.PI / 180;
      pos.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    }
    let s = '<svg viewBox="0 0 300 300">';
    for (let i = 0; i < 6; i++) {
      const p = pos[i], q = pos[(i + 1) % 6];
      s += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '" stroke="var(--line)" stroke-width="1.5"/>';
    }
    if (trail && trail.length >= 2) {
      let d = '';
      for (let i = 0; i < trail.length; i++) {
        const p = pos[trail[i]];
        d += (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      }
      s += '<path class="trail" d="' + d + '"/>';
    }
    for (let i = 0; i < 6; i++) {
      const p = pos[i];
      const hit = hits && hits.indexOf(i) >= 0;
      s += '<circle class="xln-dot' + (hit ? ' hit' : '') + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + (hit ? 18 : 15) + '"/>';
      s += '<text class="xln-gong' + (hit ? ' hit' : '') + '" x="' + p.x.toFixed(1) + '" y="' + (p.y - 1).toFixed(1) + '" text-anchor="middle" dominant-baseline="central">' + XLN_ORDER[i] + '</text>';
      s += '<text class="xln-pos" x="' + p.x.toFixed(1) + '" y="' + (p.y + 15).toFixed(1) + '" text-anchor="middle">' + XLN_LOCS[i] + '</text>';
    }
    s += '</svg>';
    s += '<div class="xln-guide">' + XLN_ORDER.map((n, i) => '<span class="s' + (hits && hits.indexOf(i) >= 0 ? ' hit' : '') + '">' + (i + 1) + '. ' + n + '</span>').join('') + '</div>';
    $('xln-palm').innerHTML = s + '<div class="src-line" style="text-align:center;">六宫掌诀示意（顺时针数序）。起课后月→日→时落宫依次高亮，时宫为最终结果。</div>';
  }
  function xlnCalc(a, b, c) {
    const m = xlnStep(0, a);
    const d = xlnStep(m, b);
    const sh = xlnStep(d, c);
    return { m, d, sh };
  }
  function xlnRender(res, labels) {
    if (!D || !D.xiaoliuren) return;
    const d0 = D.xiaoliuren;
    const g = d0.gongs[res.sh];
    const mName = d0.order[res.m], dName = d0.order[res.d], shName = d0.order[res.sh];
    xlnDrawPalm([res.m, res.d, res.sh], [res.m, res.d, res.sh]);
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:6px;">';
    h += '<span class="gua-name">' + shName + '</span>';
    h += '<span class="tag ' + (['大安','速喜','小吉'].indexOf(shName) >= 0 ? 'ji' : ['赤口','空亡'].indexOf(shName) >= 0 ? 'xiong' : 'ban') + '">' + (['大安','速喜','小吉'].indexOf(shName) >= 0 ? '吉' : ['赤口','空亡'].indexOf(shName) >= 0 ? '凶' : '平') + '</span>';
    h += '</div>';
    h += '<div class="row muted">起课：' + labels.join(' → ') + '；落宫：月 ' + mName + ' · 日 ' + dName + ' · 时 ' + shName + '（以时辰落宫断）</div>';
    h += '</div>';
    // 主断卡
    h += '<div class="card">';
    h += '<div class="item-block"><span class="k">断曰</span><span class="v">' + esc(g.duanyue) + '</span></div>';
    h += '<div class="item-block"><span class="k">六宫</span><span class="v">' + esc(g.time) + '，五行属' + g.wuxing + (g.color ? '，颜色' + g.color : '') + (g.dir ? '，方位' + g.dir : '') + '，临' + g.shen + '，谋事主' + (g.moushi || []).join('、') + '；贵人' + (g.guiren || '—') + '，冲犯' + (g.chongfan || '—') + '。' + esc(g.xiangyi) + '</span></div>';
    if (g.shenyi) h += '<div class="item-block"><span class="k">神象</span><span class="v">' + esc(g.shenyi) + '</span></div>';
    if (g.gua) h += '<div class="item-block"><span class="k">卦象</span><span class="v">' + esc(g.gua) + '（对应干支 ' + esc(g.ganzhi || '—') + '）</span></div>';
    if (g.zhushu) h += '<div class="item-block"><span class="k">数注</span><span class="v">' + esc(g.zhushu) + '</span></div>';
    h += '</div>';
    // 六类法断
    h += '<div class="card"><h3>分类法断（初天麟详解）</h3>';
    ['寻人', '失物', '病人', '行人', '官非', '赌博'].forEach((k) => {
      if (g.detail && g.detail[k]) h += '<div class="item-block"><span class="k">' + k + '</span><span class="v">' + esc(g.detail[k]) + '</span></div>';
    });
    h += '</div>';
    // 日加时断（月宫+时宫）
    h += '<div class="card"><h3>日加时断（' + mName + ' + ' + shName + '）</h3>';
    if (res.m === res.sh) {
      h += '<div class="muted">月宫与时宫同位，仍以本宫断曰为准。</div>';
    } else {
      const rj = g.rijia[mName];
      h += rj ? '<div class="v">' + esc(rj) + '</div>' : '<div class="muted">速断表未录此组合。</div>';
    }
    h += '</div>';
    // 马前外卦法
    const wg = d0.waigua[shName];
    if (wg) h += '<div class="card"><h3>马前外卦法（来人不用问）</h3><div class="v">' + esc(shName) + ' 主 ' + esc(wg.thing) + '：' + esc(wg.text) + '</div><div class="muted" style="margin-top:4px;">大安=婚 · 留连=财 · 速喜=病 · 赤口=灾 · 小吉=刑 · 空亡=丧（麟毅轩入门版）。</div></div>';
    // 诗 + 四季
    if (g.poem) h += '<div class="card"><h3>断语歌</h3><div class="poem">' + esc(g.poem) + '</div></div>';
    if (g.season) h += '<div class="card"><h3>四季应期</h3><div class="v">' + esc(g.season) + '</div></div>';
    h += '<div class="src-line">来源：小六壬六宫速断表 + 初天麟《小六壬口诀详解大全》（凤凰网 2020-01-09）+ 麟毅轩《一分钟学会小六壬》（美篇 2024-07-17）。留连/空亡配神两版不一（速断表：留连玄武、空亡勾陈；初天麟：留连勾陈、空亡玄武），见"神象"字段。民间口传体系，断语为预置文本投射。</div>';
    $('xln-result').innerHTML = h;
  }
  function xlnGoTime() {
    const month = parseInt($('xln-month').value, 10);
    const day = Math.max(1, Math.min(30, parseInt($('xln-day').value, 10) || 1));
    const sc = parseInt($('xln-shichen').value, 10);
    const res = xlnCalc(month, day, sc);
    const d0 = D.xiaoliuren;
    const shName = d0.shichen[sc - 1] ? d0.shichen[sc - 1][0] : '时辰' + sc;
    xlnRender(res, [month + '月', day + '日', shName]);
  }
  function xlnGoNum() {
    const a = Math.max(1, parseInt($('xln-n1').value, 10) || 1);
    const b = Math.max(1, parseInt($('xln-n2').value, 10) || 1);
    const c = Math.max(1, parseInt($('xln-n3').value, 10) || 1);
    const res = xlnCalc(a, b, c);
    xlnRender(res, ['数 ' + a, '数 ' + b, '数 ' + c]);
  }
  function xlnGoRandom() {
    const r = () => 1 + Math.floor(Math.random() * 12);
    const a = r(), b = r(), c = r();
    const res = xlnCalc(a, b, c);
    xlnRender(res, ['数 ' + a, '数 ' + b, '数 ' + c]);
  }

  // ========== Tab 8 金钱卦（三枚铜钱六次版） ==========
  function jq3InitPicker() {
    const box = $('jq3-picker');
    box.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const wrap = document.createElement('div');
      wrap.className = 'jq3-pick';
      const sel = document.createElement('select');
      sel.id = 'jq3-sel-' + i;
      [['7', '少阳 7'], ['8', '少阴 8'], ['9', '老阳 9 · 动'], ['6', '老阴 6 · 动']].forEach(([v, l]) => {
        const o = document.createElement('option'); o.value = v; o.textContent = l; sel.appendChild(o);
      });
      wrap.appendChild(sel);
      const pl = document.createElement('span'); pl.className = 'pl'; pl.textContent = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i];
      wrap.appendChild(pl);
      box.appendChild(wrap);
    }
    $('jq3-throw').addEventListener('click', jq3Throw);
    $('jq3-build').addEventListener('click', jq3Query);
  }
  function jq3ReadPicks() {
    return [0, 1, 2, 3, 4, 5].map((i) => parseInt($('jq3-sel-' + i).value, 10));
  }
  function jq3Throw() {
    if (!D || !D.jinqianke3) return;
    const board = $('jq3-anim');
    board.innerHTML = '<div class="coin-board"></div>';
    const tbl = board.firstChild;
    const rows = [];
    for (let y = 0; y < 6; y++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'coin-row';
      const tag = document.createElement('span');
      tag.className = 'yao-tag';
      let zheng = 0;
      for (let c = 0; c < 3; c++) {
        const z = Math.random() < 0.5;
        if (z) zheng++;
        const coin = document.createElement('div');
        coin.className = 'coin ' + (z ? 'zheng' : 'fan');
        coin.innerHTML = '<span class="face"></span><span class="hole"></span>';
        rowDiv.appendChild(coin);
      }
      rowDiv.appendChild(tag);
      tbl.appendChild(rowDiv);
      rows.push({ tag, zheng, y });
    }
    let yi = 0;
    const t = setInterval(() => {
      const { tag, zheng, y } = rows[yi];
      const rowDiv = tbl.children[yi];
      const coins = rowDiv.querySelectorAll('.coin');
      let ci = 0;
      const t2 = setInterval(() => {
        coins[ci].classList.add('fall');
        ci++;
        if (ci >= 3) {
          clearInterval(t2);
          const rule = D.jinqianke3.yao_by_zheng[zheng];
          tag.textContent = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][y] + '：' + zheng + ' 正 ' + (3 - zheng) + ' 反 → ' + rule.val + ' ' + rule.name + (rule.dong ? '（动）' : '（静）');
          $('jq3-sel-' + y).value = String(rule.val);
          yi++;
          if (yi >= 6) {
            clearInterval(t);
            setTimeout(() => jq3Query(), 500);
          }
        }
      }, 90);
    }, 280);
  }
  function jq3Query() {
    if (!D || !D.hexmap || !D.jinqianke) { $('jq3-result').innerHTML = '<div class="muted" style="color:#d17a7a;">金钱卦数据未加载。</div>'; return; }
    const vals = jq3ReadPicks();
    const ben = vals.map((v) => (v === 7 || v === 9 ? '1' : '0')); // [0]=初爻
    const zhi = vals.map((v, i) => (v === 9 || v === 6 ? (ben[i] === '1' ? '0' : '1') : ben[i]));
    const key = ben.slice(3).join('') + ben.slice(0, 3).join('');
    const hx = D.hexmap.map[key];
    const zKey = zhi.slice(3).join('') + zhi.slice(0, 3).join('');
    const zHx = D.hexmap.map[zKey];
    const benSingle = hx ? hx.name : '';
    const zhiSingle = zHx ? zHx.name : '';
    const bi = FULL_NAMES.findIndex((n) => n === benSingle);
    const zi = FULL_NAMES.findIndex((n) => n === zhiSingle);
    const benFull = bi >= 0 ? FULL_NAMES[bi] : (benSingle || '（卦名未录）');
    const zhiFull = zi >= 0 ? FULL_NAMES[zi] : (zhiSingle || '（无动爻）');
    const coin = ben.slice(0).reverse().join('').replace(/1/g, '○').replace(/0/g, '●'); // 位1=上爻
    const g = (D.jinqianke || []).find((x) => x.coin === coin);
    const dongs = [];
    vals.forEach((v, i) => { if (v === 9 || v === 6) dongs.push(['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i] + (v === 9 ? '老阳' : '老阴')); });
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:6px;">';
    h += '<span class="gua-name">' + esc(benFull) + '</span>';
    if (dongs.length) h += '<span class="tag ban">动' + dongs.length + '爻 → 之卦 ' + esc(zhiFull) + '</span>';
    else h += '<span class="tag ban">六爻皆静 · 以本卦卦辞断</span>';
    h += '</div>';
    h += '<div class="jq3-hex">';
    for (let i = 5; i >= 0; i--) {
      const yang = ben[i] === '1';
      const dong = vals[i] === 9 || vals[i] === 6;
      h += '<div class="qk-yao"><span class="pos">' + ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][i] + '</span>';
      h += '<div class="line ' + (yang ? 'yang' : 'yin') + (dong ? ' dong' : '') + '"></div>';
      h += '<span class="sym">' + (dong ? (vals[i] === 9 ? '9' : '6') : (yang ? '7' : '8')) + '</span></div>';
    }
    h += '</div>';
    h += '<div class="src-line">爻值（自下而上）：' + vals.join(' ') + '；' + (dongs.length ? '动爻：' + dongs.join('、') + '，变后之卦 ' + esc(zhiFull) : '无动爻') + '。</div>';
    h += '</div>';
    if (g) {
      h += '<div class="card"><h3>' + esc(g.gua) + ' · ' + esc(g.alias) + '（八宫·' + esc(g.gong) + '，第 ' + g.xu + ' 卦）</h3>';
      const defs = [
        ['卦辞', g.guaci], ['推断', g.tuanduan], ['卦义', g.shiyi], ['象曰', g.xiang],
        ['典故', g.gushi], ['诗曰', g.shi], ['断曰', g.duan],
      ];
      defs.forEach(([k, v]) => { if (v) h += '<div class="item-block"><span class="k">' + k + '</span><span class="v">' + esc(v) + '</span></div>'; });
      if (g.note) h += '<div class="note-box">' + esc(g.note) + '（源文如此，未补造）</div>';
      h += '<div class="src-line">断语来源：美篇《秘传文王六十四卦金钱课》（2024-06-01）完整版补全（13_金钱卦《文王金钱课》仅至第 26 卦，两版断语同源）。起卦规则：三枚铜钱六次，一背=少阳7、两背=少阴8、三背=老阳9动、三字=老阴6动。</div>';
      h += '</div>';
    } else {
      h += '<div class="note-box">六十四卦断语表中未找到此卦象串 ' + esc(coin) + '（数据异常）。</div>';
    }
    $('jq3-result').innerHTML = h;
  }

  // ========== Tab 9 太玄经（揲蓍四变 · 推玄筭 · 定赞 · 昼夜休咎） ==========
  const TX = { mode: 'auto', timer: null };
  const TX_JIA = { 1: 1, 2: 2, 3: 3 };        // 家：1/2/3 → 置 1/2/3 筹
  const TX_BU  = { 1: 0, 2: 3, 3: 6 };        // 部：1 勿增、2 增三、3 增六
  const TX_ZHOU = { 1: 0, 2: 9, 3: 18 };      // 州：1 勿增、2 增九、3 增十八
  const TX_FANG = { 1: 0, 2: 27, 3: 54 };     // 方：1 勿增、2 增二十七、3 增五十四
  const TX_POS_NAME = ['初一', '次二', '次三', '次四', '次五', '次六', '次七', '次八', '上九'];
  // 三表：旦=经（1/5/7）、夕=纬（3/4/8）、日中夜中（2/6/9）
  function txBiao(pos) {
    if (pos === 1 || pos === 5 || pos === 7) return { biao: '旦', jw: '经' };
    if (pos === 3 || pos === 4 || pos === 8) return { biao: '夕', jw: '纬' };
    return { biao: '日中夜中', jw: '经' };
  }
  function txJiSuan(f, zhou, bu, jia) {
    return (TX_FANG[f] || 0) + (TX_ZHOU[zhou] || 0) + (TX_BU[bu] || 0) + (TX_JIA[jia] || 0);
  }
  function txOneShi() {
    // 太玄筮法（黄宗羲《易学象数论·太玄蓍法》/《太玄经·筮法》）：
    // 33 策 → 挂一 → 余 32 分二 → 左右各揲三（余 0 按 3）→ 初揲挂扐 = 挂一+左右余 = 3 或 6
    // 去初扐（剩 30 或 27）→ 不再挂 → 再分二揲三 → 再揲挂扐 = 左右余 = 3 或 6
    // 正策 = 33 − 初扐 − 再扐 = 21/24/27 → 每 3 策一堆 → 7 堆=一画(1)、8 堆=二画(2)、9 堆=三画(3)
    let left = 1 + Math.floor(Math.random() * 31);   // 1..31
    let right = 32 - left;                            // 31..1
    const lr1 = left % 3 || 3, rr1 = right % 3 || 3;  // 余 0 按 3
    const chu = 1 + lr1 + rr1;                        // 初揲挂扐 3 或 6
    const rest1 = 33 - chu;                           // 30 或 27
    let l2 = 1 + Math.floor(Math.random() * (rest1 - 1));
    let r2 = rest1 - l2;
    const lr2 = l2 % 3 || 3, rr2 = r2 % 3 || 3;
    const zai = lr2 + rr2;                            // 再揲挂扐 3 或 6
    const zheng = 33 - chu - zai;                     // 21/24/27
    const dui = zheng / 3;                            // 7/8/9
    const val = dui === 7 ? 1 : dui === 8 ? 2 : 3;    // 恒为 1/2/3，无 0、无重筮
    return { left, right, lr1, rr1, chu, rest1, l2, r2, lr2, rr2, zai, zheng, dui, val, total: dui, retry: false };
  }
  function txInit() {
    $('tx-mode-auto').addEventListener('click', () => txSetMode('auto'));
    $('tx-mode-manual').addEventListener('click', () => txSetMode('manual'));
    $('tx-mode-zan').addEventListener('click', () => txSetMode('zan'));
    $('tx-throw').addEventListener('click', txThrow);
    $('tx-reset').addEventListener('click', txReset);
    $('tx-build').addEventListener('click', txBuildManual);
    $('tx-query-zan').addEventListener('click', txQueryZan);
    $('tx-pos').addEventListener('keydown', (e) => { if (e.key === 'Enter') txQueryZan(); });
    $('tx-xu').addEventListener('keydown', (e) => { if (e.key === 'Enter') txQueryZan(); });
    const t0 = D && D.taixuan;
    if (t0) { $('tx-hex').innerHTML = '<div class="muted">已加载 ' + t0.length + ' 首（每首 9 赞 9 测）。揲蓍四变或手动选首起占。</div>'; }
  }
  function txSetMode(m) {
    TX.mode = m;
    const on = (id, is) => $(id).classList.toggle('on', is);
    on('tx-mode-auto', m === 'auto'); on('tx-mode-manual', m === 'manual'); on('tx-mode-zan', m === 'zan');
    $('tx-auto-area').style.display = m === 'auto' ? '' : 'none';
    $('tx-manual-area').style.display = m === 'manual' ? '' : 'none';
    $('tx-zan-area').style.display = m === 'zan' ? '' : 'none';
    if (m === 'zan') { $('tx-xu').value = ''; $('tx-pos').value = ''; $('tx-result').innerHTML = ''; }
  }
  function txReset() {
    $('tx-vis').innerHTML = '';
    $('tx-step-log').innerHTML = '';
    $('tx-result').innerHTML = '';
    $('tx-hex').innerHTML = '<div class="muted">已加载 ' + (D && D.taixuan ? D.taixuan.length : 0) + ' 首。揲蓍四变或手动选首起占。</div>';
  }
  function txThrow() {
    if (!D || !D.taixuan) { $('tx-result').innerHTML = '<div class="muted" style="color:#d17a7a;">太玄经数据未加载。</div>'; return; }
    const board = $('tx-vis');
    board.innerHTML = '';
    const logBox = $('tx-step-log');
    logBox.innerHTML = '';
    const vals = [null, null, null, null];    // 方/州/部/家
    const names = ['初揲定方', '再揲定州', '三揲定部', '四揲定家'];
    const recs = [];
    function doStep(i) {
      if (i >= 4) {
        setTimeout(() => {
          const [f, zhou, bu, jia] = vals;
          let xu = txJiSuan(f, zhou, bu, jia);
          if (xu < 1 || xu > 81) xu = 1;   // 防越界兜底（按现行揲法数学上不可能）
          logBox.innerHTML += '<div class="steps"><b style="color:var(--acc);">方州部家 = ' + f + zhou + bu + jia + '</b> → 积筭 = ' + (f === 1 ? 0 : f === 2 ? 27 : 54) + '+' + (zhou === 1 ? 0 : zhou === 2 ? 9 : 18) + '+' + (bu === 1 ? 0 : bu === 2 ? 3 : 6) + '+' + (jia === 1 ? 1 : jia === 2 ? 2 : 3) + ' = <b>' + xu + '</b> → 第 ' + xu + ' 首「' + esc(D.taixuan[xu - 1].name) + '」</div>';
          txRender(D.taixuan[xu - 1], null, recs);
        }, 260);
        return;
      }
      let s = txOneShi();
      doDraw(s, i);
      function doDraw(s2, ii) {
        vals[ii] = s2.val;
        recs.push({ name: names[ii], s: s2 });
        // 可视：两揲成画（初扐→再扐→正策堆→画几）
        const vis = $('tx-vis');
        const vbox = document.createElement('div');
        vbox.className = 'vbox';
        vbox.innerHTML = '<div class="vt">' + names[ii] + '</div><div class="vn">正策 ' + s2.zheng + '<small>（' + s2.dui + ' 堆 → 画' + s2.val + '）</small></div>' +
          '<div class="bar" style="width:' + (s2.zheng / 33 * 100) + '%;"></div><div class="bar" style="width:' + (s2.dui / 9 * 100) + '%;background:#8a6d3b;"></div>';
        vis.appendChild(vbox);
        logBox.innerHTML += '<div class="steps">' + names[ii] + '：33 策挂一 → 32 分二 ' + s2.left + '/' + s2.right + ' → 揲三 初扐<b>' + s2.chu + '</b>（左余' + s2.lr1 + ' 右余' + s2.rr1 + '）→ 剩 ' + s2.rest1 + ' 不挂分二 ' + s2.l2 + '/' + s2.r2 + ' → 再扐<b>' + s2.zai + '</b> → 正策 <b>' + s2.zheng + '</b>（' + s2.dui + ' 堆）→ 画<b>' + s2.val + '</b></div>';
        setTimeout(() => doStep(ii + 1), 480);
      }
    }
    doStep(0);
  }
  function txBuildManual() {
    if (!D || !D.taixuan) return;
    const f = +$('tx-f').value, zhou = +$('tx-zhou').value, bu = +$('tx-bu').value, jia = +$('tx-jia').value;
    const xu = txJiSuan(f, zhou, bu, jia);
    $('tx-step-log').innerHTML = '<div class="steps">手动选首：方州部家 = ' + f + zhou + bu + jia + ' → 积筭 = ' + xu + ' → 第 ' + xu + ' 首「' + esc(D.taixuan[xu - 1].name) + '」</div>';
    txRender(D.taixuan[xu - 1], null, []);
  }
  // 休咎：阳家奇位昼休、偶位夜咎；阴家反之。三表归属并列展示（从违之决需按《太玄》本旨结合日晷星数，此处不强行定夺）
  function txXiuJiu(x, pos) {
    const yang = x.yinyang === '阳家';
    const zhou = yang ? (pos % 2 === 1) : (pos % 2 === 0);   // 昼
    const xiu = zhou;                                        // 昼为休、夜为咎
    const tb = txBiao(pos);
    return { zhou, xiu, biao: tb.biao, jw: tb.jw };
  }
  function txRender(x, zanIdx, recs) {
    if (!x) return;
    const box = $('tx-hex');
    let h = '<div class="row" style="margin-bottom:6px;flex-wrap:wrap;gap:8px;">';
    h += '<span class="gua-name">第' + x.xu + '首 · ' + esc(x.name) + '</span>';
    h += '<span class="tag ban">' + esc(x.tian) + '（天' + x.tian_no + '）</span>';
    h += '<span class="tag ' + (x.yinyang === '阳家' ? 'ji' : 'xiong') + '">' + esc(x.yinyang) + '</span>';
    h += '<span class="tag ban">五行属' + esc(x.wuxing) + '</span>';
    h += '<span class="muted">三元：' + (x.xu <= 27 ? '天元（首 1–27）' : x.xu <= 54 ? '地元（首 28–54）' : '人元（首 55–81）') + '</span>';
    h += '</div>';
    h += '<div class="row muted" style="margin-bottom:8px;">方州部家：' + esc(x.fangzhoubujia.join('')) + '（方' + x.fangzhoubujia[0] + '州' + x.fangzhoubujia[1] + '部' + x.fangzhoubujia[2] + '家' + x.fangzhoubujia[3] + '）· 积筭 = 首序 ' + x.xu + '</div>';
    h += '<div class="item-block"><span class="k">首辞</span><span class="v">' + esc(x.shouci) + '</span></div>';
    if (x.note) h += '<div class="src-line" style="color:#d9a05e;">' + esc(x.note) + '</div>';
    box.innerHTML = h;
    // 九赞概览
    let z = '<div class="card"><h3>九赞（' + esc(x.name) + '首）</h3>';
    const rows = [];
    x.zan.forEach((zn, k) => {
      const isHit = zanIdx === k;
      const xj = txXiuJiu(x, k + 1);
      rows.push('<div class="yao-row" style="' + (isHit ? 'border:1px solid rgba(201,168,106,.6);border-radius:8px;padding:4px 8px;background:rgba(201,168,106,.08);' : '') + '">' +
        '<span class="yao-label" style="width:64px;">' + zn.weizhi + '</span>' +
        '<span class="muted" style="flex:1;font-size:12.5px;">' + esc(zn.ci) + ' <span style="color:var(--tx2);opacity:.75;">· 测曰：' + esc((x.ce[k] || '')) + '</span></span>' +
        '<span class="tag ' + (xj.xiu ? 'ji' : 'xiong') + '" style="flex:0 0 auto;">' + (xj.zhou ? '昼休' : '夜咎') + ' · ' + xj.biao + '</span></div>');
    });
    z += rows.join('') + '</div>';
    let extra = '';
    if (zanIdx != null) {
      const zn = x.zan[zanIdx];
      const xj = txXiuJiu(x, zanIdx + 1);
      let d = '<div class="card" style="border-color:rgba(201,168,106,.5);">';
      d += '<div class="row" style="margin-bottom:6px;"><span class="k" style="color:var(--acc);">' + zn.weizhi + ' 赞</span>';
      d += '<span class="tag ' + (xj.xiu ? 'ji' : 'xiong') + '">' + (xj.zhou ? '昼 · 休' : '夜 · 咎') + '</span>';
      d += '<span class="muted">' + xj.biao + '（' + xj.jw + '）</span></div>';
      d += '<div class="item-block"><span class="k">赞辞</span><span class="v">' + esc(zn.ci) + '</span></div>';
      d += '<div class="item-block"><span class="k">测曰</span><span class="v">' + esc((x.ce[zanIdx] || '')) + '</span></div>';
      d += '<div class="muted" style="margin-top:6px;font-size:12px;">休咎规则：' + esc(x.yinyang) + '，' + (x.yinyang === '阳家' ? '奇位（1/3/5/7/9）为昼为休、偶位（2/4/6/8）为夜为咎' : '偶位（2/4/6/8）为昼为休、奇位（1/3/5/7/9）为夜为咎') + '。本赞位 ' + (zanIdx + 1) + ' → ' + (xj.zhou ? '昼' : '夜') + ' → ' + (xj.xiu ? '休' : '咎') + '。三表归属：' + xj.biao + '（' + xj.jw + '）。从违之决按《太玄》本旨须结合日晷星数，此处仅并列呈现规则。</div>';
      d += '</div>';
      extra += d;
    }
    if (recs && recs.length) {
      const src = '<div class="src-line">起首：' + recs.map((r) => r.name + ' 余' + r.s.total + ' 画' + r.s.val).join('，') + '。正文=本地《太玄经》无标点本（OCR 噪声如实保留）' + (x.note ? '；' + x.note : '') + '；占法=黄宗羲《易学象数论》/胡一桂《周易启蒙翼传》。</div>';
      extra += src;
    }
    $('tx-result').innerHTML = z + extra;
  }
  function txQueryZan() {
    if (!D || !D.taixuan) return;
    const xu = parseInt($('tx-xu').value, 10);
    const pos = parseInt($('tx-pos').value, 10);
    if (!(xu >= 1 && xu <= 81) || !(pos >= 1 && pos <= 9)) {
      $('tx-result').innerHTML = '<div class="muted" style="color:#d17a7a;">首序须 1–81、赞位须 1–9。</div>';
      return;
    }
    const x = D.taixuan[xu - 1];
    $('tx-zan-hint').innerHTML = '赞序 = (首序−1)×9 + 赞位 = ' + ((xu - 1) * 9 + pos) + '。';
    txRender(x, pos - 1, []);
  }

  // ========== Tab 10 焦氏易林（六爻起卦 · 动爻定之卦 · 4096 条卦辞） ==========
  const YL_YAO = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
  function ylInit() {
    $('yl-throw').addEventListener('click', ylThrow);
    $('yl-reset').addEventListener('click', ylReset);
    $('yl-build').addEventListener('click', ylBuildManual);
    $('yl-query').addEventListener('click', ylQuery);
    $('yl-mode-coin').addEventListener('click', () => ylSetMode('coin'));
    $('yl-mode-manual').addEventListener('click', () => ylSetMode('manual'));
    $('yl-mode-direct').addEventListener('click', () => ylSetMode('direct'));
    if (D && D.yilin && D.yilin.hexagrams) {
      const hxs = D.yilin.hexagrams;
      ['yl-from', 'yl-to'].forEach((id) => {
        const sel = $(id);
        hxs.forEach((h) => {
          const o = document.createElement('option');
          o.value = h.name;
          o.textContent = h.number + ' ' + h.name;
          sel.appendChild(o);
        });
      });
      $('yl-hex').innerHTML = '<div class="muted">已加载 ' + D.yilin.entries.length + ' 条卦辞（' + hxs.length + ' 卦 × ' + hxs.length + ' 之卦）。掷六次铜钱或手动成卦起占，也可直查。</div>';
    }
  }
  function ylSetMode(m) {
    ['coin', 'manual', 'direct'].forEach((x) => $('yl-mode-' + x).classList.toggle('on', x === m));
    $('yl-coin-area').style.display = m === 'coin' ? '' : 'none';
    $('yl-manual-area').style.display = m === 'manual' ? '' : 'none';
    $('yl-direct-area').style.display = m === 'direct' ? '' : 'none';
  }
  function ylReset() {
    $('yl-anim').innerHTML = '';
    $('yl-log').innerHTML = '';
    $('yl-result').innerHTML = '';
    $('yl-hex').innerHTML = D && D.yilin
      ? '<div class="muted">已加载 ' + D.yilin.entries.length + ' 条卦辞（' + D.yilin.hexagrams.length + ' 卦 × ' + D.yilin.hexagrams.length + ' 之卦）。掷六次铜钱或手动成卦起占，也可直查。</div>'
      : '';
  }
  function ylHexName(vals) {
    if (!D || !D.yilin || !D.hexmap) return null;
    const ben = vals.map((v) => (v === 7 || v === 9 ? '1' : '0'));
    const key = ben.slice(3).join('') + ben.slice(0, 3).join('');
    const h = D.hexmap.map[key];
    if (!h) return null;
    // yilin 卦名体系是单字（乾/姤/…），entries 的 from/to 用单字 → 按上下卦匹配
    const yh = D.yilin.hexagrams.find((x) => x.upper === h.upper && x.lower === h.lower);
    return yh ? yh.name : null;
  }
  function ylDongInfo(vals) {
    const d = [];
    vals.forEach((v, i) => { if (v === 9 || v === 6) d.push(YL_YAO[i] + (v === 9 ? '老阳' : '老阴')); });
    return d;
  }
  function ylLookup(fromName, toName) {
    if (!D || !D.yilin) return null;
    return D.yilin.entries.find((e) => e.from === fromName && e.to === toName) || null;
  }
  function ylHexLines(name) {
    // 单字卦名 → 六爻线（自下而上 6 位，1=阳 0=阴）
    if (!D || !D.yilin || !name) return null;
    const hx = D.yilin.hexagrams.find((h) => h.name === name);
    if (!hx) return null;
    const up = D.yilin.trigrams.find((t) => t.name === hx.upper);
    const lo = D.yilin.trigrams.find((t) => t.name === hx.lower);
    if (!up || !lo) return null;
    return lo.lines.concat(up.lines);
  }
  function ylHexBlock(title, name, lines, dongBits, vals) {
    if (!lines) return '';
    let b = '<div class="yl-one"><div class="yl-one-t">' + esc(title) + ' · ' + esc(name || '') + '</div><div class="jq3-hex">';
    for (let i = 5; i >= 0; i--) {
      const yang = lines[i] === 1 || lines[i] === '1';
      const dong = dongBits ? dongBits[i] : false;
      b += '<div class="qk-yao"><span class="pos">' + YL_YAO[i] + '</span>';
      b += '<div class="line ' + (yang ? 'yang' : 'yin') + (dong ? ' dong' : '') + '"></div>';
      b += '<span class="sym">' + (vals ? (dong ? (vals[i] === 9 ? '9' : '6') : (yang ? '7' : '8')) : (yang ? '阳' : '阴')) + '</span></div>';
    }
    b += '</div></div>';
    return b;
  }
  function ylRender(vals, fromName, toName, entry, recs) {
    if (!D || !D.yilin) return;
    const dongs = vals ? ylDongInfo(vals) : [];
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:6px;">';
    h += '<span class="gua-name">' + esc(fromName || '（卦名未录）') + '</span>';
    if (dongs.length) h += '<span class="tag ban">动' + dongs.length + '爻 → 之卦 ' + esc(toName || '') + '</span>';
    else if (vals) h += '<span class="tag ban">六爻皆静 · 无动爻（以本卦自占，如「' + esc(fromName) + '之' + esc(fromName) + '」）</span>';
    else h += '<span class="tag ban">直查 → 之卦 ' + esc(toName || '') + '</span>';
    h += '</div>';
    // 双卦画：本卦 + 之卦 并排（直查时两卦都画，起卦时有动爻画变后之卦、无动爻明示自占）
    if (vals) {
      const ben = vals.map((v) => (v === 7 || v === 9 ? 1 : 0));
      const dongBits = vals.map((v) => v === 9 || v === 6);
      const zhiVals = vals.map((v) => (v === 9 ? 8 : v === 6 ? 7 : v));
      const zhiLines = zhiVals.map((v) => (v === 7 || v === 9 ? 1 : 0));
      h += '<div class="yl-dual">';
      h += ylHexBlock('本卦', fromName, ben, dongBits, vals);
      if (dongs.length) h += ylHexBlock('之卦', toName, zhiLines, null, zhiVals);
      else h += '<div class="yl-one"><div class="yl-one-t">之卦</div><div class="muted" style="font-size:12.5px;padding:8px 0;">六爻皆静，无动爻可变。<br>按古法以本卦自占（「' + esc(fromName) + '之' + esc(fromName) + '」）。</div></div>';
      h += '</div>';
      h += '<div class="src-line">爻值（自下而上）：' + vals.join(' ') + '；' + (dongs.length ? '动爻：' + dongs.join('、') + '，变后之卦 ' + esc(toName || '') : '六爻皆静，无之卦，按古法以本卦自占') + '。</div>';
    } else {
      h += '<div class="yl-dual">';
      h += ylHexBlock('本卦', fromName, ylHexLines(fromName), null, null);
      h += ylHexBlock('之卦', toName, ylHexLines(toName), null, null);
      h += '</div>';
    }
    h += '</div>';
    if (entry) {
      h += '<div class="card"><h3>' + esc(entry.key) + '</h3>';
      h += '<div class="item-block"><span class="k">卦辞</span><span class="v">' + esc(entry.text) + '</span></div>';
      if (entry.notes && entry.notes.length) {
        h += '<div class="note-box">校注：' + entry.notes.map(esc).join('；') + '</div>';
      }
      if (entry.corrected && entry.reason) {
        h += '<div class="note-box">校订：' + esc(entry.reason) + '</div>';
      }
      h += '<div class="src-line">数据源：github.com/eanzhao/jiaoshiyilin（维基文库《易林（四库全书本）》/识典古籍/易学网三源校订）。' + (recs && recs.length ? '起卦：' + recs.map((r) => r.y + ' ' + r.zheng + '正 ' + (3 - r.zheng) + '反 → ' + r.val + (r.dong ? '动' : '静')).join('，') + '。' : '') + '</div>';
      h += '</div>';
    } else {
      h += '<div class="note-box">未找到「' + esc(fromName || '?') + '之' + esc(toName || '?') + '」卦辞（数据异常，应 4096 条全覆盖）。</div>';
    }
    $('yl-result').innerHTML = h;
  }
  function ylThrow() {
    if (!D || !D.yilin) { $('yl-result').innerHTML = '<div class="muted" style="color:#d17a7a;">焦氏易林数据未加载。</div>'; return; }
    const board = $('yl-anim');
    board.innerHTML = '<div class="coin-board"></div>';
    const tbl = board.firstChild;
    const rows = [];
    const vals = [null, null, null, null, null, null];
    for (let y = 0; y < 6; y++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'coin-row';
      const tag = document.createElement('span');
      tag.className = 'yao-tag';
      let zheng = 0;
      for (let c = 0; c < 3; c++) {
        const z = Math.random() < 0.5;
        if (z) zheng++;
        const coin = document.createElement('div');
        coin.className = 'coin ' + (z ? 'zheng' : 'fan');
        coin.innerHTML = '<span class="face"></span><span class="hole"></span>';
        rowDiv.appendChild(coin);
      }
      rowDiv.appendChild(tag);
      tbl.appendChild(rowDiv);
      rows.push({ tag, zheng, y });
    }
    const logBox = $('yl-log');
    logBox.innerHTML = '';
    let yi = 0;
    const t = setInterval(() => {
      const { tag, zheng, y } = rows[yi];
      const rowDiv = tbl.children[yi];
      const coins = rowDiv.querySelectorAll('.coin');
      let ci = 0;
      const t2 = setInterval(() => {
        coins[ci].classList.add('fall');
        ci++;
        if (ci >= 3) {
          clearInterval(t2);
          // 一背=少阳7静、两背=少阴8静、三背=老阳9动、三字=老阴6动
          const val = zheng === 3 ? 9 : zheng === 2 ? 8 : zheng === 1 ? 7 : 6;
          const dong = val === 9 || val === 6;
          vals[y] = val;
          tag.textContent = YL_YAO[y] + '：' + zheng + ' 正 ' + (3 - zheng) + ' 反 → ' + val + (dong ? '（动）' : '（静）');
          logBox.innerHTML += '<div class="steps">' + YL_YAO[y] + '：' + zheng + ' 正 ' + (3 - zheng) + ' 反 → 爻值 <b>' + val + '</b>' + (dong ? '（动）' : '（静）') + '</div>';
          yi++;
          if (yi >= 6) {
            clearInterval(t);
            setTimeout(() => ylCommit(vals), 450);
          }
        }
      }, 90);
    }, 280);
  }
  function ylCommit(vals) {
    const fromName = ylHexName(vals);
    const dongs = ylDongInfo(vals);
    // 之卦 = 动爻阴阳互变：老阳9 → 少阴8（阴爻）、老阴6 → 少阳7（阳爻）
    const zhiVals = vals.map((v) => (v === 9 ? 8 : v === 6 ? 7 : v));
    const toName = dongs.length ? ylHexName(zhiVals) : fromName;
    const entry = ylLookup(fromName, toName);
    ylRender(vals, fromName, toName, entry);
  }
  function ylBuildManual() {
    if (!D || !D.yilin) return;
    const vals = [0, 1, 2, 3, 4, 5].map((i) => parseInt($('yl-y' + i).value, 10));
    ylCommit(vals);
  }
  function ylQuery() {
    if (!D || !D.yilin) return;
    const fromName = $('yl-from').value;
    const toName = $('yl-to').value;
    const entry = ylLookup(fromName, toName);
    if (!entry) { $('yl-result').innerHTML = '<div class="muted" style="color:#d17a7a;">未找到「' + esc(fromName) + '之' + esc(toName) + '」卦辞。</div>'; return; }
    $('yl-hex').innerHTML = '<div class="row muted">直查：' + esc(fromName) + '之' + esc(toName) + '（第 ' + (D.yilin.hexagrams.find((h) => h.name === fromName) || {}).number + ' 卦之第 ' + (D.yilin.hexagrams.find((h) => h.name === toName) || {}).number + ' 卦）</div>';
    ylRender(null, fromName, toName, entry);
  }
  // ═══════════ 京房易（京氏易传）═══════════
  const JF_NAJIA = { 乾: { in: '甲', out: '壬' }, 坤: { in: '乙', out: '癸' }, 震: { in: '庚', out: '庚' }, 巽: { in: '辛', out: '辛' }, 坎: { in: '戊', out: '戊' }, 离: { in: '己', out: '己' }, 艮: { in: '丙', out: '丙' }, 兑: { in: '丁', out: '丁' } };
  const JF_SHI = { 本卦: '上爻（宗庙）', 一世: '初爻（元士）', 二世: '二爻（大夫）', 三世: '三爻（三公）', 四世: '四爻（诸侯）', 五世: '五爻（天子）', 游魂: '四爻', 归魂: '三爻' };
  const JF_FIELDS = [
    ['yinyang', '阴阳用事'], ['shiwei', '世位（原文）'], ['shiying', '应（原文）'],
    ['najia', '纳甲（原文）'], ['liuqin', '六亲（原文）'], ['jian', '建候（纪月）'],
    ['jisuan', '积算（纪日）'], ['five', '五星从位'], ['xiu', '二十八宿从位'],
    ['hou', '卦气候数'], ['renshi', '配于人事'], ['yulei', '于类'], ['jiangru', '降入'],
  ];
  function jfInit() {
    if (!D || !D.jingfang) return;
    const jf = D.jingfang;
    $('jf-throw').addEventListener('click', jfThrow);
    $('jf-reset').addEventListener('click', jfReset);
    $('jf-build').addEventListener('click', jfBuildManual);
    $('jf-query').addEventListener('click', jfQuery);
    $('jf-mode-coin').addEventListener('click', () => jfSetMode('coin'));
    $('jf-mode-manual').addEventListener('click', () => jfSetMode('manual'));
    $('jf-mode-direct').addEventListener('click', () => jfSetMode('direct'));
    const sel = $('jf-from');
    sel.innerHTML = jf.entries.map((e) => '<option value="' + esc(e.name) + '">' + esc(e.sym + ' ' + e.name + '（' + e.palace + '宫 · ' + e.pos + '）') + '</option>').join('');
    $('jf-hex').innerHTML = '<div class="muted">已加载 ' + jf.entries.length + ' 卦（《京氏易传》八宫六十四卦参数）。摇卦 / 手动 / 直查得卦后展示该卦世应飞伏纳甲积算等全部京房参数。</div>';
    jfReset();
  }
  function jfSetMode(m) {
    $('jf-mode-coin').classList.toggle('on', m === 'coin');
    $('jf-mode-manual').classList.toggle('on', m === 'manual');
    $('jf-mode-direct').classList.toggle('on', m === 'direct');
    $('jf-coin-area').style.display = m === 'coin' ? '' : 'none';
    $('jf-manual-area').style.display = m === 'manual' ? '' : 'none';
    $('jf-direct-area').style.display = m === 'direct' ? '' : 'none';
  }
  function jfReset() {
    $('jf-anim').innerHTML = '';
    $('jf-log').innerHTML = '';
    $('jf-result').innerHTML = '';
    if (D && D.jingfang) $('jf-hex').innerHTML = '<div class="muted">已加载 ' + D.jingfang.entries.length + ' 卦（《京氏易传》八宫六十四卦参数）。摇卦 / 手动 / 直查得卦后展示该卦世应飞伏纳甲积算等全部京房参数。</div>';
  }
  function jfHexName(vals) {
    if (!D || !D.jingfang || !D.hexmap) return null;
    const ben = vals.map((v) => (v === 7 || v === 9 ? '1' : '0'));
    const key = ben.slice(3).join('') + ben.slice(0, 3).join('');
    const h = D.hexmap.map[key];
    if (!h) return null;
    const e = D.jingfang.entries.find((x) => x.upper === h.upper && x.lower === h.lower);
    return e || null;
  }
  function jfDongInfo(vals) {
    const d = [];
    vals.forEach((v, i) => { if (v === 9 || v === 6) d.push(YL_YAO[i] + (v === 9 ? '老阳' : '老阴')); });
    return d;
  }
  function jfRender(vals, entry) {
    if (!entry) return;
    const jf = D.jingfang;
    const f = entry.f || {};
    const dongs = vals ? jfDongInfo(vals) : [];
    let h = '<div class="card">';
    h += '<div class="row" style="margin-bottom:6px;">';
    h += '<span class="gua-name">' + esc(entry.sym) + ' ' + esc(entry.name) + '</span>';
    h += '<span class="tag ban">' + esc(entry.palace) + '宫 · ' + esc(entry.pos) + '</span>';
    if (vals && dongs.length) h += '<span class="tag">动' + dongs.length + '爻：' + esc(dongs.join('、')) + '（静为悔，发为贞，动爻为发）</span>';
    h += '</div>';
    // 卦画（有爻值时画，直查只给卦名行）
    if (vals) {
      const ben = vals.map((v) => (v === 7 || v === 9 ? 1 : 0));
      const dongBits = vals.map((v) => v === 9 || v === 6);
      h += '<div class="jq3-hex" style="max-width:340px;">';
      for (let i = 5; i >= 0; i--) {
        const yang = ben[i] === 1;
        const dong = dongBits[i];
        h += '<div class="qk-yao"><span class="pos">' + YL_YAO[i] + '</span>';
        h += '<div class="line ' + (yang ? 'yang' : 'yin') + (dong ? ' dong' : '') + '"></div>';
        h += '<span class="sym">' + (dong ? (vals[i] === 9 ? '9' : '6') : (yang ? '7' : '8')) + '</span></div>';
      }
      h += '</div>';
      h += '<div class="src-line">爻值（自下而上）：' + vals.join(' ') + '。</div>';
    }
    // 世应
    h += '<div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0;">';
    h += '<span class="tag ban">世爻：' + esc(JF_SHI[entry.pos] || (entry.shi_yao ? '第' + entry.shi_yao + '爻' : '原文未载')) + '</span>';
    h += '<span class="tag">应爻：' + esc('第' + entry.ying_yao + '爻') + '</span>';
    if (f.flying) h += '<span class="tag">飞伏：' + esc(f.flying) + '</span>';
    h += '</div>';
    // 纳甲（原文 + 体系推算）
    const najiaCalc = JF_NAJIA[entry.lower] && JF_NAJIA[entry.upper]
      ? '内卦纳' + JF_NAJIA[entry.lower].in + ' · 外卦纳' + JF_NAJIA[entry.upper].out
      : '';
    // 参数表
    h += '<div class="item-block"><span class="k">八宫归属</span><span>' + esc(entry.palace) + '宫第' + esc(entry.pos) + '卦（' + esc((jf.palaces.find((p) => p.palace === entry.palace) || {}).order ? jf.palaces.find((p) => p.palace === entry.palace).order.join(' → ') : '') + '）</span></div>';
    h += '<div class="item-block"><span class="k">纳甲</span><span>' + (f.najia ? esc(f.najia) + '；' : '') + (najiaCalc ? esc(najiaCalc) + '（按京房纳甲法推算，原文总纲：' + esc(jf.najiaRule.slice(0, 40)) + '…）' : '原文未载') + '</span></div>';
    JF_FIELDS.forEach(([k, label]) => {
      const v = f[k];
      if (!v) return;
      if (k === 'najia') return; // 上面单独出
      h += '<div class="item-block"><span class="k">' + label + '</span><span>' + esc(v) + (k === 'jiangru' ? '卦' : '') + '</span></div>';
    });
    if (!f.liuqin) h += '<div class="item-block"><span class="k">六亲（原文）</span><span class="muted">该卦原文未载六亲明细（乾卦载：水配位为福德／木入金乡居宝贝／土临内象为父母／火来四上嫌相敌／金入金乡木渐微）。</span></div>';
    // 断法
    h += '<details class="help-card" style="margin-top:8px;"><summary>断法（卷末：王则吉废则凶 · 静悔发贞 · 世应飞伏建积互）</summary><div class="help-body">';
    h += '<div class="step-line">' + esc(jf.duanfa.wangfei) + '</div>';
    h += '<div class="step-line">' + esc(jf.duanfa.jinghui) + '</div>';
    h += '<div class="step-line">' + esc(jf.duanfa.defs) + '</div>';
    h += '<div class="step-line">论法：' + esc(jf.duanfa.lunfa) + '</div>';
    h += '<div class="step-line">' + esc(jf.duanfa.lunfaTail) + '</div>';
    h += '</div></details>';
    // 原文
    h += '<details class="help-card" style="margin-top:8px;"><summary>原文（' + esc(entry.name) + '卦条目全文 · 简体）</summary><div class="help-body" style="white-space:pre-wrap;line-height:1.9;">' + esc(entry.text_simp || entry.text) + '</div></details>';
    h += '<div class="src-line">来源：《京氏易传》通行本；世应位次按京房八宫法通例补；描述性字段原文未载处已标注，不编造。</div>';
    h += '</div>';
    $('jf-result').innerHTML = h;
  }
  function jfCommit(vals) {
    const entry = jfHexName(vals);
    if (!entry) { $('jf-result').innerHTML = '<div class="muted" style="color:#d17a7a;">未能在京氏易传中找到该卦参数。</div>'; return; }
    jfRender(vals, entry);
  }
  function jfThrow() {
    if (!D || !D.jingfang) return;
    const tbl = $('jf-anim');
    tbl.innerHTML = '';
    const logBox = $('jf-log');
    logBox.innerHTML = '';
    const vals = [0, 0, 0, 0, 0, 0];
    const rows = [];
    for (let y = 0; y < 6; y++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'coin-row';
      const tag = document.createElement('div');
      tag.className = 'yao-tag';
      for (let c = 0; c < 3; c++) {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.textContent = (Math.random() < 0.5 ? '正' : '反');
        rowDiv.appendChild(coin);
      }
      rowDiv.appendChild(tag);
      tbl.appendChild(rowDiv);
      rows.push({ tag, rowDiv, y });
    }
    let yi = 0;
    const t = setInterval(() => {
      const { tag, rowDiv, y } = rows[yi];
      const coins = rowDiv.querySelectorAll('.coin');
      let ci = 0;
      const t2 = setInterval(() => {
        coins[ci].classList.add('fall');
        ci++;
        if (ci >= 3) {
          clearInterval(t2);
          const zheng = Array.from(coins).filter((c) => c.textContent === '正').length;
          const val = zheng === 3 ? 9 : zheng === 2 ? 8 : zheng === 1 ? 7 : 6;
          const dong = val === 9 || val === 6;
          vals[y] = val;
          tag.textContent = YL_YAO[y] + '：' + zheng + ' 正 ' + (3 - zheng) + ' 反 → ' + val + (dong ? '（动）' : '（静）');
          logBox.innerHTML += '<div class="steps">' + YL_YAO[y] + '：' + zheng + ' 正 ' + (3 - zheng) + ' 反 → 爻值 <b>' + val + '</b>' + (dong ? '（动）' : '（静）') + '</div>';
          yi++;
          if (yi >= 6) {
            clearInterval(t);
            setTimeout(() => jfCommit(vals), 450);
          }
        }
      }, 90);
    }, 280);
  }
  function jfBuildManual() {
    if (!D || !D.jingfang) return;
    const vals = [0, 1, 2, 3, 4, 5].map((i) => parseInt($('jf-y' + i).value, 10));
    jfCommit(vals);
  }
  function jfQuery() {
    if (!D || !D.jingfang) return;
    const name = $('jf-from').value;
    const entry = D.jingfang.entries.find((e) => e.name === name);
    if (!entry) { $('jf-result').innerHTML = '<div class="muted" style="color:#d17a7a;">未找到「' + esc(name) + '」。</div>'; return; }
    $('jf-hex').innerHTML = '<div class="row muted">直查：' + esc(entry.sym) + ' ' + esc(entry.name) + '（' + esc(entry.palace) + '宫 · ' + esc(entry.pos) + '）</div>';
    jfRender(null, entry);
  }

  // ========== Tab 12 梅花易数 ==========
  // 注意：MH 须在函数内动态取（D 为异步加载，顶层 const 会拿到 null）
  const MH_GUA = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
  const MH_TRIG = { '乾': '111', '兑': '110', '离': '101', '震': '100', '巽': '011', '坎': '010', '艮': '001', '坤': '000' }; // 下→上
  const MH_YAO = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];

  function mhSetMode(m) {
    ['time', 'num', 'manual'].forEach((x) => $('mh-mode-' + x).classList.toggle('on', x === m));
    $('mh-time-area').style.display = m === 'time' ? '' : 'none';
    $('mh-num-area').style.display = m === 'num' ? '' : 'none';
    $('mh-manual-area').style.display = m === 'manual' ? '' : 'none';
  }

  function mhInit() {
    const MH = D && D.meihua;
    if (!MH || !D.hexmap) return;
    const opts = MH_GUA.map((g) => '<option value="' + g + '">' + g + '（' + MH.elem[g] + '）</option>').join('');
    $('mh-up').innerHTML = opts;
    $('mh-down').innerHTML = opts;
    $('mh-mode-time').addEventListener('click', () => mhSetMode('time'));
    $('mh-mode-num').addEventListener('click', () => mhSetMode('num'));
    $('mh-mode-manual').addEventListener('click', () => mhSetMode('manual'));
    $('mh-time-go').addEventListener('click', mhTimeGo);
    $('mh-num-go').addEventListener('click', mhNumGo);
    $('mh-manual-go').addEventListener('click', mhManualGo);
    // 占事类别 ↔ 具体情况 联动
    $('mh-kind').addEventListener('change', mhRefreshCase);
    mhRefreshCase();
    // 默认按当前时间预填（近似：地支年数 + 公历月日 + 时辰数；农历月日可改）
    const now = new Date();
    const yNum = ((now.getFullYear() - 4) % 12) + 1;          // 子1…亥12（2026 午 → 7）
    const hNum = (Math.floor((now.getHours() + 1) / 2) % 12) + 1; // 子1…亥12
    $('mh-y').value = yNum;
    $('mh-m').value = now.getMonth() + 1;
    $('mh-d').value = now.getDate();
    $('mh-h').value = hNum;
    $('mh-time-today').textContent = '已按当前时间预填（年=' + yNum + ' 地支数，月/日=公历，时辰=' + hNum + '；农历月日可改）。';
    $('mh-result').innerHTML = '<div class="muted">已加载梅花易数规则（先天数 / 五行生克 / 卦气旺衰 / 体用总诀 / 十八占断语 / 万物类象）。选起卦方式 → 得卦 → 选占事类别 → 出断语。</div>';
    // 六十四卦查询
    $('mh-64up').addEventListener('change', mhGua64Show);
    $('mh-64lo').addEventListener('change', mhGua64Show);
    mhGua64Show();
  }

  function mhGua64Show() { // 上卦 × 下卦 → 完整卦文（卦辞/彖/象/六爻+注/文言/附）
    if (!D.zhouyi || !D.zhouyi.gua) { $('mh-64res').innerHTML = '<div class="muted">周易数据未加载</div>'; return; }
    const TRIG = { '乾': '111', '兑': '110', '离': '101', '震': '100', '巽': '011', '坎': '010', '艮': '001', '坤': '000' };
    const up = $('mh-64up').value, lo = $('mh-64lo').value;
    const bits = TRIG[lo].split('').concat(TRIG[up].split(''));
    const hex = mhHexName(bits);
    if (!hex) { $('mh-64res').innerHTML = '<div class="muted">未匹配到卦</div>'; return; }
    const idx = FULL_NAMES.indexOf(hex.name);
    if (idx < 0) { $('mh-64res').innerHTML = '<div class="muted">卦序未匹配</div>'; return; }
    const g = D.zhouyi.gua[idx];
    let h = '<div class="card">';
    h += '<div class="row" style="flex-wrap:wrap;gap:6px;margin-bottom:6px;"><span class="gua-name">' + esc((hex.sym || '') + ' ' + hex.name) + '</span><span class="muted">第 ' + (idx + 1) + ' 卦 · ' + esc(g.name) + ' · ' + esc(up) + '上 ' + esc(lo) + '下</span></div>';
    if (g.guaci) h += '<div class="item-block"><span class="k">卦辞</span><span>' + esc(g.guaci) + '</span></div>';
    (g.tuan || []).forEach((t) => { h += '<div class="item-block"><span class="k">彖</span><span>' + esc(t) + '</span></div>'; });
    (g.xiang || []).forEach((x) => { h += '<div class="item-block"><span class="k">象</span><span>' + esc(x) + '</span></div>'; });
    Object.keys(g.yaos || {}).forEach((yk) => {
      h += '<div class="item-block"><span class="k">' + esc(yk) + '</span><span>' + esc(g.yaos[yk]) + '</span></div>';
      const nt = (g.notes || {})['yao:' + yk];
      if (nt && nt.length) h += '<div class="muted" style="font-size:12px;margin:-2px 0 6px 12px;">注：' + esc(nt.join('')) + '</div>';
    });
    if (g.wenyan) h += '<div class="item-block"><span class="k">文言</span><span>' + esc(g.wenyan) + '</span></div>';
    if (g.other) h += '<div class="item-block"><span class="k">附</span><span>' + esc(g.other) + '</span></div>';
    h += '</div>';
    $('mh-64res').innerHTML = h;
  }

  function mhMod(n, m) { const r = n % m; return r === 0 ? m : r; }

  function mhNumToTrig(n) {
    const m = mhMod(n, 8);
    const map = { 1: '乾', 2: '兑', 3: '离', 4: '震', 5: '巽', 6: '坎', 7: '艮', 8: '坤' };
    return map[m];
  }

  function mhKeyOf(bits) { // bits[0..5]=初..上（'1'/'0'）
    return bits.slice(3).join('') + bits.slice(0, 3).join('');
  }

  function mhHexName(bits) {
    const h = D.hexmap.map[mhKeyOf(bits)];
    return h || null;
  }

  function mhBuild(upper, lower, dongIdx) { // dongIdx 0-5
    const u = MH_TRIG[upper].split('');
    const l = MH_TRIG[lower].split('');
    const bits = l.concat(u); // [初..上]
    const dongs = new Array(6).fill(false);
    dongs[dongIdx] = true;
    const bian = bits.slice();
    bian[dongIdx] = bian[dongIdx] === '1' ? '0' : '1';
    const huXia = bits.slice(1, 4); // 二三四爻
    const huShang = bits.slice(2, 5); // 三四五爻
    const huBits = huShang.concat(huXia);
    return { bits, dongs, bian, huBits, dongIdx };
  }

  function mhRelation(tiElem, yongElem) { // 用 与 体 的生克
    const MH = D.meihua;
    if (tiElem === yongElem) return '比和';
    if (MH.sheng[yongElem] === tiElem) return '用生体';
    if (MH.sheng[tiElem] === yongElem) return '体生用';
    if (MH.ke[yongElem] === tiElem) return '用克体';
    if (MH.ke[tiElem] === yongElem) return '体克用';
    return '？';
  }

  function mhRefreshCase() {
    const MH = D && D.meihua;
    if (!MH) return;
    const sel = $('mh-case');
    const kind = $('mh-kind').value;
    const cases = (MH.shiba[kind] && MH.shiba[kind].cases) || [];
    if (!cases.length) { sel.innerHTML = '<option value="">（该占事无细分，按五档总断）</option>'; return; }
    sel.innerHTML = '<option value="">（按五档总断）</option>' + cases.map((c, i) =>
      '<option value="' + i + '">' + esc(c.label) + '</option>').join('');
  }

  // ── 梅花增强：错卦/综卦/策轨/神煞/卦辞（对照热卜 App 补全） ──
  const MH_XT_NUM = { '乾': 1, '兑': 2, '离': 3, '震': 4, '巽': 5, '坎': 6, '艮': 7, '坤': 8 };   // 先天卦数
  const MH_HT_NUM = { '坎': 1, '坤': 2, '震': 3, '巽': 4, '乾': 6, '兑': 7, '艮': 8, '离': 9 };   // 后天卦数
  function mhCeGui(bits, dongIdx) { // 策（先天演策）/轨（后天轨策），《周易数》公式：动爻在上卦用动因十、在下卦用卦因十
    const yang = bits.filter((b) => b === '1').length, yin = 6 - yang;
    const V1 = 36 * yang + 24 * yin, V2 = 128 * yang + 112 * yin;
    const tr = mhTrigsFromBits(bits);
    const up = tr.upper, lo = tr.lower;
    const d = dongIdx + 1;
    const up1 = MH_XT_NUM[up], lo1 = MH_XT_NUM[lo], up2 = MH_HT_NUM[up], lo2 = MH_HT_NUM[lo];
    const ce = dongIdx >= 3
      ? d * 10 * V1 + up1 * V1 + V1 + (up1 + lo1 + d)
      : lo1 * 10 * V1 + d * V1 + V1 + (up1 + lo1 + d);
    const gui = dongIdx >= 3
      ? d * 10 * V2 + up2 * V2 + V2 + (up2 + lo2 + d)
      : lo2 * 10 * V2 + d * V2 + V2 + (up2 + lo2 + d);
    return { ce: String(ce), gui: String(gui) };
  }
  function mhShensha(dayGz, monthGz) { // 驿马/桃花按日支、日禄按日干、月德按月支（三合局）
    const dz = dayGz[1], dg = dayGz[0], mz = monthGz[1];
    const yiMa = { '申': '寅', '子': '寅', '辰': '寅', '寅': '申', '午': '申', '戌': '申', '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳' }[dz];
    const taoHua = { '申': '酉', '子': '酉', '辰': '酉', '寅': '卯', '午': '卯', '戌': '卯', '巳': '午', '酉': '午', '丑': '午', '亥': '子', '卯': '子', '未': '子' }[dz];
    const riLu = { '甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子' }[dg];
    const yueDe = { '寅': '丙', '午': '丙', '戌': '丙', '申': '壬', '子': '壬', '辰': '壬', '亥': '甲', '卯': '甲', '未': '甲', '巳': '庚', '酉': '庚', '丑': '庚' }[mz];
    const parts = [];
    if (yiMa) parts.push('驿马--' + yiMa);
    if (taoHua) parts.push('桃花--' + taoHua);
    if (riLu) parts.push('日禄--' + riLu);
    if (yueDe) parts.push('月德--' + yueDe);
    return parts.join(' ');
  }
  function mhYaoName(bits, i) { // 爻名：初九/六二…（位序 + 九六）
    const wei = ['初', '二', '三', '四', '五', '上'][i];
    return wei + (bits[i] === '1' ? '九' : '六');
  }
  function mhGuaCi(hex) { // 从周易（王弼注）取卦辞/大象/动爻爻辞：全名→单名（FULL_NAMES 顺序 = zhouyi.gua 序号）
    if (!D.zhouyi || !D.zhouyi.gua || !hex) return null;
    const idx = FULL_NAMES.indexOf(hex.name);
    if (idx < 0) return null;
    const g = D.zhouyi.gua[idx];
    return g ? g : null;
  }

  function mhRender(upper, lower, dongIdx, upperName, lowerName) {
    const MH = D.meihua;
    const { bits, dongs, bian, huBits, dongIdx: di } = mhBuild(upper, lower, dongIdx);
    const benHex = mhHexName(bits);
    const huHex = mhHexName(huBits);
    const bianHex = mhHexName(bian);
    // 错卦（旁通，六爻全反）/ 综卦（倒覆，六爻颠倒）
    const cuoBits = bits.map((b) => (b === '1' ? '0' : '1'));
    const zongBits = bits.slice().reverse();
    const cuoHex = mhHexName(cuoBits);
    const zongHex = mhHexName(zongBits);
    // 体用分：动爻在下卦（初二三）→ 用卦=下卦、体卦=上卦；否则反之
    const tiGua = di < 3 ? upper : lower;
    const yongGua = di < 3 ? lower : upper;
    const tiElem = MH.elem[tiGua];
    const yongElem = MH.elem[yongGua];
    const rel = mhRelation(tiElem, yongElem);
    const relInfo = {
      '比和': { cls: 'ban', txt: '比和 · 百事顺遂（吉）' },
      '用生体': { cls: 'ban', txt: '用生体 · 有进益之喜（吉）' },
      '体生用': { cls: '', txt: '体生用 · 有耗失之患（泄气）' },
      '用克体': { cls: '', txt: '用克体 · 诸事凶' },
      '体克用': { cls: 'ban', txt: '体克用 · 诸事吉' },
    }[rel] || { cls: '', txt: rel };
    const kind = $('mh-kind').value;
    const shiba = MH.shiba[kind];
    const season = mhSeason();
    const tiWang = MH.wang[season].includes(tiGua);
    const tiShuai = MH.shuai[season].includes(tiGua);
    // 占时信息（当前公历时刻；梅花时间起卦输入为农历数，未内置农历历表，故干支按当前时刻推算）
    const now = new Date();
    const hourZi = Math.floor((now.getHours() + 1) / 2) % 12;
    const sz = tySizhu(now.getFullYear(), now.getMonth() + 1, now.getDate(), hourZi);
    const jq = tyJieqiRange(now.getMonth() * 100 + now.getDate());
    const ss = mhShensha(sz.day, sz.month);
    const cg = mhCeGui(bits, di);
    const zyHex = mhGuaCi(benHex);
    const zyYao = zyHex && zyHex.yaos ? zyHex.yaos[mhYaoName(bits, di)] : null;

    // ── 渲染 ──
    let h = '<div class="src-line">输入指纹 <code>' + inputHash(kind, upper, lower, dongIdx) + '</code>（相同输入 → 相同指纹，可复现/留档）</div>';
    h += '<div class="card">';
    // 卦名行
    h += '<div class="row" style="margin-bottom:6px;">';
    if (benHex) h += '<span class="gua-name">' + esc(benHex.sym) + ' ' + esc(benHex.name) + '</span>';
    else h += '<span class="gua-name">' + esc(upper) + '上 ' + esc(lower) + '下</span>';
    h += '<span class="tag">动爻：' + esc(MH_YAO[di]) + '</span>';
    h += '<span class="tag ban">' + esc(relInfo.txt) + '</span>';
    h += '</div>';
    // 占时信息条（干支/空亡/节气/神煞/策轨）
    h += '<div class="card" style="margin-top:10px;padding:10px 12px;">';
    h += '<div class="row" style="flex-wrap:wrap;gap:4px 16px;font-size:13px;color:#9aa1b3;">';
    let lunarTxt = '农历历表未加载';
    try { if (typeof Lunar !== 'undefined' && Lunar.fromDate) { const l = Lunar.fromDate(now); lunarTxt = '农历' + l.getYearInChinese() + '年' + l.getMonthInChinese() + '月' + l.getDayInChinese(); } } catch (e) { lunarTxt = '农历历表错误'; }
    h += '<span>占时（当前公历）：' + esc(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')) + '（' + esc(lunarTxt) + '）</span>';
    h += '<span>干支：' + esc(sz.year + '年 ' + sz.month + '月 ' + sz.day + '日 ' + sz.hour + '时') + '</span>';
    h += '<span>空亡：年' + esc(sz.kongY) + ' 月' + esc(sz.kongM) + ' 日' + esc(sz.kongD) + ' 时' + esc(sz.kongH) + '</span>';
    h += '<span>节气：' + esc(jq.from + ' ~ ' + jq.to) + '（近似日）</span>';
    h += '<span>神煞：' + esc(ss) + '</span>';
    h += '<span>策轨：策 ' + esc(cg.ce) + '（先天演策）｜轨 ' + esc(cg.gui) + '（后天轨策）</span>';
    h += '</div>';
    h += '<div class="muted" style="font-size:12px;margin-top:4px;">四柱/空亡按当前公历时刻（tySizhu 纪法，立春为年界）；节气为近似日；策轨按《周易数》演策公式（先天阳36阴24 / 后天阳128阴112，动爻在上卦用动因十、在下卦用卦因十）；App 显示口径（策 2698/轨 47114）算法未公开，未沿用。</div>';
    h += '</div>';
    // 五卦画（本/互/变/错/综，含角色用法与各卦周易卦辞）
    h += '<div class="row" style="flex-wrap:wrap;gap:8px;margin:10px 0;">';
    [['本卦', bits, benHex, di, '定体用 · 现况', '静者为体、动者为用，体用生克断本卦吉凶'],
      ['互卦', huBits, huHex, null, '看过程 · 互生体吉、互克体凶', '事之中间进程与内部因素（古籍断语）'],
      ['变卦', bian, bianHex, di, '验结果 · 终局', '变卦动爻经卦与体卦论生克，断最终吉凶'],
      ['错卦', cuoBits, cuoHex, null, '观反面 · 旁参', '六爻全反之象，不入体用吉凶'],
      ['综卦', zongBits, zongHex, null, '观反复 · 旁参', '六爻颠倒之象，不入体用吉凶']].forEach(([tag, b, hex, hi, role, roleD]) => {
      h += '<div style="min-width:140px;text-align:center;">';
      h += '<div class="muted" style="margin-bottom:4px;">' + tag + (hex ? '：' + esc((hex.sym || '') + ' ' + hex.name) : '') + '</div>';
      h += '<div class="jq3-hex" style="max-width:105px;margin:0 auto;">';
      for (let i = 5; i >= 0; i--) {
        const yang = b[i] === '1';
        const dong = hi !== null && hi === i;
        h += '<div class="qk-yao"><div class="line ' + (yang ? 'yang' : 'yin') + (dong ? ' dong' : '') + '"></div></div>';
      }
      h += '</div>';
      h += '<div style="font-size:12px;color:#d9bc7c;margin-top:4px;">' + esc(role) + '</div>';
      h += '<div class="muted" style="font-size:11px;line-height:1.4;margin-top:2px;">' + esc(roleD) + '</div>';
      h += '</div>';
    });
    h += '</div>';
    // 五卦卦辞（周易·王弼注，五列等高，每列限 4 行，全文 title 悬浮）
    h += '<div class="item-block"><span class="k">五卦卦辞（周易·王弼注）</span><span class="muted" style="font-size:12px;">各卦原文，限 4 行预览，悬停看全文</span></div>';
    h += '<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:8px 0;">';
    [['本卦', bits, benHex, di], ['互卦', huBits, huHex, null], ['变卦', bian, bianHex, di], ['错卦', cuoBits, cuoHex, null], ['综卦', zongBits, zongHex, null]].forEach(([tag, b, hex, hi]) => {
      const g = mhGuaCi(hex);
      h += '<div style="background:#1a2130;border:1px solid #2a3348;border-radius:8px;padding:8px 10px;">';
      h += '<div style="font-size:12px;color:#d9bc7c;margin-bottom:4px;">' + tag + (hex ? '：' + esc((hex.sym || '') + ' ' + hex.name) : '') + '</div>';
      if (g) {
        const gc = g.guaci || '';
        h += '<div class="gp" title="' + esc(gc) + '">' + esc(gc) + '</div>';
        if (hi !== null && g.yaos) {
          const yk = mhYaoName(b, hi);
          const yv = g.yaos[yk];
          if (yv) h += '<div class="gp" title="' + esc(yk + '：' + yv) + '"><span style="color:#e8a08f;">' + esc(yk) + '</span>：' + esc(yv) + '</div>';
        }
      } else {
        h += '<div class="muted" style="font-size:12px;">卦辞未载</div>';
      }
      h += '</div>';
    });
    h += '</div>';
    // 体用
    h += '<div class="item-block"><span class="k">体用分</span><span>体卦：' + esc(tiGua) + '（' + esc(tiElem) + ' · ' + (tiWang ? '当季旺' : tiShuai ? '当季衰' : '平') + '）｜用卦：' + esc(yongGua) + '（' + esc(yongElem) + '）｜' + esc(relInfo.txt) + '（动者为用，静者为体；互卦为事之中间，变卦为事之终）</span></div>';
    // 十八占断语
    if (shiba) {
      h += '<div class="item-block"><span class="k">' + esc(kind) + '占（' + esc(shiba.zhang) + '）</span><span>' + esc(shiba.zhu) + ' ' + esc(shiba.duan) + (shiba.bei ? '　注：' + esc(shiba.bei) : '') + '</span></div>';
      // 具体情况分支（可选项）
      const ci = parseInt($('mh-case').value, 10);
      const cs = shiba.cases || [];
      if (!isNaN(ci) && cs[ci]) {
        h += '<div class="item-block"><span class="k">具体情况 · ' + esc(cs[ci].label) + '</span><span>' + esc(cs[ci].duan) + '</span></div>';
      }
    }
    // 生体/克体 断语（互卦、变卦中与体卦相生/相克者，原文"看全卦中有生体之卦，看是何卦"）
    const huTr = huHex ? mhTrigsFromBits(huBits) : null;
    const bianTr = bianHex ? mhTrigsFromBits(bian) : null;
    const cands = [];
    if (huTr) { cands.push(['互卦·上卦', huTr.upper, MH.elem[huTr.upper]]); cands.push(['互卦·下卦', huTr.lower, MH.elem[huTr.lower]]); }
    if (bianTr) { cands.push(['变卦·上卦', bianTr.upper, MH.elem[bianTr.upper]]); cands.push(['变卦·下卦', bianTr.lower, MH.elem[bianTr.lower]]); }
    const shengList = [], keList = [];
    cands.forEach(([tag, g, el]) => {
      if (el === tiElem) return; // 比和另论（非生非克）
      const r = mhRelation(tiElem, el);
      if (r === '用生体') shengList.push([tag, g]);
      if (r === '用克体') keList.push([tag, g]);
    });
    if (shengList.length) h += '<div class="item-block"><span class="k">生体之卦（吉）</span><span>' + esc(shengList.map(([t, g]) => t + '为' + g).join('；')) + ' → ' + esc(MH.shengTi[shengList[0][1]]) + '</span></div>';
    if (keList.length) h += '<div class="item-block"><span class="k" style="color:#d17a7a;">克体之卦（凶）</span><span>' + esc(keList.map(([t, g]) => t + '为' + g).join('；')) + ' → ' + esc(MH.keTi[keList[0][1]]) + '</span></div>';
    // 应期
    h += '<div class="item-block"><span class="k">应期</span><span>吉应：生体及比和之卦气之日（' + esc((shengList[0] ? MH.shixu[shengList[0][1]] : MH.shixu[yongGua])) + '）；凶应：克体之卦气之日（' + esc((keList[0] ? MH.shixu[keList[0][1]] : '无克体卦则不见凶期')) + '）。体卦宜旺不宜衰：' + esc(season) + '令' + esc(tiGua) + (tiWang ? '旺' : tiShuai ? '衰' : '平') + '。</span></div>';
    // 类象
    h += '<details class="help-card" style="margin-top:8px;"><summary>万物类象（体卦 ' + esc(tiGua) + ' / 用卦 ' + esc(yongGua) + '）</summary><div class="help-body">';
    [tiGua, yongGua].forEach((g) => {
      const lx = MH.leixiang[g] || {};
      h += '<b>' + esc(g) + '卦：</b>';
      h += Object.keys(lx).map((c) => '<div class="step-line"><b>' + esc(c) + '：</b>' + esc(lx[c]) + '</div>').join('');
    });
    h += '</div></details>';
    // 断法
    h += '<details class="help-card" style="margin-top:8px;"><summary>断法（体用总诀 · 体用互变 · 衰旺动静）</summary><div class="help-body">';
    h += '<div class="step-line">' + esc(MH.tiguan.siji) + '</div>';
    h += '<div class="step-line">体用互变之诀：' + esc(MH.duanfa.tiyong_hubian) + '</div>';
    h += '<div class="step-line">衰旺：' + esc(MH.duanfa.shuaiwang) + '</div>';
    h += '<div class="step-line">动静：' + esc(MH.duanfa.dongjing) + '</div>';
    h += '</div></details>';
    // 原文（起卦诸例 + 体用生克篇）
    h += '<details class="help-card" style="margin-top:8px;"><summary>原文（梅花易数全文保底 · 简体）</summary><div class="help-body" style="white-space:pre-wrap;line-height:1.9;max-height:420px;overflow:auto;">' + esc(MH.text) + '</div></details>';
    h += '<div class="src-line">来源：《梅花易数》托名邵康节古籍 + 整理表；结构化规则取自原文，不改写；原文未载处不编造。</div>';
    h += '</div>';
    $('mh-result').innerHTML = h;
  }

  function mhTrigsFromBits(bits) { // 键序位 → 上卦/下卦名
    const upBits = bits.slice(3).join('');
    const loBits = bits.slice(0, 3).join('');
    const rev = {}; Object.keys(MH_TRIG).forEach((k) => { rev[MH_TRIG[k]] = k; });
    return { upper: rev[upBits], lower: rev[loBits] };
  }

  function mhSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 2 && m <= 4) return '春';
    if (m >= 5 && m <= 7) return '夏';
    if (m >= 8 && m <= 10) return '秋';
    if (m === 11 || m === 12 || m === 1) return '冬';
    return '四季';
  }

  function mhTimeGo() {
    const y = parseInt($('mh-y').value, 10) || 1;
    const m = parseInt($('mh-m').value, 10) || 1;
    const d = parseInt($('mh-d').value, 10) || 1;
    const hh = parseInt($('mh-h').value, 10) || 1;
    const total = y + m + d + hh;
    const upper = mhNumToTrig(y + m + d);
    const lower = mhNumToTrig(total);
    const dongIdx = mhMod(total, 6) - 1;
    mhRender(upper, lower, dongIdx, upper, lower);
  }

  function mhNumGo() {
    const n1 = parseInt($('mh-n1').value, 10);
    const n2 = parseInt($('mh-n2').value, 10);
    if (!n1 || !n2) { $('mh-result').innerHTML = '<div class="muted" style="color:#d17a7a;">请先输入两组数字。</div>'; return; }
    const upper = mhNumToTrig(n1);
    const lower = mhNumToTrig(n2);
    const dongIdx = mhMod(n1 + n2, 6) - 1;
    mhRender(upper, lower, dongIdx, upper, lower);
  }

  function mhManualGo() {
    const upper = $('mh-up').value;
    const lower = $('mh-down').value;
    const dongIdx = parseInt($('mh-dong').value, 10) - 1;
    mhRender(upper, lower, dongIdx, upper, lower);
  }

  // ========== Tab 13 太乙神数 ==========
  const TY_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  // 六十甲子（0 基：0=甲子）
  const TY_JIAZI = ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉',
    '甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未',
    '甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳',
    '甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯',
    '甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑',
    '甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'];

  // 儒略日（1582-10-15 前用儒略历公式，其后格里高利公式）
  function tyJdn(y, m, d) {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    if (y < 1582 || (y === 1582 && (m < 10 || (m === 10 && d < 15)))) {
      return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - 32083;
    }
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
      - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }

  // 日局：纪法求日（基准 弘治元年正月初一 1488-01-14 丙申，祖数 213）
  // 干支序 0 基 = (JDN + 49) mod 60（锚点双验：1488-01-14→丙申32、1498-01-22→丁酉33）
  function tyRiju(year, month, day) {
    const baseJdn = tyJdn(1488, 1, 14);
    const tJdn = tyJdn(year, month, day);
    const days = tJdn - baseJdn;
    const zushu = 213 + days;
    const ju = ((zushu % 72) + 72) % 72 || 72;
    const gz0 = ((tJdn + 49) % 60 + 60) % 60;
    return { days, zushu, ju: String(ju), gz: TY_JIAZI[gz0], gz0 };
  }

  // ---- 干支历（四柱/空亡/节气），标准历法算法 ----
  const TY_TG = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const TY_DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  // 干支(g,z 0基) → 六十甲子序 0基
  function tyGzSeq(g, z) { return ((g * 6 - z * 5) % 60 + 60) % 60; }
  // 月柱序（0=寅月）：以公历节气近似日为界（立春2/4 惊蛰3/6 清明4/5 立夏5/6 芒种6/6 小暑7/7 立秋8/8 白露9/8 寒露10/8 立冬11/7 大雪12/7 小寒1/6）
  function tyMonthOrder(md) {
    if (md < 106) return 10;          // 1/1-1/5：子月（前年大雪后）
    if (md < 204) return 11;          // 1/6-2/3：丑月
    if (md < 306) return 0;           // 2/4-3/5：寅月
    if (md < 405) return 1;           // 3/6-4/4：卯月
    if (md < 506) return 2;           // 4/5-5/5：辰月
    if (md < 606) return 3;           // 5/6-6/5：巳月
    if (md < 707) return 4;           // 6/6-7/6：午月
    if (md < 808) return 5;           // 7/7-8/7：未月
    if (md < 908) return 6;           // 8/8-9/7：申月
    if (md < 1008) return 7;          // 9/8-10/7：酉月
    if (md < 1107) return 8;          // 10/8-11/6：戌月
    if (md < 1207) return 9;          // 11/7-12/6：亥月
    return 10;                        // 12/7 起：子月
  }
  // 四柱+空亡+节气区间（hourZi 0=子时；节气为近似日，已标注）
  function tySizhu(year, month, day, hourZi) {
    const md = month * 100 + day;
    // 年柱（立春 2/4 前用上年）
    let yg = ((year - 4) % 10 + 10) % 10, yz = ((year - 4) % 12 + 12) % 12;
    if (md < 204) { yg = ((year - 5) % 10 + 10) % 10; yz = ((year - 5) % 12 + 12) % 12; }
    // 月柱（正月干：甲己丙、乙庚戊、丙辛庚、丁壬壬、戊癸甲）
    const order = tyMonthOrder(md);
    const zhengYueGan = ((yg % 5) * 2 + 2) % 10;
    const mg = (zhengYueGan + order) % 10, mz = (order + 2) % 12;
    // 日柱（纪法日干支）
    const dgz0 = tyRiju(year, month, day).gz0;
    const dg = dgz0 % 10, dz = dgz0 % 12;
    // 时柱（子时干：甲己甲、乙庚丙、丙辛戊、丁壬庚、戊癸壬）
    const ziGan = (dg % 5) * 2;
    const hg = (ziGan + hourZi) % 10, hz = hourZi % 12;
    // 空亡（旬首支 +10/+11）
    const kong = (gz0) => {
      const xun = gz0 - (gz0 % 10), z = xun % 12;
      return TY_DZ[(z + 10) % 12] + TY_DZ[(z + 11) % 12];
    };
    const yGz = tyGzSeq(yg, yz), mGz = tyGzSeq(mg, mz), dGz = dgz0, hGz = tyGzSeq(hg, hz);
    return {
      year: TY_TG[yg] + TY_DZ[yz], month: TY_TG[mg] + TY_DZ[mz],
      day: TY_TG[dg] + TY_DZ[dz], hour: TY_TG[hg] + TY_DZ[hz],
      kongY: kong(yGz), kongM: kong(mGz), kongD: kong(dGz), kongH: kong(hGz),
    };
  }
  // 节气区间（近似日，标注）：以立春为年界；当前节 = 最后一个 ≤md 的节；区间 = (上一节 ~ 当前节)
  function tyJieqiRange(md) {
    if (md < 106) return { from: '大雪', to: '小寒' };            // 1/1-1/5：前年大雪后、小寒前
    if (md < 120) return { from: '冬至', to: '小寒' };            // 1/6-1/19
    if (md < 204) return { from: '小寒', to: '大寒' };            // 1/20-2/3
    const seq = [
      [204, '立春'], [219, '雨水'], [306, '惊蛰'], [321, '春分'], [405, '清明'],
      [420, '谷雨'], [506, '立夏'], [521, '小满'], [606, '芒种'], [621, '夏至'], [707, '小暑'],
      [723, '大暑'], [808, '立秋'], [823, '处暑'], [908, '白露'], [923, '秋分'], [1008, '寒露'],
      [1023, '霜降'], [1107, '立冬'], [1122, '小雪'], [1207, '大雪'], [1222, '冬至'],
    ];
    let cur = '立春', idx = 0;
    for (let i = 0; i < seq.length; i++) { if (seq[i][0] <= md) { cur = seq[i][1]; idx = i; } }
    const prev = seq[(idx + seq.length - 1) % seq.length][1];
    return { from: prev, to: cur };
  }

  // ---- 太乙圆盘（SVG）：九宫八卦十二支 + 神煞布位 ----
  // 地支/维 → 洛书宫（子1 丑寅8 卯3 辰巳4 午9 未申2 酉7 戌亥6；艮8 巽4 坤2 乾6）
  function tyDzToGong(dz) {
    const map = { 子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6, 艮: 8, 巽: 4, 坤: 2, 乾: 6 };
    return map[dz];
  }
  // 宫 → 圆盘角度（北0° 顺时针）：1北 8东北 3东 4东南 9南 2西南 7西 6西北
  const TY_GONG_DEG = { 1: 0, 8: 45, 3: 90, 4: 135, 9: 180, 2: 225, 7: 270, 6: 315 };
  const TY_DZ_DEG = { 子: 0, 丑: 30, 寅: 60, 卯: 90, 辰: 120, 巳: 150, 午: 180, 未: 210, 申: 240, 酉: 270, 戌: 300, 亥: 330 };
  const TY_DZ_GONG = { 子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6 };
  function tyPt(r, deg) {
    const rad = deg * Math.PI / 180;
    return [215 + r * Math.sin(rad), 215 - r * Math.cos(rad)];
  }
  function tyPanHtml(L, c, dun, TY) {
    const gong = (n) => TY.jiugong[TY_CN[n - 1]] || {};
    const degOfGong = (n) => TY_GONG_DEG[n] || 0;
    const degOfDz = (dz) => TY_DZ_DEG[dz] != null ? TY_DZ_DEG[dz] : degOfGong(tyDzToGong(dz));
    // 神煞 → 宫（核心：太乙/文昌/始击/计神 放中圈；大小将 放盘缘外侧）
    const core = [], gen = [];
    if (L.taiyi) core.push({ t: '太乙', g: L.taiyi, hot: true });
    if (L.tianmu) { const dz = TY.shen_dizhi[L.tianmu]; core.push({ t: '文昌', g: dz ? tyDzToGong(dz) : null, sub: L.tianmu }); }
    if (L.kemu) { const dz = TY.shen_dizhi[L.kemu]; core.push({ t: '始击', g: dz ? tyDzToGong(dz) : null, sub: L.kemu }); }
    if (L.jishen) { const dz = String(L.jishen).replace(/[^子丑寅卯辰巳午未申酉戌亥]/, ''); core.push({ t: '计神', g: dz ? TY_DZ_GONG[dz] : null, sub: L.jishen }); }
    const zd = L.zhusuan ? tyDajiang(L.zhusuan) : null, kd = L.kesuan ? tyDajiang(L.kesuan) : null;
    if (zd && zd.dajiang) gen.push({ t: '主大将', g: zd.dajiang });
    if (zd && zd.canjiang) gen.push({ t: '主参将', g: zd.canjiang });
    if (kd && kd.dajiang) gen.push({ t: '客大将', g: kd.dajiang });
    if (kd && kd.canjiang) gen.push({ t: '客参将', g: kd.canjiang });
    // 九宫八卦
    let svg = '<svg viewBox="0 0 430 430" style="width:100%;max-width:740px;display:block;margin:6px auto;background:transparent;" xmlns="http://www.w3.org/2000/svg">';
    svg += '<circle cx="215" cy="215" r="196" fill="#12141d" stroke="#d9a05e" stroke-width="1.2"/>';
    svg += '<circle cx="215" cy="215" r="150" fill="none" stroke="#3a3f52" stroke-width="1"/>';
    svg += '<circle cx="215" cy="215" r="116" fill="none" stroke="#3a3f52" stroke-width="1"/>';
    svg += '<circle cx="215" cy="215" r="62" fill="none" stroke="#3a3f52" stroke-width="1"/>';
    // 宫位分隔线（4 条过中心 + 8 条宫界简化：画 0/45/90…）
    for (let d = 0; d < 360; d += 45) {
      const a = tyPt(196, d), b = tyPt(62, d);
      svg += '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="#2a2e3d" stroke-width="1"/>';
    }
    // 外圈十二地支（r=176）
    for (let z = 0; z < 12; z++) {
      const dz = TY_DZ[z], p = tyPt(176, z * 30);
      svg += '<text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-size="15" fill="#c9cede">' + dz + '</text>';
    }
    // 次圈八卦+宫数（r=148 卦名 / r=128 州名）
    for (let n = 1; n <= 9; n++) {
      if (n === 5) continue;
      const g = gong(n), deg = degOfGong(n);
      const p1 = tyPt(148, deg), p2 = tyPt(128, deg);
      const hot = L.taiyi === n;
      svg += '<text x="' + p1[0] + '" y="' + (p1[1] + 5) + '" text-anchor="middle" font-size="13.5" fill="' + (hot ? '#e8b25a' : '#8b92a6') + '">' + TY_CN[n - 1] + (g && g.bagua ? g.bagua : '') + '</text>';
      if (g && g.zhou) svg += '<text x="' + p2[0] + '" y="' + (p2[1] + 4) + '" text-anchor="middle" font-size="9.5" fill="#5d6575">' + g.zhou + '</text>';
    }
    // 中圈核心神煞（r=106 主标 / r=92 副标，环带 62–116）——同宫扇形错开 20°（弧长 > 标签宽，防遮字）
    const byG = {};
    core.forEach((m) => { if (m.g) { (byG[m.g] = byG[m.g] || []).push(m); } });
    for (const gn of Object.keys(byG)) {
      const g = Number(gn), deg = degOfGong(g), list = byG[g];
      const n = list.length;
      list.forEach((m, k) => {
        const a = deg + (n > 1 ? (k - (n - 1) / 2) * 20 : 0);
        const p = tyPt(106, a), ps = tyPt(92, a);
        const hot = m.hot;
        const w = m.t.length * 9 + 8;
        svg += '<rect x="' + (p[0] - w / 2) + '" y="' + (p[1] - 8) + '" width="' + w + '" height="16" rx="8" fill="' + (hot ? 'rgba(232,178,90,0.16)' : 'rgba(26,30,43,0.92)') + '" stroke="' + (hot ? '#e8b25a' : '#3a3f52') + '" stroke-width="0.8"/>';
        svg += '<text x="' + p[0] + '" y="' + (p[1] + 3) + '" text-anchor="middle" font-size="9.5" font-weight="bold" fill="' + (hot ? '#e8b25a' : '#d0d6e0') + '">' + m.t + '</text>';
        if (m.sub) svg += '<text x="' + ps[0] + '" y="' + (ps[1] + 3) + '" text-anchor="middle" font-size="8.5" fill="#8b92a6">' + m.sub + '</text>';
      });
    }
    // 盘缘外侧大小将（r=208，对应宫位角，同宫扇形错开）
    const byG2 = {};
    gen.forEach((m) => { if (m.g) { (byG2[m.g] = byG2[m.g] || []).push(m); } });
    for (const gn of Object.keys(byG2)) {
      const g = Number(gn), deg = degOfGong(g), list = byG2[g];
      const n = list.length;
      list.forEach((m, k) => {
        const a = deg + (n > 1 ? (k - (n - 1) / 2) * 12 : 0);
        const p = tyPt(208, a);
        const w = m.t.length * 10 + 8;
        svg += '<rect x="' + (p[0] - w / 2) + '" y="' + (p[1] - 9) + '" width="' + w + '" height="18" rx="9" fill="rgba(26,30,43,0.92)" stroke="#3a3f52" stroke-width="0.8"/>';
        svg += '<text x="' + p[0] + '" y="' + (p[1] + 3.5) + '" text-anchor="middle" font-size="10.5" font-weight="bold" fill="#d0d6e0">' + m.t + '</text>';
      });
    }
    // 中心：五福 + 局
    svg += '<text x="215" y="209" text-anchor="middle" font-size="15" fill="#e8b25a">五福</text>';
    svg += '<text x="215" y="229" text-anchor="middle" font-size="11.5" fill="#c9cede">' + c.yuan + '元 · ' + (dun === 'yang' ? '阳' : '阴') + '遁' + c.ju + '局</text>';
    svg += '</svg>';
    return svg;
  }

  function tyInit() {
    const TY = D && D.taiyi;
    if (!TY) return;
    const now = new Date();
    $('ty-year').value = String(now.getFullYear());
    $('ty-month').value = String(now.getMonth() + 1);
    $('ty-day').value = String(now.getDate());
    $('ty-hour').value = TY_HOURS[Math.floor((now.getHours() + 1) / 2) % 12];
    $('ty-year').addEventListener('change', tyDunAuto);
    $('ty-mode').addEventListener('change', () => { tyDunAuto(); tyRiInputs(); });
    $('ty-dun').addEventListener('change', () => {});
    $('ty-go').addEventListener('click', tyGo);
    $('ty-jinjie-go').addEventListener('click', tyJinjie);
    // 身份 → 用式联动（原文"王者岁计，卿士月计，师尹日计，时通上下"），改后自动重排
    $('ty-role').addEventListener('change', () => {
      const map = { 王者: 'sui', 卿士: 'yue', 师尹: 'ri', 庶士: 'shi' };
      const m = map[$('ty-role').value];
      if (m) $('ty-mode').value = m;
      tyRiInputs();
      if ($('ty-result').innerHTML.trim()) tyRender();
    });
    $('ty-result').innerHTML = '<div class="muted">已加载太乙神数：立成表 ' +
      Object.keys(TY.licheng_yang).length + '+'
      + Object.keys(TY.licheng_yin).length + ' 局、判语 ' +
      Object.keys(TY.panju_yang).length + '+' + Object.keys(TY.panju_yin).length +
      ' 局、十六神 15、九宫分野、算和分类、陈兵向背、格局 11、进阶体系。输入公元年排盘。</div>';
    tyDunAuto();
    tyRiInputs();
  }

  // 日计/时计模式显示公历月/日；时计另显示时辰
  const TY_HOURS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  function tyHourZi() {
    const i = TY_HOURS.indexOf($('ty-hour').value);
    if (i >= 0) return i;
    return Math.floor((new Date().getHours() + 1) / 2) % 12;
  }
  function tyRiInputs() {
    const ri = $('ty-mode').value === 'ri';
    const shi = $('ty-mode').value === 'shi';
    $('ty-ri-label').style.display = (ri || shi) ? '' : 'none';
    $('ty-month').style.display = (ri || shi) ? '' : 'none';
    $('ty-day').style.display = (ri || shi) ? '' : 'none';
    $('ty-hour-label').style.display = shi ? '' : 'none';
    $('ty-hour').style.display = shi ? '' : 'none';
  }

  // 节气判定阴阳遁（冬至→夏至=阳遁，夏至→冬至=阴遁，时局原文："冬至后用阳局，夏至后用阴局"）
  function tyDunAuto() {
    const sel = $('ty-dun');
    if (sel.value !== 'auto') return;
    const now = new Date();
    const md = (now.getMonth() + 1) * 100 + now.getDate();
    const dongzhi = new Date(now.getFullYear(), 11, 22);
    const xiazhi = new Date(now.getFullYear(), 5, 21);
    const dzMd = 1222, xzMd = 621;
    sel.setAttribute('data-auto', (md >= xzMd && md < dzMd) ? 'yin' : 'yang');
  }

  function tyCalc(year, mode) {
    const TY = D.taiyi;
    const anchor = TY.meta.anchor;
    let jinian = anchor.jinian + (year - anchor.year);
    if (mode === 'yue') jinian += 2; // 月计起算加天正地正二算
    const y360 = jinian % 360 || 360;
    const yuanSeq = Math.floor((y360 - 1) / 72) + 1;
    const ju = jinian % 72 || 72;
    return { jinian, yuanSeq, yuan: TY.meta.yuan[yuanSeq - 1], ju: String(ju) };
  }

  // 统一取局：日计走纪法求日（元与岁计同），岁/月/时走积年法
  function tyCalcAny(year, mode) {
    const c = tyCalc(year, mode === 'ri' ? 'sui' : mode);
    if (mode === 'ri') {
      const month = parseInt($('ty-month').value, 10) || new Date().getMonth() + 1;
      const day = parseInt($('ty-day').value, 10) || new Date().getDate();
      c.ri = tyRiju(year, month, day);
      c.ju = c.ri.ju;
    }
    return c;
  }

  function tyDunNow() {
    const sel = $('ty-dun');
    if (sel.value === 'auto') return sel.getAttribute('data-auto') || 'yin';
    return sel.value;
  }

  // 算数分类（表C）
  function tySuanClass(n, suan) {
    const TY = D.taiyi;
    const out = [];
    const cls = [];
    Object.entries(TY.suanhe).forEach(([k, arr]) => {
      if (Array.isArray(arr) && arr.includes(n)) cls.push(k);
    });
    cls.forEach((k) => { if (TY.suanhe_text[k]) out.push(k + '：' + TY.suanhe_text[k]); });
    // 长/短
    out.push((n >= 11 ? '长（≥11，多利深入）' : n <= 9 ? '短（≤9，利浅入）' : '中（10）') + (n >= 11 ? '——长为胜' : n <= 9 ? '——短为负' : ''));
    // 无天/无地/无人
    if (n < 10) out.push('无天：' + TY.suanhe_text['无天']);
    if (!String(n).includes('5')) out.push('无地：' + TY.suanhe_text['无地']);
    if ([10, 20, 30, 40].includes(n)) out.push('无人：' + TY.suanhe_text['无人']);
    // 单阳/单阴/孤阳/孤阴
    const g = n % 10;
    if ([1, 3, 7, 9].includes(g)) out.push('单阳（个位' + g + '）：' + TY.suanhe_text['单阳']);
    if ([2, 4, 6, 8].includes(g)) out.push('单阴（个位' + g + '）：' + TY.suanhe_text['单阴']);
    if ([10, 30].includes(n)) out.push('孤阳：' + TY.suanhe_text['孤阳']);
    if ([20, 40].includes(n)) out.push('孤阴：' + TY.suanhe_text['孤阴']);
    // 五音
    const wu = { 1: '宫（占在君）', 2: '宫（占在君）', 3: '征（占宗庙）', 4: '征（占宗庙）', 5: '羽（占后妃）', 7: '商（占子孙）', 9: '角（占疾病）', 10: '角（占疾病）' };
    if (wu[n]) out.push('五音：' + wu[n]);
    return out;
  }

  function tyDajiang(suan) {
    if ([5, 15, 25, 35].includes(suan)) return { du: '杜塞', note: '八门杜塞，不利兴师，宜深沟高垒固守' };
    const dajiang = suan % 10;
    const canjiang = (dajiang * 3) % 10 || 10 % 10;
    return { du: '大将' + TY_CN[dajiang - 1] + '宫 / 参将' + TY_CN[(dajiang * 3 % 10 || 10) - 1] + '宫', dajiang, canjiang: (dajiang * 3) % 10 || 10 };
  }

  function tyRender() {
    const TY = D.taiyi;
    const year = parseInt($('ty-year').value, 10);
    if (!year || year < 1) { $('ty-result').innerHTML = '<div class="muted" style="color:#d17a7a;">请输入有效公元年。</div>'; return; }
    const mode = $('ty-mode').value;
    tyRiInputs(); // 同步日计/时计输入显示（无论 mode 如何变更）
    const month = parseInt($('ty-month').value, 10) || new Date().getMonth() + 1;
    const day = parseInt($('ty-day').value, 10) || new Date().getDate();
    const hourZi = tyHourZi();
    const c = tyCalcAny(year, mode);
    const dun = tyDunNow();
    const li = dun === 'yang' ? TY.licheng_yang : TY.licheng_yin;
    const pj = dun === 'yang' ? TY.panju_yang : TY.panju_yin;
    const ju = c.ju;
    const L = li[ju] || {};
    const P = pj[ju] || {};
    const modeText = mode === 'sui' ? '岁计' : mode === 'yue' ? '月计（积年+2）' : mode === 'ri' ? '日计·纪法求日' : '时计（' + TY_HOURS[hourZi] + '时）';
    let h = '<div class="card">';
    h += '<h3>' + year + ' 年 ' + month + ' 月 ' + day + ' 日 · ' + modeText + ' · ' + (dun === 'yang' ? '阳遁' : '阴遁') + '</h3>';
    h += '<div class="row" style="flex-wrap:wrap;gap:8px;">';
    h += tag(dun === 'yang' ? 'ban' : 'muted', c.yuan + '元 · 第 ' + c.ju + ' 局');
    if (c.ri) {
      h += tag('muted', '纪法（日干支）' + c.ri.gz);
      h += tag('muted', '祖数 ' + c.ri.zushu + '（213 + ' + c.ri.days + ' 日）');
    } else {
      h += tag('muted', '积年 ' + c.jinian + ' 算');
      h += tag('muted', mode === 'yue' ? '月计加天正地正二算' : (mode === 'shi' ? '时计不加二算' : '岁计'));
    }
    h += '</div>';
    // 四柱 · 空亡 · 节气
    const sz = tySizhu(year, month, day, hourZi);
    const jq = tyJieqiRange(month * 100 + day);
    h += '<div class="steps" style="margin-top:6px;">四柱：' + sz.year + '年 · ' + sz.month + '月 · ' + sz.day + '日 · ' + sz.hour + '时　空亡：年' + sz.kongY + ' 月' + sz.kongM + ' 日' + sz.kongD + ' 时' + sz.kongH + '　节气：' + jq.from + ' ~ ' + jq.to + '（近似日）</div>';
    h += '<div class="steps" style="margin-top:8px;">排盘（' + (dun === 'yang' ? '金镜式经阳遁立成表' : '金镜式经阴遁立成表') + ' 第' + ju + '局）：';
    if (L.taiyi) {
      const jg = TY.jiugong[TY_CN[L.taiyi - 1]];
      h += '<b>太乙在 ' + TY_CN[L.taiyi - 1] + '宫（' + (jg ? jg.bagua + '·' + jg.zhou : '') + '）</b>';
    }
    if (L.tianmu) h += '，天目（文昌）' + esc(L.tianmu);
    if (L.zhusuan) h += '，主算 ' + esc(String(L.zhusuan)) + (L.zhu_note ? '（' + esc(L.zhu_note) + '）' : '');
    if (L.kemu) h += '，始击（客目）' + esc(L.kemu);
    if (L.kesuan) h += '，客算 ' + esc(String(L.kesuan)) + (L.ke_note ? '（' + esc(L.ke_note) + '）' : '');
    if (L.jishen) h += '，计神 ' + esc(L.jishen);
    h += '。</div>';
    // 圆盘盘面（九宫八卦十二支 + 神煞布位）
    h += tyPanHtml(L, c, dun, TY);
    // 异文标注
    const yw = (dun === 'yang' ? TY.yiwend_yang : TY.yiwend_yin) || {};
    if (yw[ju]) {
      h += '<div class="muted" style="color:#d9a05e;margin-top:4px;">注：太乙秘书本局与金镜式经立成表排盘有异（' + esc(yw[ju].join('、')) + '），排盘以立成表为准，判语照录秘书本局原文。</div>';
    }
    h += '</div>';
    // 主客算与胜负
    let zh = '', kh = '';
    if (L.zhusuan) zh = tySuanClass(L.zhusuan, '主').map((s) => '<div class="step-line">主算 ' + L.zhusuan + '：' + s + '</div>').join('');
    if (L.kesuan) kh = tySuanClass(L.kesuan, '客').map((s) => '<div class="step-line">客算 ' + L.kesuan + '：' + s + '</div>').join('');
    if (zh || kh) {
      h += '<div class="item-block"><span class="k">主客算分类（表C）</span><span>' + zh + kh + '</span></div>';
    }
    // 大将参将
    const zd = L.zhusuan ? tyDajiang(L.zhusuan) : null;
    const kd = L.kesuan ? tyDajiang(L.kesuan) : null;
    h += '<div class="item-block"><span class="k">主客大小将</span><span>';
    h += zd ? '主：' + esc(zd.du) + (zd.note ? '（' + zd.note + '）' : '') : '主：原文未载';
    h += '　';
    h += kd ? '客：' + esc(kd.du) + (kd.note ? '（' + kd.note + '）' : '') : '客：原文未载';
    h += '</span></div>';
    // 陈兵向背（表D，按算数查）
    if (L.zhusuan && TY.chengbing[L.zhusuan]) {
      const cb = TY.chengbing[L.zhusuan];
      h += '<div class="item-block"><span class="k">陈兵向背（主算 ' + L.zhusuan + '）</span><span>出兵宜' + cb.chu + '，战利向' + cb.zhan + '；' + cb.zhen + '，举' + cb.qi + (cb.bei ? '。' + cb.bei : '') + '</span></div>';
    }
    if (L.kesuan && TY.chengbing[L.kesuan]) {
      const cb = TY.chengbing[L.kesuan];
      h += '<div class="item-block"><span class="k">陈兵向背（客算 ' + L.kesuan + '）</span><span>出兵宜' + cb.chu + '，战利向' + cb.zhan + '；' + cb.zhen + '，举' + cb.qi + (cb.bei ? '。' + cb.bei : '') + '</span></div>';
    }
    // 天外地
    if (L.taiyi) {
      const inGong = [1, 8, 3, 4].includes(L.taiyi);
      h += '<div class="item-block"><span class="k">天外地</span><span>太乙在 ' + TY_CN[L.taiyi - 1] + '宫，为' + (inGong ? '地内宫，助主人' : '天外宫，助于客') + '（太乙在 一·八·三·四 宫者地内助主；九·二·七·六 宫者天外助客）。</span></div>';
    }
    // 格局
    if (P.raw) {
      const gk = [];
      ['掩', '击', '迫', '囚', '关', '格', '对', '挟'].forEach((w) => {
        if (P.raw.includes(w) && TY.geju[w.replace('挟', '提挟')]) {
          const k = w === '挟' ? '提挟' : w;
          gk.push('<div class="step-line"><b>' + k + '</b>：' + TY.geju[k].def + ' ' + TY.geju[k].duan + '</div>');
        }
      });
      if (gk.length) h += '<div class="item-block"><span class="k">格局（11 种，检测自本局原文）</span><span>' + gk.join('') + '</span></div>';
    }
    // 秘书判语全文
    if (P.duan) {
      h += '<div class="item-block"><span class="k">太乙秘书 第' + ju + '局 判语（原文）</span><span>' + esc(P.raw) + '</span></div>';
    } else {
      h += '<div class="item-block"><span class="k">太乙秘书 第' + ju + '局 判语</span><span class="muted" style="color:#d9a05e;">太乙秘书原缺第六十局，本局判语未载；排盘要素已由金镜式经立成表补齐。</span></div>';
    }
    // 分野
    if (L.taiyi) {
      const jg = TY.jiugong[TY_CN[L.taiyi - 1]];
      if (jg) h += '<div class="item-block"><span class="k">太乙所临分野（' + TY_CN[L.taiyi - 1] + '宫）</span><span>' + jg.zhou + '（' + jg.ganzhi + '）——"太乙所临之国，有道则昌，无道则殃"。</span></div>';
    }
    h += '<div class="src-line">来源：排盘=金镜式经立成表；判语=太乙秘书本局原文（照录不改）；分类=秘书算和表；原文未载处如实标注。</div>';
    $('ty-result').innerHTML = h;
  }

  function tyGo() { tyRender(); }

  // 进阶体系查表
  function tyJinjie() {
    const TY = D.taiyi;
    const role = $('ty-role').value;
    const roleText = { 王者: '王者→岁计，断国运', 卿士: '卿士→月计，断政务', 师尹: '师尹→日计，断职事', 庶士: '庶士→时计，断时下事' }[role] || '';
    const sys = Array.from(document.querySelectorAll('.ty-sys:checked')).map((c) => c.value);
    if (!sys.length) { $('ty-jinjie').innerHTML = '<div class="muted" style="color:#d17a7a;">请先勾选要查看的体系。</div>'; return; }
    let h = '<div class="card"><h3>进阶体系 · ' + role + '（' + roleText + '）</h3>';
    sys.forEach((s) => {
      if (s === '三基') {
        ['君基', '臣基', '民基'].forEach((k) => {
          const j = TY.jinjie[k];
          h += '<div class="item-block"><span class="k">' + k + '（起' + j.qi + '，' + j.zhouqi_note + '）</span><span>' + j.duan + '</span></div>';
        });
      } else if (s === '五福') {
        const j = TY.jinjie['五福'];
        h += '<div class="item-block"><span class="k">五福（' + j.zhouqi_note + '）</span><span>' + j.wu.join('；') + '。' + j.duan + '</span></div>';
      } else if (s === '大游') {
        const j = TY.jinjie['大游'];
        h += '<div class="item-block"><span class="k">大游太乙（' + j.zhouqi_note + '）</span><span>' + j.duan_yang + '；' + j.duan_yin + '</span></div>';
      } else if (s === '四神') {
        ['四神', '天乙', '地乙', '直符'].forEach((k) => {
          const j = TY.jinjie[k];
          h += '<div class="item-block"><span class="k">' + k + '（' + j.note + '）</span><span>' + j.duan + '</span></div>';
        });
      } else if (s === '十精') {
        TY.shijing.forEach((j) => {
          h += '<div class="step-line"><b>' + j.ming + '</b>：小周 ' + j.xiaozhou + '，命起' + j.qi + '，' + j.xing + '。合宫断晴雨风晕（原文）。</div>';
        });
      } else if (s === '阳九百六') {
        Object.entries(TY.yangjiu_bailiu).forEach(([k, j]) => {
          h += '<div class="item-block"><span class="k">' + k + '（' + j.zhouqi + '年为一元，' + j.move + '，命起' + j.qi + '，' + j.xing + '）</span><span>' + j.duan + '</span></div>';
        });
      } else if (s === '敌国') {
        Object.entries(TY.diguo).forEach(([k, v]) => {
          h += '<div class="item-block"><span class="k">敌国占·' + k + '</span><span>' + v + '</span></div>';
        });
      } else if (s === '二十八舍') {
        // 以当前盘始击（kemu）测其地支 → 宿 → 断语
        const ju = tyCalcAny(parseInt($('ty-year').value, 10) || new Date().getFullYear(), $('ty-mode').value).ju;
        const dun = tyDunNow();
        const li = dun === 'yang' ? TY.licheng_yang : TY.licheng_yin;
        const L = li[ju] || {};
        h += '<div class="item-block"><span class="k">二十八舍（以始击所临断，表J）</span><span>';
        if (L.kemu) {
          const dz = TY.shen_dizhi[L.kemu];
          const su = dz ? (TY.ershiba_zu[dz] || []) : [];
          if (su.length) {
            h += '本局始击' + esc(L.kemu) + '临' + dz + '，所值宿：' + su.map((x) => x + '（' + TY.ershiba[x] + '）').join('、');
          } else h += '始击' + esc(L.kemu) + '无对应地支（' + dz + '），宿位见原文二十八宿全表。';
        } else {
          h += '本局始击未载；二十八舍全表（按宿）：' + Object.entries(TY.ershiba).map(([x, v]) => x + '=' + v).join('；');
        }
        h += '</span></div>';
      } else if (s === '日常') {
        Object.entries(TY.richang).forEach(([k, v]) => {
          h += '<div class="item-block"><span class="k">日常占·' + k + '</span><span>' + v + '</span></div>';
        });
      } else if (s === '九州') {
        h += '<div class="item-block"><span class="k">九州分野（表B）</span><span>' +
          Object.entries(TY.jiugong).filter(([k]) => TY_CN.includes(k)).map(([k, v]) => k + '宫' + v.zhou + '(' + v.ganzhi + ')').join('　') + '。阳宫八三四九，阴宫二七六一。</span></div>';
      }
    });
    h += '<div class="src-line">进阶体系规则全部取自原文（金镜式经/太乙秘书）；周期数值为原文所载，宫位排法等原文未给全算法的部分如实保留原文表述，不自行补算。唯一活口"有道/无道/善恶"须临机判断，本表仅列后果句。</div>';
    h += '</div>';
    $('ty-jinjie').innerHTML = h;
  }

  // ================= 紫微斗数·十四主星（ziwei.json） =================
  const ZW_GONGS = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];
  // 问事类型 → 对应宫（参照玄鉴 DOMAIN_PALACE：事业→官禄、财运→财帛、婚姻→夫妻、子女→子女、健康→疾厄、出行→迁移、学业→官禄、家庭→田宅）
  const ZW_ASK_MAP = {
    'career': 8, 'money': 4, 'marry': 2, 'child': 3,
    'health': 5, 'travel': 6, 'study': 8, 'family': 9,
  };
  // 方盘格子 → 命宫偏移（经典 3×4 盘：左上命宫，顺时针逆布十二宫）
  const ZW_ROW_OFF = [[0, 11, 10, 9], [1, 5, 6, 8], [2, 3, 4, 7]];
  const ZW_ROW_NAMES = [
    ['命宫', '父母', '福德', '田宅'],
    ['兄弟', '疾厄', '迁移', '官禄'],
    ['夫妻', '子女', '财帛', '仆役'],
  ];
  function zwIdx(dz) { return TY_DZ.indexOf(dz); }
  function zwDz(i) { return TY_DZ[((i % 12) + 12) % 12]; }
  // 安命身：寅起正月顺数至生月，月宫起子时逆数安命、顺数安身；闰月通行口径：上半月（≤15）算本月、下半月算下月（原为整月按次月）
  function zwMingShen(lunarMonth, zi, leap, lunarDay) {
    const m = leap ? (lunarDay != null && lunarDay <= 15 ? lunarMonth : lunarMonth + 1) : lunarMonth;
    const yueGong = (2 + (m - 1)) % 12;           // 寅=2 起正月
    return { ming: ((yueGong - zi) % 12 + 12) % 12, shen: (yueGong + zi) % 12 };
  }
  // 命宫天干（五虎遁：年干→寅宫干，顺布十二宫）
  function zwGongGan(yearGan, gongIdx) {
    const yinGan = ((yearGan % 5) * 2 + 2) % 10;
    return ((yinGan + (gongIdx - 2)) % 10 + 10) % 10;
  }
  // 命宫干支纳音 → 局数（纳音名末字即五行：海中金→金、长流水→水…）
  function zwJu(mgGanzhi) {
    const wx = D.ziwei.nayin[mgGanzhi];
    if (!wx) return null;
    const w = wx.slice(-1);
    return { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 }[w] || null;
  }
  // 紫微定位（商数法；加数奇退偶进，不含本位；宫序寅1…丑12）
  function zwZiwei(ju, day) {
    let q = Math.floor(day / ju), r = day % ju, pos;
    if (r === 0) { pos = q; }
    else {
      const add = ju - r;
      q = Math.floor((day + add) / ju);
      pos = add % 2 === 1 ? q - add : q + add;
    }
    return ((pos + 1) % 12 + 12) % 12;             // 1-based 寅1→0-based 寅2
  }
  // 天府（1-based 子1…亥12；x<6→x+y=6，x≥6→x+y=18；寅申同宫）
  function zwTianfu(ziweiIdx) {
    const x = ziweiIdx + 1;
    const y = x < 6 ? 6 - x : 18 - x;
    return ((y - 1) % 12 + 12) % 12;
  }
  // 十四主星
  function zwZhuyao(zwIdx0) {
    const A = zwIdx0, B = zwTianfu(zwIdx0);
    const map = {};
    [['紫微', A], ['天机', A - 1], ['太阳', A - 3], ['武曲', A - 4], ['天同', A - 5], ['廉贞', A - 8],
     ['天府', B], ['太阴', B + 1], ['贪狼', B + 2], ['巨门', B + 3], ['天相', B + 4], ['天梁', B + 5], ['七杀', B + 6], ['破军', B + 10]]
      .forEach(([s, i]) => { map[s] = ((i % 12) + 12) % 12; });
    return map;
  }
  // 辅星（p = {yGan,yZhi,month,day,zi,ming}）
  function zwFuyao(p) {
    const out = {};
    const add = (s, i) => { out[s] = ((i % 12) + 12) % 12; };
    add('文昌', 10 - p.zi); add('文曲', 4 + p.zi);                     // 戌起子逆 / 辰起子顺
    add('左辅', 4 + p.month - 1); add('右弼', 10 - (p.month - 1));      // 辰起月顺 / 戌起月逆
    const qk = D.ziwei.qkui[TY_TG[p.yGan]] || [];
    if (qk[0]) add('天魁', zwIdx(qk[0]));
    if (qk[1]) add('天钺', zwIdx(qk[1]));
    const lu = D.ziwei.fulu[TY_TG[p.yGan]];
    if (lu) { add('禄存', zwIdx(lu)); add('擎羊', zwIdx(lu) + 1); add('陀罗', zwIdx(lu) - 1); }
    const tm = D.ziwei.tianma[TY_DZ[p.yZhi]];
    if (tm) add('天马', zwIdx(tm));
    const hl = D.ziwei.huoling[TY_DZ[p.yZhi]] || [];
    if (hl[0]) add('火星', zwIdx(hl[0]) + p.zi);
    if (hl[1]) add('铃星', zwIdx(hl[1]) + p.zi);
    add('天空', 11 - p.zi); add('地劫', 11 + p.zi);                    // 亥起子逆/顺
    add('天刑', 9 + p.month - 1); add('天姚', 1 + p.month - 1);         // 酉起月顺 / 丑起月顺
    add('天哭', 6 - p.yZhi); add('天虚', 6 + p.yZhi);                   // 午起子年逆/顺
    add('龙池', 4 + p.yZhi); add('凤阁', 10 - p.yZhi);                  // 辰起子年顺 / 戌起子年逆
    add('台辅', 6 + p.zi); add('封诰', 2 + p.zi);                       // 午起子时顺 / 寅起子时顺
    const zuofu = (4 + p.month - 1) % 12, youbi = (10 - (p.month - 1) + 12) % 12;
    add('三台', zuofu + p.day - 1); add('八座', youbi - (p.day - 1));   // 辅起初一顺 / 弼起初一逆
    const hongluan = (3 - p.yZhi + 12) % 12;
    add('红鸾', hongluan); add('天喜', hongluan + 6);                   // 卯起子年逆
    add('天伤', p.ming - 7); add('天使', p.ming - 5);                   // 仆役宫 / 疾厄宫
    const jk = D.ziwei.jiekong[TY_TG[p.yGan]] || [];
    if (jk[0]) add('截空', zwIdx(jk[0]));
    if (jk[1]) add('旬空', zwIdx(jk[1]));
    // 长生十二神（局→长生宫，男顺女逆）
    const cs = D.ziwei.changsheng[{ 2: '水', 3: '木', 4: '金', 5: '土', 6: '火' }[p.ju]];
    if (cs) {
      const start = zwIdx(cs), dir = p.shun ? 1 : -1;
      const csp = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
      const csMap = {};
      csp.forEach((n, k) => { csMap[n] = ((start + dir * k) % 12 + 12) % 12; });
      out['长生十二神'] = csMap;
    }
    return out;
  }
  // 四化
  function zwSihua(yGan) { return D.ziwei.sihua[TY_TG[yGan]] || null; }
  // 倪师《天纪·紫微斗数》原话检索（现代注释层，非古籍；原话照录+出处时间戳，不做条件机判）
  function zwNihaiSearch(kw) {
    const ent = D.ziwei.nihai && D.ziwei.nihai.entries ? D.ziwei.nihai.entries : [];
    if (!ent.length) return '<div class="err">倪师语料未加载（ziwei_nihai.json）</div>';
    const q = (kw || '').trim();
    if (!q) return '<div class="muted">输入关键词（星曜/宫位/断语词）检索倪师《天纪·紫微斗数》原话 ' + ent.length + ' 条。现代注释层，非古籍；原话照录，仅展示不做机判。</div>';
    const hits = [];
    for (let i = 0; i < ent.length; i++) { if ((ent[i].quote || '').indexOf(q) >= 0) hits.push(ent[i]); }
    if (!hits.length) return '<div class="muted">未命中「' + esc(q) + '」。语料为课程原话全文，可换主题词再试。</div>';
    const tSec = (s) => { const p = (s || '').split(':'); return p.length === 3 ? (+p[0] * 3600 + +p[1] * 60 + +p[2]) : 0; };
    const shown = hits.slice(0, 50);
    const html = shown.map((e) => {
      const sec = tSec(e.t_hms);
      const link = e.bvid ? ' <a class="q" href="https://www.bilibili.com/video/' + esc(e.bvid) + (sec ? '?t=' + sec : '') + '" target="_blank" rel="noopener">B站回看 ' + esc(e.t_hms) + '</a>' : (' <span class="q">' + esc(e.t_hms || '') + '</span>');
      return '<div style="padding:3px 0;border-bottom:1px dashed var(--bd,#333);"><span class="q">[' + esc(e.h2 || '') + (e.h3 ? ' · ' + esc(e.h3) : '') + ']</span> ' + esc(e.quote) + link + '</div>';
    }).join('');
    return '<div class="muted">命中 ' + hits.length + ' 条（显示前 50）：</div>' + html + (hits.length > 50 ? '<div class="muted">…其余 ' + (hits.length - 50) + ' 条未显示</div>' : '');
  }
  // 紫微年支换年口径：正月初一（主流紫微软件） vs 立春（八字口径）；lunar 不可用时回退 tySizhu 立春近似
  function zwYearGz(lunar, rule) {
    if (lunar) {
      try {
        const gz = rule === 'lichun' ? lunar.getYearInGanZhiByLiChun() : lunar.getYearInGanZhi();
        if (gz && gz.length === 2) {
          const g = TY_TG.indexOf(gz[0]), z = TY_DZ.indexOf(gz[1]);
          if (g >= 0 && z >= 0) return { g, z, src: rule === 'lichun' ? '立春（八字口径）' : '正月初一（主流）' };
        }
      } catch (e) { /* fallback */ }
    }
    return null;
  }
  // 十四主星亮度（古籍双源：卷三集中段 + 卷二命宫逐宫句；cells 按下地支序 子=0…亥=11）
  function zwBrightness(star, idx) {
    const B = D.ziwei.brightness;
    if (!B || !B.stars || !B.stars[star]) return null;
    return B.stars[star].cells[idx] || null;
  }
  // 格局机判（46 格三层：required 成格 / bonus 加分 / breaking 破格；条件=通行判法+《全书》原文校正；命中≠吉凶定论）
  function zwPatterns(P) {
    const m = P.ming, z = P.zhuyao, f = P.fuyao, sh = P.sihua || {};
    const at = (s) => (z[s] !== undefined ? z[s] : f[s]);
    const mingHas = (s) => at(s) === m;
    const sf = [(m + 4) % 12, (m + 8) % 12, (m + 6) % 12];
    const inSF = (s) => { const i = at(s); return i !== undefined && (i === m || sf.indexOf(i) >= 0); };
    const prev = ((m - 1) % 12 + 12) % 12, next = ((m + 1) % 12 + 12) % 12;
    const jiaHas = (s) => at(s) === prev || at(s) === next;
    const dui = (m + 6) % 12;
    const hua = (k) => sh[k] || null;
    const starHua = (s, k) => sh[k] === s;
    const shaHard = ['擎羊', '陀罗', '火星', '铃星'];
    const shaKong = ['天空', '地劫'];
    const shaInM = (arr) => arr.some((s) => mingHas(s));
    const shaInS = (arr) => arr.some((s) => inSF(s));
    const shaCntS = (arr) => arr.filter((s) => inSF(s)).length;
    const sfStars = () => { const r = []; for (const k in z) if (inSF(k)) r.push(k); for (const k in f) if (inSF(k)) r.push(k); return r; };
    const bright = (s) => { const i = at(s); return i === undefined ? null : zwBrightness(s, i); };
    const brightJ = (s) => { const b = bright(s); return b ? b.j : null; };
    const isBright = (s) => { const j = brightJ(s); return j === '庙' || j === '旺'; };
    const isDim = (s) => { const j = brightJ(s); return j === '陷' || j === '平' || j === '不得地'; };
    const hits = [];
    const add = (id, req, bonus, breaking) => { hits.push({ id, req: req || [], bonus: bonus || [], breaking: breaking || [] }); };

    // ── 上格 ──
    // 君臣庆会：紫微入命+左右弼同会（古籍：紫微左右同守命是也）
    if (mingHas('紫微') && inSF('左辅') && inSF('右弼')) {
      const b = [], k = [];
      if (inSF('天相') || inSF('武曲') || inSF('太阴')) b.push('再会相/武/阴（原文「更会相武阴妙上」）');
      if (shaInM(shaKong)) k.push('命宫坐空劫');
      add('junchen', ['紫微入命', '左辅右弼同会三方'], b, k);
    }
    // 紫府同宫：寅申
    if (z['紫微'] !== undefined && z['紫微'] === z['天府']) {
      const inM = mingHas('紫微');
      const b = [], k = [];
      if (inSF('左辅') && inSF('右弼')) b.push('左辅右弼同会');
      if (inSF('文昌') || inSF('文曲')) b.push('再会昌曲');
      if (shaInM(shaKong)) k.push('紫府宫坐空劫');
      if (shaCntS(shaHard) >= 2) k.push('三方煞星过多');
      add('zifu', [inM ? '紫微天府同入命宫' : '紫微天府同宫（不在命宫，会照减力）'], b, k);
    }
    // 府相朝垣：天府天相分守三方且不同宫
    if (z['天府'] !== undefined && z['天相'] !== undefined && inSF('天府') && inSF('天相') && z['天府'] !== z['天相'] && !(z['天府'] === m && z['天相'] === m)) {
      const b = [], k = [];
      if (mingHas('禄存') || starHua(hua('禄'), '禄')) b.push('命宫见禄');
      if (inSF('左辅')) b.push('再会左辅');
      if (shaInM(shaHard)) k.push('命宫坐煞星');
      if (shaCntS(shaHard) >= 3) k.push('三方四正煞星过多');
      add('fuxiang', ['天府坐命三方', '天相坐命三方', '两星不同宫'], b, k);
    }
    // 阳梁昌禄
    if (inSF('太阳') && inSF('天梁') && inSF('文昌') && inSF('禄存')) {
      const b = [], k = [];
      if (isBright('太阳')) b.push('太阳庙旺');
      if (isBright('天梁')) b.push('天梁庙旺');
      if (hua('科') && inSF(hua('科'))) b.push('再会化科');
      if (isDim('太阳')) k.push('太阳落陷（阳梁失辉）');
      if (shaCntS(shaHard) >= 2) k.push('三方煞重');
      add('yangliang', ['太阳会命三方', '天梁会命三方', '文昌会命三方', '禄存会命三方'], b, k);
    }
    // 火贪格 / 铃贪格：贪狼+火星/铃星同宫或三合（+4/+8/+6）
    if (z['贪狼'] !== undefined) {
      for (const sn of ['火星', '铃星']) {
        const sp = at(sn);
        if (sp === undefined) continue;
        const sameOrTri = z['贪狼'] === sp || ((z['贪狼'] + 4) % 12) === sp || ((z['贪狼'] + 8) % 12) === sp || ((z['贪狼'] + 6) % 12) === sp;
        if (!sameOrTri || !inSF('贪狼')) continue;
        const b = [], k = [];
        if (isBright('贪狼')) b.push('贪狼庙旺');
        if (starHua('贪狼', '禄') || starHua('贪狼', '权')) b.push('贪狼化禄/化权');
        if (at('擎羊') === z['贪狼'] || at('陀罗') === z['贪狼']) k.push('贪狼宫又见羊陀（破横发之力）');
        if (at('天空') === z['贪狼'] || at('地劫') === z['贪狼']) k.push('贪狼遇空劫（财来财去）');
        add(sn === '火星' ? 'huotan' : 'lingtan', ['贪狼' + (z['贪狼'] === sp ? '同宫' : '会照') + sn, '贪狼会照命宫三方'], b, k);
      }
    }
    // 武贪格：武曲贪狼同宫（丑未）或对照
    if (z['武曲'] !== undefined && z['贪狼'] !== undefined && (z['武曲'] === z['贪狼'] || ((z['武曲'] + 6) % 12) === z['贪狼']) && (inSF('武曲') || inSF('贪狼'))) {
      const b = [], k = [];
      if (inSF('火星') || inSF('铃星')) b.push('再遇火星/铃星（火贪/铃贪叠加）');
      if (starHua('武曲', '禄')) b.push('武曲化禄');
      if (at('擎羊') === z['武曲'] || at('陀罗') === z['武曲']) k.push('武贪宫见羊陀');
      if (at('天空') === z['武曲'] || at('地劫') === z['武曲']) k.push('武贪宫遇空劫');
      add('wutan', [z['武曲'] === z['贪狼'] ? '武曲贪狼同宫（丑/未）' : '武曲贪狼对宫拱照', '会照命宫三方'], b, k);
    }
    // 杀破狼：七杀破军贪狼三星齐三方
    {
      const has = ['七杀', '破军', '贪狼'].filter((s) => inSF(s));
      if (has.length === 3) {
        const b = [], k = [];
        if (hua('禄') && inSF(hua('禄'))) b.push('三方有化禄');
        if (hua('权') && inSF(hua('权'))) b.push('三方有化权');
        if (inSF('左辅') && inSF('右弼')) b.push('辅弼同会（变动中得贵人）');
        if (shaCntS(shaHard) >= 3) k.push('煞星过重（动而无成）');
        if (shaInM(shaKong)) k.push('命坐空劫（动得辛苦）');
        add('shapolang', ['七杀、破军、贪狼三星齐入命宫三方四正'], b, k);
      }
    }
    // 机月同梁：四星齐三方
    {
      const has = ['天机', '太阴', '天同', '天梁'].filter((s) => inSF(s));
      if (has.length === 4) {
        const b = [], k = [];
        if (inSF('文昌') || inSF('文曲')) b.push('再会昌曲');
        if (hua('科') && inSF(hua('科'))) b.push('再会化科');
        if (shaCntS(shaHard) >= 3) k.push('煞星过多（机月同梁忌煞）');
        if (shaInM(shaHard)) k.push('命宫坐煞');
        add('jiyue', ['天机、太阴、天同、天梁四星齐入命宫三方四正'], b, k);
      }
    }

    // ── 中格 ──
    // 廉贞天相：同宫
    if (z['廉贞'] !== undefined && z['廉贞'] === z['天相']) {
      const inM = mingHas('廉贞');
      const b = [], k = [];
      if (mingHas('禄存') || starHua('廉贞', '禄')) b.push('见禄存或廉贞化禄');
      if (inSF('左辅')) b.push('左辅会照');
      if (at('擎羊') === z['廉贞']) k.push('廉相宫坐擎羊（廉杀羊倾向）');
      if (starHua('廉贞', '忌')) k.push('廉贞化忌');
      add('lianxiang', ['廉贞天相同宫'], b, k);
    }
    // 武曲七杀：同宫
    if (z['武曲'] !== undefined && z['武曲'] === z['七杀']) {
      const inM = mingHas('武曲');
      const b = [], k = [];
      if (starHua('武曲', '权')) b.push('武曲化权');
      if (starHua('武曲', '禄')) b.push('武曲化禄');
      if (starHua('武曲', '忌')) k.push('武曲化忌（财劫之兆）');
      if (at('擎羊') === z['武曲'] || at('陀罗') === z['武曲'] || at('火星') === z['武曲'] || at('铃星') === z['武曲']) k.push('武杀宫煞星过多');
      add('wuqisha', ['武曲七杀同宫'], b, k);
    }
    // 天同天梁：同宫
    if (z['天同'] !== undefined && z['天同'] === z['天梁']) {
      const b = [], k = [];
      if (inSF('文昌')) b.push('文昌会照');
      if (starHua('天同', '禄')) b.push('天同化禄');
      if (at('擎羊') === z['天同'] || at('陀罗') === z['天同'] || at('火星') === z['天同'] || at('铃星') === z['天同']) k.push('煞星同坐');
      add('tongliang', ['天同天梁同宫'], b, k);
    }
    // 日月同宫：丑未
    if (z['太阳'] !== undefined && z['太阳'] === z['太阴'] && (z['太阳'] === 1 || z['太阳'] === 7)) {
      const inM = mingHas('太阳');
      const b = [], k = [];
      if (z['太阳'] === 7) b.push('未宫日月同辉（古书云未宫日月双美）');
      if (inSF('文昌') && inSF('文曲')) b.push('昌曲会照');
      if (at('擎羊') === z['太阳'] || at('陀罗') === z['太阳'] || at('火星') === z['太阳'] || at('铃星') === z['太阳']) k.push('日月宫煞星同坐');
      add('riyue', ['太阳太阴同入' + TY_DZ[z['太阳']] + '宫'], b, k);
    }
    // 日月夹命
    {
      const pS = (at('太阳') === prev), pM = (at('太阴') === prev), nS = (at('太阳') === next), nM = (at('太阴') === next);
      if ((pS && nM) || (pM && nS)) {
        const b = [], k = [];
        if (isBright('太阳')) b.push('太阳庙旺');
        if (isBright('太阴')) b.push('太阴庙旺');
        if (isDim('太阳') || isDim('太阴')) k.push('日月落陷（夹命无光）');
        add('riyuejia', ['太阳太阴分居命宫前后两宫'], b, k);
      }
    }
    // 巨日同宫：寅申
    if (z['巨门'] !== undefined && z['巨门'] === z['太阳'] && (z['巨门'] === 2 || z['巨门'] === 8)) {
      const inM = mingHas('巨门');
      const b = [], k = [];
      if (z['巨门'] === 2) b.push('寅宫太阳庙旺，巨门得日光化解是非');
      if (starHua('巨门', '禄') || starHua('巨门', '权')) b.push('巨门化禄/化权（口才生财）');
      if (starHua('巨门', '忌')) k.push('巨门化忌（口舌官非）');
      if (z['巨门'] === 8) k.push('申宫太阳偏西，巨门暗曜更显');
      add('juri', ['巨门太阳同入' + TY_DZ[z['巨门']] + '宫'], b, k);
    }
    // 石中隐玉：巨门入命子午
    if (mingHas('巨门') && (m === 0 || m === 6)) {
      const b = [], k = [];
      if (starHua('巨门', '禄') || starHua('巨门', '权')) b.push('巨门化禄/化权');
      if (inSF('文昌')) b.push('文昌会照（石中隐玉得明）');
      if (starHua('巨门', '忌')) k.push('巨门化忌（玉藏深泥）');
      if (shaInM(shaHard)) k.push('命坐煞星');
      add('shizhong', ['巨门入命于' + TY_DZ[m] + '宫'], b, k);
    }
    // 明珠出海：命未空宫，对宫日月
    if (m === 7 && Object.keys(z).filter((s) => z[s] === m).length === 0 && z['太阳'] === dui && z['太阴'] === dui) {
      const b = [], k = [];
      if (inSF('文昌') || inSF('文曲')) b.push('再会昌曲');
      if (inSF('左辅') || inSF('右弼')) b.push('辅弼相助');
      if (shaCntS(shaHard) >= 2) k.push('煞星会照（珠光黯淡）');
      add('mingzhu', ['命宫在未为空宫', '对宫丑宫为太阳太阴同度'], b, k);
    }
    // 紫微入命：独坐
    if (mingHas('紫微') && !mingHas('天府')) {
      const b = [], k = [];
      if (inSF('左辅') && inSF('右弼')) b.push('左辅右弼同会');
      if (inSF('文昌') && inSF('文曲')) b.push('文昌文曲同会');
      if (!inSF('左辅') && !inSF('右弼')) k.push('无辅弼（孤君无臣）');
      if (shaInM(shaKong)) k.push('紫微遇空劫（古书最忌）');
      add('ziwei', ['紫微独坐命宫（无天府同坐）'], b, k);
    }

    // ── 助力格 ──
    // 辅弼夹命 / 昌曲夹命 / 魁钺夹命
    {
      const pz = at('左辅') === prev, py = at('右弼') === prev, nz = at('左辅') === next, ny = at('右弼') === next;
      if ((pz && ny) || (py && nz)) {
        const b = [];
        if (inSF('天魁') || inSF('天钺')) b.push('再会魁钺');
        add('fubi', ['左辅右弼分居命宫前后两宫'], b, []);
      }
    }
    {
      const pc = at('文昌') === prev, pq = at('文曲') === prev, nc = at('文昌') === next, nq = at('文曲') === next;
      if ((pc && nq) || (pq && nc)) add('changqu', ['文昌文曲分居命宫前后两宫'], [], []);
    }
    {
      const okA = at('天魁') === prev && at('天钺') === next, okB = at('天钺') === prev && at('天魁') === next;
      if (okA || okB) add('kuiyue', ['天魁天钺分居命宫前后两宫'], [], []);
    }
    // 双禄朝垣：化禄+禄存同会三方
    {
      let luH = false, luC = false;
      for (const s of sfStars()) { if (starHua(s, '禄')) luH = true; }
      if (inSF('禄存')) luC = true;
      if (luH && luC) {
        const k = shaInM(shaKong) ? ['命坐空劫（双禄遇空，财来财去）'] : [];
        add('shuanglu', ['化禄会照三方四正', '禄存会照三方四正'], [], k);
      }
    }
    // 三奇加会
    {
      let lu = false, quan = false, ke = false;
      for (const s of sfStars()) { if (starHua(s, '禄')) lu = true; if (starHua(s, '权')) quan = true; if (starHua(s, '科')) ke = true; }
      if (lu && quan && ke) add('sanqi', ['化禄、化权、化科三吉化齐会命宫三方四正'], [], []);
    }
    // 化禄入命
    {
      const luStar = Object.keys(z).find((s) => starHua(s, '禄') && z[s] === m);
      if (luStar) add('hualuru', [luStar + '化禄坐命宫'], [], []);
    }

    // ── 恶格 ──
    // 化忌入命 / 化忌入迁
    {
      const qianB = (m + 6) % 12;
      for (const s of Object.keys(z)) {
        if (!starHua(s, '忌')) continue;
        const sp = z[s];
        if (sp === m) add('huajiming', [s + '化忌坐命宫'], [], []);
        else if (sp === qianB) add('huajiqian', [s + '化忌坐迁移宫'], [], []);
      }
    }
    // 羊陀夹忌
    {
      const jiStar = Object.keys(z).find((s) => starHua(s, '忌') && z[s] === m);
      if (jiStar) {
        const aPrev = at('擎羊') === prev && at('陀罗') === next, aNext = at('陀罗') === prev && at('擎羊') === next;
        if (aPrev || aNext) add('yangtuo', ['化忌坐命', '擎羊陀罗分居命宫前后两宫'], [], []);
      }
    }
    // 火铃夹命
    {
      const okA = at('火星') === prev && at('铃星') === next, okB = at('铃星') === prev && at('火星') === next;
      if (okA || okB) add('huoling', ['火星铃星分居命宫前后两宫'], [], []);
    }
    // 空劫夹命
    {
      const okA = at('天空') === prev && at('地劫') === next, okB = at('地劫') === prev && at('天空') === next;
      if (okA || okB) add('kongjie', ['地空地劫分居命宫前后两宫'], [], []);
    }
    // 廉杀羊 / 巨火羊 / 铃昌陀武（三方会照）
    if (inSF('廉贞') && inSF('七杀') && inSF('擎羊')) add('lianshayang', ['廉贞、七杀、擎羊三星会照三方四正'], [], []);
    if (inSF('巨门') && inSF('火星') && inSF('擎羊')) add('juhuoyang', ['巨门、火星、擎羊三星会照三方四正'], [], []);
    if (inSF('铃星') && inSF('文昌') && inSF('陀罗') && inSF('武曲')) add('lingchang', ['铃星、文昌、陀罗、武曲四星会照三方四正'], [], []);
    // 马头带箭：擎羊午宫坐命
    if (m === 6 && at('擎羊') === 6) {
      const b = [];
      if (inSF('七杀') || inSF('破军')) b.push('再会七杀或破军（武职大贵）');
      if (inSF('天魁') || inSF('天钺')) b.push('魁钺加照');
      add('matou', ['擎羊于午宫坐命'], b, []);
    }

    // ── 基础格 ──
    if (mingHas('禄存')) add('lucun', ['禄存入命宫'], [], []);
    if (P.shen !== undefined && at('禄存') === P.shen) add('lucunshen', ['禄存入身宫'], [], []);
    if (mingHas('天马')) add('tianma', ['天马入命宫'], [], []);
    if (at('天马') === dui) add('tianmaqian', ['天马入迁移宫'], [], []);
    {
      const cai = (m + 4) % 12, guan = (m + 8) % 12;
      const luC = Object.keys(z).find((s) => starHua(s, '禄') && z[s] === cai);
      if (luC) add('hualucai', [luC + '化禄入财帛宫'], [], []);
      const quanG = Object.keys(z).find((s) => starHua(s, '权') && z[s] === guan);
      if (quanG) add('huaquan', [quanG + '化权入官禄宫'], [], []);
      const keM = Object.keys(z).find((s) => starHua(s, '科') && z[s] === m);
      if (keM) add('huake', [keM + '化科入命宫'], [], []);
      const keS = Object.keys(z).find((s) => starHua(s, '科') && P.shen !== undefined && z[s] === P.shen);
      if (keS && keS !== keM) add('huakeshen', [keS + '化科入身宫'], [], []);
    }
    {
      const has = ['天机', '太阴', '天同', '天梁'].filter((s) => inSF(s));
      if (has.length === 3) {
        const missing = ['天机', '太阴', '天同', '天梁'].filter((s) => !inSF(s));
        add('jiyue3', ['三方四正会' + has.join('、') + '（机月同梁缺' + missing.join('、') + '）'], [], []);
      }
    }
    if (inSF('文昌') && inSF('文曲')) {
      if (mingHas('文昌') && mingHas('文曲')) add('changquhui', ['文昌文曲同入命宫'], [], []);
      else add('changquhui', ['文昌、文曲同会命宫三方四正'], [], []);
    }
    if (inSF('左辅') && inSF('右弼')) add('fubihui', ['左辅、右弼同会命宫三方四正'], [], []);
    if (inSF('天魁') && inSF('天钺')) add('kuiyuehui', ['天魁、天钺同会命宫三方四正'], [], []);
    {
      let hasKe = false, hasQuan = false;
      for (const s of sfStars()) { if (starHua(s, '科')) hasKe = true; if (starHua(s, '权')) hasQuan = true; }
      if (hasKe && hasQuan) add('kequan', ['化科、化权同会命宫三方四正'], [], []);
    }

    return hits;
  }
  // 大限（十年一宫，起龄=局数；阳男阴女命宫顺，阴男阳女逆）
  function zwDayun(ming, gender, yGan, ju) {
    const shun = (yGan % 2 === 0 && gender === '男') || (yGan % 2 === 1 && gender === '女');
    const lim = [];
    for (let k = 0; k < 12; k++) {
      lim.push({ idx: ((ming + (shun ? k : -k)) % 12 + 12) % 12, from: ju + k * 10, to: ju + k * 10 + 9 });
    }
    return { shun, lim };
  }
  // 小限（年支三合库宫起，男顺女逆一年一宫）
  function zwXiaoxian(yZhi, gender, age) {
    const start = zwIdx(D.ziwei.xiaoxian[TY_DZ[yZhi]]);
    const dir = gender === '男' ? 1 : -1;
    return ((start + dir * (age - 1)) % 12 + 12) % 12;
  }
  // 通用输入指纹（确定性：相同输入 → 相同 hash，便于历史记录/复现/去重；FNV-1a 32bit）
  function inputHash() {
    const s = [].slice.call(arguments).join('|');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  // 空宫借对宫：某宫无十四主星时，借其对宫（idx+6）主星参断（《紫微斗数全书》"对宫借星"通行用法）
  function zwBorrowStars(idx, zhuyao) {
    const opp = (idx + 6) % 12;
    const oppStars = Object.keys(zhuyao).filter((s) => zhuyao[s] === opp);
    return { opp, oppStars };
  }
  // 断语：诸星问答/入男命女命限诀
  function zwDuanMain(ming, shen, zhuyao, gender, gan, zhi) {
    const h = [];
    const stars = Object.keys(zhuyao);
    let judge = stars;             // 诸星问答/入命诀实际取用的星（空宫时借对宫星参断）
    let master;
    if (stars.length) {
      master = stars;
    } else {
      const br = zwBorrowStars(ming, zhuyao);
      if (br.oppStars.length) { judge = br.oppStars; master = br.oppStars.map((s) => s + '（借对宫·' + ZW_GONGS[br.opp] + '）'); }
      else { master = ['（命宫无主星且对宫亦空，借福德宫参断）']; }
    }
    h.push('<div class="item-block"><span class="k">命宫主星</span><span>' + master.join('、') + '　（紫微系/天府系十四主星，余星皆辅星）</span></div>');
    // 诸星问答
    const xw = D.ziwei.xingwen.filter((x) => judge.includes(x.star));
    xw.forEach((x) => {
      const body = x.text.split('\n').slice(1).join(' ').slice(0, 260);
      h.push('<div class="item-block"><span class="k">诸星问答·' + x.star + '</span><span>' + esc(body) + '</span></div>');
    });
    // 入男命/女命/限吉凶诀
    judge.forEach((s) => {
      const hit = D.ziwei.xingjue.filter((x) => x.star === s && (x.kind === (gender === '男' ? '男命' : '女命')));
      hit.forEach((x) => h.push('<div class="item-block"><span class="k">' + s + '入' + x.kind + '吉凶诀</span><span>' + esc(x.text) + '</span></div>'));
    });
    // 命主身主
    h.push('<div class="item-block"><span class="k">命主身主</span><span>命主：' + D.ziwei.mingzhu[TY_DZ[zhi]] + '　身主：' + D.ziwei.shenzhu[TY_DZ[zhi]] + '</span></div>');
    return h;
  }
  // 十二宫断：命盘各宫所落星 → 十二宫断语段内取对应星断句
  function zwDuanGong(pan, zhuyao, fuyao) {
    const h = [];
    for (let g = 1; g <= 11; g++) {
      const gname = ZW_GONGS[g];
      const seg = D.ziwei.gongduan[g - 1];
      if (!seg) continue;
      const starsIn = [];
      Object.keys(zhuyao).forEach((s) => { if (zhuyao[s] === g) starsIn.push(s); });
      Object.keys(fuyao).forEach((s) => { if (typeof fuyao[s] === 'number' && fuyao[s] === g) starsIn.push(s); });
      if (!starsIn.length) continue;
      const lines = seg.text.split('\n').filter((l) => l.trim());
      const hit = lines.filter((l) => starsIn.some((s) => l.startsWith(s) || l.includes(s)));
      h.push('<div class="item-block"><span class="k">' + gname + '宫</span><span class="stars">' + starsIn.join('、') + '</span><span>' +
        (hit.length ? hit.slice(0, 3).map((l) => esc(l)).join('；') : esc(seg.text.slice(0, 160))) + '</span></div>');
    }
    return h;
  }
  // ===== 活断语辅助 =====
  function zwStarsAt(zhuyao, fuyao, idx) {
    const out = [];
    Object.entries(zhuyao).forEach(([s, i]) => { if (i === idx) out.push(s); });
    Object.entries(fuyao).forEach(([s, v]) => { if (typeof v === 'number' && v === idx) out.push(s); });
    return out;
  }
  function zwSanHe(zhuyao, fuyao, ming) {
    const out = [];
    [0, 4, 8].forEach((k) => out.push(...zwStarsAt(zhuyao, fuyao, (ming + k) % 12)));
    return out;
  }
  // ===== 原文库·选项法组件（分类按钮组 → 选类看该类条目） =====
  const libData = {};
  let libSeq = 0;
  function libShow(n, i) {
    const el = document.getElementById('lib' + n);
    const d = libData[n];
    if (!el || !d) return;
    el.innerHTML = d[i].items.map((it) => '<div class="item-block"><span class="k">' + esc(it.title) + '</span><span>' + esc(it.text) + '</span></div>').join('');
  }
  function libBox(title, groups) {
    libSeq++;
    libData[libSeq] = groups;
    const n = libSeq;
    const btns = groups.map((g, i) => '<button class="sec" style="padding:3px 11px;font-size:12px" onclick="libShow(' + n + ',' + i + ')">' + esc(g.name) + '</button>').join('');
    const initial = groups[0] ? groups[0].items.map((it) => '<div class="item-block"><span class="k">' + esc(it.title) + '</span><span>' + esc(it.text) + '</span></div>').join('') : '';
    return '<div class="item-block" style="border-color:#d9a05e55"><span class="k">' + esc(title) + '（分类查看）</span>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px">' + btns + '</div>' +
      '<div id="lib' + n + '" style="border-top:1px dashed #8884;padding-top:8px">' + initial + '</div></div>';
  }
  window.libShow = libShow;
  // 格局判据匹配（判据来自全书"论X格"前判定句；粗匹配，多宫合参条件未尽验则标注）
  function zwDuanGeju(zhuyao, fuyao, ming, sihua) {
    const h = [];
    const zs = zwStarsAt(zhuyao, fuyao, ming);
    const zhi = TY_DZ[ming];
    const caifuStars = zwStarsAt(zhuyao, fuyao, (ming + 1) % 12);
    const qianyiStars = zwStarsAt(zhuyao, fuyao, (ming + 8) % 12);
    const sanhe = zwSanHe(zhuyao, fuyao, ming);
    const has = (set, n) => set.includes(n);
    const jihua = sihua ? sihua['忌'] : null;
    const rules = [
      ['对面朝斗', () => has(zs, '禄存') && (zhi === '子' || zhi === '午')],
      ['左右朝垣', () => sanhe.some((s) => s === '左辅' || s === '右弼')],
      ['兼文武', () => has(zs, '文曲') && has(zs, '武曲')],
      ['文星朝命', () => has(zs, '文昌') && has(zs, '文曲')],
      ['石中隐玉', () => (zhi === '子' || zhi === '午') && has(zs, '巨门')],
      ['贪狼遇火（火贵格）', () => has(zs, '贪狼') && has(zs, '火星')],
      ['科权禄主格', () => has(zs, '禄存') && sihua && (sihua['禄'] || sihua['权'] || sihua['科'])],
      ['商贾之命', () => (has(zs, '巨门') && has(zs, '太阳')) || (has(zs, '紫微') && has(zs, '天府'))],
      ['艺术之命', () => ['寅', '申', '巳', '亥'].includes(zhi) || ((has(zs, '贪狼') || has(zs, '武曲')) && (jihua === '贪狼' || jihua === '武曲'))],
      ['出家僧道', () => (zhi === '卯' || zhi === '酉') && has(zs, '紫微') && (has(zs, '天空') || has(zs, '地劫'))],
      ['定人聪明', () => sanhe.some((s) => s === '文曲' || s === '天相' || s === '破军')],
      ['定人富足', () => has(caifuStars, '太阴') || has(zs, '太阴')],
      ['定人贫贱', () => zs.some((s) => ['擎羊', '陀罗', '火星', '铃星'].includes(s)) && zs.some((s) => ['武曲', '廉贞', '巨门', '破军'].includes(s))],
      ['定人作盗贼', () => (has(zs, '破军') || has(zs, '廉贞') || has(zs, '贪狼')) && (sanhe.some((s) => s === '七杀') || has(qianyiStars, '武曲'))],
    ];
    const hit = rules.filter(([, f]) => f()).map(([n]) => n);
    hit.forEach((n) => {
      const g = D.ziwei.gegu.find((x) => x.title.includes(n.replace(/（.*/, '')));
      h.push('<div class="item-block" style="border-color:#5a8f5a55"><span class="k">格局·' + n + '（判据命中）</span><span>' + esc(g ? g.text.split('\n')[0] + '…' : '按判据命中，原文见格局库') + '</span></div>');
    });
    if (!hit.length) h.push('<div class="item-block"><span class="k">格局</span><span>本盘命宫星曜未命中已机判的格局判据（下分三类查看 19 格全文供临机比对）。</span></div>');
    const gejuGroups = [
      { name: '富贵格', keys: ['对面朝斗', '科权禄主', '左右朝垣', '兼文武', '文星朝命', '石中隐玉', '贪狼遇火', '定人富足'] },
      { name: '职业命', keys: ['商贾', '艺术', '僧道', '盗贼'] },
      { name: '性格命运', keys: ['孤克', '寿夭', '残疾', '破相', '聪明', '贫贱', '驳杂'] },
    ].map((g) => ({ name: g.name, items: D.ziwei.gegu.filter((x) => g.keys.some((k) => x.title.includes(k))).map((x) => ({ title: x.title, text: x.text })) }));
    h.push(libBox('格局论原文库（19 格·须临机合参，未全部机判）', gejuGroups));
    return h;
  }
  // 命宫地支四诀（得地/失陷/富贵/贫贱）+ 十等论关键词匹配 + 四局 + 赋文原文库
  function zwDuanFujia(ming, zhuyao, fuyao, sihua) {
    const h = [];
    // ① 命宫地支四诀（全书十二宫诸星得地/失陷/富贵/贫贱诀，命宫地支直查）
    const gj = D.ziwei.gongjue[TY_DZ[ming]];
    if (gj) {
      [['dedi', '十二宫诸星得地合格诀'], ['shixian', '十二宫诸星失陷破格诀'], ['fugui', '十二宫诸星得地富贵论'], ['pinjian', '十二宫诸星失陷贫贱论']]
        .forEach(([k, name]) => {
          if (gj[k]) h.push('<div class="item-block" style="border-color:#5a8f5a55"><span class="k">' + name + '·' + TY_DZ[ming] + '安命</span><span>' + esc(gj[k]) + '</span></div>');
        });
    }
    // ② 十等论关键词匹配（命宫星曜）
    const zs = zwStarsAt(zhuyao, fuyao, ming);
    const jihua = sihua ? sihua['忌'] : null;
    const hitSet = [];
    ['福寿', '聪明', '威勇', '文职', '武职', '刑名', '富贵', '贫贱', '疾殀', '僧道'].forEach((n) => {
      const sp = D.ziwei.shipin.find((x) => x.name === n);
      if (!sp) return;
      const s = sp.text;
      let hits = 0, hitStars = [];
      ['天同', '天梁', '紫微', '武曲', '破军', '贪狼', '文昌', '文曲', '天相', '天府', '三台', '八座', '左辅', '右弼', '擎羊', '七杀', '天魁', '天钺', '陀罗', '火星', '铃星', '太阴', '太阳', '廉贞', '天空', '地劫', '天机', '天禄', '天印']
        .forEach((st) => { if (s.includes(st) && (zs.includes(st) || (st === '忌' && jihua))) { hits++; hitStars.push(st); } });
      if (s.includes('忌') && jihua) { hits++; hitStars.push('忌(' + jihua + ')'); }
      if (hits >= 2) hitSet.push({ n, hits, hitStars });
    });
    hitSet.sort((a, b) => b.hits - a.hits);
    hitSet.slice(0, 3).forEach((x) => {
      h.push('<div class="item-block" style="border-color:#5a8f5a55"><span class="k">定富贵贫贱十等论·' + x.n + '（命宫星曜关键词命中 ' + x.hits + '：' + x.hitStars.join('、') + '）</span><span>' + esc(D.ziwei.shipin.find((s) => s.name === x.n).text) + '</span></div>');
    });
    // ③ 富/贵/贫贱/杂局 + 十等论全文（判据多涉"来夹/拱冲"复杂宫位，须临机，分类查看）
    const fujiaGroups = ['定富贵贫贱十等论', '定富局', '定贵局', '定贫贱局', '定杂局'].map((nm) => ({
      name: nm.replace('定富贵贫贱十等论', '十等论全文'),
      items: D.ziwei.fujia.filter((f) => f.name === nm).map((f) => ({ title: f.name, text: f.text })),
    })).filter((g) => g.items.length);
    h.push(libBox('定富贵贫贱局（原文，判据涉来夹/拱冲，未机判，分类查看）', fujiaGroups));
    // ④ 赋文原文库（资料，未参与机判，按主题分类查看）
    const fuwenGroups = [
      { name: '总纲', keys: ['太微赋'] },
      { name: '形性', keys: ['形性赋'] },
      { name: '格局', keys: ['星垣论'] },
      { name: '口诀', keys: ['准绳', '发微'] },
      { name: '骨髓', keys: ['骨髓赋', '女命骨髓赋'] },
    ].map((g) => ({ name: g.name, items: D.ziwei.fuwen.filter((f) => g.keys.some((k) => f.name.includes(k))).map((f) => ({ title: f.name, text: f.text })) }));
    h.push(libBox('赋文全篇（原文库，未参与机判，按主题分类）', fuwenGroups));
    h.push('<div class="item-block" style="border-color:#d9a05e55"><span class="k">综合读盘·活层原文（8 句，须临机）</span><span>大抵在人之机变，更加作意之推详。先究命理，次及星躔，论星辰之缠度，推人命之荣枯。专看命宫，次察身宫，详三方四正，观吉凶之星曜。凡人命之吉凶，全在星曜之庙陷，生克之制化，不可一概而论。</span></div>');
    return h;
  }
  // 十二宫方盘
  function zwPanHtml(P) {
    const cell = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const off = ZW_ROW_OFF[r][c], idx = ((P.ming - off) % 12 + 12) % 12;
        const gname = ZW_ROW_NAMES[r][c];
        const gz = TY_TG[P.gongGan[idx]] + TY_DZ[idx];
        const stars = [];
        Object.entries(P.zhuyao).forEach(([s, i]) => {
          if (i === idx) {
            const b = zwBrightness(s, i);
            stars.push('<b>' + s + (b ? '<i class="zw-br">' + b.j + '</i>' : '') + '</b>');
          }
        });
        Object.entries(P.fuyao).forEach(([s, v]) => { if (typeof v === 'number' && v === idx) stars.push(s); });
        // 空宫借对宫主星标注（十四主星层面）
        if (!Object.values(P.zhuyao).includes(idx)) {
          const br = zwBorrowStars(idx, P.zhuyao);
          if (br.oppStars.length) stars.push('<i class="ln">借对宫·' + ZW_GONGS[br.opp] + '：' + br.oppStars.join('/') + '</i>');
        }
        const sihua = P.sihua || {};
        const sh = Object.keys(sihua).filter((k) => P.zhuyao[sihua[k]] === idx).map((k) => '★' + k);
        const lims = P.dayun.lim.filter((l) => l.idx === idx).map((l) => (l.from) + '-' + l.to + '岁');
        const dalu = stars.join('<br>');
        cell.push('<td class="zw-cell' + (idx === P.ming ? ' zw-ming' : '') + (idx === P.shen ? ' zw-shen' : '') + '"><div class="zw-gname">' + gname + ' <i>' + gz + '</i>' +
          (idx === P.ming ? ' <em>命</em>' : '') + (idx === P.shen ? ' <em>身</em>' : '') + '</div>' +
          '<div class="zw-stars">' + dalu + '</div>' +
          (sh.length ? '<div class="zw-sihua">' + sh.join(' ') + '</div>' : '') +
          (lims.length ? '<div class="zw-lim">' + lims.join('<br>') + '</div>' : '') + '</td>');
      }
    }
    return '<table class="zw-pan"><tbody>' +
      '<tr>' + cell.slice(0, 4).join('') + '</tr>' +
      '<tr>' + cell.slice(4, 8).join('') + '</tr>' +
      '<tr>' + cell.slice(8, 12).join('') + '</tr>' +
      '</tbody></table>';
  }
  function zwGo() {
    const y = parseInt($('zw-year').value, 10), mo = parseInt($('zw-month').value, 10), d = parseInt($('zw-day').value, 10);
    if (!y || !mo || !d || y < 1) { $('zw-result').innerHTML = '<div class="err">请输入完整公历年月日</div>'; return; }
    const ziRaw = zwIdx($('zw-hour').value), gender = $('zw-gender').value;
    // ── 真太阳时校正（可选）：经度 + 出生钟点（缺省时辰中点）+ 晚子时四模式 ──
    // 2026-10-27 修复：晚子时换日（offDays）不再只做提示——无经度输入时同样按钟点判定晚子时，并落实到排盘日/农历日/四柱
    let zi = ziRaw, tstNote = null;
    const ziStartHour = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21][ziRaw]; // 各时辰起始小时
    const clockStr = ($('zw-clock') && $('zw-clock').value || '').trim();
    let cH = (ziStartHour + 1) % 24, cM = 0; // 缺省：时辰中点（子时缺省按 00:00 早子时）
    if (clockStr !== '') {
      const m = clockStr.match(/^(\d{1,2}):(\d{2})$/);
      if (!m || +m[1] > 23 || +m[2] > 59) { $('zw-result').innerHTML = '<div class="err">出生钟点格式应为 HH:MM（如 14:30）</div>'; return; }
      cH = +m[1]; cM = +m[2];
    }
    const lateMode = ($('zw-late') && $('zw-late').value) || 'next-day';
    let offDays = 0;
    const lonInput = ($('zw-lon') && $('zw-lon').value || '').trim();
    if (lonInput !== '') {
      const lonVal = parseFloat(lonInput);
      if (!Number.isFinite(lonVal) || lonVal < -180 || lonVal > 180) { $('zw-result').innerHTML = '<div class="err">经度需在 -180~180 之间（东经为正、西经为负）</div>'; return; }
      const sol = TST.calculate({ year: y, month: mo, day: d, clockHour: cH, clockMinute: cM, longitude: lonVal });
      const off = TST.resolveDayOffset(sol, lateMode);
      offDays = off;
      tstNote = { sol, off, tstName: TST.branchName(sol.branch, sol.normalizedMinutes), useTst: $('zw-usetst').checked, rawName: $('zw-hour').value, cH, cM, lon: lonVal, cityName: ($('zw-city-note').textContent.match(/^已选：(.*?)（东经/) || [])[1] || null };
      if (tstNote.useTst) zi = sol.branch;
    } else {
      // 无经度输入：按钟点判晚子时（23:00-24:00）→ next-day/day-cur-time-next 换日，其余不换
      if (ziRaw === 0 && cH === 23) {
        offDays = (lateMode === 'next-day' || lateMode === 'day-cur-time-next') ? 1 : 0;
      }
    }
    // 有效排盘日（晚子时换日落实到排盘：公历日/农历日/年柱一并顺移）
    const eff = new Date(y, mo - 1, d + offDays);
    const effY = eff.getFullYear(), effMo = eff.getMonth() + 1, effD = eff.getDate();
    let lunar = null;
    try { lunar = Lunar.fromDate(new Date(effY, effMo - 1, effD)); } catch (e) { lunar = null; }
    const lM = lunar ? Math.abs(lunar.getMonth()) : effMo;   // 农历月（闰月为负，取绝对值；公历月兜底并标注）
    const leap = lunar ? lunar.getMonth() < 0 : false;    // 闰月（lunar.js 用负数月表示）
    const lD = lunar ? Math.abs(lunar.getDay()) : effD;   // 农历日（紫微定位/三台八座须用农历日；农历历表未加载时公历日兜底）
    const sizhu = tySizhu(effY, effMo, effD, zi);
    const zwY = zwYearGz(lunar, ($('zw-yearrule') && $('zw-yearrule').value) || 'zhnegchu');
    const yGan = zwY ? zwY.g : TY_TG.indexOf(sizhu.year[0]), yZhi = zwY ? zwY.z : TY_DZ.indexOf(sizhu.year[1]);
    const yGzSrc = zwY ? zwY.src : '立春近似（农历历表未加载）';
    const zwYearDisp = TY_TG[yGan] + TY_DZ[yZhi];
    const ms = zwMingShen(lM, zi, leap, lD);
    const mgGan = zwGongGan(yGan, ms.ming), mgz = TY_TG[mgGan] + TY_DZ[ms.ming];
    const ju = zwJu(mgz);
    if (!ju) { $('zw-result').innerHTML = '<div class="err">命宫纳音未收录（' + esc(mgz) + '），请核对日期</div>'; return; }
    const ziwei = zwZiwei(ju, lD);                          // 紫微定位按农历日（2026-10-27 金标修复：原误用公历日）
    const zhuyao = zwZhuyao(ziwei);
    const shun = (yGan % 2 === 0 && gender === '男') || (yGan % 2 === 1 && gender === '女');
    const fuyao = zwFuyao({ yGan, yZhi, month: lM, day: lD, zi, ming: ms.ming, ju, shun });
    const sihua = zwSihua(yGan);
    const dayun = zwDayun(ms.ming, gender, yGan, ju);
    const P = { ming: ms.ming, shen: ms.shen, gongGan: null, zhuyao, fuyao, sihua, dayun };
    P.gongGan = TY_DZ.map((_, idx) => zwGongGan(yGan, idx));
    const dispZiName = tstNote && tstNote.useTst ? ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][zi] : $('zw-hour').value;
    const yearDiffTip = zwYearDisp !== sizhu.year ? '；<span class="q">八字年柱' + esc(sizhu.year) + '（立春口径）与紫微年支' + esc(zwYearDisp) + '（' + esc(yGzSrc) + '）不同——出生日在正月初一至立春之间，两口径差异在此显形</span>' : '';
    let h = '<div class="src-line">紫微斗数（全书本）· ' + esc(y + '-' + mo + '-' + d) + ' ' + esc(dispZiName) + '时 ' + (gender === '男' ? '男' : '女') + '命　年柱' + esc(zwYearDisp) + '（' + esc(yGzSrc) + '） 月柱' + esc(sizhu.month) + ' 日柱' + esc(sizhu.day) + ' 时柱' + esc(sizhu.hour) + yearDiffTip + '</div>';
    if (tstNote) {
      const s = tstNote.sol, off = tstNote.off;
      const dayShift = off === 1 ? '（晚子时归属+1日）' : off === -1 ? '（-1日）' : '';
      const ziName = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][zi];
      h += '<div class="item-block" style="border-color:#5a8faf55"><span class="k">真太阳时校正（工具层，非古籍）</span><span>输入 ' + esc(tstNote.rawName) + '时（钟表 ' + String(tstNote.cH).padStart(2, '0') + ':' + String(tstNote.cM).padStart(2, '0') + '，' + (tstNote.cityName ? '出生城市 ' + esc(tstNote.cityName) + '，' : '') + '经度 ' + tstNote.lon + '°东）→ 校正后 ' + esc(TST.branchName(s.branch, s.normalizedMinutes)) + '（' + TST.formatClock(s.hour, s.minute, s.second) + '）' + dayShift + '；经度修正 ' + (s.lonCorrectionMinutes > 0 ? '+' : '') + s.lonCorrectionMinutes.toFixed(1) + ' 分 + 均时差 ' + (s.equationOfTimeMinutes > 0 ? '+' : '') + s.equationOfTimeMinutes.toFixed(1) + ' 分 = 合计 ' + (s.totalCorrectionMinutes > 0 ? '+' : '') + s.totalCorrectionMinutes.toFixed(1) + ' 分。晚子时规则：' + ({ 'next-day': '算次日（主流）', 'current-day': '算当日', 'all-current': '全天算当日', 'day-cur-time-next': '日干随时辰换日' }[$('zw-late').value]) + '。' + (tstNote.useTst ? '已按校正时辰（' + ziName + '时）排盘。' : '未启用按校正时辰排盘，仍按原 ' + esc(tstNote.rawName) + ' 时排盘。') + '</span></div>';
    }
    h += '<div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:10px;">';
    h += '<span class="tag z">农历' + (lunar ? lunar.toString().replace(/^.*农历/, '') : '（公历月兜底，农历按公历月）') + '</span>';
    h += '<span class="tag b">命宫' + TY_DZ[ms.ming] + '（' + mgz + '纳音' + D.ziwei.nayin[mgz] + '）</span>';
    h += '<span class="tag g">' + { 2: '水二局', 3: '木三局', 4: '金四局', 5: '土五局', 6: '火六局' }[ju] + '</span>';
    h += '<span class="tag p">身宫' + TY_DZ[ms.shen] + '</span>';
    h += '<span class="tag y">大限' + (dayun.shun ? '顺行' : '逆行') + '（起' + ju + '岁）</span>';
    h += '</div>';
    h += zwPanHtml(P);
    // 十四主星亮度（古籍原文：《紫微斗数全书》卷三集中段 + 卷二命宫逐宫句；原文档位，未标=原文未标，两说=卷三/卷二并存照录）
    h += libBox('十四主星亮度（《紫微斗数全书》卷三集中段+卷二命宫逐宫句；档位=庙/旺/地/利/平/不得地/陷）', [{
      name: '十二宫亮度状态（按地支宫序，主星为该宫所坐星）',
      items: TY_DZ.map((dz, idx) => {
        const starList = Object.keys(P.zhuyao).filter((s) => P.zhuyao[s] === idx);
        if (!starList.length) return null;
        const line = starList.map((s) => {
          const b = zwBrightness(s, idx);
          if (!b) return s + '（无亮度表）';
          const alt = b.alt ? '；两说并存：' + b.j + '（' + b.s + '）/另说' + b.alt : '';
          return s + '·' + b.j + '（' + b.s + '）' + alt;
        }).join('；');
        return { title: dz + '宫', text: line };
      }).filter(Boolean),
    }]);
    h += '<div class="src-line" style="margin-top:4px">亮度表口径：以古籍原文为准；庙旺≠必吉、陷弱≠必凶，须与四化、星曜组合、三方四正合看（《全书》各星原文均附宜忌）。第三源 iztro 整理版、第四源 ziwei-doushu 修正表仅备查，不入主档。</div>';
    // 辅星亮度（卷三原文；擎羊/陀罗/火星/铃星）
    const fuxingList = ['擎羊', '陀罗', '火星', '铃星'];
    const fxItems = TY_DZ.map((dz, idx) => {
      const hits = fuxingList.filter((s) => {
        const v = P.fuyao[s];
        return typeof v === 'number' && v === idx;
      });
      if (!hits.length) return null;
      const line = hits.map((s) => {
        const b = zwBrightness(s, idx);
        if (!b) return s + '（无亮度表）';
        const alt = b.alt ? '；两说并存：' + b.j + '（' + b.s + '）/另说' + b.alt : '';
        return s + '·' + b.j + '（' + b.s + '）' + alt;
      }).join('；');
      return { title: dz + '宫', text: line };
    }).filter(Boolean);
    if (fxItems.length) h += libBox('辅星亮度（《紫微斗数全书》卷三·擎羊/陀罗/火星/铃星，档位同上）', [{ name: '所临宫位亮度状态', items: fxItems }]);
    // 格局机判（46 格三层：成格/加分/破格；条件=通行判法+《全书》原文校正；命中≠吉凶定论）
    const PATS = D.ziwei.patterns && D.ziwei.patterns.patterns ? D.ziwei.patterns.patterns : [];
    const pHits = zwPatterns(P);
    if (PATS.length && pHits.length) {
      const lvName = { excellent: '上格', good: '中格', neutral: '基础', caution: '恶格' };
      const lvDown = { excellent: 'good', good: 'neutral', neutral: 'neutral', caution: 'caution' };
      const pMeta = {};
      PATS.forEach((pt) => { pMeta[pt.id] = pt; });
      const order = ['上格', '中格', '助力', '基础', '恶格'];
      const groups = {};
      pHits.forEach((hit) => {
        const meta = pMeta[hit.id];
        if (!meta) return;
        const key = meta.group || '基础';
        (groups[key] = groups[key] || []).push({ hit, meta });
      });
      const blockItems = [];
      order.forEach((g) => {
        const list = groups[g];
        if (!list || !list.length) return;
        list.forEach(({ hit, meta }) => {
          const base = meta.level;
          const eff = hit.breaking.length ? lvDown[base] : base;
          const q = meta.quote ? '<br><span class="q">原文：' + esc(meta.quote) + '</span>' : '';
          const bLines = hit.bonus.length ? '<br><span class="b">加分（已触发）：' + esc(hit.bonus.join('；')) + '</span>' : '';
          const kLines = hit.breaking.length ? '<br><span class="k2">破格（已触发，等级由' + lvName[base] + '降为' + lvName[eff] + '）：' + esc(hit.breaking.join('；')) + '</span>' : '';
          const srcTag = meta.src.indexOf('通行派') >= 0 ? ' <span class="q" style="color:#d9a05e">[' + esc(meta.src) + ']</span>' : ' <span class="q">[' + esc(meta.src) + ']</span>';
          blockItems.push({
            title: meta.name + '（' + lvName[eff] + (eff !== base ? '，原' + lvName[base] : '') + '）',
            text: '成格：' + esc(hit.req.join('；')) + srcTag + q + bLines + kLines + '<br><span class="muted">' + esc(meta.desc) + '</span>'
          });
        });
      });
      if (blockItems.length) {
        h += libBox('格局机判（' + pHits.length + ' 格命中·三层：成格/加分/破格；条件=通行判法+《全书》原文校正；命中≠吉凶定论）', [{ name: '命中格局（按等级分组）', items: blockItems }]);
        h += '<div class="src-line">格局口径：古籍有直文者引原文并注行号；古籍未见直文者标注『通行派』两说并存。恶格描述含古籍宿命论原文时照录原文并附现代注释，不代替综合读盘。仅供学习参考。</div>';
      }
    }
    // 问事聚焦（domain→对应宫，参照梅花十八断语"按占事取断"的做法）
    const ask = $('zw-ask').value;
    if (ask && ZW_ASK_MAP[ask] !== undefined) {
      const gi = ZW_ASK_MAP[ask], gname = ZW_GONGS[gi];
      const gStars = Object.keys(P.zhuyao).filter((s) => P.zhuyao[s] === gi);
      const gFu = Object.keys(P.fuyao).filter((s) => typeof P.fuyao[s] === 'number' && P.fuyao[s] === gi);
      const gSihua = Object.keys(sihua || {}).filter((k) => P.zhuyao[sihua[k]] === gi).map((k) => '★' + k);
      let gTxt = '<div class="card" style="margin-top:10px;border-color:rgba(201,168,106,.5);"><h3>问事聚焦 · ' + gname + '</h3>';
      gTxt += '<div class="item-block"><span class="k">所落主星</span><span>' + (gStars.length ? gStars.join('、') : '（无十四主星，借对宫' + ZW_GONGS[(gi + 6) % 12] + '：' + (zwBorrowStars(gi, P.zhuyao).oppStars.join('/') || '空') + '参断）') +
        (gSihua.length ? '　' + gSihua.join(' ') : '') + '</span></div>';
      if (gFu.length) gTxt += '<div class="item-block"><span class="k">辅星</span><span>' + gFu.join('、') + '</span></div>';
      const gduan = D.ziwei.gongduan[gi] || '';
      const gSeg = gStars.length ? gduan.split('\n').filter((l) => gStars.some((s) => l.includes(s))).join('；') : '';
      if (gSeg) gTxt += '<div class="item-block"><span class="k">十二宫断</span><span>' + esc(gSeg.slice(0, 300)) + '</span></div>';
      gTxt += '<div class="src-line">「' + gname + '」断语按所落主星从《紫微斗数全书》十二宫断语中匹配（关键词粗匹配，未命中显示原文段）。</div></div>';
      h += gTxt;
    }
    h += '<div class="card" style="margin-top:10px;"><h3>断语（素材库查表 + 活层原文）</h3>' +
      zwDuanMain(ms.ming, ms.shen, zhuyao, gender, yGan, yZhi).join('') +
      '<h3 style="margin-top:10px">十二宫断语（各宫所落星断句）</h3>' + zwDuanGong(P, zhuyao, fuyao).join('') +
      '<h3 style="margin-top:10px">格局（判据机判）</h3>' + zwDuanGeju(zhuyao, fuyao, ms.ming, sihua).join('') +
      '<h3 style="margin-top:10px">富贵贫贱（命宫地支四诀 + 十等论 + 原文库）</h3>' + zwDuanFujia(ms.ming, zhuyao, fuyao, sihua).join('') +
      // 古籍机判层（十四主星断语库：星性/富局/贵局/贫贱局/杂局/五格/赋文——能机判的机判，不能的活步骤红字）
      '<h3 style="margin-top:10px">古籍机判层（十四主星断语库 · 能机判的机判，不能的活步骤红字）</h3>' +
      zwGjBtnRow(((D.ziwei && D.ziwei.guji_cat) || { cats: [] }).cats) +
      ((D.ziwei && D.ziwei.guji_cat) || { cats: [] }).cats.map((c, i) => '<div class="zw-gj-box" id="zw-gj-' + i + '" style="display:none;margin:4px 0 8px;padding:8px;background:rgba(0,0,0,.16);border-radius:8px;"></div>').join('') +
      '<div class="src-line">四化（生年干 ' + TY_TG[yGan] + '）：' + (sihua ? Object.entries(sihua).map(([k, v]) => k + '=' + v).join('　') : '原文未载') +
      '。大限表：' + dayun.lim.slice(0, 4).map((l) => TY_DZ[l.idx] + '宫' + l.from + '-' + l.to + '岁').join('　') + '…。小限按生年支三合库宫起（男顺女逆，一年一宫）。农历历表内置；节气为近似日（见太乙说明）。安星算法与全书"火局初一酉宫起紫微"互证；魁钺取通行版。断语全部出自《紫微斗数全书》原文。</div>';
    h += '<div class="src-line" style="margin-top:6px;">输入指纹 <code>' + inputHash(y, mo, d, zi, gender, ask) + '</code>（相同输入 → 相同指纹，可复现/留档）</div>';
    $('zw-result').innerHTML = h;
    // 挂盘供端到端测试/后续功能直读（2026-10-27 紫微金标修复后新增）
    window._zwChart = { P, yGan, yZhi, yGzSrc, zwYearDisp, ms, mgz, ju, ziwei, zi, gender, lunarDay: lD, solar: { y, mo, d }, lM, leap, sihua, dayun };
    // 古籍机判层 · 十四主星：类按钮 → 机判命中 + 活步骤红字（惰性渲染）
    document.querySelectorAll('.zw-gj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i, 10);
        const box = document.getElementById('zw-gj-' + i);
        if (!box) return;
        if (box.style.display === 'none') {
          box.style.display = 'block';
          if (!box.dataset.rendered) {
            box.dataset.rendered = '1';
            const cat = ((D.ziwei && D.ziwei.guji_cat) || { cats: [] }).cats[i];
            if (cat) box.innerHTML = zwGjBoxHtml(cat, { ming: P.ming, shen: P.shen, zhuyao: P.zhuyao, fuyao: P.fuyao, sihua: P.sihua, gender: gender }, false);
          }
        } else {
          box.style.display = 'none';
        }
      });
    });
  }
  // ── 流年/流月运限层（《紫微斗数全书·安斗君诀》：太岁宫起正月逆至生月，生月宫起子顺至生时）──
  const WUHU = ['丙', '戊', '庚', '壬', '甲'];   // 五虎遁寅月干（甲己→丙…戊癸→甲）
  // 流昌/流曲（按天干，iztro 开源实现表——"流昌起巳位，甲乙顺流去，不用四墓宫；流曲起酉位，甲乙逆行踪"：甲巳乙午丙戊申丁己酉庚亥辛子壬寅癸卯）
  const ZW_FLOW_CQ = {
    '甲': [5, 9], '乙': [6, 8], '丙': [8, 6], '丁': [9, 5], '戊': [8, 6],
    '己': [9, 5], '庚': [11, 3], '辛': [0, 2], '壬': [2, 0], '癸': [3, 11],
  };
  // 岁建十二神（东派斗数/中州派流曜总论）：岁建=流年支起顺布
  const ZW_SUIJIAN = ['岁建', '晦气', '丧门', '贯索', '官符', '小耗', '大耗', '龙德', '白虎', '天德', '吊客', '病符'];
  // 将前十二神（东派斗数/中州派流曜总论）：将星=三合之首（申子辰→子、寅午戌→午、巳酉丑→酉、亥卯未→卯）起顺布
  const ZW_JIANGQIAN = ['将星', '攀鞍', '岁驿', '息神', '华盖', '劫煞', '灾煞', '天煞', '指背', '咸池', '月煞', '亡神'];
  const ZW_JIANGQIAN_START = { '申': 0, '子': 0, '辰': 0, '寅': 6, '午': 6, '戌': 6, '巳': 9, '酉': 9, '丑': 9, '亥': 3, '卯': 3, '未': 3 };
  // 流耀（按流年干支，与 iztro getHoroscopeStar 同套：魁钺昌曲禄羊陀马鸾喜+年解；火铃 iztro 流耀层未含，本引擎同）
  function zwLiuXing(gan, zhi) {
    const out = {};
    const add = (s, i) => { out[s] = ((i % 12) + 12) % 12; };
    const qk = D.ziwei.qkui[gan] || [];
    if (qk[0]) add('流魁', zwIdx(qk[0]));
    if (qk[1]) add('流钺', zwIdx(qk[1]));
    const cq = ZW_FLOW_CQ[gan];
    if (cq) { add('流昌', cq[0]); add('流曲', cq[1]); }
    const lu = D.ziwei.fulu[gan];
    if (lu) { add('流禄', zwIdx(lu)); add('流羊', zwIdx(lu) + 1); add('流陀', zwIdx(lu) - 1); }
    const tm = D.ziwei.tianma[TY_DZ[zhi]];
    if (tm) add('流马', zwIdx(tm));
    const hl = (3 - zhi + 12) % 12;                 // 卯起子年逆（红鸾）
    add('流鸾', hl); add('流喜', hl + 6);
    add('年解', 10 - zhi);                          // 戌起子逆（解神）
    return out;
  }
  // 岁建十二神：岁建=流年支，顺布
  function zwSuiQian(zhi) { const m = {}; ZW_SUIJIAN.forEach((n, k) => { m[n] = ((zhi + k) % 12 + 12) % 12; }); return m; }
  // 将前十二神：将星=三合首，顺布
  function zwJiangQian(zhi) { const m = {}; ZW_JIANGQIAN.forEach((n, k) => { m[n] = ((ZW_JIANGQIAN_START[TY_DZ[zhi]] + k) % 12 + 12) % 12; }); return m; }
  function zwFlowPanHtml(P, lMing, douJun, lMingYue, lSihua, lMu, liu, sui, jiang) {
    const cell = [];
    const liuAt = (idx) => Object.entries(liu || {}).filter(([, v]) => v === idx).map(([s]) => s);
    const suiAt = (idx) => Object.entries(sui || {}).filter(([, v]) => v === idx).map(([s]) => s);
    const jiangAt = (idx) => Object.entries(jiang || {}).filter(([, v]) => v === idx).map(([s]) => s);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const off = ZW_ROW_OFF[r][c], idx = ((lMing - off) % 12 + 12) % 12;   // 流年命宫在 lMing，盘面按命宫偏移布 12 地支
        const gong = (lMing - idx + 12) % 12;                                 // 该地支宫的流年宫名（命宫=0）
        const gname = ZW_GONGS[gong];
        const stars = [];
        Object.entries(P.zhuyao).forEach(([s, i]) => {
          if (i === idx) {
            const b = zwBrightness(s, i);
            stars.push('<b>' + s + (b ? '<i class="zw-br">' + b.j + '</i>' : '') + '</b>');
          }
        });
        Object.entries(P.fuyao).forEach(([s, v]) => { if (typeof v === 'number' && v === idx) stars.push(s); });
        const sh = Object.keys(lSihua || {}).filter((k) => P.zhuyao[lSihua[k]] === idx).map((k) => '流★' + k);
        const marks = [];
        if (idx === lMing) marks.push('<em>流命</em>');
        if (idx === douJun) marks.push('<em style="border-color:#7f9fd0;color:#7f9fd0;">斗君</em>');
        if (lMu && idx === lMingYue) marks.push('<em style="border-color:#7fd09a;color:#7fd09a;">流月</em>');
        const liuTxt = liuAt(idx), shenTxt = suiAt(idx).concat(jiangAt(idx));
        cell.push('<td class="zw-cell' + (idx === lMing ? ' zw-ming' : '') + '"><div class="zw-gname">' + gname + ' <i>' + TY_DZ[idx] + '</i>' + marks.join('') + '</div>' +
          '<div class="zw-stars">' + (stars.join('<br>') || '<i class="ln">（空宫）</i>') + '</div>' +
          (sh.length ? '<div class="zw-sihua">' + sh.join(' ') + '</div>' : '') +
          (liuTxt.length ? '<div class="zw-liu">' + liuTxt.join(' ') + '</div>' : '') +
          (shenTxt.length ? '<div class="zw-liu ln">' + shenTxt.join(' ') + '</div>' : '') + '</td>');
      }
    }
    return '<table class="zw-pan"><tbody>' +
      '<tr>' + cell.slice(0, 4).join('') + '</tr>' +
      '<tr>' + cell.slice(4, 8).join('') + '</tr>' +
      '<tr>' + cell.slice(8, 12).join('') + '</tr>' +
      '</tbody></table>';
  }
  function zwFlowGo() {
    const y = parseInt($('zw-year').value, 10), mo = parseInt($('zw-month').value, 10), d = parseInt($('zw-day').value, 10);
    if (!y || !mo || !d) { $('zw-result').innerHTML = '<div class="err">请先填写出生日期</div>'; return; }
    const zi = zwIdx($('zw-hour').value), gender = $('zw-gender').value, ask = $('zw-ask').value;
    const ly = parseInt($('zw-ly').value, 10) || new Date().getFullYear();
    const lMu = $('zw-lm').value ? parseInt($('zw-lm').value, 10) : null;
    const lDay = $('zw-ld').value ? parseInt($('zw-ld').value, 10) : null;
    const lH = $('zw-lh').value ? zwIdx($('zw-lh').value) : null;
    if (lDay !== null && (lDay < 1 || lDay > 31)) { $('zw-result').innerHTML = '<div class="err">流日须在 1-31 之间</div>'; return; }
    if (ly < 1900 || ly > 2199) { $('zw-result').innerHTML = '<div class="err">流年须在 1900-2199 之间</div>'; return; }
    // 排本命盘（与 zwGo 同公式；含晚子时换日落实到排盘 + 闰月通行口径）
    let offDays = 0;
    const ziRaw = zi;
    if (ziRaw === 0) {
      const clockStr = ($('zw-clock') && $('zw-clock').value || '').trim();
      let isLate = false;
      if (clockStr !== '') { const m = clockStr.match(/^(\d{1,2}):(\d{2})$/); if (m && +m[1] === 23) isLate = true; }
      else { const cH = (23 + 1) % 24; if (cH === 0) isLate = false; } // 缺省子时=00:00 早子时
      if (isLate) { const lateMode = ($('zw-late') && $('zw-late').value) || 'next-day'; offDays = (lateMode === 'next-day' || lateMode === 'day-cur-time-next') ? 1 : 0; }
    }
    const eff = new Date(y, mo - 1, d + offDays);
    const effY = eff.getFullYear(), effMo = eff.getMonth() + 1, effD = eff.getDate();
    let lunar = null;
    try { lunar = Lunar.fromDate(new Date(effY, effMo - 1, effD)); } catch (e) { lunar = null; }
    const lM = lunar ? Math.abs(lunar.getMonth()) : effMo;
    const leap = lunar ? lunar.getMonth() < 0 : false;
    const lD = lunar ? Math.abs(lunar.getDay()) : effD;   // 农历日（紫微定位/三台八座须用农历日；2026-10-27 金标修复，与 zwGo 同口径）
    const sizhu = tySizhu(effY, effMo, effD, zi);
    const zwY = zwYearGz(lunar, ($('zw-yearrule') && $('zw-yearrule').value) || 'zhnegchu');
    const yGan = zwY ? zwY.g : TY_TG.indexOf(sizhu.year[0]), yZhi = zwY ? zwY.z : TY_DZ.indexOf(sizhu.year[1]);
    const yGzSrc = zwY ? zwY.src : '立春近似（农历历表未加载）';
    const zwYearDisp = TY_TG[yGan] + TY_DZ[yZhi];
    const ms = zwMingShen(lM, zi, leap, lD);
    const mgz = TY_TG[zwGongGan(yGan, ms.ming)] + TY_DZ[ms.ming];
    const ju = zwJu(mgz);
    if (!ju) { $('zw-result').innerHTML = '<div class="err">命宫纳音未收录</div>'; return; }
    const ziwei = zwZiwei(ju, lD), zhuyao = zwZhuyao(ziwei);
    const shun = (yGan % 2 === 0 && gender === '男') || (yGan % 2 === 1 && gender === '女');
    const fuyao = zwFuyao({ yGan, yZhi, month: lM, day: lD, zi, ming: ms.ming, ju, shun });
    const sihua = zwSihua(yGan);
    const P = { ming: ms.ming, shen: ms.shen, zhuyao, fuyao, sihua };
    // 流年干支（按年支换年口径选项：正月初一/立春；用流年 2/15 定农历年——2/15 必在正月初一后，正月初一口径下年支为流年农历年）
    let lyLunar = null;
    try { lyLunar = Lunar.fromDate(new Date(ly, 2, 15)); } catch (e) { lyLunar = null; }
    const lyZWY = zwYearGz(lyLunar, ($('zw-yearrule') && $('zw-yearrule').value) || 'zhnegchu');
    const lySz = tySizhu(ly, 2, 4, 0);
    const lyGan = lyZWY ? lyZWY.g : TY_TG.indexOf(lySz.year[0]), lyZhi = lyZWY ? lyZWY.z : TY_DZ.indexOf(lySz.year[1]);
    const lMing = lyZhi;                                   // 流年命宫 = 流年太岁宫
    const lSihua = zwSihua(lyGan);                         // 流年四化（流年干）
    const douJun = ((lyZhi + 1 - lM + zi) % 12 + 12) % 12; // 斗君（正月）：太岁宫起正月逆数至生月，生月宫起子顺至生时
    const lMingYue = lMu ? ((douJun + lMu - 1) % 12 + 12) % 12 : null;
    // 流日/流时：流日宫=流月宫起初一顺布一日一宫；流时宫=流日宫起子时顺布
    const lMingDay = lDay !== null && lMingYue !== null ? ((lMingYue + lDay - 1) % 12 + 12) % 12 : null;
    const lMingHour = lMingDay !== null && lH !== null ? ((lMingDay + lH) % 12 + 12) % 12 : null;
    // 流月干（流年干五虎遁正月寅月干，顺数月）；流月四化按流月干
    const zyGanYin = WUHU[lyGan % 5];
    const yueGan = lMu ? (TY_TG.indexOf(zyGanYin) + lMu - 1) % 10 : null;
    const lSihuaYue = yueGan !== null ? zwSihua(yueGan) : null;
    // 流耀（按流年干支）+ 岁建/将前十二神（按流年支）+ 小限联动（小限按虚岁一年一宫）
    const liu = zwLiuXing(TY_TG[lyGan], lyZhi);
    const sui = zwSuiQian(lyZhi);
    const jiang = zwJiangQian(lyZhi);
    const xiaoxianAge = ly - y + 1;
    const xx = xiaoxianAge >= 1 ? zwXiaoxian(yZhi, gender, xiaoxianAge) : null;
    // ── 渲染 ──
    let h = '<div class="src-line">流年/流月运限层 · ' + ly + ' 年（' + TY_TG[lyGan] + TY_DZ[lyZhi] + '年）' + (lMu ? ' · 流月 ' + lMu + ' 月' : ' · 全年') + (lDay ? ' · 流日 ' + lDay : '') + (lH !== null ? ' · 问时 ' + TY_DZ[lH] + '时' : '') + '</div>';
    h += '<div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:10px;">';
    h += '<span class="tag g">流年命宫 ' + TY_DZ[lMing] + '（太岁宫安命）</span>';
    h += '<span class="tag b">斗君（正月）' + TY_DZ[douJun] + '</span>';
    if (lMu) h += '<span class="tag p">流月命宫 ' + TY_DZ[lMingYue] + '（斗君顺布 ' + lMu + ' 月）</span>';
    if (lMingDay !== null) h += '<span class="tag">流日命宫 ' + TY_DZ[lMingDay] + '（流月宫起初一顺布）</span>';
    if (lMingHour !== null) h += '<span class="tag">流时命宫 ' + TY_DZ[lMingHour] + '（流日宫起子时顺布）</span>';
    if (xx !== null) h += '<span class="tag">小限 ' + TY_DZ[xx] + ' 宫（虚岁 ' + xiaoxianAge + '，生年三合库宫起男顺女逆）</span>';
    h += '<span class="tag y">流年四化（' + TY_TG[lyGan] + '）：' + (lSihua ? Object.entries(lSihua).map(([k, v]) => k + '=' + v).join(' ') : '原文未载') + '</span>';
    if (lSihuaYue) h += '<span class="tag">流月四化（' + TY_TG[yueGan] + '）：' + Object.entries(lSihuaYue).map(([k, v]) => k + '=' + v).join(' ') + '</span>';
    h += '</div>';
    h += zwFlowPanHtml(P, lMing, douJun, lMingYue, lSihua, lMu, liu, sui, jiang);
    // 流耀 / 岁前将前十二神
    h += '<div class="card" style="margin-top:10px;"><h3>流耀（按流年干支）</h3><div class="item-block"><span class="k">流魁流钺</span><span>' +
      Object.entries(liu).filter(([s]) => s === '流魁' || s === '流钺').map(([s, v]) => s + '=' + TY_DZ[v]).join('　') + '（按流年干，查法同本命魁钺）</span></div>' +
      '<div class="item-block"><span class="k">流昌流曲</span><span>' + Object.entries(liu).filter(([s]) => s === '流昌' || s === '流曲').map(([s, v]) => s + '=' + TY_DZ[v]).join('　') + '（"流昌起巳位，甲乙顺流去，不用四墓宫"）</span></div>' +
      '<div class="item-block"><span class="k">流禄羊陀</span><span>' + Object.entries(liu).filter(([s]) => s === '流禄' || s === '流羊' || s === '流陀').map(([s, v]) => s + '=' + TY_DZ[v]).join('　') + '（禄存按流年干，羊前陀后）</span></div>' +
      '<div class="item-block"><span class="k">流马流鸾流喜</span><span>' + Object.entries(liu).filter(([s]) => s === '流马' || s === '流鸾' || s === '流喜').map(([s, v]) => s + '=' + TY_DZ[v]).join('　') + '（流马按流年支天马；流鸾流喜按流年支红鸾天喜，卯起子年逆）</span></div>' +
      '<div class="item-block"><span class="k">年解</span><span>' + (liu['年解'] !== undefined ? '年解=' + TY_DZ[liu['年解']] : '') + '（戌起子逆数至流年支）</span></div>' +
      '<div class="src-line" style="margin-top:4px;">注：流火流铃需流年支+流时支起（iztro 流耀层未含，本引擎同未实现）；流曜按流年干支起、查法同原盘（《精成》"流魁流钺流禄流羊流陀及流化星均依大限流年流月流日流时天干为准推查，查法和原命盘推查方法一样；流鸾流喜则以流支为准"）。</div></div>';
    h += '<div class="card" style="margin-top:10px;"><h3>流年神煞（按流年支）</h3>' +
      '<div class="item-block"><span class="k">岁建十二神</span><span>' + Object.entries(sui).map(([s, v]) => s + TY_DZ[v]).join('　') + '</span></div>' +
      '<div class="item-block"><span class="k">将前十二神</span><span>' + Object.entries(jiang).map(([s, v]) => s + TY_DZ[v]).join('　') + '</span></div>' +
      '<div class="src-line" style="margin-top:4px;">岁建十二神：岁建=流年支顺布（岁建、晦气、丧门、贯索、官符、小耗、大耗、龙德、白虎、天德、吊客、病符）；将前十二神：将星=流年支三合局之首（申子辰→子、寅午戌→午、巳酉丑→酉、亥卯未→卯）顺布（将星、攀鞍、岁驿、息神、华盖、劫煞、灾煞、天煞、指背、咸池、月煞、亡神）。顺序与起法依东派斗数/中州派流曜总论。</div></div>';
    // 流年命宫断语（星取本命盘该宫之星）
    h += '<div class="card" style="margin-top:10px;"><h3>流年命宫断（' + TY_DZ[lMing] + '宫 · 星取本命盘）</h3>' +
      zwDuanMain(lMing, ms.shen, zhuyao, gender, lyGan, lyZhi).join('') + '</div>';
    if (ask && ZW_ASK_MAP[ask] !== undefined) {
      const gi = ZW_ASK_MAP[ask];
      const flowGong = ((lMing - gi + 12) % 12);   // 问事宫位对应的流年地支
      const sIn = Object.keys(P.zhuyao).filter((s) => P.zhuyao[s] === flowGong);
      h += '<div class="card" style="margin-top:10px;"><h3>问事流年聚焦 · ' + ZW_GONGS[gi] + '（' + TY_DZ[flowGong] + '宫）</h3>' +
        '<div class="item-block"><span class="k">所落主星</span><span>' + (sIn.length ? sIn.join('、') : '（空宫，借对宫' + ZW_GONGS[(gi + 6) % 12] + '：' + (zwBorrowStars(gi, P.zhuyao).oppStars.join('/') || '空') + '）') + '</span></div></div>';
    }
    h += '<div class="src-line" style="margin-top:6px;">口径：《全书·安斗君诀》"太岁宫中便起正，逆寻生月即留停，又从生月宫轮子，顺至生时镇斗星"——流年命宫=太岁宫；斗君=(流年支序+1−生月+生时序)mod 12；流月命宫=斗君顺布，一月一宫；流日=流月宫起初一顺布一日一宫；流时=流日宫起子时顺布。流年四化按流年干、流月四化按流月干（流年干五虎遁正月）。流年盘星曜不动、宫轮值（星取本命盘对应宫）。《精成》云流年"以流年支落宫的星情为主""流年只看大限和流年两组四化"。流昌曲表按 iztro 开源实现（丙戊同、丁己同）。输入指纹 <code>' + inputHash(ly, lMu || '', lDay || '', lH === null ? '' : TY_DZ[lH], y, mo, d, zi, gender) + '</code></div>';
    $('zw-result').innerHTML = h;
  }
  function zwInit() {
    if (!D || !D.ziwei) return;
    const now = new Date();
    $('zw-year').value = String(now.getFullYear());
    $('zw-month').value = String(now.getMonth() + 1);
    $('zw-day').value = String(now.getDate());
    $('zw-hour').value = TY_HOURS[Math.floor((now.getHours() + 1) / 2) % 12];
    $('zw-ly').value = String(now.getFullYear());
    $('zw-go').addEventListener('click', zwGo);
    $('zw-flow').addEventListener('click', zwFlowGo);
    const nihaiGo = () => { $('zw-nihai-res').innerHTML = zwNihaiSearch($('zw-nihai-kw').value); };
    $('zw-nihai-go').addEventListener('click', nihaiGo);
    $('zw-nihai-kw').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') nihaiGo(); });
    zwCityInit();
  }

  // 出生城市三级联动（省→市→县）→ 自动填经度到 zw-lon（数据：kinastro/MIT 现代整理层，非古籍）
  function zwCityInit() {
    const cd = D && D.ziwei && D.ziwei.cities;
    const selP = $('zw-city-p'), selC = $('zw-city-c'), selD = $('zw-city-d'), note = $('zw-city-note');
    if (!cd || !cd.provinces || !selP || !note) return;
    let curP = null, curC = null, curD = null;
    const fillLon = () => {
      let lng = null, lat = null, nm = null;
      if (curD && curD.lng != null) { lng = curD.lng; lat = curD.lat; nm = curP.n + (curC && curC.n !== curP.n ? '·' + curC.n : '') + '·' + curD.n; }
      else if (curC && curC.lng != null) { lng = curC.lng; lat = curC.lat; nm = curP.n + '·' + curC.n; }
      else if (curP && curP.lng != null) { lng = curP.lng; lat = curP.lat; nm = curP.n; }
      if (lng != null) {
        $('zw-lon').value = lng.toFixed(2);
        note.textContent = '已选：' + nm + '（东经' + lng.toFixed(1) + '° 北纬' + lat.toFixed(1) + '°）';
      } else { note.textContent = ''; }
    };
    const doSelD = () => {
      selD.innerHTML = '<option value="">县/区</option>';
      curD = null;
      if (curC) {
        curC.districts.forEach((d) => {
          const o = document.createElement('option');
          o.value = d.n; o.textContent = d.n; selD.appendChild(o);
        });
        if (curC.districts.length === 1) { selD.value = curC.districts[0].n; curD = curC.districts[0]; }
      }
      fillLon();
    };
    const doSelC = () => {
      selD.innerHTML = '<option value="">县/区</option>';
      curC = curP && curP.cities.find((c) => c.n === selC.value) || null;
      doSelD();
    };
    cd.provinces.forEach((p) => {
      const o = document.createElement('option');
      o.value = p.n; o.textContent = p.n; selP.appendChild(o);
    });
    selP.addEventListener('change', () => {
      selC.innerHTML = '<option value="">市/地区</option>';
      curP = cd.provinces.find((p) => p.n === selP.value) || null;
      curC = null; curD = null;
      if (curP) {
        curP.cities.forEach((c) => {
          const o = document.createElement('option');
          o.value = c.n; o.textContent = c.n + (c.districts.length > 1 ? '（' + c.districts.length + '）' : '');
          selC.appendChild(o);
        });
        if (curP.cities.length === 1) { selC.value = curP.cities[0].n; doSelC(); return; }
      }
      doSelD();
    });
    selC.addEventListener('change', doSelC);
    selD.addEventListener('change', () => { curD = curC && curC.districts.find((d) => d.n === selD.value) || null; fillLon(); });
  }

  // ================= 紫微斗数·十八飞星（feixing.json） =================
  const FX_STARS = ['紫微', '天虚', '天贵', '天印', '天寿', '天空', '红鸾', '天库', '天贯', '文昌', '天福', '天禄', '天杖', '天异', '毛头', '天刃', '天刑', '天姚', '天哭'];
  const FX_LIUHE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
  const FX_LN_SHEN = ['太岁', '太阳', '丧门', '太阴', '官符', '死符', '岁破', '龙德', '白虎', '福星', '吊客', '病符'];
  function fxStars(yZhi, month) {
    const out = {};
    const add = (s, i) => { out[s] = ((i % 12) + 12) % 12; };
    const ziwei = (7 + yZhi) % 12;                       // 未宫起子年顺数至生年支
    add('紫微', ziwei);
    [['天虚', -1], ['天贵', -2], ['天印', -3], ['天寿', -4], ['天空', -5], ['红鸾', -6], ['天库', -7], ['天贯', -8], ['文昌', -9], ['天福', -10], ['天禄', -11]]
      .forEach(([s, k]) => add(s, ziwei + k));            // 逆布
    const zhang = (0 - (month - 1)) % 12;                 // 子宫起正月逆数
    add('天杖', zhang); add('天异', zhang - 1); add('毛头', zhang - 2); add('天刃', zhang - 3);
    add('天刑', (9 + month - 1) % 12);                    // 酉起月顺
    add('天姚', (1 + month - 1) % 12);                    // 丑起月顺
    add('天哭', zwIdx(FX_LIUHE[TY_DZ[yZhi]]));            // 生年六合
    return out;
  }
  function fxMingShen(zhang, day, zi) {
    const ming = (zhang + zi) % 12;                        // 杖宫起子时顺数至生时
    const off = Math.floor((day - 1) / 2.5);               // 身宫：杖宫逆数一宫两日半（六日午未过宫细则未实现，标注）
    const shen = ((zhang - off) % 12 + 12) % 12;
    return { ming, shen };
  }
  function fxPanHtml(P) {
    const cell = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const off = ZW_ROW_OFF[r][c], idx = ((P.ming - off) % 12 + 12) % 12;
        const gname = ZW_ROW_NAMES[r][c];
        const stars = [];
        Object.entries(P.stars).forEach(([s, i]) => { if (i === idx) stars.push('<b>' + s + '</b>'); });
        if (P.ln) P.ln.forEach((x) => { if (x.idx === idx) stars.push('<i class="ln">' + x.name + '</i>'); });
        cell.push('<td class="zw-cell' + (idx === P.ming ? ' zw-ming' : '') + (idx === P.shen ? ' zw-shen' : '') + '"><div class="zw-gname">' + gname +
          (idx === P.ming ? ' <em>命</em>' : '') + (idx === P.shen ? ' <em>身</em>' : '') + '</div>' +
          '<div class="zw-stars">' + stars.join('<br>') + '</div>' +
          (P.daxian && P.daxian[idx] ? '<div class="zw-lim">' + P.daxian[idx] + '</div>' : '') + '</td>');
      }
    }
    return '<table class="zw-pan"><tbody>' +
      '<tr>' + cell.slice(0, 4).join('') + '</tr>' +
      '<tr>' + cell.slice(4, 8).join('') + '</tr>' +
      '<tr>' + cell.slice(8, 12).join('') + '</tr>' +
      '</tbody></table>';
  }
  // 古籍机判层 · 紫微：每类按钮行（zw 十四主星 / fx 十八飞星 共用）
  function zwGjBtnRow(cats) {
    if (!cats || !cats.length) return '';
    return '<div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0;">' +
      cats.map((c, i) => '<button class="act ln-mini zw-gj-btn" data-i="' + i + '">' + esc(c.name) + '</button>').join('') + '</div>';
  }
  // 单类机判盒子：机判命中（绿）+ 活步骤（红字加粗）+ 未命中不假装
  function zwGjBoxHtml(cat, P, fxMode) {
    let hits = [];
    try { hits = fxMode ? ZW_GUJI.fxGuJiHits(cat, P) : ZW_GUJI.zwGuJiHits(cat, P); } catch (e) { hits = []; }
    let s = '';
    if (hits.length) {
      s += '<div style="color:#8fbf8f;font-weight:700;margin:4px 0;">机判命中 ' + hits.length + ' 条</div>' +
        hits.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc(x.cond) + '</b><span style="color:var(--tx2);">——' + esc(x.duan) + '</span><div class="src">' + esc(x.src) + '</div></div>').join('');
    } else {
      s += '<div class="muted">本盘未命中「' + esc(cat.name) + '」的机判规则——未命中不假装，可参考下方活步骤。</div>';
    }
    (cat.huobu || []).forEach(hu => {
      s += '<div style="margin:8px 0 2px;color:#e06c6c;font-weight:800;">活步骤 · ' + esc(hu.title) + '（需人工对照命盘逐步判断）</div>' +
        '<div style="color:#e08a8a;line-height:1.9;font-weight:700;">' + hu.steps.map((st, k) => (k + 1) + '. ' + esc(st)).join('<br>') + '</div>';
    });
    return s;
  }
  function fxGo() {
    const y = parseInt($('fx-year').value, 10), mo = parseInt($('fx-month').value, 10), d = parseInt($('fx-day').value, 10);
    if (!y || !mo || !d || y < 1) { $('fx-result').innerHTML = '<div class="err">请输入完整公历年月日</div>'; return; }
    const zi = zwIdx($('fx-hour').value), gender = $('fx-gender').value;
    let lunar = null;
    try { lunar = Lunar.fromDate(new Date(y, mo - 1, d)); } catch (e) { lunar = null; }
    const lM = lunar ? Math.abs(lunar.getMonth()) : mo;
    const sizhu = tySizhu(y, mo, d, zi);
    const zwY = zwYearGz(lunar, ($('zw-yearrule') && $('zw-yearrule').value) || 'zhnegchu');
    const yGan = zwY ? zwY.g : TY_TG.indexOf(sizhu.year[0]), yZhi = zwY ? zwY.z : TY_DZ.indexOf(sizhu.year[1]);
    const yGzSrc = zwY ? zwY.src : '立春近似（农历历表未加载）';
    const zwYearDisp = TY_TG[yGan] + TY_DZ[yZhi];
    const stars = fxStars(yZhi, lM);
    const zhang = stars['天杖'];
    const ms = fxMingShen(zhang, d, zi);
    // 大限：阳男阴女命宫顺十年一宫；阴男阳女申宫逆（原文直译，疑"申宫"为"命宫"抄误）
    const yang = yGan % 2 === 0;
    const shunD = (yang && gender === '男') || (!yang && gender === '女');
    const daxian = {};
    for (let k = 0; k < 12; k++) {
      const idx = shunD ? ((ms.ming + k) % 12 + 12) % 12 : ((8 - k) % 12 + 12) % 12;
      daxian[idx] = (daxian[idx] || '') + ((10 * k + 1) + '-' + (10 * k + 10) + '岁');
    }
    // 小运：阳男阴女申宫逆、阴男阳女命宫顺（一年一宫）
    const ln = [];
    for (let k = 0; k < 12; k++) {
      const idx = (yang && gender === '男') ? ((8 - k) % 12 + 12) % 12 : ((ms.ming + k) % 12 + 12) % 12;
      ln.push({ name: FX_LN_SHEN[k], idx });
    }
    const P = { ming: ms.ming, shen: ms.shen, stars, daxian, ln };
    let h = '<div class="src-line">十八飞星紫微斗数（别本·术天机照胆经）· ' + esc(y + '-' + mo + '-' + d) + ' ' + esc($('fx-hour').value) + '时 ' + (gender === '男' ? '男' : '女') + '命　四柱' + esc(sizhu.year) + ' ' + esc(sizhu.month) + ' ' + esc(sizhu.day) + ' ' + esc(sizhu.hour) + '</div>';
    h += '<div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:10px;">';
    h += '<span class="tag b">命宫' + TY_DZ[ms.ming] + '（杖' + TY_DZ[zhang] + '宫起' + esc($('fx-hour').value) + '时顺数）</span>';
    h += '<span class="tag g">身宫' + TY_DZ[ms.shen] + '（杖宫逆数一宫两日半）</span>';
    h += '<span class="tag p">大限' + (shunD ? '命宫顺行' : '申宫逆行') + '</span>';
    h += '</div>';
    h += fxPanHtml(P);
    // 断语
    h += '<div class="card" style="margin-top:10px;"><h3>断语（素材库查表）</h3>';
    const sk = D.feixing.shike_parsed[TY_DZ[zi]];
    if (sk) h += '<div class="item-block"><span class="k">命星时刻度数·' + TY_DZ[zi] + '时</span><span>' + Object.entries(sk).map(([k2, v]) => k2 + '：' + esc(v)).join('　') + '</span></div>';
    h += '<h3 style="margin-top:10px">十八星·十二宫断语</h3>';
    for (let g = 1; g <= 11; g++) {
      const gname = ZW_GONGS[g];
      const seg = D.feixing.gongduan[g - 1];
      if (!seg) continue;
      const starsIn = Object.keys(P.stars).filter((s) => P.stars[s] === g);
      if (!starsIn.length) continue;
      const lines = seg.text.split('\n').filter((l) => l.trim());
      const hit = lines.filter((l) => starsIn.some((s) => l.includes(s)));
      h += '<div class="item-block"><span class="k">' + gname + '宫</span><span class="stars">' + starsIn.join('、') + '</span><span>' +
        (hit.length ? hit.slice(0, 2).map((l) => esc(l)).join('；') : esc(seg.text.slice(0, 140))) + '</span></div>';
    }
    const dw = D.feixing.dongwei_parsed;
    const mStar = Object.keys(P.stars).find((s) => P.stars[s] === ms.ming);
    if (mStar && dw[mStar]) h += '<div class="item-block"><span class="k">洞微十八星断·' + mStar + '（命宫）</span><span>' + esc(dw[mStar].slice(0, 220)) + '</span></div>';
    const sStar = Object.keys(P.stars).find((s) => P.stars[s] === ms.shen);
    if (sStar && sStar !== mStar && dw[sStar]) h += '<div class="item-block"><span class="k">洞微十八星断·' + sStar + '（身宫）</span><span>' + esc(dw[sStar].slice(0, 220)) + '</span></div>';
    // ① 定死生诀·九阳九阴（命宫星×宫阴阳断福祸）
    const YANG_GONG = [0, 2, 4, 6, 8, 10];
    const mingStars = Object.keys(P.stars).filter((s) => P.stars[s] === ms.ming);
    const jiuyangHit = mingStars.filter((s) => D.feixing.jiuyang.includes(s));
    const jiuyinHit = mingStars.filter((s) => D.feixing.jiuyin.includes(s));
    const yinYang = YANG_GONG.includes(ms.ming) ? '阳' : '阴';
    if (jiuyangHit.length || jiuyinHit.length) {
      const parts = [];
      jiuyangHit.forEach((s) => parts.push(s + '（九阳星·' + yinYang + '宫' + (yinYang === '阳' ? '→福重而灾轻' : '→福轻而灾重') + '）'));
      jiuyinHit.forEach((s) => parts.push(s + '（九阴星·' + yinYang + '宫' + (yinYang === '阴' ? '→福重而灾轻' : '→灾重而福轻') + '）'));
      h += '<div class="item-block" style="border-color:#5a8f5a55"><span class="k">定死生诀·九阳九阴（命宫星×宫阴阳，原文直查）</span><span>' + esc(parts.join('　')) + '</span></div>';
    }
    // ② 星行限吉凶论（命宫/身宫/大限初宫所落星查表）
    const xx = D.feixing.xianxing_parsed;
    const xxAlias = { '天贯': '贯索', '天空': '' };
    const xxHits = [];
    const showXx = (label, idx) => {
      const st = Object.keys(P.stars).find((s) => P.stars[s] === idx);
      if (!st) return;
      const key = xxAlias[st] || st;
      if (key && xx[key]) xxHits.push('<div class="item-block"><span class="k">星行限·' + label + '（' + TY_DZ[idx] + '宫落' + st + '）</span><span>' + esc(xx[key].slice(0, 110)) + '…</span></div>');
    };
    showXx('命', ms.ming);
    showXx('身', ms.shen);
    showXx('大限初', shunD ? ms.ming : 8);
    if (xxHits.length) h += '<h3 style="margin-top:10px">星行限吉凶论（按限宫所落星查表，原文逐星断）</h3>' + xxHits.join('');
    // ③ 九吉九凶入庙例（命宫星属吉/凶 × 强弱宫粗判；庙旺宫位表已内置：ziwei_brightness.json 古籍双源）
    const JIU_JI = ['紫微', '文昌', '红鸾', '天贵', '天福', '天禄', '天印', '天寿', '天库'];
    const JIU_XIONG = ['天刑', '天异', '天刃', '天杖', '天虚', '天哭', '毛头', '天姚'];
    const jj = mingStars.filter((s) => JIU_JI.includes(s));
    const jx = mingStars.filter((s) => JIU_XIONG.includes(s));
    if (jj.length || jx.length) {
      const qiangName = [ms.ming, (ms.ming + 9) % 12, (ms.ming + 1) % 12, (ms.ming + 3) % 12].includes(ms.ming);
      const pts = [];
      jj.forEach((s) => pts.push(s + '（九吉星·' + (qiangName ? '强宫→主荣贵' : '弱宫→吉力减') + '）'));
      jx.forEach((s) => pts.push(s + '（九凶星·' + (qiangName ? '居强主福（原文庙旺照身命为福）' : '弱宫→为祸（原文不居庙旺为祸）') + '）'));
      h += '<div class="item-block" style="border-color:#8f5a5a55"><span class="k">九吉九凶入庙例（命宫星吉凶×强弱宫；庙旺宫位表已内置，强宫按命/官禄/财帛/田宅粗判）</span><span>' + esc(pts.join('　')) + '</span></div>';
    }
    // 古籍机判层（十八飞星断语库：定死生诀/九吉九凶/入骨仙经/直指序/洞微/星行限——能机判的机判，不能的活步骤红字）
    const fxGJC = (D.feixing && D.feixing.guji_cat) || { cats: [] };
    if (fxGJC.cats.length) {
      h += '<h3 style="margin-top:10px">古籍机判层（十八飞星断语库 · 能机判的机判，不能的活步骤红字）</h3>' + zwGjBtnRow(fxGJC.cats) +
        fxGJC.cats.map((c, i) => '<div class="zw-gj-box" id="fx-gj-' + i + '" style="display:none;margin:4px 0 8px;padding:8px;background:rgba(0,0,0,.16);border-radius:8px;"></div>').join('');
    }
    // 原文库·选项法（分类查看：逐星/逐时条目化 + 单篇全文）
    const fxLibGroups = [
      { name: '星行限·逐星', items: Object.entries(D.feixing.xianxing_parsed).map(([s, t]) => ({ title: s + '拱限', text: t })) },
      { name: '时刻度数·逐时', items: Object.entries(D.feixing.shike_parsed).map(([shi, ks]) => ({ title: shi + '时', text: Object.entries(ks).map(([k2, v]) => k2 + '：' + v).join('　') })) },
      { name: '星行限全文', items: [{ title: '星行限吉凶论（全文）', text: D.feixing.xianxing }] },
      { name: '入骨仙经', items: [{ title: '入骨仙经四言总断', text: D.feixing.rugu }] },
      { name: '定死生诀', items: [{ title: '定死生诀（含身溺江湖等格）', text: D.feixing.jisi }] },
      { name: '九吉九凶', items: [{ title: '九吉九凶入庙例', text: D.feixing.jiujiu }] },
      { name: '直指序', items: [{ title: '术天机照胆经直指序', text: D.feixing.zhixu }] },
      { name: '时刻度数全文', items: [{ title: '命星时刻度数总论（全文）', text: D.feixing.shike }] },
    ];
    h += libBox('十八飞星原文库（分类查看）', fxLibGroups);
    h += '<div class="src-line">安星按《紫微斗数（别本）·术天机照胆经》直译；原文"阴男阳女从申宫逆数"疑为"命宫"抄误，按原文直译并标注；身宫"一宫两日半"六日午未过宫细则未实现（按整宫偏移）。断语全部原文照录，未改写。</div>';
    h += '</div>';
    $('fx-result').innerHTML = h;
    // 古籍机判层 · 十八飞星：类按钮 → 机判命中 + 活步骤红字（惰性渲染）
    document.querySelectorAll('.zw-gj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i, 10);
        const box = document.getElementById('fx-gj-' + i);
        if (!box) return;
        if (box.style.display === 'none') {
          box.style.display = 'block';
          if (!box.dataset.rendered) {
            box.dataset.rendered = '1';
            const cat = ((D.feixing && D.feixing.guji_cat) || { cats: [] }).cats[i];
            if (cat) box.innerHTML = zwGjBoxHtml(cat, { ming: P.ming, shen: P.shen, stars: P.stars, gender: gender }, true);
          }
        } else {
          box.style.display = 'none';
        }
      });
    });
  }
  function fxInit() {
    if (!D || !D.feixing) return;
    const now = new Date();
    $('fx-year').value = String(now.getFullYear());
    $('fx-month').value = String(now.getMonth() + 1);
    $('fx-day').value = String(now.getDate());
    $('fx-hour').value = TY_HOURS[Math.floor((now.getHours() + 1) / 2) % 12];
    $('fx-go').addEventListener('click', fxGo);
  }

  // ================= 解梦引擎（周公解梦 988 / 现代库 9467 / 古今图书集成·梦部） =================
  (() => {
    const escRe = /[.*+?^${}()|[\]\\]/g;
    const DREAM_TERM = /^梦(?:见|中|到|得|与|有|入|飞|游)?$/;
    const PREFIX_RE = /^梦(?:见|中|到|得|与|有|入|飞|游)?/;
    const PINYIN_RE = /^[a-zA-Z]+$/;
    let lastRaw = '', lastBlocks = null;

    function coreOf(kw) { if (DREAM_TERM.test(kw)) return kw; const c = kw.replace(PREFIX_RE, ''); return c || kw; }
    function bigrams(s) { const g = []; for (let i = 0; i + 2 <= s.length; i++) g.push(s.slice(i, i + 2)); return g; }
    function titleScore(t, w) { if (t === w) return 2; if (t.startsWith(w)) return 1; if (t.includes(w)) return 0; return -1; }
    function pinScore(p, w) {
      if (!p) return -1;
      if (p.zym === w || p.py === w) return 3;
      if (w.length >= 2 && p.zym.includes(w)) return 2;
      if (w.length >= 2 && p.py.includes(w)) return 1;
      return -1;
    }

    function lookupDream(kw, opts) {
      opts = opts || {};
      const out = { d988: [], modern: [], guji: [], terms: [], hitBy: { d988: {}, modern: {}, guji: {} }, fanmeng: [], resultRev: [], symbol: [], isPin: false };
      if (!kw || !D.dream) return out;
      const sec = $('sec-select').value;
      const kk = $('k-select').value;
      const MAP = D.dream.map || {};
      const PY = D.dream.pinyin || { d988: {}, modern: {} };
      const SPD = D.dream.spread || { syn: [], result: { entries: [] }, symbol: [] };
      const isPin = PINYIN_RE.test(kw);
      out.isPin = isPin;
      const wPin = kw.toLowerCase();
      const terms = [kw];
      if (!isPin && opts.xieyin !== false) {
        const groups = [].concat(MAP.xieyin || [], MAP.bixiang || []);
        for (const g of groups) {
          if (g.key === kw || (g.aliases || []).includes(kw)) {
            [g.key].concat(g.aliases || []).forEach(w => { if (!terms.includes(w)) terms.push(w); });
          }
        }
      }
      if (!isPin && opts.syn !== false) {
        for (const g of (SPD.syn || [])) {
          if ((g.group || []).includes(kw)) { g.group.forEach(w => { if (!terms.includes(w)) terms.push(w); }); }
        }
      }
      out.terms = terms;
      if (opts.fanmeng !== false) {
        (MAP.fanmeng || []).forEach(f => {
          if (kw.includes(f.dream) || f.dream.includes(kw)) out.fanmeng.push(f);
        });
      }
      if (!isPin) {
        (SPD.result.entries || []).forEach(r => {
          if (r.result.includes(kw) || kw.includes(r.result)) {
            out.resultRev.push({ r, sc: (r.result === kw ? 2 : (kw.includes(r.result) ? 1 : 0)) });
          }
        });
        out.resultRev.sort((a, b) => b.sc - a.sc);
        out.resultRev = out.resultRev.slice(0, 20).map(x => x.r);
      }
      if (!isPin) {
        (SPD.symbol || []).forEach(s => {
          if (kw.includes(s.dream) || s.dream.includes(kw)) out.symbol.push(s);
        });
      }
      const d988Cand = [];
      if (isPin) {
        (D.dream.d988.entries || []).forEach(e => {
          if (sec && String(e.sec) !== sec) return;
          if (kk && String(e.k) !== kk) return;
          const sc = pinScore(PY.d988[String(e.id)], wPin);
          if (sc >= 1) { d988Cand.push({ e, sc }); out.hitBy.d988[e.id] = wPin + '(拼音)'; }
        });
      } else {
        (D.dream.d988.entries || []).forEach(e => {
          if (sec && String(e.sec) !== sec) return;
          if (kk && String(e.k) !== kk) return;
          const sTitle = (e.s || e.t || '');
          const hay = ((e.s || '') + ' ' + (e.t || '') + ' ' + (e.en ? e.en.k : '')).toLowerCase();
          let best = -1, by = null;
          for (const w of terms) {
            const sc = titleScore(sTitle, w);
            if (sc > best) { best = sc; by = w; }
          }
          if (best < 0) { for (const w of terms) { if (hay.includes(w.toLowerCase())) { best = 0; by = w; break; } } }
          if (best >= 0) { d988Cand.push({ e, sc: best }); out.hitBy.d988[e.id] = by; }
        });
      }
      d988Cand.sort((a, b) => b.sc - a.sc);
      out.d988 = d988Cand.map(x => x.e);
      const modCand = [];
      if (isPin) {
        (D.dream.modern || []).forEach(m => {
          const sc = pinScore(PY.modern[String(m.id)], wPin);
          if (sc >= 1) { modCand.push({ m, sc }); out.hitBy.modern[m.id] = wPin + '(拼音)'; }
        });
      } else {
        const core = coreOf(kw);
        const grams = core.length >= 3 ? bigrams(core) : [];
        (D.dream.modern || []).forEach(m => {
          let best = -1, by = null;
          for (const w of terms) {
            const sc = titleScore(m.title, w);
            if (sc > best) { best = sc; by = w; }
          }
          if (best < 0 && core !== kw) { if (m.title.includes(core)) { best = 0; by = core + '(整句)'; } }
          if (best < 0) { for (const g of grams) { if (m.title.includes(g)) { best = 0; by = core + '(词元)'; break; } } }
          if (best >= 0) { modCand.push({ m, sc: best }); out.hitBy.modern[m.id] = by; }
        });
      }
      modCand.sort((a, b) => b.sc - a.sc);
      out.modern = modCand.map(x => x.m);
      terms.forEach(w => {
        let re;
        if (DREAM_TERM.test(w)) {
          re = new RegExp(w.replace(escRe, '\\$&'), 'g');
        } else {
          const core = w.replace(escRe, '\\$&').replace(PREFIX_RE, '');
          re = new RegExp('梦(?:见|中|到|得|与|有|入|飞|游)?' + core, 'g');
        }
        (D.dream.guji || []).forEach(s => {
          const t = s.text || '';
          re.lastIndex = 0;
          let m = re.exec(t), count = 0;
          while (m && count < 2) {
            const a = Math.max(0, m.index - 28), b = Math.min(t.length, m.index + 40);
            const key = s.name + '|' + t.slice(a, b);
            if (!out.hitBy.guji[key]) {
              out.hitBy.guji[key] = w;
              out.guji.push({ sec: s.name, snip: t.slice(a, b) });
            }
            m = re.exec(t);
            count++;
          }
        });
      });
      out.guji = out.guji.slice(0, 20);
      return out;
    }

    function mark(text, word) {
      const t = esc(text);
      if (!word || !t.includes(esc(word))) return t;
      const w = esc(word);
      return t.split(w).join('<mark>' + w + '</mark>');
    }

    function doQuery() {
      const raw = $('kw-input').value.trim();
      if (!raw) return;
      const blocks = lookupDream(raw, { xieyin: $('opt-xieyin').checked, fanmeng: $('opt-fanmeng').checked });
      lastRaw = raw;
      lastBlocks = blocks;
      recordHistory(raw, blocks);
      refreshSideRecent();
      renderResults(blocks, raw);
    }

    function recordHistory(raw, blocks) {
      try {
        const total = blocks.d988.length + blocks.modern.length + blocks.guji.length;
        const list = JSON.parse(localStorage.getItem('dream_history') || '[]');
        list.unshift({ t: new Date().toLocaleString('zh-CN', { hour12: false }), q: raw, hits: total });
        localStorage.setItem('dream_history', JSON.stringify(list.slice(0, 50)));
      } catch (e) { /* ignore */ }
    }

    function refreshSideRecent() {
      const host = $('detail');
      if (!host || host.querySelector('.side-back')) return;
      let hist = [];
      try { hist = JSON.parse(localStorage.getItem('dream_history') || '[]'); } catch (e) {}
      const box = host.querySelector('#side-recent');
      if (!box) return;
      box.innerHTML = hist.length ? hist.slice(0, 10).map(h =>
        `<div class="recent-item"><span class="k">${esc(h.q)}</span> · ${esc(h.t)} · ${h.hits} 条</div>`).join('')
        : '<p style="color:var(--tx3);font-size:12px;">暂无。解过的梦象会自动出现在这里。</p>';
      box.querySelectorAll('.recent-item').forEach(el => el.addEventListener('click', () => queryKw(el.querySelector('.k').textContent)));
    }

    function queryKw(kw) { $('kw-input').value = kw; doQuery(); }

    function renderResults(blocks, raw) {
      const box = $('results');
      const title = $('results-title');
      box.innerHTML = '';
      title.textContent = '';
      const total = blocks.d988.length + blocks.modern.length + blocks.guji.length;
      const modeTag = blocks.isPin ? '拼音检索 · ' : '';
      title.textContent = `「${raw}」· ${modeTag}共 ${total} 条命中（988 梦象 ${blocks.d988.length} / 现代库 ${blocks.modern.length} / 古籍 ${blocks.guji.length}）`;
      if (!total) {
        box.innerHTML = `<div class="miss-note">「${raw}」三路均无命中 —— 换一个更宽泛的关键词（如：水、火、血、蛇、车），或从右侧分类浏览中选类。</div>`;
        return;
      }
      if (blocks.fanmeng.length) {
        const card = document.createElement('div');
        card.className = 'hit-card fan-card';
        card.innerHTML = `<div class="hit-head"><span class="hit-char">反梦 · 古人反训</span><span class="hit-verdict mid">×${blocks.fanmeng.length}</span><span class="hit-src">见附录：传统圆梦"反训"说法，仅供参考</span></div>` +
          blocks.fanmeng.map(f =>
            `<div class="fan-row"><span style="color:#ffd9a0;">梦见${esc(f.dream)}</span> → 反训主 <span class="fan-inv">${esc(f.invert)}</span><br><span class="fan-basis">依据：${esc(f.basis)}</span></div>`).join('');
        box.appendChild(card);
      }
      if (blocks.resultRev.length) {
        const card = document.createElement('div');
        card.className = 'hit-card';
        card.innerHTML = `<div class="hit-head"><span class="hit-char">结果反查 · 逆推梦象</span><span class="hit-verdict mid">×${blocks.resultRev.length}</span><span class="hit-src">从 988 断语"梦象→主/得/至/有→结果"自动切分</span></div>` +
          blocks.resultRev.map(r =>
            `<div class="fan-row"><span style="color:#ffd9a0;">${esc(r.dream)}</span> → <span class="fan-inv">${esc(r.mark)}${esc(r.result)}</span><br><span class="fan-basis">988 原文：${esc(r.title)}</span></div>`).join('');
        box.appendChild(card);
      }
      if (blocks.symbol.length) {
        const card = document.createElement('div');
        card.className = 'hit-card';
        card.innerHTML = `<div class="hit-head"><span class="hit-char">古籍象征 · 梦象取象</span><span class="hit-verdict mid">×${blocks.symbol.length}</span><span class="hit-src">《梦书》《礼记集说》《灵枢经》定义句式</span></div>` +
          blocks.symbol.map(s =>
            `<div class="fan-row"><span style="color:#ffd9a0;">梦见${esc(s.dream)}</span> → 象征 <span class="fan-inv">${esc(s.symbol)}</span><br><span class="fan-basis">依据：${esc(s.basis)}</span></div>`).join('');
        box.appendChild(card);
      }
      const bar = document.createElement('div');
      bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:2px;';
      const b1 = document.createElement('button');
      b1.className = 'btn ghost'; b1.textContent = '导出 txt';
      b1.addEventListener('click', () => exportResults('txt'));
      const b2 = document.createElement('button');
      b2.className = 'btn ghost'; b2.textContent = '导出 json';
      b2.addEventListener('click', () => exportResults('json'));
      bar.appendChild(b1); bar.appendChild(b2);
      box.appendChild(bar);

      if (blocks.d988.length) {
        const card = document.createElement('div');
        card.className = 'hit-card';
        card.innerHTML = `<div class="hit-head"><span class="hit-char">988 梦象</span><span class="hit-verdict mid">×${blocks.d988.length}</span><span class="hit-src">周公解梦 · 维基文库 CC BY-SA 4.0</span></div>` +
          blocks.d988.slice(0, 40).map(e => {
            const secName = (D.dream.d988.sec_names || [])[e.sec] || '?';
            const by = blocks.hitBy.d988[e.id];
            const tag = (by && by !== raw) ? `<span class="tag key">联想·${esc(by)}</span>` : '';
            return `<div class="item" style="font-size:13px;color:var(--tx2);line-height:1.6;padding:2px 0;"><span style="color:#ffd9a0;">${mark(e.s || e.t, raw)}</span> — ${e.en ? esc(e.en.i) : ''} ${tag}<span class="tag">k${e.k}</span><span class="tag">${esc(secName)}</span></div>`;
          }).join('');
        card.addEventListener('click', () => showDetail(
          `988 梦象 · 「${raw}」`,
          `周公解梦 · 维基文库 CC BY-SA 4.0 · ${blocks.d988.length} 条`,
          blocks.d988.slice(0, 40).map(e => {
            const secName = (D.dream.d988.sec_names || [])[e.sec] || '?';
            return `【${e.s || e.t}】k${e.k}（${secName}）\n  原文：${e.t}\n  断语：${e.en ? e.en.i : ''}\n  英象：${e.en ? e.en.k : ''}`;
          }).join('\n\n')
        ));
        box.appendChild(card);
      }
      if (blocks.modern.length) {
        const card = document.createElement('div');
        card.className = 'hit-card';
        card.innerHTML = `<div class="hit-head"><span class="hit-char">现代解梦库</span><span class="hit-verdict mid">×${blocks.modern.length}</span><span class="hit-src">GitHub oswin-hu/zhougong_dream（9467 条，清洗 HTML/模板）</span></div>` +
          blocks.modern.slice(0, 20).map(m => {
            const by = blocks.hitBy.modern[m.id];
            const tag = (by && by !== raw) ? `<span class="tag key">联想·${esc(by)}</span>` : '';
            return `<div class="item" style="font-size:13px;color:var(--tx2);line-height:1.5;padding:2px 0;"><span style="color:#ffd9a0;">${mark(m.title, raw)}</span> ${tag}<span class="tag">${esc(m.big)}</span><span class="tag">${esc(m.small)}</span><br><span style="color:var(--tx3);font-size:12px;">${esc(m.head)}…</span></div>`;
          }).join('');
        card.addEventListener('click', () => showDetail(
          `现代解梦库 · 「${raw}」`,
          '来源 GitHub oswin-hu/zhougong_dream · 清洗后正文（点击卡片下方条目可看全文）',
          blocks.modern.slice(0, 20).map(m => `${m.title}（${m.big}/${m.small}）`).join('\n') + '\n\n（点击单条详情请从 988/现代库 卡片明细查看——正文按需加载）'
        ));
        box.appendChild(card);
        card.querySelectorAll('.item').forEach((el, i) => {
          el.style.cursor = 'pointer';
          el.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const m = blocks.modern[i];
            showDetail('加载中…', `现代解梦库 ${m.id} · ${m.big}/${m.small}`, '正在获取正文，请稍候…');
            const r = await window.qianzhan.dreamMsg(m.id);
            showDetail(`梦见${m.title}`, `现代解梦库 ${m.id} · ${m.big}/${m.small}`, r.ok ? r.msg : '(正文获取失败)');
          });
        });
      }
      if (blocks.guji.length) {
        const card = document.createElement('div');
        card.className = 'hit-card';
        card.innerHTML = `<div class="hit-head"><span class="hit-char">古籍全文</span><span class="hit-verdict mid">×${blocks.guji.length}</span><span class="hit-src">《古今图书集成·梦部》139 节</span></div>` +
          blocks.guji.map(g => {
            const by = blocks.hitBy.guji[g.sec + '|' + g.snip];
            const tag = (by && by !== raw) ? `<span class="tag key">联想·${esc(by)}</span>` : '';
            return `<div class="snippet">【${esc(g.sec)}】${tag}<br><mark>${esc(g.snip)}</mark></div>`;
          }).join('');
        card.addEventListener('click', () => showDetail(
          `古籍原文 · 「${raw}」`,
          '《古今图书集成·历象汇编·庶徵典·梦部》',
          blocks.guji.map(g => `【${g.sec}】\n…${g.snip}…`).join('\n\n')
        ));
        box.appendChild(card);
      }
    }

    function renderSideDefault() {
      const d = $('detail');
      let hist = [];
      try { hist = JSON.parse(localStorage.getItem('dream_history') || '[]'); } catch (e) {}
      const secNames = (D.dream.d988.sec_names || []);
      d.innerHTML = `
        <h2>分类浏览 <span style="font-size:11px;color:var(--tx3);font-weight:400;">${secNames.length} 类 · 点击列出该类全部梦象</span></h2>
        <div class="sec-chips" id="sec-chips">${secNames.map((n, i) => `<span class="sec-chip" data-i="${i}">${esc(n)}</span>`).join('')}</div>
        <h2>古籍章节 <span style="font-size:11px;color:var(--tx3);font-weight:400;">《古今图书集成·梦部》${(D.dream.guji || []).length} 节</span></h2>
        <div id="guji-list" style="max-height:220px;overflow:auto;">${(D.dream.guji || []).map((s, i) =>
          `<div class="guji-item" data-i="${i}"><span class="k">${esc(s.name)}</span> · ${s.text.length} 字</div>`).join('')}</div>
        <h3>最近查询 <span style="font-size:11px;color:var(--tx3);font-weight:400;">点击回查</span></h3>
        <div id="side-recent">${hist.length ? hist.slice(0, 10).map(h =>
          `<div class="recent-item"><span class="k">${esc(h.q)}</span> · ${esc(h.t)} · ${h.hits} 条</div>`).join('')
          : '<p style="color:var(--tx3);font-size:12px;">暂无。解过的梦象会自动出现在这里。</p>'}</div>`;
      d.querySelectorAll('.sec-chip').forEach(el => el.addEventListener('click', () => {
        d.querySelectorAll('.sec-chip').forEach(x => x.classList.remove('on'));
        el.classList.add('on');
        const i = +el.dataset.i;
        $('sec-select').value = String(i);
        $('kw-input').value = '';
        doQuery();
      }));
      d.querySelectorAll('.guji-item').forEach(el => el.addEventListener('click', () => {
        const i = +el.dataset.i;
        const s = D.dream.guji[i];
        showDetail(s.name, '《古今图书集成·历象汇编·庶徵典·梦部》', s.text);
      }));
      d.querySelectorAll('.recent-item').forEach(el => el.addEventListener('click', () => queryKw(el.querySelector('.k').textContent)));
    }

    function showDetail(title, src, text) {
      const d = $('detail');
      d.innerHTML = `<div class="side-back" id="side-back">← 返回分类浏览</div><h2>${esc(title)}</h2><div class="src">${esc(src)}</div><p>${esc(text)}</p>`;
      d.scrollTop = 0;
      const sb = $('side-back');
      if (sb) sb.addEventListener('click', renderSideDefault);
    }

    function buildResultText(raw, blocks) {
      const L = [];
      L.push(`解梦引擎 · 查梦「${raw}」 · ${new Date().toLocaleString('zh-CN')}`);
      L.push(`988 梦象 ${blocks.d988.length} / 现代库 ${blocks.modern.length} / 古籍 ${blocks.guji.length}`);
      if (blocks.terms && blocks.terms.length > 1) L.push(`查询词扩展（谐音/比象）：${blocks.terms.join('、')}`);
      L.push('');
      blocks.fanmeng.forEach(f => {
        L.push(`【反梦·古人反训】梦见${f.dream} → ${f.invert}`);
        L.push(`  依据：${f.basis}`);
      });
      if (blocks.fanmeng.length) L.push('');
      blocks.resultRev.forEach(r => {
        L.push(`【反查】${r.dream} → ${r.mark}${r.result}`);
        L.push(`  988 原文：${r.title}`);
      });
      if (blocks.resultRev.length) L.push('');
      blocks.symbol.forEach(s => {
        L.push(`【象征】梦见${s.dream} → ${s.symbol}`);
        L.push(`  依据：${s.basis}`);
      });
      if (blocks.symbol.length) L.push('');
      blocks.d988.slice(0, 40).forEach(e => {
        const by = blocks.hitBy.d988[e.id];
        const secName = (D.dream.d988.sec_names || [])[e.sec] || '?';
        L.push(`【988】${e.s || e.t}（k${e.k} / ${secName}）${by && by !== raw ? ` [联想·${by}]` : ''}`);
        L.push(`  原文：${e.t}`);
        L.push(`  断语：${e.en ? e.en.i : ''}`);
      });
      blocks.modern.slice(0, 20).forEach(m => {
        const by = blocks.hitBy.modern[m.id];
        L.push(`【现代】${m.title}（${m.big}/${m.small}）${by && by !== raw ? ` [联想·${by}]` : ''}`);
        L.push(`  ${m.head}…`);
      });
      blocks.guji.forEach(g => {
        const by = blocks.hitBy.guji[g.sec + '|' + g.snip];
        L.push(`【古籍】${g.sec}${by && by !== raw ? ` [联想·${by}]` : ''}`);
        L.push(`  …${g.snip}…`);
      });
      return L.join('\n');
    }

    function exportResults(kind) {
      if (!lastRaw || !lastBlocks) return;
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const text = buildResultText(lastRaw, lastBlocks);
      window.qianzhan.export(text, `dream_${ts}.${kind === 'json' ? 'json' : 'txt'}`).then((r) => {
        if (r && r.ok) showDetail('导出完成', '本地文件', `已写入：\n${r.path}`);
      });
    }

    function dmInit() {
      if (!D || !D.dream) return;
      fillSecSelect();
      $('btn-query').addEventListener('click', doQuery);
      $('kw-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') doQuery(); });
      $('btn-random').addEventListener('click', () => {
        const es = (D.dream.d988.entries || []);
        const r = es[Math.floor(Math.random() * es.length)];
        $('kw-input').value = (r.s || r.t || '').slice(0, 4);
        doQuery();
      });
      $('sec-select').addEventListener('change', doQuery);
      $('k-select').addEventListener('change', doQuery);
      $('opt-xieyin').addEventListener('change', doQuery);
      $('opt-fanmeng').addEventListener('change', doQuery);
      renderSideDefault();
    }
    dreamInit = dmInit;

    function fillSecSelect() {
      const sel = $('sec-select');
      (D.dream.d988.sec_names || []).forEach((n, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = n;
        sel.appendChild(o);
      });
    }
  })();

  // ===================== 测字（Tab 17）嵌套 IIFE =====================
  (() => {
    // 数据：D.cezi = { dict, midie, dispatch, renzi, zichu, decomp, rev_decomp }
    let CHAIFA = null;       // Map<char, [{method, base, expand, via}]>
    let TANYUAN = null;      // [{char, xiang}] 探元赋字象
    let LIBAROWS = null;     // [{g,x,d}] 立八卦断
    let ZIHUA = null;        // [{head,text}] 字画经验白名单
    let currentRuleTab = 'midie';
    let lastRaw = '';
    let lastBlocks = [];

    const RULE_TABS = {
      midie: renderMidie,
      quge: renderQuge,
      dispatch: renderDispatch,
      renzi: renderRenzi,
      zichu: renderZichu,
      history: renderHistory,
    };

    function cmInit() {
      if (!D || !D.cezi) return;
      buildChaifaIndex();
      parseTanyuan();
      parseLiba();
      parseZihua();
      fillGzSelect();
      bindEvents();
      renderRules('midie');
      renderSideDefault();
      const ci = $('cz-char'); if (ci) ci.focus();
    }
    ceziInit = cmInit;

    // —— 右侧常驻面板：部件反查 + 最近查询 ——
    function renderSideDefault() {
      const d = $('cz-detail');
      let hist = [];
      try { hist = JSON.parse(localStorage.getItem('cezi_history') || '[]'); } catch (e) {}
      d.innerHTML = `
        <h2>部件反查 <span style="font-size:11px;color:var(--tx3);font-weight:400;">输入部件/部首 → 列出所有含它的字</span></h2>
        <div class="gzl-row" style="margin-bottom:10px;">
          <input id="cz-part" type="text" maxlength="1" placeholder="如：圭 / 因 / 木 / 隹…" style="flex:1;min-width:0;">
          <button class="btn" id="cz-part-btn">反查</button>
        </div>
        <div id="cz-part-out" style="font-size:13px;line-height:1.8;"></div>
        <h3>最近查询 <span style="font-size:11px;color:var(--tx3);font-weight:400;">点击回查</span></h3>
        <div id="cz-recent">${hist.length ? hist.slice(0, 10).map(h =>
          `<div class="recent-item"><span class="k">${h.q}</span> · ${h.t} · ${h.hits} 条</div>`).join('')
          : '<p style="color:var(--tx3);font-size:12px;">暂无。测过的字会自动出现在这里。</p>'}</div>`;
      $('cz-part-btn').addEventListener('click', runPart);
      $('cz-part').addEventListener('keydown', e => { if (e.key === 'Enter') runPart(); });
      d.querySelectorAll('.recent-item').forEach(el => el.addEventListener('click', () => queryChar(el.querySelector('.k').textContent)));
    }

    function queryChar(c) {
      $('cz-char').value = c;
      doQuery();
    }

    function runPart() {
      const p = ($('cz-part').value || '').trim();
      const out = $('cz-part-out');
      if (!p) { out.textContent = '请输入部件（一个字）。'; return; }
      const ws = (D.cezi.rev_decomp || {})[p] || [];
      if (!ws.length) {
        out.innerHTML = `<span style="color:var(--tx3);">「${p}」不在部件索引中（可能是整字部件或未收录）。试试圭/因/木/隹/火。</span>`;
        return;
      }
      out.innerHTML = `<span class="k" style="color:#e0a65e;">「${p}」</span> 共 ${ws.length} 字（显示前 30，点击进查字）：<br>` +
        ws.slice(0, 30).map(w => {
          const n = partVerdicts(w).length;
          return `<span class="part-w" data-w="${w}">${w}<span class="tag">${n}条</span></span>`;
        }).join(' ');
      out.querySelectorAll('.part-w').forEach(el => el.addEventListener('click', () => queryChar(el.dataset.w)));
    }

    // —— 计算索引：秘牒十法/六法例字反向索引 ——
    function buildChaifaIndex() {
      CHAIFA = new Map();
      (D.cezi.midie.methods || []).forEach(m => {
        (m.examples || []).forEach(ex => {
          const base = ex.base;
          const expands = ex.expand.split(/[、，,；;]/).filter(Boolean);
          const rec = { method: m.title, base, expand: ex.expand };
          if (!CHAIFA.has(base)) CHAIFA.set(base, []);
          CHAIFA.get(base).push(rec);
          expands.forEach(e => {
            if (e === base) return;
            if (!CHAIFA.has(e)) CHAIFA.set(e, []);
            CHAIFA.get(e).push({ method: m.title, base, expand: ex.expand, via: '（由' + base + '得）' });
          });
        });
      });
    }

    function parseTanyuan() {
      const sec = (D.cezi.dispatch.sections || []).find(s => s.name.includes('探元赋'));
      if (!sec) return;
      TANYUAN = [];
      const re = /([一-龥]{1,2})字者，?乃([^。]+)。/g;
      let m;
      while ((m = re.exec(sec.text))) {
        TANYUAN.push({ char: m[1], xiang: m[2].trim() });
      }
    }

    function parseLiba() {
      const sec = (D.cezi.dispatch.sections || []).find(s => s.name.includes('立八卦断'));
      LIBAROWS = [];
      if (!sec) return;
      const re = /([乾坤震巽坎离艮兑])(?:宫|位|是|为)([^，。]{2,12})[，。]([^。]{2,30})。/g;
      let m;
      while ((m = re.exec(sec.text))) LIBAROWS.push({ g: m[1], x: m[2], d: m[3] });
    }

    const ZIHUA_CHARS = ['家', '空', '荆', '砚', '典', '果', '马', '来', '但', '谦', '达', '奇', '城', '池', '春', '益', '田'];
    function parseZihua() {
      const sec = (D.cezi.dispatch.sections || []).find(s => s.name.includes('字画经验'));
      ZIHUA = [];
      if (!sec) return;
      ZIHUA_CHARS.forEach(c => {
        const idx = sec.text.indexOf(c + '字');
        if (idx < 0) return;
        const seg = sec.text.slice(idx, idx + 60).split(/[。！]/)[0];
        if (seg.length > 3) ZIHUA.push({ head: c + '字', text: seg });
      });
    }

    function bindEvents() {
      $('cz-go').addEventListener('click', doQuery);
      $('cz-char').addEventListener('keydown', (e) => { if (e.key === 'Enter') doQuery(); });
      $('cz-random').addEventListener('click', () => {
        const es = D.cezi.dict.entries || [];
        const e = es[Math.floor(Math.random() * es.length)];
        $('cz-char').value = e['条目字'] || '';
        doQuery();
      });
      $('cz-tuilian').addEventListener('click', () => {
        const raw = $('cz-char').value.trim();
        const c = Array.from(raw.replace(/[\s，。,.！？!?、；;：:""''（）()]/g, ''))[0];
        if (c) renderTuilian(c);
      });
      $('cz-gz').addEventListener('change', (e) => showGz(e.target.value));
      document.querySelectorAll('#t-cezi .rtab').forEach(t => t.addEventListener('click', () => {
        document.querySelectorAll('#t-cezi .rtab').forEach(x => x.classList.remove('on'));
        t.classList.add('on');
        renderRules(t.dataset.rt);
      }));
      const rs = $('cz-rsearch');
      rs.addEventListener('input', () => filterRuleBody(rs.value.trim()));
    }

    /* ---------- 查字 ---------- */
    function doQuery() {
      const raw = $('cz-char').value.trim();
      if (!raw) return;
      const chars = Array.from(raw.replace(/[\s，。,.！？!?、；;：:""''（）()]/g, ''));
      const seen = new Set();
      const blocks = [];
      for (const c of chars) {
        if (seen.has(c)) continue;
        seen.add(c);
        blocks.push(lookupChar(c));
      }
      lastRaw = raw;
      lastBlocks = blocks;
      recordHistory(raw, blocks);
      refreshSideRecent();
      renderResults(blocks, raw);
    }

    function refreshSideRecent() {
      const host = $('cz-recent');
      if (!host || $('cz-side-back')) return;   // 被详情覆盖时不刷
      let hist = [];
      try { hist = JSON.parse(localStorage.getItem('cezi_history') || '[]'); } catch (e) {}
      host.innerHTML = hist.length ? hist.slice(0, 10).map(h =>
        `<div class="recent-item"><span class="k">${h.q}</span> · ${h.t} · ${h.hits} 条</div>`).join('')
        : '<p style="color:var(--tx3);font-size:12px;">暂无。测过的字会自动出现在这里。</p>';
      host.querySelectorAll('.recent-item').forEach(el => el.addEventListener('click', () => queryChar(el.querySelector('.k').textContent)));
    }

    function recordHistory(raw, blocks) {
      try {
        const total = blocks.reduce((s, b) => s + b.exact.length + b.quge.length + b.zazhan.length + b.chaifa.length + b.tanyuan.length + b.renzi.length + b.stories.length, 0);
        const list = JSON.parse(localStorage.getItem('cezi_history') || '[]');
        list.unshift({ t: new Date().toLocaleString('zh-CN', { hour12: false }), q: raw, hits: total });
        localStorage.setItem('cezi_history', JSON.stringify(list.slice(0, 50)));
      } catch (e) { /* ignore */ }
    }

    function renderHistory(body) {
      let list = [];
      try { list = JSON.parse(localStorage.getItem('cezi_history') || '[]'); } catch (e) {}
      let html = '<h4>查字历史</h4><div class="src">最近 50 次（本地 localStorage）。点击回填重查。</div>';
      if (!list.length) html += '<div class="c">暂无记录。测过的字会自动出现在这里。</div>';
      html += list.map((h, i) =>
        `<div class="item" data-sec="hist-${i}"><span class="k">${h.q}</span> · ${h.t} · ${h.hits} 条命中</div>`).join('');
      html += list.length ? '<div style="margin-top:10px;"><button class="btn ghost" id="cz-clear-hist">清空历史</button></div>' : '';
      body.innerHTML = html;
      body.querySelectorAll('.item[data-sec^="hist-"]').forEach(it => it.addEventListener('click', () => {
        const i = +it.dataset.sec.split('-')[1];
        $('cz-char').value = list[i].q;
        doQuery();
      }));
      const cb = $('cz-clear-hist');
      if (cb) cb.addEventListener('click', () => { localStorage.removeItem('cezi_history'); renderHistory(body); });
    }

    function verdictClass(v) {
      if (!v) return 'unknown';
      if (v.includes('吉') && !v.includes('凶')) return '';
      if (v.includes('凶')) return 'bad';
      if (v.includes('中')) return 'mid';
      return 'unknown';
    }

    function lookupChar(c) {
      const dict = D.cezi.dict;
      const exact = (dict.entries || []).filter(e => e['条目字'] === c);
      const quge = (D.cezi.midie.quge_items || []).filter(it => it.char === c);
      const zazhan = (D.cezi.midie.zazhan || []).filter(z => z.char === c);
      const chaifa = (CHAIFA && CHAIFA.get(c)) || [];
      const tanyuan = (TANYUAN || []).filter(t => t.char === c || t.char.includes(c));
      const renzi = (D.cezi.renzi.items || []).filter(it => it.char === c);
      const stories = findStories(c);
      return { char: c, exact, quge, zazhan, chaifa, tanyuan, renzi, stories };
    }

    function findStories(c, ctxLen = 70, max = 6) {
      const full = (D.cezi.zichu && D.cezi.zichu.full_text) || '';
      if (!full || c.length !== 1) return [];
      const out = [];
      const seen = new Set();
      let idx = full.indexOf(c);
      while (idx >= 0 && out.length < max) {
        const start = Math.max(0, idx - ctxLen);
        const end = Math.min(full.length, idx + 1 + ctxLen);
        const seg = full.slice(start, end).replace(/\n+/g, ' ');
        const key = seg.slice(0, 40);
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ pos: idx, ctx: seg, hit: c });
        }
        idx = full.indexOf(c, idx + 1);
      }
      return out;
    }

    function renderResults(blocks, raw) {
      const box = $('cz-results');
      const title = $('cz-results-title');
      box.innerHTML = '';
      title.textContent = '';
      const total = blocks.reduce((s, b) => s + b.exact.length + b.quge.length + b.zazhan.length + b.chaifa.length + b.tanyuan.length + b.renzi.length + b.stories.length, 0);
      title.textContent = `「${raw}」· 共 ${total} 条命中`;
      const bar = document.createElement('div');
      bar.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:2px;';
      const gzSel = $('cz-gz');
      if (gzSel && gzSel.value) {
        const gzInfo = (D.cezi.dict.gan_zhi_60 || []).find(g => g['干支'] === gzSel.value);
        const tag = gzInfo && gzInfo.parsed && gzInfo.parsed.length
          ? gzInfo.parsed.map(p => `${p.hz}${p.tag === '吉' ? '吉' : (p.tag.includes('凶') ? '凶' : '·')}`).join(' ')
          : '';
        const gzTag = document.createElement('span');
        gzTag.className = 'tag key';
        gzTag.textContent = `写测时辰：${gzSel.value}（${tag || '程序解析无吉凶标注'}）`;
        bar.appendChild(gzTag);
      }
      const btnTxt = document.createElement('button');
      btnTxt.className = 'btn ghost';
      btnTxt.textContent = '导出 txt';
      btnTxt.addEventListener('click', () => exportResults('txt'));
      const btnJson = document.createElement('button');
      btnJson.className = 'btn ghost';
      btnJson.textContent = '导出 json';
      btnJson.addEventListener('click', () => exportResults('json'));
      bar.appendChild(btnTxt);
      bar.appendChild(btnJson);
      box.appendChild(bar);
      if (!blocks.length) { box.innerHTML += '<div class="miss-note">未输入有效汉字。</div>'; return; }
      blocks.forEach((b, bi) => {
        const hasAny = b.exact.length || b.quge.length || b.zazhan.length || b.chaifa.length || b.tanyuan.length || b.stories.length;
        if (!hasAny) {
          const d = document.createElement('div');
          d.className = 'miss-note';
          d.innerHTML = `「${b.char}」字库与秘牒取格均无直接条目 —— 可参考右侧「秘牒十法·六法」的拆法（装头/接脚/添笔/减笔等）自行拆解；也可查《字触》同名字实例。`;
          box.appendChild(d);
          return;
        }
        b.exact.forEach(e => box.appendChild(hitCard(e, bi)));
        if (b.quge.length) {
          const q = document.createElement('div');
          q.className = 'hit-card';
          q.innerHTML = `<div class="hit-head"><span class="hit-char">${b.char}</span><span class="hit-verdict mid">取格断语 ×${b.quge.length}</span><span class="hit-src">《测字秘牒》取格</span></div>` +
            b.quge.map(x => `<div class="item"><span class="k">${x.char}</span>（${x.verdict}）</div>`).join('');
          q.addEventListener('click', () => showDetail('取格断语 · 字「' + b.char + '」', '《测字秘牒》取格', b.quge.map(x => `${x.char}（${x.verdict}）`).join('\n')));
          box.appendChild(q);
        }
        if (b.zazhan.length) {
          const z = document.createElement('div');
          z.className = 'hit-card';
          z.innerHTML = `<div class="hit-head"><span class="hit-char">${b.char}</span><span class="hit-verdict mid">杂占 ×${b.zazhan.length}</span><span class="hit-src">《测字秘牒》杂占</span></div>` +
            b.zazhan.map(x => `<div class="item">${x.text}</div>`).join('');
          z.addEventListener('click', () => showDetail('杂占 · 字「' + b.char + '」', '《测字秘牒》杂占', b.zazhan.map(x => x.text).join('\n')));
          box.appendChild(z);
        }
        if (b.chaifa.length) {
          const c = document.createElement('div');
          c.className = 'hit-card';
          c.innerHTML = `<div class="hit-head"><span class="hit-char">${b.char}</span><span class="hit-verdict mid">拆法 ×${b.chaifa.length}</span><span class="hit-src">《测字秘牒》十法/六法例字（反向索引）</span></div>` +
            b.chaifa.map(x => `<div class="item"><span class="k">${x.method}</span>：${x.base} → ${x.expand}${x.via || ''}</div>`).join('');
          c.addEventListener('click', () => showDetail('拆法 · 字「' + b.char + '」', '《测字秘牒》十法/六法例字反向索引', b.chaifa.map(x => `${x.method}：${x.base} → ${x.expand}`).join('\n')));
          box.appendChild(c);
        }
        if (b.tanyuan.length) {
          const ty = document.createElement('div');
          ty.className = 'hit-card';
          ty.innerHTML = `<div class="hit-head"><span class="hit-char">${b.char}</span><span class="hit-verdict mid">探元赋字象 ×${b.tanyuan.length}</span><span class="hit-src">《拆字部汇考》探元赋</span></div>` +
            b.tanyuan.map(x => `<div class="item"><span class="k">${x.char}字</span>：${x.xiang}</div>`).join('');
          ty.addEventListener('click', () => showDetail('字象 · 「' + b.char + '」', '《拆字部汇考》探元赋（逐字取象）', b.tanyuan.map(x => `${x.char}字者：${x.xiang}`).join('\n')));
          box.appendChild(ty);
        }
        if (b.renzi.length) {
          const rz = document.createElement('div');
          rz.className = 'hit-card';
          rz.innerHTML = `<div class="hit-head"><span class="hit-char">${b.char}</span><span class="hit-verdict mid">认字测 · 六书测义 ×${b.renzi.length}</span><span class="hit-src">《认字测》明·周宇</span></div>` +
            b.renzi.map(x => `<div class="item">第${x.no || '?'}条 · ${x.text.slice(0, 90)}${x.text.length > 90 ? '…' : ''}</div>`).join('');
          rz.addEventListener('click', () => showDetail(`认${b.char}`, '《认字测》（八十一字）', b.renzi.map(x => x.text).join('\n\n')));
          box.appendChild(rz);
        }
        if (b.stories.length) {
          const st = document.createElement('div');
          st.className = 'hit-card';
          st.innerHTML = `<div class="hit-head"><span class="hit-char">${b.char}</span><span class="hit-verdict mid">《字触》实例 ×${b.stories.length}</span><span class="hit-src">字触六卷 · 全文定位（前后70字上下文）</span></div>` +
            b.stories.map((s, i) => `<div class="item">…${esc(s.ctx)}…</div>`).join('');
          st.addEventListener('click', () => showDetail('《字触》实例 · 「' + b.char + '」', '字触六卷（清·周亮工）', b.stories.map(s => '…' + s.ctx + '…').join('\n\n')));
          box.appendChild(st);
        }
      });
    }

    function buildResultText(blocks, raw) {
      const lines = [];
      lines.push(`测字查询：${raw}`);
      lines.push(`时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`);
      const gzSel = $('cz-gz');
      if (gzSel && gzSel.value) lines.push(`写测时辰：${gzSel.value}`);
      lines.push('='.repeat(40));
      blocks.forEach(b => {
        lines.push(`\n【${b.char}】`);
        if (b.exact.length) {
          b.exact.forEach(e => lines.push(
            `[字库] ${e['编号']} ${e['条目字']}（${e['断语性质'] || '—'}）\n  原文：${e['原文'] || ''}\n  白话：${e['白话翻译'] || '（无）'}\n  拆字原理：${e['拆字原理·取象'] || '（无）'}\n  应用场景：${e['应用场景'] || '—'}\n  来源：${e['来源篇名'] || ''}${e['备注'] ? '\n  备注：' + e['备注'] : ''}`));
        }
        if (b.quge.length) lines.push(`[取格] ${b.quge.map(x => `${x.char}（${x.verdict}）`).join('；')}`);
        if (b.zazhan.length) lines.push(`[杂占] ${b.zazhan.map(x => x.text).join('；')}`);
        if (b.chaifa.length) lines.push(`[拆法] ${b.chaifa.map(x => `${x.method}：${x.base}→${x.expand}`).join('；')}`);
        if (b.tanyuan.length) lines.push(`[探元赋] ${b.tanyuan.map(x => `${x.char}字：${x.xiang}`).join('；')}`);
        if (b.renzi.length) lines.push(`[认字测] ${b.renzi.map(x => `第${x.no || '?'}条：${x.text.slice(0, 80)}`).join('；')}`);
        if (b.stories.length) lines.push(`[字触] ${b.stories.map(s => '…' + s.ctx + '…').join('\n')}`);
      });
      return lines.join('\n');
    }

    async function exportResults(kind) {
      if (!lastRaw) return;
      const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
      if (kind === 'json') {
        const payload = JSON.stringify({
          query: lastRaw,
          time: new Date().toLocaleString('zh-CN', { hour12: false }),
          gz: $('cz-gz').value || '',
          blocks: lastBlocks,
        }, null, 1);
        const r = await window.qianzhan.export(payload, `cezi_${ts}.json`);
        if (r && r.ok) showDetail('导出完成', '本地 JSON', `已写入：\n${r.path}`);
      } else {
        const r = await window.qianzhan.export(buildResultText(lastBlocks, lastRaw), `cezi_${ts}.txt`);
        if (r && r.ok) showDetail('导出完成', '本地 txt', `已写入：\n${r.path}`);
      }
    }

    function hitCard(e, bi) {
      const d = document.createElement('div');
      d.className = 'hit-card';
      d.dataset.entry = bi + ':' + e['编号'];
      const vc = verdictClass(e['断语性质']);
      d.innerHTML = `
        <div class="hit-head"><span class="hit-char">${e['条目字']}</span><span class="hit-verdict ${vc}">${e['断语性质'] || '—'}</span><span class="hit-src">${e['来源篇名'] || ''}</span></div>
        <div class="hit-orig">${e['原文'] || ''}</div>
        ${e['白话翻译'] ? `<div class="hit-bai">白话：${e['白话翻译']}</div>` : ''}
        <div class="hit-tags">${(e['应用场景'] ? `<span class="tag">${e['应用场景']}</span>` : '')}${(e['拆字原理·取象'] ? `<span class="tag key">${e['拆字原理·取象']}</span>` : '')}</div>`;
      d.addEventListener('click', () => showDetail(
        `${e['条目字']} · ${e['编号']}`,
        e['来源篇名'] || '',
        `【原文】\n${e['原文'] || ''}\n\n【白话翻译】\n${e['白话翻译'] || '（无）'}\n\n【拆字原理·取象】\n${e['拆字原理·取象'] || '（无）'}\n\n【断语性质】${e['断语性质'] || '—'}\n【应用场景】${e['应用场景'] || '—'}\n\n【备注】${e['备注'] || '（无）'}`
      ));
      return d;
    }

    /* ---------- 60 干支时方 ---------- */
    function fillGzSelect() {
      const sel = $('cz-gz');
      const gz = D.cezi.dict.gan_zhi_60 || [];
      gz.forEach(g => {
        const o = document.createElement('option');
        o.value = g['干支'];
        o.textContent = `${g['干支']} · ${(g['可辨吉凶词'] || g['原文断语'] || '').slice(0, 12)}`;
        sel.appendChild(o);
      });
    }

    function showGz(v) {
      const gz = (D.cezi.dict.gan_zhi_60 || []).find(g => g['干支'] === v);
      const badge = $('cz-gz-badge');
      const out = $('cz-gz-out');
      if (!gz) { badge.textContent = '—'; out.innerHTML = ''; return; }
      badge.textContent = v;
      const parsed = gz.parsed || [];
      let phtml = '';
      if (parsed.length) {
        phtml = `<span class="lbl">程序解析（按原文地支组自动拆解，吉凶词取自原文、未人工核定）：</span><br>` +
          parsed.map(p => {
            const cls = p.tag.includes('凶') ? 'bad' : (p.tag === '吉' ? '' : (p.tag === '空' ? 'mid' : 'unknown'));
            return `<span class="hit-verdict ${cls}">${p.hz} → ${p.tag}</span>` + (p.note ? ` <span class="lbl">（${p.note}）</span>` : '') + (p.tail && p.tag !== '（无标注）' ? ` <span class="lbl">原文：${p.tail}</span>` : '');
          }).join('<br>') + '<br>';
      }
      out.innerHTML = phtml +
        `<span class="lbl">原文断语（识典非OCR，残字照录）：</span> ${gz['原文断语（识典非OCR，残字照录）'] || gz['原文断语'] || ''}<br>` +
        `<span class="lbl">原表"可辨吉凶词"列：</span> ${gz['可辨吉凶词'] || '（源表 60 行中该列仅 2 行有内容，其余为空）'}<br>` +
        `<span class="lbl">说明：</span> ${gz['说明'] || '（源表未填）'}`;
    }

    /* ---------- 规则库 ---------- */
    function renderRules(tab) {
      currentRuleTab = tab;
      const body = $('cz-rbody');
      $('cz-rsearch').value = '';
      RULE_TABS[tab](body);
    }

    function renderMidie(body) {
      const M = D.cezi.midie;
      let html = '<h4>《测字秘牒》十法 · 心易六法</h4><div class="src">清·程省（本地 txt 文本层）。十法：装头/接脚/穿心/包笼/破解/添笔/减笔/对关/摘字；观梅附后；心易六法：象形/会意/假借/谐声/指事/转注。</div>';
      (M.methods || []).forEach((m, i) => {
        html += `<div class="sec" data-sec="midie-${i}">
          <div class="t">${m.title} <span class="c">（${m.char_count} 字 · ${m.examples.length} 例）</span></div>
          <div class="body">${esc(m.text)}</div>
          ${m.examples.length ? `<div class="c">例：${m.examples.slice(0, 24).map(x => `${x.base}（${x.expand}）`).join(' ')}${m.examples.length > 24 ? ' …' : ''}</div>` : ''}
        </div>`;
      });
      body.innerHTML = html;
      body.querySelectorAll('.sec').forEach(s => s.addEventListener('click', () => {
        s.classList.toggle('open');
        const t = s.querySelector('.t').textContent;
        showDetail(t, '《测字秘牒》', s.querySelector('.body').textContent.trim().slice(0, 4000));
      }));
    }

    function cleanGroup(g) {
      if (!g) return '';
      return g.replace(/[（(].*$/, '').replace(/[）)]/g, '').trim();
    }

    function renderQuge(body) {
      const M = D.cezi.midie;
      let html = '<h4>《测字秘牒》取格断语 · 杂占</h4><div class="src">取格：一字来，以一句断之。先详五行生克，次观六神动静。按原文部首分组（行首组名；个别行首为残句噪声，如实保留并清洗）。杂占：△字实例断语。</div>';
      html += `<div class="c">取格条目 ${M.quge_item_count || 0} 条 · 部首组 ${M.quge_groups ? M.quge_groups.length : 0} · 杂占 ${M.zazhan_count || 0} 条。点组展开，点条目看详情。</div>`;
      const groups = M.quge_groups || [];
      const byGroup = {};
      (M.quge_items || []).forEach((x, i) => {
        const g = cleanGroup(x.group || '');
        if (!byGroup[g]) byGroup[g] = [];
        byGroup[g].push({ ...x, idx: i });
      });
      const groupKeys = [];
      const seenG = new Set();
      groups.concat((M.quge_items || []).map(x => cleanGroup(x.group || ''))).forEach(g => {
        if (g && !seenG.has(g)) { seenG.add(g); groupKeys.push(g); }
      });
      groupKeys.forEach(g => {
        const items = byGroup[g] || [];
        if (!items.length) return;
        html += `<div class="sec" data-sec="qg-${g}">
          <div class="t">部首「${g}」 <span class="c">（${items.length} 条）</span></div>
          <div class="body">${items.map(x => `<div class="item" data-qitem="${x.idx}"><span class="k">${x.char}</span>（${x.verdict}）</div>`).join('')}</div>
        </div>`;
      });
      const noGroup = (M.quge_items || []).filter(x => !cleanGroup(x.group || ''));
      if (noGroup.length) {
        html += `<div class="sec" data-sec="qg-"><div class="t">未分组 <span class="c">（${noGroup.length} 条）</span></div><div class="body">${noGroup.map(x => `<div class="item" data-qitem="${x.idx}"><span class="k">${x.char}</span>（${x.verdict}）</div>`).join('')}</div></div>`;
      }
      html += '<h4 style="margin-top:12px;">△ 杂占实例</h4>' + (M.zazhan || []).map((z, i) =>
        `<div class="item" data-sec="zz-${i}"><span class="k">${z.char}</span> ${z.text}</div>`).join('');
      body.innerHTML = html;
      body.querySelectorAll('.sec[data-sec^="qg"]').forEach(s => s.addEventListener('click', () => s.classList.toggle('open')));
      body.querySelectorAll('.item[data-qitem]').forEach(it => it.addEventListener('click', (e) => {
        e.stopPropagation();
        const x = (M.quge_items || [])[+it.dataset.qitem];
        if (x) showDetail(`${x.char}（${x.verdict}）`, '《测字秘牒》取格', `${x.char}（${x.verdict}）`);
      }));
      body.querySelectorAll('.item:not([data-qitem])').forEach(it => it.addEventListener('click', () => {
        showDetail(it.querySelector('.k') ? it.querySelector('.k').textContent : '杂占', '《测字秘牒》杂占', it.textContent.trim());
      }));
    }

    function renderDispatch(body) {
      const DZ = D.cezi.dispatch;
      let html = '<h4>《古今图书集成·艺术典》拆字部（卷747-748）</h4><div class="src">射复/挂影纪事 · 拆字数（指迷赋/相字歌/元黄克应歌/元黄叙/花押赋/探元赋/齐景至理论=《神机相字法》/字画经验/天字诗诀/立八卦断）· 新订指明心法（上下）· 拆字部记事 · 存目提要</div>';
      if (LIBAROWS && LIBAROWS.length) {
        html += '<div class="sec" data-sec="liba"><div class="t">立八卦断 · 宫位解析 <span class="c">（' + LIBAROWS.length + ' 宫）</span></div><div class="body">' +
          LIBAROWS.map(r => `<div class="item"><span class="k">${r.g}宫</span> ${r.x}，${r.d}</div>`).join('') + '</div></div>';
      }
      (DZ.sections || []).forEach((s, i) => {
        html += `<div class="sec" data-sec="dp-${i}">
          <div class="t">${s.name} <span class="c">（${s.char_count} 字${s.slice ? ' · ' + s.slice : ''}）</span></div>
          <div class="body">${esc(s.text.slice(0, 3000))}${s.text.length > 3000 ? '\n…（全文见详情）' : ''}</div>
        </div>`;
      });
      body.innerHTML = html;
      body.querySelectorAll('.sec[data-sec="liba"]').forEach(s => s.addEventListener('click', () => s.classList.toggle('open')));
      body.querySelectorAll('.sec[data-sec^="dp-"]').forEach(s => s.addEventListener('click', () => {
        s.classList.toggle('open');
        const t = s.querySelector('.t').textContent;
        const i = +s.dataset.sec.split('-')[1];
        showDetail(t, '《拆字部汇考》', (D.cezi.dispatch.sections[i] || {}).text || '');
      }));
    }

    function renderRenzi(body) {
      const R = D.cezi.renzi;
      let html = '<h4>《认字测》八十一字（明·周宇）</h4><div class="src">以六书说字测字。目录 81 字权威清单；正文段落按清单定位（源文本 OCR 有相邻条目粘连）。点击字看测文。</div>';
      html += '<div class="grid81">' + (R.catalog || []).map((c, i) =>
        `<div class="cell" data-sec="rz-${i}" title="${c.no}.${c.char}">${c.char}</div>`).join('') + '</div>';
      body.innerHTML = html;
      body.querySelectorAll('.cell').forEach(c => c.addEventListener('click', () => {
        const i = +c.dataset.sec.split('-')[1];
        const it = (R.items || []).find(x => x.char === (R.catalog[i] || {}).char);
        showDetail(`${R.catalog[i].no}. 认${R.catalog[i].char}`, '《认字测》', it ? it.text : '（该字正文段落未在 OCR 文本中定位到）');
      }));
    }

    function renderZichu(body) {
      const Z = D.cezi.zichu;
      const P = Z.people || {};
      let html = '<h4>《字触》六卷（清·周亮工辑）</h4><div class="src">历代拆字故事/谶语/名家实例总集：廋部（离合诗字谜）、外部（谢石/汪龙/郑仰田等）、晰部、几部、谐部、说部。可搜索卷内关键词。</div>';
      if (P.known && P.known.length) {
        html += '<div class="people-sec"><span class="lbl">人名索引（已知名单 · 全文定位）</span><div class="chips">' +
          P.known.map((p, i) => `<span class="chip" data-p="k${i}">${p.name} ×${p.count}</span>`).join('') + '</div>';
        html += '<div class="c">注：谢石/汪龙/郑仰田 3 处命中来自整理导言（非正文实例）；正文人名多为 OCR 变形（如礫/櫟）。</div></div>';
      }
      if (P.stories && P.stories.length) {
        html += '<div class="people-sec"><span class="lbl">故事主人公定位（「X公…曰」近似 · 前后文）</span>' +
          P.stories.map((s, i) => `<div class="item" data-p="s${i}"><span class="k">${s.head}</span> ${s.ctx.slice(0, 60)}…</div>`).join('') + '</div>';
      }
      if (P.candidates && P.candidates.length) {
        html += `<div class="sec" data-sec="zcp"><div class="t">称呼模式候选 <span class="c">（${P.candidates.length} 个 · OCR 疑似变形，仅供参考）</span></div><div class="body">` +
          P.candidates.map(c => `${c.name} ×${c.count}`).join('  ·  ') + '</div></div>';
      }
      (Z.sections || []).forEach((s, i) => {
        html += `<div class="sec" data-sec="zc-${i}">
          <div class="t">${s.name} <span class="c">（${s.char_count} 字）</span></div>
          <div class="body">${esc(s.text.slice(0, 2000))}${s.text.length > 2000 ? '\n…（全文见详情）' : ''}</div>
        </div>`;
      });
      body.innerHTML = html;
      body.querySelectorAll('.sec[data-sec="zcp"]').forEach(s => s.addEventListener('click', () => s.classList.toggle('open')));
      body.querySelectorAll('.sec[data-sec^="zc-"]').forEach(s => s.addEventListener('click', () => {
        s.classList.toggle('open');
        const t = s.querySelector('.t').textContent;
        const i = +s.dataset.sec.split('-')[1];
        showDetail(t, '《字触》', (Z.sections[i] || {}).text || '');
      }));
      body.querySelectorAll('.chip[data-p]').forEach(ch => ch.addEventListener('click', () => {
        const p = P.known[+ch.dataset.p.slice(1)];
        showDetail(p.name, '《字触》人名索引', (p.ctxs || []).map((c, i) => `[${i + 1}] …${c}…`).join('\n\n'));
      }));
      body.querySelectorAll('.item[data-p^="s"]').forEach(it => it.addEventListener('click', () => {
        const s = P.stories[+it.dataset.p.slice(1)];
        showDetail(s.head, '《字触》故事定位（近似）', '…' + s.ctx + '…');
      }));
    }

    /* ---------- 拆字推演 ---------- */
    const IDS_OPS = new Set(['⿰','⿱','⿲','⿳','⿴','⿵','⿶','⿷','⿸','⿹','⿺','⿻']);
    const OP_NAMES = {
      '⿰':'左右', '⿱':'上下', '⿲':'左中右', '⿳':'上中下', '⿴':'全包围',
      '⿵':'上三包围', '⿶':'下三包围', '⿷':'左三包围', '⿸':'左上包围',
      '⿹':'右上包围', '⿺':'左下包围', '⿻':'穿插/嵌套',
    };

    function decomposeTree(ch, depth) {
      const d = (ch.length > 1 && IDS_OPS.has(ch[0])) ? ch : (D.cezi.decomp || {})[ch];
      if (!d || depth <= 0) return { ch, leaf: true };
      const op = d[0];
      if (!IDS_OPS.has(op)) return { ch, leaf: true };
      const rest = d.slice(1);
      if (IDS_OPS.has(rest[0] || '')) {
        const flat = Array.from(rest).filter(x => !IDS_OPS.has(x) && x !== '？');
        return { ch, op, name: OP_NAMES[op] || op, special: true, parts: flat.map(x => decomposeTree(x, depth - 1)) };
      }
      const p1 = rest[0] || '';
      const p2 = rest.slice(1);
      const parts = [];
      if (p1 && !IDS_OPS.has(p1)) parts.push(decomposeTree(p1, depth - 1));
      if (p2) parts.push(decomposeTree(p2, depth - 1));
      return { ch, op, name: OP_NAMES[op] || op, parts };
    }

    function partVerdicts(ch) {
      const out = [];
      (D.cezi.dict.entries || []).filter(e => e['条目字'] === ch).slice(0, 2).forEach(e => {
        out.push({ src: '字库', text: (e['原文'] || '').slice(0, 40) + (e['断语性质'] ? '（' + e['断语性质'] + '）' : '') });
      });
      (D.cezi.midie.quge_items || []).filter(it => it.char === ch).slice(0, 2).forEach(it => {
        out.push({ src: '取格', text: `${it.char}（${it.verdict}）` });
      });
      (TANYUAN || []).filter(t => t.char === ch).slice(0, 1).forEach(t => {
        out.push({ src: '探元赋', text: `${t.char}字者，${t.xiang}` });
      });
      return out;
    }

    function chaifaTransforms(c) {
      const out = [];
      (D.cezi.midie.methods || []).forEach(m => {
        (m.examples || []).forEach(ex => {
          if (ex.base === c) out.push({ method: m.title, kind: '正', from: c, to: ex.expand });
        });
      });
      (CHAIFA.get(c) || []).forEach(r => {
        if (r.base !== c) out.push({ method: r.method, kind: '反', from: r.base, to: c, via: r.via });
      });
      return out;
    }

    function renderTuilian(c) {
      const box = $('cz-results');
      const title = $('cz-results-title');
      title.textContent = `「${c}」拆字推演`;
      box.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'hit-card';
      const tree = decomposeTree(c, 4);
      let html = `<div class="hit-head"><span class="hit-char">${c}</span><span class="hit-verdict mid">字形拆解</span><span class="hit-src">Make Me a Hanzi 部件库（GPL-3.0，本地自用）</span></div>`;
      html += '<div class="decomp-tree">' + treeHtml(tree, c) + '</div>';
      const tf = chaifaTransforms(c);
      html += `<div class="hit-head" style="margin-top:10px;"><span class="hit-char" style="font-size:16px;">拆法变换</span><span class="hit-verdict mid">秘牒十法/心易六法</span><span class="hit-src">${tf.length ? tf.length + ' 条' : '无直接例字'}</span></div>`;
      if (tf.length) {
        html += '<div class="decomp-tree">' + tf.map(t => `<div class="titem"><span class="k">${t.method}</span>（${t.kind === '正' ? '可成' : '由' + t.from + '得'}）${t.from} → ${t.to}</div>`).join('') + '</div>';
      }
      html += '<div class="hit-head" style="margin-top:10px;"><span class="hit-char" style="font-size:16px;">部件/成字断语</span><span class="hit-verdict mid">字库 · 取格 · 探元赋</span></div>';
      const pv = collectPartVerdicts(tree);
      if (pv.length) {
        html += '<div class="decomp-tree">' + pv.map(p => `<div class="titem"><span class="k">${p.ch}</span> [${p.src}] ${p.text}</div>`).join('') + '</div>';
      } else {
        html += '<div class="c">该字拆解出的部件无直接断语（可查规则库搜索）。</div>';
      }
      const nodeSet = [];
      collectNodes(tree, nodeSet);
      const REV = D.cezi.rev_decomp || {};
      const revRows = [];
      nodeSet.slice(1).forEach(p => {
        if (p.length > 1 || IDS_OPS.has(p)) return;
        const ws = (REV[p] || []).filter(w => w !== c).slice(0, 10);
        if (!ws.length) return;
        revRows.push({ p, ws: ws.map(w => ({ w, n: partVerdicts(w).length })) });
      });
      if (revRows.length) {
        html += `<div class="hit-head" style="margin-top:10px;"><span class="hit-char" style="font-size:16px;">部件可入字</span><span class="hit-verdict mid">反向索引</span><span class="hit-src">MMH 反查：拆出的部件还能组成哪些字（每部件 ≤10）</span></div>`;
        html += '<div class="decomp-tree">' + revRows.map(r =>
          `<div class="titem"><span class="k">${r.p}</span> → ${r.ws.map(x => `${x.w}<span class="tag">${x.n}条</span>`).join(' ')}</div>`).join('') + '</div>';
      }
      const checkRows = [];
      (LIBAROWS || []).forEach(r => checkRows.push({ g: r.g + '宫', feat: r.x, d: r.d, src: '立八卦断' }));
      (ZIHUA || []).forEach(z => checkRows.push({ g: z.head, feat: '', d: z.text, src: '字画经验' }));
      if (checkRows.length) {
        html += `<div class="hit-head" style="margin-top:10px;"><span class="hit-char" style="font-size:16px;">笔画特征自查</span><span class="hit-verdict mid">立八卦断 · 字画经验</span><span class="hit-src">对照你所写的字笔画/结构，勾选相似特征 → 聚合断语</span></div>`;
        html += `<div id="cz-checks">` + checkRows.map((r, i) =>
          `<div class="check-item" data-zi="${i}"><span class="k">${r.g}${r.feat ? '：' + r.feat : ''}</span> ${r.d}</div>`).join('') + '</div>';
        html += '<div class="c" id="cz-picked" style="margin-top:6px;">尚未勾选</div>';
      }
      const combo = comboOmen(c, tree);
      if (combo.length) {
        html += `<div class="hit-head" style="margin-top:10px;"><span class="hit-char" style="font-size:16px;">组合取象</span><span class="hit-verdict mid">部件组合 → 古籍断语</span><span class="hit-src">取格/字库/探元赋/杂占中同时含两部件的条目（≤8）</span></div>`;
        html += '<div class="decomp-tree">' + combo.map(x =>
          `<div class="titem"><span class="k">${x.a}+${x.b}</span> [${x.src}] ${x.text}</div>`).join('') + '</div>';
      }
      wrap.innerHTML = html;
      box.insertBefore(wrap, box.firstChild);
      const checks = wrap.querySelectorAll('.check-item');
      checks.forEach(ch => ch.addEventListener('click', () => {
        ch.classList.toggle('on');
        const picked = [...wrap.querySelectorAll('.check-item.on')].map(x => x.textContent.trim());
        const el = wrap.querySelector('#cz-picked');
        el.textContent = picked.length ? picked.map((t, i) => `${i + 1}. ${t}`).join('\n') : '尚未勾选';
        el.style.whiteSpace = 'pre-wrap';
      }));
    }

    function collectNodes(node, acc) { acc.push(node.ch); (node.parts || []).forEach(k => collectNodes(k, acc)); }

    function comboOmen(c, tree) {
      const nodeSet = [];
      collectNodes(tree, nodeSet);
      const parts = nodeSet.filter(p => p.length === 1 && !IDS_OPS.has(p)).slice(0, 5);
      const pool = [];
      (D.cezi.midie.quge_items || []).forEach(it => pool.push({ src: '取格', k: it.char, text: it.verdict }));
      (D.cezi.dict.entries || []).forEach(e => { if (e['原文']) pool.push({ src: '字库', k: e['条目字'], text: e['原文'] }); });
      (TANYUAN || []).forEach(t => pool.push({ src: '探元赋', k: t.char, text: t.xiang }));
      (D.cezi.midie.zazhan || []).forEach(z => pool.push({ src: '杂占', k: z.char, text: z.text }));
      const out = [];
      const seen = new Set();
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i], b = parts[j];
          if (a === b) continue;
          pool.forEach(p => {
            const t = p.text || '';
            if (t.includes(a) && t.includes(b) && t.length < 60) {
              const key = p.src + p.k + t;
              if (!seen.has(key)) {
                seen.add(key);
                out.push({ a, b, src: p.src, text: t });
              }
            }
          });
        }
      }
      return out.slice(0, 8);
    }

    function treeHtml(node, rootChar) {
      if (node.leaf) {
        const v = partVerdicts(node.ch);
        const flag = v.length ? `<span class="tag key">${v.length} 条断语</span>` : '';
        return `<div class="titem leaf"><span class="k">${node.ch}</span>${flag}</div>`;
      }
      const v = partVerdicts(node.ch);
      const flag = v.length ? `<span class="tag key">${v.length} 条断语</span>` : '';
      const kids = (node.parts || []).map(k => `<div class="titem">${treeHtml(k)}</div>`).join('');
      const sp = node.special ? '<span class="c">（结构特殊，按字形部件平铺）</span>' : '';
      return `<div class="tnode"><span class="k">${node.ch}</span> <span class="c">${node.name || ''}${sp}</span>${flag}${kids ? '<div class="tchildren">' + kids + '</div>' : ''}</div>`;
    }

    function collectPartVerdicts(node, acc) {
      acc = acc || [];
      const v = partVerdicts(node.ch);
      v.forEach(x => acc.push({ ch: node.ch, ...x }));
      (node.parts || []).forEach(k => collectPartVerdicts(k, acc));
      return acc;
    }

    /* ---------- 规则库搜索 ---------- */
    function filterRuleBody(q) {
      const body = $('cz-rbody');
      if (!q) {
        renderRules(currentRuleTab);
        return;
      }
      body.querySelectorAll('mark.rule-hit').forEach(m => m.parentNode.replaceChild(document.createTextNode(m.textContent), m));
      body.normalize();
      body.querySelectorAll('.sec, .item, .cell').forEach(el => {
        const hit = el.textContent.toLowerCase().includes(q);
        el.style.display = hit ? '' : 'none';
        if (el.classList.contains('sec') && hit) el.classList.add('open');
      });
      const nodes2 = [];
      const walker2 = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
        acceptNode: n => n.parentNode && n.parentNode.tagName !== 'MARK' && n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
      });
      while (walker2.nextNode()) nodes2.push(walker2.currentNode);
      nodes2.forEach(node => {
        const text = node.textContent;
        const lower = text.toLowerCase();
        let idx = lower.indexOf(q);
        if (idx < 0) return;
        const frag = document.createDocumentFragment();
        let last = 0;
        while (idx >= 0) {
          frag.appendChild(document.createTextNode(text.slice(last, idx)));
          const mk = document.createElement('mark');
          mk.className = 'rule-hit';
          mk.textContent = text.slice(idx, idx + q.length);
          frag.appendChild(mk);
          last = idx + q.length;
          idx = lower.indexOf(q, last);
        }
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      });
    }

    /* ---------- 详情 ---------- */
    function showDetail(title, src, text) {
      const d = $('cz-detail');
      d.innerHTML = `<div class="side-back" id="cz-side-back">← 返回部件反查</div><h2>${esc(title)}</h2><div class="src">${esc(src)}</div><p>${esc(text)}</p>`;
      d.scrollTop = 0;
      const sb = $('cz-side-back');
      if (sb) sb.addEventListener('click', renderSideDefault);
    }
  })();


  // ===================== 塔罗（Tab 18）嵌套 IIFE =====================
  // 翻牌交互（叠位置 / 单击翻面 / 双击浮起归位 / 让位动画）自塔罗引擎子件逐字移植，勿改
  (() => {
    // 数据：D.tarot = { cards, rules, rules_papus, case_leads, de_laurence }
let CARDS = [];
let RULES = {};
let RULES_PAPUS = {};
let CASE_LEADS = {};
let DE_LAURENCE = {};
let drawn = []; // {card, reversed, posLabel, spreadName}

const SPREADS = {
  single:  { count: 1, labels: ['当下指引'] },
  choice:  { count: 2, labels: ['此路（选择 A）', '他路（选择 B）'] },
  three:   { count: 3, labels: ['过去', '现在', '未来'] },
  horseshoe:   { count: 5, labels: ['过去', '现在', '隐藏因素', '阻碍', '结果'] },
  relation:    { count: 7, labels: ['你（现状）', '对方（现状）', '关系（现状）', '你眼中的对方', '对方眼中的你', '关系阻碍', '建议与结果'] },
  celtic:  { count: 10, labels: ['1 现状', '2 阻碍', '3 目标与基础', '4 近期过去', '5 意识与最佳选择', '6 近期未来', '7 自身态度', '8 环境', '9 希望与恐惧', '10 结果'] },
  // De Laurence 古代凯尔特法（《Illustrated Key》：选 Significator 居中面朝上，1 盖其上、2 横压，3 冠上、4 基下、5 后左、6 前右，右竖柱 7-10）
  celtic_dl: { count: 11, labels: ['Significator（求问者/事由代表）', '① 此盖他（整体氛围）', '② 此十字架他（障碍）', '③ 冠他（目标/理想）', '④ 基他（基础/已实现）', '⑤ 后他（刚过去）', '⑥ 前他（近未来）', '⑦ 自身（态度）', '⑧ 环境（居所）', '⑨ 希望与恐惧', '⑩ 结果'] },
  // De Laurence 35 卡法：42 卡操作后余 35 张分六包（7/6/5/4/2/11）摆成六行，行含义见 labels
  m35:     { count: 35, labels: [] }, // labels 由 M35_LABELS 生成
  // De Laurence 42 卡法（替代法）：6 行×7 张网格；Significator（男=魔术师/女=女祭司）独立放置，读序行内从右到左
  m42:     { count: 43, labels: [] }, // labels 由 M42_LABELS 生成（43 = 42 网格 + 1 Significator）
  // Papus 四点位（Ch20）：求问者居中，1 开端→4 顶点→3 衰退→2 落幕，顺时针读
  p4:      { count: 5, labels: ['求问者（居中）', '1 开端 · 童年', '4 顶点 · 青年', '3 衰退 · 成熟', '2 落幕 · 老年'] },
  // Papus 十二点位：对应十二月，环绕一圈
  p12:     { count: 12, labels: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'] },
};

// 凯尔特十字标准布局：十字区（⑤上 / ④左 / ①中 / ⑥右 / ③下，②横压①）+ 右侧竖柱（⑦⑧⑨⑩）
// 翻牌动画：初始全部背面朝上，点击翻面；②（cross）翻开后自动滑开，露出①
// 竖柱双击：浮起置顶放大（图层第一层），再双击归位
const CELTIC_POS = [
  { x: 220, y: 200 },           // 1 现状（中心）
  { x: 226, y: 206, cross: 1 }, // 2 阻碍（横放压①）
  { x: 220, y: 380 },           // 3 目标与基础（下）
  { x: 50,  y: 200 },           // 4 近期过去（左）
  { x: 220, y: 30 },            // 5 意识与最佳选择（上）
  { x: 390, y: 200 },           // 6 近期未来（右）
  { x: 560, y: 10 },            // 7 自身态度（竖柱）
  { x: 560, y: 130 },           // 8 环境
  { x: 560, y: 250 },           // 9 希望与恐惧
  { x: 560, y: 370 },           // 10 结果
];
// ②翻开后的让位位置（①右下空档）
const CELTIC_CROSS_SLIDE = { x: 420, y: 440 };

// 圣三角（三张·过去-现在-未来）：正三角摆法——③结果在顶、①②在下
const TRIANGLE_POS = [
  { x: 20, y: 150 },    // 1 过去（左下）
  { x: 300, y: 150 },   // 2 现在（右下）
  { x: 160, y: 0 },     // 3 未来（顶部中央）
];

// 马蹄铁（5 张）：U 形（开口向上）——1/2 左臂、3 底部、4/5 右臂
const HORSESHOE_POS = [
  { x: 20, y: 0 },      // 1 过去（左上）
  { x: 20, y: 150 },    // 2 现在（左中）
  { x: 160, y: 300 },   // 3 隐藏因素（底部）
  { x: 300, y: 150 },   // 4 阻碍（右中）
  { x: 300, y: 0 },     // 5 结果（右上）
];

// 关系牌阵（7 张）：两列三行 + 底部居中
const RELATION_POS = [
  { x: 20, y: 0 },      // 1 你（现状）
  { x: 300, y: 0 },     // 2 对方（现状）
  { x: 20, y: 150 },    // 3 关系（现状）
  { x: 300, y: 150 },   // 4 你眼中的对方
  { x: 20, y: 300 },    // 5 对方眼中的你
  { x: 300, y: 300 },   // 6 关系阻碍
  { x: 160, y: 450 },   // 7 建议与结果（底部居中）
];

// —— De Laurence 凯尔特法：Significator 中心正面，1 盖、2 横压，3 冠上/4 基下/5 后左/6 前右，右竖柱 7-10 ——
const CELTIC_DL_POS = [
  { x: 220, y: 200 },             // 0 Significator（居中，始终正面）
  { x: 226, y: 206, cross: 1 },   // 1 ① 此盖他（盖于 Significator 上）
  { x: 232, y: 212, cross: 1 },   // 2 ② 此十字架他（横压 ①）
  { x: 220, y: 30 },              // 3 ③ 冠他（上）
  { x: 220, y: 370 },             // 4 ④ 基他（下）
  { x: 50,  y: 200 },             // 5 ⑤ 后他（左）
  { x: 390, y: 200 },             // 6 ⑥ 前他（右）
  { x: 560, y: 10 },              // 7 ⑦ 自身（竖柱）
  { x: 560, y: 130 },             // 8 ⑧ 环境
  { x: 560, y: 250 },             // 9 ⑨ 希望与恐惧
  { x: 560, y: 370 },             // 10 ⑩ 结果
];
const DL_SLIDE = { x: 420, y: 440 };   // ② 翻开后的让位（露出 ①）
const DL_SLIDE2 = { x: 290, y: 440 };  // ① 翻开后的让位（露出 Significator）

// —— Papus 四点位：求问者中心，上 1 开端 / 右 4 顶点 / 下 3 衰退 / 左 2 落幕 ——
const P4_POS = [
  { x: 210, y: 200 },  // 0 求问者（中心）
  { x: 210, y: 10 },   // 1 开端（上）
  { x: 410, y: 200 },  // 2 顶点（右）
  { x: 210, y: 390 },  // 3 衰退（下）
  { x: 10,  y: 200 },  // 4 落幕（左）
];

// —— 35 卡法六行（小牌）：行1 7 / 行2 6 / 行3 5 / 行4 4 / 行5 2 / 行6 11 ——
function m35Pos() {
  const rows = [7, 6, 5, 4, 2, 11];
  const W = 74, H = 140;
  const maxW = 11 * W;  // 行6 最宽
  const pos = [];
  rows.forEach((n, ri) => {
    const x0 = Math.round((maxW - n * W) / 2);
    for (let k = 0; k < n; k++) pos.push({ x: x0 + k * W, y: ri * H });
  });
  return pos;
}
const M35_LABELS = [];
{
  const rows = [
    ['第一行 · 房屋、环境等', 7],
    ['第二行 · 人物或占卜主题', 6],
    ['第三行 · 外部事件、人物', 5],
    ['第四行 · 惊喜、意外', 4],
    ['第五行 · 安慰（缓和不利）', 2],
    ['第六行 · 解释钥（须结合其他行）', 11],
  ];
  rows.forEach(([lab, n]) => { for (let k = 0; k < n; k++) M35_LABELS.push(lab); });
}

// —— 42 卡法：6 行×7 张网格，读序行内从右到左、行从上到下 ——
const M42_LABELS = [];
{
  for (let ri = 0; ri < 6; ri++) {
    for (let k = 0; k < 7; k++) M42_LABELS.push('第' + (ri + 1) + '行 · 右起第' + (k + 1) + '张');
  }
  M42_LABELS.push('Significator（男·魔术师，置于第一行右侧）');
}
function m42Pos() {
  const W = 74, H = 140;
  const pos = [];
  for (let ri = 0; ri < 6; ri++)
    for (let k = 0; k < 7; k++) pos.push({ x: k * W, y: ri * H });
  pos.push({ x: 560, y: 10 }); // Significator 独立位
  return pos;
}
// 42 卡法抽牌：抽 42 张；若含魔术师（男 Significator）则取出放独立位、从剩余牌随机补 1 张回网格；
// 若不含则从剩余 36 张中取魔术师放独立位（网格 42 张不变）
function draw42() {
  const pool = shuffle(CARDS);
  const pick = pool.slice(0, 42).map((card, i) => ({
    card, reversed: Math.random() < revProb,
    posLabel: M42_LABELS[i],
  }));
  const rest = pool.slice(42);
  const magIdx = pick.findIndex(d => d.card.name === 'The Magician');
  if (magIdx >= 0) {
    const sig = pick.splice(magIdx, 1)[0];
    const fill = rest[Math.floor(Math.random() * rest.length)];
    pick.splice(magIdx, 0, { card: fill, reversed: Math.random() < revProb, posLabel: M42_LABELS[magIdx] });
    pick.push({ ...sig, posLabel: M42_LABELS[42] });
  } else {
    const sigIdx = rest.findIndex(c => c.name === 'The Magician');
    pick.push({ card: rest[sigIdx], reversed: Math.random() < revProb, posLabel: M42_LABELS[42] });
  }
  return pick;
}

// —— Papus 十二点位：十二月环绕一圈（表盘式，12 点方向起顺时针） ——
function p12Pos() {
  const cx = 310, cy = 280, R = 195; // 相邻牌距 = 2R·sin15° ≈ 101px > 牌宽 98
  const pos = [];
  for (let i = 0; i < 12; i++) {
    const rad = (Math.PI / 2) - (i * Math.PI * 2 / 12); // 12 点方向起顺时针
    pos.push({ x: Math.round(cx + R * Math.cos(rad) - 49), y: Math.round(cy - R * Math.sin(rad) - 85) });
  }
  return pos;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function slugOf(card) {
  // 统一 slug：小写，" of " → "-of-"，其余空白 → "-"
  return card.name.toLowerCase().replace(/ of /g, '-of-').replace(/[^a-z0-9]+/g, '-');
}

// 牌池过滤：按下拉选择返回可用牌（42 卡法除外——原书要求洗全副牌）
function filterPool() {
  const v = poolSel ? poolSel.value : 'all';
  if (v === 'major') return CARDS.filter(c => c.arcana === 'major');
  if (v === 'minor') return CARDS.filter(c => c.arcana !== 'major');
  if (v === 'wands' || v === 'cups' || v === 'swords' || v === 'pentacles')
    return CARDS.filter(c => c.arcana !== 'major' && c.suit === v);
  return CARDS;
}

function draw(n) {
  const pool = shuffle(filterPool());
  return pool.slice(0, n).map((card, i) => ({
    card,
    reversed: Math.random() < revProb,
    posLabel: spreadSel.value === 'm35' ? (M35_LABELS[i] || '位置 ' + (i + 1)) : (SPREADS[spreadSel.value].labels[i] || '位置 ' + (i + 1)),
  }));
}

const spreadSel = document.getElementById('tl-spread');
const drawBtn = document.getElementById('tl-draw');
const resetBtn = document.getElementById('tl-reset');
const boardTitle = document.getElementById('tl-board-title');
const cardsArea = document.getElementById('tl-cards');
const detail = document.getElementById('tl-detail');
const modeSel = document.getElementById('tl-mode');
const manualBox = document.getElementById('tl-manual-box');
const manualCard = document.getElementById('tl-manual-card');
const manualRev = document.getElementById('tl-manual-rev');
const manualAdd = document.getElementById('tl-manual-add');
const manualPicksEl = document.getElementById('tl-manual-picks');
const hintLine = document.getElementById('tl-hint');
const revRate = document.getElementById('tl-rev-rate');
const revRateVal = document.getElementById('tl-rev-rate-val');
const historyBtn = document.getElementById('tl-history');
const summaryBtn = document.getElementById('tl-summary');
const rulesBtn = document.getElementById('tl-rules');
const astroBtn = document.getElementById('tl-astro');
const poolSel = document.getElementById('tl-pool');
let revProb = 0.5;
revRate.addEventListener('input', () => {
  revProb = Number(revRate.value) / 100;
  revRateVal.textContent = revRate.value + '%';
});
const manualPicks = []; // {card, rev}
const flipped = new Set(); // 已翻开的牌 idx
let crossMoved = false;    // ②是否已让位（双击可放回）
let dlMoved1 = false;      // DL 凯尔特法 ① 是否已让位
let dlMoved2 = false;      // DL 凯尔特法 ② 是否已让位

function render() {
  cardsArea.innerHTML = '';
  flipped.clear();
  crossMoved = false;
  dlMoved1 = false;
  dlMoved2 = false;
  const spread = spreadSel.value;
  const isCeltic = spread === 'celtic';
  const isCelticDl = spread === 'celtic_dl';
  const isTriangle = spread === 'three';
  const isHorseshoe = spread === 'horseshoe';
  const isRelation = spread === 'relation';
  const isM35 = spread === 'm35';
  const isM42 = spread === 'm42';
  const isP4 = spread === 'p4';
  const isP12 = spread === 'p12';
  if (isCeltic || isCelticDl) {
    cardsArea.style.position = 'relative';
    cardsArea.style.minHeight = '640px';
    cardsArea.style.minWidth = '720px';
  } else if (isTriangle) {
    cardsArea.style.position = 'relative';
    cardsArea.style.minHeight = '310px';
    cardsArea.style.minWidth = '460px';
  } else if (isHorseshoe) {
    cardsArea.style.position = 'relative';
    cardsArea.style.minHeight = '400px';
    cardsArea.style.minWidth = '460px';
  } else if (isRelation) {
    cardsArea.style.position = 'relative';
    cardsArea.style.minHeight = '560px';
    cardsArea.style.minWidth = '460px';
  } else if (isM35) {
    cardsArea.style.position = 'relative';
    cardsArea.style.minHeight = '900px';
    cardsArea.style.minWidth = '830px';
  } else if (isM42) {
    cardsArea.style.position = 'relative';
    cardsArea.style.minHeight = '900px';
    cardsArea.style.minWidth = '660px';
  } else if (isP4) {
    cardsArea.style.position = 'relative';
    cardsArea.style.minHeight = '540px';
    cardsArea.style.minWidth = '560px';
  } else if (isP12) {
    cardsArea.style.position = 'relative';
    cardsArea.style.minHeight = '620px';
    cardsArea.style.minWidth = '600px';
  } else {
    cardsArea.style.position = '';
    cardsArea.style.minHeight = '';
    cardsArea.style.minWidth = '';
  }
  drawn.forEach((d, i) => {
    const slot = document.createElement('div');
    slot.className = 'card-slot' + (d.reversed ? ' reversed' : '');
    slot.dataset.idx = i;
    let p = null;
    if (isCeltic) {
      p = CELTIC_POS[i];
      if (p.cross) slot.classList.add('crossing');
    } else if (isCelticDl) {
      p = CELTIC_DL_POS[i];
      if (p.cross) slot.classList.add('crossing');
    } else if (isTriangle) {
      p = TRIANGLE_POS[i] || { x: i * 170, y: 20 };
    } else if (isHorseshoe) {
      p = HORSESHOE_POS[i] || { x: i * 170, y: 20 };
    } else if (isRelation) {
      p = RELATION_POS[i] || { x: (i % 2) * 300, y: Math.floor(i / 2) * 150 };
    } else if (isM35) {
      p = m35Pos()[i] || { x: (i % 11) * 74, y: Math.floor(i / 11) * 140 };
    } else if (isM42) {
      p = m42Pos()[i] || { x: (i % 7) * 74, y: Math.floor(i / 7) * 140 };
    } else if (isP4) {
      p = P4_POS[i] || { x: i * 170, y: 20 };
    } else if (isP12) {
      p = p12Pos()[i] || { x: i * 170, y: 20 };
    }
    if (p) {
      slot.style.position = 'absolute';
      slot.style.left = p.x + 'px';
      slot.style.top = p.y + 'px';
      slot.style.margin = '0';
    }
    if (isM35 || isM42) slot.classList.add('small');
    if (isP12) slot.classList.add('mid');
    // 3D 翻牌结构：牌背 + 正面
    const inner = document.createElement('div');
    inner.className = 'card-3d';
    const back = document.createElement('div');
    back.className = 'card-face card-back';
    const mark = document.createElement('div');
    mark.className = 'back-mark';
    mark.textContent = 'RWS';
    back.appendChild(document.createTextNode('韦特'));
    back.appendChild(mark);
    const front = document.createElement('div');
    front.className = 'card-face card-front';
    const img = document.createElement('img');
    img.src = './engine/decks/' + slugOf(d.card) + '.webp';
    img.alt = d.card.name;
    img.onerror = () => { img.src = ''; img.style.background = '#2a2240'; };
    front.appendChild(img);
    inner.appendChild(back);
    inner.appendChild(front);
    const label = document.createElement('div');
    label.className = 'pos-label';
    label.textContent = d.posLabel;
    const name = document.createElement('div');
    name.className = 'card-name';
    name.innerHTML = (d.card.cn_name || d.card.name) + (d.reversed ? ' <span class="rev-tag">逆</span>' : '');
    slot.appendChild(label);
    slot.appendChild(inner);
    slot.appendChild(name);
    slot.addEventListener('click', () => onClickCard(i));
    slot.addEventListener('dblclick', () => onDblClickCard(i));
    cardsArea.appendChild(slot);
    // DL 凯尔特法：Significator（idx0）始终正面朝上
    if (isCelticDl && i === 0) {
      flipped.add(0);
      inner.classList.add('flipped');
    }
  });
  boardTitle.textContent = '牌阵：' + spreadSel.options[spreadSel.selectedIndex].text + '（' + drawn.length + ' 张）' +
    ' · 点牌翻面查看释义' + (spreadSel.value === 'celtic' ? '，十张全部可见' : (spreadSel.value === 'celtic_dl' ? '，Significator 居中正面，①/② 翻开后自动让位' : ''));
}

function onClickCard(idx) {
  if (!drawn[idx]) return;
  const slot = document.querySelectorAll('.card-slot')[idx];
  if (!slot) return;
  const inner = slot.querySelector('.card-3d');
  const spread = spreadSel.value;
  // DL 凯尔特法：Significator 不翻（始终正面）；① 翻开让位露出 Significator；② 翻开让位露出 ①
  if (spread === 'celtic_dl') {
    if (idx === 0) { select(0); return; }
    // ①/②已翻开且已放回：单击再滑开（来回切换，与 celtic 十字 ② 行为一致）
    if (idx === 2 && flipped.has(2) && !dlMoved2) {
      dlMoved2 = true;
      slideTo(slot, DL_SLIDE.x, DL_SLIDE.y);
      select(idx);
      return;
    }
    if (idx === 1 && flipped.has(1) && !dlMoved1) {
      dlMoved1 = true;
      slideTo(slot, DL_SLIDE2.x, DL_SLIDE2.y);
      select(idx);
      return;
    }
    if (!flipped.has(idx)) {
      flipped.add(idx);
      inner.classList.add('flipped');
      if (idx === 2 && !dlMoved2) {
        dlMoved2 = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            slot.style.transition = 'left .5s ease, top .5s ease';
            slot.style.left = DL_SLIDE.x + 'px';
            slot.style.top = DL_SLIDE.y + 'px';
          });
        });
      } else if (idx === 1 && !dlMoved1) {
        dlMoved1 = true;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            slot.style.transition = 'left .5s ease, top .5s ease';
            slot.style.left = DL_SLIDE2.x + 'px';
            slot.style.top = DL_SLIDE2.y + 'px';
          });
        });
      }
    }
    select(idx);
    return;
  }
  // 十二点位 / 四点位：单击翻面并浮起置顶（图层最高层+放大），再单击归位（正面状态保持）
  if (spread === 'p12' || spread === 'p4') {
    if (slot.classList.contains('raised')) {
      slot.classList.remove('raised');
      slot.style.zIndex = '';
      slot.style.boxShadow = '';
      select(idx);
      return;
    }
    raiseOrLower(idx, slot);
    return;
  }
  // ②已翻开且已放回：单击再滑开（来回切换）
  if (spread === 'celtic' && idx === 1 && flipped.has(1) && !crossMoved) {
    crossMoved = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        slot.style.transition = 'left .5s ease, top .5s ease';
        slot.style.left = CELTIC_CROSS_SLIDE.x + 'px';
        slot.style.top = CELTIC_CROSS_SLIDE.y + 'px';
      });
    });
    select(idx);
    return;
  }
  if (!flipped.has(idx)) {
    flipped.add(idx);
    inner.classList.add('flipped');
    // ②翻开后滑开，露出①（rAF 延迟，确保起始帧已渲染，滑动动画可见）
    if (spreadSel.value === 'celtic' && idx === 1 && !crossMoved) {
      crossMoved = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          slot.style.transition = 'left .5s ease, top .5s ease';
          slot.style.left = CELTIC_CROSS_SLIDE.x + 'px';
          slot.style.top = CELTIC_CROSS_SLIDE.y + 'px';
        });
      });
    }
  }
  select(idx);
}

// 双击②：正面朝上滑回①上（放回原位，不翻回背面）
// 双击竖柱牌（7-10）：浮起置顶放大（图层第一层），再双击归位
// 马蹄铁 / 关系牌阵：双击任意牌浮起置顶放大，再双击归位（正面状态保持）
function onDblClickCard(idx) {
  const spread = spreadSel.value;
  const slot = document.querySelectorAll('.card-slot')[idx];
  if (!slot) return;
  if (spread === 'celtic_dl') {
    // ①/② 双击滑回原位（正面朝上，不翻回背面）
    if (idx === 2 && dlMoved2) { dlMoved2 = false; slideTo(slot, CELTIC_DL_POS[2].x, CELTIC_DL_POS[2].y); return; }
    if (idx === 1 && dlMoved1) { dlMoved1 = false; slideTo(slot, CELTIC_DL_POS[1].x, CELTIC_DL_POS[1].y); return; }
    if (idx === 0 || (idx >= 7 && idx <= 10)) { raiseOrLower(idx, slot); }
    return;
  }
  if (spread === 'celtic') {
    if (idx === 1) {
      if (!crossMoved) return;
      crossMoved = false;
      slideTo(slot, CELTIC_POS[1].x, CELTIC_POS[1].y);
      return;
    }
    if (idx === 0 || (idx >= 6 && idx <= 9)) {
      raiseOrLower(idx, slot);
    }
    return;
  }
  if (spread === 'horseshoe' || spread === 'relation') {
    raiseOrLower(idx, slot);
  }
}

function raiseOrLower(idx, slot) {
  const inner = slot.querySelector('.card-3d');
  if (slot.classList.contains('raised')) {
    // 归位：仅收起浮层（尺寸/层级/高亮），保持当前正背面状态不变
    slot.classList.remove('raised');
    slot.style.zIndex = '';
    slot.style.boxShadow = '';
  } else {
    // 浮起：翻开正面（若未翻开）+ 置顶放大 + 高亮
    if (!flipped.has(idx)) {
      flipped.add(idx);
      inner.classList.add('flipped');
    }
    slot.classList.add('raised');
    slot.style.zIndex = 20;
    slot.style.boxShadow = '0 0 0 2px rgba(240,200,96,.55), 0 10px 30px rgba(0,0,0,.5)';
  }
  select(idx);
}

function slideTo(slot, x, y) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      slot.style.transition = 'left .5s ease, top .5s ease';
      slot.style.left = x + 'px';
      slot.style.top = y + 'px';
    });
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Case 原章节全文（按需 IPC 取，原文未经删改）
async function showCaseChapter(key, backIdx) {
  const res = await window.qianzhan.tarotCase(key);
  if (!res || !res.ok) {
    detail.innerHTML = '<h2>Case 章节</h2><p style="color:#8a7aa8;">读取失败：' + escapeHtml((res && res.reason) || 'unknown') + '</p>';
    return;
  }
  detail.innerHTML =
    '<h2>Key ' + res.key + '：' + escapeHtml(res.title) + '（' + escapeHtml(res.letter) + '）</h2>' +
    '<div class="src">源：Case《The Tarot: A Key to the Wisdom of the Ages》1927，文本层提取（' + res.char_count + ' 字符，原文未经删改）</div>' +
    '<div style="font-size:13px;line-height:1.65;color:#d8d0e8;white-space:pre-wrap;max-height:520px;overflow-y:auto;">' + escapeHtml(res.text) + '</div>' +
    '<p><button id="tl-case-back" style="margin-top:8px;padding:4px 12px;">← 返回释义</button></p>';
  const bk = document.getElementById('tl-case-back');
  if (bk) bk.addEventListener('click', () => select(backIdx));
}

function select(idx) {
  if (!drawn[idx]) return;
  const d = drawn[idx];
  const c = d.card;
  document.querySelectorAll('.card-slot').forEach(s => s.classList.remove('selected'));
  const slots = document.querySelectorAll('.card-slot');
  if (slots[idx]) slots[idx].classList.add('selected');
  const rev = d.reversed ? '（逆位）' : '（正位）';
  const yesno = d.reversed ? (c.yes_no_reversed || '—') : (c.yes_no_upright || '—');
  const kws = d.reversed ? c.keywords_reversed : c.keywords_upright;
  const mUp = d.reversed ? c.meaning_reversed : c.meaning_upright;
  const waite = d.reversed ? c.waite_meaning_rev : c.waite_meaning_up;
  const love = d.reversed ? c.love_reversed : c.love_upright;
  const el = c.element ? '<span>元素 ' + c.element + '</span>' : '';
  const pl = c.planet ? '<span>行星 ' + c.planet + '</span>' : '';
  const zo = c.zodiac ? '<span>星座 ' + c.zodiac + '</span>' : '';
  const dec = c.decan ? '<span>Decan ' + c.decan + '</span>' : '';
  detail.innerHTML =
    '<h2>' + (c.cn_name || c.name) + ' <span style="font-size:13px;color:#8a7aa8;font-weight:400;">' + c.name + '</span> ' + rev + '</h2>' +
    '<div class="meta">' +
      '<span>' + (c.arcana === 'major' ? '大阿卡纳' : '小阿卡纳' + (c.suit ? ' · ' + c.suit : '')) + '</span>' +
      el + pl + zo + dec +
      '<span>是/否 ' + yesno + '</span>' +
    '</div>' +
    '<h3>关键词（' + (d.reversed ? '逆位' : '正位') + '）</h3><p>' + (kws || '—') + '</p>' +
    (d.reversed
      ? (c.cn_keywords_reversed ? '<h3>关键词（中文）</h3><p>' + c.cn_keywords_reversed + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>' : '')
      : (c.cn_keywords_upright ? '<h3>关键词（中文）</h3><p>' + c.cn_keywords_upright + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>' : '')) +
    '<h3>含义（tarotoo）</h3><p>' + (mUp || '—') + '</p>' +
    (d.reversed
      ? (c.cn_meaning_reversed ? '<h3>含义（中文）</h3><p>' + c.cn_meaning_reversed + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>' : '')
      : (c.cn_meaning_upright ? '<h3>含义（中文）</h3><p>' + c.cn_meaning_upright + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>' : '')) +
    '<h3>Waite 原典释义</h3><p>' + (waite || '—') + '</p>' +
    (d.reversed
      ? (c.cn_waite_meaning_rev ? '<h3>Waite 原典释义（中文）</h3><p>' + c.cn_waite_meaning_rev + '</p>' : '')
      : (c.cn_waite_meaning_up ? '<h3>Waite 原典释义（中文）</h3><p>' + c.cn_waite_meaning_up + '</p>' : '')) +
    '<div class="src">源：ekelen/tarot-api（Waite《The Pictorial Key to the Tarot》直引，MIT）；中文为程序内翻译，仅供参考</div>' +
    (c.waite_full_up ? '<h3>Waite 完整释义（Divinatory Meanings）</h3><p>' + c.waite_full_up + '</p>' +
      (d.reversed && c.waite_full_rev ? '<p style="margin-top:6px;"><b style="color:#ff9d8a;">Reversed:</b> ' + c.waite_full_rev + '</p>' : '') +
      '<div class="src">源：sacred-texts Waite 1910 公版全文（经 ekelen/tarot-api scraper 抓取，MIT）</div>' : '') +
    (c.waite_desc ? '<h3>Waite 牌面描述</h3><p>' + c.waite_desc + '</p>' +
      (c.cn_waite_desc ? '<h3>牌面描述（中文）</h3><p>' + c.cn_waite_desc + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>' : '') : '') +
    '<h3>爱情释义（love-tarot）</h3><p>' + (love || '—') + '</p>' +
    '<div class="src">源：loveoracle.app 开源数据（CC BY 4.0）</div>' +
    (d.reversed
      ? (c.love_zh_reversed ? '<h3>爱情释义（中文）</h3><p>' + c.love_zh_reversed + '</p>' : '')
      : (c.love_zh_upright ? '<h3>爱情释义（中文）</h3><p>' + c.love_zh_upright + '</p>' : '')) +
    '<h3>位置</h3><p>' + d.posLabel + '</p>' +
    ruleBlock(c, d.reversed);
  const csBtn = document.getElementById('tl-case-src-btn');
  if (csBtn) csBtn.addEventListener('click', () => showCaseChapter(c.number, idx));
}

// 规则层显示：大阿卡纳 → 希伯来字母；数字 0-10 → Case 数字学
function ruleBlock(c, rev) {
  let html = '<h3>规则层（Case 1927）</h3>';
  const attrs = (RULES.hebrew_attribution || []).filter(a => String(a.key) === String(c.number));
  if (c.arcana === 'major' && attrs.length) {
    const a = attrs[0];
    html += '<p>希伯来字母：<b>' + a.hebrew_char + ' ' + a.letter + '</b>' + (a.note ? '<br><span style="font-size:11px;color:#7a6a98;">' + a.note + '</span>' : '') + '</p>';
  }
  const num = (RULES.numbers || []).filter(n => n.number === c.number)[0];
  if (num) {
    html += '<p><b>数字 ' + c.number + '</b>：' + num.meanings + '</p>' +
      '<p style="font-size:11px;color:#7a6a98;">Qabalah：' + (num.qabalah_name || '—') + ' · 智能：' + (num.intelligence || '—') + '</p>';
  }
  // Papus 数字神智学（可计算，仅大阿卡纳有 Case 编号）
  if (RULES_PAPUS && RULES_PAPUS.numbers_esoterism && c.arcana === 'major') {
    const val = theosophicReduction(c.number);
    html += '<p style="font-size:11px;color:#7a6a98;margin-top:6px;"><b>数字神智学（Papus）</b>：' + c.number + ' 的约简 = ' + val +
      (val === 1 ? '（统一）' : '') + '；' + c.number + ' 的加算 = Σ(1..' + c.number + ') = ' + theosophicReduction(c.number * (c.number + 1) / 2) + '（约简）</p>';
  }
  if (!attrs.length && !num) {
    html += '<p style="color:#8a7aa8;">无（非大阿卡纳/数字超出 Case 数字学 0-10 范围）</p>';
  }
  // Case 原章节 lead（大阿卡纳）
  if (c.arcana === 'major' && CASE_LEADS && CASE_LEADS[c.number]) {
    const lead = CASE_LEADS[c.number];
    html += '<p style="font-size:11px;color:#b0a3c8;margin-top:6px;">Case 原章节（Key ' + c.number + '，' + lead.char_count + ' 字符）：' +
      escapeHtml(lead.lead) + '…' +
      '<br><button id="tl-case-src-btn" style="margin-top:4px;padding:3px 10px;font-size:12px;">阅读 Case 原章节全文</button></p>';
  }
  // Papus 体系（与韦特体系元素对应不同，须标注）
  if (RULES_PAPUS && RULES_PAPUS.suits) {
    const suitKey = String(c.suit || '').toLowerCase();
    if (c.arcana === 'minor' && suitKey) {
      const s = RULES_PAPUS.suits.find(x => x.suit === suitKey);
      if (s) {
        const rank = String(c.name.split(' of ')[0]).toLowerCase();
        const cr = RULES_PAPUS.court_letters.find(x => x.rank === rank);
        const sept = minorSeptenaryOf(rank, RULES_PAPUS);
        const dec = (RULES_PAPUS.zodiac_decani && RULES_PAPUS.zodiac_decani.series) ? RULES_PAPUS.zodiac_decani.series.find(x => x.card === String(c.name).toLowerCase()) : null;
        html += '<p><b>Papus 体系</b>：' + s.papus_name + ' = ' + s.letter + '（' + s.principle + '）；元素：' + s.element + '</p>' +
          (cr ? '<p style="font-size:11px;color:#7a6a98;">宫廷对应：' + cr.card_group + ' 的 ' + cr.letter + '</p>' : '') +
          (sept ? '<p style="font-size:11px;color:#7a6a98;">属 ' + sept.letter + ' 领域：' + (sept.world || '—') + '</p>' : '') +
          (dec ? '<p style="font-size:11px;color:#7a6a98;">天文塔罗（Ch16）：' + dec.zodiac_sign + ' · ' + dec.decan + '</p>' : '') +
          '<p style="font-size:11px;color:#b0a3c8;">注意：Papus 元素对应与韦特体系不同（' + s.note + '）</p>';
      }
    } else if (c.arcana === 'major' && RULES_PAPUS.letter_groups) {
      const g = RULES_PAPUS.letter_groups.find(x => x.keys.indexOf(c.number) >= 0);
      const sept = RULES_PAPUS.major_septenaries ? RULES_PAPUS.major_septenaries.find(x => x.range.indexOf(c.number) >= 0) : null;
      html += g
        ? '<p><b>Papus 体系</b>：' + g.letter + ' 组（' + g.meaning + '）</p>' +
          '<p style="font-size:11px;color:#7a6a98;">同组卡：' + g.keys.join('、') + '</p>'
        : '<p><b>Papus 体系</b>：无分组（Key ' + c.number + ' 未列入 Papus 字母组）</p>' +
          '<p style="font-size:11px;color:#7a6a98;">Key 0 愚者在 Papus 体系中独立，不入字母组</p>';
      html += (sept ? '<p style="font-size:11px;color:#7a6a98;">七组归属：第 ' + sept.septenary + ' 组 · ' + sept.letter + ' · ' + sept.polarity + ' · ' + sept.world + '</p>' : '');
    }
  }
  // Papus 占卜释义（Ch20 Divining Tarot：小卡逐牌 + 大卡逐牌 + 体系）
  if (RULES_PAPUS && RULES_PAPUS.divining_minor && RULES_PAPUS.divining_major) {
    const suitKey = { wands: 'SCEPTRES', cups: 'CUPS', swords: 'SWORDS', pentacles: 'PENTACLES' }[String(c.suit || '').toLowerCase()];
    if (c.arcana === 'minor' && suitKey) {
      const blk = RULES_PAPUS.divining_minor.suits[suitKey];
      const rank = String(c.name.split(' of ')[0]);
      const cardKey = rank === 'Ace' ? 'ACE OF ' + suitKey
        : ({ King: 'KING', Queen: 'QUEEN', Knight: 'KNIGHT', Page: 'KNAVE' }[rank] || rank.toUpperCase());
      const txt = blk && blk.cards ? blk.cards[cardKey] : null;
      const txtCn = blk && blk.cards ? blk.cards['cn_' + cardKey] : null;
      html += '<p><b>Papus 占卜释义（Divinatory）</b>：' + (txt || '—') + '</p>' +
        (txtCn ? '<p style="font-size:11px;color:#7a6a98;">' + txtCn + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>' : '') +
        '<p style="font-size:11px;color:#7a6a98;">花色原理：' + (blk ? blk.keywords : '—') + '</p>';
    } else if (c.arcana === 'major') {
      const maj = (RULES_PAPUS.divining_major.cards || []).find(x => x.waite_name === c.name);
      if (maj) {
        html += '<p><b>Papus 占卜释义（Divinatory）</b>：' + maj.meaning + '</p>' +
          (maj.cn_meaning ? '<p style="font-size:11px;color:#7a6a98;">' + maj.cn_meaning + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>' : '') +
          '<p style="font-size:11px;color:#7a6a98;">Papus 编号 ' + maj.papus_no + ' · 名 ' + maj.papus_name + '（Papus 编号体系与韦特不同）</p>';
      }
    }
  }
  // De Laurence 第二原典对照（Waite 同期改编版，措辞有异）
  if (DE_LAURENCE && (DE_LAURENCE.minor || DE_LAURENCE.major)) {
    let dtext = '';
    if (c.arcana === 'minor') {
      const suit = String(c.suit || '').toLowerCase();
      const rank = String(c.name.split(' of ')[0]);
      const hit = (DE_LAURENCE.minor || []).find(x => x.suit === suit && String(x.rank) === String(rank).toUpperCase());
      const add = (DE_LAURENCE.additional || []).find(x => x.suit === suit && String(x.rank).toLowerCase() === String(rank).toLowerCase());
      if (hit) {
        dtext = '<p><b>De Laurence 释义（第二原典）</b>：' + (rev && hit.reversed ? hit.reversed : hit.divinatory) + '</p>' +
          (rev && hit.cn_reversed || !rev && hit.cn_divinatory
            ? '<p style="font-size:11px;color:#7a6a98;">' + (rev ? hit.cn_reversed : hit.cn_divinatory) + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>'
            : '') +
          (add ? '<p style="font-size:11px;color:#7a6a98;">附加含义（§4）：' + (rev && add.reversed ? add.reversed : add.meaning) + (rev && add.cn_reversed || !rev && add.cn_meaning ? '<br>' + (rev ? add.cn_reversed : add.cn_meaning) : '') + '</p>' : '') +
          '<p style="font-size:11px;color:#7a6a98;">正位：' + hit.divinatory + (hit.reversed ? '<br>逆位：' + hit.reversed : '') + '</p>';
      }
    } else if (c.arcana === 'major') {
      const hit = (DE_LAURENCE.major || []).find(x => x.num === c.number);
      if (hit) {
        dtext = '<p><b>De Laurence 释义（第二原典）</b>：' + (rev && hit.reversed ? hit.reversed : hit.divinatory) + '</p>' +
          (rev && hit.cn_reversed || !rev && hit.cn_divinatory
            ? '<p style="font-size:11px;color:#7a6a98;">' + (rev ? hit.cn_reversed : hit.cn_divinatory) + '</p><div class="src">程序内翻译，仅供参考；原文见上方</div>'
            : '') +
          '<p style="font-size:11px;color:#7a6a98;">正位：' + hit.divinatory + (hit.reversed ? '<br>逆位：' + hit.reversed : '') + '</p>';
      }
    }
    if (dtext) {
      html += dtext + '<div class="src">源：De Laurence《The Illustrated Key to the Tarot》（Gutenberg，公版；Waite《Pictorial Key》同期改编版，措辞有异）</div>';
    }
  }
  // Papus Ch18 卡巴拉（Etteila 数分解 + Adam 象形）
  if (RULES_PAPUS && RULES_PAPUS.kabbalah) {
    const kab = RULES_PAPUS.kabbalah;
    html += '<p><b>卡巴拉（Papus Ch18）</b></p>';
    const adamEntry = kab.adam_hierogram.find(x => x.key === 'keys');
    if (c.arcana === 'major' && [1, 4, 13].indexOf(c.number) >= 0 && adamEntry) {
      const letterOf = { 1: 'Aleph（א）', 4: 'Daleth（ד）', 13: 'Mem（מ）' }[c.number];
      const idx = { 1: 0, 4: 1, 13: 2 }[c.number];
      const parts = String(adamEntry.value).split('；');
      html += '<p style="font-size:11px;color:#7a6a98;">Adam 象形：' + letterOf + ' = ' + escapeHtml(parts[idx] || adamEntry.value) + '</p>';
    } else {
      const pck = kab.ettelia_decomposition.find(x => x.key === 'packets');
      const sum = kab.ettelia_decomposition.find(x => x.key === 'sum12');
      html += '<p style="font-size:11px;color:#7a6a98;">Etteila 分解：' + escapeHtml(pck ? pck.value : '') + '；' + escapeHtml(sum ? sum.value : '') + '</p>';
    }
    const g = kab.adam_hierogram.find(x => x.key === 'gematria');
    html += '<p style="font-size:11px;color:#7a6a98;">数字卡巴拉：' + escapeHtml(g ? g.value : '') + '</p>';
  }
  html += '<div class="src">源：Case《The Tarot: A Key to the Wisdom of the Ages》1927 文本层提取；Papus《The Tarot of the Bohemians》1892</div>';
  return html;
}

// 神智学约简：多位数各位相加直到个位（Papus Ch3）
function theosophicReduction(n) {
  let s = String(n);
  while (s.length > 1) s = String(s.split('').reduce((a, ch) => a + Number(ch), 0));
  return Number(s);
}

// 小阿卡纳所属七组领域（Papus Ch7 统治规则）
function minorSeptenaryOf(rank, P) {
  if (!P || !P.septenary_dominions) return null;
  const key = { king: 'kings', ace: 'aces', four: 'fours', seven: 'sevens',
                queen: 'queens', two: 'twos', five: 'fives', eight: 'eights',
                knight: 'knights', three: 'threes', six: 'sixes', nine: 'nines',
                page: 'knaves', ten: 'tens' }[rank];
  if (!key) return null;
  const full = '4 ' + key.charAt(0).toUpperCase() + key.slice(1);
  for (const dom of P.septenary_dominions) {
    if (dom.minor_groups.indexOf(full) >= 0) return dom;
  }
  return null;
}

// —— 手动选牌模式 ——
modeSel.addEventListener('change', () => {
  const manual = modeSel.value === 'manual';
  manualBox.style.display = manual ? 'flex' : 'none';
  hintLine.textContent = manual
    ? '手动模式：选牌并定正/逆位，逐张加入；不足牌阵张数时随机补足。'
    : '随机模式：洗牌后随机取牌，每张独立随机正/逆位。';
});

function fillManualCardSelect() {
  manualCard.innerHTML = '';
  filterPool().forEach((c) => {
    const opt = document.createElement('option');
    opt.value = CARDS.indexOf(c);
    opt.textContent = (c.cn_name || c.name) + '（' + (c.arcana === 'major' ? '大' : c.suit) + '）';
    manualCard.appendChild(opt);
  });
}
poolSel.addEventListener('change', fillManualCardSelect);

function renderManualPicks() {
  if (!manualPicks.length) {
    manualPicksEl.textContent = '尚未选牌';
    return;
  }
  manualPicksEl.innerHTML = manualPicks.map((p, i) =>
    '<span>' + (i + 1) + '. ' + p.card.name + (p.rev ? '（逆）' : '（正）') +
    ' <a href="javascript:void(0)" data-rm="' + i + '" style="color:#ff9d8a;">[×]</a></span>'
  ).join('<br>');
  manualPicksEl.querySelectorAll('a[data-rm]').forEach(a =>
    a.addEventListener('click', () => {
      manualPicks.splice(Number(a.dataset.rm), 1);
      renderManualPicks();
    })
  );
}

manualAdd.addEventListener('click', () => {
  const card = CARDS[Number(manualCard.value)];
  if (!card) return;
  manualPicks.push({ card, rev: manualRev.value === '1' });
  renderManualPicks();
});

function drawFromManual(n) {
  // 已选手动牌优先按序填充，不足随机补足（随机补足也受牌池过滤约束）
  const out = [];
  const pool = shuffle(filterPool());
  const used = new Set();
  manualPicks.forEach(p => {
    out.push({ card: p.card, reversed: p.rev });
    used.add(p.card.name);
  });
  for (const c of pool) {
    if (out.length >= n) break;
    if (used.has(c.name)) continue;
    out.push({ card: c, reversed: Math.random() < revProb });
  }
  return out.slice(0, n).map((d, i) => ({ ...d, posLabel: spreadSel.value === 'm35' ? (M35_LABELS[i] || '位置 ' + (i + 1)) : (spreadSel.value === 'm42' ? (M42_LABELS[i] || '位置 ' + (i + 1)) : (SPREADS[spreadSel.value].labels[i] || '位置 ' + (i + 1))) }));
}

drawBtn.addEventListener('click', () => {
  const need = SPREADS[spreadSel.value].count;
  drawn = spreadSel.value === 'm42' && modeSel.value !== 'manual'
    ? draw42()
    : (modeSel.value === 'manual' ? drawFromManual(need) : draw(need));
  saveHistory();
  render();
  if (drawn.length) {
    // 自动翻开第一张作为引导（凯尔特十字则先翻开②让位再翻①）
    if (spreadSel.value === 'celtic') {
      onClickCard(1);                      // 先翻②并让其滑开
      setTimeout(() => onClickCard(0), 900); // ②让位完成后翻①，动画清晰可见
    } else if (spreadSel.value === 'p12' || spreadSel.value === 'p4') {
      // 十二点位/四点位：自动翻开第一张但不浮起（浮起由用户单击触发）
      const s0 = document.querySelectorAll('.card-slot')[0];
      if (s0 && drawn[0]) {
        flipped.add(0);
        s0.querySelector('.card-3d').classList.add('flipped');
        select(0);
      }
    } else {
      onClickCard(0);
    }
  }
});
// —— 本局汇总（一次看全部释义要点） ——
function showSummary() {
  if (!drawn.length) {
    detail.innerHTML = '<h2>本局汇总</h2><p style="color:#8a7aa8;">尚未抽牌。点「洗牌并抽牌」开始。</p>';
    return;
  }
  let html = '<h2>本局汇总（' + drawn.length + ' 张 · ' + spreadSel.options[spreadSel.selectedIndex].text + '）</h2>' +
    '<div class="src">点击任一行回到该牌详情</div>';
  drawn.forEach((d, i) => {
    const c = d.card;
    const kws = d.reversed ? (c.cn_keywords_reversed || c.keywords_reversed) : (c.cn_keywords_upright || c.keywords_upright);
    const yesno = d.reversed ? c.yes_no_reversed : c.yes_no_upright;
    const attrs = (RULES.hebrew_attribution || []).filter(a => String(a.key) === String(c.number));
    const hebrew = attrs.length ? attrs[0].hebrew_char + ' ' + attrs[0].letter : '';
    html += '<div class="sum-row" data-idx="' + i + '">' +
      '<span class="sum-pos">' + d.posLabel + '</span>' +
      '<span class="sum-name">' + escapeHtml(c.cn_name || c.name) + (d.reversed ? ' <span class="rev-tag">逆</span>' : '') + '</span>' +
      '<span class="sum-kw">' + escapeHtml(kws || '—') + (hebrew ? '　· ' + hebrew : '') + '　· 是/否 ' + escapeHtml(yesno || '—') + '</span>' +
      '</div>';
  });
  detail.innerHTML = html;
  detail.querySelectorAll('.sum-row').forEach(el => {
    el.addEventListener('click', () => select(Number(el.dataset.idx)));
  });
}
summaryBtn.addEventListener('click', showSummary);

// —— 规则库总览（Case + Papus 全部规则体系） ——
function showRulesLibrary() {
  let html = '<h2>规则库总览</h2><div class="src">来源标注见各块；全部为公版书文本层提取（Case 1927 / Papus 1892 / De Laurence）</div>' +
    '<input id="tl-rule-search" type="text" placeholder="搜索规则库：输入关键词（如 希伯来、Decan、凯尔特、Significator）…">';

  // Case 全书前三章（导论/数字奥义/塔罗构造，含完整原文）
  if (RULES.case_chapters && RULES.case_chapters.length) {
    html += '<h3>Case：全书前三章（导论 · 数字奥义 · 塔罗构造，含完整原文）</h3>';
    RULES.case_chapters.forEach(ch => {
      html += '<p style="font-size:12px;color:#c9b8f0;margin:4px 0 1px;"><b>' + ch.cn_title + '</b>（' + ch.pages + '，' + ch.char_count + ' 字符）</p>' +
        '<div style="max-height:150px;overflow:auto;font-size:11px;color:#b7a6d8;border-left:2px solid #3a2f55;padding-left:8px;margin-bottom:6px;">' +
        escapeHtml(ch.text.slice(0, 900)) + (ch.text.length > 900 ? '…<div class="src">（全文 ' + ch.text.length + ' 字符，规则库 rules_core.json case_chapters）</div>' : '') +
        '</div>';
    });
  }

  // Case 占卜章（TAROT DIVINATION：78 卡占卜含义 + 摆法规则）
  if (RULES.case_divination && RULES.case_divination.full_text) {
    const cd = RULES.case_divination;
    html += '<h3>Case：占卜章（TAROT DIVINATION · 78 卡占卜义 + 摆法，全文 ' + cd.char_count + ' 字符）</h3>';
    html += '<p style="font-size:12px;color:#c9b8f0;margin:2px 0;"><b>大阿卡纳 22 张占卜义</b></p>' +
      '<div style="max-height:160px;overflow:auto;font-size:12px;">' +
      (cd.major_meanings || []).map(m => '<p style="color:#d8d0e8;margin:1px 0;">' + m.num + ' · ' + escapeHtml(m.text) + '</p>').join('') + '</div>';
    html += '<p style="font-size:12px;color:#c9b8f0;margin:6px 0 2px;"><b>小阿卡纳 56 张占卜义（按花色）</b></p>' +
      '<div style="max-height:220px;overflow:auto;font-size:12px;">';
    ['wands', 'cups', 'swords', 'pentacles'].forEach(s => {
      html += '<p style="color:#c9b8f0;margin:3px 0 1px;"><b>' + s.toUpperCase() + '</b></p>';
      (cd.minor_meanings[s] || []).forEach(e => {
        html += '<p style="color:#d8d0e8;margin:1px 0;">' + e.rank + ' · ' + escapeHtml(e.text) + '</p>';
      });
    });
    html += '</div>';
    html += '<p style="font-size:12px;color:#c9b8f0;margin:6px 0 2px;"><b>Significator 选择</b></p>' +
      '<div style="max-height:90px;overflow:auto;font-size:11px;color:#b7a6d8;border-left:2px solid #3a2f55;padding-left:8px;">' +
      escapeHtml(cd.significator_rules || '') + '</div>';
    html += '<p style="font-size:12px;color:#c9b8f0;margin:6px 0 2px;"><b>计数规则（轮盘摆法）</b></p>' +
      '<div style="max-height:90px;overflow:auto;font-size:11px;color:#b7a6d8;border-left:2px solid #3a2f55;padding-left:8px;">' +
      escapeHtml(cd.counting_rules || '') + '</div>';
    html += '<p style="font-size:12px;color:#c9b8f0;margin:6px 0 2px;"><b>花色敌友</b></p>' +
      '<p style="font-size:11px;color:#b7a6d8;border-left:2px solid #3a2f55;padding-left:8px;">' + escapeHtml(cd.suit_relations || '') + '</p>';
    html += '<p style="font-size:12px;color:#c9b8f0;margin:6px 0 2px;"><b>组合含义（3/4 同牌）</b></p>' +
      '<div style="max-height:140px;overflow:auto;font-size:12px;">' +
      (cd.combos || []).map(c => '<p style="color:#d8d0e8;margin:1px 0;">' + c.count + ' ' + c.rank + ' · ' + escapeHtml(c.meaning) + '</p>').join('') + '</div>';
    html += '<p style="font-size:12px;color:#c9b8f0;margin:6px 0 2px;"><b>12 宫 / 12 星座 / 10 Sephiroth 摆法</b></p>' +
      '<div style="max-height:130px;overflow:auto;font-size:11px;color:#b7a6d8;border-left:2px solid #3a2f55;padding-left:8px;">' +
      '<p style="margin:1px 0;"><b>12 宫：</b>' + escapeHtml(JSON.stringify(cd.houses || {}, null, 0).replace(/[{}"]/g, '')) + '</p>' +
      '<p style="margin:1px 0;"><b>12 星座：</b>' + (cd.zodiac_table || []).map(z => z.num + '.' + z.sign + '-' + z.key + '.' + z.trump).join(' / ') + '</p>' +
      '<p style="margin:1px 0;"><b>10 质谱：</b>' + escapeHtml((cd.sephiroth_note || '').slice(0, 200)) + '</p></div>';
    html += '<div style="max-height:150px;overflow:auto;font-size:11px;color:#b7a6d8;border-left:2px solid #3a2f55;padding-left:8px;margin-top:6px;">' +
      escapeHtml(cd.full_text.slice(0, 900)) + '…<div class="src">（全文 ' + cd.char_count + ' 字符，rules_core.json case_divination）</div></div>';
  }

  // Case 希伯来对应表
  html += '<h3>Case：22 大阿卡纳-希伯来字母对应</h3><table style="width:100%;border-collapse:collapse;font-size:12px;">' +
    '<tr style="color:#b7a6d8;"><th style="text-align:left;padding:2px 4px;">Key</th><th style="text-align:left;">卡</th><th style="text-align:left;">字母</th><th style="text-align:left;">字符</th></tr>';
  (RULES.hebrew_attribution || []).forEach(a => {
    html += '<tr style="border-top:1px solid #2e2545;"><td style="padding:2px 4px;">' + a.key + '</td><td>' + a.card + '</td><td>' + a.letter + '</td><td>' + a.hebrew_char + '</td></tr>';
  });
  html += '</table>';

  // Case 数字学
  html += '<h3>Case：数字 0-10 数字学</h3>';
  (RULES.numbers || []).forEach(n => {
    html += '<p style="font-size:12px;color:#d8d0e8;margin:2px 0;"><b>' + n.number + '</b> ' + n.meanings + '</p>';
  });

  // Papus 四花色
  html += '<h3>Papus：四花色-字母-元素</h3>';
  (RULES_PAPUS.suits || []).forEach(s => {
    html += '<p style="font-size:12px;color:#d8d0e8;margin:2px 0;"><b>' + s.papus_name + '</b> = ' + s.letter + '（' + s.principle + '）· 元素 ' + s.element + '</p>';
  });

  // Papus 七组
  html += '<h3>Papus：大阿卡纳七组</h3>';
  (RULES_PAPUS.major_septenaries || []).forEach(s => {
    html += '<p style="font-size:12px;color:#d8d0e8;margin:2px 0;">第 ' + s.septenary + ' 组：卡 ' + s.range.join('-') + ' · ' + s.letter + ' · ' + s.world + '</p>';
  });

  // Papus 卡巴拉
  if (RULES_PAPUS.kabbalah) {
    html += '<h3>Papus：卡巴拉（Ch18）</h3>';
    (RULES_PAPUS.kabbalah.ettelia_decomposition || []).forEach(e => {
      html += '<p style="font-size:12px;color:#d8d0e8;margin:2px 0;">' + escapeHtml(e.value) + '</p>';
    });
    html += '<p style="font-size:12px;color:#d8d0e8;margin:2px 0;">' + escapeHtml((RULES_PAPUS.kabbalah.adam_hierogram.find(x => x.key === 'gematria') || {}).value || '') + '</p>';
  }

  // Papus 数字神智学
  if (RULES_PAPUS.numbers_esoterism) {
    html += '<h3>Papus：数字神智学（Ch3）</h3>';
    (RULES_PAPUS.numbers_esoterism.operations || []).forEach(o => {
      html += '<p style="font-size:12px;color:#d8d0e8;margin:2px 0;"><b>' + o.name + '</b>：' + escapeHtml(o.rule) + '（例：' + escapeHtml(o.examples) + '）</p>';
    });
  }

  // Papus 应用钥匙
  if (RULES_PAPUS.application_key) {
    html += '<h3>Papus：应用总钥匙（Ch15）</h3>';
    (RULES_PAPUS.application_key.applications || []).forEach(a => {
      html += '<p style="font-size:12px;color:#d8d0e8;margin:2px 0;"><b>' + a.level + '</b>：四角=' + a.corners + ' · 轮=' + a.wheel + ' · 中心=' + a.center + '</p>';
    });
  }

  // Papus 天文塔罗：宫廷卡-星座 + 36 Decani
  if (RULES_PAPUS.zodiac_decani) {
    html += '<h3>Papus：天文塔罗（Ch16，读图提取）</h3>';
    html += '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="color:#b7a6d8;"><th style="text-align:left;padding:2px 4px;">季节</th><th>花色</th><th>King</th><th>Queen</th><th>Knight</th></tr>';
    (RULES_PAPUS.zodiac_decani.court_zodiac || []).forEach(r => {
      html += '<tr style="border-top:1px solid #2e2545;"><td style="padding:2px 4px;">' + r.season + '</td><td>' + r.suit + '</td><td>' + r.king + '</td><td>' + r.queen + '</td><td>' + r.knight + '</td></tr>';
    });
    html += '</table>';
    html += '<p style="font-size:11px;color:#7a6a98;margin:4px 0;">36 Decani：每花色 Ace-9 = 3 星座 × 3 旬，10 = 季节过渡。示例：Ace of Sceptres=白羊第 1 旬（3 月 21-30 日）</p>';
    html += '<div style="max-height:260px;overflow:auto;font-size:12px;">';
    (RULES_PAPUS.zodiac_decani.series || []).forEach(d => {
      html += '<p style="color:#d8d0e8;margin:1px 0;">' + d.card + ' → ' + d.zodiac_sign + ' · ' + d.decan + '</p>';
    });
    html += '</div>';
  }
  // Papus 占卜体系（Ch20 Divining Tarot：三元法/四原理/四阶段/四点位）
  if (RULES_PAPUS.divining_system) {
    const ds = RULES_PAPUS.divining_system;
    html += '<h3>Papus：占卜体系（Ch20 占卜七课）</h3>' +
      '<p style="font-size:12px;color:#d8d0e8;"><b>四原理：</b>' + ds.four_principles + '</p>' +
      '<p style="font-size:12px;color:#d8d0e8;"><b>三元法：</b>' + ds.triple_method + '</p>' +
      '<p style="font-size:12px;color:#d8d0e8;"><b>人物逻辑：</b>' + ds.figure_logic + '</p>' +
      '<p style="font-size:12px;color:#d8d0e8;"><b>生命四期：</b>' + ds.life_periods + '</p>' +
      '<p style="font-size:12px;color:#d8d0e8;"><b>四点位：</b>' + ds.four_points + '</p>' +
      '<p style="font-size:12px;color:#d8d0e8;"><b>十二点位：</b>' + ds.twelve_points + '</p>' +
      '<p style="font-size:12px;color:#d8d0e8;"><b>过去-现在-未来：</b>' + ds.past_present_future + '</p>';
    const ds2 = RULES_PAPUS.divining_minor;
    if (ds2 && ds2.suits) {
      html += '<div style="max-height:260px;overflow:auto;font-size:12px;margin-top:4px;">';
      Object.keys(ds2.suits).forEach(s => {
        const blk = ds2.suits[s];
        html += '<p style="color:#c9b8f0;margin:4px 0 1px;"><b>' + s + '</b>（' + blk.keywords + '）</p>';
        Object.keys(blk.cards).forEach(k => {
          html += '<p style="color:#d8d0e8;margin:1px 0;">' + k + '：' + blk.cards[k] + '</p>';
        });
      });
      html += '</div>';
    }
    const dm = RULES_PAPUS.divining_major;
    if (dm && dm.cards) {
      html += '<div style="max-height:220px;overflow:auto;font-size:12px;margin-top:4px;">';
      dm.cards.forEach(m => {
        html += '<p style="color:#d8d0e8;margin:1px 0;">' + m.papus_no + ' ' + m.papus_name + ' → ' + m.meaning + '</p>';
      });
      html += '</div>';
    }
  }
  // De Laurence 占卜方法章节（复发/占卜艺术/凯尔特/替代/35卡）
  if (DE_LAURENCE && DE_LAURENCE.methods) {
    html += '<h3>De Laurence：占卜方法（第二原典，含完整原文）</h3>';
    Object.keys(DE_LAURENCE.methods).forEach(k => {
      const m = DE_LAURENCE.methods[k];
      html += '<p style="font-size:12px;color:#d8d0e8;margin:3px 0;"><b>' + m.title + '</b></p>' +
        '<div style="max-height:150px;overflow:auto;font-size:11px;color:#b7a6d8;border-left:2px solid #3a2f55;padding-left:8px;margin-bottom:6px;">' +
        escapeHtml(m.text.slice(0, 600)) + (m.text.length > 600 ? '…<div class="src">（全文 ' + m.text.length + ' 字符，见引擎 data/de_laurence.json）</div>' : '') +
        '</div>';
    });
  }
  detail.innerHTML = html;
  const sb = document.getElementById('tl-rule-search');
  if (sb) {
    sb.addEventListener('input', () => filterRules(sb.value.trim()));
    sb.focus();
  }
}
rulesBtn.addEventListener('click', showRulesLibrary);

// —— 规则库搜索：按块（h3 标题 + 其后内容）过滤 + 关键词高亮 ——
let ruleBlocks = null;
function collectRuleBlocks() {
  const blocks = [];
  let cur = null;
  Array.from(detail.children).forEach(el => {
    if (el.tagName === 'H3') {
      cur = { title: el, els: [] };
      blocks.push(cur);
    } else if (cur) {
      cur.els.push(el);
    }
  });
  return blocks;
}
function filterRules(q) {
  ruleBlocks = collectRuleBlocks();
  if (!q) {
    ruleBlocks.forEach(b => {
      b.title.style.display = '';
      b.els.forEach(el => el.style.display = '');
    });
    clearHits();
    return;
  }
  ruleBlocks.forEach(b => {
    const hit = b.title.textContent.toLowerCase().includes(q) ||
      b.els.some(el => el.textContent.toLowerCase().includes(q));
    b.title.style.display = hit ? '' : 'none';
    b.els.forEach(el => el.style.display = hit ? '' : 'none');
  });
  highlightHits(q);
}
function clearHits() {
  detail.querySelectorAll('mark.rule-hit').forEach(m => {
    m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
  });
  detail.normalize();
}
function highlightHits(q) {
  clearHits();
  const walker = document.createTreeWalker(detail, NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.parentNode && n.parentNode.tagName !== 'MARK' && n.textContent.trim()
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const text = node.textContent;
    const lower = text.toLowerCase();
    let idx = lower.indexOf(q);
    if (idx < 0) return;
    const frag = document.createDocumentFragment();
    let last = 0;
    while (idx >= 0) {
      frag.appendChild(document.createTextNode(text.slice(last, idx)));
      const mk = document.createElement('mark');
      mk.className = 'rule-hit';
      mk.textContent = text.slice(idx, idx + q.length);
      frag.appendChild(mk);
      last = idx + q.length;
      idx = lower.indexOf(q, last);
    }
    frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}

// —— 占星对应视图：大阿卡纳↔行星/星座/希伯来字母，小阿卡纳↔星座/Decan ——
function showAstro() {
  if (!CARDS.length) {
    detail.innerHTML = '<h2>占星对应</h2><p style="color:#8a7aa8;">数据未就绪。</p>';
    return;
  }
  const suits = [
    ['wands', '权杖（火）', '#ff9d8a'],
    ['cups', '圣杯（水）', '#8ab8ff'],
    ['swords', '宝剑（风）', '#c9b8f0'],
    ['pentacles', '钱币（土）', '#a8d8a0'],
  ];
  const hebrew = (RULES.hebrew_attribution || []);
  let html = '<h2>占星对应 · 塔罗与天空</h2>' +
    '<div class="src">数据：78 卡统一数据（planet/zodiac/decan 字段）+ Case 希伯来字母表（rules_core）</div>' +
    '<p style="font-size:12px;color:#d8d0e8;line-height:1.7;">韦特体系把 22 张大阿卡纳与行星/星座及卡巴拉希伯来字母相连，小阿卡纳 2-10 落入 36 个 Decan（每星座 3 旬 × 12 星座），Ace 与宫廷牌对应星座组。</p>';
  // 大阿卡纳表
  html += '<h3>大阿卡纳 22 张 · 行星 / 星座 / 希伯来字母</h3>' +
    '<div style="max-height:300px;overflow:auto;">' +
    '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
    '<tr style="color:#b7a6d8;"><th style="text-align:left;padding:2px 4px;">Key</th><th>牌</th><th>行星</th><th>星座</th><th>希伯来</th></tr>';
  CARDS.filter(c => c.arcana === 'major').forEach(c => {
    const hb = hebrew.filter(a => String(a.key) === String(c.number))[0];
    html += '<tr style="border-top:1px solid #2e2545;"><td style="padding:2px 4px;">' + c.number + '</td>' +
      '<td>' + escapeHtml(c.cn_name || c.name) + ' <span style="color:#7a6a98;font-size:10px;">' + escapeHtml(c.name) + '</span></td>' +
      '<td>' + (c.planet || '—') + '</td>' +
      '<td>' + (c.zodiac || '—') + '</td>' +
      '<td>' + (hb ? hb.hebrew_char + ' ' + hb.letter : '—') + '</td></tr>';
  });
  html += '</table></div>';
  // 小阿卡纳按花色
  suits.forEach(([suit, label, color]) => {
    const cards = CARDS.filter(c => c.arcana !== 'major' && c.suit === suit);
    html += '<h3 style="color:' + color + ';">' + label + ' · 14 张</h3>' +
      '<div style="max-height:240px;overflow:auto;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
      '<tr style="color:#b7a6d8;"><th style="text-align:left;padding:2px 4px;">牌</th><th>星座</th><th>Decan 旬</th></tr>';
    cards.forEach(c => {
      html += '<tr style="border-top:1px solid #2e2545;"><td style="padding:2px 4px;">' + escapeHtml(c.cn_name || c.name) + ' <span style="color:#7a6a98;font-size:10px;">' + escapeHtml(c.name) + '</span></td>' +
        '<td>' + (c.zodiac || '—') + '</td>' +
        '<td>' + (c.decan || '—') + '</td></tr>';
    });
    html += '</table></div>';
  });
  html += '<p style="font-size:11px;color:#7a6a98;margin-top:8px;">Decan 旬：每个星座分三旬（0-10°/10-20°/20-30°），小阿卡纳 2-10 依序落入。元素对应：权杖=火、圣杯=水、宝剑=风、钱币=土。</p>';
  detail.innerHTML = html;
}
astroBtn.addEventListener('click', showAstro);

// —— 抽牌历史（localStorage） ——
const HIST_KEY = 'tarot_engine_history';
function saveHistory() {
  if (!drawn.length) return;
  const rec = {
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    spread: spreadSel.options[spreadSel.selectedIndex].text,
    cards: drawn.map(d => ({ name: d.card.cn_name || d.card.name, en: d.card.name, rev: d.reversed })),
  };
  let list = [];
  try { list = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { list = []; }
  list.unshift(rec);
  if (list.length > 50) list.length = 50;
  try { localStorage.setItem(HIST_KEY, JSON.stringify(list)); } catch (e) {}
}

historyBtn.addEventListener('click', () => {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (e) { list = []; }
  if (!list.length) {
    detail.innerHTML = '<h2>抽牌历史</h2><p style="color:#8a7aa8;">暂无记录（本机保存最近 50 局）。</p>';
    return;
  }
  let html = '<h2>抽牌历史</h2><div class="src">本机保存（最近 50 局）</div>';
  list.forEach((rec, i) => {
    html += '<div style="border-top:1px solid #3a2f55;padding:8px 0;">' +
      '<div style="font-size:12px;color:#a89ac2;">#' + (i + 1) + ' ' + rec.time + ' · ' + rec.spread + '</div>' +
      '<p style="font-size:13px;color:#d8d0e8;">' + rec.cards.map(c => c.name + (c.rev ? '（逆）' : '')).join('、') + '</p></div>';
  });
  html += '<p style="margin-top:10px;"><button id="tl-hist-clear" style="padding:4px 10px;">清空历史</button></p>';
  detail.innerHTML = html;
  const clr = document.getElementById('tl-hist-clear');
  if (clr) clr.addEventListener('click', () => {
    try { localStorage.removeItem(HIST_KEY); } catch (e) {}
    historyBtn.click();
  });
});

resetBtn.addEventListener('click', () => {
  drawn = [];
  cardsArea.innerHTML = '';
  boardTitle.textContent = '';
  detail.innerHTML = '<div class="empty-hint">已清空。点「洗牌并抽牌」开始。</div>';
});

function tlInit() {
  // 数据来自签占主数据层 D.tarot
  if (D && D.tarot) {
    CARDS = D.tarot.cards || [];
    RULES = D.tarot.rules || {};
    RULES_PAPUS = D.tarot.rules_papus || {};
    CASE_LEADS = D.tarot.case_leads || {};
    DE_LAURENCE = D.tarot.de_laurence || {};
    fillManualCardSelect();
    boardTitle.textContent = '数据就绪：' + CARDS.length + ' 张牌（' +
      CARDS.filter(c => c.arcana === 'major').length + ' 大阿卡纳 / ' +
      CARDS.filter(c => c.arcana === 'minor').length + ' 小阿卡纳）';
  } else {
    boardTitle.textContent = '数据加载失败';
  }
}
    tarotInit = tlInit;
  })();

// ========== Tab 19 大六壬（四课三传体系，720 局查表） ==========
(() => {
  const $ = (id) => document.getElementById(id);
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const SHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const LEI_LIST = ['天时', '家宅', '婚姻', '疾病', '行人', '出行', '求财', '功名', '胎产', '争讼', '失脱', '捕获', '仕宦', '投谒', '坟葬', '谋望', '兵战'];
  const gz = (s) => ZHI.indexOf(s);
  const k2 = (a, b) => (a + b + 12) % 12;
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const ke = (a, b) => KE[a] === b;
  const ganWx = (g) => ({ 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' }[g]);
  const zhiWx = (z) => ({ 寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金', 亥: '水', 子: '水', 辰: '土', 戌: '土', 丑: '土', 未: '土' }[z]);
  const JIAZI = [];
  for (let i = 0; i < 60; i++) JIAZI.push(GAN[i % 10] + ZHI[i % 12]);
  function todayGanzhi() {
    const base = new Date(2026, 9, 22);
    const days = Math.floor((Date.now() - base.getTime()) / 86400000);
    return JIAZI[((days % 60) + 60) % 60];
  }
  function isYinGan(g) { return '乙丁己辛癸'.indexOf(g) >= 0; }
  function tianpan(yj, shi) {
    const t = {};
    for (let i = 0; i < 12; i++) t[ZHI[i]] = ZHI[k2(gz(yj), i - gz(shi))];
    return t;
  }
  // 布十二天将于天盘：贵人（旦/暮）起于贵人支所在宫，旦贵顺行 / 暮贵逆行
  const TJ_SHORT2FULL = { 贵: '贵人', 螣: '螣蛇', 朱: '朱雀', 六: '六合', 勾: '勾陈', 青: '青龙', 空: '天空', 白: '白虎', 常: '太常', 玄: '玄武', 阴: '太阴', 后: '天后' };
  function buTianJiang(tp, day, hour) {
    const CORE = D.liunren.core;
    const gan = day[0];
    const gui = (CORE.guiren && CORE.guiren[gan]) || ['丑', '未'];
    const hi = gz(hour);
    const dayDawn = hi >= 3 && hi <= 8; // 卯(3)~申(8) 昼用旦贵，酉~寅 夜用暮贵
    const guiZhi = dayDawn ? gui[0] : gui[1];
    let base = null;
    for (const z of ZHI) if (tp[z] === guiZhi) { base = gz(z); break; }
    if (base == null) base = gz(guiZhi);
    const dir = dayDawn ? 1 : -1;
    const order = (CORE.tianjiang && CORE.tianjiang.order) || ['贵', '螣', '朱', '六', '勾', '青', '空', '白', '常', '玄', '阴', '后'];
    const map = {};
    for (let i = 0; i < 12; i++) {
      const zIdx = (base + dir * i + 12) % 12;
      map[ZHI[zIdx]] = order[i];
    }
    return { map, guiZhi, dir, dayDawn, base };
  }
  function zhinanHit(jiangShort, wei) {
    const zn = D.liunren.zhinan || [];
    const full = TJ_SHORT2FULL[jiangShort] || jiangShort;
    const hit = zn.find(x => x.jiang === full && x.wei === wei);
    return hit || null;
  }
  // 天盘神 → 所临地盘支
  function tpZhiOf(tp, shen) {
    for (const z of ZHI) if (tp[z] === shen) return z;
    return null;
  }
  // 翠雨歌·事类映射（name 前缀子串匹配；歌诀本身按占X分条）
  const LEI_CUIYU = {
    功名: ['占官定有无第一'],
    仕宦: ['占官定有无第一'],
    家宅: ['占宅舍第一', '占宅内有无伏尸第二'],
    婚姻: ['占择婚何处吉第三十二', '占女人贞洁第四十三'],
    胎产: ['占生产孕吉凶第三十八', '占产室位第三十九', '占子何日生期第四十', '占子生时第四十一'],
    行人: ['占人久出外不知存亡第四', '占人出外问家下平安第五', '占出外到日第六', '占人出外经年未归第七',
      '占当日出去何时归第八', '占久出未归第十', '占出外迷失道路第十一', '占寻捕逃亡第十二',
      '占出外失位不知前后第十三', '占逃亡远近里数第十四', '占欲逃亡吉方去第十八', '占出外迷宿处第十九', '占出外恐直雪雨贼盗第二十'],
    出行: ['占人久出外不知存亡第四', '占出外到日第六', '占人出外经年未归第七', '占当日出去何时归第八',
      '占久出未归第十', '占出外迷失道路第十一', '占出外失位不知前后第十三', '占出外迷宿处第十九', '占出外恐直雪雨贼盗第二十'],
    捕获: ['占寻捕逃亡第十二', '占逃亡远近里数第十四', '占欲逃亡吉方去第十八'],
    投谒: ['占谒贵人见不见第十五'],
    谋望: ['占人出外问家下平安第五'],
  };
  // 五行墓：木未 / 火戌 / 金丑 / 水辰（土随水墓辰）
  const WX_MU = { 木: '未', 火: '戌', 金: '丑', 水: '辰', 土: '辰' };
  const XUN_HEAD = { 甲子: '甲子', 甲戌: '甲戌', 甲申: '甲申', 甲午: '甲午', 甲辰: '甲辰', 甲寅: '甲寅' };
  // 管辂神书 · 按课象自动命中判定（返回 [{idx, topic, reason}]）
  function lnGuanluHits(day, si, chuan, lei, tp, tjMap, sui, yue, year, sex) {
    const CORE = D.liunren.core || {};
    const set = new Set();
    si.forEach(k => { set.add(k.shang); set.add(k.xia); });
    chuan.forEach(c => set.add(c));
    const arr = Array.from(set);
    const hits = [];
    const gl = D.liunren.guanlu || [];
    const push = (topic, reason) => {
      gl.forEach((g, idx) => { if (g.topic === topic) hits.push({ idx, topic, reason }); });
    };
    // 论空亡：天将入空 / 三传带空 / 课见旬空
    const kongH = lnKongHits(day, si, chuan, tjMap);
    if (kongH.length) push('论空亡', kongH[0].cond + '：' + kongH[0].duan + (kongH.length > 1 ? ' 等' + kongH.length + '条' : ''));
    // 论破神 / 论破碎：破神章自动命中（月破/岁破/破碎/四破）
    const poHits = lnPoHits(day, si, chuan, tp, tjMap, sui, yue);
    if (poHits.length) push('论破神', '破煞命中 ' + poHits.length + ' 条');
    if (poHits.some(x => x.kind === '破碎')) push('论破碎', poHits.filter(x => x.kind === '破碎')[0].cond + '：' + poHits.filter(x => x.kind === '破碎')[0].duan + (poHits.filter(x => x.kind === '破碎').length > 1 ? ' 等' + poHits.filter(x => x.kind === '破碎').length + '条' : ''));
    // 论刑：三刑对 / 自刑
    const xingH = lnXingHits(si, chuan);
    if (xingH.length) push('论刑', xingH[0].cond + '：' + xingH[0].duan + (xingH.length > 1 ? ' 等' + xingH.length + '条' : ''));
    // 论六害：六害对
    const haiH = lnHaiHits(si, chuan);
    if (haiH.length) push('论六害', haiH[0].cond + '：' + haiH[0].duan + (haiH.length > 1 ? ' 等' + haiH.length + '条' : ''));
    // 论墓神：日干五行墓临课
    const muH = lnMuHits(day, si, chuan);
    if (muH.length) push('论墓神', muH[0].cond + '：' + muH[0].duan + (muH.length > 1 ? ' 等' + muH.length + '条' : ''));
    // 论丁神：旬丁临课
    const dingH = lnDingHits(day, si, chuan);
    if (dingH.length) push('论丁神', dingH[0].cond + '：' + dingH[0].duan + (dingH.length > 1 ? ' 等' + dingH.length + '条' : ''));
    // 论身命：干上神与日干五行五关系 + 干禄 + 落空
    const smH = lnShenMingHits(day, si);
    if (smH.length) push('论身命', smH[0].cond + '：' + smH[0].duan + (smH.length > 1 ? ' 等' + smH.length + '条' : ''));
    // 论干支上下：干上/支上五行五关系 + 相刑害破
    const gzsH = lnGZSHits(si);
    if (gzsH.length) push('论干支上下', gzsH[0].cond + '：' + gzsH[0].duan + (gzsH.length > 1 ? ' 等' + gzsH.length + '条' : ''));
    // 论干支家宅：支上神空/刑破害（事类家宅或课象均判）
    const jzhH = lnJZhaiHits(day, si, chuan);
    if (lei === '家宅' || jzhH.length) push('论干支家宅', jzhH.length ? jzhH[0].cond + '：' + jzhH[0].duan : '事类家宅');
    // 论行人：驿马/游神/传送/丁马（事类或课象均判）
    const xrH = lnXingRenHits(day, si, chuan);
    if (lei === '行人' || lei === '出行' || xrH.length) push('论行人', xrH.length ? xrH[0].cond + '：' + xrH[0].duan : '事类' + lei);
    // 论太阳太岁月建：太岁/月建临课 / 月破加日
    const syH = lnSuiYueHits(si, chuan, sui, yue, tp);
    if (syH.length) push('论太阳太岁月建', syH[0].cond + '：' + syH[0].duan + (syH.length > 1 ? ' 等' + syH.length + '条' : ''));
    // 论行年本命：生年/性别 → 本命/行年支入课
    const xmH = lnXingMingHits(day, si, chuan, year, sex);
    if (year && !isNaN(year)) {
      if (xmH.length) push('论行年本命', xmH[0].cond + '：' + xmH[0].duan + (xmH.length > 1 ? ' 等' + xmH.length + '条' : ''));
    } else {
      push('论行年本命', '未输入生年（控件已加），未判行年/本命');
    }
    // 去重（同一 idx 可能被多条件命中，保留首因）
    const seen = new Set();
    const out = [];
    hits.forEach(h => { if (!seen.has(h.idx)) { seen.add(h.idx); out.push(h); } });
    return out;
  }
  // ── 破神章（《大六壬指南·论破神》原文条件结构化）──
  // 四破（隔四位相破）：丑见辰、子见卯…（poZhi[a]=b，即 a 见 b 为破）
  const PO_ZHI = { 子: '卯', 丑: '辰', 寅: '巳', 卯: '午', 辰: '未', 巳: '申', 午: '酉', 未: '戌', 申: '亥', 酉: '子', 戌: '丑', 亥: '寅' };
  // 破碎煞：子午卯酉在巳，辰戌丑未在丑，寅申巳亥在酉
  const PO_SUI = { 子: '巳', 午: '巳', 卯: '巳', 酉: '巳', 辰: '丑', 戌: '丑', 丑: '丑', 未: '丑', 寅: '酉', 申: '酉', 巳: '酉', 亥: '酉' };
  // 天将见破断语（原文逐将）
  const TJ_PO_DUAN = { 贵人: '功名荐引、干谒不成', 螣蛇: '牵连、提带之事不允', 朱雀: '文书、口舌暗捺不行', 六合: '卖买、交关、婚姻、纳子不允',
    勾陈: '争斗、田庄、坟墓、交关不就', 青龙: '婚姻、公文、案卷不行', 天空: '文书、进纳、奴婢不就', 白虎: '道路防劫，望举不成',
    太常: '荐本、推官、婚姻、酒食路止', 玄武: '投师、玄学、阴谋、贼党不就', 太阴: '阴谋、金银、钱财、关节不通', 天后: '恩泽、诏赦不成，婚喜不就' };
  // 返回命中列表 [{kind, cond, duan}]：kind=日上/支上/互破/天将/破碎传位/岁月同用/辰戌跌扑
  function lnPoHits(day, si, chuan, tp, tjMap, sui, yue) {
    const CORE = D.liunren.core || {};
    const chong = CORE.chong || {};
    const yuePo = chong[yue] || '';            // 月破 = 月建冲支
    const suiPo = chong[sui] || '';            // 岁破 = 太岁冲支
    const poSet = new Set();                   // 单支破（月破/岁破；破碎另按日支单取，避免误判）
    if (yuePo) poSet.add(yuePo);
    if (suiPo) poSet.add(suiPo);
    const isPo = (z) => poSet.has(z);
    const poZhi = PO_SUI[day[1]] || '';        // 当日破碎支（子午卯酉在巳 / 辰戌丑未在丑 / 寅申巳亥在酉）
    const isPoSui = (z) => poZhi && z === poZhi;
    const hits = [];
    const course = [si[0].shang, si[0].xia, si[1].shang, si[1].xia].concat(chuan);
    const set = new Set(course);
    // ① 干上/支上见破（月破/岁破单支破）
    const gs = si[0].shang, zs = si[1].shang;
    if (isPo(gs)) hits.push({ kind: '日上', cond: '破神临干上神 ' + gs, duan: '家内邻人之欺' });
    if (isPo(zs)) hits.push({ kind: '支上', cond: '破神临支上神 ' + zs, duan: '朋友侮、外人侮人' });
    // ② 干支互破（四破对横跨干上/支上）
    if (PO_ZHI[gs] === zs || PO_ZHI[zs] === gs) hits.push({ kind: '互破', cond: '干上 ' + gs + ' 与支上 ' + zs + ' 隔位相破', duan: '外破内、内破外，交相破' });
    // ③ 天将见破：该将所临宫为单支破（月破/岁破）→ 逐将断语
    for (const z of ZHI) {
      if (!isPo(z)) continue;
      const j = tjMap[z];
      if (!j) continue;
      const full = TJ_SHORT2FULL[j] || j;
      const d = TJ_PO_DUAN[full];
      if (d) hits.push({ kind: '天将', cond: full + '见破（临' + z + '）', duan: d });
    }
    // ④ 破碎煞（按日支）：临干上/支上/传/课他处
    if (poZhi) {
      if (gs === poZhi) hits.push({ kind: '破碎', cond: '破碎煞' + poZhi + '临干上（' + day[1] + '日破碎）', duan: '事遇之破事，主事不成' });
      if (zs === poZhi) hits.push({ kind: '破碎', cond: '破碎煞' + poZhi + '临支上（' + day[1] + '日破碎）', duan: '物遇之破物，主物损' });
      chuan.forEach((c, i) => {
        if (c === poZhi) hits.push({ kind: '破碎', cond: '破碎煞' + poZhi + '临' + ['初传', '中传', '末传'][i], duan: ['初传得之则不成事', '中传得之狐疑不决', '末传得之终日无归着'][i] });
      });
      if (set.has(poZhi) && gs !== poZhi && zs !== poZhi && chuan.indexOf(poZhi) < 0) {
        hits.push({ kind: '破碎', cond: '破碎煞' + poZhi + '临课体', duan: '事遇之破事，物遇之破物' });
      }
    }
    // ⑤ 岁破+月破同见于课集
    if (yuePo && suiPo && set.has(yuePo) && set.has(suiPo)) hits.push({ kind: '岁月同', cond: '岁破 ' + suiPo + ' 与月破 ' + yuePo + ' 同入课', duan: '一破难当，二破同用，吉将相逢也不容，破财坏事主贫穷' });
    // ⑥ 月破加于辰戌宫 → 跌伤
    if (yuePo) {
      if (tp['辰'] === yuePo) hits.push({ kind: '辰戌', cond: '月破 ' + yuePo + ' 加于辰宫', duan: '其年必有跌伤' });
      if (tp['戌'] === yuePo) hits.push({ kind: '辰戌', cond: '月破 ' + yuePo + ' 加于戌宫', duan: '其年必有跌伤' });
    }
    // 排序：日上/支上/互破 > 天将 > 破碎 > 岁月同 > 辰戌
    const rank = { 日上: 0, 支上: 0, 互破: 0, 天将: 1, 破碎: 2, 破碎传: 2, 岁月同: 3, 辰戌: 4 };
    hits.sort((a, b) => (rank[a.kind] - rank[b.kind]) || a.cond.localeCompare(b.cond));
    return hits;
  }
  // ── 管辂其余各章 · 课象条件→断语结构化判定（返回 [{cond, duan}]）──
  const GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  const ZHI_WX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  // 天将入空断语（《论空亡》原文逐将；天后无专条不录）
  const TJ_KONG_DUAN = { 贵人: '干贵反凶，当谒莫谒', 螣蛇: '可免诸凶，任尔出入，自迪其功', 朱雀: '旺文不就，文书难成', 六合: '求财难通，不宜卖买', 勾陈: '官无讼凶，在外莫见', 青龙: '妻伤难归 / 财可半得 / 官志难成', 天空: '诸事无踪，吉凶俱不成', 白虎: '见凶不凶，出往反得其功', 太常: '作官不逢 / 求财不成 / 双亲为服', 玄武: '谋害不凶，疑盗不入吾宫', 太阴: '女诈不兴，反得阴利' };
  // 论刑：三刑类型断语
  function xingType(a, b) {
    const s = [a, b].sort().join('');
    if (['寅巳', '巳申', '申寅'].indexOf(s) >= 0) return '无恩之刑：恩中生怨，仕人则吉，常人则凶';
    if (s === '子卯') return '无礼之刑：自家有伤残';
    if (['丑戌', '戌未', '未丑'].indexOf(s) >= 0) return '恃势之刑：论物有决裂处';
    return '相刑';
  }
  // 论空亡：天将入空 / 三传带空 / 课见旬空
  function lnKongHits(day, si, chuan, tjMap) {
    const CORE = D.liunren.core || {};
    const xk = (CORE.shensha && CORE.shensha.xunkong && CORE.shensha.xunkong[day]) || '';
    const hits = [];
    if (!xk) return hits;
    const xkSet = new Set(xk.split(''));
    for (const z of ZHI) {
      if (!xkSet.has(z)) continue;
      const j = tjMap[z];
      if (!j) continue;
      const full = TJ_SHORT2FULL[j] || j;
      const d = TJ_KONG_DUAN[full];
      if (d) hits.push({ cond: full + '入空（临' + z + '宫）', duan: d });
    }
    chuan.forEach((c, i) => {
      if (xkSet.has(c)) hits.push({ cond: '旬空' + xk + '临' + ['初传', '中传', '末传'][i] + c, duan: ['初空末实，先虽无准，后必有成', '中空者，事将成而中止', '末空，终无结果矣'][i] });
    });
    return hits;
  }
  // 论刑：课集构成三刑对 / 自刑
  function lnXingHits(si, chuan) {
    const CORE = D.liunren.core || {};
    const x = CORE.qike || {};
    const set = new Set();
    si.forEach(k => { set.add(k.shang); set.add(k.xia); });
    chuan.forEach(c => set.add(c));
    const arr = Array.from(set);
    const hits = [];
    const done = new Set();
    arr.forEach(a => {
      if (!x[a]) return;
      arr.forEach(b => {
        if (x[a] !== b) return;
        const key = [a, b].sort().join('');
        if (done.has(key)) return;
        done.add(key);
        if (a === b) hits.push({ cond: '课见自刑' + a + a, duan: '自刑，妄自尊大以凌人' });
        else hits.push({ cond: '课见' + a + '刑' + b, duan: xingType(a, b) });
      });
    });
    return hits;
  }
  // 论六害：课集构成六害对
  function lnHaiHits(si, chuan) {
    const CORE = D.liunren.core || {};
    const h = CORE.hai || {};
    const set = new Set();
    si.forEach(k => { set.add(k.shang); set.add(k.xia); });
    chuan.forEach(c => set.add(c));
    const arr = Array.from(set);
    const hits = [];
    const done = new Set();
    arr.forEach(a => {
      if (!h[a]) return;
      arr.forEach(b => {
        if (h[a] !== b) return;
        const key = [a, b].sort().join('');
        if (done.has(key)) return;
        done.add(key);
        hits.push({ cond: '课见' + a + '害' + b, duan: '有人谋害，事主艰难，占讼病大凶' });
      });
    });
    return hits;
  }
  // 论墓神：日干五行墓临课（干上/支上/传/课他处）
  function lnMuHits(day, si, chuan) {
    const gwx = GAN_WX[day[0]];
    const mu = WX_MU[gwx];
    const hits = [];
    if (!mu) return hits;
    const course = [si[0].shang, si[0].xia, si[1].shang, si[1].xia].concat(chuan);
    const gs = si[0].shang, zs = si[1].shang;
    if (gs === mu) hits.push({ cond: '墓神盖日（干上神' + mu + '）', duan: '主人不逢时，所为昏昧，谋事无成' });
    if (zs === mu) hits.push({ cond: '墓神盖宅（支上神' + mu + '）', duan: '宅不光明，昏沉阴退' });
    chuan.forEach((c, i) => {
      if (c === mu) hits.push({ cond: '墓临' + ['初传', '中传', '末传'][i] + mu, duan: ['初墓犹望末传解救', '中墓犹望末传解救', '末墓无刑冲克破则败亡'][i] });
    });
    const other = [si[0].xia, si[1].xia].filter(z => z === mu);
    if (other.length) hits.push({ cond: '墓神' + mu + '临干阳/支阳课（墓临课体）', duan: '墓神覆课，昏昧阻滞，谋事多晦' });
    return hits;
  }
  // 论丁神：旬丁支临课（至动之神；旬头支顺数 3 位即丁神支）
  function lnDingHits(day, si, chuan) {
    const idx = JIAZI.indexOf(day);
    if (idx < 0) return [];
    const xunHead = JIAZI[Math.floor(idx / 10) * 10];
    const dZhi = ZHI[(ZHI.indexOf(xunHead[1]) + 3) % 12];
    const set = new Set();
    si.forEach(k => { set.add(k.shang); set.add(k.xia); });
    chuan.forEach(c => set.add(c));
    if (!set.has(dZhi)) return [];
    const gang = ['甲', '丙', '戊', '庚', '壬'].indexOf(day[0]) >= 0;
    const hits = [{ cond: '旬' + xunHead + '丁神' + dZhi + '临课', duan: '丁神至动，主行移变动、出入' }];
    if (chuan.indexOf(dZhi) >= 0) hits.push({ cond: '丁神临' + ['初传', '中传', '末传'][chuan.indexOf(dZhi)], duan: gang ? '刚日丁马，行人即日见归' : '柔日丁马，行人暂合于外，一时不至' });
    return hits;
  }
  // 论身命：干上神与日干五行五关系 + 干禄 + 干上神落空
  function lnShenMingHits(day, si) {
    const CORE = D.liunren.core || {};
    const gs = si[0].shang;
    const ganWx = GAN_WX[day[0]];
    const gsWx = ZHI_WX[gs];
    const ke = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }; // 前者克后者
    const sheng = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 前者生后者
    const hits = [];
    if (ke[gsWx] === ganWx) hits.push({ cond: '干上神' + gs + '（' + gsWx + '）克日干（' + ganWx + '）', duan: '身无所安著，灾讼丧命，终身无成' });
    else if (sheng[gsWx] === ganWx) hits.push({ cond: '干上神' + gs + '（' + gsWx + '）生日干（' + ganWx + '）', duan: '父母荫庇，身命有助，谋事得生' });
    else if (sheng[ganWx] === gsWx) hits.push({ cond: '日干（' + ganWx + '）生干上神' + gs + '（' + gsWx + '）', duan: '我生子孙，耗泄己身，宜防破费' });
    else if (ke[ganWx] === gsWx) hits.push({ cond: '日干（' + ganWx + '）克干上神' + gs + '（' + gsWx + '）', duan: '我克者财，身命得财，努力可获' });
    else hits.push({ cond: '干上神' + gs + '与日干比和（' + ganWx + '）', duan: '身命平稳，百事持重' });
    const lu = (CORE.shensha_gan && CORE.shensha_gan.rilu && CORE.shensha_gan.rilu[day[0]]) || '';
    if (lu && lu === gs) hits.push({ cond: '干禄' + lu + '得地临干上', duan: '禄神得地，求名有禄可享，终身可守' });
    const xk = (CORE.shensha && CORE.shensha.xunkong && CORE.shensha.xunkong[day]) || '';
    if (xk && xk.indexOf(gs) >= 0) hits.push({ cond: '干上神' + gs + '落旬空' + xk, duan: '身命空亡，作事无力，主虚度' });
    return hits;
  }
  // 论干支上下：干上/支上五行五关系 + 相刑害破
  function lnGZSHits(si) {
    const gs = si[0].shang, zs = si[1].shang;
    const ke = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
    const sheng = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
    const gsWx = ZHI_WX[gs], zsWx = ZHI_WX[zs];
    const hits = [];
    if (ke[gsWx] === zsWx) hits.push({ cond: '干上神' + gs + '（' + gsWx + '）克支上神' + zs + '（' + zsWx + '）', duan: '我凌人，谋害于他' });
    else if (ke[zsWx] === gsWx) hits.push({ cond: '支上神' + zs + '（' + zsWx + '）克干上神' + gs + '（' + gsWx + '）', duan: '人害己，当预防其难' });
    else if (sheng[gsWx] === zsWx) hits.push({ cond: '干上神' + gs + '（' + gsWx + '）生支上神' + zs + '（' + zsWx + '）', duan: '我生宅，人情和顺而耗我' });
    else if (sheng[zsWx] === gsWx) hits.push({ cond: '支上神' + zs + '（' + zsWx + '）生干上神' + gs + '（' + gsWx + '）', duan: '宅助我，人助己，谋事有援' });
    else hits.push({ cond: '干上神' + gs + '与支上神' + zs + '比和（' + gsWx + '）', duan: '干支一体，人情和合，事体平稳' });
    const CORE = D.liunren.core || {};
    const x = CORE.qike || {}, h = CORE.hai || {}, p = CORE.po || {};
    if ((x[gs] === zs) || (h[gs] === zs) || (p[gs] === zs) || (x[zs] === gs) || (h[zs] === gs) || (p[zs] === gs)) {
      hits.push({ cond: '干上神' + gs + '与支上神' + zs + '相刑/害/破', duan: '上下不和，人情乖戾，事多阻滞' });
    }
    return hits;
  }
  // 论干支家宅：支上神空/刑破害
  function lnJZhaiHits(day, si, chuan) {
    const CORE = D.liunren.core || {};
    const zs = si[1].shang;
    const xk = (CORE.shensha && CORE.shensha.xunkong && CORE.shensha.xunkong[day]) || '';
    const set = new Set();
    si.forEach(k => { set.add(k.shang); set.add(k.xia); });
    chuan.forEach(c => set.add(c));
    const hits = [];
    if (xk && xk.indexOf(zs) >= 0) hits.push({ cond: '支上神' + zs + '入旬空' + xk, duan: '家宅虚耗，财退失脱' });
    const x = CORE.qike || {}, h = CORE.hai || {}, p = CORE.po || {};
    const broken = Array.from(set).some(b => (x[zs] === b) || (h[zs] === b) || (p[zs] === b) || (x[b] === zs) || (h[b] === zs) || (p[b] === zs));
    if (broken) hits.push({ cond: '支上神' + zs + '见刑/害/破', duan: '家宅不宁，人口灾病' });
    return hits;
  }
  // 论行人：驿马 / 游神 / 传送申 / 丁马（行人出行信息）
  function lnXingRenHits(day, si, chuan) {
    const CORE = D.liunren.core || {};
    const zhima = (CORE.shensha_zhi && CORE.shensha_zhi.zhima && CORE.shensha_zhi.zhima[day[1]]) || '';
    const xk = (CORE.shensha && CORE.shensha.xunkong && CORE.shensha.xunkong[day]) || '';
    const set = new Set();
    si.forEach(k => { set.add(k.shang); set.add(k.xia); });
    chuan.forEach(c => set.add(c));
    const hits = [];
    if (zhima && set.has(zhima)) {
      hits.push({ cond: '驿马' + zhima + '临课', duan: '行人动，必有出行/信息之事' });
      if (zhima === si[0].shang) hits.push({ cond: '驿马' + zhima + '临干上', duan: '行人即日见归' });
      if (xk && xk.indexOf(zhima) >= 0) hits.push({ cond: '驿马' + zhima + '落旬空' + xk, duan: '马落空亡，行人不至，欲行不行' });
    }
    // 游神（四季）：春丑、夏子、秋戌、冬亥，临课主行人出/信息动
    const season = (() => {
      const m = new Date().getMonth() + 1;
      if (m >= 2 && m <= 4) return '丑';
      if (m >= 5 && m <= 7) return '子';
      if (m >= 8 && m <= 10) return '戌';
      return '亥';
    })();
    if (set.has(season)) hits.push({ cond: '游神' + season + '（' + ['春丑', '夏子', '秋戌', '冬亥'][['丑', '子', '戌', '亥'].indexOf(season)] + '）临课', duan: '行人出游/有音信，出行之事将动' });
    // 传送申：申为传送之神，临课主行人/信息
    if (set.has('申')) hits.push({ cond: '传送' + '申' + '临课', duan: '行人信息传送，有书信音问' });
    // 丁神入传：刚日即日见归 / 柔日暂合于外
    const idx = JIAZI.indexOf(day);
    if (idx >= 0) {
      const xunHead = JIAZI[Math.floor(idx / 10) * 10];
      const dZhi = ZHI[(ZHI.indexOf(xunHead[1]) + 3) % 12];
      if (chuan.indexOf(dZhi) >= 0) {
        const gang = ['甲', '丙', '戊', '庚', '壬'].indexOf(day[0]) >= 0;
        hits.push({ cond: '旬丁' + dZhi + '临' + ['初传', '中传', '末传'][chuan.indexOf(dZhi)], duan: gang ? '刚日丁马，行人即日见归' : '柔日丁马，行人暂合于外，一时不至' });
      }
    }
    return hits;
  }
  // 论太阳太岁月建：太岁/月建临课 / 月破加日
  function lnSuiYueHits(si, chuan, sui, yue, tp) {
    const CORE = D.liunren.core || {};
    const chong = CORE.chong || {};
    const set = new Set();
    si.forEach(k => { set.add(k.shang); set.add(k.xia); });
    chuan.forEach(c => set.add(c));
    const hits = [];
    if (sui && set.has(sui)) hits.push({ cond: '太岁' + sui + '临课', duan: '不分民庶皆承恩（无刑克冲害时）' });
    if (yue && set.has(yue)) hits.push({ cond: '月建' + yue + '临课', duan: '月建主当月事，吉凶看所临神煞' });
    const yuePo = chong[yue] || '';
    if (yuePo && si[0].shang === yuePo) hits.push({ cond: '月破' + yuePo + '加日（临干上）', duan: '月破加凶克日，破财灾病；传中有生可解' });
    return hits;
  }
  // 论行年本命：本命支/行年支入课，刑冲破害，落空
  function lnXingMingHits(day, si, chuan, year, sex) {
    const CORE = D.liunren.core || {};
    const xk = (CORE.shensha && CORE.shensha.xunkong && CORE.shensha.xunkong[day]) || '';
    const chong = CORE.chong || {};
    const x = CORE.qike || {}, h = CORE.hai || {}, p = CORE.po || {};
    if (!year || isNaN(year)) return [];
    const yearN = Math.floor(Number(year));
    const mingZhi = ZHI[((yearN - 4) % 12 + 12) % 12];      // 生年地支（如 2005 → 酉）
    const xusui = 2026 - yearN + 1;                          // 虚岁（以 2026 计）
    const step = (xusui - 1) % 12;
    const xingZhi = ZHI[(sex === '女' ? (ZHI.indexOf(mingZhi) - step + 24) % 12 : (ZHI.indexOf(mingZhi) + step) % 12)]; // 男顺女逆
    const course = [si[0].shang, si[0].xia, si[1].shang, si[1].xia].concat(chuan);
    const set = new Set(course);
    const hits = [];
    const touched = (z) => Array.from(set).some(b => (x[z] === b) || (h[z] === b) || (p[z] === b) || (chong[z] === b) || (x[b] === z) || (h[b] === z) || (p[b] === z) || (chong[b] === z));
    if (set.has(mingZhi)) {
      hits.push({ cond: '本命' + mingZhi + '（' + yearN + '年生）临课', duan: '本命入课，主本命所系之事，吉凶看所临神' });
      if (si[1].shang === mingZhi) hits.push({ cond: '本命' + mingZhi + '临支上', duan: '本命临宅，家宅所系' });
    } else if (touched(mingZhi)) {
      hits.push({ cond: '本命' + mingZhi + '见课集刑冲破害', duan: '本命受冲克，防本命所属之灾' });
    }
    if (set.has(xingZhi)) {
      hits.push({ cond: '行年' + xingZhi + '（' + yearN + '年生' + sex + '，虚岁' + xusui + '）临课', duan: '行年入课，主当年吉凶所系' });
      if (si[0].shang === xingZhi) hits.push({ cond: '行年' + xingZhi + '临干上', duan: '行年临身，身命所关，当年之事切要' });
    } else if (touched(xingZhi)) {
      hits.push({ cond: '行年' + xingZhi + '见课集刑冲破害', duan: '行年受冲克，当年防灾讼破耗' });
    }
    if (xk) {
      if (xk.indexOf(xingZhi) >= 0) hits.push({ cond: '行年' + xingZhi + '落旬空' + xk, duan: '行年空亡，当年作事无力，主虚度' });
      if (xk.indexOf(mingZhi) >= 0) hits.push({ cond: '本命' + mingZhi + '落旬空' + xk, duan: '本命空亡，根基虚耗' });
    }
    return hits;
  }
  function siKe(tp, day, jigong) {
    const gan = day[0], zhi = day[1];
    const gzh = jigong[gan];
    const gshang = tp[gzh];
    return [
      { xia: gzh, shang: gshang, tag: '干上' },
      { xia: gshang, shang: tp[gshang], tag: '干阳' },
      { xia: zhi, shang: tp[zhi], tag: '支上' },
      { xia: tp[zhi], shang: tp[tp[zhi]], tag: '支阳' },
    ];
  }
  function zhiToGan(z) { return { 子: '壬', 丑: '癸', 寅: '甲', 卯: '乙', 辰: '丙', 巳: '丁', 午: '戊', 未: '己', 申: '庚', 酉: '辛', 戌: '壬', 亥: '癸' }[z]; }
  function keTi(si, day, tp, jigong, mode) {
    const gan = day[0];
    const upK = [], downK = [];
    si.forEach((k, i) => {
      const sw = zhiWx(k.shang), xw = zhiWx(k.xia);
      if (sw && xw) {
        if (ke(sw, xw)) upK.push({ i, ...k });
        if (ke(xw, sw)) downK.push({ i, ...k });
      }
    });
    if (mode === 'fuyin') return { name: '伏吟课', chuji: si[0].shang, note: '天地盘同位，利静不利动，利君子不利小人。' };
    if (mode === 'fanyin') return { name: '返吟课', chuji: si[0].shang, note: '天地盘相冲，诸事反复迟滞。' };
    if (upK.length === 1 && downK.length === 0) return { name: '元首课', chuji: upK[0].shang, note: '一上克下，万事顺利，尊卑有序。' };
    if (downK.length === 1 && upK.length === 0) return { name: '重审课', chuji: downK[0].xia, note: '一下贼上，事逆，再三详审而后行。' };
    const allK = upK.concat(downK.map(k => ({ ...k, shang: k.xia, dir: 'down' })));
    if (allK.length > 1) {
      const yin = isYinGan(gan);
      const bi = allK.filter(k => isYinGan(zhiToGan(k.shang)) === yin);
      if (bi.length >= 1) return { name: '知一课（比用）', chuji: bi[0].shang, note: '二爻皆动，事有两岐，善比者择而从之。' };
      const mid = allK.map(k => k.shang).find(z => '子午卯酉'.indexOf(z) >= 0) || allK[0].shang;
      return { name: '涉害课', chuji: mid, note: '诸克无比，涉归本家，以孟仲季深浅为用。' };
    }
    if (allK.length === 1) return { name: allK[0].dir === 'down' ? '重审课' : '元首课', chuji: allK[0].shang, note: '' };
    const gw = ganWx(gan);
    const yaoke = si.find(k => zhiWx(k.shang) && ke(zhiWx(k.shang), gw));
    const tan = si.find(k => zhiWx(k.shang) && ke(gw, zhiWx(k.shang)));
    if (yaoke) return { name: '蒿矢课（遥克）', chuji: yaoke.shang, note: '四课无克，上神遥克日干，事起远。' };
    if (tan) return { name: '弹射课（遥克）', chuji: tan.shang, note: '四课无克，日干遥克上神，事从内生。' };
    if (jigong[gan] === day[1]) return { name: '八专课', chuji: si[0].shang, note: '干支同位，四课止两课，事专一。' };
    return { name: '昴星课', chuji: si[0].shang, note: '无克无遥，取昴星为用（简化取干上）。' };
  }
  function sanChuan(si, chuji, tp) {
    const c1 = chuji;
    const c1w = zhiWx(c1);
    let c2 = null, c3 = null;
    for (const z of ZHI) { if (zhiWx(z) && c1w && ke(c1w, zhiWx(z))) { c2 = tp[z] || z; break; } }
    if (!c2) c2 = tp[gz(c1)] || c1;
    const c2w = zhiWx(c2);
    for (const z of ZHI) { if (zhiWx(z) && c2w && ke(c2w, zhiWx(z))) { c3 = tp[z] || z; break; } }
    if (!c3) c3 = tp[gz(c2)] || c2;
    return [c1, c2, c3];
  }
  function escLn(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // 大六壬天盘圆盘 SVG：外圈十二支（上北下南，子北在上），内圈月将加临后天盘支，中圈天将
  function lnPanSVG(tp, yj, hour, day, tjMap) {
    const C = 280, R_OUT = 244, R_MID = 166, R_IN = 92;
    const ang = (idx) => (idx * 30 - 90) * Math.PI / 180;
    const pt = (idx, r) => [C + r * Math.cos(ang(idx)), C + r * Math.sin(ang(idx))];
    let s = '<svg viewBox="0 0 560 560" style="width:100%;max-width:560px;background:#12151f;border:1px solid var(--line);border-radius:10px;">';
    s += '<circle cx="' + C + '" cy="' + C + '" r="' + (R_OUT + 20) + '" fill="none" stroke="var(--line)"/>';
    s += '<circle cx="' + C + '" cy="' + C + '" r="' + R_MID + '" fill="none" stroke="var(--line)" stroke-dasharray="3 5"/>';
    s += '<circle cx="' + C + '" cy="' + C + '" r="' + R_IN + '" fill="none" stroke="var(--line)"/>';
    for (let i = 0; i < 12; i++) {
      const p1 = pt(i, R_IN), p2 = pt(i, R_OUT);
      s += '<line x1="' + p1[0].toFixed(1) + '" y1="' + p1[1].toFixed(1) + '" x2="' + p2[0].toFixed(1) + '" y2="' + p2[1].toFixed(1) + '" stroke="var(--line)" stroke-width="0.5" opacity="0.5"/>';
    }
    for (let i = 0; i < 12; i++) {
      const p = pt(i, R_OUT + 34);
      s += '<text x="' + p[0].toFixed(1) + '" y="' + p[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" fill="var(--tx2)" font-size="16">' + ZHI[i] + '</text>';
    }
    for (let i = 0; i < 12; i++) {
      const gz = ZHI[i];
      const pIn = pt(i, R_MID);
      const tpz = tp[gz];
      const isYj = (tpz === yj);
      s += '<text x="' + pIn[0].toFixed(1) + '" y="' + pIn[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" fill="' + (isYj ? '#f0c860' : '#8fb7ff') + '" font-size="17" font-weight="' + (isYj ? '700' : '400') + '">' + tpz + '</text>';
    }
    // 中圈天将简名
    if (tjMap) {
      for (let i = 0; i < 12; i++) {
        const gz = ZHI[i];
        const pT = pt(i, (R_IN + R_MID) / 2);
        const j = tjMap[gz];
        s += '<text x="' + pT[0].toFixed(1) + '" y="' + pT[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" fill="#d98cff" font-size="11">' + (j || '') + '</text>';
      }
    }
    s += '<text x="' + C + '" y="' + (C - 34) + '" text-anchor="middle" fill="var(--tx1)" font-size="18" font-weight="700">' + yj + '将加' + hour + '时</text>';
    s += '<text x="' + C + '" y="' + (C - 6) + '" text-anchor="middle" fill="#e0a65e" font-size="14">' + day + '日</text>';
    s += '<text x="' + C + '" y="' + (C + 22) + '" text-anchor="middle" fill="var(--tx3)" font-size="12">中圈=天将 · 内圈=加临后地支</text>';
    if (tjMap && tjMap._info) {
      s += '<text x="' + C + '" y="' + (C + 44) + '" text-anchor="middle" fill="#b48aef" font-size="12">贵人' + tjMap._info.guiZhi + '加 · ' + (tjMap._info.dayDawn ? '昼占顺布' : '夜占逆布') + '</text>';
    }
    const gs = siKe(tp, day, D.liunren.core.jigong)[0].shang;
    const gsIdx = ZHI.indexOf(gs);
    const pG = pt(gsIdx, (R_IN + R_MID) / 2 - 14);
    s += '<circle cx="' + pG[0].toFixed(1) + '" cy="' + pG[1].toFixed(1) + '" r="17" fill="#2a1f0d" stroke="#f0c860" stroke-width="1.5"/>';
    s += '<text x="' + pG[0].toFixed(1) + '" y="' + pG[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" fill="#f0c860" font-size="11">干上</text>';
    s += '</svg>';
    return s;
  }
  function lnInit() {
    if (!D || !D.liunren) { $('ln-title').textContent = '数据加载失败'; return; }
    const CORE = D.liunren.core;
    const selDay = $('ln-day');
    selDay.innerHTML = JIAZI.map(g => '<option value="' + g + '">' + g + '</option>').join('');
    selDay.value = todayGanzhi();
    const selHour = $('ln-hour');
    selHour.innerHTML = SHI.map((z, i) => {
      const h = (i * 2 + 1) % 24;
      return '<option value="' + z + '">' + z + '时（' + (h < 10 ? '0' + h : h) + ':00）</option>';
    }).join('');
    const now = new Date();
    selHour.value = SHI[Math.floor((now.getHours() + 1) / 2) % 12];
    const selYj = $('ln-yuejiang');
    const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
    selYj.innerHTML = monthNames.map(m => {
      const jq = CORE.jietiao[m];
      return '<option value="' + CORE.yuejiang[jq] + '">' + m + '（' + jq + '后 ' + CORE.yuejiang[jq] + '将）</option>';
    }).join('');
    const selLei = $('ln-lei');
    selLei.innerHTML = LEI_LIST.map(l => '<option>' + l + '</option>').join('');
    // 太岁（年支）/ 月建（节气月支）：推岁破/月破/四废。默认当前 2026 丙午年 · 戌月（可按实际调整）
    const selSui = $('ln-sui');
    selSui.innerHTML = SHI.map(z => '<option value="' + z + '">' + z + '</option>').join('');
    selSui.value = '午';
    const selYue = $('ln-yue');
    selYue.innerHTML = SHI.map((z, i) => '<option value="' + z + '">' + z + '（' + monthNames[i] + '）</option>').join('');
    selYue.value = '戌';
    $('ln-today').addEventListener('click', () => { selDay.value = todayGanzhi(); });
    $('ln-go').addEventListener('click', lnGo);
    $('ln-title').textContent = '大六壬 · 四课三传（御定直指 720 局查表）';
    $('ln-out').innerHTML = '<div class="muted">已载入御定直指 720 局断语库、课经 ' + (D.liunren.keshi || []).length + ' 条、毕法 ' + (D.liunren.bifa || []).length + ' 条、兵占五十篇、十干神煞 ' + Object.keys((D.liunren.shensha || {}).gan || {}).length + ' 煞、景祐神定经 ' + (((D.liunren.shendingjing || {}).sections) || []).length + ' 节。选择日 / 时辰 / 月将（按节气自动对应）与事类后点「起课」：布天盘 → 取四课三传 → 判课体 → 查当日干上神对应局断语 + 类占 + 课经 + 毕法 + 神煞临课。</div>';
    $('ln-si').innerHTML = '<div class="src">方法：月将加时布天盘 → 十干寄宫取干上神 → 四课三传九宗门判课体 → 干上神查御定直指 720 局。三传递克为简化实现；御定断语以 720 局原文为准。毕法/课经/天将临位（指南）为关联参考。</div>';
    const tj0 = buTianJiang(tianpan(selYj.value, selHour.value), selDay.value, selHour.value);
    const tjMap0 = Object.assign({}, tj0.map, { _info: { guiZhi: tj0.guiZhi, dayDawn: tj0.dayDawn, dir: tj0.dir } });
    $('ln-pan').innerHTML = lnPanSVG(tianpan(selYj.value, selHour.value), selYj.value, selHour.value, selDay.value, tjMap0);
  }
  function lnGo() {
    const CORE = D.liunren.core;
    const day = $('ln-day').value, hour = $('ln-hour').value, yj = $('ln-yuejiang').value, lei = $('ln-lei').value;
    const sui = $('ln-sui').value, yue = $('ln-yue').value;
    const birthY = $('ln-birth') ? $('ln-birth').value : '';
    const sexV = $('ln-sex') ? $('ln-sex').value : '男';
    const tp = tianpan(yj, hour);
    const tj = buTianJiang(tp, day, hour);
    const tjMap = Object.assign({}, tj.map, { _info: { guiZhi: tj.guiZhi, dayDawn: tj.dayDawn, dir: tj.dir } });
    $('ln-pan').innerHTML = lnPanSVG(tp, yj, hour, day, tjMap);
    const si = siKe(tp, day, CORE.jigong);
    const fuyin = yj === hour;
    const fanyin = CORE.chong && CORE.chong[yj] === hour;
    const kt = keTi(si, day, tp, CORE.jigong, fuyin ? 'fuyin' : (fanyin ? 'fanyin' : ''));
    const chuan = sanChuan(si, kt.chuji, tp);
    const ju720 = D.liunren.ju720 || [];
    const gshang = si[0].shang;
    const rec = ju720.find(r => r.day === day && r.ganshang === gshang);
    const keshi = D.liunren.keshi || [];
    const keshiRec = keshi.find(k => rec && k.name && rec.keshi && rec.keshi.indexOf(k.name.slice(0, 2)) >= 0);
    const leiTxt = rec && rec.lei && rec.lei[lei] ? rec.lei[lei] : (rec && rec.lei ? '（该局无「' + lei + '」类占条目）' : '');
    let h = '';
    h += '<h3>起课信息</h3><div class="src">日 ' + day + ' · ' + hour + '时 · ' + yj + '将 · 事类「' + lei + '」' +
      (tj.dayDawn ? ' · 昼占（旦贵' + tj.guiZhi + '顺布）' : ' · 夜占（暮贵' + tj.guiZhi + '逆布）') + '</div>';
    h += '<div class="ln-pan-box">';
    h += '<div style="font-size:13px;color:var(--tx2);margin-bottom:6px;">天盘（' + yj + '将加' + hour + '时）：' +
      ZHI.map(z => z + '→' + tp[z]).join('　') + '</div>';
    h += '<div class="ln-4ke">' + si.map((k, i) =>
      '<div class="ln-ke"><b>第' + (i + 1) + '课 · ' + k.tag + '</b>　下 ' + k.xia + ' 上 ' + k.shang + '</div>').join('') + '</div>';
    h += '<div class="ln-3c">' + chuan.map((c, i) => {
      const marks = [];
      const sanHe = (['申', '子', '辰'].indexOf(c) >= 0 ? '申子辰' : ['寅', '午', '戌'].indexOf(c) >= 0 ? '寅午戌' : ['巳', '酉', '丑'].indexOf(c) >= 0 ? '巳酉丑' : '亥卯未');
      const yimaT = CORE.shensha && CORE.shensha.yima || {};
      if (yimaT[sanHe] === c) marks.push('驿马');
      const xkNow = (CORE.shensha && CORE.shensha.xunkong && CORE.shensha.xunkong[day]) || '';
      if (xkNow.indexOf(c) >= 0) marks.push('旬空');
      const zc = tpZhiOf(tp, c);
      if (zc) marks.push((TJ_SHORT2FULL[tj.map[zc]] || tj.map[zc]) + '临' + zc + '宫');
      return '<div class="ln-chuan"><b>' + (['初', '中', '末'][i]) + '传</b><br>' + c +
        (marks.length ? '<br><span style="font-size:11px;color:var(--tx3);">' + marks.join(' · ') + '</span>' : '') + '</div>';
    }).join('') + '</div>';
    h += '<div style="font-size:13px;margin-top:6px;"><b style="color:var(--acc);">课体：' + escLn(kt.name) + '</b>' +
      (kt.note ? '<span style="color:var(--tx2);">　' + escLn(kt.note) + '</span>' : '') + '</div>';
    h += '</div>';
    // ── 天将临位判辞（《大六壬指南·心印赋》）──
    const z1 = tpZhiOf(tp, chuan[0]);          // 初传神所临地盘支
    const zGs = tpZhiOf(tp, gshang);           // 干上神所临地盘支
    const hit1 = z1 ? zhinanHit(tj.map[z1], z1) : null;
    const hitGs = zGs ? zhinanHit(tj.map[zGs], zGs) : null;
    h += '<h3>天将临位 · 《大六壬指南·心印赋》</h3>';
    h += '<div class="ln-verdict"><b>' + escLn(hitGs ? hitGs.title : (zGs ? (TJ_SHORT2FULL[tj.map[zGs]] || '') + '居' + zGs : '干上宫')) + '</b>　<span style="color:var(--tx2);">干上神 ' + gshang + '（' + zGs + '宫）</span><br>' +
      escLn(hitGs ? hitGs.song : '（原书未录此位判辞）') +
      (hitGs && hitGs.weiInfo ? '<div style="color:var(--tx3);font-size:12px;">' + escLn(zGs + '宫：' + hitGs.weiInfo) + '</div>' : '') + '</div>';
    h += '<div class="ln-verdict"><b>' + escLn(hit1 ? hit1.title : (z1 ? (TJ_SHORT2FULL[tj.map[z1]] || '') + '居' + z1 : '初传宫')) + '</b>　<span style="color:var(--tx2);">初传 ' + chuan[0] + '（' + z1 + '宫）</span><br>' +
      escLn(hit1 ? hit1.song : '（原书未录此位判辞）') +
      (hit1 && hit1.weiInfo ? '<div style="color:var(--tx3);font-size:12px;">' + escLn(z1 + '宫：' + hit1.weiInfo) + '</div>' : '') + '</div>';
    h += '<div class="ln-tj">' + ZHI.map(z =>
      '<span><b>' + z + '</b>：' + (TJ_SHORT2FULL[tj.map[z]] || '') + '</span>').join('') + '</div>';
    // ── 指南·其余天将临位命中（除干上/初传外，凡命中 128 条表者列短名）──
    const restTj = [];
    for (const z of ZHI) {
      if (z === zGs || z === z1) continue;
      const hit = zhinanHit(tj.map[z], z);
      if (hit) restTj.push({ z, jiang: TJ_SHORT2FULL[tj.map[z]] || tj.map[z], title: hit.title });
    }
    if (restTj.length) {
      h += '<div style="margin-top:6px;"><button class="act ln-mini" id="ln-rest-btn">其余天将临位命中（' + restTj.length + '）▸</button>' +
        '<div id="ln-rest-tj" style="display:none;margin-top:4px;">' +
        restTj.map(r => '<span style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;border:1px solid var(--line);border-radius:10px;font-size:12px;color:var(--tx2);">' + escLn(r.jiang) + '居' + r.z + ' · ' + escLn(r.title) + '</span>').join('') + '</div></div>';
    }
    // ── 破神章（《大六壬指南·论破神》条件结构化自动命中）──
    const poHits = lnPoHits(day, si, chuan, tp, tjMap, sui, yue);
    if (poHits.length) {
      const poTop = poHits.slice(0, 5);
      const poRest = poHits.slice(5);
      h += '<div class="ln-extra"><h3>指南·论破神（破煞命中 ' + poHits.length + ' 条' + (poHits.length > 5 ? '，默认展开 5 条' : '') + '）</h3>' +
        poTop.map(p => '<div class="ln-verdict" style="margin:4px 0;padding:6px 10px;"><b>' + escLn(p.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(p.duan) + '</span></div>').join('');
      if (poRest.length) {
        h += '<button class="act ln-mini" id="ln-po-more">另有 ' + poRest.length + ' 条命中 ▸</button>' +
          '<div id="ln-po-rest" style="display:none;">' +
          poRest.map(p => '<div class="ln-verdict" style="margin:4px 0;padding:6px 10px;"><b>' + escLn(p.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(p.duan) + '</span></div>').join('') + '</div>';
      }
      h += '</div>';
    } else {
      h += '<div class="ln-extra"><h3>指南·论破神</h3><div class="src">本课四课三传与十二天将宫未见月破/岁破/破碎煞，无破神命中。</div></div>';
    }
    if (rec) {
      h += '<h3>御定直指 · ' + day + '日第' + rec.no + '局（' + escLn(rec.keshi || '') + '）</h3><div class="src">依据：干上神 ' + gshang + ' 查 720 局表</div>';
      if (rec.keyi) h += '<div><b>课义：</b>' + escLn(rec.keyi) + '</div>';
      if (rec.jieyue) h += '<div><b>解曰：</b>' + escLn(rec.jieyue) + '</div>';
      if (rec.duanyue) h += '<div><b>断曰：</b>' + escLn(rec.duanyue) + '</div>';
      if (rec.bifa) h += '<div style="margin-top:4px;"><b>毕法云：</b>' + escLn(rec.bifa) + '</div>';
      h += '<h3>类占 · ' + lei + '</h3><div>' + escLn(leiTxt) + '</div>';
    } else {
      h += '<h3>720 局未命中</h3><div style="color:#d17a7a;">日 ' + day + ' · 干上神 ' + gshang + ' 未在御定直指表中，请检查输入或月将算法。</div>';
    }
    // ── 翠雨歌·按事类自动命中（机器匹配，非人工翻）──
    const cuiyu = D.liunren.cuiyu || [];
    const cyKeys = LEI_CUIYU[lei] || [];
    const cyHits = cyKeys.length ? cuiyu.filter(c => cyKeys.some(k => c.name.indexOf(k) >= 0)) : [];
    if (cyHits.length) {
      const cyTop = cyHits[0];
      h += '<div class="ln-extra"><h3>翠雨歌·类占（自动命中 ' + cyHits.length + ' 条' + (cyHits.length > 1 ? '，默认展开 1 条' : '') + '）</h3>' +
        '<div class="ln-verdict"><b>' + escLn(cyTop.name.replace(/第[一二三四五六七八九十百]+$/, '')) + '</b><br><span style="color:var(--tx2);">' + escLn(cyTop.body) + '</span></div>';
      if (cyHits.length > 1) {
        h += '<div style="margin-top:6px;font-size:12px;color:var(--tx3);">相关条目：' +
          cyHits.slice(1).map((c, j) => '<span class="ln-cy-chip" data-i="' + (j + 1) + '" style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;border:1px solid var(--line);border-radius:10px;cursor:pointer;">' + escLn(c.name.replace(/第[一二三四五六七八九十百]+$/, '')) + '</span>').join('') + '</div>' +
          '<div id="ln-cy-detail" class="src" style="font-size:12.5px;line-height:1.8;"></div>';
      }
      h += '</div>';
    } else {
      h += '<div class="ln-extra"><h3>翠雨歌·类占</h3>' +
        (cyKeys.length ? '<div class="src">「' + lei + '」无对应专条（翠雨歌按占事分条，另可查全部条目）。</div>' : '<div class="src">「' + lei + '」无自动命中专条，可按需查看全部 ' + cuiyu.length + ' 条。</div>') +
        '<select id="ln-cuiyu" style="width:100%;"><option value="">— 全部 ' + cuiyu.length + ' 条按需查看 —</option>' +
        cuiyu.map((c, i) => '<option value="' + i + '">' + escLn(c.name) + '</option>').join('') + '</select><div id="ln-cuiyu-out" class="src" style="font-size:12.5px;line-height:1.8;"></div></div>';
    }
    if (keshiRec) h += '<h3>课经 · ' + escLn(keshiRec.name) + '</h3><div>' + escLn(keshiRec.defn || '') + '</div>';
    const bifa = D.liunren.bifa || [];
    const hits = bifa.filter(b => b.name && rec && rec.bifa && rec.bifa.indexOf(b.name.slice(0, 2)) >= 0).slice(0, 3);
    if (hits.length) {
      h += '<h3>毕法疑似命中（' + hits.length + '）</h3>' + hits.map(b =>
        '<div><b>' + escLn(b.name) + '</b>　' + escLn((b.tiao || '').replace(/^\S+?第[一二三四五六七八九十百]+/, '')) +
        (b.body ? '<div style="color:var(--tx2);font-size:12.5px;line-height:1.8;">' + escLn(b.body) + '</div>' : '') + '</div>').join('');
    }
    // ── 兵战区（事类=兵战 时附五十篇；机判命中 + 活步骤红字 + 原文备查）──
    if (lei === '兵战') {
      const bz = D.liunren.bingzhan || [];
      const bzCat = (D.liunren && D.liunren.bingzhan_cat) || { cats: [] };
      if (bz.length) {
        let bzJ = '';
        if (bzCat.cats && bzCat.cats.length) {
          const ctxS = { day: day, si: si, chuan: chuan, tp: tp, tjMap: tjMap, sui: sui, yue: yue, monthZhi: yue, dayZhi: day ? day[1] : '' };
          const bzHits = [];
          bzCat.cats.forEach(c => { const r = lnGuJi.lnGuJiHits(c, ctxS); (r || []).forEach(x => bzHits.push({ cat: c.name, cond: x.cond, duan: x.duan })); });
          bzJ = '<div style="margin:6px 0 2px;color:#8fbf8f;font-weight:700;">兵占五十篇 · 本课机判命中 ' + bzHits.length + ' 条</div>' +
            (bzHits.length
              ? bzHits.slice(0, 6).map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(x.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(x.duan) + '</span><div style="font-size:11px;color:var(--tx3);">' + escLn(x.cat) + '</div></div>').join('') +
                (bzHits.length > 6 ? '<button class="act ln-mini" id="ln-bz-more">另有 ' + (bzHits.length - 6) + ' 条命中 ▸</button><div id="ln-bz-more-box" style="display:none;">' + bzHits.slice(6).map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(x.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(x.duan) + '</span></div>').join('') + '</div>' : '')
              : '<div class="muted">本课未命中兵占五十篇的机判条件——未命中不假装，可按下方篇目选看活步骤与原文。</div>');
        }
        h += '<div class="ln-extra"><h3>兵占五十篇 · 《六壬大全·卷五》（本课机判 + 按篇查看）</h3>' + bzJ +
          '<select id="ln-bz" style="width:100%;"><option value="">— 选择篇目 —</option>' +
          bz.map((b, i) => '<option value="' + i + '">' + b.no + '. ' + escLn(b.name) + '</option>').join('') + '</select><div id="ln-bz-out" class="src" style="font-size:12.5px;line-height:1.8;"></div></div>';
      }
    }
    // ── 六壬大全 · 十干神煞：按日干机判（13 煞临支 + 是否临课）──
    const SS = (D.liunren && D.liunren.shensha) || {};
    const ssGan = SS.gan || {};
    const gan0 = day[0];
    const ssHits = Object.keys(ssGan).filter(n => ssGan[n] && typeof ssGan[n] === 'object' && ssGan[n][gan0]).map(n => {
      const v = ssGan[n][gan0];
      const inKe = si.some(k => k.shang === v || k.xia === v) || day[1] === v;
      return { n, v, inKe };
    });
    if (ssHits.length) {
      h += '<div class="ln-extra"><h3>六壬大全 · 十干神煞（日干「' + escLn(gan0) + '」机判，命中 ' + ssHits.length + ' 煞）</h3>';
      h += '<div style="font-size:12.5px;line-height:1.9;">' + ssHits.map(x =>
        '<span style="display:inline-block;margin-right:10px;color:' + (x.inKe ? 'var(--acc)' : 'var(--tx2)') + ';">' + escLn(x.n) + ' ' + x.v + (x.inKe ? '（临课）' : '（不临课）') + '</span>').join('') + '</div>';
      h += '<div style="font-size:12px;color:var(--tx3);margin-top:4px;">三奇：' + (SS.sanqi || []).join(' ｜ ') + '（日干入其一组，主天乙贵神加临之事）</div>';
      h += '<div style="font-size:12px;color:var(--tx2);margin-top:4px;"><button id="ln-ss-raw-btn" type="button" style="font-size:12px;padding:2px 8px;">展开神煞原文（岁/支/月） ▸</button></div>';
      h += '<div id="ln-ss-raw" style="display:none;font-size:12.5px;line-height:1.8;" class="src">';
      h += '<b>岁神煞</b><br>' + (SS.sui || []).map(escLn).join('<br>');
      h += '<br><br><b>十二支神煞</b><br>' + (SS.zhi || []).map(escLn).join('<br>');
      (SS.month || []).forEach(m => { h += '<br><br><b>' + escLn(m.month) + '</b><br>' + (m.lines || []).map(escLn).join('<br>'); });
      h += '</div></div>';
    }
    // ── 神煞 · 岁/支/月机判层（逐月表 + 岁表 + 支表，按课集判临课；公式煞归活步骤红字）──
    const ssCat = (D.liunren && D.liunren.shensha_cat) || null;
    if (ssCat) {
      const ctxS = { day: day, si: si, chuan: chuan, tp: tp, tjMap: tjMap, sui: sui, yue: yue, monthZhi: yue, dayZhi: day ? day[1] : '' };
      const LN_Z12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
      const mIdx = (LN_Z12.indexOf(yue) + 10) % 12;
      const mCat = (ssCat.month_cats || [])[mIdx];
      let sParts = '';
      if (mCat) {
        const mHits = lnGuJi.lnShenshaMonthHits(mCat, ctxS) || [];
        sParts += '<div style="margin:4px 0;"><b style="color:#8fbf8f;">' + escLn(mCat.month) + '神煞 · 本课机判命中 ' + mHits.length + ' 煞</b>' +
          (mHits.length ? '<div style="margin-top:2px;">' + mHits.map(x => '<span class="ln-verdict" style="display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;"><b>' + escLn(x.cond) + '</b></span>').join('') + '</div>' : '<span class="muted" style="margin-left:6px;">本课无「' + escLn(mCat.month) + '」神煞临课（未命中不假装）。</span>') + '</div>';
      }
      const suiHits = lnGuJi.lnSuiShaHits(ssCat.sui_table || {}, ctxS) || [];
      const zhiHits = lnGuJi.lnZhiShaHits(ssCat.zhi_table || {}, ctxS) || [];
      sParts += '<div style="margin:4px 0;"><b style="color:#8fbf8f;">岁神煞 · 太岁' + escLn(sui) + ' 机判 ' + suiHits.length + ' 煞</b>　' +
        (suiHits.length ? suiHits.map(x => '<span style="margin-right:8px;"><b>' + escLn(x.cond) + '</b> ' + escLn(x.duan) + '</span>').join('') : '<span class="muted">表内岁煞无入课者</span>') + '</div>';
      sParts += '<div style="margin:4px 0;"><b style="color:#8fbf8f;">支神煞 · 日支' + escLn(day ? day[1] : '') + ' 机判 ' + zhiHits.length + ' 煞</b>　' +
        (zhiHits.length ? zhiHits.map(x => '<span style="margin-right:8px;"><b>' + escLn(x.cond) + '</b> ' + escLn(x.duan) + '</span>').join('') : '<span class="muted">表内支煞无入课者</span>') + '</div>';
      ((ssCat.sui_huobu || []).concat(ssCat.zhi_huobu || [])).forEach(hu => {
        sParts += '<div style="margin:6px 0 2px;color:#e06c6c;font-weight:800;">活步骤 · ' + escLn(hu.title) + '（需人工推）</div>' +
          '<div style="color:#e08a8a;line-height:1.9;font-weight:700;font-size:12.5px;">' + hu.steps.map((st, k) => (k + 1) + '. ' + escLn(st)).join('<br>') + '</div>';
      });
      h += '<div class="ln-extra"><h3>六壬大全 · 神煞机判层（岁/支/月 · 能机判的机判，公式煞为活步骤红字）</h3>' + sParts + '</div>';
    }
    // ── 管辂神书：按课象自动命中（机器判定），预选第一命中章 ──
    const gl = D.liunren.guanlu || [];
    if (gl.length) {
      const glHits = lnGuanluHits(day, si, chuan, lei, tp, tjMap, sui, yue, birthY, sexV);
      h += '<div class="ln-extra"><h3>管辂神书 · 断语章' + (glHits.length ? '（自动命中 ' + glHits.length + ' 章，默认展开首章）' : '') + '</h3>';
      if (glHits.length) {
        h += '<div style="font-size:12px;color:var(--tx2);margin-bottom:6px;"><b style="color:var(--acc);">' + escLn(glHits[0].topic) + '</b>：' + escLn(glHits[0].reason) +
          (glHits.length > 1 ? '　<span style="color:var(--tx3);">另有 ' + (glHits.length - 1) + ' 章相关（下拉可选）</span>' : '') + '</div>';
      }
      h += '<select id="ln-guanlu" style="width:100%;">' +
        gl.map((g, i) => '<option value="' + i + '"' + (glHits.length && glHits[0].idx === i ? ' selected' : '') + '>' + escLn(g.topic) + (glHits.some(x => x.idx === i) ? '（命中）' : '') + '</option>').join('') +
        '</select><div id="ln-guanlu-out" class="src" style="font-size:12.5px;line-height:1.8;"></div></div>';
    }
    // ── 景祐六壬神定经：义理训诂原文备查（按节展开）──
    const sdjSecs = ((D.liunren && D.liunren.shendingjing) || {}).sections || [];
    if (sdjSecs.length) {
      h += '<div class="ln-extra"><h3>景祐六壬神定经 · 义理训诂（' + sdjSecs.length + ' 节，按节查看）</h3><select id="ln-sdj" style="width:100%;"><option value="">— 选择章节 —</option>' +
        sdjSecs.map((s, i) => '<option value="' + i + '">' + escLn(s.name) + '</option>').join('') +
        '</select><div id="ln-sdj-out" class="src" style="font-size:12.5px;line-height:1.8;"></div></div>';
    }
    $('ln-out').innerHTML = h;
    // 绑定选择器
    const selBz = document.getElementById('ln-bz');
    if (selBz) selBz.addEventListener('change', () => {
      const i = parseInt(selBz.value, 10);
      const out = document.getElementById('ln-bz-out');
      if (!out) return;
      if (isNaN(i) || i < 0) { out.innerHTML = ''; return; }
      const b = (D.liunren.bingzhan || [])[i];
      const cat = ((D.liunren && D.liunren.bingzhan_cat) || { cats: [] }).cats[i];
      let s = '';
      if (cat) {
        const ctxS = { day: day, si: si, chuan: chuan, tp: tp, tjMap: tjMap, sui: sui, yue: yue, monthZhi: yue, dayZhi: day ? day[1] : '' };
        const hits = lnGuJi.lnGuJiHits(cat, ctxS) || [];
        if (hits.length) {
          s += '<div style="color:#8fbf8f;font-weight:700;margin:4px 0;">本课机判命中 ' + hits.length + ' 条</div>' +
            hits.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(x.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(x.duan) + '</span></div>').join('');
        } else {
          s += '<div class="muted" style="margin:4px 0;">本课未命中此篇的机判条件——未命中不假装。</div>';
        }
        (cat.huobu || []).forEach(hu => {
          s += '<div style="margin:8px 0 2px;color:#e06c6c;font-weight:800;">活步骤 · ' + escLn(hu.title) + '（需人工对照课象逐步判断）</div>' +
            '<div style="color:#e08a8a;line-height:1.9;font-weight:700;">' + hu.steps.map((st, k) => (k + 1) + '. ' + escLn(st)).join('<br>') + '</div>';
        });
      }
      s += b ? '<div style="margin-top:6px;"><b>' + b.no + '. ' + escLn(b.name) + '</b><br>' + escLn(b.text) + '</div>' : '';
      out.innerHTML = s;
    });
    const bzMoreBtn = document.getElementById('ln-bz-more');
    if (bzMoreBtn) bzMoreBtn.addEventListener('click', () => {
      const box = document.getElementById('ln-bz-more-box');
      if (!box) return;
      const open = box.style.display !== 'none';
      box.style.display = open ? 'none' : 'block';
      bzMoreBtn.textContent = open ? '另有命中 ▸' : '收起 ▾';
    });
    const ssBtn = document.getElementById('ln-ss-raw-btn');
    if (ssBtn) ssBtn.addEventListener('click', () => {
      const raw = document.getElementById('ln-ss-raw');
      if (!raw) return;
      const show = raw.style.display === 'none';
      raw.style.display = show ? 'block' : 'none';
      ssBtn.textContent = show ? '收起神煞原文 ▾' : '展开神煞原文（岁/支/月） ▸';
    });
    const selSdj = document.getElementById('ln-sdj');
    if (selSdj) selSdj.addEventListener('change', () => {
      const i = parseInt(selSdj.value, 10);
      const out = document.getElementById('ln-sdj-out');
      if (!out) return;
      if (isNaN(i) || i < 0) { out.innerHTML = ''; return; }
      const s = (((D.liunren && D.liunren.shendingjing) || {}).sections || [])[i];
      const cat = ((D.liunren && D.liunren.shendingjing_cat) || { cats: [] }).cats[i];
      let sdj = '';
      if (cat) {
        const ctxS = { day: day, si: si, chuan: chuan, tp: tp, tjMap: tjMap, sui: sui, yue: yue, monthZhi: yue, dayZhi: day ? day[1] : '' };
        const h2 = lnGuJi.lnSdjHits(cat, ctxS) || [];
        if (h2.length) {
          sdj += '<div style="color:#8fbf8f;font-weight:700;margin:4px 0;">本课机判命中 ' + h2.length + ' 条</div>' +
            h2.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(x.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(x.duan) + '</span></div>').join('');
        }
        (cat.huobu || []).forEach(hu => {
          sdj += '<div style="margin:8px 0 2px;color:#e06c6c;font-weight:800;">活步骤 · ' + escLn(hu.title) + '（需人工对照课象逐步判断）</div>' +
            '<div style="color:#e08a8a;line-height:1.9;font-weight:700;">' + hu.steps.map((st, k) => (k + 1) + '. ' + escLn(st)).join('<br>') + '</div>';
        });
      }
      sdj += s ? '<div style="margin-top:6px;"><b>' + escLn(s.name) + '</b><br>' + (s.lines || []).map(escLn).join('<br>') + '</div>' : '';
      out.innerHTML = sdj;
    });
    const selGl = document.getElementById('ln-guanlu');
    if (selGl) {
      const showGl = (i) => {
        const out = document.getElementById('ln-guanlu-out');
        if (!out) return;
        if (i < 0) { out.innerHTML = ''; return; }
        const g = (D.liunren.guanlu || [])[i];
        if (!g) { out.innerHTML = ''; return; }
        const topic = g.topic;
        // 各章课象判定 → 结构化卡（与管辂自动命中同一套函数）
        let cards = [];
        switch (topic) {
          case '论破神': cards = lnPoHits(day, si, chuan, tp, tjMap, sui, yue); break;
          case '论空亡': cards = lnKongHits(day, si, chuan, tjMap); break;
          case '论刑': cards = lnXingHits(si, chuan); break;
          case '论六害': cards = lnHaiHits(si, chuan); break;
          case '论墓神': cards = lnMuHits(day, si, chuan); break;
          case '论丁神': cards = lnDingHits(day, si, chuan); break;
          case '论身命': cards = lnShenMingHits(day, si); break;
          case '论干支上下': cards = lnGZSHits(si); break;
          case '论干支家宅': cards = lnJZhaiHits(day, si, chuan); break;
          case '论行人': cards = lnXingRenHits(day, si, chuan); break;
          case '论太阳太岁月建': cards = lnSuiYueHits(si, chuan, sui, yue, tp); break;
          case '论破碎': cards = lnPoHits(day, si, chuan, tp, tjMap, sui, yue).filter(x => x.kind === '破碎'); break;
          case '论行年本命': cards = lnXingMingHits(day, si, chuan, birthY, sexV); break;
          default: cards = [];
        }
        let html = '<b>' + escLn(topic) + '</b>';
        if (topic === '论行年本命') {
          if (!birthY || isNaN(Number(birthY))) {
            html += '<div class="src" style="margin:6px 0;">请输入生年（上方控件已加：生年 + 性别），推行年/本命入课判定。</div>';
          } else if (cards.length) {
            html += '<div style="margin:6px 0 4px;font-size:12px;color:var(--tx3);">论行年本命 · 本课自动命中 ' + cards.length + ' 条（条件→断语）：</div>' +
              cards.slice(0, 5).map(c => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(c.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(c.duan) + '</span></div>').join('');
            if (cards.length > 5) {
              html += '<button class="act ln-mini" id="ln-gl-more">另有 ' + (cards.length - 5) + ' 条命中 ▸</button>' +
                '<div id="ln-gl-more-box" style="display:none;">' +
                cards.slice(5).map(c => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(c.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(c.duan) + '</span></div>').join('') + '</div>';
            }
          } else {
            html += '<div class="src" style="margin:6px 0;">生年 ' + escLn(birthY) + ' · 本命/行年支未临课，且未被课集刑冲破害（无命中条件）。章原文可展开查看。</div>';
          }
        } else if (cards.length) {
          html += '<div style="margin:6px 0 4px;font-size:12px;color:var(--tx3);">' + topic + ' · 本课自动命中 ' + cards.length + ' 条（条件→断语）：</div>' +
            cards.slice(0, 5).map(c => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(c.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(c.duan) + '</span></div>').join('');
          if (cards.length > 5) {
            html += '<button class="act ln-mini" id="ln-gl-more">另有 ' + (cards.length - 5) + ' 条命中 ▸</button>' +
              '<div id="ln-gl-more-box" style="display:none;">' +
              cards.slice(5).map(c => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(c.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(c.duan) + '</span></div>').join('') + '</div>';
          }
        } else {
          html += '<div class="src" style="margin:6px 0;">本课无「' + topic + '」命中条件（课集未见相关神煞/生克组合）。章原文可展开查看。</div>';
        }
        html += '<button class="act ln-mini" id="ln-gl-raw-btn" style="margin-top:4px;">章原文 ▸</button>' +
          '<div id="ln-gl-raw" style="display:none;margin-top:4px;">' + escLn(g.text) + '</div>';
        out.innerHTML = html;
        const moreBtn = document.getElementById('ln-gl-more');
        if (moreBtn) moreBtn.addEventListener('click', () => {
          const box = document.getElementById('ln-gl-more-box');
          if (!box) return;
          const open = box.style.display !== 'none';
          box.style.display = open ? 'none' : 'block';
          moreBtn.textContent = open ? ('另有 ' + (cards.length - 5) + ' 条命中 ▸') : '收起 ▾';
        });
        const rawBtn = document.getElementById('ln-gl-raw-btn');
        if (rawBtn) rawBtn.addEventListener('click', () => {
          const box = document.getElementById('ln-gl-raw');
          if (!box) return;
          const open = box.style.display !== 'none';
          box.style.display = open ? 'none' : 'block';
          rawBtn.textContent = (open ? '章原文 ▸' : '章原文 ▾');
        });
      };
      selGl.addEventListener('change', () => { const i = parseInt(selGl.value, 10); showGl(isNaN(i) ? -1 : i); });
      const presel = parseInt(selGl.value, 10);
      if (!isNaN(presel) && presel >= 0) showGl(presel);
    }
    const selCy = document.getElementById('ln-cuiyu');
    if (selCy) selCy.addEventListener('change', () => {
      const i = parseInt(selCy.value, 10);
      const out = document.getElementById('ln-cuiyu-out');
      if (!out) return;
      if (isNaN(i) || i < 0) { out.innerHTML = ''; return; }
      const c = (D.liunren.cuiyu || [])[i];
      out.innerHTML = c ? '<b>' + escLn(c.name) + '</b><br>' + escLn(c.body) : '';
    });
    // 翠雨歌相关条目 chip：点击展开正文
    document.querySelectorAll('.ln-cy-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const i = parseInt(chip.getAttribute('data-i'), 10);
        const c = cyHits[i];
        const out = document.getElementById('ln-cy-detail');
        if (c && out) out.innerHTML = '<b>' + escLn(c.name) + '</b><br>' + escLn(c.body);
      });
    });
    // 指南其余命中：折叠按钮
    const restBtn = document.getElementById('ln-rest-btn');
    if (restBtn) restBtn.addEventListener('click', () => {
      const box = document.getElementById('ln-rest-tj');
      if (!box) return;
      const open = box.style.display !== 'none';
      box.style.display = open ? 'none' : 'block';
      restBtn.textContent = '其余天将临位命中（' + restTj.length + '）' + (open ? '▸' : '▾');
    });
    // 破神章：其余命中折叠
    const poBtn = document.getElementById('ln-po-more');
    if (poBtn) poBtn.addEventListener('click', () => {
      const box = document.getElementById('ln-po-rest');
      if (!box) return;
      const open = box.style.display !== 'none';
      box.style.display = open ? 'none' : 'block';
      poBtn.textContent = (open ? '另有 ' + (poHits.length - 5) + ' 条命中 ▸' : '收起 ▾');
    });
    $('ln-si').innerHTML = '<div class="src">方法：月将加时布天盘 → 十干寄宫取干上神 → 四课三传九宗门判课体 → 干上神查御定直指 720 局。' +
      '三传递克为简化实现；御定断语以 720 局原文为准。毕法/课经/天将临位（指南）为关联参考。</div>';
  }
  liunrenInit = lnInit;
})();

// ========== Tab 20 金口诀（四位体系） ==========
(() => {
  const $ = (id) => document.getElementById(id);
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const SHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const GUI_ORDER = ['贵', '螣', '朱', '六', '勾', '青', '空', '白', '常', '玄', '阴', '后'];
  const DIFEN = [['子', '正北'], ['丑', '东北'], ['寅', '东北'], ['卯', '正东'], ['辰', '东南'], ['巳', '东南'],
    ['午', '正南'], ['未', '西南'], ['申', '西南'], ['酉', '正西'], ['戌', '西北'], ['亥', '西北']];
  const JIAZI = [];
  for (let i = 0; i < 60; i++) JIAZI.push(GAN[i % 10] + ZHI[i % 12]);
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const HE6 = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
  const ke = (a, b) => KE[a] === b;
  const sheng = (a, b) => SHENG[a] === b;
  const ganWx = (g) => ({ 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' }[g]);
  const zhiWx = (z) => ({ 寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金', 亥: '水', 子: '水', 辰: '土', 戌: '土', 丑: '土', 未: '土' }[z]);
  // 四象生克 16 关系 → 断语（gan_shen_jiang_fang 表，条件→断语机器命中）
  function jkShengKeHits(gwx, swx, jwx, fwx) {
    const gs = D.jinkoujue.duanyu.gan_shen_jiang_fang || {};
    const defs = [
      { key: '干克神', ok: ke(gwx, swx), cond: '人元' + gwx + '克贵神' + swx },
      { key: '干克将', ok: ke(gwx, jwx), cond: '人元' + gwx + '克月将' + jwx },
      { key: '干生神', ok: sheng(gwx, swx), cond: '人元' + gwx + '生贵神' + swx },
      { key: '干生将', ok: sheng(gwx, jwx), cond: '人元' + gwx + '生月将' + jwx },
      { key: '神生方', ok: sheng(swx, fwx), cond: '贵神' + swx + '生地分' + fwx },
      { key: '神克方', ok: ke(swx, fwx), cond: '贵神' + swx + '克地分' + fwx },
      { key: '神生将', ok: sheng(swx, jwx), cond: '贵神' + swx + '生月将' + jwx },
      { key: '神生干', ok: sheng(swx, gwx), cond: '贵神' + swx + '生人元' + gwx },
      { key: '将生干', ok: sheng(jwx, gwx), cond: '月将' + jwx + '生人元' + gwx },
      { key: '将克干', ok: ke(jwx, gwx), cond: '月将' + jwx + '克人元' + gwx },
      { key: '将生方', ok: sheng(jwx, fwx), cond: '月将' + jwx + '生地分' + fwx },
      { key: '将克方', ok: ke(jwx, fwx), cond: '月将' + jwx + '克地分' + fwx },
      { key: '方克神', ok: ke(fwx, swx), cond: '地分' + fwx + '克贵神' + swx },
      { key: '方克将', ok: ke(fwx, jwx), cond: '地分' + fwx + '克月将' + jwx },
      { key: '方生神', ok: sheng(fwx, swx), cond: '地分' + fwx + '生贵神' + swx },
      { key: '方生将', ok: sheng(fwx, jwx), cond: '地分' + fwx + '生月将' + jwx },
    ];
    const hits = [];
    defs.forEach(d => { const v = gs[d.key]; if (d.ok && v) hits.push({ cond: d.cond + '（' + d.key + '）', duan: v }); });
    return hits;
  }
  // 三动主事：方生干 / 干生方 / 干方比 / 干克神 / 干克将
  function jkSanDongHits(gwx, swx, jwx, fwx) {
    const hits = [];
    if (sheng(fwx, gwx)) hits.push({ cond: '地分' + fwx + '生人元' + gwx + '（方生干）', duan: '方生干为父母谋，任信为书职称得' });
    if (sheng(gwx, fwx)) hits.push({ cond: '人元' + gwx + '生地分' + fwx + '（干生方）', duan: '干生方为添人财' });
    if (gwx === fwx) hits.push({ cond: '人元与地分比和（干方同为' + gwx + '）', duan: '干方同为兄弟动，事在兄朋之间争' });
    if (ke(gwx, swx)) hits.push({ cond: '人元' + gwx + '克贵神' + swx + '（干克神）', duan: '干事克神不称意，防官降职损钱财，临门外人算自己，官讼他胜我要败' });
    if (ke(gwx, jwx)) hits.push({ cond: '人元' + gwx + '克月将' + jwx + '（干克将）', duan: '将阳为男将阴女，外人偷盗财损妻' });
    return hits;
  }
  // 四位分生：干生神 / 干生将 / 神生方 / 神生将 / 神生干
  function jkFenShengHits(gwx, swx, jwx, fwx) {
    const hits = [];
    if (sheng(gwx, swx)) hits.push({ cond: '人元' + gwx + '生贵神' + swx + '（干生神）', duan: '干生神为外助我，外来亲友生意火；送物求我府有人' });
    if (sheng(gwx, jwx)) hits.push({ cond: '人元' + gwx + '生月将' + jwx + '（干生将）', duan: '干生将为内外顺' });
    if (sheng(swx, fwx)) hits.push({ cond: '贵神' + swx + '生地分' + fwx + '（神生方）', duan: '神生方谋有官助，事成晚，隔手求财可成' });
    if (sheng(swx, jwx)) hits.push({ cond: '贵神' + swx + '生月将' + jwx + '（神生将）', duan: '神生将为内外合，人将财物要送我' });
    if (sheng(swx, gwx)) hits.push({ cond: '贵神' + swx + '生人元' + gwx + '（神生干）', duan: '神生干求人必见，家有官府工作人，自将送财求他人，出外找人寻必见' });
    return hits;
  }
  // 将类 + 方类：月将/地分与各方生克
  function jkJiangFangHits(gwx, swx, jwx, fwx) {
    const hits = [];
    if (sheng(jwx, gwx)) hits.push({ cond: '月将' + jwx + '生人元' + gwx + '（将生干）', duan: '将若生干物送人，夫妻合睦父子亲' });
    if (ke(jwx, gwx)) hits.push({ cond: '月将' + jwx + '克人元' + gwx + '（将克干）', duan: '将去克干喜事重，人财两旺内外顺，科举上榜宜远行' });
    if (sheng(jwx, fwx)) hits.push({ cond: '月将' + jwx + '生地分' + fwx + '（将生方）', duan: '将若生方财喜多，田宅丰厚官禄人' });
    if (ke(jwx, fwx)) hits.push({ cond: '月将' + jwx + '克地分' + fwx + '（将克方）', duan: '将克方为子女忧，难养六畜失田宅，损伤腿脚家破产' });
    if (ke(fwx, swx)) hits.push({ cond: '地分' + fwx + '克贵神' + swx + '（方克神）', duan: '方克神必损外财，子孙忤逆亦且顽' });
    if (ke(fwx, jwx)) hits.push({ cond: '地分' + fwx + '克月将' + jwx + '（方克将）', duan: '方克将来妻财伤，出外先失后得财' });
    if (sheng(fwx, swx)) hits.push({ cond: '地分' + fwx + '生贵神' + swx + '（方生神）', duan: '方生神人庆财丰，办事求谋事事通' });
    if (sheng(fwx, jwx)) hits.push({ cond: '地分' + fwx + '生月将' + jwx + '（方生将）', duan: '方生将婚成前美' });
    if (sheng(fwx, gwx)) hits.push({ cond: '地分' + fwx + '生人元' + gwx + '（方生干）', duan: '方生干来孝子孙' });
    return hits;
  }
  // 五比同类：比和 / 六合 / 生克（贵神加于地分，神方同位，将-神=将-方六合）
  function jkBiHeHits(gwx, swx, jwx, fwx, difenZhi, yjZhi) {
    const hits = [];
    if (gwx === fwx) hits.push({ cond: '人元' + gwx + '与地分' + fwx + '比和（干方正比）', duan: '事朋友，比肩多有事不成，亲朋争斗有小凶' });
    if (gwx === swx) hits.push({ cond: '人元' + gwx + '与贵神' + swx + '比和（干神近比）', duan: '外谋己，骗己钱财要当心' });
    if (fwx === jwx) hits.push({ cond: '地分' + fwx + '与月将' + jwx + '比和（方将远比）', duan: '在朋友，出外办事受排挤' });
    if (swx === jwx) hits.push({ cond: '贵神' + swx + '与月将' + jwx + '比和（神将次比）', duan: '在门户，亲朋斗讼口舌灾' });
    if (gwx === swx && swx === jwx && jwx === fwx) hits.push({ cond: '四位俱比（' + gwx + '）', duan: '四位俱比门户静' });
    if (sheng(jwx, swx)) hits.push({ cond: '月将' + jwx + '生贵神' + swx + '（将生神）', duan: '将生神干内喜' });
    if (sheng(gwx, swx)) hits.push({ cond: '人元' + gwx + '生贵神' + swx + '（干生神）', duan: '干生神干喜外来' });
    if (ke(swx, jwx)) hits.push({ cond: '贵神' + swx + '克月将' + jwx + '（神克将）', duan: '神千克将干贼同' });
    if (ke(jwx, swx)) hits.push({ cond: '月将' + jwx + '克贵神' + swx + '（将克神）', duan: '将干克神干财同' });
    if (HE6[yjZhi] === difenZhi) hits.push({ cond: '月将' + yjZhi + '与地分' + difenZhi + '六合（将神正合/将方进合）', duan: '将神正合美姻缘，将方进合事成缓' });
    return hits;
  }
  // 五动主事：按已判五动命中对应组
  function jkDongMainHits(dongs) {
    const F = D.jinkoujue.duanyu.fenlei || [];
    const rec = F.find(f => f.cat === '五动主事');
    if (!rec) return [];
    const groups = { '妻动': 1, '官动': 5, '贼动': 11, '财动': 15, '鬼动': 21 };
    const hits = [];
    dongs.forEach(dn => {
      const g0 = Object.keys(groups).find(k => dn.indexOf(k) >= 0);
      if (!g0) return;
      const st = groups[g0];
      hits.push({ cond: g0 + '（' + dn + '）', duan: rec.lines.slice(st, st + 4).join('') });
    });
    return hits;
  }
  const CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
  const MENG = { 寅: 1, 巳: 1, 申: 1, 亥: 1 }, ZHONG = { 子: 1, 午: 1, 卯: 1, 酉: 1 }, JI = { 辰: 1, 戌: 1, 丑: 1, 未: 1 };
  // 占事分类断语：课象条件→断语机器命中（lei 下拉：求财/婚姻/官司/疾病/出行/失物/灾祸/射覆/风水）
  function jkLeiHits(lei, ctx) {
    const { renyuan, gwx, swx, jwx, fwx, gsName, difen, yj, day, dongs } = ctx;
    const lr = D.liunren && D.liunren.core && D.liunren.core.shensha;
    const xk = (lr && lr.xunkong && lr.xunkong[day]) || '';
    const isKong = z => xk.indexOf(z) >= 0;
    const chong = (a, b) => CHONG[a] === b;
    const ym = (lr && lr.yima) || {};
    const yimaAt = z => Object.keys(ym).filter(k => k.indexOf(z) >= 0).some(k => ym[k] === z);
    const wxArr = [gwx, swx, jwx, fwx];
    const cnt = w => wxArr.filter(x => x === w).length;
    const hasDong = (...ns) => dongs.some(d => ns.some(n => d.indexOf(n) >= 0));
    const hasDongAny = () => dongs.length > 0;
    const R = [];
    const add = (ok, cond, idx) => { if (ok) R.push({ cond: cond, duan: (D.jinkoujue.duanyu.fenlei.find(f => f.cat === lei) || {}).lines[idx] || '', idx: idx }); };
    if (lei === '求财') {
      add(isKong(yj), '月将' + yj + '落旬空（' + xk + '）——财坐空', 0);
      add(hasDong('财动'), '财动（月将克贵神）：动则得', 1);
      add(ke(swx, gwx), '贵神' + swx + '克人元' + gwx + '（索债主客）：外空谋', 9);
      add(ke(jwx, swx), '月将' + jwx + '克贵神' + swx + '：将若克神，外财求', 10);
      add(ke(gwx, jwx) && ke(swx, jwx) && ke(fwx, jwx), '人元/贵神/地分俱克月将：干神方同克，损财三次', 12);
      add(sheng(gwx, jwx) && sheng(swx, jwx) && sheng(fwx, jwx), '人元/贵神/地分俱生月将：干神方同生，三次进财', 13);
      add(sheng(gwx, jwx) || sheng(fwx, jwx), '人元/地分生月将：外财多、房地收', 14);
      add(sheng(gwx, swx) && ke(gwx, jwx), '人元生贵神兼克月将：两次破财众贼偷', 15);
    } else if (lei === '婚姻') {
      const ji = ['六合', '青龙', '太常', '天后'];
      add(ji.indexOf(gsName) >= 0, '贵神' + gsName + '（六常天后青吉将）：婚易成', 0);
      add(['太阴', '玄武'].indexOf(gsName) >= 0, '贵神' + gsName + '（阴武）：婚外桃花恋', 1);
      add(sheng(swx, jwx) || ke(swx, jwx), '神将' + swx + '与' + jwx + '相生/相克：合好克坏', 2);
      add(sheng(swx, jwx) || chong(difen, yj), '神将相生 / 月将' + yj + '与地分' + difen + '相冲：感情好 / 分道', 3);
      add(sheng(gwx, fwx) || gwx === fwx, '人元' + gwx + '与地分' + fwx + '生/比（干夫方妻）：生合美', 4);
      add(ke(gwx, fwx) || sheng(fwx, gwx), '人元克地分 / 地分生人元：妻子多病', 5);
      add(ke(fwx, gwx) || sheng(gwx, fwx), '地分克人元 / 人元生地分：丈夫先死急病', 6);
      add(isKong(difen) || isKong(yj), '课支逢旬空（' + xk + '）：婚虚假、离合难定', 7);
      add(!isKong(yj) && isKong(difen), '月将不空而地分' + difen + '空（别爻空）：他心假、犹豫不决', 8);
      add(hasDong('妻动', '鬼动', '贼动', '财动'), '五动妻/鬼/贼/财动：难以到头两伤情', 9);
      if (cnt('木') >= 2 || cnt('金') >= 2) add(true, '四象二木/二金（' + wxArr.join('') + '）：多不顾', 10);
      else if (cnt('土') >= 2) add(true, '四象二土（' + wxArr.join('') + '）：婚晚成', 10);
      add(chong(difen, yj), '月将' + yj + '与地分' + difen + '相冲：课中相冲半路走', 14);
      add(hasDong('财动'), '财动：问婚妻贤美好女持家', 15);
      add(hasDong('妻动'), '妻动：不合婚难成', 16);
    } else if (lei === '官司') {
      add(ke(gwx, swx), '人元' + gwx + '克贵神' + swx + '：干克贵神你遭殃', 2);
      add(ke(swx, gwx), '贵神' + swx + '克人元' + gwx + '：贵神克干败理', 3);
      add(sheng(gwx, swx) || sheng(swx, gwx), '人元贵神相生：私了和解好商量', 4);
      add(['勾陈', '朱雀', '天空', '白虎', '玄武'].indexOf(gsName) >= 0, '贵神' + gsName + '（勾朱天空白玄武凶将）：讼事当', 5);
      add(hasDong('官动', '贼动'), '官动/贼动：必人口舌官司', 6);
      add(sheng(gwx, swx), '人元生贵神（干生神）：为他求解', 9);
      add(sheng(swx, gwx), '贵神生人元（神生干）：定你主张', 9);
      add(isKong(difen), '地分' + difen + '落旬空（' + xk + '）：钱财耗', 10);
      add(hasDong('妻动'), '妻动：必因女人缘', 13);
      add(gsName === '玄武', '贵神玄武：有冤情', 15);
    } else if (lei === '疾病') {
      add(ke(gwx, fwx), '人元' + gwx + '克地分' + fwx + '：干若克方难治病', 0);
      add(ke(fwx, gwx), '地分' + fwx + '克人元' + gwx + '：方若克干病好治', 1);
      add(sheng(fwx, gwx) || sheng(gwx, fwx) || ke(fwx, gwx), '方生干/干生方/方克干：病重亦可得新生（方生干则越治重）', 3);
      add((difen === '巳' && yj === '亥') || (difen === '亥' && yj === '巳'), '地分' + difen + '与月将' + yj + '巳亥相冲：昏晕症', 4);
      add(renyuan === '癸' && (difen === '巳' || yj === '巳'), '人元癸见巳（地分/月将）：血压低', 5);
      add(renyuan === '丁' && (difen === '亥' || yj === '亥'), '人元丁见亥（地分/月将）：血压高', 5);
      const zangfu = { 甲: '肝', 乙: '胆', 丙: '心', 戊: '胃', 己: '脾', 庚: '大肠', 辛: '肺', 壬: '肾', 癸: '肾' };
      add(!!zangfu[renyuan] && ['甲', '乙', '丙', '戊', '己', '庚'].indexOf(renyuan) >= 0, '人元' + renyuan + '：主' + zangfu[renyuan] + '（甲肝乙胆丙心脏，戊胃己脾大肠庚）', 7);
      add(!!zangfu[renyuan] && ['辛', '壬', '癸'].indexOf(renyuan) >= 0, '人元' + renyuan + '：主' + zangfu[renyuan] + '（辛肺壬癸水主肾）', 8);
      add(hasDong('鬼动', '官动'), '鬼动/官动：病头目', 13);
      add(hasDong('贼动'), '贼动：病肚腹', 13);
      add(hasDong('财动'), '财动：病胸', 13);
      add(!!MENG[yj], '月将' + yj + '临四孟（寅巳申亥）：流行病', 14);
      add(!!JI[yj], '月将' + yj + '临辰戌丑未：酒食病', 14);
      add(!!ZHONG[yj], '月将' + yj + '临子午卯酉：急暴病', 15);
    } else if (lei === '出行') {
      add(ke(fwx, gwx), '地分' + fwx + '克人元' + gwx + '（内克外）：必走', 4);
      add(ke(gwx, fwx), '人元' + gwx + '克地分' + fwx + '（外克内）：行必阻、在外不安', 5);
      add(sheng(gwx, fwx), '人元' + gwx + '生地分' + fwx + '（外来生内）：约自己', 6);
      add(!!MENG[yj], '月将' + yj + '临四孟：人未动', 13);
      add(!!JI[yj], '月将' + yj + '临四季：马上到', 14);
      add(chong(difen, yj), '月将' + yj + '与地分' + difen + '相冲：逢冲改计线', 17);
      add(HE6[yj] === difen, '月将' + yj + '与地分' + difen + '六合：逢合帮伴行', 17);
    } else if (lei === '失物') {
      add(isKong(yj), '月将' + yj + '落旬空（' + xk + '）：物不失', 0);
      add(sheng(swx, jwx), '贵神' + swx + '生月将' + jwx + '（神将相生）：在亲属', 2);
      add(yimaAt(difen) || yimaAt(yj), '地分/月将临驿马：路途间', 3);
      add(ke(fwx, gwx), '地分' + fwx + '克人元' + gwx + '（下克上）：不远寻', 4);
      add((difen === '辰' && yj === '丑') || (difen === '丑' && yj === '辰') || (difen === yj && (difen === '辰' || difen === '丑')), '辰丑相破：物改装', 4);
      add(hasDong('贼动'), '贼动：有贼人盗', 11);
    } else if (lei === '灾祸') {
      add(hasDong('官动'), '官动：囚死官动不可当', 0);
      add(ke(gwx, jwx), '人元' + gwx + '克月将' + jwx + '：外财损、子妻病伤', 1);
      add(ke(gwx, swx), '人元' + gwx + '克贵神' + swx + '：外索借', 2);
      add(chong(difen, yj), '月将' + yj + '与地分' + difen + '相冲：刑冲克害官司有', 4);
      add(gsName === '玄武' || hasDong('贼动'), '贵神玄武/贼动：盗失损财伤', 5);
      add(difen === '辰' || difen === '戌' || yj === '辰' || yj === '戌', '辰戌入课：罗网、口舌官司', 6);
    } else if (lei === '射覆') {
      add(ke(swx, gwx) || ke(jwx, gwx) || ke(fwx, gwx), '人元受克（神/将/方克干）：上孔损', 1);
      add(ke(swx, jwx) || ke(jwx, swx), '神将相冲克：破中间', 1);
      add(ke(gwx, fwx) || ke(swx, fwx) || ke(jwx, fwx), '地分受克（干/神/将克方）：底伤破', 2);
      add(jwx === '金' || jwx === '木', '月将' + jwx + '（金/木）：磁玻璃/皮革木器类', 4);
      add(jwx === '火' || jwx === '水', '月将' + jwx + '（火/水）：文化家电/细碎纸杂物', 5);
      add(jwx === '土', '月将' + jwx + '（土）：人口塑料含', 6);
      add(ke(jwx, swx), '月将' + jwx + '克贵神' + swx + '（将克神）：伤变位', 7);
      add(ke(gwx, fwx), '人元' + gwx + '克地分' + fwx + '（干克方）：反不全', 7);
      add(ke(fwx, gwx), '地分' + fwx + '克人元' + gwx + '（方克干）：物上移', 8);
    } else if (lei === '风水') {
      add(cnt('木') >= 2, '四象二木（' + wxArr.join('') + '）：四周林树、兄弟失和讼', 4);
      add(cnt('火') >= 2, '四象二火：因火招灾、出暴燥人', 6);
      add(cnt('金') >= 2, '四象二金：家有争斗、公检法官', 7);
      add(cnt('水') >= 2, '四象二水：近河出盗鬼', 8);
      add(cnt('火') >= 2, '四象二火：门南水向北', 9);
      add(cnt('金') >= 2, '四象二金：金旺西向无别处', 10);
    }
    return R;
  }
  function todayGanzhi() {
    const base = new Date(2026, 9, 22);
    const days = Math.floor((Date.now() - base.getTime()) / 86400000);
    return JIAZI[((days % 60) + 60) % 60];
  }
  function escLn(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // 金口诀四位盘 SVG：人元上 / 贵神下 / 月将左 / 地分右 + 中央四象
  function jkPanSVG(renyuan, guishen, gsName, yj, jName, difen, day, hour, gwx, swx, jwx, fwx) {
    const W = 520, H = 520, CX = W / 2, CY = H / 2;
    const PAD = 8;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:540px;background:#12151f;border:1px solid var(--line);border-radius:10px;">';
    const cell = (x, y, w, h) => {
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#1a1f2e" stroke="var(--line)"/>';
    };
    const txt = (x, y, t, fill, fs, bold) => {
      s += '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="' + fill + '" font-size="' + fs + '" font-weight="' + (bold ? '700' : '400') + '">' + t + '</text>';
    };
    const topH = (H - 2 * PAD) * 0.30, sideW = (W - 2 * PAD) * 0.30, midH = (H - 2 * PAD) * 0.40, midW = (W - 2 * PAD) * 0.40;
    cell(PAD, PAD, W - 2 * PAD, topH);
    cell(PAD, H - PAD - topH, W - 2 * PAD, topH);
    cell(PAD, PAD + topH, sideW, midH);
    cell(W - PAD - sideW, PAD + topH, sideW, midH);
    cell(PAD + sideW, PAD + topH, midW, midH);
    // 人元（上）
    txt(CX, PAD + topH / 2 - 10, renyuan, '#8fb7ff', 30, true);
    txt(CX, PAD + topH / 2 + 16, '人元 · 客', 'var(--tx2)', 13);
    // 贵神（下）
    txt(CX, H - PAD - topH / 2 - 10, guishen + ' ' + gsName, '#d98cff', 20, true);
    txt(CX, H - PAD - topH / 2 + 16, '贵神 · 主', 'var(--tx2)', 13);
    // 月将（左）
    txt(PAD + sideW / 2, CY - 10, yj + ' ' + jName, '#7ee0a3', 18, true);
    txt(PAD + sideW / 2, CY + 14, '月将 · 己身', 'var(--tx2)', 13);
    // 地分（右）
    txt(W - PAD - sideW / 2, CY - 10, difen, '#f0c860', 28, true);
    txt(W - PAD - sideW / 2, CY + 14, '地分 · 田宅', 'var(--tx2)', 13);
    // 中央四象
    txt(CX, CY - 20, day + ' ' + hour + '时', 'var(--tx1)', 15, true);
    txt(CX, CY + 2, '干' + gwx + ' 神' + swx + ' 将' + jwx + ' 方' + fwx, 'var(--tx2)', 14);
    txt(CX, CY + 24, '四象五行', 'var(--tx3)', 12);
    s += '</svg>';
    return s;
  }
  function wuzi(dayGan, targetZhi) {
    const CORE = D.jinkoujue.core;
    const ziIdx = GAN.indexOf(CORE.wuzi[dayGan]);
    return GAN[(ziIdx + ZHI.indexOf(targetZhi)) % 10];
  }
  function jkInit() {
    if (!D || !D.jinkoujue) { $('jk-title').textContent = '数据加载失败'; return; }
    const CORE = D.jinkoujue.core;
    const selDf = $('jk-difen');
    selDf.innerHTML = DIFEN.map(d => '<option value="' + d[0] + '">' + d[0] + '（' + d[1] + '）</option>').join('');
    const selDay = $('jk-day');
    selDay.innerHTML = JIAZI.map(g => '<option value="' + g + '">' + g + '</option>').join('');
    selDay.value = todayGanzhi();
    const selHour = $('jk-hour');
    selHour.innerHTML = SHI.map((z, i) => {
      const h = (i * 2 + 1) % 24;
      return '<option value="' + z + '">' + z + '时（' + (h < 10 ? '0' + h : h) + ':00）</option>';
    }).join('');
    const now = new Date();
    selHour.value = SHI[Math.floor((now.getHours() + 1) / 2) % 12];
    const selYj = $('jk-yuejiang');
    const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
    selYj.innerHTML = monthNames.map(m => {
      const jq = CORE.jietiao[m];
      return '<option value="' + CORE.yuejiang[jq] + '">' + m + '（' + jq + '后 ' + CORE.yuejiang[jq] + '将）</option>';
    }).join('');
    const selLei = $('jk-lei');
    selLei.innerHTML = ['求财', '婚姻', '官司', '疾病', '出行', '失物', '灾祸', '射覆'].map(l => '<option>' + l + '</option>').join('');
    $('jk-today').addEventListener('click', () => { selDay.value = todayGanzhi(); });
    $('jk-go').addEventListener('click', jkGo);
    $('jk-title').textContent = '金口诀 · 四位起课（地分/月将/贵神/人元）';
    $('jk-out').innerHTML = '<div class="muted">已载入六十甲子钤 60 条、分类断语 ' + (D.jinkoujue.duanyu.fenlei || []).length + ' 类、干神将方断语。选择地分（问课方位）/ 日 / 时辰 / 月将与事类后点「起课」：布四位（人元·贵神·月将·地分）→ 四象五行 → 五动/三动/四象生克/将方/五比同类自动命中 → 六十甲子钤直查 + 占事口诀折叠。</div>';
    $('jk-si').innerHTML = '<div class="src">方法：地分=问课方位 → 月将加时布天盘 → 日干贵人诀（旦/暮）起贵神，阳顺阴逆临地分 → 五子元遁起人元。五动按四象生克自动判定；六十甲子钤与分类断语为查表输出。贵神布法为简化（阳顺阴逆），复杂课式以原文为准。</div>';
    const g0 = CORE.guiqi[selDay.value[0]];
    const n0 = (ZHI.indexOf(selHour.value) >= 3 && ZHI.indexOf(selHour.value) <= 8) ? g0[0] : g0[1];
    const y0 = '乙丁己辛癸'.indexOf(selDay.value[0]) >= 0;
    let gsn0 = '';
    for (let i = 0; i < 12; i++) { const z = ZHI[((ZHI.indexOf(n0) + (y0 ? -1 : 1) * i) % 12 + 12) % 12]; if (z === selDf.value) { gsn0 = GUI_ORDER[i]; break; } }
    if (!gsn0) gsn0 = GUI_ORDER[0];
    const rn0 = wuzi(selDay.value[0], selDf.value);
    $('jk-pan').innerHTML = jkPanSVG(rn0, gsn0, CORE.guishen[gsn0].name, selYj.value, CORE.jiang[selYj.value].name, selDf.value,
      selDay.value, selHour.value, ganWx(rn0), CORE.guishen[gsn0].wx, CORE.jiang[selYj.value].wx, zhiWx(selDf.value));
  }
  function jkGo() {
    const CORE = D.jinkoujue.core;
    const DU = D.jinkoujue.duanyu;
    const difen = $('jk-difen').value, day = $('jk-day').value, hour = $('jk-hour').value,
      yj = $('jk-yuejiang').value, lei = $('jk-lei').value;
    const hIdx = ZHI.indexOf(hour);
    const dayNight = (hIdx >= 3 && hIdx <= 8) ? 'day' : 'night';
    const gui = CORE.guiqi[day[0]];
    const gzhi = dayNight === 'day' ? gui[0] : gui[1];
    const yin = '乙丁己辛癸'.indexOf(day[0]) >= 0;
    const step = yin ? -1 : 1;
    let guishen = '';
    for (let i = 0; i < 12; i++) {
      const z = ZHI[((ZHI.indexOf(gzhi) + step * i) % 12 + 12) % 12];
      if (z === difen) { guishen = GUI_ORDER[i]; break; }
    }
    if (!guishen) guishen = GUI_ORDER[0];
    const renyuan = wuzi(day[0], difen);
    const gsName = CORE.guishen[guishen].name;
    const gwx = ganWx(renyuan), swx = CORE.guishen[guishen].wx, jwx = CORE.jiang[yj].wx, fwx = zhiWx(difen);
    $('jk-pan').innerHTML = jkPanSVG(renyuan, guishen, gsName, yj, CORE.jiang[yj].name, difen, day, hour, gwx, swx, jwx, fwx);
    const dongs = [];
    if (ke(gwx, fwx)) dongs.push('妻动（干克方）：占妻妾、防财损折、寻人在家、访人不悦');
    if (ke(swx, gwx)) dongs.push('官动（神克干）：利求官、逢驿马迁官转职、常人公府事');
    if (ke(swx, jwx)) dongs.push('贼动（神克将）：内贼生、勾连诈不明、损财卑幼病');
    if (ke(jwx, swx)) dongs.push('财动（将克神）：利求财、求官不谐、营求喜自来');
    if (ke(fwx, gwx)) dongs.push('鬼动（方克干）：忧灾怪、官亨人出外、争讼带他人');
    const jin = DU.jiazijin || [];
    const rec = jin.find(r => r.gan === renyuan && r.gui === guishen && r.zhi === difen);
    const fenlei = DU.fenlei || [];
    const catRec = fenlei.find(f => f.cat === lei);
    const leiTxt = catRec ? catRec.lines.join('<br>') : '';
    const rel = [];
    const relKey = (a, b, label) => { if (a === b) return; if (ke(a, b)) rel.push(label + '：' + a + '克' + b); };
    relKey(gwx, swx, '人元-贵神'); relKey(gwx, jwx, '人元-月将'); relKey(gwx, fwx, '人元-地分');
    relKey(swx, gwx, '贵神-人元'); relKey(swx, jwx, '贵神-月将'); relKey(swx, fwx, '贵神-地分');
    relKey(jwx, swx, '月将-贵神'); relKey(jwx, gwx, '月将-人元'); relKey(jwx, fwx, '月将-地分');
    relKey(fwx, gwx, '地分-人元'); relKey(fwx, swx, '地分-贵神'); relKey(fwx, jwx, '地分-月将');
    // 结构化命中：四象生克 16 关系 + 三动/四位分生/将方/五比/五动主事
    const skHits = jkShengKeHits(gwx, swx, jwx, fwx);
    const sanHits = jkSanDongHits(gwx, swx, jwx, fwx);
    const fenHits = jkFenShengHits(gwx, swx, jwx, fwx);
    const jfHits = jkJiangFangHits(gwx, swx, jwx, fwx);
    const biHits = jkBiHeHits(gwx, swx, jwx, fwx, difen, yj);
    const dongHits = jkDongMainHits(dongs);
    const card = (c) => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(c.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(c.duan) + '</span></div>';
    let h = '';
    h += '<h3>起课信息</h3><div class="src">日 ' + day + ' · ' + hour + '时（' + (dayNight === 'day' ? '昼' : '夜') + '） · ' + yj + '将 · 事类「' + lei + '」</div>';
    h += '<div class="jk-4w">' +
      '<div class="jk-w"><b>' + escLn(renyuan) + '</b>人元 · 客</div>' +
      '<div class="jk-w"><b>' + escLn(guishen) + ' ' + escLn(gsName) + '</b>贵神 · 主</div>' +
      '<div class="jk-w"><b>' + escLn(yj) + ' ' + escLn(CORE.jiang[yj].name) + '</b>月将 · 己身</div>' +
      '<div class="jk-w"><b>' + escLn(difen) + '</b>地分 · 田宅</div>' +
      '</div>';
    h += '<div style="font-size:13px;color:var(--tx2);">四象五行：人元' + gwx + ' · 贵神' + swx + ' · 月将' + jwx + ' · 地分' + fwx +
      '　贵神起例：' + day[0] + '日' + (dayNight === 'day' ? '昼' : '夜') + '贵 ' + gzhi + '支</div>';
    if (dongs.length) h += '<h3>五动判定</h3>' + dongs.map(d => '<div>' + escLn(d) + '</div>').join('');
    if (rec) {
      h += '<h3>六十甲子钤 · ' + renyuan + '、' + guishen + '、' + difen + '</h3><div class="src">依据：人元干+贵神+地分查 60 条</div>';
      h += '<div>' + escLn(rec.duan) + '</div>';
    } else {
      h += '<h3>六十甲子钤</h3><div style="color:var(--tx2);">本课式（' + renyuan + '、' + guishen + '、' + difen + '）不在《六十甲子钤》60 组固定条目内，参照下方四象生克与分类断语。</div>';
    }
    // ── 结构化命中区（条件→断语，机器判定）──
    const structSections = [
      { title: '四象生克 · 自动命中 ' + skHits.length + ' 条（干神将方 16 关系）', arr: skHits },
      { title: '五动主事 · 自动命中 ' + dongHits.length + ' 组', arr: dongHits },
      { title: '三动主事 · 自动命中 ' + sanHits.length + ' 条', arr: sanHits },
      { title: '四位分生 · 自动命中 ' + fenHits.length + ' 条', arr: fenHits },
      { title: '将类·方类 · 自动命中 ' + jfHits.length + ' 条', arr: jfHits },
      { title: '五比同类 · 自动命中 ' + biHits.length + ' 条', arr: biHits },
    ];
    const structTotal = structSections.reduce((s, x) => s + x.arr.length, 0);
    if (structTotal) {
      h += '<div class="ln-extra"><h3>金口诀课象断语（自动命中 ' + structTotal + ' 条，条件→断语）</h3>';
      structSections.forEach(sec => {
        if (!sec.arr.length) return;
        h += '<div style="margin:8px 0 3px;font-size:12px;color:var(--tx3);">' + sec.title + '</div>' +
          sec.arr.slice(0, 5).map(card).join('');
        if (sec.arr.length > 5) {
          h += '<button class="act ln-mini jk-sec-more" data-sec="' + escLn(sec.title) + '">另有 ' + (sec.arr.length - 5) + ' 条命中 ▸</button>' +
            '<div class="jk-sec-more-box" style="display:none;">' + sec.arr.slice(5).map(card).join('') + '</div>';
        }
      });
      h += '</div>';
    }
    // ── 分类断语（占事口诀）：课象条件→断语自动命中，未命中原文折叠 ──
    if (catRec) {
      const leiHits = jkLeiHits(lei, { renyuan: renyuan, gwx: gwx, swx: swx, jwx: jwx, fwx: fwx, gsName: gsName, difen: difen, yj: yj, day: day, dongs: dongs });
      const hitIdx = {}; leiHits.forEach(x => { hitIdx[x.idx] = 1; });
      const rest = catRec.lines.map((l, i) => ({ i: i, l: l })).filter(x => !hitIdx[x.i]);
      h += '<div class="ln-extra"><h3>分类断语 · ' + lei + '（自动命中 ' + leiHits.length + ' 条，条件→断语）</h3>';
      if (leiHits.length) {
        h += leiHits.slice(0, 5).map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(x.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(x.duan) + '</span></div>').join('');
        if (leiHits.length > 5) {
          h += '<button class="act ln-mini jk-sec-more">另有 ' + (leiHits.length - 5) + ' 条命中 ▸</button><div class="jk-sec-more-box" style="display:none;">' +
            leiHits.slice(5).map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + escLn(x.cond) + '</b><br><span style="color:var(--tx2);">' + escLn(x.duan) + '</span></div>').join('') + '</div>';
        }
      }
      if (rest.length) {
        h += '<button class="act ln-mini" id="jk-lei-btn">未命中口诀原文（' + rest.length + ' 条，含需神煞数据条目）▸</button><div id="jk-lei-box" style="display:none;">' +
          rest.map(x => x.l).join('<br>') + '</div>';
      } else {
        h += '<div style="font-size:12px;color:var(--tx3);">本课课象已覆盖该事类全部口诀。</div>';
      }
      h += '</div>';
    }
    if (rel.length) {
      h += '<h3>四象生克</h3>' + rel.map(r => '<div>' + escLn(r) + '</div>').join('') +
        '<div class="src">按「干神将方」关系取断（金口诀干神将方类断语）</div>';
    }
    h += '<h3>四象所主</h3><div class="src">' +
      '人元：客、天、君、祖、外　贵神：主、宰相、臣、父、官禄　月将：己身、妻、财、亲戚、内　地分：田宅、子孙、奴仆、鞍马、六畜</div>';
    $('jk-out').innerHTML = h;
    // 分类断语未命中原文折叠绑定
    const leiBtn = document.getElementById('jk-lei-btn');
    if (leiBtn) leiBtn.addEventListener('click', () => {
      const box = document.getElementById('jk-lei-box');
      if (!box) return;
      const open = box.style.display !== 'none';
      box.style.display = open ? 'none' : 'block';
      leiBtn.textContent = open ? leiBtn.textContent.replace('▾', '▸') : leiBtn.textContent.replace('▸', '▾');
    });
    // 结构化小节更多折叠绑定
    document.querySelectorAll('.jk-sec-more').forEach(btn => {
      btn.addEventListener('click', () => {
        const box = btn.nextElementSibling;
        if (!box) return;
        const open = box.style.display !== 'none';
        box.style.display = open ? 'none' : 'block';
        btn.textContent = open ? btn.textContent.replace('▾', '▸') : btn.textContent.replace('▸', '▾');
      });
    });
    $('jk-si').innerHTML = '<div class="src">方法：地分=问课方位 → 月将加时布天盘 → 日干贵人诀（旦/暮）起贵神，阳顺阴逆临地分 → 五子元遁起人元。' +
      '五动/三动/四象生克/将方/五比同类按课象自动判定（条件→断语）；占事分类断语（求财/婚姻/官司/疾病/出行/失物/灾祸/射覆/风水）同样课象条件→断语自动命中，未命中口诀（含需神煞数据条目）折叠原文。贵神布法为简化（阳顺阴逆），复杂课式以原文为准。</div>';
  }
  jinkoujueInit = jkInit;
})();

// ========== Tab 21 六爻-纳甲（自己制表：八宫纳甲算法 + 断语库查表） ==========
(() => {
  const ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const GAN10 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const JIAZI60 = (() => { const a = []; for (let i = 0; i < 60; i++) a.push(GAN10[i % 10] + ZHI12[i % 12]); return a; })();
  const YAO = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
  const YAO_CN = ['初', '二', '三', '四', '五', '上'];
  const DWX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  const esc6 = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const CHANG_NAMES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  function todayGanzhi6() {
    const base = new Date(2026, 9, 22); // 甲子基准（与金口诀同源）
    const days = Math.floor((Date.now() - base.getTime()) / 86400000);
    return JIAZI60[((days % 60) + 60) % 60];
  }
  // 日干 → 六神起点（已由库表 liushou 提供，此处删除硬编码，lyLiuShen 直接引用 C.liushou）
  const QIN_COLOR = { 父母: '#8fb7ff', 兄弟: '#7ee0a3', 官鬼: '#ff7a8a', 妻财: '#f0c860', 子孙: '#d98cff' };
  const LS_COLOR = { 青龙: '#7ee0a3', 朱雀: '#ff7a8a', 勾陈: '#c0b890', 螣蛇: '#b98fd8', 白虎: '#c9ccd6', 玄武: '#6fc6d9' };

  // 摇卦：三枚铜钱，背=3(阳) 字=2(阴)；6=老阴(交/动)、7=少阳(单)、8=少阴(拆)、9=老阳(重/动)
  function lyThrow() {
    const six = [];
    for (let i = 0; i < 6; i++) {
      const v = [1, 2, 3].map(() => (Math.random() < 0.5 ? 2 : 3)).reduce((a, b) => a + b, 0);
      six.push({ v: v, yang: v === 7 || v === 9, dong: v === 6 || v === 9, label: v === 6 ? '交' : v === 7 ? '单' : v === 8 ? '拆' : '重' });
    }
    return six;
  }
  // 装卦：yaos 自下而上 → 本卦/变卦名 + 装卦信息
  function lyBuild(yaos) {
    const C = D.liuyao.core;
    const lines = yaos.map(y => (y.yang ? '1' : '0')).join('');
    const hexKey = lines.slice(3, 6) + lines.slice(0, 3);
    const name = (D.hexmap.map[hexKey] || {}).name || '未知';
    const g = C.gua64[name] || null;
    if (g) g.name = name;
    const vLines = yaos.map(y => ((y.dong ? !y.yang : y.yang) ? '1' : '0')).join('');
    const vKey = vLines.slice(3, 6) + vLines.slice(0, 3);
    const vName = (D.hexmap.map[vKey] || {}).name || '未知';
    const vg = C.gua64[vName] || null;
    if (vg) vg.name = vName;
    return { name: name, g: g, vName: vName, vg: vg, lines: lines, vLines: vLines };
  }
  // 六神：日干起例（库表 liushou）
  function lyLiuShen(dayGan) {
    const C = D.liuyao.core;
    const st = C.liushou[dayGan] || '青龙';
    const idx = C.liushou_order.indexOf(st);
    return Array.from({ length: 6 }, (_, i) => C.liushou_order[(idx + i) % 6]);
  }
  // 长生位：五行 → 日支/月建支 处何位
  function lyChang(wxName, zhi) {
    const C = D.liuyao.core;
    const seq = C.chang_sheng[wxName];
    if (!seq) return null;
    const i = seq.indexOf(zhi);
    return i < 0 ? null : { name: C.chang_sheng_names[i], idx: i };
  }
  // 用神候选位（世/应/六亲）
  function lyYongCands(sel, g) {
    if (sel === '世') return [g.shi - 1];
    if (sel === '应') return [g.ying - 1];
    const out = [];
    g.lines.forEach((l, i) => { if (l.qin === sel) out.push(i); });
    return out;
  }
  // 用神择一（多现规则：一爻动择动、两爻动择旺、俱静择旺）
  function lyPickYong(cands, yaos, dayZhi, monthZhi, g) {
    if (!cands.length) return null;
    if (cands.length === 1) return cands[0];
    const dyn = cands.filter(i => yaos[i].dong);
    if (dyn.length === 1) return dyn[0];
    const C = D.liuyao.core;
    let best = cands[0], bestScore = -1;
    cands.forEach(i => {
      const z = g.lines[i].zhi, w = DWX[z];
      let sc = 0;
      if (z === dayZhi) sc += 6;
      if (z === monthZhi) sc += 6;
      if (lyChang(w, dayZhi) && ['临官', '帝旺', '长生'].includes(lyChang(w, dayZhi).name)) sc += 3;
      if (lyChang(w, monthZhi) && ['临官', '帝旺', '长生'].includes(lyChang(w, monthZhi).name)) sc += 3;
      if (yaos[i].dong) sc += 2;
      if (C.sheng[DWX[dayZhi]] === w) sc += 2;
      if (C.sheng[DWX[monthZhi]] === w) sc += 2;
      if (sc > bestScore) { bestScore = sc; best = i; }
    });
    return best;
  }
  // 四处生克冲合：月建/日辰/动爻/变爻 对用神（ysLine=用神爻行对象，ysIdx=用神爻索引）
  function lyFourImpacts(ysLine, g, vg, yaos, dayZhi, monthZhi, ysIdx) {
    const C = D.liuyao.core;
    const hits = []; // {src, kind, txt}
    const one = (srcZhi, srcName) => {
      if (srcZhi == null) return;
      const w1 = DWX[srcZhi], w2 = DWX[ysLine.zhi];
      if (C.sheng[w1] === w2) hits.push({ src: srcName, kind: '生', txt: srcName + '（' + srcZhi + '）生用神' });
      else if (C.ke[w1] === w2) hits.push({ src: srcName, kind: '克', txt: srcName + '（' + srcZhi + '）克用神' });
      if (C.chong[srcZhi] === ysLine.zhi) hits.push({ src: srcName, kind: '冲', txt: srcName + '（' + srcZhi + '）冲用神' });
      else if (C.he[srcZhi] === ysLine.zhi) hits.push({ src: srcName, kind: '合', txt: srcName + '（' + srcZhi + '）合用神' });
    };
    one(monthZhi, '月建');
    one(dayZhi, '日辰');
    yaos.forEach((y, i) => { if (i !== ysIdx && y.dong) one(g.lines[i].zhi, '动爻（' + YAO[i] + '）'); });
    if (yaos[ysIdx].dong && vg) one(vg.lines[ysIdx].zhi, '变爻（' + YAO[ysIdx] + '）');
    const shengN = hits.filter(h => h.kind === '生').length;
    const keN = hits.filter(h => h.kind === '克').length;
    let zong = '';
    if (keN === 0) zong = '四处无克：诸占全吉（增删卜易：全来生合用神诸占全吉）';
    else if (shengN >= 3 && keN === 1) zong = '三生一克：以吉断（增删卜易）';
    else if (shengN === 2 && keN === 2) zong = '两生两克：须看用神旺衰——用神旺相者吉，休囚者凶';
    else if (keN >= 4) zong = '四处俱克：大凶';
    else if (keN > shengN) zong = '克多于生：主凶，须看用神旺衰与救应（原神）';
    else zong = '生多于克：主吉，仍须看用神旺衰';
    return { hits: hits, zong: zong, shengN: shengN, keN: keN };
  }
  // 六冲卦 / 六合卦判定（卜筮正宗：六冲卦 10 个；六合看初四/二五/三上）
  const LIUCHONG6 = ['乾为天', '兑为泽', '离为火', '震为雷', '巽为风', '坎为水', '艮为山', '坤为地', '天雷无妄', '雷天大壮'];
  function isLiuChong6(g) { return LIUCHONG6.indexOf(g.name) >= 0; }
  function isLiuHe6(g) {
    const C = D.liuyao.core;
    return [[0, 3], [1, 4], [2, 5]].every(p => C.he[g.lines[p[0]].zhi] === g.lines[p[1]].zhi || C.he[g.lines[p[1]].zhi] === g.lines[p[0]].zhi);
  }
  // 三合局成局判定：用神支所属三合局的三个地支须齐备于 [日支, 月支, 六爻地支]
  function lySanheHit(g, yaos, ysZhi, dayZhi, monthZhi) {
    const C = D.liuyao.core;
    for (const key of Object.keys(C.sanhe)) {
      const zs = key.split('');
      if (!zs || zs.indexOf(ysZhi) < 0) continue;
      const present = new Set([dayZhi, monthZhi]);
      g.lines.forEach(l => present.add(l.zhi));
      if (zs.every(z => present.has(z))) return key + '（' + C.sanhe[key] + '局）';
    }
    return null;
  }
  // 格局判定
  function lyGeju(g, vg, ys, dayZhi, monthZhi, day, yaos, yongshenSel) {
    const C = D.liuyao.core;
    const out = [];
    const ysLine = g.lines[ys];
    const is6chong = isLiuChong6(g);
    const is6he = isLiuHe6(g);
    if (is6chong) out.push({ cond: '六冲卦（八纯）', duan: '六冲主冲并，事多散；占久远之事不利，近事逢冲反快。' });
    if (is6he) out.push({ cond: '六合卦', duan: '六合主和合，事易成而久远；唯占病讼嫌合住难散。' });
    // 反吟伏吟（变卦六冲为反吟；本变六亲全同为伏吟）
    if (vg && isLiuChong6(vg)) out.push({ cond: '反吟（卦变六冲）', duan: '反吟定例：事有反复，去而复返，谋望多更变。' });
    if (vg && g.lines.every((l, i) => l.qin === vg.lines[i].qin)) out.push({ cond: '伏吟（卦变六亲全同）', duan: '伏吟定例：事主呻吟不定，谋为不进，进退两难。' });
    // 旬空
    const xk = C.xunkong[day] || '';
    if (xk.indexOf(ysLine.zhi) >= 0) {
      const dong = yaos[ys].dong;
      out.push({ cond: '用神旬空（' + ysLine.zhi + '，' + day + '旬空' + xk + '）',
        duan: dong ? '用神动而逢空：动不为空，冲空实空之日有用。' : '用神静值旬空：静空遇克则真空，忌神最喜逢空，用与原神不可空。' });
    }
    // 月破
    const yp = C.yue_po[monthZhi];
    if (yp === ysLine.zhi) out.push({ cond: '用神月破（' + ysLine.zhi + '，月建' + monthZhi + '冲）', duan: '月破之爻：破而不成，出月值日或逢合之日方应。' });
    // 入墓 / 绝（长生十二宫，对日辰）
    const csDay = lyChang(DWX[ysLine.zhi], dayZhi);
    const csMon = lyChang(DWX[ysLine.zhi], monthZhi);
    if (csDay && csDay.name === '墓') out.push({ cond: '用神入墓于日辰（' + dayZhi + '）', duan: '墓中人不冲不发——待冲墓之日方应。' });
    if (csMon && csMon.name === '墓') out.push({ cond: '用神入墓于月建（' + monthZhi + '）', duan: '用神月墓：主阻滞暗昧，待冲墓之日月方出。' });
    if (csDay && csDay.name === '绝') out.push({ cond: '用神绝于日辰（' + dayZhi + '）', duan: '绝处逢生则事成，忌再见刑克；待长生之日月。' });
    // 禄 / 驿马 / 贵人 / 六破 / 六穿 / 三合局（core 表接入）
    if (C.lu && C.lu[day[0]] === ysLine.zhi) out.push({ cond: '用神临日干之禄（' + day[0] + '禄在' + ysLine.zhi + '）', duan: '禄主俸禄财帛，用神临禄旺相，求财求名皆吉。' });
    if (C.ma && (C.ma[dayZhi] === ysLine.zhi || C.ma[monthZhi] === ysLine.zhi)) out.push({ cond: '用神临驿马（' + (C.ma[dayZhi] === ysLine.zhi ? '日马' : '月马') + '）', duan: '马主动——占出行行人至速，占静事则主变动不宁。' });
    if (C.gui_ren && (C.gui_ren[day[0]] || []).indexOf(ysLine.zhi) >= 0) out.push({ cond: '用神临日干贵人（' + day[0] + '贵人在' + C.gui_ren[day[0]].join('/') + '）', duan: '贵人临用，得人扶助，凡事有救。' });
    if (C.po && (C.po[dayZhi] === ysLine.zhi || C.po[monthZhi] === ysLine.zhi)) out.push({ cond: '用神逢六破（' + (C.po[dayZhi] === ysLine.zhi ? '日破' : '月破见六破') + '）', duan: '六破主破损——财见破财，物见破物，凡事不成。' });
    if (C.chuan && C.chuan[dayZhi] === ysLine.zhi) out.push({ cond: '用神逢六穿（' + dayZhi + '穿' + ysLine.zhi + '）', duan: '穿主暗伤乘隙——凡事暗中受损，防小人暗算。' });
    if (C.sanhe) {
      const he3 = lySanheHit(g, yaos, ysLine.zhi, dayZhi, monthZhi);
      if (he3) out.push({ cond: '三合局成（' + he3 + '）', duan: '用动值三合，行人立回庄——三合主成事聚众；合处逢冲待冲日。' });
    }
    // 用神动化墓绝空
    if (yaos[ys].dong && vg) {
      const vz = vg.lines[ys].zhi;
      const vcs = lyChang(DWX[vz], vz);
      if (vcs && (vcs.name === '墓' || vcs.name === '绝')) out.push({ cond: '用神动化' + vcs.name + '（' + vz + '）', duan: '用爻变动忌遭死墓绝空——诸事不成，占病尤忌。' });
      const vxk = C.xunkong[day] || '';
      if (vxk.indexOf(vz) >= 0) out.push({ cond: '用神动化空（' + vz + '）', duan: '自空化空，必成凶咎——动有更变，空有疑惑。' });
      if (C.ke[DWX[vz]] === DWX[ysLine.zhi]) out.push({ cond: '变爻回头克用神（' + vz + '克' + ysLine.zhi + '）', duan: '戒回头之克我——凡谋不吉，占病尤凶。' });
      if (C.sheng[DWX[vz]] === DWX[ysLine.zhi]) out.push({ cond: '变爻回头生用神（' + vz + '生' + ysLine.zhi + '）', duan: '绝处逢生，凶中有救。' });
    }
    // 世应
    const sw = g.lines[g.shi - 1].zhi, yw = g.lines[g.ying - 1].zhi;
    if (C.sheng[DWX[sw]] === DWX[yw] || C.sheng[DWX[yw]] === DWX[sw]) out.push({ cond: '世应相生', duan: '世应相生则吉。' });
    else if (C.ke[DWX[sw]] === DWX[yw] || C.ke[DWX[yw]] === DWX[sw]) out.push({ cond: '世应相克', duan: '世应相克则凶，谋事多阻。' });
    else out.push({ cond: '世应比和', duan: '世应比和事却中，作事谋为可用。' });
    if (yaos[g.shi - 1].dong) out.push({ cond: '世爻发动', duan: '世或交重——本人三心二意，事有改张。' });
    if (yaos[g.ying - 1].dong) out.push({ cond: '应爻发动', duan: '应如发动——他人心易变迁。' });
    if (yaos[g.shi - 1].kong) out.push({ cond: '世爻旬空', duan: '心退悔兮世空——人心堕懒，不能勇往。' });
    // 安静 / 乱动
    const dongN = yaos.filter(y => y.dong).length;
    if (dongN === 0) out.push({ cond: '六爻安静', duan: '卦遇六爻安静，当看用与日辰——日辰克用及相刑，作事宜谨慎。' });
    if (dongN >= 4) out.push({ cond: '六爻乱动（' + dongN + ' 爻动）', duan: '六爻乱动事难明，须向宫中看用神——用若休囚遭克害，费精神。' });
    // 间爻（世应之间两爻）
    const btw = [];
    for (let i = Math.min(g.shi, g.ying); i < Math.max(g.shi, g.ying) - 1; i++) if (yaos[i].dong) btw.push(YAO[i]);
    if (btw.length) out.push({ cond: '间爻发动（' + btw.join('、') + '）', duan: '事阻隔兮间发——世应当中间爻发动，所求多阻隔。' });
    // 静得日冲暗动
    yaos.forEach((y, i) => {
      if (!y.dong && C.chong[dayZhi] === g.lines[i].zhi && i !== ys) {
        out.push({ cond: '静爻逢日冲暗动（' + YAO[i] + '）', duan: '静得冲而暗兴——以动爻论，能生克他爻。' });
      }
    });
    return out;
  }
  // 单爻旺衰打分（月建日辰加权 · 通行旺衰法；移植自 suan/玄鉴 liuyao engine，原出 xiongdun8/liuyao.wangshuai）
  // 返回 {score, status}；status 为状态标签列表。注：此为后世通行加权口径，非古籍原文，只作旺衰相对强弱参考。
  const WX_SEASON = {
    寅: { 木: '旺', 火: '相', 水: '休', 金: '囚', 土: '死' }, 卯: { 木: '旺', 火: '相', 水: '休', 金: '囚', 土: '死' },
    巳: { 火: '旺', 土: '相', 木: '休', 水: '囚', 金: '死' }, 午: { 火: '旺', 土: '相', 木: '休', 水: '囚', 金: '死' },
    申: { 金: '旺', 水: '相', 土: '休', 火: '囚', 木: '死' }, 酉: { 金: '旺', 水: '相', 土: '休', 火: '囚', 木: '死' },
    亥: { 水: '旺', 木: '相', 金: '休', 土: '囚', 火: '死' }, 子: { 水: '旺', 木: '相', 金: '休', 土: '囚', 火: '死' },
    辰: { 土: '旺', 金: '相', 火: '休', 木: '囚', 水: '死' }, 戌: { 土: '旺', 金: '相', 火: '休', 木: '囚', 水: '死' },
    丑: { 土: '旺', 金: '相', 火: '休', 木: '囚', 水: '死' }, 未: { 土: '旺', 金: '相', 火: '休', 木: '囚', 水: '死' }
  };
  const WX_DIWANG = { 木: ['卯'], 火: ['午'], 金: ['酉'], 水: ['子'], 土: ['辰', '戌', '丑', '未'] };
  const WX_MU = { 木: ['未'], 火: ['戌'], 金: ['丑'], 水: ['辰'], 土: ['辰', '戌', '丑', '未'] };
  const WX_JUE = { 木: '申', 火: '亥', 金: '寅', 水: '巳', 土: '亥' };
  function lyYaoStrength(zhi, monthZhi, dayZhi, changedZhi, isMoving) {
    const C = D.liuyao.core;
    let score = 0.0;
    const status = [];
    const yaoWx = DWX[zhi] || '', monWx = DWX[monthZhi] || '', dayWx = DWX[dayZhi] || '';
    if (zhi === monthZhi) { score += 2.0; status.push('月建'); }
    if (zhi === dayZhi) { score += 1.5; status.push('日建'); }
    if (C.he && C.he[zhi] === monthZhi) {
      if ((C.ke[monWx] === yaoWx) || (C.ke[yaoWx] === monWx)) { score -= 0.5; status.push('月合克'); }
      else { score += 1.5; status.push('合旺'); }
    }
    if (C.he && C.he[zhi] === dayZhi) {
      if ((C.ke[dayWx] === yaoWx) || (C.ke[yaoWx] === dayWx)) { score -= 0.5; status.push('日合克'); }
      else { score += 1.5; status.push('合绊'); }
    }
    if (C.sheng[monWx] === yaoWx) { score += 1.5; status.push('月生'); }
    if (C.sheng[dayWx] === yaoWx) { score += 1.5; status.push('日生'); }
    if (monWx === yaoWx && zhi !== monthZhi) { score += 1.0; status.push('月扶'); }
    if (dayWx === yaoWx && zhi !== dayZhi) { score += 0.5; status.push('日扶'); }
    if (C.chong && C.chong[zhi] === monthZhi) { score -= 2.0; status.push('月破'); }
    if (C.ke[monWx] === yaoWx) { score -= 1.0; status.push('月克'); }
    if (C.ke[dayWx] === yaoWx) { score -= 1.0; status.push('日克'); }
    const isDayConflict = !!(C.chong && C.chong[zhi] === dayZhi);
    if (isDayConflict && score < 0) { score -= 1.5; status.push('日散'); }
    if (WX_DIWANG[yaoWx] && WX_DIWANG[yaoWx].indexOf(dayZhi) >= 0) { score += 1.0; status.push('帝旺'); }
    const season = WX_SEASON[monthZhi] || {};
    if (season[yaoWx] && ['休', '囚', '死'].indexOf(season[yaoWx]) >= 0) { score -= 1.5; status.push('休囚(' + season[yaoWx] + ')'); }
    if (WX_MU[yaoWx]) {
      const src = [];
      if (WX_MU[yaoWx].indexOf(monthZhi) >= 0) src.push('月墓');
      if (WX_MU[yaoWx].indexOf(dayZhi) >= 0) src.push('日墓');
      if (src.length) { score = -0.1; status.push('入' + src.join('/')); }
    }
    if (!isMoving && dayZhi === WX_JUE[yaoWx]) { score -= 0.5; status.push('绝地'); }
    if (isMoving && changedZhi && changedZhi === WX_JUE[yaoWx]) { score -= 1.0; status.push('化绝'); }
    if (isDayConflict && score >= 0) status.push('暗动');
    return { score: Math.round(score * 100) / 100, status: status };
  }
  function lyDuanyu(g, vg, ys, yaos, day, monthZhi, dayZhi, yongshenSel, shi, ping, four) {
    const C = D.liuyao.core, DU = D.liuyao.duanyu;
    const hits = [];
    const add = (sec, cond, duan) => hits.push({ sec: sec, cond: cond, duan: duan });
    const ysLine = g.lines[ys];
    const xk = C.xunkong[day] || '';
    const dongN = yaos.filter(y => y.dong).length;
    // ① 诸爻持世
    const shiQin = g.lines[g.shi - 1].qin;
    const chishi = (DU.chishi || []).find(c => c.qin === shiQin);
    if (chishi) add('诸爻持世', '世临' + shiQin, chishi.duan);
    // ② 六亲发动
    yaos.forEach((y, i) => {
      if (!y.dong) return;
      const q = g.lines[i].qin;
      const fd = (DU.fadong || []).find(c => c.qin === q);
      if (fd) add('六亲发动', YAO[i] + '·' + q + '发动', fd.duan);
    });
    // ③ 六亲变化
    if (vg) yaos.forEach((y, i) => {
      if (!y.dong) return;
      const q1 = g.lines[i].qin, q2 = vg.lines[i].qin;
      const bh = (DU.bianhua || []).find(c => c.qin === q1);
      if (bh) {
        const row = (bh.hua || []).find(h => h[0] === q2);
        if (row) add('六亲变化', YAO[i] + '·' + q1 + '化' + q2, row[1]);
      }
    });
    // ④ 六兽歌断（六神临用发动）
    const ls = lyLiuShen(day[0]);
    if (yaos[ys].dong) {
      const so = (DU.liushou || []).find(c => c.shen === ls[ys]);
      if (so) add('六兽歌断', ls[ys] + '临用神发动', so.duan);
    }
    // ⑤ 世应 / 用神状态
    const sw = g.lines[g.shi - 1].zhi, yw = g.lines[g.ying - 1].zhi;
    if (C.sheng[DWX[sw]] === DWX[yw] || C.sheng[DWX[yw]] === DWX[sw]) add('世应', '世应相生', DU.shiying.sheng);
    else if (C.ke[DWX[sw]] === DWX[yw] || C.ke[DWX[yw]] === DWX[sw]) add('世应', '世应相克', DU.shiying.ke);
    if (yaos[g.ying - 1].dong) add('世应', '应爻发动', DU.shiying.ying_dong);
    // 用神空亡
    if (xk.indexOf(ysLine.zhi) >= 0) add('用神空亡', '用神值旬空', DU.yskong[0]);
    // 用神发动
    if (yaos[ys].dong) add('用神发动', '用爻发动在宫中', DU.ysfadong[0]);
    // 忌神 / 原神
    const yuanKe = C.ke[DWX[ysLine.zhi]]; // 克用神之五行
    const ji = [], yuan = [];
    yaos.forEach((y, i) => {
      if (!y.dong) return;
      if (DWX[g.lines[i].zhi] === yuanKe) ji.push(YAO[i]);
      if (C.sheng[DWX[g.lines[i].zhi]] === DWX[ysLine.zhi]) yuan.push(YAO[i]);
    });
    if (ji.length) add('忌神', '忌神发动（' + ji.join('、') + '）', DU.jishen[0]);
    if (yuan.length) add('原神', '原神发动（' + yuan.join('、') + '）', DU.yuanshen[0]);
    // 用神不上卦 → 伏神（bugua 用神不上卦诀 + feifu 飞伏生克吉凶歌，库引用）
    const cands = lyYongCands(yongshenSel, g);
    if (!cands.length && ['父母', '兄弟', '官鬼', '妻财', '子孙'].indexOf(yongshenSel) >= 0) {
      const gong = g.gong;
      const head = { 乾: '乾为天', 坎: '坎为水', 艮: '艮为山', 震: '震为雷', 巽: '巽为风', 离: '离为火', 坤: '坤为地', 兑: '兑为泽' }[gong];
      const hg = C.gua64[head];
      const v = (hg.lines || []).find(l => l.qin === yongshenSel);
      if (v) add('用神不上卦（伏神）', '用神不上卦，伏于' + head + '下',
        (DU.bugua && DU.bugua[0] ? DU.bugua[0] : '正卦如无变又无，就将首卦六亲攻') + '——伏神' + v.zhi + v.qin + '。' +
        (DU.feifu && DU.feifu[0] ? '　' + DU.feifu[0] : '动爻生用终须吉，若遇交重克用凶。'));
    }
    // 安静 / 乱动
    if (dongN === 0) add('六爻安静', '六爻俱静', DU.anjing[0]);
    if (dongN >= 4) add('六爻乱动', '六爻乱动', DU.luandong[0]);
    // 日辰（richen 库引用，替代硬编码）
    if (C.ke[DWX[dayZhi]] === DWX[ysLine.zhi]) add('日辰', '日辰克用神', DU.richen && DU.richen[0] ? '日辰克用不堪亲——' + DU.richen[0].split('，')[2] : '日辰克用不堪亲。');
    if (C.sheng[DWX[dayZhi]] === DWX[ysLine.zhi] || C.he[dayZhi] === ysLine.zhi) add('日辰', '日辰与用相生合', DU.richen && DU.richen[0] ? '日辰与用相生合，作事何愁不起心。' : '日辰与用相生合，作事何愁不起心。');
    // 卦身（guashen：世支→身爻位，恒输出卦身位置；三条诀按身爻状态命中）
    const SHEN_WEI = { 子: 0, 午: 0, 丑: 1, 未: 1, 寅: 2, 申: 2, 卯: 3, 酉: 3, 辰: 4, 戌: 4, 巳: 5, 亥: 5 };
    const shenPos = SHEN_WEI[g.lines[g.shi - 1].zhi];
    if (DU.guashen && shenPos != null) {
      const shenLine = g.lines[shenPos];
      const shenCond = [];
      if (shenLine.qin === '子孙') { add('卦身', '身临福德不见官', DU.guashen[0]); shenCond.push('身临福德'); }
      else if (shenLine.qin === (yongshenSel === '世' ? g.lines[g.shi - 1].qin : yongshenSel)) { add('卦身', '身临原用与青龙', DU.guashen[1]); shenCond.push('身临原用'); }
      if (xk.indexOf(shenLine.zhi) >= 0) { add('卦身', '身爻入空亡', DU.guashen[2]); shenCond.push('身爻空亡'); }
      add('卦身', '卦身在' + YAO[shenPos] + '（' + shenLine.gan + shenLine.zhi + ' ' + shenLine.qin + '）' + (shenCond.length ? '·' + shenCond.join('、') : '·身爻临' + shenLine.qin + '，三诀均不适用'),
        '月卦身以世爻地支定爻位：子午持世身居初、丑未居二、寅申居三、卯酉居四、辰戌居五、巳亥居上。');
    }
    // 日月建传符（riyue：日建按六神各有一句，神名在句内；月建为尾句总述「断法亦相同」）
    if (DU.riyue && DU.riyue[0]) {
      const ryParts = DU.riyue[0].split('。').filter(Boolean);
      yaos.forEach((y, i) => {
        const z = g.lines[i].zhi;
        if (z === dayZhi || z === monthZhi) {
          const s = ls[i];
          if (z === dayZhi) {
            const line = ryParts.find(t => t.indexOf(s) >= 0);
            if (line) add('日月建传符', s + '临日建（' + z + '）', line + '。');
          } else {
            add('日月建传符', s + '临月建（' + z + '）', ryParts[ryParts.length - 1] + '——' + s + '临月建，断法与日建同。');
          }
        }
      });
    }
    // 碎金赋（suijin 10 条双联 20 联：动爻+关系+忌/解，条件→命中）
    const SJ = [
      { act: '子孙', target: '妻财', jin: '父母', txt: '子动生财不宜父摆' },
      { act: '兄弟', target: '妻财', jie: '子孙', txt: '兄动克财子动能解' },
      { act: '妻财', target: '官鬼', jin: '兄弟', txt: '财动生鬼切忌兄摇' },
      { act: '子孙', target: '官鬼', jie: '妻财', txt: '子动克鬼财动能消' },
      { act: '父母', target: '兄弟', jin: '妻财', txt: '父动生兄忌财相克' },
      { act: '官鬼', target: '兄弟', jie: '父母', txt: '鬼动克兄父动能泄' },
      { act: '兄弟', target: '子孙', jin: '官鬼', txt: '兄动生子忌鬼摇扬' },
      { act: '父母', target: '子孙', jie: '兄弟', txt: '父动克子兄动无妨' },
      { act: '子孙', target: '官鬼', jie: '父母', txt: '子兴克鬼父动无妨' },
      { act: '妻财', target: '父母', jie: '兄弟', txt: '财兴克父兄动无忧' },
      { act: '父母', target: '子孙', jie: '妻财', txt: '父动克子财动无事' },
      { act: '官鬼', target: '兄弟', jie: '子孙', txt: '鬼兴克兄子动可救' },
      { act: '兄弟', target: '妻财', jie: '官鬼', txt: '兄兴克财鬼兴无碍' },
      { act: '官鬼', jin: '子孙', txt: '鬼动巽入忌子交重' },
      { act: '妻财', target: '父母', jie: '官鬼', txt: '财动克父鬼动能中' },
      { act: '兄弟', target: '官鬼', txt: '若然兄动鬼必遭伤' },
      { act: '子孙', target: '父母', txt: '若然子动父命难留' },
      { act: '官鬼', target: '子孙', txt: '若是鬼兴其子必死' },
      { act: '妻财', target: '兄弟', txt: '财若交重兄弟不久' },
      { act: '父母', target: '妻财', txt: '若是父兴财遭克害' },
    ];
    const hasQin6 = (q) => g.lines.some(l => l.qin === q);
    const hasDong6 = (q) => yaos.some((y, i) => y.dong && g.lines[i].qin === q);
    SJ.forEach(s => {
      if (hasDong6(s.act) && (!s.target || hasQin6(s.target))) {
        let txt = s.txt;
        if (s.jin && hasDong6(s.jin)) txt += '（忌' + s.jin + '动，主凶）';
        else if (s.jie && hasDong6(s.jie)) txt += '（' + s.jie + '动可解）';
        add('碎金赋', s.act + '动 · ' + s.target + '在卦', txt);
      }
    });
    // 千金赋 68 条通用命中器（用神状态 → 断语精确命中，能判则判，未命中不加）
    const qjHits = lyQianjinHits(g, vg, ys, yaos, day, dayZhi, monthZhi, xk, yaos.filter(y => y.dong).length, g.lines[g.shi - 1].qin, four, { yongshenSel: yongshenSel, fhFlag: ping.fhFlag || '' });
    qjHits.forEach(x => add('千金赋', x.cond, x.duan));
    // 分类占
    const fen = (DU.fenlei || {})[shi];
    const fh = [];
    if (fen) fen.forEach(f => {
      if (lyFenMatch(f.cond, { g, vg, ys, yaos, day, dayZhi, monthZhi, yongshenSel, xk, dongN })) fh.push(f);
    });
    fh.forEach(f => add('分类占·' + shi, f.cond, f.duan));
    return { hits: hits, fh: fh };
  }
  // 分类占条件判定（按关键词匹配卦象状态）
  function lyFenMatch(cond, ctx) {
    const C = D.liuyao.core, g = ctx.g, vg = ctx.vg, ys = ctx.ys, yaos = ctx.yaos;
    const yl = g.lines[ys];
    const dwx = DWX[yl.zhi];
    const shengDay = C.sheng[DWX[ctx.dayZhi]], keDay = C.ke[DWX[ctx.dayZhi]];
    const shengMon = C.sheng[DWX[ctx.monthZhi]], keMon = C.ke[DWX[ctx.monthZhi]];
    const wang = (shengDay === dwx || shengMon === dwx || yl.zhi === ctx.dayZhi || yl.zhi === ctx.monthZhi);
    const kong = ctx.xk.indexOf(yl.zhi) >= 0;
    const po = C.yue_po[ctx.monthZhi] === yl.zhi;
    const shuai = !wang && (kong || po || (keDay === dwx && keMon === dwx));
    const shiQin = g.lines[g.shi - 1].qin;
    const dongN = ctx.dongN;
    const hasDong = (qin) => yaos.some((y, i) => y.dong && g.lines[i].qin === qin);
    const dongYaos = yaos.map((y, i) => y.dong ? i : -1).filter(i => i >= 0);
    if (cond.indexOf('财旺福兴') >= 0) return dwx === '金' || (dwx === '水' && (shengDay === '水' || shengMon === '水')) ? hasDong('子孙') || true : false;
    if (cond.indexOf('财空福绝') >= 0) return kong && !hasDong('子孙');
    if (cond.indexOf('财兄同动') >= 0) return hasDong('妻财') && hasDong('兄弟') && (cond.indexOf('得子孙同动') < 0 || hasDong('子孙'));
    if (cond.indexOf('兄财同动而官鬼亦动') >= 0) return hasDong('妻财') && hasDong('兄弟') && hasDong('官鬼');
    if (cond.indexOf('财与子孙俱不现') >= 0) return (!g.lines.some(l => l.qin === '妻财') && !g.lines.some(l => l.qin === '子孙')) || (g.lines.some(l => l.qin === '妻财' || l.qin === '子孙') && shuai);
    if (cond.indexOf('父兄爻动') >= 0) return hasDong('父母') && hasDong('兄弟');
    if (cond.indexOf('财爻重叠') >= 0) return g.lines.filter(l => l.qin === '妻财').length >= 2;
    if (cond.indexOf('兄弟多现') >= 0 || cond.indexOf('无鬼分争') >= 0) return g.lines.filter(l => l.qin === '兄弟').length >= 2;
    if (cond.indexOf('兄弟爻太多动') >= 0 || cond.indexOf('兄如太过') >= 0) return g.lines.filter(l => l.qin === '兄弟').length >= 3;
    if (cond.indexOf('兄爻持世') >= 0 || cond.indexOf('世遇兄临') >= 0) return shiQin === '兄弟';
    if (cond.indexOf('男占女') >= 0 || cond.indexOf('男卜女') >= 0 || cond.indexOf('男家代占女') >= 0) return true;
    if (cond.indexOf('女占男') >= 0 || cond.indexOf('女家代占男') >= 0) return false;
    if (cond.indexOf('财爻应爻生合世爻') >= 0) {
      const ysW = DWX[g.lines[g.ying - 1].zhi];
      return C.sheng[ysW] === DWX[g.lines[g.shi - 1].zhi] || C.he[g.lines[g.ying - 1].zhi] === g.lines[g.shi - 1].zhi;
    }
    if (cond.indexOf('财爻休囚破散') >= 0) return shuai;
    if (cond.indexOf('官爻衰墓绝空') >= 0) return shuai;
    if (cond.indexOf('世爻动而空') >= 0 || cond.indexOf('动而空者') >= 0) return yaos[g.shi - 1].dong && kong;
    if (cond.indexOf('世爻静而空') >= 0 || cond.indexOf('静而空者') >= 0) return !yaos[g.shi - 1].dong && kong;
    if (cond.indexOf('世动化进神') >= 0) return ctx.fhFlag === 'jin';
    if (cond.indexOf('世动化退神') >= 0) return ctx.fhFlag === 'tui';
    if (cond.indexOf('子孙旺相') >= 0) return wang;
    if (cond.indexOf('子孙临空破衰绝') >= 0) return shuai;
    if (cond.indexOf('子孙动化子孙') >= 0 || cond.indexOf('两现旺相') >= 0) return (hasDong('子孙') && vg && vg.lines[dongYaos[0]].qin === '子孙') || (g.lines.filter(l => l.qin === '子孙').length >= 2 && wang);
    if (cond.indexOf('子化子') >= 0) return hasDong('子孙') && vg && vg.lines[dongYaos[0]].qin === '子孙';
    if (cond.indexOf('坐草临盆嫌鬼动') >= 0 || cond.indexOf('官鬼动') >= 0 && cond.indexOf('产妇') >= 0) return hasDong('官鬼');
    if (cond.indexOf('胎前产后忌兄摇') >= 0 || (cond.indexOf('兄弟动') >= 0 && cond.indexOf('产妇') >= 0)) return hasDong('兄弟');
    if (cond.indexOf('财临绝破') >= 0) return po || (C.ke[DWX[ctx.dayZhi]] === dwx && C.ke[DWX[ctx.monthZhi]] === dwx);
    if (cond.indexOf('财化鬼') >= 0 || cond.indexOf('鬼化妻财') >= 0 || cond.indexOf('鬼化财') >= 0) return (hasDong('妻财') && vg && dongYaos.some(i => g.lines[i].qin === '妻财' && vg.lines[i].qin === '官鬼')) || (hasDong('官鬼') && vg && dongYaos.some(i => g.lines[i].qin === '官鬼' && vg.lines[i].qin === '妻财'));
    if (cond.indexOf('六冲卦，子旺财强') >= 0) return isLiuChong6(g) && wang;
    if (cond.indexOf('六合卦，财空子破') >= 0) return isLiuHe6(g) && kong;
    if (cond.indexOf('世爻旺相') >= 0) return wang;
    if (cond.indexOf('世爻空亡') >= 0) return kong;
    if (cond.indexOf('世动化吉') >= 0) return yaos[g.shi - 1].dong;
    if (cond.indexOf('世伤应位') >= 0) return C.ke[DWX[g.lines[g.shi - 1].zhi]] === DWX[g.lines[g.ying - 1].zhi];
    if (cond.indexOf('应克世') >= 0) return C.ke[DWX[g.lines[g.ying - 1].zhi]] === DWX[g.lines[g.shi - 1].zhi];
    if (cond.indexOf('八纯乱动') >= 0) return isLiuChong6(g) && dongN >= 3;
    if (cond.indexOf('两间齐空') >= 0) return false;
    if (cond.indexOf('六冲卦、世爻休囚被克') >= 0) return isLiuChong6(g) && shuai;
    if (cond.indexOf('世爻暗动') >= 0) return !yaos[g.shi - 1].dong && C.chong[ctx.dayZhi] === g.lines[g.shi - 1].zhi;
    if (cond.indexOf('官鬼交重') >= 0) return hasDong('官鬼');
    if (cond.indexOf('子孙发动') >= 0) return hasDong('子孙') || shiQin === '子孙' || (yaos[g.shi - 1].dong && vg && vg.lines[g.shi - 1].qin === '子孙');
    if (cond.indexOf('父克世爻') >= 0 || cond.indexOf('父母持世而动') >= 0) return (shiQin === '父母' && yaos[g.shi - 1].dong) || (hasDong('父母') && C.ke[DWX[g.lines[g.ying - 1].zhi]] === DWX[g.lines[g.shi - 1].zhi]);
    if (cond.indexOf('兄冲世位') >= 0 || cond.indexOf('兄爻冲克') >= 0) return dongYaos.some(i => g.lines[i].qin === '兄弟' && C.chong[g.lines[i].zhi] === g.lines[g.shi - 1].zhi);
    if (cond.indexOf('反吟化退') >= 0) return ctx.fhFlag === 'tui' || (vg && g.lines.every((l, i) => C.chong[l.zhi] === vg.lines[i].zhi));
    if (cond.indexOf('六冲随墓') >= 0) return isLiuChong6(g) && ruMuCheck(ctx);
    if (cond.indexOf('世克用') >= 0) return C.ke[DWX[g.lines[g.shi - 1].zhi]] === DWX[yl.zhi];
    if (cond.indexOf('用爻克世') >= 0 || cond.indexOf('用神克世') >= 0) return C.ke[DWX[yl.zhi]] === DWX[g.lines[g.shi - 1].zhi];
    if (cond.indexOf('用神墓绝空破') >= 0) return kong || po || shuai;
    if (cond.indexOf('用神明摇暗动') >= 0) return yaos[ys].dong || (!yaos[ys].dong && C.chong[ctx.dayZhi] === yl.zhi);
    if (cond.indexOf('用神伏藏受克') >= 0) return false;
    if (cond.indexOf('世空') >= 0) return ctx.xk.indexOf(g.lines[g.shi - 1].zhi) >= 0;
    if (cond.indexOf('子孙动子孙持世') >= 0) return hasDong('子孙') || shiQin === '子孙';
    if (cond.indexOf('鬼持世') >= 0) return shiQin === '官鬼';
    if (cond.indexOf('鬼克世') >= 0) return hasDong('官鬼') && dongYaos.some(i => g.lines[i].qin === '官鬼' && C.ke[DWX[g.lines[i].zhi]] === DWX[g.lines[g.shi - 1].zhi]);
    if (cond.indexOf('应动克世') >= 0) return yaos[g.ying - 1].dong && C.ke[DWX[g.lines[g.ying - 1].zhi]] === DWX[g.lines[g.shi - 1].zhi];
    if (cond.indexOf('世动克应') >= 0) return yaos[g.shi - 1].dong && C.ke[DWX[g.lines[g.shi - 1].zhi]] === DWX[g.lines[g.ying - 1].zhi];
    if (cond.indexOf('日月克身') >= 0) return (keDay === DWX[g.lines[g.shi - 1].zhi] || keMon === DWX[g.lines[g.shi - 1].zhi]);
    if (cond.indexOf('动爻克应') >= 0) return dongYaos.some(i => C.ke[DWX[g.lines[i].zhi]] === DWX[g.lines[g.ying - 1].zhi]);
    if (cond.indexOf('应克世者他胜') >= 0) return C.ke[DWX[g.lines[g.ying - 1].zhi]] === DWX[g.lines[g.shi - 1].zhi];
    if (cond.indexOf('世克应者我赢') >= 0) return C.ke[DWX[g.lines[g.shi - 1].zhi]] === DWX[g.lines[g.ying - 1].zhi];
    if (cond.indexOf('世空破、世动化退') >= 0) return kong || (yaos[g.shi - 1].dong && ctx.fhFlag === 'tui');
    if (cond.indexOf('应动应旺化进') >= 0) return yaos[g.ying - 1].dong && ctx.fhFlag === 'jin';
    if (cond.indexOf('卦遇六冲') >= 0) return isLiuChong6(g);
    if (cond.indexOf('官父同兴') >= 0) return hasDong('官鬼') && hasDong('父母');
    if (cond.indexOf('父官克世') >= 0) return dongYaos.some(i => (g.lines[i].qin === '父母' || g.lines[i].qin === '官鬼') && C.ke[DWX[g.lines[i].zhi]] === DWX[g.lines[g.shi - 1].zhi]);
    if (cond.indexOf('世化退神、世空世破') >= 0) return ctx.fhFlag === 'tui' || kong || po;
    if (cond.indexOf('财与子孙发动') >= 0) return hasDong('妻财') && hasDong('子孙');
    if (cond.indexOf('久病逢六冲') >= 0) return isLiuChong6(g);
    if (cond.indexOf('近病逢六冲') >= 0) return isLiuChong6(g);
    if (cond.indexOf('用神旬空（近病）') >= 0 || cond.indexOf('用遇旬空') >= 0) return kong;
    if (cond.indexOf('用神月破（久病）') >= 0 || cond.indexOf('用逢月破') >= 0) return po;
    if (cond.indexOf('用化鬼') >= 0) return hasDong('用') ? false : (yaos[ys].dong && vg && vg.lines[ys].qin === '官鬼');
    if (cond.indexOf('世持官鬼') >= 0) return shiQin === '官鬼';
    if (cond.indexOf('用神墓绝') >= 0) return shuai;
    if (cond.indexOf('忌神动克用神，元神动') >= 0) return hasDong(qinOfWx6(C.ke[dwx], C.gong_wx[g.gong])) && hasDong(qinOfWx6(C.sheng[dwx], C.gong_wx[g.gong]));
    if (cond.indexOf('忌神动克用神，仇神又动') >= 0) return hasDong(qinOfWx6(C.ke[dwx], C.gong_wx[g.gong]));
    if (cond.indexOf('用神临散遇破') >= 0) return po;
    if (cond.indexOf('父旺持世') >= 0) return shiQin === '父母' && wang;
    if (cond.indexOf('财爻发动') >= 0) return hasDong('妻财');
    if (cond.indexOf('爻逢六合') >= 0) return isLiuHe6(g);
    if (cond.indexOf('六冲卦') >= 0) return isLiuChong6(g);
    if (cond.indexOf('卦遇反吟，世破') >= 0) return vg && g.lines.every((l, i) => C.chong[l.zhi] === vg.lines[i].zhi) && po;
    if (cond.indexOf('卦遇反吟') >= 0) return vg && g.lines.every((l, i) => C.chong[l.zhi] === vg.lines[i].zhi);
    if (cond.indexOf('世动化进神') >= 0) return ctx.fhFlag === 'jin';
    if (cond.indexOf('世动化退') >= 0) return ctx.fhFlag === 'tui';
    if (cond.indexOf('父动化退神') >= 0) return hasDong('父母') && ctx.fhFlag === 'tui';
    if (cond.indexOf('随官入墓') >= 0) return ruMuCheck(ctx) && (shiQin === '官鬼' || hasDong('官鬼'));
    if (cond.indexOf('创造兴工：卦忌六冲') >= 0) return isLiuChong6(g) && hasDong('官鬼');
    if (cond.indexOf('世临福德') >= 0) return shiQin === '子孙';
    if (cond.indexOf('官鬼交重有祸基') >= 0) return hasDong('官鬼');
    // ── 落项补齐：原无分支 / 恒 false 的分类占条件 ──
    if (cond.indexOf('财官动而化破化散化克化鬼') >= 0) return dongYaos.some(i => (g.lines[i].qin === '妻财' || g.lines[i].qin === '官鬼') && vg && C.ke[DWX[vg.lines[i].zhi]] === DWX[g.lines[i].zhi]);
    if (cond.indexOf('世爻休囚空破') >= 0) return shuai && (kong || po || (yaos[g.shi - 1].dong && vg && C.ke[DWX[vg.lines[g.shi - 1].zhi]] === DWX[g.lines[g.shi - 1].zhi]));
    if (cond.indexOf('两间爻齐空') >= 0) {
      const bi = [];
      for (let i = Math.min(g.shi, g.ying); i < Math.max(g.shi, g.ying) - 1; i++) bi.push(i);
      return bi.length === 2 && bi.every(i => ctx.xk.indexOf(g.lines[i].zhi) >= 0);
    }
    if (cond.indexOf('世爻动而化合') >= 0 || cond.indexOf('被日月合') >= 0) return yaos[g.shi - 1].dong && (C.he[g.lines[g.shi - 1].zhi] === ctx.dayZhi || C.he[g.lines[g.shi - 1].zhi] === ctx.monthZhi || C.he[ctx.dayZhi] === g.lines[g.shi - 1].zhi || C.he[ctx.monthZhi] === g.lines[g.shi - 1].zhi || g.lines[g.shi - 1].zhi === ctx.dayZhi || g.lines[g.shi - 1].zhi === ctx.monthZhi);
    if (cond.indexOf('用神有伤病') >= 0) return shuai;
    if (cond.indexOf('忌化用') >= 0 || cond.indexOf('用化忌') >= 0) return yaos[ys].dong && vg && vg.lines[ys].qin === qinOfWx6(C.ke[dwx], C.gong_wx[g.gong]);
    if (cond.indexOf('父旺持世') >= 0) return shiQin === '父母' && wang;
    if (cond.indexOf('六合卦，世父旺相') >= 0) return isLiuHe6(g) && shiQin === '父母' && wang;
    return false;
  }
  // 黄金策直解 33 类分类占 · 机判条件求值器（cond 中文关键词 → 卦象状态）
  // 覆盖：六亲发动/旺相/空亡/休囚/入墓/绝/持世/临六神/化爻/伏藏/临月建，世应生克合冲空，用神状态，卦象（六冲/六合/游魂/归魂/反吟），组合条件
  function lyCatCondEval(cond, ctx) {
    const C = D.liuyao.core, g = ctx.g, vg = ctx.vg, ys = ctx.ys, yaos = ctx.yaos;
    const yl = g.lines[Math.max(ys, 0)];
    const dwx = DWX[yl.zhi];
    const gongWx = C.gong_wx[g.gong];
    const dayZhi = ctx.dayZhi, monthZhi = ctx.monthZhi, xk = ctx.xk;
    const dongN = ctx.dongN;
    const kong = xk.indexOf(yl.zhi) >= 0;
    const po = C.yue_po[monthZhi] === yl.zhi;
    const shengDay = C.sheng[DWX[dayZhi]], keDay = C.ke[DWX[dayZhi]];
    const shengMon = C.sheng[DWX[monthZhi]], keMon = C.ke[DWX[monthZhi]];
    const wang = shengDay === dwx || shengMon === dwx || yl.zhi === dayZhi || yl.zhi === monthZhi;
    const shuai = !wang && (kong || po || (keDay === dwx && keMon === dwx));
    const sw = g.lines[g.shi - 1], yw = g.lines[g.ying - 1];
    const sW = DWX[sw.zhi], yW = DWX[yw.zhi];
    const ls = lyLiuShen(ctx.day[0]);
    const qinIdx = (q) => { const a = []; g.lines.forEach((l, i) => { if (l.qin === q) a.push(i); }); return a; };
    const hasQin = (q) => qinIdx(q).length > 0;
    const hasDong = (q) => yaos.some((y, i) => y.dong && g.lines[i].qin === q);
    const dongYaos = yaos.map((y, i) => y.dong ? i : -1).filter(i => i >= 0);
    const liuShen = (i) => ls[i] || '';
    const qinWang = (q) => qinIdx(q).some(i => { const w = DWX[g.lines[i].zhi]; return C.sheng[DWX[dayZhi]] === w || C.sheng[DWX[monthZhi]] === w || g.lines[i].zhi === dayZhi || g.lines[i].zhi === monthZhi; });
    const qinKong = (q) => qinIdx(q).some(i => xk.indexOf(g.lines[i].zhi) >= 0);
    const qinShuai = (q) => qinIdx(q).some(i => { const w = DWX[g.lines[i].zhi]; const wn = C.sheng[DWX[dayZhi]] === w || C.sheng[DWX[monthZhi]] === w || g.lines[i].zhi === dayZhi || g.lines[i].zhi === monthZhi; return !wn && (xk.indexOf(g.lines[i].zhi) >= 0 || C.yue_po[monthZhi] === g.lines[i].zhi); });
    const qinMu = (q) => qinIdx(q).some(i => { const cs = lyChang(DWX[g.lines[i].zhi], dayZhi); return cs && cs.name === '墓'; });
    const qinJue = (q) => qinIdx(q).some(i => { const cs = lyChang(DWX[g.lines[i].zhi], dayZhi); return cs && cs.name === '绝'; });
    const qinShen = (q, s) => qinIdx(q).some(i => liuShen(i) === s);
    const qinMuFa = (q) => qinIdx(q).some(i => { const cs = lyChang(DWX[g.lines[i].zhi], monthZhi); return cs && cs.name === '墓'; });
    const qinJueFa = (q) => qinIdx(q).some(i => { const cs = lyChang(DWX[g.lines[i].zhi], monthZhi); return cs && cs.name === '绝'; });
    const dongQin = (i) => g.lines[i].qin;
    const huaQin = (i) => vg ? vg.lines[i].qin : '';
    const huaTo = (q, q2) => dongYaos.some(i => dongQin(i) === q && huaQin(i) === q2);
    const isChong = (g2) => g2.lines.every((l, i) => C.chong[l.zhi] === vg.lines[i].zhi);
    const isFanYin = vg && g.lines.every((l, i) => C.chong[l.zhi] === vg.lines[i].zhi);
    const shenShi = liuShen(g.shi - 1), shenYing = liuShen(g.ying - 1);
    const shiQin = sw.qin, yingQin = yw.qin;
    const kongShi = xk.indexOf(sw.zhi) >= 0, kongYing = xk.indexOf(yw.zhi) >= 0;
    const shiWang = C.sheng[DWX[dayZhi]] === sW || C.sheng[DWX[monthZhi]] === sW || sw.zhi === dayZhi || sw.zhi === monthZhi;
    const shiShuai = !shiWang && (kongShi || C.yue_po[monthZhi] === sw.zhi || (keDay === sW && keMon === sW));
    const yingWang = C.sheng[DWX[dayZhi]] === yW || C.sheng[DWX[monthZhi]] === yW || yw.zhi === dayZhi || yw.zhi === monthZhi;
    const shiMu = (() => { const cs = lyChang(sW, dayZhi); return cs && cs.name === '墓'; })();
    const shiJue = (() => { const cs = lyChang(sW, dayZhi); return cs && cs.name === '绝'; })();
    const shiKeYing = C.ke[sW] === yW, yingKeShi = C.ke[yW] === sW;
    const shiShengYing = C.sheng[sW] === yW, yingShengShi = C.sheng[yW] === sW;
    const shiYingHe = C.he[sw.zhi] === yw.zhi || C.he[yw.zhi] === sw.zhi;
    const shiYingChong = C.chong[sw.zhi] === yw.zhi || C.chong[yw.zhi] === sw.zhi;
    const shiDong = yaos[g.shi - 1].dong, yingDong = yaos[g.ying - 1].dong;
    const dongKeShi = dongYaos.some(i => C.ke[DWX[g.lines[i].zhi]] === sW);
    const dongKeYing = dongYaos.some(i => C.ke[DWX[g.lines[i].zhi]] === yW);
    const keShiDay = keDay === sW, keShiMon = keMon === sW;
    // 八宫游魂/归魂卦名（每宫第 7/第 8 卦）
    const YOUHUN = { '火地晋': 1, '地水师': 1, '风泽中孚': 1, '水风井': 1, '山雷颐': 1, '天水讼': 1, '泽天夬': 1, '雷山小过': 1 };
    const GUIHUN = { '火天大有': 1, '水地比': 1, '风山渐': 1, '泽风大过': 1, '山风蛊': 1, '天火同人': 1, '水天需': 1, '雷泽归妹': 1 };
    const youhun = YOUHUN[g.name] ? true : false;
    const guihun = GUIHUN[g.name] ? true : false;
    // 六神名
    const S6 = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
    // ── 组合条件（先长后短）──
    if (cond.indexOf('世应比和官鬼动') >= 0) return !shiKeYing && !yingKeShi && !shiShengYing && !yingShengShi && hasDong('官鬼');
    if (cond.indexOf('卦爻安静子孙兴') >= 0) return dongN === 0 && (hasQin('子孙') && (qinWang('子孙') || shiQin === '子孙'));
    if (cond.indexOf('妻财父母同动') >= 0 || cond.indexOf('财父同兴') >= 0) return hasDong('妻财') && hasDong('父母');
    if (cond.indexOf('财旺福兴') >= 0) return qinWang('妻财') && qinWang('子孙');
    if (cond.indexOf('财空福绝') >= 0) return qinKong('妻财') && qinShuai('子孙');
    if (cond.indexOf('财福俱无') >= 0) return !hasQin('妻财') && !hasQin('子孙');
    if (cond.indexOf('父兄皆动') >= 0 || cond.indexOf('父兄同动') >= 0) return hasDong('父母') && hasDong('兄弟');
    if (cond.indexOf('妻财官鬼空亡') >= 0) return qinKong('妻财') && qinKong('官鬼');
    if (cond.indexOf('官父两强') >= 0) return qinWang('官鬼') && qinWang('父母');
    if (cond.indexOf('财官临帝旺') >= 0) return qinIdx('妻财').some(i => g.lines[i].zhi === dayZhi || g.lines[i].zhi === monthZhi) || qinIdx('官鬼').some(i => g.lines[i].zhi === dayZhi || g.lines[i].zhi === monthZhi);
    if (cond.indexOf('鬼作问官克应') >= 0) return hasQin('官鬼') && dongKeYing;
    if (cond.indexOf('日为书吏伤身') >= 0) return keShiDay || keShiMon;
    if (cond.indexOf('世应俱空') >= 0) return kongShi && kongYing;
    if (cond.indexOf('应财世鬼') >= 0) return yingQin === '妻财' && shiQin === '官鬼';
    if (cond.indexOf('应鬼世财') >= 0) return yingQin === '官鬼' && shiQin === '妻财';
    if (cond.indexOf('世持子而被伤') >= 0) return shiQin === '子孙' && (dongKeShi || keShiDay || keShiMon);
    if (cond.indexOf('应临官而遭克') >= 0) return yingQin === '官鬼' && (dongKeYing || keDay === yW || keMon === yW);
    if (cond.indexOf('官鬼临身') >= 0 || cond.indexOf('鬼临应爻克世') >= 0) return (shiQin === '官鬼') || (yingQin === '官鬼' && yingKeShi);
    if (cond.indexOf('子孙临身') >= 0) return shiQin === '子孙';
    if (cond.indexOf('子孙空亡临白虎') >= 0 || cond.indexOf('子孙空亡加白虎') >= 0) return qinKong('子孙') && qinShen('子孙', '白虎');
    if (cond.indexOf('妻财带鬼空亡') >= 0) return huaTo('妻财', '官鬼') && qinKong('妻财');
    if (cond.indexOf('妻财旺相入墓') >= 0) return qinWang('妻财') && qinMu('妻财');
    if (cond.indexOf('白虎临官鬼发动') >= 0 || cond.indexOf('交重白虎临鬼') >= 0) return qinShen('官鬼', '白虎') && hasDong('官鬼');
    if (cond.indexOf('玄武带鬼临应') >= 0) return yingQin === '官鬼' && qinShen('官鬼', '玄武');
    if (cond.indexOf('玄武临官鬼动') >= 0) return qinShen('官鬼', '玄武') && hasDong('官鬼');
    if (cond.indexOf('螣蛇带鬼持世') >= 0) return shiQin === '官鬼' && shenShi === '螣蛇';
    if (cond.indexOf('螣蛇御世') >= 0) return shenShi === '螣蛇';
    if (cond.indexOf('雀虎持世') >= 0) return shenShi === '朱雀' || shenShi === '白虎';
    if (cond.indexOf('玄武当官') >= 0) return qinShen('官鬼', '玄武');
    if (cond.indexOf('勾陈临官鬼') >= 0) return qinShen('官鬼', '勾陈');
    if (cond.indexOf('勾陈持世') >= 0) return shenShi === '勾陈';
    if (cond.indexOf('青龙临子孙') >= 0) return qinShen('子孙', '青龙');
    if (cond.indexOf('青龙临妻财') >= 0) return qinShen('妻财', '青龙');
    if (cond.indexOf('白虎临父母') >= 0) return qinShen('父母', '白虎');
    if (cond.indexOf('白虎临兄弟') >= 0) return qinShen('兄弟', '白虎');
    if (cond.indexOf('白虎临子孙') >= 0) return qinShen('子孙', '白虎');
    if (cond.indexOf('朱雀临兄弟') >= 0) return qinShen('兄弟', '朱雀');
    if (cond.indexOf('朱雀带官鬼') >= 0 || cond.indexOf('朱雀临官鬼') >= 0) return qinShen('官鬼', '朱雀');
    if (cond.indexOf('鬼动合身') >= 0) return hasDong('官鬼') && (C.he[g.lines[dongYaos.find(i => g.lines[i].qin === '官鬼')].zhi] === sw.zhi);
    if (cond.indexOf('应鬼合身') >= 0) return yingQin === '官鬼' && (C.he[yw.zhi] === sw.zhi || C.sheng[yW] === sW);
    if (cond.indexOf('鬼逢冲散') >= 0) return qinIdx('官鬼').some(i => C.chong[dayZhi] === g.lines[i].zhi);
    if (cond.indexOf('鬼动逢日破') >= 0) return hasDong('官鬼') && qinIdx('官鬼').some(i => C.yue_po[dayZhi] === g.lines[i].zhi);
    if (cond.indexOf('鬼衰遇生扶') >= 0) return qinShuai('官鬼') && dongYaos.some(i => C.sheng[DWX[g.lines[i].zhi]] === DWX[qinIdx('官鬼')[0].zhi]);
    if (cond.indexOf('子旺遭克制') >= 0) return qinWang('子孙') && qinIdx('子孙').some(i => dongKeShi && dongQin(dongYaos.find(j => C.ke[DWX[g.lines[j].zhi]] === sW)) === '父母');
    if (cond.indexOf('世动逢空') >= 0) return shiDong && kongShi;
    if (cond.indexOf('世逢绝地') >= 0) return shiJue;
    if (cond.indexOf('身入墓爻') >= 0 || cond.indexOf('世入墓') >= 0) return shiMu;
    if (cond.indexOf('世克用') >= 0) return C.ke[sW] === dwx;
    if (cond.indexOf('用神克世') >= 0 || cond.indexOf('用克世') >= 0) return C.ke[dwx] === sW;
    if (cond.indexOf('用神生世') >= 0 || cond.indexOf('用生世') >= 0) return C.sheng[dwx] === sW;
    if (cond.indexOf('用合世') >= 0 || cond.indexOf('用如合世') >= 0) return C.he[yl.zhi] === sw.zhi || C.he[sw.zhi] === yl.zhi;
    if (cond.indexOf('财来就世') >= 0) return C.sheng[DWX[qinIdx('妻财')[0] && g.lines[qinIdx('妻财')[0]].zhi]] === sW || C.he[g.lines[qinIdx('妻财')[0]].zhi] === sw.zhi;
    if (cond.indexOf('财伏应下世合') >= 0) return !hasQin('妻财') && (C.he[sw.zhi] === yw.zhi || C.sheng[sW] === yW);
    if (cond.indexOf('鬼在空中世动') >= 0) return qinKong('官鬼') && shiDong;
    if (cond.indexOf('用爻自空化空') >= 0) return kong && (vg && (C.xunkong[ctx.day] || '').indexOf(vg.lines[Math.max(ys, 0)].zhi) >= 0);
    if (cond.indexOf('日旺月旺') >= 0) return yl.zhi === dayZhi || yl.zhi === monthZhi;
    if (cond.indexOf('财爻发动入墓') >= 0) return hasDong('妻财') && qinMu('妻财');
    if (cond.indexOf('财临虎动') >= 0) return qinShen('妻财', '白虎') && hasDong('妻财');
    if (cond.indexOf('财临帝旺') >= 0) return qinIdx('妻财').some(i => g.lines[i].zhi === dayZhi || g.lines[i].zhi === monthZhi);
    if (cond.indexOf('日辰带鬼') >= 0) return qinIdx('官鬼').some(i => g.lines[i].zhi === dayZhi);
    if (cond.indexOf('日辰合住') >= 0) return qinIdx('妻财').some(i => C.he[dayZhi] === g.lines[i].zhi || C.he[g.lines[i].zhi] === dayZhi);
    if (cond.indexOf('日辰冲克') >= 0) return keShiDay || keShiMon || dongKeShi;
    if (cond.indexOf('用临死绝') >= 0 || cond.indexOf('原临死绝') >= 0) return qinJue('子孙') || qinMuFa('子孙') || shuai;
    if (cond.indexOf('用得长生') >= 0) return qinIdx('子孙').some(i => { const cs = lyChang(DWX[g.lines[i].zhi], dayZhi); return cs && cs.name === '长生'; });
    if (cond.indexOf('死绝之鬼') >= 0) return qinJue('官鬼') || qinShuai('官鬼');
    if (cond.indexOf('长生之爻') >= 0) return qinIdx('子孙').some(i => { const cs = lyChang(DWX[g.lines[i].zhi], dayZhi); return cs && cs.name === '长生'; });
    if (cond.indexOf('鬼化长生') >= 0) return dongYaos.some(i => { if (g.lines[i].qin !== '官鬼' || !vg) return false; const cs = lyChang(DWX[g.lines[i].zhi], vg.lines[i].zhi); return cs && cs.name === '长生'; });
    if (cond.indexOf('鬼化福') >= 0) return huaTo('官鬼', '子孙');
    if (cond.indexOf('鬼化子孙') >= 0) return huaTo('官鬼', '子孙');
    if (cond.indexOf('子化鬼') >= 0) return huaTo('子孙', '官鬼');
    if (cond.indexOf('财化子孙') >= 0 || cond.indexOf('母化子孙') >= 0) return huaTo('妻财', '子孙') || huaTo('父母', '子孙');
    if (cond.indexOf('官化官') >= 0) return huaTo('官鬼', '官鬼');
    if (cond.indexOf('子化子') >= 0) return huaTo('子孙', '子孙');
    if (cond.indexOf('福化忌') >= 0) return huaTo('子孙', qinOfWx6(C.ke[dwx], gongWx));
    if (cond.indexOf('父化兄') >= 0) return huaTo('父母', '兄弟');
    if (cond.indexOf('财化鬼') >= 0) return huaTo('妻财', '官鬼');
    if (cond.indexOf('父化财') >= 0) return huaTo('父母', '妻财');
    if (cond.indexOf('鬼连兄煞') >= 0) return qinIdx('官鬼').some(i => { const w = DWX[g.lines[i].zhi]; return C.sheng[w] === DWX[qinIdx('兄弟')[0] && g.lines[qinIdx('兄弟')[0]].zhi] || w === DWX[qinIdx('兄弟')[0] && g.lines[qinIdx('兄弟')[0]].zhi]; });
    // 化爻（动爻变出同六亲）
    if (cond.indexOf('化鬼') >= 0 && cond.indexOf('用神') >= 0) return false;
    // 六亲 + 发动
    if (cond.indexOf('妻财发动') >= 0 || cond.indexOf('财动') >= 0) return hasDong('妻财');
    if (cond.indexOf('父母交重') >= 0 || cond.indexOf('父母发动') >= 0 || cond.indexOf('父动') >= 0) return hasDong('父母');
    if (cond.indexOf('官鬼发动') >= 0 || cond.indexOf('官动') >= 0 || cond.indexOf('鬼动') >= 0 || cond.indexOf('官爻交重') >= 0) return hasDong('官鬼');
    if (cond.indexOf('兄弟发动') >= 0 || cond.indexOf('兄动') >= 0 || cond.indexOf('兄兴') >= 0) return hasDong('兄弟');
    if (cond.indexOf('子孙发动') >= 0 || cond.indexOf('子动') >= 0 || cond.indexOf('子发') >= 0 || cond.indexOf('子孙交重') >= 0) return hasDong('子孙');
    // 六亲 + 旺相 / 空亡 / 休囚
    if (cond.indexOf('妻财旺相') >= 0 || cond.indexOf('财旺') >= 0 || cond.indexOf('财爻旺相') >= 0) return qinWang('妻财');
    if (cond.indexOf('父母旺相') >= 0 || cond.indexOf('父旺') >= 0) return qinWang('父母');
    if (cond.indexOf('官鬼旺相') >= 0 || cond.indexOf('官旺') >= 0 || cond.indexOf('鬼旺') >= 0 || cond.indexOf('鬼位兴隆') >= 0 || cond.indexOf('官爻旺相') >= 0) return qinWang('官鬼');
    if (cond.indexOf('兄弟旺相') >= 0 || cond.indexOf('兄旺') >= 0) return qinWang('兄弟');
    if (cond.indexOf('子孙旺相') >= 0 || cond.indexOf('子旺') >= 0 || cond.indexOf('福德兴') >= 0 || cond.indexOf('子孙得地') >= 0) return qinWang('子孙');
    if (cond.indexOf('妻财空亡') >= 0 || cond.indexOf('财空') >= 0 || cond.indexOf('财爻空亡') >= 0) return qinKong('妻财');
    if (cond.indexOf('父母空亡') >= 0 || cond.indexOf('父空') >= 0) return qinKong('父母');
    if (cond.indexOf('官鬼空亡') >= 0 || cond.indexOf('官空') >= 0 || cond.indexOf('鬼空') >= 0) return qinKong('官鬼');
    if (cond.indexOf('子孙空亡') >= 0 || cond.indexOf('子空') >= 0 || cond.indexOf('福空') >= 0) return qinKong('子孙');
    if (cond.indexOf('兄弟空亡') >= 0 || cond.indexOf('兄空') >= 0) return qinKong('兄弟');
    if (cond.indexOf('妻财休囚') >= 0 || cond.indexOf('财衰') >= 0) return qinShuai('妻财');
    if (cond.indexOf('子孙休囚') >= 0 || cond.indexOf('福衰') >= 0) return qinShuai('子孙');
    if (cond.indexOf('官鬼休囚') >= 0 || cond.indexOf('官衰') >= 0) return qinShuai('官鬼');
    if (cond.indexOf('世爻休囚') >= 0 || cond.indexOf('世衰') >= 0) return shiShuai;
    // 六亲 + 持世
    if (cond.indexOf('妻财持世') >= 0 || cond.indexOf('财持世') >= 0) return shiQin === '妻财';
    if (cond.indexOf('父母持世') >= 0 || cond.indexOf('父持世') >= 0 || cond.indexOf('父母持身') >= 0) return shiQin === '父母';
    if (cond.indexOf('鬼爻持世') >= 0 || cond.indexOf('官鬼持世') >= 0 || cond.indexOf('鬼持世') >= 0 || cond.indexOf('世持鬼') >= 0) return shiQin === '官鬼';
    if (cond.indexOf('兄弟持世') >= 0 || cond.indexOf('兄持世') >= 0 || cond.indexOf('兄临身') >= 0) return shiQin === '兄弟';
    if (cond.indexOf('子孙持世') >= 0 || cond.indexOf('子持世') >= 0 || cond.indexOf('福德临身') >= 0) return shiQin === '子孙';
    // 六亲 + 临六神
    if (cond.indexOf('官加蛇雀') >= 0) return qinShen('官鬼', '螣蛇') || qinShen('官鬼', '朱雀');
    if (cond.indexOf('白虎临官鬼') >= 0) return qinShen('官鬼', '白虎');
    if (cond.indexOf('白虎临水') >= 0) return qinIdx('兄弟').some(i => DWX[g.lines[i].zhi] === '水' && liuShen(i) === '白虎') || qinIdx('妻财').some(i => DWX[g.lines[i].zhi] === '水' && liuShen(i) === '白虎');
    if (cond.indexOf('玄武临官鬼') >= 0) return qinShen('官鬼', '玄武');
    if (cond.indexOf('玄武合官鬼') >= 0) return qinShen('官鬼', '玄武') || (yingQin === '官鬼' && shenYing === '玄武');
    if (cond.indexOf('青龙临子孙发动') >= 0) return qinShen('子孙', '青龙') && hasDong('子孙');
    if (cond.indexOf('青龙临子孙') >= 0) return qinShen('子孙', '青龙');
    if (cond.indexOf('玄武入水') >= 0) return qinIdx('官鬼').some(i => DWX[g.lines[i].zhi] === '水' && liuShen(i) === '玄武');
    // 六亲 + 入墓 / 绝 / 月建 / 伏藏
    if (cond.indexOf('官鬼墓绝') >= 0 || cond.indexOf('官如墓绝') >= 0 || cond.indexOf('鬼墓绝') >= 0) return qinMu('官鬼') || qinJue('官鬼') || qinMuFa('官鬼') || qinJueFa('官鬼');
    if (cond.indexOf('官鬼入墓') >= 0 || cond.indexOf('鬼入墓') >= 0 || cond.indexOf('鬼墓') >= 0) return qinMu('官鬼') || qinMuFa('官鬼');
    if (cond.indexOf('鬼临墓库') >= 0 || cond.indexOf('用临墓库') >= 0) return qinMu('官鬼') || qinMuFa('官鬼') || qinMu('子孙') || qinMuFa('子孙');
    if (cond.indexOf('鬼伏空亡') >= 0) return !hasQin('官鬼') && qinKong('官鬼') || (kong && !hasQin('官鬼'));
    if (cond.indexOf('官鬼伏藏') >= 0 || cond.indexOf('官爻隐伏') >= 0 || cond.indexOf('官鬼不现') >= 0 || cond.indexOf('鬼不出现') >= 0 || cond.indexOf('鬼伏卦中') >= 0 || cond.indexOf('官藏世下') >= 0) return !hasQin('官鬼');
    if (cond.indexOf('子孙伏藏') >= 0 || cond.indexOf('子伏') >= 0) return !hasQin('子孙');
    if (cond.indexOf('父母伏藏') >= 0 || cond.indexOf('父伏') >= 0) return !hasQin('父母');
    if (cond.indexOf('妻财伏藏') >= 0 || cond.indexOf('财伏') >= 0) return !hasQin('妻财');
    if (cond.indexOf('官鬼临应') >= 0 || cond.indexOf('官临应') >= 0) return yingQin === '官鬼';
    if (cond.indexOf('子孙临应') >= 0) return yingQin === '子孙';
    if (cond.indexOf('官鬼临世下') >= 0) return shiQin === '官鬼' || (hasQin('官鬼') && qinIdx('官鬼').some(i => i === g.shi - 1));
    if (cond.indexOf('父母持月建') >= 0) return qinIdx('父母').some(i => g.lines[i].zhi === monthZhi);
    if (cond.indexOf('官临月建') >= 0 || cond.indexOf('月值官爻') >= 0) return qinIdx('官鬼').some(i => g.lines[i].zhi === monthZhi);
    if (cond.indexOf('财临月建') >= 0) return qinIdx('妻财').some(i => g.lines[i].zhi === monthZhi);
    if (cond.indexOf('子孙临月建') >= 0) return qinIdx('子孙').some(i => g.lines[i].zhi === monthZhi);
    if (cond.indexOf('官临日月') >= 0 || cond.indexOf('鬼临日月') >= 0) return qinIdx('官鬼').some(i => g.lines[i].zhi === dayZhi || g.lines[i].zhi === monthZhi);
    // 世应关系
    if (cond.indexOf('世克应') >= 0) return shiKeYing;
    if (cond.indexOf('应克世') >= 0 || cond.indexOf('应伤世') >= 0) return yingKeShi;
    if (cond.indexOf('应生世') >= 0 || cond.indexOf('应去生扶') >= 0) return yingShengShi;
    if (cond.indexOf('世生应') >= 0) return shiShengYing;
    if (cond.indexOf('世应相生') >= 0) return shiShengYing || yingShengShi;
    if (cond.indexOf('世应相冲') >= 0) return shiYingChong;
    if (cond.indexOf('世应比和') >= 0) return !shiKeYing && !yingKeShi && !shiShengYing && !yingShengShi;
    if (cond.indexOf('世应相合') >= 0) return shiYingHe;
    // 世应状态
    if (cond.indexOf('世爻旺相') >= 0 || cond.indexOf('世旺') >= 0 || cond.indexOf('应位兴隆') >= 0) return shiWang || yingWang;
    if (cond.indexOf('世爻空亡') >= 0 || cond.indexOf('世空') >= 0) return kongShi;
    if (cond.indexOf('应爻空亡') >= 0 || cond.indexOf('应空') >= 0) return kongYing;
    if (cond.indexOf('应爻发动') >= 0 || cond.indexOf('应动') >= 0) return yingDong;
    if (cond.indexOf('世爻发动') >= 0 || cond.indexOf('世动') >= 0) return shiDong;
    if (cond.indexOf('世爻受克') >= 0 || cond.indexOf('世遭刑克') >= 0 || cond.indexOf('世受刑伤') >= 0) return dongKeShi || keShiDay || keShiMon;
    if (cond.indexOf('世爻受冲克') >= 0) return shiYingChong || dongKeShi || keShiDay || keShiMon;
    if (cond.indexOf('鬼克世') >= 0 || cond.indexOf('官鬼克世') >= 0) return hasDong('官鬼') && dongYaos.some(i => g.lines[i].qin === '官鬼' && C.ke[DWX[g.lines[i].zhi]] === sW) || (keShiDay && qinWang('官鬼'));
    if (cond.indexOf('鬼克身') >= 0 || cond.indexOf('鬼克身爻') >= 0) return hasDong('官鬼') && dongYaos.some(i => g.lines[i].qin === '官鬼' && C.ke[DWX[g.lines[i].zhi]] === sW) || (keShiDay && qinWang('官鬼'));
    if (cond.indexOf('水鬼克身') >= 0) return qinIdx('官鬼').some(i => DWX[g.lines[i].zhi] === '水' && (dongKeShi || keShiDay || keShiMon));
    if (cond.indexOf('火官持世') >= 0) return shiQin === '官鬼' && sW === '火';
    if (cond.indexOf('火动克身') >= 0) return dongYaos.some(i => DWX[g.lines[i].zhi] === '火' && C.ke[DWX[g.lines[i].zhi]] === sW);
    if (cond.indexOf('水兴伤世') >= 0) return dongYaos.some(i => DWX[g.lines[i].zhi] === '水' && C.ke[DWX[g.lines[i].zhi]] === sW);
    if (cond.indexOf('子孙受刑害') >= 0 || cond.indexOf('福临刑害') >= 0) return qinIdx('子孙').some(i => { const z = g.lines[i].zhi; const xing = C.xing || {}, hai = C.hai || {}; return Object.keys(xing).some(k => xing[k] === z) || Object.keys(hai).some(k => hai[k] === z); });
    if (cond.indexOf('鬼动逢日破') >= 0) return hasDong('官鬼') && qinIdx('官鬼').some(i => C.yue_po[dayZhi] === g.lines[i].zhi);
    // 用神状态
    if (cond.indexOf('用爻发动') >= 0 || cond.indexOf('用神发动') >= 0 || cond.indexOf('主象交重') >= 0) return yaos[Math.max(ys, 0)].dong;
    if (cond.indexOf('用爻安静') >= 0 || cond.indexOf('用神安静') >= 0 || cond.indexOf('妻财安静') >= 0) return !yaos[Math.max(ys, 0)].dong;
    if (cond.indexOf('用神空亡') >= 0 || cond.indexOf('用爻空亡') >= 0 || cond.indexOf('用神临空') >= 0) return kong;
    if (cond.indexOf('用神入墓') >= 0 || cond.indexOf('用爻入墓') >= 0 || cond.indexOf('用无救又入墓') >= 0 || cond.indexOf('用入墓') >= 0) return qinMu(yl.qin);
    if (cond.indexOf('用居弱地') >= 0 || cond.indexOf('用神衰弱') >= 0) return shuai;
    if (cond.indexOf('用居旺乡') >= 0 || cond.indexOf('用神旺相') >= 0 || cond.indexOf('用神得地') >= 0) return wang;
    if (cond.indexOf('用神伏藏') >= 0 || cond.indexOf('主象伏藏') >= 0) return !hasQin(yl.qin);
    if (cond.indexOf('用临午') >= 0) return yl.zhi === '午';
    if (cond.indexOf('用化寅') >= 0) return yaos[Math.max(ys, 0)].dong && vg && vg.lines[Math.max(ys, 0)].zhi === '寅';
    if (cond.indexOf('用临震宫木') >= 0) return g.gong === '震' && dwx === '木';
    if (cond.indexOf('用临兑宫金') >= 0) return g.gong === '兑' && dwx === '金';
    if (cond.indexOf('用神克世') >= 0) return C.ke[dwx] === sW;
    // 卦象
    if (cond.indexOf('八纯卦') >= 0 || cond.indexOf('八纯') >= 0) return isLiuChong6(g);
    if (cond.indexOf('六冲卦') >= 0 || cond.indexOf('卦遇六冲') >= 0 || cond.indexOf('卦见六冲') >= 0) return isLiuChong6(g);
    if (cond.indexOf('六合卦') >= 0 || cond.indexOf('爻逢六合') >= 0 || cond.indexOf('爻当六合') >= 0) return isLiuHe6(g);
    if (cond.indexOf('六爻安静') >= 0) return dongN === 0;
    if (cond.indexOf('六爻乱动') >= 0 || cond.indexOf('六爻俱动') >= 0) return dongN >= 4;
    if (cond.indexOf('一卦无孙') >= 0 || cond.indexOf('一卦无子') >= 0) return !hasQin('子孙');
    if (cond.indexOf('一卦无鬼') >= 0 || cond.indexOf('一卦无官') >= 0) return !hasQin('官鬼');
    if (cond.indexOf('一卦无财') >= 0 || cond.indexOf('卦内无财') >= 0) return !hasQin('妻财');
    if (cond.indexOf('一卦无父') >= 0) return !hasQin('父母');
    if (cond.indexOf('游魂') >= 0) return youhun;
    if (cond.indexOf('归魂') >= 0) return guihun;
    // 其他
    if (cond.indexOf('兄如太过') >= 0) return qinIdx('兄弟').length >= 3;
    if (cond.indexOf('兄爻持世') >= 0) return shiQin === '兄弟';
    if (cond.indexOf('财爻发动') >= 0) return hasDong('妻财');
    if (cond.indexOf('父动') >= 0) return hasDong('父母');
    if (cond.indexOf('官鬼发动') >= 0) return hasDong('官鬼');
    if (cond.indexOf('鬼伏空亡') >= 0) return !hasQin('官鬼');
    if (cond.indexOf('龙为舟尾') >= 0) return false;
    return false;
  }
  // 五行 → 六亲（以宫五行为"我"：同我兄弟、我生子孙、我克妻财、生我父母、克我官鬼）
  function qinOfWx6(wx, gongWx) {
    const C = D.liuyao.core;
    if (wx === gongWx) return '兄弟';
    if (C.sheng[gongWx] === wx) return '子孙';
    if (C.ke[gongWx] === wx) return '妻财';
    if (C.sheng[wx] === gongWx) return '父母';
    return '官鬼';
  }
  function ruMuCheck(ctx) {
    const C = D.liuyao.core;
    const yl = ctx.g.lines[ctx.ys];
    const cs = lyChang(DWX[yl.zhi], ctx.dayZhi);
    return cs && cs.name === '墓';
  }
  // 千金赋可机判条目清单（与 lyQianjinHits 的 push 分支一一对应；清单外 = 不可机判原文备查）
  const LY_QJ_JUDGED = new Set(['世应生合比和','变爻回头克冲刑害','代占应位遭伤','自占世爻受制','世应俱空','内外竞发（多爻乱动）','世爻发动','应爻发动','用爻有气无他故','主象徒存更被伤','用爻被动爻/日辰克害','无刑冲克害而自落空亡','空爻逢冲','合遭刑冲克害破','用神自空或动化空','合中有刑克','动爻遇合','静爻被日辰冲','动爻入墓','旺相爻值旬空','用神衰弱得生扶','贪生贪合','动静刑冲','爻遇令星','用爻休囚又受制','日辰伤爻','用爻入墓','世爻临官鬼凶杀','天干地支皆合','忌爻临身世','用爻被克而值空','忌爻发动得比肩帮用','用神休囚见刑冲克害','用爻动化死墓绝空','卦中有用又化出用','动爻空亡化出亦空','主象化入养爻','凶爻入墓','主象化出病爻','主象化入胎爻','凶爻化入长生','用爻化入沐浴','用爻化忌神回头克','主事爻反生合应爻','忌神孤立无气','用爻重叠太过','间爻发动','世自落空','交重之分','寅化卯为进，卯化寅为退','日辰动爻生合世身但系忌神','主事爻克世','刑爻害爻临用神','死绝临持世身主象','动爻逢冲','世身主象临死绝遇生扶','用爻合住','用爻休囚','用爻动来生世/克世','卦无父母','卦无子孙','官鬼宜静不宜动','子孙重叠太多','卦身两现']);
  // 千金赋不可机判条目（伏神三连 / 旺衰相克等）：默认折叠展示原文，供查阅
  function lyQjUnjudged() {
    const DU = D.liuyao.duanyu;
    return (DU.qianjin || []).filter(x => !LY_QJ_JUDGED.has(x.cond));
  }
  // 千金赋 68 条通用命中器（条件→断语；需综合权衡的条如实跳过，不硬凑）
  function lyQianjinHits(g, vg, ys, yaos, day, dayZhi, monthZhi, xk, dongN, shiQin, four, ctx) {
    const C = D.liuyao.core, DU = D.liuyao.duanyu;
    const qj = DU.qianjin || [];
    const yl = g.lines[ys];
    const dwx = DWX[yl.zhi];
    const gwx = C.gong_wx[g.gong];
    const hits = [];
    const push = (cond) => { const row = qj.find(x => x.cond === cond); if (row) hits.push({ cond: cond, duan: row.duan }); };
    const kong = xk.indexOf(yl.zhi) >= 0;
    const po = C.yue_po[monthZhi] === yl.zhi;
    const csDay = lyChang(dwx, dayZhi), csMon = lyChang(dwx, monthZhi);
    const muDay = csDay && csDay.name === '墓', muMon = csMon && csMon.name === '墓';
    const jueDay = csDay && csDay.name === '绝', jueMon = csMon && csMon.name === '绝';
    const shengDay = C.sheng[DWX[dayZhi]], keDay = C.ke[DWX[dayZhi]];
    const shengMon = C.sheng[DWX[monthZhi]], keMon = C.ke[DWX[monthZhi]];
    const wang = shengDay === dwx || shengMon === dwx || yl.zhi === dayZhi || yl.zhi === monthZhi;
    const shuai = !wang && (kong || po || (keDay === dwx && keMon === dwx));
    const sw = g.lines[g.shi - 1], yw = g.lines[g.ying - 1];
    const shengSW = C.sheng[DWX[sw.zhi]] === DWX[yw.zhi] || C.sheng[DWX[yw.zhi]] === DWX[sw.zhi];
    const keSW = C.ke[DWX[sw.zhi]] === DWX[yw.zhi] || C.ke[DWX[yw.zhi]] === DWX[sw.zhi];
    const jiShenWx = C.ke[dwx];
    const jiQin = qinOfWx6(jiShenWx, gwx), yuanQin = qinOfWx6(C.sheng[dwx], gwx);
    const hasDong = (q) => yaos.some((y, i) => y.dong && g.lines[i].qin === q);
    const hasQin = (q) => g.lines.some(l => l.qin === q);
    const dongYaos = yaos.map((y, i) => y.dong ? i : -1).filter(i => i >= 0);
    const fourKe = four ? four.hits.filter(h => h.kind === '克') : [];
    const fourChong = four ? four.hits.filter(h => h.kind === '冲') : [];
    const fourSheng = four ? four.hits.filter(h => h.kind === '生') : [];
    const xing = C.xing || {}, hai = C.hai || {};
    const GH = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
    const heDay = C.he[dayZhi] === yl.zhi || C.he[yl.zhi] === dayZhi;
    const heMon = C.he[monthZhi] === yl.zhi || C.he[yl.zhi] === monthZhi;
    const chongDay = C.chong[dayZhi] === yl.zhi || C.chong[yl.zhi] === dayZhi;
    const chongMon = C.chong[monthZhi] === yl.zhi || C.chong[yl.zhi] === monthZhi;
    const xingOnYl = (xing[dayZhi] === yl.zhi) || (xing[monthZhi] === yl.zhi) || dongYaos.some(i => xing[g.lines[i].zhi] === yl.zhi);
    const haiOnYl = (hai[dayZhi] === yl.zhi) || (hai[monthZhi] === yl.zhi) || dongYaos.some(i => hai[g.lines[i].zhi] === yl.zhi);
    const jianDong = (() => { for (let i = Math.min(g.shi, g.ying); i < Math.max(g.shi, g.ying) - 1; i++) if (yaos[i].dong) return true; return false; })();
    const gsPos = { 子: 0, 午: 0, 丑: 1, 未: 1, 寅: 2, 申: 2, 卯: 3, 酉: 3, 辰: 4, 戌: 4, 巳: 5, 亥: 5 }[g.lines[g.shi - 1].zhi];
    const shenLine = gsPos != null ? g.lines[gsPos] : null;
    if (shengSW && !keSW) push('世应生合比和');
    if (yaos[ys].dong && vg && (C.ke[DWX[vg.lines[ys].zhi]] === dwx || C.chong[vg.lines[ys].zhi] === yl.zhi)) push('变爻回头克冲刑害');
    if (ctx.yongshenSel === '应' && (keDay === DWX[yw.zhi] || keMon === DWX[yw.zhi] || dongYaos.some(i => C.ke[DWX[g.lines[i].zhi]] === DWX[yw.zhi]))) push('代占应位遭伤');
    if (ctx.yongshenSel === '世' && (keDay === DWX[sw.zhi] || keMon === DWX[sw.zhi] || dongYaos.some(i => C.ke[DWX[g.lines[i].zhi]] === DWX[sw.zhi]))) push('自占世爻受制');
    if (kong && (C.xunkong[day] || '').indexOf(sw.zhi) >= 0) push('世应俱空');
    if (dongN >= 4) push('内外竞发（多爻乱动）');
    if (yaos[g.shi - 1].dong) push('世爻发动');
    if (yaos[g.ying - 1].dong) push('应爻发动');
    if (!kong && !fourKe.length && !fourChong.length) push('用爻有气无他故');
    if (kong && (fourKe.length || fourChong.length)) push('主象徒存更被伤');
    if (fourKe.some(h => h.src.indexOf('动爻') >= 0 || h.src.indexOf('日辰') >= 0)) push('用爻被动爻/日辰克害');
    if (kong && !fourKe.length && !fourChong.length && !heDay && !heMon) push('无刑冲克害而自落空亡');
    if (kong && chongDay) push('空爻逢冲');
    if ((heDay || heMon) && (fourKe.length || chongDay || chongMon || po)) push('合遭刑冲克害破');
    if (kong || (yaos[ys].dong && vg && (C.xunkong[day] || '').indexOf(vg.lines[ys].zhi) >= 0)) push('用神自空或动化空');
    if ((heDay || heMon) && (fourKe.length || xingOnYl)) push('合中有刑克');
    if (yaos[ys].dong && heDay) push('动爻遇合');
    if (!yaos[ys].dong && chongDay) push('静爻被日辰冲');
    if (yaos[ys].dong && muDay) push('动爻入墓');
    if (kong && wang) push('旺相爻值旬空');
    if (shuai && fourSheng.length) push('用神衰弱得生扶');
    if ((heDay || heMon) && fourSheng.length) push('贪生贪合');
    if (dongYaos.some(i => C.chong[g.lines[i].zhi] === yl.zhi || xing[g.lines[i].zhi] === yl.zhi) && !yaos[ys].dong) push('动静刑冲');
    if (yl.zhi === dayZhi || yl.zhi === monthZhi) push('爻遇令星');
    if (shuai && fourKe.length) push('用爻休囚又受制');
    if (keDay === dwx) push('日辰伤爻');
    if (muDay || muMon) push('用爻入墓');
    if (shiQin === '官鬼') push('世爻临官鬼凶杀');
    if (GH[day[0]] === yl.gan && heDay) push('天干地支皆合');
    if (shiQin === jiQin) push('忌爻临身世');
    if (fourKe.length && kong) push('用爻被克而值空');
    if (hasDong(jiQin) && hasDong(yuanQin)) push('忌爻发动得比肩帮用');
    if (shuai && (fourKe.length || fourChong.length || xingOnYl || haiOnYl)) push('用神休囚见刑冲克害');
    if (yaos[ys].dong && vg && lyChang(dwx, vg.lines[ys].zhi) && ['死', '墓', '绝'].indexOf(lyChang(dwx, vg.lines[ys].zhi).name) >= 0) push('用爻动化死墓绝空');
    if (yaos[ys].dong && vg && vg.lines[ys].qin === g.lines[ys].qin) push('卦中有用又化出用');
    if (yaos[ys].dong && kong && vg && (C.xunkong[day] || '').indexOf(vg.lines[ys].zhi) >= 0) push('动爻空亡化出亦空');
    if (yaos[ys].dong && vg && lyChang(dwx, vg.lines[ys].zhi) && lyChang(dwx, vg.lines[ys].zhi).name === '养') push('主象化入养爻');
    if (hasDong(jiQin) && muDay) push('凶爻入墓');
    if (yaos[ys].dong && vg && lyChang(dwx, vg.lines[ys].zhi) && lyChang(dwx, vg.lines[ys].zhi).name === '病') push('主象化出病爻');
    if (yaos[ys].dong && vg && lyChang(dwx, vg.lines[ys].zhi) && lyChang(dwx, vg.lines[ys].zhi).name === '胎') push('主象化入胎爻');
    if (hasDong(jiQin) && vg && dongYaos.some(i => g.lines[i].qin === jiQin && lyChang(jiShenWx, vg.lines[i].zhi) && lyChang(jiShenWx, vg.lines[i].zhi).name === '长生')) push('凶爻化入长生');
    if (yaos[ys].dong && vg && lyChang(dwx, vg.lines[ys].zhi) && lyChang(dwx, vg.lines[ys].zhi).name === '沐浴') push('用爻化入沐浴');
    if (yaos[ys].dong && vg && C.ke[DWX[vg.lines[ys].zhi]] === dwx) push('用爻化忌神回头克');
    if (C.sheng[dwx] === DWX[yw.zhi] || C.he[yl.zhi] === yw.zhi) push('主事爻反生合应爻');
    if (!hasDong(jiQin) && !dongYaos.some(i => C.sheng[DWX[g.lines[i].zhi]] === jiShenWx) && !(shengDay === jiShenWx || shengMon === jiShenWx)) push('忌神孤立无气');
    if (g.lines.filter(l => l.qin === yl.qin).length >= 2) push('用爻重叠太过');
    if (jianDong) push('间爻发动');
    if ((C.xunkong[day] || '').indexOf(sw.zhi) >= 0) push('世自落空');
    if (yaos[ys].dong) push('交重之分');
    if (ctx.fhFlag === 'jin' || ctx.fhFlag === 'tui') push('寅化卯为进，卯化寅为退');
    if ((shengDay === DWX[sw.zhi] && keDay === jiShenWx) || dongYaos.some(i => C.sheng[DWX[g.lines[i].zhi]] === DWX[sw.zhi] && DWX[g.lines[i].zhi] === jiShenWx)) push('日辰动爻生合世身但系忌神');
    if (C.ke[dwx] === DWX[sw.zhi]) push('主事爻克世');
    if (xingOnYl || haiOnYl) push('刑爻害爻临用神');
    if (csDay && (csDay.name === '死' || csDay.name === '绝')) push('死绝临持世身主象');
    if (yaos[ys].dong && chongDay) push('动爻逢冲');
    if (csDay && (csDay.name === '死' || csDay.name === '绝') && fourSheng.length) push('世身主象临死绝遇生扶');
    if (heDay || heMon) push('用爻合住');
    if (shuai) push('用爻休囚');
    if (yaos[ys].dong && (C.sheng[dwx] === DWX[sw.zhi] || C.ke[dwx] === DWX[sw.zhi])) push('用爻动来生世/克世');
    if (!hasQin('父母')) push('卦无父母');
    if (!hasQin('子孙')) push('卦无子孙');
    if (hasDong('官鬼')) push('官鬼宜静不宜动');
    if (g.lines.filter(l => l.qin === '子孙').length >= 2) push('子孙重叠太多');
    if (shenLine && shenLine.zhi === sw.zhi) push('卦身两现');
    return hits;
  }
  // 应期规则列表
  function lyYingqi(g, vg, ys, yaos, day, dayZhi, monthZhi, yongshenSel) {
    const C = D.liuyao.core;
    const out = [];
    const yl = g.lines[ys];
    const xk = C.xunkong[day] || '';
    const kong = xk.indexOf(yl.zhi) >= 0;
    const po = C.yue_po[monthZhi] === yl.zhi;
    const csDay = lyChang(DWX[yl.zhi], dayZhi);
    const mu = csDay && csDay.name === '墓';
    const jue = csDay && csDay.name === '绝';
    const he = yaos[ys].dong ? (C.he[dayZhi] === yl.zhi) : false;
    if (kong && !yaos[ys].dong) out.push('用神静而旬空：出旬之日或逢冲之日应（冲空则实）。');
    if (kong && yaos[ys].dong) out.push('用神动而旬空：冲空、实空之日应。');
    if (po) out.push('用神月破：出月值日或逢合之日应。');
    if (mu) out.push('用神入墓于日：冲墓之日应（墓中人不冲不发）。');
    if (jue) out.push('用神绝于日辰：待长生之日月应（绝处逢生）。');
    if (yaos[ys].dong && C.he[dayZhi] === yl.zhi) out.push('动而逢合：待冲之日应（动值合而绊住）。');
    if (yaos[ys].dong && C.chong[dayZhi] === yl.zhi) out.push('动而逢冲：待合之日应（动逢冲而事散）。');
    if (!yaos[ys].dong && C.chong[dayZhi] === yl.zhi) out.push('静爻逢冲暗动：待逢合之日应。');
    // 衰待旺 / 太旺墓库 / 受制
    const dwx = DWX[yl.zhi];
    const shengMon = C.sheng[DWX[monthZhi]];
    const shuai = shengMon !== dwx && !(C.he[monthZhi] === yl.zhi) && !(kong || po);
    const wangCount = [C.sheng[DWX[dayZhi]] === dwx, C.sheng[DWX[monthZhi]] === dwx, yl.zhi === dayZhi, yl.zhi === monthZhi].filter(Boolean).length;
    if (shuai && wangCount === 0) out.push('用神休囚：待生旺之月日应。');
    if (wangCount >= 3) out.push('用神太旺：待墓库之日月应（太过者损之斯成）。');
    if (C.ke[DWX[dayZhi]] === dwx || C.ke[DWX[monthZhi]] === dwx) out.push('用神受制：待制煞（克神）之日月应。');
    return out;
  }
  // 卦象 SVG（六爻横排，自下而上：六神/干支/爻画/动变标记）
  function lyPanSVG(b, ls, day, monthZhi) {
    const C = D.liuyao.core;
    const W = 560, rowH = 76, H = 40 + rowH * 6 + 50;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:560px;background:#12151f;border:1px solid var(--line);border-radius:10px;">';
    s += '<text x="' + W / 2 + '" y="24" text-anchor="middle" fill="var(--tx1)" font-size="16" font-weight="700">' + b.name + '（' + b.g.gong + '宫 · 世' + b.g.shi + '应' + b.g.ying + '）';
    if (b.vg && b.vName !== b.name) s += '　之　' + b.vName;
    s += '</text>';
    for (let i = 5; i >= 0; i--) {
      const y = 40 + (5 - i) * rowH;
      const line = b.g.lines[i];
      const isShi = i === b.g.shi - 1, isYing = i === b.g.ying - 1;
      s += '<text x="30" y="' + (y + 26) + '" fill="' + (LS_COLOR[ls[i]] || 'var(--tx2)') + '" font-size="13">' + ls[i] + '</text>';
      s += '<text x="118" y="' + (y + 26) + '" fill="' + (QIN_COLOR[line.qin] || 'var(--tx2)') + '" font-size="15" font-weight="600">' + line.qin + '</text>';
      s += '<text x="196" y="' + (y + 26) + '" fill="var(--tx2)" font-size="14">' + line.gan + line.zhi + ' ' + line.wx + '</text>';
      // 爻画
      const yang = b.lines[i] === '1';
      const cx = 320;
      if (yang) s += '<rect x="' + (cx - 62) + '" y="' + (y + 8) + '" width="124" height="14" rx="3" fill="' + (b.lines[i] === '1' ? '#e8c46a' : 'var(--tx3)') + '"/>';
      else {
        s += '<rect x="' + (cx - 62) + '" y="' + (y + 8) + '" width="56" height="14" rx="3" fill="var(--tx3)"/>';
        s += '<rect x="' + (cx + 6) + '" y="' + (y + 8) + '" width="56" height="14" rx="3" fill="var(--tx3)"/>';
      }
      // 动变标记 + 世应
      if (b.yaos[i].dong) s += '<text x="' + (cx + 84) + '" y="' + (y + 26) + '" fill="#ff7a8a" font-size="15" font-weight="700">' + (b.yaos[i].v === 6 ? '×' : '○') + '</text>';
      if (b.vg) {
        const vq = b.vg.lines[i].qin;
        s += '<text x="' + (cx + 120) + '" y="' + (y + 26) + '" fill="var(--tx3)" font-size="12">' + (b.yaos[i].dong ? '化' + vq : '') + '</text>';
      }
      if (isShi) s += '<text x="' + (W - 60) + '" y="' + (y + 26) + '" fill="#f0c860" font-size="13" font-weight="700">世</text>';
      if (isYing) s += '<text x="' + (W - 30) + '" y="' + (y + 26) + '" fill="#8fb7ff" font-size="13" font-weight="700">应</text>';
      s += '<text x="' + (W - 96) + '" y="' + (y + 26) + '" fill="var(--tx3)" font-size="12">' + YAO[i] + '</text>';
    }
    s += '<text x="' + W / 2 + '" y="' + (H - 12) + '" text-anchor="middle" fill="var(--tx3)" font-size="12">日 ' + day + ' · 月建 ' + monthZhi + ' · 六神起例按日干 ' + day[0] + '</text>';
    s += '</svg>';
    return s;
  }
  // 断易天机：卦缺六亲（六十四卦吉凶歌）/ 无鬼无气 / 绝处逢生 / 合处逢冲 / 随官入墓
  function lyTianji(b, ctx, ys, shiRec) {
    const out = [];
    const TJ = (D.liuyao && D.liuyao.tianji) || { gui_name: {}, wugui: [], geju: {} };
    const C = D.liuyao.core;
    const shi = shiRec ? shiRec.shi : '';
    const has = (kw) => shi.indexOf(kw) >= 0;
    const shiKey = has('婚') || has('恋') ? '婚姻' :
      has('孕') || has('胎') ? '胎孕' :
      has('功名') || has('官职') || has('晋升') || has('职位') || has('考试') || has('求名') ? '功名' :
      has('讼') || has('官非') ? '官讼' :
      has('失物') || has('丢失') ? '失脱' :
      has('财') || has('生意') || has('借贷') || has('利润') ? '求财' :
      has('出行') ? '出行' :
      has('行人') ? '行人' :
      has('家宅') || has('房产') || has('屋宅') ? '家宅' :
      has('疾病') || has('病') || has('医药') ? '疾病' :
      has('迁') ? '迁移' :
      has('坟') || has('风水') ? '坟墓' :
      has('师') || has('学') ? '求师' :
      '身命';
    const shiKeyOf = (name) => shiKey === name;
    // 1. 卦缺六亲（六十四卦吉凶歌）
    const gname = b.name;
    const guaHits = (TJ.gui_name || {})[gname] || [];
    if (guaHits.length) {
      const miss5 = guaHits.filter(h => h.missing !== '无');
      const all5 = guaHits.find(h => h.missing === '无');
      if (miss5.length) {
        const hit = miss5.find(h => h.missing === ctx.yongshenSel);
        if (hit) out.push({ name: '六十四卦吉凶歌·缺' + hit.missing, duan: hit.duan });
        else out.push({ name: '六十四卦吉凶歌·此卦缺亲', duan: '此卦本无 ' + miss5.map(h => h.missing).join('、') + ' 爻。' + miss5[0].duan });
      } else if (all5) {
        out.push({ name: '六十四卦吉凶歌·五位齐备', duan: all5.duan });
      }
    }
    // 2. 无鬼无气（卦无官鬼爻）
    const noGui = (b.g.lines || []).every(l => l.qin !== '官鬼');
    if (noGui) {
      const wg = (TJ.wugui || []).find(w => {
        const s = w.shi;
        if (shiKeyOf('身命')) return s.indexOf('占身') >= 0;
        if (shiKeyOf('胎孕') || shiKeyOf('出行') || shiKeyOf('行人')) return s.indexOf('占产') >= 0 || s.indexOf('出行') >= 0 || s.indexOf('行人') >= 0;
        if (shiKeyOf('失脱')) return s.indexOf('失物') >= 0;
        return s.indexOf(shiKey) >= 0;
      }) || (TJ.wugui || []).find(w => w.shi.indexOf('总论') >= 0);
      out.push({ name: '无鬼无气', duan: '卦中无官鬼爻。' + (wg ? wg.duan : '') });
    }
    // 3. 绝处逢生（用神五行绝于日辰 + 有生扶之爻发动）
    const yl = ys >= 0 ? b.g.lines[ys] : null;
    if (yl) {
      const csDay = lyChang(yl.wx, ctx.dayZhi);
      if (csDay && csDay.name === '绝') {
        const shengW = C.sheng[yl.wx];
        const yongsheng = ctx.yaos.some((y, i) => y.dong && b.g.lines[i].wx === shengW);
        if (yongsheng) {
          const items = (TJ.geju['绝处逢生'] && TJ.geju['绝处逢生'].items) || [];
          const gd = items.find(x => x.shi.indexOf(shiKey) >= 0) || (shiKeyOf('胎孕') ? items.find(x => x.shi.indexOf('胎孕') >= 0) : null);
          out.push({ name: '绝处逢生', duan: '用神' + yl.wx + '绝于日辰' + ctx.dayZhi + '，得' + shengW + '爻发动相生——' + (gd ? gd.duan : (TJ.geju['绝处逢生'] && TJ.geju['绝处逢生'].note || '')) });
        }
      }
    }
    // 4. 合处逢冲（卦中六合被日辰冲开）
    const hePairs = [];
    for (let a = 0; a < 6; a++) for (let c2 = a + 1; c2 < 6; c2++) {
      const za = b.g.lines[a].zhi, zb = b.g.lines[c2].zhi;
      if ((C.he[za] === zb || C.he[zb] === za) && (C.chong[ctx.dayZhi] === za || C.chong[ctx.dayZhi] === zb)) hePairs.push([a, c2]);
    }
    if (hePairs.length) {
      const items = (TJ.geju['合处逢冲'] && TJ.geju['合处逢冲'].items) || [];
      const gd = items.find(x => x.shi.indexOf(shiKey) >= 0) || (shiKeyOf('官讼') || shiKeyOf('疾病') ? items.find(x => x.shi.indexOf('官讼') >= 0) : null);
      out.push({ name: '合处逢冲', duan: '卦中 ' + hePairs.map(p => YAO[p[0]] + '·' + b.g.lines[p[0]].zhi + '与' + YAO[p[1]] + '·' + b.g.lines[p[1]].zhi + '相合').join('、') + '，被日辰' + ctx.dayZhi + '冲开——' + (gd ? gd.duan : (TJ.geju['合处逢冲'] && TJ.geju['合处逢冲'].note || '')) });
    }
    // 5. 随官入墓（官鬼爻入墓于日辰/月建）
    const guiMu = [];
    b.g.lines.forEach((l, i) => {
      if (l.qin !== '官鬼') return;
      const csD = lyChang(l.wx, ctx.dayZhi), csM = lyChang(l.wx, ctx.monthZhi);
      if ((csD && csD.name === '墓') || (csM && csM.name === '墓')) guiMu.push(i);
    });
    if (guiMu.length) {
      const items = (TJ.geju['随官入墓'] && TJ.geju['随官入墓'].items) || [];
      const gd = items.find(x => x.shi.indexOf(shiKey) >= 0) || (shiKeyOf('身命') ? items.find(x => x.shi.indexOf('身命') >= 0) : null);
      out.push({ name: '随官入墓', duan: '官鬼爻（' + guiMu.map(i => YAO[i] + '·' + b.g.lines[i].zhi + b.g.lines[i].wx).join('、') + '）入墓于日辰/月建——' + (gd ? gd.duan : (TJ.geju['随官入墓'] && TJ.geju['随官入墓'].note || '')) });
    }
    return out;
  }

  // 黄金策直解分类占原文备查（默认折叠）
  // 最近一次起卦上下文（供分类占按钮点击时机判黄金策 33 类）
  let LY_CTX = null;
  // 古籍机判共享求值器（renderer/ly_guji_eval.js）依赖 lyFenMatch/lyCatCondEval，桥接暴露到全局
  window.__lyFenMatch = lyFenMatch;
  window.__lyCatCondEval = lyCatCondEval;
  // 黄金策直解 33 类分类占 · 逐类机判命中（可机判规则走 lyCatCondEval；活步骤不可全机判，随类展示）
  function lyHuangjinCat(ctx, i) {
    const HJ = (D.liuyao && D.liuyao.huangjin_cat) || { cats: [] };
    const cat = HJ.cats[i];
    if (!cat) return { cat: null, hits: [], huobu: [] };
    const hits = [];
    (cat.rules || []).forEach(r => { if (lyCatCondEval(r.cond, ctx)) hits.push(r); });
    return { cat: cat, hits: hits, huobu: cat.huobu || [] };
  }
  function lyHuangjinRef() {
    const HJ = (D.liuyao && D.liuyao.huangjin) || { categories: [] };
    if (!HJ.categories.length) return '';
    let h = '<div class="ln-extra"><h3>黄金策直解 · 分类占（' + HJ.categories.length + ' 类 · 机判 + 活步骤 + 原文备查）</h3>';
    h += '<div class="src" style="margin:4px 0;">已机判：' + (HJ.done_in_engine || []).join('、') + ' 等 33 类全部接入机判器（' + ((D.liuyao && D.liuyao.huangjin_cat && D.liuyao.huangjin_cat.cats) || []).reduce((s, c) => s + (c.rules || []).length, 0) + ' 条规则）。点类名 → 本卦该类机判命中 + 活步骤（红字加粗）+ 原文。</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0;">' + HJ.categories.map((c, i) =>
      '<button class="act ln-mini hj-cat" data-i="' + i + '">' + esc6(c.name) + '</button>').join('') + '</div>';
    h += HJ.categories.map((c, i) =>
      '<div class="hj-cat-box" id="hj-box-' + i + '" style="display:none;margin:4px 0;padding:8px;background:rgba(0,0,0,.16);border-radius:8px;">' +
      '<div class="src" style="font-weight:600;">' + esc6(c.name) + '</div>' +
      '<div id="hj-j-' + i + '" style="margin:4px 0;"></div>' +
      '<div class="src" style="color:#d9a06a;margin-top:4px;">原文备查：</div>' +
      '<div class="src" style="line-height:1.9;">' + esc6(c.lines.join('<br>')) + '</div></div>').join('');
    h += '</div>';
    return h;
  }
  // 卜筮全书 · 六十四卦卦象断（本卦 + 变卦，机判）
  function lyGuaxiang(b) {
    const GX = (D.liuyao && D.liuyao.guaxiang) || { guaxiang: [] };
    const by = {};
    (GX.guaxiang || []).forEach(g => { by[g.name] = g; });
    const out = [];
    const g1 = by[b.name];
    if (g1) out.push({ gua: b.name, xiang: g1.xiang + '，' + g1.duan });
    if (b.vName && b.vName !== b.name) {
      const g2 = by[b.vName];
      if (g2) out.push({ gua: b.vName, xiang: g2.xiang + '，' + g2.duan });
    }
    return out;
  }
  // 卜筮全书 · 断易通玄赋 口诀章机判命中（持世 / 世应生克 / 间爻 / 安静乱动 / 空亡伏藏）
  function lyTongxuanJue(b, ctx, ys) {
    const TJ = (D.liuyao && D.liuyao.tongxuan) || { jue: [] };
    const C = D.liuyao.core;
    const out = [];
    const getJue = (n) => (TJ.jue || []).find(j => j.name.indexOf(n) >= 0);
    // 1 诸爻持世
    const shiQin = b.g.lines[b.g.shi - 1].qin;
    const chishiJue = getJue('诸爻持世决');
    if (chishiJue) {
      const line = (chishiJue.lines || []).find(l => l.indexOf(shiQin + '持世') >= 0);
      if (line) out.push({ name: '诸爻持世 · ' + shiQin + '持世', txt: line });
    }
    // 2 世应生克
    const sZhi = b.g.lines[b.g.shi - 1].zhi, yZhi = b.g.lines[b.g.ying - 1].zhi;
    const sW = DWX[sZhi], yW = DWX[yZhi];
    const syJue = getJue('世应生克动静空亡决');
    if (syJue) {
      let key = '比和';
      if (C.sheng[sW] === yW || C.sheng[yW] === sW) key = '相生';
      else if (C.ke[sW] === yW || C.ke[yW] === sW) key = '相克';
      const line = (syJue.lines || []).find(l => l.indexOf(key) >= 0);
      if (line) out.push({ name: '世应' + (key === '比和' ? '比和' : key), txt: line });
    }
    // 3 世应间爻发动
    const dongN = ctx.yaos.filter(y => y.dong).length;
    if (dongN) {
      const jian = [];
      for (let i = Math.min(b.g.shi, b.g.ying) + 1; i < Math.max(b.g.shi, b.g.ying); i++) {
        if (ctx.yaos[i - 1] && ctx.yaos[i - 1].dong) jian.push(i);
      }
      if (jian.length) {
        const jj = getJue('世应间爻决');
        if (jj && jj.lines.length) out.push({ name: '世应间爻 · 发动（' + jian.map(i => YAO[i - 1]).join('、') + '）', txt: jj.lines[0] });
      }
    }
    // 4 六爻安静 / 乱动
    if (dongN === 0) {
      const aj = getJue('六爻安静诀');
      if (aj && aj.lines.length) out.push({ name: '六爻安静', txt: aj.lines[0] });
    } else if (dongN >= 4) {
      const ld = getJue('六爻乱动诀');
      if (ld && ld.lines.length) out.push({ name: '六爻乱动（' + dongN + ' 爻动）', txt: ld.lines[0] });
    }
    // 5 用神空亡 / 不上卦 / 伏藏
    if (ys >= 0 && ctx.yaos[ys].kong) {
      const kk = getJue('用爻空亡诀');
      if (kk && kk.lines.length) out.push({ name: '用爻空亡', txt: kk.lines[0] });
    }
    if (ys < 0) {
      const bsg = getJue('用爻不上卦或落空亡诀');
      if (bsg && bsg.lines.length) out.push({ name: '用爻不上卦', txt: bsg.lines[0] });
      const fc = getJue('用爻伏藏诀');
      if (fc && fc.lines.length) out.push({ name: '用爻伏藏', txt: fc.lines[0] });
    }
    return out;
  }
  // 古籍备查大区：通玄分类占 / 易隐 / 增删卜易 / 黄金策解读（默认折叠 + 搜索）
  // 古籍机判层统一渲染：机判命中（绿）+ 活步骤（红字加粗）+ 未命中不假装
  function lyGuJiBoxHtml(r) {
    if (!r) return '';
    let s = '';
    if (!LY_CTX) {
      s += '<div class="muted">尚未起卦——先在上方摇卦/输卦，本类将自动机判命中。</div>';
    } else if (r.hits && r.hits.length) {
      s += '<div style="color:#8fbf8f;font-weight:700;margin:4px 0;">机判命中 ' + r.hits.length + ' 条</div>';
      s += r.hits.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.cond) + '</b><span style="color:var(--tx2);">——' + esc6(x.duan) + '</span><div class="src">' + esc6(x.src) + '</div></div>').join('');
    } else {
      s += '<div class="muted">本卦未命中「' + esc6(r.catName || '') + '」的机判规则——未命中不假装，可参考下方活步骤与原文。</div>';
    }
    if (r.huobu && r.huobu.length) {
      s += r.huobu.map(hu => '<div style="margin:8px 0 2px;color:#e06c6c;font-weight:800;">活步骤 · ' + esc6(hu.title) + '（需人工对照卦象逐步判断）</div>' +
        '<div style="color:#e08a8a;line-height:1.9;font-weight:700;">' + hu.steps.map((st, k) => (k + 1) + '. ' + esc6(st)).join('<br>') + '</div>').join('');
    }
    return s;
  }
  // 黄金策解读（平铺规则层）：包装成类结构求值
  function lyQjJieduCat() {
    const QJC = (D.liuyao && D.liuyao.qj_jiedu_cat) || { rules: [], huobu: [] };
    return { catName: '黄金策解读·分类占', hits: lyGuJiEval.lyGuJiCatHits({ name: '黄金策解读·分类占', rules: QJC.rules, huobu: QJC.huobu }, LY_CTX).hits, huobu: QJC.huobu || [] };
  }
  function lyGuJiRef() {
    const TJ = (D.liuyao && D.liuyao.tongxuan) || { fenlei: [] };
    const YY = (D.liuyao && D.liuyao.yiyin) || { categories: [] };
    const ZS = (D.liuyao && D.liuyao.zengshan) || { volumes: [] };
    const QJ = (D.liuyao && D.liuyao.qianjin_jiedu) || { qianjin: [], fenlei: [] };
    let h = '<div class="ln-extra"><h3>六爻古籍原文备查（卜筮全书分类占 / 易隐 / 增删卜易 / 黄金策解读 · 默认折叠）</h3>';
    // 1 通玄赋分类占
    if (TJ.fenlei && TJ.fenlei.length) {
      h += '<div style="margin:6px 0;"><b style="color:var(--tx1);">卜筮全书 · 断易通玄赋分类占（' + TJ.fenlei.length + ' 类 · 韵文泛断）</b><div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0;">' +
        TJ.fenlei.map((c, i) => '<button class="act ln-mini gj-cat" data-src="tx" data-i="' + i + '">' + esc6(c.name.replace(/[：:].*$/, '')) + '</button>').join('') +
        '</div>' + TJ.fenlei.map((c, i) => '<div class="gj-cat-box" id="gj-tx-' + i + '" style="display:none;margin:4px 0;padding:8px;background:rgba(0,0,0,.16);border-radius:8px;">' +
        '<div class="src" style="font-weight:600;">' + esc6(c.name) + '</div>' +
        '<div class="gj-j" id="gj-j-tx-' + i + '"></div>' +
        c.items.map(it => '<div class="src" style="line-height:1.85;margin:6px 0;">' + (it.no ? '<b>' + esc6(it.no) + '</b> ' : '') + esc6(it.lines.join('<br>')) + '</div>').join('') +
        '</div>').join('') + '</div>';
    }
    // 2 易隐
    if (YY.categories && YY.categories.length) {
      h += '<div style="margin:6px 0;"><b style="color:var(--tx1);">易隐（' + YY.categories.length + ' 类分类占 · 原文）</b><div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0;">' +
        YY.categories.map((c, i) => '<button class="act ln-mini gj-cat" data-src="yy" data-i="' + i + '">' + esc6(c.name) + '</button>').join('') +
        '</div>' + YY.categories.map((c, i) => '<div class="gj-cat-box" id="gj-yy-' + i + '" style="display:none;margin:4px 0;padding:8px;background:rgba(0,0,0,.16);border-radius:8px;">' +
        '<div class="src" style="font-weight:600;">' + esc6(c.name) + '</div>' +
        '<div class="gj-j" id="gj-j-yy-' + i + '"></div>' +
        c.sections.map(se => '<div class="src" style="line-height:1.85;margin:6px 0;">' + (se.name ? '<b>' + esc6(se.name) + '</b><br>' : '') + esc6(se.lines.join('<br>')) + '</div>').join('') +
        '</div>').join('') + '</div>';
    }
    // 3 增删卜易
    if (ZS.volumes && ZS.volumes.length) {
      h += '<div style="margin:6px 0;"><b style="color:var(--tx1);">增删卜易（' + ZS.volumes.length + ' 卷 ' +
        ZS.volumes.reduce((a, v) => a + v.chapters.length, 0) + ' 章 · 章论与断验原文）</b><div style="display:flex;flex-wrap:wrap;gap:4px;margin:4px 0;">' +
        ZS.volumes.map((v, vi) => '<button class="act ln-mini gj-cat" data-src="zs" data-i="' + vi + '">' + esc6(v.vol) + '（' + v.chapters.length + ' 章）</button>').join('') +
        '</div>' + ZS.volumes.map((v, vi) => '<div class="gj-cat-box" id="gj-zs-' + vi + '" style="display:none;margin:4px 0;padding:8px;background:rgba(0,0,0,.16);border-radius:8px;">' +
        v.chapters.map((ch, ci) => '<div style="margin:6px 0;"><button class="act ln-mini gj-ch" data-src="zs" data-v="' + vi + '" data-c="' + ci + '">' + esc6(ch.name) + '</button>' +
        '<div class="gj-ch-box" id="gj-zs-' + vi + '-' + ci + '" style="display:none;margin:4px 0 8px 10px;line-height:1.85;"><div class="gj-j" id="gj-j-zs-' + vi + '-' + ci + '"></div>' + esc6(ch.lines.join('<br>')) + '</div></div>').join('') +
        '</div>').join('') + '</div>';
    }
    // 4 黄金策解读（68 千金赋 + 1046 分类占，搜索过滤）
    if (QJ.qianjin.length || QJ.fenlei.length) {
      h += '<div style="margin:6px 0;"><b style="color:var(--tx1);">黄金策 · 逐句解读（千金赋 ' + QJ.qianjin.length + ' 条 + 分类占 ' + QJ.fenlei.length + ' 条）</b>' +
        '<div style="display:flex;gap:6px;margin:6px 0;"><input id="gj-qj-q" class="ly-gj-q" placeholder="输入关键词过滤解读（如：官鬼 / 妻财 / 墓 / 空）" style="flex:1;padding:6px 9px;border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:var(--tx1);"><button class="act ln-mini" id="gj-qj-go">筛选</button></div>' +
        '<div style="margin:4px 0;"><button class="act ln-mini" id="gj-qj-j-btn">本卦机判（黄金策解读分类占规则）▸</button></div>' +
        '<div id="gj-j-qj" style="margin:2px 0 6px;"></div>' +
        '<div id="gj-qj-list" class="gj-qj-list" style="max-height:280px;overflow:auto;line-height:1.8;padding-right:4px;"></div></div>';
    }
    h += '</div>';
    return h;
  }
  function lyInit() {
    if (!D || !D.liuyao) { $('ly-title').textContent = '数据加载失败'; return; }
    const C = D.liuyao.core, DU = D.liuyao.duanyu;
    // 日干支
    const selDay = $('ly-day');
    selDay.innerHTML = JIAZI60.map(g => '<option value="' + g + '">' + g + '</option>').join('');
    selDay.value = todayGanzhi6();
    // 月建（月支）
    const selMon = $('ly-month');
    const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
    selMon.innerHTML = monthNames.map((m, i) => '<option value="' + ZHI12[i] + '">' + m + '（建' + ZHI12[i] + '）</option>').join('');
    const now = new Date();
    selMon.value = ZHI12[(now.getMonth() + 1 + 1) % 12]; // 农历月简近似（正月建寅）：公历月+1
    // 占事
    const selShi = $('ly-shi');
    selShi.innerHTML = (DU.yongshen || []).map((y, i) => '<option value="' + i + '">' + y.shi + '</option>').join('');
    // 手输爻选择器（6 个：少阳/少阴/老阳/老阴）
    const selYaos = [];
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('select');
      s.innerHTML = '<option value="7">少阳（单 · 阳）</option><option value="8">少阴（拆 · 阴）</option><option value="9">老阳（重 · 阳动）</option><option value="6">老阴（交 · 阴动）</option>';
      s.className = 'ly-yao';
      selYaos.push(s);
      $('ly-manual').appendChild(s);
    }
    window.__lySelYaos = selYaos;
    window.__lySelDay = selDay; window.__lySelMon = selMon; window.__lySelShi = selShi;
    $('ly-throw').addEventListener('click', () => lyGo(null));
    $('ly-go').addEventListener('click', () => lyGo(selYaos.map(s => { const v = parseInt(s.value, 10); return { v: v, yang: v === 7 || v === 9, dong: v === 6 || v === 9, label: v === 6 ? '交' : v === 7 ? '单' : v === 8 ? '拆' : '重' }; })));
    $('ly-today').addEventListener('click', () => { selDay.value = todayGanzhi6(); });
    $('ly-title').textContent = '六爻 · 纳甲筮法（自建装卦全表 + 规则引擎）';
    $('ly-out').innerHTML = '<div class="muted">已载入 64 卦装卦全表（八宫纳甲自算）、取用神表 ' + (DU.yongshen || []).length + ' 条、断语库（口诀 17 类 + 千金赋 68 条 + 分类占 8 类）、断易天机、黄金策直解、卜筮全书（通玄赋口诀 26 章 + 卦象断 64 卦 + 分类占 42 类）、易隐 40 类、增删卜易 4 卷、黄金策逐句解读 1114 条。选「摇卦」随机起卦，或手输六爻后点「起卦占断」：装卦 → 六神/旬空/月破 → 取用神 → 四处生克冲合 → 格局判定 → 断易天机 → 卦象断 → 通玄卦诀 → 断语自动命中 → 应期。</div>';
    $('ly-si').innerHTML = '<div class="src">方法：三枚铜钱摇六次（一背=单/二背=拆/三背=重/三字=交），自下而上成卦。装卦按八宫纳甲算法程序化生成（乾内甲子寅辰外壬午申戌…世应诀：八纯世六/游魂世四/归魂世三，应隔两位；六亲以宫五行为我定生克）。取用神按占事→六亲自动（选项法）；四处生克冲合（月建/日辰/动爻/变爻）与格局判定（旬空/月破/反伏吟/进退神/飞伏/三合/六冲六合）全部死规则引擎；断语按「用神状态判定优先、口诀补充」分层命中，来源标注。断易天机：卦缺六亲（吉凶歌按卦名+用神命中）、无鬼无气（卦无官鬼按占事命中）、绝处逢生（用神绝于日辰有生扶动爻）、合处逢冲（卦合被日冲开）、随官入墓（官鬼入墓于日月）——全机判；黄金策直解 33 类分类占原文备查（默认折叠）。</div>';
  }
  function lyGo(manualYaos) {
    const C = D.liuyao.core, DU = D.liuyao.duanyu;
    const day = window.__lySelDay.value, monthZhi = window.__lySelMon.value, shiIdx = parseInt(window.__lySelShi.value, 10);
    const shiRec = DU.yongshen[shiIdx];
    const yongshenSel = shiRec ? shiRec.qin : '世';
    const yaos = manualYaos || lyThrow();
    const b = lyBuild(yaos);
    if (!b.g) { $('ly-out').innerHTML = '<div style="color:#d17a7a;">装卦失败（卦象无法定位）</div>'; return; }
    b.yaos = yaos;
    const dayZhi = day[1];
    const ls = lyLiuShen(day[0]);
    const cands = lyYongCands(yongshenSel, b.g);
    let ys = lyPickYong(cands, yaos, dayZhi, monthZhi, b.g);
    // 用神不上卦
    let yongTxt = '';
    if (ys == null) {
      const head = { 乾: '乾为天', 坎: '坎为水', 艮: '艮为山', 震: '震为雷', 巽: '巽为风', 离: '离为火', 坤: '坤为地', 兑: '兑为泽' }[b.g.gong];
      const hg = C.gua64[head];
      const v = (hg.lines || []).find(l => l.qin === yongshenSel);
      ys = -1;
      yongTxt = '用神（' + yongshenSel + '）不上卦：伏于' + head + '（' + (v ? v.zhi + v.qin : '伏神无寻') + '）。' +
        (v ? '正卦如无变又无，就将首卦六亲攻——动爻生用终须吉，若遇交重克用凶。' : '');
    }
    const yongName = ys >= 0 ? (yongshenSel === '世' ? '世爻' : yongshenSel === '应' ? '应爻' : yongshenSel + '（' + YAO[ys] + '）') : yongshenSel;
    // 旬空
    const xk = C.xunkong[day] || '';
    yaos.forEach((y, i) => { y.kong = xk.indexOf(b.g.lines[i].zhi) >= 0; });
    // 进神退神标记（世爻动化）
    let fhFlag = '';
    if (b.vg && yaos[b.g.shi - 1].dong) {
      const z1 = b.g.lines[b.g.shi - 1].zhi, z2 = b.vg.lines[b.g.shi - 1].zhi;
      if (ZHI12.indexOf(z2) === ZHI12.indexOf(z1) + 1) fhFlag = 'jin';
      if (ZHI12.indexOf(z2) === ZHI12.indexOf(z1) - 1) fhFlag = 'tui';
    }
    const four = ys >= 0 ? lyFourImpacts(b.g.lines[ys], b.g, b.vg, yaos, dayZhi, monthZhi, ys) : null;
    const geju = ys >= 0 ? lyGeju(b.g, b.vg, ys, dayZhi, monthZhi, day, yaos, yongshenSel) : [];
    const ctx = { g: b.g, vg: b.vg, ys: Math.max(ys, 0), yaos: yaos, day: day, dayZhi: dayZhi, monthZhi: monthZhi, yongshenSel: yongshenSel, xk: xk, dongN: yaos.filter(y => y.dong).length, fhFlag: fhFlag, four: four };
    LY_CTX = ctx; // 供黄金策 33 类分类占按钮点击时机判
    const dy = ys >= 0 ? lyDuanyu(b.g, b.vg, ys, yaos, day, monthZhi, dayZhi, yongshenSel, shiRec.shi, ctx, four) : { hits: [], fh: [] };
    const yq = ys >= 0 ? lyYingqi(b.g, b.vg, ys, yaos, day, dayZhi, monthZhi, yongshenSel) : [];
    // ── 渲染 ──
    $('ly-pan').innerHTML = lyPanSVG(b, ls, day, monthZhi);
    let h = '';
    h += '<h3>起卦信息</h3><div class="src">日 ' + day + ' · 月建 ' + monthZhi + ' · 事类「' + (shiRec ? shiRec.shi : '') + '」' + (manualYaos ? '（手输六爻）' : '（摇卦：' + yaos.map(y => y.label).join('·') + '）') + '</div>';
    h += '<div class="src">本卦 ' + b.name + '（' + b.g.gong + '宫 · 世' + b.g.shi + '应' + b.g.ying + '）' + (b.vName !== b.name ? ' 之 ' + b.vName + '（动爻' + yaos.map((y, i) => y.dong ? YAO[i] : '').filter(Boolean).join('、') + '）' : '') + '</div>';
    h += '<div class="src">装卦（自下而上）：' + b.g.lines.map((l, i) => YAO[i] + ' ' + l.gan + l.zhi + l.wx + l.qin).join(' ｜ ') + '</div>';
    h += '<div class="src">六神（日干' + day[0] + '起例）：' + ls.map((s, i) => s + '·' + YAO[i]).join('、') + '</div>';
    h += '<div class="src">取用神：' + yongTxt + (ys >= 0 ? yongName + '（' + b.g.lines[Math.max(ys, 0)].zhi + ' ' + b.g.lines[Math.max(ys, 0)].wx + ' ' + b.g.lines[Math.max(ys, 0)].qin + '）' : '') + '</div>';
    // 旬空月破列表
    const xkHits = [], ypHits = [];
    yaos.forEach((y, i) => {
      if (y.kong) xkHits.push(YAO[i] + '·' + b.g.lines[i].zhi);
      if (C.yue_po[monthZhi] === b.g.lines[i].zhi) ypHits.push(YAO[i] + '·' + b.g.lines[i].zhi);
    });
    if (xkHits.length || ypHits.length) {
      h += '<h3>旬空 / 月破</h3><div class="src">旬空（' + day + '旬：' + xk + '）：' + (xkHits.length ? xkHits.join('、') : '无') +
        '　月破（' + monthZhi + '月：' + C.yue_po[monthZhi] + '）：' + (ypHits.length ? ypHits.join('、') : '无') + '</div>';
    }
    // 单爻旺衰打分（月建日辰加权 · 通行旺衰法，移植自玄鉴 liuyao engine 原出 xiongdun8/liuyao.wangshuai）
    {
      const rows = b.g.lines.map((l, i) => {
        const st = lyYaoStrength(l.zhi, monthZhi, dayZhi, b.vg ? b.vg.lines[i].zhi : null, !!yaos[i].dong);
        return { i: i, line: l, dong: yaos[i].dong, st: st };
      });
      const best = rows.slice().sort((a, b2) => b2.st.score - a.st.score)[0];
      h += '<h3>爻旺衰（月建日辰加权分）</h3>';
      h += '<div class="src">通行旺衰法：月建+2 日建+1.5 月生日生+1.5 合旺+1.5 合绊+1.5 月扶+1 日扶+0.5 帝旺+1；月破-2 月克日克-1 日散-1.5 休囚-1.5 绝地-0.5 化绝-1 入墓-0.1（冲克合减半）。仅为旺衰相对强弱参考，非古籍原文断语。最旺者：' + YAO[best.i] + ' ' + best.line.zhi + best.line.wx + best.line.qin + '（' + best.st.score + '）' + (best.st.status.length ? ' · ' + best.st.status.join('/') : '') + '</div>';
      h += '<div class="src">' + rows.map(r => YAO[r.i] + ' ' + r.line.zhi + r.line.wx + r.line.qin + (r.dong ? '（动）' : '') + ' → ' + r.st.score + (r.st.status.length ? ' [' + r.st.status.join('/') + ']' : '')).join('　') + '</div>';
      const ysW = ys >= 0 ? rows[Math.max(ys, 0)] : null;
      if (ysW) h += '<div class="src">用神（' + yongName + '）旺衰分：' + ysW.st.score + (ysW.st.status.length ? ' · ' + ysW.st.status.join('/') : ' · 无特殊状态') + (ysW.st.score >= 2 ? ' → 旺相（诸占以旺相为吉，休囚为凶）' : ysW.st.score <= -2 ? ' → 休囚破伤（防克害）' : ' → 中和，须兼看生克冲合') + '</div>';
    }
    // 四处生克
    if (four) {
      h += '<h3>四处生克冲合（月建 / 日辰 / 动爻 / 变爻）</h3>';
      if (four.hits.length) h += four.hits.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + x.kind + '·' + esc6(x.src) + '</b><span style="color:var(--tx2);">' + esc6(x.txt) + '</span></div>').join('');
      else h += '<div class="muted">用神未受月建/日辰/动爻/变爻生克冲合。</div>';
      h += '<div class="src">总断：' + esc6(four.zong) + '</div>';
    }
    // 格局
    if (geju.length) h += '<h3>格局判定（' + geju.length + ' 项）</h3>' + geju.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.cond) + '</b><br><span style="color:var(--tx2);">' + esc6(x.duan) + '</span></div>').join('');
    // 断易天机：卦缺六亲 + 无鬼无气 + 三格局断（可机判命中）
    const tjHits = lyTianji(b, ctx, ys, shiRec);
    if (tjHits.length) {
      h += '<h3>断易天机 · 卦缺与格局断（' + tjHits.length + ' 项）</h3>';
      h += tjHits.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.name) + '</b><br><span style="color:var(--tx2);">' + esc6(x.duan) + '</span></div>').join('');
    }
    // 卜筮全书 · 六十四卦卦象断（本卦 + 变卦）
    const gxHits = lyGuaxiang(b);
    if (gxHits.length) {
      h += '<h3>六十四卦卦象断（卜筮全书）</h3>' + gxHits.map(x =>
        '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.gua) + '</b><br><span style="color:var(--tx2);">' + esc6(x.xiang) + '</span></div>').join('');
    }
    // 断易通玄赋 · 口诀章机判命中
    const txHits = lyTongxuanJue(b, ctx, ys);
    if (txHits.length) {
      h += '<h3>断易通玄赋 · 卦诀命中（' + txHits.length + ' 项）</h3>';
      h += txHits.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.name) + '</b><br><span style="color:var(--tx2);">' + esc6(x.txt) + '</span></div>').join('');
    }
    // 断语（分层：用神状态主断 = 千金赋 + 分类占；口诀补充）
    if (dy.hits.length) {
      const mainHits = dy.hits.filter(x => x.sec === '千金赋' || x.sec.indexOf('分类占') === 0);
      const auxHits = dy.hits.filter(x => x.sec !== '千金赋' && x.sec.indexOf('分类占') !== 0);
      if (mainHits.length) {
        h += '<h3>用神状态断语（主断 · 命中 ' + mainHits.length + ' 条）</h3>';
        h += mainHits.slice(0, 6).map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.cond) + '</b><br><span style="color:var(--tx2);">' + esc6(x.duan) + '</span><div style="font-size:11px;color:var(--tx3);">' + esc6(x.sec) + '</div></div>').join('');
        if (mainHits.length > 6) h += '<button class="act ln-mini ly-more">另有 ' + (mainHits.length - 6) + ' 条命中 ▸</button><div class="ly-more-box" style="display:none;">' +
          mainHits.slice(6).map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.cond) + '</b><br><span style="color:var(--tx2);">' + esc6(x.duan) + '</span></div>').join('') + '</div>';
      }
      if (auxHits.length) {
        h += '<div class="ln-extra"><h3>口诀补充（' + auxHits.length + ' 条）</h3>';
        h += auxHits.slice(0, 5).map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.sec) + '·' + esc6(x.cond) + '</b><br><span style="color:var(--tx2);">' + esc6(x.duan) + '</span></div>').join('');
        if (auxHits.length > 5) h += '<button class="act ln-mini ly-more">另有 ' + (auxHits.length - 5) + ' 条 ▸</button><div class="ly-more-box" style="display:none;">' +
          auxHits.slice(5).map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.sec) + '·' + esc6(x.cond) + '</b><br><span style="color:var(--tx2);">' + esc6(x.duan) + '</span></div>').join('') + '</div>';
        h += '</div>';
      }
    } else {
      h += '<div class="muted">本卦象未命中额外断语，参考上方格局与四处生克总断。</div>';
    }
    // 千金赋不可机判条目：默认折叠展示原文（可查，不假装命中）
    const qjUnjudged = lyQjUnjudged();
    if (qjUnjudged.length) {
      h += '<div class="ln-extra"><h3>千金赋 · 不可机判原文备查（' + qjUnjudged.length + ' 条 · 默认折叠）</h3>' +
        '<button class="act ln-mini ly-more">展开原文 ▸</button><div class="ly-more-box" style="display:none;">' +
        qjUnjudged.map(x => '<div class="src" style="line-height:1.8;margin:5px 0;"><b>' + esc6(x.cond) + '</b>：' + esc6(x.duan) + '</div>').join('') + '</div></div>';
    }
    // 黄金策直解分类占原文备查（默认折叠，可点类名展开）
    h += lyHuangjinRef();
    // 六爻古籍原文备查大区（卜筮全书分类占 / 易隐 / 增删卜易 / 黄金策解读）
    h += lyGuJiRef();
    // 应期
    if (yq.length) {
      h += '<h3>应期</h3>' + yq.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><span style="color:var(--tx2);">' + esc6(x) + '</span></div>').join('');
    } else {
      h += '<h3>应期</h3><div class="muted">书中无期可断——未命中应期规则（按黄金策应期法：合待冲/冲待合/绝待生/墓待开/破待补/空出旬/衰待旺）。</div>';
    }
    // 活层提示：吉凶冲突 → 通玄赋原文折叠（不机器拆解）
    if (four && four.keN >= 2 && four.shengN >= 1) {
      h += '<div class="src" style="color:#d9a06a;">⚠ 吉凶信号并存：' + esc6(four.zong) + '。此活泼之中自有玄妙，学者宜加意参之；凶中藏吉，吉处藏凶者有之，必须奥理深求，细心参悟。六兽之权依于五行六亲生克，神煞之权轻而五行之权重。</div>';
      if (DU.tongxuan && DU.tongxuan[0]) {
        h += '<div class="ln-extra"><button class="act ln-mini ly-more">通玄赋 · 总断参考 ▸</button><div class="ly-more-box" style="display:none;"><div class="src" style="line-height:1.9;">' + esc6(DU.tongxuan[0]) + '</div></div></div>';
      }
    }
    h += '<div class="src" style="margin-top:8px;">再占：一卦不见再占一卦（野鹤）。' + (DU.wuni && DU.wuni[0] ? esc6(DU.wuni[0]) : '神煞休将定吉凶——易卦阴阳在变通，五行生克妙无穷。') + '</div>';
    $('ly-out').innerHTML = h;
    // 折叠绑定
    document.querySelectorAll('.ly-more').forEach(btn => {
      btn.addEventListener('click', () => {
        const box = btn.nextElementSibling;
        if (!box) return;
        const open = box.style.display !== 'none';
        box.style.display = open ? 'none' : 'block';
        btn.textContent = open ? btn.textContent.replace('▾', '▸') : btn.textContent.replace('▸', '▾');
      });
    });
    document.querySelectorAll('.hj-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const box = document.getElementById('hj-box-' + btn.dataset.i);
        if (!box) return;
        const open = box.style.display !== 'none';
        box.style.display = open ? 'none' : 'block';
        // 展开时渲染机判命中 + 活步骤（未起卦则提示）
        const j = document.getElementById('hj-j-' + btn.dataset.i);
        if (j && !j.dataset.rendered) {
          j.dataset.rendered = '1';
          if (!LY_CTX) {
            j.innerHTML = '<div class="muted">尚未起卦——先在上方摇卦/输卦，本类将自动机判命中。</div>';
          } else {
            const r = lyHuangjinCat(LY_CTX, parseInt(btn.dataset.i, 10));
            let s = '';
            if (r.hits.length) {
              s += '<div style="color:#8fbf8f;font-weight:700;margin:4px 0;">机判命中 ' + r.hits.length + ' 条</div>';
              s += r.hits.map(x => '<div class="ln-verdict" style="margin:3px 0;padding:5px 9px;"><b>' + esc6(x.cond) + '</b><span style="color:var(--tx2);">——' + esc6(x.duan) + '</span><div class="src">' + esc6(x.src) + '</div></div>').join('');
            } else {
              s += '<div class="muted">本卦未命中「' + esc6(r.cat.name) + '」的机判规则——未命中不假装，可参考下方活步骤与原文。</div>';
            }
            if (r.huobu && r.huobu.length) {
              s += r.huobu.map(hu => '<div style="margin:8px 0 2px;color:#e06c6c;font-weight:800;">活步骤 · ' + esc6(hu.title) + '（需人工对照卦象逐步判断）</div>' +
                '<div style="color:#e08a8a;line-height:1.9;font-weight:700;">' + hu.steps.map((st, k) => (k + 1) + '. ' + esc6(st)).join('<br>') + '</div>').join('');
            }
            j.innerHTML = s;
          }
        }
      });
    });
    // 古籍备查：类按钮（通玄/易隐/增删卜易卷）——打开时惰性渲染机判区
    document.querySelectorAll('.gj-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        const box = document.getElementById('gj-' + btn.dataset.src + '-' + btn.dataset.i);
        if (!box) return;
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
        if (box.style.display !== 'none' && btn.dataset.src !== 'zs') {
          const j = document.getElementById('gj-j-' + btn.dataset.src + '-' + btn.dataset.i);
          if (j && !j.dataset.rendered) {
            j.dataset.rendered = '1';
            const cats = (btn.dataset.src === 'tx' ? (D.liuyao.tongxuan_cat || {}).cats : (D.liuyao.yiyin_cat || {}).cats) || [];
            const cat = cats[parseInt(btn.dataset.i, 10)];
            j.innerHTML = lyGuJiBoxHtml(cat ? lyGuJiEval.lyGuJiCatHits(cat, LY_CTX) : { catName: '', hits: [], huobu: [] });
          }
        }
      });
    });
    // 古籍备查：增删卜易章按钮——打开时渲染该章机判区
    document.querySelectorAll('.gj-ch').forEach(btn => {
      btn.addEventListener('click', () => {
        const box = document.getElementById('gj-' + btn.dataset.src + '-' + btn.dataset.v + '-' + btn.dataset.c);
        if (!box) return;
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
        if (box.style.display !== 'none') {
          const j = document.getElementById('gj-j-' + btn.dataset.src + '-' + btn.dataset.v + '-' + btn.dataset.c);
          if (j && !j.dataset.rendered) {
            j.dataset.rendered = '1';
            const vols = (D.liuyao.zengshan_cat || {}).volumes || [];
            const ch = vols[parseInt(btn.dataset.v, 10)] && vols[parseInt(btn.dataset.v, 10)].chapters[parseInt(btn.dataset.c, 10)];
            j.innerHTML = lyGuJiBoxHtml(ch ? lyGuJiEval.lyGuJiCatHits(ch, LY_CTX) : { catName: '', hits: [], huobu: [] });
          }
        }
      });
    });
    // 黄金策解读：关键词筛选
    const qjQ = document.getElementById('gj-qj-q');
    const qjGo = document.getElementById('gj-qj-go');
    if (qjQ && qjGo) {
      const renderQj = () => {
        const QJ = (D.liuyao && D.liuyao.qianjin_jiedu) || { qianjin: [], fenlei: [] };
        const kw = qjQ.value.trim();
        const all = QJ.qianjin.concat(QJ.fenlei);
        const list = document.getElementById('gj-qj-list');
        if (!list) return;
        if (!kw) {
          list.innerHTML = '<div class="muted">共 ' + all.length + ' 条（千金赋 ' + QJ.qianjin.length + ' + 分类占 ' + QJ.fenlei.length + '）。输入关键词后筛选。示例：官鬼、妻财、父母、子孙、兄弟、空、墓、动、克。</div>';
          return;
        }
        const hit = all.filter(it => (it.yuanwen + it.jiedu).indexOf(kw) >= 0);
        const show = hit.slice(0, 30);
        list.innerHTML = '<div class="muted">命中 ' + hit.length + ' 条（显示前 ' + show.length + ' 条）</div>' + show.map(it =>
          '<div style="margin:6px 0;padding:6px 8px;background:rgba(0,0,0,.16);border-radius:6px;"><b>' + esc6(it.yuanwen) + '</b><br><span style="color:var(--tx2);font-size:12px;">' + esc6(it.jiedu) + '</span></div>').join('');
      };
      qjGo.addEventListener('click', renderQj);
      qjQ.addEventListener('keydown', e => { if (e.key === 'Enter') renderQj(); });
    }
    // 黄金策解读：本卦机判（平铺 59 规则 + 活步骤 4 组）
    const qjJBtn = document.getElementById('gj-qj-j-btn');
    if (qjJBtn) qjJBtn.addEventListener('click', () => {
      const j = document.getElementById('gj-j-qj');
      if (!j) return;
      j.dataset.rendered = '1';
      if (!LY_CTX) { j.innerHTML = '<div class="muted">尚未起卦——先在上方摇卦/输卦，再点本按钮。</div>'; return; }
      j.innerHTML = lyGuJiBoxHtml(lyQjJieduCat());
    });
  }
  liuyaoInit = lyInit;
})();

  // ================= kinastro 中国区新体系（铁板/邵子/北极/南极/蠢子/皇极；kinastro/MIT 现代整理层） =================
  function kinastroInit() {
    if (!D) return;
    // 铁板
    if (D.tieban) {
      const catSel = $('tb-cat');
      if (catSel && D.tieban.verses && D.tieban.verses._meta) {
        (D.tieban.verses._meta.categories || []).forEach((c) => { const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o); });
      }
      if ($('tb-go')) $('tb-go').addEventListener('click', tbGo);
      if ($('tb-kw-go')) $('tb-kw-go').addEventListener('click', tbKw);
      if ($('tb-code')) $('tb-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') tbGo(); });
      if ($('tb-kw')) $('tb-kw').addEventListener('keydown', (e) => { if (e.key === 'Enter') tbKw(); });
      if (catSel) catSel.addEventListener('change', tbKw);
    }
    // 邵子
    if (D.shaozi) {
      if ($('sz-go')) $('sz-go').addEventListener('click', szGo);
      if ($('sz-kw-go')) $('sz-kw-go').addEventListener('click', szKw);
      if ($('sz-code')) $('sz-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') szGo(); });
      if ($('sz-kw')) $('sz-kw').addEventListener('keydown', (e) => { if (e.key === 'Enter') szKw(); });
    }
    // 北极
    if (D.beiji) {
      if ($('bj-go')) $('bj-go').addEventListener('click', bjGo);
      if ($('bj-kw-go')) $('bj-kw-go').addEventListener('click', bjKw);
      if ($('bj-code')) $('bj-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') bjGo(); });
      if ($('bj-kw')) $('bj-kw').addEventListener('keydown', (e) => { if (e.key === 'Enter') bjKw(); });
    }
    // 南极
    if (D.nanji) {
      const secSel = $('nj-sec');
      if (secSel) {
        const secs = [];
        D.nanji.rows.forEach((r) => { if (r.section && !secs.includes(r.section)) secs.push(r.section); });
        secs.forEach((s) => { const o = document.createElement('option'); o.value = s; o.textContent = s; secSel.appendChild(o); });
      }
      if ($('nj-go')) $('nj-go').addEventListener('click', njGo);
      if ($('nj-kw')) $('nj-kw').addEventListener('keydown', (e) => { if (e.key === 'Enter') njGo(); });
      if (secSel) secSel.addEventListener('change', njGo);
    }
    // 皇极
    if (D.huangji) {
      const secSel = $('hj-sec');
      if (secSel) {
        D.huangji.sections.forEach((s, i) => { const o = document.createElement('option'); o.value = i; o.textContent = s.title.slice(0, 40) + (s.text.length > 200 ? '' : ''); secSel.appendChild(o); });
      }
      if ($('hj-go')) $('hj-go').addEventListener('click', hjGo);
      if ($('hj-kw-go')) $('hj-kw-go').addEventListener('click', hjKw);
      if ($('hj-kw')) $('hj-kw').addEventListener('keydown', (e) => { if (e.key === 'Enter') hjKw(); });
      if (secSel) secSel.addEventListener('change', hjGo);
    }
  }
  function tbGo() {
    const c = String(($('tb-code') && $('tb-code').value) || '').trim();
    if (!/^\d{4}$/.test(c)) { $('tb-result').innerHTML = '<div class="err">请输入四位条文号（1001–9999）</div>'; return; }
    const tw = D.tieban.tiaowen[c];
    const vs = D.tieban.verses[c];
    let h = '<div class="card"><span class="k">铁板神数 · 条文 ' + esc(c) + '</span>';
    if (tw) {
      h += '<div style="margin:8px 0;line-height:1.8;">' + esc(tw.text) + '</div>';
      if (tw.note && tw.note !== '0 0') h += '<div class="muted">考刻注：' + esc(tw.note) + '</div>';
      if (tw.is_blank) h += '<div class="muted" style="color:#c9a86a;">（原文此条为空白/缺字条）</div>';
    } else h += '<div class="muted">条文 ' + c + ' 未收录（12000 条范围内无此号）。</div>';
    if (vs) {
      h += '<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px;"><span class="k">歌诀（' + esc(vs.category) + '）</span><div style="margin-top:6px;">' + esc(vs.verse) + '</div><div class="muted" style="font-size:12px;margin-top:4px;">清刻足本整理 · 行号 ' + esc(String(vs.line_num)) + '</div></div>';
    }
    h += '<div class="muted" style="font-size:11px;margin-top:8px;">来源：kinastro(MIT) 现代整理层，非古籍扫描。条文号为整理编号。</div></div>';
    $('tb-result').innerHTML = h;
  }
  function tbKw() {
    const kw = (($('tb-kw') && $('tb-kw').value) || '').trim();
    const cat = ($('tb-cat') && $('tb-cat').value) || '';
    const vs = D.tieban.verses;
    const hits = [];
    for (const k of Object.keys(vs)) {
      if (k === '_meta') continue;
      const v = vs[k];
      if (cat && v.category !== cat) continue;
      if (kw && !(v.verse.includes(kw))) continue;
      hits.push({ k, v });
      if (hits.length >= 200) break;
    }
    if (!hits.length) { $('tb-result').innerHTML = '<div class="muted">无命中（关键词 ' + esc(kw || '(空)') + (cat ? '，类别 ' + esc(cat) : '') + '）。</div>'; return; }
    $('tb-result').innerHTML = '<div class="card"><span class="k">歌诀命中 ' + hits.length + ' 条' + (kw ? '（关键词：' + esc(kw) + '）' : '') + (cat ? '（类别：' + esc(cat) + '）' : '') + '</span>' +
      hits.map((x) => '<div style="margin:6px 0;padding:6px 8px;background:rgba(0,0,0,.14);border-radius:6px;"><b>' + esc(x.k) + '</b> <span class="tag">' + esc(x.v.category) + '</span><div style="margin-top:4px;">' + esc(x.v.verse) + '</div></div>').join('') +
      '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinastro(MIT) 现代整理层。最多显示 200 条。</div></div>';
  }
  function szGo() {
    const c = String(($('sz-code') && $('sz-code').value) || '').trim();
    if (!/^\d{4}$/.test(c)) { $('sz-result').innerHTML = '<div class="err">请输入四位条文号</div>'; return; }
    const hit = D.shaozi.rows.find((r) => r.code === c);
    $('sz-result').innerHTML = hit
      ? '<div class="card"><span class="k">邵子神数 · 条文 ' + esc(c) + '（卦：' + esc(hit.gua) + '）</span><div style="margin:8px 0;line-height:1.8;">' + esc(hit.text) + '</div><div class="muted" style="font-size:11px;">来源：kinastro(MIT) 现代整理层。</div></div>'
      : '<div class="muted">条文 ' + esc(c) + ' 未收录。</div>';
  }
  function szKw() {
    const kw = (($('sz-kw') && $('sz-kw').value) || '').trim();
    const hits = D.shaozi.rows.filter((r) => !kw || r.text.includes(kw)).slice(0, 200);
    $('sz-result').innerHTML = '<div class="card"><span class="k">邵子命中 ' + hits.length + ' 条' + (kw ? '（关键词：' + esc(kw) + '）' : '') + '</span>' +
      hits.map((r) => '<div style="margin:6px 0;padding:6px 8px;background:rgba(0,0,0,.14);border-radius:6px;"><b>' + esc(r.code) + '</b> <span class="tag">' + esc(r.gua) + '</span><div style="margin-top:4px;">' + esc(r.text) + '</div></div>').join('') +
      '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinastro(MIT) 现代整理层。最多 200 条。</div></div>';
  }
  function bjGo() {
    const c = String(($('bj-code') && $('bj-code').value) || '').trim();
    if (!/^\d{3,4}$/.test(c)) { $('bj-result').innerHTML = '<div class="err">请输入三位或四位条文号</div>'; return; }
    const hit = D.beiji.rows.find((r) => r.code === c);
    $('bj-result').innerHTML = hit
      ? '<div class="card"><span class="k">北极神数 · 条文 ' + esc(c) + '</span><div style="margin:8px 0;line-height:1.8;">' + esc(hit.text) + '</div><div class="muted" style="font-size:11px;">来源：kinastro(MIT) 现代整理层。</div></div>'
      : '<div class="muted">条文 ' + esc(c) + ' 未收录。</div>';
  }
  function bjKw() {
    const kw = (($('bj-kw') && $('bj-kw').value) || '').trim();
    const hits = D.beiji.rows.filter((r) => !kw || r.text.includes(kw)).slice(0, 200);
    $('bj-result').innerHTML = '<div class="card"><span class="k">北极命中 ' + hits.length + ' 条' + (kw ? '（关键词：' + esc(kw) + '）' : '') + '</span>' +
      hits.map((r) => '<div style="margin:6px 0;padding:6px 8px;background:rgba(0,0,0,.14);border-radius:6px;"><b>' + esc(r.code) + '</b><div style="margin-top:4px;">' + esc(r.text) + '</div></div>').join('') +
      '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinastro(MIT) 现代整理层。最多 200 条。</div></div>';
  }
  function njGo() {
    const kw = (($('nj-kw') && $('nj-kw').value) || '').trim();
    const sec = ($('nj-sec') && $('nj-sec').value) || '';
    const hits = D.nanji.rows.filter((r) => (!sec || r.section === sec) && (!kw || (r.verse.includes(kw) || (r.comment || '').includes(kw)))).slice(0, 200);
    $('nj-result').innerHTML = '<div class="card"><span class="k">南极命中 ' + hits.length + ' 条' + (kw ? '（关键词：' + esc(kw) + '）' : '') + (sec ? '（部类：' + esc(sec) + '）' : '') + '</span>' +
      hits.map((r) => '<div style="margin:6px 0;padding:6px 8px;background:rgba(0,0,0,.14);border-radius:6px;"><span class="tag">' + esc(r.section) + '</span> <b>' + esc(r.code) + '</b><div style="margin-top:4px;">' + esc(r.verse) + '</div>' + (r.comment ? '<div class="muted" style="margin-top:2px;">' + esc(r.comment) + '</div>' : '') + '</div>').join('') +
      '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinastro(MIT) 现代整理层。最多 200 条。</div></div>';
  }
  function hjGo() {
    const i = ($('hj-sec') && $('hj-sec').value) || '';
    if (i === '' || !D.huangji.sections[i]) { $('hj-result').innerHTML = '<div class="muted">请选择章节。</div>'; return; }
    const s = D.huangji.sections[i];
    $('hj-result').innerHTML = '<div class="card"><span class="k">皇极经世书 · ' + esc(s.title) + '</span><div style="margin:8px 0;line-height:1.9;white-space:pre-wrap;font-size:13px;">' + esc(s.text) + '</div><div class="muted" style="font-size:11px;">来源：kinastro(MIT) 整理（繁体转简体）。全文 ' + D.huangji.sections.length + ' 节。</div></div>';
  }
  function hjKw() {
    const kw = (($('hj-kw') && $('hj-kw').value) || '').trim();
    if (!kw) { $('hj-result').innerHTML = '<div class="muted">请输入关键词。</div>'; return; }
    const hits = [];
    D.huangji.sections.forEach((s, i) => {
      if (s.text.includes(kw)) hits.push({ i, s });
    });
    if (!hits.length) { $('hj-result').innerHTML = '<div class="muted">无命中（' + esc(kw) + '）。</div>'; return; }
    $('hj-result').innerHTML = '<div class="card"><span class="k">皇极经世全文命中 ' + hits.length + ' 节（关键词：' + esc(kw) + '）</span>' +
      hits.slice(0, 50).map((x) => {
        const idx = x.s.text.indexOf(kw);
        const ctx = x.s.text.slice(Math.max(0, idx - 40), idx + kw.length + 60).replace(/[\n\r]+/g, ' ');
        return '<div style="margin:6px 0;padding:6px 8px;background:rgba(0,0,0,.14);border-radius:6px;"><b>' + esc(x.s.title) + '</b><div style="margin-top:4px;">…' + esc(ctx) + '…</div></div>';
      }).join('') +
      '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinastro(MIT) 整理（繁体转简体）。最多 50 节。</div></div>';
  }
})();
