import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import InnerModuleSwitch from '../components/innerModuleSwitch'
import DashboardView from './dashboard/dashboardView'
import SurveyListView from './surveyList/surveyListView'
import SurveyCreateView from './surveyCreate/surveyCreateView'
import SurveyInfoView from '../designer/surveyInfo/surveyInfoView'
import CollectImportReportView from './collectImportReport/collectImportReportView'

import Survey from '../../../../common/survey/survey'

import { appModules, appModuleUri, homeModules } from '../../appModules'

import * as SurveyState from '../../../survey/surveyState'

const HomeView = props => {

  const { surveyInfo } = props

  useEffect(() => {
    const { history } = props
    const module = Survey.isValid(surveyInfo) ? homeModules.dashboard : homeModules.surveyList
    history.push(appModuleUri(module))
  }, [Survey.getUuid(surveyInfo)])

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

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(HomeView)