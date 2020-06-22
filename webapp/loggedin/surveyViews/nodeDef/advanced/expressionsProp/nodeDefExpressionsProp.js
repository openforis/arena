import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import ExpressionsProp from './expressionsProp'

import * as NodeDefState from '../../store/nodeDefState'
import { useActions } from '../../store/actions'

const NodeDefExpressionsProp = (props) => {
  const {
    nodeDefState,
    setNodeDefState,
    nodeDefUuidContext,
    propName,
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
  } = props

  const dispatch = useDispatch()

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const nodeDefValidation = NodeDefState.getValidation(nodeDefState)

  const values = NodeDef.getPropAdvanced(propName, [])(nodeDef)

  const { setNodeDefProp } = useActions({ nodeDefState, setNodeDefState })

  const onChange = (expressions) => {
    dispatch(setNodeDefProp(propName, R.reject(NodeDefExpression.isPlaceholder, expressions), true))
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

NodeDefExpressionsProp.propTypes = {
  nodeDefState: PropTypes.object.isRequired,
  setNodeDefState: PropTypes.func.isRequired,

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
}

NodeDefExpressionsProp.defaultProps = {
  nodeDefUuidContext: null,
  label: '',
  mode: Expression.modes.json,

  applyIf: true,
  showLabels: false,
  multiple: true,
  readOnly: false,

  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,
  hideAdvanced: false,
}

export default NodeDefExpressionsProp
