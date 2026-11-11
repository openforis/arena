import * as DialogConfirmState from './state'

export const DIALOG_CONFIRM_SHOW = 'ui/dialogConfirm/show'
export const DIALOG_CONFIRM_HIDE = 'ui/dialogConfirm/hide'
export const DIALOG_CONFIRM_TEXT_CHANGE = 'ui/dialogConfirm/textChange'
export const DIALOG_CONFIRM_CHECKBOX_CHANGE = 'ui/dialogConfirm/checkboxChange'

export const showDialogConfirm = (params) => (dispatch) =>
  dispatch({
    type: DIALOG_CONFIRM_SHOW,
    ...params,
  })

export const hideDialogConfirm = () => (dispatch) => dispatch({ type: DIALOG_CONFIRM_HIDE })

export const onDialogConfirmOk = () => (dispatch, getState) => {
  const state = getState()
  // when the optional checkbox is checked, onOkChecked (if provided) replaces onOk entirely - this
  // is how a dialog offers a secondary, opt-in action (e.g. "skip data update") behind a checkbox
  // that's unchecked by default
  const onOk = DialogConfirmState.isCheckboxChecked(state)
    ? (DialogConfirmState.getOnOkChecked(state) ?? DialogConfirmState.getOnOk(state))
    : DialogConfirmState.getOnOk(state)
  if (onOk) {
    dispatch(onOk)
  }
  dispatch(hideDialogConfirm())
}

export const onDialogConfirmCancel = () => (dispatch, getState) => {
  const onCancel = DialogConfirmState.getOnCancel(getState())
  if (onCancel) {
    dispatch(onCancel)
  }

  dispatch(hideDialogConfirm())
}

export const onDialogConfirmTextChange = (text) => (dispatch) => dispatch({ type: DIALOG_CONFIRM_TEXT_CHANGE, text })

export const onDialogConfirmCheckboxChange = (checked) => (dispatch) =>
  dispatch({ type: DIALOG_CONFIRM_CHECKBOX_CHANGE, checked })
