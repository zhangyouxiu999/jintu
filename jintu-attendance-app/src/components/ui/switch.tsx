import * as React from 'react'
import { Switch as TamaguiSwitch, styled } from 'tamagui'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends Omit<React.ComponentProps<typeof TamaguiSwitch>, 'onChange' | 'onCheckedChange'> {
  checked: boolean
  onChange?: (checked: boolean) => void
}

const SwitchFrame = styled(TamaguiSwitch, {
  name: 'AppSwitch',
  width: 42,
  height: 24,
  padding: 2,
  borderRadius: 999,
  borderWidth: 1,
  alignItems: 'flex-start',
  justifyContent: 'center',
  backgroundColor: 'var(--surface-2)',
  borderColor: 'var(--outline)',
  focusVisibleStyle: {
    outlineColor: '$outlineColor',
    outlineStyle: 'solid',
    outlineWidth: 2,
    outlineOffset: 2,
  },
  disabledStyle: {
    pointerEvents: 'none',
    opacity: 0.5,
  },
})

const SwitchThumb = styled(TamaguiSwitch.Thumb, {
  name: 'AppSwitchThumb',
  width: 20,
  height: 20,
  borderRadius: 999,
  backgroundColor: '#FFFDFC',
  borderWidth: 1,
  borderColor: 'rgba(108, 114, 107, 0.12)',
  shadowColor: 'rgba(94, 79, 52, 0.14)',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 1,
  shadowRadius: 3,
})

const Switch = React.forwardRef<HTMLElement, SwitchProps>(
  ({ className, checked, onChange, ...props }, ref) => (
    <SwitchFrame
      ref={ref as never}
      checked={checked}
      onCheckedChange={onChange}
      backgroundColor={checked ? 'var(--primary)' : 'var(--surface-2)'}
      borderColor={checked ? 'transparent' : 'var(--outline)'}
      className={cn('shrink-0 transition-colors duration-200 ease-out', className)}
      {...(props as object)}
    >
      <SwitchThumb x={checked ? 18 : 0} />
    </SwitchFrame>
  )
)
Switch.displayName = 'Switch'

export { Switch }
