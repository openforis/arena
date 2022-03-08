import Queue from '@core/queue'
import * as Node from '@core/record/node'

import * as RecordUpdater from './recordUpdater'
import * as RecordNodeDependentsUpdater from './recordNodeDependentsUpdater'

/**
 * Nodes can be visited maximum 2 times during the update of the dependent nodes, to avoid loops in the evaluation.
 * The first time the applicability can depend on attributes with default values not applied yet.
 * The second time the applicability expression can be evaluated correctly.
 */
const MAX_VISITING_TIMES = 2

const updateNodesDependents = ({ survey, record, nodes, logger }) => {
  // Output
  const nodesUpdated = { ...nodes }

  const nodesUpdatedToPersist = {}
  const nodesToVisit = new Queue(Object.values(nodes))

  const visitedCountByUuid = {} // Avoid loops: visit the same node maximum 2 times (the second time the applicability could have been changed)

  let recordUpdated = record

  while (!nodesToVisit.isEmpty()) {
    const node = nodesToVisit.dequeue()
    const nodeUuid = Node.getUuid(node)

    const visitedCount = visitedCountByUuid[nodeUuid] || 0

    if (visitedCount < MAX_VISITING_TIMES) {
      // Update node dependents (applicability)
      const {
        nodesUpdatedToPersist: nodesToPersistApplicability,
        nodesWithApplicabilityUpdated,
        record: recordUpdatedAvailability,
      } = RecordNodeDependentsUpdater.updateSelfAndDependentsApplicable({ survey, record: recordUpdated, node, logger })

      recordUpdated = recordUpdatedAvailability
      Object.assign(nodesUpdatedToPersist, nodesToPersistApplicability)

      // Update node dependents (default values)
      const { nodesUpdated: nodesWithDefaultValueUpdated, record: recordUpdatedDefaultValues } =
        RecordNodeDependentsUpdater.updateSelfAndDependentsDefaultValues({
          survey,
          record: recordUpdated,
          node,
          logger,
        })

      recordUpdated = recordUpdatedDefaultValues
      Object.assign(nodesUpdatedToPersist, nodesWithDefaultValueUpdated)

      // Update record nodes
      const nodesUpdatedCurrent = {
        ...nodesToPersistApplicability,
        ...nodesWithApplicabilityUpdated,
        ...nodesWithDefaultValueUpdated,
      }

      // Mark updated nodes to visit
      nodesToVisit.enqueueItems(Object.values(nodesUpdatedCurrent))

      // Update nodes to return
      Object.assign(nodesUpdated, nodesUpdatedCurrent)

      // Mark node visited
      visitedCountByUuid[nodeUuid] = visitedCount + 1
    }
  }

  recordUpdated = RecordUpdater.mergeNodes(nodesReloaded)(recordUpdated)

  return {
    record: recordUpdated,
    nodesUpdated,
    nodesUpdatedToPersist,
  }
}

export const RecordNodesUpdater = {
  updateNodesDependents,
}
