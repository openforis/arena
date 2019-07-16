import './style/main.scss'

import './utils/polyfill/polyfill'

import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import AppRouterSwitch from './app/appRouterSwitch'

import * as CognitoAuth from './app/cognitoAuth'
import * as AxiosJwtMiddleware from './app/axiosJwtMiddleware'

import store from './app/store'

function renderApp () {

  CognitoAuth.init()
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