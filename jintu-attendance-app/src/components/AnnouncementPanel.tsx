import { Megaphone, X, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { AnnouncementEntity } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AnnouncementPanelProps {
  list: AnnouncementEntity[]
  onDelete: (id: string) => void
}

export default function AnnouncementPanel({ list, onDelete }: AnnouncementPanelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting)
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0,
      }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinelRef} className="h-0 w-full" aria-hidden />
      <section
        className={cn(
          'sticky z-20 mb-3 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_0_rgba(60,60,67,0.06)]',
          isSticky && 'shadow-[0_2px_12px_rgba(0,0,0,0.08)]'
        )}
        style={{ top: 'var(--space-12, 12px)' }}
        aria-label="公告"
      >
        {/* 点击整行展开/收起 */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => setExpanded((e) => !e)}
          className="flex h-auto min-h-0 w-full items-center justify-between gap-2 px-4 py-2 text-left"
          aria-expanded={expanded}
          aria-label={expanded ? '收起公告' : '展开公告'}
        >
          <span className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.5} />
            <span className="text-[13px] font-semibold text-[var(--on-surface-muted)]">公告</span>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--on-surface-muted)]">
              {list.length}
            </span>
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-[var(--on-surface-muted)]',
              expanded && 'rotate-180'
            )}
            strokeWidth={1.5}
          />
        </Button>

        {/* 展开时显示列表 */}
        <div
          className={cn(
            'grid',
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="min-h-0 overflow-hidden">
            {list.length > 0 ? (
              <div className="border-t border-[var(--outline-variant)] px-4 py-3">
                <ul className="space-y-1.5 max-h-[240px] overflow-y-auto">
                  {list.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 rounded-[10px] bg-[var(--surface-2)]/80 py-1.5 pl-3 pr-2"
                    >
                      <span className="min-w-0 flex-1 break-words text-[14px] leading-snug text-[var(--on-surface)]">
                        {a.content}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium',
                          a.expirationType === 'permanent'
                            ? 'bg-[var(--surface-2)] text-[var(--on-surface-muted)]'
                            : 'bg-[var(--primary-container)] text-[var(--primary)]'
                        )}
                      >
                        {a.expirationType === 'permanent' ? '永久' : '今日'}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(a.id)
                        }}
                        className="h-8 w-8 shrink-0 rounded-full p-0 text-[var(--on-surface-muted)] active:text-[var(--error)]"
                        aria-label="删除"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="border-t border-[var(--outline-variant)] px-4 py-4 text-center text-[13px] text-[var(--on-surface-muted)]">
                暂无公告
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
