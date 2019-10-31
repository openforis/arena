import axios from 'axios'
import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepState from './processingStepState'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { navigateToProcessingChainView } from '@webapp/loggedin/modules/analysis/processingChains/actions'

import { debounceAction } from '@webapp/utils/reduxUtils'

export const processingStepUpdate = 'analysis/processingStep/update'
export const processingStepPropsUpdate = 'analysis/processingStep/props/update'

export const resetProcessingStepState = () => dispatch =>
  dispatch({ type: processingStepUpdate, processingStep: {}, processingStepPrev: null, processingStepNext: null })

// ====== READ

export const fetchProcessingStep = processingStepUuid => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data: { processingStep, processingStepPrev, processingStepNext } } = await axios.get(`/api/survey/${surveyId}/processing-step/${processingStepUuid}`)

  dispatch({ type: processingStepUpdate, processingStep, processingStepPrev, processingStepNext })
  dispatch(hideAppSaving())
}

// ====== UPDATE

export const putProcessingStepProps = props => async (dispatch, getState) => {
  const state = getState()

  const processingStepUuid = R.pipe(
    ProcessingStepState.getProcessingStep,
    ProcessingStep.getUuid
  )(state)

  dispatch({ type: processingStepPropsUpdate, props })

  const action = async () => {
    dispatch(showAppSaving())

    const surveyId = SurveyState.getSurveyId(state)
    await axios.put(`/api/survey/${surveyId}/processing-step/${processingStepUuid}`, { props })

    dispatch(hideAppSaving())
  }
  dispatch(debounceAction(action, `${processingStepPropsUpdate}_${processingStepUuid}`))
}

// ====== UPDATE

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
