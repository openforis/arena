import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'

const keys = {
  dimensionUuids: 'dimensionUuids',
  entityDefUuid: 'entityUuid',
  filter: 'filter',
  reportingMethod: 'reportingMethod',
}

const reportingMethods = {
  1: 'dimensionsCombined',
  2: 'dimensionsSeparate',
}

const getDimensionUuids = A.propOr([], keys.dimensionUuids)

const getEntityDefUuid = A.prop(keys.entityDefUuid)

const getFilter = A.prop(keys.filter)

const getReportingMethod = A.prop(keys.reportingMethod)

const isEmpty = (statisticalAnalysis) =>
  !getEntityDefUuid(statisticalAnalysis) &&
  getDimensionUuids(statisticalAnalysis).length === 0 &&
  StringUtils.isBlank(getFilter(statisticalAnalysis)) &&
  !getReportingMethod(statisticalAnalysis)

const assocDimensionUuids = (dimensionUuids) => A.assoc(keys.dimensionUuids, dimensionUuids)

const assocEntityDefUuid = (entityDefUuid) =>
  A.pipe(
    A.assoc(keys.entityDefUuid, entityDefUuid),
    // reset dimensions
    assocDimensionUuids([])
  )

const assocFilter = (filter) => A.assoc(keys.filter, filter)

const assocReportingMethod = (reportingMethod) => A.assoc(keys.reportingMethod, reportingMethod)

export const ChainStatisticalAnalysis = {
  getDimensionUuids,
  getEntityDefUuid,
  getFilter,
  getReportingMethod,
  isEmpty,
  reportingMethods,

  assocDimensionUuids,
  assocEntityDefUuid,
  assocFilter,
  assocReportingMethod,
}
