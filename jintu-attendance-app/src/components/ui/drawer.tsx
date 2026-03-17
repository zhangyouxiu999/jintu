'use client'

import * as React from 'react'
import { Drawer as VaulDrawer } from 'vaul'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const Drawer = VaulDrawer.Root

const DrawerTrigger = VaulDrawer.Trigger

const DrawerPortal = VaulDrawer.Portal

const DrawerClose = VaulDrawer.Close

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof VaulDrawer.Overlay>) {
  return (
    <VaulDrawer.Overlay
      className={cn('fixed inset-0 z-[100] bg-black/45', className)}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof VaulDrawer.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <VaulDrawer.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-[100] flex max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top,0px)))] flex-col rounded-t-[20px] bg-[var(--surface)] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] outline-none pb-[env(safe-area-inset-bottom,0px)] [will-change:transform]',
          className
        )}
        {...props}
      >
        {children}
      </VaulDrawer.Content>
    </DrawerPortal>
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
  title?: string
  showCloseButton?: boolean
  onClose?: () => void
  children: React.ReactNode
}

function DrawerContentWithHeader({
  className,
  children,
  title = '我的',
  showCloseButton = true,
  onClose,
}: DrawerContentWithHeaderProps) {
  return (
    <DrawerContent className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--outline-variant)] bg-transparent px-4 py-3">
        <div className="w-10 shrink-0" aria-hidden />
        <DrawerTitle className="min-w-0 flex-1 text-center">{title}</DrawerTitle>
        {showCloseButton && onClose ? (
          <DrawerClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-2 h-10 w-10 shrink-0 rounded-full bg-[var(--surface-2)] text-[var(--on-surface-muted)]"
              aria-label="关闭"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </Button>
          </DrawerClose>
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
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  DrawerContentWithHeader,
}
