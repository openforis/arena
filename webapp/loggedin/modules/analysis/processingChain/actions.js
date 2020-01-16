import * as R from 'ramda'
import axios from 'axios'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from './processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { showNotification } from '@webapp/app/appNotification/actions'
import { hideAppSaving, showAppSaving } from '@webapp/app/actions'

export const processingChainReset = 'analysis/processingChain/reset'
export const processingChainUpdate = 'analysis/processingChain/update'
export const processingChainPropUpdate = 'analysis/processingChain/prop/update'
export const processingChainSave = 'analysis/processingChain/save'

export const processingChainStepsLoad = 'analysis/processingChain/steps/load'

export const resetProcessingChainState = () => dispatch => dispatch({ type: processingChainReset })

export const navigateToProcessingChainsView = history => dispatch => {
  dispatch(resetProcessingChainState())
  // Navigate to processing chains view
  history.push(appModuleUri(analysisModules.processingChains))
}

// ====== READ

export const fetchProcessingChain = processingChainUuid => async (dispatch, getState) => {
  dispatch(showAppSaving())
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingChain } = await axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}`)

  dispatch({ type: processingChainUpdate, processingChain })
  dispatch(hideAppSaving())
}

export const fetchProcessingSteps = processingChainUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingSteps } = await axios.get(
    `/api/survey/${surveyId}/processing-chain/${processingChainUuid}/processing-steps`,
  )

  dispatch({ type: processingChainStepsLoad, processingSteps })
}

// ====== UPDATE

export const updateProcessingChainProp = (key, value) => dispatch =>
  dispatch({ type: processingChainPropUpdate, key, value })

export const saveProcessingChain = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const chain = R.pipe(ProcessingChainState.getProcessingChain, ProcessingChain.dissocTemporary)(state)
  const step = R.pipe(
    ProcessingStepState.getProcessingStep,
    ProcessingStep.dissocTemporary,
    R.when(R.isEmpty, R.always(null)),
  )(state)
  const calculation = R.pipe(
    ProcessingStepCalculationState.getCalculation,
    ProcessingStepCalculation.dissocTemporary,
    R.when(R.isEmpty, R.always(null)),
  )(state)

  // POST Params
  const chainParam = R.pipe(ProcessingChain.dissocProcessingSteps, ProcessingChain.dissocValidation)(chain)

  // Step, get only calculation uuid for order
  const stepParam = R.unless(
    R.isNil,
    R.pipe(
      ProcessingStep.getCalculations,
      R.pluck(ProcessingStep.keys.uuid),
      stepUuids => ProcessingStep.assocCalculationUuids(stepUuids)(step),
      ProcessingStep.dissocCalculations,
      ProcessingStep.dissocValidation,
    ),
  )(step)

  const calculationParam = R.unless(R.isNil, ProcessingStepCalculation.dissocValidation)(calculation)

  await axios.put(`/api/survey/${surveyId}/processing-chain/`, {
    chain: chainParam,
    step: stepParam,
    calculation: calculationParam,
  })

  dispatch(showNotification('common.saved'))
  dispatch({ type: processingChainSave, chain, step, calculation })
  dispatch(hideAppSaving())
}

// ====== DELETE

export const deleteProcessingChain = history => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)

  await axios.delete(`/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(processingChain)}`)

  dispatch(navigateToProcessingChainsView(history))
  dispatch(showNotification('processingChainView.deleteComplete'))
  dispatch(hideAppSaving())
}
