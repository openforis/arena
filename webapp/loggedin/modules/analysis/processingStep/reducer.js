import { exportReducer } from '@webapp/utils/reduxUtils'

import * as R from 'ramda'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as ProcessingStepState from '@webapp/loggedin/modules/analysis/processingStep/processingStepState'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import {
  processingStepCalculationCreate,
  processingStepCalculationForEditUpdate,
  processingStepCalculationIndexUpdate,
  processingStepPropsUpdate,
  processingStepUpdate,
  processingStepCalculationEditCancel,
  processingStepReset,
} from '@webapp/loggedin/modules/analysis/processingStep/actions'

import { processingStepCalculationDirtyUpdate } from '@webapp/loggedin/modules/analysis/processingStepCalculation/actions'

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

  [processingStepCalculationDirtyUpdate]: (state, { calculation }) =>
    ProcessingStepState.assocCalculation(calculation)(state),

  [processingStepCalculationEditCancel]: (state, { calculation }) =>
    R.pipe(
      R.ifElse(
        R.always(ProcessingStepCalculation.isTemporary(calculation)),
        ProcessingStepState.dissocTemporaryCalculation,
        ProcessingStepState.assocCalculation(calculation),
      ),
      ProcessingStepState.assocCalculationUuidForEdit(null),
    )(state),
}

export default exportReducer(actionHandlers)
