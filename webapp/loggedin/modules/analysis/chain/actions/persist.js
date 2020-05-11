import axios from 'axios'
import * as R from 'ramda'

import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as ChainState from '@webapp/loggedin/modules/analysis/chain/state'
import * as StepState from '@webapp/loggedin/modules/analysis/step/state'
import * as CalculationState from '@webapp/loggedin/modules/analysis/calculation/state'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { chainValidationUpdate } from './validation'

export const chainSave = 'analysis/chain/save'

const _getStateObject = (fn) => R.pipe(fn, ObjectUtils.dissocTemporary, R.when(R.isEmpty, R.always(null)))
const _getChain = _getStateObject(ChainState.getProcessingChain)
const _getStep = _getStateObject(StepState.getProcessingStep)
const _getCalculation = _getStateObject(CalculationState.getCalculation)

const _getChainAndValidation = (params) => async (state) => {
  const { lang, step, stepValidation, calculation, calculationValidation } = params
  const chain = _getChain(state)
  const chainValidation = await ChainValidator.validateChain(chain, lang)
  return [
    R.pipe(
      Chain.assocItemValidation(Chain.getUuid(chain), chainValidation),
      R.unless(R.always(R.isNil(step)), Chain.assocItemValidation(Step.getUuid(step), stepValidation)),
      R.unless(
        R.always(R.isNil(calculation)),
        Chain.assocItemValidation(Calculation.getUuid(calculation), calculationValidation)
      )
    )(chain),
    chainValidation,
  ]
}

const _getStepParam = (step) =>
  R.unless(
    R.isNil,
    R.pipe(
      Step.getCalculations,
      R.map(Calculation.getUuid),
      (calculationUuids) => Step.assocCalculationUuids(calculationUuids)(step),
      Step.dissocCalculations
    )
  )(step)

export const saveChain = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const lang = SurveyState.getSurveyDefaultLang(state)

  const step = _getStep(state)
  const stepValidation = step ? await ChainValidator.validateStep(step) : null
  const calculation = _getCalculation(state)
  const calculationValidation = calculation ? await ChainValidator.validateCalculation(calculation, lang) : null
  const params = { lang, step, stepValidation, calculation, calculationValidation }
  const [chain, chainValidation] = await _getChainAndValidation(params)(state)

  // Do not save if one of chain, step or calculation is invalid
  if (R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
    const data = { chain: Chain.dissocProcessingSteps(chain), step: _getStepParam(step), calculation }
    await axios.put(`/api/survey/${surveyId}/processing-chain/`, data)

    dispatch(showNotification('common.saved'))
    dispatch({ type: chainSave, chain, step, calculation })
  } else {
    dispatch({ type: chainValidationUpdate, validation: Chain.getValidation(chain) })
    dispatch(showNotification('common.formContainsErrorsCannotSave', {}, NotificationState.severity.error))
  }

  dispatch(hideAppSaving())
}
