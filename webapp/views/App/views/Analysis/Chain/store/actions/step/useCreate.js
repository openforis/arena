import { useCallback } from 'react'
import * as A from '@core/arena'

import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'

export const useCreate = ({ setState }) =>
  useCallback(
    () =>
      setState((statePrev) => {
        const chain = State.getChainEdit(statePrev)
        const { chain: chainUpdated, step } = ChainController.createAndAssocStep({ chain })
        return A.pipe(State.assocChainEdit(chainUpdated), State.assocStepEdit(step))(statePrev)
      }),
    []
  )
