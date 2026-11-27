import { useCallback } from 'react'

import { useAppDispatch } from '@webapp/store/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'

export const useConfirm = () => {
  const dispatch = useAppDispatch()

  return useCallback(
    ({
      key,
      params = {},
      onOk,
      onCancel = undefined,
      okButtonLabel = undefined,
      okButtonClass = undefined,
      okButtonIcon = undefined,
      headerText = undefined,
      strongConfirm = false,
      strongConfirmInputLabel = undefined,
      strongConfirmRequiredText = undefined,
      dismissable = true,
    }) => {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key,
          params,
          onOk,
          onCancel,
          okButtonLabel,
          okButtonClass,
          okButtonIcon,
          headerText,
          strongConfirm,
          strongConfirmInputLabel,
          strongConfirmRequiredText,
          dismissable,
        })
      )
    },
    [dispatch]
  )
}

export const useConfirmAsync = () => {
  const dispatch = useAppDispatch()
  return useCallback(
    ({
      key,
      params = {},
      okButtonLabel = undefined,
      okButtonClass = undefined,
      okButtonIcon = undefined,
      headerText = undefined,
      strongConfirm = false,
      strongConfirmInputLabel = undefined,
      strongConfirmRequiredText = undefined,
      dismissable = true,
    }) =>
      new Promise<boolean>((resolve, reject) => {
        try {
          dispatch(
            DialogConfirmActions.showDialogConfirm({
              key,
              params,
              okButtonLabel,
              okButtonClass,
              okButtonIcon,
              headerText,
              strongConfirm,
              strongConfirmInputLabel,
              strongConfirmRequiredText,
              dismissable,
              onOk: () => resolve(true),
              onCancel: () => resolve(false),
            })
          )
        } catch (error) {
          reject(error)
        }
      }),
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
        okButtonIcon: 'delete',
      })
    },
    [confirm]
  )
}
