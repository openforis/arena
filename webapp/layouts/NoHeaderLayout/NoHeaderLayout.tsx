import { noHeaderModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/ModuleSwitch'
import { RecordNoHeader } from '@webapp/components/survey/Record/RecordNoHeader'

const NoHeaderLayout = () => (
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

export default NoHeaderLayout
