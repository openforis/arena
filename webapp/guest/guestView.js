import React from 'react'

import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import ResetPasswordView from '@webapp/guest/resetPassword/resetPasswordView'
import ForgotPasswordView from '@webapp/guest/forgotPassword/forgotPasswordView'

import { guestModules } from '@webapp/app/appModules'

const GuestView = () => (
  <ModuleSwitch
    modules={[
      {
        path: guestModules.resetPassword.path,
        component: ResetPasswordView,
      },
      {
        path: guestModules.forgotPassword.path,
        component: ForgotPasswordView,
      },
    ]}
  />
)

export default GuestView
