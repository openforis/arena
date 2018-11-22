import React from 'react'

import { getNodeDefFields } from '../nodeDefSystemProps'

const NodeDefTableHeader = props => {
  const {label, nodeDef} = props

  const fields = getNodeDefFields(nodeDef)

  return <div style={{display: 'grid', gridTemplateColumns: `repeat(${fields.length}, auto)`}}>
    <label className="node-def__table-header"
           style={{gridColumn: `1 / span ${fields.length}`}}>{label}</label>
    {
      fields.length > 1 &&
        fields.map(field => <div key={field} className="node-def__table-header">{field}</div>)
    }
  </div>
}

export default NodeDefTableHeader