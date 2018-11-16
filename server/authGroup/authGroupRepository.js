const Promise = require('bluebird')
const camelize = require('camelize')
const db = require('../db/db')

const dbTransformCallback = camelize

// ==== CREATE

const insertGroup = async (authGroup, client = db) =>
  await client.one(`
    INSERT INTO auth_group (name, permissions, labels, descriptions)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [
      authGroup.name,
      JSON.stringify(authGroup.permissions),
      JSON.stringify(authGroup.labels),
      JSON.stringify(authGroup.descriptions),
    ],
    dbTransformCallback
  )

const createSurveyGroups = async (surveyId, surveyGroups, client = db) =>
  await Promise.all(surveyGroups.map(
    async authGroup => {
      const persistedGroup = await insertGroup(authGroup, client)
      await insertSurveyGroup(persistedGroup.id, surveyId, client)
      return persistedGroup
    }
  ))

const insertSurveyGroup = async (groupId, surveyId, client = db) =>
  await client.one(`
    INSERT INTO auth_group_survey (group_id, survey_id)
    VALUES ($1, $2)
    RETURNING *`,
    [groupId, surveyId],
    dbTransformCallback)

// ==== READ

const fetchSurveyGroups = async (surveyId, client = db) =>
  await client.any(`
    SELECT auth_group.* 
    FROM auth_group_survey, auth_group 
    WHERE auth_group_survey.survey_id = $1 
    AND auth_group.id = auth_group_survey.group_id`,
    surveyId,
    dbTransformCallback)

const fetchUserGroups = async (userId, client = db) =>
  await client.any(`
    SELECT auth_group.* 
    FROM auth_group_user, auth_group 
    WHERE auth_group_user.user_id = $1 
    AND auth_group.id = auth_group_user.group_id`,
    userId,
    dbTransformCallback
  )

// ==== UPDATE

const insertUserGroup = async (groupId, userId, client = db) =>
  await client.one(`
    INSERT INTO auth_group_user (group_id, user_id)
    VALUES ($1, $2)
    RETURNING *`,
    [groupId, userId],
    dbTransformCallback)

// ==== DELETE

module.exports = {
  // CREATE
  createSurveyGroups,

  // READ
  fetchSurveyGroups,
  fetchUserGroups,

  // UPDATE
  insertUserGroup,

  // DELETE
}
