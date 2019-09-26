import React from 'react'

import Survey from '../../../../../../common/survey/survey'
import DateUtils from '../../../../../../common/dateUtils'

import { useI18n } from '../../../../../commonComponents/hooks'

const SurveyListRow = props => {
  const i18n = useI18n()

  const { row: surveyRow } = props
  const surveyInfoRow = Survey.getSurveyInfo(surveyRow)

  // const surveyId = surveyInfoRow.id
  // const active = surveyInfo && surveyId === surveyInfo.id
  // const activeClass = active ? ' active' : ''
  // const btnLabelKey = active ? 'active' : 'activate'
  // const canEdit = Authorizer.canEditSurvey(user, surveyInfo)

  return (
    <>
      <div>{Survey.getName(surveyInfoRow)}</div>
      <div>{Survey.getDefaultLabel(surveyInfoRow)}</div>
      <div>{DateUtils.getRelativeDate(i18n, surveyInfoRow.dateCreated)}</div>
      <div>{DateUtils.getRelativeDate(i18n, surveyInfoRow.dateModified)}</div>
      <div>{Survey.getStatus(surveyInfoRow)}</div>
      <div>
        {/*<button className={`btn btn-s${activeClass}`}*/}
        {/*        onClick={() => setActiveSurvey(surveyId, canEdit)}>*/}
        {/*  {i18n.t(`homeView.surveyList.${btnLabelKey}`)}*/}
        {/*</button>*/}
      </div>
    </>
  )
}

export default SurveyListRow