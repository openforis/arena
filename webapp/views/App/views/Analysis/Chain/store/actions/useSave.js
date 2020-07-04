import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import axios from 'axios'
import * as R from 'ramda'

import * as A from '@core/arena'

import * as Validation from '@core/validation/validation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { AnalysisStorage } from '@webapp/service/storage/analysis'
import { NotificationActions } from '@webapp/store/ui'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { AppSavingActions } from '@webapp/store/app'
import { useLang } from '@webapp/store/system'
import * as ChainValidator from '@common/analysis/processingChainValidator'

import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { State } from '../state'

const _getChainAndValidation = (params) => async (chain) => {
  const { lang, step, stepValidation, calculation, calculationValidation } = params
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

export const useSave = ({ setState }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyId = useSurveyId()
  const lang = useLang()

  return useCallback(async ({ state }) => {
    dispatch(AppSavingActions.showAppSaving())
    const chain = State.getChainEdit(state)
    const step = State.getStepEdit(state)
    const calculation = State.getCalculationEdit(state)

    const stepValidation = !A.isEmpty(step) ? await ChainValidator.validateStep(step) : null
    const calculationValidation = !A.isEmpty(calculation)
      ? await ChainValidator.validateCalculation(calculation, lang)
      : null

    const params = { lang, step, stepValidation, calculation, calculationValidation }
    const [chainToSave, chainValidation] = await _getChainAndValidation(params)(chain)
    if (R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
      const data = {
        chain: Chain.dissocProcessingSteps(chainToSave),
        step: !R.isEmpty(step) ? _getStepParam(step) : null,
        calculation: !R.isEmpty(calculation) ? calculation : null,
      }
      await axios.put(`/api/survey/${surveyId}/processing-chain/`, data)

      dispatch(NotificationActions.notifyInfo({ key: 'common.saved' }))

      setState(
        A.pipe(
          State.assocChain(chainToSave),
          State.assocChainEdit(chainToSave),
          State.assocStep(step),
          State.assocStepEdit(step),
          State.assocCalculation(calculation),
          State.assocCalculationEdit(calculation)
        )(state)
      )

      AnalysisStorage.removeChainEdit()

      dispatch(SurveyActions.chainSave())
      history.push(`${appModuleUri(analysisModules.processingChain)}${Chain.getUuid(chainToSave)}`)
    } else {
      setState(State.assocChainEdit(chainToSave)(state))
      dispatch(NotificationActions.notifyError({ key: 'common.formContainsErrorsCannotSave', timeout: 3000 }))
    }

    dispatch(AppSavingActions.hideAppSaving())
  }, [])
}
