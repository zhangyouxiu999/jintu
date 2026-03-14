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
      className="flex min-h-screen flex-col bg-[var(--bg)] px-5 pt-[var(--safe-top)] pb-[var(--safe-bottom)]"
    >
      <div className="flex flex-1 flex-col items-center justify-center py-10">
        <div className="login-logo mb-7 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] shadow-[0_12px_32px_rgba(0,122,255,0.28)]">
          <AppLogo className="h-10 w-10 opacity-95" />
        </div>
        <h1 className="login-title mb-1 text-[22px] font-bold tracking-tight text-[var(--on-surface)]">{getAppName()}</h1>
        <p className="login-title mb-8 text-[14px] text-[var(--on-surface-muted)]">请登录后使用</p>

        <form onSubmit={handleSubmit} className="login-form w-full max-w-[320px]">
          <div className="overflow-hidden rounded-[20px] bg-white">
            <label className="block px-4 pt-4 pb-0.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--on-surface-muted)]">账号</label>
            <div className="relative px-1 pb-0">
              <User className="absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--on-surface-muted)]" strokeWidth={1.5} />
              <Input
                type="text"
                autoComplete="username"
                placeholder="请输入账号"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 rounded-none border-0 border-b border-[var(--outline-variant)] bg-transparent pl-10 pr-3 text-[15px] text-[var(--on-surface)] shadow-none outline-none placeholder:text-[var(--on-surface-muted)] focus-visible:ring-0"
              />
            </div>
            <label className="block px-4 pt-3 pb-0.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--on-surface-muted)]">密码</label>
            <div className="relative px-1 pb-0">
              <Lock className="absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[var(--on-surface-muted)]" strokeWidth={1.5} />
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-none border-0 bg-transparent pl-10 pr-3 text-[15px] text-[var(--on-surface)] shadow-none outline-none placeholder:text-[var(--on-surface-muted)] focus-visible:ring-0"
              />
            </div>
            {error ? (
              <p className="px-4 pt-2 pb-0 text-[13px] text-[var(--error)]" role="alert">
                {error}
              </p>
            ) : null}
            <div className="p-4 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-[14px] bg-[var(--primary)] text-[16px] font-semibold text-white transition-all duration-200 active:scale-[0.97] active:opacity-90 disabled:opacity-60"
              >
                {submitting ? '登录中…' : '登录'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
