import * as A from '@core/arena'

export const stateKey = 'app'

export const getState = A.propOr({}, stateKey)
