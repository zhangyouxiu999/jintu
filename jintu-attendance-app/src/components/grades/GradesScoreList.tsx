import { Plus } from 'lucide-react'
import type { Student } from '@/types'
import { ListSection, SimpleListRow } from '@/components/ui/app-ui'
import { EmptyStateCard } from '@/components/ui/mobile-ui'

interface GradesScoreListProps {
  students: Student[]
  sortedStudents: Student[]
  selectedSubject: string | null
  getScore: (studentId: string, subject: string) => string
  onRowClick: (studentId: string) => void
  onEmptyAction: () => void
}

export default function GradesScoreList({
  students,
  sortedStudents,
  selectedSubject,
  getScore,
  onRowClick,
  onEmptyAction,
}: GradesScoreListProps) {
  if (students.length === 0) {
    return (
      <EmptyStateCard
        icon={Plus}
        title="还没有学生"
        actionLabel="去学生名单"
        onAction={onEmptyAction}
        iconTone="muted"
      />
    )
  }

  return (
    <ListSection className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[var(--outline-variant)]/80">
        {sortedStudents.map((student) => (
          <SimpleListRow
            key={student.id}
            title={student.name}
            description={selectedSubject ?? undefined}
            trailing={
              <span className="text-[15px] font-semibold text-[var(--on-surface)]">
                {selectedSubject ? (getScore(student.id, selectedSubject) || '—') : '—'}
              </span>
            }
            onClick={() => onRowClick(student.id)}
            disabled={!selectedSubject}
            data-testid={`grade-row-${student.id}`}
          />
        ))}
      </div>
    </ListSection>
  )
}
