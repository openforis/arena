import * as R from 'ramda'

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
export const getDateStart = R.propOr(null, keys.dateStart)
export const getDateEnd = R.propOr(null, keys.dateEnd)
export const getDescriptions = R.propOr({}, keys.descriptions)
export const getLabels = R.propOr({}, keys.labels)

// ====== UPDATE
export const setDateStart = R.assoc(keys.dateStart)
export const setDateEnd = R.assoc(keys.dateEnd)
