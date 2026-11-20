import type { ArenaAuthGroup } from '@openforis/arena-core'

import { db, DbClient } from '@server/db/db'

import * as A from '@core/arena'

import * as AuthGroup from '@core/auth/authGroup'
import * as UserRepository from '../../user/repository/userRepository'

const dbTransformCallback = A.camelizePartial({ limitToLevel: 1 })

// ==== CREATE

const insertGroup = (authGroup: ArenaAuthGroup, surveyId: number, client: DbClient = db): Promise<ArenaAuthGroup> =>
  client.one(
    `
    INSERT INTO auth_group (name, survey_uuid, permissions, record_steps)
    SELECT $1, s.uuid, $3, $4
    FROM survey s
    WHERE s.id = $2 
    RETURNING *`,
    [
      AuthGroup.getName(authGroup),
      surveyId,
      JSON.stringify(AuthGroup.getPermissions(authGroup)),
      JSON.stringify(AuthGroup.getRecordSteps(authGroup)),
    ],
    dbTransformCallback
  )

export const createSurveyGroups = async (
  surveyId: number,
  surveyGroups: ArenaAuthGroup[],
  client: DbClient = db
): Promise<ArenaAuthGroup[]> => {
  // one at a time: queries cannot run concurrently on the same client (e.g. a transaction)
  const groups = []
  for (const authGroup of surveyGroups) {
    groups.push(await insertGroup(authGroup, surveyId, client)) // NOSONAR
  }
  return groups
}

export const insertUserGroup = (
  {
    groupUuid,
    userUuid,
    props = null,
  }: { groupUuid: string; userUuid: string; props?: Record<string, unknown> | null },
  client: DbClient = db
) =>
  client.one(
    `
    INSERT INTO auth_group_user (group_uuid, user_uuid, props)
    VALUES ($1, $2, $3)
    RETURNING *`,
    [groupUuid, userUuid, props],
    dbTransformCallback
  )

// ==== READ

export const fetchGroupByName = ({ name }: { name: string }, client: DbClient = db): Promise<ArenaAuthGroup | null> =>
  client.one(
    `
      SELECT auth_group.*
      FROM auth_group
      WHERE auth_group.name = $1
        AND auth_group.survey_uuid IS NULL`,
    [name],
    dbTransformCallback
  )

export const fetchGroupByUuid = (groupUuid: string, client: DbClient = db): Promise<ArenaAuthGroup | null> =>
  client.one(
    `
    SELECT auth_group.*
    FROM auth_group
    WHERE auth_group.uuid = $1`,
    [groupUuid],
    dbTransformCallback
  )

export const fetchGroupsByUuids = (groupUuids: string[], client: DbClient = db): Promise<ArenaAuthGroup[]> =>
  client.map(
    `
    SELECT g.*, s.id as survey_id
    FROM auth_group g
    LEFT OUTER JOIN survey s 
      ON g.survey_uuid = s.uuid
    WHERE g.uuid IN ($1:csv)`,
    [groupUuids],
    dbTransformCallback
  )

export const fetchSurveyGroups = (surveyId: number, client: DbClient = db): Promise<ArenaAuthGroup[]> =>
  client.map(
    `
    SELECT auth_group.*
    FROM auth_group
    JOIN survey s
    ON s.id = $1
    WHERE auth_group.survey_uuid = s.uuid`,
    [surveyId],
    dbTransformCallback
  )

export const fetchUserGroups = (userUuid: string, client: DbClient = db): Promise<ArenaAuthGroup[]> =>
  client.map(
    `
    SELECT g.*, gu.props
    FROM auth_group_user gu
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
    WHERE
      gu.user_uuid = $1
    `,
    [userUuid],
    dbTransformCallback
  )

export const fetchUsersGroups = (userUuids: string[], client: DbClient = db) =>
  client.map(
    `
    SELECT gu.user_uuid, gu.props, g.*
    FROM auth_group_user gu
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
    WHERE
      gu.user_uuid in ($1:csv)
    `,
    [userUuids],
    dbTransformCallback
  )

// max distance between survey last modification and user invitation to consider the survey untouched
const untouchedSurveyTolerance = '10 MINUTES'

/**
 * Fetches the surveys never modified since their only user (with expired invitation) was invited.
 * @param {pgPromise.IDatabase} [client] - The database client.
 * @returns {Promise<Array<{surveyId: number, userUuid: string}>>} - The ids of the surveys with the uuid of their user.
 */
export const fetchSurveysOfExpiredInvitationUsers = (client: DbClient = db) =>
  client.map(
    `
    SELECT DISTINCT s.id, u.uuid AS user_uuid
    FROM auth_group_user agu
      JOIN auth_group ag ON ag.uuid = agu.group_uuid 
      JOIN "user" u ON u.uuid = agu.user_uuid
      JOIN survey s ON s.uuid = ag.survey_uuid
    WHERE
      NOT s.template AND NOT s.published
      AND ag."name" = '${AuthGroup.groupNames.surveyAdmin}' 
      -- only one user/role associated to the same survey
      AND NOT EXISTS (
        SELECT * 
        FROM auth_group_user agu2
          JOIN auth_group ag2 ON ag2."uuid" = agu2.group_uuid
        WHERE ag2.survey_uuid = ag.survey_uuid
          AND agu2.user_uuid <> agu.user_uuid
      )
      -- survey not modified after the user invitation (activity log could be disabled)
      AND EXISTS (
        SELECT * 
        FROM user_invitation ui
        WHERE ui.user_uuid = u.uuid
          AND ui.survey_uuid = s.uuid
          AND s.date_modified BETWEEN ui.invited_date - INTERVAL '${untouchedSurveyTolerance}' 
            AND ui.invited_date + INTERVAL '${untouchedSurveyTolerance}'
      )
      AND ${UserRepository.expiredInvitationWhereCondition}`,
    [],
    (row) => ({ surveyId: row.id, userUuid: row.user_uuid })
  )

/**
 * Fetches the ids of the surveys never modified since their only user (with expired invitation) was invited.
 * @param {pgPromise.IDatabase} [client] - The database client.
 * @returns {Promise<number[]>} - The ids of the surveys.
 */
export const fetchSurveyIdsOfExpiredInvitationUsers = async (client: DbClient = db) => {
  const surveys = await fetchSurveysOfExpiredInvitationUsers(client)
  return surveys.map(({ surveyId }) => surveyId)
}

// ==== UPDATE

export const updateUserGroup = async (
  {
    surveyId,
    userUuid,
    groupUuid,
    props = null,
  }: { surveyId: number; userUuid: string; groupUuid: string; props?: Record<string, unknown> | null },
  client: DbClient = db
) => {
  await client.one(
    `
    UPDATE auth_group_user gu
    SET group_uuid = $/groupUuid/, props = $/props/
    FROM auth_group g
    JOIN survey s
    ON s.id = $/surveyId/
    WHERE gu.user_uuid = $/userUuid/
    AND (
      (g.survey_uuid = s.uuid AND g.uuid = gu.group_uuid)
      OR
      (gu.group_uuid = g.uuid AND g.name = '${AuthGroup.groupNames.systemAdmin}')
    ) 
    RETURNING 1`,
    { groupUuid, userUuid, surveyId, props },
    dbTransformCallback
  )
}

export const updateUserGroupExtraProps = (
  { surveyId, userUuid, extraProps }: { surveyId: number; userUuid: string; extraProps: Record<string, unknown> },
  client: DbClient = db
) =>
  client.one(
    `
    UPDATE auth_group_user gu
      SET props = COALESCE(gu.props, '{}'::jsonb) || $/props/
    FROM auth_group g
      JOIN survey s ON s.id = $/surveyId/
    WHERE gu.user_uuid = $/userUuid/
      AND g.survey_uuid = s.uuid
      AND g.uuid = gu.group_uuid
    RETURNING 1`,
    { surveyId, userUuid, props: extraProps ? { extra: extraProps } : {} },
    dbTransformCallback
  )

// ==== DELETE

export const deleteAllUserGroups = (userUuid: string, client: DbClient = db) =>
  client.query(
    `
    DELETE FROM auth_group_user
    WHERE user_uuid = $1`,
    userUuid
  )

// ==== DELETE

export const deleteUserGroupBySurveyAndUser = (surveyId: number, userUuid: string, client: DbClient = db) =>
  client.query(
    `
    DELETE
    FROM
      auth_group_user
    WHERE
      user_uuid = $1
    AND group_uuid = (
        SELECT
          gu.group_uuid
        FROM
          auth_group_user gu
        JOIN
          auth_group g
        ON
          gu.group_uuid = g.uuid
        JOIN
          survey s
        ON
          s.uuid = g.survey_uuid AND s.id = $2
        WHERE
          gu.user_uuid = $1
    )               
  `,
    [userUuid, surveyId]
  )

export const deleteUserGroupByUserAndGroupUuid = (
  { userUuid, groupUuid }: { userUuid: string; groupUuid: string },
  client: DbClient = db
) =>
  client.query(
    `
      DELETE
      FROM
        auth_group_user
      WHERE
        user_uuid = $1
      AND group_uuid = $2
    `,
    [userUuid, groupUuid]
  )
