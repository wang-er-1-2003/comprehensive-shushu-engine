// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 奇门古籍机判层统一求值器（自包含，不引用 qimen.js 内部变量；参数 R=qiJu 局盘，shi=事类名）
// cond 为中文关键词条件字符串；求值器把局盘要素（值符/类星/门/奇仪/八神落宫、生克比和、空亡、入墓、旺相、内外、伏反吟、门迫）解析为布尔命中。
// 设计：每个规则 cond 由一个或多个子句组成（按 ，、；且并 分割，全部成立才命中）。
'use strict';

(function () {
  // ── 常量（与 qimen.js 同口径，独立复制）──
  var GAN10 = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  var GONG_NAME = {1:'坎',2:'坤',3:'震',4:'巽',5:'中',6:'乾',7:'兑',8:'艮',9:'离'};
  var GONG_WX = {1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'};
  var GAN_WX = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  var ZHI_WX = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
  var STAR_BY_GONG = {1:'天蓬',2:'天芮',3:'天冲',4:'天辅',5:'天禽',6:'天心',7:'天柱',8:'天任',9:'天英'};
  var STARS = ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'];
  var MEN8 = ['开门','休门','生门','伤门','杜门','景门','死门','惊门'];
  var MEN_WX = {'休门':'水','生门':'土','伤门':'木','杜门':'木','景门':'火','死门':'土','惊门':'金','开门':'金'};
  var SHEN8 = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];
  // 宫 → 地盘地支（反查）
  var GONG_ZHI = {1:['子'],2:['未','申'],3:['卯'],4:['辰','巳'],6:['戌','亥'],7:['酉'],8:['丑','寅'],9:['午']};
  // 旬空表（以时干支定）
  var XUNKONG = {
    '甲子':'戌亥','甲戌':'申酉','甲申':'午未','甲午':'辰巳','甲辰':'寅卯','甲寅':'子丑'
  };

  function sheng(a, b) {
    return (a==='木'&&b==='火')||(a==='火'&&b==='土')||(a==='土'&&b==='金')||(a==='金'&&b==='水')||(a==='水'&&b==='木');
  }
  function ke(a, b) { // a克b?
    return (a==='金'&&b==='木')||(a==='木'&&b==='土')||(a==='土'&&b==='水')||(a==='水'&&b==='火')||(a==='火'&&b==='金');
  }
  function wrap1(n){ return ((n-1+9)%9)+1; }

  var QMAP = {'乙奇':'乙','日奇':'乙','丙奇':'丙','月奇':'丙','丁奇':'丁','星奇':'丁','甲子戊':'戊','六戊':'戊','六乙':'乙','六丙':'丙','六丁':'丁','六庚':'庚','六辛':'辛','六壬':'壬','六癸':'癸'};
  function qmapLocal(s){ if (QMAP[s]) return QMAP[s]; for (var i=0;i<GAN10.length;i++){ if (s===GAN10[i]) return s; } return null; }

  // 时干支 → 旬首地支
  function xunShouZhi(timeGZ) {
    // 60甲子序
    var G='甲乙丙丁戊己庚辛壬癸'.split(''), Z='子丑寅卯辰巳午未申酉戌亥'.split('');
    var tg = G.indexOf(timeGZ[0]), tz = Z.indexOf(timeGZ[1]);
    // 找旬首：旬首支 ∈ 子戌申午辰寅，使 (tz - tg) ≡ (xunZhiIdx - 0) mod12 与干支同序
    var idx = -1;
    for (var i=0;i<60;i++){ if (i%10===tg && i%12===tz){ idx=i; break; } }
    if (idx<0) idx=0;
    var head = (Math.floor(idx/10))*10;
    return Z[head%12];
  }
  function kongZhis(timeGZ) {
    var xs = xunShouZhi(timeGZ);
    return XUNKONG[xs] || '';
  }

  // ── 类神 → 落宫（1-9，未定位返回 0）──
  function findGong(map, v) {
    if (!map) return 0;
    for (var g=1; g<=9; g++) if (map[g]===v) return g;
    return 0;
  }

  // 归一化类名 → 解析为 {kind, value}
  function resolveSym(raw, R, ctx) {
    var s = String(raw||'').replace(/[\s　]/g,'');
    s = s.replace(/落宫|宫位|之宫|所落|所乘|乘|落|宫$/g,'');
    // 值符/主/我
    if (/^(值符|值符星|主帅?|我|主|原告|买主|物主|求荐|放债|买奴|差官|天子|士?子?)$/.test(s)) return {gong: ctx.zfG};
    if (s==='日干'||s==='日'||s==='本身'||s==='病人'||s==='失主'||s==='货主'||s==='买主'||s==='求谒'||s==='打抽丰') return {gong: ctx.dayG};
    if (s==='时干'||s==='货物'||s==='失物'||s==='伙计'||s==='他'||s==='举子'||s==='试士'||s==='童生'||s==='试子'||s==='贷人'||s==='欠债') return {gong: ctx.shiG};
    if (s==='值使'||s==='值使门'||s==='公差'||s==='符使') return {gong: R.shiZhiGong};
    // 八神
    for (var i=0;i<SHEN8.length;i++){ if (s.indexOf(SHEN8[i])>=0) return {gong: findGong(R.shenPan, SHEN8[i])}; }
    // 八门
    for (var j=0;j<MEN8.length;j++){ if (s.indexOf(MEN8[j])>=0) return {gong: findGong(R.menPan, MEN8[j])}; }
    // 九星
    for (var k=0;k<STARS.length;k++){ if (s.indexOf(STARS[k])>=0) return {gong: findGong(R.tianPan, STARS[k])}; }
    // 奇仪天干（天盘）
    var gan = null;
    var qmap = {'乙奇':'乙','日奇':'乙','丙奇':'丙','月奇':'丙','丁奇':'丁','星奇':'丁','甲子戊':'戊','六戊':'戊','六乙':'乙','六丙':'丙','六丁':'丁','六庚':'庚','六辛':'辛','六壬':'壬','六癸':'癸'};
    if (qmap[s]) gan = qmap[s];
    else for (var g=0; g<GAN10.length; g++){ if (s.indexOf(GAN10[g])>=0 && GAN10[g]!=='甲'){ gan=GAN10[g]; break; } }
    if (gan) return {gong: findGong(R.tianYi, gan), gan: gan};
    return {gong:0};
  }

  // 宫五行关系：返回 '生'(a生b)/'被生'(b生a)/'克'(a克b)/'被克'(b克a)/'比和'
  function gRel(ga, gb) {
    if (!ga || !gb || ga===5 || gb===5) return 'none';
    var wa=GONG_WX[ga], wb=GONG_WX[gb];
    if (wa===wb) return '比和';
    if (sheng(wa,wb)) return '生';
    if (sheng(wb,wa)) return '被生';
    if (ke(wa,wb)) return '克';
    if (ke(wb,wa)) return '被克';
    return 'none';
  }

  function buildCtx(R) {
    var dayGan = R.dayGZ[0], timeGan = R.timeGZ[0];
    function gan2Yi(g){ return g==='甲'?'戊':g; }
    var dayYi = gan2Yi(dayGan), shiYi = gan2Yi(timeGan);
    var dayG = findGong(R.diPan, dayYi);
    var kong = kongZhis(R.timeGZ);
    var monthWx = ZHI_WX[R.monthGZ[1]];
    return {
      zfG: R.zhiFuGong,
      dayG: dayG,
      shiG: R.shiGanGong,
      kong: kong,            // 如 '辰巳'
      monthWx: monthWx,
      isYang: !!R.isYang,
      fuYin: !!R.fuYin, fanYin: !!R.fanYin,
      dayYi: dayYi, shiYi: shiYi,
      xunYi: R.xunYi,
      menpo: menpoGong(R),
    };
  }

  // 门迫：值使门落宫 门五行克宫五行
  function menpoGong(R) {
    var g = R.shiZhiGong;
    var m = R.menPan[g];
    if (!m || g===5) return false;
    return ke(MEN_WX[m], GONG_WX[g]);
  }

  // 某宫是否空亡（其地盘地支 ∈ 旬空）
  function gongKong(g, ctx) {
    if (!g) return false;
    var zs = GONG_ZHI[g] || [];
    for (var i=0;i<zs.length;i++) if (ctx.kong.indexOf(zs[i])>=0) return true;
    return false;
  }

  // 宫旺相/休囚
  function gongWang(g, ctx) {
    if (!g || g===5) return '平';
    var w = GONG_WX[g], mw = ctx.monthWx;
    if (w===mw) return '旺';
    if (sheng(mw,w)) return '相';
    if (sheng(w,mw)) return '休';
    if (ke(w,mw)) return '囚';
    if (ke(mw,w)) return '死';
    return '平';
  }
  function gongInner(g, ctx) { // 内宫?
    if (!g) return false;
    var inner = ctx.isYang ? [1,3,4,8] : [2,6,7,9];
    return inner.indexOf(g)>=0;
  }

  // ── 子句求值 ──
  function clauseBool(clause, R, ctx) {
    var c = clause.replace(/[，。；、]|^得|又|再|而$/g,'').trim();
    if (!c) return true;
    if (c==='伏吟') return ctx.fuYin;
    if (c==='反吟'||c==='返吟') return ctx.fanYin;
    if (c==='门迫') return ctx.menpo;
    if (c==='三奇入墓') {
      return !!sanqiRuMu(R).length;
    }
    // A空亡 / A入墓 / A旺相 / A休囚 / A在内 / A在外 / A乘X
    var m;
    if ((m=c.match(/^(.+?)空亡$/))) { var a=resolveSym(m[1],R,ctx); return gongKong(a.gong,ctx); }
    if ((m=c.match(/^(.+?)入墓$/))) { var b=resolveSym(m[1],R,ctx); return ganRuMu(b.gan, b.gong); }
    if ((m=c.match(/^(.+?)旺相$/))) { var c1=resolveSym(m[1],R,ctx); var w1=gongWang(c1.gong,ctx); return w1==='旺'||w1==='相'; }
    if ((m=c.match(/^(.+?)休囚$/))) { var c2=resolveSym(m[1],R,ctx); var w2=gongWang(c2.gong,ctx); return w2==='休'||w2==='囚'||w2==='死'; }
    if ((m=c.match(/^(.+?)在内(宫)?$/))) { var c3=resolveSym(m[1],R,ctx); return gongInner(c3.gong,ctx); }
    if ((m=c.match(/^(.+?)在外(宫)?$/))) { var c4=resolveSym(m[1],R,ctx); return c4.gong && !gongInner(c4.gong,ctx); }
    // A临B：类A落宫上乘 门/星/神/奇B
    var lm = c.match(/^(.+?)临(.+)$/);
    if (lm) {
      var lA = resolveSym(lm[1],R,ctx), braw = lm[2];
      if (!lA.gong) return false;
      if (MEN8.indexOf(braw)>=0) return R.menPan[lA.gong]===braw;
      if (STARS.indexOf(braw)>=0) return R.tianPan[lA.gong]===braw;
      if (SHEN8.indexOf(braw)>=0) return R.shenPan[lA.gong]===braw;
      var bg = qmapLocal(braw);
      if (bg) return R.tianYi[lA.gong]===bg;
      return false;
    }
    // A生B / A克B / AB比和
    var relm = c.match(/^(.+?)(生|克|比和|相生|相克)(.+)$/);
    if (relm) {
      var A=resolveSym(relm[1],R,ctx), B=resolveSym(relm[3],R,ctx);
      var r=gRel(A.gong,B.gong);
      var op=relm[2];
      if (op==='生'||op==='相生') {
        // "A生B" = A宫生B宫；若写成"B被A生"少见，这里按 A生B
        return r==='生';
      }
      if (op==='克'||op==='相克') return r==='克';
      if (op==='比和') return r==='比和';
    }
    // A与B比和
    var bm = c.match(/^(.+?)与(.+?)(比和|相生|相和)$/);
    if (bm) { var A2=resolveSym(bm[1],R,ctx), B2=resolveSym(bm[2],R,ctx); return gRel(A2.gong,B2.gong)==='比和'; }
    return false; // 未识别子句 → 不命中（不假装）
  }

  function condBool(cond, R, ctx) {
    var parts = cond.split(/[；;]|，且|，并|而且/);
    for (var i=0;i<parts.length;i++){
      if (!clauseBool(parts[i].trim(), R, ctx)) return false;
    }
    return true;
  }

  // 三奇入墓
  function sanqiRuMu(R) {
    var res=[];
    var b=findGong(R.tianYi,'乙'), c=findGong(R.tianYi,'丙'), d=findGong(R.tianYi,'丁');
    if (b===2) res.push('乙');
    if (c===6) res.push('丙');
    if (d===8) res.push('丁');
    return res;
  }
  function ganRuMu(gan, gong) {
    if (!gan||!gong) return false;
    var w=GAN_WX[gan];
    // 木墓未(坤2) 火墓戌(乾6) 金墓丑(艮8) 水土墓辰(巽4)
    var muGong = (w==='木')?2:(w==='火')?6:(w==='金')?8:4;
    return gong===muGong;
  }

  // ══ 四十格（39 条）机判 ══
  function checkSishiGe(R, ctx) {
    var res = [];
    var gan2Yi=function(g){return g==='甲'?'戊':g;};
    var gGong = findGong(R.diPan,'庚'); // 地盘庚宫
    function tgEqGong(gan){ return findGong(R.tianYi, gan); }
    // 逐宫扫描天盘干+地盘干组合
    function cell(tg, dg){ for(var g=1;g<=9;g++){ if(R.tianYi[g]===tg && R.diPan[g]===dg) return g;} return 0; }

    if (cell('戊','丙')) res.push('龙回首');
    if (cell('丙','戊')) res.push('鸟跌穴');
    // 遁
    for (var g=1;g<=9;g++){
      var men=R.menPan[g], tq=R.tianYi[g], sp=R.shenPan[g], dg=R.diPan[g];
      var sanMen = (men==='开门'||men==='休门'||men==='生门');
      if (sanMen && tq==='丙' && dg==='丁') res.push('天遁');
      if (men==='开门' && tq==='乙' && dg==='己') res.push('地遁');
      if (men==='休门' && tq==='丁' && sp==='太阴') res.push('人遁');
      if (sanMen && tq==='乙' && dg==='辛' && g===4) res.push('风遁');
      if (sanMen && tq==='乙' && dg==='辛') res.push('云遁');
      if (sanMen && g===1 && (tq==='壬'||tq==='癸')) res.push('龙遁');
      if (men==='开门' && g===7 && tq==='庚') res.push('虎遁');
      if (men==='开门' && g===6 && tq==='乙' && sp==='九天') res.push('神遁');
      if (men==='休门' && g===8 && tq==='辛' && dg==='丁') res.push('鬼遁');
    }
    if (cell('乙','辛')) res.push('龙逃走');
    if (cell('辛','乙')) res.push('虎猖狂');
    if (cell('癸','丁')) res.push('蛇妖矫');
    if (cell('丁','癸')) res.push('雀投江');
    // 三奇得使
    if (cell('乙','辛')||cell('乙','己')||cell('丙','戊')||cell('丙','庚')||cell('丁','壬')||cell('丁','癸')) res.push('三奇得使');
    // 玉女守门：值使门落宫天盘为丁
    if (R.tianYi[R.shiZhiGong]==='丁') res.push('玉女守门');
    if (cell('庚','癸')) res.push('大格');
    if (cell('庚','己')) res.push('刑格');
    if (cell('庚','壬')) res.push('小格');
    if (cell('庚','丙')) res.push('太白入荧');
    if (cell('丙','庚')) res.push('火入金乡');
    // 岁/月/日/时格
    var yG=gan2Yi(R.yearGZ[0]), mG=gan2Yi(R.monthGZ[0]);
    if (cell('庚', yG)) res.push('岁格');
    if (cell('庚', mG)) res.push('月格');
    if (cell('庚', ctx.dayYi)) res.push('日格');
    if (cell('庚', ctx.shiYi)) res.push('时格');
    // 伏宫/飞宫/伏干/飞干
    if (R.tianYi[R.zhiFuGong]==='庚') res.push('伏宫');
    if (gGong && R.tianYi[gGong]===R.xunYi) res.push('飞宫格');
    if (gGong && R.tianYi[gGong]===ctx.dayYi) res.push('飞干格');
    // 五不遇：时干克日干
    if (ke(GAN_WX[R.timeGZ[0]], GAN_WX[R.dayGZ[0]])) res.push('五不遇格');
    // 三奇入墓
    sanqiRuMu(R).forEach(function(q){ res.push('三奇入墓'); });
    // 六仪击刑
    var xingMap={戊:3,己:2,庚:8,辛:9,壬:4,癸:4};
    if (xingMap[R.xunYi]===R.zhiFuGong) res.push('六仪击刑');
    // 六仪受制（门迫）
    for (var g2=1;g2<=9;g2++){ var m2=R.menPan[g2]; if(m2&&g2!==5&&ke(MEN_WX[m2],GONG_WX[g2])){ res.push('六仪受制'); break; } }
    // 天网/地罗
    if (R.xunYi==='癸' && R.zhiFuGong===R.shiGanGong) res.push('天网四张');
    if (R.xunYi==='壬' && R.zhiFuGong===R.shiGanGong) res.push('地罗遮蔽');
    if (ctx.fuYin) res.push('伏吟');
    if (ctx.fanYin) res.push('反吟');
    // 时墓：时干之墓
    var sm = (function(){ var w=GAN_WX[ctx.shiYi]; var mu=(w==='木')?2:(w==='火')?6:(w==='金')?8:4; return findGong(R.tianYi, ctx.shiYi)===mu; })();
    if (sm) res.push('时墓');
    // 去重
    var seen={}, out=[];
    res.forEach(function(n){ if(!seen[n]){seen[n]=1; out.push(n);} });
    return out;
  }

  // ── 对外：分类占某类命中 ──
  function qmGuJiCatHits(cat, R, shi) {
    var ctx = buildCtx(R);
    var hits = [];
    (cat.rules||[]).forEach(function(r){
      try { if (condBool(r.cond, R, ctx)) hits.push(r); } catch(e){}
    });
    return hits;
  }

  // ── 对外：某 layer 命中 ──
  function qmGuJiLayerHits(layer, R, shi) {
    var ctx = buildCtx(R);
    if (layer.key==='sishi_ge') {
      var present = checkSishiGe(R, ctx);
      var out=[];
      (layer.rules||[]).forEach(function(r){ if (present.indexOf(r.name)>=0) out.push(r); });
      return out;
    }
    var hits=[];
    (layer.rules||[]).forEach(function(r){
      try { if (condBool(r.cond, R, ctx)) hits.push(r); } catch(e){}
    });
    return hits;
  }

  // 导出（Node 测试 + 浏览器）
  if (typeof module!=='undefined' && module.exports) {
    module.exports = { qmGuJiCatHits: qmGuJiCatHits, qmGuJiLayerHits: qmGuJiLayerHits,
      _buildCtx: buildCtx, _checkSishiGe: checkSishiGe, _resolveSym: resolveSym, _gongRel: gRel };
  }
  if (typeof window!=='undefined') {
    window.qmGuJiCatHits = qmGuJiCatHits;
    window.qmGuJiLayerHits = qmGuJiLayerHits;
  }
})();
