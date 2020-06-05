import React from 'react'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import ResetPasswordView from '@webapp/views/Guest/views/ResetPassword/ResetPassword'
import ForgotPassword from '@webapp/views/Guest/views/ForgotPassword/ForgotPassword'

import { guestModules } from '@webapp/app/appModules'

const Guest = () => (
  <ModuleSwitch
    modules={[
      {
        path: guestModules.resetPassword.path,
        component: ResetPasswordView,
      },
      {
        path: guestModules.forgotPassword.path,
        component: ForgotPassword,
      },
    ]}
  />
)

export default Guest
