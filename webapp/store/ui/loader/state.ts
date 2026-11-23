import * as A from '@core/arena'

import * as UiState from '../state'

export const stateKey = 'loader'

// ====== READ
export const isVisible = A.pipe(UiState.getState, A.propEq(stateKey, true))

// ====== UPDATE
export const assocShow = () => true
export const assocHide = () => false
