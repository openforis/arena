import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import { Button } from '@webapp/components/buttons'

const expressionTypeAcronymByType = {
  [Expression.types.CallExpression]: 'call',
  [Expression.types.Identifier]: 'var',
  [Expression.types.Literal]: 'const',
}

const BinaryOperandExpressionTypeButton = (props) => {
  const { active, expressionType, onClick } = props
  const acronym = expressionTypeAcronymByType[expressionType]
  return (
    <Button
      active={active}
      className={`btn-switch-operand btn-switch-operand-${acronym}`}
      label={`expressionEditor.${acronym}`}
      onClick={onClick}
      size="small"
      variant="outlined"
    />
  )
}

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

  const onOperatorTypeClick = (newType) => () => {
    let nodeUpdated = R.assoc(type, newType, node)
    if (isLeft && !isBoolean) {
      // clear operator and right operand
      nodeUpdated = R.pipe(
        R.assoc('operator', ''),
        R.assoc(BinaryOperandType.right, Expression.newIdentifier())
      )(nodeUpdated)
    }
    onChange(nodeUpdated)
  }

  return (
    <div className={`binary-${type}`}>
      <BinaryOperandExpressionTypeButton
        active={Expression.isIdentifier(nodeOperand)}
        expressionType={Expression.types.Identifier}
        onClick={onOperatorTypeClick(Expression.newIdentifier())}
      />

      {canOperandBeLiteral && (
        <BinaryOperandExpressionTypeButton
          active={Expression.isLiteral(nodeOperand)}
          expressionType={Expression.types.Literal}
          onClick={onOperatorTypeClick(Expression.newLiteral())}
        />
      )}
      {canOperandBeFunctionCall && (
        <BinaryOperandExpressionTypeButton
          active={Expression.isCall(nodeOperand)}
          expressionType={Expression.types.CallExpression}
          onClick={onOperatorTypeClick(Expression.newCall({ callee: Expression.functionNames.now }))}
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
