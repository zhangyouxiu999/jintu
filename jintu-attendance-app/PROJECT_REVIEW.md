# jintu-attendance-app 项目审查报告（架构 / UI / 页面 / 性能）

> 范围：`jintu-attendance-app/src` + `tailwind.config.js`。结论基于静态代码审查（未运行、不改代码）。

## A. 整体架构概览

### A1. 运行入口与路由

- **入口**：`src/main.tsx` 启动先 `init()`（hydrate 本地持久化数据），再渲染 React。
- **路由框架**：`src/App.tsx` 使用 `HashRouter`（适合 WebView/Capacitor 场景）。
- **路由表**：`src/components/AnimatedRoutes.tsx`
  - 公开路由：`/login`
  - 受保护路由：其余路由包在 `RequireAuth`（`storage.loadAuth()`）内
  - 主布局：所有受保护页面都嵌套在 `AppLayout`，通过 `<Outlet />` 渲染子页面

路由清单（来自 `AnimatedRoutes.tsx`）：

- `/login` → `Login`
- `/`（index）→ `AttendanceEntry`
- `/classes` → `ClassList`
- `/attendance/:classId` → `Attendance`
- `/history`、`/history/:classId` → `History`
- `/schedule` → `ClassPicker`（选择班级后进入 `/schedule/:classId`）
- `/schedule/:classId` → `Schedule`
- `/grades` → `ClassPicker`（选择班级后进入 `/grades/:classId`）
- `/grades/:classId` → `Grades`
- `/templates` → `Templates`
- `/settings` → `Settings`（但常规入口是 `AppLayout` 内“我的”抽屉）

### A2. 主布局（AppLayout）与导航模型

`src/components/AppLayout.tsx` 承担了 4 类职责：

- **布局壳**：Header（班级名 + 头像按钮）/ Main（内容区）/ BottomDock（底部导航与功能菜单，通过 `createPortal` 挂到 `document.body`）
- **全局上下文**：
  - `AppLayoutContext`：`pageTitle`、`setPageActions()`（用于右下角功能菜单：导入/导出/额外动作）
  - `CurrentClassContext`：`currentClassId`（并写入 `storage.saveCurrentClassId`）
- **“默认班级”推导与 URL 同步**：
  - `effectiveClassId = currentClassId ∈ list ? currentClassId : list[0] : null`
  - 当 `effectiveClassId` 变化时，如果当前在 `/attendance|/grades|/schedule/:classId`，会 **replace** 到同类型的新班级 URL
- **设置页（我的）抽屉**：`SettingsDrawerWrapper` 使用 Vaul `Drawer`，并做了“延迟挂载/延迟卸载内容”来规避打开卡顿（意图清晰，属于正确的性能优化方向）

页面导航（BottomDock）：

- **Tab**：点名（`/` 或 `/attendance/:id`）、成绩（`/grades` 或 `/grades/:id`）、课表（`/schedule` 或 `/schedule/:id`）
- **功能菜单**：`DropdownMenu` 展示“导入/导出/额外动作”，具体由各页面通过 `useAppLayout().setPageActions()` 注入

### A3. 数据层（本地存储优先）

结论：业务数据几乎全部在本地。

- **持久化**：`src/store/storage.ts`，直接用 `localStorage`，统一 JSON 序列化
- **域 store**（模块级 `Map` + persist）：
  - `src/store/classes.ts`
  - `src/store/students.ts`
  - `src/store/attendance.ts`
  - `src/store/announcements.ts`
- **初始化**：`src/store/db.ts` 的 `init()` 在应用启动时从 `storage.load*()` hydrate 到各 store
- **“用例层”**：`src/hooks/*`（例如 `useClass`、`useAttendance`、`useScheduleData`、`useGradesImport` 等）把“页面交互 → store/storage”串起来

## B. UI 设计系统与组件库审查

### B1. Tokens（CSS 变量）与 Tailwind 映射

- **tokens 定义**：`src/index.css` 的 `:root`
  - 间距：8dp 网格（`--space-4..56`），页面 padding（`--page-x/--page-y`），触控目标（`--touch-target: 44px`）
  - 颜色：`--bg/--surface/--surface-2/...`、`--primary/*`、语义色 `--success/--leave/--late/--error`、以及课表业务色 `--schedule-*`
  - 排版：`.text-title/.text-body/.text-caption/...` 语义 class
  - 移动端：`--safe-*`，`.touch-scroll`，`content-visibility` 优化工具类
- **Tailwind 映射**：`tailwind.config.js`
  - `colors.*`、`borderRadius.*` 直指 `var(--*)`
  - 说明项目希望做到“改主题只改变量，组件不改”

总体评价：**tokens 体系清晰且覆盖面广**，和项目“移动端质感”的目标一致，属于加分项。

### B2. 组件库与封装质量

`src/components/ui/*`：Radix + shadcn 风格封装，整体可用性良好。

关键点：

- `Dialog` / `AlertDialog`：内容区基类统一、Overlay 状态样式一致；并额外提供 `DialogContentBottomSheet`（Radix Dialog 的底部抽屉变体）
- `Drawer`：`src/components/ui/drawer.tsx` 使用 Vaul Drawer（顶部安全区、标题栏、滚动容器 `.touch-scroll`）
- `BottomSheet`：`src/components/ui/bottom-sheet.tsx` 自研 portal 版本（直接改 `document.body.style.overflow` 锁滚动）

### B3. 明确缺口与一致性风险

#### 1) “抽屉/底部弹层”三套并存（维护成本 + 体验不一致）

目前存在：

- Vaul `Drawer`（`src/components/ui/drawer.tsx`，被 `AppLayout` 用于“我的”）
- Radix `DialogContentBottomSheet`（`src/components/ui/dialog.tsx`）
- 自研 `BottomSheet`（`src/components/ui/bottom-sheet.tsx`，锁滚动策略与其它实现不同）

风险：

- **滚动锁定/Overlay 层级**策略不一致，后续一旦页面开始混用，容易出现“背景可滚动/焦点穿透/遮罩叠加”的边界 bug
- 视觉与交互（动画曲线、拖拽关闭、关闭按钮区域等）难以保持一致

#### 2) 暗色模式仅预留未落地

`src/index.css` 有 `prefers-color-scheme: dark` 的注释与少量 `--schedule-*` 覆盖，但核心变量（`--bg/--surface/--on-surface/...`）未补全。

影响：

- 如果用户系统是暗色，当前会出现“部分模块偏暗、绝大部分仍是浅色 tokens”的不一致风险

## C. 逐页面布局与功能审查

> 本节按“布局结构 / 核心功能 / 空与边界态 / 关键跳转”组织。

### C1. `Login`（`src/pages/Login.tsx`）

- **布局**：居中卡片 + logo + 两个输入框 + 提交按钮；移动端 safe-area padding 明确
- **功能**：本地凭据校验（`getLoginCredentials()` 读取 `import.meta.env`），通过则 `storage.saveAuth(true)` 并跳转 `/`
- **边界态**：
  - 未配置凭据：提示“系统未配置登录凭据”
  - 已登录：直接 `navigate('/', replace)`
- **风险提示**（架构层）：这不是“安全登录”，更像“本地开关”。若产品定位是内部离线工具可接受；否则需要后端 token 化重做（见 P0/P1 清单）

### C2. `AttendanceEntry`（`src/pages/AttendanceEntry.tsx`）

- **定位**：首页入口/路由 index
- **逻辑**：
  - 有 `effectiveClassId`：直接 `Navigate` 到 `/attendance/:classId`
  - 无班级：展示空状态卡片，引导去 `/settings`
- **UX**：空状态文案清晰，但把“班级管理入口”放在“我的抽屉”里，首次用户可能需要 1 次学习成本（可通过首页更明显 CTA/直接跳转班级管理页优化）

### C3. `Attendance`（`src/pages/Attendance.tsx`）

这是项目最重的页面，也是交互最复杂的模块。

- **核心结构**：
  - 顶部 sticky 区：时段标签 + 状态统计（应到/实到/请假/晚到/未到）+ 公告折叠入口
  - 公告浮层：展开时 absolute 浮层，不占文档流（避免列表跳动的思路正确）
  - 学生列表：
    - 0 人：空状态 + “添加学生”按钮
    - ≥1 人：`@dnd-kit` 可拖拽排序；按 `useAttendanceStats` 计算分列（1/2/3 列）并渲染 `SortableStudentRow`
- **全局动作接入**：通过 `setPageActions()` 注入
  - 导入学生名单、导出名单
  - 添加学生、修改学生、添加公告、一键全勤、重置考勤、生成考勤报告
- **重要交互与边界态**：
  - 点击学生状态：`requestAnimationFrame` 做乐观更新，失败 `refresh()` 回滚（体验好）
  - 自动重置：根据固定时段 slot + `sessionStorage` 去重（0 点/12/18），并读取 `storage.loadAutoResetAttendance()` 开关
  - 前后台切换：`visibilitychange` 与 Capacitor `appStateChange` 时 `refresh(true)`（保证数据一致性）
  - “生成考勤报告”：确认后复制到剪贴板，并尝试 `weixin://` 跳转（本地化场景强相关）

### C4. `History`（`src/pages/History.tsx`）

- **布局**：
  - 未选班级：上方“选择班级”卡片
  - 选了班级：
    - 右上角“导出”按钮（有数据时出现）
    - 按日期分组折叠列表 → 点开某个时段 → 弹窗展示 report 文本（可复制）
- **数据来源**：直接读 store（`attendanceStore.listByClass`、`studentsStore.getByClassId`）并动态 import `xlsx` 导出
- **边界态**：无班级 / 无已确认快照，都有明确空状态

### C5. `ClassList`（`src/pages/ClassList.tsx`）

- **定位**：独立班级管理页（`/classes`），也可能被当作其它流程入口
- **功能**：
  - 新增班级（成功后设置当前班级并跳转到点名）
  - 编辑班级名
  - 删除班级（确认弹窗）
  - 对单个班级：快捷跳转课程表/成绩单/历史考勤、导出所有（Excel）
  - 允许修改“App 标题”（写到 `storage.saveAppTitle`）
- **体验**：列表项点击区域大、右侧“更多”菜单符合移动端习惯

### C6. `ClassPicker`（`src/pages/ClassPicker.tsx`）

- **定位**：`/schedule` 与 `/grades` 的中转页（没有班级 id 时先选班级）
- **边界态**：无班级时给出“去首页”CTA
- **小问题**：组件接收 `title` 但实际未展示（参数被命名为 `_title`），从产品角度会让“当前你在选什么”不够明确（见 P2）

### C7. `Schedule`（`src/pages/Schedule.tsx`）

- **结构**：标题“本班课表” + `WeekScheduleGrid`
- **导入/导出**：通过 `useAppLayout().setPageActions()` 注入，并使用 `useScheduleData` 处理 Excel 导入
- **数据层**：`useScheduleData` 走 `storage.loadSchedule/saveSchedule`（与 classes/students/attendance 的 store 体系不同，逻辑分散，见可维护性建议）

### C8. `Grades`（`src/pages/Grades.tsx`）

- **结构**：横向可滚动表格（sticky 序号列与姓名列）+ 科目列
- **核心功能**：
  - 多期成绩单（periods），当前期 id 存 `storage.saveCurrentPeriodId`
  - 添加科目、添加成绩单、切换期
  - 成绩编辑：点击单元格进入 Input，blur/Enter 保存
  - 排序：默认/按姓名/按总分（DropdownMenu）
  - 长按/右键科目：弹出 portal 菜单，可重命名/删除科目
  - 导入/导出：Excel（导出支持当前期或全部期）
- **风险点（性能/一致性）**：每次编辑一个分数都会触发 `persist()`，进而 `storage.saveGrades()` 全量写（见 P0/P1）

### C9. `Templates`（`src/pages/Templates.tsx`）

- **功能**：模板列表下载（`downloadTemplate`），下载状态通过 `downloadingId` 控制
- **定位**：更像“资源中心”，也在 `Settings` 的 Accordion 内有 compact 版本（入口重复但合理）

### C10. `Settings`（`src/pages/Settings.tsx`）

- **定位**：“我的”页（常在 `AppLayout` 的 Vaul Drawer 内打开）
- **结构**：
  - Accordion：
    - 我的班级（含 Swipeable 行、设置默认、删除、添加）
    - 历史成绩单（跳转到 `Grades` 且带 `state.periodId`）
    - 模板库（嵌入 `TemplateList compact`）
  - 入口按钮：历史考勤
  - 开关：自动重置考勤（写 `storage.saveAutoResetAttendance`）
  - 退出登录（确认后 `storage.saveAuth(false)` → `/login`）
- **体验亮点**：Accordion 用 grid 行高动画替代 max-height，减少布局抖动；并对滚动块用了 `.scroll-section-opt`

## D. 性能与可维护性审查（证据驱动）

### D1. localStorage 写入模型：全量 JSON 串行化（潜在卡顿）

证据：

- `storage.save()` 直接 `JSON.stringify` 后 `localStorage.setItem`（同步、主线程）
- 各 domain store 的 `persist()` 都是 `Array.from(map.values())` 全量保存
  - `src/store/classes.ts` / `students.ts` / `attendance.ts` 都是这种模式
- `attendanceStore.upsert()` 每次学生点名都触发 `persist()`，等价于“每次点一次状态都写全量快照数组”

影响：

- 规模小（几十人、少量历史）时体感可能没问题
- 规模大（多班级、几百学生、快照累计增长）会出现：
  - 点击点名状态时偶发掉帧/卡顿
  - 导入/批量更新时长时间阻塞（尤其低端安卓）

### D2. store 无订阅 → 页面一致性靠 `refresh()`（时序风险）

当前 store 是 module-level Map，没有事件订阅或 React store 绑定：

- 页面间同步：依赖 hooks 主动 `refresh()`（例如 `useClass.refresh()`）
- 已做的补救：`Attendance` 在前后台切换时 refresh，属于正确补救，但仍可能遗漏“其它页面写入后当前页面未刷新”的边界

### D3. 渲染与交互优化：已有亮点

- `SortableStudentRow` 使用 `memo`（减少行级重渲染）
- `useClass.refresh()` 里 `startTransition`，避免刷新数据时阻塞交互
- `SettingsDrawerWrapper` 延迟挂载/卸载 Settings 内容，针对“打开抽屉卡顿”做了工程化优化（思路正确）

### D4. 抽屉/弹层三套并存：滚动锁定与 z-index 复杂度提升

证据：

- 自研 `BottomSheet` 直接改 `document.body.style.overflow`
- Vaul/Radix 自身也会进行一部分 overlay/scroll 处理

风险：

- 多弹层叠加或切换时可能出现滚动状态恢复不一致
- z-index 分散（`z-[100]`、`z-[110]` 等）后期易打架

## E. 问题清单与优先级（P0/P1/P2）

> 这里按“影响 + 复现/触发路径 + 建议方向 + 关联文件”给出。

### P0（强烈建议优先处理）

1) **点名/成绩等高频写入路径：localStorage 全量写导致可预期的卡顿风险**
- **影响**：规模上来后，核心操作（点名/改分数/导入）会掉帧，且是“业务增长必现”的问题
- **触发**：`Attendance` 点状态（每次 `attendanceStore.upsert()` 触发 `persist()` 全量写）；`Grades` 编辑分数（`persist()` 写全量 grades）
- **建议方向**：
  - 把快照/成绩改为“增量存储”或“按 classId 拆 key”
  - 在写入频繁处做批处理（debounce / requestIdleCallback / 事务式合并写）
  - 长期：迁移到 Capacitor Preferences/SQLite（`storage.ts` 已注明方向）
- **关联文件**：`src/store/storage.ts`、`src/store/attendance.ts`、`src/pages/Grades.tsx`

2) **抽屉/底部弹层实现多套并存：后期 bug 与维护成本高**
- **影响**：UI 一致性与边界 bug（滚动锁、焦点、叠层）风险上升
- **建议方向**：收敛为 1 套主方案（建议：优先 Vaul Drawer + Radix Dialog，明确“底部抽屉”统一走一个实现）
- **关联文件**：`src/components/ui/drawer.tsx`、`src/components/ui/dialog.tsx`、`src/components/ui/bottom-sheet.tsx`

### P1（建议尽快做）

1) **暗色模式未完成（仅预留变量）**
- **影响**：系统暗色用户体验不一致；也会影响后续视觉迭代
- **建议方向**：补全 dark 下 `--bg/--surface/--on-surface/...` 全量 tokens；并做最少 2-3 个关键页面对比度检查（点名/成绩/我的）
- **关联文件**：`src/index.css`

2) **数据层分裂：classes/students/attendance 有 store，但 schedule/grades 部分直接在页面/hook 操作 storage**
- **影响**：业务规则散落，后续要做数据迁移/同步/校验时成本高
- **建议方向**：把 Schedule/Grades 也抽成一致的 store API（即使仍用 localStorage），统一“读/写/迁移/版本化”入口
- **关联文件**：`src/hooks/useScheduleData.ts`、`src/pages/Grades.tsx`、`src/store/storage.ts`

3) **“登录”是前端环境变量 + localStorage 布尔值**
- **影响**：安全属性弱（可被手动改 localStorage 绕过），仅适合离线/内部工具
- **建议方向**：如果未来要联网或对外分发，需要后端鉴权（token/过期/权限）；如果确定是离线内部工具，则至少在文档里明确边界
- **关联文件**：`src/pages/Login.tsx`、`src/store/storage.ts`、`src/components/AnimatedRoutes.tsx`、`src/lib/appConfig.ts`

### P2（体验与一致性优化项）

1) **`ClassPicker` 的 `title` 参数未展示**
- **影响**：用户在“选班级”页不清楚是在为“课表/成绩”做选择（尤其从深链接进入）
- **建议方向**：页面顶部展示标题（并与 `AppLayout` 的 header 协同）
- **关联文件**：`src/pages/ClassPicker.tsx`

2) **入口与班级管理信息架构可再简化**
- **现状**：`AttendanceEntry` 空状态引导去 `/settings`（抽屉式“我的”），而 `ClassList`（/classes）也能管理班级
- **建议方向**：统一主入口：要么“班级管理只在我的里”，要么“首次引导直接去 /classes”，减少学习成本
- **关联文件**：`src/pages/AttendanceEntry.tsx`、`src/pages/Settings.tsx`、`src/pages/ClassList.tsx`

## F. 页面地图（Mermaid）

```mermaid
flowchart TD
  mainTS[main.tsx_init_then_render] --> appTS[App.tsx_HashRouter]
  appTS --> routes[AnimatedRoutes]

  routes --> login[/login_Login]
  routes --> authGate[RequireAuth]
  authGate --> layout[AppLayout_Outlet]

  layout --> entry[/_AttendanceEntry]
  layout --> classes[/classes_ClassList]
  layout --> attend[/attendance/:classId_Attendance]
  layout --> history[/history_History]
  layout --> historyId[/history/:classId_History]
  layout --> schedulePick[/schedule_ClassPicker]
  layout --> scheduleId[/schedule/:classId_Schedule]
  layout --> gradesPick[/grades_ClassPicker]
  layout --> gradesId[/grades/:classId_Grades]
  layout --> templates[/templates_Templates]
  layout --> settings[/settings_Settings]

  layout --> dock[BottomDock_Tabs_and_Actions]
  dock --> tabAttend[Tab_点名]
  dock --> tabGrades[Tab_成绩]
  dock --> tabSchedule[Tab_课表]
  dock --> menu[功能菜单_import_export_extra]
```

