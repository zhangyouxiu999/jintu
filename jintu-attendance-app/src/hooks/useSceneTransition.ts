import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import type { NavigationType } from 'react-router-dom'

export type SceneRouteKind = 'root' | 'detail' | 'transient' | 'auth'
export type SceneTransitionKind = 'none' | 'root-switch' | 'push-forward' | 'push-back' | 'subtle'

export interface SceneSnapshot {
  key: string
  pathname: string
  element: ReactNode
  routeKind: SceneRouteKind
}

function getSceneKey(pathname: string) {
  return pathname || '/'
}

export function getSceneRouteKind(pathname: string): SceneRouteKind {
  if (pathname === '/login') return 'auth'
  if (
    pathname === '/'
    || pathname.startsWith('/attendance/')
    || pathname.startsWith('/grades/')
    || pathname.startsWith('/schedule/')
    || pathname.startsWith('/history/')
    || pathname.startsWith('/more')
  ) {
    return 'root'
  }
  if (
    pathname.startsWith('/students/')
    || pathname.startsWith('/classes')
  ) {
    return 'detail'
  }
  return 'transient'
}

function resolveSceneTransition(
  previousScene: SceneSnapshot | null,
  nextScene: SceneSnapshot,
  navigationType: NavigationType,
  isBackward: boolean
) {
  if (!previousScene) return 'none' satisfies SceneTransitionKind
  if (previousScene.pathname === nextScene.pathname) return 'none' satisfies SceneTransitionKind

  if (previousScene.routeKind === 'root' && nextScene.routeKind === 'root') {
    return 'root-switch' satisfies SceneTransitionKind
  }

  if (nextScene.routeKind === 'detail') {
    return 'push-forward' satisfies SceneTransitionKind
  }

  if (previousScene.routeKind === 'detail' && (nextScene.routeKind === 'root' || nextScene.routeKind === 'transient')) {
    return 'push-back' satisfies SceneTransitionKind
  }

  if (navigationType === 'POP' || isBackward) {
    return 'push-back' satisfies SceneTransitionKind
  }

  return 'subtle' satisfies SceneTransitionKind
}

interface UseSceneTransitionParams {
  pathname: string
  navigationType: NavigationType
  sceneOutlet: ReactNode
  gestureCommittedRef: MutableRefObject<boolean>
}

export function useSceneTransition({
  pathname,
  navigationType,
  sceneOutlet,
  gestureCommittedRef,
}: UseSceneTransitionParams) {
  const transitionTimerRef = useRef<number | null>(null)
  const historyIndexRef = useRef<number>(window.history.state?.idx ?? 0)
  const [activeScene, setActiveScene] = useState<SceneSnapshot>(() => ({
    key: getSceneKey(pathname),
    pathname,
    element: sceneOutlet,
    routeKind: getSceneRouteKind(pathname),
  }))
  const [exitingScene, setExitingScene] = useState<SceneSnapshot | null>(null)
  const [gestureBackScene, setGestureBackScene] = useState<SceneSnapshot | null>(null)
  const [transitionKind, setTransitionKind] = useState<SceneTransitionKind>('none')
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const nextScene: SceneSnapshot = {
      key: getSceneKey(pathname),
      pathname,
      element: sceneOutlet,
      routeKind: getSceneRouteKind(pathname),
    }

    setActiveScene((currentScene) => {
      if (currentScene.key === nextScene.key) return currentScene

      if (transitionTimerRef.current != null) {
        window.clearTimeout(transitionTimerRef.current)
      }

      const nextHistoryIndex = window.history.state?.idx ?? historyIndexRef.current
      const isBackward = nextHistoryIndex < historyIndexRef.current
      historyIndexRef.current = nextHistoryIndex

      const resolvedTransition = gestureCommittedRef.current
        ? 'none'
        : resolveSceneTransition(currentScene, nextScene, navigationType, isBackward)

      gestureCommittedRef.current = false

      if (resolvedTransition === 'none') {
        setExitingScene(null)
        setIsTransitioning(false)
        setTransitionKind('none')
        if (currentScene.routeKind === 'detail' && nextScene.routeKind !== 'detail') {
          setGestureBackScene(null)
        }
        return nextScene
      }

      setTransitionKind(resolvedTransition)
      setExitingScene(currentScene)
      setIsTransitioning(true)

      if (resolvedTransition === 'push-forward') {
        setGestureBackScene(currentScene)
      } else if (resolvedTransition === 'push-back') {
        setGestureBackScene(null)
      }

      transitionTimerRef.current = window.setTimeout(() => {
        setExitingScene(null)
        setIsTransitioning(false)
        setTransitionKind('none')
      }, resolvedTransition === 'root-switch' ? 420 : 360)

      return nextScene
    })
  }, [gestureCommittedRef, navigationType, pathname, sceneOutlet])

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current != null) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  return {
    activeScene,
    exitingScene,
    gestureBackScene,
    transitionKind,
    isTransitioning,
    currentSceneRouteKind: getSceneRouteKind(pathname),
    setGestureBackScene,
  }
}
