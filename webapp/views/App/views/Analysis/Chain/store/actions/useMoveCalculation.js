import { useCallback } from 'react'

import * as ChainController from '@common/analysis/chainController'

import { State } from '../state'

export const useMoveCalculation = ({ setState }) =>
  useCallback(
    ({ indexFrom, indexTo }) =>
      setState((statePrev) => {
        const step = State.getStepEdit(statePrev)
        const { step: stepUpdated } = ChainController.moveCalculation({ step, indexFrom, indexTo })
        return State.assocStepEdit(stepUpdated)(statePrev)
      }),
    []
  )
