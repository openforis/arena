import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { useAppDispatch } from '@webapp/store'
import { DialogConfirmActions } from '@webapp/store/ui'
import { State } from '../../state'

export const useOnDoneClick = ({ setState }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const performDone = () => {
    navigate(-1)
  }

  return useCallback(() => {
    setState((statePrev) => {
      if (State.isCategoryEmpty(statePrev)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'categoryEdit.confirmDeleteEmptyCategory',
            onOk: performDone,
          })
        )
      } else {
        performDone()
      }
      return statePrev
    })
  }, [])
}
