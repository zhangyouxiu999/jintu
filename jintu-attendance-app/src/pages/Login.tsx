import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User } from 'lucide-react'
import { storage } from '@/store/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAppName, getLoginCredentials } from '@/lib/appConfig'

/** 与 public/icon.svg 一致的 logo */
function AppLogo({ className }: { className?: string }) {
  return <img src="/icon.svg" alt="" className={className} aria-hidden />
}

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (storage.loadAuth()) {
      navigate('/', { replace: true })
    }
  }, [navigate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const u = username.trim()
    const p = password
    if (!u || !p) {
      setError('请输入账号和密码')
      return
    }
    setSubmitting(true)
    const credentials = getLoginCredentials()
    if (!credentials) {
      setError('系统未配置登录凭据，请联系管理员')
      setSubmitting(false)
      return
    }
    if (u === credentials.username && p === credentials.password) {
      storage.saveAuth(true)
      navigate('/', { replace: true })
    } else {
      setError('账号或密码错误')
      setSubmitting(false)
    }
  }

  if (storage.loadAuth()) {
    return null
  }

  return (
    <div
      ref={contentRef}
      className="min-h-[100dvh] bg-[var(--bg)] px-[var(--page-x)] pb-[calc(var(--safe-bottom)+24px)] pt-[calc(var(--safe-top)+24px)]"
    >
      <div className="mx-auto flex min-h-[calc(100dvh-var(--safe-top)-var(--safe-bottom)-48px)] w-full max-w-[var(--app-max-width)] items-center">
        <div className="w-full rounded-[24px] border border-[var(--outline)]/75 bg-[var(--surface)] p-5 shadow-[0_10px_24px_rgba(94,79,52,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[var(--primary-container)]">
              <AppLogo className="h-7 w-7 opacity-95" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--on-surface-muted)]">老师个人工作台</p>
              <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-[var(--on-surface)]">{getAppName()}</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div className="space-y-2">
              <label className="block text-[12px] font-medium text-[var(--on-surface-variant)]">账号</label>
              <div className="relative">
              <User className="absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--on-surface-muted)]" strokeWidth={1.5} />
              <Input
                type="text"
                autoComplete="username"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 rounded-[16px] border-[var(--outline)]/70 bg-[var(--surface-2)] pl-10 pr-3 text-[15px] text-[var(--on-surface)] shadow-none outline-none placeholder:text-[var(--on-surface-muted)]"
              />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-medium text-[var(--on-surface-variant)]">密码</label>
              <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--on-surface-muted)]" strokeWidth={1.5} />
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-[16px] border-[var(--outline)]/70 bg-[var(--surface-2)] pl-10 pr-3 text-[15px] text-[var(--on-surface)] shadow-none outline-none placeholder:text-[var(--on-surface-muted)]"
              />
              </div>
            </div>

            {error ? (
              <p className="rounded-[14px] bg-[var(--error-container)] px-3 py-2 text-[13px] text-[var(--error)]" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={submitting}
              className="mt-2 h-[var(--button-lg-height)] w-full rounded-[16px] bg-[var(--primary)] text-[15px] font-semibold text-white disabled:opacity-60"
            >
              {submitting ? '登录中…' : '登录'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
