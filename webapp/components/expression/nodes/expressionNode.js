import React from 'react'
import PropTypes from 'prop-types'

import * as Expression from '@core/expressionParser/expression'
import Binary from './binary'
import Call from './call'
import Sequence from './sequence'
import Identifier from './identifier'
import Literal from './literal'
import Logical from './logical'
import Member from './member'

const { types } = Expression

const componentFns = {
  [types.Identifier]: () => Identifier,
  [types.MemberExpression]: () => Member,
  [types.Literal]: () => Literal,
  [types.CallExpression]: () => Call,
  [types.BinaryExpression]: (expressionNode) => {
    const { logical: logicalOperators } = Expression.operators
    return [logicalOperators.or.value, logicalOperators.and.value].includes(expressionNode.operator) ? Logical : Binary
  },
  [types.SequenceExpression]: () => Sequence,
}

const thisExpressionNode = { type: types.Identifier, name: Expression.thisVariable }

const toUiComponentNode = (node) => {
  const { type } = node
  if (type === types.ThisExpression) {
    return thisExpressionNode
  }
  if (type === types.UnaryExpression) {
    // e.g. this > -1 ; -1 is a unary expression (value 1, operator -)
    // in the expression editor it will be managed as a literal expression, with a value of "-1"
    const { argument } = node
    const { type: argumentType, value: argumentValue } = argument ?? {}
    if (argumentType === types.Literal) {
      const newValue = `${node.operator} ${argumentValue}`
      return Expression.newLiteral(newValue)
    }
  }
  return node
}

const ExpressionNode = (props) => {
  const {
    canDelete = false,
    isBoolean = false,
    level = 0,
    expressionNodeParent = null,
    node,
    nodeDefCurrent = null,
    onChange,
    onDelete = null,
    type = null,
    variables = null,
  } = props

  const componentNode = toUiComponentNode(node)
  if (!componentNode) return null

  const componentFn = componentFns[componentNode.type]
  const component = componentFn(componentNode)

  return React.createElement(component, {
    canDelete,
    isBoolean,
    level,
    expressionNodeParent,
    node: componentNode,
    nodeDefCurrent,
    renderNode: ExpressionNode,
    onChange,
    onDelete,
    type,
    variables,
  })
}

ExpressionNode.propTypes = {
  // Common props
  expressionNodeParent: PropTypes.any,
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  // Identifier / Member / Call
  variables: PropTypes.array,
  // Binary
  canDelete: PropTypes.bool,
  isBoolean: PropTypes.bool,
  onDelete: PropTypes.func,
  // Sequence
  level: PropTypes.number,
  // Literal
  type: PropTypes.string,
}

export default ExpressionNode
