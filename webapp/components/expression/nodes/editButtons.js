import React from 'react'

import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'

const EditButtons = (props) => {
  const { node, onChange, canDelete = false, onDelete } = props

  const i18n = useI18n()

  const addLogicalExpr = (operator) =>
    onChange({
      type: Expression.types.BinaryExpression,
      operator,
      left: node,
      right: {
        type: Expression.types.BinaryExpression,
        operator: '',
        left: { type: Expression.types.Identifier, name: '' },
        right: { type: Expression.types.Literal, value: null, raw: '' },
      },
    })

  const { logical } = Expression.operators

  return (
    <div className="btns">
      <div className="btns__add">
        <button className="btn btn-s" onClick={() => addLogicalExpr(logical.or.value)}>
          <span className="icon icon-plus icon-8px" /> {i18n.t('expressionEditor.or')}
        </button>
        <button className="btn btn-s" onClick={() => addLogicalExpr(logical.and.value)}>
          <span className="icon icon-plus icon-8px" /> {i18n.t('expressionEditor.and')}
        </button>
      </div>

      <button className="btn btn-s btn-danger btns__last" onClick={onDelete} aria-disabled={!canDelete}>
        <span className="icon icon-bin icon-10px" />
      </button>
    </div>
  )
}

export default EditButtons
