import { appModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'

import JobsMonitor from './JobsMonitor'

const JobsMonitorModule = () => (
  <ModuleSwitch
    moduleRoot={appModules.jobs}
    moduleDefault={appModules.jobs}
    modules={[
      {
        component: JobsMonitor,
        path: '',
      },
    ]}
  />
)

export default JobsMonitorModule
