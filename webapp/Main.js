import './style/main.scss'

import React from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'

import i18n from '@core/i18n/i18nFactory'

import { store } from '@webapp/store'
import Arena from '@webapp/views/Arena'

import './utils/polyfill/polyfill'

// remove preloader
document.getElementById('preloader-wrapper').remove()

// render React app
const container = document.getElementById('main')
const root = createRoot(container)
root.render(
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Arena />
        </LocalizationProvider>
      </BrowserRouter>
    </I18nextProvider>
  </Provider>
)
