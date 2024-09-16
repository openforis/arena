import React from 'react'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'

import ExpressionEditor from '@webapp/components/expression/expressionEditor'
import ValidationTooltip from '@webapp/components/validationTooltip'

export const NodeDefSingleExpressionProp = (props) => {
  const {
    canBeConstant = false,
    excludeCurrentNodeDef = false,
    isBoolean = false,
    nodeDef,
    onChange,
    qualifier,
    query,
    validation = null,
  } = props
  return (
    <div className="node-def-edit__expressions">
      <ValidationTooltip validation={validation} showKeys={false}>
        <div className="node-def-edit__expression">
          <ExpressionEditor
            canBeConstant={canBeConstant}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            isBoolean={isBoolean}
            isContextParent
            nodeDefUuidContext={NodeDef.getParentUuid(nodeDef)}
            nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
            onChange={({ query, callback }) => {
              onChange({ query })
              callback()
            }}
            qualifier={qualifier}
            query={query}
          />
        </div>
      </ValidationTooltip>
    </div>
  )
}

NodeDefSingleExpressionProp.propTypes = {
  canBeConstant: PropTypes.bool,
  excludeCurrentNodeDef: PropTypes.bool,
  isBoolean: PropTypes.bool,
  nodeDef: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  qualifier: PropTypes.string.isRequired,
  query: PropTypes.string, // String representing the expression
  validation: PropTypes.object,
}
