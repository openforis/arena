import { DateFormats } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as DateUtils from '@core/dateUtils'
import * as ObjectUtils from '@core/objectUtils'

export const dateFormat = DateFormats.dateStorage

export const keys = {
  dateStart: 'dateStart',
  dateEnd: 'dateEnd',
  descriptions: ObjectUtils.keysProps.descriptions,
  labels: ObjectUtils.keysProps.labels,
} as const

export interface SurveyCycle {
  dateStart?: string | null
  dateEnd?: string | null
  descriptions?: Record<string, string>
  labels?: Record<string, string>
}

// ====== CREATE
export const newCycle = (): SurveyCycle => ({
  [keys.dateStart]: DateUtils.format(Date.now(), dateFormat),
})

// ====== READ
export const getDateStart = (cycle: SurveyCycle | null | undefined): string | null =>
  A.propOr(null, keys.dateStart)(cycle)
export const getDateEnd = (cycle: SurveyCycle | null | undefined): string | null => A.propOr(null, keys.dateEnd)(cycle)
export const getDescriptions = (cycle: SurveyCycle): Record<string, string> => A.propOr({}, keys.descriptions)(cycle)
export const getLabels = (cycle: SurveyCycle): Record<string, string> => A.propOr({}, keys.labels)(cycle)

// ====== UPDATE
export const setDateStart =
  (dateStart: string | null) =>
  (cycle: SurveyCycle): SurveyCycle =>
    A.assoc(keys.dateStart, dateStart)(cycle)
export const setDateEnd =
  (dateEnd: string | null) =>
  (cycle: SurveyCycle): SurveyCycle =>
    A.assoc(keys.dateEnd, dateEnd)(cycle)
