import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import * as ChainController from '@common/analysis/chainController'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '../../state'

export const useSelect = ({ setState }) => {
  const dispatch = useDispatch()

  const select = ({ calculation }) => {
    setState((statePrev) => {
      const chain = State.getChainEdit(statePrev)
      const stepEditPrev = State.getStepEdit(statePrev)
      const calculationPrev = State.getCalculation(statePrev)
      const calculationEditPrev = State.getCalculationEdit(statePrev)

      let stepEditUpdated
      if (A.isEmpty(calculationEditPrev)) {
        stepEditUpdated = stepEditPrev
      } else {
        const { step: stepEditUpdatedWithCalculation } = Calculation.isTemporary(calculationEditPrev)
          ? ChainController.dissocCalculation({ chain, step: stepEditPrev, calculation: calculationEditPrev })
          : ChainController.assocCalculation({ chain, step: stepEditPrev, calculation: calculationPrev })
        stepEditUpdated = stepEditUpdatedWithCalculation
      }

      return A.pipe(
        State.assocStepEdit(stepEditUpdated),
        State.assocCalculation(calculation),
        State.assocCalculationEdit(calculation)
      )(statePrev)
    })
  }

  return useCallback(({ calculation, state }) => {
    if (State.isCalculationDirty(state)) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: () => select({ calculation }),
        })
      )
    } else {
      select({ calculation })
    }
  }, [])
}
