import './surveysList.scss'

import React from 'react'
import * as R from 'ramda'

import { elementOffset } from '../../appUtils/domUtils'

import {
  getSurveyName,
  getSurveyDefaultLabel,
  getSurveyStatus,
} from '../../../common/survey/survey'

const SurveyListHeader = () => (
  <div className="surveys-list__header">
    <h4 className="header-label">Surveys</h4>
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
  const active = survey.id === currentSurvey.id
  const activeClass = active ? ' active' : ''

  return (
    <div className={`surveys-list__row${activeClass}`}>
      <div>{getSurveyName(survey)}</div>
      <div>{getSurveyDefaultLabel(survey)}</div>
      <div>{survey.dateCreated}</div>
      <div>{survey.dateModified}</div>
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

const getElementHeight = cssClass =>
  elementOffset(document.getElementsByClassName(cssClass)[0]).height

const SurveyList = (props) => {
  const {surveys} = props

  const rowsHeight = getElementHeight('surveys-list') - getElementHeight('surveys-list__header')

  return (
    <div className="surveys-list">
      <SurveyListHeader {...props}/>

      {
        Number.isNaN(rowsHeight) || R.isEmpty(surveys)
          ? null
          : (
            <div className="surveys-list__rows" style={{maxHeight: rowsHeight + 'px'}}>
              {
                surveys.map(survey =>
                  <SurveyRow key={survey.id} {...props} survey={survey}/>
                )
              }
            </div>
          )
      }
    </div>
  )
}

export default SurveyList