/** 本地时区日期 YYYY-MM-DD */
export function formatLocalDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 当前日期 YYYY-MM-DD（本地时区） */
export function today(): string {
  return formatLocalDate()
}
