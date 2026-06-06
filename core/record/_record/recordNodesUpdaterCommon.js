import {
  RecordValidator,
  RecordUpdateResult,
  RecordNodesUpdater as CoreRecordNodesUpdater,
  NodeValues,
} from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

const { updateNodesDependents } = CoreRecordNodesUpdater

// For big categories/taxonomies, items are not stored in the survey index.
// The expression evaluator (NodeValueExtractor) resolves code/taxon values via node.refData or the survey index.
// Without refData, isNotEmpty(attr) returns false even when the node has a value,
// causing dependent relevancy rules to be evaluated incorrectly.
// We populate refData for affected nodes before dependent evaluation runs.
const _populateRefDataForBigNodes = async ({ survey, nodes, categoryItemProvider, taxonProvider }) => {
  for (const node of Object.values(nodes)) {
    if (Node.isValueBlank(node)) continue

    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const value = Node.getValue(node)

    if (NodeDef.isCode(nodeDef) && categoryItemProvider && !NodeRefData.getCategoryItem(node)) {
      const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
      const category = categoryUuid ? Survey.getCategoryByUuid(categoryUuid)(survey) : null
      if (!category || !Category.isBigCategory(category)) continue

      const itemUuid = NodeValues.getValueItemUuid(value)
      if (!itemUuid) continue

      const item = await categoryItemProvider.getItemByUuid({ survey, categoryUuid, itemUuid })
      if (item) {
        node[NodeRefData.keys.refData] = { [NodeRefData.keys.categoryItem]: item }
      }
    } else if (NodeDef.isTaxon(nodeDef) && taxonProvider && !NodeRefData.getTaxon(node)) {
      const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
      const taxonomy = taxonomyUuid ? Survey.getTaxonomyByUuid(taxonomyUuid)(survey) : null
      if (!taxonomy || !Taxonomy.isBigTaxonomy(taxonomy)) continue

      const taxonUuid = NodeValues.getTaxonUuid(value)
      if (!taxonUuid) continue

      const taxon = await taxonProvider.getTaxonByUuid({ survey, taxonomyUuid, taxonUuid })
      if (taxon) {
        node[NodeRefData.keys.refData] = { [NodeRefData.keys.taxon]: taxon }
      }
    }
  }
}

export const afterNodesUpdate = async ({
  user,
  survey,
  record,
  nodes,
  categoryItemProvider,
  taxonProvider,
  timezoneOffset,
  sideEffect = false,
}) => {
  // output
  const updateResult = new RecordUpdateResult({ record, nodes })

  // populate refData for big category/taxonomy nodes before dependent evaluation
  await _populateRefDataForBigNodes({ survey, nodes, categoryItemProvider, taxonProvider })

  // 1. update dependent nodes
  const updateResultDependents = await updateNodesDependents({
    user,
    survey,
    record,
    nodes,
    categoryItemProvider,
    taxonProvider,
    timezoneOffset,
    sideEffect,
  })

  updateResult.merge(updateResultDependents)

  // 2. update node validations
  const nodesValidation = await RecordValidator.validateNodes({
    survey,
    record: updateResult.record,
    nodes: updateResult.nodes,
    categoryItemProvider,
    taxonProvider,
  })
  const recordValidationUpdated = A.pipe(
    Validation.getValidation,
    Validation.mergeValidation(nodesValidation),
    Validation.updateCounts
  )(updateResult.record)
  updateResult.record = Validation.assocValidation(recordValidationUpdated)(updateResult.record)

  return updateResult
}
