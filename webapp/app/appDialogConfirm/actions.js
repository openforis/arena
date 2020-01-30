import * as AppDialogConfirmState from './appDialogConfirmState'

export const appDialogConfirmShow = 'app/dialogConfirm/show'
export const appDialogConfirmHide = 'app/dialogConfirm/hide'

export const showDialogConfirm = (messageKey, messageParams, onOk, onCancel = null) => dispatch =>
  dispatch({ type: appDialogConfirmShow, messageKey, messageParams, onOk, onCancel })

export const onDialogConfirmOk = () => (dispatch, getState) => {
  const onOk = AppDialogConfirmState.getOnOk(getState())
  dispatch(onOk)
  dispatch(hideDialogConfirm())
}

export const onDialogConfirmCancel = () => (dispatch, getState) => {
  const onCancel = AppDialogConfirmState.getOnCancel(getState())
  if (onCancel) {
    dispatch(onCancel)
  }

  dispatch(hideDialogConfirm())
}

export const hideDialogConfirm = () => dispatch => dispatch({ type: appDialogConfirmHide })
