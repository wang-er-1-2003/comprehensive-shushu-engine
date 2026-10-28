# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""生成六爻 liuyao_tongxuan.json：卜筮全书·断易通玄赋区段（口诀 28 章 + 分类占两套）
源：卜筮全书.txt 2431-3959 行。口诀章可机判引用；分类占为韵文泛断 → 原文备查。"""
import json, io, re
from zhconv import convert

SRC = io.open(r'D:\一个电脑软件\玄学分类法\12_六爻-纳甲筮法\卜筮全书.txt', encoding='utf-8').read().split('\n')
lines = SRC[2430:3959]  # 0 基：2431-3959

RE_TITLE = re.compile(r'^[一二三四五六七八九十百]+、(.+?)[：:\s]*$')
RE_ITEM = re.compile(r'^（([一二三四五六七八九十]+)）$')

def strip_noise(s):
    return s.strip()

def t(s):
    return convert(s, 'zh-cn')

# 第一段：口诀章（断易通玄赋 到 神杀断例）
jue, cur = [], None
for raw in lines:
    s = raw.strip()
    if not s:
        continue
    m = RE_TITLE.match(s)
    if m and m.group(1).startswith('住居宅第章'):
        break
    if m:
        if cur:
            jue.append(cur)
        cur = {'name': t(m.group(1)), 'lines': []}
        continue
    if cur and not RE_ITEM.match(s):
        cur['lines'].append(t(strip_noise(s)))
if cur:
    jue.append(cur)

# 第二段：分类占（两套连续，按 "X、" 标题切章，按（一）（二）切小节）
fenlei, curF, curItems, curItem = [], None, [], None
started = False
for raw in lines:
    s = raw.strip()
    if not s:
        continue
    m = RE_TITLE.match(s)
    if m and m.group(1).startswith('住居宅第章'):
        started = True
        if curItem:
            curItems.append(curItem)
            curItem = None
        if curF is not None:
            fenlei.append({'name': curF, 'items': curItems})
        curF = t(m.group(1))
        curItems = []
        continue
    if not started:
        continue
    if m:
        if curItem:
            curItems.append(curItem)
            curItem = None
        if curF is not None:
            fenlei.append({'name': curF, 'items': curItems})
        curF = t(m.group(1))
        curItems = []
        continue
    im = RE_ITEM.match(s)
    if im:
        if curItem:
            curItems.append(curItem)
        curItem = {'no': im.group(1), 'lines': []}
        continue
    if curF is not None:
        if curItem is not None:
            curItem['lines'].append(t(strip_noise(s)))
        else:
            curItems.append({'no': '', 'lines': [t(strip_noise(s))]})
            curItem = curItems[-1]
if curItem:
    curItems.append(curItem)
if curF is not None:
    fenlei.append({'name': curF, 'items': curItems})

# 后处理：仅合并已知正文误切行（"二、三世在内卦…" 是求仕章正文）
merged = []
for f in fenlei:
    if f['name'] and f['name'].startswith('二、三世在内卦'):
        if merged:
            merged[-1]['items'].extend(f['items'])
        continue
    merged.append(f)
fenlei = merged

print('口诀章数:', len(jue), '| 分类占章数:', len(fenlei))
print('口诀章名:', [j['name'] for j in jue])
print('分类占章名:', [f['name'] for f in fenlei])
print('分类占小节数:', sum(len(f['items']) for f in fenlei))

D = {
    'format': 'liuyao_tongxuan',
    'note': '卜筮全书·断易通玄赋区段：口诀章（诸爻持世/世应生克/间爻/身爻/飞伏/忌神/元辰/泄气/安静/乱动/用不上卦/伏藏/出现/空亡/日辰/六神/六亲发动/六亲持世/六亲变化/年建/月建/日建/神杀断例）可机判引用；分类占两套为韵文泛断 → 原文备查',
    'jue': jue,
    'fenlei': fenlei,
}
out = r'D:\一个电脑软件\术数引擎子件\engine\data\liuyao_tongxuan.json'
json.dump(D, io.open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('written', out)
