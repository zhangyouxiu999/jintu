import * as React from 'react'
import { type LucideIcon } from 'lucide-react'
import { Text, View, XStack, YStack } from 'tamagui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Tone = 'primary' | 'muted' | 'danger' | 'success'

const toneClasses: Record<Tone, string> = {
  primary: 'bg-[var(--primary-container)] text-[var(--primary)]',
  muted: 'bg-[var(--surface-2)] text-[var(--on-surface-muted)]',
  danger: 'bg-[var(--error-container)] text-[var(--error)]',
  success: 'bg-[var(--success-container)] text-[var(--success)]',
}

const iconSizes = {
  sm: 'h-9 w-9 rounded-[12px] [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-11 w-11 rounded-[16px] [&_svg]:h-5 [&_svg]:w-5',
  lg: 'h-16 w-16 rounded-[20px] [&_svg]:h-8 [&_svg]:w-8',
  xl: 'h-20 w-20 rounded-[22px] [&_svg]:h-10 [&_svg]:w-10',
} as const

interface SurfaceCardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div'
  inset?: 'md' | 'lg'
  density?: 'default' | 'compact'
}

export function SurfaceCard({
  as = 'section',
  inset = 'md',
  density = 'default',
  className,
  children,
  ...props
}: SurfaceCardProps) {
  const Comp = as

  return (
    <Comp
      className={cn(
        'rounded-[20px] border border-[var(--outline)]/75 bg-[var(--surface)] shadow-[0_6px_18px_rgba(94,79,52,0.03)]',
        inset === 'lg'
          ? density === 'compact' ? 'p-4' : 'p-5'
          : density === 'compact' ? 'p-3.5' : 'p-4',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}

interface IconBadgeProps {
  icon: LucideIcon
  tone?: Tone
  size?: keyof typeof iconSizes
  className?: string
  iconClassName?: string
}

export function IconBadge({
  icon: Icon,
  tone = 'primary',
  size = 'md',
  className,
  iconClassName,
}: IconBadgeProps) {
  return (
    <View className={cn('flex shrink-0 items-center justify-center', toneClasses[tone], iconSizes[size], className)}>
      <Icon className={cn(iconClassName)} strokeWidth={1.7} />
    </View>
  )
}

interface TextPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function TextPill({ tone = 'primary', className, children, ...props }: TextPillProps) {
  return (
    <Text
      tag="span"
      className={cn(
        'rounded-full px-2.5 py-1 text-[10px] font-medium',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </Text>
  )
}

interface SectionHeaderProps {
  eyebrow?: React.ReactNode
  leading?: React.ReactNode
  title: React.ReactNode
  titleAs?: 'h1' | 'h2' | 'h3' | 'p'
  description?: React.ReactNode
  descriptionAs?: 'p' | 'div' | 'span'
  badge?: React.ReactNode
  className?: string
  contentClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  eyebrowClassName?: string
  compact?: boolean
}

export function SectionHeader({
  eyebrow,
  leading,
  title,
  titleAs = 'h2',
  description,
  descriptionAs = 'p',
  badge,
  className,
  contentClassName,
  titleClassName,
  descriptionClassName,
  eyebrowClassName,
  compact = false,
}: SectionHeaderProps) {
  const TitleTag = titleAs
  const DescriptionTag = descriptionAs

  return (
    <YStack className={cn(compact ? 'space-y-1.5' : 'space-y-2', className)}>
      {eyebrow ? (
        <Text className={cn('text-[12px] font-medium text-[var(--on-surface-muted)]', eyebrowClassName)}>
          {eyebrow}
        </Text>
      ) : null}
      <XStack className="w-full items-start justify-between gap-3">
        <XStack className={cn('min-w-0 flex-1 items-start gap-3', contentClassName)}>
          {leading}
          <YStack className="min-w-0">
            <TitleTag className={cn(compact ? 'text-[18px]' : 'text-[20px]', 'font-semibold tracking-tight text-[var(--on-surface)]', titleClassName)}>
              {title}
            </TitleTag>
            {description ? (
              <DescriptionTag className={cn(compact ? 'mt-0.5 text-[12px] leading-5' : 'mt-1 text-[14px] leading-6', 'text-[var(--on-surface-muted)]', descriptionClassName)}>
                {description}
              </DescriptionTag>
            ) : null}
          </YStack>
        </XStack>
        {badge ? <View className="shrink-0">{badge}</View> : null}
      </XStack>
    </YStack>
  )
}

interface EmptyStateCardProps {
  icon: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  actionLabel?: React.ReactNode
  onAction?: () => void
  actionIcon?: LucideIcon
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  iconTone?: Tone
  iconSize?: keyof typeof iconSizes
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon,
  className,
  titleClassName,
  descriptionClassName,
  iconTone = 'muted',
  iconSize = 'lg',
}: EmptyStateCardProps) {
  return (
    <SurfaceCard
      as="div"
      className={cn('flex min-h-0 flex-1 flex-col items-center justify-center py-10 text-center', className)}
    >
      <IconBadge icon={icon} tone={iconTone} size={iconSize} className="mb-3" />
      <Text className={cn('text-[18px] font-semibold tracking-tight text-[var(--on-surface)]', titleClassName)}>
        {title}
      </Text>
      {description ? (
        <Text className={cn('mt-2 max-w-[22rem] px-6 text-[14px] leading-6 text-[var(--on-surface-muted)]', descriptionClassName)}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-5 h-10 rounded-[14px] px-4" onClick={onAction}>
          {ActionIcon ? <ActionIcon className="mr-1.5 h-4 w-4" strokeWidth={1.6} /> : null}
          {actionLabel}
        </Button>
      ) : null}
    </SurfaceCard>
  )
}

interface LoadingStateCardProps {
  title?: React.ReactNode
  description?: React.ReactNode
  className?: string
}

export function LoadingStateCard({
  title = '正在准备内容',
  description,
  className,
}: LoadingStateCardProps) {
  return (
    <SurfaceCard
      as="div"
      className={cn('flex min-h-[220px] flex-col items-center justify-center py-14 text-center', className)}
    >
      <View className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary-container)] border-t-[var(--primary)]" />
      <Text className="text-[17px] font-semibold tracking-tight text-[var(--on-surface)]">
        {title}
      </Text>
      {description ? (
        <Text className="mt-2 max-w-[24rem] px-6 text-[13px] leading-6 text-[var(--on-surface-muted)]">
          {description}
        </Text>
      ) : null}
    </SurfaceCard>
  )
}

interface ActionListItemProps extends Omit<React.ComponentProps<typeof Button>, 'children' | 'title'> {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  trailing?: React.ReactNode
  tone?: 'default' | 'danger'
  iconTone?: Tone
}

export function ActionListItem({
  icon,
  title,
  description,
  trailing,
  tone = 'default',
  iconTone = 'primary',
  className,
  ...props
}: ActionListItemProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        'flex h-auto w-full items-center justify-between rounded-none px-4 py-3.5 text-left',
        tone === 'danger' && 'text-[var(--error)]',
        className
      )}
      {...props}
    >
      <XStack className="min-w-0 flex-1 items-center gap-3">
        {icon ? <IconBadge icon={icon} tone={tone === 'danger' ? 'danger' : iconTone} size="md" /> : null}
        <YStack className="min-w-0 flex-1 justify-center">
          <Text className={cn('block text-[15px] font-semibold', tone === 'danger' ? 'text-[var(--error)]' : 'text-[var(--on-surface)]')}>
            {title}
          </Text>
          {description ? (
            <Text className={cn('mt-1 block text-[12px] leading-5', tone === 'danger' ? 'text-[var(--error)]/80' : 'text-[var(--on-surface-muted)]')}>
              {description}
            </Text>
          ) : null}
        </YStack>
      </XStack>
      {trailing
        ? (typeof trailing === 'string' || typeof trailing === 'number'
            ? (
                <Text className={cn('shrink-0 self-center text-[13px] font-semibold leading-none', tone === 'danger' ? 'text-[var(--error)]' : 'text-[var(--primary)]')}>
                  {trailing}
                </Text>
              )
            : trailing)
        : null}
    </Button>
  )
}
