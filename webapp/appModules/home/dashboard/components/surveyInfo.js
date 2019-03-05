import './surveyInfo.scss'

import React from 'react'

import ErrorBadge from '../../../../commonComponents/errorBadge'

import Survey from '../../../../../common/survey/survey'
import Validator from '../../../../../common/validation/validator'

const SurveyInfo = ({ surveyInfo }) => (
  <div className="home-dashboard__survey-info">

    <ErrorBadge validation={Validator.getValidation(surveyInfo)}/>

    <div className="survey-status">
      {
        Survey.isDraft(surveyInfo) &&
        <span className="icon icon-warning icon-12px icon-left"/>
      }

      {Survey.getStatus(surveyInfo)}
    </div>

    <h4 className="survey-name">
      {Survey.getName(surveyInfo)}
    </h4>

  </div>
)

export default SurveyInfo