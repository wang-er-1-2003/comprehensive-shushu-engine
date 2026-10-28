# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (c) 2026 wang-er-1-2003
# -*- coding: utf-8 -*-
"""奇门遁甲数据层构建：金函玉镜 + 奇门遁甲统宗 → engine/data/qimen.json
解析项：节气三元局数 / 十二神应验 / 九宫九星 / 十干克应81条 / 时加六甲至六癸 / 九星主诀+108时克应
        / 三奇到宫24条 / 十天干克应法 / 奇门四十格 / 分类占108类 / 八门主诀
原文繁简照录，另附 _zh 简体字段（引擎输出用简体）。
"""
import re, json, os

SRC_JIN = r"D:\一个电脑软件\玄学分类法\02_雷公式-奇门遁甲\金函玉镜奇门遁甲秘笈全书.txt"
SRC_TONG = r"D:\一个电脑软件\玄学分类法\02_雷公式-奇门遁甲\奇门遁甲统宗.txt"
SRC_ZG = r"D:\一个电脑软件\玄学分类法\02_雷公式-奇门遁甲\奇门旨归.txt"
SRC_FY = r"D:\一个电脑软件\玄学分类法\02_雷公式-奇门遁甲\遁甲符应经.txt"
OUT = os.path.join(os.path.dirname(__file__), "data", "qimen.json")

def readlines(p):
    with open(p, "r", encoding="utf-8-sig") as f:
        return [l.rstrip("\n\r") for l in f]

def to_simplified(s):
    try:
        import zhconv
        return zhconv.convert(s, "zh-cn")
    except Exception:
        m = str.maketrans(
            "尅剋爲爲於與後發歲萬門開閉關時將勝敗戰敵來兩無從報蓋華龍鳳鳥蛇螢龜鶴雞鵝豬獼猴爭鬪鬥網羅經書圖壘營塵雲霧風雷電聲響樂樓閣臺階廟祠祭禱誦呪符籙冊錄驗應賢聖禍災變異夢產婦災難險飭責罰審問獄囚牽連擊斬殺喪哭泣怕驚駭哭號"
            ,
            "克克为为于与后发岁万门开闭关时将胜败战敌来两无从报盖华龙凤鸟蛇萤龟鹤鸡鹅猪猕猴争斗斗网罗经书图垒营尘云雾风雷电声响乐楼阁台阶庙祠祭祷诵咒符箓册录验应贤圣祸灾变异梦产妇灾难险饬责罚审问狱囚牵连击斩杀丧哭泣怕惊骇哭号"
        )
        return s.translate(m)

def add_zh(o):
    """递归为字符串值附加 _zh 简体字段"""
    SKIP_KEYS = ("_note", "_meta", "name", "cond", "zhu", "text",
                 # 三奇到宫八宫键（值即文本，不加 _zh 副键）
                 "乾", "坎", "艮", "震", "巽", "离", "坤", "兑",
                 # 十二地支键（九星时克应 shi 表），值即文本
                 "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥",
                 # 十二神名键（十二神应验），值即文本
                 "青龙", "螣蛇", "朱雀", "六合", "白虎", "玄武", "九地", "九天",
                 "勾陈", "太常", "太阴", "天后", "天空", "贵人", "腾蛇", "天乙",
                 # 六甲~六癸键（时加六甲/十天干克应法），值即文本
                 "六甲", "六乙", "六丙", "六丁", "六戊", "六己", "六庚", "六辛", "六壬", "六癸",
                 # 门名键（八门主诀）
                 "开门", "休门", "生门", "伤门", "杜门", "景门", "死门", "惊门")
    if isinstance(o, dict):
        for k, v in list(o.items()):
            if isinstance(v, str) and not k.endswith("_zh") and k not in SKIP_KEYS:
                o[k] = v
                o[k + "_zh"] = to_simplified(v)
            elif isinstance(v, dict):
                add_zh(v)
            elif isinstance(v, list):
                for x in v:
                    if isinstance(x, dict):
                        add_zh(x)
    return o

def main():
    jin = readlines(SRC_JIN)
    tong = readlines(SRC_TONG)
    zg = readlines(SRC_ZG)
    fy = readlines(SRC_FY)
    data = {}

    # ── 1. 节气三元局数（金函玉镜『阳遁九宫起例』『阴遁九宫起例』原表）──
    yang_items = ["冬至一七四", "小寒二八五", "大寒三九六", "立春八五二", "雨水九六三", "惊蛰一七四",
                  "春分三九六", "清明四一七", "谷雨五二八", "立夏四一七", "小满五二八", "芒种六三九"]
    yin_items = ["夏至九三六", "小暑八二五", "大暑七一四", "立秋二五八", "处暑一四七", "白露九三六",
                 "秋分七一四", "寒露六九三", "霜降五八二", "立冬六九三", "小雪五八二", "大雪四七一"]
    NUMS = "一二三四五六七八九"
    def parse_jueqi(items):
        out = {}
        for it in items:
            m = re.match(r"^([\u4e00-\u9fff]{2})([一二三四五六七八九]{3})$", it)
            if m:
                out[m.group(1)] = [NUMS.index(c) + 1 for c in m.group(2)]
        return out
    data["jueqi"] = {"阳遁": parse_jueqi(yang_items), "阴遁": parse_jueqi(yin_items)}
    data["jueqi"]["_note"] = "三元局数：上元/中元/下元（金函玉镜『阳遁九宫起例』『阴遁九宫起例』逐节气原表）"

    # ── 2. 十二神应验要说（金函玉镜『十二神应验要说』段）──
    shier = {}
    for l in jin:
        m = re.match(r"^([\u4e00-\u9fff]{2})在门[，,](.*)$", l)
        if m:
            shier[m.group(1)] = m.group(2)
    data["shier_shen"] = shier
    data["shier_shen"]["_note"] = "十二神应验要说（金函玉镜）：某神临门，出行所见之应验"

    # ── 3. 九宫九星（坎水一白天蓬…）──
    jiugong = {}
    for l in jin:
        m = re.match(r"^([\u4e00-\u9fff]{1,2})[，,]([水木金火土])[、,]([一二三四五六七八九])([白紫黑碧绿黄赤])[、,]([\u4e00-\u9fff]{2})$", l)
        if m:
            jiugong[m.group(1)] = {"wx": m.group(2), "宫": m.group(3), "色": m.group(4), "星": m.group(5)}
    data["jiugong"] = jiugong

    # ── 4. 十干克应 81 条（金函玉镜『十干尅应诀』：天盘干行首省略，续行以『加Y』继之；壬癸段地盘作『甲子戊/日奇六乙/月奇六丙/星奇六丁』式；限 189-273 行区间，防误吸他段『加X：』行）──
    GAN = ["戊", "乙", "丙", "丁", "己", "庚", "辛", "壬", "癸"]
    GANZHI_DI = r"(?:甲[子戌申午辰寅])?([戊乙丙丁己庚辛壬癸])"
    shigan = {}
    cur_x = None
    for l in jin[188:274]:
        s = l.strip()
        m = re.match(r"^([戊乙丙丁己庚辛壬癸])加" + GANZHI_DI, s)
        if m:
            cur_x, d = m.group(1), m.group(2)
        else:
            m2 = re.match(r"^加(?:日奇六|月奇六|星奇六)?" + GANZHI_DI + r"[为曰名]?", s)
            if m2 and cur_x:
                d = m2.group(1)
            else:
                continue
        rest = s[m.end():] if m else s[m2.end():]
        rest = re.sub(r"^（[^）]*）", "", rest)
        nm = ""
        nm_m = re.search(r"「([^」]+)」", rest)
        if nm_m:
            nm = nm_m.group(1)
            body = rest[nm_m.end():].lstrip("。，, ")
        else:
            body = re.sub(r"^[谓之曰名为名][\u4e00-\u9fff]{0,3}", "", rest)
        body = body.strip("。，, ")
        # 原文庚加壬无格名，传统称『小格』（大格/小格成对，烟波钓叟歌）
        if cur_x == "庚" and d == "壬" and not nm:
            nm = "小格"
        shigan.setdefault(cur_x, {})[d] = {"name": nm, "text": body}
    data["shigan"] = shigan
    data["shigan"]["_note"] = "十干克应诀（金函玉镜 81 条）：天盘十干加地盘十干 → 格名+断语；甲隐于六仪（甲子戊…甲寅癸）"

    # ── 5. 时加六甲至六癸（金函玉镜『时加六甲…六癸』段）──
    shigan_shi = {}
    for l in jin:
        m = re.match(r"^时加六([甲乙丙丁戊己庚辛壬癸])[，,](.*)$", l)
        if m:
            shigan_shi["六" + m.group(1)] = m.group(2)
    data["shigan_shi"] = shigan_shi

    # ── 6. 九星主诀 + 108 时克应（金函玉镜：『天X星』标题 + 主诀诗 + 『天X值X时』/『值X时』）──
    jiuxing = {}
    cur = None
    STAR = "蓬芮冲辅禽心柱任英"
    for l in jin:
        s = l.strip()
        m = re.match(r"^(天[蓬芮冲辅禽心柱任英])星$", s)
        if m:
            cur = m.group(1)
            jiuxing.setdefault(cur, {"zhu": "", "shi": {}})
            continue
        if not cur:
            continue
        m2 = re.match(r"^(?:天[蓬芮冲辅禽心柱任英])?(?:（原文缺）)?值([子丑寅卯辰巳午未申酉戌亥])时[，,](.*)$", s)
        if m2:
            jiuxing[cur]["shi"][m2.group(1)] = m2.group(2)
            continue
        # 主诀诗：非空行且非『值X时』/非『天X星』标题行（标题行已被上面 continue）
        if s and not s.startswith("值"):
            jiuxing[cur]["zhu"] += s
    # 去重防覆盖：第二次『天柱星』标题后 值午~值亥 与首次重复
    for k, v in jiuxing.items():
        v["zhu"] = v["zhu"].strip()
        v["shi"] = dict(sorted(v["shi"].items(), key=lambda x: "子丑寅卯辰巳午未申酉戌亥".index(x[0])))
    data["jiuxing"] = jiuxing
    data["jiuxing"]["_note"] = "九星所主（主诀诗）+ 九星×十二时辰克应108条（金函玉镜）"

    # ── 7. 三奇到宫克应 24 条（金函玉镜 417-441 行『三奇到宫尅应吉凶』：原文『干』即乾宫，无逗号）──
    sanqi = {}
    cur_q = None
    DI = {"干": "乾", "坤": "坤", "坎": "坎", "艮": "艮", "震": "震", "巽": "巽", "离": "离", "兑": "兑"}
    for l in jin[416:442]:
        s = l.strip()
        m = re.match(r"^([乙丙丁])奇到([乾坤坎艮震巽离兑干])(.+)$", s)
        if m:
            cur_q = m.group(1)
            sanqi.setdefault(cur_q, {})[DI[m.group(2)]] = m.group(3).strip("。，, ")
            continue
        m2 = re.match(r"^到([乾坤坎艮震巽离兑干])(.+)$", s)
        if m2 and cur_q:
            sanqi[cur_q][DI[m2.group(1)]] = m2.group(2).strip("。，, ")
    data["sanqi"] = sanqi
    data["sanqi"]["_note"] = "三奇到宫克应（金函玉镜 24 条）：乙丙丁奇到八宫，所见之应 + 应期"

    # ── 8. 十天干克应法（金函玉镜『十天干尅应法』：六甲天德贵有余，名「天福」…）──
    tiangan = {}
    for l in jin:
        s = l.strip()
        m = re.match(r"^六([甲乙丙丁戊己庚辛壬癸])([\u4e00-\u9fff]{1,12})[，,](.*)$", s)
        if m and "克应" not in s and "尅应" not in s:
            tiangan["六" + m.group(1)] = m.group(2) + "，" + m.group(3)
    data["tiangan"] = tiangan
    data["tiangan"]["_note"] = "十天干克应法（金函玉镜）：六甲天福/六乙蓬星天贤/…各名号 + 应验"

    # ── 9. 奇门四十格（奇门遁甲统宗『奇门四十格』：格名白名单 + cond 跨行拼接）──
    NAMES = ["龙回首", "鸟跌穴", "天遁", "地遁", "人遁", "云遁", "风遁", "龙遁", "虎遁", "神遁", "鬼遁",
             "龙逃走", "虎猖狂", "蛇妖矫", "雀投江", "三奇得使", "玉女守门", "大格", "刑格", "岁格", "月格",
             "日格", "时格", "小格", "伏宫", "伏干", "飞干格", "太白入荧", "火入金乡", "反吟", "伏吟",
             "五不遇格", "三奇入墓", "时墓", "六仪击刑", "六仪受制", "地罗遮蔽", "天网四张", "尺寸高低"]
    sishi = []
    in_sishi = False
    for l in tong:
        s = l.strip()
        if s == "奇门四十格":
            in_sishi = True
            continue
        if not in_sishi:
            continue
        if s in ("八节应八门旺相",):
            break
        if not s:
            continue
        hit = next((n for n in NAMES if s.startswith(n)), None)
        if hit:
            rest = s[len(hit):].lstrip(" \t\xa0\u3000")
            # 若同一行 cond 为空则等待续行拼接
            sishi.append({"name": hit, "cond": rest})
        else:
            # 续行：拼到上一格的 cond
            if sishi:
                sishi[-1]["cond"] = (sishi[-1]["cond"] + s).strip()
    data["sishi_ge"] = {"items": sishi}
    data["sishi_ge"]["_note"] = "奇门四十格（奇门遁甲统宗）：格名 + 成格条件；断语并入十干克应/烟波钓叟歌同名条目"

    # ── 10. 分类占（金函玉镜『奇门占事』：占X 标题段，正文至下一标题）──
    fenlei = []
    cur_t = None
    buf = []
    for l in jin[814:]:
        s = l.rstrip()
        m = re.match(r"^(占[\u4e00-\u9fff]{1,12})$", s)
        if m:
            if cur_t and buf:
                fenlei.append({"t": cur_t, "text": "".join(buf).strip()})
            cur_t = m.group(1)
            buf = []
            continue
        if cur_t is not None:
            buf.append(s)
    if cur_t and buf:
        fenlei.append({"t": cur_t, "text": "".join(buf).strip()})
    data["fenlei"] = {"items": fenlei}
    data["fenlei"]["_note"] = "奇门占事分类占（金函玉镜『奇门占事』，共 %d 类）：每类取用神规则+断语" % len(fenlei)

    # ── 11. 八门主诀（金函玉镜八门克应诀总目：门名行后一行为主诀诗）──
    bamen = {}
    BAMEN = ["开门", "休门", "生门", "伤门", "杜门", "景门", "死门", "惊门"]
    for i, l in enumerate(jin):
        s = l.strip()
        for b in BAMEN:
            if s == b or re.match(r"^%s[尅克]应$" % b, s):
                if i + 1 < len(jin):
                    zhu = jin[i + 1].strip()
                    if zhu:
                        bamen.setdefault(b, {})["zhu"] = zhu
    data["bamen"] = bamen
    data["bamen"]["_note"] = "八门主诀（金函玉镜八门克应诀总目首行）"

    # ── 12. 门迫表（统宗『迫』段原文，逐字照录）──
    menpo_items = [
        "开门临三四宫（金克木）", "休门临九宫（水克火）", "生门临一宫（土克水）",
        "伤门临八宫（木克土）", "景门临六宫（火克金）", "死门临一宫（土克水）",
        "惊门临三四宫（金克木）", "杜门临二八宫（木克土）",
    ]
    menpo = [{"门": x[:2], "cond": x[2:]} for x in menpo_items]
    data["menpo"] = {"items": menpo}
    data["menpo"]["_note"] = "门迫（奇门遁甲统宗『迫』段）：门克宫为迫之所在，8 条全文"

    # ── 13. 八门克应详解（金函玉镜 454-722：每门 主诀诗 zhu + 静应『加X：断语』 + 整段原文 yuanwen）──
    MEN_RANGE = [(454, 487), (488, 519), (520, 554), (555, 587), (588, 621), (622, 655), (656, 688), (689, 722)]
    for (s, e), mn in zip(MEN_RANGE, ["开门", "休门", "生门", "伤门", "杜门", "景门", "死门", "惊门"]):
        jing = {}
        for l in jin[s - 1:e]:
            m = re.match(r"^(?:[开休生伤杜景死惊]门)?加([开休生伤杜景死惊]|甲戊|[乙丙丁己庚辛壬癸])([：:，,]+)(.*)$", l.strip())
            if m:
                jing["加" + m.group(1)] = m.group(3).strip("。，, ")
        yuan = "".join(x.strip() for x in jin[s - 1:e] if x.strip())
        bamen.setdefault(mn, {})["jingying"] = jing
        bamen[mn]["yuanwen"] = to_simplified(yuan)
        bamen[mn]["_note"] = "八门克应诀（金函玉镜）：主诀诗 + 静应（门加八门/十干 → 出行所见）+ 整段原文（简体）"

    # ── 14. 三诈五假（金函玉镜 724-738『五假法』『三诈法』）──
    sanzha = {"五假": {}, "三诈": {}}
    cur = None
    for l in jin[723:739]:
        s = l.strip()
        if s in ("五假法",):
            cur = "五假"
            continue
        if s in ("三诈法",):
            cur = "三诈"
            continue
        if not cur or not s:
            continue
        m = re.match(r"^([天地人神鬼][假])[：:，,](.*)$", s)
        m2 = re.search(r"谓之「(真诈|休诈|重诈)」[，,]?(.*)$", s)
        if m and cur == "五假":
            sanzha["五假"].setdefault(m.group(1), []).append(to_simplified(m.group(2)))
        elif m2 and cur == "三诈":
            sanzha["三诈"].setdefault(m2.group(1), []).append(to_simplified(m2.group(2)))
        elif cur == "三诈" and not m2 and not s.startswith("谓之"):
            sanzha["三诈"].setdefault("_论", []).append(to_simplified(s))
    sanzha["三诈"].setdefault("_论", [])
    sanzha["_note"] = "三诈五假（金函玉镜）：五假 天假/地假×2/神假/人假/鬼假 + 三诈 真诈/休诈/重诈（简体）"
    data["sanzha_wujia"] = sanzha

    # ── 15. 九遁变化法原文（金函玉镜 739-751『九遁变化法』九遁详条）──
    jiudun = {}
    cur = None
    for l in jin[738:760]:
        s = l.strip()
        if s == "九遁变化法":
            cur = "start"
            continue
        if not s or s in ("九神主论章", "奇门主客占验论", "二十四气", "五符法", "超神接气诀", "闰奇诀"):
            break
        m = re.match(r"^([天地人风云龙虎神鬼]遁)[：:，,](.*)$", s)
        if m:
            cur = m.group(1)
            jiudun[cur] = to_simplified(m.group(2))
            continue
        if cur and cur != "start" and s:
            jiudun[cur] += to_simplified(s)
    data["jiudun_xiang"] = jiudun
    data["jiudun_xiang"]["_note"] = "九遁变化法（金函玉镜 739-751 详条）：天/地/人/风/云/龙/虎/神/鬼九遁成局条件+乘神所主（简体）"

    # ── 16. 三奇克应段（金函玉镜 1859-1926：三奇遇门应验 / 三奇会三吉门 / 三奇合格断 / 符使应验 / 八门出行克应）──
    sanqi_lu = {}
    cur = None
    SEC = ["三奇尅应", "又三奇会三吉门应验", "三奇合格断", "符使应验", "八门尅应"]
    for l in jin[1858:1927]:
        s = l.strip()
        if s in SEC:
            cur = s
            sanqi_lu.setdefault(cur, [])
            continue
        if cur and s:
            sanqi_lu[cur].append(to_simplified(s))
    data["sanqi_luying"] = sanqi_lu
    data["sanqi_luying"]["_note"] = "三奇/八门克应（金函玉镜 1859-1926）：三奇遇门出行应验+三奇会三吉门+符使应验+八门出行克应（简体）"

    # ── 17. 类神库（奇门旨归 933-999 卷三十五：六亲/六神/八卦/地支类神 + 八门主事 + 九星主事）──
    leixing = {}
    cur = None
    SEC2 = ["六亲尅应", "六神尅应", "地支尅应", "八门主事", "九星主事"]
    def s_gua(s):
        t = to_simplified(s)
        if t.startswith("干："):
            t = "乾" + t[1:]
        return t
    for l in zg[932:999]:
        s = l.strip()
        if s in SEC2:
            cur = s
            leixing.setdefault(cur, [])
            continue
        if not s:
            continue
        # 六神段内 乾坎艮震巽离坤兑 行即『八卦类神』（原文无标题，以八宫名行为段）
        if cur == "六神尅应" and re.match(r"^[乾坤坎艮震巽离兑][：:]", s):
            cur = "八卦类神"
            leixing.setdefault(cur, [])
        if cur:
            leixing[cur].append(s_gua(s))
        else:
            leixing.setdefault("八卦类神", []).append(s_gua(s))
    data["leixing_ku"] = leixing
    data["leixing_ku"]["_note"] = "类神库（奇门旨归卷三十五）：六亲/六神/八卦/地支类神（象意）+八门主事+九星主事（简体）"

    # ── 18. 奇门路应（遁甲符应经『奇门路应』段）──
    luying = []
    on = False
    for l in fy:
        s = l.strip()
        if s == "奇门路应":
            on = True
            continue
        if on:
            if s.startswith("奇门") or (not luying and not s):
                pass
            if not s and len(luying) > 2 and any(x.startswith(("三奇", "九天", "十干")) for x in [luying[-1]]):
                break
            if s:
                luying.append(to_simplified(s))
            if len(luying) > 30:
                break
    data["qimen_luying"] = {"items": luying}
    data["qimen_luying"]["_note"] = "奇门路应（遁甲符应经）：出行遇物之应验（简体）"

    # ── 19. 断局总纲（金函玉镜 17-164 钓叟歌等歌诀 + 奇门旨归 747-921 武侯玄机赋）──
    duanzong = {}
    duanzong["烟波钓叟歌等歌诀"] = to_simplified("\n".join(x.strip() for x in jin[16:164] if x.strip()))
    duanzong["武侯玄机赋（上中下篇）"] = to_simplified("\n".join(x.strip() for x in zg[746:922] if x.strip()))
    duanzong["_note"] = "断局总纲：烟波钓叟歌+神煞歌诀（金函玉镜 17-164）+武侯玄机赋上中下篇（奇门旨归 747-922）（简体）"
    data["duanzong"] = duanzong

    # ── 20. 兵事避忌（奇门遁甲统宗 277-300 背击孤虚亭亭白奸等 + 遁甲符应经 335-345 三胜地五不击）──
    bing = {}
    bing["统宗兵事"] = to_simplified("\n".join(x.strip() for x in tong[276:301] if x.strip()))
    bing["符应经三胜五不击"] = to_simplified("\n".join(x.strip() for x in fy[334:346] if x.strip()))
    bing["_note"] = "兵事避忌（奇门遁甲统宗 277-300 + 遁甲符应经 335-345）：背击/孤虚/亭亭白奸/游都鲁都/三胜地/五不击/天罡时/破军加时/天营/四神/占风/旬中地丙日（简体）"
    data["bing_shi"] = bing

    data["_meta"] = {
        "title": "奇门遁甲 · 数据层（金函玉镜/奇门遁甲统宗/奇门旨归/遁甲符应经）",
        "sources": ["金函玉镜奇门遁甲秘笈全书", "奇门遁甲统宗", "奇门旨归", "遁甲演义", "遁甲符应经"],
        "note": "原文逐字保留，另附 _zh 简体字段（引擎输出用简体）；新增块（八门克应详解/三诈五假/九遁原文/三奇克应/类神库/路应/断局总纲/兵事）以简体直接入库",
    }
    data = add_zh(data)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    # 统计（排除 _zh 键）
    def real(d):
        return {k: v for k, v in d.items() if not k.endswith("_zh")}
    print("jueqi 阳遁:", len(real(data["jueqi"])["阳遁"]), "阴遁:", len(real(data["jueqi"])["阴遁"]))
    print("shier_shen:", len(real(data["shier_shen"])))
    rg = real(data["shigan"])
    print("shigan 81条:", sum(len(real(v)) for k, v in rg.items() if isinstance(v, dict)))
    print("shigan_shi:", len(real(data["shigan_shi"])))
    jx = real(data["jiuxing"])
    print("jiuxing:", len(jx), "星; 时克应总数:", sum(len(real(v["shi"])) for v in jx.values() if isinstance(v, dict)))
    sq = real(data["sanqi"])
    print("sanqi:", {k: len(real(v)) for k, v in sq.items() if isinstance(v, dict)})
    print("tiangan:", len(real(data["tiangan"])))
    print("sishi_ge:", len(data["sishi_ge"]["items"]))
    print("fenlei:", len(data["fenlei"]["items"]))
    print("bamen:", len(real(data["bamen"]) if isinstance(data["bamen"], dict) else {}))
    print("menpo:", len(data["menpo"]["items"]))
    bg = data.get("bamen", {})
    jy = 0
    for k, v in bg.items():
        if isinstance(v, dict) and "jingying" in v:
            jy += len(v["jingying"])
    print("bamen_gongying(门+干克应条数):", jy)
    print("sanzha_wujia:", {k: len(v) if isinstance(v, dict) else 0 for k, v in data.get("sanzha_wujia", {}).items() if not k.startswith("_")})
    print("jiudun_xiang:", len([k for k in data.get("jiudun_xiang", {}) if not k.startswith("_")]))
    print("sanqi_luying:", {k: len(v) for k, v in data.get("sanqi_luying", {}).items()})
    print("leixing_ku:", {k: len(v) for k, v in data.get("leixing_ku", {}).items()})
    print("qimen_luying:", len(data.get("qimen_luying", {}).get("items", [])))
    print("duanzong:", [k for k in data.get("duanzong", {}) if not k.startswith("_")])
    print("bing_shi:", [k for k in data.get("bing_shi", {}) if not k.startswith("_")])
    print("OK ->", OUT, os.path.getsize(OUT), "bytes")

if __name__ == "__main__":
    main()
