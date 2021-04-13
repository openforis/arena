import React from 'react'

import * as User from '@core/user/user'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import { appModules, appModuleUri, homeModules } from '@webapp/app/appModules'
import { useUser } from '@webapp/store/user'

import Dashboard from './Dashboard'
import CollectImportReport from './CollectImportReport'
import SurveyList from './SurveyList'
import SurveyCreate from './SurveyCreate'
import SurveyInfo from './SurveyInfo'
import SurveyTemplateList from './SurveyTemplateList'

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
        {
          component: SurveyTemplateList,
          path: appModuleUri(homeModules.surveyListTemplates),
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
          component: SurveyInfo,
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
