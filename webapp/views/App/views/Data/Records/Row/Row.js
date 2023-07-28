import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as A from '@core/arena'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Validation from '@core/validation/validation'
import * as DateUtils from '@core/dateUtils'
import { useNodeDefRootKeys, useSurveyPreferredLang } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import ErrorBadge from '@webapp/components/errorBadge'
import { Button, ButtonDelete } from '@webapp/components'
import { RecordActions } from '@webapp/store/ui/record'
import { useAuthCanDeleteRecord, useAuthCanEditRecord } from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'

const valueFormattersByType = {
  [NodeDef.nodeDefType.code]: ({ cycle, nodeDef, value: code, categoryItemsByCodeDefUuid, lang }) => {
    const item = categoryItemsByCodeDefUuid[NodeDef.getUuid(nodeDef)]?.find(
      (item) => CategoryItem.getCode(item) === code
    )
    if (item) {
      const result = NodeDefLayout.isCodeShown(cycle)(nodeDef)
        ? CategoryItem.getLabelWithCode(lang)(item)
        : CategoryItem.getLabel(lang)(item)
      return result ?? CategoryItem.getCode(item)
    }
    return code
  },
  [NodeDef.nodeDefType.date]: ({ value }) =>
    DateUtils.convertDate({
      dateStr: value,
      formatFrom: DateUtils.formats.datetimeISO,
      formatTo: DateUtils.formats.dateDefault,
    }),
}

const Row = (props) => {
  const { idx, row: record, rowNo, selected, navigateToRecord, onRecordsUpdate, categoryItemsByCodeDefUuid } = props
  const nodeDefKeys = useNodeDefRootKeys()

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const canEdit = useAuthCanEditRecord(record)
  const canDelete = useAuthCanDeleteRecord(record)
  const lang = useSurveyPreferredLang()

  const keyValues = nodeDefKeys.map((nodeDef) => {
    const name = NodeDef.getName(nodeDef)
    const value = record[A.camelize(name)]
    const cycle = Record.getCycle(record)
    const formatter = valueFormattersByType[NodeDef.getType(nodeDef)]
    return value && formatter ? formatter({ cycle, nodeDef, value, categoryItemsByCodeDefUuid, lang }) : value
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
    dispatch(
      RecordActions.deleteRecord({
        navigate,
        recordUuid: Record.getUuid(record),
        goBackOnDelete: false,
        onRecordsUpdate,
      })
    )
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
    [dispatch, keyValues, onDeleteConfirmed]
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
      <div>{DateUtils.formatDateTimeDisplay(Record.getDateCreated(record))}</div>
      <div>{DateUtils.formatDateTimeDisplay(Record.getDateModified(record))}</div>
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
          <ButtonDelete
            testId={TestId.records.tableRowDeleteButton(idx)}
            title="dataView.records.deleteRecord"
            showLabel={false}
            onClick={onDeleteButtonClick}
          />
        )}
      </div>
    </>
  )
}

Row.propTypes = {
  idx: PropTypes.number.isRequired,
  row: PropTypes.object.isRequired,
  rowNo: PropTypes.number.isRequired,
  selected: PropTypes.bool,
  navigateToRecord: PropTypes.func.isRequired,
  onRecordsUpdate: PropTypes.func.isRequired,
  categoryItemsByCodeDefUuid: PropTypes.object.isRequired,
}

Row.defaultProps = {
  selected: false,
}

export default Row
