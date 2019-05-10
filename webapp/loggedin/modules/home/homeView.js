import './homeView.scss'

import React from 'react'
import { connect } from 'react-redux'

import AppContext from '../../../app/appContext'

import NavigationTabBar from '../components/moduleNavigationTabBar'
import DashboardView from './dashboard/dashboardView'
import SurveyListView from './surveyList/surveyListView'
import SurveyCreateView from './surveyCreate/surveyCreateView'
import SurveyInfoView from './surveyInfo/surveyInfoView'
import CollectImportReportView from './collectImportReport/collectImportReportView'

import Survey from '../../../../common/survey/survey'

import { appModules, appModuleUri } from '../../appModules'
import { homeModules } from './homeModules'

import * as SurveyState from '../../../survey/surveyState'

class HomeView extends React.Component {

  componentDidUpdate (prevProps) {
    const { surveyInfo, history } = this.props
    const { surveyInfo: prevSurveyInfo } = prevProps

    // active survey change
    if (
      surveyInfo && (
        // new survey created
        !prevSurveyInfo
        // changed from survey list
        || surveyInfo.id !== prevSurveyInfo.id
      )
    ) {
      history.push(appModuleUri(homeModules.dashboard))
    }

    // survey deleted
    if (Survey.isValid(prevSurveyInfo) && !Survey.isValid(surveyInfo)) {
      history.push(appModuleUri(homeModules.surveyList))
    }
  }

  render () {
    const { surveyInfo } = this.props
    const { i18n } = this.context

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
}

HomeView.contextType = AppContext

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(HomeView)