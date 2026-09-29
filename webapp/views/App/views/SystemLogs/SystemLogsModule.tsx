import { appModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'

import SystemLogs from './SystemLogs'

const SystemLogsModule = () => (
  <ModuleSwitch
    moduleRoot={appModules.systemLogs}
    moduleDefault={appModules.systemLogs}
    modules={[
      {
        component: SystemLogs,
        path: '',
      },
    ]}
  />
)

export default SystemLogsModule
