/**
 * 统一轻提示：顶部居中、系统风极简样式，surface + 细描边 + 轻阴影，成功/错误仅左侧色条区分。
 */
export type ToastVariant = 'default' | 'success' | 'error'

const TOAST_DURATION = 2200

export function showToast(message: string, options?: { variant?: ToastVariant; duration?: number }) {
  if (typeof document === 'undefined') return
  const variant = options?.variant ?? 'default'
  const duration = options?.duration ?? TOAST_DURATION

  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.setAttribute('aria-live', 'polite')
  el.textContent = message

  el.className = [
    'fixed z-[100]',
    'rounded-[var(--radius-sm)] px-3 py-2',
    'text-[12px] font-medium text-center leading-snug',
  ].join(' ')
  el.style.top = 'calc(var(--safe-top) + 12px)'
  el.style.left = '50%'
  el.style.width = 'max-content'
  el.style.minWidth = '72px'
  el.style.maxWidth = 'min(68vw, 240px)'
  el.style.backgroundColor = 'var(--surface)'
  el.style.color = 'var(--on-surface)'
  el.style.border = '1px solid var(--outline)'
  el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'
  el.style.transition = 'opacity 0.22s ease-out, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)'
  el.style.opacity = '0'
  el.style.transform = 'translate(-50%, -12px) scale(0.96)'

  if (variant === 'error') {
    el.style.borderLeft = '3px solid var(--error)'
  } else if (variant === 'success') {
    el.style.borderLeft = '3px solid var(--success)'
  }

  document.body.appendChild(el)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = 'translate(-50%, 0) scale(1)'
    })
  })
  const t = setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translate(-50%, -6px) scale(0.98)'
    el.style.transition = 'opacity 0.2s ease-in, transform 0.2s ease-in'
    setTimeout(() => el.remove(), 200)
  }, duration)
  return () => clearTimeout(t)
}
