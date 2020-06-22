import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { DialogConfirmActions } from '@webapp/store/ui'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { AnalysisStorage } from '@webapp/service/storage/analysis'

export const useOnDismiss = ({ dirty }) => {
  const dispatch = useDispatch()
  const history = useHistory()

  const navigateToChainsView = () => {
    AnalysisStorage.clearChain()
    history.push(appModuleUri(analysisModules.processingChains))
  }

  return () => {
    ;(async () => {
      if (!dirty) {
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
