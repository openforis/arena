import * as A from '@core/arena'

const keys = {
  entityDefUuid: 'entityUuid',
}

const getEntityDefUuid = A.prop(keys.entityDefUuid)

const assocEntityDefUuid = (entityDefUuid) => A.assoc(keys.entityDefUuid, entityDefUuid)

export const ChainStatisticalAnalysis = {
  getEntityUuid: getEntityDefUuid,

  assocEntityDefUuid,
}
