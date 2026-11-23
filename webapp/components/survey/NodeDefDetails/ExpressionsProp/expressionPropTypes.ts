import type { ArenaValidation } from '@openforis/arena-core'

// expression editor settings passed down from the node def expressions prop to each expression editor
export type ExpressionEditorSettingsProps = {
  applyIf?: boolean // show the "apply if" expression editor
  canBeConstant?: boolean
  excludeCurrentNodeDef?: boolean
  hideAdvanced?: boolean
  isBoolean?: boolean
  isContextParent?: boolean
  mode?: string
  nodeDefUuidContext?: string
  nodeDefUuidCurrent?: string
  qualifier: string // used to generate test ids
  readOnly?: boolean
  severity?: boolean
  showLabels?: boolean
  validation?: ArenaValidation
}
