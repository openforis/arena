import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'

const keys = {
  uuid: ObjectUtils.keys.uuid,
  include: 'include',
  aggregate: 'aggregate',
}

// ===== CREATE
export const newProcessingStepVariable = ({ uuid }) => ({
  [keys.uuid]: uuid,
})

// ===== READ
export const { getUuid } = ObjectUtils
export const getInclude = A.propOr(false, keys.include)
export const getAggregate = A.prop(keys.aggregate)

// ===== UPDATE
export const assocInclude = A.assoc(keys.include)
export const assocAggregate = A.assoc(keys.aggregate)
