import { FileDown, FileUp, type LucideIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-all duration-200 active:scale-[0.97] active:opacity-70 disabled:opacity-30',
        destructive
          ? 'text-[var(--error)] active:bg-[var(--error-container)]'
          : 'text-[var(--on-surface)] active:bg-[var(--surface-2)]'
      )}
    >
      <span className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]',
        destructive ? 'bg-[var(--error-container)] text-[var(--error)]' : 'bg-[var(--surface-2)] text-[var(--on-surface-muted)]'
      )}>
        {Icon ? <Icon strokeWidth={1.5} className="h-[19px] w-[19px]" /> : null}
      </span>
      <span className="text-[15px] font-medium tracking-tight">{label}</span>
    </button>
  )
}

export default function GlobalActionDrawer({
  open,
  onOpenChange,
  title,
  actions,
}: GlobalActionDrawerProps) {
  const importAction = actions.importAction ?? {
    id: 'fallback-import',
    label: '当前页面暂未接入导入',
    icon: FileUp,
    disabled: true,
  }

  const exportAction = actions.exportAction ?? {
    id: 'fallback-export',
    label: '当前页面暂未接入导出',
    icon: FileDown,
    disabled: true,
  }

  const extraActions = actions.extraActions ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 right-0 top-auto bottom-0 max-h-[82vh] translate-x-0 translate-y-0 gap-0 rounded-t-[28px] rounded-b-none border-x-0 border-b-0 border-t border-[var(--outline)] bg-[var(--surface)]/90 p-0 shadow-[0_-2px_32px_rgba(0,0,0,0.07)] backdrop-blur-2xl [&>[data-slot=dialog-close]]:hidden">
        {/* 拖拽指示条 */}
        <div className="mx-auto mt-[10px] h-[5px] w-9 rounded-full bg-[var(--outline-variant)]" />

        <DialogHeader className="px-5 pb-1 pt-4 text-left">
          <DialogTitle className="text-dialog-title text-[var(--on-surface)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-caption text-[var(--on-surface-muted)]">
            导入、导出和当前页面的专属操作
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-4 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-2">
          {/* 导入 / 导出组 */}
          <div className="overflow-hidden rounded-[18px] border border-[var(--outline)] bg-[var(--surface)]">
            <ActionRow
              {...importAction}
              onSelect={() => {
                importAction.onSelect?.()
                onOpenChange(false)
              }}
            />
            <div className="mx-4 h-px bg-[var(--outline-variant)]" />
            <ActionRow
              {...exportAction}
              onSelect={() => {
                exportAction.onSelect?.()
                onOpenChange(false)
              }}
            />
          </div>

          {/* 页面专属操作组 */}
          {extraActions.length > 0 ? (
            <div className="mt-3 overflow-hidden rounded-[18px] border border-[var(--outline)] bg-[var(--surface)]">
              {extraActions.map((item, i) => (
                <>
                  {i > 0 && <div key={`sep-${item.id}`} className="mx-4 h-px bg-[var(--outline-variant)]" />}
                  <ActionRow
                    key={item.id}
                    {...item}
                    onSelect={() => {
                      item.onSelect?.()
                      onOpenChange(false)
                    }}
                  />
                </>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
