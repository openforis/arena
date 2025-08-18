import OlapAreaView from '@common/model/db/tables/olapData/olapAreaView'
import TableOlapData from '@common/model/db/tables/olapData/table'

import { db } from '@server/db/db'

export const createOlapAreaView = async ({ survey, cycle, baseUnitDef, entityDef }, client = db) => {
  const view = new OlapAreaView({ survey, cycle, baseUnitDef, entityDef })
  const table = new TableOlapData({ survey, cycle, baseUnitDef, entityDef })

  return client.query(
    `CREATE OR REPLACE VIEW
        ${view.nameQualified}
      AS (
        SELECT DISTINCT (${table.baseUnitUuidColumnName}) AS ${view.baseUnitUuidColumnName},
          ${table.expFactorColumnName} AS ${view.areaColumnName}
        FROM
          ${table.nameQualified}
      )`
  )
}
