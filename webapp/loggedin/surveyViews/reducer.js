import {combineReducers} from 'redux'

import * as CategoryEditState from './categoryEdit/categoryEditState'
import * as NodeDefEditState from './nodeDefEdit/nodeDefEditState'
import * as RecordState from './record/recordState'
import * as SurveyFormState from './surveyForm/surveyFormState'
import * as TaxonomyEditState from './taxonomyEdit/taxonomyEditState'

import categoryEdit from './categoryEdit/reducer'
import nodeDefEdit from './nodeDefEdit/reducer'
import record from './record/reducer'
import surveyForm from './surveyForm/reducer'
import taxonomyEdit from './taxonomyEdit/reducer'

export default combineReducers({
  [CategoryEditState.stateKey]: categoryEdit,
  [NodeDefEditState.stateKey]: nodeDefEdit,
  [RecordState.stateKey]: record,
  [SurveyFormState.stateKey]: surveyForm,
  [TaxonomyEditState.stateKey]: taxonomyEdit,
})
