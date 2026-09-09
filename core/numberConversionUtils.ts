import { Objects } from '@openforis/arena-core'

const areaUnits = {
  squareMeter: 'squareMeter',
  squareFoot: 'squareFoot',
  acre: 'acre',
  hectare: 'hectare',
} as const

const areaUnitToSquareMetersConversionFactor = {
  [areaUnits.acre]: 4046.85642199999983859016,
  [areaUnits.hectare]: 10000,
  [areaUnits.squareMeter]: 1,
  [areaUnits.squareFoot]: 0.09290304,
}

const lengthUnits = {
  meter: 'meter',
  foot: 'foot',
} as const

const lengthUnitToMetersConversionFactor = {
  [lengthUnits.meter]: 1,
  [lengthUnits.foot]: 0.3048,
}

const abbreviationByUnit = {
  [areaUnits.squareMeter]: 'm²',
  [areaUnits.squareFoot]: 'ft²',
  [areaUnits.acre]: 'ac',
  [areaUnits.hectare]: 'ha',
  [lengthUnits.meter]: 'm',
  [lengthUnits.foot]: 'ft',
}

const dataStorageUnits = {
  byte: 'byte',
  MB: 'MB',
  GB: 'GB',
} as const

const dataStorageUnitToBytesConversionFactor = {
  [dataStorageUnits.byte]: 1,
  [dataStorageUnits.MB]: Math.pow(1024, 2),
  [dataStorageUnits.GB]: Math.pow(1024, 3),
}

const _convertNumberToUnit =
  (converter: (value: number) => number) =>
  (value: unknown): number =>
    Objects.isNil(value) ? NaN : converter(Number(value))

const squareMetersToUnit =
  (unit: keyof typeof areaUnitToSquareMetersConversionFactor) =>
  (value: unknown): number =>
    _convertNumberToUnit((num) => num / areaUnitToSquareMetersConversionFactor[unit])(value)

const metersToUnit =
  (unit: keyof typeof lengthUnitToMetersConversionFactor) =>
  (value: unknown): number =>
    _convertNumberToUnit((num) => num / lengthUnitToMetersConversionFactor[unit])(value)

const dataStorageBytesToUnit =
  (unit: keyof typeof dataStorageUnitToBytesConversionFactor) =>
  (bytes: unknown): number =>
    _convertNumberToUnit((num) => num / dataStorageUnitToBytesConversionFactor[unit])(bytes)

const dataStorageValueToBytes =
  (unit: keyof typeof dataStorageUnitToBytesConversionFactor) =>
  (value: unknown): number =>
    _convertNumberToUnit((num) => num * dataStorageUnitToBytesConversionFactor[unit])(value)

const _unitsFrench = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
]

const _underHundredToWordsFrench = (n: number): string => {
  if (n < 20) return _unitsFrench[n]
  if (n < 70) {
    const tens = Math.floor(n / 10)
    const rest = n % 10
    const tensWord = ['vingt', 'trente', 'quarante', 'cinquante', 'soixante'][tens - 2]
    if (rest === 0) return tensWord
    if (rest === 1) return `${tensWord} et un`
    return `${tensWord}-${_unitsFrench[rest]}`
  }
  if (n < 80) {
    const rest = n - 60
    return rest === 11 ? 'soixante et onze' : `soixante-${_underHundredToWordsFrench(rest)}`
  }
  if (n === 80) return 'quatre-vingts'
  return `quatre-vingt-${_underHundredToWordsFrench(n - 80)}`
}

const _hundredsToWordsFrench = (n: number): string => {
  if (n < 100) return _underHundredToWordsFrench(n)
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const hundredsWord = hundreds === 1 ? 'cent' : `${_underHundredToWordsFrench(hundreds)} cent${rest === 0 ? 's' : ''}`
  return rest === 0 ? hundredsWord : `${hundredsWord} ${_underHundredToWordsFrench(rest)}`
}

const numberToWordsFrench = (value: unknown): string => {
  const num = Objects.isNil(value) ? NaN : Number(value)
  if (!Number.isInteger(num) || num < 0 || num > 999999999999) return ''
  if (num < 1000) return _hundredsToWordsFrench(num)
  const millions = Math.floor(num / 1000000)
  const thousands = Math.floor((num % 1000000) / 1000)
  const rest = num % 1000
  const parts: string[] = []
  if (millions > 0) parts.push(`${_hundredsToWordsFrench(millions)} million${millions > 1 ? 's' : ''}`)
  if (thousands === 1) parts.push('mille')
  else if (thousands > 1) parts.push(`${_hundredsToWordsFrench(thousands)} mille`)
  if (rest > 0) parts.push(_hundredsToWordsFrench(rest))
  return parts.join(' ')
}

const dataStorageValueToUnit =
  (
    unitFrom: keyof typeof dataStorageUnitToBytesConversionFactor,
    unitTo: keyof typeof dataStorageUnitToBytesConversionFactor
  ) =>
  (value: unknown): number => {
    const bytes = dataStorageValueToBytes(unitFrom)(value)
    return dataStorageBytesToUnit(unitTo)(bytes)
  }

export const NumberConversionUtils = {
  areaUnits,
  numberToWordsFrench,
  lengthUnits,
  abbreviationByUnit,
  metersToUnit,
  squareMetersToUnit,
  dataStorageUnits,
  dataStorageBytesToUnit,
  dataStorageValueToBytes,
  dataStorageValueToUnit,
}
