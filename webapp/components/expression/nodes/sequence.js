import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import EditButtons from './editButtons'

const Sequence = (props) => {
  const { canDelete, node, nodeDefCurrent, isBoolean, level, onChange, onDelete, renderNode, type, variables } = props

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
        onChange: (item) => onChange(R.assoc('expression', item, node)),
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

Sequence.propTypes = {
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  renderNode: PropTypes.elementType.isRequired,
  level: PropTypes.number,
  // ExpressionNode props
  canDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  nodeDefCurrent: PropTypes.any,
  isBoolean: PropTypes.bool,
  type: PropTypes.string,
  variables: PropTypes.array,
}

Sequence.defaultProps = {
  canDelete: false,
  isBoolean: false,
  level: 0,
  nodeDefCurrent: null,
  onDelete: null,
  type: null,
  variables: null,
}

export default Sequence
