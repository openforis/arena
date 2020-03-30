import * as R from 'ramda'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as UserAnalysis from '@common/analysis/userAnalysis'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { getSurveyDBSchema, dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

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

export const fetchChainsBySurveyId = async (surveyId, cycle = null, offset = 0, limit = null, client = db) =>
  await client.map(
    `
    SELECT ${selectFields}
    FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    ${cycle ? `WHERE (props)->'${ProcessingChain.keysProps.cycles}' @> '"${cycle}"'` : ''}
    ORDER BY date_created DESC
    LIMIT ${limit || 'ALL'}
    OFFSET ${offset}
    `,
    [],
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

export const fetchStepData = async (survey, cycle, step, client = db) => {
  const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
  const entityDefParent = Survey.getNodeDefParent(entityDef)(survey)
  const viewName = NodeDefTable.getViewName(entityDef, entityDefParent)
  const calculationAttrDefs = R.pipe(
    ProcessingStep.getCalculations,
    R.map(
      R.pipe(ProcessingStepCalculation.getNodeDefUuid, nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey)),
    ),
  )(step)

  const fields = ['*']
  for (const nodeDef of calculationAttrDefs) {
    const nodeDefName = NodeDef.getName(nodeDef)
    // Add nodeDefName_uuid field
    fields.push(`uuid_generate_v4() as ${nodeDefName}_uuid`)
  }

  return await client.any(`
      SELECT ${fields.join(', ')} 
      FROM ${SchemaRdb.getName(Survey.getId(survey))}.${viewName}
      WHERE ${DataTable.colNameRecordCycle} = '${cycle}' 
    `)
}

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
