import { useCallback } from 'react'

import * as Step from '@common/analysis/processingStep'

import { State } from '../../state'

export const useUpdatePreviousStepVariable = ({ setState }) =>
  useCallback(({ variable }) => {
    setState((statePrev) => {
      const stepEdit = State.getStepEdit(statePrev)
      const stepEditUpdated = Step.assocVariablePreviousStep(variable)(stepEdit)
      return State.assocStepEdit(stepEditUpdated)(statePrev)
    })
  })
