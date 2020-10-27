import { useCallback } from 'react'

import * as ChainFactory from '@common/analysis/chainFactory'
import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'

export const useTogglePreviousStepVariable = ({ setState }) =>
  useCallback(
    ({ variableUuid, include }) =>
      setState((statePrev) => {
        const step = State.getStepEdit(statePrev)
        const variable = ChainFactory.createStepVariable({ variableUuid })
        const { step: stepUpdated } = include
          ? ChainController.assocVariablePreviousStep({ step, variable })
          : ChainController.dissocVariablePreviousStep({ step, variableUuid })

        return State.assocStepEdit(stepUpdated)(statePrev)
      }),
    []
  )
