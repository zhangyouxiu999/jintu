import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useLocation, useNavigationType, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { storage } from '@/store/storage'
import { runPageOut, pageIn, pageInFromLeft, pageInOpacityOnly, pageOut, pageOutToRight } from '@/lib/gsap'
import gsap from 'gsap'
import AppLayout from './AppLayout'

const AttendanceEntry = lazy(() => import('@/pages/AttendanceEntry'))
const ClassList = lazy(() => import('@/pages/ClassList'))
const Attendance = lazy(() => import('@/pages/Attendance'))
const History = lazy(() => import('@/pages/History'))
const Schedule = lazy(() => import('@/pages/Schedule'))
const Grades = lazy(() => import('@/pages/Grades'))
const Settings = lazy(() => import('@/pages/Settings'))
const Templates = lazy(() => import('@/pages/Templates'))
const Login = lazy(() => import('@/pages/Login'))
const ClassPicker = lazy(() => import('@/pages/ClassPicker'))

function RequireAuth() {
  if (!storage.loadAuth()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

const TAB_PREFIXES = ['/attendance', '/grades', '/schedule']

function isTabRoute(pathname: string) {
  return pathname === '/' || TAB_PREFIXES.some((p) => pathname.startsWith(p))
}

/**
 * 路由切换由 GSAP 驱动：先执行当前页离开动画，再渲染新页面并执行进入动画。
 * Tab 级别的切换（点名/成绩/课表）跳过滑动动画，保持 iOS 风格瞬切。
 */
export default function AnimatedRoutes() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [displayLocation, setDisplayLocation] = useState(location)
  const containerRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const isBackRef = useRef(false)
  const skipAnimRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => {
      void import('@/pages/AttendanceEntry')
      void import('@/pages/ClassList')
      void import('@/pages/Attendance')
      void import('@/pages/History')
      void import('@/pages/Schedule')
      void import('@/pages/Grades')
      void import('@/pages/Settings')
      void import('@/pages/Templates')
      void import('@/pages/Login')
      void import('@/pages/ClassPicker')
    }, 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const same =
      location.pathname === displayLocation.pathname &&
      location.search === displayLocation.search &&
      location.key === displayLocation.key
    if (same) return

    const bothTabs = isTabRoute(location.pathname) && isTabRoute(displayLocation.pathname)
    skipAnimRef.current = bothTabs

    if (bothTabs) {
      setDisplayLocation(location)
      return
    }

    const isBack = navigationType === 'POP'
    isBackRef.current = isBack
    const el = containerRef.current
    const outVars = isBack ? pageOutToRight.to : pageOut.to
    runPageOut(el, outVars).then(() => {
      setDisplayLocation(location)
    })
  }, [location, navigationType, displayLocation.key, displayLocation.pathname, displayLocation.search])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const isTab = isTabRoute(displayLocation.pathname)

    if (isFirstRender.current) {
      isFirstRender.current = false
      const enter = isTab ? pageInOpacityOnly : pageIn
      gsap.fromTo(el, enter.from, { ...enter.to, delay: 0.05 })
      return
    }

    if (skipAnimRef.current) {
      gsap.set(el, { opacity: 1, clearProps: 'transform' })
      return
    }

    const isBack = isBackRef.current
    const enter = isTab
      ? pageInOpacityOnly
      : isBack
        ? pageInFromLeft
        : pageIn
    // 返回后进入时先复位 transform，避免上一页的 x 偏移导致新内容在右侧淡入再跳回左侧的卡顿
    if (isTab) gsap.set(el, { x: 0 })
    gsap.fromTo(el, enter.from, enter.to)
  }, [displayLocation.key, displayLocation.pathname, displayLocation.search])

  // 使用 overflow-x-clip 而非 overflow-x-hidden，避免祖先成为 scroll container 导致内层 sticky 吸顶失效
  return (
    <div className="relative min-h-[100vh] w-full overflow-x-clip bg-[var(--bg)]">
      <Suspense fallback={<div className="min-h-[100vh] w-full bg-[var(--bg)]" aria-busy="true" />}>
        <div ref={containerRef} className="min-h-[100vh] w-full" data-animated-container>
          <Routes location={displayLocation}>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route index element={<AttendanceEntry />} />
                <Route path="classes" element={<ClassList />} />
                <Route path="attendance/:classId" element={<Attendance />} />
                <Route path="history" element={<History />} />
                <Route path="history/:classId" element={<History />} />
                <Route path="schedule" element={<ClassPicker title="课程表" basePath="/schedule" />} />
                <Route path="schedule/:classId" element={<Schedule />} />
                <Route path="grades" element={<ClassPicker title="成绩单" basePath="/grades" />} />
                <Route path="grades/:classId" element={<Grades />} />
                <Route path="templates" element={<Templates />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Suspense>
    </div>
  )
}
