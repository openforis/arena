import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import * as Record from '@core/record/record'
import * as User from '@core/user/user'

import { ButtonIconEdit } from '@webapp/components'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanCleanseRecords } from '@webapp/store/user/hooks'

import { RecordOwnerDropdown } from './RecordOwnerDropdown'
import { DialogConfirmActions } from '@webapp/store/ui'
import { useDispatch } from 'react-redux'

export const RecordOwnerColumn = (props) => {
  const { item: record, onRecordsUpdate } = props

  const dispatch = useDispatch()
  const [state, setState] = useState({ editing: false, hovering: false })
  const { editing, hovering } = state

  const surveyId = useSurveyId()
  const ownerUuid = Record.getOwnerUuid(record)
  const ownerName = Record.getOwnerName(record)
  const recordUuid = Record.getUuid(record)

  const canEdit = useAuthCanCleanseRecords()

  const onContainerMouseOver = useCallback(() => {
    if (!hovering) {
      setState((statePrev) => ({ ...statePrev, hovering: true }))
    }
  }, [hovering])

  const onContainerMouseLeave = useCallback(() => {
    if (hovering) {
      setState((statePrev) => ({ ...statePrev, hovering: false }))
    }
  }, [hovering])

  const onContainerClick = useCallback(
    (e) => {
      if (editing) {
        e.stopPropagation()
        e.preventDefault()
      }
    },
    [editing]
  )

  const onEditClick = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()
    setState((statePrev) => ({ ...statePrev, editing: true }))
  }, [])

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
    <div
      className="width100"
      onClick={onContainerClick}
      onMouseOver={onContainerMouseOver}
      onMouseLeave={onContainerMouseLeave}
    >
      {editing && <RecordOwnerDropdown selectedUuid={ownerUuid} onChange={onChange} />}
      {!editing && ownerName}
      {hovering && !editing && <ButtonIconEdit onClick={onEditClick} />}
    </div>
  )
}

RecordOwnerColumn.propTypes = {
  item: PropTypes.object.isRequired,
  onRecordsUpdate: PropTypes.func,
}
