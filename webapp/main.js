import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import store from './app/store'

import AppRouterSwitch from './app/appRouterSwitch'

import * as AxiosJwtMiddleware from './app/axiosJwtMiddleware'

function renderApp () {

  AxiosJwtMiddleware.init()

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