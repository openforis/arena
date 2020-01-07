import React from 'react'

import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import ResetPasswordView from '@webapp/guest/resetPassword/resetPasswordView'

import { guest } from '@webapp/app/appModules'

const modulePathFull = modulePath => `/${guest}/${modulePath}/`

const GuestView = () => (
  <ModuleSwitch
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
