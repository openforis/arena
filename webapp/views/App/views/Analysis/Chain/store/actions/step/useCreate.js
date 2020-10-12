import { useCallback } from 'react'
import * as A from '@core/arena'

import * as ChainFactory from '@common/analysis/chainFactory'
import * as Chain from '@common/analysis/processingChain'

import { State } from '../../state'

export const useCreate = ({ setState }) => {
  return useCallback(({ state }) => {
    const chain = State.getChainEdit(state)
    const step = ChainFactory.newStep({ chain })
    const chainWithStep = Chain.assocProcessingStep(step)(chain)

    setState(A.pipe(State.assocChainEdit(chainWithStep), State.assocStepEdit(step))(state))
  }, [])
}
