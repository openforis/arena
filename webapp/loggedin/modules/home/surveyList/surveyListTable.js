import React from 'react'

import Header from '../../../../commonComponents/header'
import useI18n from '../../../../commonComponents/useI18n'

import Authorizer from '../../../../../common/auth/authorizer'
import Survey from '../../../../../common/survey/survey'
import DateUtils from '../../../../../common/dateUtils'

const SurveyRow = ({ user, surveyInfoRow, surveyInfo, setActiveSurvey, i18n }) => {
  const surveyId = surveyInfoRow.id
  const active = surveyInfo && surveyId === surveyInfo.id
  const activeClass = active ? ' active' : ''
  const btnLabelKey = active ? 'active' : 'activate'
  const canEdit = Authorizer.canEditSurvey(user, surveyInfo)

  return (
    <div className={`table__row${activeClass}`}>
      <div>{Survey.getName(surveyInfoRow)}</div>
      <div>{Survey.getDefaultLabel(surveyInfoRow)}</div>
      <div>{DateUtils.getRelativeDate(i18n, surveyInfoRow.dateCreated)}</div>
      <div>{DateUtils.getRelativeDate(i18n, surveyInfoRow.dateModified)}</div>
      <div>{Survey.getStatus(surveyInfoRow)}</div>
      <div>
        <button className={`btn btn-s${activeClass}`}
                onClick={() => setActiveSurvey(surveyId, canEdit)}>
          {i18n.t(`homeView.surveyList.${btnLabelKey}`)}
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
        <Header>
          <h6>
            {i18n.t('appModules.surveyList')}
          </h6>
        </Header>
      </div>

      <div className="table__content">
        <div className="table__row-header">
          <div>{i18n.t('common.name')}</div>
          <div>{i18n.t('common.label')}</div>
          <div>{i18n.t('common.dateCreated')}</div>
          <div>{i18n.t('common.dateLastModified')}</div>
          <div>{i18n.t('homeView.surveyList.status')}</div>
        </div>


        <div className="table__rows">
          {
            surveyInfos
              .map((surveyInfo, i) => (
                <SurveyRow
                  key={i}
                  {...props}
                  surveyInfoRow={surveyInfo}
                  i18n={i18n}/>
              ))
          }
        </div>
      </div>

    </div>
  )
}

export default SurveyListTable