import React from 'react'

import InnerModuleSwitch from '../components/innerModuleSwitch'
import SurveyInfoView from '../designer/surveyInfo/surveyInfoView'
import { appModules, appModuleUri, homeModules } from '@webapp/app/appModules'
import DashboardView from './dashboard/dashboardView'
import SurveyListView from './surveyList/surveyListView'
import SurveyCreateView from './surveyCreate/surveyCreateView'
import CollectImportReportView from './collectImportReport/collectImportReportView'

const HomeView = () => {
  return (
    <InnerModuleSwitch
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
