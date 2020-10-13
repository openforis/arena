import { useCallback } from 'react'

import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'

export const useUpdatePreviousStepVariable = ({ setState }) =>
  useCallback(
    ({ variable }) =>
      setState((statePrev) => {
        const stepEdit = State.getStepEdit(statePrev)
        const { step: stepEditUpdated } = ChainController.assocVariablePreviousStep({ step: stepEdit, variable })
        return State.assocStepEdit(stepEditUpdated)(statePrev)
      }),
    []
  )
