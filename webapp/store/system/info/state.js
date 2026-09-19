import * as A from '@core/arena'
import * as SystemState from '../state'

export const stateKey = 'info'

const keys = {
  appInfo: 'appInfo',
  config: 'config',
}

const configKeys = {
  aiFeaturesEnabled: 'aiFeaturesEnabled',
  experimentalFeatures: 'experimentalFeatures',
  fileUploadLimit: 'fileUploadLimit',
}

const defaultFileUploadLimit = 1024 ** 3 // 1GB

export const getState = A.pipe(SystemState.getState, A.propOr({}, stateKey))

// ====== READ
export const getAppInfo = A.pipe(getState, A.propOr({}, keys.appInfo))
export const getConfig = A.pipe(getState, A.propOr({}, keys.config))
export const getConfigFileUploadLimit = A.pipe(getConfig, A.propOr(defaultFileUploadLimit, configKeys.fileUploadLimit))
export const getConfigFileUploadLimitMB = (state) => getConfigFileUploadLimit(state) / 1024 ** 2
export const getConfigExperimentalFeatures = A.pipe(getConfig, A.propEq(configKeys.experimentalFeatures, true))
export const isConfigAiFeaturesEnabled = A.pipe(getConfig, A.propEq(configKeys.aiFeaturesEnabled, true))

// ====== UPDATE
export const assocAppInfo = A.assoc(keys.appInfo)
export const assocConfig = A.assoc(keys.config)
