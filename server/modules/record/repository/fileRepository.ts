import { Readable } from 'node:stream'

import { Schemata } from '@common/model/db'
import * as SurveyFile from '@core/survey/surveyFile'
import { db, DbClient } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

const SUMMARY_FIELDS = ['id', 'uuid', 'props', 'date_created']
const SUMMARY_FIELDS_COMMA_SEPARATED = SUMMARY_FIELDS.join(', ')

const NOT_DELETED_CONDITION = `COALESCE(props ->> '${SurveyFile.propKeys.deleted}', 'false') <> 'true'`

// ============== CREATE

export const insertFile = (surveyId: number, file: SurveyFile.SurveyFile, client: DbClient = db) => {
  const { uuid, props, content } = file

  return client.one(
    `
    INSERT INTO ${Schemata.getSchemaSurvey(surveyId)}.file (uuid, props, content)
    VALUES ($1, $2, $3)
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [uuid, props, content]
  )
}

// ============== READ

export const fetchFileSummariesBySurveyId = (surveyId: number, client: DbClient = db) =>
  client.manyOrNone(
    `
    SELECT ${SUMMARY_FIELDS_COMMA_SEPARATED}
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE ${NOT_DELETED_CONDITION}`
  )

export const fetchFileSummariesByType = (
  { surveyId, type }: { surveyId: number; type: string },
  client: DbClient = db
) =>
  client.manyOrNone(
    `
    SELECT ${SUMMARY_FIELDS_COMMA_SEPARATED}
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE ${NOT_DELETED_CONDITION} 
      AND props ->> '${SurveyFile.propKeys.type}' = $1`,
    [type]
  )

export const fetchFilesByRecordUuids = (
  { surveyId, recordUuids }: { surveyId: number; recordUuids: string[] },
  client: DbClient = db
) =>
  client.map(
    `
    SELECT uuid AS "fileUuid", props ->> '${SurveyFile.propKeys.recordUuid}' AS "recordUuid"
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE props ->> '${SurveyFile.propKeys.recordUuid}' IN ($1:csv)`,
    [recordUuids],
    (row) => row
  )

// Like fetchFilesByRecordUuids, but excludes soft-deleted files: used to tell a mobile client
// which files it can skip re-uploading (a deleted file must still be re-sent if referenced again).
export const fetchNonDeletedFileUuidsByRecordUuids = (
  { surveyId, recordUuids }: { surveyId: number; recordUuids: string[] },
  client: DbClient = db
) => {
  if (recordUuids.length === 0) return []
  return client.map(
    `
    SELECT uuid AS "fileUuid", props ->> '${SurveyFile.propKeys.recordUuid}' AS "recordUuid"
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE ${NOT_DELETED_CONDITION}
      AND props ->> '${SurveyFile.propKeys.recordUuid}' IN ($1:csv)`,
    [recordUuids],
    (row) => row
  )
}

export const fetchFileUuidsBySurveyId = ({ surveyId }: { surveyId: number }, client: DbClient = db) =>
  client.map(
    `
    SELECT uuid
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file`,
    [],
    (row) => row.uuid
  )

export const fetchFileSummariesByUuids = (
  { surveyId, fileUuids }: { surveyId: number; fileUuids: string[] },
  client: DbClient = db
) => {
  if (fileUuids.length === 0) return []
  return client.manyOrNone(
    `SELECT ${SUMMARY_FIELDS_COMMA_SEPARATED}
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE uuid IN ($1:csv)`,
    [fileUuids]
  )
}

export const fetchExistingNonDeletedFileUuids = (
  { surveyId, fileUuids }: { surveyId: number; fileUuids: string[] },
  client: DbClient = db
) => {
  if (fileUuids.length === 0) return []
  return client.map(
    `SELECT uuid
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE uuid IN ($1:csv)
      AND ${NOT_DELETED_CONDITION}`,
    [fileUuids],
    (row) => row.uuid
  )
}

export const fetchFileUuidsOfFilesWithContent = ({ surveyId }: { surveyId: number }, client: DbClient = db) =>
  client.map(
    `
    SELECT uuid
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE content IS NOT NULL`,
    [],
    (row) => row.uuid
  )

export const fetchFileAndContentByUuid = (surveyId: number, uuid: string, client: DbClient = db) =>
  client.one(
    `
    SELECT * FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

export const fetchFileSummaryByUuid = (surveyId: number, uuid: string, client: DbClient = db) =>
  client.oneOrNone(
    `
    SELECT ${SUMMARY_FIELDS_COMMA_SEPARATED} 
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

export const fetchFileContentAsStream = async (
  { surveyId, fileUuid }: { surveyId: number; fileUuid: string },
  client: DbClient = db
) => {
  const row = await client.oneOrNone(
    `
    SELECT content
    FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE uuid = $1`,
    [fileUuid]
  )
  const contentBuffer = row?.content
  return contentBuffer ? Readable.from(contentBuffer) : null
}

export const fetchCountAndTotalFilesSize = async (
  { surveyId, recordUuid = null }: { surveyId: number; recordUuid?: string },
  client: DbClient = db
) => {
  const schema = Schemata.getSchemaSurvey(surveyId)
  const whereConditions = [NOT_DELETED_CONDITION]
  if (recordUuid) {
    whereConditions.push(`(props ->> '${SurveyFile.propKeys.recordUuid}')::uuid = $/recordUuid/`)
  }
  const whereClause = DbUtils.getWhereClause(...whereConditions)
  const { count, total } = await client.one(
    `SELECT COUNT(*), SUM(COALESCE((props ->> '${SurveyFile.propKeys.size}')::INTEGER, 0))
    FROM ${schema}.file
    ${whereClause}`,
    { recordUuid },
    (row) => ({ count: Number(row.count), total: Number(row.sum) })
  )
  return { count, total }
}

/**
 * Fetches count and total size of the (not deleted) files of the specified records.
 * @param {!object} params - The parameters.
 * @param {!number} params.surveyId - The survey id.
 * @param {!string[]} params.recordUuids - The uuids of the records.
 * @param {object} [client] - The database client.
 * @returns {Promise<object>} - Count and total size ({count, total}) indexed by record uuid (only records with files).
 */
export const fetchCountAndTotalFilesSizeByRecordUuids = async (
  { surveyId, recordUuids }: { surveyId: number; recordUuids: string[] },
  client: DbClient = db
) => {
  if (recordUuids.length === 0) return {}
  const schema = Schemata.getSchemaSurvey(surveyId)
  const recordUuidCol = `(props ->> '${SurveyFile.propKeys.recordUuid}')::uuid`
  const rows = await client.any(
    `SELECT ${recordUuidCol} AS record_uuid, COUNT(*), SUM(COALESCE((props ->> '${SurveyFile.propKeys.size}')::INTEGER, 0))
    FROM ${schema}.file
    WHERE ${NOT_DELETED_CONDITION} AND ${recordUuidCol} IN ($/recordUuids:csv/)
    GROUP BY ${recordUuidCol}`,
    { recordUuids }
  )
  return Object.fromEntries(rows.map((row) => [row.record_uuid, { count: Number(row.count), total: Number(row.sum) }]))
}

// ============== UPDATE
export const markFileAsDeleted = (surveyId: number, uuid: string, client: DbClient = db) =>
  client.oneOrNone(
    `
    UPDATE ${Schemata.getSchemaSurvey(surveyId)}.file
    SET props = jsonb_set(props, '{${SurveyFile.propKeys.deleted}}', 'true')
    WHERE uuid = $1
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [uuid]
  )

export const markFilesAsDeleted = (surveyId: number, uuids: string[], client: DbClient = db) =>
  uuids.length === 0
    ? []
    : client.manyOrNone(
        `
    UPDATE ${Schemata.getSchemaSurvey(surveyId)}.file
    SET props = jsonb_set(props, '{${SurveyFile.propKeys.deleted}}', 'true')
    WHERE uuid IN ($1:csv)
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
        [uuids]
      )

export const markRecordFilesAsDeleted = (surveyId: number, recordUuid: string, client: DbClient = db) =>
  client.manyOrNone(
    `
    UPDATE ${Schemata.getSchemaSurvey(surveyId)}.file
    SET props = jsonb_set(props, '{${SurveyFile.propKeys.deleted}}', 'true')
    WHERE props ->> '${SurveyFile.propKeys.recordUuid}' = $1 
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [recordUuid]
  )

export const updateFileProps = (
  surveyId: number,
  fileUuid: string,
  props: Record<string, any>,
  client: DbClient = db
) =>
  client.one(
    `
    UPDATE ${Schemata.getSchemaSurvey(surveyId)}.file
    SET props = $2
    WHERE uuid = $1
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [fileUuid, props]
  )

export const clearFileTemporaryFlag = (surveyId: number, fileUuid: string, client: DbClient = db) =>
  client.one(
    `
    UPDATE ${Schemata.getSchemaSurvey(surveyId)}.file
    SET props = props - '${SurveyFile.propKeys.temporary}'
    WHERE uuid = $1
    RETURNING ${SUMMARY_FIELDS_COMMA_SEPARATED}`,
    [fileUuid]
  )

export const clearAllSurveyFilesContent = ({ surveyId }: { surveyId: number }, client: DbClient = db) =>
  client.none(
    `
      UPDATE ${Schemata.getSchemaSurvey(surveyId)}.file
      SET content = NULL
      WHERE content IS NOT NULL
      `
  )

export const cleanupFileProps = (
  { surveyId, fileSummary }: { surveyId: number; fileSummary: SurveyFile.SurveyFile },
  client: DbClient = db
) => {
  const fileUuid = SurveyFile.getUuid(fileSummary)
  const fileSummaryUpdated = SurveyFile.cleanupInvalidProps(fileSummary)
  return updateFileProps(surveyId, fileUuid, SurveyFile.getProps(fileSummaryUpdated), client)
}

export const cleanupSurveyFilesProps = ({ surveyId }: { surveyId: number }, client: DbClient = db) =>
  client.tx(async (t) => {
    const fileSummariesToClean = await t.manyOrNone(
      `SELECT ${SUMMARY_FIELDS_COMMA_SEPARATED}
      FROM ${Schemata.getSchemaSurvey(surveyId)}.file
      WHERE ${NOT_DELETED_CONDITION} 
        AND (props ->> '${SurveyFile.invalidPropKeys.fileName}') IS NOT NULL `
    )
    const count = fileSummariesToClean?.length ?? 0
    if (count > 0) {
      await DbUtils.runQueries(
        t,
        fileSummariesToClean.map((fileSummary) => () => cleanupFileProps({ surveyId, fileSummary }, t))
      )
    }
    return count
  })

// ============== DELETE
export const deleteFileByUuid = (surveyId: number, uuid: string, client: DbClient = db) =>
  client.query(
    `
    DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE uuid = $1`,
    [uuid]
  )

export const deleteFilesByUuids = (surveyId: number, uuids: string[], client: DbClient = db) =>
  client.query(
    `
      DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.file
      WHERE uuid IN ($1:csv)`,
    [uuids]
  )

export const deleteFilesByRecordUuids = (surveyId: number, uuids: string[], client: DbClient = db) =>
  client.query(
    `
    DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE props ->> '${SurveyFile.propKeys.recordUuid}' IN ($1:csv)`,
    [uuids]
  )

export const deleteTemporaryFiles = (surveyId: number, client: DbClient = db) =>
  client.query(
    `
    DELETE FROM ${Schemata.getSchemaSurvey(surveyId)}.file
    WHERE props ->> '${SurveyFile.propKeys.temporary}' = 'true'`
  )
