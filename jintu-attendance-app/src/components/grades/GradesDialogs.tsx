import { Pencil, Trash2 } from 'lucide-react'
import type { GradesPeriod } from '@/types'
import { FormSheet, ListSection, OverflowSheet, SimpleListRow } from '@/components/ui/app-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface GradesDialogsProps {
  subjectActionOpen: boolean
  setSubjectActionOpen: (open: boolean) => void
  selectedSubject: string | null
  gradesSubjectCount: number
  setRenameDraft: (value: string) => void
  setRenameSubjectOpen: (open: boolean) => void
  setDeleteSubjectConfirm: (value: string | null) => void
  sortSheetOpen: boolean
  setSortSheetOpen: (open: boolean) => void
  sortBy: 'order' | 'name' | 'total'
  sortDir: 'asc' | 'desc'
  setSortBy: (value: 'order' | 'name' | 'total') => void
  setSortDir: (value: 'asc' | 'desc') => void
  exportDialogOpen: boolean
  setExportDialogOpen: (open: boolean) => void
  exportScope: 'current' | 'all'
  setExportScope: (value: 'current' | 'all') => void
  periods: GradesPeriod[]
  exportPeriodId: string | null
  setExportPeriodId: (value: string | null) => void
  currentPeriodId: string | null
  exportSubmitting: boolean
  onExport: () => Promise<void>
  addSubjectOpen: boolean
  setAddSubjectOpen: (open: boolean) => void
  newSubjectName: string
  setNewSubjectName: (value: string) => void
  onAddSubject: () => void
  renameSubjectOpen: boolean
  renameValue: string
  setRenameValueInput: (value: string) => void
  onRenameSubject: () => void
  addPeriodOpen: boolean
  setAddPeriodOpen: (open: boolean) => void
  newPeriodName: string
  setNewPeriodName: (value: string) => void
  onAddPeriod: () => void
  editingStudentId: string | null
  setEditingStudentId: (value: string | null) => void
  editingStudentName?: string
  selectedSubjectLabel?: string | null
  inputRef: React.RefObject<HTMLInputElement>
  editingValue: string
  setEditingValue: (value: string) => void
  onSaveScore: () => void
  deleteSubjectConfirm: string | null
  setDeleteSubjectConfirmOpen: (open: boolean) => void
  onDeleteSubject: () => void
}

export default function GradesDialogs({
  subjectActionOpen,
  setSubjectActionOpen,
  selectedSubject,
  gradesSubjectCount,
  setRenameDraft,
  setRenameSubjectOpen,
  setDeleteSubjectConfirm,
  sortSheetOpen,
  setSortSheetOpen,
  sortBy,
  sortDir,
  setSortBy,
  setSortDir,
  exportDialogOpen,
  setExportDialogOpen,
  exportScope,
  setExportScope,
  periods,
  exportPeriodId,
  setExportPeriodId,
  currentPeriodId,
  exportSubmitting,
  onExport,
  addSubjectOpen,
  setAddSubjectOpen,
  newSubjectName,
  setNewSubjectName,
  onAddSubject,
  renameSubjectOpen,
  renameValue,
  setRenameValueInput,
  onRenameSubject,
  addPeriodOpen,
  setAddPeriodOpen,
  newPeriodName,
  setNewPeriodName,
  onAddPeriod,
  editingStudentId,
  setEditingStudentId,
  editingStudentName,
  selectedSubjectLabel,
  inputRef,
  editingValue,
  setEditingValue,
  onSaveScore,
  deleteSubjectConfirm,
  setDeleteSubjectConfirmOpen,
  onDeleteSubject,
}: GradesDialogsProps) {
  return (
    <>
      <OverflowSheet open={subjectActionOpen} onOpenChange={setSubjectActionOpen} title={selectedSubject ?? '当前科目'}>
        <ListSection>
          <SimpleListRow
            title="重命名科目"
            leading={<Pencil className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />}
            onClick={() => {
              setRenameDraft(selectedSubject ?? '')
              setRenameSubjectOpen(true)
              setSubjectActionOpen(false)
            }}
            disabled={!selectedSubject}
          />
          <div className="mx-4 h-px bg-[var(--outline-variant)]" />
          <SimpleListRow
            title="删除科目"
            leading={<Trash2 className="h-4 w-4 text-[var(--error)]" strokeWidth={1.8} />}
            titleClassName="text-[var(--error)]"
            onClick={() => {
              if (!selectedSubject) return
              setDeleteSubjectConfirm(selectedSubject)
              setSubjectActionOpen(false)
            }}
            disabled={!selectedSubject || gradesSubjectCount <= 1}
          />
        </ListSection>
      </OverflowSheet>

      <OverflowSheet open={sortSheetOpen} onOpenChange={setSortSheetOpen} title="排序方式">
        <ListSection>
          {[
            { id: 'order', label: '默认顺序', onSelect: () => { setSortBy('order'); setSortDir('asc') } },
            { id: 'name-asc', label: '按姓名升序', onSelect: () => { setSortBy('name'); setSortDir('asc') } },
            { id: 'name-desc', label: '按姓名降序', onSelect: () => { setSortBy('name'); setSortDir('desc') } },
            { id: 'total-desc', label: '按总分从高到低', onSelect: () => { setSortBy('total'); setSortDir('desc') } },
            { id: 'total-asc', label: '按总分从低到高', onSelect: () => { setSortBy('total'); setSortDir('asc') } },
          ].map((item, index) => (
            <div key={item.id}>
              {index > 0 ? <div className="mx-4 h-px bg-[var(--outline-variant)]" /> : null}
              <SimpleListRow
                title={item.label}
                trailing={
                  <span className="text-[12px] text-[var(--on-surface-muted)]">
                    {((item.id === 'order' && sortBy === 'order')
                      || (item.id === 'name-asc' && sortBy === 'name' && sortDir === 'asc')
                      || (item.id === 'name-desc' && sortBy === 'name' && sortDir === 'desc')
                      || (item.id === 'total-desc' && sortBy === 'total' && sortDir === 'desc')
                      || (item.id === 'total-asc' && sortBy === 'total' && sortDir === 'asc'))
                      ? '当前'
                      : '切换'}
                  </span>
                }
                onClick={() => {
                  item.onSelect()
                  setSortSheetOpen(false)
                }}
              />
            </div>
          ))}
        </ListSection>
      </OverflowSheet>

      <FormSheet open={exportDialogOpen} onOpenChange={setExportDialogOpen} title="导出成绩单">
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-[13px] text-[var(--on-surface)]">
            <input
              type="radio"
              name="exportScope"
              checked={exportScope === 'current'}
              onChange={() => setExportScope('current')}
              className="h-3.5 w-3.5 accent-[var(--primary)]"
            />
            导出当前期
          </label>
          {exportScope === 'current' ? (
            <div className="flex flex-wrap gap-2">
              {periods.map((period) => {
                const isSelected = period.id === (exportPeriodId ?? currentPeriodId)
                return (
                  <Button
                    key={period.id}
                    type="button"
                    variant={isSelected ? 'secondary' : 'outline'}
                    className={cn(
                      'rounded-full px-3 text-[14px]',
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-container)] text-[var(--primary)]'
                        : 'border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface-muted)]'
                    )}
                    onClick={() => setExportPeriodId(period.id)}
                  >
                    {period.name}
                  </Button>
                )
              })}
            </div>
          ) : null}
          <label className="flex items-center gap-3 text-[13px] text-[var(--on-surface)]">
            <input
              type="radio"
              name="exportScope"
              checked={exportScope === 'all'}
              onChange={() => setExportScope('all')}
              className="h-3.5 w-3.5 accent-[var(--primary)]"
            />
            导出全部 {periods.length} 期
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(false)} className="flex-1">取消</Button>
          <Button onClick={() => void onExport()} disabled={exportSubmitting} className="flex-1">
            {exportSubmitting ? '导出中…' : '确定导出'}
          </Button>
        </div>
      </FormSheet>

      <FormSheet open={addSubjectOpen} onOpenChange={setAddSubjectOpen} title="添加科目">
        <div className="py-1">
          <Input
            placeholder="科目名"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddSubject()}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setAddSubjectOpen(false)} className="flex-1">取消</Button>
          <Button onClick={onAddSubject} disabled={!newSubjectName.trim()} className="flex-1">添加</Button>
        </div>
      </FormSheet>

      <FormSheet open={renameSubjectOpen} onOpenChange={setRenameSubjectOpen} title="重命名科目">
        <div className="py-1">
          <Input
            placeholder="科目名"
            value={renameValue}
            onChange={(e) => setRenameValueInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRenameSubject()
            }}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setRenameSubjectOpen(false)} className="flex-1">取消</Button>
          <Button onClick={onRenameSubject} disabled={!renameValue.trim()} className="flex-1">保存</Button>
        </div>
      </FormSheet>

      <FormSheet open={addPeriodOpen} onOpenChange={setAddPeriodOpen} title="新建成绩单">
        <div className="py-1">
          <Input
            placeholder="如：期中、期末"
            value={newPeriodName}
            onChange={(e) => setNewPeriodName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddPeriod()}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setAddPeriodOpen(false)} className="flex-1">取消</Button>
          <Button onClick={onAddPeriod} className="flex-1">添加</Button>
        </div>
      </FormSheet>

      <FormSheet
        open={!!editingStudentId}
        onOpenChange={(open) => {
          if (!open) setEditingStudentId(null)
        }}
        title={editingStudentName ?? '录入分数'}
      >
        {selectedSubjectLabel ? (
          <div className="text-[12px] font-medium text-[var(--on-surface-muted)]">{selectedSubjectLabel} 分数</div>
        ) : null}
        <div className="py-1">
          <Input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onSaveScore()
              }
            }}
            placeholder="输入分数"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setEditingStudentId(null)} className="flex-1">取消</Button>
          <Button onClick={onSaveScore} className="flex-1">保存</Button>
        </div>
      </FormSheet>

      <AlertDialog open={!!deleteSubjectConfirm} onOpenChange={setDeleteSubjectConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定删除该科目？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSubjectConfirm ? `删除科目「${deleteSubjectConfirm}」后，该列成绩将一并清除，且无法恢复。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void onDeleteSubject()}>
              确定删除
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
