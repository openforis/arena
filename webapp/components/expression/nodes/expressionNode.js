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
    variablesGroupedByParentUuid,
  } = props

  const component = components[R.prop('type', node)]

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
    variablesGroupedByParentUuid,
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
  variablesGroupedByParentUuid: PropTypes.array,
  // Binary
  canDelete: PropTypes.bool,
  isBoolean: PropTypes.bool,
  onDelete: PropTypes.func,
  // Group
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
  variablesGroupedByParentUuid: null,
}

export default ExpressionNode
