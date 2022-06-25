import * as DialogConfirmState from './state'

export const DIALOG_CONFIRM_SHOW = 'ui/dialogConfirm/show'
export const DIALOG_CONFIRM_HIDE = 'ui/dialogConfirm/hide'
export const DIALOG_CONFIRM_TEXT_CHANGE = 'ui/dialogConfirm/textChange'

export const showDialogConfirm = (params) => (dispatch) =>
  dispatch({
    type: DIALOG_CONFIRM_SHOW,
    ...params,
  })

export const hideDialogConfirm = () => (dispatch) => dispatch({ type: DIALOG_CONFIRM_HIDE })

export const onDialogConfirmOk = () => (dispatch, getState) => {
  const onOk = DialogConfirmState.getOnOk(getState())
  dispatch(onOk)
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
