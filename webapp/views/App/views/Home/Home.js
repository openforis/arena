import React from 'react'

import ModuleSwitch from '@webapp/components/moduleSwitch'

import { appModules, homeModules } from '@webapp/app/appModules'
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
