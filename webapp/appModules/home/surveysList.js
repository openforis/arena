import './surveysList.scss'

import React from 'react'
import * as R from 'ramda'

import { getRelativeDate, compareDatesDesc } from '../../appUtils/dateUtils'

import {
  getSurveyName,
  getSurveyDefaultLabel,
  getSurveyStatus,
} from '../../../common/survey/survey'

const SurveyListHeader = () => (
  <div className="surveys-list__header">
    <h5 className="header-label">Surveys</h5>
    <div className="surveys-list__row-header">
      <div>Name</div>
      <div>Label</div>
      <div>Date created</div>
      <div>Date last modified</div>
      <div>Status</div>
    </div>
  </div>
)

const SurveyRow = ({survey, currentSurvey, setActiveSurvey}) => {
  const active = currentSurvey && survey.id === currentSurvey.id
  const activeClass = active ? ' active' : ''

  return (
    <div className={`surveys-list__row${activeClass}`}>
      <div>{getSurveyName(survey)}</div>
      <div>{getSurveyDefaultLabel(survey)}</div>
      <div>{getRelativeDate(survey.dateCreated)}</div>
      <div>{getRelativeDate(survey.dateModified)}</div>
      <div>{getSurveyStatus(survey)}</div>
      <div>
        <button className={`btn btn-s btn-of${activeClass}`}
                onClick={() => setActiveSurvey(survey.id)}>
          {active ? 'active' : 'activate'}
        </button>
      </div>
    </div>
  )
}

const SurveyList = (props) => {
  const {surveys} = props

  return (
    <div className="surveys-list">
      <SurveyListHeader {...props}/>

      {
        R.isEmpty(surveys)
          ? null
          : (
            <div className="surveys-list__rows">
              {
                surveys
                  .sort((a, b) => compareDatesDesc(a.dateModified, b.dateModified))
                  .map((survey, i) =>
                    <SurveyRow key={i} {...props} survey={survey}/>
                  )
              }
            </div>
          )
      }
    </div>
  )
}

export default SurveyList