import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { DialogConfirmActions } from '@webapp/store/ui'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { AnalysisStorage } from '@webapp/service/storage'

export const useDismiss = ({ chainState, ChainState }) => {
  const dispatch = useDispatch()
  const history = useHistory()

  const navigateToChainsView = () => {
    AnalysisStorage.reset()
    history.push(appModuleUri(analysisModules.processingChains))
  }

  return () => {
    ;(async () => {
      if (!ChainState.getDirty(chainState)) {
        navigateToChainsView()
      } else {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'common.cancelConfirm',
            onOk: navigateToChainsView,
          })
        )
      }
    })()
  }
}
