import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import createDebounce from 'redux-debounced'

import appErrorsMiddleware from './app/components/errors/appErrorsMiddleware'
import reducer from './rootReducer'

import { isEnvDevelopment } from '../common/processUtils'

const middlewares = [createDebounce(), thunkMiddleware, appErrorsMiddleware]

if (isEnvDevelopment()) {
  const {logger} = require('redux-logger')

  middlewares.push(logger)
}

const store = createStore(
  reducer,
  applyMiddleware(...middlewares)
)

import AppRouterSwitch from './appRouterSwitch'

function renderApp () {

  ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <AppRouterSwitch/>
      </BrowserRouter>
    </Provider>
    ,
    document.getElementById('main')
  )

}

renderApp()