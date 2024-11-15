import * as A from '@core/arena'
import { Objects } from '@openforis/arena-core'

export const toNumber = (num) => (Objects.isEmpty(num) ? NaN : Number(num))

export const isInteger = A.pipe(toNumber, Number.isInteger)

export const isFloat = A.pipe(toNumber, Number.isFinite)
