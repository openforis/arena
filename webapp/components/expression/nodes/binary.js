import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import Dropdown from '../../form/Dropdown'
import BinaryOperand, { BinaryOperandType } from './binaryOperand'
import EditButtons from './editButtons'

const Binary = (props) => {
  const {
    canDelete = false,
    isBoolean = false,
    level = 0,
    node,
    nodeDefCurrent = null,
    onChange,
    onDelete = null,
    renderNode,
    variables = null,
  } = props

  const isLeftLiteral = R.pipe(R.prop(BinaryOperandType.left), Expression.isLiteral)(node)

  const showOperator = !isLeftLiteral

  const createOperand = (type) => (
    <BinaryOperand
      canDelete={canDelete}
      isBoolean={isBoolean}
      level={level}
      node={node}
      nodeDefCurrent={nodeDefCurrent}
      onChange={onChange}
      onDelete={onDelete}
      renderNode={renderNode}
      type={type}
      variables={variables}
    />
  )

  return (
    <div className="binary">
      {createOperand(BinaryOperandType.left)}

      {showOperator && (
        <>
          <Dropdown
            className="operator"
            items={Expression.operators.binaryValues}
            selection={Expression.operators.findBinary(node.operator)}
            onChange={(item) => onChange(R.assoc('operator', R.propOr('', 'value', item), node))}
          />

          {createOperand(BinaryOperandType.right)}

          {isBoolean && <EditButtons node={node} onChange={onChange} onDelete={onDelete} canDelete={canDelete} />}
        </>
      )}
    </div>
  )
}

Binary.propTypes = {
  canDelete: PropTypes.bool,
  isBoolean: PropTypes.bool,
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  // ExpressionNode props
  level: PropTypes.number,
  renderNode: PropTypes.func.isRequired,
  variables: PropTypes.array,
}

export default Binary
