import * as R from 'ramda'

import { CategoryItems, DateFormats, Dates, Objects } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

const singlePropValueEqualComparator = ({ value, valueSearch }) =>
  value === valueSearch || String(value) === String(valueSearch)

const getValueCode = (value) => (StringUtils.isString(value) ? value : value[Node.valuePropsCode.code])
const getValueItemUuid = (value) => value[Node.valuePropsCode.itemUuid]

const extractCategoryItemUuidFromValue = ({ survey, nodeDef, record, parentNode, value }) => {
  const itemUuid = getValueItemUuid(value)
  if (itemUuid) {
    return itemUuid
  }
  // find itemUuid by code
  const code = getValueCode(value)
  if (!Objects.isEmpty(code)) {
    const { itemUuid: itemUuidFound } = Survey.getCategoryItemUuidAndCodeHierarchy({
      nodeDef,
      code,
      record,
      parentNode,
    })(survey)
    return itemUuidFound
  }
  return null
}

const extractCategoryItemCodeFromValue = ({ survey, value }) => {
  const itemUuid = getValueItemUuid(value)
  if (itemUuid) {
    const item = Survey.getCategoryItemByUuid(itemUuid)(survey)
    return CategoryItems.getCode(item)
  }
  return getValueCode(value)
}

const dateTimeComparator =
  ({ formatsSource, formatTo }) =>
  ({ value, valueSearch }) => {
    const toDateTime = (val) => {
      if (val instanceof Date) {
        return Dates.format(val, formatTo)
      }
      const formatFrom = formatsSource.find((format) => Dates.isValidDateInFormat(val, format))
      return formatFrom ? Dates.convertDate({ dateStr: val, formatFrom, formatTo }) : null
    }
    const dateTime = toDateTime(value)
    const dateTimeSearch = toDateTime(valueSearch)
    return dateTime && dateTimeSearch && dateTime === dateTimeSearch
  }

const valueComparatorByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.code]: ({ survey, nodeDef, record, parentNode, value, valueSearch, strict }) => {
    if (!strict || !record) {
      // compare just codes (record not available, tricky to find the "correct" category item without knowing its parent item)
      const code = extractCategoryItemCodeFromValue({ survey, value })
      const codeSearch = extractCategoryItemCodeFromValue({ survey, value: valueSearch })
      return code && codeSearch && code === codeSearch
    }
    const itemUuid = extractCategoryItemUuidFromValue({ survey, nodeDef, record, parentNode, value })
    const itemUuidSearch = extractCategoryItemUuidFromValue({
      survey,
      nodeDef,
      record,
      parentNode,
      value: valueSearch,
    })
    return itemUuidSearch && itemUuid && itemUuidSearch === itemUuid
  },
  [NodeDef.nodeDefType.coordinate]: ({ value, valueSearch }) => R.equals(value, valueSearch),
  [NodeDef.nodeDefType.date]: dateTimeComparator({
    formatsSource: [DateFormats.dateDisplay, DateFormats.dateStorage],
    formatTo: DateFormats.dateStorage,
  }),
  [NodeDef.nodeDefType.decimal]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.integer]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.taxon]: ({ value, valueSearch }) => {
    if (value === valueSearch) return true
    if (!value) return false
    if (!valueSearch) return false
    return value[Node.valuePropsTaxon.taxonUuid] === valueSearch[Node.valuePropsTaxon.taxonUuid]
  },
  [NodeDef.nodeDefType.text]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.time]: dateTimeComparator({
    formatsSource: [DateFormats.timeStorage, 'HH:mm:ss'],
    formatTo: DateFormats.timeStorage,
  }),
}

/**
 * Compares 2 attribute values according to their properties (depending on the attribute definition).
 *
 * @param {!object} params - The function parameters.
 * @param {!object} [params.survey] - The survey object.
 * @param {!object} [params.value] - The 1st value to compare.
 * @param {!object} [params.valueSearch] - The 2nd value to compare.
 * @param {object} [params.record] - The record object (mandatory when comparing values of hierarchical code attriutes).
 * @param {object} [params.parentNode] - The parent node object (mandatory when comparing values of hierarchical code attriutes).
 * @param {boolean} [params.strict] - When true, the comparison is done considering the value internal identifiers (e.g. Category item UUID),
 * otherwise values will be converted into values using internal identifiers (e.g. Category item codes into category item UUIDs).
 * @returns {boolean} - True if the values are equal.
 */
const isValueEqual = ({ survey, nodeDef, value, valueSearch, record = null, parentNode = null, strict = false }) => {
  if (value === valueSearch) return true
  if (Objects.isEmpty(value) || Objects.isEmpty(valueSearch)) return false

  const valueComparator = valueComparatorByNodeDefType[NodeDef.getType(nodeDef)]
  return valueComparator && valueComparator({ survey, nodeDef, record, parentNode, value, valueSearch, strict })
}

export const NodeValues = {
  isValueEqual,
}
