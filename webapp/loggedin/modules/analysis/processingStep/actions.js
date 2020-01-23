import axios from 'axios'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppLoader, hideAppSaving, showAppLoader, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

import * as ProcessingStepState from './processingStepState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import { nodeDefCreate } from '@webapp/survey/nodeDefs/actions'
import { navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/actions'

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

  dispatch({ type: processingStepCalculationsLoad, calculations })
}
// ====== UPDATE

export const updateProcessingStepProps = props => dispatch => dispatch({ type: processingStepPropsUpdate, props })

export const updateProcessingStepCalculationIndex = (indexFrom, indexTo) => dispatch =>
  dispatch({ type: processingStepCalculationIndexUpdate, indexFrom, indexTo })

// ====== DELETE

export const deleteProcessingStep = () => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)

  await axios.delete(`/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(processingStep)}`)

  dispatch({ type: processingStepDelete })
  dispatch(showNotification('processingStepView.deleteComplete'))
  dispatch(hideAppSaving())
}

// ====== VIRTUAL ENTITY

export const addEntityVirtual = history => async (dispatch, getState) => {
  const state = getState()
  const processingChain = ProcessingChainState.getProcessingChain(state)

  const nodeDef = NodeDef.newNodeDef(
    null,
    NodeDef.nodeDefType.entity,
    ProcessingChain.getCycles(processingChain),
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
