import * as A from '@core/arena'
import { ArrayUtils } from '@core/arrayUtils'
import { defaults } from './defaults'
import { keys, modes, displayTypes } from './keys'

export const DEFAULT_AGGREGATE_FUNCTIONS = {
  avg: 'avg',
  cnt: 'cnt',
  max: 'max',
  med: 'med',
  min: 'min',
  sum: 'sum',
}

// ====== CREATE
export const create = ({
  entityDefUuid = null,
  displayType = defaults[keys.displayType],
  attributeDefUuids = [],
  filterRecordUuids = [],
} = {}) => ({
  ...defaults,
  [keys.displayType]: displayType,
  [keys.entityDefUuid]: entityDefUuid,
  [keys.attributeDefUuids]: attributeDefUuids,
  [keys.filterRecordUuids]: filterRecordUuids,
})

// ====== READ
export { displayTypes, modes }
export const getMode = A.prop(keys.mode)
export const getDisplayType = A.prop(keys.displayType)
export const getFilter = A.prop(keys.filter)
export const getFilterRecordUuid = A.prop(keys.filterRecordUuid)
export const getFilterRecordUuids = A.prop(keys.filterRecordUuids)
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
export const assocFilterRecordUuid = A.assoc(keys.filterRecordUuid)
export const assocFilterRecordUuids = A.assoc(keys.filterRecordUuids)
export const assocSort = A.assoc(keys.sort)
export const assocMode = A.assoc(keys.mode)

// mode
export const toggleModeAggregate = (query) => ({
  ...create({ entityDefUuid: getEntityDefUuid(query) }),
  [keys.mode]: isModeAggregate(query) ? modes.raw : modes.aggregate,
})
export const toggleModeEdit = (query) => ({
  ...query,
  [keys.mode]: isModeRawEdit(query) ? modes.raw : modes.rawEdit,
})

export const toggleMeasureAggregateFunction =
  ({ nodeDefUuid, aggregateFn }) =>
  (query) => {
    const measures = getMeasures(query)
    const aggregateFns = measures.get(nodeDefUuid)
    const aggregateFnsUpdated = ArrayUtils.addOrRemoveItem({ item: aggregateFn })(aggregateFns)
    return assocMeasures(measures.set(nodeDefUuid, aggregateFnsUpdated))(query)
  }
