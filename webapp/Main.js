import './utils/polyfill/polyfill'
import 'regenerator-runtime/runtime'

import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import Routes from './Routes'

import { store } from './app/store'

function renderApp() {
  ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <Routes />
      </BrowserRouter>
    </Provider>,
    document.querySelector('#main'),
  )
}

renderApp()
