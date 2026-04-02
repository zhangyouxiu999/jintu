# 课程表页面 · 设计审查报告

**范围**：Schedule 页面 + WeekScheduleGrid 组件 + 相关设计 token  
**依据**：iOS HIG、8pt 网格、WCAG 2.1 AA（对比度）、SF 字体层级、现有 `index.css` 设计系统  
**结论**：达标项与待改进项分列，每项附设计理由与可执行建议。

---

## 1. 布局与网格 (Layout & Grid)

### 1.1 基础单位与节奏

| 项目 | 当前值 | 标准/依据 | 结论 |
|------|--------|-----------|------|
| 课程行高 | 48px | 8pt 网格 (48 = 6×8) | 通过 |
| 休息行高 | 24px | 8pt (24 = 3×8) | 通过 |
| 表头高 | 40px | 8pt (40 = 5×8)，容纳 caption + tiny 双行 | 通过 |
| 表头–首行间距 | 8px | HEADER_TO_ROW_GAP，与网格一致 | 通过 |
| 行间距 ROW_GAP | 8px | 8pt | 通过 |
| 列间距 COLS_GAP | 8px | 8pt | 通过 |
| 段落间隙 SECTION_GAP | 8px | 午休/晚饭前后，8pt | 通过 |
| 列宽 COL_WIDTH | 88px | 8pt (88 = 11×8) | 通过 |
| 左侧时间列宽 | 64px | 8pt (64 = 8×8) | 通过 |
| 课程格内 padding | 8px (px-2, py-2) | 8pt | 通过 |
| 今日列水平 padding | 8px (px-2) | 8pt | 通过 |
| 可滚动区水平 padding | 16px (px-4) | 8pt | 通过 |

**设计理由**：HIG 推荐以 8pt 为最小步进，所有间距与关键尺寸取 8 的倍数，保证整页节奏一致、与系统控件对齐。

### 1.2 结构层级

- **页面级**：`px-[var(--page-x)]`（20px）、`py-4`（16px），与 `--page-x` 一致。
- **区块级**：周范围文案与表格之间 `mb-4`（16px），区块间 16px 符合注释中的「区块间 16px」。
- **表格内**：时间列与七列之间 1px 分隔线 `--outline-variant`，不抢视觉焦点。

**待改进**：周范围与表格之间若希望更明显的「标题–内容」层级，可考虑 20px（`--space-20`）与页面 x 对齐，当前 16px 已可接受。

### 1.3 对齐与轴线

- 时间列：`justify-end` 右对齐，与数字宽度一致，避免 08:00 / 11:50-14:00 长短不一导致抖动。
- 表头：星期 + 日期 `flex flex-col items-center` 垂直居中，多列轴线一致。
- 休息格：`justify-center` 水平居中，「午休」「晚饭」居中。
- 课程格：内容左对齐（默认 flex），`px-2` 左右对称。

**结论**：轴线清晰，无错位。

---

## 2. 配色与对比度 (Color & Contrast)

### 2.1 语义色与 token 使用

| 课程类型 | 背景 token | 文字 token | 副文案 | 依据 |
|----------|------------|------------|--------|------|
| blue | --schedule-primary-bg | --schedule-primary-text | --on-surface-muted | 主色容器，与系统主色同源 |
| red | --schedule-error-bg | --schedule-error-text | --on-surface-muted | 错误/警示语义 |
| teal | --schedule-success-bg | --schedule-success-text | --on-surface-muted | 成功/进行中语义 |
| gray | --bg-subtle | --schedule-neutral-text | --schedule-neutral-sub | 中性、与无课格区分 |

- 有课格统一由 `cell.color` 驱动，无课格使用 `--surface-2` +「无课」+ `--on-surface-muted`。
- 灰色课程使用 `--bg-subtle`（#EBEBF0），无课使用 `--surface-2`（#F5F5F7），明度有差，可区分「有课/无课」。

**结论**：语义一致，无硬编码色值，灰与空状态可辨。

### 2.2 对比度（可访问性）

- **正文 on-surface on #FFF**：1C1C1E on #FFFFFF，约 16:1，远超 AA 要求。
- **说明文 on-surface-muted on #FFF**：8E8E93 on #FFFFFF，约 4.6:1，满足 AA 正文要求。
- **主色容器 on-primary-container on primary-container**：#0046A3 on rgba(0,122,255,0.14)，背景极浅，需依赖实际渲染；若背景过浅，建议用 `--on-primary-container` 深蓝，通常可达 AA。
- **成功绿 schedule-success-text #1B5E20 on success-container**：深绿 on 浅绿，对比度充足。
- **错误红 on-error-container on error-container**：深红 on 浅红，同上。

**建议**：若后续支持深色模式，所有 `--schedule-*-bg` / `--schedule-*-text` 需在 `prefers-color-scheme: dark` 下重算或替换为深色专用 token，保证对比度不跌。

### 2.3 层级与无叠 opacity

- 周范围、时间列、休息行、空课均未在语义色上再叠 `opacity`，层级由 token 本身表达。
- 符合「用语义色区分层级，而非同一颜色 + opacity」的做法。

---

## 3. 字体与排版 (Typography)

### 3.1 层级与用途

| 用途 | 类名 | 字号 | 字重 | 行高 | 颜色 | 符合 |
|------|------|------|------|------|------|------|
| 周范围 | text-caption | 13px | 400 | 1.45 | on-surface-muted | 说明级，不抢表格 |
| 表头星期 | text-caption | 13px | 400 / 500(今日) | 1.45 | on-surface / on-surface-muted | 通过 |
| 表头日期 | text-tiny | 11px | 500 | 1.45 | on-surface-muted | 次级信息 |
| 时间轴 | text-caption | 13px | 400 | 1.45 | on-surface-muted | 通过 |
| 休息行 | text-tiny | 11px | 500 | 1.45 | on-surface-muted | 通过 |
| 课程名 | text-footnote | 11px | 500 | 1.45 | 由 cell 色决定 | 注1 |
| 老师/地点 | text-tiny | 11px | 500 | 1.45 | 由 cell 色 sub 决定 | 通过 |
| 无课 | text-tiny | 11px | 500 | 1.45 | on-surface-muted | 通过 |

注1：`index.css` 中 `.text-footnote` 带 `color: var(--on-surface-muted)`，组件内用 `style={{ color: style?.text }}` 覆盖，正确；无 cell 时父层 `color: var(--on-surface)`，空课 span 自带 `text-[var(--on-surface-muted)]`，层级正确。

### 3.2 数字与对齐

- 时间使用 `tabular-nums`，保证 08:00 / 11:50-14:00 数字等宽，列对齐稳定。
- 表头日期 `day.month/day.date` 为数字，若需可与时间列一致加 `tabular-nums`（可选）。

### 3.3 截断与多行

- 课程名、老师/地点均 `truncate`，单行省略，避免撑破 88px 列宽。
- 行高 48px 下，footnote + tiny 双行 + `leading-snug` + `mt-1` 在 8px padding 内可容纳。

**结论**：层级清晰，无字号/字重混用问题。

---

## 4. 圆角与层次 (Radius & Elevation)

### 4.1 圆角体系

- 表格容器：`--radius-lg`（20px），与卡片级一致。
- 今日列：`--radius-md`（16px），略小于外框，层次正确。
- 课程格：`--radius-sm`（12px），最小单位，符合「内容块 < 列 < 整表」的层级。

**结论**：sm < md < lg 一致，无随意值。

### 4.2 背景层级

- 页面底：`--bg`。
- 表格底：`--surface`。
- 今日列：`--bg-subtle`。
- 课程格：由语义色或 `--surface-2`（无课）决定。
- 灰色课程：`--bg-subtle`，与今日列同层但仅作用于格内，可接受。

---

## 5. 交互与可发现性 (Interaction & Affordance)

### 5.1 触控目标

- 课程格高度 48px ≥ 44pt（HIG 最小触控目标），若将来格内可点击，高度已达标。
- 当前格内无 `onClick`，无焦点/激活态，属静态展示；若增加点击查看详情，建议加 `.press` 或 `.press-card` 与 `:active` 态。

### 5.2 横向滚动与 Snap

- 使用 `hide-scrollbar` 完全隐藏滚动条，`snap-x snap-mandatory` + 每列 `snap-start`。
- **优点**：界面干净，列对齐明确。
- **风险**：用户可能不知道可横向滑动；snap 过强可能略不跟手。
- **建议**：保留当前实现亦可；若需更强「可滑动」 affordance，可考虑 `scrollbar-width: thin` + 浅色 thumb，或仅在「今日」列使用 `snap-center` 减轻强制感。属优化项，非必须。

### 5.3 初始滚动

- `useEffect` 中 `todayColRef.current.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })`，首屏以今日列为轴心，符合「课程表以今天为锚点」的预期。

---

## 6. 无障碍 (Accessibility)

- 表格容器：`role="grid"`、`aria-label="课程表"`。
- 表头：`role="columnheader"`、`aria-colindex`、`aria-rowindex={1}`。
- 时间列：`role="rowheader"`、`aria-rowindex`。
- 单元格：`role="gridcell"`、`aria-colindex`、`aria-rowindex`。
- 装饰性分隔与间隙：`aria-hidden`。

**结论**：读屏可识别为表格并遍历行列；未依赖纯色区分信息（有文案「无课」、休息行 label）。若后续为格内增加操作，需为可聚焦元素加键盘与焦点样式。

---

## 7. 与设计系统的一致性

- 间距全部来自 8pt 或 `--space-*` / `--page-x`，无随意 magic number。
- 颜色全部来自 `:root` token，无内联 hex/rgb（除 style 中引用 `var(--*)`）。
- 字号/字重/行高使用现有 `.text-*` 类，无单独特立字号。
- 圆角统一 `--radius-sm/md/lg`。

**结论**：与 `index.css` 设计系统一致。

---

## 8. 小结：达标与建议

| 维度 | 结论 | 说明 |
|------|------|------|
| 布局与 8pt 网格 | 达标 | 关键尺寸与间距均为 8 的倍数，节奏统一 |
| 配色与语义 | 达标 | 四类课程 + 无课语义清晰，灰与空状态可辨 |
| 对比度 | 达标 | 当前浅色背景下的主要组合满足可读性；深色模式需后续补 token |
| 字体层级 | 达标 | caption / footnote / tiny 用途明确，无叠 opacity |
| 圆角与层次 | 达标 | sm/md/lg 与背景层级一致 |
| 无障碍 | 达标 | grid 语义与 ARIA 完整 |
| 与设计系统一致 | 达标 | 无硬编码间距/色值/字号 |
| 横向滚动与 snap | 可选优化 | 可考虑轻量滚动条或放宽 snap，非必须 |

**整体**：课程表页面在布局、配色、字体、层次与无障碍上已符合既定设计系统与 HIG 要求；剩余为体验微调（滚动/snap、深色模式 token），可按迭代处理。
