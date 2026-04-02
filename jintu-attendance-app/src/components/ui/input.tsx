import * as React from 'react'
import { Input as TamaguiInput } from 'tamagui'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  function Input({ className, type, ...props }, ref) {
    return (
      <TamaguiInput
        ref={ref as never}
        type={type}
        data-slot="input"
        className={cn(
          'flex h-[var(--button-md-height)] w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--outline)] bg-[var(--surface)] px-4 py-2.5 text-[15px] font-normal text-[var(--on-surface)] placeholder:text-[14px] placeholder:text-[var(--on-surface-muted)] shadow-[0_2px_10px_rgba(94,79,52,0.03)] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-label disabled:pointer-events-none disabled:opacity-50',
          'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 focus:ring-offset-0',
          'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
          className
        )}
        {...(props as object)}
      />
    )
  }
)

export { Input }
