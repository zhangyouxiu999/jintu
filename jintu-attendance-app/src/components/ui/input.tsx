import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
        'flex h-9 w-full min-w-0 rounded-[var(--radius-sm)] border border-[var(--outline)] bg-[var(--surface)] px-3 py-2 text-body text-[var(--on-surface)] placeholder:text-[var(--on-surface-muted)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-label disabled:pointer-events-none disabled:opacity-50',
        'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 focus:ring-offset-0',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className
      )}
        {...props}
      />
    )
  }
)

export { Input }
