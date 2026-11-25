import { appModules, systemAdminModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/ModuleSwitch'

import JobsMonitor from '../JobsMonitor'
import AuthProviderEdit from './AuthProviders/AuthProviderEdit'
import AuthProvidersList from './AuthProviders/AuthProvidersList'
import MessageDetails from '../Message/MessageDetails'
import { MessageList } from '../Message/MessageList'
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
      {
        component: MessageList,
        path: systemAdminModules.messages.path,
      },
      {
        component: MessageDetails,
        path: `${systemAdminModules.message.path}/:messageUuid/`,
      },
      {
        component: AuthProvidersList,
        path: systemAdminModules.authProviders.path,
      },
      {
        component: AuthProviderEdit,
        path: `${systemAdminModules.authProvider.path}/:providerId/`,
      },
    ]}
  />
)

export default SystemAdmin
