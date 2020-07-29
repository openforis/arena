import { combineReducers } from 'redux'

import { RecordReducer, RecordState } from '@webapp/store/ui/record'
import { SurveyFormReducer, SurveyFormState } from '@webapp/store/ui/surveyForm'

export default combineReducers({
  [RecordState.stateKey]: RecordReducer,
  [SurveyFormState.stateKey]: SurveyFormReducer,
})
