import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

export const useConfirm = () => {
  const dispatch = useDispatch()

  return useCallback(
    ({ key, params = {}, onOk }) => {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key,
          params,
          onOk,
        })
      )
    },
    [dispatch]
  )
}
