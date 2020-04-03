import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import Dropdown from '../../form/dropdown'
import BinaryOperand, { BinaryOperandType } from './binaryOperand'
import EditButtons from './editButtons'

const Binary = (props) => {
  const { canDelete, node, nodeDefCurrent, isBoolean, onChange, onDelete } = props

  const isLeftLiteral = R.pipe(R.prop(BinaryOperandType.left), Expression.isLiteral)(node)

  const showOperator = (isBoolean && !NodeDef.isBoolean(nodeDefCurrent)) || !isLeftLiteral

  return (
    <div className="binary">
      {React.createElement(BinaryOperand, { ...props, type: BinaryOperandType.left })}

      {showOperator && (
        <>
          <Dropdown
            className="operator"
            items={Expression.operators.binaryValues}
            selection={Expression.operators.findBinary(node.operator)}
            onChange={(item) => onChange(R.assoc('operator', R.propOr('', 'key', item), node))}
          />

          {React.createElement(BinaryOperand, { ...props, type: BinaryOperandType.right })}

          {isBoolean && <EditButtons node={node} onChange={onChange} onDelete={onDelete} canDelete={canDelete} />}
        </>
      )}
    </div>
  )
}

Binary.propTypes = {
  canDelete: PropTypes.bool,
  isBoolean: PropTypes.bool,
  node: PropTypes.any,
  nodeDefCurrent: PropTypes.any,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
}

Binary.defaultProps = {
  canDelete: false,
  isBoolean: false,
  node: null,
  nodeDefCurrent: null,
  onChange: null,
  onDelete: null,
}

export default Binary
