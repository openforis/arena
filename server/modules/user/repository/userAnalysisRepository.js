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

// ===== READ
export const fetchUserAnalysisBySurveyId = async (surveyId, client = db) =>
  await client.oneOrNone(
    `
    SELECT * FROM user_analysis
    WHERE survey_id = $1
    `,
    [surveyId],
  )
