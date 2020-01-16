import axios from 'axios'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppLoader, hideAppSaving, showAppLoader, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { navigateToProcessingChainView } from '@webapp/loggedin/modules/analysis/processingChains/actions'

import * as ProcessingStepState from './processingStepState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'
import { nodeDefCreate } from '@webapp/survey/nodeDefs/actions'
import { analysisModules, appModuleUri } from '@webapp/app/appModules'

export const processingStepCreate = 'analysis/processingStep/create'
export const processingStepUpdate = 'analysis/processingStep/update'
export const processingStepReset = 'analysis/processingStep/reset'
export const processingStepPropsUpdate = 'analysis/processingStep/props/update'

export const processingStepCalculationCreate = 'analysis/processingStep/calculation/create'
export const processingStepCalculationForEditUpdate = 'analysis/processingStep/calculation/forEdit/update'
export const processingStepCalculationIndexUpdate = 'analysis/processingStep/calculation/index/update'

export const resetProcessingStepState = () => dispatch => dispatch({ type: processingStepReset })

export const setProcessingStepCalculationForEdit = calculation => dispatch =>
  dispatch({ type: processingStepCalculationForEditUpdate, calculation })

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

// ====== UPDATE

export const updateProcessingStepProps = props => dispatch => dispatch({ type: processingStepPropsUpdate, props })

export const putProcessingStepCalculationIndex = (indexFrom, indexTo) => async (dispatch, getState) => {
  dispatch(showAppSaving())

  dispatch({ type: processingStepCalculationIndexUpdate, indexFrom, indexTo })

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStepUuid = R.pipe(ProcessingStepState.getProcessingStep, ProcessingStep.getUuid)(state)

  await axios.put(`/api/survey/${surveyId}/processing-step/${processingStepUuid}/calculation-index`, {
    indexFrom,
    indexTo,
  })

  dispatch(hideAppSaving())
}

// ====== DELETE

export const deleteProcessingStep = history => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)

  await axios.delete(`/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(processingStep)}`)

  dispatch(navigateToProcessingChainView(history, ProcessingStep.getProcessingChainUuid(processingStep)))
  dispatch(showNotification('processingStepView.deleteComplete'))
  dispatch(hideAppSaving())
}

// ====== VIRTUAL ENTITY

export const addEntityVirtual = history => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const processingChain = ProcessingChainState.getProcessingChain(state)
  const nodeDefParent = Survey.getNodeDefRoot(survey)
  // Entity source = prev processing step entity
  const entitySourceUuid = R.pipe(ProcessingStepState.getProcessingStepPrev, ProcessingStep.getEntityUuid)(state)

  const nodeDef = {
    ...NodeDef.newNodeDef(
      nodeDefParent,
      NodeDef.nodeDefType.entity,
      ProcessingChain.getCycle(processingChain),
      {
        [NodeDef.propKeys.multiple]: true,
        [NodeDef.propKeys.entitySourceUuid]: entitySourceUuid,
      },
      {},
      true,
    ),
    [NodeDef.keys.temporary]: true, // Used to dissoc node def on cancel if changes are not persisted
  }

  await dispatch({ type: nodeDefCreate, nodeDef })

  history.push(`${appModuleUri(analysisModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)
}
