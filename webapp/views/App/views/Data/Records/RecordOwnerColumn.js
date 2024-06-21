import React, { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import * as Record from '@core/record/record'
import * as User from '@core/user/user'

import { ButtonIconEdit } from '@webapp/components'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanCleanseRecords } from '@webapp/store/user/hooks'
import { DialogConfirmActions } from '@webapp/store/ui'
import { KeyboardKeys } from '@webapp/utils/keyboardKeys'

import { RecordOwnerDropdown } from './RecordOwnerDropdown'

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

  const setHovering = useCallback(
    (hoveringNew) => {
      if (hoveringNew !== hovering) {
        setState((statePrev) => ({ ...statePrev, hovering: hoveringNew }))
      }
    },
    [hovering]
  )

  const setEditing = useCallback(
    (editingNew) => {
      if (editingNew !== editing) {
        setState((statePrev) => ({ ...statePrev, editing: editingNew }))
      }
    },
    [editing]
  )

  const onContainerMouseOver = useCallback(() => setHovering(true), [setHovering])
  const onContainerMouseLeave = useCallback(() => setHovering(false), [setHovering])

  const onContainerClick = useCallback(
    (e) => {
      // prevent table row selection on click
      if (editing) {
        e.stopPropagation()
        e.preventDefault()
      }
    },
    [editing]
  )

  const onContainerFocus = useCallback(() => setHovering(true), [setHovering])

  const onContainerKeyDown = useCallback(
    (e) => {
      if (e.key === KeyboardKeys.Space) {
        setEditing(true)
      }
    },
    [setEditing]
  )

  const onEditClick = useCallback(
    (e) => {
      e.stopPropagation()
      e.preventDefault()
      setEditing(true)
    },
    [setEditing]
  )

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
      className={classNames('record-owner-col', { editing })}
      onClick={onContainerClick}
      onFocus={onContainerFocus}
      onKeyDown={onContainerKeyDown}
      onMouseOver={onContainerMouseOver}
      onMouseLeave={onContainerMouseLeave}
      role="button"
      tabIndex={0}
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
