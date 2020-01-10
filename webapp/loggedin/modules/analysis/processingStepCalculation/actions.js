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

export const processingStepCalculationDirtyUpdate = 'analysis/processingStep/calculation/dirty/update'

const _validate = async calculation => {
  const validation = await ProcessingStepCalculationValidator.validate(calculation)
  return ProcessingStepCalculation.assocValidation(validation)(calculation)
}

const _onCalculationUpdated = calculation => async dispatch =>
  dispatch({
    type: processingStepCalculationDirtyUpdate,
    calculation: await _validate(calculation),
  })

export const setProcessingStepCalculationProp = (prop, value) => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculationDirty(getState())

  const calculationUpdated = ProcessingStepCalculation.assocProp(prop, value)(calculation)

  dispatch(_onCalculationUpdated(calculationUpdated))
}

export const setProcessingStepCalculationAttribute = attrDefUuid => async (dispatch, getState) => {
  const calculation = ProcessingStepCalculationState.getCalculationDirty(getState())

  const calculationUpdated = ProcessingStepCalculation.assocNodeDefUuid(attrDefUuid)(calculation)

  dispatch(_onCalculationUpdated(calculationUpdated))
}

export const saveProcessingStepCalculationEdits = () => async (dispatch, getState) => {
  dispatch(showAppLoader())
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const processingStep = ProcessingStepState.getProcessingStep(state)
  const calculation = await _validate(ProcessingStepCalculationState.getCalculationDirty(state))

  if (Validation.isObjValid(calculation)) {
    dispatch({
      type: processingStepCalculationForEditUpdate,
      calculation: ProcessingStepCalculation.dissocTemporary(calculation),
    })

    const updateFn = ProcessingStepCalculation.isTemporary(calculation) ? axios.post : axios.put
    await updateFn(
      `/api/survey/${surveyId}/processing-step/${ProcessingStep.getUuid(processingStep)}/calculation`,
      calculation,
    )
    dispatch(showNotification('common.saved', {}, null, 3000))
  } else {
    await dispatch({ type: processingStepCalculationDirtyUpdate, calculation })
    dispatch(showNotification('common.formContainsErrorsCannotSave', {}, NotificationState.severity.error))
  }

  dispatch(hideAppLoader())
}

export const cancelProcessingStepCalculationEdits = () => async (dispatch, getState) => {
  // Restore original calculation and close editor
  dispatch({
    type: processingStepCalculationEditCancel,
    calculation: ProcessingStepCalculationState.getCalculationOrig(getState()),
  })
}
