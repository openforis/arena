import React from 'react'

import InnerModuleSwitch from '@webapp/loggedin/modules/components/innerModuleSwitch'
import ResetForgotPasswordView from '@webapp/guest/resetForgotPassword/resetForgotPasswordView'

import { guest } from '@webapp/app/appModules'

const modulePathFull = modulePath => `/${guest}/${modulePath}/`

const GuestView = () => (
  <InnerModuleSwitch
    modules={[
      {
        key: 'resetForgotPassword',
        path: modulePathFull('resetForgotPassword/:uuid'),
        component: ResetForgotPasswordView,
      },
    ]}
  />
)

export default GuestView
