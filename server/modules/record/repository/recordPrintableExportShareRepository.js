import { db } from '@server/db/db'

const TABLE_NAME = 'record_printable_export_share'

/**
 * Fetches a printable export share for an entity node.
 * @param {object} params - Query parameters.
 * @param {number} params.surveyId - Survey identifier.
 * @param {string} params.recordUuid - Record UUID.
 * @param {string} params.entityNodeUuid - Entity node UUID.
 * @param {object} client - Database client.
 * @returns {Promise<object|null>} The matching share, or null.
 */
export const fetchBySurveyRecordEntityNode = async ({ surveyId, recordUuid, entityNodeUuid }, client = db) =>
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
 * @param {object} params - Query parameters.
 * @param {number} params.surveyId - Survey identifier.
 * @param {string} params.recordUuid - Record UUID.
 * @param {string} params.entityNodeUuid - Entity node UUID.
 * @param {object} client - Transaction client.
 * @returns {Promise<object|null>} The locked share, or null.
 */
export const fetchBySurveyRecordEntityNodeForUpdate = async ({ surveyId, recordUuid, entityNodeUuid }, client = db) =>
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
 * @param {object} params - Query parameters.
 * @param {string} params.accessToken - Public access token.
 * @param {object} client - Database client.
 * @returns {Promise<object|null>} The matching share, or null.
 */
export const fetchByAccessToken = async ({ accessToken }, client = db) =>
  client.oneOrNone(
    `
    SELECT *
    FROM ${TABLE_NAME}
    WHERE access_token = $1`,
    [accessToken]
  )

/**
 * Inserts a printable export share.
 * @param {object} row - Share values.
 * @param {number} row.surveyId - Survey identifier.
 * @param {string} row.recordUuid - Record UUID.
 * @param {string} row.entityDefUuid - Entity definition UUID.
 * @param {string} row.entityNodeUuid - Entity node UUID.
 * @param {string} row.accessToken - Public access token.
 * @param {string} row.fileUuid - Stored PDF file UUID.
 * @param {string} row.contentType - Stored file content type.
 * @param {Date} row.expiresAt - Share expiry date.
 * @param {object} client - Database client.
 * @returns {Promise<object>} The inserted share.
 */
export const insert = async (
  { surveyId, recordUuid, entityDefUuid, entityNodeUuid, accessToken, fileUuid, contentType, expiresAt },
  client = db
) =>
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
 * @param {object} params - Updated share values.
 * @param {string} params.uuid - Share UUID.
 * @param {string} params.fileUuid - Stored PDF file UUID.
 * @param {Date} params.expiresAt - New expiry date.
 * @param {Date} params.dateModified - Modification date.
 * @param {object} client - Database client.
 * @returns {Promise<object>} The updated share.
 */
export const updateOnReexport = async ({ uuid, fileUuid, expiresAt, dateModified }, client = db) =>
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
 * @param {object} params - Update parameters.
 * @param {string} params.uuid - Share UUID.
 * @param {object} client - Database client.
 * @returns {Promise<void>} A promise resolved after the update.
 */
export const incrementDownloadCount = async ({ uuid }, client = db) =>
  client.none(
    `
    UPDATE ${TABLE_NAME}
    SET download_count = download_count + 1
    WHERE uuid = $1`,
    [uuid]
  )

/**
 * Deletes all printable export shares for a record.
 * @param {object} params - Delete parameters.
 * @param {number} params.surveyId - Survey identifier.
 * @param {string} params.recordUuid - Record UUID.
 * @param {object} client - Database client.
 * @returns {Promise<Array<object>>} Deleted file UUID rows.
 */
export const deleteByRecordUuid = async ({ surveyId, recordUuid }, client = db) =>
  client.manyOrNone(
    `
    DELETE FROM ${TABLE_NAME}
    WHERE survey_id = $1
      AND record_uuid = $2
    RETURNING file_uuid`,
    [surveyId, recordUuid]
  )
