import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions } from '@webapp/store/ui'

import * as A from '@core/arena'

import * as Step from '@common/analysis/processingStep'
import * as Chain from '@common/analysis/processingChain'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as Calculation from '@common/analysis/processingStepCalculation'

import * as Survey from '@core/survey/survey'
import { useSurveyInfo } from '@webapp/store/survey'

import { State } from '../../state'

export const useDismiss = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyInfo = useSurveyInfo()
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  const resetCalculation = ({ state }) => () => {
    const calculation = State.getCalculation(state)
    const calculationEdit = State.getCalculationEdit(state)
    const stepEdit = State.getStepEdit(state)

    // dissoc calculation and calculationEdit
    // if calculation is temporal remove from step
    // if this calculation is not temporal back to the original and recalculate validation on chain
    setState(
      A.pipe(
        State.assocChainEdit(
          Calculation.isTemporary(calculationEdit)
            ? State.getChainEdit(state)
            : Chain.assocItemValidation(
                Calculation.getUuid(calculation),
                ChainValidator.validateCalculation(calculation, surveyDefaultLang)
              )(State.getChainEdit(state))
        ),
        State.assocStepEdit(
          Calculation.isTemporary(calculationEdit)
            ? Step.dissocCalculation(calculationEdit)(stepEdit)
            : Step.assocCalculation(calculation)(stepEdit)
        ),
        State.dissocCalculation,
        State.dissocCalculationEdit
      )(state)
    )
  }

  return useCallback(({ state }) => {
    const calculationDirty = State.isCalculationDirty(state)
    if (calculationDirty) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'common.cancelConfirm',
          onOk: resetCalculation({ state }),
        })
      )
    } else {
      resetCalculation({ state })()
    }
  }, [])
}
