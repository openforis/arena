import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import { DialogConfirmActions } from '@webapp/store/ui'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as StepVariable from '@common/analysis/processingStepVariable'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { State } from '../../state'

const _prepareStepForEdit = ({ step, previousStep }) => {
  if (previousStep && A.isEmpty(Step.getVariablesPreviousStep(step))) {
    const variablesPreviousStep = Step.getCalculations(previousStep).map((calculation) =>
      StepVariable.newProcessingStepVariable({ uuid: Calculation.getNodeDefUuid(calculation) })
    )
    return Step.assocVariablesPreviousStep(variablesPreviousStep)(step)
  }
  return step
}

export const useSelect = ({ setState }) => {
  const dispatch = useDispatch()

  const select = ({ step }) => {
    setState((statePrev) => {
      const chainEditPrev = State.getChainEdit(statePrev)
      const stepPrev = State.getStep(statePrev)
      const stepEditPrev = State.getStepEdit(statePrev)

      const previousStep = Chain.getStepPrev(step)(chainEditPrev)
      const stepEditUpdated = _prepareStepForEdit({ step, previousStep })
      const chainEditUpdated =
        !A.isEmpty(stepEditPrev) && !Step.isTemporary(stepEditPrev)
          ? Chain.assocProcessingStep(stepPrev)(chainEditPrev)
          : Chain.dissocProcessingStepTemporary(chainEditPrev)

      return A.pipe(
        State.assocChainEdit(chainEditUpdated),
        State.assocStep(stepEditUpdated),
        State.assocStepEdit(stepEditUpdated),
        State.dissocCalculation,
        State.dissocCalculationEdit
      )(statePrev)
    })
  }

  return useCallback(({ step, state }) => {
    if (State.isStepDirty(state) || State.isCalculationDirty(state)) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: () => select({ step }),
        })
      )
    } else {
      select({ step })
    }
  }, [])
}
