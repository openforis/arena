const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../../../../common/survey/survey')
const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefExpression = require('../../../../../common/survey/nodeDefExpression')
const Category = require('../../../../../common/survey/category')
const CategoryItem = require('../../../../../common/survey/categoryItem')
const Taxonomy = require('../../../../../common/survey/taxonomy')

const Record = require('../../../../../common/record/record')
const Node = require('../../../../../common/record/node')

const NodeRepository = require('../../repository/nodeRepository')
const CategoryRepository = require('../../../category/repository/categoryRepository')
const TaxonomyRepository = require('../../../taxonomy/repository/taxonomyRepository')

const RecordExprParser = require('../../recordExprParser')

/**
 * Module responsible for updating applicable and default values
 */

const updateDependentsApplicable = async (survey, record, node, tx) => {

  //1. fetch dependent nodes
  const nodesToUpdate = Record.getDependentNodes(survey, node, Survey.dependencyTypes.applicable)(record)

  //2. update expr to node and dependent nodes
  const nodesUpdated = await Promise.all(
    nodesToUpdate.map(async o => {
      const { nodeCtx, nodeDef } = o

      const expressions = NodeDef.getApplicable(nodeDef)

      //3. get expression
      const expr = await RecordExprParser.getApplicableExpression(survey, record, nodeCtx, expressions, tx)

      //4. eval expr // applicable expr doesn't have applyIf, therefore always returns true or false
      const applicable = await RecordExprParser.evalNodeQuery(survey, record, nodeCtx, NodeDefExpression.getExpression(expr), tx)

      //5. persist updated node value if changed, and return updated node
      const nodeDefUuid = NodeDef.getUuid(nodeDef)
      const nodeCtxUuid = Node.getUuid(nodeCtx)
      return Node.isChildApplicable(nodeDefUuid)(nodeCtx) === applicable
        ? {}
        : {
          [nodeCtxUuid]: await NodeRepository.updateChildrenApplicability(
            Survey.getId(survey),
            nodeCtxUuid,
            nodeDefUuid,
            applicable,
            tx
          )
        }
    })
  )

  return R.mergeAll(nodesUpdated)
}

const updateDependentsDefaultValues = async (survey, record, node, tx) => {

  //1. fetch dependent nodes
  const nodeDependents = Record.getDependentNodes(survey, node, Survey.dependencyTypes.defaultValues)(record)

  // filter nodes to update including itself and (attributes with empty values or with default values applied)
  // therefore attributes with user defined values are excluded
  const nodesToUpdate = R.pipe(
    R.append({ nodeCtx: node, nodeDef: Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey) }),
    R.filter(o => {
        const { nodeCtx: n, nodeDef } = o
        return (
          NodeDef.isAttribute(nodeDef) && (
            Node.isValueBlank(n) ||
            Node.isDefaultValueApplied(n)
          )
        )
      }
    )
  )(nodeDependents)

  //2. update expr to node and dependent nodes
  const nodesUpdated = await Promise.all(
    nodesToUpdate.map(async o => {
      const { nodeCtx, nodeDef } = o

      const expressions = NodeDef.getDefaultValues(nodeDef)

      //3. get expression
      const expr = await RecordExprParser.getApplicableExpression(survey, record, nodeCtx, expressions, tx)

      //4. eval expr
      const valueExpr = expr
        ? await RecordExprParser.evalNodeQuery(survey, record, nodeCtx, NodeDefExpression.getExpression(expr), tx)
        : null

      //5. persist updated node value if changed, and return updated node
      const value = await toNodeValue(survey, nodeCtx, valueExpr, tx)
      const oldValue = Node.getValue(nodeCtx, null)
      const nodeCtxUuid = Node.getUuid(nodeCtx)

      return R.equals(oldValue, value)
        ? {}
        : {
          [nodeCtxUuid]: await NodeRepository.updateNode(
            Survey.getId(survey),
            nodeCtxUuid,
            value,
            { [Node.metaKeys.defaultValue]: !R.isNil(expr) },
            tx
          )
        }
    })
  )

  return R.mergeAll(nodesUpdated)
}

// convert expression result into a node value
// it uses categoryRepository or taxonomyRepository when expression result is category item code or taxon code
const toNodeValue = async (survey, node, valueExpr, tx) => {
  if (R.isNil(valueExpr) || R.isEmpty(valueExpr)) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const surveyId = Survey.getId(survey)
  const draft = Survey.isDraft(Survey.getSurveyInfo(survey))
  const isExprPrimitive = R.is(String, valueExpr) || R.is(Number, valueExpr)

  if (NodeDef.isCode(nodeDef) && isExprPrimitive) {
    // valueExpr is the code of a category item

    // 1. find category items
    const itemsInLevel = await CategoryRepository.fetchItemsByLevelIndex(
      surveyId,
      NodeDef.getCategoryUuid(nodeDef),
      Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey),
      draft,
      tx)

    // 2. get the item matching the specified code (valueExpr)
    const item = R.find(item => CategoryItem.getCode(item) === '' + valueExpr)(itemsInLevel)

    return item ? { [Node.valuePropKeys.itemUuid]: Category.getUuid(item) } : null
  } else if (NodeDef.isTaxon(nodeDef) && isExprPrimitive) {
    // valueExpr is the code of a taxon
    const item = await TaxonomyRepository.fetchTaxonByCode(
      surveyId,
      NodeDef.getTaxonomyUuid(nodeDef),
      valueExpr,
      draft,
      tx)
    return item ? { [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(item) } : null
  } else {
    return valueExpr
  }
}

module.exports = {
  updateDependentsDefaultValues,
  updateDependentsApplicable,
}