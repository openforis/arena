import * as R from 'ramda'

import * as SystemState from '../state'

export const stateKey = 'systemError'

// ====== READ
export const getSystemError = R.pipe(SystemState.getState, R.prop(stateKey))

// ====== UPDATE
export const assocSystemError = (error) => error
