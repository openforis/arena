import React from 'react'

import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './callSingleParameterEditor'
import { CallEditorPropTypes } from './callEditorPropTypes'

const isEmptyCallCreator = (identifier) => {
  const params = [identifier]
  return Expression.newCall({ callee: Expression.functionNames.isEmpty, params })
}

export const CallIsEmptyEditor = (props) => {
  const { expressionNode, onConfirm, variables } = props
  return (
    <CallSingleParameterEditor
      expressionNode={expressionNode}
      functionCallCreator={isEmptyCallCreator}
      onConfirm={onConfirm}
      variables={variables}
    />
  )
}

CallIsEmptyEditor.propTypes = CallEditorPropTypes
