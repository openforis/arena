import * as R from 'ramda'
import * as SystemState from '../state'

export const stateKey = 'status'

export const appStatus = {
  ready: 'ready',
}

export const getState = R.pipe(SystemState.getState, R.propOr({}, stateKey))

// ====== READ
export const getStatus = getState
