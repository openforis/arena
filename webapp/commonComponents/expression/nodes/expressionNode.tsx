import React from 'react'
import * as R from 'ramda'

import { Binary } from './internal'
import { Call } from './internal'
import { Group } from './internal'
import { Identifier } from './internal'
import { Literal } from './internal'
import { Logical } from './internal'
import { Member } from './internal'

import Expression from '../../../../core/exprParser/expression'

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

// TODO: make exprsesion types inherit from a common interface
export const ExpressionNode = (props: { [s: string]: any; }) => {
  // @ts-ignore
  const component = components[R.path(['node', 'type'], props)]
  return React.createElement(component, props)
}

export default ExpressionNode
