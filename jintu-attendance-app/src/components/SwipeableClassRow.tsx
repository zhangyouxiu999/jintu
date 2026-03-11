import { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const DELETE_WIDTH = 72

export interface ClassItem {
  id: string
  name: string
}

interface SwipeableClassRowProps {
  classItem: ClassItem
  isCurrent: boolean
  isOpen: boolean
  /** 为 false 时不显示删除、不允许左滑删除（如仅剩一个班级时） */
  canDelete?: boolean
  onSwipeOpen: (id: string | null) => void
  onSelect: () => void
  onDelete: () => void
}

export function SwipeableClassRow({
  classItem,
  isCurrent,
  isOpen,
  canDelete = true,
  onSwipeOpen,
  onSelect,
  onDelete,
}: SwipeableClassRowProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const isDragRef = useRef(false)
  const didPressRef = useRef(false)

  useEffect(() => {
    if (!isOpen) setDragOffset(0)
  }, [isOpen])

  const setOffset = useCallback((x: number) => {
    if (!canDelete) {
      setDragOffset(0)
      return
    }
    const v = Math.max(-DELETE_WIDTH, Math.min(0, x))
    setDragOffset(v)
  }, [canDelete])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      startXRef.current = e.touches[0].clientX
      isDragRef.current = false
      setIsDragging(false)
    },
    []
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.touches[0].clientX - startXRef.current
      if (Math.abs(dx) > 5) {
        isDragRef.current = true
        setIsDragging(true)
      }
      setOffset(isOpen ? -DELETE_WIDTH + dx : dx)
    },
    [isOpen, setOffset]
  )

  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (isDragRef.current) {
        if (dragOffset < -DELETE_WIDTH / 2) {
          onSwipeOpen(classItem.id)
          setDragOffset(-DELETE_WIDTH)
        } else {
          onSwipeOpen(null)
          setDragOffset(0)
        }
        setIsDragging(false)
      } else {
        onSwipeOpen(null)
        setDragOffset(0)
        const touch = e.changedTouches[0]
        const rect = containerRef.current?.getBoundingClientRect()
        if (canDelete && isOpen && rect && touch.clientX >= rect.right - DELETE_WIDTH) {
          onDelete()
        } else {
          onSelect()
        }
      }
    },
    [canDelete, classItem.id, dragOffset, isOpen, onSwipeOpen, onSelect, onDelete]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      startXRef.current = e.clientX
      isDragRef.current = false
      setIsDragging(false)
      didPressRef.current = true
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.buttons !== 1) return
      const dx = e.clientX - startXRef.current
      if (Math.abs(dx) > 5) {
        isDragRef.current = true
        setIsDragging(true)
      }
      setOffset(isOpen ? -DELETE_WIDTH + dx : dx)
    },
    [isOpen, setOffset]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!didPressRef.current) return
      didPressRef.current = false
      if (isDragRef.current) {
        if (dragOffset < -DELETE_WIDTH / 2) {
          onSwipeOpen(classItem.id)
          setDragOffset(-DELETE_WIDTH)
        } else {
          onSwipeOpen(null)
          setDragOffset(0)
        }
        setIsDragging(false)
      } else {
        onSwipeOpen(null)
        setDragOffset(0)
        const inDeleteZone =
          canDelete &&
          isOpen &&
          containerRef.current &&
          e.clientX >= containerRef.current.getBoundingClientRect().right - DELETE_WIDTH
        if (inDeleteZone) {
          onDelete()
        } else {
          onSelect()
        }
      }
    },
    [canDelete, classItem.id, dragOffset, isOpen, onSwipeOpen, onSelect, onDelete]
  )

  const handleMouseLeave = useCallback(() => {
    if (!didPressRef.current) return
    didPressRef.current = false
    if (isDragRef.current) {
      if (dragOffset < -DELETE_WIDTH / 2) {
        onSwipeOpen(classItem.id)
        setDragOffset(-DELETE_WIDTH)
      } else {
        onSwipeOpen(null)
        setDragOffset(0)
      }
      setIsDragging(false)
    } else {
      onSwipeOpen(null)
      setDragOffset(0)
    }
  }, [canDelete, classItem.id, dragOffset, onSwipeOpen])

  const displayOffset = canDelete ? (isDragging ? dragOffset : (isOpen ? -DELETE_WIDTH : dragOffset)) : 0

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[var(--radius-sm)]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {canDelete && (
        <div
          className="absolute right-0 top-0 flex h-full w-[72px] items-center justify-center bg-[#FF3B30]"
          style={{ height: '100%' }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete()
            }}
            className="flex h-full w-full items-center justify-center gap-1 text-label font-medium text-white active:bg-black/10"
            aria-label="删除"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </button>
        </div>
      )}
      <div
        className={cn(
          'relative z-10 flex w-full items-center bg-[var(--surface)] px-3 py-2.5 transition-transform duration-150',
          isCurrent ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]/70'
        )}
        style={{
          transform: `translateX(${displayOffset}px)`,
        }}
      >
        <span className="min-w-0 flex-1 truncate text-left text-caption font-medium text-[var(--on-surface)]">
          {classItem.name}
        </span>
      </div>
    </div>
  )
}
