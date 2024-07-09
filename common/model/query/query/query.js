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
const getPropOrDefault = (key) => A.propOr(defaults[key], key)
export const getMode = A.prop(keys.mode)
export const getDisplayType = A.prop(keys.displayType)
export const getFilter = A.prop(keys.filter)
export const getFilterRecordUuid = A.prop(keys.filterRecordUuid)
export const getFilterRecordUuids = A.prop(keys.filterRecordUuids)
export const getSort = getPropOrDefault(keys.sort)
export const getEntityDefUuid = A.prop(keys.entityDefUuid)
export const getAttributeDefUuids = getPropOrDefault(keys.attributeDefUuids)
export const getDimensions = getPropOrDefault(keys.dimensions)
export const getMeasures = getPropOrDefault(keys.measures)
export const getMeasuresKeys = A.pipe(getMeasures, Object.keys)
export const getMeasureAggregateFunctions = (nodeDefUuid) => (query) => getMeasures(query)?.[nodeDefUuid] ?? []

// mode
const isMode = (mode) => (query) => getMode(query) === mode
export const isModeAggregate = isMode(modes.aggregate)
export const isModeRaw = isMode(modes.raw)
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

const resetNotApplicableProps = (query) => {
  if (isModeAggregate(query)) {
    return assocAttributeDefUuids([])(query)
  }
  if (isModeRaw(query)) {
    return A.pipe(assocDimensions(defaults[keys.dimensions]), assocMeasures(defaults[keys.measures]))(query)
  }
  return query
}

export const assocMode = (mode) =>
  A.pipe(
    A.assoc(keys.mode, mode),
    assocFilter(defaults[keys.filter]),
    assocSort(defaults[keys.sort]),
    resetNotApplicableProps
  )

export const toggleMeasureAggregateFunction =
  ({ nodeDefUuid, aggregateFn }) =>
  (query) => {
    const measures = getMeasures(query)
    const aggregateFns = measures[nodeDefUuid] ?? []
    const aggregateFnsUpdated = ArrayUtils.addOrRemoveItem({ item: aggregateFn })(aggregateFns)
    const measuresUpdated = { ...measures, [nodeDefUuid]: aggregateFnsUpdated }
    return assocMeasures(measuresUpdated)(query)
  }
