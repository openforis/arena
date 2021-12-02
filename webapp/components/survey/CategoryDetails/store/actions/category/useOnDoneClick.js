import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '../../state'

export const useOnDoneClick = ({ setState }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const performDone = () => {
    navigate.go(-1)
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
