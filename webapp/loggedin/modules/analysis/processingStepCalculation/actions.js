import axios from 'axios'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ProcessingStepCalculationValidator from '@common/analysis/processingStepCalculationValidator'
import * as Validation from '@core/validation/validation'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'
import * as ProcessingStepCalculationState from './processingStepCalculationState'

import { showAppLoader, hideAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { setNodeDefUuidForEdit } from '@webapp/loggedin/surveyViews/nodeDef/actions'
import { nodeDefCreate } from '@webapp/survey/nodeDefs/actions'

export const processingStepCalculationDirtyUpdate = 'analysis/processingStep/calculation/dirty/update'
export const processingStepCalculationSave = 'analysis/processingStep/calculation/save'
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

export const setProcessingStepCalculationProp = (prop, value) => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculationDirty(getState())

  const calculationUpdated = ProcessingStepCalculation.assocProp(prop, value)(calculation)

  dispatch(_updateProcessingStepCalculationDirty(calculationUpdated))
}

export const setProcessingStepCalculationAttribute = attrDefUuid => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculationDirty(getState())

  const calculationUpdated = ProcessingStepCalculation.assocNodeDefUuid(attrDefUuid)(calculation)

  dispatch(_updateProcessingStepCalculationDirty(calculationUpdated))
}

export const saveProcessingStepCalculationEdits = () => async (dispatch, getState) => {
  dispatch(showAppLoader())
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculationValidated = await _validate(ProcessingStepCalculationState.getCalculationDirty(state))

  if (Validation.isObjValid(calculationValidated)) {
    const calculation = ProcessingStepCalculation.dissocTemporary(calculationValidated)

    const updateFn = ProcessingStepCalculation.isTemporary(calculationValidated) ? axios.post : axios.put
    await updateFn(
      `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(processingStep)}/calculation`,
      calculationValidated,
    )
    dispatch({
      type: processingStepCalculationSave,
      calculation,
    })
    dispatch(showNotification('common.saved', {}, null, 3000))
  } else {
    await dispatch({ type: processingStepCalculationDirtyUpdate, calculation: calculationValidated })
    dispatch(showNotification('common.formContainsErrorsCannotSave', {}, NotificationState.severity.error))
  }

  dispatch(hideAppLoader())
}

export const resetProcessingStepCalculationState = () => async (dispatch, getState) => {
  // Remove calculation from list (if temporary) and close editor
  dispatch({
    type: processingStepCalculationReset,
    temporary: R.pipe(
      ProcessingStepCalculationState.getCalculationDirty,
      ProcessingStepCalculation.isTemporary,
    )(getState()),
  })
}

export const createNodeDefAnalysis = history => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const nodeDefParent = R.pipe(ProcessingStep.getEntityUuid, entityDefUuid =>
    Survey.getNodeDefByUuid(entityDefUuid)(survey),
  )(processingStep)
  const calculation = ProcessingStepCalculationState.getCalculationDirty(state)
  const nodeDefType = ProcessingStepCalculation.getNodeDefType(calculation)

  const nodeDef = {
    ...NodeDef.newNodeDef(nodeDefParent, nodeDefType, ProcessingChain.getCycle(processingChain), {}, {}, true),
    [NodeDef.keys.temporary]: true, // Used to dissoc node def on cancel if changes are not persisted
  }

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  await dispatch({ type: nodeDefCreate, nodeDef })
  await dispatch(setNodeDefUuidForEdit(nodeDefUuid))

  history.push(`${appModuleUri(analysisModules.nodeDef)}${nodeDefUuid}/`)
}

export const deleteProcessingStepCalculation = () => async (dispatch, getState) => {}
