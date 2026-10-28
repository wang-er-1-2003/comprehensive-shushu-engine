# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""生成六爻 liuyao_core.json：64 卦装卦全表（纳甲/世应/六亲）+ 六神/旬空/月破/禄马/贵人/合冲破穿刑/长生"""
import json, io

HEX = json.load(io.open(r'D:\一个电脑软件\术数引擎子件\engine\data\hexagram_map.json', encoding='utf-8'))['map']
# hexmap key = 上卦三爻(四五六, 自下而上) + 下卦三爻(一二三, 自下而上)；六爻自下而上 = key[3:6] + key[0:3]
GUA_LINES = {}
for k, v in HEX.items():
    name = v['name'].replace('遯', '遁')
    lines = k[3:6] + k[0:3]  # 6 chars, 自下而上, 1=阳
    GUA_LINES[name] = lines

# 京房八宫：宫首卦 + 世位(六爻序号, 初=1)
GONG_HEAD_GUA = {'乾': '乾为天', '坎': '坎为水', '艮': '艮为山', '震': '震为雷', '巽': '巽为风', '离': '离为火', '坤': '坤为地', '兑': '兑为泽'}
GONG_WX = {'乾': '金', '坎': '水', '艮': '土', '震': '木', '巽': '木', '离': '火', '坤': '土', '兑': '金'}

def var(lines, idxs):
    l = list(lines)
    for i in idxs:
        l[i] = '0' if l[i] == '1' else '1'
    return ''.join(l)

def gong_series(head):
    """返回该宫 8 卦名列表：本宫/一世/二世/三世/四世/五世/游魂/归魂（按世位 6,1,2,3,4,5,4,3）"""
    base = GUA_LINES[head]
    names = [head]
    series = [base]
    # 一世：初变
    s1 = var(base, [0]); series.append(s1); names.append(name_of(s1))
    # 二世：一二变
    s2 = var(base, [0, 1]); series.append(s2); names.append(name_of(s2))
    # 三世：一二三变
    s3 = var(base, [0, 1, 2]); series.append(s3); names.append(name_of(s3))
    # 四世：一二三四变
    s4 = var(base, [0, 1, 2, 3]); series.append(s4); names.append(name_of(s4))
    # 五世：一二三四五变
    s5 = var(base, [0, 1, 2, 3, 4]); series.append(s5); names.append(name_of(s5))
    # 游魂：五世卦四爻再变
    sy = var(s5, [3]); series.append(sy); names.append(name_of(sy))
    # 归魂：游魂卦下三爻全变回
    sg = var(sy, [0, 1, 2]); series.append(sg); names.append(name_of(sg))
    return names

def name_of(lines):
    for k, v in HEX.items():
        if (k[3:6] + k[0:3]) == lines:
            return v['name'].replace('遯', '遁')
    return '?'

# 纳甲（每宫：内卦三爻自下而上干支 / 外卦三爻自下而上即四五六爻）
NAYIN = {
    '乾': (['甲子', '甲寅', '甲辰'], ['壬午', '壬申', '壬戌']),
    '坎': (['戊寅', '戊辰', '戊午'], ['戊申', '戊戌', '戊子']),
    '艮': (['丙辰', '丙午', '丙申'], ['丙戌', '丙子', '丙寅']),
    '震': (['庚子', '庚寅', '庚辰'], ['庚午', '庚申', '庚戌']),
    '巽': (['辛丑', '辛亥', '辛酉'], ['辛未', '辛巳', '辛卯']),
    '离': (['己卯', '己丑', '己亥'], ['己酉', '己未', '己巳']),
    '坤': (['乙未', '乙巳', '乙卯'], ['癸丑', '癸亥', '癸酉']),
    '兑': (['丁巳', '丁卯', '丁丑'], ['丁亥', '丁酉', '丁未']),
}
ZHI_WX = {'子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'}
GAN_WX = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'}

def qin_of(gong, zhi):
    """宫五行 vs 爻支五行 → 六亲"""
    g, z = GONG_WX[gong], ZHI_WX[zhi]
    if g == z: return '兄弟'
    if GONG_SHENG[g] == z: return '子孙'   # 我生者
    if GONG_SHENG[z] == g: return '父母'   # 生我者
    if KE[g] == z: return '妻财'           # 我克者
    return '官鬼'                          # 克我者

SHENG = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}
KE = {'木': '土', '土': '水', '水': '火', '火': '金', '金': '木'}
GONG_SHENG = SHENG
CHONG = {'子': '午', '午': '子', '丑': '未', '未': '丑', '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳'}
PO = {'子': '酉', '酉': '子', '丑': '辰', '辰': '丑', '寅': '亥', '亥': '寅', '卯': '午', '午': '卯', '未': '戌', '戌': '未', '巳': '申', '申': '巳'}
CHUAN = {'子': '卯', '卯': '子', '寅': '巳', '巳': '申', '申': '寅', '丑': '戌', '戌': '未', '未': '丑', '辰': '辰', '午': '午', '酉': '酉', '亥': '亥'}
HE6 = {'子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午'}

# 六十四卦装卦全表
GUA64 = {}
for gong in ['乾', '坎', '艮', '震', '巽', '离', '坤', '兑']:
    names = gong_series(GONG_HEAD_GUA[gong])
    # 世位按序列：本宫6, 一世1, 二世2, 三世3, 四世4, 五世5, 游魂4, 归魂3
    shis = [6, 1, 2, 3, 4, 5, 4, 3]
    for name, shi in zip(names, shis):
        # 应位：世1应4, 2应5, 3应6, 4应1, 5应2, 6应3
        ying = {1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3}[shi]
        lines = GUA_LINES[name]
        nayin = NAYIN[gong]
        gans = [n[0] for n in nayin[0] + nayin[1]]
        zhis = [n[1] for n in nayin[0] + nayin[1]]
        qins = [qin_of(gong, z) for z in zhis]
        wxs = [ZHI_WX[z] for z in zhis]
        GUA64[name] = {
            'gong': gong, 'gong_wx': GONG_WX[gong],
            'shi': shi, 'ying': ying,
            'lines': [{'gan': gans[i], 'zhi': zhis[i], 'wx': wxs[i], 'qin': qins[i]} for i in range(6)],
        }
# 校验：64 卦全部覆盖
assert len(GUA64) == 64, len(GUA64)

# 六神起例：日干 → 六神起点（甲乙青龙丙丁朱雀戊勾陈己螣蛇庚辛白虎壬癸玄武）
LIUSHOU = {'甲': '青龙', '乙': '青龙', '丙': '朱雀', '丁': '朱雀', '戊': '勾陈', '己': '螣蛇', '庚': '白虎', '辛': '白虎', '壬': '玄武', '癸': '玄武'}
LIUSHOU_ORDER = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']

# 六十甲子旬空（60 条）
GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
JIAZI = []
for i in range(60):
    JIAZI.append(GAN[i % 10] + ZHI[i % 12])
XUNKONG = {}
for i, gz in enumerate(JIAZI):
    zi = i % 12
    XUNKONG[gz] = ZHI[(zi + 10) % 12] + ZHI[(zi + 11) % 12]

# 月破：月建支的冲支
YUE_PO = {z: CHONG[z] for z in ZHI}

# 禄
LU = {'甲': '寅', '乙': '卯', '丙': '巳', '戊': '巳', '丁': '午', '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'}
# 马
MA = {'申': '寅', '子': '寅', '辰': '寅', '寅': '申', '午': '申', '戌': '申', '巳': '亥', '酉': '亥', '丑': '亥', '亥': '巳', '卯': '巳', '未': '巳'}
# 贵人：日干 → 二支（昼/夜）
GUI_REN = {'甲': ['丑', '未'], '戊': ['丑', '未'], '乙': ['子', '申'], '己': ['子', '申'],
           '丙': ['亥', '酉'], '丁': ['亥', '酉'], '壬': ['卯', '巳'], '癸': ['卯', '巳'], '辛': ['午', '寅']}
# 十二长生（五行 → 十二支顺行，自长生起）
CHANGSHENG = {
    '木': ['亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌'],
    '火': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '金': ['巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰'],
    '水': ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'],
    '土': ['申', '酉', '戌', '亥', '子', '丑', '寅', '卯', '辰', '巳', '午', '未'],
}
CHANGSHENG_NAMES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

# 三合局
SANHE = {'申子辰': '水', '亥卯未': '木', '寅午戌': '火', '巳酉丑': '金'}
# 六刑（卜筮正宗）：子刑卯卯刑子；寅刑巳巳刑申申刑寅；丑刑戌戌刑未未刑丑；辰午酉亥自刑
XING = {a: b for a, b in [('子', '卯'), ('卯', '子'), ('寅', '巳'), ('巳', '申'), ('申', '寅'), ('丑', '戌'), ('戌', '未'), ('未', '丑'), ('辰', '辰'), ('午', '午'), ('酉', '酉'), ('亥', '亥')]}
# 六害：子未/丑午/寅巳/卯辰/申亥/酉戌
HAI = {a: b for a, b in [('子', '未'), ('未', '子'), ('丑', '午'), ('午', '丑'), ('寅', '巳'), ('巳', '寅'), ('卯', '辰'), ('辰', '卯'), ('申', '亥'), ('亥', '申'), ('酉', '戌'), ('戌', '酉')]}

core = {
    'format': 'liuyao_core',
    'note': '六爻纳甲装卦基础：64卦装卦全表（纳甲干支/六亲/世应）+ 六神起例 + 旬空/月破 + 禄马贵人 + 合冲破穿刑 + 十二长生 + 三合局',
    'gua64': GUA64,
    'gong_wx': GONG_WX,
    'zhi_wx': ZHI_WX,
    'gan_wx': GAN_WX,
    'liushou': LIUSHOU,
    'liushou_order': LIUSHOU_ORDER,
    'xunkong': XUNKONG,
    'yue_po': YUE_PO,
    'lu': LU,
    'ma': MA,
    'gui_ren': GUI_REN,
    'chong': CHONG,
    'po': PO,
    'chuan': CHUAN,
    'he': HE6,
    'xing': XING,
    'hai': HAI,
    'sheng': SHENG,
    'ke': KE,
    'chang_sheng': CHANGSHENG,
    'chang_sheng_names': CHANGSHENG_NAMES,
    'sanhe': SANHE,
}
out = r'D:\一个电脑软件\术数引擎子件\engine\data\liuyao_core.json'
json.dump(core, io.open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(GUA64))
# 抽查：乾为天/天风姤/水雷屯/泽火革
for n in ['乾为天', '天风姤', '水雷屯', '火地晋', '火天大有', '地水师']:
    g = GUA64[n]
    print(n, g['gong'], '世' + str(g['shi']), '应' + str(g['ying']),
          ' '.join(l['qin'] for l in g['lines']))
