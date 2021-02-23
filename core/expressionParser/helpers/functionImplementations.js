import * as A from '@core/arena'
import * as DateUtils from '@core/dateUtils'

import { functionNames } from './functions'

export const functionImplementations = {
  [functionNames.avg]: A.identity,
  [functionNames.count]: A.identity,
  [functionNames.includes]: (items, value) => Array.isArray(items) && items.includes(String(value)),
  [functionNames.index]: () => 0,
  [functionNames.isEmpty]: (value) => A.isEmpty(value) || (value instanceof Number && Number.isNaN(value)),
  [functionNames.ln]: Math.log,
  [functionNames.log10]: Math.log10,
  [functionNames.min]: Math.min,
  [functionNames.max]: Math.max,
  [functionNames.now]: () => DateUtils.nowFormatDefault(),
  [functionNames.pow]: (base, exponent) => base ** exponent,
  [functionNames.sum]: A.identity,
}
