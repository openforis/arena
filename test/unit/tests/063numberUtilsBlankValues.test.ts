import * as NumberUtils from '@core/numberUtils'
import * as Validator from '@core/validation/validator'

describe('NumberUtils with blank values', () => {
  test.each([' ', '   ', '', null, undefined])('%p is not a number', (value) => {
    expect(Number.isNaN(NumberUtils.toNumber(value))).toBe(true)
    expect(NumberUtils.isInteger(value)).toBe(false)
    expect(NumberUtils.isFloat(value)).toBe(false)
  })

  test.each([
    ['1', 1],
    [' 2 ', 2],
    [3.5, 3.5],
  ])('%p is converted to %p', (value, expected) => {
    expect(NumberUtils.toNumber(value)).toBe(expected)
  })
})

describe('Validator.validateNumber with blank values', () => {
  const validate = (value: unknown) => Validator.validateNumber('invalidNumber')('value', { value })

  test('a blank string is not a valid number', () => {
    expect(validate(' ')).toEqual({ key: 'invalidNumber', params: {} })
  })

  test('an empty value is not validated', () => {
    expect(validate('')).toBeNull()
  })

  test('a number is valid', () => {
    expect(validate('12.5')).toBeNull()
  })
})
