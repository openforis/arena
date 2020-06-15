import React from 'react'
import PropTypes from 'prop-types'
import camelize from 'camelize'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'

import ErrorBadge from '@webapp/components/errorBadge'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as Authorizer from '@core/auth/authorizer'
import * as DateUtils from '@core/dateUtils'
import { useSurveyInfo } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

const RecordsRow = (props) => {
  const { row: record, rowNo } = props
  const nodeDefKeys = [] // TODO

  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const user = useUser()
  const canEdit = Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user, record)

  return (
    <>
      <div>
        <ErrorBadge validation={Validation.getValidation(record)} showLabel={false} className="error-badge-inverse" />
        {rowNo}
      </div>
      {nodeDefKeys.map((nodeDef) => (
        <div key={NodeDef.getUuid(nodeDef)}>{record[camelize(NodeDef.getName(nodeDef))]}</div>
      ))}
      <div>{DateUtils.getRelativeDate(i18n, Record.getDateCreated(record))}</div>
      <div>{DateUtils.getRelativeDate(i18n, Record.getDateModified(record))}</div>
      <div>{Record.getOwnerName(record)}</div>
      <div>{Record.getStep(record)}</div>
      <div>{R.pipe(Validation.getValidation, Validation.getErrorsCount)(record)}</div>
      <div>{R.pipe(Validation.getValidation, Validation.getWarningsCount)(record)}</div>
      <div>
        <span className={`icon icon-12px icon-action ${canEdit ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

RecordsRow.propTypes = {
  row: PropTypes.object.isRequired,
  rowNo: PropTypes.number.isRequired,
}

export default RecordsRow
