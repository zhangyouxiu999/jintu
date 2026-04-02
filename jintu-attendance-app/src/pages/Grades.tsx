import { ArrowUpDown, FileDown, FileUp, GraduationCap, Pencil, Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import GlobalActionDrawer from '@/components/GlobalActionDrawer'
import GradesDialogs from '@/components/grades/GradesDialogs'
import GradesScoreList from '@/components/grades/GradesScoreList'
import { useClass } from '@/hooks/useClass'
import { useGradesPage } from '@/hooks/useGradesPage'
import { InlineMetaRow, PageActionRow, SecondaryButton } from '@/components/ui/app-ui'
import { Button } from '@/components/ui/button'
import { EmptyStateCard, LoadingStateCard } from '@/components/ui/mobile-ui'
import { cn } from '@/lib/utils'

export default function Grades() {
  const { classId } = useParams<{ classId: string }>()
  const navigate = useNavigate()
  const { classEntity, students, loading } = useClass(classId)
  const {
    periods,
    currentPeriodId,
    setCurrentPeriodId,
    selectedSubject,
    setSelectedSubject,
    editingStudentId,
    setEditingStudentId,
    editingValue,
    setEditingValue,
    addSubjectOpen,
    setAddSubjectOpen,
    newSubjectName,
    setNewSubjectName,
    renameSubjectOpen,
    setRenameSubjectOpen,
    renameValue,
    setRenameValue,
    deleteSubjectConfirm,
    setDeleteSubjectConfirm,
    addPeriodOpen,
    setAddPeriodOpen,
    newPeriodName,
    setNewPeriodName,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    sortSheetOpen,
    setSortSheetOpen,
    subjectActionOpen,
    setSubjectActionOpen,
    toolDrawerOpen,
    setToolDrawerOpen,
    exportDialogOpen,
    setExportDialogOpen,
    exportScope,
    setExportScope,
    exportPeriodId,
    setExportPeriodId,
    exportSubmitting,
    inputRef,
    grades,
    importExcelSubmitting,
    importExcelFileRef,
    handleImportExcel,
    sortedStudents,
    getScore,
    handleAddSubject,
    handleAddPeriod,
    renameSubjectAction,
    doRemoveSubject,
    handleExportGrades,
    openScoreEditor,
    saveScore,
    editingStudent,
  } = useGradesPage({
    classId,
    className: classEntity?.name,
    students,
  })

  if (loading || !classEntity) {
    return (
      loading
        ? <LoadingStateCard title="正在打开成绩页" />
        : <EmptyStateCard icon={GraduationCap} title="班级不存在" iconTone="primary" />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <input
        ref={importExcelFileRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        onChange={handleImportExcel}
      />

      <GlobalActionDrawer
        open={toolDrawerOpen}
        onOpenChange={setToolDrawerOpen}
        title={`${classEntity.name} · 成绩工具`}
        actions={{
          importAction: {
            id: 'import-grades',
            label: importExcelSubmitting ? '导入中…' : '导入成绩单',
            icon: FileUp,
            onSelect: () => importExcelFileRef.current?.click(),
            disabled: importExcelSubmitting,
          },
          exportAction: {
            id: 'export-grades',
            label: '导出成绩单',
            icon: FileDown,
            onSelect: () => {
              setExportScope('current')
              setExportPeriodId(currentPeriodId)
              setExportDialogOpen(true)
            },
          },
          extraActions: [
            {
              id: 'sort-grades',
              label: '排序方式',
              icon: ArrowUpDown,
              onSelect: () => setSortSheetOpen(true),
            },
          ],
        }}
      />

      <PageActionRow>
        <SecondaryButton type="button" variant="outline" className="px-4" onClick={() => navigate(`/attendance/${classId}`)}>
          返回点名
        </SecondaryButton>
        <SecondaryButton
          type="button"
          className="px-4"
          onClick={() => {
            setNewPeriodName(`第${periods.length + 1}期`)
            setAddPeriodOpen(true)
          }}
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          新建成绩单
        </SecondaryButton>
        <SecondaryButton type="button" variant="outline" className="px-4" onClick={() => setToolDrawerOpen(true)} aria-label="打开成绩工具">
          更多操作
        </SecondaryButton>
      </PageActionRow>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {periods.map((periodItem) => (
          <Button
            key={periodItem.id}
            type="button"
            variant={currentPeriodId === periodItem.id ? 'secondary' : 'outline'}
            onClick={() => setCurrentPeriodId(periodItem.id)}
            className={cn(
              'h-10 shrink-0 rounded-full px-4 text-[14px]',
              currentPeriodId === periodItem.id
                ? 'border-[var(--primary)] bg-[var(--primary-container)] text-[var(--primary)]'
                : 'border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface-muted)]'
            )}
          >
            {periodItem.name}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {grades.subjects.map((subject) => (
          <Button
            key={subject}
            type="button"
            variant={selectedSubject === subject ? 'secondary' : 'outline'}
            className={cn(
              'h-10 shrink-0 rounded-full px-4 text-[14px]',
              selectedSubject === subject
                ? 'border-[var(--primary)] bg-[var(--primary-container)] text-[var(--primary)]'
                : 'border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface-muted)]'
            )}
            onClick={() => setSelectedSubject(subject)}
          >
            {subject}
          </Button>
        ))}
        <SecondaryButton type="button" variant="outline" className="rounded-full px-4" onClick={() => setAddSubjectOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          科目
        </SecondaryButton>
        {selectedSubject ? (
          <SecondaryButton type="button" variant="outline" size="icon" className="rounded-full" onClick={() => setSubjectActionOpen(true)} aria-label="管理当前科目">
            <Pencil className="h-4 w-4" strokeWidth={1.8} />
          </SecondaryButton>
        ) : null}
      </div>

      <InlineMetaRow
        left={<span>{selectedSubject ?? '未选择科目'}</span>}
        right={<span>{students.length} 名学生</span>}
        className="px-1"
      />

      <GradesScoreList
        students={students}
        sortedStudents={sortedStudents}
        selectedSubject={selectedSubject}
        getScore={getScore}
        onRowClick={openScoreEditor}
        onEmptyAction={() => navigate(`/students/${classId}`)}
      />

      <GradesDialogs
        subjectActionOpen={subjectActionOpen}
        setSubjectActionOpen={setSubjectActionOpen}
        selectedSubject={selectedSubject}
        gradesSubjectCount={grades.subjects.length}
        setRenameDraft={setRenameValue}
        setRenameSubjectOpen={setRenameSubjectOpen}
        setDeleteSubjectConfirm={setDeleteSubjectConfirm}
        sortSheetOpen={sortSheetOpen}
        setSortSheetOpen={setSortSheetOpen}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortDir}
        setSortDir={setSortDir}
        exportDialogOpen={exportDialogOpen}
        setExportDialogOpen={(open) => {
          setExportDialogOpen(open)
          if (!open) {
            setExportScope('current')
            setExportPeriodId(null)
          }
        }}
        exportScope={exportScope}
        setExportScope={setExportScope}
        periods={periods}
        exportPeriodId={exportPeriodId}
        setExportPeriodId={setExportPeriodId}
        currentPeriodId={currentPeriodId}
        exportSubmitting={exportSubmitting}
        onExport={handleExportGrades}
        addSubjectOpen={addSubjectOpen}
        setAddSubjectOpen={setAddSubjectOpen}
        newSubjectName={newSubjectName}
        setNewSubjectName={setNewSubjectName}
        onAddSubject={handleAddSubject}
        renameSubjectOpen={renameSubjectOpen}
        renameValue={renameValue}
        setRenameValueInput={setRenameValue}
        onRenameSubject={() => selectedSubject && renameSubjectAction(selectedSubject, renameValue)}
        addPeriodOpen={addPeriodOpen}
        setAddPeriodOpen={setAddPeriodOpen}
        newPeriodName={newPeriodName}
        setNewPeriodName={setNewPeriodName}
        onAddPeriod={handleAddPeriod}
        editingStudentId={editingStudentId}
        setEditingStudentId={setEditingStudentId}
        editingStudentName={editingStudent?.name}
        selectedSubjectLabel={selectedSubject}
        inputRef={inputRef}
        editingValue={editingValue}
        setEditingValue={setEditingValue}
        onSaveScore={saveScore}
        deleteSubjectConfirm={deleteSubjectConfirm}
        setDeleteSubjectConfirmOpen={(open) => !open && setDeleteSubjectConfirm(null)}
        onDeleteSubject={() => deleteSubjectConfirm && doRemoveSubject(deleteSubjectConfirm)}
      />
    </div>
  )
}
