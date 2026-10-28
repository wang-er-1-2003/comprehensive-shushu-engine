// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 wang-er-1-2003
// 术数引擎子件 - 主进程（Electron）：本地数据读取 + 窗口
'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function loadJson(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'engine', 'data', name), 'utf-8'));
  } catch (e) {
    console.error(name + ' load failed:', e.message);
    return null;
  }
}

// 数据层：术数引擎
const LINGQI = loadJson('lingqi_125.json');   // 灵棋经 125 卦（象/颜/何/陈/刘/诗 + 此课）
const ZHuge = loadJson('zhuge_384.json');     // 诸葛神数 384 签（签诗/解签）
const NUM81 = loadJson('num81.json');         // 五格剖象 81 数理（速查+详细+分类）
const ZHOUYI = loadJson('zhouyi.json');       // 周易注 64 卦（卦辞/爻辞/注/彖象文言）
const STROKES = loadJson('hanzi_strokes.json'); // 汉字笔画数（makemeahanzi 提取）
const HEXMAP = loadJson('hexagram_map.json'); // 六十四卦 上卦+下卦 → 卦名
const JINKIANKE = loadJson('jinqianke.json'); // 六十四卦金钱课（文王金钱课，64 卦，八宫序）
const KONGMING = loadJson('kongming.json');   // 孔明神卦（三十二课金钱卦，5 枚硬币）
const XIAOLIUREN = loadJson('xiaoliuren.json'); // 小六壬（六宫断语库，马前课）
const JQK3 = loadJson('jinqianke3.json');     // 金钱卦三枚版规则（一背单/两背折/三背重/三字交）
const TAIXUAN = loadJson('taixuan.json');     // 太玄经 81 首（首辞/9赞/9测/阴阳/五行/天元）
const TWOGAN = loadJson('twogan.json');       // 鬼谷分定经（两头钳 100 组：判断/命格/基业/兄弟/行藏/婚姻/子息/收成）
const YILIN = loadJson('yilin.json');         // 焦氏易林 4096 条（本卦->之卦 卦辞，64×64）
const JINGFANG = loadJson('jingfang.json');   // 京氏易传 64 卦（八宫/世应/飞伏/纳甲/积算/五星/宿位/断法）
const MEIHUA = loadJson('meihua.json');       // 梅花易数（先天数/五行/卦气/体用总诀/生体克体断语/十八占/类象）
const TAIYI = loadJson('taiyi.json');         // 太乙神数（立成表144局/秘书判语144局/十六神/九宫分野/算和/陈兵/格局/进阶体系）
const ZIWEI = loadJson('ziwei.json');         // 紫微斗数·十四主星（紫微斗数全书：安星诀/诸星问答/格局/富贵十等/入男命女命限诀/十二宫断语）
const FEIXING = loadJson('feixing.json');     // 紫微斗数·十八飞星（术天机照胆经：时刻度数/十八星安法/十二宫断/洞微断/入骨仙经/星行限吉凶）
// 解梦引擎（周公解梦 988 条 / 现代解梦库 9467 条 / 古今图书集成·梦部）
const D988 = loadJson('dream_988.json');          // 988 条梦象断语（维基文库，CC BY-SA 4.0）
const MODERN_IDX = loadJson('dream_modern_idx.json'); // 现代库索引 9467 条（title/分类/摘要）
const MODERN_MSG = loadJson('dream_modern_msg.json'); // 现代库正文（按 id 取，IPC 按需，不随初始数据传）
const GUJI = loadJson('dream_guji.json');         // 古今图书集成·梦部 139 节（汇考/总论/艺文/纪事）
const MAP = loadJson('dream_map.json');           // 谐音/比象/反梦映射表（传统圆梦三法，条目带依据）
const PINYIN = loadJson('dream_pinyin.json');     // 988+现代库 标题拼音索引（供拼音检索）
const SPREAD = loadJson('dream_spread.json');     // 检索扩散：同义词组/结果反查/古籍象征
// 测字引擎（字库直查 2786 / 秘牒十法六法取格杂占 / 拆字部汇考 / 认字测 81 / 字触六卷 / MMH 拆字部件库）
const CEZI = loadJson('cezi_dict.json');          // 字库直查表 2786 条 + 60 干支 + 噪声
const MIDIE = loadJson('cezhi_midie.json');       // 测字秘牒：16 法节 + 取格 1224 + 杂占 53
const DISPATCH = loadJson('rules_dispatch.json'); // 拆字部汇考 13 节歌诀
const RENZI = loadJson('rules_renzi.json');       // 认字测 81 字清单 + 段落
const ZICHU = loadJson('rules_zichu.json');       // 字触 六卷实例
const DECOMP = loadJson('decomp.json');           // 拆字部件库（Make Me a Hanzi，GPL-3.0）字→IDS
const REVDECOMP = loadJson('rev_decomp.json');    // 部件→含该部件的字（反向索引）
// 塔罗引擎（韦特体系：三源对照牌义 + Case/Papus/De Laurence 规则层）
const TAROT_CARDS = loadJson('tarot_cards_unified.json');   // 78 卡三源对照（tarotoo + love-tarot + Waite 原典）
const TAROT_RULES = loadJson('rules_core.json');            // Case 规则层（希伯来对应/数字学/占卜章）
const TAROT_PAPUS = loadJson('rules_papus.json');           // Papus《Tarot of the Bohemians》规则
const TAROT_DE = loadJson('de_laurence.json');              // De Laurence《Illustrated Key》第二原典
// 大六壬（四课三传体系：720 局主断 + 起课基础表 + 课经课体 + 毕法 100 条 + 翠雨歌类占）
const LNR_720 = loadJson('liunren_720ju.json');     // 御定直指 720 局主断（60 日 × 12 局）
const LNR_CORE = loadJson('liunren_core.json');     // 起课基础表（寄宫/月将/贵人/天将/神煞/刑冲破害）
const LNR_KESHI = loadJson('liunren_keshi.json');   // 课经 64 课体（名称/定义/象曰）
const LNR_BIFA = loadJson('liunren_bifa.json');     // 毕法赋 100 条（目录全量 + 正文展开）
const LNR_CUIYU = loadJson('liunren_cuiyu.json');   // 六壬翠雨歌 33 类占口诀
const LNR_ZHINAN = loadJson('liunren_zhinan144.json'); // 大六壬指南·十二天将临十二位判辞（128 条速查）
const LNR_GUANLU = loadJson('liunren_guanlu.json'); // 大六壬管辂神书（论身命/空亡等章）
const LNR_BINGZHAN = loadJson('liunren_bingzhan.json'); // 六壬大全卷五兵占（五十篇）
// 金口诀（四位体系：起课表 + 六十甲子钤 + 分类断语）
const JKC_CORE = loadJson('jinkoujue_core.json');   // 金口诀起课表（干五行/支五行/将神/贵神/贵神起例/五子元遁/四象/五动三动五合三合）
const JKC_DUANYU = loadJson('jinkoujue_duanyu.json'); // 金口诀断语（六十甲子钤 60 + 分类断语 21 类 + 干神将方 16 条）
// 神易数兵占（讲武全书兵占卷之十六；shenyishu/kentang2017/MIT 现代整理层）
const SHENYISHU = loadJson('shenyishu.json');   // 甲子码表 60 + 卦映射 + 神煞表 9 + 评分规则 11
// ===== MIT 8 包入库：A 类全新体系数据（预注册；文件由各 shard 生成，未生成前 loadJson 返回 null 无害）=====
const KINWUZHAO = loadJson('kinwuzhao.json');       // 堅五兆·折竹弹占（敦煌复原，kinwuzhao/kentang2017/MIT）
const WUZHAO_EXT = loadJson('wuzhao_ext.json');     // 五兆古法层：敦煌 P.2859《五兆要诀略》断辞库+算法层+类占九门（horosa astropy/websrv 参考层，繁体转简体）
const TAIXUANSHIFA = loadJson('taixuanshifa.json'); // 太玄筮法·太玄经 81 首（taixuanshifa/kentang2017/MIT；与引擎 taixuan.json 太玄数·纳音体系不同，勿混）
const JINGJUE = loadJson('jingjue.json');
// [MIT-C-HOOK] kinqimen 暗干表（angan.py 360 条，刻家奇门专用）
const QIMEN_ANGAN = loadJson('qimen_angan.json');           // 坚奇门刻家暗干表（angan.py，kinqimen/kentang2017/MIT）
// [MIT-A-HOOK] kinjinkou/kinwuzhao shard：如需新增缺口数据文件，在此行下补 const
const JKC_EXTRA = loadJson('jinkoujue_extra.json'); // 金口诀补缺口：六十甲子纳音60+四大空亡+旺相休囚死+用神规则（kinjinkou/kentang2017/MIT）
// [MIT-C-HOOK] jingjue/kinqimen shard：如需新增缺口数据文件，在此行下补 const
// [MIT-D-HOOK] kintaiyi/kinwangji shard：如需新增缺口数据文件，在此行下补 const
const KINWANGJI = loadJson('kinwangji.json');       // 堅皇極經世：60卦周期+64卦码+卦爻详解+观物外篇衍义9卷+心易发微5卷（kinwangji/kentang2017/MIT）
const TAIYI_MING = loadJson('taiyi_ming.json');     // 堅太乙补强：四法积年锚点+72局落宫+60纳音五行+人道命法参数（kintaiyi/kentang2017/MIT）
// 六爻-纳甲（自建装卦全表 + 断语库）
const LIUYAO_CORE = loadJson('liuyao_core.json');     // 64 卦装卦全表（八宫纳甲算法生成）+ 六神/旬空/月破/禄马/贵人/合冲破穿刑/长生
const LIUYAO_DUANYU = loadJson('liuyao_duanyu.json'); // 断语库（口诀17类 + 千金赋68条 + 分类占8类）+ 取用神表 40 条
// 奇门遁甲（时家奇门：起局表 + 十干克应 81 + 九星 108 + 三奇 24 + 分类占 108）
const QIMEN = loadJson('qimen.json');
// 子平八字（金不换骨髓歌 119 + 干支体象 + 何知章 + 命理约言赋 20 + 断语 12 类 + 神煞 15 + 八格喜忌 + 活步骤 5）
const BAZI = loadJson('bazi.json');
const TAROT_CASE_CH = {};                                   // Case 原章节（按 key 存，全文按需 IPC）
try {
  const CASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'engine', 'data', 'case_major_chapters.json'), 'utf-8'));
  for (const ch of CASE.chapters || []) TAROT_CASE_CH[ch.key] = ch;
} catch (e) { console.error('case chapters load failed:', e.message); }

// IPC 载荷裁剪：不把全文大字段推给渲染层（避免 IPC 过大），只给结构化部分与节选
function slim(data, keepFull, leadLen) {
  if (!data) return null;
  const out = { ...data };
  for (const k of ['full_text', 'body_text']) {
    if (typeof out[k] === 'string' && !keepFull) {
      out[k + '_lead'] = out[k].slice(0, leadLen || 400);
      delete out[k];
    }
  }
  return out;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1420, height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile('index.html');
  // 渲染进程崩溃 / 加载失败 → 自动重载（防白屏，崩溃后自愈）
  win.webContents.on('render-process-gone', () => { win.webContents.reload(); });
  win.webContents.on('did-fail-load', (e, code, desc) => { if (code !== -3) setTimeout(() => win.webContents.reload(), 500); });
}

ipcMain.handle('qianzhan-data', () => {
  return {
    ok: true,
    lingqi: LINGQI,
    zhuge: ZHuge,
    num81: NUM81,
    zhouyi: ZHOUYI,
    strokes: STROKES,
    hexmap: HEXMAP,
    jinqianke: JINKIANKE,
    kongming: KONGMING,
    xiaoliuren: XIAOLIUREN,
    jinqianke3: JQK3,
    taixuan: TAIXUAN,
    twogan: TWOGAN,
    yilin: YILIN,
    jingfang: JINGFANG,
    meihua: MEIHUA,
    taiyi: TAIYI,
    ziwei: Object.assign({}, ZIWEI, { guji_cat: loadJson('ziwei_guji_cat.json'), brightness: loadJson('ziwei_brightness.json'), patterns: loadJson('ziwei_patterns.json'), nihai: loadJson('ziwei_nihai.json'), cities: loadJson('china_cities_flat.json') }),   // 紫微斗数全书 + 古籍机判层（54 规则 + 14 活步骤） + 十四主星亮度表（古籍双源） + 格局机判库（46 格三层） + 倪师天纪原话（1848 条现代注释层） + 中国城市经纬度表（kinastro/MIT 现代整理层，34省372市2887县）
    feixing: Object.assign({}, FEIXING, { guji_cat: loadJson('feixing_guji_cat.json') }), // 十八飞星 + 古籍机判层（79 规则 + 6 活步骤）
    dream: { d988: D988, modern: MODERN_IDX, guji: GUJI, map: MAP, pinyin: PINYIN, spread: SPREAD },
    cezi: {
      dict: slim(CEZI, false, 300),          // 字库直查表（entries / gan_zhi_60 / noise / meta）
      midie: slim(MIDIE, false, 300),        // 测字秘牒（methods / quge_items / zazhan）
      dispatch: slim(DISPATCH, true, 400),   // 汇考（sections 全文保留，供规则库浏览）
      renzi: slim(RENZI, false, 300),        // 认字测（catalog / items）
      zichu: slim(ZICHU, true, 400),         // 字触（sections 全文保留）
      decomp: DECOMP,                        // 拆字部件库（195KB，直接全量）
      rev_decomp: REVDECOMP,                 // 部件反向入字索引（668KB）
    },
    tarot: {
      cards: TAROT_CARDS,                    // 78 卡三源对照
      rules: TAROT_RULES,                    // Case 规则层（希伯来对应/数字学/占卜章）
      rules_papus: TAROT_PAPUS,              // Papus 规则
      case_leads: (() => {                   // Case 原章节节选（lead 320 字），全文按需
        const leads = {};
        for (const k of Object.keys(TAROT_CASE_CH)) {
          const ch = TAROT_CASE_CH[k];
          leads[k] = { title: ch.title, letter: ch.letter, char_count: ch.char_count, lead: ch.text.slice(0, 320) };
        }
        return leads;
      })(),
      de_laurence: TAROT_DE,                 // De Laurence 第二原典
    },
    liunren: {
      ju720: LNR_720,                        // 720 局主断（day+no 或 day+ganshang 定位）
      core: LNR_CORE,                        // 起课基础表
      keshi: LNR_KESHI,                      // 课经课体
      bifa: LNR_BIFA,                        // 毕法 100 条
      cuiyu: LNR_CUIYU,                      // 翠雨歌类占
      zhinan: LNR_ZHINAN,                    // 指南·天将临位判辞
      guanlu: LNR_GUANLU,                    // 管辂神书章节
      bingzhan: LNR_BINGZHAN,                // 兵占五十篇（卷五全 50 篇，含遣使入敌）
      shensha: loadJson('liunren_shensha.json'),   // 六壬大全·神煞：十干神煞机判 + 岁/支/月原文备查
      shendingjing: loadJson('liunren_shendingjing.json'), // 景祐六壬神定经 38 节义理原文备查
      bingzhan_cat: loadJson('liunren_bingzhan_cat.json'), // 兵占五十篇机判层：83 规则 + 52 活步骤
      shendingjing_cat: loadJson('liunren_shendingjing_cat.json'), // 神定经 38 节：活步骤 + 释德机判
      shensha_cat: loadJson('liunren_shensha_cat.json'), // 神煞机判层：逐月表 + 岁/支表 + 公式煞活步骤
    },
    jinkoujue: {
      core: JKC_CORE,                        // 四位起课表
      duanyu: JKC_DUANYU,                    // 六十甲子钤 + 分类断语
    },
    shenyishu: SHENYISHU,                    // 神易数兵占（讲武全书兵占卷之十六，kentang2017/MIT 现代整理层）
    kinwuzhao: KINWUZHAO,                    // 堅五兆·折竹弹占（kinwuzhao/kentang2017/MIT）
    wuzhao_ext: WUZHAO_EXT,                  // 五兆古法层（P.2859 断辞库+算法+类占九门，horosa astropy 参考层）
    taixuanshifa: TAIXUANSHIFA,              // 太玄筮法·太玄经 81 首（taixuanshifa/kentang2017/MIT，与 taixuan.json 同名不同体系）
    jingjue: JINGJUE,                        // 荊诀·北大竹简十六卦（jingjue/kentang2017/MIT）
    // [MIT-A-HOOK] kinjinkou/kinwuzhao shard：缺口数据 payload 在此行下注册
    jinkoujue_extra: JKC_EXTRA,              // 金口诀补缺口：纳音60+四大空亡+旺衰/用神规则（kinjinkou/kentang2017/MIT）
    // [MIT-C-HOOK] jingjue/kinqimen shard：缺口数据 payload 在此行下注册
    // [MIT-D-HOOK] kintaiyi/kinwangji shard：缺口数据 payload 在此行下注册
    kinwangji: KINWANGJI,                   // 堅皇極經世起数/心易 + 补遗典籍
    taiyi_ming: TAIYI_MING,                 // 堅太乙四法积年对照 + 人道命法
    liuyao: {
      core: LIUYAO_CORE,                     // 64 卦装卦全表 + 基础表
      duanyu: LIUYAO_DUANYU,                 // 断语库 + 取用神表
      tianji: loadJson('liuyao_tianji.json'),   // 断易天机：六十四卦吉凶歌 + 无鬼无气 + 三格局断
      huangjin: loadJson('liuyao_huangjin.json'), // 卜筮正宗·黄金策直解 33 类分类占原文备查
      huangjin_cat: loadJson('liuyao_huangjin_cat.json'), // 黄金策直解 33 类：机判规则 305 条 + 活步骤 33 组
      tongxuan: loadJson('liuyao_tongxuan.json'), // 卜筮全书·断易通玄赋：口诀 26 章（机判）+ 分类占 42 类（备查）
      guaxiang: loadJson('liuyao_guaxiang.json'), // 卜筮全书·六十四卦卦象断（机判）
      qianjin_jiedu: loadJson('liuyao_qianjin_jiedu.json'), // 黄金策.txt：千金赋 68 条 + 分类占 1046 条逐句解读（备查）
      yiyin: loadJson('liuyao_yiyin.json'),     // 易隐 40 类分类占原文（备查）
      zengshan: loadJson('liuyao_zengshan.json'), // 增删卜易 4 卷 120 章原文（备查）
      tongxuan_cat: loadJson('liuyao_tongxuan_cat.json'), // 断易通玄赋分类占机判层：356 规则 + 43 活步骤
      yiyin_cat: loadJson('liuyao_yiyin_cat.json'), // 易隐机判层：205 规则 + 40 活步骤
      zengshan_cat: loadJson('liuyao_zengshan_cat.json'), // 增删卜易机判层：39 规则 + 120 章活步骤
      qj_jiedu_cat: loadJson('liuyao_qj_jiedu_cat.json'), // 黄金策解读分类占机判层：59 规则 + 4 组活步骤
    },
    qimen: Object.assign({}, QIMEN, { guji_cat: loadJson('qimen_guji_cat.json'), angan: QIMEN_ANGAN }),  // 奇门遁甲 + 古籍断语层机判化（108 类 + 8 层）+ 坚奇门刻家暗干表
    bazi: Object.assign({}, BAZI, { minjian_extras: loadJson('minjian_shensha_extras.json'), liki: loadJson('liki_bazi_rules.json') }),  // 子平八字（排盘引擎 + 断语库 + 活步骤 + 民间神煞补含义 + liki现代整理层断语真值表）
    tieban: { tiaowen: loadJson('tieban_tiaowen.json'), verses: loadJson('tieban_verses.json'), suanpan: loadJson('tieban_suanpan.json'), liang: loadJson('tieban_liang.json'), mappings: loadJson('tieban_mappings.json') }, // 铁板神数（kinastro/MIT 现代整理层：条文12000 + 歌诀6208 + 算盘 + 两数表）
    shaozi: loadJson('shaozi_tiaowen.json'),  // 邵子神数（kinastro/MIT 现代整理层：条文4608 + 卦）
    beiji: loadJson('beiji_tiaowen.json'),    // 北极神数（kinastro/MIT 现代整理层：条文2341）
    nanji: loadJson('nanji_tiaowen.json'),    // 南极神数（kinastro/MIT 现代整理层：条文246）
    huangji: loadJson('huangji_jingshi_shu.json'), // 皇极经世书十四卷全文（kinastro/MIT，繁体转简体，190节）
  };
});

// 塔罗 Case 原章节全文按需取
ipcMain.handle('qianzhan-tarot-case', (ev, key) => {
  const ch = TAROT_CASE_CH[key];
  if (!ch) return { ok: false, reason: 'no chapter for key ' + key };
  return { ok: true, key: ch.key, title: ch.title, letter: ch.letter, char_count: ch.char_count, text: ch.text };
});

// 现代库正文按需取（IPC 只传单条，避免初始 14.5MB 传输）
ipcMain.handle('qianzhan-dream-msg', (ev, id) => {
  const m = MODERN_MSG && MODERN_MSG[String(id)];
  return { ok: m != null, id: id, msg: m || '' };
});

// 导出：写 engine/exports 目录（渲染层无 node 权限，走 IPC）
ipcMain.handle('qianzhan-export', (ev, payload, filename) => {
  const dir = path.join(__dirname, 'exports');
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) { /* ignore */ }
  const safe = String(filename || 'export.txt').replace(/[\\/:*?"<>|]/g, '_');
  const p = path.join(dir, safe);
  fs.writeFileSync(p, payload, 'utf-8');
  return { ok: true, path: p };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
