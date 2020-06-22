import * as A from '@core/arena'

import { Table } from '../table'
import { keys, displayModes } from './keys'

// ====== CREATE
export const create = () => ({
  [keys.displayMode]: displayModes.tableRaw,
  [keys.filter]: null,
  [keys.sort]: [],
  [keys.table]: Table.create(),
})

// ====== READ
export const getDisplayMode = A.prop(keys.displayMode)
export const getFilter = A.prop(keys.filter)
export const getSort = A.prop(keys.sort)
export const getTable = A.prop(keys.table)
