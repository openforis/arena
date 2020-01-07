import { applyMiddleware, combineReducers, createStore } from 'redux'
import createDebounce from 'redux-debounced'
import thunkMiddleware from 'redux-thunk'

import * as ProcessUtils from '@core/processUtils'
import appErrorsMiddleware from '@webapp/app/appErrorsMiddleware'

// == app reducer
import appReducer from '@webapp/app/reducer'
import loginReducer from '@webapp/guest/login/reducer'
import surveyReducer from '@webapp/survey/reducer'
import notificationReducer from '@webapp/app/appNotification/reducer'
import errorsReducer from '@webapp/app/appErrors/reducer'

import * as LoginState from '@webapp/guest/login/loginState'
import * as SurveyState from '@webapp/survey/surveyState'
import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as ErrorsState from '@webapp/app/appErrors/appErrorsState'

const appReducers = {
  app: appReducer,
  [LoginState.stateKey]: loginReducer,
  [SurveyState.stateKey]: surveyReducer,
  [NotificationState.stateKey]: notificationReducer,
  [ErrorsState.stateKey]: errorsReducer,
}

const createReducer = asyncReducers =>
  combineReducers({
    ...appReducers,
    ...asyncReducers,
  })

// App middleware
const middleware = [createDebounce(), thunkMiddleware, appErrorsMiddleware]

if (ProcessUtils.isEnvDevelopment) {
  const { logger } = require('redux-logger')
  middleware.push(logger)
}

// App store
export const store = createStore(createReducer({}), applyMiddleware(...middleware))

store.asyncReducers = {}

export const injectReducers = (name, asyncReducer) => {
  store.asyncReducers[name] = asyncReducer
  store.replaceReducer(createReducer(store.asyncReducers))
}
