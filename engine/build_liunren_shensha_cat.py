# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""六壬大全·神煞 → 机判层
- 逐月神煞：解析 lines「支/煞名」交替结构为 支→[煞名] 表（可机判：煞所乘神入课即临课）。
- 岁神煞 / 十二支神煞：仅解析对齐成 12 字一行（子..亥）的表（将军/岁刑/岁破/岁煞/大耗/小耗/年月三煞/金神；支徳/支马/支刑/支破/支害/时煞/支仪）。
- 「岁前二辰」「顺/逆十二」「春夏秋冬」等公式煞、歌括残句解析不了，如实归 huobu，不硬造表。"""
import json, io, os, re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, 'engine', 'data', 'liunren_shensha.json')
OUTP = os.path.join(BASE, 'engine', 'data', 'liunren_shensha_cat.json')

src = json.load(io.open(SRC, 'r', encoding='utf-8'))
ZHI12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
ZHI_SET = set(ZHI12)

# ── 1) 逐月神煞：解析 支→[煞] ──
month_cats = []
for m in src['month']:
    lines = m['lines']
    table = {}
    cur = None
    for ln in lines:
        s = ln.strip()
        if not s:
            continue
        if s in ZHI_SET:           # 单个支名 → 新宫
            cur = s; table.setdefault(cur, []); continue
        if cur is None:
            continue
        for tok in re.split(r'[\s　]+', s):
            tok = tok.strip()
            if tok:
                table[cur].append(tok)
    month_cats.append({
        "month": m['month'],
        "table": table,
        "rules": [],
        "huobu": [{"title": m['month'] + '神煞参断要点',
                   "steps": [
                       "本月各支所临神煞表已机判：起课后某煞所居地盘支的天盘神入课集，即判「X煞临课」",
                       "吉神（生气、天医、地医、驿马、解神、天解、天喜、天德、月德、天赦、皇恩、圣心、天诏等）临课主吉庆",
                       "凶煞（劫煞、灾煞、岁煞、月破、白虎、大煞、丧门、吊客、病符、死气、死神、狱神、天狱、受死、飞廉、天罗地网类）临课主灾咎",
                       "吉凶仍须乘天将（吉将/凶将）与旺相休囚综合，不可单以煞名定吉凶"]}],
    })

# ── 2) 对齐行解析器：^名 空格 12个支 ... ──
def parse_aligned(rows):
    out = {}
    for ln in rows:
        s = ln.strip().replace('己', '巳').replace('已', '巳')  # OCR：己/已→巳
        mt = re.match(r'^([^\s：:]{1,6})[：:\s]+([子丑寅卯辰巳午未申酉戌亥]{12})', s)
        if not mt:
            continue
        name = mt.group(1).strip()
        seq = mt.group(2)
        out[name] = {ZHI12[i]: seq[i] for i in range(12)}
    return out

sui_all = parse_aligned(src['sui'])
zhi_all = parse_aligned(src['zhi'])

# 仅保留明确机判价值的对齐表（岁破=大耗=岁冲重复亦保留备查）
sui_keep = ['将军', '岁刑', '岁破', '岁煞', '大耗', '小耗', '年月三煞', '金神']
zhi_keep = ['支徳', '支马', '支刑', '支破', '支害', '时煞', '支仪', '金神']
sui_table = {k: sui_all[k] for k in sui_keep if k in sui_all}
zhi_table = {k: zhi_all[k] for k in zhi_keep if k in zhi_all}

out = {
  "format": "liunren_shensha_cat",
  "note": "六壬大全·神煞机判层。month_cats.table=逐月支→煞表（lnShenshaMonthHits 判临课）；sui_table/zhi_table=对齐成12行的岁/支煞表（lnSuiShaHits/lnZhiShaHits 判煞支所乘神是否入课）。公式煞（岁前二辰/顺逆十二/春夏秋冬类）解析不了，归 huobu，不硬造。",
  "month_cats": month_cats,
  "sui_table": sui_table,
  "sui_huobu": [
     {"title": "岁神煞公式类（未机判，人工推）", "steps": [
        "丧门=岁前二辰、吊客=岁后二辰、病符=岁后一辰、岁虎=岁后四辰、岁墓=岁后五位、岁宅=岁前五位",
        "岁徳即岁君（阴年从阳，如巳年见甲）、岁合即甲年见己",
        "黄幡只向三合来（对冲豹尾）；伏兵大祸=三合中冲两边；将军三年一移（亥子丑年将军在酉等）",
        "金神之杀随年干，纳音金位同庚辛"]}],
  "zhi_table": zhi_table,
  "zhi_huobu": [
     {"title": "十二支神煞公式类（未机判，人工推）", "steps": [
        "收魂=凡墓神为元武皆是；马倒=驿马前一位；旬盗=旬前一辰",
        "天喜春戌夏丑秋辰冬未、天赦春戊寅夏甲午秋戊申冬甲子、天目春辰夏未秋戌冬丑（四季煞需按月/季节推）",
        "凡「X顺十二/逆十二」者从正月起顺/逆布十二支，需按占月推；歌括（劫杀灾杀岁杀知…）为总目不逐支列",
        "月破/月刑/月害/月鬼等逐月另见逐月表，不以日支查表"]}],
}
json.dump(out, io.open(OUTP, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
ntab = sum(len(m['table']) for m in month_cats)
print('月份:', len(month_cats), '| 月表宫位合计:', ntab, '| 岁表:', list(sui_table), '| 支表:', list(zhi_table))
