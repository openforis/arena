import TableOlapData from '@common/model/db/tables/olapData/table'

import { db } from '@server/db/db'

export const clearOlapData = async ({ survey, cycle, entityDef, baseUnitDef }, client = db) => {
  const table = new TableOlapData({ survey, cycle, baseUnitDef, entityDef })
  return client.query(`DELETE FROM ${table.nameQualified}`)
}
