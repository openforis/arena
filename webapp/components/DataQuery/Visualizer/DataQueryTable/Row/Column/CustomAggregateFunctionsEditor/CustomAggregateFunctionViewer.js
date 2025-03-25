import React from 'react'
import PropTypes from 'prop-types'

import Checkbox from '@webapp/components/form/checkbox'
import { ButtonIconEdit } from '@webapp/components'

export const CustomAggregateFunctionViewer = (props) => {
  const { fn, selected, onSelectionChange, setEditedUuid } = props
  const { name, uuid } = fn
  return (
    <>
      <div>
        <Checkbox checked={selected} onChange={() => onSelectionChange({ [uuid]: !selected })} />
      </div>
      <div className="ellipsis">{name}</div>
      <ButtonIconEdit onClick={() => setEditedUuid(uuid)} />
    </>
  )
}

CustomAggregateFunctionViewer.propTypes = {
  fn: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  setEditedUuid: PropTypes.func.isRequired,
}
