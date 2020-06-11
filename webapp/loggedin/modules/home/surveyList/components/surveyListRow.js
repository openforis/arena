import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'

const SurveyListRow = (props) => {
  const { row, active } = props
  const surveyInfoRow = Survey.getSurveyInfo(row)

  const i18n = useI18n()

  return (
    <>
      <span className={`icon icon-14px icon-action icon-radio-${active ? 'checked2' : 'unchecked'}`} />
      <div>{Survey.getName(surveyInfoRow)}</div>
      <div>{Survey.getOwnerName(surveyInfoRow)}</div>
      <div>{Survey.getDefaultLabel(surveyInfoRow)}</div>
      <div>{DateUtils.getRelativeDate(i18n, Survey.getDateCreated(surveyInfoRow))}</div>
      <div>{DateUtils.getRelativeDate(i18n, Survey.getDateModified(surveyInfoRow))}</div>
      <div>{Survey.getStatus(surveyInfoRow)}</div>
    </>
  )
}

SurveyListRow.propTypes = {
  active: PropTypes.bool.isRequired,
  row: PropTypes.object.isRequired,
}

export default SurveyListRow
