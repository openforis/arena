import { BaseProtocol, TableNodeDef } from '@openforis/arena-server'

import * as DB from '../../../../db'

import * as ObjectUtils from '../../../../../core/objectUtils'

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
 * Fetches all virtual entities.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {number} [params.offset=0] - The select query offset.
 * @param {number} [params.limit=null] - The select query limit.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const fetchVirtualEntities = async (params, client = DB.client) => {
  const { surveyId, offset = 0, limit = null } = params

  const tableNodeDef = new TableNodeDef(surveyId)

  return client.map(
    ` 
    select
  _nd.*,
  _nd.props || _nd.props_draft as props,
  _ndp.props || _ndp.props_draft as source_props
  from
  ${tableNodeDef.nameQualified} as _nd
  Left join ${tableNodeDef.nameQualified} as _ndp
  on _ndp.uuid = _nd.parent_uuid
  where _nd.virtual = TRUE and _nd.deleted = FALSE
  LIMIT ${limit || 'ALL'}
  OFFSET ${offset}`,
    [],
    transformCallback
  )
}

/**
 * Count virtual entities.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<number>} - The result promise.
 */
export const countVirtualEntities = async (params, client = DB.client) => {
  const { surveyId } = params
  const tableNodeDef = new TableNodeDef(surveyId)
  return client.one(`select count(*) from ${tableNodeDef.nameAliased} where virtual = TRUE and deleted = FALSE`)
}
