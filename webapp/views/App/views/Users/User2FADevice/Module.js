import React from 'react'

import { userModules, user2FADeviceModules } from '@webapp/app/appModules'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import { User2FADeviceDetails } from './Details'
import { User2FADeviceList } from './List'

const User2FADeviceModule = () => (
  <ModuleSwitch
    moduleRoot={userModules.user2FADevices}
    moduleDefault={user2FADeviceModules.user2FADeviceList}
    modules={[
      {
        component: User2FADeviceList,
        path: user2FADeviceModules.user2FADeviceList.path,
      },
      {
        component: User2FADeviceDetails,
        path: `${user2FADeviceModules.user2FADevice.path}/:uuid?`,
      },
    ]}
  />
)

export default User2FADeviceModule
