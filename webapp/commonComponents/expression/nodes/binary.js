import React from 'react'
import * as R from 'ramda'

import Expression from '../../../../common/exprParser/expression'

import Dropdown from '../../form/dropdown'

import EditButtons from './editButtons'
import ExpressionNode from './expressionNode'

import useI18n from '../../useI18n'

const BinaryOperand = ({ type, node, ...props }) => {
  const { isBoolean, onChange } = props
  const nodeOperand = R.prop(type, node)
  const isLeft = type === 'left'

  const i18n = useI18n()

  return (
    <React.Fragment>
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
              R.assoc('right', Expression.newIdentifier()),
            )(node)
            : R.assoc(type, Expression.newLiteral(), node)

          onChange(nodeUpdate)
        }}>
        {i18n.t('expressionEditor.const')}
      </button>

      <ExpressionNode
        {...props}
        node={nodeOperand}
        onChange={item => onChange(
          R.assoc(type, item, node)
        )}/>

    </React.Fragment>
  )
}

const Binary = (props) => {
  const {
    node, onChange,
    canDelete = false, onDelete,
    isBoolean
  } = props

  const isLeftLiteral = R.pipe(
    R.prop('left'),
    Expression.isLiteral
  )(node)

  return (
    <div className="binary">

      <BinaryOperand {...props} type="left"/>

      {
        (isBoolean || !isLeftLiteral) &&
        <React.Fragment>


          <Dropdown
            items={Expression.operators.binaryValues}
            selection={Expression.operators.findBinary(node.operator)}
            onChange={item => onChange(
              R.assoc('operator', R.propOr('', 'key', item), node)
            )}
          />

          <BinaryOperand {...R.dissoc('literalSearchParams', props)} type="right"/>

          {
            isBoolean &&
            <EditButtons node={node} onChange={onChange}
                         onDelete={onDelete} canDelete={canDelete}/>
          }
        </React.Fragment>
      }

    </div>
  )
}

export default Binary