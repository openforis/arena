import './appHomeView.scss'

import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import AddSurveyForm from './components/addSurveyForm'
import SurveysList from './components/surveysList'

import { appModuleUri } from '../appModules'
import { getNewSurvey, getSurveys } from './appHomeState'
import { appModules } from '../appModules'

import Survey from '../../../common/survey/survey'
import { getSurvey } from '../../survey/surveyState'

import { fetchSurveys } from './actions'
import { createSurvey, updateNewSurveyProp, importCollectSurvey } from './actions'
import { setActiveSurvey } from '../../survey/actions'

class AppHomeView extends React.Component {

  componentDidMount () {
    this.props.fetchSurveys()
  }

  componentDidUpdate (prevProps) {

    const { surveyInfo: prevSurveyInfo } = prevProps
    const { surveyInfo, history } = this.props

    if (surveyInfo && (!prevSurveyInfo || surveyInfo.id !== prevSurveyInfo.id)) {
      history.push(appModuleUri(appModules.dashboard))
    }
  }

  render () {
    const {
      newSurvey,
      updateNewSurveyProp,
      createSurvey,
      importCollectSurvey,
      setActiveSurvey,

      surveys,
      surveyInfo,
    } = this.props

    return (
      <div className="app-home">

        <AddSurveyForm newSurvey={newSurvey}
                       updateNewSurveyProp={updateNewSurveyProp}
                       createSurvey={createSurvey}
                       importCollectSurvey={importCollectSurvey}/>

        <SurveysList surveys={surveys}
                     surveyInfo={surveyInfo}
                     setActiveSurvey={setActiveSurvey}/>

      </div>
    )
  }
}

const mapStateToProps = state => ({
  newSurvey: getNewSurvey(state),
  surveyInfo: Survey.getSurveyInfo(getSurvey(state)),
  surveys: getSurveys(state)
})

export default withRouter(connect(
  mapStateToProps,
  {
    createSurvey,
    updateNewSurveyProp,
    importCollectSurvey,


    fetchSurveys,
    setActiveSurvey,
  }
)(AppHomeView))