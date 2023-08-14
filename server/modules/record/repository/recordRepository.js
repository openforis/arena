import * as R from 'ramda'
import * as camelize from 'camelize'
import * as toSnakeCase from 'to-snake-case'

import { Dates } from '@openforis/arena-core'

import * as A from '@core/arena'
import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils'

const tableColumns = [
  Record.keys.uuid,
  Record.keys.step,
  Record.keys.cycle,
  Record.keys.preview,
  'owner_uuid',
  'date_created',
  'date_modified',
  'validation',
]
const tableName = 'record'

const selectFieldDateCreated = DbUtils.selectDate('date_created')
const selectFieldDateModified = DbUtils.selectDate('date_modified')
const recordSelectFields = `uuid, owner_uuid, step, cycle, ${selectFieldDateCreated}, ${selectFieldDateModified}, preview, validation`

const dbTransformCallback =
  (surveyId, includeValidationFields = true) =>
  (record) => {
    if (!record) return null

    const validation = Record.getValidation(record)
    return R.pipe(
      R.dissoc(Validation.keys.validation),
      camelize,
      R.assoc('surveyId', surveyId),
      R.assoc(
        Validation.keys.validation,
        includeValidationFields
          ? validation
          : {
              ...Validation.newInstance(Validation.isValid(validation)),
              [Validation.keys.counts]: Validation.getCounts(validation),
            }
      )
    )(record)
  }

// ============== CREATE

export const insertRecord = async (surveyId, record, client = db) => {
  const now = new Date()
  return client.one(
    `
    INSERT INTO ${getSurveyDBSchema(surveyId)}.record 
    (owner_uuid, uuid, step, cycle, preview, validation, date_created, date_modified)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
    RETURNING ${recordSelectFields}, (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = $9)
    `,
    [
      Record.getOwnerUuid(record),
      Record.getUuid(record),
      Record.getStep(record),
      Record.getCycle(record),
      Record.isPreview(record),
      Validation.isObjValid(record) ? {} : Record.getValidation(record),
      Dates.formatForStorage(Record.getDateCreated(record) || now),
      Dates.formatForStorage(Record.getDateModified(record) || now),
      surveyId,
    ],
    dbTransformCallback(surveyId)
  )
}

export const insertRecordsInBatch = async ({ surveyId, records, userUuid }, client = db) =>
  client.none(
    DbUtils.insertAllQueryBatch(
      `${getSurveyDBSchema(surveyId)}`,
      tableName,
      tableColumns,
      records.map((record) => ({
        ...record,
        owner_uuid: userUuid || Record.getOwnerUuid(record),
        date_created: Record.getDateCreated(record),
        date_modified: Record.getDateModified(record),
        validation: JSON.stringify(Validation.isObjValid(record) ? {} : Record.getValidation(record)),
      }))
    )
  )

// ============== READ

export const countRecordsBySurveyId = async (
  { surveyId, cycle = null, nodeDefRoot, nodeDefKeys, search = null },
  client = db
) => {
  if (!A.isEmpty(search)) {
    const recordsWithSearch = await fetchRecordsSummaryBySurveyId({ surveyId, cycle, nodeDefRoot, nodeDefKeys, search })
    return recordsWithSearch.length
  }
  return client.one(
    `
        SELECT count(*) 
        FROM ${getSurveyDBSchema(surveyId)}.record 
        WHERE preview = FALSE 
          ${cycle !== null ? 'AND cycle = $/cycle/' : ''}
      `,
    { cycle },
    (row) => Number(row.count)
  )
}

export const countRecordsBySurveyIdGroupedByStep = async ({ surveyId, cycle }, client = db) => {
  const counts = await client.manyOrNone(
    `SELECT step, count(*)
    FROM ${getSurveyDBSchema(surveyId)}.record 
    WHERE preview = FALSE AND cycle = $1
    GROUP BY step`,
    [cycle]
  )
  return RecordStep.steps.reduce(
    (acc, step) => ({
      ...acc,
      [step.id]: counts.find((count) => count.step === step.id)?.count || 0,
    }),
    {}
  )
}

export const fetchRecordsSummaryBySurveyId = async (
  {
    surveyId,
    nodeDefRoot = null,
    nodeDefKeys = null,
    cycle = null,
    step = null,
    offset = 0,
    limit = null,
    sortBy = 'date_created',
    sortOrder = 'DESC',
    search = null,
    recordUuid = null,
    includePreview = false,
  },
  client = db
) => {
  const rootEntityTableAlias = 'n0'
  const getNodeDefKeyColumnName = NodeDefTable.getColumnName
  const getNodeDefKeyColAlias = NodeDef.getName
  const nodeDefKeysColumnNamesByAlias = nodeDefKeys?.reduce(
    (acc, key) => ({ ...acc, [getNodeDefKeyColAlias(key)]: getNodeDefKeyColumnName(key) }),
    {}
  )
  const nodeDefKeysSelect = nodeDefKeys
    ?.map(
      (nodeDefKey) =>
        `${rootEntityTableAlias}.${getNodeDefKeyColumnName(nodeDefKey)} as "${getNodeDefKeyColAlias(nodeDefKey)}"`
    )
    .join(', ')

  const nodeDefKeysSelectSearch = nodeDefKeys
    ?.map(
      (nodeDefKey) =>
        ` (${rootEntityTableAlias}.${getNodeDefKeyColumnName(nodeDefKey)})::text ilike '%$/search:value/%'`
    )
    .join(' OR ')

  const recordsSelectWhereConditions = []
  if (!includePreview) recordsSelectWhereConditions.push('r.preview = FALSE')
  if (!A.isNull(cycle)) recordsSelectWhereConditions.push('r.cycle = $/cycle/')
  if (!A.isNull(step)) recordsSelectWhereConditions.push('r.step = $/step/')
  if (!A.isNull(recordUuid)) recordsSelectWhereConditions.push('r.uuid = $/recordUuid/')
  if (!A.isEmpty(search))
    recordsSelectWhereConditions.push(`${nodeDefKeysSelectSearch} OR u.name ilike '%$/search:value/%'`)

  const whereConditionsJoint = recordsSelectWhereConditions.map((condition) => `(${condition})`).join(' AND ')
  const whereCondition = whereConditionsJoint ? `WHERE ${whereConditionsJoint}` : ''

  return client.map(
    `
    SELECT 
      r.uuid, 
      r.owner_uuid, 
      r.cycle,
      r.step, 
      r.preview, 
      ${DbUtils.selectDate('r.date_created', 'date_created')}, 
      ${DbUtils.selectDate('r.date_modified', 'date_modified')},
      r.validation,
      s.uuid AS survey_uuid,
      u.name as owner_name
      ${nodeDefKeysSelect ? `, ${nodeDefKeysSelect}` : ''}
    FROM ${getSurveyDBSchema(surveyId)}.record r
    -- GET SURVEY UUID
    JOIN survey s
      ON s.id = $/surveyId/
    -- GET OWNER NAME
    JOIN "user" u
      ON r.owner_uuid = u.uuid
      ${
        nodeDefRoot && nodeDefKeys?.length > 0
          ? `-- join with root entity table to get node key values 
      LEFT OUTER JOIN
        ${SchemaRdb.getName(surveyId)}.${NodeDefTable.getViewName(nodeDefRoot)} as ${rootEntityTableAlias}
      ON r.uuid = ${rootEntityTableAlias}.record_uuid`
          : ''
      }

    ${whereCondition}

    ORDER BY ${
      nodeDefKeysColumnNamesByAlias && Object.keys(nodeDefKeysColumnNamesByAlias).includes(toSnakeCase(sortBy))
        ? `${rootEntityTableAlias}.${nodeDefKeysColumnNamesByAlias[toSnakeCase(sortBy)]}`
        : `r.${toSnakeCase(sortBy)}`
    } ${sortOrder}

    ${limit ? 'LIMIT $/limit:value/' : ''}

    OFFSET $/offset:value/
  `,
    { surveyId, cycle, step, search, limit, offset, recordUuid },
    dbTransformCallback(surveyId, false)
  )
}

export const fetchRecordByUuid = async (surveyId, recordUuid, client = db) =>
  client.oneOrNone(
    `SELECT 
     ${recordSelectFields}, (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = $2)
     FROM ${getSurveyDBSchema(surveyId)}.record WHERE uuid = $1`,
    [recordUuid, surveyId],
    dbTransformCallback(surveyId)
  )

export const fetchRecordsByUuids = async (surveyId, recordUuids, client = db) =>
  client.map(
    `SELECT 
     ${recordSelectFields}, (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = $2)
     FROM ${getSurveyDBSchema(surveyId)}.record 
     WHERE uuid IN ($1:csv)`,
    [recordUuids, surveyId],
    dbTransformCallback(surveyId)
  )

export const fetchRecordsUuidAndCycle = async (surveyId, client = db) =>
  client.any(`
    SELECT uuid, cycle 
    FROM ${getSurveyDBSchema(surveyId)}.record 
    WHERE preview = FALSE
    ORDER BY cycle
  `)

export const fetchRecordCreatedCountsByDates = async (surveyId, cycle, from, to, client = db) =>
  client.any(
    `
    SELECT
      COUNT(r.uuid),
      to_char(date_trunc('day', r.date_created), 'YYYY-MM-DD') AS date
    FROM
      ${getSurveyDBSchema(surveyId)}.record r
    WHERE
      r.date_created BETWEEN $1::DATE AND $2::DATE + INTERVAL '1 day'
    AND 
      r.cycle = $3     
    AND 
      r.preview = FALSE
    GROUP BY
      date_trunc('day', r.date_created)
    ORDER BY
      date_trunc('day', r.date_created)
  `,
    [from, to, cycle]
  )

// ============== UPDATE

export const updateRecordDateModified = async ({ surveyId, recordUuid, dateModified = new Date() }, client = db) =>
  client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.record 
     SET date_modified = $2
     WHERE uuid = $1
    RETURNING ${recordSelectFields}`,
    [recordUuid, Dates.formatForStorage(dateModified)]
  )

export const updateValidation = async (surveyId, recordUuid, validation, client = db) =>
  client.one(
    `UPDATE ${getSurveyDBSchema(surveyId)}.record 
     SET validation = $1::jsonb
     WHERE uuid = $2
    RETURNING ${recordSelectFields}`,
    [validation, recordUuid]
  )

export const updateRecordStep = async (surveyId, recordUuid, step, client = db) =>
  client.none(
    `
      UPDATE ${getSurveyDBSchema(surveyId)}.record
      SET step = $1
      WHERE uuid = $2`,
    [step, recordUuid]
  )

export const updateRecordValidationsFromValues = async (surveyId, recordUuidAndValidationValues, client = db) =>
  client.none(
    DbUtils.updateAllQuery(
      getSurveyDBSchema(surveyId),
      'record',
      { name: 'uuid', cast: 'uuid' },
      [{ name: 'validation', cast: 'jsonb' }],
      recordUuidAndValidationValues
    )
  )

// ============== DELETE

export const deleteRecord = async (surveyId, recordUuid, client = db) =>
  client.query(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE uuid = $1
    `,
    [recordUuid]
  )

export const deleteRecordsPreview = async (surveyId, olderThan24Hours = false, client = db) =>
  client.map(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE preview = $1
    ${olderThan24Hours ? "AND date_created <= NOW() - INTERVAL '24 HOURS'" : ''}
    RETURNING uuid
    `,
    [true],
    R.prop('uuid')
  )

export const deleteRecordsByCycles = async (surveyId, cycles, client = db) =>
  client.map(
    `
    DELETE FROM ${getSurveyDBSchema(surveyId)}.record
    WHERE cycle IN ($1:csv)
    RETURNING uuid
  `,
    [cycles],
    R.prop('uuid')
  )
