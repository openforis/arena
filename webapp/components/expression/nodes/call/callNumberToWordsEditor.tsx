import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'

import { CallSingleParameterEditor } from './callSingleParameterEditor'
import type { CallEditorProps } from './callEditorProps'

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
