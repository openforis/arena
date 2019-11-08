import React from 'react'
import * as R from 'ramda'

import Binary from './binary'
import Call from './call'
import Group from './group'
import Identifier from './identifier'
import Literal from './literal'
import Logical from './logical'
import Member from './member'

import * as Expression from '@core/expressionParser/expression'

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
  const component = components[R.path(['node', 'type'], props)]
  return React.createElement(component, props)
}

export default ExpressionNode
