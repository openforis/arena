import * as ObjectUtils from '@core/objectUtils'
import * as Record from '@core/record/record'

import * as DataTableUpdateRepository from '@server/modules/surveyRdb/repository/dataTableUpdateRepository'

const { updateTablesFromUpdates } = DataTableUpdateRepository

const generateRdbUpates = ({ survey, record, nodesArray }) => {
  // include ancestor nodes (used to find the correct rdb table to update)
  const nodesAndDependentsAndAncestors = nodesArray.reduce((nodesAcc, node) => {
    Record.visitAncestorsAndSelf({ node, visitor: (n) => (nodesAcc[n.uuid] = n) })(record)
    return nodesAcc
  }, {})
  const rdbUpdates = DataTableUpdateRepository.generateRdbUpdates({
    survey,
    record,
    nodes: nodesAndDependentsAndAncestors,
  })
  // Merge updated nodes with existing ones (remove created/updated flags nodes)
  const nodes = ObjectUtils.toUuidIndexedObj(nodesArray)
  const recordUpdated = Record.mergeNodes(nodes, true)(record)
  return {
    record: recordUpdated,
    rdbUpdates,
  }
}

const persistNodesToRDB = async ({ survey, record, nodesArray }, t) => {
  const { rdbUpdates, record: recordUpdated } = generateRdbUpates({ survey, record, nodesArray })

  await updateTablesFromUpdates({ rdbUpdates }, t)

  return recordUpdated
}

export const NodeRdbManager = {
  generateRdbUpates,
  persistNodesToRDB,
  updateTablesFromUpdates,
}
