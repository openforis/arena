import * as A from '@core/arena'

import { keys } from './keys'

// ====== CREATE
export const create = () => ({
  [keys.limit]: 15,
  [keys.offset]: 0,
  [keys.nodeDefUuidTable]: null,
  [keys.nodeDefUuidCols]: [],
  [keys.dimensions]: [],
  [keys.measures]: new Map(),
})

// ====== READ
export const getLimit = A.prop(keys.limit)
export const getOffset = A.prop(keys.offset)
export const getNodeDefUuidTable = A.prop(keys.nodeDefUuidTable)
export const getNodeDefUuidCols = A.prop(keys.nodeDefUuidCols)
export const getDimensions = A.prop(keys.dimensions)
export const getMeasures = A.prop(keys.measures)
