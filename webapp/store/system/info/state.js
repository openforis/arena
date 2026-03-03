import * as R from 'ramda'
import * as SystemState from '../state'

export const stateKey = 'info'

const keys = {
  appInfo: 'appInfo',
  config: 'config',
}

export const getState = R.pipe(SystemState.getState, R.propOr({}, stateKey))

// ====== READ
export const getAppInfo = R.pipe(getState, R.propOr({}, keys.appInfo))
export const getConfig = R.pipe(getState, R.propOr({}, keys.config))

// ====== UPDATE
export const assocAppInfo = R.assoc(keys.appInfo)
export const assocConfig = R.assoc(keys.config)
