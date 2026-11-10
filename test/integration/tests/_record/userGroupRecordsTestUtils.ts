import { ServiceRegistry } from '@openforis/arena-core'
import { ServerServiceType } from '@openforis/arena-server'

import * as Record from '@core/record/record'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import * as RB from '../../../utils/recordBuilder'
import * as SB from '../../../utils/surveyBuilder'

// Survey with one record per user group (qualifier attribute "team"): the user belongs to the "control" group,
// which can read the records of the "contractor_a" group, but not the ones of the "contractor_b" group.

const entityName = 'cluster'

const clusters: [number, string][] = [
  [1, 'control'],
  [2, 'contractor_a'],
  [3, 'contractor_b'],
]

const parseGroup = (row: any) => ({ uuid: row.uuid, surveyUuid: row.survey_uuid, props: row.props })

// minimal user group service (registered by ArenaServer.init when the server runs)
const userGroupServiceTest = {
  getAll: ({ surveyUuid }: any, client: any = db) =>
    client.map(`SELECT * FROM user_group WHERE survey_uuid = $1`, [surveyUuid], parseGroup),
  getManyByUser: ({ userUuid, surveyUuid }: any, client: any = db) =>
    client.map(
      `SELECT g.* FROM user_group g JOIN user_group_user gu ON gu.group_uuid = g.uuid
      WHERE gu.user_uuid = $1 AND g.survey_uuid = $2`,
      [userUuid, surveyUuid],
      parseGroup
    ),
}

const insertGroup = ({ surveyUuid, props }: { surveyUuid: string; props: object }): Promise<string> =>
  db.one(
    `INSERT INTO user_group (survey_uuid, props) VALUES ($1, $2::jsonb) RETURNING uuid`,
    [surveyUuid, props],
    (row: any) => row.uuid
  )

/**
 * Registers the test user group service.
 * @returns {any} - The user group service previously registered, if any.
 */
export const registerUserGroupServiceTest = (): any => {
  const registry = ServiceRegistry.getInstance()
  let userGroupServicePrev = null
  try {
    userGroupServicePrev = registry.getService(ServerServiceType.userGroup)
  } catch {
    userGroupServicePrev = null
  }
  registry.registerService(ServerServiceType.userGroup, userGroupServiceTest)
  return userGroupServicePrev
}

/**
 * Registers again the user group service replaced by the test one.
 * @param {any} userGroupServicePrev - The user group service previously registered, if any.
 */
export const restoreUserGroupService = (userGroupServicePrev: any): void => {
  if (userGroupServicePrev) {
    ServiceRegistry.getInstance().registerService(ServerServiceType.userGroup, userGroupServicePrev)
  }
}

/**
 * Creates and publishes the survey, its records and user groups, and adds the user to the "control" group.
 * @param {any} user - The user.
 * @returns {Promise<{survey: any, recordUuidsByClusterNo: {[clusterNo: number]: string}}>} - The survey and the record UUIDs by cluster number.
 */
export const createSurveyWithUserGroupRecords = async (
  user: any
): Promise<{ survey: any; recordUuidsByClusterNo: { [clusterNo: number]: string } }> => {
  const survey = await SB.survey(
    user,
    SB.entity(
      entityName,
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
      SB.attribute('team', NodeDef.nodeDefType.text).prop(NodeDef.propKeys.qualifier, true)
    )
  ).buildAndStore()

  const recordUuidsByClusterNo: { [clusterNo: number]: string } = {}
  for (const [clusterNo, team] of clusters) {
    // records stored one at a time (same survey RDB tables)
    const record = await /* NOSONAR */ RB.record(
      user,
      survey,
      RB.entity(entityName, RB.attribute('cluster_no', clusterNo), RB.attribute('team', team))
    ).buildAndStore()
    recordUuidsByClusterNo[clusterNo] = Record.getUuid(record)
  }

  const surveyUuid = Survey.getUuid(survey)
  const groupAUuid = await insertGroup({
    surveyUuid,
    props: { name: 'contractor_a', qualifiers: [{ name: 'team', value: 'contractor_a' }] },
  })
  await insertGroup({
    surveyUuid,
    props: { name: 'contractor_b', qualifiers: [{ name: 'team', value: 'contractor_b' }] },
  })
  const controlGroupUuid = await insertGroup({
    surveyUuid,
    props: { name: 'control', qualifiers: [{ name: 'team', value: 'control' }], readableGroupUuids: [groupAUuid] },
  })
  await db.none(`INSERT INTO user_group_user (user_uuid, group_uuid) VALUES ($1, $2)`, [
    User.getUuid(user),
    controlGroupUuid,
  ])
  return { survey, recordUuidsByClusterNo }
}

/**
 * Removes the user from its user groups and deletes the survey (if created).
 * @param {object} params - The parameters.
 * @param {any} params.user - The user.
 * @param {any} [params.survey] - The survey.
 * @returns {Promise<void>} - Promise resolved when the data is deleted.
 */
export const deleteSurveyWithUserGroupRecords = async ({ user, survey }: { user: any; survey?: any }) => {
  await db.none(`DELETE FROM user_group_user WHERE user_uuid = $1`, [User.getUuid(user)])
  if (survey) {
    await SurveyManager.deleteSurvey(Survey.getId(survey))
  }
}
