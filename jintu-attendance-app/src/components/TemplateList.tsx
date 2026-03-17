import { FileSpreadsheet, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EXCEL_TEMPLATES, type TemplateMeta } from '@/lib/excelTemplates'

interface TemplateListProps {
  downloadingId: string | null
  onDownload: (meta: TemplateMeta) => void
  compact?: boolean
  className?: string
}

export default function TemplateList({
  downloadingId,
  onDownload,
  compact = false,
  className,
}: TemplateListProps) {
  return (
    <ul className={cn(compact ? 'mt-2 space-y-1' : 'space-y-3', className)}>
      {EXCEL_TEMPLATES.map((meta) => (
        <li
          key={meta.id}
          className={cn(
            compact ? 'flex items-center justify-between gap-3 rounded-xl py-2 pr-1 transition-colors duration-100 active:bg-[var(--surface-2)]' : 'card-soft flex flex-col gap-3 p-4'
          )}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-container)]/50 sm:h-11 sm:w-11 sm:rounded-[var(--radius-md)] sm:bg-gradient-to-br sm:from-[var(--primary-container)] sm:to-[var(--primary)]/15">
              <FileSpreadsheet className="h-4 w-4 text-[var(--primary)] sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={cn(compact ? 'truncate text-[12px] font-medium' : 'text-label font-semibold', 'text-[var(--on-surface)]')}>
                {meta.name}
              </h2>
              {!compact && (
                <p className="mt-0.5 text-tiny text-[var(--on-surface-muted)]">
                  {meta.description}
                </p>
              )}
            </div>
          </div>

          {compact ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full text-[var(--on-surface-muted)] transition-[transform,opacity] duration-75 ease-out active:scale-[0.85] active:opacity-70"
              onClick={() => onDownload(meta)}
              disabled={downloadingId !== null}
              aria-label={`下载 ${meta.fileName}`}
            >
              {downloadingId === meta.id ? (
                <span className="text-[11px] text-[var(--on-surface-muted)]">…</span>
              ) : (
                <Download className="h-5 w-5" strokeWidth={1.5} />
              )}
            </Button>
          ) : (
            <Button
              className="h-11 w-full rounded-[14px] bg-[var(--primary)] text-[15px] font-semibold text-white transition-[transform,opacity] duration-75 ease-out active:scale-[0.97] active:opacity-85"
              onClick={() => onDownload(meta)}
              disabled={downloadingId !== null}
            >
              {downloadingId === meta.id ? (
                '下载中…'
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  下载 {meta.fileName}
                </>
              )}
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}
