import { combineReducers } from 'redux'

import * as RecordState from './record/recordState'
import * as SurveyFormState from './surveyForm/surveyFormState'

import record from './record/reducer'
import surveyForm from './surveyForm/reducer'

export default combineReducers({
  [RecordState.stateKey]: record,
  [SurveyFormState.stateKey]: surveyForm,
})
