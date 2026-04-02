export function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('[storage] remove failed:', key, error)
  }
}

export function save(key: string, data: unknown): void {
  try {
    const raw = JSON.stringify(data)
    localStorage.setItem(key, raw)
  } catch (error) {
    console.warn('[storage] save failed:', key, error)
  }
}

export function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return null
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn('[storage] load failed:', key, error)
    return null
  }
}

export function listKeysWithPrefix(prefix: string): string[] {
  try {
    const keys: string[] = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (key && key.startsWith(prefix)) keys.push(key)
    }
    return keys
  } catch (error) {
    console.warn('[storage] list keys failed:', prefix, error)
    return []
  }
}

export function loadByKeys<T>(keys: string[]): T[] {
  return keys
    .map((key) => load<T>(key))
    .filter((item): item is T => item != null)
}
