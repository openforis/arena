import * as R from 'ramda'
import * as camelize from 'camelize'

import { db } from '@server/db/db'

import { TableRChainResult } from '@common/model/db'

// ============== CREATE

export const insertResult = async (
  { surveyId, chainUuid, cycle, entityDefUuid, fileName, filePath, fileSize },
  client = db
) => {
  const result = await client.one(
    `
    INSERT INTO ${TableRChainResult.tableName}
    (${TableRChainResult.columns.surveyId}, 
     ${TableRChainResult.columns.chainUuid}, 
     ${TableRChainResult.columns.cycle}, 
     ${TableRChainResult.columns.entityDefUuid}, 
     ${TableRChainResult.columns.fileName}, 
     ${TableRChainResult.columns.filePath}, 
     ${TableRChainResult.columns.fileSize}, 
     ${TableRChainResult.columns.dateCreated}, 
     ${TableRChainResult.columns.dateModified})
    VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `,
    [surveyId, chainUuid, cycle, entityDefUuid, fileName, filePath, fileSize, new Date(), new Date()]
  )
  return camelize(result)
}

// ============== READ

export const fetchResultsBySurveyId = async ({ surveyId, limit = null, offset = 0 }, client = db) => {
  const results = await client.any(
    `
    SELECT * FROM ${TableRChainResult.tableName}
    WHERE ${TableRChainResult.columns.surveyId} = $1
    ORDER BY ${TableRChainResult.columns.dateCreated} DESC
    ${limit ? `LIMIT ${limit}` : ''}
    OFFSET ${offset}
    `,
    [surveyId]
  )
  return camelize(results)
}

export const fetchResultsByChainUuid = async ({ surveyId, chainUuid, limit = null, offset = 0 }, client = db) => {
  const results = await client.any(
    `
    SELECT * FROM ${TableRChainResult.tableName}
    WHERE ${TableRChainResult.columns.surveyId} = $1
    AND ${TableRChainResult.columns.chainUuid} = $2
    ORDER BY ${TableRChainResult.columns.dateCreated} DESC
    ${limit ? `LIMIT ${limit}` : ''}
    OFFSET ${offset}
    `,
    [surveyId, chainUuid]
  )
  return camelize(results)
}

export const fetchResultById = async ({ id }, client = db) => {
  const result = await client.oneOrNone(
    `
    SELECT * FROM ${TableRChainResult.tableName}
    WHERE ${TableRChainResult.columns.id} = $1
    `,
    [id]
  )
  return result ? camelize(result) : null
}

export const countResultsBySurveyId = async ({ surveyId }, client = db) => {
  const result = await client.one(
    `
    SELECT COUNT(*) FROM ${TableRChainResult.tableName}
    WHERE ${TableRChainResult.columns.surveyId} = $1
    `,
    [surveyId]
  )
  return Number(result.count)
}

// ============== DELETE

export const deleteResultById = async ({ id }, client = db) => {
  await client.none(
    `
    DELETE FROM ${TableRChainResult.tableName}
    WHERE ${TableRChainResult.columns.id} = $1
    `,
    [id]
  )
}

export const deleteResultsByChainUuid = async ({ surveyId, chainUuid }, client = db) => {
  await client.none(
    `
    DELETE FROM ${TableRChainResult.tableName}
    WHERE ${TableRChainResult.columns.surveyId} = $1
    AND ${TableRChainResult.columns.chainUuid} = $2
    `,
    [surveyId, chainUuid]
  )
}

// ============== UTILS

export const createRChainResultsTable = async (client = db) => {
  await client.none(TableRChainResult.createTable)
}

export const dropRChainResultsTable = async (client = db) => {
  await client.none(TableRChainResult.dropTable)
}
