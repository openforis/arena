/**
 * Shape and size of the value of an attribute, per attribute type: what the forms and the importers store. Used to
 * refuse a value written by the batch record edit that no form could have produced.
 */
import * as NodeDef from '@core/survey/nodeDef'
import { valuePropsCode, valuePropsCoordinate, valuePropsTaxon } from '@core/survey/nodeValueProps'
import * as DateUtils from '@core/dateUtils'
import { isUuid } from '@core/uuid'
import { NodesBatchLimits } from '@common/record/nodesBatchLimits'

type Value = unknown
type ShapeCheck = (value: Value) => boolean
type PlainObject = Record<string, unknown>

// codes, names and srs ids
const maxShortStringChars = 255
const integerPattern = /^[+-]?\d{1,16}$/
const decimalPattern = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/
const timePattern = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
const booleanValues = new Set(['true', 'false'])

/**
 * Returns true for a plain object (not null, not an array).
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a plain object.
 */
const isPlainObject = (value: Value): value is PlainObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Returns true for a string of at most `maxChars` characters.
 * @param {unknown} value - The value.
 * @param {number} [maxChars] - The longest accepted string.
 * @returns {boolean} Whether the value is a short enough string.
 */
const isString = (value: Value, maxChars: number = maxShortStringChars): value is string =>
  typeof value === 'string' && value.length <= maxChars

/**
 * Returns true for a non-empty string of at most 255 characters.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a non-empty short string.
 */
const isNonEmptyShortString = (value: Value): boolean => isString(value) && value.trim().length > 0

/**
 * Returns true for a finite number or a string of a plain decimal number.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is numeric.
 */
const isNumeric = (value: Value): boolean => {
  if (typeof value === 'number') return Number.isFinite(value)
  return typeof value === 'string' && value.length <= 64 && decimalPattern.test(value) && Number.isFinite(Number(value))
}

/**
 * Returns true for a safe integer or a string of digits.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is an integer.
 */
const isInteger = (value: Value): boolean => {
  if (typeof value === 'number') return Number.isSafeInteger(value)
  return typeof value === 'string' && integerPattern.test(value)
}

/**
 * Returns true for a valid uuid string.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a uuid.
 */
const isUuidString = (value: Value): boolean => typeof value === 'string' && isUuid(value)

/**
 * Returns true when a value is an ISO date (YYYY-MM-DD) that exists in the calendar.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a date.
 */
const isDate: ShapeCheck = (value) => {
  const parts = typeof value === 'string' ? datePattern.exec(value) : null
  return Boolean(parts) && DateUtils.isValidDate(parts![1], parts![2], parts![3])
}

/**
 * Returns true when a value is a time (H:mm or H:mm:ss).
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a time.
 */
const isTime: ShapeCheck = (value) => {
  const parts = typeof value === 'string' ? timePattern.exec(value) : null
  return Boolean(parts) && DateUtils.isValidTime(parts![1], parts![2], parts![3] ?? 0)
}

/**
 * Checks the props of an object value: only the allowed keys, each one passing its check, the required ones present.
 * @param {unknown} value - The value.
 * @param {object} checkByProp - The check of each allowed prop.
 * @param {string[]} required - The props that must be present.
 * @returns {boolean} Whether the value has the shape.
 */
const hasProps = (value: Value, checkByProp: Record<string, ShapeCheck>, required: string[]): boolean => {
  if (!isPlainObject(value)) return false
  const entries = Object.entries(value)
  const allowed = entries.every(([prop, propValue]) => checkByProp[prop]?.(propValue) === true)
  return allowed && required.every((prop) => value[prop] !== undefined && value[prop] !== null)
}

/**
 * Returns a check that also accepts a missing value.
 * @param {Function} check - The check of a present value.
 * @returns {Function} The check.
 */
const isOptional =
  (check: ShapeCheck): ShapeCheck =>
  (value) =>
    value === null || value === undefined || check(value)

/**
 * Returns true for a code value: a code, an item uuid, or both.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a code value.
 */
const isCode: ShapeCheck = (value) =>
  isPlainObject(value) &&
  (isNonEmptyShortString(value[valuePropsCode.code]) || isUuidString(value[valuePropsCode.itemUuid])) &&
  hasProps(
    value,
    {
      [valuePropsCode.code]: isNonEmptyShortString,
      [valuePropsCode.itemUuid]: isUuidString,
      [valuePropsCode.label]: isString,
    },
    []
  )

/**
 * Returns true for a coordinate value: x, y and srs, plus the optional collected fields.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a coordinate value.
 */
const isCoordinate: ShapeCheck = (value) =>
  hasProps(
    value,
    {
      [valuePropsCoordinate.x]: isNumeric,
      [valuePropsCoordinate.y]: isNumeric,
      [valuePropsCoordinate.srs]: isNonEmptyShortString,
      [valuePropsCoordinate.accuracy]: isOptional(isNumeric),
      [valuePropsCoordinate.altitude]: isOptional(isNumeric),
      [valuePropsCoordinate.altitudeAccuracy]: isOptional(isNumeric),
    },
    [valuePropsCoordinate.x, valuePropsCoordinate.y, valuePropsCoordinate.srs]
  )

/**
 * Returns true for a taxon value: the taxon uuid, plus the optional vernacular name and unlisted taxon names.
 * @param {unknown} value - The value.
 * @returns {boolean} Whether the value is a taxon value.
 */
const isTaxon: ShapeCheck = (value) =>
  hasProps(
    value,
    {
      [valuePropsTaxon.taxonUuid]: isUuidString,
      [valuePropsTaxon.vernacularNameUuid]: isOptional(isUuidString),
      [valuePropsTaxon.code]: isOptional(isString),
      [valuePropsTaxon.scientificName]: isOptional(isString),
      [valuePropsTaxon.vernacularName]: isOptional(isString),
    },
    [valuePropsTaxon.taxonUuid]
  )

// only the types a batch edit can write: files and entities have no value to edit
const shapeCheckByType: Record<string, ShapeCheck> = {
  [NodeDef.nodeDefType.boolean]: (value) => typeof value === 'string' && booleanValues.has(value),
  [NodeDef.nodeDefType.code]: isCode,
  [NodeDef.nodeDefType.coordinate]: isCoordinate,
  [NodeDef.nodeDefType.date]: isDate,
  [NodeDef.nodeDefType.decimal]: isNumeric,
  [NodeDef.nodeDefType.integer]: isInteger,
  [NodeDef.nodeDefType.taxon]: isTaxon,
  [NodeDef.nodeDefType.text]: (value) => isString(value, NodesBatchLimits.maxValueChars),
  [NodeDef.nodeDefType.time]: isTime,
}

/**
 * Returns true when the value can be the value of the attribute: null (no value), or a value of the shape and size
 * the attribute type stores.
 * @param {object} params - The parameters.
 * @param {object} params.nodeDef - The attribute definition.
 * @param {unknown} params.value - The value to store (untrusted input allowed).
 * @returns {boolean} Whether the value is acceptable.
 */
export const isNodeValueShapeValid = ({ nodeDef, value }: { nodeDef: any; value: Value }): boolean => {
  const check = shapeCheckByType[NodeDef.getType(nodeDef)]
  if (!check) return false
  if (value === null || value === undefined) return true
  return check(value)
}

// quotes, keys and separators around the longest string of a value
const serializedOverheadChars = 1000

/**
 * Returns true when the serialized value is within the size limit (a cheap bound before any per-type check).
 * @param {unknown} value - The value (untrusted JSON input).
 * @returns {boolean} Whether the value is small enough.
 */
export const isNodeValueSizeValid = (value: Value): boolean =>
  (JSON.stringify(value) ?? '').length <= NodesBatchLimits.maxValueChars + serializedOverheadChars
