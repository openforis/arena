import { appModules, systemAdminModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'

import JobsMonitor from '../JobsMonitor'
import SystemLogs from '../SystemLogs'

const SystemAdmin = () => (
  <ModuleSwitch
    moduleRoot={appModules.systemAdmin}
    moduleDefault={systemAdminModules.jobMonitor}
    modules={[
      {
        component: JobsMonitor,
        path: systemAdminModules.jobMonitor.path,
      },
      {
        component: SystemLogs,
        path: systemAdminModules.systemLogs.path,
      },
    ]}
  />
)

export default SystemAdmin
