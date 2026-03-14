/**
 * 考勤 App · GSAP 动画预设与工具
 * 全项目统一时长、缓动与复用动效，便于维护与一致性
 */
import gsap from 'gsap'

// 注册 GSAP 插件（若使用 ScrollTrigger 等可在此注册）
// gsap.registerPlugin(ScrollTrigger)

/** 全局默认 */
export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.35,
  panel: 0.28,
} as const

export const EASE = {
  out: 'power2.out',
  inOut: 'power2.inOut',
  in: 'power2.in',
  smooth: 'power3.out',
} as const

/** 页面进入：从右向左滑入 + 淡入 */
export const pageIn = {
  from: { opacity: 0, x: 24 },
  to: {
    opacity: 1,
    x: 0,
    duration: DURATION.slow,
    ease: EASE.out,
    // 动画结束后清除 GSAP 留下的内联 transform
    // 否则 backdrop-filter 和 position:fixed 会因祖先 transform 创建新 stacking context 而失效
    clearProps: 'transform',
  },
}

/** 页面离开：向左滑出 + 淡出（前进时当前页向左滑走） */
export const pageOut = {
  to: {
    opacity: 0,
    x: -24,
    duration: DURATION.normal,
    ease: EASE.in,
  },
}

/** 页面进入（返回）：从左向右滑入 + 淡入 */
export const pageInFromLeft = {
  from: { opacity: 0, x: -24 },
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

/** 页面离开（返回）：向右滑出 + 淡出（当前页向右滑走，露出上一页） */
export const pageOutToRight = {
  to: {
    opacity: 0,
    x: 24,
    duration: DURATION.normal,
    ease: EASE.in,
  },
}

/** 列表子项错落进入 */
export const staggerIn = {
  from: { opacity: 0, y: 10 },
  to: {
    opacity: 1,
    y: 0,
    duration: DURATION.normal,
    ease: EASE.out,
    stagger: 0.04,
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

/**
 * 对容器内子元素做错落进入动画
 */
export function animateStagger(
  container: HTMLElement | null,
  selector: string,
  vars?: gsap.TweenVars
) {
  if (!container) return () => {}
  const els = container.querySelectorAll<HTMLElement>(selector)
  if (!els.length) return () => {}
  const ctx = gsap.context(() => {
    gsap.fromTo(
      els,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: DURATION.normal,
        ease: EASE.out,
        stagger: 0.04,
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
