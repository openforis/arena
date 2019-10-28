import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

const _valueExprToValueBoolean = (survey, record, nodeCtx, valueExpr) =>
  R.is(String, valueExpr) && R.includes(valueExpr, ['true', 'false'])
    ? valueExpr
    : null

const _isStringOrNumber = val => R.is(String, val) || R.is(Number, val)

const _valueExprToCode = valueExpr =>
  _isStringOrNumber(valueExpr)
    ? String(valueExpr) // cast to string because it could be a Number
    : null

const _valueExprToValueCode = (survey, record, nodeCtx, valueExpr) => {
  // valueExpr is the code of a category item
  const code = _valueExprToCode(valueExpr)
  if (code === null)
    return null

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  const parentNode = Record.getParentNode(nodeCtx)(record)

  const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy(survey, nodeDef, record, parentNode, code)(survey) || {}

  return itemUuid ? { [Node.valuePropKeys.itemUuid]: itemUuid } : null
}

const _valueExprToValueTaxon = (survey, record, nodeCtx, valueExpr) => {
  // valueExpr is the code of a taxon
  const taxonCode = _valueExprToCode(valueExpr)
  if (taxonCode === null)
    return null

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  const taxonUuid = Survey.getTaxonUuid(nodeDef, taxonCode)(survey)

  return taxonUuid ? { [Node.valuePropKeys.taxonUuid]: taxonUuid } : null
}

const _valueExprToValueNodeFns = {
  [NodeDef.nodeDefType.boolean]: _valueExprToValueBoolean,
  [NodeDef.nodeDefType.code]: _valueExprToValueCode,
  [NodeDef.nodeDefType.date]: (survey, record, nodeCtx, valueExpr) => valueExpr,
  [NodeDef.nodeDefType.decimal]: (survey, record, nodeCtx, valueExpr) => R.ifElse(_isStringOrNumber, Number, R.always(null))(valueExpr),
  [NodeDef.nodeDefType.integer]: (survey, record, nodeCtx, valueExpr) => R.ifElse(_isStringOrNumber, Number, R.always(null))(valueExpr),
  [NodeDef.nodeDefType.taxon]: _valueExprToValueTaxon,
  [NodeDef.nodeDefType.text]: (survey, record, nodeCtx, valueExpr) => _isStringOrNumber(valueExpr) ? String(valueExpr) : null,
  [NodeDef.nodeDefType.time]: (survey, record, nodeCtx, valueExpr) => valueExpr,
}

export const valueExprToValueNode = (survey, record, nodeCtx, valueExpr) => {
  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(nodeCtx))(survey)
  return _valueExprToValueNodeFns[NodeDef.getType(nodeDef)](survey, record, nodeCtx, valueExpr)
}