import { BookOpen, ClipboardCheck, FileDown, FileUp, GraduationCap, Plus, UserCircle2, type LucideIcon } from 'lucide-react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { type GlobalActionConfig } from '@/components/GlobalActionDrawer'
import { useClassList } from '@/hooks/useClassList'
import { cn } from '@/lib/utils'
import { storage } from '@/store/storage'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
        'transition-[color] duration-200 active:opacity-55',
        active ? 'text-[var(--primary)]' : 'text-[var(--on-surface-muted)]'
      )}
    >
      <Icon
        strokeWidth={active ? 2 : 1.4}
        className="h-[23px] w-[23px] shrink-0 transition-[stroke-width] duration-200"
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
  const { list } = useClassList()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pageTitle, setPageTitle] = useState(getDefaultPageTitle(location.pathname))
  const [pageActions, setPageActions] = useState<GlobalActionConfig>({})

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

  const storedId = storage.loadCurrentClassId()
  const currentClassId = list.find((item) => item.id === storedId)?.id ?? list[0]?.id ?? null
  const currentClass = list.find((item) => item.id === currentClassId) ?? null

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

  return (
    <AppLayoutContext.Provider value={contextValue}>
      <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--on-surface)]">
        {/* 顶部导航栏：不吸顶，随页滚动。ResizeObserver 将实际高度写入 --header-height 供公告吸顶时 top 使用 */}
        <header ref={headerRef} className="z-40">
          <div className="mx-auto flex w-full max-w-screen-sm items-center justify-between px-5 pb-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
            <h1 className="min-w-0 flex-1 truncate text-[24px] font-bold leading-tight tracking-tight text-[var(--on-surface)]">
              {currentClass?.name ?? '未选择班级'}
            </h1>

            <NavLink
              to="/settings"
              className={({ isActive }) => cn(
                'ml-3 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full transition-all duration-200 active:opacity-60',
                isActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'
              )}
              aria-label="打开我的"
            >
              <UserCircle2 strokeWidth={1.4} className="h-[24px] w-[24px]" />
            </NavLink>
          </div>
        </header>

        {/* main 底部留白 = dock 高度(约 66px) + safe area + 额外间距 */}
        <main className="mx-auto w-full max-w-screen-sm px-4 pb-[calc(80px+env(safe-area-inset-bottom,0px))] pt-4">
          <Outlet />
        </main>

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
                  to={buildTabPath('attendance', currentClassId)}
                  label="点名"
                  icon={ClipboardCheck}
                  active={isTabActive(location.pathname, 'attendance')}
                />
                <BottomTab
                  to={buildTabPath('grades', currentClassId)}
                  label="成绩"
                  icon={GraduationCap}
                  active={isTabActive(location.pathname, 'grades')}
                />
                <BottomTab
                  to={buildTabPath('schedule', currentClassId)}
                  label="课表"
                  icon={BookOpen}
                  active={isTabActive(location.pathname, 'schedule')}
                />
              </nav>

              <DropdownMenu open={drawerOpen} onOpenChange={setDrawerOpen} modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="打开功能菜单"
                    aria-expanded={drawerOpen}
                    className={cn(
                      'flex h-[50px] w-[50px] shrink-0 flex-col items-center justify-center',
                      'rounded-full border border-[var(--outline)] bg-[var(--surface)]/80',
                      'shadow-[0_2px_16px_rgba(0,0,0,0.06)] backdrop-blur-2xl',
                      'transition-[color] duration-200',
                      drawerOpen ? 'text-[var(--primary)]' : 'text-[var(--on-surface-muted)]'
                    )}
                  >
                    <Plus
                      strokeWidth={drawerOpen ? 2 : 1.5}
                      className="h-[22px] w-[22px] transition-[stroke-width,transform] duration-200"
                      style={{ transform: drawerOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="end"
                  sideOffset={10}
                  className={cn(
                    'min-w-[11rem] rounded-[16px] border-[var(--outline)] bg-[var(--surface)] p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.12)]',
                    'opacity-0 transition-opacity duration-150 ease-out data-[state=open]:opacity-100'
                  )}
                >
                  {extraActions.length > 0 &&
                    extraActions.map((item) => {
                      const Icon = item.icon
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
  )
}
