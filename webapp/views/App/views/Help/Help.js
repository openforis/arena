import * as User from '@core/user/user'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import { appModules, helpModules } from '@webapp/app/appModules'
import { useUser } from '@webapp/store/user'
import { About } from './About'
import { Changelog } from './Changelog'
import { WhatsNew } from './WhatsNew'

const Help = () => {
  const user = useUser()

  return (
    <ModuleSwitch
      moduleRoot={appModules.help}
      moduleDefault={helpModules.about}
      modules={[
        // About
        {
          component: About,
          path: helpModules.about.path,
        },
        // What's new
        {
          component: WhatsNew,
          path: helpModules.whatsNew.path,
        },
        // Changelog (system admins only)
        ...(User.isSystemAdmin(user)
          ? [
              {
                component: Changelog,
                path: helpModules.changelog.path,
              },
            ]
          : []),
      ]}
    />
  )
}

export default Help
