import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import { ButtonGroup } from '@webapp/components/form'

const { types } = Expression

const availableOperandExpressionTypes = [types.Identifier, types.Literal, types.CallExpression]

const expressionTypeAcronymByType = {
  [types.CallExpression]: 'call',
  [types.Identifier]: 'var',
  [types.Literal]: 'const',
}

const expressionGeneratorByType = {
  [types.CallExpression]: () => Expression.newCall(),
  [types.Identifier]: () => Expression.newIdentifier(),
  [types.Literal]: () => Expression.newLiteral(),
}

export const BinaryOperandType = {
  left: 'left',
  right: 'right',
}
BinaryOperandType.isLeft = (type) => type === BinaryOperandType.left
BinaryOperandType.isRight = (type) => type === BinaryOperandType.right

const toUiOperandExpressionType = (type) => {
  if (type === types.UnaryExpression) {
    // unary expressions managed as literal expressions in UI
    return types.Literal
  }
  return type
}

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

  const nodeOperand = node[type]
  const operandExpressionType = toUiOperandExpressionType(Expression.getType(nodeOperand))
  const isLeft = BinaryOperandType.isLeft(type)
  const currentNodeDefIsBoolean = NodeDef.isBoolean(nodeDefCurrent)

  const canOperandExpressionBeOfType = useCallback(
    (expressionType) => {
      switch (expressionType) {
        case types.Identifier:
        case types.CallExpression:
          return true
        case types.Literal:
          return !isLeft || !isBoolean || currentNodeDefIsBoolean
        default:
          return false
      }
    },
    [currentNodeDefIsBoolean, isBoolean, isLeft]
  )

  const applicableOperandExpressionTypes = useMemo(
    () => availableOperandExpressionTypes.filter(canOperandExpressionBeOfType),
    [canOperandExpressionBeOfType]
  )

  const onOperandTypeChange = (newType) => {
    const newOperatorExpression = expressionGeneratorByType[newType]()
    let nodeUpdated = { ...node, [type]: newOperatorExpression }
    if (isLeft && !isBoolean) {
      // clear operator and right operand
      nodeUpdated = A.pipe(
        A.assoc('operator', ''),
        A.assoc(BinaryOperandType.right, Expression.newIdentifier())
      )(nodeUpdated)
    }
    onChange(nodeUpdated)
  }

  return (
    <div className={`binary-${type}`}>
      <ButtonGroup
        className="binary-operand-type-btn-group"
        selectedItemKey={operandExpressionType}
        onChange={onOperandTypeChange}
        items={applicableOperandExpressionTypes.map((expressionType) => {
          const acronym = expressionTypeAcronymByType[expressionType]
          const label = `expressionEditor.${acronym}`
          return { key: expressionType, label }
        })}
      />
      {React.createElement(renderNode, {
        canDelete,
        isBoolean,
        level,
        expressionNodeParent: node,
        node: nodeOperand,
        nodeDefCurrent,
        onChange: (item) => onChange(A.assoc(type, item, node)),
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
