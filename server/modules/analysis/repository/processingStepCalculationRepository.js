import camelize from 'camelize'

import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { db } from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

export const selectFieldsArray = ['uuid', 'processing_step_uuid', 'index', 'node_def_uuid', 'props']
const _selectFields = selectFieldsArray.join(', ')

// ====== DELETE

export const deleteCalculationStep = async (surveyId, processingStepUuid, processingStepCalculationUuid, client = db) =>
  client.tx(async (t) => {
    // Delete calculation
    const calculation = await t.one(
      `
      DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_step_calculation
      WHERE uuid = $1
      RETURNING ${_selectFields}
      `,
      [processingStepCalculationUuid],
      camelize
    )
    // Update indexes of next calculations
    await t.none(
      `
      UPDATE ${getSurveyDBSchema(surveyId)}.processing_step_calculation
      SET index = index - 1
      WHERE processing_step_uuid = $1 AND index > $2
      `,
      [processingStepUuid, ProcessingStepCalculation.getIndex(calculation)]
    )

    return calculation
  })
