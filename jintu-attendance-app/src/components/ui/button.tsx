import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-label transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 aria-invalid:ring-[var(--error)]/20',
  {
    variants: {
      variant: {
        default: 'bg-[var(--primary)] text-[var(--on-primary)] font-semibold shadow-[0_10px_24px_rgba(111,138,114,0.16)] hover:bg-[var(--primary-hover)]',
        destructive: 'bg-[var(--error)] text-[var(--on-primary)] font-semibold focus-visible:ring-[var(--error)]/30 hover:opacity-90',
        outline: 'border border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface)] shadow-[0_2px_8px_rgba(94,79,52,0.04)] hover:bg-[var(--surface-hover)]',
        secondary: 'bg-[var(--primary-container)] text-[var(--on-primary-container)] font-medium hover:opacity-90',
        inverse: 'bg-[var(--on-surface)] text-[var(--surface)] font-semibold hover:opacity-92',
        ghost: 'text-[var(--on-surface)] hover:bg-[var(--surface-hover)]',
        link: 'text-[var(--primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[var(--button-md-height)] px-4 py-2 has-[>svg]:px-3 text-[15px] font-medium',
        xs: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5 text-[12px] min-h-0',
        sm: 'h-[var(--button-sm-height)] gap-1.5 px-3 has-[>svg]:px-2.5 text-[14px] font-medium',
        lg: 'h-[var(--button-lg-height)] px-6 has-[>svg]:px-4 text-[15px] font-semibold',
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

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function renderButtonChildren(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return <span className="inline-flex min-w-0 items-center justify-center leading-none">{child}</span>
    }
    return child
  })
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', asChild = false, type = 'button', children, ...props },
  ref
) {
  const resolvedClassName = cn(buttonVariants({ variant, size, className }))

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>

    return React.cloneElement(child, {
      ...(props as object),
      className: cn(resolvedClassName, child.props.className),
      'data-slot': 'button',
      'data-variant': variant,
      'data-size': size,
    } as Record<string, unknown>)
  }

  return (
    <button
      ref={ref}
      type={type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={resolvedClassName}
      {...props}
    >
      {renderButtonChildren(children)}
    </button>
  )
})

export { Button, buttonVariants }
