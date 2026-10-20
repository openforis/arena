import * as A from '@core/arena'

import { CategoryItems, DateFormats, Dates, Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

const singlePropValueEqualComparator = ({ value, valueSearch }) =>
  value === valueSearch || String(value) === String(valueSearch)

const getValueCode = (value) => {
  const code = typeof value === 'object' ? value[Node.valuePropsCode.code] : value
  return Objects.isEmpty(code) ? null : String(code)
}

const getValueItemUuid = (value) => value[Node.valuePropsCode.itemUuid]

const extractCategoryItemUuidFromValue = ({ survey, nodeDef, record, parentNode, value }) => {
  const itemUuid = getValueItemUuid(value)
  if (itemUuid) {
    return itemUuid
  }
  // find itemUuid by code
  const code = getValueCode(value)
  if (!Objects.isEmpty(code) && record) {
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

const extractCategoryItemCodeFromValue = ({ survey, value, attribute = null }) => {
  const itemUuid = getValueItemUuid(value)
  if (itemUuid) {
    const item = Survey.getCategoryItemByUuid(itemUuid)(survey)
    // item can be missing if category is big (not preloaded)
    if (item) {
      return CategoryItems.getCode(item)
    }
  }
  const code = getValueCode(value)
  if (Objects.isNotEmpty(code)) {
    return code
  }
  if (attribute) {
    const categoryItem = NodeRefData.getCategoryItem(attribute)
    if (categoryItem) {
      return CategoryItems.getCode(categoryItem)
    }
  }
  return null
}

const dateTimeComparator =
  ({ formatsSource, formatTo }) =>
  ({ value, valueSearch }) => {
    const toDateTime = (val) => {
      if (val instanceof Date) {
        return Dates.format(val, formatTo)
      }
      const formatFrom = formatsSource.find((format) => Dates.isValidDateInFormat(val, format))
      // keepTimeZone: false avoids convertDate's default parseZone-based parsing, which treats a
      // timezone-less date/time string as UTC and shifts it by the host's UTC offset on format.
      // Date and time values have no real timezone component, so they must be parsed and
      // formatted consistently in the local zone.
      return formatFrom ? Dates.convertDate({ dateStr: val, formatFrom, formatTo, keepTimeZone: false }) : null
    }
    const dateTime = toDateTime(value)
    const dateTimeSearch = toDateTime(valueSearch)
    return dateTime && dateTimeSearch && dateTime === dateTimeSearch
  }

const valueComparatorByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.code]: ({
    survey,
    nodeDef,
    record,
    parentNode,
    value,
    valueSearch,
    attribute = null,
    strict = false,
  }) => {
    const itemUuid = extractCategoryItemUuidFromValue({ survey, nodeDef, record, parentNode, value })
    const itemUuidSearch = extractCategoryItemUuidFromValue({
      survey,
      nodeDef,
      record,
      parentNode,
      value: valueSearch,
    })
    if (itemUuid && itemUuidSearch) {
      return itemUuid === itemUuidSearch
    }
    if (!strict) {
      // compare just codes (record not available, tricky to find the "correct" category item without knowing its parent item)
      const code = extractCategoryItemCodeFromValue({ survey, attribute, value })
      const codeSearch = extractCategoryItemCodeFromValue({ survey, value: valueSearch })
      if (code && codeSearch) {
        return code === codeSearch
      }
    }
    return false
  },
  [NodeDef.nodeDefType.coordinate]: ({ value, valueSearch }) => A.equals(value, valueSearch),
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
    return [Node.valuePropsTaxon.taxonUuid, Node.valuePropsTaxon.vernacularNameUuid].every(
      (prop) => value[prop] === valueSearch[prop]
    )
  },
  [NodeDef.nodeDefType.text]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.time]: dateTimeComparator({
    formatsSource: [DateFormats.timeStorage, DateFormats.timeWithSeconds],
    formatTo: DateFormats.timeWithSeconds,
  }),
}

/**
 * Compares 2 attribute values according to their properties (depending on the attribute definition).
 * @param {!object} params - The function parameters.
 * @param {!object} [params.survey] - The survey object.
 * @param {!object} [params.value] - The 1st value to compare.
 * @param {!object} [params.valueSearch] - The 2nd value to compare.
 * @param {object} [params.record] - The record object (mandatory when comparing values of hierarchical code attriutes).
 * @param {object} [params.parentNode] - The parent node object (mandatory when comparing values of hierarchical code attriutes).
 * @param {object} [params.attribute] - The attribute node object (not mandatory, it can be used to retrieve refData from it).
 * @param {boolean} [params.strict] - When true, the comparison is done considering the value internal identifiers (e.g. Category item UUID),
 * otherwise values will be converted into values using internal identifiers (e.g. Category item codes into category item UUIDs).
 * @returns {boolean} - True if the values are equal.
 */
const isValueEqual = ({
  survey,
  nodeDef,
  value,
  valueSearch,
  attribute = null,
  record = null,
  parentNode = null,
  strict = false,
}) => {
  if (value === valueSearch) return true
  if (Objects.isEmpty(value) || Objects.isEmpty(valueSearch)) return false

  const valueComparator = valueComparatorByNodeDefType[NodeDef.getType(nodeDef)]
  return !!valueComparator?.({ survey, nodeDef, record, parentNode, value, valueSearch, attribute, strict })
}

// ===== Fast equality key (for building lookup indexes over flat/summary values)

// Node def types for which isValueEqual, when called WITHOUT record/parentNode/attribute
// (i.e. no hierarchical category item resolution), depends only on the 2 compared values
// and can therefore be reduced to a single string key safe to use as a Map bucket key.
const fastEqualityKeyExtractorByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: ({ value }) => String(value),
  [NodeDef.nodeDefType.text]: ({ value }) => String(value),
  [NodeDef.nodeDefType.integer]: ({ value }) => String(value),
  [NodeDef.nodeDefType.decimal]: ({ value }) => String(value),
  [NodeDef.nodeDefType.code]: ({ survey, value }) => extractCategoryItemCodeFromValue({ survey, value }),
}

/**
 * Determines whether a node def type is supported by getFastEqualityKeyWithoutRecordContext.
 * @param {!string} nodeDefType - The node def type (see NodeDef.nodeDefType).
 * @returns {boolean} - True if the type is supported.
 */
const isTypeFastIndexable = (nodeDefType) => Object.hasOwn(fastEqualityKeyExtractorByNodeDefType, nodeDefType)

/**
 * Computes a string key for building a lookup index, valid ONLY when isValueEqual would be called
 * without record/parentNode/attribute (no hierarchical code resolution, non-strict comparison) -
 * exactly the conditions under which flat values (e.g. record summaries) are matched against each other.
 * For 2 non-empty values, this key matches if and only if isValueEqual (called under those conditions)
 * would consider them equal. Empty values are always given a null key here, and null keys are always
 * treated by callers as "does not match anything" - this is a deliberate simplification and diverges
 * from isValueEqual, which returns true for 2 values that are === (e.g. two nulls, or two empty
 * strings), via its own value === valueSearch shortcut. Callers relying on the equivalence with
 * isValueEqual must ensure at least one of the two compared values can never be empty (e.g. by
 * validating the searched-for value isn't empty before doing any lookup), as is done by every current
 * caller. Do NOT reuse this outside of that context: hierarchical code attributes need the
 * record/parentNode-aware resolution in isValueEqual and are intentionally unsupported here.
 * @param {!object} params - The function parameters.
 * @param {!object} [params.survey] - The survey object.
 * @param {!object} [params.nodeDef] - The node def of the compared value.
 * @param {object} [params.value] - The value to compute the key for.
 * @returns {{supported: boolean, key: (string|null)}} - supported is false if the node def type isn't
 * indexable this way; key is null when the value is empty (see above).
 */
const getFastEqualityKeyWithoutRecordContext = ({ survey, nodeDef, value }) => {
  const extractor = fastEqualityKeyExtractorByNodeDefType[NodeDef.getType(nodeDef)]
  if (!extractor) return { supported: false, key: null }
  if (Objects.isEmpty(value)) return { supported: true, key: null }
  const key = extractor({ survey, value })
  return { supported: true, key: Objects.isEmpty(key) ? null : key }
}

// Node def types for which isValueEqual, when called WITH record context (see findChildByKeyValues),
// can be reduced to a single string key; code attribute values are identified by their category item UUID
// (isValueEqual compares item UUIDs when both values have them).
const fastEqualityKeyInRecordContextExtractorByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: ({ value }) => String(value),
  [NodeDef.nodeDefType.text]: ({ value }) => String(value),
  [NodeDef.nodeDefType.integer]: ({ value }) => String(value),
  [NodeDef.nodeDefType.decimal]: ({ value }) => String(value),
  [NodeDef.nodeDefType.code]: ({ value }) => (typeof value === 'object' ? (getValueItemUuid(value) ?? null) : null),
}

/**
 * Determines whether a node def type is supported by getFastEqualityKeyInRecordContext.
 * @param {!string} nodeDefType - The node def type (see NodeDef.nodeDefType).
 * @returns {boolean} - True if the type is supported.
 */
const isTypeFastIndexableInRecordContext = (nodeDefType) =>
  Object.hasOwn(fastEqualityKeyInRecordContextExtractorByNodeDefType, nodeDefType)

/**
 * Computes a string key for building a lookup index of attribute values compared with isValueEqual WITH record context
 * (e.g. entity key attributes in a record).
 * For 2 non-empty values with a key, the keys match if and only if isValueEqual would consider them equal.
 * Empty values are given a null key (callers must treat it as "does not match anything", see getFastEqualityKeyWithoutRecordContext).
 * Non-empty values whose key cannot be determined without the record (e.g. code values without category item UUID,
 * whose item can depend on the parent code attribute) are not supported: callers must compare them using isValueEqual.
 * @param {!object} params - The function parameters.
 * @param {!object} [params.nodeDef] - The node def of the compared value.
 * @param {object} [params.value] - The value to compute the key for.
 * @returns {{supported: boolean, key: (string|null)}} - supported is false if the node def type or the value isn't
 * indexable this way; key is null when the value is empty.
 */
const getFastEqualityKeyInRecordContext = ({ nodeDef, value }) => {
  const extractor = fastEqualityKeyInRecordContextExtractorByNodeDefType[NodeDef.getType(nodeDef)]
  if (!extractor) return { supported: false, key: null }
  if (Objects.isEmpty(value)) return { supported: true, key: null }
  const key = extractor({ value })
  return Objects.isEmpty(key) ? { supported: false, key: null } : { supported: true, key }
}

/**
 * Combines key parts into a single key.
 * Key parts are length-prefixed before concatenating them, so that different key part arrays can never
 * produce the same key, regardless of their content (no separator character to collide on, unlike a plain join
 * or a doubled-separator escape - which is still ambiguous for values that are themselves runs of the separator
 * straddling a part boundary, e.g. ["\u0001\u0001", "X"] vs ["\u0001", "\u0001X"]).
 * @param {!Array<string>} keyParts - The key parts.
 * @returns {string} - The composite key.
 */
const buildCompositeKey = (keyParts) => keyParts.map((keyPart) => `${keyPart.length}:${keyPart}`).join('')

/**
 * Computes a composite key for the values of the specified node defs (e.g. entity key attribute defs),
 * using the specified function to compute the key of every value
 * (e.g. getFastEqualityKeyWithoutRecordContext or getFastEqualityKeyInRecordContext).
 * @param {!object} params - The function parameters.
 * @param {!Array<object>} params.nodeDefs - The node defs whose values are part of the key.
 * @param {!function(object): {supported: boolean, key: (string|null)}} params.getKey - Function returning the key of the value of the specified node def.
 * @returns {{supported: boolean, key: (string|null)}} - supported is false if the key of some value is not supported;
 * key is null if the key of some value is null (empty value).
 */
const getFastEqualityCompositeKey = ({ nodeDefs, getKey }) => {
  const keyParts = []
  let hasEmptyValues = false
  for (const nodeDef of nodeDefs) {
    const { supported, key } = getKey(nodeDef)
    if (!supported) return { supported: false, key: null }
    if (key === null) {
      hasEmptyValues = true
    } else {
      keyParts.push(key)
    }
  }
  return { supported: true, key: hasEmptyValues ? null : buildCompositeKey(keyParts) }
}

export const NodeValues = {
  isValueEqual,
  isTypeFastIndexable,
  getFastEqualityKeyWithoutRecordContext,
  isTypeFastIndexableInRecordContext,
  getFastEqualityKeyInRecordContext,
  buildCompositeKey,
  getFastEqualityCompositeKey,
  getValueCode,
  getValueItemUuid,
}
