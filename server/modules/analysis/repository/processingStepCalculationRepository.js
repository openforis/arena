import camelize from 'camelize'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { db } from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ====== CREATE

export const insertCalculationStep = async (surveyId, calculation, client = db) =>
  await client.one(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.processing_step_calculation
        (uuid, processing_step_uuid, index, node_def_uuid, props)  
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      ProcessingStepCalculation.getUuid(calculation),
      ProcessingStepCalculation.getProcessingStepUuid(calculation),
      ProcessingStepCalculation.getIndex(calculation),
      ProcessingStepCalculation.getNodeDefUuid(calculation),
      ProcessingStepCalculation.getProps(calculation),
    ],
    camelize,
  )

// ====== READ

export const fetchCalculationByUuid = async (surveyId, uuid, client = db) =>
  await client.oneOrNone(
    `SELECT * 
    FROM ${getSurveyDBSchema(surveyId)}.processing_step_calculation 
    WHERE uuid = $1`,
    [uuid],
    camelize,
  )

export const fetchCalculationsByStepUuid = async (surveyId, processingStepUuid, client = db) =>
  await client.map(
    `SELECT * 
    FROM ${getSurveyDBSchema(surveyId)}.processing_step_calculation 
    WHERE processing_step_uuid = $1`,
    [processingStepUuid],
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

export const updateCalculationStep = async (surveyId, calculation, client = db) =>
  await client.one(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_step_calculation
    SET node_def_uuid = $2, props = $3
    WHERE uuid = $1
    RETURNING *
    `,
    [
      ProcessingStepCalculation.getUuid(calculation),
      ProcessingStepCalculation.getNodeDefUuid(calculation),
      ProcessingStepCalculation.getProps(calculation),
    ],
    camelize,
  )

// ====== DELETE

export const deleteCalculationStep = async (surveyId, processingStepUuid, processingStepCalculationUuid, client = db) =>
  await client.tx(async t => {
    // Delete calculation
    const calculation = await t.one(
      `
      DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_step_calculation
      WHERE uuid = $1
      RETURNING *
      `,
      [processingStepCalculationUuid],
      camelize,
    )
    // Update indexes of next calculations
    await t.none(
      `
      UPDATE ${getSurveyDBSchema(surveyId)}.processing_step_calculation
      SET index = index - 1
      WHERE processing_step_uuid = $1 AND index > $2
      `,
      [processingStepUuid, ProcessingStepCalculation.getIndex(calculation)],
    )

    return calculation
  })
