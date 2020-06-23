import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'
import { AnalysisActions } from '@webapp/service/storage'
import * as Chain from '@common/analysis/processingChain'

export const useOnDeleteStep = ({ chain, setChain, step, setStep }) => {
  const dispatch = useDispatch()

  const resetStep = () => {
    AnalysisActions.resetStep()
    setStep({})
    const withoutSteps = Chain.dissocProcessingStepTemporary(chain)
    const newChain = { ...chain, ...withoutSteps }
    setChain(newChain)
    AnalysisActions.persistChain({ chain: newChain })
  }

  return () => {
    ;(async () => {
      if (step) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'common.cancelConfirm',
            onOk: resetStep,
          })
        )
      } else {
        resetStep()
      }
    })()
  }
}
