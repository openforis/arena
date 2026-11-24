import React, { type ElementType } from 'react'

import * as Expression from '@core/expressionParser/expression'
import Binary from './Binary'
import Call from './Call'
import Sequence from './Sequence'
import Identifier from './Identifier'
import Literal from './Literal'
import Logical from './Logical'
import Member from './Member'

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

// props of the expression node and of the node components it renders
export type ExpressionNodeProps = {
  canDelete?: boolean // binary
  expressionNodeParent?: any
  isBoolean?: boolean // binary
  level?: number // sequence
  node: any
  nodeDefCurrent?: any
  onChange: (...args: any[]) => any
  onDelete?: (...args: any[]) => any // binary
  type?: string // literal
  variables?: any[] // identifier / member / call
}

// props of the node components: renderNode renders the nested nodes
export type ExpressionNodeComponentProps = ExpressionNodeProps & {
  renderNode: ElementType
}

const ExpressionNode = (props: ExpressionNodeProps) => {
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

export default ExpressionNode
