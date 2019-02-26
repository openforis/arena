import React from 'react'

import { getNodeValue } from '../../../../../../common/record/node'

const Button = ({nodeDef, readOnly, parentNode, nodes, updateNode, label, disabled, value, entry, canEditRecord}) => {
  const node = entry ? nodes[0] : null

  const nodeValue = getNodeValue(node, '')

  return (
    <button className="btn btn-s btn-transparent"
            style={{borderRadius: '.75rem'}}
            aria-disabled={disabled || !canEditRecord || readOnly}
            onClick={() => updateNode(nodeDef, node, value)}>
      <span className={`icon icon-radio-${nodeValue === value ? 'checked2' : 'unchecked'} icon-left`}/>
      {label}
    </button>
  )

}

const NodeDefBoolean = props =>

  <div style={{borderBottom: 'none', textAlign: 'center'}}>

    <Button {...props}
            disabled={props.edit}
            label="TRUE"
            value="true"/>

    <Button {...props}
            disabled={props.edit}
            label="FALSE"
            value="false"/>

  </div>

export default NodeDefBoolean
