// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 盲派八字（夏仲奇/陈秉志体系）— kinastro(MIT) 现代整理层移植
// 依据《盲派大师夏仲奇命学精粹》（陈秉志著）、《盲派-入门-整理》
// 核心：六亲以宫位为主；穿破>冲>合>破>刑；重视墓库；以病取用；大限以日柱起限
'use strict';
(() => {
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const STEM_ELEM = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const BR_ELEM = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  const HIDDEN = { '子': ['壬', '癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['甲', '乙'], '辰': ['戊', '癸', '乙'], '巳': ['丙', '戊', '庚'], '午': ['丙', '丁', '己'], '未': ['己', '乙', '丁'], '申': ['庚', '壬', '戊'], '酉': ['庚', '辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲'] };
  const SHENG = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const KE = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  const COMBINE = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' };
  const CLASH = { '子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳' };
  const PIERCE = { '子': '未', '未': '子', '丑': '午', '午': '丑', '寅': '巳', '巳': '寅', '卯': '辰', '辰': '卯', '申': '亥', '亥': '申', '酉': '戌', '戌': '酉' };
  const BREAK = { '子': '酉', '酉': '子', '卯': '午', '午': '卯', '巳': '申', '申': '巳', '寅': '亥', '亥': '寅', '辰': '丑', '丑': '辰', '未': '戌', '戌': '未' };
  const PUNISH = [['寅', '巳', '申'], ['丑', '未', '戌'], ['子', '卯']];
  const THREE_COMBINE = [['申', '子', '辰', '水'], ['寅', '午', '戌', '火'], ['巳', '酉', '丑', '金'], ['亥', '卯', '未', '木']];
  const THREE_ASSEMBLY = [['寅', '卯', '辰', '木'], ['巳', '午', '未', '火'], ['申', '酉', '戌', '金'], ['亥', '子', '丑', '水']];
  const TOMB = { '木': '未', '火': '戌', '金': '丑', '水': '辰', '土': '辰' };
  const ROOTING = { '甲': ['寅', '卯', '亥'], '乙': ['卯', '寅', '未'], '丙': ['午', '巳', '寅'], '丁': ['午', '巳', '未'], '戊': ['辰', '戌', '巳', '午'], '己': ['未', '丑', '辰', '午'], '庚': ['申', '酉', '巳'], '辛': ['酉', '申', '丑'], '壬': ['子', '亥', '申'], '癸': ['子', '亥', '丑'] };
  const STATES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  const DZ_IDX = Object.fromEntries(BRANCHES.map((b, i) => [b, i]));
  function buildSheng(startBranch, forward) {
    const start = DZ_IDX[startBranch];
    const out = {};
    STATES.forEach((s, i) => { out[BRANCHES[(forward ? (start + i) : (start - i + 120)) % 12]] = s; });
    return out;
  }
  const SHENG_TABLE = {
    '甲': buildSheng('亥', true), '乙': buildSheng('午', false), '丙': buildSheng('寅', true), '丁': buildSheng('酉', false),
    '戊': buildSheng('寅', true), '己': buildSheng('酉', false), '庚': buildSheng('巳', true), '辛': buildSheng('子', false),
    '壬': buildSheng('申', true), '癸': buildSheng('卯', false),
  };
  const NAYIN = { '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火', '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土', '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火', '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土', '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木', '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土', '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木', '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金', '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木', '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金', '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水', '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金', '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水', '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火', '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水' };
  const PALACE_NAMES = ['年', '月', '日', '时'];
  const PALACE_ROLES = { '年': '父母宫（兼论祖上）', '月': '兄弟宫（兼论命主早年）', '日': '夫妻宫（命主本宫）', '时': '子女宫（兼论晚运）' };
  const elem = (x) => STEM_ELEM[x] || BR_ELEM[x] || '';
  const yang = (s) => STEMS.indexOf(s) % 2 === 0;
  function tenGod(dm, t) {
    if (dm === t) return '比肩';
    const de = elem(dm), te = elem(t), same = yang(dm) === yang(t);
    if (de === te) return same ? '比肩' : '劫财';
    if (SHENG[de] === te) return same ? '食神' : '伤官';
    if (KE[de] === te) return same ? '偏财' : '正财';
    if (KE[te] === de) return same ? '七杀' : '正官';
    if (SHENG[te] === de) return same ? '偏印' : '正印';
    return '未知';
  }
  function branchState(stem, branch) { const t = SHENG_TABLE[stem] || {}; return t[branch] || '未知'; }
  function inTomb(stem, branch) { return TOMB[elem(stem)] === branch; }
  function branchActs(b1, b2) {
    const acts = [];
    if (PIERCE[b1] === b2) acts.push('穿（最强破坏）');
    if (CLASH[b1] === b2) acts.push('六冲');
    if (COMBINE[b1] === b2) acts.push('六合');
    if (BREAK[b1] === b2) acts.push('六破');
    for (const g of PUNISH) { if (g.includes(b1) && g.includes(b2) && b1 !== b2) { acts.push('三刑'); break; } }
    return acts;
  }
  function analyze(bazi) {
    // bazi = {year:{s,b}, month:{s,b}, day:{s,b}, hour:{s,b}}
    const pillars = [bazi.year, bazi.month, bazi.day, bazi.hour];
    const branches = pillars.map((p) => p.b);
    const stems = pillars.map((p) => p.s);
    const dm = bazi.day.s;
    // 地支作用（两两 + 三合三会）
    const inter = {};
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const acts = branchActs(branches[i], branches[j]);
      if (acts.length) inter[branches[i] + branches[j]] = acts;
    }
    for (const [a, b, c, el] of THREE_COMBINE) { if (branches.includes(a) && branches.includes(b) && branches.includes(c)) inter[a + b + c] = ['三合' + el + '局']; }
    for (const [a, b, c, el] of THREE_ASSEMBLY) { if (branches.includes(a) && branches.includes(b) && branches.includes(c)) inter[a + b + c] = ['三会' + el + '局']; }
    // 穿破专项
    const pierceBreak = [];
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      if (PIERCE[branches[i]] === branches[j]) pierceBreak.push({ type: '穿', branches: branches[i] + '穿' + branches[j], positions: PALACE_NAMES[i] + '支穿' + PALACE_NAMES[j] + '支', note: '盲派最强破坏象，宫位六亲必损' });
      if (BREAK[branches[i]] === branches[j]) pierceBreak.push({ type: '破', branches: branches[i] + '破' + branches[j], positions: PALACE_NAMES[i] + '支破' + PALACE_NAMES[j] + '支', note: '破伤六亲宫位' });
    }
    // 入墓
    const tombIssues = [];
    pillars.forEach((p, idx) => {
      if (inTomb(p.s, p.b)) tombIssues.push({ pillar: p.s + p.b, palace: PALACE_NAMES[idx], desc: p.s + '(' + elem(p.s) + ')入墓于' + p.b + '，主事受困' });
      if (['辰', '戌', '丑', '未'].includes(p.b)) { tombIssues.push({ pillar: p.s + p.b, palace: PALACE_NAMES[idx], desc: p.s + p.b + '支' + p.b + '为墓库宫（' + BR_ELEM[p.b] + '土）' }); const cb = CLASH[p.b]; if (cb && branches.includes(cb)) tombIssues.push({ pillar: p.s + p.b, palace: PALACE_NAMES[idx], desc: p.b + '（墓库）被' + cb + '冲开，藏干受冲扰' }); }
    });
    // 五行偏枯
    const count = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    stems.forEach((s) => count[elem(s)]++);
    branches.forEach((b) => count[elem(b)]++);
    const bias = [];
    for (const [e, c] of Object.entries(count)) { if (c >= 4) bias.push({ element: e, count: c, type: '过旺', desc: e + '过旺（' + c + '个），为命局之病' }); else if (c === 0) bias.push({ element: e, count: 0, type: '缺失', desc: '命局无' + e + '，为空缺之病' }); }
    // 三刑
    const punishFound = [];
    for (const g of PUNISH) { const matched = g.filter((b) => branches.includes(b)); if (matched.length >= 2) punishFound.push({ members: matched, desc: matched.join('') + '三刑' }); }
    const hasDisease = !!(pierceBreak.length || tombIssues.length || bias.length || punishFound.length);
    const severity = !hasDisease ? '无病' : (pierceBreak.length ? '重病' : tombIssues.length ? '中等' : '轻病');
    const illness = { '穿破': pierceBreak, '入墓': tombIssues, '五行偏枯': bias, '三刑': punishFound, '病情轻重': severity, '总述': '命局病处：穿破' + pierceBreak.length + '处，入墓' + tombIssues.length + '处，五行偏枯' + bias.length + '项，三刑' + punishFound.length + '组。病情：' + severity + '。' };
    // 用神
    const useGods = [];
    for (const pb of pierceBreak) { if (pb.type === '穿') useGods.push({ god: '六合或正印（制穿）', reason: pb.branches + '穿破最烈，宜用六合封住穿源，或正印生扶受损宫位' }); }
    for (const b of bias) { if (b.type === '过旺') { const d = SHENG[b.element]; useGods.push({ god: '泄' + b.element + '之' + d + '（食伤）', reason: b.element + '旺，以' + d + '泄秀为用' }); } else if (b.type === '缺失') useGods.push({ god: '补' + b.element + '（印比）', reason: '命局缺' + b.element + '，以补入流年大限为用' }); }
    const dayRooting = branches.filter((b) => ROOTING[dm].includes(b));
    const baseGod = dayRooting.length >= 2 ? '日主' + dm + '根深，宜官杀制衡或财星流通' : dayRooting.length === 0 ? '日主' + dm + '无根，宜印比扶身' : '日主' + dm + '中和，依病取用';
    const useGod = { '日主': dm, '日主五行': elem(dm), '日主阴阳': yang(dm) ? '阳' : '阴', '日主扎根地支': dayRooting, '基本用神方向': baseGod, '病对应用神': useGods, '总结': useGods.length ? useGods[0].god : baseGod };
    // 时辰断法
    const h = bazi.hour.b;
    const hourAna = {};
    if (['子', '午', '卯', '酉'].includes(h)) { hourAna['兄弟姐妹数'] = '1人（月令旺或月支见比劫可增至2人）'; hourAna['脸型'] = '四方脸，颧骨略尖'; hourAna['睡姿'] = '仰面睡（直身仰卧）'; }
    else if (['寅', '申', '巳', '亥'].includes(h)) { hourAna['兄弟姐妹数'] = '3人（月令旺可达5人）'; hourAna['脸型'] = '长脸（脸型修长）'; hourAna['睡姿'] = '侧身睡（左右侧卧）'; }
    else { hourAna['兄弟姐妹数'] = '独生子女或相差3岁以上（四库为孤）'; hourAna['脸型'] = '圆脸（圆润丰满）'; hourAna['睡姿'] = '俯面睡（趴卧）'; }
    // 少年克父母
    const parentsKe = [];
    for (const idx of [0, 1]) {
      const p = pillars[idx], br = p.b;
      const st = branchState(dm, br);
      if (['死', '病', '墓', '绝'].includes(st)) parentsKe.push(PALACE_NAMES[idx] + '支' + br + '对日主' + dm + '临' + st + '，父母宫坐衰地，早年父母缘薄或有克损');
      const others = branches.filter((_, k) => k !== idx);
      for (const ob of others) {
        if (PIERCE[br] === ob) parentsKe.push(PALACE_NAMES[idx] + '支' + br + '被穿（' + br + '穿' + ob + '），父母宫受穿最烈，早年父母有损');
        if (CLASH[br] === ob) parentsKe.push(PALACE_NAMES[idx] + '支' + br + '逢冲（' + br + '冲' + ob + '），父母宫动荡，少年见事');
      }
      if (inTomb(p.s, br)) parentsKe.push(PALACE_NAMES[idx] + '柱' + p.s + br + '天干入墓，' + PALACE_NAMES[idx] + '宫主星受困，父母缘薄');
    }
    if (!parentsKe.length) parentsKe.push('父母宫稳定，未见明显克损，需结合大限流年细断');
    // 头胎性别
    const monthHidden = HIDDEN[bazi.month.b];
    const childGods = monthHidden.map((x) => tenGod(dm, x));
    const hasPierce = PIERCE[bazi.month.b] && branches.includes(PIERCE[bazi.month.b]);
    const hasClash = CLASH[bazi.month.b] && branches.includes(CLASH[bazi.month.b]);
    const switched = hasPierce || hasClash;
    let gender;
    if (yang(dm)) { if (childGods.includes('食神')) gender = switched ? '女孩' : '男孩'; else if (childGods.includes('伤官')) gender = switched ? '男孩' : '女孩'; else if (childGods.includes('偏财') || childGods.includes('正财')) gender = '男孩（财星入时，多子）'; else gender = '需结合流年细断'; }
    else { if (childGods.includes('伤官')) gender = !switched ? '男孩' : '女孩'; else if (childGods.includes('食神')) gender = !switched ? '女孩' : '男孩'; else gender = '需结合流年细断'; }
    const firstChild = '头胎' + (switched ? '（月支受穿/冲，换相判断）' : '') + '：' + gender;
    // 六亲宫位
    const sixQin = {};
    branches.forEach((br, idx) => {
      const p = pillars[idx];
      const st = branchState(dm, br);
      const notes = [];
      const pt = PIERCE[br]; if (pt && branches.includes(pt)) notes.push('穿（' + br + '穿' + pt + '），宫位主星受损最烈');
      const ct = CLASH[br]; if (ct && branches.includes(ct)) notes.push('冲（' + br + '冲' + ct + '），六亲动荡');
      const cot = COMBINE[br]; if (cot && branches.includes(cot)) notes.push('合（' + br + '合' + cot + '），有利有弊看化神');
      const bt = BREAK[br]; if (bt && branches.includes(bt)) notes.push('破（' + br + '破' + bt + '），宫位受损');
      if (['死', '病', '墓', '绝'].includes(st)) notes.push('宫支' + br + '对日主临' + st + '，六亲缘薄');
      else if (['长生', '帝旺', '临官'].includes(st)) notes.push('宫支' + br + '对日主临' + st + '，六亲有力');
      if (inTomb(p.s, br)) notes.push('天干' + p.s + '入墓于' + br + '，主星受困');
      sixQin[PALACE_NAMES[idx] + '宫'] = { '宫位职司': PALACE_ROLES[PALACE_NAMES[idx]], '干支': p.s + p.b, '纳音': NAYIN[p.s + p.b] || '', '宫支长生状态': st, '藏干': HIDDEN[br], '注意事项': notes.length ? notes : ['此宫无明显凶象'] };
    });
    // 婚姻专断
    const issues = [], goodSigns = [];
    const db = bazi.day.b;
    const pt2 = PIERCE[db]; if (pt2 && branches.includes(pt2)) issues.push('日支' + db + '被穿（→' + pt2 + '），婚姻破损风险极高');
    const ct2 = CLASH[db]; if (ct2 && branches.includes(ct2)) issues.push('日支' + db + '被冲（→' + ct2 + '），婚姻动荡，易离合');
    if (inTomb(bazi.day.s, db)) issues.push('日干' + dm + '入墓于日支' + db + '，命主与配偶缘分困局');
    const spouseStars = yang(dm) ? ['正财', '偏财'] : ['正官', '七杀'];
    const spouseDesc = yang(dm) ? '财星为妻' : '官杀为夫';
    pillars.forEach((p, idx) => {
      const hg = HIDDEN[p.b].map((x) => tenGod(dm, x));
      const sg = tenGod(dm, p.s);
      if (spouseStars.some((g) => hg.includes(g) || sg === g)) {
        const st = branchState(dm, p.b);
        if (['墓', '死', '绝'].includes(st)) issues.push(PALACE_NAMES[idx] + '柱' + p.s + p.b + '含' + spouseDesc + '，坐支临' + st + '，晚婚或婚姻困难');
      }
    });
    const cot2 = COMBINE[db]; if (cot2 && branches.includes(cot2)) goodSigns.push('日支' + db + '见六合（→' + cot2 + '），情感有缘');
    const ds = branchState(dm, db);
    if (['长生', '帝旺', '临官'].includes(ds)) goodSigns.push('日支' + db + '对日主临' + ds + '，婚姻有力');
    const remarriage = issues.filter((i) => i.includes('冲') || i.includes('穿')).length >= 2;
    const timing = ['长生', '帝旺'].includes(ds) ? '早婚（日支旺）' : ['衰', '死', '墓', '绝'].includes(ds) ? '晚婚（日支衰死）' : '适龄婚';
    const marriage = { '夫妻宫（日支）': db, '日支长生状态': ds, '配偶星类型': spouseDesc, '婚姻凶象': issues.length ? issues : ['无明显婚姻凶象'], '婚姻吉象': goodSigns.length ? goodSigns : ['无特别吉象'], '婚姻时机': timing, '再婚迹象': remarriage ? '有再婚迹象' : '无明显再婚象', '总评': '日支' + db + '为夫妻宫，' + timing + '，' + (issues.length ? '婚姻凶象显著，需谨慎。' : '婚姻基本稳定。') };
    // 财运
    const wealthElem = KE[elem(dm)];
    const wealthRows = [];
    pillars.forEach((p, idx) => {
      const hg = HIDDEN[p.b].map((x) => [x, tenGod(dm, x)]);
      const sg = [p.s, tenGod(dm, p.s)];
      const all = [sg].concat(hg);
      for (const [sv, god] of all) {
        if (god === '正财' || god === '偏财') {
          const st = branchState(dm, p.b);
          const pn = PIERCE[p.b] && branches.includes(PIERCE[p.b]) ? '，但地支' + p.b + '被穿（→' + PIERCE[p.b] + '），财受损' : '';
          const tn = inTomb(p.s, p.b) ? '，天干入墓，财被困' : '';
          wealthRows.push({ '柱': PALACE_NAMES[idx], '干支': p.s + p.b, '财神': sv + '（' + god + '）', '坐支状态': st, '评述': god + '在' + PALACE_NAMES[idx] + '柱，坐支' + st + pn + tn });
        }
      }
    });
    const wealth = { '日主': dm, '财星五行': wealthElem, '财星分布': wealthRows.length ? wealthRows : [{ '评述': '四柱中未见明显财星，财运需靠大限流年引动' }], '总评': '日主' + dm + '（' + elem(dm) + '），财星为' + wealthElem + '，' + (wealthRows.length ? '共' + wealthRows.length + '处财星' : '四柱财星稀少，财运偏薄') };
    // 大限（日柱起限）
    const cycleYang = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'];
    const cycle = yang(dm) ? cycleYang : cycleYang.slice().reverse();
    const dmIdx = STEMS.indexOf(dm);
    const limits = [];
    for (let i = 0; i < 8; i++) {
      const ls = yang(dm) ? STEMS[(dmIdx + i) % 10] : STEMS[(dmIdx - i + 20) % 10];
      const lb = yang(dm) ? BRANCHES[(DZ_IDX[bazi.day.b] + i) % 12] : BRANCHES[(DZ_IDX[bazi.day.b] - i + 24) % 12];
      const st = branchState(dm, lb);
      const luck = ['帝旺', '临官', '长生'].includes(st) ? '旺运（事业婚姻多成）' : ['衰', '病', '死'].includes(st) ? '衰运（注意健康与六亲）' : ['墓', '绝'].includes(st) ? '困运（谨防重大变故）' : '平稳（进退皆宜审慎）';
      const god = tenGod(dm, ls);
      const el = elem(ls);
      const act = [];
      pillars.forEach((p, idx) => { if (elem(p.s) === el || elem(p.b) === el) act.push(PALACE_NAMES[idx] + '宫（' + PALACE_ROLES[PALACE_NAMES[idx]] + '）'); });
      limits.push({ '限段': '第' + (i + 1) + '限', '虚岁': (i * 10) + '—' + (i * 10 + 9) + '岁', '限干支': ls + lb, '十神': god, '五行': el, '限支长生状态': st, '引动宫位': act.length ? act : ['无直接引动'], '运势初判': luck, '注意': '限干' + ls + '为' + god + '，' + luck + '；此限主' + (['正财', '偏财'].includes(god) ? '财帛丰' : ['正官', '七杀'].includes(god) ? '官贵显' : '身心修养') });
    }
    // 流年应期框架
    const liunian = { '应期规则': ['流年天干与命局天干同五行 → 引动对应宫位六亲', '流年地支穿命局地支 → 当年有重大破损事件（最烈）', '流年地支冲命局日支 → 婚姻、健康有动荡', '流年地支合命局地支 → 有情有缘之年，宫位主事', '犯太岁（流年支=' + db + '） → 命主本人有大变动，需格外谨慎'], '重点年份特征': { '穿太岁': '流年地支穿日支' + db + '（即' + PIERCE[db] + '年），婚姻最危', '冲太岁': '流年地支冲日支' + db + '（即' + CLASH[db] + '年），动荡之年', '合太岁': '流年地支合日支' + db + '（即' + COMBINE[db] + '年），有缘有助之年' }, '使用说明': '请结合实际出生年份查对大限表，找出当年大限干支，再配流年干支叠加判断。' };
    // 总述
    const pc = pierceBreak.length, tc = tombIssues.length;
    const summary = pc >= 2 ? '日主' + dm + '，命局穿破重（' + pc + '处），六亲多损，需重点制化' : pc === 1 ? '日主' + dm + '，命局有穿（1处），宫位受损，论事需察穿所在宫位' : tc >= 2 ? '日主' + dm + '，命局多入墓，主事受困，宜静不宜动' : '日主' + dm + '（' + elem(dm) + '，' + (yang(dm) ? '阳' : '阴') + '），命局基本稳定，按限运细断';
    // 十神
    const gods = {};
    pillars.forEach((p, idx) => {
      const name = PALACE_NAMES[idx];
      gods[name] = { '天干': p.s, '天干十神': idx === 2 ? '日主' : tenGod(dm, p.s), '地支': p.b, '地支五行': BR_ELEM[p.b], '藏干十神': HIDDEN[p.b].map((x) => ({ stem: x, god: tenGod(dm, x) })), '长生宫': branchState(dm, p.b), '宫位': PALACE_ROLES[name] };
    });
    return { bazi_info: { '年': pillars[0].s + pillars[0].b, '月': pillars[1].s + pillars[1].b, '日': pillars[2].s + pillars[2].b, '时': pillars[3].s + pillars[3].b }, ten_gods: gods, branch_interactions: inter, pierce_break_detail: pierceBreak, tomb_check: tombIssues, hour_analysis: hourAna, six_qin_palaces: sixQin, parents_analysis: parentsKe, first_child: firstChild, illness, use_god: useGod, marriage, wealth, limits, liunian_framework: liunian, summary };
  }
  const escB = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const $ = (id) => document.getElementById(id);
  function renderBlindHtml(gz) {
    const r = analyze({ year: { s: gz[0][0], b: gz[0][1] }, month: { s: gz[1][0], b: gz[1][1] }, day: { s: gz[2][0], b: gz[2][1] }, hour: { s: gz[3][0], b: gz[3][1] } });
    let htm = '<div class="card" style="border-color:rgba(245,170,150,.55);"><span class="k">盲派八字 · ' + gz.join(' ') + '　日主：' + escB(r.use_god['日主']) + '（' + escB(r.use_god['日主五行']) + '，' + escB(r.use_god['日主阴阳']) + '）</span>';
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">命局总述</b>：' + escB(r.summary) + '</div>';
    // 地支作用
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">地支作用（穿&gt;冲&gt;合&gt;破&gt;刑）</b>' + (Object.keys(r.branch_interactions).length ? '<div style="display:flex;flex-wrap:wrap;gap:4px;">' + Object.entries(r.branch_interactions).map(([k, v]) => '<span class="tag">' + escB(k) + '：' + escB(v.join('、')) + '</span>').join('') + '</div>' : '<div class="muted">无明显作用关系</div>') + '</div>';
    // 穿破专项
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">穿破专项（盲派重点）</b>' + (r.pierce_break_detail.length ? r.pierce_break_detail.map((x) => '<div style="color:#d17a7a;">' + escB(x.positions) + '（' + escB(x.note) + '）</div>').join('') : '<div class="muted">无穿破</div>') + '</div>';
    // 入墓
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">入墓 / 墓库</b>' + (r.tomb_check.length ? r.tomb_check.map((t) => '<div style="color:#e0a34a;">' + escB(t.desc) + '</div>').join('') : '<div class="muted">无明显入墓</div>') + '</div>';
    // 以病取用
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">以病取用</b><div class="muted" style="font-size:12px;">' + escB(r.illness['总述']) + '</div><div style="margin-top:3px;"><span class="tag" style="color:#6fbf73;">用神：' + escB(r.use_god['总结']) + '</span></div>' + (r.use_god['病对应用神'].length ? '<div class="muted" style="font-size:12px;">' + r.use_god['病对应用神'].map((g) => escB(g.god) + '（' + escB(g.reason) + '）').join('<br>') + '</div>' : '') + '</div>';
    // 时辰断法
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">时辰断法</b><div style="display:flex;flex-wrap:wrap;gap:4px;">' + Object.entries(r.hour_analysis).map(([k, v]) => '<span class="tag">' + escB(k) + '：' + escB(v) + '</span>').join('') + '</div></div>';
    // 六亲宫位
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">六亲宫位</b>' + Object.entries(r.six_qin_palaces).map(([k, v]) => '<div style="padding:3px 0;"><span class="tag">' + escB(k) + '</span> ' + escB(v['干支']) + '（' + escB(v['纳音']) + '）对日主临' + escB(v['宫支长生状态']) + '　<span class="muted" style="font-size:12px;">' + v['注意事项'].map((n) => escB(n)).join('；') + '</span></div>').join('') + '</div>';
    // 婚姻
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">婚姻专断</b><div>' + escB(r.marriage['总评']) + '</div><div class="muted" style="font-size:12px;">' + r.marriage['婚姻凶象'].concat(r.marriage['婚姻吉象']).map((x) => escB(x)).join('；') + '</div></div>';
    // 财运
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">财运</b><div>' + escB(r.wealth['总评']) + '</div><div class="muted" style="font-size:12px;">' + r.wealth['财星分布'].map((x) => escB(x['评述'])).join('<br>') + '</div></div>';
    // 大限
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">大限（以日柱起限，每限10年）</b><div style="display:flex;flex-direction:column;gap:3px;">' + r.limits.map((l) => '<div style="padding:3px 8px;background:rgba(0,0,0,.14);border-radius:6px;"><span class="tag">' + escB(l['限段']) + ' ' + escB(l['虚岁']) + '</span> ' + escB(l['限干支']) + '（' + escB(l['十神']) + '）→ <b>' + escB(l['运势初判']) + '</b>　<span class="muted" style="font-size:12px;">' + escB(l['引动宫位'].join('、')) + '</span></div>').join('') + '</div></div>';
    // 头胎 + 父母
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">头胎 / 父母</b><div><span class="tag">' + escB(r.first_child) + '</span></div><div class="muted" style="font-size:12px;">' + r.parents_analysis.map((x) => escB(x)).join('<br>') + '</div></div>';
    // 流年应期
    htm += '<div style="margin:6px 0;"><b style="color:var(--tx1);">流年应期框架</b><div class="muted" style="font-size:12px;">' + r.liunian_framework['应期规则'].map((x) => escB(x)).join('<br>') + '<br>' + escB(r.liunian_framework['重点年份特征']['穿太岁']) + '；' + escB(r.liunian_framework['重点年份特征']['冲太岁']) + '；' + escB(r.liunian_framework['重点年份特征']['合太岁']) + '</div></div>';
    htm += '<div class="muted" style="font-size:11px;margin-top:6px;">来源：kinastro(MIT) 现代整理层移植（《盲派大师夏仲奇命学精粹》陈秉志著、《盲派-入门-整理》）。四柱取子平排盘结果，大限以日柱为基点起限，每宫主10年。</div></div>';
    return htm;
  }
  function renderBlind(htmlId, gz) { $(htmlId).innerHTML = renderBlindHtml(gz); }
  function blindInit() {
    if ($('bz-blind-go')) $('bz-blind-go').addEventListener('click', function () { const out = $('bz-out'); if (out && window.__baziLast && window.__baziLast.gz) { out.insertAdjacentHTML('beforeend', '<div id="bz-blind-card">' + renderBlindHtml([window.__baziLast.gz.year, window.__baziLast.gz.month, window.__baziLast.gz.day, window.__baziLast.gz.time]) + '</div>'); } });
  }
  window.blindBaziInit = blindInit;
  window.blindBaziRender = renderBlindHtml;
  window.blindBaziAnalyze = analyze;
})();
