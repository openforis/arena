import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '../../hooks'

const Logical = (props) => {
  const { canDelete, node, nodeDefCurrent, isBoolean, level, onChange, renderNode, variables } = props
  const { left, right, operator } = node
  const { logical } = Expression.operators

  const i18n = useI18n()

  const createElementNode = (type, nodeEl, nodeElOther) =>
    React.createElement(renderNode, {
      node: nodeEl,
      onChange: (item) => onChange(R.assoc(type, item, node)),
      onDelete: () => onChange(nodeElOther),
      canDelete,
      nodeDefCurrent,
      isBoolean,
      level,
      variables,
    })

  return (
    <div className="logical">
      {createElementNode('left', left, right)}

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

      {createElementNode('right', right, left)}
    </div>
  )
}

Logical.propTypes = {
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  renderNode: PropTypes.elementType.isRequired,
  // ExpressionNode props
  canDelete: PropTypes.func,
  nodeDefCurrent: PropTypes.any.isRequired,
  isBoolean: PropTypes.bool,
  level: PropTypes.any,
  variables: PropTypes.array,
}

Logical.defaultProps = {
  canDelete: null,
  isBoolean: false,
  level: null,
  variables: null,
}

export default Logical
