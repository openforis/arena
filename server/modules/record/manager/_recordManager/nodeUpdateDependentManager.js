const R = require('ramda')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')

const Record = require('../../../../../common/record/record')
const Node = require('../../../../../common/record/node')
const RecordExprParser = require('../../../../../common/record/recordExprParser')

const NodeRepository = require('../../repository/nodeRepository')

/**
 * Module responsible for updating applicable and default values
 */

const updateDependentsApplicable = async (survey, record, node, tx) => {
  //output
  const nodesUpdated = {} //updated nodes indexed by uuid

  //1. fetch dependent nodes
  const nodePointersToUpdate = Record.getDependentNodePointers(survey, node, Survey.dependencyTypes.applicable)(record)

  //2. update expr to node and dependent nodes
  //NOTE: don't do it in parallel, same nodeCtx metadata could be overwritten
  for (const { nodeCtx, nodeDef } of nodePointersToUpdate) {
    //3. evaluate applicable expression
    const exprEval = await RecordExprParser.evalApplicableExpression(survey, record, nodeCtx, NodeDef.getApplicable(nodeDef))
    const applicable = R.propOr(false, 'value', exprEval)

    //4. persist updated node value if changed, and return updated node
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const nodeCtxUuid = Node.getUuid(nodeCtx)

    if (Node.isChildApplicable(nodeDefUuid)(nodeCtx) !== applicable) {
      //applicability changed

      //update node and add it to nodesUpdated
      nodesUpdated[nodeCtxUuid] = await NodeRepository.updateChildrenApplicability(
        Survey.getId(survey),
        nodeCtxUuid,
        nodeDefUuid,
        applicable,
        tx
      )

      const nodeCtxChildren = Record.getNodeChildrenByDefUuid(nodeCtx, nodeDefUuid)(record)

      for (const nodeCtxChild of nodeCtxChildren) {
        //5. add nodeCtxChild and its descendants to nodesUpdated
        Record.visitDescendantsAndSelf(
          nodeCtxChild,
          node => nodesUpdated[Node.getUuid(node)] = node
        )(record)
      }
    }
  }

  return nodesUpdated
}

const updateDependentsDefaultValues = async (survey, record, node, tx) => {

  //1. fetch dependent nodes

  // filter nodes to update including itself and (attributes with empty values or with default values applied)
  // therefore attributes with user defined values are excluded
  const nodeDependentPointersFilterFn = nodePointer => {
    const { nodeCtx, nodeDef } = nodePointer

    return NodeDef.isAttribute(nodeDef) &&
      (
        Node.isValueBlank(nodeCtx) ||
        Node.isDefaultValueApplied(nodeCtx)
      )
  }

  const nodePointersToUpdate = Record.getDependentNodePointers(survey, node, Survey.dependencyTypes.defaultValues, true, nodeDependentPointersFilterFn)(record)

  //2. update expr to node and dependent nodes
  const nodesUpdated = await Promise.all(
    nodePointersToUpdate.map(async nodePointer => {
      const { nodeCtx, nodeDef } = nodePointer

      //3. evaluate applicable default value expression
      const exprEval = await RecordExprParser.evalApplicableExpression(survey, record, nodeCtx, NodeDef.getDefaultValues(nodeDef))
      const exprValue = R.propOr(null, 'value', exprEval)

      //4. persist updated node value if changed, and return updated node
      const value = await toNodeValue(survey, record, nodeCtx, exprValue)
      const oldValue = Node.getValue(nodeCtx, null)
      const nodeCtxUuid = Node.getUuid(nodeCtx)

      return R.equals(oldValue, value)
        ? {}
        : {
          [nodeCtxUuid]: await NodeRepository.updateNode(
            Survey.getId(survey),
            nodeCtxUuid,
            value,
            { [Node.metaKeys.defaultValue]: !R.isNil(exprEval) },
            tx
          )
        }
    })
  )

  return R.mergeAll(nodesUpdated)
}

// convert expression result into a node value
// it uses categoryRepository or taxonomyRepository when expression result is category item code or taxon code
const toNodeValue = async (survey, record, node, valueExpr) => {
  if (R.isNil(valueExpr) || R.isEmpty(valueExpr)) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const isExprPrimitive = R.is(String, valueExpr) || R.is(Number, valueExpr)

  if (isExprPrimitive) {
    if (NodeDef.isCode(nodeDef)) {
      // valueExpr is the code of a category item
      // cast to string because it could be a Number
      const code = '' + valueExpr
      const parentNode = Record.getParentNode(node)(record)

      const { itemUuid } = Survey.getCategoryItemUuidAndCodeHierarchy(survey, nodeDef, record, parentNode, code)(survey) || {}

      return itemUuid ? { [Node.valuePropKeys.itemUuid]: itemUuid } : null

    } else if (NodeDef.isTaxon(nodeDef)) {
      // valueExpr is the code of a taxon
      // cast to string because it could be a Number
      const code = '' + valueExpr
      const taxonUuid = Survey.getTaxonUuid(nodeDef, code)(survey)

      return taxonUuid ? { [Node.valuePropKeys.taxonUuid]: taxonUuid } : null
    }
  }

  return valueExpr
}

module.exports = {
  updateDependentsDefaultValues,
  updateDependentsApplicable,
}