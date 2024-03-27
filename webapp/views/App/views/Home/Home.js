import React from 'react'

import { appModules, homeModules } from '@webapp/app/appModules'
import ModuleSwitch from '@webapp/components/moduleSwitch'
import { useAuthCanCreateSurvey, useAuthCanCreateTemplate } from '@webapp/store/user/hooks'

import CollectImportReport from './CollectImportReport'
import Dashboard from './Dashboard'
import SurveyCreate from './SurveyCreate'
import SurveyInfo from './SurveyInfo'
import SurveyList from './SurveyList'
import TemplateCreate from './TemplateCreate'
import TemplateList from './TemplateList'

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
          path: homeModules.dashboard.path,
        },
        {
          component: SurveyList,
          path: homeModules.surveyList.path,
        },
        {
          component: TemplateList,
          path: homeModules.templateList.path,
        },
        ...(canCreateSurvey
          ? [
              {
                component: SurveyCreate,
                path: homeModules.surveyNew.path,
              },
            ]
          : []),
        ...(canCreateTemplate
          ? [
              {
                component: TemplateCreate,
                path: homeModules.templateNew.path,
              },
            ]
          : []),
        {
          component: SurveyInfo,
          path: homeModules.surveyInfo.path,
        },
        {
          component: CollectImportReport,
          path: homeModules.collectImportReport.path,
        },
      ]}
    />
  )
}

export default Home
