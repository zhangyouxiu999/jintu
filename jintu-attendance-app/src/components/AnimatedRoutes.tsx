import { useEffect, useState, lazy, Suspense } from 'react'
import { useLocation, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { storage } from '@/store/storage'
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

/**
 * 路由切换无动画，直接渲染当前 location 对应页面。
 */
export default function AnimatedRoutes() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)

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
    setDisplayLocation(location)
  }, [location])

  return (
    <div className="relative min-h-[100vh] w-full overflow-x-clip bg-[var(--bg)]">
      <Suspense fallback={<div className="min-h-[100vh] w-full bg-[var(--bg)]" aria-busy="true" />}>
        <div className="min-h-[100vh] w-full" data-animated-container>
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
