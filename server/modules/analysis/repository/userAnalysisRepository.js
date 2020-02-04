import { db } from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ===== CREATE
export const insertUserAnalysis = async (surveyId, client = db) =>
  await client.one(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.user_analysis
      DEFAULT VALUES
      RETURNING *
    `,
  )

// ===== READ
export const fetchUserAnalysisBySurveyId = async (surveyId, client = db) =>
  await client.oneOrNone(
    `
    SELECT * FROM ${getSurveyDBSchema(surveyId)}.user_analysis
    `,
  )
