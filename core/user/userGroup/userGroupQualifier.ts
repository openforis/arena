import * as R from 'ramda'

export const keys = {
  name: 'name',
  value: 'value',
}

export const newQualifier = (): Record<string, string> => ({ [keys.name]: '', [keys.value]: '' })

export const getName = R.propOr('', keys.name)
export const getValue = R.propOr('', keys.value)

export const assocName = (name: string) => R.assoc(keys.name, name)
export const assocValue = (value: string) => R.assoc(keys.value, value)
