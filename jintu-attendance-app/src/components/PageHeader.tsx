export const pageHeaderShellClassName = 'hidden'

export interface PageHeaderProps {
  /** 标题（必填） */
  title: string
  /** 点击返回时调用；不传则不渲染返回按钮（如首页） */
  onBack?: () => void
  /** 标题右侧区域（如导出按钮） */
  right?: React.ReactNode
  /** 标题的额外 class */
  titleClassName?: string
  /** header 的额外 class */
  className?: string
}

/**
 * 旧页面头部已由全局 AppLayout 接管，保留空壳以兼容现有页面引用。
 */
export function PageHeader(_props: PageHeaderProps) {
  return null
}

export default PageHeader
