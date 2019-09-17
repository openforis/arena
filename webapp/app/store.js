import { applyMiddleware, combineReducers, createStore } from 'redux'

// == app reducer
import app from './reducer'
import login from '../login/reducer'
import survey from '../survey/reducer'

import * as LoginState from '../login/loginState'

import createDebounce from 'redux-debounced'
import thunkMiddleware from 'redux-thunk'
import appErrorsMiddleware from './appErrorsMiddleware'
import ProcessUtils from '../../common/processUtils'

const appReducer = {
  app,
  [LoginState.stateKey]: login,
  survey,
}

const createReducer = asyncReducers => (
  combineReducers({
    ...appReducer,
    ...asyncReducers
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
