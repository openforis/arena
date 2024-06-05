import React from 'react'

import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'
import { Button, ButtonDelete } from '@webapp/components/buttons'

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
        <Button
          iconClassName="icon-plus icon-8px"
          label="expressionEditor.or"
          onClick={() => addLogicalExpr(logical.or.value)}
          size="small"
          variant="outlined"
        />
        <Button
          iconClassName="icon-plus icon-8px"
          label="expressionEditor.and"
          onClick={() => addLogicalExpr(logical.and.value)}
          size="small"
          variant="outlined"
        />
      </div>

      {canDelete && <ButtonDelete className="btns__delete" onClick={onDelete} showLabel={false} size="small" />}
    </div>
  )
}

export default EditButtons
