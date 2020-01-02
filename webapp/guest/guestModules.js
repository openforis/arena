import * as R from 'ramda'

import ResetForgotPasswordView from './resetForgotPassword/resetForgotPasswordView'

const pathPrefix = '/guest/'

const modulePathFull = modulePath => `${pathPrefix}${modulePath}/`

// ==== Guest modules
export const guestModules = [
  {
    key: 'resetForgotPassword',
    path: modulePathFull('resetForgotPassword/:uuid'),
    component: ResetForgotPasswordView,
  },
]

export const isGuestUri = R.startsWith(pathPrefix)
