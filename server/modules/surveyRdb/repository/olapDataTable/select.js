import OlapAreaView from '@common/model/db/tables/olapData/olapAreaView'
import TableOlapData from '@common/model/db/tables/olapData/table'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { db } from '@server/db/db'

export const selectAreaFromOlapDataTable = async (
  { survey, cycle, baseUnitDef, entityDef, dimensionsDefs, measuresDefs },
  client = db
) => {
  const table = new TableOlapData({ survey, cycle, baseUnitDef, entityDef })
  const dimensionColumnNames = dimensionsDefs.map((dimensionDef) => table.getColumnNameByAttributeDef(dimensionDef))
  const dimensionColumnNamesJoint = dimensionColumnNames.join(', ')
  const measuresColumnNames = measuresDefs.map((measureDef) => table.getColumnNameByAttributeDef(measureDef))
  const measuresSelector = measuresColumnNames.map(
    (measureColumnName) => `SUM(${measureColumnName}) AS ${measureColumnName}`
  )
  const measuresSelectorHa = measuresColumnNames.map(
    (measureColumnName) => `SUM(${measureColumnName})/area AS ${measureColumnName}_ha`
  )

  client.query(`WITH area_table AS (
    SELECT ${dimensionColumnNamesJoint}, SUM(${table.expFactorColumnName}) AS area FROM (
      SELECT DISTINCT(${table.baseUnitUuidColumnName}), ${table.expFactorColumnName}, ${dimensionColumnNamesJoint}
        FROM ${table.nameQualified}
      ) GROUP BY ${dimensionColumnNamesJoint}
  )`)
}
