import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

const _toPrimitive = (val, TypeTo) =>
  R.is(String, val) || R.is(Number, val) ? TypeTo(val) : null

const _toBoolean = (survey, record, nodeCtx, valueExpr) =>
  R.is(Boolean, valueExpr)
    ? String(valueExpr)
    : R.is(String, valueExpr) && R.includes(valueExpr, ['true', 'false'])
    ? valueExpr
    : null

const _toCode = (survey, record, nodeCtx, valueExpr) => {
  // ValueExpr is the code of a category item
  const code = _toPrimitive(valueExpr, String)
  if (code === null) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  const parentNode = Record.getParentNode(nodeCtx)(record)

  const {itemUuid} = Survey.getCategoryItemUuidAndCodeHierarchy(
    survey,
    nodeDef,
    record,
    parentNode,
    code,
  )(survey)

  return itemUuid ? {[Node.valuePropKeys.itemUuid]: itemUuid} : null
}

const _toTaxon = (survey, record, nodeCtx, valueExpr) => {
  // ValueExpr is the code of a taxon
  const taxonCode = _toPrimitive(valueExpr, String)
  if (taxonCode === null) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  const taxonUuid = Survey.getTaxonUuid(nodeDef, taxonCode)(survey)

  return taxonUuid ? {[Node.valuePropKeys.taxonUuid]: taxonUuid} : null
}

const _valueExprToValueNodeFns = {
  [NodeDef.nodeDefType.boolean]: _toBoolean,
  [NodeDef.nodeDefType.code]: _toCode,
  [NodeDef.nodeDefType.date]: (survey, record, nodeCtx, valueExpr) => valueExpr,
  [NodeDef.nodeDefType.decimal]: (survey, record, nodeCtx, valueExpr) =>
    _toPrimitive(valueExpr, Number),
  [NodeDef.nodeDefType.integer]: (survey, record, nodeCtx, valueExpr) =>
    _toPrimitive(valueExpr, Number),
  [NodeDef.nodeDefType.taxon]: _toTaxon,
  [NodeDef.nodeDefType.text]: (survey, record, nodeCtx, valueExpr) =>
    _toPrimitive(valueExpr, String),
  [NodeDef.nodeDefType.time]: (survey, record, nodeCtx, valueExpr) => valueExpr,
}

export const toNodeValue = (survey, record, nodeCtx, valueExpr) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  return _valueExprToValueNodeFns[NodeDef.getType(nodeDef)](
    survey,
    record,
    nodeCtx,
    valueExpr,
  )
}
