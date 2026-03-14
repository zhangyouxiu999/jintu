import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import TemplateList from '@/components/TemplateList'
import { downloadTemplate } from '@/lib/excelTemplates'
import type { TemplateMeta } from '@/lib/excelTemplates'
import { showToast } from '@/lib/toast'
import { animateStagger } from '@/lib/gsap'

export default function Templates() {
  const navigate = useNavigate()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
        <div ref={listRef}>
          <TemplateList downloadingId={downloadingId} onDownload={handleDownload} />
        </div>
      </main>
    </div>
  )
}
