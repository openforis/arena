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

const componentFns = {
  [Expression.types.Identifier]: () => Identifier,
  [Expression.types.MemberExpression]: () => Member,
  [Expression.types.Literal]: () => Literal,
  [Expression.types.CallExpression]: () => Call,
  [Expression.types.BinaryExpression]: (expressionNode) => {
    const { logical: logicalOperators } = Expression.operators
    return [logicalOperators.or.value, logicalOperators.and.value].includes(expressionNode.operator) ? Logical : Binary
  },
  [Expression.types.SequenceExpression]: () => Sequence,
}

const ExpressionNode = (props) => {
  const {
    canDelete,
    isBoolean,
    level,
    node,
    expressionNodeParent,
    nodeDefCurrent,
    onChange,
    onDelete,
    type,
    variables,
  } = props

  // transform a "this" expression into an Identifier expression
  const componentNode =
    node.type === Expression.types.ThisExpression ? { type: Expression.types.Identifier, name: 'this' } : node
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

ExpressionNode.defaultProps = {
  canDelete: false,
  isBoolean: false,
  level: 0,
  expressionNodeParent: null,
  nodeDefCurrent: null,
  onDelete: null,
  type: null,
  variables: null,
}

export default ExpressionNode
