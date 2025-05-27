import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '../../state'
import { useNavigator } from '@webapp/app/useNavigator'

export const useOnDoneClick = ({ setState }) => {
  const { navigateBack } = useNavigator()
  const dispatch = useDispatch()

  const performDone = () => {
    navigateBack()
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
