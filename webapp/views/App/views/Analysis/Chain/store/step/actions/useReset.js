import * as A from '@core/arena'

import * as Chain from '@common/analysis/processingChain'
import { useUpdate } from './useUpdate'

export const useReset = ({ chainState, ChainState, state, setState, State }) => {
  const update = useUpdate({ chainState, ChainState, state, setState, State })

  const stepOriginal = State.getStepOriginal(State)
  const chain = ChainState.getChain(chainState)

  const resetStep = () => {
    const newChain = Chain.dissocProcessingStepTemporary(chain)

    ChainState.setState({
      chain: newChain,
    })

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
