const R = require('ramda')

const Survey = require('../../../../common/survey/survey')
const NodeDef = require('../../../../common/survey/nodeDef')
const Category = require('../../../../common/survey/category')
const Taxonomy = require('../../../../common/survey/taxonomy')
const Record = require('../../../../common/record/record')
const Node = require('../../../../common/record/node')

const NodeRepository = require('./nodeRepository')
const CategoryManager = require('../../../category/categoryManager')
const TaxonomyManager = require('../../../taxonomy/taxonomyManager')

const { dependencyTypes } = require('../../../survey/surveyDependenchyGraph')

const fetchDependentNodes = (survey, record, node, dependencyType) => {
  const nodeDefUuid = Node.getNodeDefUuid(node)
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const dependentUuids = Survey.getNodeDefDependencies(nodeDefUuid, dependencyType)(survey)
  const isDependencyApplicable = dependencyType === dependencyTypes.applicable

  if (dependentUuids) {
    const dependentDefs = Survey.getNodeDefsByUuids(dependentUuids)(survey)

    const dependentsPerDef = dependentDefs.map(
      dependentDef => {
        //1 find common parent def
        const commonParentDefUuid = R.pipe(
          R.intersection(NodeDef.getMetaHierarchy(nodeDef)),
          R.last
        )(NodeDef.getMetaHierarchy(dependentDef))

        //2 find common parent node
        const commonParentNode = Record.getAncestorByNodeDefUuuid(node, commonParentDefUuid)(record)

        //3 find descendant nodes of common parent node with nodeDefUuid = dependentDef uuid
        const nodeDefUuidDependent = isDependencyApplicable
          ? NodeDef.getNodeDefParentUuid(dependentDef)
          : NodeDef.getUuid(dependentDef)

        const dependentNodes = Record.getDescendantsByNodeDefUuid(commonParentNode, nodeDefUuidDependent)(record)

        return dependentNodes.map(nodeCtx => ({
          nodeDef: dependentDef,
          nodeCtx
        }))
      }
    )

    return R.flatten(dependentsPerDef)
  } else {
    return []
  }
}

const persistDependentNodeValue = async (survey, node, valueExpr, isDefaultValue, tx) => {
  const value = await toNodeValue(survey, node, valueExpr, tx)

  const oldValue = Node.getNodeValue(node, null)

  return R.equals(oldValue, value)
    ? {}
    : {
      [Node.getUuid(node)]: await NodeRepository.updateNode(
        Survey.getId(survey),
        Node.getUuid(node),
        value,
        { [Node.metaKeys.defaultValue]: isDefaultValue },
        tx
      )
    }
}

const persistDependentNodeApplicable = async (survey, nodeDefUuid, nodeCtx, applicable, tx) => {
  const surveyId = Survey.getId(survey)
  const nodeCtxUuid = Node.getUuid(nodeCtx)

  const applicableOld = Node.isChildApplicable(nodeDefUuid)(nodeCtx)

  if (applicable !== applicableOld) {
    return {
      [nodeCtxUuid]: await NodeRepository.updateChildrenApplicability(
        surveyId,
        nodeCtxUuid,
        nodeDefUuid,
        applicable,
        tx
      )
    }
  } else {
    return {}
  }
}

const toNodeValue = async (survey, node, valueExpr, tx) => {
  if (R.isNil(valueExpr) || R.isEmpty(valueExpr)) {
    return null
  }

  const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
  const surveyId = Survey.getId(survey)
  const draft = Survey.isDraft(Survey.getSurveyInfo(survey))
  const isExprPrimitive = R.is(String, valueExpr) || R.is(Number, valueExpr)

  if (NodeDef.isNodeDefCode(nodeDef) && isExprPrimitive) {
    // valueExpr is the code of a category item

    // 1. find category items
    const itemsInLevel = await CategoryManager.fetchItemsByLevelIndex(
      surveyId,
      NodeDef.getNodeDefCategoryUuid(nodeDef),
      Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey),
      draft,
      tx)

    // 2. get the item matching the specified code (valueExpr)
    const item = R.find(item => Category.getItemCode(item) === '' + valueExpr)(itemsInLevel)

    return item ? { [Node.valuePropKeys.itemUuid]: Category.getUuid(item) } : null
  } else if (NodeDef.isNodeDefTaxon(nodeDef) && isExprPrimitive) {
    // valueExpr is the code of a taxon
    const item = await TaxonomyManager.fetchTaxonByCode(
      surveyId,
      NodeDef.getNodeDefTaxonomyUuid(nodeDef),
      valueExpr,
      draft,
      tx)
    return item ? { [Node.valuePropKeys.taxonUuid]: Taxonomy.getUuid(item) } : null
  } else {
    return valueExpr
  }
}

module.exports = {
  //READ
  fetchDependentNodes,

  //UPDATE
  persistDependentNodeValue,
  persistDependentNodeApplicable,
}