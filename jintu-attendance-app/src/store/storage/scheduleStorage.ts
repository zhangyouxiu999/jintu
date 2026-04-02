import type { ScheduleDataByClass } from '@/types'
import { load, save } from '@/store/storage/core'
import { STORAGE_KEYS, VERSIONED_KEYS } from '@/store/storage/keys'

export const scheduleStorage = {
  saveSchedule(data: ScheduleDataByClass) {
    save(STORAGE_KEYS.schedule, data)
  },
  loadSchedule(): ScheduleDataByClass | null {
    return load<ScheduleDataByClass>(STORAGE_KEYS.schedule)
  },
  saveScheduleForClass(classId: string, data: NonNullable<ScheduleDataByClass[string]>) {
    save(VERSIONED_KEYS.scheduleByClass(classId), data)
  },
  loadScheduleForClass(classId: string): NonNullable<ScheduleDataByClass[string]> | null {
    return load<NonNullable<ScheduleDataByClass[string]>>(VERSIONED_KEYS.scheduleByClass(classId))
  },
}
