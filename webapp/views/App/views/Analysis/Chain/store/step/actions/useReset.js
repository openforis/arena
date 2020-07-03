import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'
import { useUpdate } from './useUpdate'

export const useReset = ({ chain, setChain, setDirty, state, setState, State }) => {
  const update = useUpdate({ chain, setChain, setDirty, state, setState, State })

  const stepOriginal = State.getStepOriginal(State)

  const resetStep = async () => {
    const newChain = Chain.dissocProcessingStepTemporary(chain)
    setChain(newChain)

    setState({
      step: null,
      stepDirty: null,
    })
  }

  return () => {
    if (!A.isEmpty(stepOriginal)) {
      update({ stepUpdated: stepOriginal })
    } else {
      resetStep()
    }
  }
}
