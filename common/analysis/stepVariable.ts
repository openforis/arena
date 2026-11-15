import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  include: 'include',
  aggregate: 'aggregate',
}

// ===== READ
export const { getUuid, isEqual } = ObjectUtils
export const getAggregate = (stepVariable: { aggregate?: string }): string | undefined =>
  A.prop(keys.aggregate)(stepVariable)
