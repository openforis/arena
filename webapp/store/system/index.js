export * as SystemActions from './actions'
export * as SystemState from './state'
import SystemReducer from './reducer'

export { SystemReducer }

// info
export {
  useSystemAppInfo,
  useSystemConfig,
  useSystemConfigActivityLogDisabled,
  useSystemConfigAiFeaturesEnabled,
  useSystemConfigFileUploadLimit,
  useSystemConfigFileUploadLimitMB,
  useSystemConfigExperimentalFeatures,
} from './info'

// ====== system error
export { SystemErrorActions, useSystemError } from './systemError'

// ====== service error
export { ServiceErrorActions, useServiceErrors } from './serviceError'

// ====== i18n
export { I18nState, useI18n, useI18nT, useLang } from './i18n'

// ====== status
export { SystemStatusState, useSystemStatusReady } from './status'
