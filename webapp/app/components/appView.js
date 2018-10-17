import '../style.scss'

import React from 'react'
import { connect } from 'react-redux'

import AppSideBar from './sideBar/appSideBar'
import AppModulesView from '../../appModules/components/appModulesView'
import JobMonitorDialog from '../../survey/components/jobDialog'

import { getSurvey } from '../../survey/surveyState'
import { getSurveyActiveJob } from '../../survey/job/surveyJobState'

class AppView extends React.Component {
  render () {
    const {surveyActiveJob} = this.props

    return (
      <div className="app__container">

        <AppSideBar {...this.props} />

        {surveyActiveJob
          ? <JobMonitorDialog/>
          : <AppModulesView {...this.props} />
        }
      </div>
    )
  }
}

const mapStateToProps = state => {
  const survey = getSurvey(state)

  return {
    survey,
    surveyActiveJob: getSurveyActiveJob(survey),
  }
}

export default connect(mapStateToProps)(AppView)