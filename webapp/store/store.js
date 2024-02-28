import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'

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

// App store
export const store = configureStore({
  reducer: createReducer(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat([appErrorsMiddleware]),
})

store.asyncReducers = {}

export const injectReducers = (name, asyncReducer) => {
  store.asyncReducers[name] = asyncReducer
  store.replaceReducer(createReducer(store.asyncReducers))
}
