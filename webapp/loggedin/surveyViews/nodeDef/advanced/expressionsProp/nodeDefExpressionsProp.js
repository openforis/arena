import React from 'react'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import ExpressionsProp from './expressionsProp'

const NodeDefExpressionsProp = props => {
  const {
    nodeDef,
    nodeDefUuidContext,
    propName,
    nodeDefValidation,
    label,
    multiple,
    applyIf,
    showLabels,
    readOnly,
    isContextParent,
    canBeConstant,
    isBoolean,
    hideAdvanced,
    mode,
    setNodeDefProp,
  } = props

  const values = NodeDef.getPropAdvanced(propName, [])(nodeDef)

  const onChange = expressions => {
    setNodeDefProp(propName, R.reject(NodeDefExpression.isPlaceholder, expressions), true)
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
      mode={mode}
      onChange={onChange}
      nodeDefUuidContext={nodeDefUuidContext}
      nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
      isContextParent={isContextParent}
      canBeConstant={canBeConstant}
      isBoolean={isBoolean}
      hideAdvanced={hideAdvanced}
    />
  )
}

NodeDefExpressionsProp.defaultProps = {
  nodeDef: null,
  nodeDefValidation: {},
  nodeDefUuidContext: null,
  propName: null,
  label: '',
  mode: Expression.modes.json,

  applyIf: true,
  showLabels: false,
  multiple: true,
  readOnly: false,

  validation: null,
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,

  setNodeDefProp: null,
}

export default NodeDefExpressionsProp
