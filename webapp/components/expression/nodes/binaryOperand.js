import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import { Button } from '@webapp/components/buttons'

export const BinaryOperandType = {
  left: 'left',
  right: 'right',
}
BinaryOperandType.isLeft = R.equals(BinaryOperandType.left)
BinaryOperandType.isRight = R.equals(BinaryOperandType.right)

const BinaryOperand = (props) => {
  const {
    canDelete = false,
    isBoolean = false,
    level = 0,
    node,
    nodeDefCurrent = null,
    onChange,
    onDelete = null,
    renderNode,
    type,
    variables = null,
  } = props

  const nodeOperand = R.prop(type, node)
  const isLeft = BinaryOperandType.isLeft(type)
  const canOperandBeLiteral = !isLeft || !isBoolean || NodeDef.isBoolean(nodeDefCurrent)

  return (
    <div className={`binary-${type}`}>
      <Button
        className="btn-switch-operand btn-switch-operand-var"
        label="expressionEditor.var"
        onClick={() => onChange(R.assoc(type, Expression.newIdentifier(), node))}
        size="small"
        variant={!Expression.isLiteral(nodeOperand) ? 'contained' : 'outlined'}
      />

      {canOperandBeLiteral && (
        <Button
          active={Expression.isLiteral(nodeOperand)}
          className="btn-switch-operand btn-switch-operand-const"
          label="expressionEditor.const"
          onClick={() => {
            let nodeUpdate = R.assoc(type, Expression.newLiteral(), node)
            if (isLeft && !isBoolean) {
              nodeUpdate = R.pipe(
                R.assoc('operator', ''),
                R.assoc(BinaryOperandType.right, Expression.newIdentifier())
              )(nodeUpdate)
            }
            onChange(nodeUpdate)
          }}
          size="small"
          variant="outlined"
        />
      )}
      {React.createElement(renderNode, {
        canDelete,
        isBoolean,
        level,
        expressionNodeParent: node,
        node: nodeOperand,
        nodeDefCurrent,
        onChange: (item) => onChange(R.assoc(type, item, node)),
        onDelete,
        type,
        variables,
      })}
    </div>
  )
}

BinaryOperand.propTypes = {
  isBoolean: PropTypes.bool,
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  renderNode: PropTypes.func.isRequired,
  // ExpressionNode props
  canDelete: PropTypes.bool,
  level: PropTypes.number,
  onDelete: PropTypes.func,
  variables: PropTypes.array,
}

export default BinaryOperand
