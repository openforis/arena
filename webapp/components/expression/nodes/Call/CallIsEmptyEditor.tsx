import * as Expression from '@core/expressionParser/expression'

import type { CallEditorProps } from './callEditorProps'
import { CallSingleParameterEditor } from './CallSingleParameterEditor'

export const CallIsEmptyEditor = (props: CallEditorProps) => {
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
