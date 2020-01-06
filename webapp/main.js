import './utils/polyfill/polyfill'
// Import 'core-js/stable'
import 'regenerator-runtime/runtime'

import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import AppRouterSwitch from './app/appRouterSwitch'

import { store } from './app/store'

function renderApp() {
  ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <AppRouterSwitch />
      </BrowserRouter>
    </Provider>,
    document.querySelector('#main'),
  )
}

renderApp()
