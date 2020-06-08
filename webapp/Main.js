import './utils/polyfill/polyfill'
import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'

import { store } from '@webapp/app/store'
import Arena from '@webapp/views/Arena'

function renderApp() {
  ReactDOM.render(
    <Provider store={store}>
      <BrowserRouter>
        <Arena />
      </BrowserRouter>
    </Provider>,
    document.querySelector('#main')
  )
}

renderApp()
