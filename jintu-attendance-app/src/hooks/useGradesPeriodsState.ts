import { useEffect, useState } from 'react'
import type { GradesPeriod } from '@/types'
import { DEFAULT_SUBJECTS, createNewPeriodId } from '@/lib/grades'
import { storage } from '@/store/storage'
import * as gradesStore from '@/store/grades'

interface UseGradesPeriodsStateParams {
  classId?: string
  statePeriodId?: string
}

export function useGradesPeriodsState({ classId, statePeriodId }: UseGradesPeriodsStateParams) {
  const [periods, setPeriods] = useState<GradesPeriod[]>([])
  const [currentPeriodId, setCurrentPeriodId] = useState<string | null>(null)
  const [addPeriodOpen, setAddPeriodOpen] = useState(false)
  const [newPeriodName, setNewPeriodName] = useState('')

  useEffect(() => {
    if (!classId) return
    const list = gradesStore.getPeriods(classId)
    if (list.length > 0) {
      setPeriods(list)
      const validStateId = statePeriodId && list.some((period) => period.id === statePeriodId)
      const savedId = storage.loadCurrentPeriodId(classId)
      const validSavedId = savedId && list.some((period) => period.id === savedId)
      setCurrentPeriodId((id) => {
        if (validStateId) return statePeriodId ?? null
        if (validSavedId) return savedId ?? null
        return (id && list.some((period) => period.id === id)) ? id : list[0].id
      })
      return
    }

    const firstPeriod: GradesPeriod = {
      id: createNewPeriodId(),
      name: '第一期',
      subjects: [...DEFAULT_SUBJECTS],
      scores: {},
    }
    setPeriods([firstPeriod])
    setCurrentPeriodId(firstPeriod.id)
    gradesStore.savePeriods(classId, [firstPeriod])
  }, [classId, statePeriodId])

  useEffect(() => {
    if (classId && currentPeriodId) {
      storage.saveCurrentPeriodId(classId, currentPeriodId)
    }
  }, [classId, currentPeriodId])

  const addPeriod = (name: string) => {
    const periodName = name.trim() || `第${periods.length + 1}期`
    const newPeriod: GradesPeriod = {
      id: createNewPeriodId(),
      name: periodName,
      subjects: [...DEFAULT_SUBJECTS],
      scores: {},
    }
    const nextPeriods = [...periods, newPeriod]
    setPeriods(nextPeriods)
    setCurrentPeriodId(newPeriod.id)
    if (classId) {
      gradesStore.savePeriods(classId, nextPeriods)
    }
    setNewPeriodName('')
    setAddPeriodOpen(false)
  }

  return {
    periods,
    setPeriods,
    currentPeriodId,
    setCurrentPeriodId,
    addPeriodOpen,
    setAddPeriodOpen,
    newPeriodName,
    setNewPeriodName,
    addPeriod,
  }
}
