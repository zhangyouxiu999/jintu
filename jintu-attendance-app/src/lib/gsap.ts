/**
 * 考勤 App · GSAP 动画预设与工具
 * 全项目统一时长、缓动与复用动效；移动端采用更短时长与更少错落以提升流畅度
 */
import gsap from 'gsap'

// 注册 GSAP 插件（若使用 ScrollTrigger 等可在此注册）
// gsap.registerPlugin(ScrollTrigger)

/** 是否减少动画（移动端 / 低性能 或 用户偏好） */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 是否视为移动端（触摸设备，动画压力大） */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function shouldReduceAnimation(): boolean {
  return prefersReducedMotion() || isTouchDevice()
}

/** 全局默认（桌面）；移动端在调用处用更短 duration */
export const DURATION = {
  fast: 0.12,
  normal: 0.2,
  slow: 0.25,
  panel: 0.22,
} as const

/** 移动端/减动效时的更短时长 */
export const DURATION_REDUCED = {
  fast: 0.08,
  normal: 0.12,
  slow: 0.16,
  panel: 0.14,
} as const

export const EASE = {
  out: 'power2.out',
  inOut: 'power2.inOut',
  in: 'power2.in',
  smooth: 'power3.out',
} as const

/** 页面进入：从右向左滑入 + 淡入（duration 由调用方按 shouldReduceAnimation 选择） */
export const pageIn = {
  from: { opacity: 0, x: 20 },
  to: {
    opacity: 1,
    x: 0,
    duration: DURATION.slow,
    ease: EASE.out,
    clearProps: 'transform',
  },
}

/** 页面离开：向左滑出 + 淡出 */
export const pageOut = {
  to: {
    opacity: 0,
    x: -20,
    duration: DURATION.normal,
    ease: EASE.in,
  },
}

/** 页面进入（返回）：从左向右滑入 + 淡入 */
export const pageInFromLeft = {
  from: { opacity: 0, x: -20 },
  to: {
    opacity: 1,
    x: 0,
    duration: DURATION.slow,
    ease: EASE.out,
    clearProps: 'transform',
  },
}

/** 页面进入（仅透明度）：用于含 sticky 的页面，避免 transform 破坏吸顶 */
export const pageInOpacityOnly = {
  from: { opacity: 0 },
  to: {
    opacity: 1,
    duration: DURATION.slow,
    ease: EASE.out,
    clearProps: 'transform',
  },
}

/** 页面离开（返回）：向右滑出 + 淡出 */
export const pageOutToRight = {
  to: {
    opacity: 0,
    x: 20,
    duration: DURATION.normal,
    ease: EASE.in,
  },
}

/** 列表子项错落进入（stagger 不宜过大，移动端元素多时易卡顿） */
export const staggerIn = {
  from: { opacity: 0, y: 8 },
  to: {
    opacity: 1,
    y: 0,
    duration: DURATION.normal,
    ease: EASE.out,
    stagger: 0.025,
  },
}

/** 面板展开/折叠（如公告面板） */
export const panelOpen = {
  from: { opacity: 0 },
  to: { opacity: 1, duration: DURATION.panel, ease: EASE.out },
}

export const panelClose = {
  to: { opacity: 0, duration: DURATION.fast, ease: EASE.in },
}

/** 弹层/模态：缩放 + 淡入 */
export const modalIn = {
  from: { opacity: 0, scale: 0.96 },
  to: { opacity: 1, scale: 1, duration: DURATION.normal, ease: EASE.out },
}

/** 卡片/按钮：轻微按压反馈（由 CSS 或 GSAP 按需使用） */
export const tapScale = { scale: 0.98, duration: 0.1, ease: EASE.out }

/** 错落动画最多处理的子元素数，避免长列表在移动端卡顿 */
const STAGGER_CAP = 18

/**
 * 对容器内子元素做错落进入动画（移动端/减动效时缩短时长、减少错落、限制数量）
 */
export function animateStagger(
  container: HTMLElement | null,
  selector: string,
  vars?: gsap.TweenVars
) {
  if (!container) return () => {}
  const allEls = container.querySelectorAll<HTMLElement>(selector)
  if (!allEls.length) return () => {}
  const reduce = shouldReduceAnimation()
  const els = allEls.length > STAGGER_CAP ? Array.from(allEls).slice(0, STAGGER_CAP) : allEls
  const duration = reduce ? DURATION_REDUCED.normal : DURATION.normal
  const stagger = reduce ? 0.015 : 0.025
  const yFrom = reduce ? 6 : 8
  const ctx = gsap.context(() => {
    gsap.fromTo(
      els,
      { opacity: 0, y: yFrom },
      {
        opacity: 1,
        y: 0,
        duration,
        ease: EASE.out,
        stagger,
        ...vars,
      }
    )
  }, container)
  return () => ctx.revert()
}

/**
 * 页面离开：返回 Promise，在动画结束后 resolve
 */
export function runPageOut(
  el: HTMLElement | null,
  overrides?: gsap.TweenVars
): Promise<void> {
  if (!el) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.to(el, {
      ...pageOut.to,
      ...overrides,
      onComplete: () => resolve(),
    })
  })
}
