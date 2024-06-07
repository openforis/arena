import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'

import { Button } from '@webapp/components/buttons'

const Logical = (props) => {
  const { canDelete, node, nodeDefCurrent, isBoolean, level, onChange, renderNode, variables } = props
  const { left, right, operator } = node
  const { logical } = Expression.operators

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
          {Object.entries(logical).map(([logicalOperatorKey, logicalOperator]) => (
            <Button
              key={logicalOperatorKey}
              active={operator === logicalOperator.value}
              label={`expressionEditor.${logicalOperatorKey}`}
              onClick={() => onChange(R.assoc('operator', logicalOperator.value, node))}
              size="small"
              variant="outlined"
            />
          ))}
        </div>

        <Button
          label="expressionEditor.group"
          onClick={() =>
            onChange({
              type: Expression.types.SequenceExpression,
              expression: node,
            })
          }
          size="small"
          variant="outlined"
        />
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
