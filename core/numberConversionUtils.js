import { Objects } from '@openforis/arena-core'

const areaUnits = {
  squareMeter: 'squareMeter',
  squareFoot: 'squareFoot',
  acre: 'acre',
  hectare: 'hectare',
}

const areaUnitToSquareMetersConversionFactor = {
  [areaUnits.acre]: 4046.85642199999983859016,
  [areaUnits.hectare]: 10000,
  [areaUnits.squareMeter]: 1,
  [areaUnits.squareFoot]: 0.09290304,
}

const lengthUnits = {
  meter: 'meter',
  foot: 'foot',
}

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
}

const dataStorageUnitToBytesConversionFactor = {
  [dataStorageUnits.byte]: 1,
  [dataStorageUnits.MB]: Math.pow(1024, 2),
  [dataStorageUnits.GB]: Math.pow(1024, 3),
}

const _convertNumberToUnit = (converter) => (value) => (Objects.isNil(value) ? NaN : converter(Number(value)))

const squareMetersToUnit = (unit) => (value) =>
  _convertNumberToUnit((num) => num / areaUnitToSquareMetersConversionFactor[unit])(value)

const metersToUnit = (unit) => (value) =>
  _convertNumberToUnit((num) => num / lengthUnitToMetersConversionFactor[unit])(value)

const dataStorageBytesToUnit = (unit) => (bytes) =>
  _convertNumberToUnit((num) => num / dataStorageUnitToBytesConversionFactor[unit])(bytes)

const dataStorageValueToBytes = (unit) => (value) =>
  _convertNumberToUnit((num) => num * dataStorageUnitToBytesConversionFactor[unit])(value)

const dataStorageValueToUnit = (unitFrom, unitTo) => (value) => {
  const bytes = dataStorageValueToBytes(unitFrom)(value)
  return dataStorageBytesToUnit(unitTo)(bytes)
}

export const NumberConversionUtils = {
  areaUnits,
  lengthUnits,
  abbreviationByUnit,
  metersToUnit,
  squareMetersToUnit,
  dataStorageUnits,
  dataStorageBytesToUnit,
  dataStorageValueToBytes,
  dataStorageValueToUnit,
}
