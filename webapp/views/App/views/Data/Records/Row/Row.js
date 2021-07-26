import React from 'react'
import PropTypes from 'prop-types'
import camelize from 'camelize'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as Authorizer from '@core/auth/authorizer'
import * as DateUtils from '@core/dateUtils'
import { useI18n } from '@webapp/store/system'
import { useSurveyInfo, useNodeDefRootKeys } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'
import { DataTestId } from '@webapp/utils/dataTestId'

import ErrorBadge from '@webapp/components/errorBadge'

const valueFormattersByType = {
  [NodeDef.nodeDefType.date]: ({ value }) =>
    DateUtils.convertDate({
      dateStr: value,
      formatFrom: DateUtils.formats.datetimeISO,
      formatTo: DateUtils.formats.dateDefault,
    }),
}

const Row = (props) => {
  const { row: record, rowNo } = props
  const nodeDefKeys = useNodeDefRootKeys()

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
      {nodeDefKeys.map((nodeDef) => {
        const name = NodeDef.getName(nodeDef)
        const uuid = NodeDef.getUuid(nodeDef)
        const value = record[camelize(name)]
        const formatter = valueFormattersByType[NodeDef.getType(nodeDef)]
        const valueFormatted = value && formatter ? formatter({ value }) : value
        return (
          <div key={uuid} data-testid={DataTestId.records.cellNodeDef(name)} data-value={value}>
            {valueFormatted}
          </div>
        )
      })}
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

Row.propTypes = {
  row: PropTypes.object.isRequired,
  rowNo: PropTypes.number.isRequired,
}

export default Row
