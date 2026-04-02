import { type LucideIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface GlobalActionItem {
  id: string
  label: string
  icon?: LucideIcon
  onSelect?: () => void
  disabled?: boolean
  destructive?: boolean
  /** 子菜单项，存在时该项为可展开二级 */
  children?: GlobalActionItem[]
}

export interface GlobalActionConfig {
  importAction?: GlobalActionItem
  exportAction?: GlobalActionItem
  /** 公共区第二项导出，如「导出学生名单」 */
  exportListAction?: GlobalActionItem
  extraActions?: GlobalActionItem[]
}

interface GlobalActionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  actions: GlobalActionConfig
}

function ActionRow({
  label,
  icon: Icon,
  onSelect,
  disabled,
  destructive,
}: GlobalActionItem) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-3 py-3 text-left shadow-none disabled:opacity-30',
        destructive ? 'text-[var(--error)]' : 'text-[var(--on-surface)]'
      )}
    >
      <span className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]',
        destructive ? 'bg-[var(--error-container)] text-[var(--error)]' : 'bg-[var(--surface-2)] text-[var(--on-surface-muted)]'
      )}>
        {Icon ? <Icon strokeWidth={1.5} className="h-[19px] w-[19px]" /> : null}
      </span>
      <span className="inline-flex min-w-0 flex-1 items-center leading-5">{label}</span>
    </Button>
  )
}

export default function GlobalActionDrawer({
  open,
  onOpenChange,
  title,
  actions,
}: GlobalActionDrawerProps) {
  const importAction = actions.importAction
  const exportAction = actions.exportAction
  const exportListAction = actions.exportListAction
  const extraActions = actions.extraActions ?? []
  const hasActions = Boolean(importAction || exportAction || exportListAction || extraActions.length > 0)

  const renderAction = (action: GlobalActionItem) => (
    <ActionRow
      key={action.id}
      {...action}
      onSelect={() => {
        action.onSelect?.()
        onOpenChange(false)
      }}
    />
  )

  const renderNestedAction = (action: GlobalActionItem) => (
      <div key={action.id} className="px-4 py-3">
      <div className="flex items-center gap-3 pb-2">
        <span className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--surface-2)] text-[var(--on-surface-muted)]',
          action.destructive && 'bg-[var(--error-container)] text-[var(--error)]'
        )}>
          {action.icon ? <action.icon strokeWidth={1.5} className="h-[18px] w-[18px]" /> : null}
        </span>
        <div className="flex min-h-9 items-center">
          <p className="text-[14px] font-semibold leading-5 text-[var(--on-surface)]">{action.label}</p>
        </div>
      </div>
      <div className="space-y-1">
        {(action.children ?? []).map((child) => (
          <ActionRow
            key={child.id}
            {...child}
            onSelect={() => {
              child.onSelect?.()
              onOpenChange(false)
            }}
          />
        ))}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 right-0 top-auto bottom-0 max-h-[82vh] translate-x-0 translate-y-0 gap-0 rounded-t-[30px] rounded-b-none border-x-0 border-b-0 border-t border-[rgba(255,253,252,0.62)] bg-[var(--surface)]/96 p-0 shadow-[0_-18px_40px_rgba(94,79,52,0.12)] backdrop-blur-[var(--glass-blur)] [&>[data-slot=dialog-close]]:hidden">
        <div className="mx-auto mt-[12px] h-[5px] w-10 rounded-full bg-[var(--outline-variant)]" />

        <DialogHeader className="px-5 pb-2 pt-4 text-left">
          <DialogTitle className="text-dialog-title text-[var(--on-surface)]">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-2">
          {hasActions ? (
            <>
              {(importAction || exportAction || exportListAction) ? (
                <div className="overflow-hidden rounded-[22px] border border-[var(--outline)] bg-[var(--surface)]/96 shadow-[0_12px_28px_rgba(94,79,52,0.04)]">
                  {importAction ? renderAction(importAction) : null}
                  {importAction && (exportAction || exportListAction) ? (
                    <div className="mx-4 h-px bg-[var(--outline-variant)]" />
                  ) : null}
                  {exportAction ? renderAction(exportAction) : null}
                  {exportAction && exportListAction ? (
                    <div className="mx-4 h-px bg-[var(--outline-variant)]" />
                  ) : null}
                  {exportListAction ? renderAction(exportListAction) : null}
                </div>
              ) : null}

              {extraActions.length > 0 ? (
                <div className={cn(
                  'overflow-hidden rounded-[22px] border border-[var(--outline)] bg-[var(--surface)]/96 shadow-[0_12px_28px_rgba(94,79,52,0.04)]',
                  (importAction || exportAction || exportListAction) && 'mt-3'
                )}>
                  {extraActions.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 ? <div className="mx-4 h-px bg-[var(--outline-variant)]" /> : null}
                      {item.children?.length ? renderNestedAction(item) : renderAction(item)}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[var(--outline)] px-4 py-6 text-center text-[13px] text-[var(--on-surface-muted)]">
              当前页面没有可执行的快捷操作
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
