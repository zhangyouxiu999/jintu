import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-label transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 aria-invalid:ring-[var(--error)]/20',
  {
    variants: {
      variant: {
        /* iOS 主按钮：系统蓝、白字、semibold、极轻阴影 */
        default: 'bg-[var(--primary)] text-[var(--on-primary)] font-semibold active:opacity-95 shadow-[0_1px_0_rgba(28,28,30,0.06)]',
        /* 危险操作：系统红、白字、semibold */
        destructive: 'bg-[var(--error)] text-[var(--on-primary)] font-semibold active:opacity-95 focus-visible:ring-[var(--error)]/30',
        /* 取消/次要：细描边、表面色，iOS 级柔和 */
        outline: 'border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] active:bg-[var(--surface-2)]',
        secondary: 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-medium',
        inverse: 'bg-[var(--on-surface)] text-[var(--surface)] font-semibold active:opacity-95',
        ghost: 'text-[var(--on-surface)]',
        link: 'text-[var(--primary)] underline-offset-4',
      },
      size: {
        default: 'h-[var(--touch-target)] px-4 py-2 has-[>svg]:px-3',
        xs: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5 text-caption min-h-0',
        sm: 'h-9 gap-1.5 px-3 has-[>svg]:px-2.5 text-label',
        lg: 'h-12 px-6 has-[>svg]:px-4 text-body',
        icon: 'size-10 min-w-10 min-h-10',
        'icon-sm': 'size-9 min-w-9 min-h-9',
        'icon-lg': 'size-12 min-w-12 min-h-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean }
>(function Button(
  { className, variant = 'default', size = 'default', asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

export { Button, buttonVariants }
