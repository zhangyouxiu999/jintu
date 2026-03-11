/**
 * 统一轻提示：顶部居中、玻璃卡片风格，支持成功/默认/错误样式。
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
    'rounded-[var(--radius-md)] px-3 py-2',
    'text-label font-medium text-center',
    'shadow-elevation-1',
  ].join(' ')
  el.style.top = 'calc(var(--safe-top) + var(--page-x))'
  el.style.left = '50%'
  el.style.width = 'max-content'
  el.style.minWidth = '80px'
  el.style.maxWidth = 'min(56vw, 260px)'
  el.style.border = 'none'
  el.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out'
  el.style.opacity = '0'
  el.style.transform = 'translate(-50%, -10px)'

  if (variant === 'error') {
    el.style.backgroundColor = 'var(--error-container)'
    el.style.color = 'var(--error)'
  } else if (variant === 'success') {
    el.style.backgroundColor = 'var(--success-container)'
    el.style.color = 'var(--success)'
  } else {
    el.style.backgroundColor = 'var(--surface)'
    el.style.color = 'var(--on-surface)'
  }

  document.body.appendChild(el)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = 'translate(-50%, 0)'
    })
  })
  const t = setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translate(-50%, -6px)'
    el.style.transition = 'opacity 0.18s ease-in, transform 0.18s ease-in'
    setTimeout(() => el.remove(), 180)
  }, duration)
  return () => clearTimeout(t)
}
