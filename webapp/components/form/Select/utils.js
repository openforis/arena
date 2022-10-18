import * as A from '@core/arena'

export const adaptSelection = (value) =>
  A.isEmpty(value) ? null : { ...value, value: value.value, label: value.label || value.value }
