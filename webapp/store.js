import { applyMiddleware, combineReducers, createStore } from 'redux'

// == app reducer
import app from './app/reducer'
import login from './login/reducer'
import survey from './survey/reducer'

import createDebounce from 'redux-debounced'
import thunkMiddleware from 'redux-thunk'
import appErrorsMiddleware from './app/components/errors/appErrorsMiddleware'
import { isEnvDevelopment } from '../common/processUtils'

const appReducer = {
  app,
  login,
  survey,
}

const createReducer = asyncReducers => (
  combineReducers({
    ...appReducer,
    ...asyncReducers
  })
)

const middlewares = [createDebounce(), thunkMiddleware, appErrorsMiddleware]

if (isEnvDevelopment()) {
  const {logger} = require('redux-logger')

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
