import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { SceneSnapshot } from '@/hooks/useSceneTransition'

interface SwipeBackState {
  phase: 'idle' | 'dragging' | 'settling' | 'completing'
  dragX: number
  progress: number
}

function hasBlockingOverlay() {
  return document.querySelector(
    [
      "[data-slot='drawer-content'][data-state='open']",
      "[data-slot='dialog-content'][data-state='open']",
      "[data-slot='alert-dialog-content'][data-state='open']",
    ].join(', ')
  ) != null
}

interface UseSwipeBackGestureParams {
  canSwipeBack: boolean
  gestureBackScene: SceneSnapshot | null
  navigate: NavigateFunction
  onSwipeCommitted: () => void
}

export function useSwipeBackGesture({
  canSwipeBack,
  gestureBackScene,
  navigate,
  onSwipeCommitted,
}: UseSwipeBackGestureParams) {
  const swipeTimerRef = useRef<number | null>(null)
  const gestureStartRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null)
  const [swipeBack, setSwipeBack] = useState<SwipeBackState>({ phase: 'idle', dragX: 0, progress: 0 })

  const resetSwipeBack = useCallback(() => {
    setSwipeBack({ phase: 'idle', dragX: 0, progress: 0 })
  }, [])

  const handleScenePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canSwipeBack || hasBlockingOverlay()) return
    if (event.pointerType === 'mouse') return
    if (event.clientX > 28) return

    gestureStartRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    }
  }, [canSwipeBack])

  const handleScenePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureStartRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    const deltaX = event.clientX - gesture.startX
    const deltaY = event.clientY - gesture.startY

    if (deltaY > 18 && deltaY > Math.abs(deltaX)) {
      gestureStartRef.current = null
      resetSwipeBack()
      return
    }

    if (deltaX <= 0) return

    const width = Math.max(window.innerWidth, 1)
    const clampedX = Math.min(deltaX, width)
    const progress = Math.min(clampedX / (width * 0.92), 1)

    setSwipeBack({ phase: 'dragging', dragX: clampedX, progress })
  }, [resetSwipeBack])

  const finishSwipeState = useCallback((nextState: SwipeBackState, duration = 220) => {
    if (swipeTimerRef.current != null) {
      window.clearTimeout(swipeTimerRef.current)
    }
    setSwipeBack(nextState)
    swipeTimerRef.current = window.setTimeout(() => {
      resetSwipeBack()
    }, duration)
  }, [resetSwipeBack])

  const handleScenePointerEnd = useCallback(() => {
    gestureStartRef.current = null

    if (swipeBack.phase !== 'dragging') return

    const width = Math.max(window.innerWidth, 1)
    const shouldComplete = swipeBack.progress > 0.38 || swipeBack.dragX > width * 0.34

    if (shouldComplete) {
      onSwipeCommitted()
      finishSwipeState({ phase: 'completing', dragX: width, progress: 1 }, 140)
      window.setTimeout(() => navigate(-1), 110)
      return
    }

    finishSwipeState({ phase: 'settling', dragX: 0, progress: 0 })
  }, [finishSwipeState, navigate, onSwipeCommitted, swipeBack.dragX, swipeBack.phase, swipeBack.progress])

  useEffect(() => {
    return () => {
      if (swipeTimerRef.current != null) {
        window.clearTimeout(swipeTimerRef.current)
      }
    }
  }, [])

  const swipeGestureVisible = swipeBack.phase !== 'idle' && gestureBackScene != null
  const currentSceneStyle = swipeGestureVisible
    ? {
        transform: `translate3d(${swipeBack.dragX}px, 0, 0)`,
        transition: swipeBack.phase === 'dragging' ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 220ms ease, box-shadow 220ms ease',
        borderRadius: `${Math.round(24 * swipeBack.progress)}px`,
        boxShadow: `0 18px 42px rgba(24, 33, 24, ${0.10 + swipeBack.progress * 0.08})`,
      }
    : undefined
  const gestureBackdropStyle = swipeGestureVisible
    ? {
        transform: `translate3d(${(-24 + 24 * swipeBack.progress).toFixed(2)}px, 0, 0) scale(${(0.985 + swipeBack.progress * 0.015).toFixed(4)})`,
        opacity: 0.72 + swipeBack.progress * 0.28,
        transition: swipeBack.phase === 'dragging' ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
      }
    : undefined

  return {
    swipeGestureVisible,
    currentSceneStyle,
    gestureBackdropStyle,
    resetSwipeBack,
    handlers: {
      onPointerDown: handleScenePointerDown,
      onPointerMove: handleScenePointerMove,
      onPointerUp: handleScenePointerEnd,
      onPointerCancel: handleScenePointerEnd,
    },
  }
}
