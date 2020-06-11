import homeReducer from '@webapp/loggedin/modules/home/reducer'
import analysisReducer from '@webapp/loggedin/modules/analysis/reducer'
import dataReducer from '@webapp/loggedin/modules/data/reducer'
import surveyViewsReducer from '@webapp/loggedin/surveyViews/reducer'
import userViewReducer from '@webapp/loggedin/modules/users/user/reducer'
import userInviteViewReducer from '@webapp/loggedin/modules/users/userInvite/reducer'

import * as HomeState from '@webapp/loggedin/modules/home/homeState'
import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'
import * as DataState from '@webapp/loggedin/modules/data/state'
import * as SurveyViewsState from '@webapp/loggedin/surveyViews/surveyViewsState'
import * as UserViewState from '@webapp/loggedin/modules/users/user/userViewState'
import * as UserInviteViewState from '@webapp/loggedin/modules/users/userInvite/userInviteViewState'

import { AppReducer, AppState } from '@webapp/store/app'

import component from './index'

const reducers = [
  { name: AppState.stateKey, fn: AppReducer },
  { name: HomeState.stateKey, fn: homeReducer },
  { name: AnalysisState.stateKey, fn: analysisReducer },
  { name: DataState.stateKey, fn: dataReducer },
  { name: SurveyViewsState.stateKey, fn: surveyViewsReducer },
  { name: UserViewState.stateKey, fn: userViewReducer },
  { name: UserInviteViewState.stateKey, fn: userInviteViewReducer },
]

export { component, reducers }
