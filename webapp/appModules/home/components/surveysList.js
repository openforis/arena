import './surveysList.scss'

import React from 'react'
import * as R from 'ramda'

import Survey from '../../../../common/survey/survey'
import { getRelativeDate, compareDatesDesc } from '../../../appUtils/dateUtils'

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

const SurveyRow = ({surveyInfoRow, surveyInfo, setActiveSurvey}) => {
  const surveyId = surveyInfoRow.id
  const active = surveyInfo && surveyId === surveyInfo.id
  const activeClass = active ? ' active' : ''

  return (
    <div className={`surveys-list__row${activeClass}`}>
      <div>{Survey.getName(surveyInfoRow)}</div>
      <div>{Survey.getDefaultLabel(surveyInfoRow)}</div>
      <div>{getRelativeDate(surveyInfoRow.dateCreated)}</div>
      <div>{getRelativeDate(surveyInfoRow.dateModified)}</div>
      <div>{Survey.getStatus(surveyInfoRow)}</div>
      <div>
        <button className={`btn btn-s btn-of${activeClass}`}
                onClick={() => setActiveSurvey(surveyId)}>
          {active ? 'active' : 'activate'}
        </button>
      </div>
    </div>
  )
}

const SurveyList = (props) => {
  const {surveys} = props
  const surveyInfos = surveys.map(Survey.getSurveyInfo)

  return (
    <div className="surveys-list">
      <SurveyListHeader {...props}/>

      {
        R.isEmpty(surveys)
          ? null
          : (
            <div className="surveys-list__rows">
              {
                surveyInfos
                  .sort((a, b) => compareDatesDesc(a.dateModified, b.dateModified))
                  .map((surveyInfo, i) =>
                    <SurveyRow key={i} {...props} surveyInfoRow={surveyInfo}/>
                  )
              }
            </div>
          )
      }
    </div>
  )
}

export default SurveyList