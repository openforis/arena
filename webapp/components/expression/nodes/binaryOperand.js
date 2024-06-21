import React, { useCallback } from 'react'
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
  const { canDelete, isBoolean, level, node, nodeDefCurrent, onChange, onDelete, type, renderNode, variables } = props

  const nodeOperand = R.prop(type, node)
  const isLeft = BinaryOperandType.isLeft(type)
  const canOperandBeLiteral = !isLeft || !isBoolean || NodeDef.isBoolean(nodeDefCurrent)
  const canOperandBeFunctionCall = canOperandBeLiteral

  const onOperandChange = useCallback(
    (nodeUpdate) => {
      if (isLeft && !isBoolean) {
        return R.pipe(R.assoc('operator', ''), R.assoc(BinaryOperandType.right, Expression.newIdentifier()))(nodeUpdate)
      }
      return nodeUpdate
    },
    [isBoolean, isLeft]
  )

  return (
    <div className={`binary-${type}`}>
      <Button
        active={Expression.isIdentifier(nodeOperand)}
        className="btn-switch-operand btn-switch-operand-var"
        label="expressionEditor.var"
        onClick={() => onChange(R.assoc(type, Expression.newIdentifier(), node))}
        size="small"
        variant="outlined"
      />

      {canOperandBeLiteral && (
        <Button
          active={Expression.isLiteral(nodeOperand)}
          className="btn-switch-operand btn-switch-operand-const"
          label="expressionEditor.const"
          onClick={() => {
            let nodeUpdate = R.assoc(type, Expression.newLiteral(), node)
            nodeUpdate = onOperandChange(nodeUpdate)
            onChange(nodeUpdate)
          }}
          size="small"
          variant="outlined"
        />
      )}
      {canOperandBeFunctionCall && (
        <Button
          active={Expression.isCall(nodeOperand)}
          className="btn-switch-operand btn-switch-operand-call"
          label="expressionEditor.call"
          onClick={() => {
            let nodeUpdate = R.assoc(type, Expression.newCall({ callee: Expression.functionNames.now }), node)
            nodeUpdate = onOperandChange(nodeUpdate)
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

BinaryOperand.defaultProps = {
  canDelete: false,
  isBoolean: false,
  level: 0,
  nodeDefCurrent: null,
  onDelete: null,
  variables: null,
}

export default BinaryOperand
