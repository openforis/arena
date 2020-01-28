import axios from 'axios'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingChainValidator from '@common/analysis/processingChainValidator'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppLoader, hideAppSaving, showAppLoader, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

import * as ProcessingStepState from './processingStepState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import { nodeDefCreate, onNodeDefsDelete } from '@webapp/survey/nodeDefs/actions'
import { navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/actions'
import { processingChainValidationUpdate } from '../processingChain/actions'

export const processingStepCreate = 'analysis/processingStep/create'
export const processingStepCalculationsLoad = 'analysis/processingStep/calculations/load'
export const processingStepUpdate = 'analysis/processingStep/update'
export const processingStepPropsUpdate = 'analysis/processingStep/props/update'
export const processingStepDelete = 'analysis/processingStep/delete'
export const processingStepReset = 'analysis/processingStep/reset'

export const processingStepCalculationCreate = 'analysis/processingStep/calculation/create'
export const processingStepCalculationUpdate = 'analysis/processingStep/calculation/update'
export const processingStepCalculationIndexUpdate = 'analysis/processingStep/calculation/index/update'

export const resetProcessingStepState = () => dispatch => dispatch({ type: processingStepReset })

export const setProcessingStepCalculationForEdit = calculation => dispatch =>
  dispatch({ type: processingStepCalculationUpdate, calculation })

// ====== SET FOR EDIT

export const setProcessingStepForEdit = processingStep => dispatch =>
  dispatch({ type: processingStepUpdate, processingStep })

// ====== CREATE

export const createProcessingStep = () => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const processingChain = ProcessingChainState.getProcessingChain(state)

  const processingStep = ProcessingChain.newProcessingStep(processingChain)

  dispatch({ type: processingStepCreate, processingStep })
  dispatch(hideAppLoader())
}

export const createProcessingStepCalculation = () => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculation = ProcessingChain.newProcessingStepCalculation(processingStep)

  dispatch({ type: processingStepCalculationCreate, calculation })
  dispatch(hideAppLoader())
}

// ====== READ
export const fetchProcessingStepCalculations = () => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStepUuid = R.pipe(ProcessingStepState.getProcessingStep, ProcessingStep.getUuid)(state)

  const { data: calculations = [] } = await axios.get(
    `/api/survey/${surveyId}/processing-step/${processingStepUuid}/calculations`,
  )

  await dispatch({ type: processingStepCalculationsLoad, calculations })

  dispatch(validateProcessingStep())
}
// ====== UPDATE

export const updateProcessingStepProps = props => async dispatch => {
  await dispatch({ type: processingStepPropsUpdate, props })

  dispatch(validateProcessingStep())
}

export const updateProcessingStepCalculationIndex = (indexFrom, indexTo) => dispatch =>
  dispatch({ type: processingStepCalculationIndexUpdate, indexFrom, indexTo })

export const validateProcessingStep = () => async (dispatch, getState) => {
  // Validate step and update validation in chain
  const state = getState()
  const chain = ProcessingChainState.getProcessingChain(state)
  const step = ProcessingStepState.getProcessingStep(state)
  const stepValidation = await ProcessingChainValidator.validateStep(step)
  const chainUpdated = ProcessingChain.assocItemValidation(ProcessingStep.getUuid(step), stepValidation)(chain)

  dispatch({ type: processingChainValidationUpdate, validation: ProcessingChain.getValidation(chainUpdated) })
}

// ====== DELETE

export const deleteProcessingStep = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)

  const { data: nodeDefUnusedDeletedUuids = [] } = await axios.delete(
    `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(processingStep)}`,
  )

  dispatch({ type: processingStepDelete })

  // Dissoc deleted node def analysis
  dispatch(onNodeDefsDelete(nodeDefUnusedDeletedUuids))

  dispatch(showNotification('processingStepView.deleteComplete'))
  dispatch(hideAppSaving())
}

// ====== VIRTUAL ENTITY

export const addEntityVirtual = history => async (dispatch, getState) => {
  const state = getState()
  const surveyInfo = SurveyState.getSurveyInfo(state)

  const nodeDef = NodeDef.newNodeDef(
    null,
    NodeDef.nodeDefType.entity,
    Survey.getCycleKeys(surveyInfo),
    {
      [NodeDef.propKeys.multiple]: true,
    },
    {},
    true,
    true,
  )

  await dispatch({ type: nodeDefCreate, nodeDef })

  dispatch(navigateToNodeDefEdit(history, NodeDef.getUuid(nodeDef)))
}
