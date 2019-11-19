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

// ====== UPDATE

export const updateCalculationIndex = async (surveyId, processingStepUuid, indexFrom, indexTo, client = db) => {
  const indexPlaceholder = -1
  const queries = []

  // set index placeholder for element being edited
  queries.push(client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_step_calculation
    SET index = $3
    WHERE processing_step_uuid = $1
    AND index = $2
    RETURNING uuid
    `,
    [processingStepUuid, indexFrom, indexPlaceholder]
  ))

  // decrement previous calculations (element is moved forward)
  for (let i = indexFrom + 1; i <= indexTo; i++) {
    queries.push(client.query(`
      UPDATE ${getSurveyDBSchema(surveyId)}.processing_step_calculation
      SET index = index - 1
      WHERE processing_step_uuid = $1
      AND index = $2
    `,
      [processingStepUuid, i]
    ))
  }

  // increment next calculations (element is moved backward)
  for (let i = indexFrom - 1; i >= indexTo; i--) {
    queries.push(client.query(`
      UPDATE ${getSurveyDBSchema(surveyId)}.processing_step_calculation
      SET index = index + 1
      WHERE processing_step_uuid = $1
      AND index = $2
    `,
      [processingStepUuid, i]
    ))
  }

  // set index for element being edited
  queries.push(client.one(`
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_step_calculation
    SET index = $3
    WHERE processing_step_uuid = $1
    AND index = $2
    RETURNING *
  `,
    [processingStepUuid, indexPlaceholder, indexTo]
  ))

  const queriesRes = await client.batch(queries)

  return queriesRes[queriesRes.length - 1]
}

// ====== DELETE
