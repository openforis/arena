import * as A from '@core/arena'

import * as NodeDef from '@core/survey/nodeDef'
import * as NumberUtils from '@core/numberUtils'
import * as DateUtils from '@core/dateUtils'

const formatters = {
  [NodeDef.nodeDefType.boolean]: ({ value, i18n, nodeDef }) =>
    i18n.t(`surveyForm.nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`),
  [NodeDef.nodeDefType.date]: ({ value }) => DateUtils.format(DateUtils.parseISO(value), DateUtils.formats.dateDefault),
  [NodeDef.nodeDefType.decimal]: ({ value, nodeDef }) =>
    NumberUtils.formatDecimal(value, NodeDef.getMaxNumberDecimalDigits(nodeDef)),
  [NodeDef.nodeDefType.integer]: ({ value }) => NumberUtils.formatInteger(value),
}

const format = ({ value, i18n, nodeDef }) => {
  if (A.isNull(value)) {
    return ''
  }
  const formatter = formatters[NodeDef.getType(nodeDef)]
  return formatter ? formatter({ value, i18n, nodeDef }) : value
}

export const ValueFormatter = {
  format,
}
