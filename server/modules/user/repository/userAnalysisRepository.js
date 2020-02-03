import { db } from '@server/db/db'

// ===== CREATE
export const insertUserAnalysis = async (surveyId, client = db) =>
  await client.one(
    `
      INSERT INTO 
        user_analysis(survey_id) 
      VALUES ($1)
      RETURNING *
    `,
    [surveyId],
  )

export const createUserDb = async (name, password, client = db) =>
  await client.query(`CREATE USER "${name}" WITH LOGIN PASSWORD '${password}'`)

// ===== READ
export const fetchUserAnalysisBySurveyId = async (surveyId, client = db) =>
  await client.oneOrNone(
    `
    SELECT * FROM user_analysis
    WHERE survey_id = $1
    `,
    [surveyId],
  )

// ===== DELETE
export const deleteUserAnalysisBySurveyId = async (surveyId, client = db) =>
  await client.oneOrNone(
    `
    DELETE FROM user_analysis
    WHERE survey_id = $1
    RETURNING *
    `,
    [surveyId],
  )

export const dropUserDb = async (name, client = db) => await client.query(`DROP USER IF EXISTS "${name}"`)
