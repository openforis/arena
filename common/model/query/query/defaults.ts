import { Sort } from '../sort'
import type { SortItem } from '../sort/sort'

import { displayTypes, keys, modes } from './keys'

export interface QueryItem {
  mode: string
  displayType: string
  filter: Record<string, any> | null
  sort: SortItem
  entityDefUuid: string | null
  attributeDefUuids: string[]
  dimensions: string[]
  // aggregate function names (or custom aggregate function uuids) by measure node def uuid
  measures: Record<string, string[]>
  filterRecordUuid?: string | null
  filterRecordUuids?: string[]
}

export const defaults: QueryItem = {
  [keys.mode]: modes.raw,
  [keys.displayType]: displayTypes.table,
  [keys.filter]: null,
  [keys.sort]: Sort.create(),
  [keys.entityDefUuid]: null,
  [keys.attributeDefUuids]: [],
  [keys.dimensions]: [],
  [keys.measures]: {},
}
