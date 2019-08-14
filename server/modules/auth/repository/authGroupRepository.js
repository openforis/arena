const camelize = require('camelize')
const db = require('../../../db/db')

const dbTransformCallback = camelize

const AuthGroups = require('../../../../common/auth/authGroups')

// ==== CREATE

const insertGroup = async (authGroup, surveyId, client = db) =>
  await client.one(`
    INSERT INTO auth_group (name, survey_id, permissions, record_steps)
    VALUES ($1, $2, $3, $4)
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
    WHERE auth_group.survey_id = $1`
    ,
    [surveyId],
    dbTransformCallback
  )

const fetchUserGroups = async (userUuid, client = db) =>
  await client.map(`
    SELECT auth_group.*
    FROM auth_group_user, auth_group
    WHERE
      auth_group_user.user_uuid = $1
      AND auth_group.uuid = auth_group_user.group_uuid`,
    userUuid,
    dbTransformCallback
  )

// ==== UPDATE

const updateUserGroup = async (surveyId, userUuid, groupUuid, client = db) => {
  await client.one(`
    UPDATE auth_group_user gu
    SET group_uuid = $1
    FROM auth_group g
    WHERE gu.user_uuid = $2
    AND (
      (g.survey_id = $3 AND g.uuid = gu.group_uuid)
      OR (g.uuid = $1 AND g.name = '${AuthGroups.groupNames.systemAdmin}')
    ) 
    RETURNING *`,
    [groupUuid, userUuid, surveyId],
    dbTransformCallback
  )
}

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
}
