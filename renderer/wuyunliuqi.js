// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 五运六气 — kinastro(MIT) 现代整理层移植
// 依据《黄帝内经·素问》运气七篇：大运/主运/客运/司天在泉/主气/客气/客主加临/运气同化/胜复/郁发/当前时刻位置
'use strict';
(() => {
  const TG = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const TG_YY = { '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳', '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴' };
  const TG_HUA = { '甲': '土', '己': '土', '乙': '金', '庚': '金', '丙': '水', '辛': '水', '丁': '木', '壬': '木', '戊': '火', '癸': '火' };
  const DAYUN_TABLE = { '甲': ['土', '宫', '太宫'], '乙': ['金', '商', '少商'], '丙': ['水', '羽', '太羽'], '丁': ['木', '角', '少角'], '戊': ['火', '徵', '太徵'], '己': ['土', '宫', '少宫'], '庚': ['金', '商', '太商'], '辛': ['水', '羽', '少羽'], '壬': ['木', '角', '太角'], '癸': ['火', '徵', '少徵'] };
  const ZHUYUN = [['初运', '木', '角', '太角'], ['二运', '火', '徵', '少徵'], ['三运', '土', '宫', '太宫'], ['四运', '金', '商', '少商'], ['终运', '水', '羽', '太羽']];
  const ZHUYUN_DAYS = [0, 73.05, 146.10, 219.15, 292.20, 365.25];
  const ZHUQI_ORDER = [['初之气', '厥阴风木', '风'], ['二之气', '少阴君火', '热'], ['三之气', '少阳相火', '火'], ['四之气', '太阴湿土', '湿'], ['五之气', '阳明燥金', '燥'], ['六之气', '太阳寒水', '寒']];
  const ZHUQI_DAYS = [0, 60.875, 121.75, 182.625, 243.5, 304.375, 365.25];
  const LIUQI_WX = { '厥阴风木': '木', '少阴君火': '火', '少阳相火': '火', '太阴湿土': '土', '阳明燥金': '金', '太阳寒水': '水' };
  const DZ_SITIAN = { '子': '少阴君火', '午': '少阴君火', '丑': '太阴湿土', '未': '太阴湿土', '寅': '少阳相火', '申': '少阳相火', '卯': '阳明燥金', '酉': '阳明燥金', '辰': '太阳寒水', '戌': '太阳寒水', '巳': '厥阴风木', '亥': '厥阴风木' };
  const DZ_ZAIQUAN = { '子': '阳明燥金', '午': '阳明燥金', '丑': '太阳寒水', '未': '太阳寒水', '寅': '厥阴风木', '申': '厥阴风木', '卯': '少阴君火', '酉': '少阴君火', '辰': '太阴湿土', '戌': '太阴湿土', '巳': '少阳相火', '亥': '少阳相火' };
  const STEP_ORDER = ['厥阴风木', '少阴君火', '太阴湿土', '少阳相火', '阳明燥金', '太阳寒水'];
  const DZ_WX = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  const SHENGFU = { '木': ['土', '金'], '火': ['金', '水'], '土': ['水', '木'], '金': ['木', '火'], '水': ['火', '土'] };
  const YUFA = { '木': '达之', '火': '汗之', '土': '夺之', '金': '泄之', '水': '折之' };
  const QI_ATTR = {
    '厥阴风木': { nature: '风', organ: '肝胆', season: '春', color: '青', taste: '酸', climate: '温和多风', disease: '头晕目眩、筋挛抽搐、情绪不稳' },
    '少阴君火': { nature: '热', organ: '心小肠', season: '夏（前）', color: '赤', taste: '苦', climate: '暖热', disease: '心悸失眠、口舌生疮、高热神昏' },
    '少阳相火': { nature: '火', organ: '三焦心包', season: '夏（后）', color: '赤', taste: '苦', climate: '炎热酷暑', disease: '暑热中暑、烦躁口渴、疮疡肿毒' },
    '太阴湿土': { nature: '湿', organ: '脾胃', season: '长夏', color: '黄', taste: '甘', climate: '湿热潮闷', disease: '水肿腹泻、纳呆便溏、四肢沉重' },
    '阳明燥金': { nature: '燥', organ: '肺大肠', season: '秋', color: '白', taste: '辛', climate: '干燥凉爽', disease: '咳嗽气喘、皮肤干燥、大便秘结' },
    '太阳寒水': { nature: '寒', organ: '肾膀胱', season: '冬', color: '黑', taste: '咸', climate: '严寒冰冻', disease: '骨节疼痛、腰膝冷痛、水肿小便不利' },
  };
  const YUN_ATTR = {
    '木': { tone: '角', organ: '肝胆', season: '春', color: '青绿', climateTai: '发生之纪，生气达畅', climateShao: '委和之纪，生气不荣', diseaseTai: '风气偏盛，筋病为主', diseaseShao: '肝气不足，易受金侮' },
    '火': { tone: '徵', organ: '心小肠', season: '夏', color: '赤红', climateTai: '赫曦之纪，火热炎上', climateShao: '伏明之纪，火气不彰', diseaseTai: '热盛神昏，心火亢盛', diseaseShao: '心气虚衰，多寒病' },
    '土': { tone: '宫', organ: '脾胃', season: '长夏', color: '黄', climateTai: '敦阜之纪，土气厚重', climateShao: '卑监之纪，化气不令', diseaseTai: '湿气太过，水肿脾病', diseaseShao: '土气不足，木乘脾土' },
    '金': { tone: '商', organ: '肺大肠', season: '秋', color: '白', climateTai: '坚成之纪，燥气清肃', climateShao: '从革之纪，燥气不成', diseaseTai: '燥胜则干，肺金偏盛', diseaseShao: '肺金不足，火来侮金' },
    '水': { tone: '羽', organ: '肾膀胱', season: '冬', color: '黑', climateTai: '流衍之纪，寒气偏盛', climateShao: '涸流之纪，水化不行', diseaseTai: '寒盛水泛，肾虚骨病', diseaseShao: '肾水不足，土克水虚' },
  };
  const TONG_HUA = {
    '天符': '天符之年：大运五行与司天之气相同，气化偏盛，疾病急剧，治疗困难，死亡率高。',
    '岁会': '岁会之年：大运五行与岁支五行相同，气化偏盛，但较天符缓和，疾病较多。',
    '太乙天符': '太乙天符之年：天符且岁会，气化最盛，为最凶之年，疾病最重，死亡率最高。',
    '同天符': '同天符：阳年大运与司天之气相同（非天符），气化偏盛，病情较重。',
    '同岁会': '同岁会：阴年大运与岁支五行相同，气化偏盛，病情中等。',
    '平气之年': '平气之年：运气相对平和，无特殊偏盛，较为吉利。',
  };
  function ganzhi(year) { const o = ((year - 4) % 60 + 60) % 60; const gz = TG[o % 10] + DZ[o % 12]; return [gz[0], gz[1], gz]; }
  function keyunOrder(wx, taishao) {
    const cycle = ['木', '火', '土', '金', '水'];
    const tsCycle = taishao.startsWith('太') ? ['太', '少'] : ['少', '太'];
    const start = cycle.indexOf(wx);
    const names = ['初运', '二运', '三运', '四运', '终运'];
    const yins = ['角', '徵', '宫', '商', '羽'];
    const out = [];
    for (let i = 0; i < 5; i++) {
      const wi = (start + i) % 5;
      out.push([names[i], cycle[wi], yins[wi], tsCycle[i % 2] + yins[wi]]);
    }
    return out;
  }
  function keqiSteps(sitian) {
    const si = STEP_ORDER.indexOf(sitian);
    const start = (si - 2 + 6) % 6;
    const out = [];
    for (let i = 0; i < 6; i++) out.push(STEP_ORDER[(start + i) % 6]);
    return out;
  }
  function compute(year, month, day, hour, minute) {
    const yunYear = (month === 1 && day < 20) ? year - 1 : year;
    const [tg, dz, gz] = ganzhi(yunYear);
    const yinyang = TG_YY[tg];
    const [dw, dtone, dts] = DAYUN_TABLE[tg];
    const isTai = yinyang === '阳';
    const dy = { wuxing: dw, tone: dtone, taishao: dts, yinyang, isTai, attr: YUN_ATTR[dw] };
    const zy = ZHUYUN.map(([n, w, t, ts], i) => ({ name: n, wuxing: w, tone: t, taishao: ts, start: ZHUYUN_DAYS[i], end: ZHUYUN_DAYS[i + 1] }));
    const ky = keyunOrder(dw, dts).map(([n, w, t, ts]) => ({ name: n, wuxing: w, tone: t, taishao: ts }));
    const sitian = DZ_SITIAN[dz];
    const zaiquan = DZ_ZAIQUAN[dz];
    const zq = ZHUQI_ORDER.map(([n, q, na], i) => ({ name: n, qi: q, nature: na, start: ZHUQI_DAYS[i], end: ZHUQI_DAYS[i + 1], attr: QI_ATTR[q] }));
    const kq = keqiSteps(sitian).map((q, i) => ({ name: ['初之气', '二之气', '三之气', '四之气', '五之气', '终之气'][i], qi: q, nature: QI_ATTR[q].nature, attr: QI_ATTR[q] }));
    // 客主加临
    const SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const KE = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
    const jialin = [];
    for (let i = 0; i < 6; i++) {
      const zw = LIUQI_WX[zq[i].qi], kw = LIUQI_WX[kq[i].qi];
      let rel, eff;
      if (zw === kw) { rel = '同化'; eff = '客主同气，化气和平，气候正常，少有疾病。'; }
      else if (SHENG[zw] === kw) { rel = '顺化'; eff = '主生客，顺化平和，气候温和，疾病较少，预后佳。'; }
      else if (SHENG[kw] === zw) { rel = '小逆'; eff = '客生主，小逆之气，气候略有偏差，稍有病邪，不甚严重。'; }
      else if (KE[kw] === zw) { rel = '不和'; eff = '客克主，不和之气，气候偏差，病邪较多，需注意调护。'; }
      else if (KE[zw] === kw) { rel = '逆'; eff = '主克客，逆气偏盛，气候异常，疾病多发，治疗较难。'; }
      else { rel = '一般'; eff = '客主加临关系复杂，气候变化不定，注意顺应自然。'; }
      jialin.push({ name: zq[i].name, zhu: zq[i].qi, ke: kq[i].qi, rel, eff });
    }
    // 同化
    const stWx = LIUQI_WX[sitian], dzWx = DZ_WX[dz];
    const tianfu = dw === stWx, suihui = dw === dzWx, taiyi = tianfu && suihui;
    const tongTianfu = yinyang === '阳' && tianfu && !taiyi;
    const tongSuihui = yinyang === '阴' && suihui && !taiyi;
    let cat, desc;
    if (taiyi) { cat = '太乙天符'; }
    else if (tianfu) { cat = '天符'; }
    else if (suihui) { cat = '岁会'; }
    else if (tongTianfu) { cat = '同天符'; }
    else if (tongSuihui) { cat = '同岁会'; }
    else { cat = '平气之年'; }
    desc = TONG_HUA[cat];
    // 胜复
    const sf = SHENGFU[dw];
    const shengDesc = isTai
      ? dw + '运太过，气有余，则' + sf[0] + '受克偏亏，' + sf[0] + '之复气应之。'
      : dw + '运不及，' + sf[0] + '气来胜（克' + dw + '之气偏盛），' + dw + '受邪。';
    const fuDesc = isTai
      ? '若' + sf[0] + '气衰，则' + sf[1] + '起而复之，以制' + dw + '之太过。'
      : '胜气偏盛，' + sf[1] + '起而复之，以制' + sf[0] + '之胜。';
    // 当前时刻位置
    const startDt = new Date(yunYear, 0, 20);
    const inputDt = new Date(year, month - 1, day, hour, minute || 0);
    const days = (inputDt - startDt) / 86400000;
    let pos = null;
    if (days >= 0) {
      let zi = 4; for (let i = 0; i < 5; i++) { if (days < ZHUYUN_DAYS[i + 1]) { zi = i; break; } }
      let qi = 5; for (let i = 0; i < 6; i++) { if (days < ZHUQI_DAYS[i + 1]) { qi = i; break; } }
      pos = {
        days,
        zhuyun: { step: zy[zi], pct: Math.min(100, ((days - zy[zi].start) / (zy[zi].end - zy[zi].start)) * 100) },
        keyun: ky[zi],
        zhuqi: { step: zq[qi], pct: Math.min(100, ((days - zq[qi].start) / (zq[qi].end - zq[qi].start)) * 100) },
        keqi: kq[qi],
        jialin: jialin[qi],
      };
    }
    return { yunYear, tg, dz, gz, yinyang, dayun: dy, zhuyun: zy, keyun: ky, sitian, zaiquan, zhuqi: zq, keqi: kq, jialin, tonghua: { cat, desc, tianfu, suihui, taiyi, tongTianfu, tongSuihui }, shengfu: { sheng: sf[0], fu: sf[1], shengDesc, fuDesc }, yufa: Object.fromEntries(['木', '火', '土', '金', '水'].map((w) => [w, YUFA[w]])), pos };
  }
  const escW = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const $ = (id) => document.getElementById(id);
  function wlGo() {
    const y = parseInt($('wl-year').value, 10);
    const m = parseInt($('wl-month').value, 10) || 1;
    const d = parseInt($('wl-day').value, 10) || 20;
    const h = $('wl-hour') ? parseInt($('wl-hour').value, 10) || 0 : 0;
    if (!y) { $('wl-result').innerHTML = '<div class="err">请输入公历年份。</div>'; return; }
    const c = compute(y, m, d, h, 0);
    let htm = '<div class="card"><span class="k">五运六气 · ' + c.yunYear + '年（' + c.gz + ' ' + c.yinyang + '年）' + (m >= 1 ? ' · ' + y + '年' + m + '月' + d + '日' + h + '时' : '') + '</span>';
    // 大运
    const dyA = c.dayun.attr;
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">大运</b>：' + escW(c.dayun.taishao) + '（' + escW(c.dayun.wuxing) + '·' + escW(c.dayun.tone) + '音）——' + (c.dayun.isTai ? '太过（阳年）' : '不及（阴年）') +
      '<div class="muted" style="font-size:12px;">' + (c.dayun.isTai ? escW(dyA.climateTai) : escW(dyA.climateShao)) + '；' + (c.dayun.isTai ? escW(dyA.diseaseTai) : escW(dyA.diseaseShao)) + '。应' + escW(dyA.organ) + '，' + escW(dyA.color) + '，' + escW(dyA.season) + '季。</div></div>';
    // 司天在泉
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">司天</b>：' + escW(c.sitian) + '（' + escW(QI_ATTR[c.sitian].nature) + '）　<b style="color:var(--tx1);">在泉</b>：' + escW(c.zaiquan) + '（' + escW(QI_ATTR[c.zaiquan].nature) + '）</div>';
    // 主运/客运
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">主运五步</b>：' + c.zhuyun.map((s) => '<span class="tag">' + escW(s.name) + ' ' + escW(s.taishao) + '</span>').join('') + '</div>';
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">客运五步</b>：' + c.keyun.map((s) => '<span class="tag">' + escW(s.name) + ' ' + escW(s.taishao) + '</span>').join('') + '</div>';
    // 主气/客气
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">主气六步</b>：' + c.zhuqi.map((s) => '<span class="tag">' + escW(s.name) + ' ' + escW(s.qi) + '</span>').join('') + '</div>';
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">客气六步</b>：' + c.keqi.map((s) => '<span class="tag">' + escW(s.name) + ' ' + escW(s.qi) + '</span>').join('') + '</div>';
    // 客主加临
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">客主加临</b></div><div style="display:flex;flex-direction:column;gap:3px;">' + c.jialin.map((j) => '<div style="padding:3px 8px;background:rgba(0,0,0,.14);border-radius:6px;"><span class="tag">' + escW(j.name) + '</span> 主' + escW(j.zhu) + ' × 客' + escW(j.ke) + ' → <b>' + ({ '顺化': '#6fbf73', '同化': '#6fbf73', '小逆': '#e0a34a', '不和': '#d17a7a', '逆': '#d17a7a', '一般': '#9aa0a6' }[j.rel] ? '<span style="color:' + ({ '顺化': '#6fbf73', '同化': '#6fbf73', '小逆': '#e0a34a', '不和': '#d17a7a', '逆': '#d17a7a', '一般': '#9aa0a6' }[j.rel]) + '">' + escW(j.rel) + '</span>' : escW(j.rel)) + '</b> <span class="muted" style="font-size:12px;">' + escW(j.eff) + '</span></div>').join('') + '</div>';
    // 同化
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">运气同化</b>：<span class="tag" style="' + (c.tonghua.cat === '太乙天符' ? 'color:#d17a7a;' : c.tonghua.cat === '天符' ? 'color:#d17a7a;' : 'color:#6fbf73;') + '">' + escW(c.tonghua.cat) + '</span> <span class="muted" style="font-size:12px;">' + escW(c.tonghua.desc) + '</span></div>';
    // 胜复
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">胜复</b>：<span class="muted">' + escW(c.shengfu.shengDesc) + '</span><div class="muted" style="font-size:12px;">' + escW(c.shengfu.fuDesc) + '</div></div>';
    // 郁发
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">五郁治法</b>：木郁' + escW(c.yufa['木']) + '、火郁' + escW(c.yufa['火']) + '、土郁' + escW(c.yufa['土']) + '、金郁' + escW(c.yufa['金']) + '、水郁' + escW(c.yufa['水']) + '</div>';
    // 当前时刻位置
    if (c.pos) {
      htm += '<div style="margin:6px 0;border-top:1px solid var(--line);padding-top:6px;"><b style="color:var(--tx1);">当前时刻位置</b><div class="muted" style="font-size:12px;">（距本年大寒 ' + Math.round(c.pos.days * 10) / 10 + ' 天）</div>' +
        '<div style="margin-top:4px;"><span class="tag">主运 ' + escW(c.pos.zhuyun.step.name) + ' ' + escW(c.pos.zhuyun.step.taishao) + '</span> 进度 ' + Math.round(c.pos.zhuyun.pct) + '%' +
        '　<span class="tag">客运 ' + escW(c.pos.keyun.taishao) + '</span></div>' +
        '<div><span class="tag">主气 ' + escW(c.pos.zhuqi.step.name) + ' ' + escW(c.pos.zhuqi.step.qi) + '</span> 进度 ' + Math.round(c.pos.zhuqi.pct) + '%' +
        '　<span class="tag">客气 ' + escW(c.pos.keqi.qi) + '</span></div>' +
        '<div><span class="tag">客主加临 ' + escW(c.pos.jialin.rel) + '</span> <span class="muted" style="font-size:12px;">' + escW(c.pos.jialin.eff) + '</span></div></div>';
    }
    htm += '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinastro(MIT) 现代整理层移植（《黄帝内经·素问》运气七篇）。五运六气年起大寒（约1月20日）；输入为公历。六气六步/五运五步边界为天文近似值。</div></div>';
    $('wl-result').innerHTML = htm;
  }
  function wlInit() {
    if ($('wl-go')) $('wl-go').addEventListener('click', wlGo);
  }
  window.wuyunliuqiInit = wlInit;
  window.wuyunliuqiCompute = compute;
})();
