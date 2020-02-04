import { db } from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ===== CREATE
export const insertUserAnalysis = async (surveyId, client = db) =>
  await client.query(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.user_analysis
      DEFAULT VALUES
    `,
  )

// ===== READ
export const fetchUserAnalysisBySurveyId = async (surveyId, client = db) =>
  await client.oneOrNone(
    `
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.user_analysis
    `,
  )
