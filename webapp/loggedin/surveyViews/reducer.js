import { combineReducers } from 'redux'

import { RecordReducer, RecordState } from '../../store/ui/record'
import * as SurveyFormState from './surveyForm/surveyFormState'

import surveyForm from './surveyForm/reducer'

export default combineReducers({
  [RecordState.stateKey]: RecordReducer,
  [SurveyFormState.stateKey]: surveyForm,
})
