import './utils/polyfill/polyfill'
import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'

import { store } from '@webapp/store'
import Arena from '@webapp/views/Arena'

import i18n from '@core/i18n/i18nFactory'

function renderApp() {
  ReactDOM.render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <Arena />
        </BrowserRouter>
      </I18nextProvider>
    </Provider>,
    document.querySelector('#main')
  )
}

renderApp()
