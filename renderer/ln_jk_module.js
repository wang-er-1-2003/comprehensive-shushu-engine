// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// ========== Tab 19 大六壬（四课三传体系，720 局查表） ==========
(() => {
  const $ = (id) => document.getElementById(id);
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const WX = { 木: '木', 火: '火', 土: '土', 金: '金', 水: '水' };
  const SHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const LEI_LIST = ['天时', '家宅', '婚姻', '疾病', '行人', '出行', '求财', '功名', '胎产', '争讼', '失脱', '捕获', '仕宦', '投谒', '坟葬', '谋望'];
  const gz = (s) => ZHI.indexOf(s);
  const k2 = (a, b) => (a + b + 12) % 12;
  // 天干五行
  const ganWx = (g) => ({ 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' }[g]);
  // 生克：ke(a,b) = a 克 b
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const ke = (a, b) => KE[a] === b;
  const sheng = (a, b) => ({ 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }[a] === b);
  // 十二支五行
  const zhiWx = (z) => ({ 寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金', 亥: '水', 子: '水', 辰: '土', 戌: '土', 丑: '土', 未: '土' }[z]);
  // 六十甲子
  const JIAZI = [];
  for (let i = 0; i < 60; i++) JIAZI.push(GAN[i % 10] + ZHI[i % 12]);
  // 今日干支（简化：按 60 循环距 2026-10-22=甲子日偏移；实际按公历推算）
  function todayGanzhi() {
    const base = new Date(2026, 9, 22); // 2026-10-22 = 甲子日（校验用基准）
    const days = Math.floor((Date.now() - base.getTime()) / 86400000);
    const j = ((days % 60) + 60) % 60;
    return JIAZI[j];
  }
  function isYinGan(g) { return '乙丁己辛癸'.indexOf(g) >= 0; }
  // 天盘：月将加时，顺布十二支
  function tianpan(yj, shi) {
    const t = {};
    for (let i = 0; i < 12; i++) t[ZHI[i]] = ZHI[k2(gz(yj), i - gz(shi))];
    return t;
  }
  // 四课
  function siKe(tp, day, jigong) {
    const gan = day[0], zhi = day[1];
    const gzh = jigong[gan]; // 干寄宫
    const gshang = tp[gzh]; // 干上神（第一课·上）
    const k2shang = tp[gshang]; // 第二课
    const zshang = tp[zhi]; // 支上神（第三课）
    const k4shang = tp[zshang]; // 第四课
    return [
      { xia: gzh, shang: gshang, tag: '干上' },
      { xia: gshang, shang: k2shang, tag: '干阳' },
      { xia: zhi, shang: zshang, tag: '支上' },
      { xia: zshang, shang: k4shang, tag: '支阳' },
    ];
  }
  // 九宗门判课体 + 初传
  function keTi(si, day, tp, jigong) {
    const gan = day[0];
    const upK = [], downK = [];
    si.forEach((k, i) => {
      const sw = zhiWx(k.shang), xw = zhiWx(k.xia);
      if (sw && xw) {
        if (ke(sw, xw)) upK.push({ i, ...k });
        if (ke(xw, sw)) downK.push({ i, ...k });
      }
    });
    // 伏吟 / 返吟
    // （伏吟：天盘==地盘即月将==时；返吟：月将与时相冲 —— 由调用方传入 flag）
    const fuYin = arguments[1] === 'fuyin';
    const fanYin = arguments[1] === 'fanyin';
    if (fuYin) {
      const chuan = si[0].shang;
      return { name: '伏吟课', chuji: chuan, note: '天地盘同位（月将加时恰为伏吟），利静不利动，利君子不利小人。' };
    }
    if (fanYin) {
      const chuan = si[0].shang;
      return { name: '返吟课', chuji: chuan, note: '天地盘相冲（返吟），诸事反复，占事主迟滞反复。' };
    }
    // 贼克
    if (upK.length === 1 && downK.length === 0) {
      return { name: '元首课', chuji: upK[0].shang, note: '一上克下，万事顺利，尊卑有序。' };
    }
    if (downK.length === 1 && upK.length === 0) {
      return { name: '重审课', chuji: downK[0].xia, note: '一下贼上，事逆，再三详审而后行。' };
    }
    // 比用（知一）
    const allK = upK.concat(downK.map(k => ({ ...k, shang: k.xia, dir: 'down' })));
    if (allK.length > 1) {
      const yin = isYinGan(gan);
      const bi = allK.filter(k => isYinGan(zhiToGan(k.shang)) === yin);
      if (bi.length >= 1) {
        return { name: '知一课（比用）', chuji: bi[0].shang, note: '二爻皆动，事有两岐，善比者择而从之。' };
      }
      // 涉害（无比 → 涉归本家取孟仲季）
      const cands = allK.map(k => k.shang);
      const mid = cands.find(z => '子午卯酉'.indexOf(z) >= 0) || cands[0];
      return { name: '涉害课', chuji: mid, note: '诸克无比，涉归本家，以孟仲季深浅为用。' };
    }
    if (allK.length === 1) {
      return { name: allK[0].dir === 'down' ? '重审课' : '元首课', chuji: allK[0].shang, note: '' };
    }
    // 遥克
    const gw = ganWx(gan);
    const yaoke = si.find(k => zhiWx(k.shang) && ke(zhiWx(k.shang), gw));
    const tan = si.find(k => zhiWx(k.shang) && ke(gw, zhiWx(k.shang)));
    if (yaoke) return { name: '蒿矢课（遥克）', chuji: yaoke.shang, note: '四课无克，上神遥克日干，事起远。' };
    if (tan) return { name: '弹射课（遥克）', chuji: tan.shang, note: '四课无克，日干遥克上神，事从内生。' };
    // 昴星 / 别责 / 八专（简化：取干上神）
    if (jigong[gan] === day[1]) {
      return { name: '八专课', chuji: si[0].shang, note: '干支同位，四课止两课，事专一。' };
    }
    return { name: '昴星课', chuji: si[0].shang, note: '无克无遥，取昴星为用（简化取干上）。' };
  }
  function zhiToGan(z) { return { 子: '壬', 丑: '癸', 寅: '甲', 卯: '乙', 辰: '丙', 巳: '丁', 午: '戊', 未: '己', 申: '庚', 酉: '辛', 戌: '壬', 亥: '癸' }[z]; }
  // 三传（递克简化）：初传→中传=初传所克之支（天盘临位），末传=中传所克
  function sanChuan(si, chuji, tp) {
    const c1 = chuji;
    const c1w = zhiWx(c1);
    let c2 = null, c3 = null;
    for (const z of ZHI) {
      if (zhiWx(z) && c1w && ke(c1w, zhiWx(z))) { c2 = tp[z] || z; break; }
    }
    if (!c2) c2 = tp[gz(c1)] || c1;
    const c2w = zhiWx(c2);
    for (const z of ZHI) {
      if (zhiWx(z) && c2w && ke(c2w, zhiWx(z))) { c3 = tp[z] || z; break; }
    }
    if (!c3) c3 = tp[gz(c2)] || c2;
    return [c1, c2, c3];
  }
  // 月将 → 地支（节气表简化：按农历月）
  function yjOf(month) {
    const CORE = D && D.liunren && D.liunren.core;
    if (!CORE) return '亥';
    const jq = CORE.jietiao[month];
    return CORE.yuejiang[jq] || '亥';
  }
  // 时辰 → 旦暮
  function dayNight(hour) {
    return (hour >= 5 && hour <= 17) ? '昼' : '夜';
  }
  function escLn(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function lnInit() {
    const D0 = D;
    if (!D0 || !D0.liunren) { $('ln-title').textContent = '数据加载失败'; return; }
    const CORE = D0.liunren.core;
    // 日干支
    const selDay = $('ln-day');
    selDay.innerHTML = JIAZI.map(g => '<option value="' + g + '">' + g + '</option>').join('');
    selDay.value = todayGanzhi();
    // 时辰
    const selHour = $('ln-hour');
    selHour.innerHTML = SHI.map((z, i) => {
      const h = (i * 2 + 1) % 24;
      return '<option value="' + z + '">' + z + '时（' + (h < 10 ? '0' + h : h) + ':00）</option>';
    }).join('');
    const now = new Date();
    selHour.value = SHI[Math.floor((now.getHours() + 1) / 2) % 12];
    // 月将（农历月简化：用公历月映射）
    const selYj = $('ln-yuejiang');
    const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
    selYj.innerHTML = monthNames.map(m => {
      const jq = CORE.jietiao[m];
      const yj = CORE.yuejiang[jq];
      return '<option value="' + yj + '">' + m + '（' + jq + '后 ' + yj + '将）</option>';
    }).join('');
    // 事类
    const selLei = $('ln-lei');
    selLei.innerHTML = LEI_LIST.map(l => '<option>' + l + '</option>').join('');
    $('ln-today').addEventListener('click', () => { selDay.value = todayGanzhi(); });
    $('ln-go').addEventListener('click', lnGo);
    $('ln-title').textContent = '大六壬 · 四课三传（御定直指 720 局查表）';
  }
  function lnGo() {
    const CORE = D.liunren.core;
    const day = $('ln-day').value;
    const hour = $('ln-hour').value;
    const yj = $('ln-yuejiang').value;
    const lei = $('ln-lei').value;
    const tp = tianpan(yj, hour);
    const si = siKe(tp, day, CORE.jigong);
    const fuyin = yj === hour;
    const fanyin = CORE.chong && CORE.chong[yj] === hour;
    const kt = keTi(si, day, tp, CORE.jigong, fuyin ? 'fuyin' : (fanyin ? 'fanyin' : ''));
    const chuan = sanChuan(si, kt.chuji, tp);
    // 720 局查表：day + ganshang
    const ju720 = D.liunren.ju720 || [];
    const gshang = si[0].shang;
    const rec = ju720.find(r => r.day === day && r.ganshang === gshang);
    // 课经定义
    const keshi = D.liunren.keshi || [];
    const keshiRec = keshi.find(k => rec && k.name && rec.keshi && rec.keshi.indexOf(k.name.slice(0, 2)) >= 0);
    // 类占
    const leiTxt = rec && rec.lei && rec.lei[lei] ? rec.lei[lei] : '（该局无「' + lei + '」类占条目）';
    // 输出
    let h = '';
    h += '<h3>起课信息</h3><div class="src">日 ' + day + ' · ' + hour + '时 · ' + yj + '将 · 事类「' + lei + '」</div>';
    h += '<div class="ln-pan-box">';
    h += '<div style="font-size:13px;color:var(--tx2);margin-bottom:6px;">天盘（' + yj + '将加' + hour + '时）：' +
      ZHI.map(z => z + '→' + tp[z]).join('　') + '</div>';
    h += '<div class="ln-4ke">' + si.map((k, i) =>
      '<div class="ln-ke"><b>第' + (i + 1) + '课 · ' + k.tag + '</b>　下 ' + k.xia + ' 上 ' + k.shang + '</div>').join('') + '</div>';
    h += '<div class="ln-3c">' + chuan.map((c, i) =>
      '<div class="ln-chuan"><b>' + (['初', '中', '末'][i]) + '传</b><br>' + c + '</div>').join('') + '</div>';
    h += '<div style="font-size:13px;margin-top:6px;"><b style="color:var(--acc);">课体：' + escLn(kt.name) + '</b>' +
      (kt.note ? '<span style="color:var(--tx2);">　' + escLn(kt.note) + '</span>' : '') + '</div>';
    h += '</div>';
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
    if (keshiRec) {
      h += '<h3>课经 · ' + escLn(keshiRec.name) + '</h3><div>' + escLn(keshiRec.defn || '') + '</div>';
    }
    // 毕法命中（关键词粗查）
    const bifa = D.liunren.bifa || [];
    const hits = bifa.filter(b => b.name && rec && rec.bifa && rec.bifa.indexOf(b.name.slice(0, 2)) >= 0).slice(0, 3);
    if (hits.length) {
      h += '<h3>毕法疑似命中</h3>' + hits.map(b =>
        '<div><b>' + escLn(b.name) + '</b>　' + escLn((b.tiao || '').replace(/^\S+?第[一二三四五六七八九十百]+/, '')) +
        (b.body ? '<div style="color:var(--tx2);font-size:12px;">' + escLn(b.body.slice(0, 200)) + '…</div>' : '') + '</div>').join('');
    }
    // 翠雨歌类占参考
    const cuiyu = D.liunren.cuiyu || [];
    const cuiRec = cuiyu.find(c => c.name && c.name.indexOf('占') >= 0 && (leiTxt.includes('') || true));
    $('ln-out').innerHTML = h + (cuiRec && false ? '' : '');
    // 说明
    $('ln-si').innerHTML = '<div class="src">方法：月将加时布天盘 → 十干寄宫取干上神 → 四课三传九宗门判课体 → 干上神查御定直指 720 局。' +
      '三传递克为简化实现，课体自动判定；御定断语以 720 局原文为准。毕法/课经为关联参考。</div>';
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
  const ke = (a, b) => KE[a] === b;
  const ganWx = (g) => ({ 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' }[g]);
  const zhiWx = (z) => ({ 寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金', 亥: '水', 子: '水', 辰: '土', 戌: '土', 丑: '土', 未: '土' }[z]);
  function todayGanzhi() {
    const base = new Date(2026, 9, 22);
    const days = Math.floor((Date.now() - base.getTime()) / 86400000);
    return JIAZI[((days % 60) + 60) % 60];
  }
  function escLn(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  // 五子元遁：日干 → 子时干；从子支顺推至目标支
  function wuzi(dayGan, targetZhi) {
    const CORE = D.jinkoujue.core;
    const zi = CORE.wuzi[dayGan];
    const ziIdx = GAN.indexOf(zi);
    const targetIdx = ZHI.indexOf(targetZhi);
    return GAN[(ziIdx + targetIdx) % 10];
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
  }
  function jkGo() {
    const CORE = D.jinkoujue.core;
    const DU = D.jinkoujue.duanyu;
    const difen = $('jk-difen').value;
    const day = $('jk-day').value;
    const hour = $('jk-hour').value;
    const yj = $('jk-yuejiang').value;
    const lei = $('jk-lei').value;
    // 昼夜（卯~申为昼）
    const hIdx = ZHI.indexOf(hour);
    const dayNight = (hIdx >= 3 && hIdx <= 8) ? 'day' : 'night';
    // 贵神支（旦/暮）
    const gui = CORE.guiqi[day[0]];
    const gzhi = dayNight === 'day' ? gui[0] : gui[1];
    // 贵神布法：贵人支起，阳日顺布 / 阴日逆布，取临地分者
    const yin = '乙丁己辛癸'.indexOf(day[0]) >= 0;
    const step = yin ? -1 : 1;
    let guishen = '';
    for (let i = 0; i < 12; i++) {
      const z = ZHI[((ZHI.indexOf(gzhi) + step * i) % 12 + 12) % 12];
      if (z === difen) { guishen = GUI_ORDER[i]; break; }
    }
    if (!guishen) guishen = GUI_ORDER[0];
    const renyuan = wuzi(day[0], difen);
    // 五行与生克
    const gwx = ganWx(renyuan), swx = CORE.guishen[guishen].wx, jwx = CORE.jiang[yj].wx, fwx = zhiWx(difen);
    const gsName = CORE.guishen[guishen].name;
    // 五动判定
    const dongs = [];
    if (ke(gwx, fwx)) dongs.push('妻动（干克方）：占妻妾、防财损折、寻人在家、访人不悦');
    if (ke(swx, gwx)) dongs.push('官动（神克干）：利求官、逢驿马迁官转职、常人公府事');
    if (ke(swx, jwx)) dongs.push('贼动（神克将）：内贼生、勾连诈不明、损财卑幼病');
    if (ke(jwx, swx)) dongs.push('财动（将克神）：利求财、求官不谐、营求喜自来');
    if (ke(fwx, gwx)) dongs.push('鬼动（方克干）：忧灾怪、官亨人出外、争讼带他人');
    // 六十甲子钤查表
    const jin = DU.jiazijin || [];
    const rec = jin.find(r => r.gan === renyuan && r.gui === guishen && r.zhi === difen);
    // 分类断语
    const fenlei = DU.fenlei || [];
    const catRec = fenlei.find(f => f.cat === lei);
    const leiTxt = catRec ? catRec.lines.join('<br>') : '';
    // 干神将方关系断语
    const rel = [];
    const relKey = (a, b, label) => {
      if (a === b) return;
      if (ke(a, b)) rel.push(label + '：' + a + '克' + b);
    };
    relKey(gwx, swx, '人元-贵神');
    relKey(gwx, jwx, '人元-月将');
    relKey(gwx, fwx, '人元-地分');
    relKey(swx, gwx, '贵神-人元');
    relKey(swx, jwx, '贵神-月将');
    relKey(swx, fwx, '贵神-地分');
    relKey(jwx, swx, '月将-贵神');
    relKey(jwx, gwx, '月将-人元');
    relKey(jwx, fwx, '月将-地分');
    relKey(fwx, gwx, '地分-人元');
    relKey(fwx, swx, '地分-贵神');
    relKey(fwx, jwx, '地分-月将');
    // 输出
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
    if (dongs.length) {
      h += '<h3>五动判定</h3>' + dongs.map(d => '<div>' + escLn(d) + '</div>').join('');
    }
    if (rec) {
      h += '<h3>六十甲子钤 · ' + renyuan + '、' + guishen + '、' + difen + '</h3><div class="src">依据：人元干+贵神+地分查 60 条</div>';
      h += '<div>' + escLn(rec.duan) + '</div>';
    }
    if (leiTxt) {
      h += '<h3>分类断语 · ' + lei + '</h3><div>' + leiTxt + '</div>';
    }
    if (rel.length) {
      h += '<h3>四象生克</h3>' + rel.map(r => '<div>' + escLn(r) + '</div>').join('') +
        '<div class="src">按「干神将方」关系取断（金口诀干神将方类断语）</div>';
    }
    h += '<h3>四象所主</h3><div class="src">' +
      '人元：客、天、君、祖、外　贵神：主、宰相、臣、父、官禄　月将：己身、妻、财、亲戚、内　地分：田宅、子孙、奴仆、鞍马、六畜</div>';
    $('jk-out').innerHTML = h;
    $('jk-si').innerHTML = '<div class="src">方法：地分=问课方位 → 月将加时布天盘 → 日干贵人诀（旦/暮）起贵神，阳顺阴逆临地分 → 五子元遁起人元。' +
      '五动按四象生克自动判定；六十甲子钤与分类断语为查表输出。贵神布法为简化（阳顺阴逆），复杂课式以原文为准。</div>';
  }
  jinkoujueInit = jkInit;
})();
