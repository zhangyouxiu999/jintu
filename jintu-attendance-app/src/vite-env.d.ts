/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 应用展示名称（登录页、标题等），不设则使用默认「稍微一点」 */
  readonly VITE_APP_NAME?: string
  /** 登录账号；生产环境必填，开发环境不填则默认 admin */
  readonly VITE_LOGIN_USERNAME?: string
  /** 登录密码；生产环境必填，开发环境不填则默认 admin */
  readonly VITE_LOGIN_PASSWORD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
