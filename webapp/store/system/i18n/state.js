import * as R from 'ramda'
import * as SystemState from '../state'

export const stateKey = 'i18n'

export const getState = R.pipe(SystemState.getState, R.propOr({}, stateKey))

export const keys = {
  lang: 'lang',
}

// ====== READ
export const getI18n = getState
export const getLang = R.pipe(getState, R.prop(keys.lang))
