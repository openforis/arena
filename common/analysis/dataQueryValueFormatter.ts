import type { ArenaI18n, ArenaSurvey } from '@openforis/arena-core'
import { ArenaAnyNodeDef, Numbers } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as DateUtils from '@core/dateUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

// Aggregate function results (mean, median, sum, etc.) are capped to this many decimal places
const MAX_AGGREGATE_VALUE_DECIMAL_DIGITS = 3

type FormatParams = {
  i18n: ArenaI18n
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  value: any
  label?: string | null
  isMeasure?: boolean
}

const formatAggregateValue = (value: number): string => {
  const rounded = Numbers.roundToPrecision(value, MAX_AGGREGATE_VALUE_DECIMAL_DIGITS)
  return Number.isNaN(rounded) ? '' : String(rounded)
}

const formatters: Partial<Record<string, (params: FormatParams) => string>> = {
  [NodeDef.nodeDefType.boolean]: ({ value, i18n, nodeDef }) =>
    i18n.t(`surveyForm:nodeDefBoolean.labelValue.${NodeDef.getLabelValue(nodeDef)}.${value}`),
  [NodeDef.nodeDefType.code]: ({ value, label }) => label ?? value,
  [NodeDef.nodeDefType.date]: ({ value }) => DateUtils.format(DateUtils.parseISO(value), DateUtils.formats.dateDefault),
  [NodeDef.nodeDefType.decimal]: ({ survey, nodeDef, value, isMeasure }) => {
    if (isMeasure) return formatAggregateValue(value)
    const maxNumberDecimalDigits = Survey.getNodeDefMaxDecimalDigits(nodeDef)(survey)
    return Numbers.formatDecimal(value, maxNumberDecimalDigits)
  },
  [NodeDef.nodeDefType.entity]: ({ value }) => {
    // value is an integer (entity items count)
    return Numbers.formatInteger(value)
  },
  [NodeDef.nodeDefType.integer]: ({ value, isMeasure }) =>
    isMeasure ? formatAggregateValue(value) : Numbers.formatInteger(value),
}

const format = ({ i18n, survey, nodeDef, value, label, isMeasure = false }: FormatParams): string => {
  if (A.isNull(value)) {
    return ''
  }
  const formatter = formatters[NodeDef.getType(nodeDef)]
  const formatValue = (v: unknown) =>
    formatter ? formatter({ i18n, survey, nodeDef, value: v, label, isMeasure }) : value

  return NodeDef.isMultiple(nodeDef) && Array.isArray(value) ? value.map(formatValue).join(', ') : formatValue(value)
}

const formatDataItemKey = ({
  i18n,
  survey,
  nodeDef,
  dataItem,
}: {
  i18n: ArenaI18n
  survey: ArenaSurvey
  nodeDef: ArenaAnyNodeDef
  dataItem: Record<string, any>
}): string => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const rawValue = dataItem[nodeDefName]
  const label = dataItem[`${nodeDefName}_label`]
  return format({ i18n, survey, nodeDef, value: rawValue, label })
}

export const DataQueryValueFormatter = {
  format,
  formatDataItemKey,
}
