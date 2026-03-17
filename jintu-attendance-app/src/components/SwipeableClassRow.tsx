import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface ClassItem {
  id: string
  name: string
}

interface SwipeableClassRowProps {
  classItem: ClassItem
  isCurrent: boolean
  isOpen: boolean
  /** 为 false 时不显示删除按钮（如仅剩一个班级时） */
  canDelete?: boolean
  onSwipeOpen: (id: string | null) => void
  onSelect: () => void
  onDelete: () => void
}

export function SwipeableClassRow({
  classItem,
  isCurrent,
  isOpen: _isOpen,
  canDelete = true,
  onSwipeOpen: _onSwipeOpen,
  onSelect,
  onDelete,
}: SwipeableClassRowProps) {
  return (
    <div className="relative overflow-hidden rounded-[12px]">
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() } }}
        className={cn(
          'flex h-11 w-full items-center gap-2 px-4',
          isCurrent
            ? 'bg-[var(--primary)]/[0.07]'
            : 'bg-[var(--surface)]'
        )}
      >
        <span
          className={cn(
            'h-full min-w-0 flex-1 truncate text-left text-[13px] font-medium leading-[2.75rem]',
            isCurrent ? 'text-[var(--primary)]' : 'text-[var(--on-surface)]'
          )}
        >
          {classItem.name}
        </span>
        {isCurrent && (
          <span className="shrink-0 rounded bg-[var(--primary-container)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary)]">
            当前班级
          </span>
        )}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete()
            }}
            className="shrink-0 text-[var(--on-surface-muted)]"
            aria-label="删除"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </Button>
        )}
      </div>
    </div>
  )
}
