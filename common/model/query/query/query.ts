import * as A from '@core/arena'
import { ArrayUtils } from '@core/arrayUtils'

import { defaults, QueryItem } from './defaults'
import { keys, modes } from './keys'

type QueryUpdater = (query: QueryItem) => QueryItem
type QueryGetter<T> = (query: QueryItem) => T

export type { QueryItem } from './defaults'

export const DEFAULT_AGGREGATE_FUNCTIONS: Record<string, string> = {
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
}: {
  entityDefUuid?: string | null
  displayType?: string
  attributeDefUuids?: string[]
  filterRecordUuids?: string[]
} = {}): QueryItem => ({
  ...defaults,
  [keys.displayType]: displayType,
  [keys.entityDefUuid]: entityDefUuid,
  [keys.attributeDefUuids]: attributeDefUuids,
  [keys.filterRecordUuids]: filterRecordUuids,
})

// ====== READ
export { displayTypes, modes } from './keys'
const getPropOrDefault =
  <K extends keyof QueryItem>(key: K): QueryGetter<QueryItem[K]> =>
  (query) =>
    A.propOr(defaults[key], key)(query)
export const getMode: QueryGetter<string> = A.prop(keys.mode)
export const getDisplayType: QueryGetter<string> = A.prop(keys.displayType)
export const getFilter: QueryGetter<QueryItem['filter']> = A.prop(keys.filter)
export const getFilterRecordUuid: QueryGetter<string | null | undefined> = A.prop(keys.filterRecordUuid)
export const getFilterRecordUuids: QueryGetter<string[] | undefined> = A.prop(keys.filterRecordUuids)
export const getSort = getPropOrDefault(keys.sort)
export const getEntityDefUuid: QueryGetter<string | null> = A.prop(keys.entityDefUuid)
export const getAttributeDefUuids = getPropOrDefault(keys.attributeDefUuids)
export const getDimensions = getPropOrDefault(keys.dimensions)
export const getMeasures = getPropOrDefault(keys.measures)
export const getMeasuresKeys = (query: QueryItem): string[] => Object.keys(getMeasures(query))
export const getMeasureAggregateFunctions =
  (nodeDefUuid: string) =>
  (query: QueryItem): string[] =>
    getMeasures(query)?.[nodeDefUuid] ?? []

// mode
const isMode = (mode: string) => (query: QueryItem) => getMode(query) === mode
export const isModeAggregate = isMode(modes.aggregate)
export const isModeRaw = isMode(modes.raw)
export const isModeRawEdit = isMode(modes.rawEdit)

// utils
export const hasSelection = (query: QueryItem): boolean =>
  !A.isEmpty(getEntityDefUuid(query)) &&
  // aggregate: measures alone are one figure over all the rows
  (isModeAggregate(query) ? !A.isEmpty(getMeasures(query)) : !A.isEmpty(getAttributeDefUuids(query)))

// ====== UPDATE
const assocProp =
  <K extends keyof QueryItem>(key: K) =>
  (value: QueryItem[K]): QueryUpdater =>
  (query) =>
    A.assoc(key, value)(query)

export const assocAttributeDefUuids = assocProp(keys.attributeDefUuids)
export const assocDimensions = assocProp(keys.dimensions)
export const assocMeasures = assocProp(keys.measures)
export const assocFilter = assocProp(keys.filter)
export const assocFilterRecordUuid = assocProp(keys.filterRecordUuid)
export const assocFilterRecordUuids = assocProp(keys.filterRecordUuids)
export const assocSort = assocProp(keys.sort)

const resetNotApplicableProps = (query: QueryItem): QueryItem => {
  if (isModeAggregate(query)) {
    return assocAttributeDefUuids([])(query)
  }
  if (isModeRaw(query)) {
    return assocMeasures(defaults[keys.measures])(assocDimensions(defaults[keys.dimensions])(query))
  }
  return query
}

export const assocMode =
  (mode: string): QueryUpdater =>
  (query) => {
    const prevMode = getMode(query)
    let queryUpdated = resetNotApplicableProps(assocProp(keys.mode)(mode)(query))
    if (prevMode === modes.aggregate || mode === modes.aggregate) {
      // changing mode from raw to aggregate or vice versa: reset filter and sort
      queryUpdated = assocSort(defaults[keys.sort])(assocFilter(defaults[keys.filter])(queryUpdated))
    }
    return queryUpdated
  }

export const toggleMeasureAggregateFunction =
  ({ nodeDefUuid, aggregateFn }: { nodeDefUuid: string; aggregateFn: string }): QueryUpdater =>
  (query) => {
    const measures = getMeasures(query)
    const aggregateFns = measures[nodeDefUuid] ?? []
    const aggregateFnsUpdated = ArrayUtils.addOrRemoveItem({ item: aggregateFn })(aggregateFns)
    const measuresUpdated = { ...measures, [nodeDefUuid]: aggregateFnsUpdated }
    return assocMeasures(measuresUpdated)(query)
  }
