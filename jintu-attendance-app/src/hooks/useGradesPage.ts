import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Student, GradesForClass, GradesPeriod } from '@/types'
import { useGradesImport } from '@/hooks/useGradesImport'
import { useGradesExport } from '@/hooks/useGradesExport'
import { useGradesPeriodsState } from '@/hooks/useGradesPeriodsState'
import { useGradesSorting } from '@/hooks/useGradesSorting'
import { useGradesSubjects } from '@/hooks/useGradesSubjects'
import { DEFAULT_SUBJECTS } from '@/lib/grades'
import * as gradesStore from '@/store/grades'

export function useGradesPage({
  classId,
  className,
  students,
}: {
  classId?: string
  className?: string
  students: Student[]
}) {
  const location = useLocation()
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const statePeriodId = (location.state as { periodId?: string } | null)?.periodId
  const periodsState = useGradesPeriodsState({ classId, statePeriodId })

  const currentPeriod = periodsState.periods.find((period) => period.id === periodsState.currentPeriodId)
  const grades: GradesForClass = useMemo(
    () =>
      currentPeriod
        ? { subjects: currentPeriod.subjects, scores: currentPeriod.scores }
        : { subjects: [...DEFAULT_SUBJECTS], scores: {} },
    [currentPeriod]
  )

  const periodsRef = useRef<GradesPeriod[]>([])
  useEffect(() => {
    periodsRef.current = periodsState.periods
  }, [periodsState.periods])

  const persist = useCallback(
    (updatedPeriod: GradesForClass, newPeriodName?: string) => {
      if (!classId || !periodsState.currentPeriodId) return
      const prev = periodsRef.current
      const next = prev.map((p) =>
        p.id === periodsState.currentPeriodId
          ? {
              ...p,
              ...(newPeriodName !== undefined && { name: newPeriodName }),
              subjects: updatedPeriod.subjects,
              scores: updatedPeriod.scores,
            }
          : p
      )
      periodsState.setPeriods(next)
      gradesStore.savePeriods(classId, next)
    },
    [classId, periodsState]
  )

  const { importExcelSubmitting, importExcelFileRef, handleImportExcel } = useGradesImport({
    classId,
    currentPeriodId: periodsState.currentPeriodId,
    students,
    persist,
  })

  const getScore = useCallback(
    (studentId: string, subject: string) => grades.scores[studentId]?.[subject] ?? '',
    [grades.scores]
  )
  const subjects = useGradesSubjects({ grades, persist })
  const sorting = useGradesSorting({ students, grades, getScore })
  const exporting = useGradesExport({
    className,
    periods: periodsState.periods,
    currentPeriodId: periodsState.currentPeriodId,
    sortedStudents: sorting.sortedStudents,
  })

  const setScore = (studentId: string, subject: string, value: string) => {
    const next = { ...grades, scores: { ...grades.scores } }
    if (!next.scores[studentId]) next.scores[studentId] = {}
    const trimmed = value.trim()
    if (trimmed) next.scores[studentId][subject] = trimmed
    else delete next.scores[studentId][subject]
    if (Object.keys(next.scores[studentId]).length === 0) delete next.scores[studentId]
    persist(next)
  }

  const openScoreEditor = (studentId: string) => {
    if (!subjects.selectedSubject) return
    setEditingStudentId(studentId)
    setEditingValue(getScore(studentId, subjects.selectedSubject))
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const saveScore = () => {
    if (!editingStudentId || !subjects.selectedSubject) return
    setScore(editingStudentId, subjects.selectedSubject, editingValue)
    setEditingStudentId(null)
  }

  const editingStudent = students.find((student) => student.id === editingStudentId) ?? null

  return {
    periods: periodsState.periods,
    currentPeriodId: periodsState.currentPeriodId,
    setCurrentPeriodId: periodsState.setCurrentPeriodId,
    selectedSubject: subjects.selectedSubject,
    setSelectedSubject: subjects.setSelectedSubject,
    editingStudentId,
    setEditingStudentId,
    editingValue,
    setEditingValue,
    addSubjectOpen: subjects.addSubjectOpen,
    setAddSubjectOpen: subjects.setAddSubjectOpen,
    newSubjectName: subjects.newSubjectName,
    setNewSubjectName: subjects.setNewSubjectName,
    renameSubjectOpen: subjects.renameSubjectOpen,
    setRenameSubjectOpen: subjects.setRenameSubjectOpen,
    renameValue: subjects.renameValue,
    setRenameValue: subjects.setRenameValue,
    deleteSubjectConfirm: subjects.deleteSubjectConfirm,
    setDeleteSubjectConfirm: subjects.setDeleteSubjectConfirm,
    addPeriodOpen: periodsState.addPeriodOpen,
    setAddPeriodOpen: periodsState.setAddPeriodOpen,
    newPeriodName: periodsState.newPeriodName,
    setNewPeriodName: periodsState.setNewPeriodName,
    sortBy: sorting.sortBy,
    setSortBy: sorting.setSortBy,
    sortDir: sorting.sortDir,
    setSortDir: sorting.setSortDir,
    sortSheetOpen: sorting.sortSheetOpen,
    setSortSheetOpen: sorting.setSortSheetOpen,
    subjectActionOpen: subjects.subjectActionOpen,
    setSubjectActionOpen: subjects.setSubjectActionOpen,
    toolDrawerOpen: exporting.toolDrawerOpen,
    setToolDrawerOpen: exporting.setToolDrawerOpen,
    exportDialogOpen: exporting.exportDialogOpen,
    setExportDialogOpen: exporting.setExportDialogOpen,
    exportScope: exporting.exportScope,
    setExportScope: exporting.setExportScope,
    exportPeriodId: exporting.exportPeriodId,
    setExportPeriodId: exporting.setExportPeriodId,
    exportSubmitting: exporting.exportSubmitting,
    inputRef,
    grades,
    importExcelSubmitting,
    importExcelFileRef,
    handleImportExcel,
    sortedStudents: sorting.sortedStudents,
    getScore,
    handleAddSubject: subjects.handleAddSubject,
    handleAddPeriod: () => periodsState.addPeriod(periodsState.newPeriodName),
    renameSubjectAction: subjects.renameSubjectAction,
    doRemoveSubject: subjects.doRemoveSubject,
    handleExportGrades: exporting.handleExportGrades,
    openScoreEditor,
    saveScore,
    editingStudent,
  }
}
