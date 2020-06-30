import * as A from '@core/arena'

import { AnalysisActions } from '@webapp/service/storage'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import { useUpdate } from './useUpdate'

export const useReset = ({ chain, setChain, step, setStep, setDirty, originalStep, setStepDirty }) => {
  const update = useUpdate({ step, setStep, chain, setChain, setDirty, setStepDirty })

  const resetStep = async () => {
    AnalysisActions.resetStep()
    setStep({})

    const newChain = {
      ...chain,
      [Chain.keys.processingSteps]: chain[Chain.keys.processingSteps].filter(
        (processingStep) => !Step.isTemporary(processingStep)
      ),
    }
    setChain(newChain)
    AnalysisActions.persistChain({ chain: newChain })
    setStepDirty(false)
  }

  return () => {
    if (!A.isEmpty(originalStep)) {
      update({ stepUpdated: originalStep })
    } else {
      resetStep()
    }
  }
}
