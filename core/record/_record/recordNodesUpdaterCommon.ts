import type {
  ArenaCategoryItemProvider,
  ArenaRecord,
  ArenaRecordNode,
  ArenaRecordNodesMap,
  ArenaSurvey,
  ArenaTaxonProvider,
} from '@openforis/arena-core'
import {
  ArenaAnyNodeDef,
  RecordNodesUpdater as CoreRecordNodesUpdater,
  RecordNodeValues,
  RecordUpdateResult,
  RecordValidator,
} from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import { RecordEvaluationContext } from '@core/record/recordEvaluationContext'
import * as Category from '@core/survey/category'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

const { updateNodesDependents } = CoreRecordNodesUpdater

type PopulateRefDataParams = {
  survey: ArenaSurvey
  node: ArenaRecordNode
  nodeDef: ArenaAnyNodeDef
  value: any
}

const _populateRefDataForCodeNode = async ({
  survey,
  node,
  nodeDef,
  value,
  categoryItemProvider,
}: PopulateRefDataParams & { categoryItemProvider?: ArenaCategoryItemProvider }): Promise<void> => {
  if (!categoryItemProvider || NodeRefData.getCategoryItem(node)) return

  const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
  const category = categoryUuid ? Survey.getCategoryByUuid(categoryUuid)(survey) : null
  if (!category || !Category.isBigCategory(category)) return

  const itemUuid = RecordNodeValues.getValueItemUuid(value)
  if (!itemUuid) return

  const item = await categoryItemProvider.getItemByUuid({ survey, categoryUuid, itemUuid })
  if (item) {
    node[NodeRefData.keys.refData] = { [NodeRefData.keys.categoryItem]: item }
  }
}

const _populateRefDataForTaxonNode = async ({
  survey,
  node,
  nodeDef,
  value,
  taxonProvider,
}: PopulateRefDataParams & { taxonProvider?: ArenaTaxonProvider }): Promise<void> => {
  if (!taxonProvider || NodeRefData.getTaxon(node)) return

  const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
  const taxonomy = taxonomyUuid ? Survey.getTaxonomyByUuid(taxonomyUuid)(survey) : null
  if (!taxonomy || !Taxonomy.isBigTaxonomy(taxonomy)) return

  const taxonUuid = RecordNodeValues.getTaxonUuid(value)
  if (!taxonUuid) return

  // draft not specified before: the providers default it to false (published taxa)
  const taxon = await taxonProvider.getTaxonByUuid({ survey, taxonomyUuid, taxonUuid, draft: false })
  if (taxon) {
    node[NodeRefData.keys.refData] = { [NodeRefData.keys.taxon]: taxon }
  }
}

// For big categories/taxonomies, items are not stored in the survey index.
// The expression evaluator (NodeValueExtractor) resolves code/taxon values via node.refData or the survey index.
// Without refData, isNotEmpty(attr) returns false even when the node has a value,
// causing dependent relevancy rules to be evaluated incorrectly.
// We populate refData for affected nodes before dependent evaluation runs.
const _populateRefDataForBigNodes = async ({
  survey,
  nodes,
  categoryItemProvider,
  taxonProvider,
}: {
  survey: ArenaSurvey
  nodes: ArenaRecordNodesMap
  categoryItemProvider?: ArenaCategoryItemProvider
  taxonProvider?: ArenaTaxonProvider
}): Promise<void> => {
  for (const node of Object.values(nodes)) {
    if (Node.isValueBlank(node)) continue

    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const value = Node.getValue(node)
    if (NodeDef.isCode(nodeDef)) {
      await _populateRefDataForCodeNode({ survey, node, nodeDef, value, categoryItemProvider }) // NOSONAR
    } else if (NodeDef.isTaxon(nodeDef)) {
      await _populateRefDataForTaxonNode({ survey, node, nodeDef, value, taxonProvider }) // NOSONAR
    }
  }
}

/**
 * Updates the dependents of the updated nodes, then validates all the updated nodes.
 * @param {!object} params - The RecordEvaluationContext params, plus the following ones.
 * @param {!object} params.nodes - The updated nodes, indexed by UUID.
 * @param {object} [params.passiveNodes] - Updated nodes not triggering the dependents update, indexed by UUID.
 * @param {boolean} [params.sideEffect] - Whether to update the record and the nodes in place.
 * @returns {Promise<RecordUpdateResult>} - The update result.
 */
export const afterNodesUpdate = async ({
  record,
  nodes,
  passiveNodes = {},
  sideEffect = false,
  ...otherParams
}: {
  record: ArenaRecord
  nodes: ArenaRecordNodesMap
  passiveNodes?: ArenaRecordNodesMap
  sideEffect?: boolean
  [contextParam: string]: unknown
}): Promise<RecordUpdateResult> => {
  const contextParam = RecordEvaluationContext.extract(otherParams)
  const { survey, categoryItemProvider, taxonProvider } = contextParam
  // language-dependent expression functions (e.g. numberToWords) need a language to evaluate with;
  // fall back to the survey default when no UI language was provided (e.g. background jobs)
  const context = { ...contextParam, lang: contextParam.lang ?? Survey.getDefaultLanguage(survey) }

  // output
  const updateResult = new RecordUpdateResult({ record, nodes })

  // populate refData for big category/taxonomy nodes before dependent evaluation
  await _populateRefDataForBigNodes({ survey, nodes, categoryItemProvider, taxonProvider })
  await _populateRefDataForBigNodes({ survey, nodes: passiveNodes, categoryItemProvider, taxonProvider })

  // 1. update dependent nodes
  const updateResultDependents = await updateNodesDependents({ ...context, record, nodes, sideEffect })

  updateResult.merge(updateResultDependents)

  // passive nodes (updated nodes not triggering the dependents update) are kept as they are,
  // even if the dependents update re-evaluated them
  for (const passiveNode of Object.values(passiveNodes)) {
    updateResult.addNode(passiveNode, { sideEffect })
  }

  // 2. update node validations
  const nodesValidation = await RecordValidator.validateNodes({
    ...context,
    record: updateResult.record,
    nodes: updateResult.nodes,
  })
  const recordValidationUpdated = A.pipe(
    Validation.getValidation,
    Validation.mergeValidation(nodesValidation),
    Validation.updateCounts
  )(updateResult.record)
  // assocValidation is typed on plain objects
  updateResult.record = Validation.assocValidation(recordValidationUpdated)(
    updateResult.record as unknown as Record<string, unknown>
  )

  return updateResult
}
