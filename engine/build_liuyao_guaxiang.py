# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""生成六爻 liuyao_guaxiang.json：卜筮全书 64 卦卦象断（"X之卦" + "Y之象"）
源：卜筮全书.txt —— 每卦段有"XX宫：《卦名》"标题行，后续行含"X之卦，""Y之象。"。"""
import json, io, re
from zhconv import convert

SRC = io.open(r'D:\一个电脑软件\玄学分类法\12_六爻-纳甲筮法\卜筮全书.txt', encoding='utf-8').read().split('\n')

RE_GONG = re.compile(r'^(.{1,4}宫)：《([^^]+)》')
RE_GUA = re.compile(r'^(.{3,16}之卦)[，,]')
RE_XIANG = re.compile(r'^(.{2,14}之象)')

guaxiang = []   # {name, xiang, gua}
cur_gua = None
cur_x = None
for i, raw in enumerate(SRC):
    s = raw.strip()
    if not s:
        continue
    m = RE_GONG.match(s)
    if m:
        cur_gua = m.group(2)
        continue
    g = RE_GUA.match(s)
    if g:
        cur_x = re.sub(r'[（(]\d+[）)]', '', g.group(1))
        continue
    x = RE_XIANG.match(s)
    if x and cur_x and cur_gua:
        guaxiang.append({'name': cur_gua, 'xiang': cur_x, 'duan': x.group(1), 'line': i + 1})
        cur_x = None

# 去重（乾出现两次，保留首次）
seen = {}
for gx in guaxiang:
    seen.setdefault(gx['name'], gx)
guaxiang = list(seen.values())

print('卦象断条数:', len(guaxiang))
print('卦名去重后:', len(seen), '| 缺失卦:', end=' ')
all64 = '乾为天 天风姤 天山遁 天地否 风地观 山地剥 火地晋 火天大有 坎为水 水泽节 水雷屯 水火既济 泽火革 雷火丰 地火明夷 地水师 艮为山 山火贲 山天大畜 山泽损 火泽睽 天泽履 风泽中孚 风山渐 震为雷 雷地豫 雷水解 雷风恒 地风升 水风井 泽风大过 泽雷随 巽为风 风天小畜 风火家人 风雷益 天雷无妄 火雷噬嗑 山雷颐 山风蛊 离为火 火山旅 火风鼎 火水未济 山水蒙 风水涣 天水讼 天火同人 坤为地 地雷复 地泽临 地天泰 雷天大壮 泽天夬 水天需 水地比 兑为泽 泽水困 泽地萃 泽山咸 水山蹇 地山谦 雷山小过 雷泽归妹'.split()
have = set(seen.keys())
missing = [g for g in all64 if g not in have]
print(missing if missing else '无')

D = {
    'format': 'liuyao_guaxiang',
    'note': '卜筮全书·六十四卦卦象断（如"六龙御天之卦，乾象"——每卦象名+象辞），机判：起卦后按本卦卦名显示',
    'guaxiang': guaxiang,
}
out = r'D:\一个电脑软件\术数引擎子件\engine\data\liuyao_guaxiang.json'
json.dump(D, io.open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('written', out)
