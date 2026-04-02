import { useMemo, useState } from 'react'
import { LogOut, Plus, RefreshCw, School, Settings2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCurrentClassId } from '@/components/AppLayout'
import TemplateList from '@/components/TemplateList'
import { useClassList } from '@/hooks/useClassList'
import { ListSection, SimpleListRow, SummaryStrip } from '@/components/ui/app-ui'
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
import { Switch } from '@/components/ui/switch'
import { downloadTemplate, type TemplateMeta } from '@/lib/excelTemplates'
import { showToast } from '@/lib/toast'
import { storage } from '@/store/storage'

export default function MorePage() {
  const navigate = useNavigate()
  const { currentClassId, setCurrentClassId } = useCurrentClassId()
  const { list } = useClassList()
  const [templateDownloadingId, setTemplateDownloadingId] = useState<string | null>(null)
  const [slotReminderEnabled, setSlotReminderEnabled] = useState(() => storage.loadAutoResetAttendance())
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const currentClass = useMemo(
    () => list.find((item) => item.id === currentClassId) ?? list[0] ?? null,
    [currentClassId, list]
  )
  const otherClasses = useMemo(
    () => list.filter((item) => item.id !== currentClass?.id),
    [currentClass?.id, list]
  )
  const totalStudents = useMemo(
    () => list.reduce((sum, item) => sum + item.studentOrder.length, 0),
    [list]
  )

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

  const openClass = (classId: string) => {
    setCurrentClassId(classId)
    navigate(`/attendance/${classId}`)
  }

  const getDisplayClassName = (name?: string | null) => {
    const trimmed = name?.trim()
    return trimmed ? trimmed : '未命名班级'
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <SummaryStrip
        className="grid grid-cols-3 gap-2 overflow-visible pb-0"
        items={[
          { label: '班级', value: list.length, tone: 'primary' },
          { label: '学生', value: totalStudents, tone: 'neutral' },
          { label: '提醒', value: slotReminderEnabled ? '开启' : '关闭', tone: slotReminderEnabled ? 'success' : 'neutral' },
        ]}
      />

      <ListSection>
        <div className="border-b border-[var(--outline-variant)]/80 px-4 py-2.5">
          <div className="text-[11px] font-medium tracking-[0.02em] text-[var(--on-surface-muted)]">
            当前班级
          </div>
        </div>
        <SimpleListRow
          title={currentClass ? getDisplayClassName(currentClass.name) : '未创建班级'}
          description={currentClass ? `${currentClass.studentOrder.length}位学生` : undefined}
          leading={<School className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />}
          onClick={() => {
            if (currentClass) openClass(currentClass.id)
            else navigate('/classes')
          }}
          trailing={currentClass ? <span className="rounded-full bg-[var(--primary-container)] px-2.5 py-1 text-[12px] font-medium leading-none text-[var(--primary)]">当前</span> : undefined}
        />
        {otherClasses.length > 0 ? <div className="mx-4 h-px bg-[var(--outline-variant)]" /> : null}
        {otherClasses.map((classItem, index) => (
          <div key={classItem.id}>
            {index > 0 ? <div className="mx-4 h-px bg-[var(--outline-variant)]" /> : null}
            <SimpleListRow
              title={getDisplayClassName(classItem.name)}
              description={`${classItem.studentOrder.length}位学生`}
              leading={<School className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />}
              onClick={() => openClass(classItem.id)}
            />
          </div>
        ))}
        <div className="mx-4 h-px bg-[var(--outline-variant)]" />
        <SimpleListRow
          title="班级管理"
          leading={<Settings2 className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />}
          onClick={() => navigate('/classes')}
        />
        <div className="mx-4 h-px bg-[var(--outline-variant)]" />
        <SimpleListRow
          title="新增班级"
          leading={<Plus className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />}
          onClick={() => navigate('/classes')}
        />
      </ListSection>

      <ListSection>
        <div className="border-b border-[var(--outline-variant)]/80 px-4 py-2.5">
          <div className="text-[11px] font-medium tracking-[0.02em] text-[var(--on-surface-muted)]">
            模板下载
          </div>
        </div>
        <div className="px-4 py-2">
          <TemplateList
            compact
            downloadingId={templateDownloadingId}
            onDownload={handleDownloadTemplate}
          />
        </div>
      </ListSection>

      <ListSection>
        <div className="flex min-h-[60px] items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <RefreshCw className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />
            <div className="min-w-0">
              <p className="text-[15px] font-medium text-[var(--on-surface)]">新时段提醒</p>
            </div>
          </div>
          <Switch
            aria-label="新时段提醒"
            checked={slotReminderEnabled}
            onChange={() => {
              const next = !slotReminderEnabled
              setSlotReminderEnabled(next)
              storage.saveAutoResetAttendance(next)
              showToast(next ? '已开启新时段提醒' : '已关闭新时段提醒', {
                variant: 'success',
                duration: 1800,
              })
            }}
          />
        </div>
      </ListSection>

      <ListSection>
        <SimpleListRow
          title="退出登录"
          leading={<LogOut className="h-4 w-4 text-[var(--error)]" strokeWidth={1.8} />}
          titleClassName="text-[var(--error)]"
          onClick={() => setLogoutConfirmOpen(true)}
        />
      </ListSection>

      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              确定退出登录？
            </AlertDialogTitle>
            <AlertDialogDescription>
              退出后需要重新输入账号和密码。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setLogoutConfirmOpen(false)
                storage.saveAuth(false)
                navigate('/login', { replace: true })
              }}
            >
              退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
