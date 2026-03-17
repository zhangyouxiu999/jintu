import { NavLink, Link, useLocation } from 'react-router-dom'
import { Home, CalendarDays, Award, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrentClassId } from '@/components/AppLayout'
import { useClassList } from '@/hooks/useClassList'

export default function BottomNav() {
  const location = useLocation()
  const { list } = useClassList()
  const { currentClassId } = useCurrentClassId()
  const effectiveClassId = list.find((c) => c.id === currentClassId)?.id ?? list[0]?.id
  const pathname = location.pathname
  const isHomeActive =
    pathname === '/' || (!!effectiveClassId && pathname === `/attendance/${effectiveClassId}`)
  const isScheduleActive = pathname.startsWith('/schedule')
  const isGradesActive = pathname.startsWith('/grades')

  const scheduleTo = effectiveClassId ? `/schedule/${effectiveClassId}` : '/schedule'
  const gradesTo = effectiveClassId ? `/grades/${effectiveClassId}` : '/grades'

  return (
    <nav
      className="glass-bar fixed inset-x-0 bottom-0 z-30 flex min-h-[calc(56px+env(safe-area-inset-bottom,0px))] items-center justify-around border-t border-[var(--outline-variant)] pb-[env(safe-area-inset-bottom,0px)] shadow-elevation-bar"
      aria-label="主导航"
    >
      <Link
        to="/"
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors active:scale-[0.97]',
          isHomeActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-muted)]'
        )}
      >
        <Home className={cn('h-6 w-6 shrink-0', isHomeActive && 'stroke-[2.5]')} aria-hidden />
        <span className="text-[11px] font-medium truncate max-w-full px-0.5">首页</span>
      </Link>
      <Link
        to={scheduleTo}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors active:scale-[0.97]',
          isScheduleActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-muted)]'
        )}
      >
        <CalendarDays className={cn('h-6 w-6 shrink-0', isScheduleActive && 'stroke-[2.5]')} aria-hidden />
        <span className="text-[11px] font-medium truncate max-w-full px-0.5">课程表</span>
      </Link>
      <Link
        to={gradesTo}
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors active:scale-[0.97]',
          isGradesActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-muted)]'
        )}
      >
        <Award className={cn('h-6 w-6 shrink-0', isGradesActive && 'stroke-[2.5]')} aria-hidden />
        <span className="text-[11px] font-medium truncate max-w-full px-0.5">成绩单</span>
      </Link>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors active:scale-[0.97]',
            isActive ? 'text-[var(--primary)]' : 'text-[var(--on-surface-muted)]'
          )
        }
      >
        {({ isActive }) => (
          <>
            <User className={cn('h-6 w-6 shrink-0', isActive && 'stroke-[2.5]')} aria-hidden />
            <span className="text-[11px] font-medium truncate max-w-full px-0.5">我的</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}
