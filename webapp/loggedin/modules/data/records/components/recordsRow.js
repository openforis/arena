import React from 'react'
import camelize from 'camelize'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import ErrorBadge from '@webapp/commonComponents/errorBadge'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as Authorizer from '@core/auth/authorizer'
import * as DateUtils from '@core/dateUtils'

const RecordsRow = props => {
  const { row: record, nodeDefKeys, surveyInfo, user, idx, offset } = props

  const i18n = useI18n()

  const canEdit =
    Survey.isPublished(surveyInfo) && Authorizer.canEditRecord(user, record)

  return (
    <>
      <div>
        <ErrorBadge
          validation={Validation.getValidation(record)}
          showLabel={false}
          className="error-badge-inverse"
        />
        {idx + offset + 1}
      </div>
      {nodeDefKeys.map((n, i) => (
        <div key={i}>{record[camelize(NodeDef.getName(n))]}</div>
      ))}
      <div>
        {DateUtils.getRelativeDate(i18n, Record.getDateCreated(record))}
      </div>
      <div>
        {DateUtils.getRelativeDate(i18n, Record.getDateModified(record))}
      </div>
      <div>{Record.getOwnerName(record)}</div>
      <div>{Record.getStep(record)}</div>
      <div>
        {R.pipe(Validation.getValidation, Validation.getErrorsCount)(record)}
      </div>
      <div>
        {R.pipe(Validation.getValidation, Validation.getWarningsCount)(record)}
      </div>
      <div>
        <span
          className={`icon icon-12px icon-action ${
            canEdit ? 'icon-pencil2' : 'icon-eye'
          }`}
        />
      </div>
    </>
  )
}

export default RecordsRow
