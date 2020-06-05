import { applyMiddleware, combineReducers, createStore, compose } from 'redux'
import createDebounce from 'redux-debounced'
import thunkMiddleware from 'redux-thunk'

import appErrorsMiddleware from '@webapp/app/appErrorsMiddleware'

// == app reducer
import AppReducer from '@webapp/app/reducer'
import AppErrorsReducer from '@webapp/app/appErrors/reducer'
import AppDialogConfirmReducer from '@webapp/app/appDialogConfirm/reducer'
import AppNotificationReducer from '@webapp/app/appNotification/reducer'
import { LoginReducer, LoginState } from '@webapp/store/login'
import SurveyReducer from '@webapp/survey/reducer'

import * as AppState from '@webapp/app/appState'
import * as AppDialogConfirmState from '@webapp/app/appDialogConfirm/appDialogConfirmState'
import * as AppNotificationState from '@webapp/app/appNotification/appNotificationState'
import * as AppErrorsState from '@webapp/app/appErrors/appErrorsState'
import * as SurveyState from '@webapp/survey/surveyState'

const appReducers = {
  [AppState.stateKey]: AppReducer,
  [LoginState.stateKey]: LoginReducer,
  [SurveyState.stateKey]: SurveyReducer,
  [AppDialogConfirmState.stateKey]: AppDialogConfirmReducer,
  [AppNotificationState.stateKey]: AppNotificationReducer,
  [AppErrorsState.stateKey]: AppErrorsReducer,
}

const createReducer = (asyncReducers) =>
  combineReducers({
    ...appReducers,
    ...asyncReducers,
  })

// App middleware
const middleware = [createDebounce(), thunkMiddleware, appErrorsMiddleware]

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose

// App store
export const store = createStore(createReducer({}), composeEnhancers(applyMiddleware(...middleware)))

store.asyncReducers = {}

export const injectReducers = (name, asyncReducer) => {
  store.asyncReducers[name] = asyncReducer
  store.replaceReducer(createReducer(store.asyncReducers))
}
