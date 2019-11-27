import {applyMiddleware, combineReducers, createStore} from 'redux'

// == app reducer
import createDebounce from 'redux-debounced'
import thunkMiddleware from 'redux-thunk'
import * as ProcessUtils from '@core/processUtils'
import loginReducer from '../login/reducer'
import surveyReducer from '../survey/reducer'
import * as LoginState from '../login/loginState'
import * as SurveyState from '../survey/surveyState'
import appReducer from './reducer'
import notificationReducer from './appNotification/reducer'
import errorsReducer from './appErrors/reducer'

import * as NotificationState from './appNotification/appNotificationState'
import * as ErrorsState from './appErrors/appErrorsState'

import appErrorsMiddleware from './appErrorsMiddleware'

const appReducers = {
  app: appReducer,
  [LoginState.stateKey]: loginReducer,
  [SurveyState.stateKey]: surveyReducer,
  [NotificationState.stateKey]: notificationReducer,
  [ErrorsState.stateKey]: errorsReducer,
}

const createReducer = asyncReducers => (
  combineReducers({
    ...appReducers,
    ...asyncReducers,
  })
)

const middlewares = [createDebounce(), thunkMiddleware, appErrorsMiddleware]

if (ProcessUtils.isEnvDevelopment) {
  const {logger} = require('redux-logger')

  middlewares.push(logger)
}

export const store = createStore(
  createReducer({}),
  applyMiddleware(...middlewares)
)

store.asyncReducers = {}

export const injectReducers = (name, asyncReducer) => {
  store.asyncReducers[name] = asyncReducer
  store.replaceReducer(createReducer(store.asyncReducers))
}
