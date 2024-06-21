import React from 'react'

import { noHeaderModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import { RecordNoHeader } from '@webapp/components/survey/Record/RecordNoHeader'

const NoHeaderView = () => (
  <ModuleSwitch
    moduleDefault={noHeaderModules.record}
    modules={[
      {
        component: RecordNoHeader,
        path: `${noHeaderModules.record.path}/:recordUuid`,
      },
    ]}
  />
)

export default NoHeaderView
