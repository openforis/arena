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

const getComponent = (expressionNode) => {
  const { type } = expressionNode
  switch (type) {
    case Expression.types.Identifier:
      return Identifier
    case Expression.types.MemberExpression:
      return Member
    case Expression.types.Literal:
      return Literal
    case Expression.types.CallExpression:
      return Call
    case Expression.types.BinaryExpression:
      const { logical: logicalOperators } = Expression.operators
      return [logicalOperators.or.value, logicalOperators.and.value].includes(expressionNode.operator)
        ? Logical
        : Binary
    case Expression.types.SequenceExpression:
      return Sequence
    default:
      throw new Error(`Expression type not supported: ${type}`)
  }
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

  const component = getComponent(node)

  return React.createElement(component, {
    canDelete,
    isBoolean,
    level,
    expressionNodeParent,
    node,
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
