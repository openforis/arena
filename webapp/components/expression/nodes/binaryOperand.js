import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'
import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessUtils from '@core/processUtils'

import { Button } from '@webapp/components/buttons'

const availableOperandExpressionTypes = [
  Expression.types.Identifier,
  Expression.types.Literal,
  ...(ProcessUtils.ENV.experimentalFeatures ? [Expression.types.CallExpression] : []),
]

const expressionTypeAcronymByType = {
  [Expression.types.CallExpression]: 'call',
  [Expression.types.Identifier]: 'var',
  [Expression.types.Literal]: 'const',
}

const expressionGeneratorByType = {
  [Expression.types.CallExpression]: () => Expression.newCall(),
  [Expression.types.Identifier]: () => Expression.newIdentifier(),
  [Expression.types.Literal]: () => Expression.newLiteral(),
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

BinaryOperandExpressionTypeButton.propTypes = {
  active: PropTypes.bool.isRequired,
  expressionType: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}

export const BinaryOperandType = {
  left: 'left',
  right: 'right',
}
BinaryOperandType.isLeft = (type) => type === BinaryOperandType.left
BinaryOperandType.isRight = (type) => type === BinaryOperandType.right

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
  const operandExpressionType = Expression.getType(nodeOperand)
  const isLeft = BinaryOperandType.isLeft(type)
  const currentNodeDefIsBoolean = NodeDef.isBoolean(nodeDefCurrent)

  const canOperandExpressionBeOfType = useCallback(
    (expressionType) => {
      switch (expressionType) {
        case Expression.types.Identifier:
        case Expression.types.CallExpression:
          return true
        case Expression.types.Literal:
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

  const onOperandTypeClick = (newType) => () => {
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
      {applicableOperandExpressionTypes.map((expressionType) => (
        <BinaryOperandExpressionTypeButton
          key={expressionType}
          active={operandExpressionType === expressionType}
          expressionType={expressionType}
          onClick={onOperandTypeClick(expressionType)}
        />
      ))}
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
