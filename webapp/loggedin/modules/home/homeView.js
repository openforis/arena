import React from 'react'
import { useSelector } from 'react-redux'

import * as User from '@core/user/user'

import ModuleSwitch from '@webapp/commonComponents/moduleSwitch'
import SurveyInfoView from '@webapp/loggedin/modules/designer/surveyInfo/surveyInfoView'
import DashboardView from './dashboard/dashboardView'
import SurveyListView from './surveyList/surveyListView'
import SurveyCreateView from './surveyCreate/surveyCreateView'
import CollectImportReportView from './collectImportReport/collectImportReportView'

import { appModules, appModuleUri, homeModules } from '@webapp/app/appModules'
import * as AppState from '@webapp/app/appState'

const HomeView = () => {
  const user = useSelector(AppState.getUser)

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
          ...(User.isSystemAdmin(user)
            ? [
                {
                  component: SurveyCreateView,
                  path: appModuleUri(homeModules.surveyNew),
                },
              ]
            : []),
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
