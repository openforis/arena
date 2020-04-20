import { TableCalculation } from '@common/model/db'

import { db } from '@server/db/db'

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
