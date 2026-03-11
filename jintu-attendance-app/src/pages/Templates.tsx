import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, Download } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { EXCEL_TEMPLATES, downloadTemplate } from '@/lib/excelTemplates'
import type { TemplateMeta } from '@/lib/excelTemplates'
import { showToast } from '@/lib/toast'
import { animateStagger } from '@/lib/gsap'

export default function Templates() {
  const navigate = useNavigate()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const revert = animateStagger(listRef.current, ':scope > li')
    return revert
  }, [])

  const handleDownload = async (meta: TemplateMeta) => {
    setDownloadingId(meta.id)
    try {
      await downloadTemplate(meta)
      showToast('已下载', { variant: 'success', duration: 1800 })
    } catch {
      showToast('下载失败，请重试', { variant: 'error' })
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <PageHeader title="模板库" onBack={() => navigate(-1)} />

      <main className="px-[var(--page-x)] py-4">
        <p className="mb-4 text-caption text-[var(--on-surface-muted)]">
          下载 Excel 模板后按说明填写，可在点名、课程表、成绩单等页面导入使用。
        </p>
        <ul ref={listRef} className="space-y-3">
          {EXCEL_TEMPLATES.map((meta) => (
            <li
              key={meta.id}
              className="card-soft flex flex-col gap-3 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary-container)] to-[var(--primary)]/15">
                  <FileSpreadsheet className="h-5 w-5 text-[var(--primary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-label font-semibold text-[var(--on-surface)]">{meta.name}</h2>
                  <p className="mt-0.5 text-tiny text-[var(--on-surface-muted)]">{meta.description}</p>
                </div>
              </div>
              <Button
                className="h-10 w-full rounded-[var(--radius-md)] bg-[var(--primary)] text-label font-medium text-[var(--on-primary)]"
                onClick={() => handleDownload(meta)}
                disabled={downloadingId !== null}
              >
                {downloadingId === meta.id ? (
                  '下载中…'
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    下载 {meta.fileName}
                  </>
                )}
              </Button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
