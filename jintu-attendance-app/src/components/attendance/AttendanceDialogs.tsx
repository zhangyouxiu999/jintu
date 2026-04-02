import { Plus, Send, X } from 'lucide-react'
import type { AnnouncementExpirationType } from '@/types'
import { PERIOD_NAMES } from '@/lib/period'
import { today } from '@/lib/date'
import { cn } from '@/lib/utils'
import { FormSheet } from '@/components/ui/app-ui'
import { Button } from '@/components/ui/button'
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

interface AttendanceDialogsProps {
  slotReminderOpen: boolean
  setSlotReminderOpen: (open: boolean) => void
  slotReminderLabel: string
  clearDraftDialogOpen: boolean
  setClearDraftDialogOpen: (open: boolean) => void
  onClearDraft: () => Promise<void>
  addAnnouncementOpen: boolean
  handleAddAnnouncementDialogClose: (open: boolean) => void
  addAnnouncementCancelConfirmOpen: boolean
  setAddAnnouncementCancelConfirmOpen: (open: boolean) => void
  closeAddAnnouncementDialog: () => void
  announcementRows: string[]
  setAnnouncementRow: (index: number, value: string) => void
  removeAnnouncementRow: (index: number) => void
  addAnnouncementRow: () => void
  announcementExpiry: AnnouncementExpirationType
  setAnnouncementExpiry: (value: AnnouncementExpirationType) => void
  announcementSubmitting: boolean
  publishAnnouncementDisabled: boolean
  onPublishAnnouncement: () => Promise<void>
  reportDialogOpen: boolean
  setReportDialogOpen: (open: boolean) => void
  reportText: string
  period: number
}

export default function AttendanceDialogs({
  slotReminderOpen,
  setSlotReminderOpen,
  slotReminderLabel,
  clearDraftDialogOpen,
  setClearDraftDialogOpen,
  onClearDraft,
  addAnnouncementOpen,
  handleAddAnnouncementDialogClose,
  addAnnouncementCancelConfirmOpen,
  setAddAnnouncementCancelConfirmOpen,
  closeAddAnnouncementDialog,
  announcementRows,
  setAnnouncementRow,
  removeAnnouncementRow,
  addAnnouncementRow,
  announcementExpiry,
  setAnnouncementExpiry,
  announcementSubmitting,
  publishAnnouncementDisabled,
  onPublishAnnouncement,
  reportDialogOpen,
  setReportDialogOpen,
  reportText,
  period,
}: AttendanceDialogsProps) {
  return (
    <>
      <AlertDialog open={slotReminderOpen} onOpenChange={setSlotReminderOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              已进入{slotReminderLabel}时段
            </AlertDialogTitle>
            <AlertDialogDescription>
              系统不会自动清空数据。如需从空白开始，可手动清空当前时段草稿。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex gap-2">
            <AlertDialogCancel>稍后处理</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onClearDraft()}>清空当前草稿</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearDraftDialogOpen} onOpenChange={setClearDraftDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定清空当前草稿？</AlertDialogTitle>
            <AlertDialogDescription>只会清空当前时段的草稿，不会影响已确认历史。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex gap-2">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onClearDraft()}>确定清空</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <FormSheet
        open={addAnnouncementOpen}
        onOpenChange={handleAddAnnouncementDialogClose}
        title="发布公告"
        className="max-h-[78dvh]"
      >
        <div className="space-y-4">
          <div className="max-h-[42dvh] space-y-2 overflow-y-auto pr-1">
            {announcementRows.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`公告 ${index + 1}`}
                  value={value}
                  onChange={(e) => setAnnouncementRow(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addAnnouncementRow()
                    }
                  }}
                />
                {announcementRows.length > 1 ? (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeAnnouncementRow(index)} aria-label="删除本条" className="shrink-0 rounded-[var(--radius-sm)] text-[var(--on-surface-muted)]">
                    <X className="h-5 w-5" strokeWidth={1.5} />
                  </Button>
                ) : null}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addAnnouncementRow} className="w-full rounded-[var(--radius-sm)] border-dashed px-3 text-[14px] text-[var(--on-surface-muted)] [&_svg]:!size-3.5">
              <Plus className="mr-1" strokeWidth={1.5} />
              添加一条
            </Button>
          </div>
          <div className="flex overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-1">
            {(['today', 'permanent'] as const).map((item) => (
              <Button
                key={item}
                type="button"
                variant="ghost"
                onClick={() => setAnnouncementExpiry(item)}
                className={cn(
                  'flex-1 rounded-[9px] py-2 text-[14px] font-medium',
                  announcementExpiry === item
                    ? 'bg-[var(--surface)] text-[var(--on-surface)] shadow-[0_1px_4px_rgba(0,0,0,0.08)]'
                    : 'text-[var(--on-surface-muted)]'
                )}
              >
                {item === 'today' ? '今日有效' : '永久'}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={() => handleAddAnnouncementDialogClose(false)} className="flex-1 rounded-[var(--radius-sm)] px-4 text-[14px]">取消</Button>
            <Button disabled={publishAnnouncementDisabled || announcementSubmitting} onClick={() => void onPublishAnnouncement()} className="flex-1 rounded-[var(--radius-sm)] px-4 text-[14px] [&_svg]:!size-3.5">
              <Send className="mr-1" strokeWidth={1.5} />
              发布公告
            </Button>
          </div>
        </div>
      </FormSheet>

      <AlertDialog open={addAnnouncementCancelConfirmOpen} onOpenChange={setAddAnnouncementCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>放弃当前内容？</AlertDialogTitle>
            <AlertDialogDescription>未发布的公告不会保存。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 flex gap-2">
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                closeAddAnnouncementDialog()
                setAddAnnouncementCancelConfirmOpen(false)
              }}
            >
              确定放弃
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <FormSheet
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        title="生成报告"
        className="max-h-[80dvh]"
      >
        <div className="text-[12px] font-medium text-[var(--on-surface-muted)]">
          {today()} · {PERIOD_NAMES[period]}
        </div>
        <div className="space-y-4">
          <div className="max-h-[48dvh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--outline-variant)] bg-[var(--surface-2)] px-4 py-3">
            <pre className="whitespace-pre-wrap text-[14px] leading-6 text-[var(--on-surface)]">
              {reportText}
            </pre>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)} className="w-full rounded-[var(--radius-sm)] px-4 text-[14px]">关闭</Button>
          </div>
        </div>
      </FormSheet>
    </>
  )
}
