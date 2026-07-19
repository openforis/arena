import { Objects, ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import * as User from '@core/user/user'
import * as UserGroup from '@core/user/userGroup/userGroup'
import * as UserGroupQualifier from '@core/user/userGroup/userGroupQualifier'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { NodeValues } from '@core/record/nodeValues'

import { db } from '@server/db/db'

/**
 * Determines the qualifier attribute/value pairs that the given user's group restricts them to, if any.
 * Mirrors the lookup used to auto-fill qualifier attributes when a new record is created
 * (see _applyGroupQualifierValues in recordUpdateManager.js), so write-time and read-time
 * restrictions stay consistent: only the user's first UserGroup in the survey is considered.
 * @param {object} params - The function parameters.
 * @param {object} params.user - The current user.
 * @param {object} params.survey - The survey, with node defs loaded.
 * @param {pgPromise.IDatabase} [client] - The db client.
 * @returns {Promise<Array<{nodeDef: object, value: string}>>} - An empty array when the user is
 * unrestricted (no group, or group with no matching qualifiers), otherwise the list of qualifier
 * filters to apply.
 */
export const fetchUserQualifierFilters = async ({ user, survey }, client = db) => {
  const qualifierNodeDefs = Survey.getNodeDefsArray(survey).filter(NodeDef.isQualifier)
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

  return qualifierNodeDefs.reduce((filters, nodeDef) => {
    const qualifier = qualifiers.find((q) => UserGroupQualifier.getName(q) === NodeDef.getName(nodeDef))
    const qualifierValue = qualifier ? UserGroupQualifier.getValue(qualifier) : null
    if (!Objects.isEmpty(qualifierValue)) {
      filters.push({ nodeDef, value: qualifierValue })
    }
    return filters
  }, [])
}

/**
 * Checks whether a record's qualifier attribute values match the given qualifier filters.
 * @param {object} params - The function parameters.
 * @param {object} params.survey - The survey, with node defs and categories loaded.
 * @param {object} params.record - The record (with nodes loaded) to check.
 * @param {Array<{nodeDef: object, value: string}>} params.qualifierFilters - The qualifier filters,
 * as returned by fetchUserQualifierFilters.
 * @returns {boolean} - True if qualifierFilters is empty (unrestricted), if the record has not been
 * initialized yet (no nodes: checkin will auto-fill qualifier attributes to match, see
 * _applyGroupQualifierValues in recordUpdateManager.js), or every filter matches the record's
 * corresponding attribute value; false otherwise.
 */
export const recordMatchesQualifierFilters = ({ survey, record, qualifierFilters }) => {
  if (qualifierFilters.length === 0) return true
  if (Record.getNodesArray(record).length === 0) return true

  const rootNode = Record.getRootNode(record)

  return qualifierFilters.every(({ nodeDef, value }) => {
    const node = Record.getNodeChildrenByDefUuid(rootNode, NodeDef.getUuid(nodeDef))(record)[0]
    if (!node) return false
    return NodeValues.isValueEqual({ survey, nodeDef, value: Node.getValue(node), valueSearch: value })
  })
}
