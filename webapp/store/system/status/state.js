import * as A from '@core/arena'
import * as SystemState from '../state'

export const stateKey = 'status'

export const systemStatus = {
  ready: 'ready',
}

export const getState = A.pipe(SystemState.getState, A.propOr({}, stateKey))

// ====== READ
export const isReady = A.pipe(SystemState.getState, A.propEq(stateKey, systemStatus.ready))
