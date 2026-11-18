import type { Survey as ArenaSurvey, NodeDefEntity } from '@openforis/arena-core'
import TableOlapData from '@common/model/db/tables/olapData/table'

import { db, DbClient } from '@server/db/db'

export const createOlapDataTable = (
  {
    survey,
    cycle,
    baseUnitDef,
    entityDef,
  }: { survey: ArenaSurvey; cycle: string; baseUnitDef: NodeDefEntity; entityDef: NodeDefEntity },
  client: DbClient = db
) => {
  const table = new TableOlapData({ survey, cycle, baseUnitDef, entityDef })

  return client.query(
    `CREATE TABLE IF NOT EXISTS
        ${table.nameQualified}
      (
        ${table.columnNamesAndTypes.join(', ')}
        , PRIMARY KEY (${TableOlapData.baseColumnSet.id})
      )`
  )
}
