import React from 'react'

import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './callSingleParameterEditor'
import { CallEditorPropTypes } from './callEditorPropTypes'

export const CallIsNotEmptyEditor = (props) => {
  const { expressionNode, onConfirm, variables } = props
  return (
    <CallSingleParameterEditor
      callee={Expression.functionNames.isNotEmpty}
      expressionNode={expressionNode}
      onConfirm={onConfirm}
      variables={variables}
    />
  )
}

CallIsNotEmptyEditor.propTypes = CallEditorPropTypes
