import * as R from 'ramda'
import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from './processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
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
  const [{ data: processingChain }, { data: calculationAttributeUuids }] = await Promise.all([
    axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}`),
    axios.get(`/api/survey/${surveyId}/processing-chain/${processingChainUuid}/calculation-attribute-uuids`),
  ])

  dispatch({
    type: processingChainUpdate,
    processingChain: ProcessingChain.assocCalculationAttributeDefUuids(calculationAttributeUuids)(processingChain),
  })
  dispatch(hideAppSaving())
}

export const fetchProcessingSteps = processingChainUuid => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const chain = ProcessingChainState.getProcessingChain(state)

  const { data: stepsDb } = await axios.get(
    `/api/survey/${surveyId}/processing-chain/${processingChainUuid}/processing-steps`,
  )
  // Get validation from chain and associate it to each processing step
  const processingSteps = R.map(stepDb => {
    const validation = ProcessingChain.getItemValidationByUuid(ProcessingStep.getUuid(stepDb))(chain)
    return ProcessingStep.assocValidation(validation)(stepDb)
  }, stepsDb)

  dispatch({ type: processingChainStepsLoad, processingSteps })
}

// ====== UPDATE

export const updateProcessingChainProp = (key, value) => dispatch =>
  dispatch({ type: processingChainPropUpdate, key, value })

export const updateProcessingChainCycles = cycles => (dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)

  // Check that all step entity defs belong to the specified cycles
  const steps = ProcessingChain.getProcessingSteps(processingChain)
  const allStepEntitiesBelongToCycles = R.all(
    R.pipe(
      ProcessingStep.getEntityUuid,
      nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
      NodeDef.belongsToAllCycles(cycles),
    ),
  )(steps)

  let allStepCalculationAttriutesBelongToCycles = false
  if (allStepEntitiesBelongToCycles) {
    // Check that all step calculation attribute defs belong to the specified cycles
    allStepCalculationAttriutesBelongToCycles = R.pipe(
      ProcessingChain.getCalculationAttributeUuids,
      R.all(R.pipe(nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey), NodeDef.belongsToAllCycles(cycles))),
    )(processingChain)
  }

  if (allStepEntitiesBelongToCycles && allStepCalculationAttriutesBelongToCycles) {
    dispatch({ type: processingChainPropUpdate, key: ProcessingChain.keysProps.cycles, value: cycles })
  } else {
    dispatch(showNotification('processingChainView.cannotSelectCycle', {}, NotificationState.severity.error))
  }
}

export const saveProcessingChain = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)

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

  const chain = R.pipe(
    ProcessingChainState.getProcessingChain,
    ProcessingChain.dissocTemporary,
    // Update validation
    R.unless(
      R.always(R.isNil(step)),
      ProcessingChain.assocItemValidation(ProcessingStep.getUuid(step), ProcessingStep.getValidation(step)),
    ),
    R.unless(
      R.always(R.isNil(calculation)),
      ProcessingChain.assocItemValidation(
        ProcessingStepCalculation.getUuid(calculation),
        ProcessingStepCalculation.getValidation(calculation),
      ),
    ),
  )(state)

  // POST Params
  const chainParam = ProcessingChain.dissocProcessingSteps(chain)

  // Step, get only calculation uuid for order
  const stepParam = R.unless(
    R.isNil,
    R.pipe(
      ProcessingStep.getCalculations,
      R.pluck(ProcessingStepCalculation.keys.uuid),
      calculationUuids => ProcessingStep.assocCalculationUuids(calculationUuids)(step),
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
