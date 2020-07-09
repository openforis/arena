import { combineReducers } from 'redux'

import * as TaxonomyState from '@webapp/components/survey/TaxonomyDetails/taxonomyState'
import taxonomyEdit from '@webapp/components/survey/TaxonomyDetails/reducer'

import * as CategoryState from './category/categoryState'
import * as RecordState from './record/recordState'
import * as SurveyFormState from './surveyForm/surveyFormState'

import category from './category/reducer'
import record from './record/reducer'
import surveyForm from './surveyForm/reducer'

export default combineReducers({
  [CategoryState.stateKey]: category,
  [RecordState.stateKey]: record,
  [SurveyFormState.stateKey]: surveyForm,
  [TaxonomyState.stateKey]: taxonomyEdit,
})
