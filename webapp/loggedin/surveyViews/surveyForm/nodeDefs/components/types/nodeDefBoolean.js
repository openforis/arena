import React from 'react'

import Node from '../../../../../../../common/record/node'

const Button = (props) => {

  const {
    nodeDef, nodes, value,
    label, readOnly, disabled,
    updateNode,
    entry, canEditRecord
  } = props

  const node = entry ? nodes[0] : null

  const nodeValue = Node.getValue(node, '')

  return (
    <button className="btn btn-s btn-transparent flex-center"
            aria-disabled={disabled || !canEditRecord || readOnly}
            onClick={() => updateNode(nodeDef, node, value)}>
      <span className={`icon icon-12px icon-radio-${nodeValue === value ? 'checked2' : 'unchecked'} icon-left`}/>
      {label}
    </button>
  )

}

const NodeDefBoolean = props => (
  <div className="flex-center">

    <Button {...props}
            disabled={props.edit}
            label="TRUE"
            value="true"/>

    <Button {...props}
            disabled={props.edit}
            label="FALSE"
            value="false"/>

  </div>
)

export default NodeDefBoolean
