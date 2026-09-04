import * as R from 'ramda'

import * as UiState from '../state'

export const stateKey = 'dialogConfirm'

const getState = R.pipe(UiState.getState, R.propOr({}, stateKey))

const keys = {
  key: 'key',
  params: 'params',
  onOk: 'onOk',
  dismissable: 'dismissable', // boolean: true if the dialog can be dismissed by clicking outside of it or pressing Esc
  onCancel: 'onCancel', // optional, applicable only if dismissable is true
  okButtonLabel: 'okButtonLabel',
  okButtonClass: 'okButtonClass',
  okButtonIconClass: 'okButtonIconClass',
  // optional checkbox (unchecked by default) offering an alternative, less prominent action; when
  // checked, onOkChecked/okButtonLabelChecked/okButtonClassChecked replace onOk/okButtonLabel/
  // okButtonClass, and strong confirmation (if requested) is only enforced while it's checked
  checkboxLabel: 'checkboxLabel',
  onOkChecked: 'onOkChecked',
  okButtonLabelChecked: 'okButtonLabelChecked',
  okButtonClassChecked: 'okButtonClassChecked',
  // header
  headerText: 'headerText',
  // strong confirmation
  strongConfirm: 'strongConfirm', // boolean: true if strong confirmation is required
  strongConfirmInputLabel: 'strongConfirmInputLabel',
  strongConfirmRequiredText: 'strongConfirmRequiredText', // text that the user has to input for strong confirmation
  // transient
  strongConfirmText: 'strongConfirmText',
  checkboxChecked: 'checkboxChecked',
}

export const getKey = R.pipe(getState, R.propOr(null, keys.key))
export const getParams = R.pipe(getState, R.propOr({}, keys.params))
export const getOnOk = R.pipe(getState, R.prop(keys.onOk))
export const isDismissable = R.pipe(getState, R.propEq(keys.dismissable, true))
export const getOnCancel = R.pipe(getState, R.prop(keys.onCancel))
export const getOkButtonLabel = R.pipe(getState, R.propOr('common.ok', keys.okButtonLabel))
export const getOkButtonClass = R.pipe(getState, R.prop(keys.okButtonClass))
export const getOkButtonIconClass = R.pipe(getState, R.propOr('icon-checkmark icon-12px', keys.okButtonIconClass))
// checkbox option
export const getCheckboxLabel = R.pipe(getState, R.propOr(null, keys.checkboxLabel))
export const getOnOkChecked = R.pipe(getState, R.prop(keys.onOkChecked))
export const getOkButtonLabelChecked = R.pipe(getState, R.prop(keys.okButtonLabelChecked))
export const getOkButtonClassChecked = R.pipe(getState, R.prop(keys.okButtonClassChecked))
export const isCheckboxChecked = R.pipe(getState, R.propEq(keys.checkboxChecked, true))
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
  dismissable = true,
  onCancel,
  okButtonLabel = 'common.ok',
  okButtonClass = undefined,
  okButtonIconClass = undefined,
  checkboxLabel = null,
  onOkChecked = null,
  okButtonLabelChecked = null,
  okButtonClassChecked = null,
  headerText = null,
  strongConfirm = false,
  strongConfirmInputLabel = 'confirm.strongConfirmInputLabel',
  strongConfirmRequiredText = null,
}) => ({
  [keys.key]: key,
  [keys.params]: params,
  [keys.onOk]: onOk,
  [keys.dismissable]: dismissable,
  [keys.onCancel]: onCancel,
  [keys.okButtonLabel]: okButtonLabel,
  [keys.okButtonClass]: okButtonClass,
  [keys.okButtonIconClass]: okButtonIconClass,
  [keys.checkboxLabel]: checkboxLabel,
  [keys.onOkChecked]: onOkChecked,
  [keys.okButtonLabelChecked]: okButtonLabelChecked,
  [keys.okButtonClassChecked]: okButtonClassChecked,
  [keys.headerText]: headerText,
  [keys.strongConfirm]: strongConfirm,
  [keys.strongConfirmInputLabel]: strongConfirmInputLabel,
  [keys.strongConfirmRequiredText]: strongConfirmRequiredText,
})

// update
export const hide = () => ({})
export const setStrongConfirmText = (text) => R.assoc(keys.strongConfirmText, text)
export const setCheckboxChecked = (checked) => R.assoc(keys.checkboxChecked, checked)
