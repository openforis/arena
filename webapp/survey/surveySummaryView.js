import './style.scss'

import React from 'react'
import { Link, Route } from 'react-router-dom'

class SurveySummaryView extends React.Component {

  render () {
    return <div className="survey-summary__grid">
      <div className="" style={{
        gridColumn: '2/4'
      }}></div>

      <div className="survey-summary__sections-container">

        <div className="survey-summary__section-container p-b-05 p-r-05">
          <div className="survey-summary__section">1</div>
        </div>
        <div className="survey-summary__section-container p-b-05 p-l-05">
          <div className="survey-summary__section">2</div>
        </div>
        <div className="survey-summary__section-container p-t-05 p-r-05">
          <div className="survey-summary__section">3</div>
        </div>
        <div className="survey-summary__section-container p-t-05 p-l-05">
          <div className="survey-summary__section">4<Route path={'/app/a'} render={()=><div>aaaa</div>}/></div>
        </div>
      </div>

      <div className="" style={{
        gridColumn: '2/4',
        gridRow: '3'
      }}></div>

    </div>
  }

}

export default SurveySummaryView