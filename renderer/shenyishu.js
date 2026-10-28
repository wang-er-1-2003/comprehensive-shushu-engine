// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 神易数兵占（讲武全书兵占卷之十六·明州玄谷蔡时宜撰）
// kentang2017/MIT 现代整理层移植（shenyishu.py 逐行对译，繁体转简体）
// 四柱口径：lunar.js（立春换年/节气月/23时晚子按次日日干起子，与源 sxtwl 默认开关一致）
// 红线：贵人表原仅甲乙年干支 24 键，丙~癸 48 组原表未载 → 如实返回 null 不伪造；不参与评分
'use strict';
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { const api = factory(); root.shenyishuMod = api; root.shenyishuInit = api.init; }
})(typeof self !== 'undefined' ? self : this, function () {

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const gzSplit = (gz) => [gz[0], gz[1] || ''];

  function nextDay(y, m, d) {
    const dt = new Date(Date.UTC(y, m - 1, d + 1));
    return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }

  // 核心排算：与 shenyishu.py 的 Shenyishu.get_bingzhan_result() 输出逐字段对应
  // y/m/d/h：公历年月日与时辰(0-23)；T：数据表（shenyishu.json）；L：lunar 库 Solar 类
  function syCompute(y, m, d, h, T, L) {
    if (!T || !L || typeof L.fromYmdHms !== 'function') return { ok: false, reason: '数据表或历法库未加载' };
    // 四柱：23 时换日（年月日柱取次日；时柱按原时刻 lunar 晚子时口径，对应源 after23_new_day=1/late_zi_next_day=1）
    let Y = y, M = m, Dd = d;
    if (h === 23) { const nd = nextDay(y, m, d); Y = nd.y; M = nd.m; Dd = nd.d; }
    const lunDay = L.fromYmdHms(Y, M, Dd, 12, 0, 0).getLunar();
    const lunHour = L.fromYmdHms(y, m, d, h, 0, 0).getLunar();
    const gz = {
      年: lunDay.getYearInGanZhiExact(),
      月: lunDay.getMonthInGanZhiExact(),
      日: lunDay.getDayInGanZhi(),
      时: lunHour.getTimeInGanZhi()
    };

    const code = (p) => T.jiazi_code[p] || 0;
    const total = code(gz.年) + code(gz.月) + code(gz.日) + code(gz.时);

    // 总数分析（行军占：百位主将/十位我兵/个位贼寇）
    const bai = Math.floor(total / 100) % 10, shi = Math.floor(total / 10) % 10, ge = total % 10;
    const zongshu = {
      百位: { 数: bai, 卦: (T.zongshu_bai[String(bai)] || '坤'), 主将: '主将', 阴阳: (bai % 2 === 1 ? '阳' : '阴') },
      十位: { 数: shi, 卦: (T.zongshu_shi[String(shi)] || '离'), 我兵: '我兵', 阴阳: (shi % 2 === 1 ? '阳' : '阴') },
      个位: { 数: ge, 卦: (T.zongshu_ge[String(ge)] || '乾'), 贼寇: '贼寇', 阴阳: (ge % 2 === 1 ? '阳' : '阴') }
    };

    // 主客判断
    const zhuke = (function () {
      const result = [];
      let jieguo = '';
      if (bai > shi) { result.push('主将强于我兵'); jieguo = '主将威明'; }
      else if (shi > bai) { result.push('我兵强于主将'); jieguo = '兵强勇捍'; }
      else { result.push('主将与相当'); jieguo = '和'; }
      if (ge % 2 === 1) { result.push('阳数贼寇衰弱'); jieguo += ' - 阳数吉利'; }
      else { result.push('阴数贼寇强盛'); jieguo += ' - 阴数主凶'; }
      if (bai === 0) result.push('百位归坤');
      if (shi === 0) result.push('十位归离');
      if (ge === 0) result.push('个位归乾');
      return { 结论: jieguo, 分析: result };
    })();

    // 连山/归藏/八卦
    const lianshan = T.lianshan[String(total % 10 === 0 ? 10 : total % 10)] || '艮';
    const guicang = T.guicang[String(total % 9 === 0 ? 9 : total % 9)] || '山';
    const guaArr = String(total).split('').map((ch) => T.gua_num[ch] || '艮');

    // 五行（干支→五行拼接）
    const wuxingMap = T.wuxing;
    const wx = (gz) => gzSplit(gz).map((c) => wuxingMap[c] || '').join('');
    const wuxing = { 年: wx(gz.年), 月: wx(gz.月), 日: wx(gz.日), 时: wx(gz.时) };

    // 神煞（贵人原表仅甲乙年干支 → 未载返回 null）
    const yearGz = gz.年;
    const yearGan = yearGz[0], yearZhi = yearGz[1];
    const has = (k) => Object.prototype.hasOwnProperty.call(T, k);
    const shensha = {
      年干: yearGz,
      贵人: (has('guiren') && T.guiren[yearGz]) || null,
      驿马: (T.yima[yearZhi] || '坤'),
      血光: (T.xueguang[yearGan] || '坤'),
      天财: (T.tiancai[yearGan] || '艮'),
      魁元: (T.kuiyuan[yearGan] || '震'),
      羊刃: (T.yangren[yearGan] || '震'),
      正禄: (T.zhenglu[yearGan] || '艮'),
      白虎: (T.baihu[yearGan] || '金'),
      破碎: ('子午卯酉'.indexOf(yearZhi) >= 0 ? '巽' : '寅申巳亥'.indexOf(yearZhi) >= 0 ? '兑' : '辰戌丑未'.indexOf(yearZhi) >= 0 ? '艮' : '艮'),
      劫杀: ('寅午戌'.indexOf(yearZhi) >= 0 ? '乾' : '申子辰'.indexOf(yearZhi) >= 0 ? '巽' : '亥卯未'.indexOf(yearZhi) >= 0 ? '坤' : '巳酉丑'.indexOf(yearZhi) >= 0 ? '艮' : '乾'),
      马带刀: (T.yima[yearZhi] === (T.yangren[yearGan] || '震') ? '是' : '否'),
      宝马: ((T.guiren[yearGz] && T.guiren[yearGz] === (T.zhenglu[yearGan] || '艮') && ['乾', '艮', '巽'].indexOf(T.yima[yearZhi]) >= 0) ? '是' : '否')
    };

    // 长生（年月日三柱，不含时）
    const changsheng = {};
    for (const k of ['年', '月', '日']) {
      const idx = T.changsheng_idx[gz[k][0]] || 0;
      changsheng[k] = T.changsheng_order.slice(idx, idx + 4);
    }

    // 吉凶评分
    const score = (function () {
      const R = T.score_rules || {};
      let s = 0;
      const reasons = [];
      const active = lianshan;
      if (shensha.贵人 && shensha.贵人 === active) { s += R.guiren || 30; reasons.push('贵人助力(+30)'); }
      if (shensha.天财 === active) { s += R.tiancai || 20; reasons.push('天财加持(+20)'); }
      if (shensha.魁元 === active) { s += R.kuiyuan || 15; reasons.push('魁元照临(+15)'); }
      if (shensha.驿马 === active && ['乾', '艮', '巽'].indexOf(shensha.驿马) >= 0) { s += R.yima_de || 15; reasons.push('驿马得地(+15)'); }
      if (shensha.血光 === active) { s += R.xueguang || -30; reasons.push('血光之灾(-30)'); }
      if (shensha.白虎 === active) { s += R.baihu || -25; reasons.push('白虎凶煞(-25)'); }
      if (shensha.破碎 === active) { s += R.posui || -20; reasons.push('破碎杀伐(-20)'); }
      if (shensha.劫杀 === active) { s += R.jiesha || -15; reasons.push('劫杀显现(-15)'); }
      if (shensha.马带刀 === '是') { s += R.madaidao || -40; reasons.push('马带刀凶兆(-40)'); }
      if (shensha.宝马 === '是') { s += R.baoma || 30; reasons.push('宝马吉兆(+30)'); }
      if (['坎', '震', '巽'].indexOf(shensha.驿马) >= 0) { s += R.yinquan || 15; reasons.push('饮泉食谷(+15)'); }
      let level = T.levels[T.levels.length - 1];
      for (const lv of T.levels) { if (s >= lv.min) { level = lv; break; } }
      return { level: level.level, score: s, detail: level.detail, reasons };
    })();

    return {
      ok: true,
      生辰: y + '年' + m + '月' + d + '日' + h + '时',
      干支: gz,
      总数: total,
      总数分析: zongshu,
      主客判断: zhuke,
      连山卦: lianshan,
      归藏卦: guicang,
      八卦: guaArr,
      五行: wuxing,
      神煞: shensha,
      长生: changsheng,
      吉凶: score
    };
  }

  // UI 渲染
  function render(r) {
    if (!r.ok) return '<div class="muted">' + esc(r.reason) + '</div>';
    const ss = r.神煞;
    const gui = ss.贵人
      ? esc(ss.贵人)
      : '<span style="color:#d17a7a;">未载（原表仅甲/乙年干支收录，丙~癸 48 组未载，不参与评分）</span>';
    const zk = r.主客判断;
    const jx = r.吉凶;
    const tagCls = { '大吉': 'tag-ji', '吉': 'tag-ji', '平': '', '凶': 'tag-xiong', '大凶': 'tag-xiong' }[jx.level] || '';
    return '' +
      '<div class="card"><h3>四柱（' + esc(r.生辰) + '）</h3>' +
      '<div class="sy-gz">' + ['年', '月', '日', '时'].map((k) => '<span class="sy-gz-i"><b>' + esc(r.干支[k]) + '</b>' + esc(k) + '柱</span>').join('') + '</div>' +
      '<div class="muted" style="font-size:11px;margin-top:6px;">口径：立春换年/节气月；23 时换日，晚子时按次日日干起子（与源 Python 默认一致）。</div></div>' +
      '<div class="card"><h3>总数 <b style="color:var(--acc)">' + r.总数 + '</b>（年+月+日+时甲子码合计）</h3>' +
      '<div class="sy-zw">' + ['百位', '十位', '个位'].map((k) => {
        const p = r.总数分析[k];
        return '<div class="sy-zw-i"><b>' + esc(p.卦) + '</b><span>' + esc(k) + '（' + esc(p[Object.keys(p).find((x) => x !== '数' && x !== '卦' && x !== '阴阳')] || '') + '）' + p.数 + ' · ' + esc(p.阴阳) + '数</span></div>';
      }).join('') + '</div>' +
      '<div class="sy-zk">主客判断：<b>' + esc(zk.结论) + '</b><ul>' + zk.分析.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul></div></div>' +
      '<div class="card"><h3>连山卦 ' + esc(r.连山卦) + ' · 归藏卦 ' + esc(r.归藏卦) + ' · 八卦 ' + r.八卦.map(esc).join('') + '</h3>' +
      '<div class="sy-wx">五行：' + ['年', '月', '日', '时'].map((k) => esc(k) + '=' + esc(r.五行[k])).join('　') + '</div></div>' +
      '<div class="card"><h3>神煞（依年干支 ' + esc(ss.年干) + '）</h3>' +
      '<table class="sy-ss"><tbody>' +
      '<tr><td>贵人</td><td>' + gui + '</td><td>驿马</td><td>' + esc(ss.驿马) + '</td></tr>' +
      '<tr><td>血光</td><td>' + esc(ss.血光) + '</td><td>天财</td><td>' + esc(ss.天财) + '</td></tr>' +
      '<tr><td>魁元</td><td>' + esc(ss.魁元) + '</td><td>羊刃</td><td>' + esc(ss.羊刃) + '</td></tr>' +
      '<tr><td>正禄</td><td>' + esc(ss.正禄) + '</td><td>白虎</td><td>' + esc(ss.白虎) + '</td></tr>' +
      '<tr><td>破碎</td><td>' + esc(ss.破碎) + '</td><td>劫杀</td><td>' + esc(ss.劫杀) + '</td></tr>' +
      '<tr><td>马带刀</td><td>' + esc(ss.马带刀) + '</td><td>宝马</td><td>' + esc(ss.宝马) + '</td></tr>' +
      '</tbody></table>' +
      '<div class="sy-cs">长生：' + ['年', '月', '日'].map((k) => esc(k) + ' ' + r.长生[k].map(esc).join('→')).join('　') + '</div></div>' +
      '<div class="card"><h3>吉凶：<span class="' + tagCls + '">' + esc(jx.level) + '</span>　评分 <b>' + jx.score + '</b></h3>' +
      '<div class="sy-jx">' + esc(jx.detail) + (jx.reasons.length ? '<ul>' + jx.reasons.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<div class="muted">无加分/减分项命中。</div>') + '</div></div>' +
      '<div class="muted" style="font-size:11px;margin-top:6px;">来源：shenyishu/kentang2017/MIT 现代整理层（讲武全书兵占卷之十六），繁体转简体；表数据照录原 Python 源码。</div>';
  }

  function init() {
    if (typeof document === 'undefined') return;
    const go = document.getElementById('sy-go');
    if (!go) return;
    go.addEventListener('click', () => {
      const T = (typeof window !== 'undefined' && window.__DATA && window.__DATA.shenyishu) || null;
      const L = (typeof window !== 'undefined' && window.Solar && window.Solar.fromYmdHms) ? window.Solar : null;
      const y = parseInt(document.getElementById('sy-y').value, 10);
      const m = parseInt(document.getElementById('sy-m').value, 10);
      const d = parseInt(document.getElementById('sy-d').value, 10);
      const h = parseInt(document.getElementById('sy-h').value, 10);
      const out = document.getElementById('sy-result');
      if (!(y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31 && h >= 0 && h <= 23)) {
        out.innerHTML = '<div class="muted" style="color:#d17a7a;">请输入合法公历年(1-9999)/月/日/时(0-23)。</div>';
        return;
      }
      out.innerHTML = render(syCompute(y, m, d, h, T, L));
    });
    const hint = document.getElementById('sy-hint');
    if (hint && window.__DATA && window.__DATA.shenyishu) {
      const T = window.__DATA.shenyishu;
      const n = Object.keys(T.jiazi_code || {}).length;
      hint.textContent = '已加载甲子码表 ' + n + ' 条、神煞表 ' + (T.entryCount ? T.entryCount.shensha_tables : 9) + ' 张。输入公历年/月/日/时(0-23)点「起课」：四柱→总数→行军占→连山/归藏/八卦→神煞→吉凶评分。';
    }
  }

  return { syCompute, render, init, nextDay };
});
