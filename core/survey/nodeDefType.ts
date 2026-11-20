import { NodeDefType } from '@openforis/arena-core'

// Same values as NodeDefType; this key order is the one shown to the user (e.g. node def type selection).
export const nodeDefType: Readonly<Record<keyof typeof NodeDefType, NodeDefType>> = {
  integer: NodeDefType.integer,
  decimal: NodeDefType.decimal,
  text: NodeDefType.text,
  date: NodeDefType.date,
  time: NodeDefType.time,
  boolean: NodeDefType.boolean,
  code: NodeDefType.code,
  coordinate: NodeDefType.coordinate,
  geo: NodeDefType.geo,
  taxon: NodeDefType.taxon,
  file: NodeDefType.file,
  entity: NodeDefType.entity,
  // layout elements
  formHeader: NodeDefType.formHeader,
}
