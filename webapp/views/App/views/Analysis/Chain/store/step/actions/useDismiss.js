import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useDismiss = ({ chain, setChain, step, setStep, setDirty, stepOriginal, stepDirty, setStepDirty }) => {
  const dispatch = useDispatch()

  const reset = useReset({
    chain,
    setChain,
    step,
    setStep,
    setDirty,
    stepOriginal,
    setStepDirty,
  })

  const resetStep = async () => {
    reset()
    setStep(null)
    setStepDirty(null)
  }

  return () => {
    ;(async () => {
      if (stepDirty) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'processingStepCalculation.deleteConfirm',
            onOk: resetStep,
          })
        )
      } else {
        await resetStep()
      }
    })()
  }
}
