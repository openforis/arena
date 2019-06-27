import React from 'react'
import * as R from 'ramda'

import Expression from '../../../../common/exprParser/expression'

import ExpressionNode from './expressionNode'

const Logical = (props) => {
  const { node, onChange, canDelete = false } = props
  const { left, right, operator } = node
  const { logical } = Expression.operators

  return (
    <div className="logical">
      <ExpressionNode {...props}
                      node={left}
                      canDelete={canDelete}
                      onChange={item => onChange(R.assoc('left', item, node))}
                      onDelete={() => onChange(right)}/>

      <div className="btns">

        <div className="btns__add">
          <button className={`btn btn-s${operator === logical.or.key ? ' active' : ''}`}
                  onClick={() => onChange(R.assoc('operator', logical.or.key, node))}>
            OR
          </button>
          <button className={`btn btn-s${operator === logical.and.key ? ' active' : ''}`}
                  onClick={() => onChange(R.assoc('operator', logical.and.key, node))}>
            AND
          </button>
        </div>

        <button className="btn btn-s btns__last"
                onClick={() => onChange({
                  type: Expression.types.GroupExpression,
                  argument: node,
                })}>
          group ()
        </button>
      </div>

      <ExpressionNode {...props}
                      node={right}
                      canDelete={true}
                      onChange={item => onChange(R.assoc('right', item, node))}
                      onDelete={() => onChange(left)}/>
    </div>
  )
}

export default Logical