import surveyViewsReducer from '@webapp/loggedin/surveyViews/reducer'

import * as SurveyViewsState from '@webapp/loggedin/surveyViews/surveyViewsState'

import { AppReducer, AppState } from '@webapp/store/app'

import component from './index'

const reducers = [
  { name: AppState.stateKey, fn: AppReducer },
  { name: SurveyViewsState.stateKey, fn: surveyViewsReducer },
]

export { component, reducers }
