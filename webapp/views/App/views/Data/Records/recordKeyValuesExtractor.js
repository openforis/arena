import { Numbers, Objects, Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'
import * as DateUtils from '@core/dateUtils'

const valueFormattersByType = {
  [NodeDef.nodeDefType.code]: ({ cycle, nodeDef, value: code, categoryItemsByCodeDefUuid = null, lang = null }) => {
    if (!categoryItemsByCodeDefUuid) return code

    const item = categoryItemsByCodeDefUuid[NodeDef.getUuid(nodeDef)]?.find(
      (item) => CategoryItem.getCode(item) === code
    )
    if (item) {
      const result = NodeDefLayout.isCodeShown(cycle)(nodeDef)
        ? CategoryItem.getLabelWithCode(lang)(item)
        : CategoryItem.getLabel(lang)(item)
      return result ?? CategoryItem.getCode(item)
    }
    return code
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

const extractKeyOrSummaryValue = ({ nodeDef, record, srsIndex, categoryItemsByCodeDefUuid = null, lang = null }) => {
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
  return formatter({ srsIndex, cycle, nodeDef, value, categoryItemsByCodeDefUuid, lang })
}

const extractKeyValues = ({ survey, record, categoryItemsByCodeDefUuid, lang }) => {
  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  const srsIndex = Survey.getSRSIndex(survey)
  return nodeDefKeys.map((nodeDef) =>
    extractKeyOrSummaryValue({ srsIndex, nodeDef, record, categoryItemsByCodeDefUuid, lang })
  )
}

const extractKeyValuesAndLabels = ({ survey, record, categoryItemsByCodeDefUuid, lang }) => {
  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  const srsIndex = Survey.getSRSIndex(survey)
  return nodeDefKeys.map((nodeDef) => {
    const label = NodeDef.getLabel(nodeDef, lang)
    const keyValue = extractKeyOrSummaryValue({ srsIndex, nodeDef, record, categoryItemsByCodeDefUuid, lang })
    return `${label}=${keyValue}`
  })
}

export const RecordKeyValuesExtractor = {
  extractKeyOrSummaryValue,
  extractKeyValues,
  extractKeyValuesAndLabels,
}
