import * as React from 'react'
import { Text, View, YStack } from 'tamagui'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function ListSection({
  children,
  className,
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('overflow-hidden rounded-[20px] border border-[var(--outline-variant)]/80 bg-[var(--surface)] shadow-[0_4px_12px_rgba(94,79,52,0.02)]', className)}>
      {children}
    </div>
  )
}

interface SimpleListRowProps {
  title: React.ReactNode
  description?: React.ReactNode
  leading?: React.ReactNode
  trailing?: React.ReactNode
  trailingAction?: React.ReactNode
  titleClassName?: string
  descriptionClassName?: string
  contentClassName?: string
  className?: string
  onClick?: () => void
  disabled?: boolean
  'data-testid'?: string
}

function RowContent({
  title,
  description,
  leading,
  trailing,
  titleClassName,
  descriptionClassName,
}: Pick<SimpleListRowProps, 'title' | 'description' | 'leading' | 'trailing' | 'titleClassName' | 'descriptionClassName'>) {
  return (
    <>
      {leading ? <View className="flex shrink-0 items-center justify-center self-center">{leading}</View> : null}
      <YStack className="min-w-0 flex-1 items-start justify-center self-center">
        <Text className={cn('w-full text-[15px] font-medium leading-5 text-[var(--on-surface)]', titleClassName)}>
          {title}
        </Text>
        {description ? (
          <Text className={cn('mt-0.5 w-full text-[12px] leading-4 text-[var(--on-surface-muted)]', descriptionClassName)}>
            {description}
          </Text>
        ) : null}
      </YStack>
      {trailing ? <View className="flex shrink-0 items-center justify-center self-center">{trailing}</View> : null}
    </>
  )
}

export function SimpleListRow({
  title,
  description,
  leading,
  trailing,
  trailingAction,
  className,
  contentClassName,
  titleClassName,
  descriptionClassName,
  onClick,
  disabled,
  ...props
}: SimpleListRowProps) {
  const content = (
    <div className={cn('flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left', contentClassName)}>
      <RowContent
        title={title}
        description={description}
        leading={leading}
        trailing={trailing}
        titleClassName={titleClassName}
        descriptionClassName={descriptionClassName}
      />
    </div>
  )

  if (onClick) {
    return (
      <div className={cn('flex min-h-[56px] w-full items-stretch', className)} {...props}>
        <Button
          type="button"
          variant="ghost"
          className="flex h-auto min-w-0 flex-1 justify-start rounded-none px-0 py-0 text-left shadow-none"
          onClick={onClick}
          disabled={disabled}
        >
          {content}
        </Button>
        {trailingAction ? <div className="flex shrink-0 items-center px-4 py-3">{trailingAction}</div> : null}
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-[56px] w-full items-stretch', className)} {...props}>
      <div
        className={cn(
          'flex min-w-0 flex-1',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        {content}
      </div>
      {trailingAction ? <div className="flex shrink-0 items-center px-4 py-3">{trailingAction}</div> : null}
    </div>
  )
}
