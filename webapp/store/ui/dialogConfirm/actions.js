import * as DialogConfirmState from './state'

export const DIALOG_CONFIRM_SHOW = 'ui/dialogConfirm/show'
export const DIALOG_CONFIRM_HIDE = 'ui/dialogConfirm/hide'

export const showDialogConfirm = ({ key, params, onOk, onCancel = null }) => (dispatch) =>
  dispatch({ type: DIALOG_CONFIRM_SHOW, key, params, onOk, onCancel })

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
