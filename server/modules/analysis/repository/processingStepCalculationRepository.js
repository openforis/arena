import camelize from 'camelize'

import { db } from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ====== CREATE
export const insertCalculationStep = async (surveyId, processingStepUuid, index, client = db) =>
  await client.one(`
      INSERT INTO ${getSurveyDBSchema(surveyId)}.processing_step_calculation
        (processing_step_uuid, index)  
      VALUES 
        ($1, $2)
      RETURNING *
    `,
    [processingStepUuid, index],
    camelize
  )

// ====== READ

// ====== UPDATE

// ====== DELETE
