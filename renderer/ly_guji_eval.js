// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
/* 六爻古籍备查层 · 共享机判求值器（断易通玄赋 / 易隐 / 黄金策 共用入口）
 * 自包含：本文件只引用参数传入的 ctx 与两个外部求值函数 lyFenMatch / lyCatCondEval，
 * 不引用 app.js 内部任何变量（D / DWX / 卦象缓存等）。
 * lyFenMatch(cond, ctx) 与 lyCatCondEval(cond, ctx) 由 app.js 提供（集成方将本文件并入 app.js）；
 * node 侧冒烟测试时由测试脚本自行注入等价实现。
 *
 * 输入 cat 结构（engine/data/liuyao_*_cat.json）：
 *   { name, rules:[{cond,duan,src}], huobu:[{title,steps}] }
 * 输入 ctx：一次起卦后的上下文（形状与 app.js lyFenMatch 入参一致），由调用方传入。
 * 输出：{ catName, hits:[{cond,duan,src}], huobu }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.lyGuJiEval = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  /* 取外部求值函数。运行时优先用全局 lyFenMatch/lyCatCondEval（app.js 作用域）；
   * node 测试时由注入的 __lyGuJiBind 提供。找不到时返回 false（不抛错，未命中不假装）。 */
  function matchCond(cond, ctx) {
    var fm = (typeof lyFenMatch === 'function') ? lyFenMatch :
             (typeof globalThis !== 'undefined' && typeof globalThis.__lyFenMatch === 'function' ? globalThis.__lyFenMatch : null);
    var ce = (typeof lyCatCondEval === 'function') ? lyCatCondEval :
             (typeof globalThis !== 'undefined' && typeof globalThis.__lyCatCondEval === 'function' ? globalThis.__lyCatCondEval : null);
    if (!fm || !ce) return false;
    try {
      if (fm(cond, ctx)) return true;
      if (ce(cond, ctx)) return true;
    } catch (e) {
      return false; // 单条求值异常不影响其余规则
    }
    return false;
  }

  /* 单个类：遍历 rules，命中即收集；huobu 原样返回（红色加粗展示）。 */
  function lyGuJiCatHits(cat, ctx) {
    if (!cat) return { catName: '', hits: [], huobu: [] };
    var hits = [];
    var rules = cat.rules || [];
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (matchCond(r.cond, ctx)) {
        hits.push({ cond: r.cond, duan: r.duan, src: r.src });
      }
    }
    return { catName: cat.name || '', hits: hits, huobu: cat.huobu || [] };
  }

  /* 全部类：返回每类命中结果。 */
  function lyGuJiAllHits(cats, ctx) {
    var out = [];
    if (!cats) return out;
    for (var i = 0; i < cats.length; i++) {
      out.push(lyGuJiCatHits(cats[i], ctx));
    }
    return out;
  }

  return {
    lyGuJiCatHits: lyGuJiCatHits,
    lyGuJiAllHits: lyGuJiAllHits,
    __matchCond: matchCond
  };
}));
