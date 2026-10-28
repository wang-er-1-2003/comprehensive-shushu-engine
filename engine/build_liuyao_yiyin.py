# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""生成六爻 liuyao_yiyin.json：易隐 42 类分类占原文（备查）
源：易隐.txt 1513 行起。类标题行=「X占」（1-12 字）；类内小节=短独立标题行（≤14 字）。"""
import json, io, re
from zhconv import convert

SRC = io.open(r'D:\一个电脑软件\玄学分类法\12_六爻-纳甲筮法\易隐.txt', encoding='utf-8').read().split('\n')

RE_LEI = re.compile(r'^([\u4e00-\u9fff·()（）、]{2,12}占)$')
RE_SEC = re.compile(r'^([\u4e00-\u9fffA-Za-z（）()·]{2,14})$')

cats = []
cur = None
sec = None
for raw in SRC[1512:]:
    s = raw.strip()
    if not s:
        continue
    m = RE_LEI.match(s)
    if m:
        if cur:
            cats.append(cur)
        cur = {'name': convert(m.group(1), 'zh-cn'), 'sections': []}
        sec = None
        continue
    if cur is None:
        continue
    sm = RE_SEC.match(s)
    if sm and len(s) <= 14:
        sec = {'name': convert(sm.group(1), 'zh-cn'), 'lines': []}
        cur['sections'].append(sec)
        continue
    if sec is not None:
        sec['lines'].append(convert(s, 'zh-cn'))
    else:
        # 无小节标题的行直接入类首条
        cur['sections'].append({'name': '', 'lines': [convert(s, 'zh-cn')]})
        sec = cur['sections'][-1]
if cur:
    cats.append(cur)

print('类数:', len(cats))
print('类名:', [c['name'] for c in cats])
print('总小节数:', sum(len(c['sections']) for c in cats))

D = {
    'format': 'liuyao_yiyin',
    'note': '易隐八卷分类占原文（身命/僧道/家宅/迁移/树艺/育蚕/六畜/奴婢/脱祸/征战/坟塋/晴雨/朝廷/年时/婚姻/胎产/痘疹/求嗣/延师/觅馆/投师/科举/官禄/文书/谒贵/行人/出行/舟行/谋望/求财/贸易/开店/寄物/疾病/讼狱/逃亡/遗失/盗贼 等）——韵文泛断，原文备查默认折叠',
    'categories': cats,
}
out = r'D:\一个电脑软件\术数引擎子件\engine\data\liuyao_yiyin.json'
json.dump(D, io.open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('written', out)
