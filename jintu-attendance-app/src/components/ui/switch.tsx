import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, 'onChange'> {
  checked: boolean
  onChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, checked, onChange, ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      checked={checked}
      onCheckedChange={onChange}
      className={cn(
        'relative inline-flex shrink-0 rounded-[var(--radius-full)] border border-transparent box-border transition-colors duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-transparent',
        'data-[state=unchecked]:border-[var(--outline)] data-[state=unchecked]:bg-[var(--surface-2)]',
        className
      )}
      style={{
        width: 'var(--switch-track-width)',
        height: 'var(--switch-track-height)',
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none absolute block rounded-[var(--radius-full)] border border-[var(--outline)]/50 bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
          'transition-transform duration-200 ease-out',
          'data-[state=unchecked]:[transform:translateY(-50%)_translateX(0)]',
          'data-[state=checked]:[transform:translateY(-50%)_translateX(var(--switch-thumb-travel))]'
        )}
        style={{
          width: 'var(--switch-thumb-size)',
          height: 'var(--switch-thumb-size)',
          left: 'var(--switch-inset)',
          top: '50%',
        }}
      />
    </SwitchPrimitive.Root>
  )
)
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
