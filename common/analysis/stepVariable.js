import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  include: 'include',
  aggregate: 'aggregate',
}

// ===== READ
export const { getUuid, isEqual } = ObjectUtils
export const getAggregate = A.prop(keys.aggregate)
