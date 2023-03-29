import { DB } from '@openforis/arena-server'

import { TableChain } from '../../../../../common/model/db'

export const insertMany = async ({ surveyId, chains = [] }, client = DB) =>
  client.tx(async (tx) => {
    const tableChain = new TableChain(surveyId)

    const insertColumns = [
      TableChain.columnSet.uuid,
      TableChain.columnSet.props,
      TableChain.columnSet.validation,
      TableChain.columnSet.scriptCommon,
      TableChain.columnSet.scriptEnd,
    ]
    await tx.batch([
      chains.map(({ uuid, props, validation, script_common: scriptCommon, script_end: scriptEnd }) =>
        tx.none(
          `
    INSERT INTO ${tableChain.nameQualified} 
        (${insertColumns.join(', ')})
    VALUES ($1, $2::jsonb, $3::jsonb, $4, $5)`,
          [uuid, props, validation, scriptCommon, scriptEnd]
        )
      ),
    ])
  })
