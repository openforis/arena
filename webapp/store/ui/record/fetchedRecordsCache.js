import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as API from '@webapp/service/api'

// Records fetched on demand (see fetchRecordAndNodesOnce below), keyed by uuid and shared across hook
// instances/components to avoid re-fetching the same record for every cell in the same row. Resolved
// records are kept in a plain (synchronous) map, separate from the in-flight fetch promises, so that
// mergeNodesIntoFetchedRecordsCache can update them in place and have already-mounted components pick up
// the change on their next render, instead of being stuck with the snapshot from their initial fetch.
const resolvedRecordsByUuid = {}
const fetchPromisesByUuid = {}

/**
 * Returns the resolved record for the given uuid, if it has already been fetched (see
 * fetchRecordAndNodesOnce), kept up to date with edited nodes (see mergeNodesIntoFetchedRecordsCache).
 * @param {string} recordUuid - The record uuid.
 * @returns {object} The resolved record, or undefined if it hasn't been fetched yet.
 */
export const getResolvedRecord = (recordUuid) => resolvedRecordsByUuid[recordUuid]

/**
 * Fetches (once, de-duplicating concurrent callers) and caches the full record (with nodes) identified by
 * recordUuid, for contexts where it's not available in the ui/record Redux state (e.g. the Data Explorer
 * inline table editor).
 * @param {object} params - The parameters.
 * @param {string} params.surveyId - The survey id.
 * @param {string} params.recordUuid - The record uuid.
 * @returns {Promise<object>} A promise resolving to the fetched record.
 */
export const fetchRecordAndNodesOnce = ({ surveyId, recordUuid }) => {
  if (!fetchPromisesByUuid[recordUuid]) {
    fetchPromisesByUuid[recordUuid] = API.fetchRecordAndNodes({ surveyId, recordUuid })
      .then((record) => {
        resolvedRecordsByUuid[recordUuid] = record
        return record
      })
      .catch((error) => {
        delete fetchPromisesByUuid[recordUuid]
        throw error
      })
  }
  return fetchPromisesByUuid[recordUuid]
}

/**
 * Keeps any already-fetched-and-cached full record (see fetchRecordAndNodesOnce) in sync with nodes edited
 * afterwards. Without this, a record fetched once for the Data Explorer inline editor would go stale as
 * soon as one of its nodes gets edited - e.g. selecting a new parent-level code would keep filtering the
 * dependent child-level code items by the old parent value, since the cached ancestor node never changed.
 * Records that have not been fetched (nothing cached for their uuid) are left untouched. Must be called
 * before the corresponding Redux nodesUpdate action is dispatched, so that components re-rendered by that
 * dispatch (they all subscribe to the ui/record Redux state) read the already-updated cached record.
 * @param {object} nodes - The updated/created nodes, indexed by uuid.
 * @returns {void}
 */
export const mergeNodesIntoFetchedRecordsCache = (nodes) => {
  const nodesByRecordUuid = {}
  Object.values(nodes).forEach((node) => {
    const recordUuid = Node.getRecordUuid(node)
    if (!resolvedRecordsByUuid[recordUuid]) return
    nodesByRecordUuid[recordUuid] = { ...nodesByRecordUuid[recordUuid], [Node.getUuid(node)]: node }
  })
  Object.entries(nodesByRecordUuid).forEach(([recordUuid, recordNodes]) => {
    resolvedRecordsByUuid[recordUuid] = Record.mergeNodes(recordNodes, { removeFlags: true })(
      resolvedRecordsByUuid[recordUuid]
    )
  })
}
