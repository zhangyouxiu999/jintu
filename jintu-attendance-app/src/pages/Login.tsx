import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { Lock, User } from 'lucide-react'
import { storage } from '@/store/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DURATION, EASE } from '@/lib/gsap'
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

  useEffect(() => {
    if (!contentRef.current) return
    const ctx = gsap.context(() => {
      const el = contentRef.current
      if (!el) return
      const logo = el.querySelector('.login-logo')
      const title = el.querySelector('.login-title')
      const form = el.querySelector('.login-form')
      gsap.set([logo, title, form], { opacity: 0, y: 12 })
      gsap.to(logo, { opacity: 1, y: 0, duration: DURATION.normal, ease: EASE.out })
      gsap.to(title, { opacity: 1, y: 0, duration: DURATION.normal, delay: 0.06, ease: EASE.out })
      gsap.to(form, { opacity: 1, y: 0, duration: DURATION.normal, delay: 0.12, ease: EASE.out })
    }, contentRef.current)
    return () => ctx.revert()
  }, [])

  if (storage.loadAuth()) {
    return null
  }

  return (
    <div
      ref={contentRef}
      className="flex min-h-screen flex-col bg-[var(--bg)] px-[var(--page-x)]"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center py-10">
        <div className="login-logo mb-8 flex h-16 w-16 items-center justify-center rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] shadow-elevation-2">
          <AppLogo className="h-9 w-9 opacity-95" />
        </div>
        <h1 className="login-title text-title mb-1 font-semibold tracking-tight text-[var(--on-surface)]">{getAppName()}</h1>
        <p className="login-title text-caption mb-6 text-[var(--on-surface-muted)]">请登录后使用</p>

        <form onSubmit={handleSubmit} className="login-form w-full max-w-[300px]">
          <div className="card-soft p-5">
            <label className="mb-1 block text-tiny font-medium text-[var(--on-surface-variant)]">账号</label>
            <div className="relative mb-3">
              <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--on-surface-muted)]" />
              <Input
                type="text"
                autoComplete="username"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface-2)] pl-8 pr-3 text-caption"
              />
            </div>
            <label className="mb-1 block text-tiny font-medium text-[var(--on-surface-variant)]">密码</label>
            <div className="relative mb-3">
              <Lock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--on-surface-muted)]" />
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface-2)] pl-8 pr-3 text-caption"
              />
            </div>
            {error ? (
              <p className="mb-2 text-tiny text-[var(--error)]" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 w-full rounded-[var(--radius-md)] bg-[var(--primary)] text-label font-semibold text-[var(--on-primary)] shadow-elevation-2 active:scale-[0.98]"
            >
              {submitting ? '登录中…' : '登录'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
