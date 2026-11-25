import { useCallback } from 'react'

import { type ArenaRecord, Strings } from '@openforis/arena-core'

import * as Record from '@core/record/record'
import * as User from '@core/user/user'
import { EditableColumn } from '@webapp/components/DataGrid/EditableColumn'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { useSurveyId } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { useAuthCanCleanseRecords } from '@webapp/store/user/hooks'

import { RecordOwnerDropdown } from './RecordOwnerDropdown'

type RecordOwnerColumnProps = {
  item: ArenaRecord
  onRecordsUpdate?: (...args: any[]) => any
}

export const RecordOwnerColumn = (props: RecordOwnerColumnProps) => {
  const { item: record, onRecordsUpdate } = props

  const dispatch = useAppDispatch()

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
    (selectedOwner) => {
      const selectedOwnerUuid = User.getUuid(selectedOwner)
      if (selectedOwnerUuid !== ownerUuid) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'dataView:records.confirmUpdateRecordOwner',
            params: { ownerName: User.getName(selectedOwner) },
            onOk: () => onChangeConfirmed({ selectedOwnerUuid }),
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
      renderItem={({ item }) => Strings.defaultIfEmpty('---')(Record.getOwnerName(item))}
      renderItemEditing={() => <RecordOwnerDropdown selectedUuid={ownerUuid} onChange={onChange} />}
    />
  )
}
