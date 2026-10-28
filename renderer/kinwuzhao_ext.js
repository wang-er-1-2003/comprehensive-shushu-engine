// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 五兆古法层（敦煌 P.2859《五兆要诀略》古法复原层）
// 数据：engine/data/wuzhao_ext.json（源数据由 horosa astropy/websrv 三 py 直接提取，繁体转简体）
// 算法：对照 wuzhao_classics.enrich / wuzhao_leizhan.leizhan 重写为 JS（horosa AGPL 参考层，结构重写非照抄）
// 原则：原文阙文/存疑/suspect 标记原样保留，不作补断；缺年命支/性别时出占位行不猜。
'use strict';
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { const api = factory(); root.kzExtMod = api; root.kzExtInit = api.init; }
})(typeof self !== 'undefined' ? self : this, function () {

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ST = '甲乙丙丁戊己庚辛壬癸';
  const BR = '子丑寅卯辰巳午未申酉戌亥';

  // ── 基础五行 ──
  function liuqinOf(T, me, target) {
    if (me === target) return '兄弟';
    if (T.SHENG[me] === target) return '子孙';
    if (T.KE[me] === target) return '妻财';
    if (T.KE[target] === me) return '官鬼';
    if (T.SHENG[target] === me) return '父母';
    return '';
  }

  function sanheGroup(T, branch) {
    for (const k of Object.keys(T.SANHE)) {
      if (k.split('/').indexOf(branch) >= 0) return k;
    }
    return '';
  }

  function xiangZhiRelation(T, zhaoElem, xiangElem, zhiElem) {
    const xr = liuqinOf(T, zhaoElem, xiangElem);
    const zr = liuqinOf(T, zhaoElem, zhiElem);
    const hit = T.XIANG13[xr + '/' + zr];
    if (!hit) return null;
    return { name: hit[0], group: hit[1], luck: hit[2], text: hit[3], xiangRole: xr, zhiRole: zr };
  }

  function fuYiOf(T, xiangElem, zhiElem) {
    if (T.SHENG[xiangElem] === zhiElem) return ['被扶', '乡生支，为被扶，多主好事得进，坏事解散。'];
    if (T.SHENG[zhiElem] === xiangElem) return ['被抑', '支生乡，为被抑，多主好事佚退，坏事快来。'];
    return ['', ''];
  }

  // ── 四时休王 ──
  function seasonOf(T, jieqi, lunarMonth) {
    if (Number(lunarMonth) === 6) return '季夏';
    const s = T.SEASON_BY_JIEQI[String(jieqi || '').trim()];
    return s || '';
  }
  function wangshuaiOf(T, elem, season) {
    const m = T.SEASON_WANGSHUAI[season];
    return m ? (m[elem] || '') : '';
  }
  function qiOf(T, wangshuai) {
    if (!wangshuai) return '';
    return T.YOU_QI.indexOf(wangshuai) >= 0 ? '有气' : '无气';
  }

  // ── 六旬纳甲、空亡 ──
  function jiazi60() {
    const out = [];
    for (let i = 0; i < 60; i++) out.push(ST[i % 10] + BR[i % 12]);
    return out;
  }
  function xunOf(T, dayGz) {
    const gz = String(dayGz || '').trim();
    if (gz.length < 2) return '';
    const JIAZI = T.__jiazi || (T.__jiazi = jiazi60());
    const idx = JIAZI.indexOf(gz);
    if (idx < 0) return '';
    return T.XUN_NAMES[Math.floor(idx / 10)];
  }
  function najia(T, elem, xun) {
    const table = T.XUN_STEM_BRANCH[xun] || {};
    const out = [];
    (T.ELEM_STEMS[elem] || []).forEach(function (stem) {
      const branch = table[stem];
      if (branch) out.push({ stem: stem, branch: branch, yinyang: T.STEM_YINYANG[stem] || '', gz: stem + branch });
    });
    return out;
  }

  // ── 冲合刑害 ──
  function gzRelations(T, positions, dayBranch) {
    const out = [];
    if (!dayBranch) return out;
    positions.forEach(function (pos) {
      const seen = {};
      (pos.xiangNajia || []).concat(pos.najia).forEach(function (it) {
        if (seen[it.gz]) return;
        seen[it.gz] = true;
        const br = it.branch;
        const rels = [];
        if (T.CHONG[br] === dayBranch) rels.push('冲');
        if (T.LIUHE[br] === dayBranch) rels.push('合');
        if (T.XING[br] === dayBranch) rels.push('刑');
        if (T.LIUHAI[br] === dayBranch) rels.push('害');
        const grp = sanheGroup(T, br);
        if (grp && grp.split('/').indexOf(dayBranch) >= 0 && dayBranch !== br) rels.push('三合' + T.SANHE[grp] + '局');
        if (rels.length) out.push({ position: pos.label, gz: it.gz, branch: br, rels: rels, dayBranch: dayBranch });
      });
    });
    return out;
  }

  // ── 神煞（与 classics.shensha 逐项对应） ──
  function sanheLookup(T, table, branch) {
    const grp = sanheGroup(T, branch);
    return grp ? (table[grp] || '') : '';
  }
  function shenshaCalc(T, opts) {
    // opts: {monthNum, yearGz, monthGz, dayGz, hourGz, season, mingBranch, gender}
    const out = {};
    const monthNum = Number(opts.monthNum || 0);
    const yb = (opts.yearGz || '').slice(1, 2);
    const mb = (opts.monthGz || '').slice(1, 2);
    const db = (opts.dayGz || '').slice(1, 2);
    const hb = (opts.hourGz || '').slice(1, 2);
    if (T.DA_SHA[monthNum]) out['月大煞'] = { branch: T.DA_SHA[monthNum], text: T.DA_SHA_TEXT };
    if (mb) {
      let v = sanheLookup(T, T.XIAO_SHA_BY_SANHE, mb);
      if (v) out['月小煞'] = { branch: v, text: T.XIAO_SHA_TEXT, suspect: T.XIAO_SHA_SUSPECT };
      v = sanheLookup(T, T.YUE_JIE_SHA_BY_SANHE, mb);
      if (v) out['月劫煞'] = { branch: v, text: T.YUE_JIE_SHA_TEXT };
    }
    if (yb) {
      const v = sanheLookup(T, T.JIE_SHA_BY_SANHE, yb);
      if (v) out['劫煞'] = { branch: v, text: T.JIE_SHA_TEXT };
    }
    if (monthNum) {
      out['丧门'] = { branch: T.SANG_MEN_CYCLE[(monthNum - 1) % 4], text: T.SANG_MEN_TEXT };
      out['煞阴'] = { branch: T.SHA_YIN[monthNum] || '', text: T.SHA_YIN_TEXT };
      let idx = (BR.indexOf(T.TIAN_YI_START_BRANCH) + (monthNum - T.TIAN_YI_START_MONTH)) % 12;
      if (idx < 0) idx += 12;
      out['天医(左行)'] = { branch: BR[idx], text: T.TIAN_YI_TEXT };
      idx = (BR.indexOf('戌') - (monthNum - 1)) % 12;
      if (idx < 0) idx += 12;
      out['月厌'] = { branch: BR[idx], text: T.YUE_YAN_TEXT };
      for (const k of Object.keys(T.TIAN_DI_SHA)) {
        const months = k.split('/').map(Number);
        if (months.indexOf(monthNum) >= 0) {
          for (const nm of Object.keys(T.TIAN_DI_SHA[k])) {
            const key = nm === '天医' ? '天医(三合)' : nm;
            const item = { branch: T.TIAN_DI_SHA[k][nm], text: T.TIAN_DI_SHA_TEXT };
            if (nm === '天医') item.suspect = T.TIAN_DI_SHA_SUSPECT;
            out[key] = item;
          }
          break;
        }
      }
    }
    if (mb && T.YUE_XING[mb]) out['月刑'] = { branch: T.YUE_XING[mb], text: '月刑：与月支相刑之辰。' };
    const ma = {};
    [['年', yb], ['月', mb], ['日', db], ['时', hb]].forEach(function (p) {
      if (p[1]) {
        const v = sanheLookup(T, T.YI_MA_BY_SANHE, p[1]);
        if (v) ma[p[0]] = v;
      }
    });
    if (Object.keys(ma).length) out['驿马'] = { branches: ma, branch: ma['年'] || '', text: T.YI_MA_TEXT };
    const seasonKey = (opts.season || '').replace('季夏', '夏');
    if (T.GUAN_YUE_SEASON[seasonKey]) {
      out['关'] = { branch: T.GUAN_YUE_SEASON[seasonKey].关, text: T.GUAN_YUE_TEXT };
      out['籥'] = { branch: T.GUAN_YUE_SEASON[seasonKey].籥, text: T.GUAN_YUE_TEXT };
    }
    if (db) out['支德'] = { branch: T.ZHI_DE[db] || '', text: '凡子日德在巳，丑日德在午……（支德）' };
    if (yb) {
      const jl = tianyiDiyi(T, yb);
      out['天医(月将)'] = { branch: jl.天医 || '', text: T.TIANYI_DIYI_TEXT };
      out['地医(月将)'] = { branch: jl.地医 || '', text: T.TIANYI_DIYI_TEXT };
      if (opts.mingBranch) {
        const xn = xingnianNianli(T, yb, opts.mingBranch, opts.gender || '');
        if (xn.行年) out['行年'] = { branch: xn.行年, text: T.XINGNIAN_TEXT };
        if (xn.年立) out['年立'] = { branch: xn.年立, text: T.XINGNIAN_TEXT };
      }
    }
    return out;
  }

  function jiangShift(T, baseJiang, baseBranch, targetJiang) {
    if (T.YUE_JIANG_ORDER.indexOf(baseJiang) < 0 || T.YUE_JIANG_ORDER.indexOf(targetJiang) < 0) return '';
    if (BR.indexOf(baseBranch) < 0) return '';
    const off = (T.YUE_JIANG_ORDER.indexOf(targetJiang) - T.YUE_JIANG_ORDER.indexOf(baseJiang) + 12) % 12;
    return BR[(BR.indexOf(baseBranch) + off) % 12];
  }
  function tianyiDiyi(T, yearBranch) {
    return {
      天医: jiangShift(T, '功曹', yearBranch, '大吉'),
      地医: jiangShift(T, '功曹', yearBranch, '小吉'),
    };
  }
  function xingnianNianli(T, yearBranch, mingBranch, gender) {
    if (!yearBranch || !mingBranch) return {};
    if (gender === 'female') {
      const base = T.YUE_JIANG_BRANCH[yearBranch] || '';
      return { 行年: jiangShift(T, base, mingBranch, '传送'), 年立: jiangShift(T, base, mingBranch, '徵明') };
    }
    const base = T.YUE_JIANG_BRANCH[mingBranch] || '';
    return { 行年: jiangShift(T, base, yearBranch, '功曹'), 年立: jiangShift(T, base, yearBranch, '天罡') };
  }

  // ── 六神游宫 / 行神 ──
  function liushenYougong(T, dayGan) {
    const first = T.DAY_GAN_FIRST_BEAST[String(dayGan || '').slice(0, 1)];
    if (!first) return [];
    const start = T.LIUSHEN_ORDER.indexOf(first);
    const out = [];
    for (let i = 0; i < 6; i++) out.push(T.LIUSHEN_ORDER[(start + i) % 6]);
    return out;
  }
  function xingshen(T, monthNum) {
    monthNum = Number(monthNum || 0);
    if (monthNum < 1 || monthNum > 12) return {};
    const out = {};
    for (const beast of Object.keys(T.XINGSHEN_START)) {
      const start = T.XINGSHEN_START[beast];
      out[beast] = BR[(BR.indexOf(start) + monthNum - 1) % 12];
    }
    return out;
  }
  function xingshenFlags(T, beast, branch) {
    const rule = T.LIUSHEN_SI_HAI[beast];
    if (!rule || !branch) return [];
    const flags = [];
    if ((rule.死 || []).indexOf(branch) >= 0) flags.push('死');
    if ((rule.害 || []).indexOf(branch) >= 0) flags.push('害');
    return flags;
  }

  // ── 入墓三式、干转支转 ──
  function rumuThree(T, zhaoElem, zhiElems, monthBranch, xun, dashaBranch) {
    const out = [];
    let guiElem = '';
    for (const e of T.ELEMS) {
      if (T.KE[e] === zhaoElem) { guiElem = e; break; }
    }
    if (guiElem && T.MU_KU[guiElem] === monthBranch && zhiElems.slice(1).indexOf(guiElem) >= 0) {
      out.push({ name: '鬼行入墓', hit: true,
        detail: '本兆' + zhaoElem + '，官鬼属' + guiElem + '，' + (T.BRANCH_MONTH[monthBranch] || '') + '月为' + guiElem + '之墓，盘中见' + guiElem + '支。',
        text: T.RU_MU_TEXT['鬼行入墓'] });
    }
    const nj = najia(T, zhaoElem, xun);
    for (const it of nj) {
      if (it.branch === monthBranch && T.MU_KU[zhaoElem] === monthBranch) {
        out.push({ name: '身入墓', hit: true, detail: it.stem + '属' + it.branch + '，' + it.branch + '是' + zhaoElem + '墓，身是入墓。', text: T.RU_MU_TEXT['身入墓'] });
        break;
      }
    }
    for (const it of nj) {
      if (dashaBranch && it.branch === dashaBranch && T.MU_KU[zhaoElem] === it.branch) {
        out.push({ name: '带煞入墓', hit: true,
          detail: it.stem + zhaoElem + '属' + it.branch + '，大煞在' + dashaBranch + '，' + it.branch + '是' + zhaoElem + '墓，名带煞入幕。',
          text: T.RU_MU_TEXT['带煞入墓'] });
        break;
      }
    }
    return out;
  }

  function ganZhuan(T, zhaoElem, zhiElems, xun) {
    if (zhiElems.slice(1).indexOf(zhaoElem) < 0) return null;
    const yangStem = (T.ELEM_STEMS[zhaoElem] || ['', ''])[0];
    const branch = (T.XUN_STEM_BRANCH[xun] || {})[yangStem];
    if (!branch) return null;
    if (T.BRANCH_ELEM[branch] !== zhaoElem) return null;
    return { name: '干转（阳德自处）', stem: yangStem, branch: branch,
      detail: yangStem + zhaoElem + '属' + branch + '，' + branch + '边有' + yangStem + '，即名阳德自处。',
      text: T.GAN_ZHUAN_TEXT };
  }
  function zhiZhuan(T, zhaoElem, zhiElems, xun) {
    if (zhiElems.slice(1).indexOf(zhaoElem) < 0) return null;
    const child = T.SHENG[zhaoElem] || '';
    if (!child) return null;
    const yangStem = (T.ELEM_STEMS[child] || ['', ''])[0];
    const branch = (T.XUN_STEM_BRANCH[xun] || {})[yangStem];
    if (!branch) return null;
    const chou = (T.BRANCH_HIDDEN[branch] || []).filter(function (h) {
      return T.KE[T.STEM_ELEM[h] || ''] === child;
    });
    let detail = zhaoElem + '能生' + child + '，' + yangStem + child + '属' + branch + '，名伏。';
    if (chou.length) detail += branch + '中有' + chou.join('、') + '（' + T.STEM_ELEM[chou[0]] + '）克' + child + '，见仇，故曰支转。';
    return { name: '支转', stem: yangStem, branch: branch, xianchou: chou.length > 0, chouStems: chou,
      detail: detail, text: T.ZHI_ZHUAN_TEXT };
  }

  // ── 君子小人、身命、头身足 ──
  function junziXiaoren(T, zhaoElem, dayBranch, dayGan) {
    const out = { zhaoElem: zhaoElem, dayBranch: dayBranch };
    const dbElem = T.BRANCH_ELEM[dayBranch] || '';
    out.dayBranchElem = dbElem;
    out.head = T.JUNZI_HEAD;
    if (dbElem && T.KE[dbElem] === zhaoElem) { out.role = '君子'; out.reason = '日支' + dayBranch + '属' + dbElem + '，克本兆' + zhaoElem + '，克我者为君子。'; }
    else if (dbElem && T.KE[zhaoElem] === dbElem) { out.role = '小人'; out.reason = '本兆' + zhaoElem + '克日支' + dayBranch + '（属' + dbElem + '），我克者为小人。'; }
    else { out.role = ''; out.reason = '本兆与日支非相克之属，不成君子小人之别。'; }
    out.texts = [T.JUNZI_BY_ZHAO_A[zhaoElem], T.JUNZI_BY_ZHAO_B[zhaoElem], T.JUNZI_BY_ZHAO_C[zhaoElem]].filter(Boolean);
    out.yinyangZhao = T.YANG_ZHAO.indexOf(zhaoElem) >= 0 ? '阳' : '阴';
    out.yinyangRule = T.YINYANG_ZHAO_RULE;
    const gan = String(dayGan || '').slice(0, 1);
    const pair = T.ELEM_GANPAIR[T.STEM_ELEM[gan] || ''] || '';
    const boluo = T.BOLUO_PAIRS[pair + '/' + zhaoElem];
    if (boluo) {
      const yy = T.YANG_BRANCHES.indexOf(dayBranch) >= 0 ? '阳' : (T.YIN_BRANCHES.indexOf(dayBranch) >= 0 ? '阴' : '');
      out.boluo = { hit: true, text: boluo, dayGanPair: pair, dayYinYang: yy,
        verdict: yy === '阳' ? '阳日卜得剥落，君子。' : (yy === '阴' ? '阴日卜得剥卦，小人。' : ''),
        rule: T.BOLUO_YINYANG };
    } else {
      out.boluo = { hit: false, rule: T.BOLUO_YINYANG };
    }
    return out;
  }
  function shenMing(T, zhaoElem, dayGan) {
    const gan = String(dayGan || '').slice(0, 1);
    const pair = T.ELEM_GANPAIR[T.STEM_ELEM[gan] || ''] || '';
    const out = { head: T.SHEN_MING_HEAD, dayGan: gan, dayGanPair: pair };
    if (T.SHEN_KE_MING[pair] === zhaoElem) { out.verdict = '身克命'; out.luck = 'xiong'; out.text = T.SHEN_KE_MING_TEXT; out.detail = '身克命多凶，主不得、假。'; }
    else if (T.MING_KE_SHEN[pair] === zhaoElem) { out.verdict = '命克身'; out.luck = 'ji'; out.text = T.MING_KE_SHEN_TEXT; out.detail = '命克身为吉，主得、真。'; }
    else { out.verdict = ''; out.luck = 'ping'; out.detail = '本兆与日干非身克命、命克身之属。'; }
    return out;
  }
  function touShenZu(T, zhaoElem, elements) {
    const parts = { 头: [], 身: [], 足: [] };
    const map = T.TOU_SHEN_ZU_MAP;
    T.XIANG_ORDER.forEach(function (xiang, i) {
      const part = map[xiang];
      if (!part) return;
      const zhi = elements[i + 1];
      const fu = fuYiOf(T, xiang, zhi);
      let ke = '';
      if (T.KE[zhi] === xiang) ke = '被克';
      else if (T.KE[xiang] === zhi) ke = '克支';
      parts[part].push({ xiang: xiang + '乡', zhi: zhi, fuyi: fu[0], ke: ke, fuyiText: fu[1] });
    });
    return { head: T.TOU_SHEN_ZU_HEAD, parts: parts, zhaoPart: map[zhaoElem] || '' };
  }

  // ── 细分六亲两法 ──
  function parentElem(T, elem) {
    for (const e of T.ELEMS) { if (T.SHENG[e] === elem) return e; }
    return '';
  }
  function officerElem(T, elem) {
    for (const e of T.ELEMS) { if (T.KE[e] === elem) return e; }
    return '';
  }
  function liuqinYinyang(T, zhaoElem) {
    const y = T.ELEM_STEMS[zhaoElem] || ['', ''];
    const child = T.SHENG[zhaoElem] || '';
    const father = parentElem(T, zhaoElem);
    const wealth = T.KE[zhaoElem] || '';
    const elder = officerElem(T, zhaoElem);
    const cy = T.ELEM_STEMS[child] || ['', ''];
    const fy = T.ELEM_STEMS[father] || ['', ''];
    const wy = T.ELEM_STEMS[wealth] || ['', ''];
    const ey = T.ELEM_STEMS[elder] || ['', ''];
    return {
      rule: '五行阴阳细分六亲之法：我为阳干，弟为同行阴干；男孩（长子）为我生之阳干，女孩（次女）为我生之阴干；父为生我之阳干，母为生我之阴干；正妻正财为我克之阳干，小妾偏财为我克之阴干；长辈为男为生我之阳干，女为生我之阴干。',
      me: y[0], brother: y[1], son: cy[0], daughter: cy[1],
      father: fy[0], mother: fy[1], wife: wy[0], concubine: wy[1],
      elderMale: ey[0], elderFemale: ey[1],
      text: '我为丙火，弟为丁火（若我是弟则为丁火，兄为丙火），男孩、长子为戊土，女孩、次子为己土，父为甲木，母为乙木，正妻正财为庚金，小妾偏财为辛金（若为现代，妻为庚金，财为辛金），长辈为男为壬水，女为癸水。',
    };
  }
  function liuqinGanhe(T, zhaoElem) {
    const y = T.ELEM_STEMS[zhaoElem] || ['', ''];
    const me = y[0], brother = y[1];
    const wife = T.GAN_HE[me] || '';
    const mother = (T.ELEM_STEMS[parentElem(T, zhaoElem)] || ['', ''])[1];
    const father = T.GAN_HE[mother] || '';
    const wifeChildElem = T.SHENG[T.STEM_ELEM[wife] || ''] || '';
    const cs = T.ELEM_STEMS[wifeChildElem] || ['', ''];
    return {
      rule: '干合生克细分六亲之法：我为甲木，己土为妻，此为天干五合。癸水为母，生我者也，戊土为父，五合于母，我克于父。子为妻所生，如我为母所生，故庚辛为子女，亦是我克，如我克父也。虽可以我起始，上下网络，然一前一后，三代即可。',
      me: me, wife: wife, mother: mother, father: father,
      son: cs[0], daughter: cs[1], brother: brother, childElem: wifeChildElem,
    };
  }

  // ── 五兆入何方、杂言命中 ──
  function matchRuHeFang(T, zhaoElem, zhiElem, elements) {
    const hits = [];
    (T.RU_HE_FANG || []).forEach(function (group) {
      const gan = group.pairs[zhaoElem + '/' + zhiElem];
      if (!gan) return;
      const targetElem = T.GANPAIR_ELEM[gan] || '';
      hits.push({ title: group.title, text: group.text, luck: group.luck, ruGan: gan, ruElem: targetElem,
        xiangPresent: elements.slice(1).indexOf(targetElem) >= 0 });
    });
    return hits;
  }
  function matchZayan(T, zhaoElem, zhiElem, elements, wangshuaiMap) {
    const out = { general: T.ZAYAN_GENERAL, items: [] };
    (T.ZAYAN_YUNWEN || []).forEach(function (row) {
      if (!row || !row[0]) return;
      const key = Array.isArray(row[0]) ? row[0].join('/') : String(row[0]);
      const parts = key.split('/');
      if (parts[0] === zhaoElem && parts[1] === zhiElem) {
        out.items.push({ kind: '韵文象辞', text: row[1] });
      }
    });
    const xx = T.ZAYAN_XIANGXING[zhaoElem + '/' + zhiElem];
    if (xx) out.items.push({ kind: '两两相刑', text: xx });
    out.xiangshi = T.ZAYAN_XIANGSHI;
    out.jianwu = T.ZAYAN_JIANWU;
    let guiElem = '';
    for (const e of T.ELEMS) { if (T.KE[e] === zhaoElem) { guiElem = e; break; } }
    if (guiElem && elements.slice(1).indexOf(guiElem) >= 0) {
      const ws = wangshuaiMap[guiElem] || '';
      const key = ws.replace('休废', '休');
      const text = T.GUI_RU_GUA[key] || T.GUI_RU_GUA[ws];
      if (text) out.items.push({ kind: '鬼入卦', text: text, detail: '官鬼属' + guiElem + '，当令为' + ws + '。' });
    }
    if (T.KE[zhaoElem] === zhiElem) out.items.push({ kind: '兆身克支', text: '兆身克支，忧妻。' });
    else if (T.KE[zhiElem] === zhaoElem) out.items.push({ kind: '支克兆身', text: '支克兆身，忧病患、官书。' });
    else if (T.SHENG[zhaoElem] === zhiElem) out.items.push({ kind: '兆身生支', text: '兆身生支，为子。' });
    else if (T.SHENG[zhiElem] === zhaoElem) out.items.push({ kind: '支生兆身', text: '支生兆身，父母吉。' });
    const zhaoWs = wangshuaiMap[zhaoElem] || '';
    const cls = { '王': '王兆为官财', '相': '相兆为己财', '胎': '胎兆为妇人', '没': '没为儿子' };
    if (cls[zhaoWs]) out.items.push({ kind: '兆之休王', text: cls[zhaoWs] + '。' });
    else if (['囚', '死', '休', '废', '休废'].indexOf(zhaoWs) >= 0) out.items.push({ kind: '兆之休王', text: '囚、死、休、废为疾病。' });
    const ruXiang = [];
    T.XIANG_ORDER.forEach(function (xiang, i) {
      const zhi = elements[i + 1];
      const zhiRole = liuqinOf(T, zhaoElem, zhi);
      const xiangRole = liuqinOf(T, zhaoElem, xiang);
      (T.RU_XIANG_RULES || []).forEach(function (rr) {
        if (zhiRole === rr[0] && xiangRole === rr[1]) {
          ruXiang.push({ xiang: xiang + '乡', zhi: zhi, name: rr[2], text: rr[3], zhiRole: zhiRole, xiangRole: xiangRole });
        }
      });
    });
    out.ruXiang = ruXiang;
    out.fangwei = T.ZHAO_FANGWEI[zhaoElem] || '';
    const dai = T.TOU_DAI[zhaoElem + '/' + zhiElem];
    if (dai) out.items.push({ kind: '头足象辞', text: dai });
    return out;
  }

  // ── 断辞检索 ──
  function duanci25(T, zhaoElem, elements) {
    const rows = [];
    T.XIANG_ORDER.forEach(function (xiang, i) {
      const zhi = elements[i + 1];
      const hit = (T.DUANCI_25[zhaoElem] || {})[xiang] ? (T.DUANCI_25[zhaoElem][xiang][zhi] || null) : null;
      if (!hit) return;
      const item = { xiang: xiang + '乡', xiangElem: xiang, zhiElem: zhi,
        xiangRole: (T.XIANG_ROLE[zhaoElem] || {})[xiang] || '',
        zhiRole: liuqinOf(T, zhaoElem, zhi),
        text: hit[0], luck: hit[1] };
      const sus = T.DUANCI_25_SUSPECT[zhaoElem + '/' + xiang + '/' + zhi];
      if (sus) item.suspect = sus;
      rows.push(item);
    });
    return rows;
  }
  function duanciZhaozhi(T, zhaoElem, zhiElem) {
    const hit = (T.DUANCI_ZHAOZHI[zhaoElem] || {})[zhiElem];
    if (!hit) return null;
    return { text: hit[0], luck: hit[1], title: zhaoElem + '兆' + zhiElem + '支' };
  }
  function duanciSishi(T, zhaoElem, zhiElem) {
    const key = zhaoElem + '/' + zhiElem;
    const text = T.DUANCI_SISHI[key];
    if (!text) {
      const miss = T.DUANCI_SISHI_MISSING[key];
      if (miss) return { text: '', missing: miss, title: zhaoElem + '兆' + zhiElem + '支' };
      return null;
    }
    const out = { text: text, title: zhaoElem + '兆' + zhiElem + '支' };
    const sus = T.DUANCI_SISHI_SUSPECT[key];
    if (sus) out.suspect = sus;
    return out;
  }

  // ── enrich 古法层总入口 ──
  function enrich(T, inp) {
    // inp: {elements:[兆,木,火,土,金,水], ganzhi:[年,月,日,时,分], jieqi, lunarMonth, options:{xingshenMonth,mingZhi,gender}}
    const opts = inp.options || {};
    const elements = (inp.elements || []).slice();
    while (elements.length < 6) elements.push('');
    const gz = (inp.ganzhi || []).slice();
    while (gz.length < 5) gz.push('');
    const zhao = elements[0];
    const zhaoIdx = T.XIANG_ORDER.indexOf(zhao);
    const zhi = zhaoIdx >= 0 ? elements[zhaoIdx + 1] : '';
    const dayGan = String(gz[2] || '').slice(0, 1);
    const dayBranch = String(gz[2] || '').slice(1, 2);
    const season = seasonOf(T, inp.jieqi, inp.lunarMonth);
    const monthMode = opts.xingshenMonth || 'lunar';
    const monthBranch = String(gz[1] || '').slice(1, 2);
    const jieqiMonth = T.BRANCH_MONTH[monthBranch] || 0;
    let monthNum = monthMode === 'lunar' ? Number(inp.lunarMonth || 0) : jieqiMonth;
    if (!monthNum) monthNum = jieqiMonth || Number(inp.lunarMonth || 0);
    const xun = xunOf(T, gz[2]);
    const kongwang = T.XUN_KONGWANG[xun] || [];
    const beasts = liushenYougong(T, dayGan);
    const xsMap = xingshen(T, monthNum);
    const ss = shenshaCalc(T, { monthNum: monthNum, yearGz: gz[0], monthGz: gz[1], dayGz: gz[2], hourGz: gz[3],
      season: season, mingBranch: opts.mingZhi || '', gender: opts.gender || '' });
    const wangshuaiMap = {};
    T.ELEMS.forEach(function (e) { wangshuaiMap[e] = wangshuaiOf(T, e, season); });

    const positions = [];
    for (let idx = 0; idx < 6; idx++) {
      const elem = elements[idx];
      const isZhao = idx === 0;
      const xiangElem = isZhao ? zhao : T.XIANG_ORDER[idx - 1];
      const nj = najia(T, elem, xun);
      const xiangNj = isZhao ? nj : najia(T, xiangElem, xun);
      const njBranches = nj.map(function (it) { return it.branch; });
      const xiangBranches = xiangNj.map(function (it) { return it.branch; });
      const allBranches = [];
      xiangBranches.concat(njBranches).forEach(function (b) { if (allBranches.indexOf(b) < 0) allBranches.push(b); });
      const item = {
        index: idx, label: T.POSITION_LABELS[idx], xiangElem: xiangElem, elem: elem,
        role: isZhao ? '本兆' : liuqinOf(T, zhao, elem),
        xiangRole: isZhao ? '本兆' : (T.XIANG_ROLE[zhao] || {})[xiangElem] || '',
        beast: beasts[idx] || '', wangshuai: wangshuaiOf(T, xiangElem, season),
        qi: qiOf(T, wangshuaiOf(T, xiangElem, season)),
        najia: nj, xiangNajia: xiangNj,
        kongwang: njBranches.filter(function (b) { return kongwang.indexOf(b) >= 0; }),
        xiangKongwang: xiangBranches.filter(function (b) { return kongwang.indexOf(b) >= 0; }),
      };
      if (!isZhao) {
        const rel = xiangZhiRelation(T, zhao, xiangElem, elem);
        if (rel) item.xiang13 = rel;
        const fu = fuYiOf(T, xiangElem, elem);
        if (fu[0]) { item.fuyi = fu[0]; item.fuyiText = fu[1]; }
      }
      const shenshaHits = [];
      for (const nm of Object.keys(ss)) {
        const info = ss[nm];
        const br = info.branch;
        if (!br || allBranches.indexOf(br) < 0) continue;
        const src = [];
        if (xiangBranches.indexOf(br) >= 0) src.push('乡');
        if (njBranches.indexOf(br) >= 0) src.push('支');
        shenshaHits.push({ name: nm, branch: br, from: src.join('／') });
      }
      if (shenshaHits.length) item.shensha = shenshaHits;
      const xingshenHits = [];
      for (const beast of Object.keys(xsMap)) {
        const br = xsMap[beast];
        if (allBranches.indexOf(br) < 0) continue;
        const src = [];
        if (xiangBranches.indexOf(br) >= 0) src.push('乡');
        if (njBranches.indexOf(br) >= 0) src.push('支');
        xingshenHits.push({ beast: beast, branch: br, from: src.join('／'), flags: xingshenFlags(T, beast, br) });
      }
      if (xingshenHits.length) item.xingshen = xingshenHits;
      positions.push(item);
    }

    const xingshenRows = [];
    T.LIUSHEN_ORDER.forEach(function (beast) {
      const br = xsMap[beast] || '';
      const row = { beast: beast, branch: br, flags: xingshenFlags(T, beast, br), sanchen: T.XINGSHEN_SANCHEN[beast] || '' };
      if (T.XINGSHEN_START_SUSPECT[beast]) row.suspect = T.XINGSHEN_START_SUSPECT[beast];
      xingshenRows.push(row);
    });

    const xingFuHits = [];
    positions.forEach(function (pos, idx) {
      const fuBeast = pos.beast || '';
      (pos.xingshen || []).forEach(function (hit) {
        const key = hit.beast + '/' + fuBeast;
        const text = T.XING_FU[key];
        if (text) xingFuHits.push({ position: pos.label, xing: hit.beast, fu: fuBeast, text: text });
        else if (hit.beast === fuBeast && T.XING_FU_HE[fuBeast]) {
          xingFuHits.push({ position: pos.label, xing: hit.beast, fu: fuBeast, text: T.XING_FU_HE[fuBeast] });
        }
      });
    });

    const ganzhiRel = gzRelations(T, positions, dayBranch);

    const dasha = (ss['月大煞'] || {}).branch || '';
    const rumu = rumuThree(T, zhao, elements, T.MONTH_BRANCH[monthNum] || '', xun, dasha);

    const kwZhao = (T.KONGWANG_ZHAO[xun] || {})[zhao] || '';
    const kongwangBlock = { xun: xun, branches: kongwang, text: T.KONGWANG_TEXT[xun] || '',
      zhaoText: kwZhao, general: T.KONGWANG_GENERAL, wuzi: T.KONGWANG_WUZI };
    if (T.KONGWANG_ZHAO_SUSPECT[xun]) kongwangBlock.suspect = T.KONGWANG_ZHAO_SUSPECT[xun];

    const seasonBlock = { season: season, map: wangshuaiMap, text: T.SISHI_WANGSHUAI_TEXT,
      zhaoWangshuai: wangshuaiMap[zhao] || '', zhaoQi: qiOf(T, wangshuaiMap[zhao] || '') };
    if (T.SEASON_WANGSHUAI_SUSPECT[season]) seasonBlock.suspect = T.SEASON_WANGSHUAI_SUSPECT[season];

    return {
      zhaoElem: zhao, zhiElem: zhi, shenGong: zhao ? (zhao + '乡') : '',
      season: season, monthNum: monthNum, monthMode: monthMode, xun: xun,
      dayGan: dayGan, dayBranch: dayBranch,
      positions: positions, qi: seasonBlock,
      changsheng: { text: T.TWELVE_STAGES_TEXT[zhao] || '', elem: zhao },
      zhaoJu: { head: T.ZHAO_JU_HEAD[zhao] || '', zongxiang: T.ZHAO_ZONGXIANG[zhao] || '', role: T.XIANG_ROLE[zhao] || {} },
      duanci25: duanci25(T, zhao, elements),
      duanciZhaozhi: duanciZhaozhi(T, zhao, zhi),
      duanciSishi: duanciSishi(T, zhao, zhi),
      junzi: junziXiaoren(T, zhao, dayBranch, dayGan),
      junziZhaozhi: T.JUNZI_ZHAOZHI[zhao + '/' + zhi] || '',
      shenming: shenMing(T, zhao, dayGan),
      toushenzu: touShenZu(T, zhao, elements),
      najia: {
        xun: xun, xunTable: T.XUN_STEM_BRANCH[xun] || {}, kongwang: kongwangBlock,
        ganZhuan: ganZhuan(T, zhao, elements, xun), zhiZhuan: zhiZhuan(T, zhao, elements, xun),
        ruMu: rumu, relations: ganzhiRel,
        liuqinYinYang: liuqinYinyang(T, zhao), liuqinGanHe: liuqinGanhe(T, zhao),
        liushu: { text: T.LIUSHU_TEXT, map: T.LIUSHU },
        wuhe: { text: T.WUHE_TEXT, tianen: T.TIANEN_TEXT, dayHe: T.WUHE[String(gz[2] || '')] || '',
          dayLi: (T.WULI || []).indexOf(String(gz[2] || '')) >= 0 },
        tianshe: { text: T.TIANSHE_MUCANG_TEXT, hit: T.TIANSHE[season] === String(gz[2] || ''),
          mucang: T.MUCANG[season] || [] },
        xingText: T.XING_TEXT, liuhaiText: T.LIUHAI_TEXT, sanheText: T.SANHE_TEXT,
      },
      shensha: { items: Object.keys(ss).map(function (k) { return Object.assign({ name: k }, ss[k]); }),
        qiuMuMonthly: T.QIU_MU_MONTHLY[monthNum] || {}, qiuMuSeasonal: T.QIU_MU_SEASONAL[season.replace('季夏', '夏')] || {},
        qiuMuSuspect: T.QIU_MU_SUSPECT, yuText: T.YU_TEXT, taisui: T.TAISUI_MINGFEN },
      liushen: {
        yougong: T.POSITION_LABELS.map(function (lb, i) { return { position: lb, beast: beasts[i] || '' }; }),
        yougongText: T.YOUGONG_TEXT, yougongSuspect: T.YOUGONG_SUSPECT,
        zhushi: T.LIUSHEN_ZHUSHI, se: T.LIUSHEN_SE, seText: T.LIUSHEN_SE_TEXT,
        xiangsheng: T.LIUSHEN_XIANGSHENG,
        zhaoBing: T.ZHAO_BING_LIUSHEN[beasts[0] || ''] || '', zhaoBingAll: T.ZHAO_BING_LIUSHEN,
        qiWuxiang: T.ZHAO_QI_WUXIANG[zhao] || {}, suoRu: T.LIUSHEN_SUO_RU, ruJin: T.LIUSHEN_RU_JIN,
      },
      xingshen: { head: T.XINGSHEN_HEAD, monthNum: monthNum, rows: xingshenRows,
        xingFu: xingFuHits, xingZhong: T.XING_ZHONG, siHai: T.LIUSHEN_SI_HAI, cases: T.XINGSHEN_CASES },
      ruHeFang: matchRuHeFang(T, zhao, zhi, elements),
      zayan: matchZayan(T, zhao, zhi, elements, wangshuaiMap),
      weijie: T.WEIJIE,
      shu: { shengcheng: T.SHENG_CHENG_SHU, shengchengText: T.SHENG_CHENG_TEXT,
        ganShu: T.GAN_SHU, zhiShu: T.ZHI_SHU, ganzhiShuText: T.GANZHI_SHU_TEXT,
        wuyin: T.WUYIN_SHU, wuyinText: T.WUYIN_TEXT },
      _ctx: { ss: ss, xun: xun, kongwang: kongwang, beasts: beasts, wangshuaiMap: wangshuaiMap },
    };
  }

  // ── 类占九门（leizhan） ──
  function ganpairOf(T, gan) { return T.ELEM_GANPAIR[T.STEM_ELEM[String(gan || '').slice(0, 1)] || ''] || ''; }
  function countElem(elements, elem) { return elements.filter(function (e) { return e === elem; }).length; }
  function luweiJiang(T, mingBranch, dayBranch) {
    if (!mingBranch || !dayBranch) return '';
    for (const jiang of ['徵明', '太一', '胜光', '神后', '大吉', '小吉', '从魁', '太冲', '功曹', '传送', '天罡', '河魁']) {
      if (jiangShift(T, '河魁', mingBranch, jiang) === dayBranch) return jiang;
    }
    return '';
  }
  function rule(title, text, extra) {
    const row = { title: title, text: text };
    if (extra) Object.keys(extra).forEach(function (k) { row[k] = extra[k]; });
    return row;
  }

  function leizhan(T, inp) {
    // inp: {zhao, zhi, elements, ganzhi, season, beasts, shenshaMap, wangshuaiMap, xun, kongwang, options}
    const opts = inp.options || {};
    const gz = (inp.ganzhi || []).slice();
    while (gz.length < 5) gz.push('');
    const dayGan = String(gz[2] || '').slice(0, 1);
    const dayBranch = String(gz[2] || '').slice(1, 2);
    const pair = ganpairOf(T, dayGan);
    const zhao = inp.zhao;
    const zhi = inp.zhi;
    const elements = inp.elements || [];
    const zhaoWs = (inp.wangshuaiMap || {})[zhao] || '';
    const beasts = inp.beasts || [];
    const beastOf = {};
    beasts.forEach(function (b, i) { beastOf[i] = b; });
    const shenshaMap = inp.shenshaMap || {};
    const out = {};

    // 卜病
    let rules = [];
    if (T.BING_WEI[pair + '/' + zhao]) rules.push(rule('病在何处', T.BING_WEI[pair + '/' + zhao], { source: T.BING_WEI_TEXT, detail: pair + '日卜得' + zhao + '兆。' }));
    if (T.BING_TONGCHU[zhao]) rules.push(rule('病痛处', T.BING_TONGCHU[zhao], { source: T.BING_TONGCHU_TEXT }));
    if (T.BING_GUISHEN[zhao]) rules.push(rule('何鬼神所作', T.BING_GUISHEN[zhao] + '若王相，是神所为；无气，鬼精所作。', { source: T.BING_GUISHEN_TEXT, detail: '本兆当令为' + zhaoWs + '。' }));
    if (T.BING_CHAKUN[zhao]) { const ck = T.BING_CHAKUN[zhao]; rules.push(rule('差困日', ck[0] + '日差，' + ck[1] + '日逢鬼即困。', { source: T.BING_CHAKUN_TEXT })); }
    for (const k of Object.keys(T.BING_YIGUI)) {
      if (dayGan && k.indexOf(dayGan) >= 0) {
        rules.push(rule('医鬼日', k + '日，医在' + T.BING_YIGUI[k][0] + '，鬼在' + T.BING_YIGUI[k][1] + '；逢医即吉，值鬼即凶。', { source: T.BING_YIGUI_TEXT, branches: { 医: T.BING_YIGUI[k][0], 鬼: T.BING_YIGUI[k][1] } }));
        break;
      }
    }
    if (T.BING_RUMU_DAY[dayBranch] === zhao) rules.push(rule('入墓病', dayBranch + '日得' + zhao + '，此是入墓，病者忧。', { source: '卜病，戌日得火，辰日得土，未日得木，丑日得金，此是入墓，病者忧。', luck: 'xiong' }));
    const shisiKey = String(gz[2] || '') + '/' + zhao + '/' + zhi;
    if (T.BING_SHISI[shisiKey]) rules.push(rule('十死一生', T.BING_SHISI[shisiKey] + '，卜病十死一生，此病鬼行入墓。', { source: T.BING_TEXTS[3][1], luck: 'daxiong' }));
    const kz = T.BING_ZHUANG_KE[zhao + '/' + zhi];
    if (kz) rules.push(rule('兆病状', kz, { source: '卜兆病状法（五兆相克致病）' }));
    const cz = T.BING_CHONG[zhao + '/' + zhi];
    if (cz) rules.push(rule('崇在何处', cz + T.BING_CHONG_QI, { source: '卜兆病状法（崇在处）' }));
    out['卜病'] = { rules: rules, texts: T.BING_TEXTS };

    // 卜官事
    rules = [];
    if (T.GUAN_ZHIWEI[zhao]) rules.push(rule('五兆官职', T.GUAN_ZHIWEI[zhao], { source: T.GUAN_ZHIWEI_TEXT }));
    if (T.GUAN_CHUCHU[zhao]) { const cc = T.GUAN_CHUCHU[zhao]; rules.push(rule('遭官事早晚得出', '以' + cc[0] + '日出，子母相会。若不出，' + cc[1] + '日断决。', { source: T.GUAN_TEXTS[1][1] })); }
    const ma = (shenshaMap['驿马'] || {}).branches || {};
    if (Object.keys(ma).length) {
      rules.push(rule('求官驿马', '年驿马' + (ma['年'] || '—') + '、月驿马' + (ma['月'] || '—') + '、日驿马' + (ma['日'] || '—') + '、时驿马' + (ma['时'] || '—') + '。与年驿马并为一岁事，月为一月事，日为一日，时为一时事。', { source: T.GUAN_TEXTS[4][1], branches: ma }));
    }
    if (zhaoWs) {
      if (zhaoWs === '王' || zhaoWs === '相') rules.push(rule('占忧官', '兆得' + zhaoWs + '，有气，其罪不成之属；被扶即日了，被抑罪成。', { source: T.GUAN_TEXTS[6][1] }));
      else rules.push(rule('占忧官', '兆得' + zhaoWs + '，无气；被扶即日了，被抑罪成，相克亦成。', { source: T.GUAN_TEXTS[6][1] }));
    }
    const dasha = (shenshaMap['月大煞'] || {}).branch || '';
    if (dasha) {
      const najiaBranches = opts.zhaoNajiaBranches || [];
      if (najiaBranches.indexOf(dasha) >= 0) rules.push(rule('兆与大煞并', '兆与大煞并，为大贼，为州、刺史所录。', { source: T.GUAN_TEXTS[7][1], luck: 'daxiong' }));
    }
    const ming = opts.mingZhi || '';
    if (ming) {
      const jiang = luweiJiang(T, ming, dayBranch);
      if (jiang) rules.push(rule('官禄位（天命法）', '本命' + ming + '，河魁加之，生日' + dayBranch + '上见' + jiang + '：' + (T.GUAN_LUWEI[jiang] || ''), { source: T.GUAN_TEXTS[0][1], branches: { 本命: ming, 神将: jiang } }));
    } else {
      rules.push(rule('官禄位（天命法）·待补年命', '此法须以河魁加本命、视生日上所见之神将而断；本盘未指定年命支，故留白不断。于「断法与类占 · 年命支」指定后即出。', { source: T.GUAN_TEXTS[0][1], pending: 'mingZhi' }));
    }
    out['卜官事'] = { rules: rules, texts: T.GUAN_TEXTS };

    // 卜财
    rules = [];
    if (T.CAI_QIUCAI[zhao]) {
      const want = T.CAI_QIUCAI[zhao];
      rules.push(rule('求财法', zhao + '兆' + want + '支，为' + zhao + '财。' + (zhi === want ? '本盘身宫入' + zhi + '支，正合。' : '本盘身宫入' + zhi + '支，非其财支。'), { source: T.CAI_QIUCAI_TEXT, hit: zhi === want }));
    }
    if (T.CAI_TOUZHU[zhao]) rules.push(rule('偷主形状颜色', T.CAI_TOUZHU[zhao], { source: T.CAI_TOUZHU_TEXT }));
    const se = (T.CAI_SHIWU_SE[pair] || {})[zhao] || '';
    if (se) rules.push(rule('失财物色', pair + '日卜得' + zhao + '兆，' + se + '。', { source: T.CAI_SHIWU_SE_TEXT }));
    let caiIdx = T.XIANG_ORDER.indexOf(T.KE[zhao] || '');
    const caiBeast = caiIdx >= 0 ? (beastOf[caiIdx + 1] || '') : '';
    if (caiBeast && T.CAI_LIUSHEN[caiBeast]) rules.push(rule('财物与六神并', '财乡（' + T.KE[zhao] + '乡）乘' + caiBeast + '：' + T.CAI_LIUSHEN[caiBeast], { source: T.CAI_TEXTS[0][1] }));
    rules.push(rule('六亲看神', Object.keys(T.CAI_LIUQIN_SHEN).map(function (k) { return k + '看' + T.CAI_LIUQIN_SHEN[k]; }).join('、') + '。', { source: T.CAI_TEXTS[1][1] }));
    if (zhaoWs) {
      const mp = { '王': '成', '相': '吉', '囚': '凶', '死': '妨主也' };
      if (mp[zhaoWs]) rules.push(rule('卖买生牲口', '兆得' + zhaoWs + '，' + mp[zhaoWs] + '。', { source: T.CAI_TEXTS[9][1] }));
    }
    out['卜财'] = { rules: rules, texts: T.CAI_TEXTS };

    // 卜行人
    rules = [];
    if (T.XINGREN_HEFANG[zhao]) rules.push(rule('行人在何方', zhao + '兆在' + T.XINGREN_HEFANG[zhao] + '。', { source: T.XINGREN_HEFANG_TEXT, suspect: T.XINGREN_HEFANG_SUSPECT }));
    if (T.XINGREN_HERI[zhao]) {
      const hr = T.XINGREN_HERI[zhao];
      rules.push(rule('何日还', '行人望本宫，' + zhao + '生于' + hr[0] + '，王于' + hr[1].join('、') + '日；所生月、日至，亦可墓日至（' + zhao + '墓在' + (T.MU_KU[zhao] || '') + '）。', { source: T.XINGREN_HERI_TEXT, extra: T.XINGREN_WUMU }));
    }
    const wangRows = [];
    for (const dir of Object.keys(T.XINGREN_WANG)) {
      const v = T.XINGREN_WANG[dir][zhao];
      if (v) wangRows.push('卜' + dir + '行人：' + v);
    }
    if (wangRows.length) rules.push(rule('望行人东西南北', wangRows.join('；') + '。', { source: T.XINGREN_WANG_TEXT }));
    const tou = ['木', '火'].map(function (x) { return elements[T.XIANG_ORDER.indexOf(x) + 1]; });
    const zu = ['金', '水'].map(function (x) { return elements[T.XIANG_ORDER.indexOf(x) + 1]; });
    rules.push(rule('头足所见', '头（木、火乡）见' + tou.join('、') + '；足（金、水乡）见' + zu.join('、') + '。', { source: '卜行人去不：兆身头上见火，足下见木，头足俱被扶，必行无疑。卜行人达否：若头上见水，足下见金，头足被俱抑，行人不至，已行未还。' }));
    if (zhaoWs === '王' || zhaoWs === '相') rules.push(rule('早晚回', '得王相兆，来。王相兆，未还。', { source: T.XINGREN_TEXTS[8][1] }));
    else if (['休', '废', '休废'].indexOf(zhaoWs) >= 0) rules.push(rule('早晚回', '得休废兆，欲还，亦忧病患。', { source: T.XINGREN_TEXTS[4][1] }));
    out['卜行人'] = { rules: rules, texts: T.XINGREN_TEXTS };

    // 卜六亲
    rules = [];
    const yang = (zhao === '木' || zhao === '火');
    rules.push(rule('怀妊男女', '本兆' + zhao + '，为' + (yang ? '阳' : '阴') + '兆，' + (yang ? '生男' : '生女') + '。', { source: T.LIUQIN_TEXTS[1][1] }));
    rules.push(rule('阳兆阴兆丧', '卜得' + (yang ? '阳' : '阴') + '兆，' + (yang ? '男丧妇' : '女丧夫') + '。', { source: T.LIUQIN_TEXTS[7][1] }));
    const wantZi = T.LIUQIN_YOUZI[zhao] || '';
    if (wantZi) {
      rules.push(rule('有子否', zhao + '兆' + wantZi + '支为有子之属；本盘身宫入' + zhi + '支，' + (zhi === wantZi ? '正合' : '不合') + '。', { source: T.LIUQIN_YOUZI_TEXT, hit: zhi === wantZi, extra: '若空亡与煞并，皆无子也。' }));
    }
    let ziIdx = T.XIANG_ORDER.indexOf(T.SHENG[zhao] || '');
    const ziBeast = ziIdx >= 0 ? (beastOf[ziIdx + 1] || '') : '';
    if (T.LIUQIN_WUSHEN_ZI[ziBeast]) rules.push(rule('五神入子支', '子孙乡（' + T.SHENG[zhao] + '乡）乘' + ziBeast + '：' + T.LIUQIN_WUSHEN_ZI[ziBeast], { source: T.LIUQIN_TEXTS[0][1] }));
    rules.push(rule('求妇得否', '日辰克兆为得，扶兆亦得，兆克日辰不可得。兆王相大盛妇，休废妇贪夫。（本兆' + zhao + '，日支' + dayBranch + '，当令' + zhaoWs + '。）', { source: T.LIUQIN_TEXTS[6][1] }));
    const ming2 = opts.mingZhi || '';
    const gender = opts.gender || '';
    if (ming2 && gender) {
      const xn = {};
      for (const k of Object.keys(shenshaMap)) {
        if (k === '行年' || k === '年立') xn[k] = shenshaMap[k].branch;
      }
      if (Object.keys(xn).length) rules.push(rule('行年·年立', '本命' + ming2 + '、' + (gender === 'male' ? '男' : '女') + '：行年在' + (xn['行年'] || '—') + '，年立在' + (xn['年立'] || '—') + '。', { source: '男常以本命加太岁，功曹下为行年，天罡下为年立。女以太岁加本命，传送下为行年，徵明为年立。' }));
    } else {
      const missing = [];
      if (!ming2) missing.push('年命支');
      if (!gender) missing.push('性别');
      rules.push(rule('行年·年立·待补' + missing.join('与'), '此法男女起例相反（男以本命加太岁、功曹下为行年；女以太岁加本命、传送下为行年），须' + missing.join('与') + '方能起；本盘未指定，故留白不断。', { source: '男常以本命加太岁，功曹下为行年，天罡下为年立。', pending: ming2 ? 'gender' : 'mingZhi' }));
    }
    out['卜六亲'] = { rules: rules, texts: T.LIUQIN_TEXTS };

    // 卜宅田丘墓
    rules = [];
    const xs = T.ZHAI_XIANGSHENG[zhao + '/' + zhi];
    if (xs) rules.push(rule('田宅相生', xs, { source: T.ZHAI_TEXTS[3][1], luck: 'ji' }));
    else rules.push(rule('田宅相生', '兆' + zhao + '支' + zhi + '，非五行相生之属；右五行相生吉，相克凶。', { source: T.ZHAI_TEXTS[3][1] }));
    for (const elem of Object.keys(T.ZHAI_SANXIANG)) {
      if (countElem(elements, elem) >= 3) {
        rules.push(rule('三' + elem, T.ZHAI_SANXIANG[elem], { source: T.ZHAI_TEXTS[5][1], luck: 'xiong', count: countElem(elements, elem) }));
      }
    }
    if (zhi && T.KE[zhi] === zhao) rules.push(rule('居宅法', '支克兆，人胜宅，可居。', { source: T.ZHAI_TEXTS[6][1], luck: 'ji' }));
    else if (zhi && T.KE[zhao] === zhi) rules.push(rule('居宅法', '兆克支，宅胜人，凶。', { source: T.ZHAI_TEXTS[6][1], luck: 'xiong' }));
    if (['王', '相', '胎'].indexOf(zhaoWs) >= 0) rules.push(rule('宅之休王', '卜得' + zhaoWs + '卦，宅平安。若宅始造欲胎养，已造欲王相，故宅欲休废。', { source: T.ZHAI_TEXTS[6][1], luck: 'ji' }));
    else if (['囚', '死'].indexOf(zhaoWs) >= 0) rules.push(rule('宅之休王', '囚、死，凶。', { source: T.ZHAI_TEXTS[6][1], luck: 'xiong' }));
    const below = elements.slice(1);
    if (below.indexOf('土') >= 0 || below.indexOf('金') >= 0) rules.push(rule('兆下所有', '兆下有土、金，主安，大吉。', { source: T.ZHAI_TEXTS[4][1], luck: 'ji' }));
    if (below.indexOf('水') >= 0) rules.push(rule('兆下所有', '兆下有水，主不安。', { source: T.ZHAI_TEXTS[4][1], luck: 'xiong' }));
    out['卜宅田丘墓'] = { rules: rules, texts: T.ZHAI_TEXTS };

    // 卜数射覆
    rules = [];
    if (T.SHESHU_SHU[zhao]) {
      const sc = T.SHESHU_SHU[zhao];
      rules.push(rule('五行生成数', zhao + '兆，数' + sc[0] + '，成数' + sc[1] + '。家有' + sc[0] + '人，不，有' + sc[1] + '人。', { source: T.SHESHU_TEXTS[0][1], extra: T.SHESHU_TEXTS[2][1] }));
    }
    if (T.SHESHU_CANGWU[zhao]) rules.push(rule('射覆藏物', T.SHESHU_CANGWU[zhao], { source: T.SHESHU_TEXTS[3][1] }));
    if (T.SHESHU_XINGSE[zhao]) rules.push(rule('形状颜色', T.SHESHU_XINGSE[zhao], { source: T.SHESHU_TEXTS[8][1] }));
    const wsKey = (zhaoWs || '').replace('休废', '休');
    const se2 = (T.SHESHU_SE_BIAN[zhao] || {})[wsKey] || '';
    if (se2) rules.push(rule('五行色变', zhao + '兆当令为' + zhaoWs + '，色' + se2 + '。', { source: T.SHESHU_SE_BIAN_TEXT, extra: T.SHESHU_SE_RULE }));
    rules.push(rule('手中物虚实', (yang ? '阳' : '阴') + '兆，' + (yang ? '在左手' : '在右手') + '。', { source: T.SHESHU_TEXTS[6][1] }));
    rules.push(rule('杖倚卧', '阳主立，阴主卧。本兆为' + (yang ? '阳' : '阴') + '。', { source: T.SHESHU_TEXTS[7][1] }));
    const ganSe = T.SHESHU_GAN_SE[dayGan] || '';
    if (ganSe) rules.push(rule('推五行色（日干）', dayGan + '，' + ganSe + '。', { source: T.SHESHU_GAN_SE_TEXT }));
    out['卜数射覆'] = { rules: rules, texts: T.SHESHU_TEXTS };

    // 卜怪异
    rules = [];
    let tsIdx = null;
    for (const i of Object.keys(beastOf)) { if (beastOf[i] === '螣蛇') { tsIdx = Number(i); break; } }
    if (tsIdx !== null) {
      const xiang = tsIdx === 0 ? '本兆' : (T.XIANG_ORDER[tsIdx - 1] + '乡');
      const xiangElem = tsIdx === 0 ? zhao : T.XIANG_ORDER[tsIdx - 1];
      const gx = T.GUAI_TENGSHE_XIANG[xiangElem] || '';
      if (gx) rules.push(rule('腾蛇入乡为怪', '腾蛇入' + xiang + '：' + gx, { source: T.GUAI_TEXTS[0][1] }));
      const role = liuqinOf(T, zhao, xiangElem);
      const who = { '子孙': '忧子见怪。', '父母': '父母见怪。', '妻财': '妻及贱人见怪。' };
      if (who[role]) rules.push(rule('何人见怪', '腾蛇临' + role + '乡：' + who[role], { source: T.GUAI_TEXTS[1][1] }));
    }
    if (T.GUAI_ZUOGUAI[zhao]) rules.push(rule('何作怪', '得' + zhao + '，' + T.GUAI_ZUOGUAI[zhao] + '。', { source: T.GUAI_TEXTS[3][1] }));
    if (T.GUAI_ZAGUAI[zhao]) rules.push(rule('杂怪法', zhao + '兆为' + T.GUAI_ZAGUAI[zhao] + '。男欲得阳怪，女欲得阴怪；木火为阳，水土金为阴。', { source: T.GUAI_TEXTS[4][1] }));
    const gzz = T.GUAI_ZHAOZHI[zhao + '/' + zhi];
    if (gzz) rules.push(rule('兆支何人作怪', zhao + '兆' + zhi + '支，' + gzz, { source: T.GUAI_TEXTS[3][1] }));
    if (T.GUAI_ZHAO_SUI[zhao]) rules.push(rule('五兆怪祟', T.GUAI_ZHAO_SUI[zhao], { source: '《要诀略·卜怪异》逐兆怪祟' }));
    out['卜怪异'] = { rules: rules, texts: T.GUAI_TEXTS };

    // 杂卜
    rules = [];
    const tq = T.ZABU_TIANQI[zhao + '/' + zhi];
    if (tq) rules.push(rule('天气', zhao + '兆' + zhi + '支，' + tq + '。', { source: T.ZABU_TEXTS[0][1] }));
    if (T.ZABU_WUWEI[zhao]) rules.push(rule('五味', zhao + '，' + T.ZABU_WUWEI[zhao] + '。', { source: T.ZABU_TEXTS[2][1] }));
    for (const elem of Object.keys(T.ZABU_SANXIANG)) {
      if (countElem(elements, elem) >= 3) rules.push(rule('三象', T.ZABU_SANXIANG[elem], { source: T.ZABU_TEXTS[3][1], count: countElem(elements, elem) }));
    }
    for (const use of Object.keys(T.ZABU_YONGSHI)) {
      const y = T.ZABU_YONGSHI[use];
      if (countElem(elements, y[0]) >= 3) rules.push(rule('用事所宜（' + use + '）', y[1] + '（本盘三' + y[0] + '具足）', { source: T.ZABU_TEXTS[4][1], luck: 'ji' }));
    }
    rules.push(rule('落水伏仰', '水木为阳，金火土为阴。本兆' + zhao + '，为' + (zhao === '水' || zhao === '木' ? '阳' : '阴') + '。', { source: T.ZABU_TEXTS[7][1], suspect: '此节阴阳之分与前文「木火为阳，水土金为阴」不同，原卷两说并存。' }));
    out['杂卜'] = { rules: rules, texts: T.ZABU_TEXTS };

    return out;
  }

  // 主入口：由五兆排盘结果叠加古法层
  function kzExtCompute(pan, T, opts) {
    opts = opts || {};
    if (!T || !pan || !pan.ok) return { ok: false, reason: '排盘数据或古法数据表未加载' };
    const r = pan.result;
    const zhao = r['兆'].五行;
    const elements = [zhao];
    T.XIANG_ORDER.forEach(function (x) { elements.push(r[x + '乡'].五行); });
    const gz = [pan.四柱.年, pan.四柱.月, pan.四柱.日, pan.四柱.时, pan.分干支 || ''];
    const inp = { elements: elements, ganzhi: gz, jieqi: pan.节气 || '', lunarMonth: lunarMonthNum(pan.农历月) };
    if (opts.xingshenMonth) inp.options = inp.options || {}, inp.options.xingshenMonth = opts.xingshenMonth;
    if (opts.mingZhi) { inp.options = inp.options || {}; inp.options.mingZhi = opts.mingZhi; }
    if (opts.gender) { inp.options = inp.options || {}; inp.options.gender = opts.gender; }
    const ext = enrich(T, inp);
    // 类占九门
    const nine = leizhan(T, { zhao: zhao, zhi: ext.zhiElem, elements: elements, ganzhi: gz,
      season: ext.season, beasts: ext._ctx.beasts, shenshaMap: ext._ctx.ss,
      wangshuaiMap: ext._ctx.wangshuaiMap, xun: ext._ctx.xun, kongwang: ext._ctx.kongwang,
      options: inp.options || {} });
    return { ok: true, ext: ext, nine: nine, elements: elements, ganzhi: gz };
  }

  function lunarMonthNum(cm) {
    const m = { '正': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '冬': 11, '腊': 12 };
    if (cm == null) return 0;
    const s = String(cm).replace(/[闰]/g, '');
    const first = s.slice(0, 1);
    if (m[first]) return m[first];
    const idx = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'].indexOf(first);
    return idx >= 0 ? idx + 1 : 0;
  }

  // ── UI 渲染（古法层，追加于五兆排盘下方） ──
  const LUCK_TAG = { daji: '<span class="tag-ji">大吉</span>', ji: '<span class="tag-ji">吉</span>',
    xiaoji: '<span class="tag-ji">小吉</span>', ping: '<span class="tag-ping">平</span>',
    xiong: '<span class="tag-xiong">凶</span>', daxiong: '<span class="tag-xiong">大凶</span>' };
  const luckTag = (l) => LUCK_TAG[l] || '';
  const sus = (s) => s ? '<div class="muted" style="color:#c9a45c;font-size:11px;margin-top:2px;">〔存疑〕' + esc(s) + '</div>' : '';

  function renderExt(res) {
    if (!res.ok) return '<div class="muted" style="color:#d17a7a;">' + esc(res.reason || '古法层不可用') + '</div>';
    const e = res.ext;
    const h = [];
    h.push('<div class="card" style="margin-top:12px;"><h3>古法层 · 敦煌 P.2859《五兆要诀略》</h3>');
    h.push('<div class="muted" style="font-size:11px;margin-bottom:6px;">本兆 <b>' + esc(e.zhaoElem) + '</b> · 身宫 ' + esc(e.shenGong) +
      ' · 当令 <b>' + esc(e.qi.zhaoWangshuai || '—') + '</b>（' + esc(e.qi.zhaoQi || '') + '） · 日柱 ' + esc(e.dayGan + e.dayBranch) +
      ' · ' + esc(e.season || '无季') + ' · ' + esc(e.xun || '—') + (e.monthNum ? ' · 行神月制：' + esc(e.monthMode) : '') + '</div>');
    if (e.qi.suspect) h.push(sus(e.qi.suspect));

    // 兆局 + 断辞
    if (e.zhaoJu.head) h.push('<div style="margin:6px 0;"><b>' + esc(e.zhaoJu.head) + '</b>' +
      (e.zhaoJu.zongxiang ? ' — ' + esc(e.zhaoJu.zongxiang) : '') + '</div>');
    if (e.changsheng.text) h.push('<div class="muted" style="font-size:12px;margin:2px 0;">' + esc(e.changsheng.text) + '</div>');

    h.push('<h4 style="margin:10px 0 4px;">断辞（廿五式 / 兆支总断 / 候四时）</h4>');
    if (e.duanci25.length) {
      h.push('<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:var(--line);"><th style="padding:3px 6px;text-align:left;">乡·支</th><th style="padding:3px 6px;text-align:left;">六亲</th><th style="padding:3px 6px;text-align:left;">断辞</th><th style="padding:3px 6px;">吉凶</th></tr>');
      e.duanci25.forEach(function (d) {
        h.push('<tr><td style="padding:3px 6px;">' + esc(d.xiang) + '见' + esc(d.zhiElem) + '支</td><td style="padding:3px 6px;">' + esc(d.xiangRole) + ' / ' + esc(d.zhiRole) + '</td>' +
          '<td style="padding:3px 6px;">' + esc(d.text) + sus(d.suspect) + '</td><td style="padding:3px 6px;text-align:center;">' + luckTag(d.luck) + '</td></tr>');
      });
      h.push('</table>');
    }
    if (e.duanciZhaozhi) h.push('<div style="margin-top:4px;"><b>' + esc(e.duanciZhaozhi.title) + '</b>：' + esc(e.duanciZhaozhi.text) + ' ' + luckTag(e.duanciZhaozhi.luck) + '</div>');
    if (e.duanciSishi) {
      if (e.duanciSishi.text) h.push('<div style="margin-top:2px;"><b>' + esc(e.duanciSishi.title) + '</b>（候四时）：' + esc(e.duanciSishi.text) + sus(e.duanciSishi.suspect) + '</div>');
      else h.push('<div style="margin-top:2px;" class="muted">' + esc(e.duanciSishi.title) + '（候四时）原文阙：' + esc(e.duanciSishi.missing) + '</div>');
    }

    // 乡支十三名词 + 被扶被抑
    const x13 = e.positions.filter(function (p) { return p.xiang13; });
    if (x13.length) {
      h.push('<h4 style="margin:10px 0 4px;">乡支十三名词（六亲关系机判）</h4>');
      x13.forEach(function (p) {
        h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(p.xiang13.name) + '</b>（' + esc(p.xiang13.xiangRole) + '乡 · ' + esc(p.xiang13.zhiRole) + '支 → ' + esc(p.xiang13.group) + '）' + luckTag(p.xiang13.luck) + '：' + esc(p.xiang13.text) + '</div>');
      });
    }
    const fy = e.positions.filter(function (p) { return p.fuyi; });
    if (fy.length) {
      h.push('<h4 style="margin:8px 0 4px;">被扶／被抑</h4>');
      fy.forEach(function (p) {
        h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(p.fuyi) + '</b>（' + esc(p.label) + '）：' + esc(p.fuyiText) + '</div>');
      });
    }

    // 纳甲 / 空亡 / 干转支转 / 入墓
    h.push('<h4 style="margin:10px 0 4px;">纳甲 · 空亡 · 入墓 · 冲合刑害</h4>');
    h.push('<div style="font-size:12px;margin:2px 0;">' + esc(e.xun || '—') + '，空亡：' + esc((e.najia.kongwang.branches || []).join('、') || '—') +
      (e.najia.kongwang.text ? '（' + esc(e.najia.kongwang.text) + '）' : '') + '</div>');
    if (e.najia.kongwang.zhaoText) h.push('<div style="font-size:12px;margin:2px 0;">占空亡（本兆）：' + esc(e.najia.kongwang.zhaoText) + '</div>');
    h.push('<div style="font-size:12px;margin:2px 0;">' + esc(e.najia.kongwang.general) + '</div>');
    if (e.najia.kongwang.suspect) h.push(sus(e.najia.kongwang.suspect));
    if (e.najia.ganZhuan) h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(e.najia.ganZhuan.name) + '</b>：' + esc(e.najia.ganZhuan.detail) + '</div>');
    if (e.najia.zhiZhuan) h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(e.najia.zhiZhuan.name) + '</b>：' + esc(e.najia.zhiZhuan.detail) + (e.najia.zhiZhuan.xianchou ? '<span style="color:#ff8a8a;">（见仇）</span>' : '') + '</div>');
    if (e.najia.ruMu && e.najia.ruMu.length) {
      e.najia.ruMu.forEach(function (rm) {
        h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(rm.name) + '</b><span style="color:#ff8a8a;">（凶）</span>：' + esc(rm.detail) + '</div>');
      });
    }
    if (e.najia.relations.length) {
      h.push('<div style="font-size:12px;margin:2px 0;">与日支比较：</div>');
      e.najia.relations.forEach(function (rel) {
        h.push('<div style="font-size:12px;margin:2px 0 2px 14px;">' + esc(rel.position) + '纳甲 ' + esc(rel.gz) + '：<b>' + esc(rel.rels.join('、')) + '</b>（日支' + esc(rel.dayBranch) + '）</div>');
      });
    }

    // 神煞命中 + 六神 + 行神
    const shaPos = e.positions.filter(function (p) { return p.shensha && p.shensha.length; });
    if (shaPos.length) {
      h.push('<h4 style="margin:10px 0 4px;">神煞命中（乡／支两路纳甲查）</h4>');
      shaPos.forEach(function (p) {
        h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(p.label) + '</b>：' + p.shensha.map(function (s) { return esc(s.name) + '(' + esc(s.branch) + '，自' + esc(s.from) + ')'; }).join('；') + '</div>');
      });
    }
    h.push('<h4 style="margin:10px 0 4px;">六神游宫（日干起）</h4>');
    h.push('<div style="font-size:12px;margin:2px 0;">' + e.liushen.yougong.map(function (y) { return esc(y.position) + '·' + esc(y.beast); }).join(' ｜ ') + '</div>');
    h.push('<div class="muted" style="font-size:11px;margin-top:2px;">' + esc(e.liushen.yougongText) + (e.liushen.yougongSuspect ? '〔存疑：' + esc(e.liushen.yougongSuspect) + '〕' : '') + '</div>');
    h.push('<h4 style="margin:10px 0 4px;">行神（月家六神，' + (e.monthNum ? '行神月制' + esc(e.monthMode) + '·' + esc(e.monthNum) + '月' : '—') + '）</h4>');
    h.push('<div style="font-size:12px;margin:2px 0;">' + e.xingshen.rows.map(function (x) { return esc(x.beast) + '临' + esc(x.branch || '—') + (x.flags.length ? '<span style="color:#ff8a8a;">[' + esc(x.flags.join('')) + ']</span>' : ''); }).join(' ｜ ') + '</div>');
    if (e.xingshen.xingFu.length) {
      h.push('<div style="font-size:12px;margin:2px 0;">行神与游宫同临（行伏）：' + e.xingshen.xingFu.map(function (xf) { return esc(xf.position) + ' ' + esc(xf.xing) + '×' + esc(xf.fu) + '：' + esc(xf.text); }).join('；') + '</div>');
    }
    if (e.xingshen.rows.some(function (x) { return x.suspect; })) h.push(sus('行神起位：「勾陈正月在辰」系据六壬同构校补，存疑。'));

    // 君子小人 / 身命 / 头身足 / 细分六亲
    h.push('<h4 style="margin:10px 0 4px;">君子小人 · 身命 · 头身足</h4>');
    h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(e.junzi.role || '不成君子小人') + '</b>：' + esc(e.junzi.reason) + '</div>');
    if (e.junzi.boluo.hit) h.push('<div style="font-size:12px;margin:2px 0;">剥落：' + esc(e.junzi.boluo.text) + (e.junzi.boluo.verdict ? '（' + esc(e.junzi.boluo.verdict) + '）' : '') + '</div>');
    h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(e.shenming.verdict || '身命无克属') + '</b>' + (e.shenming.verdict ? luckTag(e.shenming.luck) + '：' + esc(e.shenming.detail) : '') + '</div>');
    if (e.junziZhaozhi) h.push('<div style="font-size:12px;margin:2px 0;">兆支总断（君子小人）：' + esc(e.junziZhaozhi) + '</div>');
    h.push('<div style="font-size:12px;margin:2px 0;">头身足：头（木火乡）' + e.toushenzu.parts['头'].map(function (p) { return esc(p.zhi); }).join('、') + '；身（土乡）' + e.toushenzu.parts['身'].map(function (p) { return esc(p.zhi); }).join('、') + '；足（金水乡）' + e.toushenzu.parts['足'].map(function (p) { return esc(p.zhi); }).join('、') + '。本兆在' + esc(e.toushenzu.zhaoPart) + '。</div>');
    h.push('<h4 style="margin:10px 0 4px;">细分六亲（两法）</h4>');
    h.push('<div style="font-size:12px;margin:2px 0;"><b>五行阴阳法</b>：我为' + esc(e.najia.liuqinYinYang.me) + '，弟' + esc(e.najia.liuqinYinYang.brother) + '，长子' + esc(e.najia.liuqinYinYang.son) + '，次女' + esc(e.najia.liuqinYinYang.daughter) + '，父' + esc(e.najia.liuqinYinYang.father) + '，母' + esc(e.najia.liuqinYinYang.mother) + '，正妻' + esc(e.najia.liuqinYinYang.wife) + '，偏财' + esc(e.najia.liuqinYinYang.concubine) + '，长辈男' + esc(e.najia.liuqinYinYang.elderMale) + '女' + esc(e.najia.liuqinYinYang.elderFemale) + '</div>');
    h.push('<div style="font-size:12px;margin:2px 0;"><b>干合法</b>：我为' + esc(e.najia.liuqinGanHe.me) + '，妻' + esc(e.najia.liuqinGanHe.wife) + '，母' + esc(e.najia.liuqinGanHe.mother) + '，父' + esc(e.najia.liuqinGanHe.father) + '，子女' + esc(e.najia.liuqinGanHe.son) + esc(e.najia.liuqinGanHe.daughter) + '</div>');

    // 五兆入何方 + 杂言
    if (e.ruHeFang.length) {
      h.push('<h4 style="margin:10px 0 4px;">五兆入何方</h4>');
      e.ruHeFang.forEach(function (rf) {
        h.push('<div style="font-size:12px;margin:2px 0;">' + esc(rf.title) + luckTag(rf.luck) + '：' + esc(rf.text) + (rf.xiangPresent ? '（盘中' + esc(rf.ruElem) + '乡有' + esc(rf.ruGan) + '，应）' : '') + '</div>');
      });
    }
    if (e.zayan.items.length) {
      h.push('<h4 style="margin:10px 0 4px;">杂言命中</h4>');
      e.zayan.items.forEach(function (zi) {
        h.push('<div style="font-size:12px;margin:2px 0;"><b>' + esc(zi.kind) + '</b>：' + esc(zi.text) + (zi.detail ? '（' + esc(zi.detail) + '）' : '') + '</div>');
      });
    }

    // 类占九门
    h.push('<h4 style="margin:10px 0 4px;">类占九门（机判规则）</h4>');
    Object.keys(res.nine).forEach(function (men) {
      const m = res.nine[men];
      h.push('<details style="margin:4px 0;border:1px solid var(--line);border-radius:6px;padding:4px 8px;font-size:12px;"><summary style="cursor:pointer;"><b>' + esc(men) + '</b>（' + m.rules.length + ' 条命中）</summary>');
      if (m.rules.length) {
        m.rules.forEach(function (r) {
          h.push('<div style="margin:3px 0;"><b>' + esc(r.title) + '</b>' + (r.luck ? ' ' + luckTag(r.luck) : '') + '：' + esc(r.text));
          if (r.pending) h.push('<span style="color:#c9a45c;">（待补：' + esc(r.pending) + '）</span>');
          if (r.suspect) h.push(sus(r.suspect));
          h.push('</div>');
        });
      } else {
        h.push('<div class="muted">本盘无命中规则；原文备查见下。</div>');
      }
      h.push('<details style="margin:4px 0 2px 10px;"><summary class="muted" style="cursor:pointer;font-size:11px;">原文备查（' + m.texts.length + ' 节）</summary>');
      m.texts.forEach(function (t) {
        h.push('<div style="margin:3px 0 3px 12px;color:var(--tx2);"><b>' + esc(t[0]) + '</b>：' + esc(t[1]) + '</div>');
      });
      h.push('</details></details>');
    });

    h.push('<div class="muted" style="font-size:11px;margin-top:8px;">古法层：敦煌写本 P.2859《五兆要诀略》正文转录（公版古籍，繁体转简体；[] □ (?) 为原卷校录体例标记，suspect 存疑随文保留，不作补断）+ 算法结构参考 horosa astropy/websrv（AGPL 参考层）重写。</div>');
    h.push('</div>');
    return h.join('');
  }

  function init() {
    if (typeof document === 'undefined') return;
    const go = document.getElementById('kz-go');
    if (!go) return;
    go.addEventListener('click', function () {
      const T = (typeof window !== 'undefined' && window.__DATA && window.__DATA.wuzhao_ext) || null;
      const out = document.getElementById('kz-ext-result');
      if (!out) return;
      if (!T) { out.innerHTML = '<div class="muted" style="color:#d17a7a;">古法数据表未加载（wuzhao_ext.json）。</div>'; return; }
      const y = parseInt(document.getElementById('kz-y').value, 10);
      const m = parseInt(document.getElementById('kz-m').value, 10);
      const d = parseInt(document.getElementById('kz-d').value, 10);
      const h = parseInt(document.getElementById('kz-h').value, 10);
      const num = parseInt(document.getElementById('kz-num').value, 10) || 0;
      const modeSel = document.getElementById('kz-mode');
      const mode = modeSel ? modeSel.value : 'ganzhi';
      if (!(y >= 1 && m >= 1 && m <= 12 && d >= 1 && d <= 31 && h >= 0 && h <= 23)) {
        out.innerHTML = '<div class="muted" style="color:#d17a7a;">请先输入合法公历年/月/日/时。</div>';
        return;
      }
      const L = (typeof window !== 'undefined' && window.Solar && window.Solar.fromYmdHms) ? window.Solar : null;
      const base = (typeof window !== 'undefined' && window.kinwuzhaoMod && window.kinwuzhaoMod.kzCompute)
        ? window.kinwuzhaoMod.kzCompute(y, m, d, h, window.__DATA && window.__DATA.kinwuzhao, L, { mode: mode, num: num })
        : null;
      if (!base || !base.ok) { out.innerHTML = '<div class="muted" style="color:#d17a7a;">基础排盘不可用。</div>'; return; }
      const opts = {
        mingZhi: document.getElementById('kz-mingzhi').value || '',
        gender: document.getElementById('kz-gender').value || '',
        xingshenMonth: document.getElementById('kz-xsmonth').value || 'lunar',
      };
      out.innerHTML = renderExt(kzExtCompute(base, T, opts));
    });
    const hint = document.getElementById('kz-hint');
    if (hint && window.__DATA && window.__DATA.wuzhao_ext) {
      hint.textContent = '古法层已加载（P.2859 断辞库 125 条 + 算法层 + 类占九门）。可选填年命支（官禄位/行年用）与性别（行年起法用）。';
    }
  }

  return { kzExtCompute, enrich, leizhan, lunarMonthNum, renderExt, init };
});
