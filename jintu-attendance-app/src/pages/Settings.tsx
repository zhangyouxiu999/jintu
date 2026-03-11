import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, School, LayoutTemplate, Plus, Download } from 'lucide-react'
import { storage } from '@/store/storage'
import { useClassList } from '@/hooks/useClassList'
import { EXCEL_TEMPLATES, downloadTemplate, type TemplateMeta } from '@/lib/excelTemplates'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SwipeableClassRow } from '@/components/SwipeableClassRow'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { animateStagger } from '@/lib/gsap'
import { showToast } from '@/lib/toast'

export default function Settings() {
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)
  const { list: classList, loading: classListLoading, addClass, deleteClass } = useClassList()
  const [refreshKey, setRefreshKey] = useState(0)
  const currentId = storage.loadCurrentClassId()
  const [accordionValue, setAccordionValue] = useState<string | undefined>('classes')
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null)
  const [deleteConfirmClass, setDeleteConfirmClass] = useState<{ id: string; name: string } | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [templateDownloadingId, setTemplateDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    const revert = animateStagger(mainRef.current, ':scope > section')
    return revert
  }, [])

  const handleAddClass = async () => {
    const name = addName.trim()
    if (!name || addSubmitting) return
    setAddSubmitting(true)
    try {
      const id = await addClass(name)
      storage.saveCurrentClassId(id)
      setRefreshKey((k) => k + 1)
      setAddName('')
      setAddDialogOpen(false)
      showToast('已添加并设为默认班级', { variant: 'success', duration: 2000 })
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

  const handleConfirmDelete = async () => {
    if (!deleteConfirmClass) return
    const wasCurrent = deleteConfirmClass.id === currentId
    await deleteClass(deleteConfirmClass.id)
    setDeleteConfirmClass(null)
    setOpenSwipeId(null)
    if (wasCurrent && classList.length > 1) {
      const next = classList.find((c) => c.id !== deleteConfirmClass.id)
      if (next) storage.saveCurrentClassId(next.id)
    } else if (classList.length <= 1) {
      storage.saveCurrentClassId(null)
    }
    setRefreshKey((k) => k + 1)
    showToast('已删除', { variant: 'success', duration: 1800 })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader title="设置" />

      <main ref={mainRef} className="space-y-4 px-[var(--page-x)] py-4">
        <section className="card-soft overflow-hidden p-0">
          <Accordion
            type="single"
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="w-full"
          >
            <AccordionItem value="classes" className="border-0">
              <AccordionTrigger className="flex items-center gap-2 px-5 py-4 hover:no-underline">
                <School className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="text-label text-[var(--on-surface)]">我的班级</span>
                {!classListLoading && classList.length > 0 && (
                  <span className="text-caption text-[var(--on-surface-muted)]">
                    （{classList.find((c) => c.id === currentId)?.name ?? classList[0]?.name ?? '未选'}）
                  </span>
                )}
              </AccordionTrigger>
              {/* 自定义可动画内容区：始终在 DOM 中，用 transition 做展开/收起 */}
              <div
                className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
                style={{
                  maxHeight: accordionValue === 'classes' ? '70vh' : '0',
                  opacity: accordionValue === 'classes' ? 1 : 0,
                }}
              >
                <div className="px-5 pb-4 pt-0">
                  <p className="text-caption text-[var(--on-surface-muted)]">选择默认班级；列表第一个为默认班级，将显示在首页点名。</p>
                  {classListLoading ? (
                    <p className="mt-3 text-caption text-[var(--on-surface-muted)]">加载中…</p>
                  ) : classList.length === 0 ? (
                    <Button
                      variant="outline"
                      className="mt-3 h-9 w-full rounded-[var(--radius-sm)] border-[var(--outline)] text-caption font-medium text-[var(--on-surface)]"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      添加班级
                    </Button>
                  ) : (
                    <div className="mt-3 space-y-1">
                      {classList.map((cls) => (
<SwipeableClassRow
                        key={cls.id}
                        classItem={cls}
                        isCurrent={cls.id === currentId}
                        isOpen={openSwipeId === cls.id}
                        canDelete={classList.length > 1}
                        onSwipeOpen={setOpenSwipeId}
                          onSelect={() => {
                            if (cls.id === currentId) return
                            storage.saveCurrentClassId(cls.id)
                            setRefreshKey((k) => k + 1)
                            showToast(`已切换到 ${cls.name}`, { variant: 'success', duration: 1800 })
                          }}
                          onDelete={() => {
                          if (classList.length <= 1) return
                          setDeleteConfirmClass({ id: cls.id, name: cls.name })
                        }}
                        />
                      ))}
                      <Button
                        variant="outline"
                        className="mt-2 h-9 w-full rounded-[var(--radius-sm)] border-[var(--outline)] text-caption font-medium text-[var(--on-surface)]"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        添加班级
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </AccordionItem>

            <AccordionItem value="templates" className="border-0 border-t border-[var(--outline-variant)]">
              <AccordionTrigger className="flex items-center gap-2 px-5 py-4 hover:no-underline">
                <LayoutTemplate className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="text-label text-[var(--on-surface)]">模板库</span>
              </AccordionTrigger>
              <div
                className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
                style={{
                  maxHeight: accordionValue === 'templates' ? '70vh' : '0',
                  opacity: accordionValue === 'templates' ? 1 : 0,
                }}
              >
                <div className="px-5 pb-4 pt-0">
                  <ul className="mt-2 space-y-1">
                    {EXCEL_TEMPLATES.map((meta) => (
                      <li
                        key={meta.id}
                        className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] py-2 pr-1"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-container)]/50">
                            <FileSpreadsheet className="h-4 w-4 text-[var(--primary)]" />
                          </div>
                          <span className="truncate text-caption font-medium text-[var(--on-surface)]">{meta.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full text-[var(--on-surface-variant)]"
                          onClick={() => handleDownloadTemplate(meta)}
                          disabled={templateDownloadingId !== null}
                          aria-label={`下载 ${meta.fileName}`}
                        >
                          {templateDownloadingId === meta.id ? (
                            <span className="text-tiny text-[var(--on-surface-muted)]">…</span>
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="card-soft overflow-hidden p-0">
          <Button
            variant="ghost"
            className="h-[var(--touch-target)] w-full justify-start rounded-none border-0 px-5 text-label font-medium text-[var(--on-surface)]"
            onClick={() => { storage.saveAuth(false); navigate('/login', { replace: true }) }}
          >
            退出登录
          </Button>
        </section>
      </main>

      <AlertDialog open={!!deleteConfirmClass} onOpenChange={(open) => !open && setDeleteConfirmClass(null)}>
        <AlertDialogContent className="left-1/2 right-auto top-1/2 bottom-auto flex h-auto min-h-0 max-h-[66.67vh] w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-title text-[var(--on-surface)] block text-center">确定删除该班级？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">
              {deleteConfirmClass ? `删除「${deleteConfirmClass.name}」后，其学生与考勤记录将一并清除，且无法恢复。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogCancel className="!h-8 min-h-0 rounded-[var(--radius-sm)] !border-[var(--outline)] !bg-[var(--surface)] px-3 py-0 text-caption !text-[var(--on-surface)]">取消</AlertDialogCancel>
            <AlertDialogAction className="!h-8 min-h-0 rounded-[var(--radius-sm)] border-0 !bg-[var(--primary)] px-3 py-0 !text-white text-caption" onClick={handleConfirmDelete}>确定删除</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="left-1/2 right-auto top-1/2 bottom-auto w-[min(calc(100vw-2rem),28rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border-0 bg-[var(--surface)] p-6 shadow-elevation-2">
          <DialogHeader>
            <DialogTitle className="text-title text-[var(--on-surface)]">添加班级</DialogTitle>
            <DialogDescription className="text-caption text-[var(--on-surface-muted)]">输入新班级名称</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            <Input
              className="border-[var(--outline)] text-[var(--on-surface)]"
              placeholder="班级名称"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddClass() }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)} className="rounded-[var(--radius-sm)]">取消</Button>
              <Button size="sm" onClick={handleAddClass} disabled={!addName.trim() || addSubmitting} className="rounded-[var(--radius-sm)]">
                {addSubmitting ? '添加中…' : '确定'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
