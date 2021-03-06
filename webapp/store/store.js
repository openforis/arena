import { applyMiddleware, combineReducers, createStore, compose } from 'redux'
import createDebounce from 'redux-debounced'
import thunkMiddleware from 'redux-thunk'

import appErrorsMiddleware from '@webapp/app/appErrorsMiddleware'

// == app reducer

import { SystemState, SystemReducer } from '@webapp/store/system'
import { LoginReducer, LoginState } from '@webapp/store/login'
import { SurveyReducer, SurveyState } from '@webapp/store/survey'
import { UiReducer, UiState } from '@webapp/store/ui'
import { UserReducer, UserState } from '@webapp/store/user'

const appReducers = {
  [SystemState.stateKey]: SystemReducer,
  [LoginState.stateKey]: LoginReducer,
  [UserState.stateKey]: UserReducer,
  [SurveyState.stateKey]: SurveyReducer,
  [UiState.stateKey]: UiReducer,
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
