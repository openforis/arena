import './style.scss'

import React from 'react'

import SurveyInfo from './components/surveyInfo'
import SurveyModules from './components/surveyModulesComponent'

class SurveyDashboardView extends React.Component {

  render () {
    return <div className="survey-dashboard__grid">

      <div className="survey-dashboard__survey-info-container">
        <SurveyInfo/>
      </div>

      <div className="survey-dashboard__modules-container">
        <SurveyModules/>
      </div>

      <div className="" style={{
        // gridColumn: '2/4',
        // gridRow: '3'
      }}></div>

    </div>
  }

}

export default SurveyDashboardView