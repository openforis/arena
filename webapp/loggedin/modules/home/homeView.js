import React from 'react'

import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import SurveyInfoView from '@webapp/loggedin/modules/designer/surveyInfo/surveyInfoView'
import DashboardView from './dashboard/dashboardView'
import SurveyListView from './surveyList/surveyListView'
import SurveyCreateView from './surveyCreate/surveyCreateView'
import CollectImportReportView from './collectImportReport/collectImportReportView'

import { appModules, appModuleUri, homeModules } from '@webapp/app/appModules'

const HomeView = () => {
  return (
    <ModuleSwitch
      moduleRoot={appModules.home}
      moduleDefault={homeModules.dashboard}
      modules={[
        {
          component: DashboardView,
          path: appModuleUri(homeModules.dashboard),
        },
        {
          component: SurveyListView,
          path: appModuleUri(homeModules.surveyList),
        },
        {
          component: SurveyCreateView,
          path: appModuleUri(homeModules.surveyNew),
        },
        {
          component: SurveyInfoView,
          path: appModuleUri(homeModules.surveyInfo),
        },
        {
          component: CollectImportReportView,
          path: appModuleUri(homeModules.collectImportReport),
        },
      ]}
    />
  )
}

export default HomeView
