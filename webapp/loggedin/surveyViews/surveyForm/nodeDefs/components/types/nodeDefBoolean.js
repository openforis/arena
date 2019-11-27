import './nodeDefBoolean.scss'

import React from 'react'

import * as Node from '@core/record/node'

const Button = props => {
  const {
    nodeDef,
    nodes,
    value,
    label,
    readOnly,
    disabled,
    updateNode,
    entry,
    canEditRecord,
  } = props

  const node = entry ? nodes[0] : null

  const nodeValue = Node.getValue(node, '')
  const checked = nodeValue === value

  return (
    <button
      className="btn btn-s btn-transparent flex-center"
      aria-disabled={disabled || !canEditRecord || readOnly}
      onClick={() => updateNode(nodeDef, node, checked ? null : value)}
    >
      <span
        className={`icon icon-12px icon-radio-${
          checked ? 'checked2' : 'unchecked'
        } icon-left`}
      />
      {label}
    </button>
  )
}

const NodeDefBoolean = props => (
  <div className="survey-form__node-def-boolean">
    <Button {...props} disabled={props.edit} label="TRUE" value="true" />

    <Button {...props} disabled={props.edit} label="FALSE" value="false" />
  </div>
)

export default NodeDefBoolean
