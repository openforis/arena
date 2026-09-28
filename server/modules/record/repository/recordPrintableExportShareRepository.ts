import { db } from '@server/db/db'

const TABLE_NAME = 'record_printable_export_share'

type DbClient = typeof db

export type RecordPrintableExportShareRow = {
  uuid: string
  survey_id: number
  record_uuid: string
  entity_def_uuid: string
  entity_node_uuid: string
  access_token: string
  file_uuid: string
  content_type: string
  download_count: number
  date_created: Date | string
  date_modified: Date | string
  expires_at: Date | string
}

export type DeletedShareFileRow = {
  file_uuid: string | null
}

/**
 * Fetches a printable export share for an entity node.
 */
export const fetchBySurveyRecordEntityNode = async (
  {
    surveyId,
    recordUuid,
    entityNodeUuid,
  }: {
    surveyId: number
    recordUuid: string
    entityNodeUuid: string
  },
  client: DbClient = db
): Promise<RecordPrintableExportShareRow | null> =>
  client.oneOrNone(
    `
    SELECT *
    FROM ${TABLE_NAME}
    WHERE survey_id = $1
      AND record_uuid = $2
      AND entity_node_uuid = $3`,
    [surveyId, recordUuid, entityNodeUuid]
  )

/**
 * Fetches and locks a printable export share for an entity node.
 */
export const fetchBySurveyRecordEntityNodeForUpdate = async (
  {
    surveyId,
    recordUuid,
    entityNodeUuid,
  }: {
    surveyId: number
    recordUuid: string
    entityNodeUuid: string
  },
  client: DbClient = db
): Promise<RecordPrintableExportShareRow | null> =>
  client.oneOrNone(
    `
    SELECT *
    FROM ${TABLE_NAME}
    WHERE survey_id = $1
      AND record_uuid = $2
      AND entity_node_uuid = $3
    FOR UPDATE`,
    [surveyId, recordUuid, entityNodeUuid]
  )

/**
 * Fetches a printable export share by access token.
 */
export const fetchByAccessToken = async (
  { accessToken }: { accessToken: string },
  client: DbClient = db
): Promise<RecordPrintableExportShareRow | null> =>
  client.oneOrNone(
    `
    SELECT *
    FROM ${TABLE_NAME}
    WHERE access_token = $1`,
    [accessToken]
  )

/**
 * Inserts a printable export share.
 */
export const insert = async (
  {
    surveyId,
    recordUuid,
    entityDefUuid,
    entityNodeUuid,
    accessToken,
    fileUuid,
    contentType,
    expiresAt,
  }: {
    surveyId: number
    recordUuid: string
    entityDefUuid: string
    entityNodeUuid: string
    accessToken: string
    fileUuid: string
    contentType: string
    expiresAt: Date
  },
  client: DbClient = db
): Promise<RecordPrintableExportShareRow> =>
  client.one(
    `
    INSERT INTO ${TABLE_NAME}
      (survey_id, record_uuid, entity_def_uuid, entity_node_uuid, access_token, file_uuid, content_type, expires_at)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [surveyId, recordUuid, entityDefUuid, entityNodeUuid, accessToken, fileUuid, contentType, expiresAt]
  )

/**
 * Refreshes a printable export share after re-export.
 */
export const updateOnReexport = async (
  {
    uuid,
    fileUuid,
    expiresAt,
    dateModified,
  }: {
    uuid: string
    fileUuid: string
    expiresAt: Date
    dateModified: Date
  },
  client: DbClient = db
): Promise<RecordPrintableExportShareRow> =>
  client.one(
    `
    UPDATE ${TABLE_NAME}
    SET file_uuid = $2,
        expires_at = $3,
        date_modified = $4
    WHERE uuid = $1
    RETURNING *`,
    [uuid, fileUuid, expiresAt, dateModified]
  )

/**
 * Increments the download count of a printable export share.
 */
export const incrementDownloadCount = async ({ uuid }: { uuid: string }, client: DbClient = db): Promise<null> =>
  client.none(
    `
    UPDATE ${TABLE_NAME}
    SET download_count = download_count + 1
    WHERE uuid = $1`,
    [uuid]
  )

/**
 * Deletes all printable export shares for a record.
 */
export const deleteByRecordUuid = async (
  { surveyId, recordUuid }: { surveyId: number; recordUuid: string },
  client: DbClient = db
): Promise<DeletedShareFileRow[]> => deleteByRecordUuids({ surveyId, recordUuids: [recordUuid] }, client)

/**
 * Deletes all printable export shares for multiple records.
 */
export const deleteByRecordUuids = async (
  { surveyId, recordUuids }: { surveyId: number; recordUuids: string[] },
  client: DbClient = db
): Promise<DeletedShareFileRow[]> => {
  if (!recordUuids?.length) {
    return []
  }
  return client.manyOrNone(
    `
    DELETE FROM ${TABLE_NAME}
    WHERE survey_id = $1
      AND record_uuid = ANY($2::uuid[])
    RETURNING file_uuid`,
    [surveyId, recordUuids]
  )
}
