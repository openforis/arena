import axios from 'axios'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ProcessingStepCalculationValidator from '@common/analysis/processingStepCalculationValidator'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from './processingStepCalculationState'

import { showAppLoader, hideAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { nodeDefCreate } from '@webapp/survey/nodeDefs/actions'
import { navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/actions'

export const processingStepCalculationDirtyUpdate = 'analysis/processingStep/calculation/dirty/update'
export const processingStepCalculationDelete = 'analysis/processingStep/calculation/delete'
export const processingStepCalculationReset = 'analysis/processingStep/calculation/reset'

const _validate = async calculation => {
  const validation = await ProcessingStepCalculationValidator.validate(calculation)
  return ProcessingStepCalculation.assocValidation(validation)(calculation)
}

const _updateProcessingStepCalculationDirty = calculation => async dispatch =>
  dispatch({
    type: processingStepCalculationDirtyUpdate,
    calculation: await _validate(calculation),
  })

export const resetProcessingStepCalculationState = () => dispatch => dispatch({ type: processingStepCalculationReset })

// ====== UPDATE

export const validateProcessingStepCalculation = () => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())
  dispatch(_updateProcessingStepCalculationDirty(calculation))
}

export const updateProcessingStepCalculationProp = (prop, value) => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())

  const calculationUpdated = R.pipe(
    ProcessingStepCalculation.assocProp(prop, value),
    // When changing type, reset nodeDef
    R.when(
      R.always(R.equals(prop, ProcessingStepCalculation.keysProps.type)),
      R.pipe(
        ProcessingStepCalculation.assocNodeDefUuid(null),
        // When type is categorical, reset aggregate function
        R.when(
          R.always(R.equals(value, ProcessingStepCalculation.type.categorical)),
          ProcessingStepCalculation.assocProp(ProcessingStepCalculation.keysProps.aggregateFn, null),
        ),
      ),
    ),
  )(calculation)

  dispatch(_updateProcessingStepCalculationDirty(calculationUpdated))
}

export const updateProcessingStepCalculationAttribute = attrDefUuid => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())

  const calculationUpdated = ProcessingStepCalculation.assocNodeDefUuid(attrDefUuid)(calculation)

  dispatch(_updateProcessingStepCalculationDirty(calculationUpdated))
}

// ====== DELETE

export const deleteProcessingStepCalculation = () => async (dispatch, getState) => {
  dispatch(showAppLoader())
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculation = ProcessingStepCalculationState.getCalculation(state)

  await axios.delete(
    `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(
      processingStep,
    )}/calculation/${ProcessingStepCalculation.getUuid(calculation)}`,
  )

  dispatch({
    type: processingStepCalculationDelete,
    calculation,
  })

  dispatch(showNotification('common.deleted', {}, null, 3000))

  dispatch(hideAppLoader())
}

// ====== NODE DEF ANALYSIS

export const createNodeDefAnalysis = history => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const nodeDefParent = R.pipe(ProcessingStep.getEntityUuid, entityDefUuid =>
    Survey.getNodeDefByUuid(entityDefUuid)(survey),
  )(processingStep)
  const calculation = ProcessingStepCalculationState.getCalculation(state)
  const nodeDefType = ProcessingStepCalculation.getNodeDefType(calculation)

  const nodeDef = NodeDef.newNodeDef(
    nodeDefParent,
    nodeDefType,
    ProcessingChain.getCycles(processingChain),
    {},
    {},
    true,
  )

  await dispatch({ type: nodeDefCreate, nodeDef })

  dispatch(navigateToNodeDefEdit(history, NodeDef.getUuid(nodeDef)))
}
