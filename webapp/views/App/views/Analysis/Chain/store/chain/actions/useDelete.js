import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'
import { AnalysisActions } from '@webapp/service/storage'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useHistory } from 'react-router'

export const useDelete = ({ chain }) => {
  const dispatch = useDispatch()
  const history = useHistory()

  const resetChain = () => {
    AnalysisActions.resetAnalysis()
    history.push(appModuleUri(analysisModules.processingChains))
  }

  return () => {
    ;(async () => {
      if (chain) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'processingChainView.deleteConfirm',
            onOk: resetChain,
          })
        )
      } else {
        resetChain()
      }
    })()
  }
}
