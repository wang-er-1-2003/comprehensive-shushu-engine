# Comprehensive Shushu Engine (综合术数引擎)

An offline, local desktop application that digitizes traditional Chinese shushu (术数) systems from classical texts sentence by sentence and turns them into machine-judged rule engines. It covers 35 systems across four major categories — divination (卜筮), life reading (命理), the three styles (三式), and miscellaneous arts (杂占) — including Lingqi Jing, Zhuge Shenshu, Zhouyi Yarrow Stalks, Liuyao Najia, Meihua Yishu, Taixuan Jing, Jiaoshi Yilin, Jingfang Yi, Taiyi Shenshu, Qimen Dunjia, Da Liuren, Jin Kou Jue, Ziping Bazi, Ziwei Doushu, Tieban Shenshu, Huangji Jingshi, Cezhi, dream interpretation, tarot, and Xiejibianfangshu day-selection.

Each system embeds chart-casting computation and verdict-lookup logic: enter the data and get a result reconstructed by the original classical rules.

## Architecture

- **Electron local desktop**: the app renders a local HTML UI inside its own window; no remote content is injected.
- **Data layer**: classical texts digitized into JSON under `engine/data/` (100+ data files, 78 WebP images).
- **Rule engine layer**: chart casting and machine-judged verdict logic in `renderer/` (27 modules) plus `xjb/` (Xiejibianfangshu submodule).
- **IPC bridge**: the renderer pulls data on demand via `window.qianzhan` (data / dreamMsg / tarotCase / export); large fields such as the 14.5MB modern dream library are not shipped at startup but fetched per record.

## Data sources

- Digitized from public-domain classical texts (Li Ren 720 Ju, Zhouyi with Wang Bi's commentary, Lingqi Jing, etc.).
- Some modern reorganization layers are MIT-licensed community projects (kinastro/kentang2017 etc.), noted in the code.
- This engine performs faithful classical-rule reconstruction only; it does not endorse the metaphysical validity of the results.

## Run

```bash
npm install        # installs electron 45
npm start          # or: electron .
```

Build a portable single-file exe:

```bash
npx electron-builder --win   # outputs dist/术数引擎子件-<version>.exe
```

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).

---

## 中文简介

一个离线运行的桌面本地综合术数应用，将中国传统术数体系按古籍原文逐句数字化并建成可机判的规则引擎，覆盖卜筮、命理、三式、杂占四大类共三十五个体系，包括灵棋经、诸葛神数、周易蓍占、六爻纳甲、梅花易数、太玄经、焦氏易林、京房易、太乙神数、奇门遁甲、大六壬、金口诀、子平八字、紫微斗数、铁板神数、皇极经世、测字、解梦、塔罗及协纪辨方书择日等。各体系内置排盘计算与断语库查表逻辑，输入数据即可得到按古籍规则复原的判定结果。架构上采用 Electron 桌面本地分层设计：古籍数据 JSON 化入库为数据层，排盘与机判逻辑为规则引擎层，界面经 IPC 数据桥按需取数渲染，大字段不随启动传输。本引擎仅做古籍复原机判，不做玄学有效性背书。
