import { db } from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ====== DELETE

export const deleteStep = async (surveyId, processingStepUuid, client = db) =>
  client.none(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_step
    WHERE uuid = $1
    `,
    [processingStepUuid]
  )
