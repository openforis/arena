const R = require('ramda')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')

const Record = require('@core/record/record')
const Node = require('@core/record/node')
const RecordExpressionParser = require('@core/record/recordExpressionParser')
const RecordExpressionValueConverter = require('@core/record/recordExpressionValueConverter')

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
    const exprEval = RecordExpressionParser.evalApplicableExpression(
      survey, record, nodeCtx, NodeDef.getApplicable(nodeDef)
    )
    const applicable = R.propOr(false, 'value', exprEval)

    //4. persist updated node value if changed, and return updated node
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const nodeCtxUuid = Node.getUuid(nodeCtx)

    if (Node.isChildApplicable(nodeDefUuid)(nodeCtx) !== applicable) {
      //applicability changed

      //update node and add it to nodesUpdated
      nodesUpdated[nodeCtxUuid] = {
        ...await NodeRepository.updateChildrenApplicability(
          Survey.getId(survey),
          nodeCtxUuid,
          nodeDefUuid,
          applicable,
          tx
        ),
        //preserve 'created' flag (used by rdb generator)
        ...Node.isCreated(nodeCtx) ? { [Node.keys.created]: true } : {}
      }

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

  const nodePointersToUpdate = Record.getDependentNodePointers(
    survey,
    node,
    Survey.dependencyTypes.defaultValues,
    true, // includeSelf
    nodeDependentPointersFilterFn,
  )(record)

  //2. update expr to node and dependent nodes
  const nodesUpdated = await Promise.all(
    nodePointersToUpdate.map(async ({ nodeCtx, nodeDef }) => {

      //3. evaluate applicable default value expression
      const exprEval = RecordExpressionParser.evalApplicableExpression(
        survey, record, nodeCtx, NodeDef.getDefaultValues(nodeDef)
      )

      const oldValue = Node.getValue(nodeCtx, null)

      const exprValue = R.pipe(
        R.propOr(null, 'value'),
        R.unless(
          R.isNil,
          value => RecordExpressionValueConverter.toNodeValue(survey, record, nodeCtx, value)
        )
      )(exprEval)

      //4. persist updated node value if changed, and return updated node

      if (R.equals(oldValue, exprValue)) return {}

      const nodeCtxUuid = Node.getUuid(nodeCtx)

      return {
        [nodeCtxUuid]: await NodeRepository.updateNode(
          Survey.getId(survey),
          nodeCtxUuid,
          exprValue,
          { [Node.metaKeys.defaultValue]: !R.isNil(exprEval) },
          Record.isPreview(record),
          tx
        )
      }
    })
  )

  return R.mergeAll(nodesUpdated)
}

module.exports = {
  updateDependentsDefaultValues,
  updateDependentsApplicable,
}