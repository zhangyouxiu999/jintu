'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Sheet as TamaguiSheet } from 'tamagui'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type DrawerProps = React.ComponentProps<typeof TamaguiSheet> & {
  shouldScaleBackground?: boolean
}

function Drawer({ shouldScaleBackground: _shouldScaleBackground, ...props }: DrawerProps) {
  return (
    <TamaguiSheet
      modal
      dismissOnOverlayPress
      dismissOnSnapToBottom
      snapPointsMode="percent"
      snapPoints={[88]}
      position={0}
      zIndex={100}
      unmountChildrenWhenHidden
      {...props}
    />
  )
}

function DrawerOverlay({
  className,
  style,
  ...props
}: React.ComponentProps<typeof TamaguiSheet.Overlay>) {
  return (
    <TamaguiSheet.Overlay
      data-slot="drawer-overlay"
      className={cn('fixed inset-0 z-[100] bg-[rgba(31,34,31,0.34)]', className)}
      zIndex={100}
      style={style}
      {...(props as object)}
    />
  )
}

function DrawerContent({
  className,
  overlayClassName,
  overlayStyle,
  children,
  style,
  ...props
}: React.ComponentProps<typeof TamaguiSheet.Frame> & { overlayClassName?: string; overlayStyle?: React.CSSProperties }) {
  return (
    <>
      <DrawerOverlay className={overlayClassName} style={overlayStyle} />
      <TamaguiSheet.Frame
        data-slot="drawer-content"
        className={cn(
          'fixed inset-x-0 bottom-0 top-[max(env(safe-area-inset-top,0px),24px)] z-[100] flex flex-col rounded-t-[30px] border-x border-t border-[rgba(255,253,252,0.62)] bg-[var(--surface)] shadow-[0_-18px_44px_rgba(94,79,52,0.14)] outline-none pb-[env(safe-area-inset-bottom,0px)] [will-change:transform]',
          className
        )}
        zIndex={101}
        style={style}
        {...(props as object)}
      >
        {children}
      </TamaguiSheet.Frame>
    </>
  )
}

function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-[var(--outline-variant)] bg-transparent px-4 py-3',
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'min-w-0 flex-1 text-center text-[17px] font-semibold text-[var(--on-surface)]',
        className
      )}
      {...props}
    />
  )
}

/** 带标题栏 + 关闭按钮的抽屉内容区，与原 BottomSheetContent 布局一致，便于替换 */
interface DrawerContentWithHeaderProps {
  className?: string
  overlayClassName?: string
  overlayStyle?: React.CSSProperties
  style?: React.CSSProperties
  title?: string
  showCloseButton?: boolean
  onClose?: () => void
  children: React.ReactNode
}

function DrawerContentWithHeader({
  className,
  overlayClassName,
  overlayStyle,
  style,
  children,
  title = '我的',
  showCloseButton = true,
  onClose,
}: DrawerContentWithHeaderProps) {
  return (
    <DrawerContent
      overlayClassName={overlayClassName}
      overlayStyle={overlayStyle}
      className={cn('flex min-h-0 flex-col', className)}
      style={style}
    >
      <div className="flex justify-center pt-[max(env(safe-area-inset-top,0px),14px)]">
        <div className="h-1.5 w-11 rounded-full bg-[var(--outline-variant)]" aria-hidden />
      </div>
      <div
        className="flex shrink-0 items-center justify-between border-b border-[var(--outline-variant)] bg-transparent px-4 py-3"
      >
        <div className="w-10 shrink-0" aria-hidden />
        <DrawerTitle className="min-w-0 flex-1 text-center">{title}</DrawerTitle>
        {showCloseButton && onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="-mr-2 h-10 w-10 shrink-0 rounded-full bg-[var(--surface-2)] text-[var(--on-surface-muted)]"
            aria-label="关闭"
            onClick={onClose}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </Button>
        ) : (
          <div className="w-10 shrink-0" aria-hidden />
        )}
      </div>
      <div className="touch-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </DrawerContent>
  )
}

export {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerContentWithHeader,
}
