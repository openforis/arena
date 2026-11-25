import type { ArenaAnyNodeDef, ArenaRecordNode, ArenaSurvey } from '@openforis/arena-core'

import * as Node from '@core/record/node'
import * as NodeDef from '@core/survey/nodeDef'
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import { TaxonProviderDefault } from '@server/modules/taxonomy/manager/taxonProviderDefault'

const categoryItemProvider = CategoryItemProviderDefault
const taxonProvider = TaxonProviderDefault

const _checkParentValid = ({
  nodes,
  node,
  nodeDef,
}: {
  nodes: { [nodeUuid: string]: ArenaRecordNode }
  node: ArenaRecordNode
  nodeDef: ArenaAnyNodeDef
}) => {
  const parentUuid = Node.getParentUuid(node)
  if ((!parentUuid && !NodeDef.isRoot(nodeDef)) || (parentUuid && !nodes[parentUuid])) {
    return { warn: 'has missing or invalid parent_uuid' }
  }
  return null
}

const _checkNotEmptyMultiple = ({ node, nodeDef }: { node: ArenaRecordNode; nodeDef: ArenaAnyNodeDef }) => {
  if (NodeDef.isMultipleAttribute(nodeDef) && Node.isValueBlank(node)) {
    return { warn: 'is multiple and has an empty value' }
  }
  return null
}

const _checkHierarchyValid = ({
  nodes,
  node,
  nodeDef,
}: {
  nodes: { [nodeUuid: string]: ArenaRecordNode }
  node: ArenaRecordNode
  nodeDef: ArenaAnyNodeDef
}) => {
  const nodeHierarchy = Node.getHierarchy(node)
  if (
    nodeHierarchy.length !== NodeDef.getMetaHierarchy(nodeDef)?.length ||
    nodeHierarchy.some((ancestorUuid) => !nodes[ancestorUuid])
  ) {
    return { warn: 'has an invalid meta hierarchy' }
  }
  return null
}

const _checkCategoryItemExists = async ({
  survey,
  node,
  nodeDef,
}: {
  survey: ArenaSurvey
  node: ArenaRecordNode
  nodeDef: ArenaAnyNodeDef
}) => {
  if (!NodeDef.isCode(nodeDef)) return null
  const itemUuid = Node.getCategoryItemUuid(node)
  if (!itemUuid) return null
  const item = await categoryItemProvider.getOrFetchItem({ survey, nodeDef, itemUuid })
  if (!item) return { error: `category item with uuid ${itemUuid} does not exist` }
  return null
}

const _checkTaxonExists = async ({
  survey,
  node,
  nodeDef,
}: {
  survey: ArenaSurvey
  node: ArenaRecordNode
  nodeDef: ArenaAnyNodeDef
}) => {
  if (!NodeDef.isTaxon(nodeDef)) return null
  const taxonUuid = Node.getTaxonUuid(node)
  if (!taxonUuid) return null
  const taxon = await taxonProvider.getOrFetchTaxon({ survey, nodeDef, taxonUuid })
  if (!taxon) return { error: `taxon with uuid ${taxonUuid} does not exist` }
  return null
}

type NodeCheckResult = { valid: boolean; error?: string; warn?: string }

export const checkNodeIsValid = async ({
  survey,
  nodes,
  node,
  nodeDef,
}: {
  survey: ArenaSurvey
  nodes: { [nodeUuid: string]: ArenaRecordNode }
  node: ArenaRecordNode
  nodeDef: ArenaAnyNodeDef
}): Promise<NodeCheckResult> => {
  if (!nodeDef) {
    return { valid: false, warn: 'refers to a missing node definition' }
  }
  const checks = [
    _checkParentValid,
    _checkNotEmptyMultiple,
    _checkHierarchyValid,
    _checkCategoryItemExists,
    _checkTaxonExists,
  ]
  for (const check of checks) {
    const result = await check({ survey, nodes, node, nodeDef })
    if (result) return { valid: false, ...result }
  }
  return { valid: true }
}
