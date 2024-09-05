import React from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import ExpressionsProp from './ExpressionsProp'

import { State } from '../store'

const NodeDefExpressionsProp = (props) => {
  const {
    Actions,
    applyIf = true,
    canBeConstant = false,
    excludeCurrentNodeDef = false,
    hideAdvanced = false,
    isBoolean = true,
    isContextParent = false,
    label = '',
    mode = Expression.modes.json,
    multiple = true,
    nodeDefUuidContext = null,
    propName,
    qualifier,
    readOnly = false,
    showLabels = false,
    state,
  } = props

  const nodeDef = State.getNodeDef(state)
  const nodeDefValidation = State.getValidation(state)

  const values = NodeDef.getPropAdvanced(propName, [])(nodeDef)

  const onChange = (expressions) =>
    Actions.setProp({ state, key: propName, value: R.reject(NodeDefExpression.isPlaceholder, expressions) })

  return (
    <ExpressionsProp
      qualifier={qualifier}
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
      excludeCurrentNodeDef={excludeCurrentNodeDef}
    />
  )
}

NodeDefExpressionsProp.propTypes = {
  qualifier: PropTypes.string.isRequired, // used to generate test ids

  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,

  nodeDefUuidContext: PropTypes.string,
  propName: PropTypes.string.isRequired,
  label: PropTypes.string,
  mode: PropTypes.string,

  applyIf: PropTypes.bool,
  showLabels: PropTypes.bool,
  multiple: PropTypes.bool,
  readOnly: PropTypes.bool,

  isContextParent: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  isBoolean: PropTypes.bool,
  hideAdvanced: PropTypes.bool,
  excludeCurrentNodeDef: PropTypes.bool,
}

export default NodeDefExpressionsProp
