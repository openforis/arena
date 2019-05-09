import './homeView.scss'

import React from 'react'
import { connect } from 'react-redux'

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

import { I18nContext } from '../../../i18n/i18nContext'

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
            label: i18n('dashboard'),
            component: DashboardView,
            path: appModuleUri(homeModules.dashboard),
            icon: 'icon-office',
            disabled: !Survey.isValid(surveyInfo),
          },
          {
            label: i18n('my_surveys'),
            component: SurveyListView,
            path: appModuleUri(homeModules.surveyList),
            icon: 'icon-paragraph-justify',
          },
          {
            // label: i18n('add_new_survey'),
            component: SurveyCreateView,
            path: appModuleUri(homeModules.surveyNew),
            icon: 'icon-plus',
            showTab: false,
          },
          {
            // label: i18n('survey_info'),
            component: SurveyInfoView,
            path: appModuleUri(homeModules.surveyInfo),
            showTab: false,
          },
          {
            // label: i18n('collect_import_job'),
            component: CollectImportReportView,
            path: appModuleUri(homeModules.collectImportReport),
            showTab: false,
          },
        ]}
      />
    )
  }
}

HomeView.contextType = I18nContext

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(HomeView)