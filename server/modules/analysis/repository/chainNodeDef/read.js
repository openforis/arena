import { BaseProtocol, Schemata } from '@openforis/arena-server'

import * as DB from '../../../../db'
import * as ObjectUtils from '../../../../../core/objectUtils'

import { TableChainNodeDef } from '../../../../../common/model/db'

// TODO Maybe we should move to some common place
export const transformCallback = (row) => {
  if (!row) return {}
  /* eslint-disable-next-line camelcase */
  const { date_created, date_modified, ...rest } = DB.mergeProps()(row)

  return {
    /* eslint-disable-next-line camelcase */
    ...(date_created ? { [ObjectUtils.keys.dateCreated]: date_created } : {}),
    /* eslint-disable-next-line camelcase */
    ...(date_modified ? { [ObjectUtils.keys.dateModified]: date_modified } : {}),
    ...rest,
  }
}

/**
 * Fetches a single processing chain by the given survey id and chainUuid.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.chainNodeDefUuid - The processing chain uuid.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<ChainNodeDef|null>} - The result promise.
 */
export const fetchChainNodeDef = async (params, client = DB.client) => {
  const { surveyId, chainNodeDefUuid, includeScript = false } = params
  const schema = Schemata.getSchemaSurvey(surveyId)
  const chainNodeDefColumns = TableChainNodeDef.columnSet

  return client.oneOrNone(
    ` SELECT
      ${Object.values(chainNodeDefColumns)
        .filter((columnName) => includeScript || columnName !== chainNodeDefColumns.script)
        .map((columnName) => `_cnd.${columnName}`)
        .join(',')}
      FROM
          ${schema}.${TableChainNodeDef.tableName} AS _cnd
      WHERE _cnd.uuid = $1
      ORDER BY _cnd.index`,
    [chainNodeDefUuid],
    transformCallback
  )
}

/**
 * Fetches chainNodeDefs by the given survey id and chainUuid.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<ChainNodeDef|null>} - The result promise.
 */
export const fetchChainNodeDefsByChainUuid = async (params, client = DB.client) => {
  const { surveyId, chainUuid, includeScript = false } = params
  const schema = Schemata.getSchemaSurvey(surveyId)
  const chainNodeDefColumns = TableChainNodeDef.columnSet

  return client.map(
    ` SELECT
        ${Object.values(chainNodeDefColumns)
          .filter((columnName) => includeScript || columnName !== chainNodeDefColumns.script)
          .map((columnName) => `_cnd.${columnName}`)
          .join(',')}
        FROM
            ${schema}.${TableChainNodeDef.tableName} AS _cnd
        WHERE _cnd.chain_uuid = $1
        ORDER BY _cnd.index`,
    [chainUuid],
    transformCallback
  )
}
