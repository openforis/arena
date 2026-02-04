import React from 'react'

import { appModules, userModules, userTwoFactorDeviceModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import { UserTwoFactorDeviceDetails } from './Details'
import { UserTwoFactorDeviceList } from './List'

const UserTwoFactorDeviceModule = () => {
  return (
    <ModuleSwitch
      moduleRoot={appModules.users}
      moduleDefault={userTwoFactorDeviceModules.userTwoFactorDeviceList}
      modules={[
        {
          component: UserTwoFactorDeviceList,
          path: userTwoFactorDeviceModules.userTwoFactorDeviceList.path,
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
