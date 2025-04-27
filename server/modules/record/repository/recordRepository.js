import * as R from 'ramda'

import { Dates, Objects } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { AppInfo } from '@core/app/appInfo'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as RecordStep from '@core/record/recordStep'
import * as Validation from '@core/validation/validation'

import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import { getSchemaSurvey } from '@common/model/db/schemata'
import { ColumnNodeDef } from '@common/model/db'

const tableName = 'record'
const tableColumns = [
  Record.keys.uuid,
  Record.keys.step,
  Record.keys.cycle,
  Record.keys.preview,
  'owner_uuid',
  'date_created',
  'date_modified',
  'validation',
  'info',
  'merged_into_record_uuid',
]
const dateColumns = ['date_created', 'date_modified']

const recordSelectFieldsArray = [
  ...tableColumns.filter((col) => !dateColumns.includes(col)),
  ...dateColumns.map((dateCol) => DbUtils.selectDate(dateCol)),
]
const recordSelectFields = recordSelectFieldsArray.join(', ')

const dbTransformCallback =
  (surveyId, includeValidationFields = true) =>
  (record) => {
    if (!record) return null
    const validation = Record.getValidation(record)
    return R.pipe(
      R.dissoc(Validation.keys.validation),
      A.camelizePartial({ limitToLevel: 1 }),
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
    INSERT INTO ${getSchemaSurvey(surveyId)}.record 
    (owner_uuid, uuid, step, cycle, preview, validation, date_created, date_modified, info, merged_into_record_uuid)
    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
    RETURNING ${recordSelectFields}, (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = $11)
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
      Record.getInfo(record),
      Record.getMergedIntoRecordUuid(record),
      surveyId,
    ],
    dbTransformCallback(surveyId)
  )
}

export const insertRecordsInBatch = async ({ surveyId, records, userUuid }, client = db) =>
  client.none(
    DbUtils.insertAllQueryBatch(
      `${getSchemaSurvey(surveyId)}`,
      tableName,
      tableColumns,
      records.map((record) => ({
        ...record,
        owner_uuid: userUuid || Record.getOwnerUuid(record),
        date_created: Record.getDateCreated(record),
        date_modified: Record.getDateModified(record),
        validation: JSON.stringify(Validation.isObjValid(record) ? {} : Record.getValidation(record)),
        info: Record.getInfo(record),
        merged_into_record_uuid: Record.getMergedIntoRecordUuid(record),
      }))
    )
  )

// ============== READ

export const countRecordsBySurveyId = async (
  { surveyId, cycle = null, nodeDefRoot, nodeDefKeys, search = null, ownerUuid = null },
  client = db
) => {
  if (!A.isEmpty(search)) {
    const recordsWithSearch = await fetchRecordsSummaryBySurveyId({ surveyId, cycle, nodeDefRoot, nodeDefKeys, search })
    return recordsWithSearch.length
  }
  return client.one(
    `
        SELECT count(*) 
        FROM ${getSchemaSurvey(surveyId)}.record 
        WHERE preview = FALSE 
          ${cycle !== null ? 'AND cycle = $/cycle/' : ''}
          ${ownerUuid ? 'AND owner_uuid = $/ownerUuid/' : ''}
      `,
    { cycle, ownerUuid },
    (row) => Number(row.count)
  )
}

export const countRecordsGroupedByApp = async ({ surveyId, cycle = null }, client = db) => {
  const counts = await client.any(
    `
        SELECT COALESCE(info #>> '{${Record.infoKeys.createdWith},${AppInfo.keys.appId}}', '${AppInfo.arenaAppId}') AS created_with, count(*)
        FROM ${getSchemaSurvey(surveyId)}.record 
        WHERE preview = FALSE 
          ${cycle !== null ? 'AND cycle = $/cycle/' : ''}
        GROUP BY created_with
      `,
    { cycle }
  )
  return counts.reduce((acc, { created_with, count }) => {
    acc[created_with] = Number(count)
    return acc
  }, {})
}

export const countRecordsBySurveyIdGroupedByStep = async ({ surveyId, cycle }, client = db) => {
  const counts = await client.manyOrNone(
    `SELECT step, count(*)
    FROM ${getSchemaSurvey(surveyId)}.record 
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
    ownerUuid = null,
    recordUuids = null,
    includePreview = false,
    includeMerged = false,
  },
  client = db
) => {
  const rootEntityTableAlias = 'n0'
  const getNodeDefKeyColumnName = NodeDefTable.getColumnName
  const getNodeDefKeyColAlias = NodeDef.getName
  const nodeDefKeysColumnNamesByAlias = nodeDefKeys?.reduce((acc, keyDef) => {
    const colName = NodeDef.isCode(keyDef)
      ? ColumnNodeDef.getCodeLabelColumnName(keyDef)
      : getNodeDefKeyColumnName(keyDef)
    acc[getNodeDefKeyColAlias(keyDef)] = colName
    return acc
  }, {})
  const nodeDefKeysSelect = nodeDefKeys
    ?.flatMap((nodeDefKey) => {
      const colNames = NodeDefTable.getColumnNames(nodeDefKey)
      return colNames.map((keyColName) => `${rootEntityTableAlias}.${keyColName} AS ${keyColName}`)
    })
    .join(', ')

  const nodeDefKeysSelectSearch = nodeDefKeys
    ?.map((nodeDefKey) =>
      NodeDefTable.getColumnNames(nodeDefKey)
        .map((colName) => ` (${rootEntityTableAlias}.${colName})::text ilike '%$/search:value/%'`)
        .join(' OR ')
    )
    .join(' OR ')

  const recordsSelectWhereConditions = []
  if (!includePreview) recordsSelectWhereConditions.push('r.preview = FALSE')
  recordsSelectWhereConditions.push(`r.merged_into_record_uuid ${includeMerged ? 'IS NOT NULL' : 'IS NULL'}`)
  if (!A.isNull(cycle)) recordsSelectWhereConditions.push('r.cycle = $/cycle/')
  if (!A.isNull(step)) recordsSelectWhereConditions.push('r.step = $/step/')
  if (!A.isNull(recordUuids)) recordsSelectWhereConditions.push('r.uuid IN ($/recordUuids:csv/)')
  if (!A.isEmpty(search))
    recordsSelectWhereConditions.push(`(${nodeDefKeysSelectSearch} OR u.name ilike '%$/search:value/%')`)
  if (!A.isNull(ownerUuid)) recordsSelectWhereConditions.push('r.owner_uuid = $/ownerUuid/')

  const whereConditionsJoint = recordsSelectWhereConditions.map((condition) => `(${condition})`).join(' AND ')
  const whereCondition = whereConditionsJoint ? `WHERE ${whereConditionsJoint}` : ''
  const sortByColumnName = StringUtils.toSnakeCase(sortBy)

  return client.map(
    `
    SELECT 
      r.uuid, 
      r.owner_uuid, 
      r.cycle,
      r.step, 
      r.preview, 
      r.merged_into_record_uuid, 
      ${DbUtils.selectDate('r.date_created', 'date_created')}, 
      ${DbUtils.selectDate('r.date_modified', 'date_modified')},
      r.validation,
      r.info,
      s.uuid AS survey_uuid,
      u.name as owner_name
      ${nodeDefKeysSelect ? `, ${nodeDefKeysSelect}` : ''}
    FROM ${getSchemaSurvey(surveyId)}.record r
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
      nodeDefKeysColumnNamesByAlias && Object.keys(nodeDefKeysColumnNamesByAlias).includes(sortByColumnName)
        ? `${rootEntityTableAlias}.${nodeDefKeysColumnNamesByAlias[sortByColumnName]}`
        : `r.${sortByColumnName}`
    } ${sortOrder}

    ${limit ? 'LIMIT $/limit:value/' : ''}

    OFFSET $/offset:value/
  `,
    { surveyId, cycle, step, search, limit, offset, recordUuids, ownerUuid },
    dbTransformCallback(surveyId, false)
  )
}

export const fetchRecordCountsByStep = async (surveyId, cycle, client = db) => {
  const countsArray = await client.any(
    `
    SELECT
      step,
      COUNT(*) as count
    FROM
      ${getSchemaSurvey(surveyId)}.record
    WHERE
      cycle = $1
    GROUP BY
      step
    `,
    [String(cycle)]
  )
  return Object.values(RecordStep.steps).reduce((acc, step) => {
    const stepId = RecordStep.getId(step)
    const count = Number(countsArray.find((countRow) => countRow.step === stepId)?.count ?? 0)
    acc[stepId] = count
    return acc
  }, {})
}

export const fetchRecordByUuid = async (surveyId, recordUuid, client = db) =>
  client.oneOrNone(
    `SELECT 
      ${recordSelectFields}, 
      (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = $2)
     FROM ${getSchemaSurvey(surveyId)}.record
     WHERE uuid = $1`,
    [recordUuid, surveyId],
    dbTransformCallback(surveyId)
  )

export const fetchRecordsByUuids = async (surveyId, recordUuids, client = db) =>
  client.map(
    `SELECT 
     ${recordSelectFields}, (SELECT s.uuid AS survey_uuid FROM survey s WHERE s.id = $2)
     FROM ${getSchemaSurvey(surveyId)}.record 
     WHERE uuid IN ($1:csv)`,
    [recordUuids, surveyId],
    dbTransformCallback(surveyId)
  )

export const fetchRecordsUuidAndCycle = async ({ surveyId, recordUuidsIncluded = null }, client = db) =>
  client.any(
    `
    SELECT uuid, cycle 
    FROM ${getSchemaSurvey(surveyId)}.record 
    WHERE preview = FALSE
    ${Objects.isEmpty(recordUuidsIncluded) ? '' : `AND uuid IN ($/recordUuidsIncluded:csv/)`}
    ORDER BY cycle
  `,
    { recordUuidsIncluded }
  )

export const fetchRecordCreatedCountsByDates = async (surveyId, cycle, from, to, client = db) =>
  client.any(
    `
    SELECT
      COUNT(r.uuid),
      to_char(date_trunc('day', r.date_created), 'YYYY-MM-DD') AS date
    FROM
      ${getSchemaSurvey(surveyId)}.record r
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

export const fetchRecordCreatedCountsByDatesAndUser = async (surveyId, cycle, from, to, client = db) =>
  client.any(
    `
    SELECT
      COUNT(r.uuid),
      to_char(date_trunc('day', r.date_created), 'YYYY-MM-DD') AS date,
      r.owner_uuid,
      u.name AS owner_name,
      u.email AS owner_email
    FROM
      ${getSchemaSurvey(surveyId)}.record r
    JOIN public.user u ON r.owner_uuid = u.uuid
    WHERE
      r.date_created BETWEEN $1::DATE AND $2::DATE + INTERVAL '1 day'
    AND 
      r.cycle = $3     
    AND 
      r.preview = FALSE
    GROUP BY
      date_trunc('day', r.date_created),
      r.owner_uuid,
      u.name,
      u.email
    ORDER BY
      date_trunc('day', r.date_created)
  `,
    [from, to, cycle]
  )

export const fetchRecordCreatedCountsByUser = async (surveyId, cycle, from, to, client = db) =>
  client.any(
    `
    SELECT
      COUNT(r.uuid),
      r.owner_uuid,
      u.name AS owner_name,
      u.email AS owner_email  
    FROM
      ${getSchemaSurvey(surveyId)}.record r
    JOIN public.user u ON r.owner_uuid = u.uuid
    WHERE
      r.date_created BETWEEN $1::DATE AND $2::DATE + INTERVAL '1 day'
    AND 
      r.cycle = $3     
    AND 
      r.preview = FALSE
    GROUP BY
      r.owner_uuid,
      u.name,
      u.email
    ORDER BY
      COUNT(r.uuid) DESC
  `,
    [from, to, cycle]
  )

// ============== UPDATE

export const updateRecordDateModified = async ({ surveyId, recordUuid, dateModified = new Date() }, client = db) =>
  client.one(
    `UPDATE ${getSchemaSurvey(surveyId)}.record 
     SET date_modified = $2
     WHERE uuid = $1
    RETURNING ${recordSelectFields}`,
    [recordUuid, Dates.formatForStorage(dateModified)]
  )

export const updateValidation = async (surveyId, recordUuid, validation, client = db) =>
  client.one(
    `UPDATE ${getSchemaSurvey(surveyId)}.record 
     SET validation = $1::jsonb
     WHERE uuid = $2
     RETURNING ${recordSelectFields}`,
    [validation, recordUuid]
  )

export const updateRecordStep = async (surveyId, recordUuid, step, client = db) =>
  client.none(
    `
      UPDATE ${getSchemaSurvey(surveyId)}.record
      SET step = $1
      WHERE uuid = $2`,
    [step, recordUuid]
  )

export const updateRecordOwner = async ({ surveyId, recordUuid, ownerUuid }, client = db) =>
  client.none(
    `
      UPDATE ${getSchemaSurvey(surveyId)}.record
      SET owner_uuid = $/ownerUuid/
      WHERE uuid = $/recordUuid/`,
    { recordUuid, ownerUuid }
  )

export const updateRecordMergedInto = async ({ surveyId, recordUuid, mergedIntoRecordUuid }, client = db) =>
  client.one(
    `
      UPDATE ${getSchemaSurvey(surveyId)}.record
      SET merged_into_record_uuid = $/mergedIntoRecordUuid/
      WHERE uuid = $/recordUuid/
      RETURNING ${recordSelectFields}`,
    { recordUuid, mergedIntoRecordUuid }
  )

export const updateRecordsOwner = async ({ surveyId, fromOwnerUuid, toOwnerUuid }, client = db) =>
  client.none(
    `
    UPDATE ${getSchemaSurvey(surveyId)}.record
    SET owner_uuid = $1
    WHERE owner_uuid = $2`,
    [toOwnerUuid, fromOwnerUuid]
  )

export const updateRecordValidationsFromValues = async (surveyId, recordUuidAndValidationValues, client = db) =>
  client.none(
    DbUtils.updateAllQuery(
      getSchemaSurvey(surveyId),
      'record',
      { name: 'uuid', cast: 'uuid' },
      [{ name: 'validation', cast: 'jsonb' }],
      recordUuidAndValidationValues
    )
  )

export const updateRecordDateModifiedFromValues = async (surveyId, recordUuidAndDateModifiedValues, client = db) =>
  client.none(
    DbUtils.updateAllQuery(
      getSchemaSurvey(surveyId),
      'record',
      { name: 'uuid', cast: 'uuid' },
      [{ name: 'date_modified', cast: 'timestamp' }],
      recordUuidAndDateModifiedValues
    )
  )

// ============== DELETE

export const deleteRecord = async (surveyId, recordUuid, client = db) =>
  client.query(
    `
    DELETE FROM ${getSchemaSurvey(surveyId)}.record
    WHERE uuid = $1
    `,
    [recordUuid]
  )

export const deleteRecordsPreview = async (surveyId, olderThan24Hours = false, client = db) =>
  client.map(
    `
    DELETE FROM ${getSchemaSurvey(surveyId)}.record
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
    DELETE FROM ${getSchemaSurvey(surveyId)}.record
    WHERE cycle IN ($1:csv)
    RETURNING uuid
  `,
    [cycles],
    R.prop('uuid')
  )

export const deleteRecordsBySurvey = async (surveyId, client = db) =>
  client.none(`DELETE FROM ${getSchemaSurvey(surveyId)}.record`)
