import * as camelize from 'camelize'
import { db } from '@server/db/db'

import * as AuthGroup from '@core/auth/authGroup'

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

export const _fetchSurveyGroups = async (surveyId, client = db) =>
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

export const fetchGroupByUuid = async (groupUuid, client = db) =>
  client.one(
    `
    SELECT auth_group.*
    FROM auth_group
    WHERE auth_group.uuid = $1`,
    [groupUuid],
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

export const deleteUserGroup = async (surveyId, userUuid, client = db) =>
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
          s.id = $2
        WHERE
          gu.user_uuid = $1
    )               
  `,
    [userUuid, surveyId]
  )
