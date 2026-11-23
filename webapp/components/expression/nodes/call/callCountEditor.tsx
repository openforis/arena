import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './callSingleParameterEditor'
import type { CallEditorProps } from './callEditorProps'

export const CallCountEditor = (props: CallEditorProps) => {
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
