import { Numbers, Objects, Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'
import * as DateUtils from '@core/dateUtils'

// Items at a hierarchical category level can reuse the same code under different parent items
// (e.g. per-plot numbering restarting at each sampling point), so matching by code alone is not
// enough: disambiguate using the ancestor codes actually selected in this record.
const _getSelectedAncestorCodes = ({ survey, nodeDef, keysOrSummaryFields }) => {
  const ancestorCodes = []
  let parentCodeDef = Survey.getNodeDefParentCode(nodeDef)(survey)
  while (parentCodeDef) {
    ancestorCodes.unshift(keysOrSummaryFields[NodeDef.getName(parentCodeDef)])
    parentCodeDef = Survey.getNodeDefParentCode(parentCodeDef)(survey)
  }
  return ancestorCodes
}

const _findCategoryItem = ({ survey, nodeDef, code, categoryItemsByCodeDefUuid, keysOrSummaryFields }) => {
  const items = categoryItemsByCodeDefUuid[NodeDef.getUuid(nodeDef)] ?? []
  const candidates = items.filter((item) => CategoryItem.getCode(item) === code)
  if (candidates.length <= 1) return candidates[0]

  const selectedAncestorCodes = _getSelectedAncestorCodes({ survey, nodeDef, keysOrSummaryFields })
  return (
    candidates.find((candidate) => {
      const candidateAncestorCodes = CategoryItem.getAncestorCodes(candidate)
      return (
        candidateAncestorCodes.length === selectedAncestorCodes.length &&
        candidateAncestorCodes.every((ancestorCode, index) => ancestorCode === selectedAncestorCodes[index])
      )
    }) ?? candidates[0]
  )
}

const valueFormattersByType = {
  [NodeDef.nodeDefType.code]: ({
    survey,
    cycle,
    nodeDef,
    value: code,
    categoryItemsByCodeDefUuid = null,
    keysOrSummaryFields,
    lang = null,
  }) => {
    if (!categoryItemsByCodeDefUuid) return code

    const item = _findCategoryItem({ survey, nodeDef, code, categoryItemsByCodeDefUuid, keysOrSummaryFields })
    if (!item) return null

    const result = NodeDefLayout.isCodeShown(cycle)(nodeDef)
      ? CategoryItem.getLabelWithCode(lang)(item)
      : CategoryItem.getLabel(lang)(item)
    return result ?? CategoryItem.getCode(item)
  },
  [NodeDef.nodeDefType.coordinate]: ({ value, srsIndex }) => {
    const point = Points.parse(value)
    if (!point) return ''
    const pointLatLon = Points.toLatLong(point, srsIndex)
    if (!pointLatLon) return ''
    return `${Numbers.roundToPrecision(point.y, 6)}, ${Numbers.roundToPrecision(point.x, 6)}`
  },
  [NodeDef.nodeDefType.date]: ({ value }) =>
    DateUtils.convertDate({
      dateStr: value,
      formatFrom: DateUtils.formats.datetimeISO,
      formatTo: DateUtils.formats.dateDefault,
    }),
  [NodeDef.nodeDefType.time]: ({ value }) =>
    DateUtils.convertDate({
      dateStr: value,
      formatFrom: 'HH:mm:ss',
      formatTo: DateUtils.formats.timeStorage,
    }),
}

const extractKeyOrSummaryValue = ({
  survey,
  nodeDef,
  record,
  srsIndex,
  categoryItemsByCodeDefUuid = null,
  lang = null,
}) => {
  const name = NodeDef.getName(nodeDef)
  let field = name
  if (NodeDef.isCode(nodeDef) && !categoryItemsByCodeDefUuid) {
    field = `${field}_label`
  }
  const keysOrSummaryFields = { ...Record.getKeysObj(record), ...Record.getSummaryAttributesObj(record) }
  const value = keysOrSummaryFields[field]
  if (Objects.isEmpty(value)) {
    return ''
  }
  const cycle = Record.getCycle(record)
  const formatter = valueFormattersByType[NodeDef.getType(nodeDef)]
  if (!formatter) {
    return String(value)
  }
  const result = formatter({
    survey,
    srsIndex,
    cycle,
    nodeDef,
    value,
    categoryItemsByCodeDefUuid,
    keysOrSummaryFields,
    lang,
  })
  if (result === null && NodeDef.isCode(nodeDef)) {
    const label = keysOrSummaryFields[`${name}_label`]
    if (!Objects.isEmpty(label)) return label
  }
  return result
}

const extractKeyValues = ({ survey, record, categoryItemsByCodeDefUuid, lang }) => {
  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  const srsIndex = Survey.getSRSIndex(survey)
  return nodeDefKeys.map((nodeDef) =>
    extractKeyOrSummaryValue({ survey, srsIndex, nodeDef, record, categoryItemsByCodeDefUuid, lang })
  )
}

const extractKeyValuesAndLabels = ({ survey, record, categoryItemsByCodeDefUuid, lang }) => {
  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  const srsIndex = Survey.getSRSIndex(survey)
  return nodeDefKeys.map((nodeDef) => {
    const label = NodeDef.getLabel(nodeDef, lang)
    const keyValue = extractKeyOrSummaryValue({ survey, srsIndex, nodeDef, record, categoryItemsByCodeDefUuid, lang })
    return `${label}=${keyValue}`
  })
}

export const RecordKeyValuesExtractor = {
  extractKeyOrSummaryValue,
  extractKeyValues,
  extractKeyValuesAndLabels,
}
