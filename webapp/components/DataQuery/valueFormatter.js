import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NumberUtils from '@core/numberUtils'
import * as DateUtils from '@core/dateUtils'

const findMaxNumberDecimalDigits = ({ survey, nodeDef }) => {
  if (survey && NodeDef.isAreaBasedEstimatedOf(nodeDef)) {
    const areaBasedEstimatedOfNodeDef = Survey.getAreaBasedEstimatedOfNodeDef(nodeDef)(survey)
    return NodeDef.getMaxNumberDecimalDigits(areaBasedEstimatedOfNodeDef)
  }
  return NodeDef.getMaxNumberDecimalDigits(nodeDef)
}

const formatters = {
  [NodeDef.nodeDefType.boolean]: ({ value, i18n, nodeDef }) =>
    i18n.t(`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`),
  [NodeDef.nodeDefType.code]: ({ value, label }) => label ?? value,
  [NodeDef.nodeDefType.date]: ({ value }) => DateUtils.format(DateUtils.parseISO(value), DateUtils.formats.dateDefault),
  [NodeDef.nodeDefType.decimal]: ({ survey, nodeDef, value }) => {
    const maxNumberDecimalDigits = findMaxNumberDecimalDigits({ survey, nodeDef })
    return NumberUtils.formatDecimal(value, maxNumberDecimalDigits)
  },

  [NodeDef.nodeDefType.entity]: ({ value }) => {
    // value is an integer (entity items count)
    return NumberUtils.formatInteger(value)
  },
  [NodeDef.nodeDefType.integer]: ({ value }) => NumberUtils.formatInteger(value),
}

const format = ({ i18n, survey, nodeDef, value, label }) => {
  if (A.isNull(value)) {
    return ''
  }
  const formatter = formatters[NodeDef.getType(nodeDef)]
  const formatValue = (v) => (formatter ? formatter({ i18n, survey, nodeDef, value: v, label }) : value)

  return NodeDef.isMultiple(nodeDef) && Array.isArray(value) ? value.map(formatValue).join(', ') : formatValue(value)
}

export const ValueFormatter = {
  format,
}
