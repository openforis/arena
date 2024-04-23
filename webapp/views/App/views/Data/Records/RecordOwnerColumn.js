import React, { useCallback, useState } from 'react'

import * as Record from '@core/record/record'

import { useAuthCanCleanseRecords } from '@webapp/store/user/hooks'
import { ButtonIconEdit } from '@webapp/components'
import { RecordOwnerDropdown } from './RecordOwnerDropdown'

export const RecordOwnerColumn = (props) => {
  const { item: record } = props

  const [state, setState] = useState({ editing: false, hovering: false })
  const { editing, hovering } = state

  const ownerName = Record.getOwnerName(record)

  const canEdit = useAuthCanCleanseRecords()

  const onContainerMouseOver = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, hovering: true }))
  }, [])

  const onContainerMouseLeave = useCallback(() => {
    setState((statePrev) => ({ ...statePrev, hovering: false }))
  }, [])

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

  return canEdit ? (
    <div onClick={onContainerClick} onMouseOver={onContainerMouseOver} onMouseLeave={onContainerMouseLeave}>
      {editing && <RecordOwnerDropdown selectedUuid={Record.getOwnerUuid(record)} onChange={() => {}} />}
      {!editing && ownerName}
      {hovering && !editing && <ButtonIconEdit onClick={onEditClick} />}
    </div>
  ) : (
    ownerName
  )
}
