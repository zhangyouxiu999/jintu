/** 当前日期 YYYY-MM-DD（本地时区） */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
