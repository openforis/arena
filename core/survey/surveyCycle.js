import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'
import * as DateUtils from '@core/dateUtils'

export const dateFormat = 'YYYY-MM-DD'

export const keys = {
  dateStart: 'dateStart',
  dateEnd: 'dateEnd',
  descriptions: ObjectUtils.keysProps.descriptions,
  labels: ObjectUtils.keysProps.labels,
}

// ====== CREATE
export const newCycle = () => ({
  [keys.dateStart]: DateUtils.format(Date.now(), dateFormat),
})

// ====== READ
export const getDateStart = A.propOr(null, keys.dateStart)
export const getDateEnd = A.propOr(null, keys.dateEnd)
export const getDescriptions = A.propOr({}, keys.descriptions)
export const getLabels = A.propOr({}, keys.labels)

// ====== UPDATE
export const setDateStart = A.assoc(keys.dateStart)
export const setDateEnd = A.assoc(keys.dateEnd)
