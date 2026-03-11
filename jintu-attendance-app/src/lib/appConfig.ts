/**
 * 商用配置：应用名称、登录凭据等，均从环境变量读取。
 * 生产环境（npm run build）下禁止使用默认账号，必须配置 VITE_LOGIN_*。
 */

const DEFAULT_APP_NAME = '稍微一点'

/** 应用展示名称（登录页、班级列表标题等），可通过 VITE_APP_NAME 覆盖 */
export function getAppName(): string {
  const v = import.meta.env.VITE_APP_NAME
  return typeof v === 'string' && v.trim() ? v.trim() : DEFAULT_APP_NAME
}

export type LoginCredentials = { username: string; password: string } | null

/**
 * 获取允许登录的凭据。
 * - 开发环境：未配置时使用默认 admin/admin（仅便于本地调试）。
 * - 生产环境：必须配置 VITE_LOGIN_USERNAME 与 VITE_LOGIN_PASSWORD，否则返回 null（不允许登录）。
 */
export function getLoginCredentials(): LoginCredentials {
  const u = import.meta.env.VITE_LOGIN_USERNAME
  const p = import.meta.env.VITE_LOGIN_PASSWORD
  const username = typeof u === 'string' && u.trim() ? u.trim() : ''
  const password = typeof p === 'string' ? p : ''

  if (import.meta.env.PROD) {
    if (!username || !password) return null
    return { username, password }
  }
  return {
    username: username || 'admin',
    password: password || 'admin',
  }
}
