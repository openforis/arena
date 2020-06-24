import { displayTypes, keys, modes } from './keys'

export const defaults = {
  [keys.mode]: modes.raw,
  [keys.displayType]: displayTypes.table,
  [keys.filter]: null,
  [keys.sort]: [],
  [keys.nodeDefUuidTable]: null,
  [keys.nodeDefUuidCols]: [],
  [keys.dimensions]: [],
  [keys.measures]: new Map(),
}
