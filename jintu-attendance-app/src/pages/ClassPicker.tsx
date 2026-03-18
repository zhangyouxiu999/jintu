import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { School } from 'lucide-react'
import { useClassList } from '@/hooks/useClassList'
import { Button } from '@/components/ui/button'

export interface ClassPickerProps {
  title: string
  basePath: string
}

export default function ClassPicker({ title, basePath }: ClassPickerProps) {
  const navigate = useNavigate()
  const { list, loading } = useClassList()
  const listRef = useRef<HTMLDivElement>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <main className="flex min-h-[200px] items-center justify-center py-12" aria-busy="true" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <main className="py-4">
        <div className="mb-4 px-[var(--page-x)]">
          <h2 className="text-title text-[var(--on-surface)] tracking-tight">{title}</h2>
          <p className="mt-1 text-[13px] text-[var(--on-surface-muted)]">请选择要查看的班级</p>
        </div>
        {list.length === 0 ? (
          <div className="card-soft mx-[var(--page-x)] py-12 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary)]/20">
              <School className="h-12 w-12 text-[var(--primary)]" />
            </div>
            <p className="text-display text-[var(--on-surface)]">暂无班级</p>
            <p className="mt-2 text-label text-[var(--on-surface-variant)]">请先在首页新增班级</p>
            <Button
              className="mt-6 h-10 rounded-[var(--radius-md)] bg-[var(--primary)] px-5 text-label font-semibold text-[var(--on-primary)] shadow-elevation-2"
              onClick={() => navigate('/')}
            >
              去首页
            </Button>
          </div>
        ) : (
          <div ref={listRef} className="space-y-3 px-[var(--page-x)]">
            {list.map((cls) => (
              <div
                key={cls.id}
                className="card-soft flex min-h-12 w-full items-center gap-3 px-4 py-3"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`${basePath}/${cls.id}`)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left h-auto py-3"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary)]/15 text-label font-semibold text-[var(--primary)]">
                    {cls.name.charAt(0)}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-label font-medium text-[var(--on-surface)]">
                    {cls.name}
                  </span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
