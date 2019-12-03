import axios from 'axios'
import * as R from 'ramda'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as SurveyState from '@webapp/survey/surveyState'

import {
  hideAppLoader,
  hideAppSaving,
  showAppLoader,
  showAppSaving,
} from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { navigateToProcessingChainView } from '@webapp/loggedin/modules/analysis/processingChains/actions'

import { debounceAction } from '@webapp/utils/reduxUtils'
import * as ProcessingStepState from './processingStepState'

export const processingStepUpdate = 'analysis/processingStep/update'
export const processingStepPropsUpdate = 'analysis/processingStep/props/update'
export const processingStepCalculationCreate =
  'analysis/processingStep/calculation/create'
export const processingStepCalculationForEditUpdate =
  'analysis/processingStep/calculation/forEdit/update'
export const processingStepCalculationIndexUpdate =
  'analysis/processingStep/calculation/index/update'

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
    uuid: ProcessingStepCalculation.getUuid(calculation),
  })

// ====== CREATE

export const createProcessingStepCalculation = () => async (
  dispatch,
  getState,
) => {
  dispatch(showAppLoader())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculationSteps = ProcessingStep.getCalculationSteps(processingStep)

  const {
    data: calculation,
  } = await axios.post(
    `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(
      processingStep,
    )}/calculation`,
    { index: calculationSteps.length },
  )

  dispatch({ type: processingStepCalculationCreate, calculation })
  dispatch(hideAppLoader())
}
// ====== READ

export const fetchProcessingStep = processingStepUuid => async (
  dispatch,
  getState,
) => {
  dispatch(showAppSaving())

  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { processingStep, processingStepPrev, processingStepNext },
  } = await axios.get(
    `/api/survey/${surveyId}/processing-step/${processingStepUuid}`,
  )

  dispatch({
    type: processingStepUpdate,
    processingStep,
    processingStepPrev,
    processingStepNext,
  })
  dispatch(hideAppSaving())
}

// ====== UPDATE

export const putProcessingStepProps = props => async (dispatch, getState) => {
  const state = getState()

  const processingStepUuid = R.pipe(
    ProcessingStepState.getProcessingStep,
    ProcessingStep.getUuid,
  )(state)

  dispatch({ type: processingStepPropsUpdate, props })

  const action = async () => {
    dispatch(showAppSaving())

    const surveyId = SurveyState.getSurveyId(state)
    await axios.put(
      `/api/survey/${surveyId}/processing-step/${processingStepUuid}`,
      { props },
    )

    dispatch(hideAppSaving())
  }

  dispatch(
    debounceAction(
      action,
      `${processingStepPropsUpdate}_${processingStepUuid}`,
    ),
  )
}

export const putProcessingStepCalculationIndex = (indexFrom, indexTo) => async (
  dispatch,
  getState,
) => {
  dispatch(showAppSaving())

  dispatch({ type: processingStepCalculationIndexUpdate, indexFrom, indexTo })

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStepUuid = R.pipe(
    ProcessingStepState.getProcessingStep,
    ProcessingStep.getUuid,
  )(state)

  await axios.put(
    `/api/survey/${surveyId}/processing-step/${processingStepUuid}/calculation-index`,
    { indexFrom, indexTo },
  )

  dispatch(hideAppSaving())
}

// ====== DELETE

export const deleteProcessingStep = history => async (dispatch, getState) => {
  dispatch(showAppSaving())

  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)

  await axios.delete(
    `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(
      processingStep,
    )}`,
  )

  dispatch(
    navigateToProcessingChainView(
      history,
      ProcessingStep.getProcessingChainUuid(processingStep),
    ),
  )
  dispatch(showNotification('processingStepView.deleteComplete'))
  dispatch(hideAppSaving())
}
