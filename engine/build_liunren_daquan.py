# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""六壬大全/卷五兵占/景祐神定经 补全入库：
1) liunren_shensha.json —— 六壬大全·神煞（十干神煞可机判 + 岁/支/月神煞原文备查）
2) liunren_bingzhan2.json —— 六壬大全·卷五兵占 40 节（备查）
3) liunren_shendingjing.json —— 景祐六壬神定经 义理（备查）"""
import json, io, re
from zhconv import convert

D = r'D:\一个电脑软件\玄学分类法\01_大六壬'

def t(s):
    return convert(s, 'zh-cn')

# ---------- 1 神煞 ----------
dq = io.open(D + r'\六壬大全.txt', encoding='utf-8').read().split('\n')
GAN_HEAD = '甲乙丙丁戊巳庚辛壬癸'
GAN_STD = list('甲乙丙丁戊己庚辛壬癸')
gan = {}
sanqi = []
for raw in dq[50:68]:
    s = raw.strip()
    if not s:
        continue
    parts = s.split()
    if not parts:
        continue
    if parts[0] == '三竒':
        sanqi.append(''.join(parts[1:]))
        continue
    if parts[0] == GAN_HEAD:
        continue
    name = parts[0]
    rest = ' '.join(parts[1:])
    mm = re.match(r'^([\u4e00-\u9fff]+)', rest)
    mz = re.match(r'^([子丑寅卯辰巳午未申酉戌亥己已]{10})', rest)
    if mz:
        vals = mz.group(1).replace('己', '巳').replace('已', '巳')
        gan[name] = dict(zip(GAN_STD, list(vals)))
    elif mm:
        gan[name + '（' + mm.group(1) + '）'] = None
sui = [t(x.strip()) for x in dq[28:50] if x.strip()]
zhi = [t(x.strip()) for x in dq[69:182] if x.strip()]
month_raw = []
cur_m = None
for raw in dq[182:628]:
    s = raw.strip()
    if not s:
        continue
    if re.match(r'^[正一二三四五六七八九十]+月$', s):
        if cur_m:
            month_raw.append(cur_m)
        cur_m = {'month': t(s), 'lines': []}
        continue
    if cur_m:
        cur_m['lines'].append(t(s))
if cur_m:
    month_raw.append(cur_m)

print('十干神煞数:', len(gan), '| 三奇:', sanqi, '| 岁神煞行:', len(sui), '| 支神煞行:', len(zhi), '| 月神煞块:', len(month_raw))

SS = {
    'format': 'liunren_shensha',
    'note': '六壬大全·神煞：十干神煞（按日干查 13 煞）机判；岁/支/月神煞原文备查',
    'gan': gan,
    'sanqi': sanqi,
    'sui': sui,
    'zhi': zhi,
    'month': month_raw,
}
json.dump(SS, io.open(r'D:\一个电脑软件\术数引擎子件\engine\data\liunren_shensha.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- 2 卷五兵占 ----------
bz = io.open(D + r'\六壬大全_卷五兵占.txt', encoding='utf-8').read().split('\n')
RE_SEC = re.compile(r'^([\u4e00-\u9fff]{2,10}第[一二三四五六七八九十百]+)')
secs, cur = [], None
for raw in bz:
    s = raw.strip()
    if not s:
        continue
    m = RE_SEC.match(s)
    if m:
        if cur:
            secs.append(cur)
        cur = {'name': t(m.group(1)), 'lines': [t(s[m.end():])] if s[m.end():].strip() else []}
        continue
    if cur is not None:
        cur['lines'].append(t(s))
    elif '物类分宫' in s or '军中见' in s or '附行军' in s:
        cur = {'name': '附行军见异诸占', 'lines': [t(s)]}
if cur:
    secs.append(cur)
print('兵占节数:', len(secs), '| 节名:', [x['name'] for x in secs][:8], '...')
BJ = [{'no': i + 1, 'name': x['name'], 'text': '\n'.join(x['lines'])} for i, x in enumerate(secs)]
json.dump(BJ, io.open(r'D:\一个电脑软件\术数引擎子件\engine\data\liunren_bingzhan.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('liunren_bingzhan.json 已升级为', len(BJ), '篇（含遣使入敌第三十六）')

# ---------- 3 景祐神定经 ----------
sy = io.open(D + r'\景祐六壬神定经.txt', encoding='utf-8').read().split('\n')
RE_SHI = re.compile(r'^释[\u4e00-\u9fff]{1,3}第[一二三四五六七八九十百]+$')
shis, cur = [], None
for raw in sy:
    s = raw.strip()
    if not s:
        continue
    if s.startswith('=====') or s.startswith('《') or s.startswith('来源'):
        continue
    m = RE_SHI.match(s)
    if m:
        if cur:
            shis.append(cur)
        cur = {'name': t(m.group(0)), 'lines': []}
        continue
    if cur is not None:
        cur['lines'].append(t(s))
if cur:
    shis.append(cur)
print('神定经节数:', len(shis), '| 节名:', [x['name'] for x in shis][:10], '...')
SDJ = {'format': 'liunren_shendingjing', 'note': '景祐六壬神定经（释天/释地/释四时/释日/释辰/释阴阳/释五行/释五色/释五音/释五性/释六情/释五味/释四方/释四门/释德/释刑…）义理训诂原文备查', 'sections': shis}
json.dump(SDJ, io.open(r'D:\一个电脑软件\术数引擎子件\engine\data\liunren_shendingjing.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('all written')
