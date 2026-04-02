import { Navigate } from 'react-router-dom'
import { useCurrentClassId } from '@/components/AppLayout'
import { useClassList } from '@/hooks/useClassList'

export default function AttendanceEntry() {
  const { list, loading } = useClassList()
  const { currentClassId } = useCurrentClassId()
  const effectiveClassId = list.find((item) => item.id === currentClassId)?.id ?? list[0]?.id ?? null

  if (loading) {
    return <div className="min-h-[40vh]" aria-busy="true" />
  }

  if (effectiveClassId) {
    return <Navigate to={`/attendance/${effectiveClassId}`} replace />
  }

  return <Navigate to="/class-setup" replace />
}
