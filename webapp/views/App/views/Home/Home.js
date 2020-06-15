import React from 'react'

import * as User from '@core/user/user'

import ModuleSwitch from '@webapp/components/moduleSwitch'
import SurveyInfoView from '@webapp/loggedin/modules/designer/surveyInfo/surveyInfoView'
import { appModules, appModuleUri, homeModules } from '@webapp/app/appModules'
import { useUser } from '@webapp/store/user'

import Dashboard from './Dashboard'
import CollectImportReport from './CollectImportReport'
import SurveyList from './SurveyList'
import SurveyCreate from './SurveyCreate'

const Home = () => {
  const user = useUser()

  return (
    <ModuleSwitch
      moduleRoot={appModules.home}
      moduleDefault={homeModules.dashboard}
      modules={[
        {
          component: Dashboard,
          path: appModuleUri(homeModules.dashboard),
        },
        {
          component: SurveyList,
          path: appModuleUri(homeModules.surveyList),
        },
        ...(User.isSystemAdmin(user)
          ? [
              {
                component: SurveyCreate,
                path: appModuleUri(homeModules.surveyNew),
              },
            ]
          : []),
        {
          component: SurveyInfoView,
          path: appModuleUri(homeModules.surveyInfo),
        },
        {
          component: CollectImportReport,
          path: appModuleUri(homeModules.collectImportReport),
        },
      ]}
    />
  )
}

export default Home
