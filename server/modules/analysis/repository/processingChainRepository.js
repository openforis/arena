import camelize from 'camelize'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as ProcessingChain from '@common/analysis/processingChain'

import { getSurveyDBSchema, dbTransformCallback } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

const selectFields = `uuid, props, status_exec, ${DbUtils.selectDate('date_created')}, ${DbUtils.selectDate(
  'date_modified',
)}, ${DbUtils.selectDate('date_executed')}`

// ====== CREATE

export const insertChain = async (surveyId, chain, client = db) =>
  await client.one(
    `
    INSERT INTO ${getSurveyDBSchema(surveyId)}.processing_chain (uuid, props)
    VALUES ($1, $2)
    RETURNING ${selectFields}
    `,
    [ProcessingChain.getUuid(chain), ProcessingChain.getProps(chain)],
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
    ORDER BY date_modified DESC
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
    camelize,
  )

// ====== UPDATE

export const updateChainProp = async (surveyId, processingChainUuid, key, value, client = db) =>
  await client.query(
    `
    UPDATE ${getSurveyDBSchema(surveyId)}.processing_chain
    SET props = jsonb_set("props", '{${key}}', $2::jsonb),
        date_modified = ${DbUtils.now}
    WHERE uuid = $1
    RETURNING ${selectFields}
    `,
    [processingChainUuid, value],
  )

// ====== DELETE

export const deleteChain = async (surveyId, processingChainUuid, client = db) =>
  await client.one(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.processing_chain
    WHERE uuid = $1
    RETURNING ${selectFields}
    `,
    [processingChainUuid],
    camelize,
  )
