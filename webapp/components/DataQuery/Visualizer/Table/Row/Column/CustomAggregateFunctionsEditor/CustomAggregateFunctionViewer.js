import React from 'react'

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
