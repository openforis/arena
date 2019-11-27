import React from 'react'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '../../hooks'

import ExpressionNode from './expressionNode'

const Logical = props => {
  const { node, onChange, canDelete = false } = props
  const { left, right, operator } = node
  const { logical } = Expression.operators

  const i18n = useI18n()

  return (
    <div className="logical">
      <ExpressionNode
        {...props}
        node={left}
        canDelete={canDelete}
        onChange={item => onChange(R.assoc('left', item, node))}
        onDelete={() => onChange(right)}
      />

      <div className="btns">
        <div className="btns__add">
          <button
            className={`btn btn-s${
              operator === logical.or.key ? ' active' : ''
            }`}
            onClick={() => onChange(R.assoc('operator', logical.or.key, node))}
          >
            {i18n.t('expressionEditor.or')}
          </button>
          <button
            className={`btn btn-s${
              operator === logical.and.key ? ' active' : ''
            }`}
            onClick={() => onChange(R.assoc('operator', logical.and.key, node))}
          >
            {i18n.t('expressionEditor.and')}
          </button>
        </div>

        <button
          className="btn btn-s btns__last"
          onClick={() =>
            onChange({
              type: Expression.types.GroupExpression,
              argument: node,
            })
          }
        >
          {i18n.t('expressionEditor.group')} ()
        </button>
      </div>

      <ExpressionNode
        {...props}
        node={right}
        canDelete={true}
        onChange={item => onChange(R.assoc('right', item, node))}
        onDelete={() => onChange(left)}
      />
    </div>
  )
}

export default Logical
