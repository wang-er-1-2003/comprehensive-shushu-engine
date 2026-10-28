# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""生成六爻 liuyao_zengshan.json：增删卜易四卷按章原文备查
源：增删卜易.txt。卷=「===== 第XXX章 =====」分界（62582=卷一 62583=卷二 337337=卷三 337338=卷四）；
卷内章标题=「X章第N」（如"月破章第二十七"），卷首的卷名行/作者行不入章。"""
import json, io, re
from zhconv import convert

SRC = io.open(r'D:\一个电脑软件\玄学分类法\12_六爻-纳甲筮法\增删卜易.txt', encoding='utf-8').read().split('\n')

RE_VOL = re.compile(r'^===== 第(\d+)章 =====$')
RE_CH = re.compile(r'^(.{1,24}章第[一二三四五六七八九十百又]+)$')

VOL_NAME = {'62582': '卷之一', '62583': '卷之二', '337337': '卷之三', '337338': '卷之四'}

vols = []
cur_vol = None
cur_ch = None
for raw in SRC:
    s = raw.strip()
    if not s:
        continue
    vm = RE_VOL.match(s)
    if vm:
        if cur_vol and cur_vol['chapters']:
            vols.append(cur_vol)
        cur_vol = {'vol': VOL_NAME.get(vm.group(1), '卷' + vm.group(1)), 'chapters': []}
        cur_ch = None
        continue
    if cur_vol is None:
        continue
    cm = RE_CH.match(s)
    if cm and len(cm.group(1)) <= 24:
        cur_ch = {'name': convert(cm.group(1), 'zh-cn'), 'lines': []}
        cur_vol['chapters'].append(cur_ch)
        continue
    if cur_ch is not None:
        cur_ch['lines'].append(convert(s, 'zh-cn'))
    else:
        # 卷首说明（作者行/目录行等）→ 卷前导
        cur_vol.setdefault('head', []).append(convert(s, 'zh-cn'))
if cur_vol and cur_vol['chapters']:
    vols.append(cur_vol)

print('卷数:', len(vols), '| 卷名:', [v['vol'] for v in vols])
print('各卷章数:', {v['vol']: len(v['chapters']) for v in vols})
print('章名样例(卷二):', [c['name'] for c in vols[1]['chapters']][:12] if len(vols) > 1 else '')

D = {
    'format': 'liuyao_zengshan',
    'note': '增删卜易四卷按章原文备查（月破/飞伏/旬空/六冲/反吟伏吟…章论 + 卷三四各门类占与占验案例）。章论规则与引擎既有判定器对应；案例为野鹤断验原文，备查不硬凑机判。',
    'volumes': vols,
}
out = r'D:\一个电脑软件\术数引擎子件\engine\data\liuyao_zengshan.json'
json.dump(D, io.open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('written', out)
