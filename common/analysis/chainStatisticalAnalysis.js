import * as A from '@core/arena'

const keys = {
  entityDefUuid: 'entityUuid',
  dimensionUuids: 'dimensionUuids',
}

const getEntityDefUuid = A.prop(keys.entityDefUuid)
const getDimensionUuids = A.propOr([], keys.dimensionUuids)

const assocDimensionUuids = (dimensionUuids) => A.assoc(keys.dimensionUuids, dimensionUuids)
const assocEntityDefUuid = (entityDefUuid) =>
  A.pipe(
    A.assoc(keys.entityDefUuid, entityDefUuid),
    // reset dimensions
    assocDimensionUuids([])
  )

export const ChainStatisticalAnalysis = {
  getEntityDefUuid,
  getDimensionUuids,

  assocEntityDefUuid,
  assocDimensionUuids,
}
