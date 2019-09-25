import React from 'react'
import * as R from 'ramda'

import ExpressionNode from './expressionNode'
import { useI18n } from '../../hooks'

import Expression from '../../../../common/exprParser/expression'

export const BinaryOperandType = {
  left: 'left',
  right: 'right',
}
BinaryOperandType.isLeft = R.equals(BinaryOperandType.left)
BinaryOperandType.isRight = R.equals(BinaryOperandType.right)

const BinaryOperand = props => {
  const { node, type, isBoolean, onChange } = props
  const nodeOperand = R.prop(type, node)
  const isLeft = BinaryOperandType.isLeft(type)

  const i18n = useI18n()

  return (
    <>
      <button
        className={`btn btn-s btn-switch-operand${!Expression.isLiteral(nodeOperand) ? ' active' : ''}`}
        onClick={() => onChange(
          R.assoc(type, Expression.newIdentifier(), node)
        )}>
        {i18n.t('expressionEditor.var')}
      </button>

      <button
        className={`btn btn-s btn-switch-operand${Expression.isLiteral(nodeOperand) ? ' active' : ''}`}
        aria-disabled={isLeft && isBoolean}
        onClick={() => {
          const nodeUpdate = isLeft && !isBoolean ?
            R.pipe(
              R.assoc(type, Expression.newLiteral()),
              R.assoc('operator', ''),
              R.assoc(BinaryOperandType.right, Expression.newIdentifier()),
            )(node)
            : R.assoc(type, Expression.newLiteral(), node)

          onChange(nodeUpdate)
        }}>
        {i18n.t('expressionEditor.const')}
      </button>

      <ExpressionNode
        {...props}
        type={type}
        node={nodeOperand}
        onChange={item => onChange(
          R.assoc(type, item, node)
        )}
      />

    </>
  )
}

export default BinaryOperand