import * as R from 'ramda'

export const stateKey = 'appDialogConfirm'

const getState = R.propOr({}, stateKey)

const keys = {
  messageKey: 'messageKey',
  messageParams: 'messageParams',
  onOk: 'onOk',
  onCancel: 'onCancel',
}

export const getMessageKey = R.pipe(getState, R.propOr(null, keys.messageKey))
export const getMessageParams = R.pipe(getState, R.propOr({}, keys.messageParams))
export const getOnOk = R.pipe(getState, R.prop(keys.onOk))
export const getOnCancel = R.pipe(getState, R.prop(keys.onCancel))

export const show = (messageKey, messageParams, onOk, onCancel) => ({
  [keys.messageKey]: messageKey,
  [keys.messageParams]: messageParams,
  [keys.onOk]: onOk,
  [keys.onCancel]: onCancel,
})

export const hide = {}
