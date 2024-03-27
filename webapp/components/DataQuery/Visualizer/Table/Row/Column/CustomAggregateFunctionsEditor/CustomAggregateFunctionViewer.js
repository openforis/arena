import React from 'react'

import { ButtonIconEdit } from '@webapp/components'
import Checkbox from '@webapp/components/form/checkbox'

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
