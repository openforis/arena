import React from 'react'
import * as R from 'ramda'

import NodeDef from '@core/survey/nodeDef'
import NodeDefExpression from '@core/survey/nodeDefExpression'
import Validation from '@core/validation/validation'

import ExpressionsProp from './expressionsProp'

const NodeDefExpressionsProp = props => {
  const {
    nodeDef, nodeDefUuidContext,
    propName, nodeDefValidation, label, multiple, applyIf, showLabels, readOnly, putNodeDefProp,
    isContextParent, canBeConstant, isBoolean,
  } = props

  const values = NodeDef.getProp(propName, [])(nodeDef)

  const onChange = expressions => {
    putNodeDefProp(
      nodeDef,
      propName,
      R.reject(NodeDefExpression.isPlaceholder, expressions),
      true
    )
  }

  return (
    <ExpressionsProp
      label={label}
      readOnly={readOnly}
      applyIf={applyIf}
      multiple={multiple}
      values={values}
      showLabels={showLabels}
      validation={Validation.getFieldValidation(propName)(nodeDefValidation)}
      onChange={onChange}
      nodeDefUuidContext={nodeDefUuidContext}
      nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
      isContextParent={isContextParent}
      canBeConstant={canBeConstant}
      isBoolean={isBoolean}
    />
  )

}

NodeDefExpressionsProp.defaultProps = {
  nodeDef: null,
  nodeDefValidation: {},
  nodeDefUuidContext: null,
  propName: null,
  label: '',

  applyIf: true,
  showLabels: false,
  multiple: true,
  readOnly: false,

  validation: null,
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,

}

export default NodeDefExpressionsProp