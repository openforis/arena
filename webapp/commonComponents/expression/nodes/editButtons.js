import React from 'react'

import Expression from '../../../../common/exprParser/expression'

const EditButtons = (props) => {

  const {
    node, onChange,
    canDelete = false, onDelete,
  } = props

  const addLogicalExpr = (operator) => onChange(
    {
      type: Expression.types.LogicalExpression,
      operator,
      left: node,
      right: {
        type: Expression.types.BinaryExpression, operator: '',
        left: { type: Expression.types.Identifier, name: '' },
        right: { type: Expression.types.Literal, value: null, raw: '' }
      }
    }
  )

  const { logical } = Expression.operators

  return (
    <div className="btns">
      <div className="btns__add">
        <button className="btn btn-s"
                onClick={() => addLogicalExpr(logical.or.value)}>
          <span className="icon icon-plus icon-8px"/> OR
        </button>
        <button className="btn btn-s"
                onClick={() => addLogicalExpr(logical.and.value)}>
          <span className="icon icon-plus icon-8px"/> AND
        </button>
      </div>

      <button className="btn btn-s btn-delete btns__last"
              onClick={onDelete}
              aria-disabled={!canDelete}>
        <span className="icon icon-bin icon-10px"/>
      </button>
    </div>
  )
}

export default EditButtons