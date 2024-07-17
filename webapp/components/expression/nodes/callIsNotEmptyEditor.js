import React from 'react'

import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './callSingleParameterEditor'
import { CallEditorPropTypes } from './callEditorPropTypes'

const isNotEmptyCallCreator = (identifier) => {
  const params = [identifier]
  return Expression.newCall({ callee: Expression.functionNames.isNotEmpty, params })
}

export const CallIsNotEmptyEditor = (props) => {
  const { expressionNode, onConfirm, variables } = props
  return (
    <CallSingleParameterEditor
      expressionNode={expressionNode}
      functionCallCreator={isNotEmptyCallCreator}
      onConfirm={onConfirm}
      variables={variables}
    />
  )
}

CallIsNotEmptyEditor.propTypes = CallEditorPropTypes
