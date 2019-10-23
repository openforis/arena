const camelize = require('camelize')
const db = require('../../../db/db')

const dbTransformCallback = camelize

const AuthGroups = require('../../../../core/auth/authGroups')

// ==== CREATE

const insertGroup = async (authGroup, surveyId, client = db) =>
  await client.one(`
    INSERT INTO auth_group (name, survey_uuid, permissions, record_steps)
    SELECT $1, s.uuid, $3, $4
    FROM survey s
    WHERE s.id = $2 
    RETURNING *`,
    [
      authGroup.name,
      surveyId,
      JSON.stringify(authGroup.permissions),
      JSON.stringify(authGroup.recordSteps),
    ],
    dbTransformCallback
  )

const createSurveyGroups = async (surveyId, surveyGroups, client = db) =>
  await Promise.all(surveyGroups.map(
    authGroup => insertGroup(authGroup, surveyId, client)
  ))

const insertUserGroup = async (groupUuid, userUuid, client = db) =>
  await client.one(`
    INSERT INTO auth_group_user (group_uuid, user_uuid)
    VALUES ($1, $2)
    RETURNING *`,
    [groupUuid, userUuid],
    dbTransformCallback
  )

// ==== READ

const fetchGroupByUuid = async (groupUuid, client = db) =>
  await client.one(`
    SELECT auth_group.*
    FROM auth_group
    WHERE auth_group.uuid = $1`,
    [groupUuid],
    dbTransformCallback
  )

const fetchSurveyGroups = async (surveyId, client = db) =>
  await client.map(`
    SELECT auth_group.*
    FROM auth_group
    JOIN survey s
    ON s.id = $1
    WHERE auth_group.survey_uuid = s.uuid`,
    [surveyId],
    dbTransformCallback
  )

const fetchUserGroups = async (userUuid, client = db) =>
  await client.map(`
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

const updateUserGroup = async (surveyId, userUuid, groupUuid, client = db) => {
  await client.one(`
    UPDATE auth_group_user gu
    SET group_uuid = $1
    FROM auth_group g
    JOIN survey s
    ON s.id = $3
    WHERE gu.user_uuid = $2
    AND (
      (g.survey_uuid = s.uuid AND g.uuid = gu.group_uuid)
      OR
      (gu.group_uuid = g.uuid AND g.name = '${AuthGroups.groupNames.systemAdmin}')
    ) 
    RETURNING *`,
    [groupUuid, userUuid, surveyId],
    dbTransformCallback
  )
}

// ==== UPDATE

const deleteAllUserGroups = async (userUuid, client = db) =>
  await client.query(`
    DELETE FROM auth_group_user
    WHERE user_uuid = $1`,
    userUuid)

// ==== DELETE

const deleteUserGroup = async (surveyId, userUuid, client = db) =>
  await client.query(`
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
  `, [userUuid, surveyId])

module.exports = {
  // CREATE
  createSurveyGroups,
  insertUserGroup,

  // READ
  fetchGroupByUuid,
  fetchSurveyGroups,
  fetchUserGroups,

  // UPDATE
  updateUserGroup,

  // DELETE
  deleteAllUserGroups,
  deleteUserGroup,
}
