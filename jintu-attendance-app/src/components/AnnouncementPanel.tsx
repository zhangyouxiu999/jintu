import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { Megaphone, ChevronDown, ChevronUp, Send, Trash2 } from 'lucide-react'
import type { AnnouncementEntity } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { panelOpen, panelClose, DURATION, EASE } from '@/lib/gsap'

type ExpirationType = 'today' | 'permanent' | 'custom'

interface AnnouncementPanelProps {
  list: AnnouncementEntity[]
  onAdd: (content: string, type: ExpirationType) => void
  onDelete: (id: string) => void
}

export default function AnnouncementPanel({ list, onAdd, onDelete }: AnnouncementPanelProps) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const [expirationType, setExpirationType] = useState<ExpirationType>('today')
  const [submitting, setSubmitting] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const handleSubmit = async () => {
    const content = text.trim()
    if (!content || submitting) return
    setSubmitting(true)
    try {
      await onAdd(content, expirationType)
      setText('')
    } finally {
      setSubmitting(false)
    }
  }

  const toggle = () => {
    if (visible) {
      if (panelRef.current) {
        gsap.to(panelRef.current, {
          ...panelClose.to,
          onComplete: () => setVisible(false),
        })
      } else {
        setVisible(false)
      }
    } else {
      setVisible(true)
    }
  }

  useEffect(() => {
    if (!visible) return
    const panel = panelRef.current
    const form = formRef.current
    const listEl = listRef.current
    if (!panel) return

    const ctx = gsap.context(() => {
      gsap.fromTo(panel, panelOpen.from, panelOpen.to)
      if (form) gsap.fromTo(form, { opacity: 0 }, { opacity: 1, duration: DURATION.fast, delay: 0.03, ease: EASE.out })
      if (listEl) {
        const items = listEl.querySelectorAll('li')
        gsap.fromTo(items, { opacity: 0 }, { opacity: 1, duration: DURATION.fast, stagger: 0.02, delay: 0.04, ease: EASE.out })
      }
    })
    return () => ctx.revert()
  }, [visible, list.length])

  const latestText = list.length > 0 ? list[list.length - 1].content : '暂无公告'

  return (
    <div className="relative border-b border-[var(--outline-variant)] bg-[var(--primary-container)]/15">
      <button
        type="button"
        className="flex min-h-9 w-full items-center gap-2 px-[var(--page-x)] py-2 text-left text-caption text-[var(--on-surface)] active:bg-[var(--primary-container)]/25"
        onClick={toggle}
        aria-label={visible ? '收起公告' : '展开公告'}
      >
        <Megaphone className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-label font-medium">
          {latestText}
        </span>
        {visible ? <ChevronUp className="h-4 w-4 shrink-0 text-[var(--on-surface-muted)]" /> : <ChevronDown className="h-4 w-4 shrink-0 text-[var(--on-surface-muted)]" />}
      </button>
      {visible && (
        <div
          ref={panelRef}
          className="absolute left-0 right-0 top-full z-50 overflow-hidden border-b border-[var(--outline-variant)] bg-[var(--surface)] shadow-elevation-2"
          style={{ willChange: 'opacity' }}
        >
          <div className="max-h-[60vh] overflow-auto px-[var(--page-x)] pb-3 pt-2">
            <div ref={formRef} className="flex gap-2 items-center">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="输入新公告…"
                className="h-7 min-h-0 flex-1 rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface-2)] py-0 pl-2.5 pr-2 text-caption"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <select
                value={expirationType}
                onChange={(e) => setExpirationType(e.target.value as ExpirationType)}
                className="w-14 shrink-0 rounded-[var(--radius-sm)] border border-[var(--outline)] bg-[var(--surface-2)] px-1.5 py-1.5 text-tiny text-[var(--on-surface)]"
              >
                <option value="today">今日</option>
                <option value="permanent">永久</option>
              </select>
              <Button
                type="button"
                size="icon"
                className="h-7 w-7 min-h-0 shrink-0 rounded-[var(--radius-sm)] bg-[var(--primary)] py-0 text-[var(--on-primary)]"
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                aria-label="发布"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
            <div className="mt-2.5 border-t border-[var(--outline-variant)] pt-2">
              {list.length === 0 ? (
                <p className="py-2 text-caption text-[var(--on-surface-muted)]">暂无公告，上方输入后发布</p>
              ) : (
                <>
                  <p className="mb-1.5 text-tiny font-medium text-[var(--on-surface-muted)]">已发布 · {list.length} 条</p>
                  <ul ref={listRef} className="max-h-40 space-y-1 overflow-y-auto">
                    {list.map((a, i) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] py-1.5 pl-2.5 pr-1.5"
                      >
                        <span className="w-4 shrink-0 text-tiny tabular-nums text-[var(--on-surface-muted)]">{i + 1}</span>
                        <span className="min-w-0 flex-1 break-words text-caption leading-snug text-[var(--on-surface)]">{a.content}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 min-h-0 shrink-0 rounded-full py-0 text-[var(--on-surface-muted)] hover:text-[var(--error)]" onClick={() => onDelete(a.id)} aria-label="删除">
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
