import type { ArenaAnyNodeDef, ArenaRecordNode } from '@openforis/arena-core'

// props passed by NodeDefSwitch (through NodeDefFormItem / NodeDefTableCellBody) to the node def components
export type NodeDefComponentProps = {
  canEditRecord?: boolean
  edit?: boolean
  entry?: boolean
  entryDataQuery?: boolean
  insideTable?: boolean
  nodeDef: ArenaAnyNodeDef
  nodes?: ArenaRecordNode[]
  parentNode?: ArenaRecordNode
  readOnly?: boolean
  renderType?: string
  surveyInfo?: Record<string, any>
  updateNode: (...args: any[]) => any
  removeNode?: (...args: any[]) => any
}

// key and qualifier fields lock (in data entry)
export type NodeDefFieldLockProps = {
  keyFieldLocked?: boolean
  keyFieldLockVisible?: boolean
  onKeyFieldBlur?: (...args: any[]) => any
  onKeyFieldFocus?: (...args: any[]) => any
  onKeyFieldLockToggle?: (...args: any[]) => any
  qualifierFieldLocked?: boolean
  qualifierFieldLockVisible?: boolean
  onQualifierFieldBlur?: (...args: any[]) => any
  onQualifierFieldFocus?: (...args: any[]) => any
  onQualifierFieldLockToggle?: (...args: any[]) => any
}
