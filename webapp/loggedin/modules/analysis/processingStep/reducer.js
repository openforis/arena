import { exportReducer } from '@webapp/utils/reduxUtils'

import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  processingStepPropsUpdate,
  processingStepUpdate,
  processingStepReset,
  processingStepCalculationCreate,
  processingStepCalculationForEditUpdate,
  processingStepCalculationIndexUpdate,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

import {
  processingStepCalculationSave,
  processingStepCalculationReset,
} from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

const actionHandlers = {
  // Reset state
  [appUserLogout]: () => ({}),
  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [processingStepUpdate]: (state, { processingStep, processingStepPrev, processingStepNext }) =>
    ProcessingStepState.assocProcessingStep(processingStep, processingStepPrev, processingStepNext)(state),

  [processingStepReset]: () => ({}),

  [processingStepPropsUpdate]: (state, { props }) => ProcessingStepState.mergeProcessingStepProps(props)(state),

  [processingStepCalculationCreate]: (state, { calculation }) =>
    ProcessingStepState.assocCalculation(calculation)(state),

  [processingStepCalculationForEditUpdate]: (state, { calculation }) =>
    ProcessingStepState.assocCalculationUuidForEdit(ProcessingStepCalculation.getUuid(calculation))(state),

  [processingStepCalculationIndexUpdate]: (state, { indexFrom, indexTo }) =>
    ProcessingStepState.updateCalculationIndex(indexFrom, indexTo)(state),

  [processingStepCalculationSave]: (state, { calculation }) => ProcessingStepState.assocCalculation(calculation)(state),

  [processingStepCalculationReset]: (state, { temporary }) =>
    R.pipe(
      // Remove calculation from list if temporary
      R.when(R.always(temporary), ProcessingStepState.dissocTemporaryCalculation),
      // Close editor
      ProcessingStepState.assocCalculationUuidForEdit(null),
    )(state),
}

export default exportReducer(actionHandlers)
