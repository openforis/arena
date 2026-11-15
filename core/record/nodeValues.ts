import * as A from '@core/arena'

import { CategoryItems, DateFormats, Dates, Objects } from '@openforis/arena-core'
import type {
  ArenaRecord,
  ArenaRecordNode,
  NodeDef as ArenaNodeDef,
  NodeDefType,
  Survey as ArenaSurvey,
} from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

type AnyNodeDef = ArenaNodeDef<NodeDefType>
type NodeValue = any // NOSONAR: node value shape depends on the node def type

type ValueComparatorParams = {
  survey: ArenaSurvey
  nodeDef: AnyNodeDef
  record?: ArenaRecord | null
  parentNode?: ArenaRecordNode | null
  value: NodeValue
  valueSearch: NodeValue
  attribute?: ArenaRecordNode | null
  strict?: boolean
}
type ValueComparator = (params: ValueComparatorParams) => boolean

type FastEqualityKeyExtractor = (params: { survey?: ArenaSurvey; value: NodeValue }) => string | null
type FastEqualityKey = { supported: boolean; key: string | null }

const singlePropValueEqualComparator: ValueComparator = ({ value, valueSearch }) =>
  value === valueSearch || String(value) === String(valueSearch)

const getValueCode = (value: NodeValue): string | null => {
  const code = typeof value === 'object' ? value[Node.valuePropsCode.code] : value
  return Objects.isEmpty(code) ? null : String(code)
}

const getValueItemUuid = (value: NodeValue): string | undefined => value[Node.valuePropsCode.itemUuid]

const extractCategoryItemUuidFromValue = ({
  survey,
  nodeDef,
  record,
  parentNode,
  value,
}: Pick<ValueComparatorParams, 'survey' | 'nodeDef' | 'record' | 'parentNode' | 'value'>): string | null => {
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

const extractCategoryItemCodeFromValue = ({
  survey,
  value,
  attribute = null,
}: {
  survey: ArenaSurvey
  value: NodeValue
  attribute?: ArenaRecordNode | null
}): string | null => {
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
  ({ formatsSource, formatTo }: { formatsSource: DateFormats[]; formatTo: DateFormats }): ValueComparator =>
  ({ value, valueSearch }) => {
    const toDateTime = (val: NodeValue): string | null => {
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

const valueComparatorByNodeDefType: Record<string, ValueComparator> = {
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
 * @param params - The function parameters.
 * @param params.survey - The survey object.
 * @param params.nodeDef - The node def of the compared values.
 * @param params.value - The 1st value to compare.
 * @param params.valueSearch - The 2nd value to compare.
 * @param params.record - The record object (mandatory when comparing values of hierarchical code attriutes).
 * @param params.parentNode - The parent node object (mandatory when comparing values of hierarchical code attriutes).
 * @param params.attribute - The attribute node object (not mandatory, it can be used to retrieve refData from it).
 * @param params.strict - When true, the comparison is done considering the value internal identifiers (e.g. Category item UUID),
 * otherwise values will be converted into values using internal identifiers (e.g. Category item codes into category item UUIDs).
 * @returns True if the values are equal.
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
}: ValueComparatorParams): boolean => {
  if (value === valueSearch) return true
  if (Objects.isEmpty(value) || Objects.isEmpty(valueSearch)) return false

  const valueComparator = valueComparatorByNodeDefType[NodeDef.getType(nodeDef)]
  return !!valueComparator?.({ survey, nodeDef, record, parentNode, value, valueSearch, attribute, strict })
}

// ===== Fast equality key (for building lookup indexes over flat/summary values)

// Node def types for which isValueEqual, when called WITHOUT record/parentNode/attribute
// (i.e. no hierarchical category item resolution), depends only on the 2 compared values
// and can therefore be reduced to a single string key safe to use as a Map bucket key.
const fastEqualityKeyExtractorByNodeDefType: Record<string, FastEqualityKeyExtractor> = {
  [NodeDef.nodeDefType.boolean]: ({ value }) => String(value),
  [NodeDef.nodeDefType.text]: ({ value }) => String(value),
  [NodeDef.nodeDefType.integer]: ({ value }) => String(value),
  [NodeDef.nodeDefType.decimal]: ({ value }) => String(value),
  [NodeDef.nodeDefType.code]: ({ survey, value }) => extractCategoryItemCodeFromValue({ survey, value }),
}

/**
 * Determines whether a node def type is supported by getFastEqualityKeyWithoutRecordContext.
 * @param nodeDefType - The node def type (see NodeDef.nodeDefType).
 * @returns True if the type is supported.
 */
const isTypeFastIndexable = (nodeDefType: string): boolean =>
  Object.hasOwn(fastEqualityKeyExtractorByNodeDefType, nodeDefType)

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
 * @param params - The function parameters.
 * @param params.survey - The survey object.
 * @param params.nodeDef - The node def of the compared value.
 * @param params.value - The value to compute the key for.
 * @returns supported is false if the node def type isn't indexable this way; key is null when the value is empty (see above).
 */
const getFastEqualityKeyWithoutRecordContext = ({
  survey,
  nodeDef,
  value,
}: {
  survey: ArenaSurvey
  nodeDef: AnyNodeDef
  value: NodeValue
}): FastEqualityKey => {
  const extractor = fastEqualityKeyExtractorByNodeDefType[NodeDef.getType(nodeDef)]
  if (!extractor) return { supported: false, key: null }
  if (Objects.isEmpty(value)) return { supported: true, key: null }
  const key = extractor({ survey, value })
  return { supported: true, key: Objects.isEmpty(key) ? null : key }
}

// Node def types for which isValueEqual, when called WITH record context (see findChildByKeyValues),
// can be reduced to a single string key; code attribute values are identified by their category item UUID
// (isValueEqual compares item UUIDs when both values have them).
const fastEqualityKeyInRecordContextExtractorByNodeDefType: Record<string, FastEqualityKeyExtractor> = {
  [NodeDef.nodeDefType.boolean]: ({ value }) => String(value),
  [NodeDef.nodeDefType.text]: ({ value }) => String(value),
  [NodeDef.nodeDefType.integer]: ({ value }) => String(value),
  [NodeDef.nodeDefType.decimal]: ({ value }) => String(value),
  [NodeDef.nodeDefType.code]: ({ value }) => (typeof value === 'object' ? (getValueItemUuid(value) ?? null) : null),
}

/**
 * Determines whether a node def type is supported by getFastEqualityKeyInRecordContext.
 * @param nodeDefType - The node def type (see NodeDef.nodeDefType).
 * @returns True if the type is supported.
 */
const isTypeFastIndexableInRecordContext = (nodeDefType: string): boolean =>
  Object.hasOwn(fastEqualityKeyInRecordContextExtractorByNodeDefType, nodeDefType)

/**
 * Computes a string key for building a lookup index of attribute values compared with isValueEqual WITH record context
 * (e.g. entity key attributes in a record).
 * For 2 non-empty values with a key, the keys match if and only if isValueEqual would consider them equal.
 * Empty values are given a null key (callers must treat it as "does not match anything", see getFastEqualityKeyWithoutRecordContext).
 * Non-empty values whose key cannot be determined without the record (e.g. code values without category item UUID,
 * whose item can depend on the parent code attribute) are not supported: callers must compare them using isValueEqual.
 * @param params - The function parameters.
 * @param params.nodeDef - The node def of the compared value.
 * @param params.value - The value to compute the key for.
 * @returns supported is false if the node def type or the value isn't indexable this way; key is null when the value is empty.
 */
const getFastEqualityKeyInRecordContext = ({
  nodeDef,
  value,
}: {
  nodeDef: AnyNodeDef
  value: NodeValue
}): FastEqualityKey => {
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
 * @param keyParts - The key parts.
 * @returns The composite key.
 */
const buildCompositeKey = (keyParts: string[]): string =>
  keyParts.map((keyPart) => `${keyPart.length}:${keyPart}`).join('')

/**
 * Computes a composite key for the values of the specified node defs (e.g. entity key attribute defs),
 * using the specified function to compute the key of every value
 * (e.g. getFastEqualityKeyWithoutRecordContext or getFastEqualityKeyInRecordContext).
 * @param params - The function parameters.
 * @param params.nodeDefs - The node defs whose values are part of the key.
 * @param params.getKey - Function returning the key of the value of the specified node def.
 * @returns supported is false if the key of some value is not supported; key is null if the key of some value is null (empty value).
 */
const getFastEqualityCompositeKey = ({
  nodeDefs,
  getKey,
}: {
  nodeDefs: AnyNodeDef[]
  getKey: (nodeDef: AnyNodeDef) => FastEqualityKey
}): FastEqualityKey => {
  const keyParts: string[] = []
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
