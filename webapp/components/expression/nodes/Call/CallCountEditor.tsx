import * as Expression from '@core/expressionParser/expression'

import type { CallEditorProps } from './callEditorProps'
import { CallSingleParameterEditor } from './CallSingleParameterEditor'

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
