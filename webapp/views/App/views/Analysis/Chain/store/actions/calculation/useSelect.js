import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '../../state'

export const useSelect = ({ setState }) => {
  const dispatch = useDispatch()

  const select = ({ calculation, state }) => () => {
    const currentCalculation = State.getCalculationEdit(state)

    let stepEdit = State.getStepEdit(state)
    if (!A.isEmpty(currentCalculation)) {
      stepEdit = Calculation.isTemporary(currentCalculation)
        ? Step.dissocCalculation(currentCalculation)(stepEdit)
        : Step.assocCalculation(State.getCalculation(state))(stepEdit)
    }
    setState(
      A.pipe(
        State.assocStepEdit(stepEdit),
        State.assocCalculation(calculation),
        State.assocCalculationEdit(calculation)
      )(state)
    )
  }

  return useCallback(({ calculation, state }) => {
    const calculationDirty = State.isCalculationDirty(state)
    if (calculationDirty) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: select({ calculation, state }),
        })
      )
    } else {
      select({ calculation, state })()
    }
  }, [])
}
