import { useEffect, useState, lazy, Suspense } from 'react'
import { useLocation, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { storage } from '@/store/storage'
import AppLayout, { useCurrentClassId } from './AppLayout'
import { useClassList } from '@/hooks/useClassList'

const AttendanceEntry = lazy(() => import('@/pages/AttendanceEntry'))
const Attendance = lazy(() => import('@/pages/Attendance'))
const ClassList = lazy(() => import('@/pages/ClassList'))
const ClassSetupFlow = lazy(() => import('@/pages/ClassSetupFlow'))
const Grades = lazy(() => import('@/pages/Grades'))
const History = lazy(() => import('@/pages/History'))
const Login = lazy(() => import('@/pages/Login'))
const MorePage = lazy(() => import('@/pages/MorePage'))
const Schedule = lazy(() => import('@/pages/Schedule'))
const StudentListPage = lazy(() => import('@/pages/StudentListPage'))

function RequireAuth() {
  if (!storage.loadAuth()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function RedirectToCurrentClass({ basePath }: { basePath: 'history' | 'grades' | 'schedule' }) {
  const { list, loading } = useClassList()
  const { currentClassId } = useCurrentClassId()
  const effectiveClassId = list.find((item) => item.id === currentClassId)?.id ?? list[0]?.id ?? null

  if (loading) {
    return <div className="min-h-[40vh]" aria-busy="true" />
  }

  if (!effectiveClassId) {
    return <Navigate to="/" replace />
  }

  return <Navigate to={`/${basePath}/${effectiveClassId}`} replace />
}

export default function AnimatedRoutes() {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)

  useEffect(() => {
    const timer = setTimeout(() => {
      void import('@/pages/AttendanceEntry')
      void import('@/pages/Attendance')
      void import('@/pages/ClassList')
      void import('@/pages/ClassSetupFlow')
      void import('@/pages/Grades')
      void import('@/pages/History')
      void import('@/pages/Login')
      void import('@/pages/MorePage')
      void import('@/pages/Schedule')
      void import('@/pages/StudentListPage')
    }, 400)

    return () => clearTimeout(timer)
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
              <Route path="/class-setup" element={<ClassSetupFlow />} />
              <Route element={<AppLayout />}>
                <Route index element={<AttendanceEntry />} />
                <Route path="classes" element={<ClassList />} />
                <Route path="more" element={<MorePage />} />
                <Route path="attendance/:classId" element={<Attendance />} />
                <Route path="students/:classId" element={<StudentListPage />} />
                <Route path="schedule" element={<RedirectToCurrentClass basePath="schedule" />} />
                <Route path="schedule/:classId" element={<Schedule />} />
                <Route path="grades" element={<RedirectToCurrentClass basePath="grades" />} />
                <Route path="grades/:classId" element={<Grades />} />
                <Route path="history" element={<RedirectToCurrentClass basePath="history" />} />
                <Route path="history/:classId" element={<History />} />
                <Route path="settings" element={<Navigate to="/more" replace />} />
                <Route path="templates" element={<Navigate to="/more" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Suspense>
    </div>
  )
}
