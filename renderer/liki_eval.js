// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// liki_eval.js — liki（GitHub ml8s/liki，MIT）八字断语真值表的本地求值器
// 层位：现代整理层（liki）——非古籍原文照录；每条断语带 liki 依据与经典依据，与古籍层分开标注。
// 语义：四态（命中/没命中/不适用/不可判定）；AND 组内全命中才命中（MISS 优先），OR 分支独立 group（HIT 优先）。
// 口径说明（引擎设定，全部照 liki 原文语义）：透=四干显；藏=支藏而不透；根=地支藏干同五行；
// 得令=月支本气五行当令该十神五行；season_strength=月令当令/得生为 strong，泄/受克/克出为 weak；
// 十神组合旺弱=该十神五行 season_strength；大运十神/为用/为忌等依赖输入的因子：无输入→不可判定，如实不判。
(function () {
  const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  const YANG = { 甲: 1, 丙: 1, 戊: 1, 庚: 1, 壬: 1 };
  const WX_SET = ['木', '火', '土', '金', '水'];
  // 藏干（本气/中气/余气，与术数引擎 bazi.json zanggan 同源）
  const ZANGGAN = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
    辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
    申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
  };
  // 十干禄（禄根）
  const LU = { 甲: '寅', 乙: '卯', 丙: '巳', 丁: '午', 戊: '巳', 己: '午', 庚: '申', 辛: '酉', 壬: '亥', 癸: '子' };
  // 六合/三合/三会/六冲/六害/三刑
  const LIUHE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
  const SANHE = { '申子辰': ['申', '子', '辰'], '亥卯未': ['亥', '卯', '未'], '寅午戌': ['寅', '午', '戌'], '巳酉丑': ['巳', '酉', '丑'] };
  const SANHUI = { '寅卯辰': ['寅', '卯', '辰'], '巳午未': ['巳', '午', '未'], '申酉戌': ['申', '酉', '戌'], '亥子丑': ['亥', '子', '丑'] };
  const LIUCHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
  const LIUHAI = { 子: '未', 未: '子', 丑: '午', 午: '丑', 寅: '巳', 巳: '寅', 卯: '辰', 辰: '卯', 申: '亥', 亥: '申', 酉: '戌', 戌: '酉' };
  const SANXING = { 寅: ['巳', '申'], 巳: ['寅', '申'], 申: ['寅', '巳'], 丑: ['戌', '未'], 戌: ['丑', '未'], 未: ['丑', '戌'], 子: ['卯'], 卯: ['子'], 辰: ['辰'], 午: ['午'], 酉: ['酉'], 亥: ['亥'] };
  const GANHE = { 甲: '己', 己: '甲', 乙: '庚', 庚: '乙', 丙: '辛', 辛: '丙', 丁: '壬', 壬: '丁', 戊: '癸', 癸: '戊' };
  // 五行库（财库/墓库）
  const KU = { 木: '未', 火: '戌', 土: '辰', 金: '丑', 水: '辰' };
  // 十二长生名序（阳顺阴逆），日干对月支取位：长生/沐浴/冠带/临官/帝旺/衰/病/死/墓/绝/胎/养
  const CS_ORDER = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  const CS_TABLE = {
    甲: ['亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌'],
    丙: ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    戊: ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    庚: ['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'],
    壬: ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'],
    乙: ['午', '巳', '辰', '卯', '寅', '丑', '子', '亥', '戌', '酉', '申', '未'],
    丁: ['酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子', '亥', '戌'],
    己: ['酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑', '子', '亥', '戌'],
    辛: ['子', '亥', '戌', '酉', '申', '未', '午', '巳', '辰', '卯', '寅', '丑'],
    癸: ['卯', '寅', '丑', '子', '亥', '戌', '酉', '申', '未', '午', '巳', '辰']
  };
  const HIT = '命中', MISS = '没命中', NA = '不适用', UNKNOWN = '不可判定';
  const TEN_GODS = ['比肩', '劫财', '食神', '伤官', '正财', '偏财', '正官', '七杀', '正印', '偏印'];
  const TEN_CLASS = { 比劫: ['比肩', '劫财'], 食伤: ['食神', '伤官'], 财星: ['正财', '偏财'], 官杀: ['正官', '七杀'], 印星: ['正印', '偏印'] };
  // 六亲角色（照 liki constants 六亲角色：配偶星=财星(男)/官杀(女)，子女星=食伤，父星=财星偏财，母星=印星正印）
  function resolveTens(name, gender) {
    if (name === '配偶星') return (gender === 1 || gender === 'male') ? ['正财', '偏财'] : ['正官', '七杀'];
    if (name === '子女星') return ['食神', '伤官'];
    if (name === '父星') return ['偏财'];
    if (name === '母星') return ['正印'];
    if (TEN_CLASS[name]) return TEN_CLASS[name];
    return [name];
  }
  function shiShenOf(dayGan, other) {
    const dw = WX[dayGan], ow = WX[other];
    const sameYin = (!!YANG[dayGan]) === (!!YANG[other]);
    if (ow === dw) return sameYin ? '比肩' : '劫财';
    if (SHENG[ow] === dw) return sameYin ? '偏印' : '正印';
    if (SHENG[dw] === ow) return sameYin ? '食神' : '伤官';
    if (KE[dw] === ow) return sameYin ? '偏财' : '正财';
    if (KE[ow] === dw) return sameYin ? '七杀' : '正官';
    return '';
  }
  function tenToWx(ten) {
    if (WX_SET.includes(ten)) return ten;
    // 十神→五行（以日主五行相对）
    // 需日主五行，此处由调用方在 base 构建时转换，返回空表示未知
    return '';
  }
  function seasonStrength(monthZhi, wx) {
    const mw = WX[monthZhi];
    if (wx === mw) return 'strong';
    if (SHENG[mw] === wx) return 'strong';
    return 'weak';
  }

  // 事件宫位（照 liki constants：配偶星=日支，父星=年支，母星=年支，子女星=时支，官杀/财星/日主=日支）
  const EVENT_PALACE = { 配偶星: 'day', 父星: 'year', 母星: 'year', 子女星: 'time', 官杀: 'day', 财星: 'day', 日主: 'day' };

  // ── 构建求值上下文 base（依赖 p：术数引擎排盘对象）──
  function buildBase(p, opts) {
    const zanggan = (opts && opts.zanggan) || ZANGGAN;
    const gender = (opts && opts.gender !== undefined) ? opts.gender : 0;
    const dayGan = p.dayGan;
    const dayWx = WX[dayGan];
    const gz = p.gz;
    const zhis = [gz.year[1], gz.month[1], gz.day[1], gz.time[1]];
    const gans = [gz.year[0], gz.month[0], gz.day[0], gz.time[0]];
    // 支藏全展开（用于五行计数/根）
    const cangAll = [];
    for (const z of zhis) for (const c of (zanggan[z] || [])) cangAll.push(c);
    // 五行计数：四干 + 支藏（本气/中气/余气全计——口径注明引擎设定）
    const wxCount = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    for (const g of gans) wxCount[WX[g]]++;
    for (const c of cangAll) wxCount[WX[c]]++;
    // 十神状态
    const tenStates = {};
    for (const t of TEN_GODS) tenStates[t] = { wuxing: '', transparent: false, hidden: false, rooted: false, timely: false, count: 0, strength: 'weak' };
    // 十神五行（相对日主）
    const tenWxMap = {};
    for (const t of TEN_GODS) {
      // 借位：以任意他干试算得十神五行
      for (const g of GAN) {
        if (shiShenOf(dayGan, g) === t) { tenWxMap[t] = WX[g]; break; }
      }
    }
    // 计数：四干十神 + 支藏十神
    const fourGanShi = gans.map(g => shiShenOf(dayGan, g));
    for (const t of fourGanShi) if (tenStates[t]) tenStates[t].count++;
    const cangShi = cangAll.map(c => shiShenOf(dayGan, c));
    for (const t of cangShi) if (tenStates[t]) tenStates[t].count++;
    // transparent / hidden
    for (const t of TEN_GODS) {
      tenStates[t].transparent = fourGanShi.includes(t);
      tenStates[t].hidden = (cangShi.includes(t) && !fourGanShi.includes(t));
    }
    // rooted：地支藏干含该十神五行
    for (const t of TEN_GODS) {
      const tw = tenWxMap[t];
      if (tw) tenStates[t].rooted = zhis.some(z => (zanggan[z] || []).some(c => WX[c] === tw));
    }
    // timely + strength：月支当令
    const monthZhi = p.monthZhi;
    for (const t of TEN_GODS) {
      const tw = tenWxMap[t];
      if (!tw) continue;
      const ss = seasonStrength(monthZhi, tw);
      tenStates[t].timely = (ss === 'strong');
      tenStates[t].strength = ss; // 十神组合旺弱=其五行当令旺弱（引擎设定，注明）
      tenStates[t].wuxing = tw;
    }
    // element_states（五行季节旺弱 + 克关系）
    const elemStates = {};
    for (const w of WX_SET) {
      elemStates[w] = { season_strength: seasonStrength(monthZhi, w), controls: KE[w], controlled_by: Object.keys(KE).find(k => KE[k] === w) || '', controller_strength: seasonStrength(monthZhi, Object.keys(KE).find(k => KE[k] === w) || '') };
    }
    // relation_groups：四柱干支关系（含/会/冲/刑/害/合）
    const relationGroups = [];
    // 天干五合
    for (const g of gans) {
      const p2 = GANHE[g];
      if (p2 && gans.includes(p2)) {
        const pair = [g, p2].sort((a, b) => GAN.indexOf(a) - GAN.indexOf(b)).join('');
        const names = { 甲己: '甲己', 乙庚: '乙庚', 丙辛: '丙辛', 丁壬: '丁壬', 戊癸: '戊癸' };
        if (names[pair]) relationGroups.push({ field: 'gan_he', group: names[pair] });
      }
    }
    // 地支六合
    for (const z of zhis) {
      const p2 = LIUHE[z];
      if (p2 && zhis.includes(p2) && z < p2) relationGroups.push({ field: 'zhi_liu_he', group: z + p2 });
    }
    // 三合/三会
    for (const [name, members] of Object.entries(SANHE)) {
      if (members.every(z => zhis.includes(z))) relationGroups.push({ field: 'san_he', group: name });
    }
    for (const [name, members] of Object.entries(SANHUI)) {
      if (members.every(z => zhis.includes(z))) relationGroups.push({ field: 'san_hui', group: name });
    }
    // 六冲
    for (const z of zhis) {
      const c = LIUCHONG[z];
      if (c && zhis.includes(c) && z < c) relationGroups.push({ field: 'liu_chong', group: z + c });
    }
    // 六害
    for (const z of zhis) {
      const h = LIUHAI[z];
      if (h && zhis.includes(h) && z < h) relationGroups.push({ field: 'liu_hai', group: z + h });
    }
    // 三刑（对照 liki 的 liu_xing 组名：寅巳申/丑戌未/子卯/辰辰/午午/酉酉/亥亥）
    const xingSeen = {};
    for (const z of zhis) {
      const targets = SANXING[z] || [];
      for (const t of targets) {
        if (t === z) {
          const key = z + z;
          if (!xingSeen[key]) { xingSeen[key] = true; relationGroups.push({ field: 'liu_xing', group: z + z }); }
        } else if (zhis.includes(t)) {
          const key = [z, t].sort().join('');
          if (!xingSeen[key]) {
            xingSeen[key] = true;
            // 组名规范化：寅巳申/丑戌未/子卯
            const grp = (z === '寅' || z === '巳' || z === '申') ? '寅巳申' : (z === '丑' || z === '戌' || z === '未') ? '丑戌未' : [z, t].sort().join('');
            relationGroups.push({ field: 'liu_xing', group: grp });
          }
        }
      }
    }
    // atomic_facts
    const monthBenQi = (zanggan[monthZhi] || [''])[0];
    const dayBranch = gz.day[1];
    const dayBenQi = (zanggan[dayBranch] || [''])[0];
    const hourGan = gz.time[0];
    const yearGan2 = gz.year[0];
    const yearZhi = gz.year[1];
    const spouseStates = [];
    for (const z of zhis) {
      if (z === dayBranch) continue;
      if (LIUCHONG[dayBranch] === z) spouseStates.push('冲');
      if (LIUHE[dayBranch] === z) spouseStates.push('合');
      if (SANXING[dayBranch] && SANXING[dayBranch].includes(z)) spouseStates.push('刑');
      if (LIUHAI[dayBranch] === z) spouseStates.push('害');
    }
    const spousePriority = ['冲', '合', '刑', '害'].find(s => spouseStates.includes(s)) || '静';
    const csIdx = (CS_TABLE[dayGan] || []).indexOf(monthZhi);
    const atomic = {
      month_main_ten_god: shiShenOf(dayGan, monthBenQi),
      hour_stem_ten_god: shiShenOf(dayGan, hourGan),
      year_stem_ten_god: shiShenOf(dayGan, yearGan2),
      year_officer_killing: (shiShenOf(dayGan, yearGan2) === '正官' || shiShenOf(dayGan, yearGan2) === '七杀' || (zanggan[yearZhi] || []).some(c => shiShenOf(dayGan, c) === '正官' || shiShenOf(dayGan, c) === '七杀')),
      spouse_palace_state: spousePriority,
      day_branch_type: shiShenOf(dayGan, dayBenQi),
      month_longevity: csIdx >= 0 ? CS_ORDER[csIdx] : '',
      pillar_punishments: { year: false, month: false, day: false, time: false },
      wealth_tomb_present: false,
      wealth_star_in_tomb: false,
      pattern_god_transparent: false,
      officer_killing_cleaned: false
    };
    // 柱刑
    ['year', 'month', 'day', 'time'].forEach((k, i) => {
      const z = zhis[i];
      const targets = SANXING[z] || [];
      atomic.pillar_punishments[k] = targets.some(t => zhis.includes(t));
    });
    // 财库现：财星五行之库支现于四支；财星入墓：财星五行==日支本气五行且日支为库
    const caiWx = tenWxMap['正财'] || tenWxMap['偏财'];
    if (caiWx) {
      const kuZhi = KU[caiWx];
      atomic.wealth_tomb_present = zhis.includes(kuZhi);
      atomic.wealth_star_in_tomb = (WX[dayBenQi] === caiWx) && zhis.includes(kuZhi);
    }
    // 格神透：月令本气十神透于四干（glike liki pattern_god_transparent）
    atomic.pattern_god_transparent = fourGanShi.includes(atomic.month_main_ten_god);
    // 官杀取清：官杀同透且七杀被合/冲（简化近似，注明）——或官杀不同透则NA
    const guanShaCount = fourGanShi.filter(t => t === '正官' || t === '七杀');
    if (guanShaCount.length >= 2 && fourGanShi.includes('正官') && fourGanShi.includes('七杀')) {
      const shaGan = gans[fourGanShi.indexOf('七杀')];
      atomic.officer_killing_cleaned = (GANHE[shaGan] && fourGanShi.includes(GANHE[shaGan])) || false;
    }
    return {
      ten_god_states: tenStates, element_states: elemStates, wuxing: { count: wxCount },
      day_master_element: dayWx, relation_groups: relationGroups, atomic_facts: atomic,
      selected_yongshen: (opts && opts.xiOpt) || null, gender: gender,
      four_gans: gans, four_zhis: zhis, zanggan: zanggan,
      tenWxMap: tenWxMap, dayGan: dayGan, shenShaHits: (opts && opts.sh) || [], geJu: (opts && opts.gj) || null,
      liunian: (opts && opts.liunian) || null, dayun: (opts && opts.dayun) || null, year: (opts && opts.year) || 0
    };
  }

  // ── 表达式求值（返回四态或标量字符串）──
  const ATOMIC = /([^\[\],]+)\[([^\]]*)\]/g;
  function evalOp(op, args, base, currentYear) {
    const gender = base.gender;
    const resolve = (name) => resolveTens(name, gender);
    const tstate = (t) => base.ten_god_states[t] || { count: 0, transparent: false, hidden: false, rooted: false, timely: false, strength: 'weak', wuxing: '' };
    const tstatesAny = (names, f) => names.some(n => f(tstate(n)));
    if (op === '现') return tstatesAny(resolve(args[0]), s => s.count >= 1) ? HIT : MISS;
    if (op === '透') return tstatesAny(resolve(args[0]), s => s.transparent) ? HIT : MISS;
    if (op === '藏') return tstatesAny(resolve(args[0]), s => s.hidden) ? HIT : MISS;
    if (op === '得令') return tstatesAny(resolve(args[0]), s => s.timely) ? HIT : MISS;
    if (op === '有根') return tstatesAny(resolve(args[0]), s => s.rooted) ? HIT : MISS;
    if (op === '旺' || op === '弱') {
      const a0 = args[0];
      const expected = op === '旺' ? 'strong' : 'weak';
      if (WX_SET.includes(a0)) {
        const ss = (base.element_states[a0] || {}).season_strength;
        return ss === expected ? HIT : (ss ? MISS : UNKNOWN);
      }
      return tstatesAny(resolve(a0), s => s.strength === expected) ? HIT : MISS;
    }
    if (op === '缺') {
      const cnt = (base.wuxing.count || {})[args[0]];
      return args[0] && cnt === 0 ? HIT : MISS;
    }
    if (op === '克') {
      // 克(a,b)：a 五行克 b 五行
      const wxa = wxOfArg(args[0], base), wxb = wxOfArg(args[1], base);
      if (!wxa || !wxb) return UNKNOWN;
      return KE[wxa] === wxb ? HIT : MISS;
    }
    if (op === '直读') {
      const path = args[0], expect = args[1];
      let val = null;
      if (path === 'gender') val = gender;
      else if (path === 'ri_gan_wx') val = base.day_master_element;
      else if (path === 'ri_gan') val = base.dayGan;
      else {
        // 支持 fu_yi.qiangruo / tiao_hou.season / ge_ju.ge_ju / shen_sha 等
        if (path.indexOf('fu_yi.qiangruo') >= 0) val = (base.geJu && base.geJu.qiangruo) || null;
        else if (path.indexOf('tiao_hou.season') >= 0) val = seasonOf(base);
        else if (path.indexOf('ge_ju.ge_ju') >= 0) val = (base.geJu && base.geJu.ge) || null;
        else if (path.indexOf('shen_sha') >= 0) {
          const nm = path.split('.').pop();
          val = base.shenShaHits.some(h => (h.name || '').indexOf(nm) >= 0) ? '含' + nm : '';
        } else val = null;
      }
      if (expect === '任意' || expect === '') return val ? val : UNKNOWN;
      if (String(expect).indexOf('含') === 0) {
        const target = String(expect).slice(1);
        const parts = target.split('或');
        return val != null && parts.some(p => String(val).indexOf(p) >= 0) ? HIT : MISS;
      }
      return String(val) === String(expect) ? HIT : MISS;
    }
    if (op === '含') {
      const field = args[0], value = args[1];
      if (field === 'shen_sha') {
        const names = base.shenShaHits.map(h => h.name);
        const parts = value.split('或');
        return parts.some(p => names.some(n => n.indexOf(p) >= 0)) ? HIT : MISS;
      }
      if (field === 'patterns') return UNKNOWN; // 紫微格局，八字侧不适用
      return UNKNOWN;
    }
    if (op === '关系') {
      const field = args[0], group = args[1];
      return base.relation_groups.some(r => r.field === field && r.group === group) ? HIT : MISS;
    }
    if (op === '柱刑') {
      const pillar = args[0];
      const key = { 年: 'year', 月: 'month', 日: 'day', 时: 'time' }[pillar] || '';
      return key ? (base.atomic_facts.pillar_punishments[key] ? HIT : MISS) : UNKNOWN;
    }
    if (op === '数量至少') {
      const n = parseInt(args[0], 10);
      const tens = resolve(args.slice(1));
      const total = tens.reduce((s, t) => s + tstate(t).count, 0);
      return total >= n ? HIT : MISS;
    }
    if (op === '五行数量至少') {
      const n = parseInt(args[0], 10);
      const cnt = (base.wuxing.count || {})[args[1]] || 0;
      return cnt >= n ? HIT : MISS;
    }
    if (op === '官杀取清') return base.atomic_facts.officer_killing_cleaned ? HIT : MISS;
    if (op === '为用' || op === '为忌') {
      const sel = base.selected_yongshen;
      if (!sel) return UNKNOWN; // 需喜用神选项，未选→不可判定
      const tens = resolve(args[0]);
      const wx = wxOfTens(tens, base);
      if (!wx) return UNKNOWN;
      const favorable = (sel.use || []).concat(sel.xi || []);
      const adverse = sel.ji || [];
      if (op === '为用') return favorable.includes(wx) ? HIT : MISS;
      return adverse.includes(wx) ? HIT : MISS;
    }
    if (op === '月支长生') {
      const v = base.atomic_facts.month_longevity;
      return args[0] === '任意' ? (v || UNKNOWN) : (v === args[0] ? HIT : MISS);
    }
    if (op === '夫妻宫状态') {
      const v = base.atomic_facts.spouse_palace_state;
      return args[0] === '任意' ? (v || UNKNOWN) : (v === args[0] ? HIT : MISS);
    }
    if (op === '日支类型') {
      const v = base.atomic_facts.day_branch_type;
      return args[0] === '任意' ? (v || UNKNOWN) : (v === args[0] ? HIT : MISS);
    }
    if (op === '财库现') return base.atomic_facts.wealth_tomb_present ? HIT : MISS;
    if (op === '财星入墓') return base.atomic_facts.wealth_star_in_tomb ? HIT : MISS;
    if (op === '克者旺') {
      const tens = resolve(args[0]);
      const wx = wxOfTens(tens, base);
      if (!wx) return UNKNOWN;
      const kezhe = Object.keys(KE).find(k => KE[k] === wx);
      return kezhe ? (((base.element_states[kezhe] || {}).season_strength === 'strong') ? HIT : MISS) : UNKNOWN;
    }
    if (op === '格神透') return base.atomic_facts.pattern_god_transparent ? HIT : MISS;
    if (op === '月令本气') {
      const v = base.atomic_facts.month_main_ten_god;
      return args[0] === '任意' ? (v || UNKNOWN) : (v === args[0] ? HIT : MISS);
    }
    if (op === '时柱十神') {
      const v = base.atomic_facts.hour_stem_ten_god;
      return args[0] === '任意' ? (v || UNKNOWN) : (v === args[0] ? HIT : MISS);
    }
    if (op === '年柱十神') {
      const v = base.atomic_facts.year_stem_ten_god;
      return args[0] === '任意' ? (v || UNKNOWN) : (v === args[0] ? HIT : MISS);
    }
    if (op === '禄根') {
      const tens = resolve(args[0]);
      return tens.some(t => {
        const g = Object.keys(LU).find(gg => shiShenOf(base.dayGan, gg) === t);
        return g ? base.four_zhis.includes(LU[g]) : false;
      }) ? HIT : MISS;
    }
    if (op === '年柱官杀') return base.atomic_facts.year_officer_killing ? HIT : MISS;
    if (op === '大运十神' || op === '大运十神有根') return UNKNOWN; // 需大运窗口，本局不判（如实）
    if (op === '大限宫位') return UNKNOWN; // 紫微算子，八字侧不适用
    return UNKNOWN; // 未知算子→不可判定，不猜
  }
  function wxOfArg(arg, base) {
    if (WX_SET.includes(arg)) return arg;
    const resolved = resolveTens(arg, base.gender);
    const wx = wxOfTens(resolved, base);
    return wx;
  }

  // ── 流年算子（照 liki operators_liunian.py；依赖 opts.liunian/dayun/year，缺失→不可判定）──
  function evalLiuOp(op, args, base) {
    const ln = base.liunian;
    const dy = base.dayun;
    const year = base.year;
    if (!ln) return UNKNOWN; // 未传流年上下文→不可判定（如实不判）
    const lnGan = ln.gan, lnZhi = ln.zhi;
    const lnShi = ln.shi_shen || shiShenOf(base.dayGan, lnGan);
    const nz = lnZhi;
    const dayZhi = base.four_zhis[2];
    const palaceZhiOf = (target) => {
      const key = EVENT_PALACE[target] || 'day';
      const idx = { year: 0, month: 1, day: 2, time: 3 }[key];
      return base.four_zhis[idx];
    };
    const starKeys = (target) => resolveTens(target, base.gender);
    const resolve = (n) => resolveTens(n, base.gender);
    if (op === '流年透') return starKeys(args[0]).includes(lnShi) ? HIT : MISS;
    if (op === '流年值') {
      const pz = palaceZhiOf(args[0]);
      return nz === pz ? HIT : MISS;
    }
    if (op === '流年冲') {
      const pz = palaceZhiOf(args[0]);
      return LIUCHONG[nz] === pz ? HIT : MISS;
    }
    if (op === '流年合') {
      const pz = palaceZhiOf(args[0]);
      if (LIUHE[nz] === pz) return HIT;
      // 三合/三会含流年支与事件宫支
      for (const members of Object.values(SANHE)) {
        if (members.includes(nz) && members.includes(pz)) return HIT;
      }
      for (const members of Object.values(SANHUI)) {
        if (members.includes(nz) && members.includes(pz)) return HIT;
      }
      return MISS;
    }
    if (op === '流年克') {
      // 流年支五行克目标十神五行（简化近似：liki 用 engine controls_targets；注明引擎设定）
      const tgt = args[0];
      const wx = wxOfArg(tgt, base);
      if (!wx) return UNKNOWN;
      const lnWx = WX[lnZhi];
      return KE[lnWx] === wx ? HIT : MISS;
    }
    if (op === '大运窗口流年') {
      if (!dy) return UNKNOWN;
      const keys = starKeys(args[0]);
      return keys.some(k => (dy.shi_shen || '').indexOf(k) >= 0) ? HIT : MISS;
    }
    if (op === '换运流年') {
      if (!dy || !year) return UNKNOWN;
      const keys = starKeys(args[0]);
      if (!keys.some(k => (dy.shi_shen || '').indexOf(k) >= 0)) return MISS;
      return (year === dy.start_year || year === dy.start_year + 1) ? HIT : MISS;
    }
    if (op === '流年长生') {
      const idx = (CS_TABLE[base.dayGan] || []).indexOf(nz);
      const v = idx >= 0 ? CS_ORDER[idx] : '';
      return args[0] === '任意' ? (v || UNKNOWN) : (v === args[0] ? HIT : MISS);
    }
    if (op === '流年神煞') {
      // 需流年神煞事实；术数引擎暂以年支查流年神煞未接入——如实不判
      return UNKNOWN;
    }
    if (op === '忌神干' || op === '忌神支') {
      const sel = base.selected_yongshen;
      if (!sel) return UNKNOWN;
      const ji = sel.ji || [];
      const v = op === '忌神干' ? lnGan : lnZhi;
      const wx = WX[v];
      return ji.includes(wx) ? HIT : MISS;
    }
    if (op === '财坏印流年') {
      // 简化（引擎设定，注明）：本命财星旺且印星弱，且流年干/支五行属财 → 引动
      const caiWx = wxOfTens(['正财', '偏财'], base);
      const yinStrong = ['正印', '偏印'].some(t => (base.ten_god_states[t] || {}).strength === 'strong');
      const caiStrong = ['正财', '偏财'].some(t => (base.ten_god_states[t] || {}).strength === 'strong');
      if (!caiWx) return UNKNOWN;
      const lnWx = WX[lnGan] === caiWx || WX[lnZhi] === caiWx;
      return (caiStrong && !yinStrong && lnWx) ? HIT : MISS;
    }
    if (op === '干支相等') {
      const pair = args;
      if (pair[0] === '大运' && pair[1] === '流年') {
        if (!dy) return UNKNOWN;
        return (dy.name === lnGan + lnZhi) ? HIT : MISS;
      }
      if (pair[0] === '流年' && pair[1] === '日柱') {
        return (lnGan + lnZhi === base.four_gans[2] + base.four_zhis[2]) ? HIT : MISS;
      }
      return UNKNOWN;
    }
    if (op === '干克') {
      const pair = args;
      if (pair[0] === '流年干' && pair[1] === '日干') return KE[WX[lnGan]] === WX[base.dayGan] ? HIT : MISS;
      if (pair[0] === '日干' && pair[1] === '流年干') return KE[WX[base.dayGan]] === WX[lnGan] ? HIT : MISS;
      return UNKNOWN;
    }
    if (op === '支冲') {
      const pair = args;
      if (pair[0] === '大运支' && pair[1] === '流年支') {
        if (!dy) return UNKNOWN;
        return LIUCHONG[dy.zhi] === lnZhi ? HIT : MISS;
      }
      if (pair[0] === '流年支' && pair[1] === '日支') return LIUCHONG[lnZhi] === dayZhi ? HIT : MISS;
      return UNKNOWN;
    }
    if (op === '旬空') {
      // 旬空[日柱,流年支]：流年支 ∈ 日柱旬空
      if (args[0] === '日柱' && args[1] === '流年支') {
        const kong = xunKongOfGz(base.four_gans[2] + base.four_zhis[2]);
        return kong.includes(lnZhi) ? HIT : MISS;
      }
      return UNKNOWN;
    }
    if (op === '三刑') {
      if (args[0] !== '流年支') return UNKNOWN;
      const grp = args[1];
      const targets = SANXING[lnZhi] || [];
      const members = { '寅巳申': ['寅', '巳', '申'], '丑戌未': ['丑', '戌', '未'], '子卯': ['子', '卯'], '辰辰': ['辰'], '午午': ['午'], '酉酉': ['酉'], '亥亥': ['亥'] }[grp] || [];
      if (!members.length) return UNKNOWN;
      // 刑组全部成员在原局出现 且 流年支为成员之一
      const allPresent = members.every(m => base.four_zhis.includes(m));
      return (allPresent && members.includes(lnZhi)) ? HIT : MISS;
    }
    if (op === '流年支受克') {
      if (!args.length) return MISS;
      const wx = args[0];
      // 该五行本命旺 且 流年支五行被原局干支所克（简化：原局四干或四支藏干存在克流年支五行的五行）
      const natalStrong = ((base.element_states[wx] || {}).season_strength === 'strong');
      const controller = Object.keys(KE).find(k => KE[k] === wx); // 克 wx 的五行
      if (!controller) return UNKNOWN;
      const hasController = base.four_gans.some(g => WX[g] === controller) || base.four_zhis.some(z => (base.zanggan[z] || []).some(c => WX[c] === controller));
      return (natalStrong && hasController) ? HIT : MISS;
    }
    if (op === '年柱干伏吟') {
      return lnGan === base.four_gans[0] ? HIT : MISS;
    }
    if (op === '天干合') {
      const pair = args;
      if (pair[0] === '大运干' && pair[1] === '流年干') {
        if (!dy) return UNKNOWN;
        return GANHE[dy.gan] === lnGan ? HIT : MISS;
      }
      if (pair[0] === '流年干' && pair[1] === '日干') return GANHE[lnGan] === base.dayGan ? HIT : MISS;
      return UNKNOWN;
    }
    if (op === '半合') return UNKNOWN; // 需 engine combination 事实，如实不判
    if (op === '引用本命') {
      const v = baseRefVal(args[0], base);
      return v === undefined ? UNKNOWN : v;
    }
    return UNKNOWN;
  }
  function xunKongOfGz(gz) {
    const g = GAN.indexOf(gz[0]), z = ZHI.indexOf(gz[1]);
    if (g < 0 || z < 0) return [];
    const n = ((z - g) % 12 + 12) % 12;
    const kong = [];
    for (let i = 0; i < 12; i++) if (((i - n + 12) % 12) > 9) kong.push(ZHI[i]);
    return kong;
  }
  function baseRefVal(id, base) {
    // 引用本命因子：本命 factorResults 的值（HIT=1/MISS=0）
    return undefined; // 由 evalFactors 后处理填充
  }
  function wxOfTens(tens, base) {
    for (const t of tens) {
      if (base.tenWxMap[t]) return base.tenWxMap[t];
      if (WX_SET.includes(t)) return t;
    }
    return '';
  }
  function seasonOf(base) {
    const mz = base.four_zhis[1];
    const wx = WX[mz];
    return { 木: '春', 火: '夏', 金: '秋', 水: '冬' }[wx] || '土季';
  }

  // ── 表达式解析 + 求值（四态）──
  function evalExpression(exp, base) {
    const trimmed = exp.trim();
    ATOMIC.lastIndex = 0;
    let m, hasAtomic = false;
    const results = [];
    while ((m = ATOMIC.exec(trimmed)) !== null) {
      hasAtomic = true;
      const op = m[1].trim();
      const argStr = m[2];
      const args = argStr ? argStr.split(',') : [];
      results.push(evalOp(op, args, base, 0));
    }
    if (!hasAtomic) {
      return { bare: true, value: UNKNOWN };
    }
    let st = HIT;
    for (const r of results) {
      if (r === MISS) return MISS;
      if (r === UNKNOWN) st = UNKNOWN;
      else if (r === NA && st !== UNKNOWN) st = NA;
    }
    return st;
  }

  // ── 因子真值表求值（照 liki：OR 分支独立 group；AND 同 group；direct 直通）──
  function evalFactors(rules, base) {
    const all = (rules.factors || []).concat(rules.liunian_factors || []);
    // 聚合：factor_id + phase
    const groups = {};
    const direct = {};
    const order = [];
    for (const f of all) {
      if (f.shushi !== 'bazi') continue;
      const id = f.factor_id;
      if (!groups[id]) { groups[id] = {}; order.push(id); }
      const gid = String(f.group_id || '1');
      if (!groups[id][gid]) groups[id][gid] = [];
      groups[id][gid].push(f);
      if (f.kind === 'direct') direct[id] = f;
    }
    const results = {};
    for (const id of order) {
      if (direct[id]) {
        const r = evalExpression(direct[id].expression, base);
        results[id] = { value: r.bare ? UNKNOWN : r, groups: 1, terms: 1 };
        continue;
      }
      let best = NA;
      for (const gid of Object.keys(groups[id])) {
        const terms = groups[id][gid];
        // AND（同 group）
        let st = HIT;
        for (const t of terms) {
          let tr;
          if (t.kind === 'factor_ref') {
            tr = (results[t.expression] || {}).value;
            if (tr === undefined) tr = UNKNOWN;
          } else {
            const expr = t.expression.trim();
            // 流年算子（以"流年/忌神/财坏印/干支/干克/支冲/旬空/三刑/年柱干伏吟/天干合/半合/引用本命/大运窗口/换运流年/流年长生/流年神煞"开头的算子走流年求值）
            const liuOps = ['流年', '忌神', '财坏印', '干支相等', '干克', '支冲', '旬空', '三刑', '年柱干伏吟', '天干合', '半合', '引用本命', '大运窗口', '换运流年'];
            const isLiu = liuOps.some(p => expr.indexOf(p) === 0);
            const re = /([^\[\],]+)\[([^\]]*)\]/g;
            const m = re.exec(expr);
            if (isLiu && m) {
              const op = m[1].trim();
              const argStr = m[2];
              const args = argStr ? argStr.split(',') : [];
              tr = evalLiuOp(op, args, base);
            } else {
              const r = evalExpression(expr, base);
              tr = r.bare ? UNKNOWN : r;
            }
          }
          if (tr === MISS) { st = MISS; break; }
          if (tr === UNKNOWN) st = UNKNOWN;
          else if (tr === NA && st !== UNKNOWN) st = NA;
        }
        if (st === HIT) { best = HIT; break; } // OR：命中优先
        if (st === UNKNOWN) best = UNKNOWN;
        else if (st === MISS && best !== UNKNOWN) best = MISS;
      }
      results[id] = { value: best, groups: Object.keys(groups[id]).length, terms: Object.values(groups[id]).reduce((s, a) => s + a.length, 0) };
    }
    return results;
  }

  // ── 断语匹配：条件组 AND → 命中（照 liki"命中即直断，不命中明说"：任一条件不可判定→整条不命中）──
  function matchAssertions(rules, factorResults, base) {
    const byId = {};
    for (const a of rules.assertions) if (a.side === 'bazi') byId[a.assertion_id] = a;
    const condByAssert = {};
    for (const c of rules.conditions) {
      if (!condByAssert[c.assertion_id]) condByAssert[c.assertion_id] = [];
      condByAssert[c.assertion_id].push(c);
    }
    const hits = [];
    let blockedByUnknown = 0;
    for (const aid of Object.keys(condByAssert)) {
      const a = byId[aid];
      if (!a) continue;
      const conds = condByAssert[aid];
      let allHit = true, hasUnknown = false;
      for (const c of conds) {
        const fv = (factorResults[c.factor] || {}).value;
        const expected = c.expected;
        if (fv === undefined || fv === UNKNOWN || fv === NA) { hasUnknown = true; allHit = false; break; }
        const expStr = String(expected);
        if (expStr !== '1' && expStr !== '0') {
          if (String(fv) !== expStr) { allHit = false; break; }
        } else {
          if (expStr === '1' && fv !== HIT) { allHit = false; break; }
          if (expStr === '0' && fv === HIT) { allHit = false; break; }
        }
      }
      if (allHit) hits.push({ id: aid, assertion: a, unknown: hasUnknown });
      else if (hasUnknown) blockedByUnknown++;
    }
    return { hits, blockedByUnknown };
  }

  // ── 主入口 ──
  window.evalLikiBazi = function (rules, p, opts) {
    if (!rules || !rules.assertions || !rules.factors) return { ok: false, reason: 'no rules' };
    const base = buildBase(p, opts);
    const factorResults = evalFactors(rules, base);
    const m = matchAssertions(rules, factorResults, base);
    const hits = m.hits;
    const baziFactors = (rules.factors || []).filter(f => f.shushi === 'bazi');
    const unknownFactors = Object.keys(factorResults).filter(id => factorResults[id].value === UNKNOWN).length;
    // 命中明细（含命中因子路径）
    const detail = hits.map(h => ({
      id: h.id,
      rule: h.assertion.rule, side: h.assertion.side, 领域: h.assertion.领域, 事件类型: h.assertion.事件类型,
      时间层: h.assertion.时间层, 事件: h.assertion.事件, 结论: h.assertion.结论, 依据: h.assertion.依据, 经典依据: h.assertion.经典依据,
      unknown: h.unknown
    }));
    return {
      ok: true,
      layer: '现代整理层（liki）',
      total: Object.keys(byIdCount(rules)).length,
      hitCount: detail.length,
      detail: detail,
      factorTotal: baziFactors.length,
      factorEvaluated: Object.keys(factorResults).length,
      factorUnknown: unknownFactors,
      blockedByUnknown: m.blockedByUnknown,
      stats: { factors: Object.keys(factorResults).length, hitAssertions: detail.length, blockedByUnknown: m.blockedByUnknown }
    };
    function byIdCount(rules) {
      const s = {};
      for (const a of rules.assertions) if (a.side === 'bazi') s[a.assertion_id] = 1;
      return s;
    }
  };
})();
