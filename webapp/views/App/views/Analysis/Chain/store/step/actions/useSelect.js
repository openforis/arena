import * as A from '@core/arena'

import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useReset } from './useReset'

export const useSelect = ({ stepDirty, chain, setChain, step, setStep, setDirty, stepOriginal, setStepDirty }) => {
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

  const select = ({ stepSelected }) => {
    setStep(stepSelected)
  }

  const selectWithReset = ({ stepSelected }) => () => {
    reset()
    select({ stepSelected })
  }

  return (stepSelected) => {
    ;(async () => {
      if (stepDirty && !A.isEmpty(step)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'processingStepCalculation.deleteConfirm',
            onOk: selectWithReset({ stepSelected }),
          })
        )
      } else {
        select({ stepSelected })
      }
    })()
  }
}
