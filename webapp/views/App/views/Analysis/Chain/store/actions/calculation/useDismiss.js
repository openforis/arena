import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'

import * as Step from '@common/analysis/processingStep'
import * as Chain from '@common/analysis/processingChain'
import * as ChainController from '@common/analysis/chainController'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useSurveyInfo } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'

import { State } from '../../state'

export const useDismiss = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  const resetCalculation = () => {
    // dissoc calculation and calculationEdit
    // if calculation is temporal remove from step
    // if this calculation is not temporal back to the original and recalculate validation on chain
    setState((statePrev) => {
      const chainEdit = State.getChainEdit(statePrev)
      const stepEdit = State.getStepEdit(statePrev)
      const calculation = State.getCalculation(statePrev)
      const calculationEdit = State.getCalculationEdit(statePrev)
      const calculationTemporary = Calculation.isTemporary(calculationEdit)

      const stepEditUpdated = calculationTemporary
        ? Step.dissocCalculation(calculationEdit)(stepEdit)
        : Step.assocCalculation(calculation)(stepEdit)

      const chainEditUpdated = A.pipe(
        R.ifElse(
          R.always(calculationTemporary),
          A.identity,
          Chain.assocItemValidation(
            Calculation.getUuid(calculation),
            ChainValidator.validateCalculation(calculation, surveyDefaultLang)
          )
        ),
        (chainEditEdpdated) => ChainController.assocStep({ chain: chainEditEdpdated, step: stepEditUpdated })
      )(chainEdit)

      return A.pipe(
        State.assocChainEdit(chainEditUpdated),
        State.assocStepEdit(stepEditUpdated),
        State.dissocCalculation,
        State.dissocCalculationEdit
      )(statePrev)
    })
  }

  return useCallback(({ state }) => {
    if (State.isCalculationDirty(state)) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: resetCalculation,
        })
      )
    } else {
      resetCalculation()
    }
  }, [])
}
