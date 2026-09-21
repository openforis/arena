import * as A from '@core/arena'

import * as UiState from '../state'

export const stateKey = 'dialogConfirm'

const getState = A.pipe(UiState.getState, A.propOr({}, stateKey))

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
  // optional extra content (i18n key + params), shown only while the checkbox is checked
  checkboxCheckedContentKey: 'checkboxCheckedContentKey',
  checkboxCheckedContentParams: 'checkboxCheckedContentParams',
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

export const getKey = A.pipe(getState, A.propOr(null, keys.key))
export const getParams = A.pipe(getState, A.propOr({}, keys.params))
export const getOnOk = A.pipe(getState, A.prop(keys.onOk))
export const isDismissable = A.pipe(getState, A.propEq(keys.dismissable, true))
export const getOnCancel = A.pipe(getState, A.prop(keys.onCancel))
export const getOkButtonLabel = A.pipe(getState, A.propOr('common.ok', keys.okButtonLabel))
export const getOkButtonClass = A.pipe(getState, A.prop(keys.okButtonClass))
export const getOkButtonIconClass = A.pipe(getState, A.propOr('icon-checkmark icon-12px', keys.okButtonIconClass))
// checkbox option
export const getCheckboxLabel = A.pipe(getState, A.propOr(null, keys.checkboxLabel))
export const getOnOkChecked = A.pipe(getState, A.prop(keys.onOkChecked))
export const getOkButtonLabelChecked = A.pipe(getState, A.prop(keys.okButtonLabelChecked))
export const getOkButtonClassChecked = A.pipe(getState, A.prop(keys.okButtonClassChecked))
export const isCheckboxChecked = A.pipe(getState, A.propEq(keys.checkboxChecked, true))
export const getCheckboxCheckedContentKey = A.pipe(getState, A.propOr(null, keys.checkboxCheckedContentKey))
export const getCheckboxCheckedContentParams = A.pipe(getState, A.propOr({}, keys.checkboxCheckedContentParams))
// header
export const getHeaderText = A.pipe(getState, A.propOr(null, keys.headerText))
// strong confirmation
export const isStrongConfirm = A.pipe(getState, A.propEq(keys.strongConfirm, true))
export const getStrongConfirmInputLabel = A.pipe(getState, A.propOr(null, keys.strongConfirmInputLabel))
export const getStrongConfirmRequiredText = A.pipe(getState, A.propOr(null, keys.strongConfirmRequiredText))
export const getStrongConfirmText = A.pipe(getState, A.propOr('', keys.strongConfirmText))

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
  checkboxCheckedContentKey = null,
  checkboxCheckedContentParams = {},
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
  [keys.checkboxCheckedContentKey]: checkboxCheckedContentKey,
  [keys.checkboxCheckedContentParams]: checkboxCheckedContentParams,
  [keys.headerText]: headerText,
  [keys.strongConfirm]: strongConfirm,
  [keys.strongConfirmInputLabel]: strongConfirmInputLabel,
  [keys.strongConfirmRequiredText]: strongConfirmRequiredText,
})

// update
export const hide = () => ({})
export const setStrongConfirmText = (text) => A.assoc(keys.strongConfirmText, text)
export const setCheckboxChecked = (checked) => A.assoc(keys.checkboxChecked, checked)
