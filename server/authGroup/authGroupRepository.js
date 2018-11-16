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
      await addSurveyToGroup(persistedGroup.id, surveyId, client)
      return persistedGroup
    }
  ))

// ==== READ
const getUserGroups = (userId, client = db) =>
  client.any(`
    SELECT auth_group.* 
    FROM auth_group_user, auth_group 
    WHERE auth_group_user.user_id = $1 
    AND auth_group.id = auth_group_user.group_id`,
    userId,
    dbTransformCallback)

const getSurveyGroups = (surveyId, client = db) =>
  client.any(`
    SELECT auth_group.* 
    FROM auth_group_survey, auth_group 
    WHERE auth_group_survey.survey_id = $1 
    AND auth_group.id = auth_group_survey.group_id`,
    surveyId,
    dbTransformCallback)

// ==== UPDATE

const addUserToGroup = (groupId, userId, client = db) =>
  client.one(`
    INSERT INTO auth_group_user (group_id, user_id)
    VALUES ($1, $2)
    RETURNING *`,
    [groupId, userId],
    dbTransformCallback)

const addSurveyToGroup = (groupId, surveyId, client = db) =>
  client.one(`
    INSERT INTO auth_group_survey (group_id, survey_id)
    VALUES ($1, $2)
    RETURNING *`,
    [groupId, surveyId],
    dbTransformCallback)

// ==== DELETE

module.exports = {
  // CREATE
  createSurveyGroups,

  // READ
  getUserGroups,
  getSurveyGroups,
  // findGroupById,

  // UPDATE
  addUserToGroup,
  addSurveyToGroup,

  // DELETE
}
