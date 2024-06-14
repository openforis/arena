import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import Dropdown from '../../form/Dropdown'
import BinaryOperand, { BinaryOperandType } from './binaryOperand'
import EditButtons from './editButtons'

const Binary = (props) => {
  const { canDelete, node, nodeDefCurrent, isBoolean, level, onChange, onDelete, renderNode, variables } = props

  const isLeftLiteral = R.pipe(R.prop(BinaryOperandType.left), Expression.isLiteral)(node)

  const showOperator = !isLeftLiteral
  const binaryOperator = showOperator ? Expression.operators.findBinary(node.operator) : null

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
            selection={binaryOperator}
            onChange={(item) => onChange(R.assoc('operator', item?.value ?? '', node))}
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

Binary.defaultProps = {
  canDelete: false,
  isBoolean: false,
  level: 0,
  nodeDefCurrent: null,
  onDelete: null,
  variables: null,
}

export default Binary
