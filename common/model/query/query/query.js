import * as A from '@core/arena'

import { keys, modes, displayTypes } from './keys'
import { defaults } from './defaults'

export const aggregateFunctions = {
  avg: 'avg',
  cnt: 'cnt',
  max: 'max',
  // med: 'med',
  min: 'min',
  sum: 'sum',
}

// ====== CREATE
export const create = ({ entityDefUuid = null } = {}) => ({
  ...defaults,
  [keys.entityDefUuid]: entityDefUuid,
})

// ====== READ
export { displayTypes }
export const getMode = A.prop(keys.mode)
export const getDisplayType = A.prop(keys.displayType)
export const getFilter = A.prop(keys.filter)
export const getSort = A.prop(keys.sort)
export const getEntityDefUuid = A.prop(keys.entityDefUuid)
export const getAttributeDefUuids = A.prop(keys.attributeDefUuids)
export const getDimensions = A.prop(keys.dimensions)
export const getMeasures = A.prop(keys.measures)

// mode
const isMode = (mode) => (query) => getMode(query) === mode
export const isModeAggregate = isMode(modes.aggregate)
export const isModeRawEdit = isMode(modes.rawEdit)

// utils
export const hasSelection = (query) =>
  !A.isEmpty(getEntityDefUuid(query)) &&
  (isModeAggregate(query)
    ? !A.isEmpty(getMeasures(query)) && !A.isEmpty(getDimensions(query))
    : !A.isEmpty(getAttributeDefUuids(query)))

// ====== UPDATE
export const assocAttributeDefUuids = A.assoc(keys.attributeDefUuids)
export const assocDimensions = A.assoc(keys.dimensions)
export const assocMeasures = A.assoc(keys.measures)
export const assocFilter = A.assoc(keys.filter)
export const assocSort = A.assoc(keys.sort)

// mode
export const toggleModeAggregate = (query) => ({
  ...create({ entityDefUuid: getEntityDefUuid(query) }),
  [keys.mode]: isModeAggregate(query) ? modes.raw : modes.aggregate,
})
export const toggleModeEdit = (query) => ({
  ...query,
  [keys.mode]: isModeRawEdit(query) ? modes.raw : modes.rawEdit,
})

export const toggleMeasureAggregateFunction = ({ nodeDefUuid, aggregateFn }) => (query) => {
  const measures = getMeasures(query)
  const aggregateFns = measures.get(nodeDefUuid)
  const aggregateFnIndex = aggregateFns.indexOf(aggregateFn)
  const aggregateFnsUpdated = [...aggregateFns]
  if (aggregateFnIndex >= 0) {
    aggregateFnsUpdated.splice(aggregateFnIndex, 1)
  } else {
    aggregateFnsUpdated.push(aggregateFn)
  }
  return assocMeasures(measures.set(nodeDefUuid, aggregateFnsUpdated))(query)
}
