import axios from 'axios'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ProcessingChainValidator from '@common/analysis/processingChainValidator'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from './processingStepCalculationState'

import { showAppLoader, hideAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { nodeDefCreate, onNodeDefsDelete } from '@webapp/survey/nodeDefs/actions'
import { navigateToNodeDefEdit } from '@webapp/loggedin/modules/analysis/actions'
import { processingChainValidationUpdate } from '@webapp/loggedin/modules/analysis/processingChain/actions'

export const processingStepCalculationDirtyUpdate = 'analysis/processingStep/calculation/dirty/update'
export const processingStepCalculationDelete = 'analysis/processingStep/calculation/delete'
export const processingStepCalculationReset = 'analysis/processingStep/calculation/reset'

const _updateProcessingStepCalculationDirty = calculation => async (dispatch, getState) => {
  dispatch({ type: processingStepCalculationDirtyUpdate, calculation })

  // Validate calculation and update validation in chain
  const state = getState()
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const chain = ProcessingChainState.getProcessingChain(state)
  const calculationValidation = await ProcessingChainValidator.validateCalculation(
    calculation,
    Survey.getDefaultLanguage(surveyInfo),
  )
  const chainUpdated = ProcessingChain.assocItemValidation(
    ProcessingStepCalculation.getUuid(calculation),
    calculationValidation,
  )(chain)

  dispatch({ type: processingChainValidationUpdate, validation: ProcessingChain.getValidation(chainUpdated) })
}

export const resetProcessingStepCalculationState = () => (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())
  dispatch({ type: processingStepCalculationReset, calculation })
}

// ====== UPDATE

export const validateProcessingStepCalculation = () => (dispatch, getState) => {
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

export const updateProcessingStepCalculationAttribute = attrDef => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())
  const calculationUpdated = ProcessingStepCalculation.assocNodeDefUuid(NodeDef.getUuid(attrDef))(calculation)
  dispatch(_updateProcessingStepCalculationDirty(calculationUpdated))
}

// ====== DELETE

export const deleteProcessingStepCalculation = () => async (dispatch, getState) => {
  dispatch(showAppLoader())
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculation = ProcessingStepCalculationState.getCalculation(state)

  const { data: nodeDefUnusedDeletedUuids = [] } = await axios.delete(
    `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(
      processingStep,
    )}/calculation/${ProcessingStepCalculation.getUuid(calculation)}`,
  )

  dispatch({ type: processingStepCalculationDelete, calculation })

  // Dissoc deleted node def analysis
  dispatch(onNodeDefsDelete(nodeDefUnusedDeletedUuids))

  dispatch(showNotification('common.deleted', {}, null, 3000))

  dispatch(hideAppLoader())
}

// ====== NODE DEF ANALYSIS

export const createNodeDefAnalysis = history => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const nodeDefParent = R.pipe(ProcessingStep.getEntityUuid, entityDefUuid =>
    Survey.getNodeDefByUuid(entityDefUuid)(survey),
  )(processingStep)
  const calculation = ProcessingStepCalculationState.getCalculation(state)
  const nodeDefType = ProcessingStepCalculation.getNodeDefType(calculation)

  const nodeDef = NodeDef.newNodeDef(
    nodeDefParent,
    nodeDefType,
    R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey),
    {},
    {},
    true,
  )

  await dispatch({ type: nodeDefCreate, nodeDef })

  dispatch(navigateToNodeDefEdit(history, NodeDef.getUuid(nodeDef)))
}
