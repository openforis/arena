import { Objects } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { NodeValues } from '@core/record/nodeValues'

/**
 * Checks whether a record's qualifier attribute values match the given qualifier filters.
 * @param {object} params - The function parameters.
 * @param {object} params.survey - The survey, with node defs and categories loaded.
 * @param {object} params.record - The record (with nodes loaded) to check.
 * @param {Array<{nodeDef: object, value: *}>} params.qualifierFilters - The qualifier filters,
 * as returned by SurveyManager.fetchUserQualifierFilters.
 * @param {object} [params.pendingNode] - A node carried by the current request but not yet persisted
 * (e.g. a create/update of some attribute), applied on top of the record's own nodes when checking, so
 * an edit that sets a qualifier attribute to a value outside the user's group qualifiers is rejected
 * too. Deliberately not merged into `record` itself via `Record.assocNode`: doing so on a record whose
 * `_nodesIndex` hasn't been built (see `fetchForUpdate` in `fetchRecordAndNodesByUuid`) makes
 * `assocNode` initialize a new index containing only this one node, which then shadows the full node
 * list for every other lookup (`Record.getNodeChildrenByDefUuid` and friends trust a present index
 * instead of falling back to a full scan), making every other already-persisted node - including the
 * qualifier attribute - invisible.
 * @returns {boolean} - True if qualifierFilters is empty (unrestricted), if the record has not been
 * initialized yet (no nodes), if a qualifier attribute node is missing or not yet given a value
 * (record creation will auto-fill qualifier attributes to match, see _applyGroupQualifierValues in
 * recordUpdateManager.js, but that happens as one of the last steps of record creation, so a
 * just-created record may briefly have the node without its value yet), or every filter matches the
 * record's corresponding attribute value; false when a qualifier attribute has an actual value that
 * differs from the expected one, or when `pendingNode` explicitly targets a qualifier attribute with
 * an empty value: the UI never lets a user edit an already-applied qualifier node (see
 * `isQualifierValueApplied` in nodeDefSwitch.js), so a request clearing it can only be a deliberate
 * attempt to drop the restriction, not an in-progress record still being initialized.
 */
export const recordMatchesQualifierFilters = ({ survey, record, qualifierFilters, pendingNode = null }) => {
  if (qualifierFilters.length === 0) return true
  if (Record.getNodesArray(record).length === 0) return true

  const rootNode = Record.getRootNode(record)

  return qualifierFilters.every(({ nodeDef, value }) => {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const isPendingNode = pendingNode && Node.getNodeDefUuid(pendingNode) === nodeDefUuid
    const node = isPendingNode ? pendingNode : Record.getNodeChildByDefUuid(rootNode, nodeDefUuid)(record)

    if (!node) return true

    if (Objects.isEmpty(Node.getValue(node))) {
      // a persisted node without a value yet: record is still being initialized (the qualifier
      // auto-fill is one of the last steps of record creation), not (yet) evidence of a mismatch;
      // but pendingNode explicitly clearing the value is a deliberate attempt to bypass the
      // restriction, so it must be rejected rather than given the same benefit of the doubt
      return !isPendingNode
    }
    return NodeValues.isValueEqual({ survey, nodeDef, value: Node.getValue(node), valueSearch: value })
  })
}
