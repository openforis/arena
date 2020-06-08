import * as R from 'ramda'

import * as UiState from '../state'

export const stateKey = 'dialogConfirm'

const getState = R.pipe(UiState.getState, R.propOr({}, stateKey))

const keys = {
  key: 'key',
  params: 'params',
  onOk: 'onOk',
  onCancel: 'onCancel',
}

export const getKey = R.pipe(getState, R.propOr(null, keys.key))
export const getParams = R.pipe(getState, R.propOr({}, keys.params))
export const getOnOk = R.pipe(getState, R.prop(keys.onOk))
export const getOnCancel = R.pipe(getState, R.prop(keys.onCancel))

export const show = ({ key, params, onOk, onCancel }) => ({
  [keys.key]: key,
  [keys.params]: params,
  [keys.onOk]: onOk,
  [keys.onCancel]: onCancel,
})

export const hide = () => ({})
