import React from 'react'

import { appModules, userModules, userTwoFactorDeviceModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import { UserTwoFactorDeviceDetails } from './Details'
import { UserTwoFactorDeviceList } from './List'

const UserTwoFactorDeviceModule = () => {
  return (
    <ModuleSwitch
      moduleRoot={appModules.users}
      moduleDefault={userModules.userTwoFactorDevices}
      modules={[
        {
          component: UserTwoFactorDeviceList,
          path: userModules.userTwoFactorDevices.path,
        },
        {
          component: UserTwoFactorDeviceDetails,
          path: `${userTwoFactorDeviceModules.userTwoFactorDevice.path}/:uuid?`,
        },
      ]}
    />
  )
}

export default UserTwoFactorDeviceModule
