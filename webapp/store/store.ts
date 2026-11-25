import { configureStore } from '@reduxjs/toolkit'
import { combineReducers, type Reducer } from 'redux'

import { aiSuggestionsMiddleware } from '@webapp/ai/suggestions/aiSuggestionsMiddleware'
import appErrorsMiddleware from '@webapp/app/appErrorsMiddleware'
// == app reducer
import { DataExplorerReducer, DataExplorerState } from '@webapp/store/dataExplorer'
import { LoginReducer, LoginState } from '@webapp/store/login'
import { SurveyReducer, SurveyState } from '@webapp/store/survey'
import { SystemReducer, SystemState } from '@webapp/store/system'
import { UiReducer, UiState } from '@webapp/store/ui'
import { UserReducer, UserState } from '@webapp/store/user'

const appReducers = {
  [DataExplorerState.stateKey]: DataExplorerReducer,
  [SystemState.stateKey]: SystemReducer,
  [LoginState.stateKey]: LoginReducer,
  [UserState.stateKey]: UserReducer,
  [SurveyState.stateKey]: SurveyReducer,
  [UiState.stateKey]: UiReducer,
}

type ReducersByKey = { [stateKey: string]: Reducer }

// reducers injected after the store creation (see injectReducers)
const asyncReducers: ReducersByKey = {}

const createReducer = () =>
  combineReducers({
    ...appReducers,
    ...asyncReducers,
  })

// App store
export const store = configureStore({
  reducer: createReducer(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }).concat([appErrorsMiddleware, aiSuggestionsMiddleware]),
})

export type AppDispatch = typeof store.dispatch

export const injectReducers = (name: string, asyncReducer: Reducer): void => {
  asyncReducers[name] = asyncReducer
  store.replaceReducer(createReducer())
}
