import ModuleSwitch from '@webapp/components/moduleSwitch'
import { appModules, helpModules } from '@webapp/app/appModules'
import { About } from './About'
import { Changelog } from './Changelog'

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
      // Changelog
      {
        component: Changelog,
        path: helpModules.changelog.path,
      },
    ]}
  />
)

export default Help
