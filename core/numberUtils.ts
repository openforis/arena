import * as A from '@core/arena'
import { Objects } from '@openforis/arena-core'

import { isBlank } from './stringUtils'

// blank strings are not numbers (Number(' ') would be 0)
export const toNumber = (num: unknown): number =>
  Objects.isEmpty(num) || (typeof num === 'string' && isBlank(num)) ? Number.NaN : Number(num)

export const isInteger = A.pipe(toNumber, Number.isInteger)

export const isFloat = A.pipe(toNumber, Number.isFinite)
