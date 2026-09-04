import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as DialogConfirmActions from './actions'
import * as DialogConfirmState from './state'

export const useDialogConfirm = () => {
  const dispatch = useDispatch()

  const key = useSelector(DialogConfirmState.getKey)
  const params = useSelector(DialogConfirmState.getParams)
  const okButtonLabel = useSelector(DialogConfirmState.getOkButtonLabel)
  const okButtonClass = useSelector(DialogConfirmState.getOkButtonClass)
  const okButtonIconClass = useSelector(DialogConfirmState.getOkButtonIconClass)
  const checkboxLabel = useSelector(DialogConfirmState.getCheckboxLabel)
  const checkboxChecked = useSelector(DialogConfirmState.isCheckboxChecked)
  const okButtonLabelChecked = useSelector(DialogConfirmState.getOkButtonLabelChecked)
  const okButtonClassChecked = useSelector(DialogConfirmState.getOkButtonClassChecked)
  const headerText = useSelector(DialogConfirmState.getHeaderText)
  const strongConfirm = useSelector(DialogConfirmState.isStrongConfirm)
  const strongConfirmInputLabel = useSelector(DialogConfirmState.getStrongConfirmInputLabel)
  const strongConfirmRequiredText = useSelector(DialogConfirmState.getStrongConfirmRequiredText)
  const strongConfirmText = useSelector(DialogConfirmState.getStrongConfirmText)
  const dismissable = useSelector(DialogConfirmState.isDismissable)

  const onStrongConfirmInputChange = useCallback(
    (event) => {
      dispatch(DialogConfirmActions.onDialogConfirmTextChange(event.target.value))
    },
    [dispatch]
  )

  const onOk = useCallback(() => {
    dispatch(DialogConfirmActions.onDialogConfirmOk())
  }, [dispatch])

  const onCheckboxChange = useCallback(
    (checked) => {
      dispatch(DialogConfirmActions.onDialogConfirmCheckboxChange(checked))
    },
    [dispatch]
  )

  const onClose = useCallback(() => {
    if (dismissable) {
      dispatch(DialogConfirmActions.onDialogConfirmCancel())
    }
  }, [dismissable, dispatch])

  return {
    key,
    params,
    okButtonLabel,
    okButtonClass,
    okButtonIconClass,
    checkboxLabel,
    checkboxChecked,
    okButtonLabelChecked,
    okButtonClassChecked,
    headerText,
    strongConfirm,
    strongConfirmInputLabel,
    strongConfirmRequiredText,
    strongConfirmText,
    dismissable,
    onStrongConfirmInputChange,
    onOk,
    onCheckboxChange,
    onClose,
  }
}
