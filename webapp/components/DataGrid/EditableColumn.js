import React, { useCallback, useState } from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { ButtonIconEdit } from '@webapp/components'
import { KeyboardKeys } from '@webapp/utils/keyboardKeys'

export const EditableColumn = (props) => {
  const { canEdit, className, item, renderItem, renderItemEditing } = props

  const [state, setState] = useState({ editing: false, hovering: false })
  const { editing, hovering } = state

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

  const onContainerClick = useCallback((e) => {
    // prevent table row selection on click
    e.stopPropagation()
    e.preventDefault()
  }, [])

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

  if (!canEdit) {
    return <div className={className}>{renderItem({ item })}</div>
  }

  return (
    <div
      className={classNames(className, { editing })}
      onClick={onContainerClick}
      onFocus={onContainerFocus}
      onKeyDown={onContainerKeyDown}
      onMouseOver={onContainerMouseOver}
      onMouseLeave={onContainerMouseLeave}
    >
      {editing && renderItemEditing({ item })}
      {!editing && renderItem({ item })}
      {hovering && !editing && <ButtonIconEdit onClick={onEditClick} />}
    </div>
  )
}

EditableColumn.propTypes = {
  canEdit: PropTypes.bool,
  className: PropTypes.string,
  item: PropTypes.object.isRequired,
  renderItem: PropTypes.func.isRequired,
  renderItemEditing: PropTypes.func.isRequired,
}
