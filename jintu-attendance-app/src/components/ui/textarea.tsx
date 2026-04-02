import * as React from 'react'
import { TextArea as TamaguiTextArea } from 'tamagui'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <TamaguiTextArea
        ref={ref as never}
        data-slot="textarea"
        className={cn(
          'flex min-h-[132px] w-full rounded-[var(--radius-md)] border border-[var(--outline)] bg-[var(--surface)] px-4 py-3 text-[15px] leading-6 text-[var(--on-surface)] placeholder:text-[14px] placeholder:text-[var(--on-surface-muted)] shadow-[0_2px_10px_rgba(94,79,52,0.03)] outline-none disabled:pointer-events-none disabled:opacity-50',
          'focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 focus:ring-offset-0',
          className
        )}
        {...(props as object)}
      />
    )
  }
)

export { Textarea }
