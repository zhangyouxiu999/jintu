import { useEffect, useState } from 'react'
import type { GradesForClass } from '@/types'
import { removeSubjectFromGrades, renameSubjectInGrades } from '@/lib/grades'

interface UseGradesSubjectsParams {
  grades: GradesForClass
  persist: (updatedPeriod: GradesForClass, newPeriodName?: string) => void
}

export function useGradesSubjects({ grades, persist }: UseGradesSubjectsParams) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [addSubjectOpen, setAddSubjectOpen] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [renameSubjectOpen, setRenameSubjectOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [deleteSubjectConfirm, setDeleteSubjectConfirm] = useState<string | null>(null)
  const [subjectActionOpen, setSubjectActionOpen] = useState(false)

  useEffect(() => {
    if (grades.subjects.length === 0) {
      setSelectedSubject(null)
      return
    }

    setSelectedSubject((current) => (
      current && grades.subjects.includes(current) ? current : grades.subjects[0]
    ))
  }, [grades.subjects])

  const handleAddSubject = () => {
    const name = newSubjectName.trim()
    if (!name || grades.subjects.includes(name)) return
    persist({ ...grades, subjects: [...grades.subjects, name] })
    setSelectedSubject(name)
    setNewSubjectName('')
    setAddSubjectOpen(false)
  }

  const renameSubjectAction = (oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName || grades.subjects.includes(trimmed)) return
    persist(renameSubjectInGrades(grades, oldName, trimmed))
    if (selectedSubject === oldName) setSelectedSubject(trimmed)
    setRenameSubjectOpen(false)
    setRenameValue('')
  }

  const doRemoveSubject = (subject: string) => {
    persist(removeSubjectFromGrades(grades, subject))
    setDeleteSubjectConfirm(null)
  }

  return {
    selectedSubject,
    setSelectedSubject,
    addSubjectOpen,
    setAddSubjectOpen,
    newSubjectName,
    setNewSubjectName,
    renameSubjectOpen,
    setRenameSubjectOpen,
    renameValue,
    setRenameValue,
    deleteSubjectConfirm,
    setDeleteSubjectConfirm,
    subjectActionOpen,
    setSubjectActionOpen,
    handleAddSubject,
    renameSubjectAction,
    doRemoveSubject,
  }
}
