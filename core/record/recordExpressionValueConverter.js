import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as DateUtils from '@core/dateUtils'

const _toPrimitive = (val, TypeTo) => (R.is(String, val) || R.is(Number, val) ? TypeTo(val) : null)

const _toBoolean = ({ valueExpr }) => {
  if (R.is(Boolean, valueExpr)) {
    return String(valueExpr)
  }
  if (R.is(String, valueExpr) && R.includes(valueExpr, ['true', 'false'])) {
    return valueExpr
  }
  return null
}

const _toCode = ({ survey, record, nodeCtx, valueExpr }) => {
  // ValueExpr is the code of a category item
  const code = _toPrimitive(valueExpr, String)
  if (code === null) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  const parentNode = Record.getParentNode(nodeCtx)(record)

  const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy(survey, nodeDef, record, parentNode, code)(survey)

  return itemUuid ? { [Node.valuePropKeys.itemUuid]: itemUuid } : null
}

const _toTaxon = ({ survey, nodeCtx, valueExpr }) => {
  // ValueExpr is the code of a taxon
  const taxonCode = _toPrimitive(valueExpr, String)
  if (taxonCode === null) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  const taxonUuid = Survey.getTaxonUuid(nodeDef, taxonCode)(survey)

  return taxonUuid ? { [Node.valuePropKeys.taxonUuid]: taxonUuid } : null
}

const _valueExprToValueNodeFns = {
  [NodeDef.nodeDefType.boolean]: _toBoolean,
  [NodeDef.nodeDefType.code]: _toCode,
  [NodeDef.nodeDefType.date]: ({ valueExpr }) =>
    valueExpr instanceof Date ? DateUtils.formatDateISO(valueExpr) : valueExpr,
  [NodeDef.nodeDefType.decimal]: ({ valueExpr }) => _toPrimitive(valueExpr, Number),
  [NodeDef.nodeDefType.integer]: ({ valueExpr }) => _toPrimitive(valueExpr, Number),
  [NodeDef.nodeDefType.taxon]: _toTaxon,
  [NodeDef.nodeDefType.text]: ({ valueExpr }) => _toPrimitive(valueExpr, String),
  [NodeDef.nodeDefType.time]: ({ valueExpr }) =>
    valueExpr instanceof Date ? DateUtils.format(valueExpr, 'HH:mm') : valueExpr,
}

export const toNodeValue = (survey, record, nodeCtx, valueExpr) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  return _valueExprToValueNodeFns[NodeDef.getType(nodeDef)]({ survey, record, nodeCtx, valueExpr })
}
