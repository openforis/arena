import { Objects, ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import * as User from '@core/user/user'
import * as UserGroup from '@core/user/userGroup/userGroup'
import * as UserGroupQualifier from '@core/user/userGroup/userGroupQualifier'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { NodeValues } from '@core/record/nodeValues'

import { db } from '@server/db/db'
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'

/**
 * Determines the qualifier attribute/value pairs that the given user's group restricts them to, if any.
 * Mirrors the lookup used to auto-fill qualifier attributes when a new record is created
 * (see _applyGroupQualifierValues in recordUpdateManager.js), so write-time and read-time
 * restrictions stay consistent: only the user's first UserGroup in the survey is considered.
 * For code attributes, the qualifier's code is resolved to its category item via a direct DB lookup
 * (works regardless of category size, unlike the survey's category items ref data index, which
 * excludes "big" categories), so the returned value can be compared against a record's node value by
 * item uuid rather than relying on the ref data index being loaded.
 * @param {object} params - The function parameters.
 * @param {object} params.user - The current user.
 * @param {object} params.survey - The survey, with node defs loaded.
 * @param {pgPromise.IDatabase} [client] - The db client.
 * @returns {Promise<Array<{nodeDef: object, value: *}>>} - An empty array when the user is
 * unrestricted (no group, or group with no matching qualifiers), otherwise the list of qualifier
 * filters to apply.
 */
export const fetchUserQualifierFilters = async ({ user, survey }, client = db) => {
  const qualifierNodeDefs = Survey.getQualifierNodeDefs(survey)
  if (qualifierNodeDefs.length === 0) return []

  const userGroupService = ServiceRegistry.getInstance().getService(ServerServiceType.userGroup)
  const userGroups = await userGroupService.getManyByUser(
    { userUuid: User.getUuid(user), surveyUuid: Survey.getUuid(survey) },
    client
  )
  const userGroup = userGroups[0]
  if (!userGroup) return []

  const qualifiers = UserGroup.getQualifiers(userGroup)
  if (qualifiers.length === 0) return []

  const filters = []
  for (const nodeDef of qualifierNodeDefs) {
    const qualifier = qualifiers.find((q) => UserGroupQualifier.getName(q) === NodeDef.getName(nodeDef))
    const qualifierValue = qualifier ? UserGroupQualifier.getValue(qualifier) : null
    if (Objects.isEmpty(qualifierValue)) continue

    if (NodeDef.isCode(nodeDef)) {
      const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
      const item = await CategoryItemProviderDefault.getItemByCode(
        { survey, categoryUuid, code: qualifierValue },
        client
      )
      if (!item) continue
      filters.push({
        nodeDef,
        value: Node.newNodeValueCode({ itemUuid: CategoryItem.getUuid(item), code: qualifierValue }),
      })
    } else {
      filters.push({ nodeDef, value: qualifierValue })
    }
  }
  return filters
}

/**
 * Checks whether a record's qualifier attribute values match the given qualifier filters.
 * @param {object} params - The function parameters.
 * @param {object} params.survey - The survey, with node defs and categories loaded.
 * @param {object} params.record - The record (with nodes loaded) to check.
 * @param {Array<{nodeDef: object, value: string}>} params.qualifierFilters - The qualifier filters,
 * as returned by fetchUserQualifierFilters.
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
 * record's corresponding attribute value; false only when a qualifier attribute has an actual value
 * that differs from the expected one.
 */
export const recordMatchesQualifierFilters = ({ survey, record, qualifierFilters, pendingNode = null }) => {
  if (qualifierFilters.length === 0) return true
  if (Record.getNodesArray(record).length === 0) return true

  const rootNode = Record.getRootNode(record)

  return qualifierFilters.every(({ nodeDef, value }) => {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const node =
      pendingNode && Node.getNodeDefUuid(pendingNode) === nodeDefUuid
        ? pendingNode
        : Record.getNodeChildByDefUuid(rootNode, nodeDefUuid)(record)
    // node missing or not yet given a value: record is still being initialized (the qualifier auto-fill
    // is one of the last steps of record creation), so this is not (yet) evidence of a cross-group
    // mismatch; only a value that has actually been set and differs should be rejected
    if (!node || Objects.isEmpty(Node.getValue(node))) return true
    return NodeValues.isValueEqual({ survey, nodeDef, value: Node.getValue(node), valueSearch: value })
  })
}
