import './style.scss'

import React from 'react'
import { Link, Route } from 'react-router-dom'

class SurveyDashboardView extends React.Component {

  render () {
    return <div className="survey-dashboard__grid">
      <div className="" style={{
        // gridColumn: '2/4'
      }}></div>

      <div className="survey-dashboard__sections-container">

        <div className="survey-dashboard__module-container">
          <div className="survey-dashboard__module">
            <div className="flex-center">
              <span className="icon icon-quill icon-24px icon-left"></span><h5>Survey Designer</h5></div>
          </div>
        </div>
        <div className="survey-dashboard__module-container">
          <div className="survey-dashboard__module">2</div>
        </div>
        <div className="survey-dashboard__module-container">
          <div className="survey-dashboard__module">3</div>
        </div>
        <div className="survey-dashboard__module-container">
          <div className="survey-dashboard__module">4<Route path={'/app/a'} render={()=><div>aaaa</div>}/></div>
        </div>
      </div>

      <div className="" style={{
        // gridColumn: '2/4',
        // gridRow: '3'
      }}></div>

    </div>
  }

}

export default SurveyDashboardView