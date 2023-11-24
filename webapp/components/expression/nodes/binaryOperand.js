import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

export const BinaryOperandType = {
  left: 'left',
  right: 'right',
}
BinaryOperandType.isLeft = R.equals(BinaryOperandType.left)
BinaryOperandType.isRight = R.equals(BinaryOperandType.right)

const BinaryOperand = (props) => {
  const { canDelete, isBoolean, level, node, nodeDefCurrent, onChange, onDelete, type, renderNode, variables } = props

  const i18n = useI18n()

  const nodeOperand = R.prop(type, node)
  const isLeft = BinaryOperandType.isLeft(type)
  const canOperandBeLiteral = !isLeft || !isBoolean || NodeDef.isBoolean(nodeDefCurrent)

  return (
    <div className={`binary-${type}`}>
      <button
        type="button"
        className={`btn btn-s btn-switch-operand btn-switch-operand-var${
          !Expression.isLiteral(nodeOperand) ? ' active' : ''
        }`}
        onClick={() => onChange(R.assoc(type, Expression.newIdentifier(), node))}
      >
        {i18n.t('expressionEditor.var')}
      </button>

      {canOperandBeLiteral && (
        <button
          type="button"
          className={`btn btn-s btn-switch-operand btn-switch-operand-const${
            Expression.isLiteral(nodeOperand) ? ' active' : ''
          }`}
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
      )}
      {React.createElement(renderNode, {
        canDelete,
        isBoolean,
        level,
        expressionNodeParent: node,
        node: nodeOperand,
        nodeDefCurrent,
        onChange: (item) => onChange(R.assoc(type, item, node)),
        onDelete,
        type,
        variables,
      })}
    </div>
  )
}

BinaryOperand.propTypes = {
  isBoolean: PropTypes.bool,
  node: PropTypes.any.isRequired,
  nodeDefCurrent: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  renderNode: PropTypes.func.isRequired,
  // ExpressionNode props
  canDelete: PropTypes.bool,
  level: PropTypes.number,
  onDelete: PropTypes.func,
  variables: PropTypes.array,
}

BinaryOperand.defaultProps = {
  canDelete: false,
  isBoolean: false,
  level: 0,
  nodeDefCurrent: null,
  onDelete: null,
  variables: null,
}

export default BinaryOperand
