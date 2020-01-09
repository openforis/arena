import axios from 'axios'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ProcessingStepCalculationValidator from '@common/analysis/processingStepCalculationValidator'
import * as Validation from '@core/validation/validation'

import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as ProcessingStepCalculationState from './processingStepCalculationState'
import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import {
  processingStepCalculationEditCancel,
  processingStepCalculationForEditUpdate,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'
import { showAppLoader, hideAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

export const processingStepCalculationUpdate = 'analysis/processingStep/calculation/update'

const _validate = async calculation => await ProcessingStepCalculationValidator.validate(calculation)

const _onCalculationUpdated = calculation => async dispatch => {
  const validation = await _validate(calculation)

  dispatch({
    type: processingStepCalculationUpdate,
    calculation,
    validation,
  })
}

export const setProcessingStepCalculationProp = (prop, value) => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())

  const calculationUpdated = ProcessingStepCalculation.assocProp(prop, value)(calculation)

  dispatch(_onCalculationUpdated(calculationUpdated))
}

export const setProcessingStepCalculationAttribute = attrDefUuid => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculation(getState())

  const calculationUpdated = ProcessingStepCalculation.assocNodeDefUuid(attrDefUuid)(calculation)

  dispatch(_onCalculationUpdated(calculationUpdated))
}

export const saveProcessingStepCalculationEdits = () => async (dispatch, getState) => {
  dispatch(showAppLoader())
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculationParam = ProcessingStepCalculationState.getCalculation(state)
  const validation = ProcessingStepCalculationState.getValidation(state) || (await _validate(calculationParam))

  if (Validation.isValid(validation)) {
    const updateFn = ProcessingStepCalculation.isTemporary(calculationParam) ? axios.post : axios.put
    const { data: calculation } = await updateFn(
      `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(processingStep)}/calculation`,
      ProcessingStepCalculation.dissocTemporary(calculationParam),
    )
    await dispatch({
      type: processingStepCalculationForEditUpdate,
      calculation,
    })
    dispatch(showNotification('common.saved', {}, null, 3000))
  } else {
    await dispatch({
      type: processingStepCalculationUpdate,
      calculation: calculationParam,
      validation,
    })
    dispatch(showNotification('common.formContainsErrorsCannotSave', {}, NotificationState.severity.error))
  }

  dispatch(hideAppLoader())
}

export const cancelProcessingStepCalculationEdits = () => async (dispatch, getState) => {
  // Restore original calculation
  await dispatch({
    type: processingStepCalculationUpdate,
    calculation: ProcessingStepCalculationState.getCalculationOriginal(getState()),
  })

  // Close editor
  dispatch({
    type: processingStepCalculationEditCancel,
  })
}
