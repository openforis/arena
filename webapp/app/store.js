import { applyMiddleware, combineReducers, createStore } from 'redux'

// == app reducer
import appReducer from './reducer'
import loginReducer from '../login/reducer'
import surveyReducer from '../survey/reducer'
import notificationReducer from './appNotification/reducer'
import errorsReducer from './appErrors/reducer'

import * as LoginState from '../login/loginState'
import * as SurveyState from '../survey/surveyState'
import * as NotificationState from './appNotification/appNotificationState'
import * as ErrorsState from './appErrors/appErrorsState'

import createDebounce from 'redux-debounced'
import thunkMiddleware from 'redux-thunk'
import appErrorsMiddleware from './appErrorsMiddleware'
import ProcessUtils from '../../core/processUtils'

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

if (ProcessUtils.envDevelopment) {
  const { logger } = require('redux-logger')

  middlewares.push(logger)
}

const store = createStore(
  createReducer({}),
  applyMiddleware(...middlewares)
)

store.asyncReducers = {}

export const injectReducers = (name, asyncReducer) => {
  store.asyncReducers[name] = asyncReducer
  store.replaceReducer(createReducer(store.asyncReducers))
}

export default store
