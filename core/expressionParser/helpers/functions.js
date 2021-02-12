import * as A from '@core/arena'
import * as DateUtils from '@core/dateUtils'

export const includes = (items, value) => Array.isArray(items) && items.includes(String(value))

export const isEmpty = (value) => A.isEmpty(value) || (value instanceof Number && Number.isNaN(value))

export const now = () => DateUtils.nowFormatDefault()

export const pow = (base, exponent) => base ** exponent
