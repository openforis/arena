import { useCallback } from 'react'
import * as A from '@core/arena'

import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'

export const useCreate = ({ setState }) =>
  useCallback(
    () =>
      setState((statePrev) => {
        const chain = State.getChainEdit(statePrev)
        const step = State.getStepEdit(statePrev)
        const { chain: chainUpdated, step: stepUpdated, calculation } = ChainController.createAndAssocCalculation({
          chain,
          step,
        })

        return A.pipe(
          State.assocChainEdit(chainUpdated),
          State.assocStepEdit(stepUpdated),
          State.assocCalculationEdit(calculation)
        )(statePrev)
      }),
    []
  )
