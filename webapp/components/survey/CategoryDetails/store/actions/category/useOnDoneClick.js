import { useCallback } from 'react'
import { useHistory } from 'react-router'
import { useDispatch } from 'react-redux'

import { useIsCategoriesRoute } from '@webapp/components/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '../../state'

export const useOnDoneClick = ({ setState }) => {
  const history = useHistory()
  const dispatch = useDispatch()
  const inCategoriesPath = useIsCategoriesRoute()

  const performDone = () => {
    if (inCategoriesPath) {
      history.goBack()
    }
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
