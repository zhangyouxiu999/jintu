import * as React from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Separator, Text, XStack, YStack, View } from 'tamagui'
import { Button } from '@/components/ui/button'
import { ActionListItem, IconBadge, SectionHeader, SurfaceCard, TextPill } from '@/components/ui/mobile-ui'
import { cn } from '@/lib/utils'

type StatTone = 'neutral' | 'primary' | 'success' | 'warning' | 'late' | 'danger'

const statToneClasses: Record<StatTone, string> = {
  neutral: 'bg-[var(--surface-2)] text-[var(--on-surface-muted)]',
  primary: 'bg-[var(--primary-container)] text-[var(--primary)]',
  success: 'bg-[var(--success-container)] text-[var(--success)]',
  warning: 'bg-[var(--leave-container)] text-[var(--leave)]',
  late: 'bg-[var(--late-container)] text-[var(--late)]',
  danger: 'bg-[var(--error-container)] text-[var(--error)]',
}

export function AppScreen({
  className,
  children,
  ...props
}: React.ComponentProps<typeof YStack>) {
  return (
    <YStack
      className={cn(
        'min-h-[100dvh] gap-4 bg-[var(--bg)] px-[var(--page-x)] pt-4 pb-[calc(24px+env(safe-area-inset-bottom,0px))]',
        className
      )}
      {...props}
    >
      {children}
    </YStack>
  )
}

interface AppTopBarProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  leading?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
}

export function AppTopBar({
  title,
  subtitle,
  leading,
  trailing,
  className,
}: AppTopBarProps) {
  return (
    <XStack className={cn('items-center justify-between gap-3', className)}>
      <XStack className="min-w-0 flex-1 items-center gap-3">
        {leading ? <View className="shrink-0">{leading}</View> : null}
        <YStack className="min-w-0">
          {subtitle ? (
            <Text className="text-[12px] font-medium text-[var(--on-surface-muted)]">
              {subtitle}
            </Text>
          ) : null}
          <h1 className="truncate text-[28px] font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            {title}
          </h1>
        </YStack>
      </XStack>
      {trailing ? <View className="shrink-0">{trailing}</View> : null}
    </XStack>
  )
}

interface ContextCardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  leading?: React.ReactNode
  badge?: React.ReactNode
  footer?: React.ReactNode
  compact?: boolean
}

export function ContextCard({
  eyebrow,
  title,
  description,
  leading,
  badge,
  footer,
  compact = false,
  className,
  ...props
}: ContextCardProps) {
  return (
    <SurfaceCard inset="lg" density={compact ? 'compact' : 'default'} className={cn('overflow-hidden', className)} {...props}>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        leading={leading}
        badge={badge}
        compact={compact}
      />
      {footer ? <View className={compact ? 'mt-3' : 'mt-4'}>{footer}</View> : null}
    </SurfaceCard>
  )
}

interface StatChipProps {
  label: React.ReactNode
  value: React.ReactNode
  tone?: StatTone
  className?: string
  size?: 'sm' | 'md'
}

export function StatChip({
  label,
  value,
  tone = 'neutral',
  className,
  size = 'md',
}: StatChipProps) {
  return (
    <YStack
      className={cn(
        size === 'sm'
          ? 'min-w-[68px] rounded-[14px] px-2.5 py-2'
          : 'min-w-[82px] rounded-[18px] px-3 py-2.5',
        statToneClasses[tone],
        className
      )}
    >
      <Text className={cn(size === 'sm' ? 'text-[10px]' : 'text-[12px]', 'font-medium opacity-80')}>
        {label}
      </Text>
      <Text className={cn(size === 'sm' ? 'mt-0.5 text-[15px]' : 'mt-1 text-[18px]', 'font-semibold tracking-[-0.02em]')}>
        {value}
      </Text>
    </YStack>
  )
}

interface SummaryStripItem {
  label: React.ReactNode
  value: React.ReactNode
  tone?: StatTone
  className?: string
}

export function SummaryStrip({
  items,
  className,
}: {
  items: SummaryStripItem[]
  className?: string
}) {
  return (
    <XStack className={cn('gap-2 overflow-x-auto pb-1', className)}>
      {items.map((item, index) => (
        <StatChip
          key={index}
          label={item.label}
          value={item.value}
          tone={item.tone}
          size="sm"
          className={item.className}
        />
      ))}
    </XStack>
  )
}

export function InlineMetaRow({
  left,
  right,
  className,
}: {
  left?: React.ReactNode
  right?: React.ReactNode
  className?: string
}) {
  return (
    <XStack className={cn('items-center justify-between gap-3 px-1 text-[13px] text-[var(--on-surface-muted)]', className)}>
      <View className="min-w-0 flex-1">{left}</View>
      {right ? <View className="shrink-0">{right}</View> : null}
    </XStack>
  )
}

export function PageActionRow({
  children,
  className,
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1 hide-scrollbar', className)}>
      {children}
    </div>
  )
}

interface AppPageHeaderLiteProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  leading?: React.ReactNode
  trailing?: React.ReactNode
  meta?: React.ReactNode
  className?: string
}

export function AppPageHeaderLite({
  title,
  subtitle,
  leading,
  trailing,
  meta,
  className,
}: AppPageHeaderLiteProps) {
  return (
    <YStack className={cn('gap-3', className)}>
      <XStack className="items-start gap-3">
        {leading ? <View className="shrink-0">{leading}</View> : null}
        <YStack className="min-w-0 flex-1">
          {subtitle ? (
            <Text className="text-[12px] font-medium text-[var(--on-surface-muted)]">
              {subtitle}
            </Text>
          ) : null}
          <h2 className="truncate pt-0.5 text-[24px] font-semibold tracking-[-0.03em] text-[var(--on-surface)]">
            {title}
          </h2>
        </YStack>
        {trailing ? <View className="shrink-0">{trailing}</View> : null}
      </XStack>
      {meta ? <View>{meta}</View> : null}
    </YStack>
  )
}

interface SegmentedFilterBarItem {
  key: string
  label: React.ReactNode
  count?: React.ReactNode
  active?: boolean
  onSelect: () => void
  ariaLabel?: string
}

export function SegmentedFilterBar({
  items,
  className,
}: {
  items: SegmentedFilterBarItem[]
  className?: string
}) {
  return (
    <XStack className={cn('gap-1.5 overflow-x-auto pb-1', className)}>
      {items.map((item) => (
        <Button
          key={item.key}
          type="button"
          variant={item.active ? 'secondary' : 'ghost'}
          onClick={item.onSelect}
          aria-pressed={item.active}
          aria-label={item.ariaLabel}
          className={cn(
            'h-9 shrink-0 gap-1.5 rounded-full border px-3 text-[12px] font-semibold shadow-none [&_span]:leading-none',
            item.active
              ? 'border-[var(--primary)]/12 bg-[var(--primary-container)] text-[var(--primary)]'
              : 'border-[var(--outline)] bg-[var(--surface)] text-[var(--on-surface-muted)]'
          )}
        >
          {item.count !== undefined ? <span className="tabular-nums text-[13px]">{item.count}</span> : null}
          <span>{item.label}</span>
        </Button>
      ))}
    </XStack>
  )
}

interface AppListItemProps extends Omit<React.ComponentProps<typeof ActionListItem>, 'trailing'> {
  trailingLabel?: React.ReactNode
  showChevron?: boolean
}

export function AppListItem({
  trailingLabel,
  showChevron = true,
  ...props
}: AppListItemProps) {
  return (
    <ActionListItem
      trailing={
        showChevron ? (
          <XStack className="items-center gap-1.5 self-center">
            {trailingLabel ? (
              <Text className="self-center text-[12px] font-medium leading-none text-[var(--on-surface-muted)]">
                {trailingLabel}
              </Text>
            ) : null}
            <ChevronRight className="h-4 w-4 text-[var(--on-surface-muted)]" strokeWidth={1.8} />
          </XStack>
        ) : trailingLabel
      }
      {...props}
    />
  )
}

interface AppTagProps {
  children: React.ReactNode
  tone?: 'primary' | 'neutral'
  className?: string
}

export function AppTag({
  children,
  tone = 'primary',
  className,
}: AppTagProps) {
  return (
    <TextPill
      tone={tone === 'primary' ? 'primary' : 'muted'}
      className={cn('px-3 py-1', className)}
    >
      {children}
    </TextPill>
  )
}

type AppButtonProps = React.ComponentProps<typeof Button>

export function PrimaryButton({ className, ...props }: AppButtonProps) {
  return <Button className={cn('rounded-[16px]', className)} {...props} />
}

export function SecondaryButton({
  className,
  variant,
  ...props
}: AppButtonProps) {
  return (
    <Button
      variant={variant ?? 'secondary'}
      className={cn('rounded-[16px]', className)}
      {...props}
    />
  )
}

export function GhostButton({
  className,
  variant,
  ...props
}: AppButtonProps) {
  return (
    <Button
      variant={variant ?? 'ghost'}
      className={cn('rounded-[16px]', className)}
      {...props}
    />
  )
}

interface AppInfoRowProps {
  icon: LucideIcon
  label: React.ReactNode
  value?: React.ReactNode
  tone?: 'primary' | 'muted'
  className?: string
}

export function AppInfoRow({
  icon,
  label,
  value,
  tone = 'muted',
  className,
}: AppInfoRowProps) {
  return (
    <XStack className={cn('items-center justify-between gap-3', className)}>
      <XStack className="min-w-0 flex-1 items-center gap-3">
        <IconBadge icon={icon} tone={tone === 'primary' ? 'primary' : 'muted'} size="sm" />
        <Text className="truncate text-[14px] text-[var(--on-surface-variant)]">
          {label}
        </Text>
      </XStack>
      {value ? (
        <Text className="shrink-0 text-[13px] font-semibold text-[var(--on-surface)]">
          {value}
        </Text>
      ) : null}
    </XStack>
  )
}

export function AppDivider({ className }: { className?: string }) {
  return <Separator className={cn('bg-[var(--outline-variant)]', className)} />
}
