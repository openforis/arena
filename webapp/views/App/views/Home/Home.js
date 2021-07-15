import React from 'react'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import { appModules, appModuleUri, homeModules } from '@webapp/app/appModules'
import { useAuthCanCreateSurvey, useAuthCanCreateTemplate } from '@webapp/store/user/hooks'

import Dashboard from './Dashboard'
import CollectImportReport from './CollectImportReport'
import SurveyList from './SurveyList'
import SurveyCreate from './SurveyCreate'
import SurveyInfo from './SurveyInfo'
import TemplateList from './TemplateList'
import TemplateCreate from './TemplateCreate'

const Home = () => {
  const canCreateSurvey = useAuthCanCreateSurvey()
  const canCreateTemplate = useAuthCanCreateTemplate()

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
          component: TemplateList,
          path: appModuleUri(homeModules.templateList),
        },
        ...(canCreateSurvey
          ? [
              {
                component: SurveyCreate,
                path: appModuleUri(homeModules.surveyNew),
              },
            ]
          : []),
        ...(canCreateTemplate
          ? [
              {
                component: TemplateCreate,
                path: appModuleUri(homeModules.templateNew),
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
