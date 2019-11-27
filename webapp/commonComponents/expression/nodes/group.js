import React from 'react'
import * as R from 'ramda'

import ExpressionNode from './expressionNode'
import EditButtons from './editButtons'

const Group = props => {
  const {node, onChange, level = 0} = props
  const {argument} = node

  return (
    <div className="group">
      <h3>(</h3>
      <ExpressionNode
        {...props}
        level={level + 1}
        node={argument}
        onChange={item => onChange(R.assoc('argument', item, node))}
      />
      <div className="footer">
        <h3>)</h3>
        <EditButtons
          node={node}
          onChange={onChange}
          onDelete={() => onChange(argument)}
          canDelete={true}
        />
      </div>
    </div>
  )
}

export default Group
