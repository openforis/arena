import React from 'react'

import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'

import {useI18n} from '@webapp/commonComponents/hooks'

const SurveyListRow = props => {
  const {row: surveyRow, isRowActive} = props
  const surveyInfoRow = Survey.getSurveyInfo(surveyRow)

  const i18n = useI18n()

  return (
    <>
      <span
        className={`icon icon-14px icon-action icon-radio-${
          isRowActive(surveyRow) ? 'checked2' : 'unchecked'
        }`}
      />
      <div>{Survey.getName(surveyInfoRow)}</div>
      <div>{Survey.getDefaultLabel(surveyInfoRow)}</div>
      <div>
        {DateUtils.getRelativeDate(i18n, Survey.getDateCreated(surveyInfoRow))}
      </div>
      <div>
        {DateUtils.getRelativeDate(i18n, Survey.getDateModified(surveyInfoRow))}
      </div>
      <div>{Survey.getStatus(surveyInfoRow)}</div>
    </>
  )
}

export default SurveyListRow
