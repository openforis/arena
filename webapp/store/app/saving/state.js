import * as R from 'ramda'

import * as AppState from '../state'

export const stateKey = 'saving'
const getState = R.pipe(AppState.getState, R.prop(stateKey))

export const assocSaving = (saving) => saving

export const isSaving = R.pipe(getState, R.equals(true))
