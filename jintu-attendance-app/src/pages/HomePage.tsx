import { Navigate, useNavigate } from 'react-router-dom'
import { School } from 'lucide-react'
import { useClassList } from '@/hooks/useClassList'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { storage } from '@/store/storage'

/**
 * 首页：有班级时跳转到默认班级（列表第一项）的点名页，无班级时显示空状态并引导到「我的-班级管理」。
 */
export default function HomePage() {
  const navigate = useNavigate()
  const { list, loading } = useClassList()
  const storedId = storage.loadCurrentClassId()
  const currentClassId = list.find((c) => c.id === storedId)?.id ?? list[0]?.id

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]" aria-busy="true" />
    )
  }

  if (list.length > 0 && currentClassId) {
    return <Navigate to={`/attendance/${currentClassId}`} replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] px-5 pb-safe">
      <PageHeader title="首页" />
      <main className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="rounded-[22px] bg-[var(--surface)] border border-[var(--outline-variant)] px-6 py-14 text-center w-full max-w-[300px]">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary-container)]/60">
            <School className="h-10 w-10 text-[var(--primary)]" strokeWidth={1.5} />
          </div>
          <p className="text-[20px] font-semibold tracking-tight text-[var(--on-surface)]">暂无班级</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--on-surface-muted)]">
            请到「我的」→「班级管理」添加班级，列表第一个将作为默认班级并显示在首页。
          </p>
          <Button
            className="mt-7 h-11 rounded-[14px] bg-[var(--primary)] px-6 text-[15px] font-semibold text-white shadow-[0_4px_18px_rgba(0,122,255,0.25)] transition-all duration-75 active:scale-[0.97] active:opacity-90"
            onClick={() => navigate('/classes')}
          >
            去班级管理
          </Button>
        </div>
      </main>
    </div>
  )
}
