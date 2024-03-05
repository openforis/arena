import * as camelize from 'camelize'
import { db } from '@server/db/db'

import * as AuthGroup from '@core/auth/authGroup'
import * as UserRepository from '../../user/repository/userRepository'

const dbTransformCallback = camelize

// ==== CREATE

const insertGroup = async (authGroup, surveyId, client = db) =>
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

export const createSurveyGroups = async (surveyId, surveyGroups, client = db) =>
  Promise.all(surveyGroups.map((authGroup) => insertGroup(authGroup, surveyId, client)))

export const insertUserGroup = async (groupUuid, userUuid, client = db) =>
  client.one(
    `
    INSERT INTO auth_group_user (group_uuid, user_uuid)
    VALUES ($1, $2)
    RETURNING *`,
    [groupUuid, userUuid],
    dbTransformCallback
  )

// ==== READ

export const fetchGroupByName = async ({ name }, client = db) =>
  client.one(
    `
      SELECT auth_group.*
      FROM auth_group
      WHERE auth_group.name = $1
        AND auth_group.survey_uuid IS NULL`,
    [name],
    dbTransformCallback
  )

export const fetchGroupByUuid = async (groupUuid, client = db) =>
  client.one(
    `
    SELECT auth_group.*
    FROM auth_group
    WHERE auth_group.uuid = $1`,
    [groupUuid],
    dbTransformCallback
  )

export const fetchGroupsByUuids = async (groupUuids, client = db) =>
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

export const fetchSurveyGroups = async (surveyId, client = db) =>
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

export const fetchUserGroups = async (userUuid, client = db) =>
  client.map(
    `
    SELECT g.*
    FROM auth_group_user gu
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
    WHERE
      gu.user_uuid = $1
    `,
    [userUuid],
    dbTransformCallback
  )

export const fetchUsersGroups = async (userUuids, client = db) =>
  client.map(
    `
    SELECT gu.user_uuid, g.*
    FROM auth_group_user gu
    JOIN auth_group g
      ON g.uuid = gu.group_uuid
    WHERE
      gu.user_uuid in ($1:csv)
    `,
    [userUuids],
    dbTransformCallback
  )

export const fetchSurveyIdsOfExpiredInvitationUsers = async (client = db) =>
  client.map(
    `
    SELECT s.id
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
      AND ${UserRepository.expiredInvitationWhereCondition}`,
    [],
    (row) => row.id
  )

// ==== UPDATE

export const updateUserGroup = async (surveyId, userUuid, groupUuid, client = db) => {
  await client.one(
    `
    UPDATE auth_group_user gu
    SET group_uuid = $1
    FROM auth_group g
    JOIN survey s
    ON s.id = $3
    WHERE gu.user_uuid = $2
    AND (
      (g.survey_uuid = s.uuid AND g.uuid = gu.group_uuid)
      OR
      (gu.group_uuid = g.uuid AND g.name = '${AuthGroup.groupNames.systemAdmin}')
    ) 
    RETURNING 1`,
    [groupUuid, userUuid, surveyId],
    dbTransformCallback
  )
}

// ==== UPDATE

export const deleteAllUserGroups = async (userUuid, client = db) =>
  client.query(
    `
    DELETE FROM auth_group_user
    WHERE user_uuid = $1`,
    userUuid
  )

// ==== DELETE

export const deleteUserGroupBySurveyAndUser = async (surveyId, userUuid, client = db) =>
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

export const deleteUserGroupByUserAndGroupUuid = async ({ userUuid, groupUuid }, client = db) =>
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
