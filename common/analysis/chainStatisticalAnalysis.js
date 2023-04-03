import { Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'

const keys = {
  clusteringOnlyVariances: 'clusteringOnlyVariances',
  dimensionUuids: 'dimensionUuids',
  entityDefUuid: 'entityUuid',
  filter: 'filter',
  nonResponseBiasCorrection: 'nonResponseBiasCorrection',
  pValue: 'pValue',
  reportingDataCategoryUuid: 'reportingDataCategoryUuid',
  reportingDataAttributeDefsByLevelUuid: 'reportingDataAttributeDefsByLevelUuid',
  reportingMethod: 'reportingMethod',
}

const reportingMethods = {
  1: 'dimensionsCombined',
  2: 'dimensionsSeparate',
}

const pValues = [0.99, 0.98, 0.95, 0.9, 0.8]
const pValueDefault = 0.95

const isPropTrue = (prop) => (obj) => A.prop(prop)(obj) === true

const isClusteringOnlyVariances = isPropTrue(keys.clusteringOnlyVariances)

const getDimensionUuids = A.propOr([], keys.dimensionUuids)

const getEntityDefUuid = A.prop(keys.entityDefUuid)

const getFilter = A.prop(keys.filter)

const getPValue = A.propOr(pValueDefault, keys.pValue)

const isNonResponseBiasCorrection = isPropTrue(keys.nonResponseBiasCorrection)

const getReportingDataCategoryUuid = A.prop(keys.reportingDataCategoryUuid)
const getReportingDataAttributeDefUuid = ({ categoryLevelUuid }) =>
  Objects.path([keys.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid])
const getReportingMethod = A.prop(keys.reportingMethod)

const isEmpty = (statisticalAnalysis) =>
  !getEntityDefUuid(statisticalAnalysis) &&
  getDimensionUuids(statisticalAnalysis).length === 0 &&
  StringUtils.isBlank(getFilter(statisticalAnalysis)) &&
  !getReportingMethod(statisticalAnalysis)

const assocClusteringOnlyVariances = (clusteringOnlyVariances) =>
  A.assoc(keys.clusteringOnlyVariances, clusteringOnlyVariances)

const assocDimensionUuids = (dimensionUuids) => A.assoc(keys.dimensionUuids, dimensionUuids)

const assocEntityDefUuid = (entityDefUuid) =>
  A.pipe(
    A.assoc(keys.entityDefUuid, entityDefUuid),
    // reset dimensions
    assocDimensionUuids([])
  )

const assocFilter = (filter) => A.assoc(keys.filter, filter)

const assocNonResponseBiasCorrection = (nonResponseBiasCorrection) =>
  A.assoc(keys.nonResponseBiasCorrection, nonResponseBiasCorrection)

const assocPValue = (pValue) => A.assoc(keys.pValue, pValue)
const resetPValue = assocPValue(null)

const dissocReportingDataAttributeDefsByLevelUuid = A.dissoc(keys.reportingDataAttributeDefsByLevelUuid)
const assocReportingDataCategoryUuid = (reportingDataCategoryUuid) =>
  A.pipe(
    dissocReportingDataAttributeDefsByLevelUuid,
    A.assoc(keys.reportingDataCategoryUuid, reportingDataCategoryUuid)
  )
const assocReportingDataAttributeDefUuid =
  ({ categoryLevelUuid, nodeDefUuid }) =>
  (samplingDesign) =>
    Objects.assocPath({
      obj: samplingDesign,
      path: [keys.reportingDataAttributeDefsByLevelUuid, categoryLevelUuid],
      value: nodeDefUuid,
    })
const assocReportingMethod = (reportingMethod) => A.assoc(keys.reportingMethod, reportingMethod)

export const ChainStatisticalAnalysis = {
  keys,
  pValues,
  reportingMethods,

  isClusteringOnlyVariances,
  getDimensionUuids,
  getEntityDefUuid,
  getFilter,
  getPValue,
  getReportingDataAttributeDefUuid,
  getReportingDataCategoryUuid,
  getReportingMethod,
  isNonResponseBiasCorrection,
  isEmpty,

  assocClusteringOnlyVariances,
  assocDimensionUuids,
  assocEntityDefUuid,
  assocFilter,
  assocNonResponseBiasCorrection,
  assocPValue,
  resetPValue,
  dissocReportingDataAttributeDefsByLevelUuid,
  assocReportingDataAttributeDefUuid,
  assocReportingDataCategoryUuid,
  assocReportingMethod,
}
