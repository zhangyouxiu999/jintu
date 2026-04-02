import { CheckCheck, FileText, Megaphone, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AttendanceBottomBarProps {
  onAllPresent: () => void
  onAllAbsent: () => void
  onAnnouncement: () => void
  onReport: () => void
  allPresentDisabled?: boolean
  allAbsentDisabled?: boolean
  announcementDisabled?: boolean
  reportDisabled?: boolean
  busyAction?: 'all-present' | 'all-absent' | 'report' | null
}

export default function AttendanceBottomBar({
  onAllPresent,
  onAllAbsent,
  onAnnouncement,
  onReport,
  allPresentDisabled = false,
  allAbsentDisabled = false,
  announcementDisabled = false,
  reportDisabled = false,
  busyAction = null,
}: AttendanceBottomBarProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto w-full max-w-[var(--app-max-width)] px-[var(--page-x)] pb-[calc(var(--safe-bottom)+10px)]">
        <div className="pointer-events-auto rounded-[20px] border border-[var(--outline)]/80 bg-[var(--surface)]/97 p-2 shadow-[0_-10px_28px_rgba(94,79,52,0.08)] backdrop-blur-[10px]">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button type="button" onClick={onAllPresent} disabled={allPresentDisabled || busyAction !== null} className="h-auto min-h-[var(--button-md-height)] gap-1.5 rounded-[14px] px-2 py-2 text-[12px] font-medium shadow-none [&_span]:leading-none">
              <CheckCheck className="h-4 w-4" strokeWidth={1.7} />
              {busyAction === 'all-present' ? '处理中…' : '全部已到'}
            </Button>
            <Button type="button" variant="outline" onClick={onAllAbsent} disabled={allAbsentDisabled || busyAction !== null} className="h-auto min-h-[var(--button-md-height)] gap-1.5 rounded-[14px] px-2 py-2 text-[12px] font-medium [&_span]:leading-none">
              <XCircle className="h-4 w-4" strokeWidth={1.7} />
              {busyAction === 'all-absent' ? '处理中…' : '全部未到'}
            </Button>
            <Button type="button" variant="outline" onClick={onAnnouncement} disabled={announcementDisabled || busyAction !== null} className="h-auto min-h-[var(--button-md-height)] gap-1.5 rounded-[14px] px-2 py-2 text-[12px] font-medium [&_span]:leading-none">
              <Megaphone className="h-4 w-4" strokeWidth={1.7} />
              发布公告
            </Button>
            <Button type="button" variant="outline" onClick={onReport} disabled={reportDisabled || busyAction !== null} className="h-auto min-h-[var(--button-md-height)] gap-1.5 rounded-[14px] px-2 py-2 text-[12px] font-medium [&_span]:leading-none">
              <FileText className="h-4 w-4" strokeWidth={1.7} />
              {busyAction === 'report' ? '生成中…' : '生成报告'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
