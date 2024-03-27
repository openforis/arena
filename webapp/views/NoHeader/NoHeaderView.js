import React from 'react'

import { noHeaderModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'

const RecordNoHeader = React.lazy(() => import('../../components/survey/Record/RecordNoHeader'))

const NoHeaderView = () => {
  return (
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
}

export default NoHeaderView
