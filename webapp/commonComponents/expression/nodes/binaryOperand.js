import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import { useI18n } from '../../hooks'

export const BinaryOperandType = {
  left: 'left',
  right: 'right',
}
BinaryOperandType.isLeft = R.equals(BinaryOperandType.left)
BinaryOperandType.isRight = R.equals(BinaryOperandType.right)

const BinaryOperand = (props) => {
  const { node, nodeDefCurrent, isBoolean, onChange, type, expressionNodeRenderer } = props
  const nodeOperand = R.prop(type, node)
  const isLeft = BinaryOperandType.isLeft(type)

  const i18n = useI18n()

  return (
    <>
      <button
        type="button"
        className={`btn btn-s btn-switch-operand${!Expression.isLiteral(nodeOperand) ? ' active' : ''}`}
        onClick={() => onChange(R.assoc(type, Expression.newIdentifier(), node))}
      >
        {i18n.t('expressionEditor.var')}
      </button>

      <button
        type="button"
        className={`btn btn-s btn-switch-operand${Expression.isLiteral(nodeOperand) ? ' active' : ''}`}
        aria-disabled={isLeft && isBoolean && !NodeDef.isBoolean(nodeDefCurrent)}
        onClick={() => {
          const nodeUpdate =
            isLeft && !isBoolean
              ? R.pipe(
                  R.assoc(type, Expression.newLiteral()),
                  R.assoc('operator', ''),
                  R.assoc(BinaryOperandType.right, Expression.newIdentifier())
                )(node)
              : R.assoc(type, Expression.newLiteral(), node)

          onChange(nodeUpdate)
        }}
      >
        {i18n.t('expressionEditor.const')}
      </button>

      {React.createElement(expressionNodeRenderer, {
        ...props,
        type,
        node: nodeOperand,
        onChange: (item) => onChange(R.assoc(type, item, node)),
      })}
    </>
  )
}

BinaryOperand.propTypes = {
  isBoolean: PropTypes.bool,
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  expressionNodeRenderer: PropTypes.func.isRequired,
}

BinaryOperand.defaultProps = {
  isBoolean: false,
}

export default BinaryOperand
