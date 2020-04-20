import * as pgPromise from 'pg-promise'

import { TableChain } from '../../../../../common/model/db'

import { db } from '../../../../db/db'

/**
 * Updates the common script of the given processing chain.
 *
 * @param {!string} surveyId - The survey id.
 * @param {!string} chainUuid - The processing chain uuid.
 * @param {!string} script - The script content.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const updateChainScriptCommon = (surveyId, chainUuid, script, client = db) => {
  const table = new TableChain(surveyId)

  return client.none(
    `
    UPDATE ${table.schema}.${table.name}
    SET ${TableChain.columnSet.scriptCommon} = $2
    WHERE ${TableChain.columnSet.uuid} = $1
    `,
    [chainUuid, script]
  )
}
