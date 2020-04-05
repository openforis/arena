import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '../../hooks'

const Logical = (props) => {
  const { node, onChange, expressionNodeRenderer } = props
  const { left, right, operator } = node
  const { logical } = Expression.operators

  const i18n = useI18n()

  return (
    <div className="logical">
      {React.createElement(expressionNodeRenderer, {
        ...props,
        node: left,
        onChange: (item) => onChange(R.assoc('left', item, node)),
        onDelete: () => onChange(right),
      })}

      <div className="btns">
        <div className="btns__add">
          <button
            type="button"
            className={`btn btn-s${operator === logical.or.key ? ' active' : ''}`}
            onClick={() => onChange(R.assoc('operator', logical.or.key, node))}
          >
            {i18n.t('expressionEditor.or')}
          </button>
          <button
            type="button"
            className={`btn btn-s${operator === logical.and.key ? ' active' : ''}`}
            onClick={() => onChange(R.assoc('operator', logical.and.key, node))}
          >
            {i18n.t('expressionEditor.and')}
          </button>
        </div>

        <button
          type="button"
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

      {React.createElement(expressionNodeRenderer, {
        ...props,
        node: right,
        onChange: (item) => onChange(R.assoc('right', item, node)),
        onDelete: () => onChange(left),
      })}
    </div>
  )
}

Logical.propTypes = {
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  expressionNodeRenderer: PropTypes.func.isRequired,
}

export default Logical
