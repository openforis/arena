import homeReducer from '@webapp/loggedin/modules/home/reducer'
import analysisReducer from '@webapp/loggedin/modules/analysis/reducer'
import dataReducer from '@webapp/loggedin/modules/data/reducer'
import surveyViewsReducer from '@webapp/loggedin/surveyViews/reducer'
import tableViewsReducer from '@webapp/loggedin/tableViews/reducer'
import jobReducer from '@webapp/loggedin/appJob/reducer'
import sidebarReducer from '@webapp/loggedin/appSideBar/reducer'
import userViewReducer from '@webapp/loggedin/modules/users/user/reducer'
import userInviteViewReducer from '@webapp/loggedin/modules/users/userInvite/reducer'

import * as HomeState from '@webapp/loggedin/modules/home/homeState'
import * as AnalysisState from '@webapp/loggedin/modules/analysis/analysisState'
import * as DataState from '@webapp/loggedin/modules/data/dataState'
import * as SurveyViewsState from '@webapp/loggedin/surveyViews/surveyViewsState'
import * as TableViewsState from '@webapp/loggedin/tableViews/tableViewsState'
import * as JobState from '@webapp/loggedin/appJob/appJobState'
import * as SideBarState from '@webapp/loggedin/appSideBar/appSidebarState'
import * as UserViewState from '@webapp/loggedin/modules/users/user/userViewState'
import * as UserInviteViewState from '@webapp/loggedin/modules/users/userInvite/userInviteViewState'
import component from './appView'

const reducers = [
  { name: HomeState.stateKey, fn: homeReducer },
  { name: AnalysisState.stateKey, fn: analysisReducer },
  { name: DataState.stateKey, fn: dataReducer },
  { name: SurveyViewsState.stateKey, fn: surveyViewsReducer },
  { name: TableViewsState.stateKey, fn: tableViewsReducer },
  { name: JobState.stateKey, fn: jobReducer },
  { name: SideBarState.stateKey, fn: sidebarReducer },
  { name: UserViewState.stateKey, fn: userViewReducer },
  { name: UserInviteViewState.stateKey, fn: userInviteViewReducer },
]

export { component, reducers }
