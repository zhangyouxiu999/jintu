import { Fragment, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { School, LayoutTemplate, Plus, History as HistoryIcon, RefreshCw, GraduationCap, Trash2 } from 'lucide-react'
import { useCurrentClassId } from '@/components/AppLayout'
import { storage } from '@/store/storage'
import * as gradesStore from '@/store/grades'
import type { GradesPeriod } from '@/types'
import { useClassList } from '@/hooks/useClassList'
import { downloadTemplate, type TemplateMeta } from '@/lib/excelTemplates'
import TemplateList from '@/components/TemplateList'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SwipeableClassRow } from '@/components/SwipeableClassRow'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { showToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

export default function Settings() {
  const navigate = useNavigate()
  const { list: classList, loading: classListLoading, addClass, deleteClass } = useClassList()
  const { currentClassId: currentId, setCurrentClassId } = useCurrentClassId()
  const [accordionValue, setAccordionValue] = useState<string | undefined>('classes')
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<{ id: string; name: string } | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [templateDownloadingId, setTemplateDownloadingId] = useState<string | null>(null)
  const [autoResetAttendance, setAutoResetAttendance] = useState(() => storage.loadAutoResetAttendance())
  const [deleteConfirmPeriod, setDeleteConfirmPeriod] = useState<GradesPeriod | null>(null)
  const [gradesRefreshKey, setGradesRefreshKey] = useState(0)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)

  const gradesPeriods = useMemo(() => {
    void gradesRefreshKey
    if (!currentId) return []
    return gradesStore.getPeriods(currentId)
  }, [currentId, gradesRefreshKey])
  const currentPeriodId = currentId ? storage.loadCurrentPeriodId(currentId) : null

  const handleAddClass = async () => {
    const name = addName.trim()
    if (!name || addSubmitting) return
    setAddSubmitting(true)
    try {
      const id = await addClass(name)
      setCurrentClassId(id)
      setAddName('')
      setAddDialogOpen(false)
      showToast('已添加并设为默认班级', { variant: 'success', duration: 2000 })
    } catch {
      showToast('添加失败，请重试', { variant: 'error' })
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleDownloadTemplate = async (meta: TemplateMeta) => {
    setTemplateDownloadingId(meta.id)
    try {
      await downloadTemplate(meta)
      showToast('已下载', { variant: 'success', duration: 1800 })
    } catch {
      showToast('下载失败，请重试', { variant: 'error' })
    } finally {
      setTemplateDownloadingId(null)
    }
  }

  const handleConfirmDeletePeriod = () => {
    if (!currentId || !deleteConfirmPeriod) return
    const list = gradesStore.getPeriods(currentId)
    if (list.length <= 1) return
    const nextList = list.filter((p) => p.id !== deleteConfirmPeriod.id)
    gradesStore.savePeriods(currentId, nextList)
    setDeleteConfirmPeriod(null)
    setGradesRefreshKey((k) => k + 1)
    showToast('已删除该期成绩单', { variant: 'success', duration: 1800 })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmClass) return
    setDeleteSubmitting(true)
    try {
      const wasCurrent = deleteConfirmClass.id === currentId
      await deleteClass(deleteConfirmClass.id)
      setDeleteConfirmClass(null)
      if (wasCurrent && classList.length > 1) {
        const next = classList.find((c) => c.id !== deleteConfirmClass.id)
        setCurrentClassId(next?.id ?? null)
      } else if (classList.length <= 1) {
        setCurrentClassId(null)
      }
      showToast('已删除', { variant: 'success', duration: 1800 })
    } catch {
      showToast('删除失败，请重试', { variant: 'error' })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <main className="space-y-3 px-4 py-4" aria-label="我的">
        <section className="rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--outline-variant)]">
          <Accordion
            type="single"
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="w-full"
          >
            <AccordionItem value="classes" className="border-0">
              <AccordionTrigger className="flex min-h-[52px] items-center gap-2.5 px-5 py-3.5">
                <School className="h-[17px] w-[17px] shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
                <span className="text-[13px] font-medium text-[var(--on-surface)]">我的班级</span>
                {!classListLoading && classList.length > 0 && (
                  <span className="text-[12px] text-[var(--on-surface-muted)]">
                    （{classList.find((c) => c.id === currentId)?.name ?? classList[0]?.name ?? '未选'}）
                  </span>
                )}
              </AccordionTrigger>
              {/* GPU 友好：grid 0fr/1fr 做高度动画，避免 max-height 触发布局抖动 */}
              <div
                className={cn(
                  'grid',
                  accordionValue === 'classes' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className={cn('min-h-0 overflow-hidden', accordionValue === 'classes' && 'max-h-[70vh]')}>
                  <div className="px-5 pb-4 pt-0">
                  <p className="text-[12px] text-[var(--on-surface-muted)] leading-relaxed">选择默认班级，将作为首页点名使用的班级。</p>
                  {classListLoading ? (
                    <p className="mt-3 text-[12px] text-[var(--on-surface-muted)]">加载中…</p>
                  ) : classList.length === 0 ? (
                    <Button
                      variant="outline"
                      className="mt-3 h-10 w-full rounded-[12px] border-[var(--outline)] text-[12px] font-medium text-[var(--on-surface-variant)]"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                      添加班级
                    </Button>
                  ) : (
                    <div className="mt-px flex flex-col gap-px">
                      {classList.map((cls, index) => (
                        <Fragment key={cls.id}>
                          {index > 0 && <div className="h-px shrink-0 bg-[var(--outline-variant)]" />}
                          <SwipeableClassRow
                            classItem={cls}
                            isCurrent={cls.id === currentId}
                            canDelete={classList.length > 1}
                            onSelect={() => {
                              if (cls.id === currentId) return
                              setCurrentClassId(cls.id)
                              showToast(`已切换到 ${cls.name}`, { variant: 'success', duration: 1800 })
                            }}
                            onDelete={() => {
                              if (classList.length <= 1) return
                              setDeleteConfirmClass({ id: cls.id, name: cls.name })
                            }}
                          />
                        </Fragment>
                      ))}
                      <Button
                        variant="outline"
                        className="h-10 w-full rounded-[12px] border-[var(--outline)] text-[12px] font-medium text-[var(--on-surface-variant)]"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        添加班级
                      </Button>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem value="grades" className="border-0 border-t border-[var(--outline-variant)]">
              <AccordionTrigger className="flex min-h-[52px] items-center gap-2.5 px-5 py-3.5">
                <GraduationCap className="h-[17px] w-[17px] shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
                <span className="text-[13px] font-medium text-[var(--on-surface)]">历史成绩单</span>
                {gradesPeriods.length > 0 && (
                  <span className="text-[12px] text-[var(--on-surface-muted)]">（{gradesPeriods.length} 期）</span>
                )}
              </AccordionTrigger>
              <div
                className={cn(
                  'grid',
                  accordionValue === 'grades' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className={cn('min-h-0 overflow-hidden', accordionValue === 'grades' && 'max-h-[70vh]')}>
                  <div className="px-5 pb-4 pt-0">
                    {!currentId ? (
                      <p className="text-[12px] text-[var(--on-surface-muted)]">请先在「我的班级」选择班级。</p>
                    ) : gradesPeriods.length === 0 ? (
                      <p className="text-[12px] text-[var(--on-surface-muted)]">该班级暂无成绩单，请到成绩页添加。</p>
                    ) : (
                      <div key={gradesRefreshKey} className="mt-px flex flex-col gap-px">
                        {gradesPeriods.map((p, index) => (
                          <Fragment key={p.id}>
                            {index > 0 && <div className="h-px shrink-0 bg-[var(--outline-variant)]" />}
                            <div className="flex min-h-[44px] w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2.5">
                              <Button
                                type="button"
                                variant="ghost"
                                className="flex min-w-0 flex-1 items-center gap-3 text-left text-[13px] font-medium text-[var(--on-surface)] h-auto"
                                onClick={() => navigate(`/grades/${currentId}`, { state: { periodId: p.id } })}
                              >
                                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                                {currentPeriodId === p.id && (
                                  <span className="shrink-0 rounded bg-[var(--primary-container)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--primary)]">
                                    当前期
                                  </span>
                                )}
                              </Button>
                              {gradesPeriods.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="h-8 w-8 shrink-0 rounded-[var(--radius-sm)] text-[var(--on-surface-muted)] active:text-[var(--error)]"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteConfirmPeriod(p)
                                  }}
                                  aria-label={`删除 ${p.name}`}
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                                </Button>
                              )}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </AccordionItem>

            <AccordionItem value="templates" className="border-0 border-t border-[var(--outline-variant)]">
              <AccordionTrigger className="flex min-h-[52px] items-center gap-2.5 px-5 py-3.5">
                <LayoutTemplate className="h-[17px] w-[17px] shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
                <span className="text-[13px] font-medium text-[var(--on-surface)]">模板库</span>
              </AccordionTrigger>
              <div
                className={cn(
                  'grid',
                  accordionValue === 'templates' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                )}
              >
                <div className={cn('min-h-0 overflow-hidden', accordionValue === 'templates' && 'max-h-[70vh]')}>
                  <div className="px-5 pb-4 pt-0">
                  <TemplateList
                    compact
                    downloadingId={templateDownloadingId}
                    onDownload={handleDownloadTemplate}
                  />
                  </div>
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="scroll-section-opt rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--outline-variant)]">
          <Button
            variant="ghost"
            className="h-11 w-full justify-start gap-2.5 rounded-none border-0 px-5 text-[13px] font-medium text-[var(--on-surface)]"
            onClick={() => navigate(currentId ? `/history/${currentId}` : '/history')}
            aria-label="历史考勤"
          >
            <HistoryIcon className="h-[17px] w-[17px] shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
            历史考勤
          </Button>
        </section>

        <section className="scroll-section-opt rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--outline-variant)]">
          <div className="flex h-11 items-center justify-between gap-3 px-5">
            <span className="flex min-w-0 items-center gap-2.5 text-[13px] font-medium text-[var(--on-surface)]">
              <RefreshCw className="h-[17px] w-[17px] shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
              自动重置考勤
            </span>
            <div className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] shrink-0 items-center justify-end">
              <Switch
                aria-label="自动重置考勤"
                checked={autoResetAttendance}
                onChange={() => {
                  const next = !autoResetAttendance
                  setAutoResetAttendance(next)
                  storage.saveAutoResetAttendance(next)
                  showToast(next ? '已开启自动重置考勤' : '已关闭自动重置考勤', { variant: 'success', duration: 1800 })
                }}
              />
            </div>
          </div>
          <p className="px-5 pb-3 pt-0 text-[12px] leading-relaxed text-[var(--on-surface-muted)]">
            开启后，在每天 0 点、12:00、18:00 之后首次打开点名页时，将本班考勤自动重置为「未到」（0 点后均算上午）。
          </p>
        </section>

        <section className="scroll-section-opt rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--outline-variant)]">
          <Button
            variant="ghost"
            className="h-11 w-full justify-start rounded-none border-0 px-5 text-[13px] font-medium text-[var(--on-surface-muted)]"
            onClick={() => setExitConfirmOpen(true)}
            aria-label="退出登录"
          >
            退出登录
          </Button>
        </section>
      </main>

      <AlertDialog open={!!deleteConfirmClass} onOpenChange={(open) => !open && !deleteSubmitting && setDeleteConfirmClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="block text-center text-dialog-title text-[var(--on-surface)]">确定删除该班级？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">
              {deleteConfirmClass ? `删除「${deleteConfirmClass.name}」后，其学生与考勤记录将一并清除，且无法恢复。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <AlertDialogCancel disabled={deleteSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete} disabled={deleteSubmitting}>
              {deleteSubmitting ? '删除中…' : '确定删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="block text-center text-dialog-title text-[var(--on-surface)]">确定退出登录？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">
              退出后需重新登录方可使用。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setExitConfirmOpen(false)
                storage.saveAuth(false)
                navigate('/login', { replace: true })
              }}
            >
              退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteConfirmPeriod} onOpenChange={(open) => !open && setDeleteConfirmPeriod(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="block text-center text-dialog-title text-[var(--on-surface)]">确定删除该期成绩单？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">
              {deleteConfirmPeriod ? `删除「${deleteConfirmPeriod.name}」后，该期成绩数据将清除，且无法恢复。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex flex-row justify-end gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDeletePeriod}>
              确定删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) setAddName('')
        }}
      >
        <DialogContent>
          <DialogHeader className="pb-2">
            <DialogTitle className="text-dialog-title text-[var(--on-surface)]">添加班级</DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            <Input
              className="h-8 min-h-0 border-[var(--outline)] text-[14px] text-[var(--on-surface)] placeholder:text-[var(--on-surface-muted)]"
              placeholder="班级名称"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddClass() }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)} className="h-8 min-h-0 rounded-[var(--radius-sm)] px-2.5 text-[11px]">取消</Button>
              <Button size="sm" onClick={handleAddClass} disabled={!addName.trim() || addSubmitting} className="h-8 min-h-0 rounded-[var(--radius-sm)] px-2.5 text-[11px]">
                {addSubmitting ? '添加中…' : '确定'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
