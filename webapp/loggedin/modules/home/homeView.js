import './homeView.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../commonComponents/useI18n'

import NavigationTabBar from '../components/moduleNavigationTabBar'
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
  const i18n = useI18n()

  useEffect(() => {
    const { history } = props
    const module = Survey.isValid(surveyInfo) ? homeModules.dashboard : homeModules.surveyList
    history.push(appModuleUri(module))
  }, [Survey.getUuid(surveyInfo)])

  return (
    <NavigationTabBar
      className="data"
      moduleRoot={appModules.home}
      moduleDefault={homeModules.dashboard}
      tabs={[
        {
          label: i18n.t('homeView.dashboard'),
          component: DashboardView,
          path: appModuleUri(homeModules.dashboard),
          icon: 'icon-office',
          disabled: !Survey.isValid(surveyInfo),
        },
        {
          label: i18n.t('homeView.mySurveys'),
          component: SurveyListView,
          path: appModuleUri(homeModules.surveyList),
          icon: 'icon-paragraph-justify',
        },
        {
          component: SurveyCreateView,
          path: appModuleUri(homeModules.surveyNew),
          icon: 'icon-plus',
          showTab: false,
        },
        {
          component: SurveyInfoView,
          path: appModuleUri(homeModules.surveyInfo),
          showTab: false,
        },
        {
          component: CollectImportReportView,
          path: appModuleUri(homeModules.collectImportReport),
          showTab: false,
        },
      ]}
    />
  )
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(HomeView)