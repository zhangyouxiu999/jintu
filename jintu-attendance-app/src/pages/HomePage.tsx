import { Navigate, useNavigate } from 'react-router-dom'
import { School } from 'lucide-react'
import { useClassList } from '@/hooks/useClassList'
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
    <div className="flex min-h-screen flex-col bg-[var(--bg)] px-[var(--page-x)]" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <header
        className="glass-bar sticky top-0 z-50 flex h-14 items-center border-b border-[var(--outline-variant)] px-[var(--page-x)] shadow-elevation-1"
        style={{ paddingTop: 'var(--safe-top)', minHeight: 'calc(56px + var(--safe-top))' }}
      >
        <h1 className="text-title font-semibold text-[var(--on-surface)]">首页</h1>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="card-soft w-full max-w-[280px] py-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary)]/20">
            <School className="h-12 w-12 text-[var(--primary)]" />
          </div>
          <p className="text-display text-[var(--on-surface)]">暂无班级</p>
          <p className="mt-2 text-label text-[var(--on-surface-variant)]">
            请到「我的」→「班级管理」添加班级，列表第一个将作为默认班级并显示在首页。
          </p>
          <Button
            className="mt-6 h-10 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-label font-semibold text-[var(--on-primary)] shadow-elevation-2 active:scale-[0.98]"
            onClick={() => navigate('/classes')}
          >
            去班级管理
          </Button>
        </div>
      </main>
    </div>
  )
}
