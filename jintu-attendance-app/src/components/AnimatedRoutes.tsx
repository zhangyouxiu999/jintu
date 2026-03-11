import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { useLocation, useNavigationType, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { storage } from '@/store/storage'
import { runPageOut, pageIn, pageInFromLeft, pageOut, pageOutToRight } from '@/lib/gsap'
import gsap from 'gsap'
import BottomNav from './BottomNav'

const HomePage = lazy(() => import('@/pages/HomePage'))
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

/** 仅提供底部留白，底栏在 AnimatedRoutes 中单独渲染且不参与页面动画 */
function LayoutWithBottomNav() {
  return (
    <div
      className="min-h-screen w-full"
      style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
    >
      <Outlet />
    </div>
  )
}

/**
 * 路由切换由 GSAP 驱动：先执行当前页离开动画，再渲染新页面并执行进入动画。
 */
export default function AnimatedRoutes() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const [displayLocation, setDisplayLocation] = useState(location)
  const containerRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const isBackRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => {
      void import('@/pages/HomePage')
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

  // 路由变化：先离开再更新展示路由（返回用向右滑出，前进用向左滑出）
  useEffect(() => {
    const same =
      location.pathname === displayLocation.pathname &&
      location.search === displayLocation.search &&
      location.key === displayLocation.key
    if (same) return

    const isBack = navigationType === 'POP'
    isBackRef.current = isBack
    const el = containerRef.current
    const outVars = isBack ? pageOutToRight.to : pageOut.to
    runPageOut(el, outVars).then(() => {
      setDisplayLocation(location)
    })
  }, [location, navigationType, displayLocation.key, displayLocation.pathname, displayLocation.search])

  // 展示路由更新后：执行进入动画（返回从左向右滑入，前进从右向左滑入）
  // 不在 cleanup 里 revert，避免切换时清掉 opacity 导致新页闪一下出现“小白块”
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (isFirstRender.current) {
      isFirstRender.current = false
      gsap.fromTo(el, pageIn.from, { ...pageIn.to, delay: 0.05 })
      return
    }

    const isBack = isBackRef.current
    const enter = isBack ? pageInFromLeft : pageIn
    gsap.fromTo(el, enter.from, enter.to)
  }, [displayLocation.key, displayLocation.pathname, displayLocation.search])

  const showBottomNav = displayLocation.pathname !== '/login'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflowX: 'hidden',
        backgroundColor: 'var(--bg)',
      }}
    >
      <Suspense fallback={<div className="min-h-[100vh] w-full bg-[var(--bg)]" aria-busy="true" />}>
        <div ref={containerRef} className="min-h-[100vh] w-full">
          <Routes location={displayLocation}>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<LayoutWithBottomNav />}>
                <Route index element={<HomePage />} />
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
        {showBottomNav && <BottomNav />}
      </Suspense>
    </div>
  )
}
