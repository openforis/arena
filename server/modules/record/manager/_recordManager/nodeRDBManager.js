import * as ObjectUtils from '@core/objectUtils'
import * as Record from '@core/record/record'

import * as DataTableUpdateRepository from '@server/modules/surveyRdb/repository/dataTableUpdateRepository'

const persistNodesToRDB = async ({ survey, record, nodesArray }, t) => {
  // include ancestor nodes (used to find the correct rdb table to update)
  const nodesAndDependentsAndAncestors = nodesArray.reduce((nodesAcc, node) => {
    Record.visitAncestorsAndSelf({ node, visitor: (n) => (nodesAcc[n.uuid] = n) })(record)
    return nodesAcc
  }, {})

  await DataTableUpdateRepository.updateTables({ survey, record, nodes: nodesAndDependentsAndAncestors }, t)

  // Merge updated nodes with existing ones (remove created/updated flags nodes)
  const nodes = ObjectUtils.toUuidIndexedObj(nodesArray)
  return Record.mergeNodes(nodes, true)(record)
}

export const NodeRdbManager = {
  persistNodesToRDB,
}
