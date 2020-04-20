import * as pgPromise from 'pg-promise'

import { TableCalculation } from '../../../../../common/model/db'

import { db } from '../../../../db/db'

/**
 * Updates the script of the given processing step calculation.
 *
 * @param {!string} surveyId - The survey id.
 * @param {!string} calculationUuid - The processing step calculation uuid.
 * @param {!string} script - The script content.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - The result promise.
 */
export const updateCalculationScript = async (surveyId, calculationUuid, script, client = db) => {
  const table = new TableCalculation(surveyId)

  return client.none(
    `
    UPDATE ${table.schema}.${table.name}
    SET ${TableCalculation.columnSet.script} = $2
    WHERE ${TableCalculation.columnSet.uuid} = $1
    `,
    [calculationUuid, script]
  )
}
