import { applyMiddleware, combineReducers, createStore } from 'redux'
import createDebounce from 'redux-debounced'
import thunkMiddleware from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly'

import * as ProcessUtils from '@core/processUtils'
import appErrorsMiddleware from '@webapp/app/appErrorsMiddleware'

// == app reducer
import AppReducer from '@webapp/app/reducer'
import AppErrorsReducer from '@webapp/app/appErrors/reducer'
import AppDialogConfirmReducer from '@webapp/app/appDialogConfirm/reducer'
import AppNotificationReducer from '@webapp/app/appNotification/reducer'
import LoginReducer from '@webapp/guest/login/reducer'
import SurveyReducer from '@webapp/survey/reducer'

import * as AppState from '@webapp/app/appState'
import * as AppDialogConfirmState from '@webapp/app/appDialogConfirm/appDialogConfirmState'
import * as AppNotificationState from '@webapp/app/appNotification/appNotificationState'
import * as AppErrorsState from '@webapp/app/appErrors/appErrorsState'
import * as LoginState from '@webapp/guest/login/loginState'
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

// App store
export const store = createStore(
    createReducer({}),
    composeWithDevTools(
      applyMiddleware(...middleware)
    )
)

store.asyncReducers = {}

export const injectReducers = (name, asyncReducer) => {
  store.asyncReducers[name] = asyncReducer
  store.replaceReducer(createReducer(store.asyncReducers))
}
