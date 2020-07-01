import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import { DialogConfirmActions } from '@webapp/store/ui'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { AnalysisActions } from '@webapp/service/storage'

export const useDismiss = ({ dirty }) => {
  const dispatch = useDispatch()
  const history = useHistory()

  const navigateToChainsView = () => {
    AnalysisActions.resetChain()
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
