import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Taxon from '@core/survey/taxon'

import * as NumberUtils from '@core/numberUtils'
import * as DateUtils from '@core/dateUtils'

const formatters = {
  [NodeDef.nodeDefType.code]: ({ survey, value }) => {
    const itemUuid = value[Node.valuePropsCode.itemUuid]
    if (!itemUuid) return null
    const categoryItem = Survey.getCategoryItemByUuid(itemUuid)(survey)
    if (!categoryItem) return null
    return CategoryItem.getCode(categoryItem)
  },
  [NodeDef.nodeDefType.date]: ({ value }) => DateUtils.format(DateUtils.parseISO(value), DateUtils.formats.dateDefault),
  [NodeDef.nodeDefType.decimal]: ({ value, nodeDef }) =>
    NumberUtils.formatDecimal(value, NodeDef.getMaxNumberDecimalDigits(nodeDef)),
  [NodeDef.nodeDefType.integer]: ({ value }) => NumberUtils.formatInteger(value),
  [NodeDef.nodeDefType.taxon]: ({ survey, value }) => {
    const taxonUuid = value[Node.valuePropsTaxon.taxonUuid]
    if (!taxonUuid) return null
    const taxon = Survey.getTaxonByUuid(taxonUuid)(survey)
    if (!taxon) return null
    return Taxon.getCode(taxon)
  },
}

const format = ({ survey, nodeDef, value }) => {
  if (A.isNull(value)) {
    return ''
  }
  const formatter = formatters[NodeDef.getType(nodeDef)]
  const formatValue = (v) => (formatter ? formatter({ survey, nodeDef, value: v }) : value)

  return NodeDef.isMultiple(nodeDef) && Array.isArray(value) ? value.map(formatValue).join(', ') : formatValue(value)
}

export const NodeValueFormatter = {
  format,
}
