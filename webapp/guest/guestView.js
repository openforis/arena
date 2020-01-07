import React from 'react'

import InnerModuleSwitch from '@webapp/loggedin/modules/components/innerModuleSwitch'
import ResetPasswordView from '@webapp/guest/resetPassword/resetPasswordView'

import { guest } from '@webapp/app/appModules'

const modulePathFull = modulePath => `/${guest}/${modulePath}/`

const GuestView = () => (
  <InnerModuleSwitch
    modules={[
      {
        key: 'resetPassword',
        path: modulePathFull('resetPassword/:uuid'),
        component: ResetPasswordView,
      },
    ]}
  />
)

export default GuestView
