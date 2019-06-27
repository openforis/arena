import React from 'react'

import useI18n from '../../../../commonComponents/useI18n'

import Survey from '../../../../../common/survey/survey'
import { getRelativeDate, compareDatesDesc } from '../../../../../common/dateUtils'

const SurveyRow = ({ surveyInfoRow, surveyInfo, setActiveSurvey }) => {
  const surveyId = surveyInfoRow.id
  const active = surveyInfo && surveyId === surveyInfo.id
  const activeClass = active ? ' active' : ''

  return (
    <div className={`table__row${activeClass}`}>
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

const SurveyListTable = (props) => {
  const { surveys } = props
  const i18n = useI18n()

  const surveyInfos = surveys.map(Survey.getSurveyInfo)

  return (
    <div className="survey-list table">
      <div className="table__header">
        <h5>
          Surveys
        </h5>
      </div>

      <div className="table__row-header">
        <div>{i18n.t('common.name')}</div>
        <div>{i18n.t('common.label')}</div>
        <div>{i18n.t('common.dateCreated')}</div>
        <div>{i18n.t('common.dateLastModified')}</div>
        <div>{i18n.t('homeView.surveyListTable.status')}</div>
      </div>


      <div className="table__rows">

        {
          surveyInfos
            .sort((a, b) => compareDatesDesc(a.dateModified, b.dateModified))
            .map((surveyInfo, i) =>
              <SurveyRow key={i} {...props} surveyInfoRow={surveyInfo}/>
            )
        }
      </div>
    </div>
  )
}

export default SurveyListTable