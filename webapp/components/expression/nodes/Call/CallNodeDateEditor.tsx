import * as Expression from '@core/expressionParser/expression'

import type { CallEditorProps } from './callEditorProps'
import { CallSingleParameterEditor } from './CallSingleParameterEditor'

// entities too: their date modified changes when any of their descendants is modified
const nodeVariablesFilterFn = () => true

type CallNodeDateEditorProps = CallEditorProps & {
  callee: string
}

const CallNodeDateEditor = (props: CallNodeDateEditorProps) => {
  const { callee, expressionNode, onConfirm, variables } = props
  return (
    <CallSingleParameterEditor
      callee={callee}
      expressionNode={expressionNode}
      label="expressionEditor.node"
      onConfirm={onConfirm}
      variables={variables}
      variablesFilterFn={nodeVariablesFilterFn}
    />
  )
}

export const CallNodeDateCreatedEditor = (props: CallEditorProps) => (
  <CallNodeDateEditor {...props} callee={Expression.functionNames.nodeDateCreated} />
)

export const CallNodeDateModifiedEditor = (props: CallEditorProps) => (
  <CallNodeDateEditor {...props} callee={Expression.functionNames.nodeDateModified} />
)
