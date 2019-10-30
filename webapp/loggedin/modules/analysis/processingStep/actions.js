import axios from 'axios'
import * as R from 'ramda'

import { hideAppSaving, showAppSaving } from '@webapp/app/actions'
import { debounceAction } from '@webapp/utils/reduxUtils'

import * as ProcessingStep from '@common/analysis/processingStep'

import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepState from './processingStepState'

export const processingStepUpdate = 'analysis/processingStep/update'
export const processingStepPropsUpdate = 'analysis/processingStep/props/update'

export const resetProcessingStepState = () => dispatch => dispatch({ type: processingStepUpdate, processingStep: {} })

// ====== READ

export const fetchProcessingStep = processingStepUuid => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data: processingStep } = await axios.get(`/api/survey/${surveyId}/processing-step/${processingStepUuid}`)

  dispatch({ type: processingStepUpdate, processingStep })
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

