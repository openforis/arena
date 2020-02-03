import { db } from '@server/db/db'

export const insertOrUpdateUserAnalysis = async (surveyId, client = db) =>
  await client.one(
    `
    INSERT INTO 
      user_analysis(survey_id) 
    VALUES ($1)
    ON CONFLICT (survey_id) 
    DO UPDATE 
      SET name = uuid_generate_v4(),
      password = uuid_generate_v4()
    RETURNING *
    `,
    [surveyId],
  )
