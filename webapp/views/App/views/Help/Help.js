import React from 'react'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import { appModules, helpModules } from '@webapp/app/appModules'
import { About } from './About'

const Help = () => (
  <ModuleSwitch
    moduleRoot={appModules.help}
    moduleDefault={helpModules.about}
    modules={[
      // About
      {
        component: About,
        path: helpModules.about.path,
      },
    ]}
  />
)

export default Help
