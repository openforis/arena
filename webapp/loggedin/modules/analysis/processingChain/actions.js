import * as R from 'ramda'
import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ProcessingChainValidator from '@common/analysis/processingChainValidator'
import * as Validation from '@core/validation/validation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from './processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from '@webapp/loggedin/modules/analysis/processingStepCalculation/processingStepCalculationState'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import { onNodeDefsDelete } from '@webapp/survey/nodeDefs/actions'

export const processingChainReset = 'analysis/processingChain/reset'
export const processingChainUpdate = 'analysis/processingChain/update'
export const processingChainPropUpdate = 'analysis/processingChain/prop/update'
export const processingChainDelete = 'analysis/processingChain/delete'
export const processingChainSave = 'analysis/processingChain/save'
export const processingChainStepsLoad = 'analysis/processingChain/steps/load'
export const processingChainValidationUpdate = 'analysis/processingChain/validation/update'

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
    processingChain: processingChain
      ? ProcessingChain.assocCalculationAttributeDefUuids(calculationAttributeUuids)(processingChain)
      : null,
  })
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

const _onProcessingChainPropUpdate = (key, value) => async dispatch => {
  await dispatch({ type: processingChainPropUpdate, key, value })

  dispatch(validateProcessingChain())
}

export const updateProcessingChainProp = (key, value) => dispatch => dispatch(_onProcessingChainPropUpdate(key, value))

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
    dispatch(_onProcessingChainPropUpdate(ProcessingChain.keysProps.cycles, cycles))
  } else {
    dispatch(showNotification('processingChainView.cannotSelectCycle', {}, NotificationState.severity.error))
  }
}

export const validateProcessingChain = () => async (dispatch, getState) => {
  const state = getState()
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const chain = ProcessingChainState.getProcessingChain(state)
  const validation = await ProcessingChainValidator.validateChain(chain, Survey.getDefaultLanguage(surveyInfo))
  const chainUpdated = ProcessingChain.assocItemValidation(ProcessingChain.getUuid(chain), validation)(chain)

  dispatch({ type: processingChainValidationUpdate, validation: ProcessingChain.getValidation(chainUpdated) })
}

export const saveProcessingChain = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const surveyDefaultLang = Survey.getDefaultLanguage(surveyInfo)

  const step = R.pipe(
    ProcessingStepState.getProcessingStep,
    ProcessingStep.dissocTemporary,
    R.when(R.isEmpty, R.always(null)),
  )(state)

  const stepValidation = step ? await ProcessingChainValidator.validateStep(step) : null

  const calculation = R.pipe(
    ProcessingStepCalculationState.getCalculation,
    ProcessingStepCalculation.dissocTemporary,
    R.when(R.isEmpty, R.always(null)),
  )(state)

  const calculationValidation = calculation
    ? await ProcessingChainValidator.validateCalculation(calculation, surveyDefaultLang)
    : null

  let chain = R.pipe(ProcessingChainState.getProcessingChain, ProcessingChain.dissocTemporary)(state)

  const chainValidation = await ProcessingChainValidator.validateChain(chain, surveyDefaultLang)

  // Update chain, step and calculation validation in chain validation
  chain = R.pipe(
    ProcessingChain.assocItemValidation(ProcessingChain.getUuid(chain), chainValidation),
    R.unless(
      R.always(R.isNil(step)),
      ProcessingChain.assocItemValidation(ProcessingStep.getUuid(step), stepValidation),
    ),
    R.unless(
      R.always(R.isNil(calculation)),
      ProcessingChain.assocItemValidation(ProcessingStepCalculation.getUuid(calculation), calculationValidation),
    ),
  )(chain)

  // Do not save if one of chain, step or calculation is invalid
  if (R.all(Validation.isValid, [chainValidation, stepValidation, calculationValidation])) {
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
      ),
    )(step)

    await axios.put(`/api/survey/${surveyId}/processing-chain/`, {
      chain: chainParam,
      step: stepParam,
      calculation,
    })

    dispatch(showNotification('common.saved'))
    dispatch({ type: processingChainSave, chain, step, calculation })
  } else {
    dispatch({ type: processingChainValidationUpdate, validation: ProcessingChain.getValidation(chain) })
    dispatch(showNotification('common.formContainsErrorsCannotSave', {}, NotificationState.severity.error))
  }

  dispatch(hideAppSaving())
}

// ====== DELETE

export const deleteProcessingChain = history => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)

  const { data: nodeDefUnusedDeletedUuids = [] } = await axios.delete(
    `/api/survey/${surveyId}/processing-chain/${ProcessingChain.getUuid(processingChain)}`,
  )

  // Dissoc deleted node def analysis
  dispatch(onNodeDefsDelete(nodeDefUnusedDeletedUuids))
  dispatch({ type: processingChainDelete })

  dispatch(navigateToProcessingChainsView(history))
  dispatch(showNotification('processingChainView.deleteComplete'))
  dispatch(hideAppSaving())
}
