import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import Binary from './binary'
import Call from './call'
import Group from './group'
import Identifier from './identifier'
import Literal from './literal'
import Logical from './logical'
import Member from './member'

const components = {
  [Expression.types.Identifier]: Identifier,
  [Expression.types.MemberExpression]: Member,
  [Expression.types.Literal]: Literal,
  // [Expression.types.ThisExpression]: thisExpression,
  [Expression.types.CallExpression]: Call,
  // [Expression.types.UnaryExpression]: unaryExpression,
  [Expression.types.BinaryExpression]: Binary,
  [Expression.types.LogicalExpression]: Logical,
  [Expression.types.GroupExpression]: Group,
}

const ExpressionNode = (props) => {
  const { canDelete, isBoolean, level, node, nodeDefCurrent, onChange, onDelete, variables } = props

  const component = components[R.prop('type', node)]

  return React.createElement(component, {
    canDelete,
    isBoolean,
    level,
    node,
    nodeDefCurrent,
    renderNode: ExpressionNode,
    onChange,
    onDelete,
    variables,
  })
}

ExpressionNode.propTypes = {
  // Common props
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  // Identifier / Member / Call
  variables: PropTypes.array,
  // Binary
  canDelete: PropTypes.func,
  isBoolean: PropTypes.bool,
  onDelete: PropTypes.func,
  // Group
  level: PropTypes.any,
}

ExpressionNode.defaultProps = {
  canDelete: null,
  isBoolean: false,
  level: null,
  onDelete: null,
  variables: null,
}

export default ExpressionNode
