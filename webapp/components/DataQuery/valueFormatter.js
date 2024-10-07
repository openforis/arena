import { Numbers } from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as DateUtils from '@core/dateUtils'

const formatters = {
  [NodeDef.nodeDefType.boolean]: ({ value, i18n, nodeDef }) =>
    i18n.t(`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`),
  [NodeDef.nodeDefType.code]: ({ value, label }) => label ?? value,
  [NodeDef.nodeDefType.date]: ({ value }) => DateUtils.format(DateUtils.parseISO(value), DateUtils.formats.dateDefault),
  [NodeDef.nodeDefType.decimal]: ({ survey, nodeDef, value }) => {
    const maxNumberDecimalDigits = Survey.getNodeDefMaxDecimalDigits(nodeDef)(survey)
    return Numbers.formatDecimal(value, maxNumberDecimalDigits)
  },

  [NodeDef.nodeDefType.entity]: ({ value }) => {
    // value is an integer (entity items count)
    return Numbers.formatInteger(value)
  },
  [NodeDef.nodeDefType.integer]: ({ value }) => Numbers.formatInteger(value),
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
