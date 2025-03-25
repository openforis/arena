import { Sort } from '../sort'

import { displayTypes, keys, modes } from './keys'

export const defaults = {
  [keys.mode]: modes.raw,
  [keys.displayType]: displayTypes.table,
  [keys.filter]: null,
  [keys.sort]: Sort.create(),
  [keys.entityDefUuid]: null,
  [keys.attributeDefUuids]: [],
  [keys.dimensions]: [],
  [keys.measures]: {},
}
