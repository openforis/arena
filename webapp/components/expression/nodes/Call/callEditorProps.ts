export type CallEditorProps = {
  expressionNode?: Record<string, any>
  // node def the expression belongs to
  nodeDefCurrent?: Record<string, any> | null
  onConfirm: (...args: any[]) => any
  variables: any[]
  variablesFilterFn?: (...args: any[]) => any
}
