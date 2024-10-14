import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as Record from '@core/record/record'
import * as User from '@core/user/user'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanCleanseRecords } from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'
import { EditableColumn } from '@webapp/components/DataGrid/EditableColumn'

import { RecordOwnerDropdown } from './RecordOwnerDropdown'

export const RecordOwnerColumn = (props) => {
  const { item: record, onRecordsUpdate } = props

  const dispatch = useDispatch()

  const surveyId = useSurveyId()
  const ownerUuid = Record.getOwnerUuid(record)
  const ownerName = Record.getOwnerName(record)
  const recordUuid = Record.getUuid(record)

  const canEdit = useAuthCanCleanseRecords()

  const onChangeConfirmed = useCallback(
    async ({ selectedOwnerUuid }) => {
      await API.updateRecordOwner({ surveyId, recordUuid, ownerUuid: selectedOwnerUuid })
      await onRecordsUpdate?.()
    },
    [onRecordsUpdate, recordUuid, surveyId]
  )

  const onChange = useCallback(
    async (selectedOwner) => {
      const selectedOwnerUuid = User.getUuid(selectedOwner)
      if (selectedOwnerUuid !== ownerUuid) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'dataView.records.confirmUpdateRecordOwner',
            params: { ownerName: User.getName(selectedOwner) },
            onOk: async () => onChangeConfirmed({ selectedOwnerUuid }),
          })
        )
      }
    },
    [dispatch, onChangeConfirmed, ownerUuid]
  )

  if (!canEdit) {
    return ownerName
  }

  return (
    <EditableColumn
      canEdit={canEdit}
      className="record-owner-col"
      item={record}
      renderItem={({ item }) => Record.getOwnerName(item)}
      renderItemEditing={() => <RecordOwnerDropdown selectedUuid={ownerUuid} onChange={onChange} />}
    />
  )
}

RecordOwnerColumn.propTypes = {
  item: PropTypes.object.isRequired,
  onRecordsUpdate: PropTypes.func,
}
