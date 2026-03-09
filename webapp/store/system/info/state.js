import * as R from 'ramda'
import * as SystemState from '../state'

export const stateKey = 'info'

const keys = {
  appInfo: 'appInfo',
  config: 'config',
}

const configKeys = {
  fileUploadLimit: 'fileUploadLimit',
  experimentalFeatures: 'experimentalFeatures',
}

const defaultFileUploadLimit = 1024 ** 3 // 1GB

export const getState = R.pipe(SystemState.getState, R.propOr({}, stateKey))

// ====== READ
export const getAppInfo = R.pipe(getState, R.propOr({}, keys.appInfo))
export const getConfig = R.pipe(getState, R.propOr({}, keys.config))
export const getConfigFileUploadLimit = R.pipe(getConfig, R.propOr(defaultFileUploadLimit, configKeys.fileUploadLimit))
export const getConfigFileUploadLimitMB = (state) => getConfigFileUploadLimit(state) / 1024 ** 2
export const getConfigExperimentalFeatures = R.pipe(getConfig, R.propEq(configKeys.experimentalFeatures, true))

// ====== UPDATE
export const assocAppInfo = R.assoc(keys.appInfo)
export const assocConfig = R.assoc(keys.config)
