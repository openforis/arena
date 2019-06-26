import './style/main.scss'

import React from 'react'
import ReactDOM from 'react-dom'

import { BrowserRouter } from 'react-router-dom'

import { Provider } from 'react-redux'

import store from './app/store'

import AppRouterSwitch from './app/appRouterSwitch'

import * as AxiosJwtMiddleware from './app/axiosJwtMiddleware'




import Amplify from 'aws-amplify'

Amplify.configure({
  Auth: {
    region: 'eu-west-1',
    userPoolId: __COGNITO_USER_POOL_ID__,
    userPoolWebClientId: __COGNITO_CLIENT_ID__,

    // OPTIONAL - Configuration for cookie storage
    // Note: if the secure flag is set to true, then the cookie transmission requires a secure protocol
    // cookieStorage: {
    //   // REQUIRED - Cookie domain (only required if cookieStorage is provided)
    //   domain: '.yourdomain.com',
    //   // OPTIONAL - Cookie path
    //   path: '/',
    //   // OPTIONAL - Cookie expiration in days
    //   expires: 365,
    //   // OPTIONAL - Cookie secure flag
    //   // Either true or false, indicating if the cookie transmission requires a secure protocol (https).
    //   secure: true
    // },

    // OPTIONAL - Manually set the authentication flow type. Default is 'USER_SRP_AUTH'
    // authenticationFlowType: 'USER_PASSWORD_AUTH'
  }
})






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