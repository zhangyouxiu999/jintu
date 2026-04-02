import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  /** 出错时展示的 fallback */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/** 捕获子组件树错误，避免整页白屏，展示可重试的 fallback */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  retry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6">
          <p className="text-center text-body text-[var(--on-surface-muted)]">出错了，请重试</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-[var(--radius-sm)] border-[var(--outline)] bg-[var(--surface)] px-4 text-[14px] text-[var(--on-surface)]"
            onClick={this.retry}
          >
            重试
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
