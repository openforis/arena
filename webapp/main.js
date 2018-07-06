import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import createDebounce from 'redux-debounced'

import reducer from './app/rootReducer'

const store = createStore(
  reducer,
  applyMiddleware(createDebounce(), thunkMiddleware)
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