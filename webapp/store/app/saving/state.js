import * as A from '@core/arena'

import * as AppState from '../state'

export const stateKey = 'saving'
const getState = A.pipe(AppState.getState, A.prop(stateKey))

export const assocSaving = (saving) => saving

export const isSaving = A.pipe(getState, A.equals(true))
