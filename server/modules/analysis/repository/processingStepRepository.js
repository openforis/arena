import * as R from 'ramda'
import camelize from 'camelize'

import * as ProcessingStep from '@common/analysis/processingStep'

import { db } from '@server/db/db'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as ProcessingStepCalculationRepository from './processingStepCalculationRepository'

// ====== CREATE
export const insertStep = async (surveyId, step, client = db) =>
  await client.one(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.processing_step
        (uuid, processing_chain_uuid, index, props)  
      VALUES 
        ($1, $2, $3, $4::jsonb)
      RETURNING *
    `,
    [
      ProcessingStep.getUuid(step),
      ProcessingStep.getProcessingChainUuid(step),
      ProcessingStep.getIndex(step),
      ProcessingStep.getProps(step),
    ],
    camelize,
  )

// ====== READ
const _fetchStepsByChainUuid = async (surveyId, processingChainUuid, includeCalculations, client) => {
  const schema = getSurveyDBSchema(surveyId)
  const calculationObjectAgg = includeCalculations
    ? R.pipe(
        R.map(field => `'${field}', c.${field}`),
        R.join(', '),
      )(ProcessingStepCalculationRepository.selectFieldsArray)
    : ''

  return await client.map(
    `
    SELECT
      s.*,
      COUNT(c.uuid) AS calculations_count
      ${
        includeCalculations
          ? `, json_agg(json_build_object(${calculationObjectAgg}) order by c.index) as calculations`
          : ''
      }
    FROM
      ${schema}.processing_step s
    LEFT OUTER JOIN
      ${schema}.processing_step_calculation c
    ON
      s.uuid = c.processing_step_uuid
    WHERE
      s.processing_chain_uuid = $1
    GROUP BY
      s.uuid
    ORDER BY
      s.index`,
    [processingChainUuid],
    camelize,
  )
}

export const fetchStepsByChainUuid = async (surveyId, processingChainUuid, client = db) =>
  await _fetchStepsByChainUuid(surveyId, processingChainUuid, false, client)

export const fetchStepsAndCalculationsByChainUuid = async (surveyId, processingChainUuid, client = db) =>
  await _fetchStepsByChainUuid(surveyId, processingChainUuid, true, client)

export const fetchStepSummaryByUuid = async (surveyId, processingStepUuid, client = db) =>
  await client.oneOrNone(
    `
    SELECT *
    FROM ${getSurveyDBSchema(surveyId)}.processing_step
    WHERE uuid = $1
    `,
    [processingStepUuid],
    camelize,
  )

export const fetchStepSummaryByIndex = async (surveyId, processingChainUuid, index, client = db) =>
  await client.oneOrNone(
    `
    SELECT *
    FROM ${getSurveyDBSchema(surveyId)}.processing_step
    WHERE processing_chain_uuid = $1
    AND index = $2
    `,
    [processingChainUuid, index],
    camelize,
  )

// ====== UPDATE

export const updateStepProp = async (surveyId, processingStepUuid, key, value, client = db) =>
  await client.one(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_step
    SET props = jsonb_set(props, '{${key}}', '"${value}"')
    WHERE uuid = $1
    RETURNING *
    `,
    [processingStepUuid],
    camelize,
  )

// ====== DELETE

export const deleteStep = async (surveyId, processingStepUuid, client = db) =>
  await client.none(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_step
    WHERE uuid = $1
    `,
    [processingStepUuid],
  )
