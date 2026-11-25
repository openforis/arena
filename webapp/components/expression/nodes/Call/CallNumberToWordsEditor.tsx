import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import type { CallEditorProps } from './callEditorProps'
import { CallSingleParameterEditor } from './CallSingleParameterEditor'

const numericVarFilterFn = (variable) =>
  variable.root || [NodeDef.nodeDefType.decimal, NodeDef.nodeDefType.integer].includes(variable.nodeDefType)

export const CallNumberToWordsEditor = (props: CallEditorProps) => {
  const { expressionNode, onConfirm, variables } = props
  return (
    <CallSingleParameterEditor
      callee={Expression.functionNames.numberToWords}
      expressionNode={expressionNode}
      onConfirm={onConfirm}
      variables={variables}
      variablesFilterFn={numericVarFilterFn}
    />
  )
}
