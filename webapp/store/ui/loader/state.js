import * as R from 'ramda'

import * as UiState from '../state'

export const stateKey = 'loader'

// ====== READ
export const isVisible = R.pipe(UiState.getState, R.propEq(stateKey, true))

// ====== UPDATE
export const assocShow = () => true
export const assocHide = () => false
