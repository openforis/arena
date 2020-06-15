import homeReducer from '@webapp/loggedin/modules/home/reducer'
import analysisReducer from '@webapp/loggedin/modules/analysis/reducer'
import dataReducer from '@webapp/loggedin/modules/data/reducer'
import surveyViewsReducer from '@webapp/loggedin/surveyViews/reducer'

import * as HomeState from '@webapp/loggedin/modules/home/homeState'
import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'
import * as DataState from '@webapp/loggedin/modules/data/state'
import * as SurveyViewsState from '@webapp/loggedin/surveyViews/surveyViewsState'

import { AppReducer, AppState } from '@webapp/store/app'

import component from './index'

const reducers = [
  { name: AppState.stateKey, fn: AppReducer },
  { name: HomeState.stateKey, fn: homeReducer },
  { name: AnalysisState.stateKey, fn: analysisReducer },
  { name: DataState.stateKey, fn: dataReducer },
  { name: SurveyViewsState.stateKey, fn: surveyViewsReducer },
]

export { component, reducers }
