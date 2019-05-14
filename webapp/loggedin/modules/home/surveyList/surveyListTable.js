import React, { useContext } from 'react'
import { Link } from 'react-router-dom'

import AppContext from '../../../../app/appContext'

import Survey from '../../../../../common/survey/survey'
import { getRelativeDate, compareDatesDesc } from '../../../../../common/dateUtils'

import { appModuleUri } from '../../../appModules'
import { homeModules } from '../homeModules'

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
  const { i18n } = useContext(AppContext)

  const surveyInfos = surveys.map(Survey.getSurveyInfo)

  return (
    <div className="survey-list table">
      <div className="table__header">
        <h5>
          Surveys
          <Link
            to={appModuleUri(homeModules.surveyNew)} className="btn btn-xs btn-of-light">
            <span className="icon icon-plus icon-12px icon-left" /> {i18n.t('homeView.surveyListView.addNewSurvey')}
          </Link>
        </h5>
      </div>

      <div className="table__row-header">
        <div>{i18n.t('common.name')}</div>
        <div>{i18n.t('homeView.surveyListView.label')}</div>
        <div>{i18n.t('homeView.surveyListView.dateCreated')}</div>
        <div>{i18n.t('homeView.surveyListView.dateLastModified')}</div>
        <div>{i18n.t('homeView.surveyListView.status')}</div>
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