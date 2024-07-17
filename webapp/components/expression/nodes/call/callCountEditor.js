import React from 'react'

import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './callSingleParameterEditor'
import { CallEditorPropTypes } from './callEditorPropTypes'

export const CallCountEditor = (props) => {
  const { expressionNode, onConfirm, variables } = props
  return (
    <CallSingleParameterEditor
      callee={Expression.functionNames.count}
      expressionNode={expressionNode}
      onConfirm={onConfirm}
      variables={variables}
      variablesFilterFn={(variable) => variable.root || variable.multiple}
    />
  )
}

CallCountEditor.propTypes = CallEditorPropTypes
