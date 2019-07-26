import React from 'react'
import * as R from 'ramda'

import Expression from '../../../../common/exprParser/expression'

import BinaryOperand, { BinaryOperandType } from './binaryOperand'
import EditButtons from './editButtons'
import Dropdown from '../../form/dropdown'

const Binary = (props) => {
  const {
    node, onChange,
    canDelete = false, onDelete,
    isBoolean
  } = props

  const isLeftLiteral = R.pipe(
    R.prop(BinaryOperandType.left),
    Expression.isLiteral
  )(node)

  return (
    <div className="binary">
      <BinaryOperand
        {...props}
        type={BinaryOperandType.left}
      />

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

          <BinaryOperand
            {...props}
            type={BinaryOperandType.right}
          />

          {
            isBoolean &&
            <EditButtons
              node={node}
              onChange={onChange}
              onDelete={onDelete}
              canDelete={canDelete}
            />
          }
        </React.Fragment>
      }

    </div>
  )
}

export default Binary