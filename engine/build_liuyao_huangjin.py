# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""生成六爻 liuyao_huangjin.json：卜筮正宗·黄金策总断千金赋直解 分类占原文全量备查
正文结构：4719 起类名独立行，部分类名两轮出现（合并同名义保留顺序）；失脱带括号、新增家宅带冒号、新增痘疹/船家宅章为变体。"""
import json, io
from zhconv import convert

SRC = io.open(r'D:\一个电脑软件\玄学分类法\12_六爻-纳甲筮法\卜筮正宗.txt', encoding='utf-8').read().split('\n')

# 正文实际类名行 → 规范类名
RAW2NAME = {
    '天时': '天时', '年时': '年时', '国朝': '国朝', '征战': '征战', '身命': '身命', '婚姻': '婚姻',
    '产育': '产育', '进人口': '进人口', '病症': '病症', '病体': '病体', '医药': '医药', '鬼神': '鬼神',
    '种作': '种作', '蚕桑': '蚕桑', '六畜': '六畜', '求名': '求名', '仕宦': '仕宦', '求财': '求财',
    '家宅': '家宅', '新增家宅搜精分别六爻断法 :': '新增家宅搜精分别六爻断法', '坟墓': '坟墓',
    '求师': '求师', '学馆': '学馆', '词讼': '词讼', '避乱': '避乱', '逃亡': '逃亡',
    '失脱（附盗贼、捕盗、捉贼）': '失脱', '新增痘疹': '新增痘症出行', '行人': '行人', '舟船': '舟船',
    '娼家': '娼家', '船家宅章': '船家宅', '何知章': '何知章',
}
RAW_SET = set(RAW2NAME.keys())

# 正文起点：4672 标题后，4719 天时
by_name = {}
names = []
cur_name = None
for j in range(4700, 5767):  # 何知章 5735 起到 十八问答附占验 5767 前
    t = SRC[j].strip()
    if t in RAW_SET:
        name = RAW2NAME[t]
        if name not in by_name:
            by_name[name] = {'name': name, 'lines': []}
            names.append(name)
        cur_name = name
    else:
        if cur_name is not None and t:
            by_name[cur_name]['lines'].append(t)
cats = [by_name[n] for n in names]

print('切出类数:', len(cats), '| 名称:', [c['name'] for c in cats])
print('各类行数:', {c['name']: len(c['lines']) for c in cats})

D = {
    'format': 'liuyao_huangjin',
    'note': '卜筮正宗·黄金策总断千金赋直解 分类占原文全量备查（默认折叠）；引擎 fenlei 已机判 8 类（求财/婚姻/胎孕/出行/行人/词讼/疾病/家宅），其余类为原文备查+逐步机判。妖孽赋/搜鬼论两章正文无独立标题行（含于何知章后段落），未单列。',
    'done_in_engine': ['求财', '婚姻', '胎孕', '出行', '行人', '词讼', '疾病', '家宅'],
    'categories': cats,
}
out = r'D:\一个电脑软件\术数引擎子件\engine\data\liuyao_huangjin.json'
json.dump(D, io.open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('总行数:', sum(len(c['lines']) for c in cats))
