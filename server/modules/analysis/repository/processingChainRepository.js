import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as UserAnalysis from '@common/analysis/userAnalysis'

import { getSurveyDBSchema, dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

const selectFields = `uuid, props, validation, status_exec, ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate(
  'date_modified',
)}, ${DbUtils.selectDate('date_executed')}`

// ====== CREATE

export const insertChain = async (surveyId, chain, client = db) =>
  await client.one(
    `
    INSERT INTO ${getSurveyDBSchema(surveyId)}.processing_chain (uuid, props, validation)
    VALUES ($1, $2, $3)
    RETURNING ${selectFields}
    `,
    [ProcessingChain.getUuid(chain), ProcessingChain.getProps(chain), ProcessingChain.getValidation(chain)],
    dbTransformCallback,
  )

// ====== READ

export const countChainsBySurveyId = async (surveyId, cycle, client = db) =>
  await client.one(
    `
    SELECT COUNT(*) 
    FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE (props)->'${ProcessingChain.keysProps.cycles}' @> $1
    `,
    [JSON.stringify(cycle)],
  )

export const fetchChainsBySurveyId = async (surveyId, cycle, offset = 0, limit = null, client = db) =>
  await client.map(
    `
    SELECT ${selectFields}
    FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE (props)->'${ProcessingChain.keysProps.cycles}' @> $1
    ORDER BY date_created DESC
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}
    `,
    [JSON.stringify(cycle)],
    dbTransformCallback,
  )

export const fetchChainByUuid = async (surveyId, processingChainUuid, client = db) =>
  await client.oneOrNone(
    `
    SELECT ${selectFields}
    FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE uuid = $1
    `,
    [processingChainUuid],
    dbTransformCallback,
  )

// ====== UPDATE

export const updateChainProp = async (surveyId, processingChainUuid, key, value, client = db) =>
  await client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET props = props || $2::jsonb,
        date_modified = ${DbUtils.now}
    WHERE uuid = $1
    `,
    [processingChainUuid, { [key]: value }],
  )

export const updateChainValidation = async (surveyId, processingChainUuid, validation, client = db) =>
  await client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET validation = $2,
        date_modified = ${DbUtils.now}
    WHERE uuid = $1
    `,
    [processingChainUuid, validation],
  )

export const updateChainDateModified = async (surveyId, processingChainUuid, client = db) =>
  await client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET date_modified = ${DbUtils.now}
    WHERE uuid = $1
    `,
    [processingChainUuid],
  )

export const removeCyclesFromChains = async (surveyId, cycles, client = db) =>
  await client.query(`
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET props = jsonb_set(props, '{${ProcessingChain.keysProps.cycles}}',
      (props->'${ProcessingChain.keysProps.cycles}') ${cycles.map(cycle => `- '${cycle}'`).join(' ')}
    )
  `)

// ====== DELETE

export const deleteChain = async (surveyId, processingChainUuid, client = db) =>
  await client.one(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE uuid = $1
    RETURNING ${selectFields}
    `,
    [processingChainUuid],
    dbTransformCallback,
  )

export const deleteChainsWithoutCycles = async (surveyId, client = db) =>
  await client.query(`
    DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE jsonb_array_length(props->'${ProcessingChain.keysProps.cycles}') = 0
  `)

// ===== GRANT PRIVILEGES
export const grantUpdateToUserAnalysis = async (surveyId, client = db) => {
  const schema = getSurveyDBSchema(surveyId)
  const userName = UserAnalysis.getName(surveyId)

  // Grant usage on survey RDB schema
  await client.query(`
    GRANT
      USAGE
      ON SCHEMA ${schema}
      TO "${userName}"
    `)
  // Grant select on processing_chain table and update only on status_exec column
  await client.query(`
    GRANT 
      SELECT, UPDATE (status_exec) 
      ON ${schema}.processing_chain
      TO "${userName}"
  `)
}
