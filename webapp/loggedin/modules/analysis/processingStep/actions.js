import axios from 'axios'
import * as R from 'ramda'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyState from '@webapp/survey/surveyState'

import { hideAppLoader, hideAppSaving, showAppLoader, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { navigateToProcessingChainView } from '@webapp/loggedin/modules/analysis/processingChains/actions'
import { fetchProcessingChain } from '../processingChain/actions'

import { debounceAction } from '@webapp/utils/reduxUtils'
import * as ProcessingStepState from './processingStepState'
import * as ProcessingChainState from '@webapp/loggedin/modules/analysis/processingChain/processingChainState'

export const processingStepUpdate = 'analysis/processingStep/update'
export const processingStepPropsUpdate = 'analysis/processingStep/props/update'
export const processingStepCalculationCreate = 'analysis/processingStep/calculation/create'
export const processingStepCalculationForEditUpdate = 'analysis/processingStep/calculation/forEdit/update'
export const processingStepCalculationIndexUpdate = 'analysis/processingStep/calculation/index/update'
export const processingStepCalculationEditCancel = 'analysis/processingStep/calculation/edit/cancel'

export const resetProcessingStepState = () => dispatch =>
  dispatch({
    type: processingStepUpdate,
    processingStep: {},
    processingStepPrev: null,
    processingStepNext: null,
  })

export const setProcessingStepCalculationForEdit = calculation => dispatch =>
  dispatch({
    type: processingStepCalculationForEditUpdate,
    calculation,
  })

// ====== CREATE

export const createProcessingStepCalculation = () => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculation = ProcessingChain.newProcessingStepCalculation(processingStep)

  dispatch({ type: processingStepCalculationCreate, calculation })
  dispatch(hideAppLoader())
}
// ====== READ

export const fetchProcessingStep = processingStepUuid => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const {
    data: { processingStep, processingStepPrev, processingStepNext },
  } = await axios.get(`/api/survey/${surveyId}/processing-step/${processingStepUuid}`)

  dispatch({
    type: processingStepUpdate,
    processingStep,
    processingStepPrev,
    processingStepNext,
  })
  dispatch(hideAppSaving())

  // Load processing chain if not in state
  const processingChain = ProcessingChainState.getProcessingChain(state)
  if (R.isNil(processingChain) || R.isEmpty(processingChain)) {
    dispatch(fetchProcessingChain(ProcessingStep.getProcessingChainUuid(processingStep)))
  }
}

// ====== UPDATE

export const putProcessingStepProps = props => async (dispatch, getState) => {
  const state = getState()

  const processingStepUuid = R.pipe(ProcessingStepState.getProcessingStep, ProcessingStep.getUuid)(state)

  dispatch({ type: processingStepPropsUpdate, props })

  const action = async () => {
    dispatch(showAppSaving())

    const surveyId = SurveyState.getSurveyId(state)
    await axios.put(`/api/survey/${surveyId}/processing-step/${processingStepUuid}`, { props })

    dispatch(hideAppSaving())
  }

  dispatch(debounceAction(action, `${processingStepPropsUpdate}_${processingStepUuid}`))
}

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
