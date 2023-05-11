import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

const singlePropValueEqualComparator = ({ value, valueSearch }) =>
  value === valueSearch || String(value) === String(valueSearch)

const getValueCode = (value) => (StringUtils.isString(value) ? value : value[Node.valuePropsCode.code])
const getValueItemUuid = (value) => value[Node.valuePropsCode.itemUuid]

const extractCategoryItemUuidFromValue = ({ survey, nodeDef, record, parentNode, value, strict }) => {
  const itemUuid = getValueItemUuid(value)
  if (itemUuid) {
    return itemUuid
  }
  if (strict) {
    // strict comparison: if itemUuid is not defined, do not convert value "code" into itemUuid
    return null
  }

  // find itemUuid by code
  const code = getValueCode(value)
  if (!Objects.isEmpty(code)) {
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

const valueComparatorByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.code]: ({ survey, nodeDef, record, parentNode, value, valueSearch, strict }) => {
    if (value === valueSearch) return true
    if (Objects.isEmpty(value) || Objects.isEmpty(valueSearch)) return false

    const itemUuid = extractCategoryItemUuidFromValue({ survey, nodeDef, record, parentNode, value, strict })
    const itemUuidSearch = extractCategoryItemUuidFromValue({
      survey,
      nodeDef,
      record,
      parentNode,
      value: valueSearch,
      strict,
    })
    return itemUuidSearch === itemUuid
  },
  [NodeDef.nodeDefType.coordinate]: ({ value, valueSearch }) => R.equals(value, valueSearch),
  [NodeDef.nodeDefType.date]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.decimal]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.integer]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.taxon]: ({ value, valueSearch }) => {
    if (value === valueSearch) return true
    if (!value) return false
    if (!valueSearch) return false
    return value[Node.valuePropsTaxon.taxonUuid] === valueSearch[Node.valuePropsTaxon.taxonUuid]
  },
  [NodeDef.nodeDefType.text]: singlePropValueEqualComparator,
  [NodeDef.nodeDefType.time]: singlePropValueEqualComparator,
}

const isValueEqual = ({ survey, nodeDef, value, valueSearch, record = null, parentNode = null, strict = false }) => {
  const valueComparator = valueComparatorByNodeDefType[NodeDef.getType(nodeDef)]
  return valueComparator && valueComparator({ survey, nodeDef, record, parentNode, value, valueSearch, strict })
}

export const NodeValues = {
  isValueEqual,
}
