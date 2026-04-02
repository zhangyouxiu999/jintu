import { BookOpen, GraduationCap, History as HistoryIcon, Users } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useNavigationType, useOutlet } from 'react-router-dom'
import AppShellHeader from '@/components/AppShellHeader'
import { Drawer, DrawerContentWithHeader } from '@/components/ui/drawer'
import { AppDivider, AppListItem, ListSection } from '@/components/ui/app-ui'
import { useClassList } from '@/hooks/useClassList'
import { useSceneTransition } from '@/hooks/useSceneTransition'
import { useSwipeBackGesture } from '@/hooks/useSwipeBackGesture'
import { storage } from '@/store/storage'

const CLASS_SCOPED_ROUTE_TYPES = ['attendance', 'students', 'schedule', 'grades', 'history'] as const
type ClassScopedRouteType = (typeof CLASS_SCOPED_ROUTE_TYPES)[number]

export interface CurrentClassContextValue {
  currentClassId: string | null
  setCurrentClassId: (id: string | null) => void
}

const CurrentClassContext = createContext<CurrentClassContextValue | null>(null)

export function useCurrentClassId() {
  const context = useContext(CurrentClassContext)
  if (!context) {
    throw new Error('useCurrentClassId must be used within AppLayout')
  }
  return context
}

function getClassScopedRouteType(pathname: string): ClassScopedRouteType | null {
  const routeType = pathname.split('/').filter(Boolean)[0]
  if (!routeType) return null
  return CLASS_SCOPED_ROUTE_TYPES.find((item) => item === routeType) ?? null
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const outlet = useOutlet()
  const sceneOutletRef = useRef<{ pathname: string; element: ReactNode }>({
    pathname: location.pathname,
    element: outlet,
  })
  if (sceneOutletRef.current.pathname !== location.pathname) {
    sceneOutletRef.current = {
      pathname: location.pathname,
      element: outlet,
    }
  }
  const sceneOutlet = sceneOutletRef.current.element
  const { list, loading } = useClassList()
  const gestureCommittedRef = useRef(false)

  const [currentClassIdState, setCurrentClassIdState] = useState<string | null>(() => storage.loadCurrentClassId())
  const [classPanelOpen, setClassPanelOpen] = useState(false)

  const setCurrentClassId = useCallback((id: string | null) => {
    storage.saveCurrentClassId(id)
    setCurrentClassIdState(id)
  }, [])

  const routeType = getClassScopedRouteType(location.pathname)
  const routeClassId = routeType ? location.pathname.split('/').filter(Boolean)[1] ?? null : null
  const fallbackClass = list.find((item) => item.id === currentClassIdState) ?? list[0] ?? null
  const routeClass = routeClassId ? list.find((item) => item.id === routeClassId) ?? null : null
  const effectiveClassId = fallbackClass?.id ?? null
  const activeClass = routeType ? routeClass : fallbackClass
  const isMePage = location.pathname.startsWith('/more')

  useEffect(() => {
    if (effectiveClassId === currentClassIdState) return
    storage.saveCurrentClassId(effectiveClassId)
    setCurrentClassIdState(effectiveClassId)
  }, [currentClassIdState, effectiveClassId])

  useEffect(() => {
    if (!routeClass?.id || routeClass.id === currentClassIdState) return
    storage.saveCurrentClassId(routeClass.id)
    setCurrentClassIdState(routeClass.id)
  }, [currentClassIdState, routeClass])

  const currentClassContextValue = useMemo<CurrentClassContextValue>(() => ({
    currentClassId: effectiveClassId,
    setCurrentClassId,
  }), [effectiveClassId, setCurrentClassId])
  const {
    activeScene,
    exitingScene,
    gestureBackScene,
    transitionKind,
    isTransitioning,
    currentSceneRouteKind,
  } = useSceneTransition({
    pathname: location.pathname,
    navigationType,
    sceneOutlet,
    gestureCommittedRef,
  })
  const canSwipeBack = currentSceneRouteKind === 'detail' && gestureBackScene != null
  const {
    swipeGestureVisible,
    currentSceneStyle,
    gestureBackdropStyle,
    handlers,
  } = useSwipeBackGesture({
    canSwipeBack,
    gestureBackScene,
    navigate,
    onSwipeCommitted: () => {
      gestureCommittedRef.current = true
    },
  })

  return (
    <CurrentClassContext.Provider value={currentClassContextValue}>
      <div className="relative flex min-h-[100dvh] flex-col bg-[var(--bg)] text-[var(--on-surface)]">
        <AppShellHeader
          activeClassName={activeClass?.name ?? ''}
          loading={loading}
          isMePage={isMePage}
          isTransitioning={isTransitioning}
          swipeGestureVisible={swipeGestureVisible}
          transitionKind={transitionKind}
          currentSceneRouteKind={currentSceneRouteKind}
          onOpenClassPanel={() => setClassPanelOpen(true)}
          onNavigateMore={() => navigate('/more')}
        />

        <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-[var(--app-max-width)] flex-1 flex-col px-[var(--page-x)] pb-[calc(var(--page-y)+var(--safe-bottom))] pt-3">
          <div
            className="app-scene-host flex min-h-0 flex-1 flex-col"
            data-transitioning={isTransitioning ? 'true' : 'false'}
            data-transition-kind={transitionKind}
            data-gesture-active={swipeGestureVisible ? 'true' : 'false'}
            onPointerDown={handlers.onPointerDown}
            onPointerMove={handlers.onPointerMove}
            onPointerUp={handlers.onPointerUp}
            onPointerCancel={handlers.onPointerCancel}
            style={{ touchAction: canSwipeBack ? 'pan-y' : undefined }}
          >
            {swipeGestureVisible && gestureBackScene ? (
              <div className="app-scene app-scene-backdrop" data-scene-role="gesture-backdrop" style={gestureBackdropStyle}>
                {gestureBackScene.element}
              </div>
            ) : null}

            {exitingScene ? (
              <div className="app-scene" data-scene-role="exit">
                {exitingScene.element}
              </div>
            ) : null}

            <div
              className="app-scene flex min-h-0 flex-1 flex-col"
              data-scene-role={exitingScene ? 'enter' : 'active'}
              style={currentSceneStyle}
            >
              {activeScene.element}
            </div>
          </div>
        </main>

        <Drawer open={classPanelOpen} onOpenChange={setClassPanelOpen} shouldScaleBackground={false}>
          <DrawerContentWithHeader
            title={activeClass?.name?.trim() || '班级'}
            showCloseButton
            onClose={() => setClassPanelOpen(false)}
            overlayClassName="bg-[var(--bg)]"
            overlayStyle={{ backgroundColor: 'var(--bg)', opacity: 1 }}
            className="border-[var(--outline)] bg-[var(--surface)] shadow-[0_-18px_44px_rgba(94,79,52,0.14)]"
            style={{ backgroundColor: 'var(--surface)', opacity: 1 }}
          >
            <div className="space-y-2 px-4 py-4">
              <div className="px-1 text-[12px] font-medium text-[var(--on-surface-muted)]">
                班级入口
              </div>
              {activeClass?.id ? (
                <ListSection>
                  {[
                    { label: '点名', to: `/attendance/${activeClass.id}` },
                    { label: '学生', icon: Users, to: `/students/${activeClass.id}` },
                    { label: '课表', icon: BookOpen, to: `/schedule/${activeClass.id}` },
                    { label: '成绩', icon: GraduationCap, to: `/grades/${activeClass.id}` },
                    { label: '历史', icon: HistoryIcon, to: `/history/${activeClass.id}` },
                  ].map((item, index) => (
                    <div key={item.label}>
                      {index > 0 ? <AppDivider className="mx-4" /> : null}
                      <AppListItem
                        onClick={() => {
                          setClassPanelOpen(false)
                          navigate(item.to)
                        }}
                        title={item.label}
                        icon={item.icon}
                        trailingLabel="进入"
                        showChevron
                        className="px-4 py-2.5"
                      />
                    </div>
                  ))}
                </ListSection>
              ) : (
                <div className="rounded-[18px] border border-[var(--outline)]/70 bg-[var(--surface-2)] px-4 py-4 text-[13px] text-[var(--on-surface-muted)]">
                  当前还没有可用班级入口。
                </div>
              )}
            </div>
          </DrawerContentWithHeader>
        </Drawer>
      </div>
    </CurrentClassContext.Provider>
  )
}
