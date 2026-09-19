import * as A from '@core/arena'

export const stateKey = 'ui'

export const getState = A.propOr({}, stateKey)
