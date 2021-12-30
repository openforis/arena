import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'
import * as DateUtils from '@core/dateUtils'
import { useI18n } from '@webapp/store/system'
import { useNodeDefRootKeys } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import ErrorBadge from '@webapp/components/errorBadge'
import { Button, ButtonDelete } from '@webapp/components'
import { RecordActions } from '@webapp/store/ui/record'
import { useAuthCanDeleteRecord, useAuthCanEditRecord } from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'

const valueFormattersByType = {
  [NodeDef.nodeDefType.date]: ({ value }) =>
    DateUtils.convertDate({
      dateStr: value,
      formatFrom: DateUtils.formats.datetimeISO,
      formatTo: DateUtils.formats.dateDefault,
    }),
}

const Row = (props) => {
  const { row: record, rowNo, selected, navigateToRecord, onRecordsUpdate } = props
  const nodeDefKeys = useNodeDefRootKeys()

  const i18n = useI18n()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const canEdit = useAuthCanEditRecord(record)
  const canDelete = useAuthCanDeleteRecord(record)

  const keyValues = nodeDefKeys.map((nodeDef) => {
    const name = NodeDef.getName(nodeDef)
    const value = record[A.camelize(name)]
    const formatter = valueFormattersByType[NodeDef.getType(nodeDef)]
    return value && formatter ? formatter({ value }) : value
  })

  const onEditButtonClick = useCallback(
    (event) => {
      event.stopPropagation()
      event.preventDefault()

      navigateToRecord(record)
    },
    [record, navigateToRecord]
  )

  const onDeleteConfirmed = useCallback(() => {
    dispatch(RecordActions.deleteRecord({ navigate, recordUuid: Record.getUuid(record), goBackOnDelete: false }))
    onRecordsUpdate()
  }, [dispatch, navigate, onRecordsUpdate, record])

  const onDeleteButtonClick = useCallback(
    (event) => {
      event.stopPropagation()
      event.preventDefault()

      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataView.records.confirmDeleteRecord',
          params: { keyValues },
          onOk: onDeleteConfirmed,
        })
      )
    },
    [dispatch, navigate]
  )

  return (
    <>
      <div>
        <span className={`icon icon-12px icon-action icon-checkbox-${selected ? 'checked' : 'unchecked'}`} />
      </div>
      <div>
        <ErrorBadge validation={Validation.getValidation(record)} showLabel={false} className="error-badge-inverse" />
        {rowNo}
      </div>
      {nodeDefKeys.map((nodeDef, index) => {
        const name = NodeDef.getName(nodeDef)
        const uuid = NodeDef.getUuid(nodeDef)
        const value = keyValues[index]
        return (
          <div key={uuid} data-testid={TestId.records.cellNodeDef(name)} data-value={value}>
            {value}
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
        <Button
          iconClassName={`icon-12px icon-action ${canEdit ? 'icon-pencil2' : 'icon-eye'}`}
          title={`dataView.records.${canEdit ? 'editRecord' : 'viewRecord'}`}
          onClick={onEditButtonClick}
        />
        {canDelete && (
          <ButtonDelete title="dataView.records.deleteRecord" showLabel={false} onClick={onDeleteButtonClick} />
        )}
      </div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
  rowNo: PropTypes.number.isRequired,
}

export default Row
