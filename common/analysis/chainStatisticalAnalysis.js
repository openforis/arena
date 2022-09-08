import * as A from '@core/arena'

const keys = {
  entityDefUuid: 'entityUuid',
  dimensionUuids: 'dimensionUuids',
  reportingMethod: 'reportingMethod',
}

const reportingMethods = {
  1: 'dimensionsCombined',
  2: 'dimensionsSeparate',
}

const getEntityDefUuid = A.prop(keys.entityDefUuid)
const getDimensionUuids = A.propOr([], keys.dimensionUuids)
const getReportingMethod = A.prop(keys.reportingMethod)

const assocDimensionUuids = (dimensionUuids) => A.assoc(keys.dimensionUuids, dimensionUuids)
const assocEntityDefUuid = (entityDefUuid) =>
  A.pipe(
    A.assoc(keys.entityDefUuid, entityDefUuid),
    // reset dimensions
    assocDimensionUuids([])
  )
const assocReportingMethod = (reportingMethod) => A.assoc(keys.reportingMethod, reportingMethod)

export const ChainStatisticalAnalysis = {
  getEntityDefUuid,
  getDimensionUuids,
  getReportingMethod,
  reportingMethods,

  assocEntityDefUuid,
  assocDimensionUuids,
  assocReportingMethod,
}
