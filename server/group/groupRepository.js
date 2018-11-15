const db = require('../db/db')

// in sql queries, group table must be surrounded by "" e.g. "group"


// ==== CREATE

const createGroup = async (labels, descriptions, role, dataCondition, client = db) => {
  return await client.one(`
    INSERT INTO "group" (labels, descriptions, role_id, data_condition)
    SELECT $1, $2, group_role.id, $4 FROM group_role WHERE group_role.role = $3
    --VALUES ($1, $2, SELECT id FROM group_role WHERE role=$3, $4)
    RETURNING *`,
  [labels, descriptions, role, dataCondition])
}

// ==== READ
const getUserRolesForSurvey = async (userId, surveyId, client=db) =>
  await client.one(`
    SELECT permissions FROM survey
    JOIN survey_group sg ON sg.survey_id = $1
    JOIN user_group ug ON ug.user_id = $2 AND ug.group_id = sg.group_id
    JOIN "group" ON "group".id = sg.group_id
    JOIN group_role ON "group".role_id = group_role.id
    WHERE survey.id = 1`,
    [surveyId, userId])

// const findGroupById = async (groupId, client = db) => {
//   const group = await client.one(`
//     SELECT * FROM "group" WHERE id = $1`, [groupId])

//   return group
// }

// // ==== UPDATE

addUserToGroup = async (groupId, userId, client = db) =>
  await client.one(`
    INSERT INTO "user_group" (group_id, user_id)
    VALUES ($1, $2)
    RETURNING *`,
    [groupId, userId])

addSurveyToGroup = async (groupId, surveyId, client = db) =>
  await client.one(`
    INSERT INTO "survey_group" (group_id, survey_id)
    VALUES ($1, $2)
    RETURNING *`,
    [groupId, surveyId])

// ==== DELETE

module.exports = {
  // CREATE
  createGroup,

  // READ
  getUserRolesForSurvey,
  // findGroupById,

  // // UPDATE
  addUserToGroup,
  addSurveyToGroup

  // DELETE
}
