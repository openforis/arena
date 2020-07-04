import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

// import * as Step from '@common/analysis/processingStep'

import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '@webapp/views/App/views/Analysis/Chain/store'

export const useSelect = ({ setState }) => {
  const dispatch = useDispatch()

  const select = ({ calculation, state }) => () => {
    /* TODO refactor after update Step
    State.assocStepEdit(
          !A.isEmpty(State.getCalculation(state))
            ? A.pipe(Step.assocCalculation(calculation))(State.getStepEdit(state))
            : State.getStepEdit(state)
        ),
     */
    setState(A.pipe(State.assocCalculation(calculation), State.assocCalculationEdit(calculation))(state))
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
