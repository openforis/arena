import { Objects, ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import * as User from '@core/user/user'
import * as UserGroup from '@core/user/userGroup/userGroup'
import * as UserGroupQualifier from '@core/user/userGroup/userGroupQualifier'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'
import * as Node from '@core/record/node'

import { db } from '@server/db/db'
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'

const _fetchUserGroups = async ({ user, survey }, client) => {
  const userGroupService = ServiceRegistry.getInstance().getService(ServerServiceType.userGroup)
  return userGroupService.getManyByUser({ userUuid: User.getUuid(user), surveyUuid: Survey.getUuid(survey) }, client)
}

const _buildQualifierFilters = async ({ survey, userGroup }, client) => {
  const qualifierNodeDefs = Survey.getQualifierNodeDefs(survey)
  const qualifiers = UserGroup.getQualifiers(userGroup)
  if (qualifierNodeDefs.length === 0 || qualifiers.length === 0) return []

  const filters = []
  for (const nodeDef of qualifierNodeDefs) {
    const qualifier = qualifiers.find((q) => UserGroupQualifier.getName(q) === NodeDef.getName(nodeDef))
    const qualifierValue = qualifier ? UserGroupQualifier.getValue(qualifier) : null
    if (Objects.isEmpty(qualifierValue)) continue

    if (NodeDef.isCode(nodeDef)) {
      const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
      const item = /* NOSONAR */ await CategoryItemProviderDefault.getItemByCode(
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
  if (Survey.getQualifierNodeDefs(survey).length === 0) return []
  const [userGroup] = await _fetchUserGroups({ user, survey }, client)
  return userGroup ? _buildQualifierFilters({ survey, userGroup }, client) : []
}

/**
 * Determines the qualifier filters of the user's group (records the user can edit) and of the groups
 * whose records the user's group can only read (see UserGroup readableGroupUuids).
 * @param {object} params - The function parameters.
 * @param {object} params.user - The current user.
 * @param {object} params.survey - The survey, with node defs loaded.
 * @param {pgPromise.IDatabase} [client] - The db client.
 * @returns {Promise<{own: Array<{nodeDef: object, value: *}>, readable: Array<Array<{nodeDef: object, value: *}>>}>} - `own` is empty when the user is unrestricted (then `readable` is empty too);
 * readable groups without qualifier filters are ignored (they would match every record).
 */
export const fetchUserGroupAccessFilters = async ({ user, survey }, client = db) => {
  const noFilters = { own: [], readable: [] }
  if (Survey.getQualifierNodeDefs(survey).length === 0) return noFilters

  const [userGroup] = await _fetchUserGroups({ user, survey }, client)
  if (!userGroup) return noFilters

  const own = await _buildQualifierFilters({ survey, userGroup }, client)
  const readableGroupUuids = UserGroup.getReadableGroupUuids(userGroup)
  if (own.length === 0 || readableGroupUuids.length === 0) return { own, readable: [] }

  const userGroupService = ServiceRegistry.getInstance().getService(ServerServiceType.userGroup)
  const surveyGroups = await userGroupService.getAll({ surveyUuid: Survey.getUuid(survey) }, client)
  const readableGroups = surveyGroups.filter(
    (group) => group.uuid !== userGroup.uuid && readableGroupUuids.includes(group.uuid)
  )
  const readable = []
  for (const readableGroup of readableGroups) {
    const filters = /* NOSONAR */ await _buildQualifierFilters({ survey, userGroup: readableGroup }, client)
    if (filters.length > 0) readable.push(filters)
  }
  return { own, readable }
}
