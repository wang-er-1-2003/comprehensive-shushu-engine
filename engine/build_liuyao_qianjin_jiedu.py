# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""生成六爻 liuyao_qianjin_jiedu.json：黄金策.txt 总断千金赋 68 条逐条【解读】（备查层）
源：黄金策.txt —— 首段为总纲骈文（无标记），其后逐条 【原文】…【解读】…。"""
import json, io, re
from zhconv import convert

SRC = io.open(r'D:\一个电脑软件\玄学分类法\12_六爻-纳甲筮法\黄金策.txt', encoding='utf-8').read().split('\n')

items = []
cur = None
for raw in SRC:
    s = raw.strip()
    if not s:
        continue
    if s.startswith('【原文】'):
        if cur:
            items.append(cur)
        cur = {'yuanwen': s[len('【原文】'):].strip(), 'jiedu': ''}
        continue
    if s.startswith('【解读】'):
        if cur is not None:
            cur['jiedu'] = s[len('【解读】'):].strip()
        continue
    if cur is not None:
        if not cur['jiedu']:
            cur['yuanwen'] += s
        else:
            cur['jiedu'] += s
if cur:
    items.append(cur)

print('解读条数:', len(items))
print('首条:', items[0]['yuanwen'][:20], '| 第68条:', items[67]['yuanwen'][:20], '| 末条:', items[-1]['yuanwen'][:20])

D = {
    'format': 'liuyao_qianjin_jiedu',
    'note': '黄金策.txt：总断千金赋 68 条 + 分类占 1046 条，每条【原文】+【解读】配对（解读层备查）',
    'qianjin': items[0:68],
    'fenlei': items[68:],
}
out = r'D:\一个电脑软件\术数引擎子件\engine\data\liuyao_qianjin_jiedu.json'
json.dump(D, io.open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('written', out, '| qianjin:', len(items[0:68]), 'fenlei:', len(items[68:]))
