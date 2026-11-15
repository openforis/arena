import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'

export interface StatisticalAnalysis {
  clusteringOnlyVariances?: boolean
  dimensionUuids?: string[]
  entityUuid?: string
  filter?: string
  nonResponseBiasCorrection?: boolean
  pValue?: number | null
  reportingMethod?: string
  reportingArea?: number
}

type StatisticalAnalysisUpdater = (statisticalAnalysis: StatisticalAnalysis) => StatisticalAnalysis

const keys = {
  clusteringOnlyVariances: 'clusteringOnlyVariances',
  dimensionUuids: 'dimensionUuids',
  entityDefUuid: 'entityUuid',
  filter: 'filter',
  nonResponseBiasCorrection: 'nonResponseBiasCorrection',
  pValue: 'pValue',
  reportingMethod: 'reportingMethod',
  reportingArea: 'reportingArea',
} as const

const reportingMethods = {
  1: 'dimensionsCombined',
  2: 'dimensionsSeparate',
}

const pValues = [0.99, 0.98, 0.95, 0.9, 0.8]
const pValueDefault = 0.95

type Getter<T> = (statisticalAnalysis: StatisticalAnalysis) => T

const isPropTrue =
  (prop: keyof StatisticalAnalysis): Getter<boolean> =>
  (statisticalAnalysis) =>
    A.prop(prop)(statisticalAnalysis) === true

const isClusteringOnlyVariances = isPropTrue(keys.clusteringOnlyVariances)

const getDimensionUuids: Getter<string[]> = A.propOr([], keys.dimensionUuids)

const getEntityDefUuid: Getter<string | undefined> = A.prop(keys.entityDefUuid)

const getFilter: Getter<string | undefined> = A.prop(keys.filter)

const getPValue: Getter<number | null> = A.propOr(pValueDefault, keys.pValue)

const isNonResponseBiasCorrection = isPropTrue(keys.nonResponseBiasCorrection)

const getReportingMethod: Getter<string | undefined> = A.prop(keys.reportingMethod)

const getReportingArea: Getter<number | undefined> = A.prop(keys.reportingArea)

const isEmpty = (statisticalAnalysis: StatisticalAnalysis): boolean =>
  !getEntityDefUuid(statisticalAnalysis) &&
  getDimensionUuids(statisticalAnalysis).length === 0 &&
  StringUtils.isBlank(getFilter(statisticalAnalysis)) &&
  !getReportingMethod(statisticalAnalysis)

const assocProp =
  (prop: keyof StatisticalAnalysis, value: unknown): StatisticalAnalysisUpdater =>
  (statisticalAnalysis) =>
    A.assoc(prop, value)(statisticalAnalysis)

const assocClusteringOnlyVariances = (clusteringOnlyVariances: boolean) =>
  assocProp(keys.clusteringOnlyVariances, clusteringOnlyVariances)

const assocDimensionUuids = (dimensionUuids: string[]) => assocProp(keys.dimensionUuids, dimensionUuids)

// resets the dimensions too
const assocEntityDefUuid =
  (entityDefUuid: string | null): StatisticalAnalysisUpdater =>
  (statisticalAnalysis) =>
    assocDimensionUuids([])(assocProp(keys.entityDefUuid, entityDefUuid)(statisticalAnalysis))

const assocFilter = (filter: string | null) => assocProp(keys.filter, filter)

const assocNonResponseBiasCorrection = (nonResponseBiasCorrection: boolean) =>
  assocProp(keys.nonResponseBiasCorrection, nonResponseBiasCorrection)

const assocPValue = (pValue: number | null) => assocProp(keys.pValue, pValue)
const resetPValue = assocPValue(null)

const assocReportingMethod = (reportingMethod: string | null) => assocProp(keys.reportingMethod, reportingMethod)

const assocReportingArea = (reportingArea: number | null) => assocProp(keys.reportingArea, reportingArea)

export const ChainStatisticalAnalysis = {
  keys,
  pValues,
  reportingMethods,

  isClusteringOnlyVariances,
  getDimensionUuids,
  getEntityDefUuid,
  getFilter,
  getPValue,
  getReportingMethod,
  getReportingArea,
  isNonResponseBiasCorrection,
  isEmpty,

  assocClusteringOnlyVariances,
  assocDimensionUuids,
  assocEntityDefUuid,
  assocFilter,
  assocNonResponseBiasCorrection,
  assocPValue,
  resetPValue,
  assocReportingMethod,
  assocReportingArea,
}
