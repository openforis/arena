import './style.scss'

import React from 'react'
import SurveySummaryView from '../survey/surveySummaryView'

const AppView = (props) =>
  <div className="app__container">

    <SurveySummaryView {...props} />

  </div>

export default AppView