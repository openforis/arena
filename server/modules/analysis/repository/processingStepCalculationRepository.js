import camelize from 'camelize'

import { db } from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ====== CREATE

export const insertCalculationStep = async (surveyId, processingStepUuid, index, client = db) =>
  await client.one(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.processing_step_calculation
        (processing_step_uuid, index)  
      VALUES 
        ($1, $2)
      RETURNING *
    `,
    [processingStepUuid, index],
    camelize,
  )

// ====== UPDATE

export const updateCalculationIndex = async (surveyId, processingStepUuid, indexFrom, indexTo, client = db) => {
  const indexPlaceholder = -1
  const queries = []

  const _getUpdate = (indexCurrent, indexUpdate) =>
    client.one(
      `
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_step_calculation
    SET index = ${indexUpdate}
    WHERE processing_step_uuid = $1
    AND index = $2
    RETURNING *
    `,
      [processingStepUuid, indexCurrent],
    )

  // Set index placeholder for element being edited
  queries.push(_getUpdate(indexFrom, indexPlaceholder))

  // Decrement previous calculations (element is moved forward)
  for (let i = indexFrom + 1; i <= indexTo; i++) {
    queries.push(_getUpdate(i, 'index - 1'))
  }

  // Increment next calculations (element is moved backward)
  for (let i = indexFrom - 1; i >= indexTo; i--) {
    queries.push(_getUpdate(i, 'index + 1'))
  }

  // Set index for element being edited
  queries.push(_getUpdate(indexPlaceholder, indexTo))

  const queriesRes = await client.batch(queries)

  return queriesRes[queriesRes.length - 1]
}

// ====== DELETE
