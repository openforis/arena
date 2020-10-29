import { useCallback } from 'react'

import * as ChainController from '@common/analysis/chainController'

import { State } from '../../state'
import { useDismissEditor } from '../stepVariable/useDismissEditor'

export const useUpdatePreviousStepVariable = ({ setState }) => {
  const dismissEditor = useDismissEditor({ setState })

  return useCallback(({ variable }) => {
    setState((statePrev) => {
      const stepEdit = State.getStepEdit(statePrev)
      const { step: stepEditUpdated } = ChainController.assocVariablePreviousStep({ step: stepEdit, variable })
      return State.assocStepEdit(stepEditUpdated)(statePrev)
    })
    dismissEditor()
  }, [])
}
