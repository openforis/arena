import * as A from '@core/arena'
import * as DateUtils from '@core/dateUtils'
import * as NumberUtils from '@core/numberUtils'
import * as NodeDef from '@core/survey/nodeDef'

const formatters = {
  [NodeDef.nodeDefType.boolean]: ({ value, i18n, nodeDef }) =>
    i18n.t(`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`),
  [NodeDef.nodeDefType.code]: ({ value, label }) => label ?? value,
  [NodeDef.nodeDefType.date]: ({ value }) => DateUtils.format(DateUtils.parseISO(value), DateUtils.formats.dateDefault),
  [NodeDef.nodeDefType.decimal]: ({ value, nodeDef }) =>
    NumberUtils.formatDecimal(value, NodeDef.getMaxNumberDecimalDigits(nodeDef)),
  [NodeDef.nodeDefType.integer]: ({ value }) => NumberUtils.formatInteger(value),
}

const format = ({ value, label, i18n, nodeDef }) => {
  if (A.isNull(value)) {
    return ''
  }
  const formatter = formatters[NodeDef.getType(nodeDef)]
  const formatValue = (v) => (formatter ? formatter({ value: v, label, i18n, nodeDef }) : value)

  return NodeDef.isMultiple(nodeDef) && Array.isArray(value) ? value.map(formatValue).join(', ') : formatValue(value)
}

export const ValueFormatter = {
  format,
}
