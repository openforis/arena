import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './CallSingleParameterEditor'
import type { CallEditorProps } from './callEditorProps'

export const CallIsNotEmptyEditor = (props: CallEditorProps) => {
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
