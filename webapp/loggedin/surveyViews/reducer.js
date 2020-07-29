import { combineReducers } from 'redux'

import { RecordReducer, RecordState } from '@webapp/store/ui/record'
import { SurveyFormReducer } from '@webapp/store/ui/surveyForm'
import * as SurveyFormState from './surveyForm/surveyFormState'

export default combineReducers({
  [RecordState.stateKey]: RecordReducer,
  [SurveyFormState.stateKey]: SurveyFormReducer,
})
