import React from 'react'

import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './callSingleParameterEditor'
import { CallEditorPropTypes } from './callEditorPropTypes'

export const CallIsEmptyEditor = (props) => {
  const { expressionNode, onConfirm, variables } = props
  return (
    <CallSingleParameterEditor
      callee={Expression.functionNames.isEmpty}
      expressionNode={expressionNode}
      onConfirm={onConfirm}
      variables={variables}
    />
  )
}

CallIsEmptyEditor.propTypes = CallEditorPropTypes
