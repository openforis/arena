import TableOlapData from '@common/model/db/tables/olapData/table'

import { db } from '@server/db/db'

export const createOlapDataTable = async ({ survey, cycle, baseUnitDef, entityDef }, client = db) => {
  const table = new TableOlapData({ survey, cycle, baseUnitDef, entityDef })

  return client.query(
    `CREATE TABLE
        ${table.nameQualified}
      (
        ${table.columnNamesAndTypes.join(', ')}
        , PRIMARY KEY (${TableOlapData.baseColumnSet.id})
      )`
  )
}
