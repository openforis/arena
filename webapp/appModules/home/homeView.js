import './homeView.scss'

import React from 'react'
import { connect } from 'react-redux'

import NavigationTabBar from '../components/natigationTabBar'
import DashboardView from './dashboard/dashboardView'
import SurveyListView from './surveyList/surveyListView'
import SurveyCreateView from './surveyCreate/surveyCreateView'
import SurveyInfoView from './surveyInfo/surveyInfoView'

import Survey from '../../../common/survey/survey'

import { appModules, appModuleUri } from '../appModules'
import { homeModules } from './homeModules'

import * as SurveyState from '../../survey/surveyState'

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
    const { surveyInfo, location, history } = this.props

    return (

      <NavigationTabBar
        className="data"
        moduleRoot={appModules.home}
        moduleDefault={homeModules.dashboard}
        tabs={[
          {
            label: 'Dashboard',
            component: DashboardView,
            path: appModuleUri(homeModules.dashboard),
            icon: 'icon-office',
            disabled: !Survey.isValid(surveyInfo),
          },
          {
            label: 'My Surveys',
            component: SurveyListView,
            path: appModuleUri(homeModules.surveyList),
            icon: 'icon-paragraph-justify',
          },
          {
            label: 'Add new survey',
            component: SurveyCreateView,
            path: appModuleUri(homeModules.surveyNew),
            icon: 'icon-plus',
            showTab: false,
          },
          {
            label: 'Survey Info',
            component: SurveyInfoView,
            path: appModuleUri(homeModules.surveyInfo),
            showTab: false,
          },
        ]}
      />
    )
  }
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getStateSurveyInfo(state)
})

export default connect(mapStateToProps)(HomeView)