import React from 'react'

import { getNodeDefFormFields } from '../nodeDefSystemProps'

const NodeDefTableHeader = props => {
  const {label, nodeDef} = props

  const fields = getNodeDefFormFields(nodeDef)

  return (
    <div className="node-def__table-header" style={{gridTemplateColumns: `repeat(${fields.length}, auto)`}}>

      <label style={{gridColumn: `1 / span ${fields.length}`}}>{label}</label>

      {
        fields.length > 1 &&
        fields.map(field =>
          <label key={field}>{field}</label>
        )
      }

    </div>

  )
}

export default NodeDefTableHeader