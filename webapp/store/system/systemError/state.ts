import * as A from '@core/arena'
import * as SystemState from '../state'

export const stateKey = 'systemError'

// ====== READ
export const getSystemError = A.pipe(SystemState.getState, A.prop(stateKey))

// ====== UPDATE
export const assocSystemError = (error) => error
