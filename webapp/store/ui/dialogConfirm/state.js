import * as R from 'ramda'

import * as UiState from '../state'

export const stateKey = 'dialogConfirm'

const getState = R.pipe(UiState.getState, R.propOr({}, stateKey))

const keys = {
  key: 'key',
  params: 'params',
  onOk: 'onOk',
  onCancel: 'onCancel',
  okButtonLabel: 'okButtonLabel',
  okButtonClass: 'okButtonClass',
  okButtonIconClass: 'okButtonIconClass',
  // header
  headerText: 'headerText',
  // strong confirmation
  strongConfirm: 'strongConfirm', // boolean: true if strong confirmation is required
  strongConfirmInputLabel: 'strongConfirmInputLabel',
  strongConfirmRequiredText: 'strongConfirmRequiredText', // text that the user has to input for strong confirmation
  // transient
  strongConfirmText: 'strongConfirmText',
}

export const getKey = R.pipe(getState, R.propOr(null, keys.key))
export const getParams = R.pipe(getState, R.propOr({}, keys.params))
export const getOnOk = R.pipe(getState, R.prop(keys.onOk))
export const getOnCancel = R.pipe(getState, R.prop(keys.onCancel))
export const getOkButtonLabel = R.pipe(getState, R.propOr('common.ok', keys.okButtonLabel))
export const getOkButtonClass = R.pipe(getState, R.prop(keys.okButtonClass))
export const getOkButtonIconClass = R.pipe(getState, R.propOr('icon-checkmark icon-12px', keys.okButtonIconClass))
// header
export const getHeaderText = R.pipe(getState, R.propOr(null, keys.headerText))
// strong confirmation
export const isStrongConfirm = R.pipe(getState, R.propEq(keys.strongConfirm, true))
export const getStrongConfirmInputLabel = R.pipe(getState, R.propOr(null, keys.strongConfirmInputLabel))
export const getStrongConfirmRequiredText = R.pipe(getState, R.propOr(null, keys.strongConfirmRequiredText))
export const getStrongConfirmText = R.pipe(getState, R.propOr('', keys.strongConfirmText))

// create
export const show = ({
  key,
  params,
  onOk,
  onCancel,
  okButtonLabel = 'common.ok',
  okButtonClass = undefined,
  okButtonIconClass = undefined,
  headerText = null,
  strongConfirm = false,
  strongConfirmInputLabel = 'confirm.strongConfirmInputLabel',
  strongConfirmRequiredText = null,
}) => ({
  [keys.key]: key,
  [keys.params]: params,
  [keys.onOk]: onOk,
  [keys.onCancel]: onCancel,
  [keys.okButtonLabel]: okButtonLabel,
  [keys.okButtonClass]: okButtonClass,
  [keys.okButtonIconClass]: okButtonIconClass,
  [keys.headerText]: headerText,
  [keys.strongConfirm]: strongConfirm,
  [keys.strongConfirmInputLabel]: strongConfirmInputLabel,
  [keys.strongConfirmRequiredText]: strongConfirmRequiredText,
})

// update
export const hide = () => ({})
export const setStrongConfirmText = (text) => R.assoc(keys.strongConfirmText, text)
