import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'
import { useUpdate } from './useUpdate'

export const useReset = ({ chain, setChain, step, setStep, setDirty, stepOriginal, setStepDirty }) => {
  const update = useUpdate({ step, setStep, chain, setChain, setDirty, setStepDirty })

  const resetStep = async () => {
    setStep(null)

    const newChain = Chain.dissocProcessingStepTemporary(chain)
    setChain(newChain)
    setStepDirty(null)
  }

  return () => {
    if (!A.isEmpty(stepOriginal)) {
      update({ stepUpdated: stepOriginal })
    } else {
      resetStep()
    }
  }
}
