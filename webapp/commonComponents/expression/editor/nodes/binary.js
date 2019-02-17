import React from 'react'
import * as R from 'ramda'

import Expression from '../../../../../common/exprParser/expression'

import Dropdown from '../../../form/dropdown'

import EditButtons from './editButtons'
import ExpressionNode from './expressionNode'

const BinaryOperand = ({ type, node, ...props }) => {
  const { isBoolean, onChange } = props
  const nodeOperand = R.prop(type, node)

  return (
    <React.Fragment>
      <button
        className={`btn btn-s btn-of-light btn-switch-operand${Expression.isIdentifier(nodeOperand) ? ' active' : ''}`}
        onClick={() => onChange(
          R.assoc(type, Expression.newIdentifier(), node)
        )}>
        Var
      </button>
      <button
        className={`btn btn-s btn-of-light btn-switch-operand${Expression.isLiteral(nodeOperand) ? ' active' : ''}`}
        aria-disabled={type === 'left' && isBoolean}
        onClick={() => onChange(
          R.assoc(type, Expression.newLiteral(), node)
        )}>
        Const
      </button>

      <ExpressionNode {...props} node={nodeOperand}
                      onChange={item => onChange(R.assoc(type, item, node))}/>
    </React.Fragment>
  )
}

const Binary = (props) => {
  const {
    node, onChange,
    canDelete = false, onDelete,
    isBoolean
  } = props

  const isLeftIdentifier = R.pipe(
    R.prop('left'),
    Expression.isIdentifier
  )(node)

  return (
    <div className="binary">

      <BinaryOperand {...props} type="left"/>

      {
        isLeftIdentifier &&
        <React.Fragment>


          <Dropdown items={Expression.operators.binaryValues} inputSize={10}
                    selection={Expression.operators.findBinary(node.operator)}
                    onChange={item => onChange(
                      R.assoc('operator', R.propOr('', 'key', item), node)
                    )}/>

          <BinaryOperand {...props} type="right"/>

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