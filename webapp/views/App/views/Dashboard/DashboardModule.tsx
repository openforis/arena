import React from 'react'

import { appModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'

import Dashboard from './Dashboard'

const DashboardModule = () => (
  <ModuleSwitch
    moduleRoot={appModules.dashboard}
    moduleDefault={appModules.dashboard}
    modules={[
      {
        component: Dashboard,
        path: '',
      },
    ]}
  />
)

export default DashboardModule
