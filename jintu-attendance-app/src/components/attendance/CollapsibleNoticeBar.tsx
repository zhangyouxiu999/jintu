import { ChevronDown, Megaphone, X } from 'lucide-react'
import type { AnnouncementEntity } from '@/types'
import { Button } from '@/components/ui/button'
import { AppDivider } from '@/components/ui/app-ui'
import { SurfaceCard } from '@/components/ui/mobile-ui'
import { cn } from '@/lib/utils'

interface CollapsibleNoticeBarProps {
  announcements: AnnouncementEntity[]
  expanded: boolean
  onToggle: () => void
  onDelete: (announcementId: string) => void
}

export default function CollapsibleNoticeBar({
  announcements,
  expanded,
  onToggle,
  onDelete,
}: CollapsibleNoticeBarProps) {
  if (announcements.length === 0) return null

  return (
    <SurfaceCard density="compact" className="overflow-hidden p-0 shadow-none">
      <Button
        type="button"
        variant="ghost"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? '收起公告' : '展开公告'}
        className="flex h-auto w-full items-center gap-3 px-4 py-2.5 text-left [&_span]:leading-none"
      >
        <Megaphone className="h-4 w-4 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.8} />
        <div className="min-w-0 flex-1 self-center">
          <p className="truncate text-[13px] leading-5 text-[var(--on-surface)]">
            {announcements[0]?.content}
          </p>
        </div>
        <span className="shrink-0 self-center text-[12px] text-[var(--on-surface-muted)]">{announcements.length}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-[var(--on-surface-muted)] transition-transform', expanded && 'rotate-180')} strokeWidth={1.8} />
      </Button>

      {expanded ? (
        <>
          <AppDivider />
          <div className="space-y-2 px-3 py-3">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-center gap-2 rounded-[12px] bg-[var(--surface-2)]/80 px-3 py-2.5"
              >
                <span className="min-w-0 flex-1 break-words text-[13px] leading-5 text-[var(--on-surface)]">
                  {announcement.content}
                </span>
                <span className="shrink-0 self-center text-[12px] leading-none text-[var(--on-surface-muted)]">
                  {announcement.expirationType === 'permanent' ? '永久' : '今日'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(announcement.id)}
                  className="h-8 w-8 shrink-0 rounded-full p-0 text-[var(--on-surface-muted)]"
                  aria-label="删除"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </SurfaceCard>
  )
}
