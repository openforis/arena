import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { DialogConfirmActions } from '@webapp/store/ui'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import { State } from '../state'

export const useDismiss = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  const navigateToChainsView = () => {
    history.push(appModuleUri(analysisModules.processingChains))
  }

  return useCallback(({ state }) => {
    if (State.isChainDirty(state)) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: navigateToChainsView,
        })
      )
    } else {
      navigateToChainsView()
    }
  }, [])
}
