import React from 'react'
import * as A from '@core/arena'

import EditButtons from './EditButtons'
import type { ExpressionNodeComponentProps } from './expressionNode'

const Sequence = (props: ExpressionNodeComponentProps) => {
  const {
    canDelete = false,
    isBoolean = false,
    level = 0,
    node,
    nodeDefCurrent = null,
    onChange,
    onDelete = null,
    renderNode,
    type = null,
    variables = null,
  } = props

  const { expression } = node

  return (
    <div className="group">
      <h3>(</h3>
      {React.createElement(renderNode, {
        canDelete,
        isBoolean,
        level: level + 1,
        node: expression,
        nodeDefCurrent,
        onChange: (item) => onChange(A.assoc('expression', item, node)),
        onDelete,
        type,
        variables,
      })}
      <div className="footer">
        <h3>)</h3>
        <EditButtons node={node} onChange={onChange} onDelete={() => onChange(expression)} canDelete />
      </div>
    </div>
  )
}

export default Sequence
