import axios from 'axios'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Validation from '@core/validation/validation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { AnalysisActions } from '@webapp/service/storage'
import { NotificationActions } from '@webapp/store/ui'
import { useSurveyId } from '@webapp/store/survey'

import { AppSavingActions } from '@webapp/store/app'
import { useLang } from '@webapp/store/system'
import * as ChainValidator from '@common/analysis/processingChainValidator'
import * as R from 'ramda'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

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

export const useOnSave = ({ chain, setChain, step, calculation }) => {
  const dispatch = useDispatch()
  const history = useHistory()
  const surveyId = useSurveyId()
  const lang = useLang()

  return () => {
    ;(async () => {
      dispatch(AppSavingActions.showAppSaving())
      const stepValidation = step ? await ChainValidator.validateStep(step) : null
      const calculationValidation = calculation ? await ChainValidator.validateCalculation(calculation, lang) : null
      const params = { lang, step, stepValidation, calculation, calculationValidation }
      const [chainToSave, chainValidation] = await _getChainAndValidation(params)(chain)

      if (R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
        const data = { chain: Chain.dissocProcessingSteps(chainToSave), step: _getStepParam(step), calculation }
        await axios.put(`/api/survey/${surveyId}/processing-chain/`, data)

        dispatch(NotificationActions.notifyInfo({ key: 'common.saved' }))
        AnalysisActions.resetAnalysis()
        history.push(`${appModuleUri(analysisModules.processingChain)}${Chain.getUuid(chainToSave)}`)
      } else {
        setChain(chainToSave)
        dispatch(NotificationActions.notifyError({ key: 'common.formContainsErrorsCannotSave' }))
      }

      dispatch(AppSavingActions.hideAppSaving())
    })()
  }
}
