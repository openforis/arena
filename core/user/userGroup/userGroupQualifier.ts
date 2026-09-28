import * as A from '@core/arena'

export const keys = {
  name: 'name',
  value: 'value',
}

export const newQualifier = (): Record<string, string> => ({ [keys.name]: '', [keys.value]: '' })

export const getName = A.propOr('', keys.name)
export const getValue = A.propOr('', keys.value)

export const assocName = (name: string) => A.assoc(keys.name, name)
export const assocValue = (value: string) => A.assoc(keys.value, value)
