import { useCallback } from 'react'
import * as A from '@core/arena'

import * as ChainFactory from '@common/analysis/chainFactory'
import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'

export const useCreate = ({ setState }) => {
  return useCallback(
    () =>
      setState((statePrev) => {
        const chain = State.getChainEdit(statePrev)
        const step = ChainFactory.createStep({ chain })
        const chainUpdated = ChainController.assocStep({ chain, step })
        return A.pipe(State.assocChainEdit(chainUpdated), State.assocStepEdit(step))(statePrev)
      }),
    []
  )
}
