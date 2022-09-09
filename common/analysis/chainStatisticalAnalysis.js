import * as A from '@core/arena'

const keys = {
  dimensionUuids: 'dimensionUuids',
  entityDefUuid: 'entityUuid',
  filtering: 'filtering',
  reportingMethod: 'reportingMethod',
}

const reportingMethods = {
  1: 'dimensionsCombined',
  2: 'dimensionsSeparate',
}

const getDimensionUuids = A.propOr([], keys.dimensionUuids)

const getEntityDefUuid = A.prop(keys.entityDefUuid)

const getFiltering = A.prop(keys.filtering)

const getReportingMethod = A.prop(keys.reportingMethod)

const assocDimensionUuids = (dimensionUuids) => A.assoc(keys.dimensionUuids, dimensionUuids)

const assocEntityDefUuid = (entityDefUuid) =>
  A.pipe(
    A.assoc(keys.entityDefUuid, entityDefUuid),
    // reset dimensions
    assocDimensionUuids([])
  )

const assocFiltering = (filtering) => A.assoc(keys.filtering, filtering)

const assocReportingMethod = (reportingMethod) => A.assoc(keys.reportingMethod, reportingMethod)

export const ChainStatisticalAnalysis = {
  getDimensionUuids,
  getEntityDefUuid,
  getFiltering,
  getReportingMethod,
  reportingMethods,

  assocDimensionUuids,
  assocEntityDefUuid,
  assocFiltering,
  assocReportingMethod,
}
