import axios from 'axios'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as CalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { chainValidationUpdate } from './validation'

export const chainSave = 'analysis/chain/save'

export const saveChain = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  const step = R.pipe(StepState.getProcessingStep, Step.dissocTemporary, R.when(R.isEmpty, R.always(null)))(state)

  const stepValidation = step ? await ChainValidator.validateStep(step) : null

  const calculation = R.pipe(
    CalculationState.getCalculation,
    Calculation.dissocTemporary,
    R.when(R.isEmpty, R.always(null))
  )(state)

  const calculationValidation = calculation
    ? await ChainValidator.validateCalculation(calculation, surveyDefaultLang)
    : null

  let chain = R.pipe(ChainState.getProcessingChain, Chain.dissocTemporary)(state)

  const chainValidation = await ChainValidator.validateChain(chain, surveyDefaultLang)

  // Update chain, step and calculation validation in chain validation
  chain = R.pipe(
    Chain.assocItemValidation(Chain.getUuid(chain), chainValidation),
    R.unless(R.always(R.isNil(step)), Chain.assocItemValidation(Step.getUuid(step), stepValidation)),
    R.unless(
      R.always(R.isNil(calculation)),
      Chain.assocItemValidation(Calculation.getUuid(calculation), calculationValidation)
    )
  )(chain)

  // Do not save if one of chain, step or calculation is invalid
  if (R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
    // POST Params
    const chainParam = Chain.dissocProcessingSteps(chain)

    // Step, get only calculation uuid for order
    const stepParam = R.unless(
      R.isNil,
      R.pipe(
        Step.getCalculations,
        R.pluck(Calculation.keys.uuid),
        (calculationUuids) => Step.assocCalculationUuids(calculationUuids)(step),
        Step.dissocCalculations
      )
    )(step)

    await axios.put(`/api/survey/${surveyId}/processing-chain/`, {
      chain: chainParam,
      step: stepParam,
      calculation,
    })

    dispatch(showNotification('common.saved'))
    dispatch({ type: chainSave, chain, step, calculation })
  } else {
    dispatch({ type: chainValidationUpdate, validation: Chain.getValidation(chain) })
    dispatch(showNotification('common.formContainsErrorsCannotSave', {}, NotificationState.severity.error))
  }

  dispatch(hideAppSaving())
}
