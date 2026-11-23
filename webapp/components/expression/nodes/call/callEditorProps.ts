export type CallEditorProps = {
  expressionNode?: Record<string, any>
  onConfirm: (...args: any[]) => any
  variables: any[]
  variablesFilterFn?: (...args: any[]) => any
}
