## 改造验收记录（本次提交）

### 自动化检查（已通过）
- **TypeScript + 生产构建**：`npm run build`（包含 `tsc -b` + `vite build`）
- **ESLint**：`npm run lint`（`--max-warnings 0`）

### 关键改动点（回归重点）
- **存储 schema v2**：`src/store/storage.ts` 新增 `jintu_attendance_v2_*` key + `migrateToV2()`（保留旧 key，便于回滚）
- **考勤快照**：`src/store/attendance.ts` 从“全量数组 persist”改为“单快照增量写入”
- **成绩/课表**：改为按 `classId` 粒度存取，并新增 domain store：
  - `src/store/grades.ts`
  - `src/store/schedule.ts`
- **弹层收敛**：删除未使用的 `src/components/ui/bottom-sheet.tsx`
- **暗色模式**：补全 `src/index.css` 的 `prefers-color-scheme: dark` 核心 tokens
- **体验**：`ClassPicker` 展示标题；`AttendanceEntry` 无班级引导去 `/classes`

### 建议的最小手动回归（真机/模拟器）
- **点名**：创建班级→进入点名→添加学生→点名状态多次切换→重置→生成报告
- **历史**：确认报告后进入历史页查看→展开日期/时段→复制→导出
- **成绩**：新增科目/新增期→编辑分数→导入/导出
- **课表**：编辑单元格→导入/导出
- **我的**：切换默认班级→删除班级→自动重置开关→退出登录
- **暗色**：系统切换暗色后检查点名/成绩/我的页面对比度与状态色可读性

### 回滚策略说明
- v2 迁移为“**写入新 key + 保留旧 key**”；即使回滚到旧版本，只要旧版本仍读旧 key，数据不会丢失。

