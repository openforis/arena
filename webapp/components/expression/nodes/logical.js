import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import { useI18n } from '@webapp/store/system'

const Logical = (props) => {
  const { canDelete, node, nodeDefCurrent, isBoolean, level, onChange, renderNode, variables } = props
  const { left, right, operator } = node
  const { logical } = Expression.operators

  const i18n = useI18n()

  const createElementNode = (type, nodeEl, nodeElOther, canDeleteEl) =>
    React.createElement(renderNode, {
      node: nodeEl,
      onChange: (item) => onChange(R.assoc(type, item, node)),
      onDelete: () => onChange(nodeElOther),
      canDelete: canDeleteEl,
      nodeDefCurrent,
      isBoolean,
      level,
      variables,
    })

  return (
    <div className="logical">
      {createElementNode('left', left, right, canDelete)}

      <div className="btns">
        <div className="btns__add">
          <button
            type="button"
            className={`btn btn-s${operator === logical.or.value ? ' active' : ''}`}
            onClick={() => onChange(R.assoc('operator', logical.or.value, node))}
          >
            {i18n.t('expressionEditor.or')}
          </button>
          <button
            type="button"
            className={`btn btn-s${operator === logical.and.value ? ' active' : ''}`}
            onClick={() => onChange(R.assoc('operator', logical.and.value, node))}
          >
            {i18n.t('expressionEditor.and')}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-s btns__last"
          onClick={() =>
            onChange({
              type: Expression.types.SequenceExpression,
              expression: node,
            })
          }
        >
          {i18n.t('expressionEditor.group')} ()
        </button>
      </div>

      {createElementNode('right', right, left, true)}
    </div>
  )
}

Logical.propTypes = {
  node: PropTypes.any.isRequired,
  onChange: PropTypes.func.isRequired,
  renderNode: PropTypes.elementType.isRequired,
  // ExpressionNode props
  canDelete: PropTypes.bool,
  nodeDefCurrent: PropTypes.any,
  isBoolean: PropTypes.bool,
  level: PropTypes.number,
  variables: PropTypes.array,
}

Logical.defaultProps = {
  canDelete: false,
  isBoolean: false,
  level: 0,
  nodeDefCurrent: null,
  variables: null,
}

export default Logical
