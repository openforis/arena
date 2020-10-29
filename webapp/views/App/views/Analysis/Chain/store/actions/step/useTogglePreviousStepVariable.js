import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as ChainController from '@common/analysis/chainController'
import * as StepVariable from '@common/analysis/stepVariable'

import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '../../state'

const _toggleVariable = ({ variable, include, setState }) => {
  setState((statePrev) => {
    const step = State.getStepEdit(statePrev)
    const variableUuid = StepVariable.getUuid(variable)

    const { step: stepUpdated } = include
      ? ChainController.assocVariablePreviousStep({ step, variable })
      : ChainController.dissocVariablePreviousStep({ step, variableUuid })

    return State.assocStepEdit(stepUpdated)(statePrev)
  })
}

export const useTogglePreviousStepVariable = ({ setState }) => {
  const dispatch = useDispatch()

  return useCallback(({ variable, include }) => {
    if (!include && StepVariable.getAggregate(variable)) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'processingStepView.variablesPreviousStep.deleteConfirm',
          onOk: () => _toggleVariable({ variable, include, setState }),
        })
      )
    } else {
      _toggleVariable({ variable, include, setState })
    }
  }, [])
}
