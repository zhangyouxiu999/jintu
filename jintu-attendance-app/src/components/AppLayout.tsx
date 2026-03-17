import { BookOpen, Check, ClipboardCheck, FileDown, FileUp, GraduationCap, LayoutGrid, UserCircle2, type LucideIcon } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { type GlobalActionConfig } from '@/components/GlobalActionDrawer'
import { useClassList } from '@/hooks/useClassList'
import { cn } from '@/lib/utils'
import { storage } from '@/store/storage'
import { Drawer, DrawerContentWithHeader } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const Settings = lazy(() => import('@/pages/Settings'))

export interface AppLayoutContextValue {
  pageTitle: string
  setPageTitle: (title: string) => void
  setPageActions: (config: GlobalActionConfig) => void
  openGlobalActionDrawer: () => void
  closeGlobalActionDrawer: () => void
}

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null)

export function useAppLayout() {
  const context = useContext(AppLayoutContext)
  if (!context) {
    throw new Error('useAppLayout must be used within AppLayout')
  }
  return context
}

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

function getDefaultPageTitle(pathname: string) {
  if (pathname === '/' || pathname.startsWith('/attendance')) return '点名'
  if (pathname.startsWith('/grades')) return '成绩'
  if (pathname.startsWith('/schedule')) return '课表'
  if (pathname.startsWith('/history')) return '历史'
  if (pathname.startsWith('/templates')) return '模板'
  if (pathname.startsWith('/settings')) return '我的'
  if (pathname.startsWith('/classes')) return '班级'
  return '金图考勤'
}

function buildTabPath(type: 'attendance' | 'grades' | 'schedule', classId: string | null) {
  if (type === 'attendance') return classId ? `/attendance/${classId}` : '/'
  if (type === 'grades') return classId ? `/grades/${classId}` : '/grades'
  return classId ? `/schedule/${classId}` : '/schedule'
}

function isTabActive(pathname: string, type: 'attendance' | 'grades' | 'schedule') {
  if (type === 'attendance') return pathname === '/' || pathname.startsWith('/attendance')
  if (type === 'grades') return pathname.startsWith('/grades')
  return pathname.startsWith('/schedule')
}

// Tab 导航项：图标 + 标签，激活态仅变色
function BottomTab({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string
  label: string
  icon: LucideIcon
  active: boolean
}) {
  return (
    <NavLink
      to={to}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-[3px] py-[9px]',
        active ? 'text-[var(--primary)]' : 'text-[var(--on-surface-muted)]'
      )}
    >
      <Icon
        strokeWidth={active ? 2 : 1.4}
        className="h-[23px] w-[23px] shrink-0"
      />
      <span className={cn(
        'truncate text-[10px] leading-none tracking-[0.01em]',
        active ? 'font-semibold' : 'font-normal'
      )}>{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { list } = useClassList()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false)
  const [pageTitle, setPageTitle] = useState(getDefaultPageTitle(location.pathname))
  const [pageActions, setPageActions] = useState<GlobalActionConfig>({})
  const [currentClassId, setCurrentClassIdState] = useState<string | null>(() => storage.loadCurrentClassId())

  const setCurrentClassId = useCallback((id: string | null) => {
    storage.saveCurrentClassId(id)
    setCurrentClassIdState(id)
  }, [])

  // 将 header 实际高度写入 CSS 变量，供吸顶子元素使用
  const headerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        '--header-height',
        `${entry.contentRect.height}px`
      )
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setPageTitle(getDefaultPageTitle(location.pathname))
    setPageActions({})
  }, [location.pathname])

  // 仅当 pathname 发生变化（用户从抽屉内跳转）且新页面不是 /settings 时关闭抽屉；切换班级（同一 tab 下仅 classId 变化）时不关闭
  const prevPathnameRef = useRef(location.pathname)
  useEffect(() => {
    const prev = prevPathnameRef.current
    const curr = location.pathname
    if (prev === curr) return
    prevPathnameRef.current = curr
    if (!settingsSheetOpen || curr === '/settings') return
    const prevBase = prev.replace(/\/[^/]+$/, '') || prev
    const currBase = curr.replace(/\/[^/]+$/, '') || curr
    const isClassSwitchOnly = prevBase === currBase && (prev.startsWith('/attendance') || prev.startsWith('/grades') || prev.startsWith('/schedule'))
    if (isClassSwitchOnly) return
    setSettingsSheetOpen(false)
  }, [location.pathname, settingsSheetOpen])

  const effectiveClassId = list.find((item) => item.id === currentClassId)?.id ?? list[0]?.id ?? null
  const currentClass = list.find((item) => item.id === effectiveClassId) ?? null

  // 切换当前班级后，若当前页是某班级的点名/成绩/课表且 URL 的 classId 与新区不一致，则跳转到新班级对应路由，使列表等数据更新
  const prevEffectiveIdRef = useRef<string | null>(effectiveClassId)
  useEffect(() => {
    if (prevEffectiveIdRef.current === effectiveClassId) return
    prevEffectiveIdRef.current = effectiveClassId
    const pathname = location.pathname
    const parts = pathname.split('/').filter(Boolean)
    const routeType = parts[0]
    const urlClassId = parts[1] ?? null
    if (routeType !== 'attendance' && routeType !== 'grades' && routeType !== 'schedule') return
    if (urlClassId === effectiveClassId) return
    const targetPath = effectiveClassId
      ? `/${routeType}/${effectiveClassId}`
      : (routeType === 'attendance' ? '/' : `/${routeType}`)
    navigate(targetPath, { replace: true })
  }, [effectiveClassId, location.pathname, navigate])

  const importAction = pageActions.importAction ?? {
    id: 'import-placeholder',
    label: '当前页面暂未接入导入',
    icon: FileUp,
    disabled: true,
  }
  const exportAction = pageActions.exportAction ?? {
    id: 'export-placeholder',
    label: '当前页面暂未接入导出',
    icon: FileDown,
    disabled: true,
  }
  const showExportAction = exportAction.id !== 'export-placeholder'
  const exportListAction = pageActions.exportListAction
  const extraActions = pageActions.extraActions ?? []

  const contextValue = useMemo<AppLayoutContextValue>(
    () => ({
      pageTitle,
      setPageTitle,
      setPageActions,
      openGlobalActionDrawer: () => setDrawerOpen(true),
      closeGlobalActionDrawer: () => setDrawerOpen(false),
    }),
    [pageTitle]
  )

  const currentClassContextValue = useMemo<CurrentClassContextValue>(
    () => ({ currentClassId, setCurrentClassId }),
    [currentClassId]
  )

  return (
    <CurrentClassContext.Provider value={currentClassContextValue}>
      <AppLayoutContext.Provider value={contextValue}>
      <div className="flex min-h-[100dvh] flex-col bg-[var(--bg)] text-[var(--on-surface)]">
        {/* 顶部导航栏：不吸顶，随页滚动。ResizeObserver 将实际高度写入 --header-height 供公告吸顶时 top 使用 */}
        <header ref={headerRef} className="z-40 shrink-0">
          <div className="mx-auto flex w-full max-w-screen-sm items-center justify-between px-5 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
            <h1 className="min-w-0 flex-1 truncate text-[24px] font-bold leading-tight tracking-tight text-[var(--on-surface)]">
              {currentClass?.name ?? '未选择班级'}
            </h1>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSettingsSheetOpen(true)}
              className="ml-3 h-11 w-11 shrink-0 rounded-full text-[var(--primary)] [&_svg]:!h-8 [&_svg]:!w-8"
              aria-label="打开我的"
            >
              <UserCircle2 strokeWidth={1.4} />
            </Button>
          </div>
        </header>

        {/* main 底部留白 = dock 高度(约 66px) + safe area + 额外间距；flex-1 min-h-0 让内容区撑满一屏 */}
        <main className="mx-auto flex min-h-0 w-full max-w-screen-sm flex-1 flex-col px-[var(--page-x)] pb-[calc(80px+env(safe-area-inset-bottom,0px))] pt-4">
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>

        {/* 我的：Vaul Drawer，支持下滑关闭手势；关闭背景缩放以减轻 Android 卡顿 */}
        <Drawer open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen} shouldScaleBackground={false}>
          <DrawerContentWithHeader
            showCloseButton
            onClose={() => setSettingsSheetOpen(false)}
          >
            <Suspense fallback={<div className="flex min-h-[200px] items-center justify-center text-[var(--on-surface-muted)]">加载中…</div>}>
              <Settings />
            </Suspense>
          </DrawerContentWithHeader>
        </Drawer>

        {/* 底部 Dock 通过 Portal 挂到 body，跳出 GSAP 动画容器，避免随页面淡出 */}
        {createPortal(
          <div
            className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]"
            aria-label="底部操作栏"
          >
            <div className="mx-auto flex w-full max-w-screen-sm items-center gap-2.5">
              <nav
                className="flex flex-1 items-center overflow-hidden rounded-full border border-[var(--outline)] bg-[var(--surface)]/80 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-2xl"
                aria-label="主导航"
              >
                <BottomTab
                  to={buildTabPath('attendance', effectiveClassId)}
                  label="点名"
                  icon={ClipboardCheck}
                  active={isTabActive(location.pathname, 'attendance')}
                />
                <BottomTab
                  to={buildTabPath('grades', effectiveClassId)}
                  label="成绩"
                  icon={GraduationCap}
                  active={isTabActive(location.pathname, 'grades')}
                />
                <BottomTab
                  to={buildTabPath('schedule', effectiveClassId)}
                  label="课表"
                  icon={BookOpen}
                  active={isTabActive(location.pathname, 'schedule')}
                />
              </nav>

              <DropdownMenu open={drawerOpen} onOpenChange={setDrawerOpen} modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="打开功能菜单"
                    aria-expanded={drawerOpen}
                    className={cn(
                      'h-[50px] w-[50px] shrink-0 rounded-full bg-[var(--surface)]/80 shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-2xl',
                      drawerOpen ? 'text-[var(--primary)]' : 'text-[var(--on-surface-muted)]'
                    )}
                  >
                    <LayoutGrid
                      strokeWidth={drawerOpen ? 2 : 1.5}
                      className="h-[22px] w-[22px]"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="end"
                  sideOffset={10}
                  className={cn(
                    'min-w-[11rem] rounded-[16px] border-[var(--outline)] bg-[var(--surface)] p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
                    'opacity-0 data-[state=open]:opacity-100'
                  )}
                >
                  {extraActions.length > 0 &&
                    extraActions.map((item) => {
                      const Icon = item.icon
                      const hasSub = item.children != null && item.children.length > 0
                      if (hasSub) {
                        return (
                          <DropdownMenuSub key={item.id}>
                            <DropdownMenuSubTrigger
                              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] focus:bg-[var(--surface-2)] data-[state=open]:bg-[var(--surface-2)]"
                            >
                              {Icon ? <Icon className="h-5 w-5 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.5} /> : null}
                              <span>{item.label}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent
                              className="min-w-[10rem] rounded-[12px] border-[var(--outline)] bg-[var(--surface)] p-1 shadow-elevation-2"
                              sideOffset={4}
                            >
                              {item.children!.map((child) => {
                                const ChildIcon = child.icon
                                const isCurrent = child.disabled
                                return (
                                  <DropdownMenuItem
                                    key={child.id}
                                    disabled={child.disabled}
                                    variant={child.destructive ? 'destructive' : 'default'}
                                    onSelect={() => child.onSelect?.()}
                                    className={cn(
                                      'flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[14px] focus:bg-[var(--surface-2)]',
                                      isCurrent && 'text-[var(--primary)] opacity-100 data-[disabled]:opacity-100'
                                    )}
                                  >
                                    {!isCurrent && ChildIcon ? (
                                      <ChildIcon className="h-4 w-4 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.5} />
                                    ) : null}
                                    <span className="shrink-0 text-left">{child.label}</span>
                                    {isCurrent && <span className="min-w-0 flex-1" aria-hidden />}
                                    {isCurrent && <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" strokeWidth={2.5} />}
                                  </DropdownMenuItem>
                                )
                              })}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        )
                      }
                      return (
                        <DropdownMenuItem
                          key={item.id}
                          disabled={item.disabled}
                          variant={item.destructive ? 'destructive' : 'default'}
                          onSelect={() => item.onSelect?.()}
                          className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] focus:bg-[var(--surface-2)]"
                        >
                          {Icon ? <Icon className="h-5 w-5 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.5} /> : null}
                          <span>{item.label}</span>
                        </DropdownMenuItem>
                      )
                    })}
                  {extraActions.length > 0 && <DropdownMenuSeparator className="my-1.5 bg-[var(--surface-2)]" />}
                  <DropdownMenuItem
                    disabled={importAction.disabled}
                    onSelect={() => importAction.onSelect?.()}
                    className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] focus:bg-[var(--surface-2)]"
                  >
                    {(() => {
                      const Icon = importAction.icon
                      return Icon ? <Icon className="h-5 w-5 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.5} /> : null
                    })()}
                    <span>{importAction.label}</span>
                  </DropdownMenuItem>
                  {showExportAction && (
                  <DropdownMenuItem
                    disabled={exportAction.disabled}
                    onSelect={() => exportAction.onSelect?.()}
                    className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] focus:bg-[var(--surface-2)]"
                  >
                    {(() => {
                      const Icon = exportAction.icon
                      return Icon ? <Icon className="h-5 w-5 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.5} /> : null
                    })()}
                    <span>{exportAction.label}</span>
                  </DropdownMenuItem>
                  )}
                  {exportListAction && (
                    <DropdownMenuItem
                      disabled={exportListAction.disabled}
                      onSelect={() => exportListAction.onSelect?.()}
                      className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[15px] focus:bg-[var(--surface-2)]"
                    >
                      {(() => {
                        const Icon = exportListAction.icon
                        return Icon ? <Icon className="h-5 w-5 shrink-0 text-[var(--on-surface-muted)]" strokeWidth={1.5} /> : null
                      })()}
                      <span>{exportListAction.label}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>,
          document.body
        )}

      </div>
      </AppLayoutContext.Provider>
    </CurrentClassContext.Provider>
  )
}
