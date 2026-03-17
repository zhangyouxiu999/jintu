import { Navigate, useNavigate } from 'react-router-dom'
import { ClipboardCheck, School } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrentClassId } from '@/components/AppLayout'
import { useClassList } from '@/hooks/useClassList'

export default function AttendanceEntry() {
  const navigate = useNavigate()
  const { list, loading } = useClassList()
  const { currentClassId } = useCurrentClassId()
  const effectiveClassId = list.find((item) => item.id === currentClassId)?.id ?? list[0]?.id ?? null
  const currentClass = list.find((item) => item.id === effectiveClassId) ?? null

  if (loading) {
    return <div className="min-h-[40vh]" aria-busy="true" />
  }

  if (effectiveClassId) {
    return <Navigate to={`/attendance/${effectiveClassId}`} replace />
  }

  return (
    <section className="flex min-h-[calc(100dvh-240px)] items-center">
      <div className="card-soft w-full overflow-hidden p-6">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary-container)]/50 text-[var(--primary)]">
          <ClipboardCheck className="h-7 w-7" strokeWidth={1.5} />
        </div>

        <h2 className="text-[22px] font-bold tracking-tight text-[var(--on-surface)]">
          还没有可展示的点名班级
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--on-surface-muted)]">
          当前首页会优先展示你最近选择的班级；如果还没创建班级，请先到"我的"里完成班级管理。
        </p>

        <div className="mt-5 rounded-[18px] bg-[var(--surface-2)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[var(--surface)] text-[var(--primary)]">
              <School className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[var(--on-surface)]">默认班级</p>
              <p className="text-[13px] text-[var(--on-surface-muted)]">
                {currentClass?.name ?? '暂无默认班级'}
              </p>
            </div>
          </div>
        </div>

        <Button
          className="mt-5 h-12 w-full rounded-[16px] bg-[var(--primary)] text-[16px] font-semibold text-white transition-[transform,opacity] duration-75 ease-out active:scale-[0.97] active:opacity-85"
          onClick={() => navigate('/settings')}
        >
          去我的页面设置班级
        </Button>
      </div>
    </section>
  )
}
