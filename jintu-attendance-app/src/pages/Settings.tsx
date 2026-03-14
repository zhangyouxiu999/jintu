import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { School, LayoutTemplate, Plus, History as HistoryIcon } from 'lucide-react'
import { storage } from '@/store/storage'
import { useClassList } from '@/hooks/useClassList'
import { downloadTemplate, type TemplateMeta } from '@/lib/excelTemplates'
import PageHeader from '@/components/PageHeader'
import TemplateList from '@/components/TemplateList'
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
import { cn } from '@/lib/utils'

export default function Settings() {
  const navigate = useNavigate()
  const mainRef = useRef<HTMLElement>(null)
  const { list: classList, loading: classListLoading, addClass, deleteClass } = useClassList()
  const [, setRefreshKey] = useState(0)
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

      <main ref={mainRef} className="space-y-3 px-4 py-4">
        <section className="rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--outline-variant)]">
          <Accordion
            type="single"
            collapsible
            value={accordionValue}
            onValueChange={setAccordionValue}
            className="w-full"
          >
            <AccordionItem value="classes" className="border-0">
              <AccordionTrigger className="flex min-h-[52px] items-center gap-2.5 px-5 py-3.5 hover:no-underline">
                <School className="h-[17px] w-[17px] shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
                <span className="text-[15px] font-semibold text-[var(--on-surface)]">我的班级</span>
                {!classListLoading && classList.length > 0 && (
                  <span className="text-[13px] text-[var(--on-surface-muted)]">
                    （{classList.find((c) => c.id === currentId)?.name ?? classList[0]?.name ?? '未选'}）
                  </span>
                )}
              </AccordionTrigger>
              {/* 自定义可动画内容区：始终在 DOM 中，用 transition 做展开/收起 */}
              <div
                className={cn(
                  'overflow-hidden transition-[max-height,opacity] duration-300 ease-out',
                  accordionValue === 'classes' ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                <div className="px-5 pb-4 pt-0">
                  <p className="text-[12.5px] text-[var(--on-surface-muted)] leading-relaxed">选择默认班级；列表第一个为默认班级，将显示在首页点名。</p>
                  {classListLoading ? (
                    <p className="mt-3 text-caption text-[var(--on-surface-muted)]">加载中…</p>
                  ) : classList.length === 0 ? (
                    <Button
                      variant="outline"
                      className="mt-3 h-10 w-full rounded-[12px] border-[var(--outline)] text-[14px] font-medium text-[var(--on-surface-variant)] transition-all duration-75 active:scale-[0.98] active:opacity-80"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
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
                        className="mt-2 h-10 w-full rounded-[12px] border-[var(--outline)] text-[14px] font-medium text-[var(--on-surface-variant)] transition-all duration-75 active:scale-[0.98] active:opacity-80"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        添加班级
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </AccordionItem>

            <AccordionItem value="templates" className="border-0 border-t border-[var(--outline-variant)]">
              <AccordionTrigger className="flex min-h-[52px] items-center gap-2.5 px-5 py-3.5 hover:no-underline">
                <LayoutTemplate className="h-[17px] w-[17px] shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
                <span className="text-[15px] font-semibold text-[var(--on-surface)]">模板库</span>
              </AccordionTrigger>
              <div
                className={cn(
                  'overflow-hidden transition-[max-height,opacity] duration-300 ease-out',
                  accordionValue === 'templates' ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'
                )}
              >
                <div className="px-5 pb-4 pt-0">
                  <TemplateList
                    compact
                    downloadingId={templateDownloadingId}
                    onDownload={handleDownloadTemplate}
                  />
                </div>
              </div>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--outline-variant)]">
          <Button
            variant="ghost"
            className="h-14 w-full justify-start gap-2.5 rounded-none border-0 px-5 text-[15px] font-semibold text-[var(--on-surface)] transition-all duration-75 active:bg-[var(--surface-2)] active:scale-[0.99]"
            onClick={() => navigate(currentId ? `/history/${currentId}` : '/history')}
          >
            <HistoryIcon className="h-[17px] w-[17px] shrink-0 text-[var(--primary)]" strokeWidth={1.5} />
            历史考勤
          </Button>
        </section>

        <section className="rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--outline-variant)]">
          <Button
            variant="ghost"
            className="h-14 w-full justify-start rounded-none border-0 px-5 text-[16px] font-medium text-[var(--error)] transition-all duration-75 active:bg-[var(--error-container)] active:scale-[0.99]"
            onClick={() => { storage.saveAuth(false); navigate('/login', { replace: true }) }}
          >
            退出登录
          </Button>
        </section>
      </main>

      <AlertDialog open={!!deleteConfirmClass} onOpenChange={(open) => !open && setDeleteConfirmClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle className="text-dialog-title text-[var(--on-surface)] block text-center">确定删除该班级？</AlertDialogTitle>
            <AlertDialogDescription className="text-caption text-[var(--on-surface-muted)]">
              {deleteConfirmClass ? `删除「${deleteConfirmClass.name}」后，其学生与考勤记录将一并清除，且无法恢复。` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-6 flex justify-end gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>确定删除</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-dialog-title text-[var(--on-surface)]">添加班级</DialogTitle>
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
