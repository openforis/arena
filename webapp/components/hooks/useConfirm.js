import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

export const useConfirm = () => {
  const dispatch = useDispatch()

  return useCallback(
    ({
      key,
      params = {},
      onOk,
      onCancel,
      okButtonLabel = undefined,
      okButtonClass = undefined,
      okButtonIconClass = undefined,
      headerText = undefined,
      strongConfirm = false,
      strongConfirmInputLabel = undefined,
      strongConfirmRequiredText = undefined,
    }) => {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key,
          params,
          onOk,
          onCancel,
          okButtonLabel,
          okButtonClass,
          okButtonIconClass,
          headerText,
          strongConfirm,
          strongConfirmInputLabel,
          strongConfirmRequiredText,
        })
      )
    },
    [dispatch]
  )
}

export const useConfirmDelete = () => {
  const confirm = useConfirm()

  return useCallback(
    ({
      key,
      params = {},
      onOk,
      headerText = undefined,
      strongConfirm = false,
      strongConfirmInputLabel = undefined,
      strongConfirmRequiredText = undefined,
    }) => {
      confirm({
        key,
        params,
        onOk,
        headerText,
        strongConfirm,
        strongConfirmInputLabel,
        strongConfirmRequiredText,
        okButtonLabel: 'common.delete',
        okButtonClass: 'btn-danger btn-delete',
        okButtonIconClass: 'icon-bin icon-12px',
      })
    },
    [confirm]
  )
}
