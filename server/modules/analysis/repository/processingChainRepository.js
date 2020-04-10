import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as UserAnalysis from '@common/analysis/userAnalysis'

import { getSurveyDBSchema, dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

const selectFields = `uuid, props, validation, status_exec, ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate(
  'date_modified'
)}, ${DbUtils.selectDate('date_executed')}`

// ====== CREATE

export const insertChain = async (surveyId, chain, client = db) =>
  client.one(
    `INSERT INTO ${getSurveyDBSchema(surveyId)}.processing_chain (uuid, props, validation)
    VALUES ($1, $2, $3)
    RETURNING ${selectFields}`,
    [ProcessingChain.getUuid(chain), ProcessingChain.getProps(chain), ProcessingChain.getValidation(chain)],
    dbTransformCallback
  )

// ====== READ

export const countChainsBySurveyId = async (surveyId, cycle, client = db) =>
  client.one(
    `SELECT COUNT(*) 
    FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE (props)->'${ProcessingChain.keysProps.cycles}' @> $1`,
    [JSON.stringify(cycle)]
  )

export const fetchChainsBySurveyId = async (surveyId, cycle = null, offset = 0, limit = null, client = db) =>
  client.map(
    `SELECT ${selectFields}
    FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    ${cycle ? `WHERE (props)->'${ProcessingChain.keysProps.cycles}' @> '"${cycle}"'` : ''}
    ORDER BY date_created DESC
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}`,
    [],
    dbTransformCallback
  )

/**
 * Fetches a processing chain with the given surveyId and chainUuid.
 *
 * @param {!object} params - Query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {boolean} [params.includeScript = false] - Whether to include chain script.
 * @param {pgPromise.IDatabase} client - The database client.
 *
 * @returns {Promise<any | null>} - The chain if found, null otherwise.
 */
export const fetchChainByUuid = async ({ surveyId, chainUuid, includeScript }, client = db) =>
  client.oneOrNone(
    `SELECT ${selectFields}${includeScript === true ? ' ,script_common' : ''}
    FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE uuid = $1`,
    [chainUuid],
    dbTransformCallback
  )

// ====== UPDATE

export const updateChainProp = async (surveyId, processingChainUuid, key, value, client = db) =>
  client.query(
    `UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET props = props || $2::jsonb,
        date_modified = ${DbUtils.now}
    WHERE uuid = $1`,
    [processingChainUuid, { [key]: value }]
  )

export const updateChainValidation = async (surveyId, processingChainUuid, validation, client = db) =>
  client.query(
    `UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET validation = $2,
        date_modified = ${DbUtils.now}
    WHERE uuid = $1`,
    [processingChainUuid, validation]
  )

export const updateChainDateModified = async (surveyId, processingChainUuid, client = db) =>
  client.query(
    `UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET date_modified = ${DbUtils.now}
    WHERE uuid = $1`,
    [processingChainUuid]
  )

export const removeCyclesFromChains = async (surveyId, cycles, client = db) =>
  client.query(
    `UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET props = jsonb_set(props, '{${ProcessingChain.keysProps.cycles}}',
      (props->'${ProcessingChain.keysProps.cycles}') ${cycles.map((cycle) => `- '${cycle}'`).join(' ')}
    )`
  )

export const updateChainScriptCommon = async (surveyId, chainUuid, script, client = db) =>
  client.query(
    `UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain 
    SET script_common = $2
    WHERE uuid = $1`,
    [chainUuid, script]
  )

// ====== DELETE

export const deleteChain = async (surveyId, processingChainUuid, client = db) =>
  client.one(
    `DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE uuid = $1
    RETURNING ${selectFields}`,
    [processingChainUuid],
    dbTransformCallback
  )

export const deleteChainsWithoutCycles = async (surveyId, client = db) =>
  client.query(
    `DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE jsonb_array_length(props->'${ProcessingChain.keysProps.cycles}') = 0`
  )

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
  // Grant select uuid on 'processing_chain' table and update only on 'status_exec' column
  await client.query(`
    GRANT 
      SELECT (uuid), UPDATE (status_exec) 
      ON ${schema}.processing_chain
      TO "${userName}"
  `)
  // Grant select uuid on 'processing_step_calculation' and update only on 'script' column
  await client.query(`
    GRANT 
      SELECT (uuid), UPDATE (script) 
      ON ${schema}.processing_step_calculation
      TO "${userName}"
  `)
}
