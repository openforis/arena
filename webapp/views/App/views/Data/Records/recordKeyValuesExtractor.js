import * as A from '@core/arena'
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
  [NodeDef.nodeDefType.coordinate]: ({ value }) => [value.x, value.y, value.srs].join(', '),

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

const extractKeyValue = ({ nodeDef, record, categoryItemsByCodeDefUuid = null, lang = null }) => {
  const name = NodeDef.getName(nodeDef)
  let keyField = name
  if (NodeDef.isCode(nodeDef) && !categoryItemsByCodeDefUuid) {
    keyField = `${keyField}_label`
  }
  const value = record[A.camelize(keyField)]
  const cycle = Record.getCycle(record)
  const formatter = valueFormattersByType[NodeDef.getType(nodeDef)]
  return value && formatter ? formatter({ cycle, nodeDef, value, categoryItemsByCodeDefUuid, lang }) : value
}

const extractKeyValues = ({ survey, record, categoryItemsByCodeDefUuid, lang }) => {
  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  return nodeDefKeys.map((nodeDef) => extractKeyValue({ nodeDef, record, categoryItemsByCodeDefUuid, lang }))
}

export const RecordKeyValuesExtractor = {
  extractKeyValue,
  extractKeyValues,
}
