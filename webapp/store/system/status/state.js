import * as R from 'ramda'

import * as SystemState from '../state'

export const stateKey = 'status'

export const systemStatus = {
  ready: 'ready',
}

export const getState = R.pipe(SystemState.getState, R.propOr({}, stateKey))

// ====== READ
export const isReady = R.pipe(SystemState.getState, R.propEq(stateKey, systemStatus.ready))
